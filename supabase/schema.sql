-- Supabase schema for Gestao de Estoque
-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

-- Enums
create type public.status_unidade as enum ('ativa', 'inativa');
create type public.status_colaborador as enum ('ativo', 'inativo');
create type public.status_ativo as enum ('disponivel', 'em_uso', 'manutencao', 'descartado');
create type public.estado_ativo as enum ('novo', 'bom', 'regular', 'ruim');
create type public.categoria_ativo as enum (
  'notebook','monitor','tv','desktop','impressora','telefone','headset',
  'teclado','mouse','nobreak','switch','roteador','servidor','tablet','outros'
);
create type public.tipo_informacao as enum ('ip', 'sistema', 'fornecedor', 'chip_corporativo');
create type public.categoria_conhecimento as enum ('TI', 'RH', 'Financeiro', 'Comercial', 'Operacoes', 'Geral');
create type public.tipo_conhecimento as enum ('link', 'pdf');
create type public.status_termo as enum ('gerado', 'enviado', 'assinado', 'cancelado');

-- Optional profile table (helps replacing Base44 auth context)
create table if not exists public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text,
  email text unique,
  perfil text default 'user' check (perfil in ('admin','user')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Auto-create profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome_completo, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do update
    set nome_completo = excluded.nome_completo,
        email = excluded.email,
        atualizado_em = now();

  return new;
end;
$$;

create table if not exists public.unidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text not null,
  endereco text,
  telefone text,
  responsavel text,
  status public.status_unidade not null default 'ativa',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (nome, cidade)
);

create table if not exists public.colaboradores (
  id uuid primary key default gen_random_uuid(),
  nome_completo text not null,
  cpf text,
  email text,
  telefone text,
  departamento text not null,
  cargo text,
  unidade_id uuid references public.unidades(id) on delete set null,
  unidade_nome text,
  data_admissao date,
  status public.status_colaborador not null default 'ativo',
  termo_assinado boolean not null default false,
  termo_assinado_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cpf),
  unique (email)
);

create table if not exists public.ativos (
  id uuid primary key default gen_random_uuid(),
  patrimonio text,
  nome text not null,
  categoria public.categoria_ativo not null,
  marca text,
  modelo text,
  numero_serie text,
  status public.status_ativo not null default 'disponivel',
  estado public.estado_ativo not null default 'novo',
  unidade_id uuid references public.unidades(id) on delete set null,
  unidade_nome text,
  data_compra date,
  valor_compra numeric(12,2),
  localizacao text,
  atribuido_para text,
  atribuido_para_email text,
  atribuido_para_cpf text,
  atribuido_para_departamento text,
  data_atribuicao date,
  observacoes text,
  url_imagem text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (patrimonio),
  unique (numero_serie)
);

create table if not exists public.informacoes (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_informacao not null,
  titulo text not null,
  valor text,
  descricao text,
  contato_nome text,
  contato_email text,
  contato_telefone text,
  unidade_nome text,
  unidade_id uuid references public.unidades(id) on delete set null,
  atribuido_para text,
  atribuido_para_id uuid references public.colaboradores(id) on delete set null,
  atribuido_para_departamento text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.base_conhecimento (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria public.categoria_conhecimento,
  tipo public.tipo_conhecimento not null,
  url text not null,
  descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.termos_posse (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid not null references public.colaboradores(id) on delete cascade,
  colaborador_nome text not null,
  colaborador_email text not null,
  status public.status_termo not null default 'gerado',
  pdf_url text,
  pdf_hash text,
  enviado_em timestamptz,
  assinado_em timestamptz,
  observacoes text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.email_queue (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed')),
  tentativas integer not null default 0,
  max_tentativas integer not null default 5,
  erro text,
  scheduled_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.perfis
add column if not exists colaborador_id uuid references public.colaboradores(id) on delete set null;

create or replace view public.colaboradores_com_acesso as
select
  c.*,
  coalesce(
    max(case when p.perfil = 'admin' then 'admin' end),
    max(case when p.perfil = 'user' then 'user' end),
    'user'
  ) as perfil_acesso
from public.colaboradores c
left join public.perfis p
  on p.colaborador_id = c.id
group by c.id;

-- Helpful indexes
create index if not exists idx_unidades_status on public.unidades(status);
create unique index if not exists idx_perfis_colaborador_id_unique on public.perfis(colaborador_id) where colaborador_id is not null;
create index if not exists idx_colaboradores_status on public.colaboradores(status);
create index if not exists idx_colaboradores_unidade_id on public.colaboradores(unidade_id);
create index if not exists idx_ativos_status on public.ativos(status);
create index if not exists idx_ativos_categoria on public.ativos(categoria);
create index if not exists idx_ativos_unidade_id on public.ativos(unidade_id);
create index if not exists idx_informacoes_tipo on public.informacoes(tipo);
create index if not exists idx_informacoes_unidade_id on public.informacoes(unidade_id);
create index if not exists idx_informacoes_atribuido_para_id on public.informacoes(atribuido_para_id);
create index if not exists idx_termos_posse_colaborador_id on public.termos_posse(colaborador_id);
create index if not exists idx_termos_posse_status on public.termos_posse(status);
create index if not exists idx_termos_posse_enviado_em on public.termos_posse(enviado_em);
create index if not exists idx_email_queue_status_scheduled_at on public.email_queue(status, scheduled_at);
create index if not exists idx_email_queue_created_at on public.email_queue(created_at);
create index if not exists idx_email_queue_status_processed_at on public.email_queue(status, processed_at);
create index if not exists idx_email_queue_status_updated_at on public.email_queue(status, updated_at);

-- Keep atualizado_em fresh
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create or replace function public.set_email_queue_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.block_delete_colaborador_com_ativos()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.ativos a
    where
      (old.nome_completo is not null and a.atribuido_para = old.nome_completo)
      or (old.email is not null and a.atribuido_para_email = old.email)
      or (old.cpf is not null and a.atribuido_para_cpf = old.cpf)
  ) then
    raise exception 'Nao e permitido excluir colaborador com ativos vinculados.';
  end if;

  return old;
end;
$$;

create or replace function public.cleanup_perfil_ao_excluir_colaborador()
returns trigger
language plpgsql
as $$
begin
  delete from public.perfis
  where colaborador_id = old.id
    and perfil = 'user';

  return old;
end;
$$;

create trigger trg_perfis_atualizado_em
before update on public.perfis
for each row execute function public.set_atualizado_em();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create trigger trg_unidades_atualizado_em
before update on public.unidades
for each row execute function public.set_atualizado_em();

create trigger trg_colaboradores_atualizado_em
before update on public.colaboradores
for each row execute function public.set_atualizado_em();

create trigger trg_ativos_atualizado_em
before update on public.ativos
for each row execute function public.set_atualizado_em();

create trigger trg_informacoes_atualizado_em
before update on public.informacoes
for each row execute function public.set_atualizado_em();

create trigger trg_base_conhecimento_atualizado_em
before update on public.base_conhecimento
for each row execute function public.set_atualizado_em();

create trigger trg_termos_posse_atualizado_em
before update on public.termos_posse
for each row execute function public.set_atualizado_em();

create trigger trg_email_queue_updated_at
before update on public.email_queue
for each row execute function public.set_email_queue_updated_at();

drop trigger if exists trg_block_delete_colaborador_com_ativos on public.colaboradores;
create trigger trg_block_delete_colaborador_com_ativos
before delete on public.colaboradores
for each row execute function public.block_delete_colaborador_com_ativos();

drop trigger if exists trg_cleanup_perfil_ao_excluir_colaborador on public.colaboradores;
create trigger trg_cleanup_perfil_ao_excluir_colaborador
after delete on public.colaboradores
for each row execute function public.cleanup_perfil_ao_excluir_colaborador();

-- RLS
alter table public.perfis enable row level security;
alter table public.unidades enable row level security;
alter table public.colaboradores enable row level security;
alter table public.ativos enable row level security;
alter table public.informacoes enable row level security;
alter table public.base_conhecimento enable row level security;
alter table public.termos_posse enable row level security;
alter table public.email_queue enable row level security;

-- Basic authenticated access policies (adjust later by role)
create policy "perfis_select_proprio" on public.perfis
for select to authenticated
using (auth.uid() = id);

create policy "perfis_update_proprio" on public.perfis
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "perfis_insert_proprio" on public.perfis
for insert to authenticated
with check (auth.uid() = id);

create policy "unidades_crud_authenticated" on public.unidades
for all to authenticated
using (true)
with check (true);

create policy "colaboradores_crud_authenticated" on public.colaboradores
for all to authenticated
using (true)
with check (true);

create policy "ativos_crud_authenticated" on public.ativos
for all to authenticated
using (true)
with check (true);

create policy "informacoes_crud_authenticated" on public.informacoes
for all to authenticated
using (true)
with check (true);

create policy "base_conhecimento_crud_authenticated" on public.base_conhecimento
for all to authenticated
using (true)
with check (true);

create policy "termos_posse_crud_authenticated" on public.termos_posse
for all to authenticated
using (true)
with check (true);

create policy "email_queue_crud_authenticated" on public.email_queue
for all to authenticated
using (true)
with check (true);
