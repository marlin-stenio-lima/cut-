-- Migration to create leads table and enhance profiles with CRM status

-- 1. Create Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    full_name text NOT NULL,
    email text,
    whatsapp text,
    status text NOT NULL DEFAULT 'Novo' CHECK (status IN ('Novo', 'Contatado', 'Negociando', 'Convertido', 'Arquivado')),
    source text, -- ex: 'Instagram', 'Indicação', 'Site'
    notes text,
    assigned_to uuid REFERENCES profiles(id)
);

-- 2. Add crm_status to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS crm_status text DEFAULT 'Ativo' 
CHECK (crm_status IN ('Novo Lead', 'Em Onboarding', 'Ativo', 'Inativo', 'Churn', 'Risco'));

-- 3. Enable RLS for leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Admins
CREATE POLICY "Admins can manage all leads" 
ON leads FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- 5. Add trigger for updated_at on leads
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
