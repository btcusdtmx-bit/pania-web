-- PANIA 2.5.0 — Operación Real de Panadería
-- Ticket, compras contado/crédito, pagos a proveedores y resumen operativo.

alter table ventas add column if not exists folio_ticket text;
alter table ventas add column if not exists efectivo_recibido numeric(14,2);
alter table ventas add column if not exists cambio numeric(14,2);
create unique index if not exists ventas_folio_ticket_uq on ventas(empresa_id, folio_ticket) where folio_ticket is not null;

alter table compras add column if not exists condicion_pago text not null default 'contado';
alter table compras drop constraint if exists compras_condicion_pago_check;
alter table compras add constraint compras_condicion_pago_check check (condicion_pago in ('contado','credito'));

create table if not exists pagos_proveedor (
 id uuid primary key default gen_random_uuid(),
 empresa_id uuid not null references empresas(id) on delete cascade,
 compra_id uuid not null references compras(id) on delete cascade,
 fecha date not null default current_date,
 monto numeric(14,2) not null check (monto > 0),
 forma_pago text,
 referencia text,
 creado_por uuid references perfiles(id),
 creado_en timestamptz not null default now()
);
create index if not exists pagos_proveedor_compra_idx on pagos_proveedor(compra_id,fecha desc);
alter table pagos_proveedor enable row level security;
drop policy if exists p250_pagos_proveedor_select on pagos_proveedor;
create policy p250_pagos_proveedor_select on pagos_proveedor for select to authenticated
 using (empresa_id=mi_empresa_id() and tiene_permiso('compras','ver'));
drop policy if exists p250_pagos_proveedor_insert on pagos_proveedor;
create policy p250_pagos_proveedor_insert on pagos_proveedor for insert to authenticated
 with check (empresa_id=mi_empresa_id() and tiene_permiso('compras','crear'));

create or replace view v_compras_saldo with (security_invoker=true) as
select c.id,c.empresa_id,c.sucursal_id,c.proveedor_id,c.fecha,c.folio_factura,c.forma_pago,c.condicion_pago,c.vence_el,
 coalesce(d.total,0)::numeric(14,2) total,
 coalesce(p.pagado,0)::numeric(14,2) pagado,
 greatest(coalesce(d.total,0)-coalesce(p.pagado,0),0)::numeric(14,2) saldo,
 case when greatest(coalesce(d.total,0)-coalesce(p.pagado,0),0)=0 then 'pagada'
      when c.vence_el is not null and c.vence_el < current_date then 'vencida'
      else 'pendiente' end estado_pago
from compras c
left join (select compra_id,sum(subtotal) total from compra_detalle group by compra_id) d on d.compra_id=c.id
left join (select compra_id,sum(monto) pagado from pagos_proveedor group by compra_id) p on p.compra_id=c.id;

-- Las compras de contado se consideran pagadas al total registrado sin duplicar captura.
create or replace view v_compras_saldo_real with (security_invoker=true) as
select v.*,
 case when condicion_pago='contado' then total else pagado end pagado_real,
 case when condicion_pago='contado' then 0 else saldo end saldo_real,
 case when condicion_pago='contado' then 'pagada' else estado_pago end estado_real
from v_compras_saldo v;

create table if not exists cobros_credito (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id) on delete cascade,
 venta_id uuid not null references ventas(id) on delete cascade, fecha date not null default current_date,
 monto numeric(14,2) not null check(monto>0), forma_pago text, referencia text,
 creado_por uuid references perfiles(id), creado_en timestamptz not null default now()
);
alter table cobros_credito enable row level security;
drop policy if exists p250_cobros_select on cobros_credito;
create policy p250_cobros_select on cobros_credito for select to authenticated using(empresa_id=mi_empresa_id() and tiene_permiso('ventas','ver'));
drop policy if exists p250_cobros_insert on cobros_credito;
create policy p250_cobros_insert on cobros_credito for insert to authenticated with check(empresa_id=mi_empresa_id() and tiene_permiso('ventas','crear'));

create or replace view v_ventas_credito_saldo with (security_invoker=true) as
select v.id,v.empresa_id,v.sucursal_id,v.fecha_hora,v.cliente_id,
 coalesce(d.total,0)::numeric(14,2) total,coalesce(c.cobrado,0)::numeric(14,2) cobrado,
 greatest(coalesce(d.total,0)-coalesce(c.cobrado,0),0)::numeric(14,2) saldo
from ventas v
left join (select venta_id,sum(cantidad*precio_unitario_neto*(1+coalesce(iva_tasa,0))) total from venta_detalle group by venta_id) d on d.venta_id=v.id
left join (select venta_id,sum(monto) cobrado from cobros_credito group by venta_id) c on c.venta_id=v.id
where v.estado='cerrada' and v.forma_pago='credito';

create or replace function registrar_venta_pos(
  p_sucursal uuid, p_canal text, p_forma_pago text, p_turno text,
  p_cliente uuid, p_campana uuid, p_lineas jsonb,
  p_efectivo_recibido numeric default null
) returns uuid
language plpgsql set search_path = public as $$
declare v_emp uuid:=mi_empresa_id(); v_id uuid; v_total numeric; v_folio text;
begin
 if v_emp is null then raise exception 'Sin empresa activa'; end if;
 if coalesce(mi_rol()::text,'') not in ('dueno','administrador','encargado','caja') then raise exception 'Tu rol no puede registrar ventas'; end if;
 if p_lineas is null or jsonb_typeof(p_lineas)<>'array' or jsonb_array_length(p_lineas)=0 then raise exception 'La venta no tiene productos'; end if;
 if exists(select 1 from jsonb_array_elements(p_lineas) x left join productos p on p.id=(x->>'producto_id')::uuid and p.empresa_id=v_emp and p.activo where p.id is null or coalesce((x->>'cantidad')::numeric,0)<=0) then raise exception 'Hay productos inválidos o cantidades en cero'; end if;
 select coalesce(sum((x->>'cantidad')::numeric*p.precio_publico),0) into v_total from jsonb_array_elements(p_lineas) x join productos p on p.id=(x->>'producto_id')::uuid;
 if p_forma_pago='efectivo' and p_efectivo_recibido is not null and p_efectivo_recibido<v_total then raise exception 'El efectivo recibido es menor al total'; end if;
 insert into ventas(empresa_id,sucursal_id,vendedor_id,canal,forma_pago,turno,cliente_id,campana_id,estado,efectivo_recibido,cambio)
 values(v_emp,p_sucursal,auth.uid(),coalesce(nullif(p_canal,''),'mostrador')::canal_venta,nullif(p_forma_pago,''),nullif(p_turno,''),p_cliente,p_campana,'cerrada',p_efectivo_recibido,
 case when p_forma_pago='efectivo' and p_efectivo_recibido is not null then greatest(p_efectivo_recibido-v_total,0) else null end) returning id into v_id;
 v_folio:='PAN-'||to_char(current_date,'YYYYMMDD')||'-'||upper(substr(replace(v_id::text,'-',''),1,8));
 update ventas set folio_ticket=v_folio where id=v_id;
 insert into venta_detalle(empresa_id,venta_id,producto_id,cantidad)
 select v_emp,v_id,(x->>'producto_id')::uuid,(x->>'cantidad')::numeric from jsonb_array_elements(p_lineas) x;
 return v_id;
end $$;
revoke all on function registrar_venta_pos(uuid,text,text,text,uuid,uuid,jsonb,numeric) from public;
grant execute on function registrar_venta_pos(uuid,text,text,text,uuid,uuid,jsonb,numeric) to authenticated;

create or replace view v_resumen_dinero_real with (security_invoker=true) as
select e.id empresa_id,
 coalesce((select sum(saldo) from v_saldos_dinero s where s.empresa_id=e.id),0)::numeric(14,2) tengo,
 coalesce((select sum(saldo_real) from v_compras_saldo_real c where c.empresa_id=e.id),0)::numeric(14,2) debo,
 coalesce((select sum(saldo) from v_ventas_credito_saldo v where v.empresa_id=e.id),0)::numeric(14,2) me_deben
from empresas e;
