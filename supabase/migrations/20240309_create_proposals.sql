-- Tabela para armazenar as propostas feitas por Editores em Projetos
create table public.proposals (
    id uuid default gen_random_uuid() primary key,
    project_id uuid not null references public.projects(id) on delete cascade,
    editor_id uuid not null references public.profiles(id) on delete cascade,
    cover_letter text not null,
    status text not null default 'pending', -- pending, accepted, rejected
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    -- Impedir que o mesmo editor envie mais de uma proposta para o mesmo projeto
    unique(project_id, editor_id)
);

-- Ativar Row Level Security
alter table public.proposals enable row level security;

-- Políticas de Segurança (Row Level Security - RLS)

-- 1. Editores podem ler as próprias propostas
create policy "Editors can view their own proposals"
    on public.proposals for select
    using (auth.uid() = editor_id);

-- 2. Clientes podem ler as propostas feitas para seus projetos
create policy "Clients can view proposals for their projects"
    on public.proposals for select
    using (
        exists (
            select 1 from public.projects
            where projects.id = proposals.project_id
            and projects.client_id = auth.uid()
        )
    );

-- 3. Editores podem criar novas propostas
create policy "Editors can insert proposals"
    on public.proposals for insert
    with check (auth.uid() = editor_id);

-- 4. Clientes podem atualizar propostas (para aceitá-las ou rejeitá-las)
create policy "Clients can update proposals for their projects"
    on public.proposals for update
    using (
        exists (
            select 1 from public.projects
            where projects.id = proposals.project_id
            and projects.client_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.projects
            where projects.id = proposals.project_id
            and projects.client_id = auth.uid()
        )
    );
