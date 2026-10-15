-- PANIA 1.2.0 — Caja, bancos y flujo de efectivo
DO $$
BEGIN
  CREATE TYPE tipo_cuenta_dinero AS ENUM ('caja','banco');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE tipo_movimiento_dinero AS ENUM ('entrada','salida','transferencia');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

create table if not exists cuentas_dinero(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id) on delete cascade,
 sucursal_id uuid references sucursales(id), nombre text not null, tipo tipo_cuenta_dinero not null,
 banco text, numero_referencia text, saldo_inicial numeric(14,2) not null default 0, activa boolean not null default true,
 created_at timestamptz not null default now()
);
create table if not exists movimientos_dinero(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id) on delete cascade,
 sucursal_id uuid references sucursales(id), cuenta_id uuid not null references cuentas_dinero(id),
 fecha date not null default current_date, tipo tipo_movimiento_dinero not null, concepto text not null,
 monto numeric(14,2) not null check(monto>0), referencia text, origen text, origen_id uuid,
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create index if not exists mov_dinero_empresa_fecha_idx on movimientos_dinero(empresa_id,fecha desc);
alter table cuentas_dinero enable row level security; alter table movimientos_dinero enable row level security;
create policy cuentas_dinero_select on cuentas_dinero for select using(empresa_id=mi_empresa_id());
create policy cuentas_dinero_write on cuentas_dinero for all using(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador')) with check(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador'));
create policy movimientos_dinero_select on movimientos_dinero for select using(empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id is null or sucursal_id=mi_sucursal_id()));
create policy movimientos_dinero_insert on movimientos_dinero for insert with check(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador','caja'));

create or replace view v_saldos_dinero as
select c.id,c.empresa_id,c.sucursal_id,c.nombre,c.tipo,c.banco,
(c.saldo_inicial+coalesce(sum(case when m.tipo='entrada' then m.monto when m.tipo='salida' then -m.monto else 0 end),0))::numeric(14,2) saldo
from cuentas_dinero c left join movimientos_dinero m on m.cuenta_id=c.id group by c.id;

create or replace view v_flujo_efectivo_dia as
select empresa_id,sucursal_id,fecha,
coalesce(sum(monto) filter(where tipo='entrada'),0)::numeric(14,2) entradas,
coalesce(sum(monto) filter(where tipo='salida'),0)::numeric(14,2) salidas,
(coalesce(sum(monto) filter(where tipo='entrada'),0)-coalesce(sum(monto) filter(where tipo='salida'),0))::numeric(14,2) flujo_neto
from movimientos_dinero group by empresa_id,sucursal_id,fecha;
