import { supabase } from './supabase'

export interface AsaasPaymentResponse {
  payment: any
  pix?: {
    encodedImage: string
    payload: string
    expirationDate: string
  }
}

export const asaasService = {
  /**
   * Generates a PIX payment for a custom amount
   */
  async createPixPayment(amount: number, description: string, customerInfo: { name: string; email: string; cpf: string; phone: string }) {
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration', {
        body: { 
          action: 'create-payment',
          billingType: 'PIX',
          amount,
          description,
          name: customerInfo.name,
          email: customerInfo.email,
          cpf: customerInfo.cpf,
          phone: customerInfo.phone
        }
      })

      if (error) {
        console.error('Asaas Integration Error:', error)
        throw new Error(error.message || 'Falha ao conectar com o servidor')
      }

      if (data && data.error) {
        throw new Error(data.message || 'Erro na integração com Asaas')
      }

      return data as AsaasPaymentResponse
    } catch (err: any) {
      console.error('Asaas Service Exception:', err)
      throw err
    }
  },

  /**
   * Generates a Credit Card payment
   */
  async createCardPayment(amount: number, description: string, customerInfo: any, cardData: any) {
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration', {
        body: { 
          action: 'create-payment',
          billingType: 'CREDIT_CARD',
          amount,
          description,
          ...customerInfo,
          creditCard: cardData.creditCard,
          creditCardHolderInfo: cardData.creditCardHolderInfo,
          remoteIp: '127.0.0.1' // In production, get client IP
        }
      })

      if (error) throw new Error(error.message || 'Erro ao processar cartão')
      if (data && data.error) throw new Error(data.message || 'Erro no cartão')

      return data
    } catch (err: any) {
      console.error('Asaas Card Exception:', err)
      throw err
    }
  },

  /**
   * Fetches wallet transactions for the current user
   */
  async getTransactions() {
    const { data, error } = await supabase.from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  /**
   * Checks the status of a specific payment
   * @param paymentId The Asaas payment ID
   */
  async getPaymentStatus(paymentId: string) {
    const { data, error } = await supabase.functions.invoke('asaas-integration', {
      body: { action: 'get-payment-status', paymentId }
    })
    if (error) throw error
    return data
  },

  async requestWithdrawal(amount: number, pixKey: string, pixKeyType: string) {
    const { data, error } = await supabase.functions.invoke('asaas-integration', {
      body: { action: 'withdraw', amount, pixKey, pixKeyType }
    })
    if (error) throw error
    return data
  },

  async approveWithdrawal(txId: string) {
    const { data, error } = await supabase.functions.invoke('asaas-integration', {
      body: { action: 'admin-approve-withdrawal', txId }
    })
    if (error) throw error
    return data
  },

  async rejectWithdrawal(txId: string, reason: string) {
    const { data, error } = await supabase.functions.invoke('asaas-integration', {
      body: { action: 'admin-reject-withdrawal', txId, reason }
    })
    if (error) throw error
    return data
  },

  async toggleAutoPayout(enabled: boolean) {
    const { data, error } = await supabase.functions.invoke('asaas-integration', {
      body: { action: 'toggle-auto-payout', enabled }
    })
    if (error) throw error
    return data
  }
}
