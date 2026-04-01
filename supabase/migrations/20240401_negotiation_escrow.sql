-- 1. Atualizar Perfis com Saldo Congelado
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS frozen_balance decimal(12,2) DEFAULT 0.00;

-- 2. Atualizar Configurações de Plataforma com Taxa Dinâmica
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS commission_percentage decimal(5,2) DEFAULT 10.00;

-- 3. Atualizar Propostas para Suportar Negociação
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS offered_price decimal(12,2),
ADD COLUMN IF NOT EXISTS counter_price decimal(12,2),
ADD COLUMN IF NOT EXISTS negotiation_round int DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_sender_id uuid REFERENCES auth.users(id);

-- 4. Atualizar Projetos para Finalização e Escrow
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS final_price decimal(12,2),
ADD COLUMN IF NOT EXISTS editor_finished_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_finished_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS client_review text;

-- 5. Atualizar os tipos de transações da carteira
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_type_check;
ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_type_check 
CHECK (type IN ('TOPUP', 'WITHDRAWAL', 'PAYMENT', 'ESCROW_LOCK', 'ESCROW_UNLOCK'));

-- 6. Adicionar novo status de projeto se necessário
-- (O Supabase/Postgres texto não costuma travar enums a menos que tenha check constraint)
-- Mas vamos garantir que o status possa ser 'Aguardando Pagamento' ou 'Em Negociação'
-- Como o campo status é texto puro na migration original, não precisamos de alteração.

-- Comentários de ajuda para manutenção futura
COMMENT ON COLUMN public.profiles.frozen_balance IS 'Valor retido em projetos iniciados até a conclusão.';
COMMENT ON COLUMN public.platform_settings.commission_percentage IS 'Porcentagem de taxa que a plataforma retém sobre o valor final do projeto.';
COMMENT ON COLUMN public.projects.client_review IS 'Feedback obrigatório do cliente para liberação do pagamento.';
