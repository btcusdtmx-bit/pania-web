-- PANIA 1.1.0 — Gastos y utilidad operativa
DO $$
BEGIN
  CREATE TYPE tipo_gasto AS ENUM ('fijo','variable');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE destino_gasto AS ENUM ('operativo','marketing');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

create table if not exists categorias_gasto (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nombre text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (empresa_id,nombre)
);

create table if not exists gastos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  sucursal_id uuid references sucursales(id),
  categoria_id uuid references categorias_gasto(id),
  fecha date not null default current_date,
  concepto text not null,
  proveedor text,
  tipo tipo_gasto not null default 'variable',
  destino destino_gasto not null default 'operativo',
  forma_pago text,
  referencia text,
  comprobante_url text,
  monto numeric(14,2) not null check (monto > 0),
  notas text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists gastos_empresa_fecha_idx on gastos(empresa_id,fecha desc);
alter table categorias_gasto enable row level security;
alter table gastos enable row level security;

drop policy if exists categorias_gasto_empresa on categorias_gasto;
create policy categorias_gasto_empresa on categorias_gasto for select using (empresa_id=mi_empresa_id());
drop policy if exists categorias_gasto_admin on categorias_gasto;
create policy categorias_gasto_admin on categorias_gasto for all using (empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador')) with check (empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador'));

drop policy if exists gastos_empresa on gastos;
create policy gastos_empresa on gastos for select using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id is null or sucursal_id=mi_sucursal_id()));
drop policy if exists gastos_insert on gastos;
create policy gastos_insert on gastos for insert with check (empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador'));
drop policy if exists gastos_update on gastos;
create policy gastos_update on gastos for update using (empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador')) with check (empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador'));

create or replace view v_gastos_dia as
select empresa_id,sucursal_id,fecha,
 sum(monto)::numeric(14,2) gastos_totales,
 sum(monto) filter(where tipo='fijo')::numeric(14,2) gastos_fijos,
 sum(monto) filter(where tipo='variable')::numeric(14,2) gastos_variables,
 sum(monto) filter(where destino='marketing')::numeric(14,2) gastos_marketing
from gastos group by empresa_id,sucursal_id,fecha;

create or replace view v_utilidad_operativa_dia as
select r.*, coalesce(g.gastos_totales,0)::numeric(14,2) gastos_operativos,
 (r.utilidad_bruta-coalesce(g.gastos_totales,0))::numeric(14,2) utilidad_operativa
from v_radar_utilidad_dia r
left join v_gastos_dia g on g.empresa_id=r.empresa_id and g.sucursal_id=r.sucursal_id and g.fecha=r.fecha;
