-- PANIA 1.4.0 — Clientes, historial y recurrencia
create table if not exists clientes(
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id) on delete cascade,
 nombre text not null, telefono text, email text, fecha_nacimiento date, notas text, activo boolean not null default true,
 created_by uuid references auth.users(id), created_at timestamptz not null default now()
);
create unique index if not exists clientes_empresa_telefono_uq on clientes(empresa_id,telefono) where telefono is not null and telefono<>'';
alter table ventas add column if not exists cliente_id uuid references clientes(id);
create index if not exists ventas_cliente_idx on ventas(cliente_id,fecha_hora desc);
alter table clientes enable row level security;
create policy clientes_select on clientes for select using(empresa_id=mi_empresa_id());
create policy clientes_write on clientes for all using(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador','encargado','caja')) with check(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador','encargado','caja'));

create or replace view v_clientes_recurrencia as
select c.id,c.empresa_id,c.nombre,c.telefono,c.email,c.fecha_nacimiento,c.activo,
count(v.id) filter(where v.estado='cerrada')::int compras,
max(v.fecha_hora) filter(where v.estado='cerrada') ultima_compra,
coalesce(sum(x.total),0)::numeric(14,2) gasto_acumulado,
case when count(v.id) filter(where v.estado='cerrada')>0 then (coalesce(sum(x.total),0)/count(v.id) filter(where v.estado='cerrada')) else 0 end::numeric(14,2) ticket_promedio,
case when max(v.fecha_hora) filter(where v.estado='cerrada') is null then null else current_date-max(v.fecha_hora)::date end dias_sin_comprar
from clientes c left join ventas v on v.cliente_id=c.id
left join lateral (select coalesce(sum(d.cantidad*d.precio_unitario_neto),0) total from venta_detalle d where d.venta_id=v.id) x on true
group by c.id;
