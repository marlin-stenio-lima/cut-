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
    const ASAAS_WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN")

    if (!supabaseUrl || !supabaseServiceRole || !ASAAS_API_KEY) {
      throw new Error("Configuração do servidor incompleta (Variáveis de ambiente)")
    }

    const serviceRoleClient = createClient(supabaseUrl, supabaseServiceRole)
    
    // --- ROBUST BODY PARSING ---
    const text = await req.text()
    let body: any
    
    try {
        body = JSON.parse(text)
    } catch (e) {
        if (text.startsWith('data=') || text.includes('&data=')) {
            // Handle URL encoded with data parameter
            const params = new URLSearchParams(text)
            const dataStr = params.get('data')
            if (!dataStr) throw new Error("Webhook body (urlencoded) missing 'data' field")
            body = JSON.parse(dataStr)
        } else {
            console.error("[Asaas Integration] Parse Error:", e.message, "Text:", text.substring(0, 50))
            throw new Error(`Falha ao processar corpo da requisição: ${e.message}`)
        }
    }

    // --- 1. WEBHOOK HANDLER (No Auth Required) ---
    if (body.event) {
        const event = body.event
        console.log(`[Asaas Webhook] Event: ${event}, Payment: ${body.payment?.id}, Ref: ${body.payment?.externalReference}`)
        
        // --- 1.2 WEBHOOK SECURITY CHECK ---
        const receivedToken = req.headers.get('asaas-access-token')
        if (receivedToken !== ASAAS_WEBHOOK_TOKEN) {
            console.error(`[Asaas Webhook] Security Error: Invalid token received from ${req.headers.get('x-real-ip')}`)
            return new Response(JSON.stringify({ error: "Unauthorized Webhook" }), { status: 401 })
        }
        const payment = body.payment
        
        if (['PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED_IN_CASH'].includes(event)) {
            const userId = payment.externalReference
            const paymentId = payment.id
            const paymentValue = Number(payment.value)
            const billingType = payment.billingType

            if (!userId) {
                console.error("[Asaas Webhook] Error: Missing externalReference (userId)")
                return new Response(JSON.stringify({ received: true, error: "Missing userId" }), { status: 200 })
            }

            // 2. Check for idempotency (Don't process if already SUCCESS)
            const { data: existingTx, error: selectError } = await serviceRoleClient
                .from('wallet_transactions')
                .select('status, amount')
                .eq('asaas_id', paymentId)
                .maybeSingle()

            if (selectError) {
                console.error('[Asaas Webhook] Error checking existing transaction:', selectError)
            }

            if (existingTx?.status === 'SUCCESS') {
                console.log(`[Asaas Webhook] Payment ${paymentId} already processed (SUCCESS). Skipping update.`)
                return new Response(JSON.stringify({ received: true, alreadyProcessed: true }), { status: 200 })
            }

            // 3. Update Balance
            console.log(`[Asaas Webhook] Processing ${event} for payment ${paymentId}. User: ${userId}, Amount: ${paymentValue}`)

            // Get current balance
            const { data: profile, error: pError } = await serviceRoleClient
                .from('profiles')
                .select('balance')
                .eq('id', userId)
                .single()

            if (pError || !profile) {
                throw new Error(`Profile not found for user ${userId}`)
            }

            const newBalance = (profile.balance || 0) + paymentValue

            // Update profile balance
            const { error: balanceError } = await serviceRoleClient
                .from('profiles')
                .update({ balance: newBalance })
                .eq('id', userId)

            if (balanceError) throw balanceError

            // Update transaction record as SUCCESS
            const { error: txError } = await serviceRoleClient
                .from('wallet_transactions')
                .update({
                    status: 'SUCCESS',
                    description: `Recarga via ${billingType} (Asaas: ${paymentId})`,
                    metadata: body
                })
                .eq('asaas_id', paymentId)

            if (txError) {
                console.error('[Asaas Webhook] Error updating transaction status:', txError)
                // We don't throw here because balance was already updated
            }

            console.log(`[Asaas Webhook] Balance updated successfully for ${userId}. New balance: ${newBalance}`)
            return new Response(JSON.stringify({ received: true, updated: true, newBalance }), { status: 200 })
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 })
    }

    // --- 2. APP ACTIONS (Auth Required) ---
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error("Não autorizado: Cabeçalho de autenticação ausente")

    const { data: { user }, error: authError } = await (createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })).auth.getUser()
    
    if (authError || !user) throw new Error("Não autorizado: Sessão inválida")
    
    const userId = user.id
    console.log(`[Asaas Integration] Action: ${body.action}, User: ${userId}`)

    const getProfile = async (uid: string) => {
      const { data, error } = await serviceRoleClient.from('profiles').select('*').eq('id', uid).single()
      if (error || !data) throw new Error("Perfil não encontrado")
      return data
    }

    // --- ACTIONS ---
    if (body.action === 'create-payment') {
      const profile = await getProfile(userId)
      let asaasCustomerId = profile.asaas_customer_id
      const customerName = body.name || profile.full_name || 'Cliente Easy Content'
      const customerEmail = body.email || user.email || `${userId}@easycontent.com.br`
      
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
        asaasCustomerId = createData.id
        await serviceRoleClient.from('profiles').update({ asaas_customer_id: asaasCustomerId, full_name: customerName }).eq('id', userId)
      }

      const amount = Number(body.amount)
      const paymentPayload: any = {
        customer: asaasCustomerId,
        billingType: body.billingType || 'PIX',
        value: amount,
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        description: body.description || 'Pagamento Easy Content',
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

      const { error: insertError } = await serviceRoleClient
        .from('wallet_transactions')
        .insert({
            user_id: userId,
            amount: amount,
            type: 'TOPUP',
            status: isPaid ? 'SUCCESS' : 'PENDING',
            description: 'Recarga de Saldo',
            asaas_id: paymentId
        })
        
      if (insertError) {
          throw new Error('Erro ao salvar transação: ' + insertError.message)
      }

      if (paymentData.billingType === 'PIX') {
        const pixRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
            headers: { 'access_token': ASAAS_API_KEY }
        })
        const pixData = await pixRes.json()
        return new Response(JSON.stringify({ payment: paymentData, pix: pixData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
      }

      return new Response(JSON.stringify({ status: paymentData.status, isPaid, payment: paymentData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (body.action === 'get-payment-status') {
      const res = await fetch(`${ASAAS_API_URL}/payments/${body.paymentId}`, {
        method: 'GET',
        headers: { 'access_token': ASAAS_API_KEY }
      })
      const data = await res.json()
      if (data.errors) throw new Error(data.errors[0].description)
      
      const isPaid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(data.status)
      
      // Proactive Idempotent Update (Fallback in case webhook is slow)
      if (isPaid) {
          const { data: existingTx } = await serviceRoleClient
              .from('wallet_transactions')
              .select('status, amount')
              .eq('asaas_id', data.id)
              .maybeSingle()
              
          if (existingTx && existingTx.status !== 'SUCCESS') {
               const { data: profile } = await serviceRoleClient
                   .from('profiles')
                   .select('balance')
                   .eq('id', userId)
                   .single()
               
               if (profile) {
                   await serviceRoleClient.from('profiles').update({ balance: (profile.balance || 0) + Number(data.value) }).eq('id', userId)
                   await serviceRoleClient.from('wallet_transactions').update({
                       status: 'SUCCESS',
                       description: `Recarga via ${data.billingType} (Asaas: ${data.id})`,
                   }).eq('asaas_id', data.id)
               }
          }
      }

      return new Response(JSON.stringify({ status: data.status, isPaid, payment: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (body.action === 'admin-get-balance') {
      const profile = await getProfile(userId)
      if (profile.role !== 'admin') throw new Error("Acesso negado: Requer permissões de administrador.")
      
      const res = await fetch(`${ASAAS_API_URL}/finance/balance`, {
          method: 'GET',
          headers: { 'access_token': ASAAS_API_KEY }
      })
      const data = await res.json()
      
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (body.action === 'withdraw') {
      const profile = await getProfile(userId)
      const amount = Number(body.amount)
      if (amount <= 0 || (profile.balance || 0) < amount) throw new Error("Saldo insuficiente")
      
      const { error: txError } = await serviceRoleClient.from('wallet_transactions').insert({
          user_id: userId,
          amount: amount,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          description: 'Solicitação de Saque do Editor',
          metadata: { pixKey: body.pixKey, pixKeyType: body.pixKeyType }
      })
      if (txError) throw txError
      
      await serviceRoleClient.from('profiles').update({ balance: profile.balance - amount, frozen_balance: (profile.frozen_balance || 0) + amount }).eq('id', userId)

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (body.action === 'admin-approve-withdrawal') {
      const adminProfile = await getProfile(userId)
      if (adminProfile.role !== 'admin') throw new Error("Acesso negado")
      
      const { data: tx, error: txError } = await serviceRoleClient.from('wallet_transactions').select('*').eq('id', body.txId).single()
      if (txError || !tx || tx.status !== 'PENDING') throw new Error("Transação inválida")
      
      const res = await fetch(`${ASAAS_API_URL}/transfers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'access_token': ASAAS_API_KEY },
          body: JSON.stringify({
              value: tx.amount,
              pixAddressKey: tx.metadata?.pixKey,
              pixAddressKeyType: tx.metadata?.pixKeyType || 'EVP',
              description: `Pagamento de Edição - Easy Content`
          })
      })
      const data = await res.json()
      if (data.errors) throw new Error(`Erro ao transferir no Asaas: ${data.errors[0].description}`)
      
      await serviceRoleClient.from('wallet_transactions').update({ status: 'SUCCESS', asaas_id: data.id }).eq('id', tx.id)
      
      const { data: profile } = await serviceRoleClient.from('profiles').select('frozen_balance').eq('id', tx.user_id).single()
      if (profile) {
          await serviceRoleClient.from('profiles').update({ frozen_balance: (profile.frozen_balance || 0) - tx.amount }).eq('id', tx.user_id)
      }
      
      return new Response(JSON.stringify({ success: true, asaasTransfer: data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
    }

    if (body.action === 'admin-reject-withdrawal') {
      const adminProfile = await getProfile(userId)
      if (adminProfile.role !== 'admin') throw new Error("Acesso negado")
      
      const { data: tx, error: txError } = await serviceRoleClient.from('wallet_transactions').select('*').eq('id', body.txId).single()
      if (txError || !tx || tx.status !== 'PENDING') throw new Error("Transação inválida")
      
      await serviceRoleClient.from('wallet_transactions').update({ status: 'FAILED', description: `Rejeitado: ${body.reason}` }).eq('id', tx.id)
      
      const { data: profile } = await serviceRoleClient.from('profiles').select('balance, frozen_balance').eq('id', tx.user_id).single()
      if (profile) {
          await serviceRoleClient.from('profiles').update({ balance: (profile.balance || 0) + tx.amount, frozen_balance: (profile.frozen_balance || 0) - tx.amount }).eq('id', tx.user_id)
      }
      
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 })
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
