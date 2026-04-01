-- Adiciona as colunas de negociação na tabela proposals
ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS counter_price numeric(10,2),
ADD COLUMN IF NOT EXISTS negotiation_round integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_sender_id uuid REFERENCES public.profiles(id);
