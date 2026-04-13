import { supabase } from './supabase'

export interface Pipeline {
    id: string
    name: string
}

export interface Stage {
    id: string
    pipeline_id: string
    name: string
    order: number
    target_days: number
}

export interface Deal {
    id: string
    stage_id: string
    title: string
    value: number
    status: 'open' | 'won' | 'lost'
    contact_id?: string
    lead_id?: string
    notes?: string
    assigned_to?: string
    created_at: string
    updated_at: string
    // Joined data
    contact?: { full_name: string, whatsapp: string, works_completed?: number, balance?: number }
    lead?: { full_name: string, whatsapp: string }
    crm_stages?: Stage // For helper
}

export const crmService = {
    async getPipelines() {
        const { data, error } = await supabase.from('crm_pipelines').select('*').order('name')
        if (error) throw error
        return data as Pipeline[]
    },

    async createStage(data: { pipeline_id: string, name: string, order: number, target_days?: number }) {
        const { data: stage, error } = await supabase.from('crm_stages').insert(data).select().single()
        if (error) throw error
        return stage
    },

    async getStages(pipelineId: string) {
        const { data, error } = await supabase
            .from('crm_stages')
            .select('*')
            .eq('pipeline_id', pipelineId)
            .order('order')
        if (error) throw error
        return data as Stage[]
    },

    async getDeals(stageId?: string) {
        let query = supabase
            .from('crm_deals')
            .select('*, contact:contact_id(full_name, whatsapp, works_completed, balance), lead:lead_id(full_name, whatsapp), crm_stages(*)')
        
        if (stageId) query = query.eq('stage_id', stageId)
        
        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        return data as Deal[]
    },

    async updateDealStage(dealId: string, stageId: string) {
        const { data, error } = await supabase
            .from('crm_deals')
            .update({ stage_id: stageId, updated_at: new Date().toISOString() })
            .eq('id', dealId)
            .select()
        if (error) throw error
        return data
    },

    async createDeal(deal: Partial<Deal>) {
        const { data, error } = await supabase
            .from('crm_deals')
            .insert(deal)
            .select()
            .single()
        if (error) throw error
        return data
    },

    async getLossReasons() {
        const { data, error } = await supabase.from('crm_loss_reasons').select('*').order('reason')
        if (error) throw error
        return data
    },

    async setDealLost(dealId: string, lossReasonId: string, notes?: string) {
        const { data, error } = await supabase
            .from('crm_deals')
            .update({ 
                status: 'lost', 
                loss_reason_id: lossReasonId, 
                notes: notes,
                updated_at: new Date().toISOString() 
            })
            .eq('id', dealId)
            .select()
        if (error) throw error
        return data
    },

    async setupDefaultPipeline() {
        // 1. Create Pipeline
        const { data: pipeline, error: pError } = await supabase
            .from('crm_pipelines')
            .insert({ name: 'CRM Projetos' })
            .select()
            .single()
        
        if (pError) throw pError

        // 2. Create Stages
        const stages = [
            { name: 'Novo projeto', order: 1, target_days: 2 },
            { name: 'Proposta', order: 2, target_days: 3 },
            { name: 'Projeto em edição', order: 3, target_days: 5 },
            { name: 'Projeto em aprovação', order: 4, target_days: 2 },
            { name: 'Análise', order: 5, target_days: 1 },
            { name: 'Finalizado', order: 6, target_days: 0 },
            { name: 'Pendentes de pagamento', order: 7, target_days: 3 }
        ].map(s => ({ ...s, pipeline_id: pipeline.id }))

        const { error: sError } = await supabase
            .from('crm_stages')
            .insert(stages)
        
        if (sError) throw sError
        return pipeline
    }
}
