-- ═══════════════════════════════════════════════════════
-- Dona Help — Schema Supabase
-- Executar no SQL Editor do Supabase (uma única vez)
-- ═══════════════════════════════════════════════════════

-- 1. Categorias
create table if not exists categorias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  created_at timestamptz not null default now()
);

-- 2. Produtos
create table if not exists produtos (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  marca        text not null,
  categoria_id uuid not null references categorias(id) on delete restrict,
  unidade      text not null check (unidade in ('L','Kg','Un')),
  descricao    text,
  ponto_pedido numeric(10,4) not null default 0,
  created_at   timestamptz not null default now()
);

-- 3. Diluições
create table if not exists diluicoes (
  id               uuid primary key default gen_random_uuid(),
  produto_id       uuid not null references produtos(id) on delete cascade,
  tipo             text not null check (tipo in ('Leve','Media','Pesada')),
  proporcao        text not null,          -- ex: "1:40"
  fator_diluicao   numeric(10,2) not null, -- ex: 40
  instrucao_de_uso text not null,
  created_at       timestamptz not null default now(),
  unique(produto_id, tipo)                 -- apenas 1 por faixa por produto
);

-- 4. Estoque
create table if not exists estoque (
  id                uuid primary key default gen_random_uuid(),
  produto_id        uuid not null unique references produtos(id) on delete cascade,
  quantidade_atual  numeric(12,4) not null default 0,
  created_at        timestamptz not null default now()
);

-- 5. Compras
create table if not exists compras (
  id              uuid primary key default gen_random_uuid(),
  produto_id      uuid not null references produtos(id) on delete cascade,
  data            timestamptz not null,
  preco_unitario  numeric(10,2) not null,
  quantidade      numeric(10,4) not null,
  fornecedor      text not null,
  nota_fiscal     text,
  created_at      timestamptz not null default now()
);

-- 6. Movimentações de Estoque
create table if not exists movimentacoes (
  id           uuid primary key default gen_random_uuid(),
  produto_id   uuid not null references produtos(id) on delete cascade,
  tipo         text not null check (tipo in ('entrada','saida')),
  quantidade   numeric(12,4) not null,
  motivo       text not null,
  responsavel  text not null,
  data         timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

-- ═══════════════════════════════════════════════════════
-- Índices para performance
-- ═══════════════════════════════════════════════════════

create index if not exists idx_produtos_categoria  on produtos(categoria_id);
create index if not exists idx_diluicoes_produto   on diluicoes(produto_id);
create index if not exists idx_compras_produto     on compras(produto_id);
create index if not exists idx_compras_data        on compras(data desc);
create index if not exists idx_movimentacoes_prod  on movimentacoes(produto_id);
create index if not exists idx_movimentacoes_data  on movimentacoes(data desc);

-- ═══════════════════════════════════════════════════════
-- Seed: Categorias padrão
-- ═══════════════════════════════════════════════════════

insert into categorias (nome) values
  ('Limpeza Geral'),
  ('Desengraxantes'),
  ('Desinfetantes'),
  ('Sanitizantes'),
  ('Desincrustantes'),
  ('Aromatizantes')
on conflict (nome) do nothing;

-- ═══════════════════════════════════════════════════════
-- Row Level Security (RLS)
-- TEMPORÁRIO: acesso total para anon + authenticated
-- (substituir por políticas restritivas ao implementar login)
-- ═══════════════════════════════════════════════════════

alter table categorias    enable row level security;
alter table produtos      enable row level security;
alter table diluicoes     enable row level security;
alter table estoque       enable row level security;
alter table compras       enable row level security;
alter table movimentacoes enable row level security;

-- Políticas temporárias: SELECT / INSERT / UPDATE / DELETE para anon e authenticated
create policy "anon_full_access" on categorias    for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on produtos      for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on diluicoes     for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on estoque       for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on compras       for all to anon, authenticated using (true) with check (true);
create policy "anon_full_access" on movimentacoes for all to anon, authenticated using (true) with check (true);
