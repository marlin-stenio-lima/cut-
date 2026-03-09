-- Adiciona a coluna proposal_id na tabela messages
alter table public.messages add column proposal_id uuid references public.proposals(id) on delete cascade;

-- Permitir que mensagens pertençam a um projeto OU a uma proposta
-- Modifica a restrição NOT NULL de project_id (caso queiramos mensagens APENAS vinculadas a propostas antes de o projeto aceitar)
-- Na verdade, uma proposta SEMPRE pertence a um projeto. Então project_id ainda pode ser not null, mas adicionamos proposal_id opcional.
-- Para simplificar a lógica existente, vamos apenas adicionar proposal_id.

-- Drop das políticas antigas para recriar mais abrangentes
drop policy if exists "Project members can read messages" on public.messages;
drop policy if exists "Project members can insert messages" on public.messages;

-- 1. Leitura: Cliente ou Editor do projeto, OU Cliente do projeto ligado à proposta OU Editor da proposta
create policy "Users can read their messages"
    on public.messages for select
    using (
        -- Condição 1: Usuário é membro do projeto aceito
        exists (
            select 1 from public.projects
            where projects.id = messages.project_id
            and (projects.client_id = auth.uid() or projects.editor_id = auth.uid())
        )
        OR
        -- Condição 2: Mensagem está ligada a uma proposta específica
        (
            messages.proposal_id is not null and exists (
                select 1 from public.proposals p
                join public.projects pr on p.project_id = pr.id
                where p.id = messages.proposal_id
                and (p.editor_id = auth.uid() or pr.client_id = auth.uid())
            )
        )
    );

-- 2. Escrita: Similar à leitura, o usuário deve ser o remetente e fazer parte do contexto
create policy "Users can insert messages"
    on public.messages for insert
    with check (
        auth.uid() = sender_id
        and (
            -- Condição 1: Projeto aceito
            exists (
                select 1 from public.projects
                where projects.id = messages.project_id
                and (projects.client_id = auth.uid() or projects.editor_id = auth.uid())
            )
            OR
            -- Condição 2: Proposta em andamento
            (
                messages.proposal_id is not null and exists (
                    select 1 from public.proposals p
                    join public.projects pr on p.project_id = pr.id
                    where p.id = messages.proposal_id
                    and (p.editor_id = auth.uid() or pr.client_id = auth.uid())
                )
            )
        )
    );
