-- Tabela para armazenar as mensagens do chat entre Cliente e Editor
create table public.messages (
    id uuid default gen_random_uuid() primary key,
    project_id uuid not null references public.projects(id) on delete cascade,
    sender_id uuid not null references public.profiles(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ativar Realtime para mensagens (essencial para o chat funcionar ao vivo)
alter table public.messages replica identity full;

-- Ativar Row Level Security
alter table public.messages enable row level security;

-- Políticas de Segurança (Somente quem faz parte do projeto pode ver/enviar mensagens)

-- 1. Leitura: Cliente ou Editor do projeto podem ler as mensagens
create policy "Project members can read messages"
    on public.messages for select
    using (
        exists (
            select 1 from public.projects
            where projects.id = messages.project_id
            and (projects.client_id = auth.uid() or projects.editor_id = auth.uid())
        )
    );

-- 2. Escrita: Cliente ou Editor do projeto podem enviar mensagens
create policy "Project members can insert messages"
    on public.messages for insert
    with check (
        exists (
            select 1 from public.projects
            where projects.id = messages.project_id
            and (projects.client_id = auth.uid() or projects.editor_id = auth.uid())
        )
        and auth.uid() = sender_id
    );
