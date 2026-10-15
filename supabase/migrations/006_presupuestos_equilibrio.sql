-- PANIA 1.3.0 — Presupuestos + punto de equilibrio
create table if not exists presupuestos_gasto(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id) on delete cascade,
 sucursal_id uuid references sucursales(id), categoria_id uuid references categorias_gasto(id),
 periodo date not null, monto numeric(14,2) not null check(monto>=0), notas text,
 created_by uuid references auth.users(id), created_at timestamptz not null default now(),
 unique(empresa_id,sucursal_id,categoria_id,periodo)
);
alter table presupuestos_gasto enable row level security;
create policy presupuestos_select on presupuestos_gasto for select using(empresa_id=mi_empresa_id());
create policy presupuestos_write on presupuestos_gasto for all using(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador')) with check(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador'));

create or replace view v_presupuesto_vs_real as
select p.id,p.empresa_id,p.sucursal_id,p.categoria_id,p.periodo,p.monto presupuesto,
coalesce(sum(g.monto),0)::numeric(14,2) real,
(p.monto-coalesce(sum(g.monto),0))::numeric(14,2) disponible
from presupuestos_gasto p left join gastos g on g.empresa_id=p.empresa_id
 and g.categoria_id is not distinct from p.categoria_id and g.sucursal_id is not distinct from p.sucursal_id
 and date_trunc('month',g.fecha)::date=p.periodo
group by p.id;

create or replace view v_punto_equilibrio_mes as
with ventas as(
 select empresa_id,sucursal_id,date_trunc('month',fecha)::date periodo,
 sum(ventas_netas)::numeric(14,2) ventas_netas,sum(utilidad_bruta)::numeric(14,2) margen_contribucion
 from v_radar_utilidad_dia group by 1,2,3
), fijos as(
 select empresa_id,sucursal_id,date_trunc('month',fecha)::date periodo,
 sum(monto)::numeric(14,2) gastos_fijos from gastos where tipo='fijo' group by 1,2,3
)
select v.empresa_id,v.sucursal_id,v.periodo,v.ventas_netas,v.margen_contribucion,
coalesce(f.gastos_fijos,0)::numeric(14,2) gastos_fijos,
case when v.ventas_netas>0 then (v.margen_contribucion/v.ventas_netas) else 0 end::numeric(12,6) margen_contribucion_pct,
case when v.margen_contribucion>0 and v.ventas_netas>0 then (coalesce(f.gastos_fijos,0)/(v.margen_contribucion/v.ventas_netas)) else null end::numeric(14,2) ventas_equilibrio,
case when v.margen_contribucion>0 and v.ventas_netas>0 then (v.ventas_netas-(coalesce(f.gastos_fijos,0)/(v.margen_contribucion/v.ventas_netas))) else null end::numeric(14,2) margen_seguridad
from ventas v left join fijos f on f.empresa_id=v.empresa_id and f.sucursal_id is not distinct from v.sucursal_id and f.periodo=v.periodo;
