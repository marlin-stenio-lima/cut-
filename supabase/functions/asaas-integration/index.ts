import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ASAAS_API_URL = "https://www.asaas.com/api/v3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  const method = req.method
  console.log(`[Asaas Integration] ${method} request received at ${new Date().toISOString()}`)
  
  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY")
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRole || !ASAAS_API_KEY) {
      throw new Error("Configuração do servidor incompleta (Variáveis de ambiente)")
    }

    const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRole)
    const body = await req.json()

    // --- 1. WEBHOOK HANDLER (No Auth Required) ---
    if (body.event) {
        console.log(`[Asaas Webhook] Event: ${body.event}, Payment: ${body.payment?.id}`)
        
        const event = body.event
        const payment = body.payment
        
        if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH'].includes(event)) {
            const userId = payment.externalReference
            const paymentId = payment.id
            const amount = payment.value

            if (!userId) {
                console.error("[Asaas Webhook] Error: Missing externalReference (userId)")
                return new Response(JSON.stringify({ received: true, error: "Missing userId" }), { status: 200 })
            }

            // Sync balance logic
            const { data: existingTx } = await serviceRoleClient
                .from('wallet_transactions')
                .select('*')
                .eq('asaas_id', paymentId)
                .eq('status', 'SUCCESS')
                .maybeSingle()

            if (!existingTx) {
                console.log(`[Asaas Webhook] Processing payment of R$ ${amount} for user ${userId}`)
                
                // 1. Update status
                await serviceRoleClient
                    .from('wallet_transactions')
                    .update({ status: 'SUCCESS' })
                    .eq('asaas_id', paymentId)

                // 2. Increment balance
                const { data: profile } = await serviceRoleClient
                    .from('profiles')
                    .select('balance')
                    .eq('id', userId)
                    .single()
                
                const newBalance = Number(profile?.balance || 0) + Number(amount)
                
                await serviceRoleClient
                    .from('profiles')
                    .update({ balance: newBalance })
                    .eq('id', userId)

                console.log(`[Asaas Webhook] Balance updated successfully for user ${userId}`)
            }

            return new Response(JSON.stringify({ received: true }), { 
                headers: { 'Content-Type': 'application/json' },
                status: 200 
            })
        }

        // Generic received for other events
        return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    // --- 2. APP ACTIONS (Auth Required) ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error("Não autorizado: Cabeçalho de autenticação ausente")
    }

    const { data: { user }, error: authError } = await (createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })).auth.getUser()
    
    if (authError || !user) throw new Error("Não autorizado: Sessão inválida")
    
    const userId = user.id
    console.log(`[Asaas Integration] Action: ${body.action}, User: ${userId}`)

    // --- SHARED UTILS ---
    const getProfile = async (uid: string) => {
      const { data, error } = await serviceRoleClient.from('profiles').select('*').eq('id', uid).single()
      if (error || !data) throw new Error("Perfil não encontrado")
      return data
    }

    // --- ACTIONS ---
    if (body.action === 'create-payment') {
      const profile = await getProfile(userId)
      let asaasCustomerId = profile.asaas_customer_id
      const customerName = body.name || profile.full_name || 'Cliente Cut House'
      const customerEmail = body.email || user.email || `${userId}@cuthouse.com.br`
      
      if (asaasCustomerId) {
        const checkRes = await fetch(`${ASAAS_API_URL}/customers/${asaasCustomerId}`, {
          method: 'GET',
          headers: { 'access_token': ASAAS_API_KEY }
        })
        if (checkRes.status === 404) asaasCustomerId = null
      }
      
      if (!asaasCustomerId) {
        const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
          body: JSON.stringify({ name: customerName, email: customerEmail, cpfCnpj: body.cpf, mobilePhone: body.phone, externalReference: userId })
        })
        const createData = await createRes.json()
        if (createData.errors) throw new Error(`Erro Asaas (Cliente): ${createData.errors[0].description}`)
        asaasCustomerId = createData.id
        await serviceRoleClient.from('profiles').update({ asaas_customer_id: asaasCustomerId, full_name: customerName }).eq('id', userId)
      }

      // Create charge
      const paymentPayload: any = {
        customer: asaasCustomerId,
        billingType: body.billingType || 'PIX',
        value: body.amount,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: body.description || 'Pagamento Cut House',
        externalReference: userId,
      }

      if (body.billingType === 'CREDIT_CARD') {
        paymentPayload.creditCard = body.creditCard
        paymentPayload.creditCardHolderInfo = body.creditCardHolderInfo
        paymentPayload.remoteIp = body.remoteIp || '127.0.0.1'
      }

      const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
        body: JSON.stringify(paymentPayload),
      })

      const paymentData = await paymentResponse.json()
      if (paymentData.errors) throw new Error(`Erro Asaas (Pagamento): ${paymentData.errors[0].description}`)

      const paymentId = paymentData.id
      const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(paymentData.status)

      if (paymentData.billingType === 'PIX') {
        const pixRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        })
        const pixData = await pixRes.json()
        return new Response(JSON.stringify({ payment: paymentData, pix: pixData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }

      return new Response(JSON.stringify({ status: paymentData.status, isPaid, payment: paymentData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    throw new Error(`Ação inválida: ${body.action}`)

  } catch (error) {
    console.error("[Asaas Integration] Fatal Error:", error.message)
    return new Response(JSON.stringify({ error: true, message: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200, 
    })
  }
})
