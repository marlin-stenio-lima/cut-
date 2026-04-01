-- ================================================
-- Migração Completa: Colunas de Negociação e Escrow
-- Execute este SQL no Supabase SQL Editor
-- ================================================

-- 1. Tabela PROPOSALS: colunas de negociação
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS offered_price numeric(10,2),
ADD COLUMN IF NOT EXISTS counter_price numeric(10,2),
ADD COLUMN IF NOT EXISTS negotiation_round integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_sender_id uuid REFERENCES public.profiles(id);

-- 2. Tabela PROJECTS: colunas de escrow e finalização
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS final_price numeric(10,2),
ADD COLUMN IF NOT EXISTS ryver_link text,
ADD COLUMN IF NOT EXISTS project_files jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS editor_finished_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_finished_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_review text;

-- 3. Tabela PROFILES: colunas de carteira
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS frozen_balance numeric(10,2) DEFAULT 0;

-- 4. Permissão para editores atualizarem proposals (contraproposta)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'proposals' 
        AND policyname = 'Editors can update their own proposals'
    ) THEN
        CREATE POLICY "Editors can update their own proposals"
            ON public.proposals FOR UPDATE
            USING (auth.uid() = editor_id)
            WITH CHECK (auth.uid() = editor_id);
    END IF;
END $$;
