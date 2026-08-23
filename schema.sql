-- ============================================================
--  SANJAF Ventas — Esquema de base de datos (Supabase / Postgres)
--  Ejecuta este archivo completo en:  Supabase > SQL Editor > New query
-- ============================================================

create extension if not exists pgcrypto;

-- Secuencia de folios (los nuevos empiezan en 41; el Excel llegó al 40)
create sequence if not exists sanjaf_folio start 41;

-- Catálogo de productos
create table if not exists productos (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  categoria  text default 'Otro',
  udm        text default 'kg',
  costo      numeric,
  pct        numeric,
  precio     numeric,
  activo     boolean default true,
  created_at timestamptz default now()
);

-- Clientes (para autocompletar y, a futuro, saldos)
create table if not exists clientes (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null unique,
  rfc        text,
  telefono   text,
  notas      text,
  created_at timestamptz default now()
);

-- Ventas / notas de remisión
create table if not exists ventas (
  id       uuid primary key default gen_random_uuid(),
  folio    integer not null default nextval('sanjaf_folio'),
  fecha    date not null default current_date,
  cliente  text not null,
  venta    numeric not null default 0,
  costo    numeric not null default 0,
  util     numeric not null default 0,
  pago     text not null default 'pendiente',   -- 'pendiente' | 'pagado'
  factura  text not null default 'por_facturar',-- 'por_facturar' | 'facturado'
  creado   timestamptz default now()
);
create index if not exists ventas_fecha_idx on ventas(fecha);

-- Renglones de cada venta
create table if not exists venta_items (
  id        uuid primary key default gen_random_uuid(),
  venta_id  uuid not null references ventas(id) on delete cascade,
  nombre    text not null,
  udm       text,
  cant      numeric not null default 0,
  precio    numeric not null default 0,
  costo     numeric not null default 0
);
create index if not exists venta_items_venta_idx on venta_items(venta_id);

-- ============================================================
--  Seguridad (RLS): solo usuarios con sesión pueden ver/editar
-- ============================================================
alter table productos    enable row level security;
alter table clientes     enable row level security;
alter table ventas       enable row level security;
alter table venta_items  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['productos','clientes','ventas','venta_items'] loop
    execute format('drop policy if exists "acceso_autenticado" on %I', t);
    execute format($f$create policy "acceso_autenticado" on %I
      for all to authenticated using (true) with check (true)$f$, t);
  end loop;
end $$;


-- ===== Gastos y Préstamos (incluido) =====

create table if not exists gastos (
  id         uuid primary key default gen_random_uuid(),
  fecha      date not null default current_date,
  concepto   text not null,
  categoria  text default 'Otro',
  monto      numeric not null default 0,
  nota       text,
  creado     timestamptz default now()
);
create index if not exists gastos_fecha_idx on gastos(fecha);

create table if not exists prestamos (
  id       uuid primary key default gen_random_uuid(),
  persona  text not null,
  tipo     text not null default 'me_deben',  -- 'me_deben' | 'yo_debo'
  monto    numeric not null default 0,
  fecha    date not null default current_date,
  estado   text not null default 'activo',     -- 'activo' | 'saldado'
  nota     text,
  creado   timestamptz default now()
);

alter table gastos    enable row level security;
alter table prestamos enable row level security;

do $$
declare t text;
begin
  foreach t in array array['gastos','prestamos'] loop
    execute format('drop policy if exists "acceso_autenticado" on %I', t);
    execute format($f$create policy "acceso_autenticado" on %I
      for all to authenticated using (true) with check (true)$f$, t);
  end loop;
end $$;
