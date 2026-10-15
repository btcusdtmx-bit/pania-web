-- PANIA 1.5.0 — Marketing, campañas y ROI atribuible
create table if not exists campanas_marketing(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id) on delete cascade,
 nombre text not null, canal text not null, fecha_inicio date not null, fecha_fin date,
 presupuesto numeric(14,2) not null default 0 check(presupuesto>=0),
 objetivo text, estado text not null default 'activa' check(estado in ('borrador','activa','pausada','finalizada')),
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
alter table ventas add column if not exists campana_id uuid references campanas_marketing(id);
alter table gastos add column if not exists campana_id uuid references campanas_marketing(id);
create index if not exists ventas_campana_idx on ventas(campana_id);
create index if not exists gastos_campana_idx on gastos(campana_id);
alter table campanas_marketing enable row level security;
create policy campanas_select on campanas_marketing for select using(empresa_id=mi_empresa_id());
create policy campanas_write on campanas_marketing for all using(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador','marketing')) with check(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador','marketing'));

create or replace view v_campanas_roi as
with vv as(
 select v.campana_id,count(distinct v.id)::int ventas_atribuidas,
 count(distinct v.cliente_id) filter(where v.cliente_id is not null)::int clientes_atribuidos,
 coalesce(sum(d.cantidad*d.precio_unitario_neto),0)::numeric(14,2) ingresos_atribuidos
 from ventas v left join venta_detalle d on d.venta_id=v.id
 where v.estado='cerrada' and v.campana_id is not null group by v.campana_id
), gg as(
 select campana_id,coalesce(sum(monto),0)::numeric(14,2) gasto_real from gastos
 where campana_id is not null group by campana_id
)
select c.*,coalesce(vv.ventas_atribuidas,0) ventas_atribuidas,coalesce(vv.clientes_atribuidos,0) clientes_atribuidos,
coalesce(vv.ingresos_atribuidos,0)::numeric(14,2) ingresos_atribuidos,coalesce(gg.gasto_real,0)::numeric(14,2) gasto_real,
case when coalesce(gg.gasto_real,0)>0 then ((coalesce(vv.ingresos_atribuidos,0)-gg.gasto_real)/gg.gasto_real) else null end::numeric(12,4) roi,
case when coalesce(vv.ventas_atribuidas,0)>0 then (coalesce(gg.gasto_real,0)/vv.ventas_atribuidas) else null end::numeric(14,2) costo_por_venta
from campanas_marketing c left join vv on vv.campana_id=c.id left join gg on gg.campana_id=c.id;
