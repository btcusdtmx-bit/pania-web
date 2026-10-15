-- PANIA | Optimización del Radar
-- Conserva fórmulas, security_invoker y políticas RLS.

create or replace view public.v_fuga_insumos_dia
with (security_invoker = true) as
select
  o.empresa_id,
  o.sucursal_id,
  o.fecha,
  round(
    sum(
      greatest(0, pc.cantidad_real - pc.cantidad_teorica)
      * coalesce(pc.costo_unitario, 0)
    ), 2
  ) as fuga_insumos
from public.ordenes_produccion o
join public.produccion_consumo pc
  on pc.orden_id = o.id
where o.estado = 'cerrada'
group by o.empresa_id, o.sucursal_id, o.fecha;

create or replace view public.v_fuga_sobreproduccion_dia
with (security_invoker = true) as
with dia as (
  select
    o.empresa_id,
    o.sucursal_id,
    o.fecha,
    pd.producto_id,
    sum(pd.piezas_reales) as producido,
    max(coalesce(pd.costo_real_pieza, 0)) as costo
  from public.ordenes_produccion o
  join public.produccion_detalle pd
    on pd.orden_id = o.id
  where o.estado = 'cerrada'
  group by 1,2,3,4
),
ventas_dia as (
  select
    v.empresa_id,
    v.sucursal_id,
    (v.fecha_hora at time zone 'America/Mexico_City')::date as fecha,
    d.producto_id,
    sum(d.cantidad) as vendido
  from public.ventas v
  join public.venta_detalle d
    on d.venta_id = v.id
  where v.estado = 'cerrada'
  group by 1,2,3,4
),
mermas_dia as (
  select
    empresa_id,
    sucursal_id,
    fecha,
    producto_id,
    sum(cantidad) as merma_alm
  from public.mermas
  where origen = 'almacen'
  group by 1,2,3,4
),
exc as (
  select
    dia.*,
    greatest(
      0,
      dia.producido
      - coalesce(v.vendido, 0)
      - coalesce(m.merma_alm, 0)
    ) as excedente
  from dia
  left join ventas_dia v
    on v.empresa_id = dia.empresa_id
   and v.sucursal_id = dia.sucursal_id
   and v.fecha = dia.fecha
   and v.producto_id = dia.producto_id
  left join mermas_dia m
    on m.empresa_id = dia.empresa_id
   and m.sucursal_id = dia.sucursal_id
   and m.fecha = dia.fecha
   and m.producto_id = dia.producto_id
),
base as (
  select
    *,
    coalesce(
      avg(excedente) over (
        partition by empresa_id, sucursal_id, producto_id
        order by fecha
        rows between 28 preceding and 1 preceding
      ), 0
    ) as excedente_normal
  from exc
)
select
  empresa_id,
  sucursal_id,
  fecha,
  round(
    sum(
      greatest(0, excedente - excedente_normal) * costo
    ), 2
  ) as fuga_sobreproduccion
from base
group by 1,2,3;
