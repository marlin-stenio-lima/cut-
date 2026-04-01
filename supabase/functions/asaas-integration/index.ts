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
    console.log(`[Asaas Integration] Environment check: ASAAS_API_KEY present: ${!!ASAAS_API_KEY}`)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error("[Asaas Integration] Error: No Authorization header")
      throw new Error("Não autorizado: Cabeçalho de autenticação ausente")
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRole || !ASAAS_API_KEY) {
      console.error("[Asaas Integration] Error: Missing environment variables")
      throw new Error("Configuração do servidor incompleta (Variáveis de ambiente)")
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      console.error("[Asaas Integration] Auth Error:", authError)
      throw new Error("Não autorizado: Sessão inválida")
    }

    const userId = user.id
    const body = await req.json()
    console.log(`[Asaas Integration] Action: ${body.action}, User: ${userId}`)

    // --- SHARED UTILS ---
    const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRole)
    
    const getProfile = async (uid: string) => {
      const { data, error } = await serviceRoleClient.from('profiles').select('*').eq('id', uid).single()
      if (error || !data) throw new Error("Perfil não encontrado")
      return data
    }

    const checkAdmin = async (uid: string) => {
      const p = await getProfile(uid)
      if (p.role !== 'admin') throw new Error("Acesso negado: Somente administradores")
      return p
    }

    // --- ACTIONS ---

    if (body.action === 'create-payment') {
      const profile = await getProfile(userId)
      let asaasCustomerId = profile.asaas_customer_id

      // Create/Update customer
      const customerName = body.name || profile.full_name || 'Cliente Cut House'
      const customerEmail = body.email || user.email || `${userId}@cuthouse.com.br`
      
      if (!asaasCustomerId) {
        const res = await fetch(`${ASAAS_API_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
          body: JSON.stringify({ name: customerName, email: customerEmail, cpfCnpj: body.cpf, mobilePhone: body.phone, externalReference: userId })
        })
        const data = await res.json()
        if (data.errors) throw new Error(`Erro Asaas (Cliente): ${data.errors[0].description}`)
        asaasCustomerId = data.id
        await serviceRoleClient.from('profiles').update({ asaas_customer_id: asaasCustomerId, full_name: customerName }).eq('id', userId)
      } else {
         // Update existing
         await fetch(`${ASAAS_API_URL}/customers/${asaasCustomerId}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
           body: JSON.stringify({ name: customerName, email: customerEmail, cpfCnpj: body.cpf, mobilePhone: body.phone })
         })
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
        const pixResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        })
        const pixData = await pixResponse.json()
        
        return new Response(
          JSON.stringify({ payment: paymentData, pix: pixData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }

      // If payment is confirmed, update balance (Simulation/Direct)
      if (isPaid) {
          console.log(`[Asaas Integration] Updating balance for user ${userId} due to payment ${paymentId}`)
          
          const { data: existingTx } = await serviceRoleClient
            .from('wallet_transactions')
            .select('*')
            .eq('asaas_id', paymentId)
            .eq('status', 'SUCCESS')
            .maybeSingle()

          if (!existingTx) {
            await serviceRoleClient
              .from('wallet_transactions')
              .update({ status: 'SUCCESS' })
              .eq('asaas_id', paymentId)

            const { data: profile } = await serviceRoleClient
              .from('profiles')
              .select('balance')
              .eq('id', userId)
              .single()
            
            const newBalance = Number(profile?.balance || 0) + Number(paymentData.value)
            
            await serviceRoleClient
              .from('profiles')
              .update({ balance: newBalance })
              .eq('id', userId)
          }
      }

      return new Response(
        JSON.stringify({ 
          status: paymentData.status,
          isPaid,
          payment: paymentData
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
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
