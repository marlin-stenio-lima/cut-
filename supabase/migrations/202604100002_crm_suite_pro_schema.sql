-- Migration for CRM Suite Pro: Hierarchical Pipelines, Stages and Deals

-- 1. Create Loss Reasons
CREATE TABLE IF NOT EXISTS crm_loss_reasons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reason text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Create Pipelines
CREATE TABLE IF NOT EXISTS crm_pipelines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Create Stages
CREATE TABLE IF NOT EXISTS crm_stages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id uuid NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
    name text NOT NULL,
    "order" integer NOT NULL DEFAULT 0,
    target_days integer DEFAULT 7,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create Deals
CREATE TABLE IF NOT EXISTS crm_deals (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    stage_id uuid NOT NULL REFERENCES crm_stages(id) ON DELETE CASCADE,
    contact_id uuid REFERENCES profiles(id), -- Linked to a profile if already registered
    lead_id uuid REFERENCES leads(id), -- Linked to a lead if not registered
    title text NOT NULL,
    value decimal(12,2) DEFAULT 0,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
    loss_reason_id uuid REFERENCES crm_loss_reasons(id),
    notes text,
    assigned_to uuid REFERENCES profiles(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Add remote_jid to profiles and leads for WhatsApp Sync
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS remote_jid text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS remote_jid text;

-- 6. RLS
ALTER TABLE crm_loss_reasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage pipelines" ON crm_pipelines FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins manage stages" ON crm_stages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins manage deals" ON crm_deals FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY "Admins manage loss reasons" ON crm_loss_reasons FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- 7. Initial Data
INSERT INTO crm_pipelines (name) VALUES ('Vendas Imóveis');
-- Get the ID of the new pipeline
DO $$
DECLARE
    v_pipeline_id uuid;
BEGIN
    SELECT id INTO v_pipeline_id FROM crm_pipelines WHERE name = 'Vendas Imóveis' LIMIT 1;
    
    INSERT INTO crm_stages (pipeline_id, name, "order", target_days) VALUES
    (v_pipeline_id, 'Prospecção', 1, 2),
    (v_pipeline_id, 'Primeiro Contato', 2, 3),
    (v_pipeline_id, 'Visita Agendada', 3, 7),
    (v_pipeline_id, 'Negociação', 4, 15),
    (v_pipeline_id, 'Fechamento', 5, 30);
END $$;

INSERT INTO crm_loss_reasons (reason) VALUES 
('Preço muito alto'),
('Localização não agrada'),
('Financiamento negado'),
('Desistência'),
('Outro');
