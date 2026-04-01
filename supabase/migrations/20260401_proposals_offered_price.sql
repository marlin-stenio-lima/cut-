-- Adiciona a coluna offered_price na tabela proposals
-- Esta coluna permite que o editor sugira um valor diferente do orçamento inicial

ALTER TABLE public.proposals
ADD COLUMN IF NOT EXISTS offered_price numeric(10,2);

-- Comentário: O valor será preenchido pelo editor ao enviar a proposta.
-- Se NULL, considera-se que o editor aceitou o budget sugerido pelo cliente.
