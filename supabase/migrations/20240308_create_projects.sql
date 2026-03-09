-- Create a table for projects
create table projects (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) not null,
  editor_id uuid references public.profiles(id),
  title text not null,
  video_type text,
  format text,
  description text,
  style text,
  references_url text,
  budget numeric,
  deadline date,
  status text default 'Aberto',
  progress integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Realtime
alter table projects replica identity full;

-- Create policies
alter table projects enable row level security;

-- Everyone can view open projects
create policy "Open projects are viewable by everyone." on projects
  for select using (status = 'Aberto');

-- Clients can see their own projects
create policy "Clients can view their own projects." on projects
  for select using (auth.uid() = client_id);

-- Editors can see projects they are assigned to
create policy "Editors can view assigned projects." on projects
  for select using (auth.uid() = editor_id);

-- Only clients can insert projects
create policy "Clients can insert projects." on projects
  for insert with check (auth.uid() = client_id);

-- Clients can update their own projects
create policy "Clients can update own projects." on projects
  for update using (auth.uid() = client_id);

-- Editors can update progress of assigned projects
create policy "Editors can update assigned projects." on projects
  for update using (auth.uid() = editor_id);
