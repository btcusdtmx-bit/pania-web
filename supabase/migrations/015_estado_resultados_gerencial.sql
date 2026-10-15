-- PANIA 2.1 — Estado de resultados gerencial mensual
create or replace view v_estado_resultados_gerencial as
with u as (
 select empresa_id,sucursal_id,date_trunc('month',fecha)::date periodo,
 sum(ventas_netas)::numeric(14,2) ventas_netas,
 sum(ventas_netas-utilidad_bruta)::numeric(14,2) costo_ventas,
 sum(utilidad_bruta)::numeric(14,2) utilidad_bruta
 from v_radar_utilidad_dia group by 1,2,3
), g as (
 select empresa_id,sucursal_id,date_trunc('month',fecha)::date periodo,
 sum(monto) filter(where destino='operativo')::numeric(14,2) gastos_operativos,
 sum(monto) filter(where destino='marketing')::numeric(14,2) gastos_marketing
 from gastos group by 1,2,3
), f as (
 select empresa_id,sucursal_id,date_trunc('month',fecha)::date periodo,
 sum(entradas)::numeric(14,2) entradas_efectivo,sum(salidas)::numeric(14,2) salidas_efectivo,
 sum(flujo_neto)::numeric(14,2) flujo_neto from v_flujo_efectivo_dia group by 1,2,3
)
select u.empresa_id,u.sucursal_id,u.periodo,u.ventas_netas,u.costo_ventas,u.utilidad_bruta,
 coalesce(g.gastos_operativos,0)::numeric(14,2) gastos_operativos,
 coalesce(g.gastos_marketing,0)::numeric(14,2) gastos_marketing,
 (u.utilidad_bruta-coalesce(g.gastos_operativos,0)-coalesce(g.gastos_marketing,0))::numeric(14,2) utilidad_operativa,
 case when u.ventas_netas>0 then (u.utilidad_bruta/u.ventas_netas) else 0 end::numeric(12,4) margen_bruto_pct,
 case when u.ventas_netas>0 then ((u.utilidad_bruta-coalesce(g.gastos_operativos,0)-coalesce(g.gastos_marketing,0))/u.ventas_netas) else 0 end::numeric(12,4) margen_operativo_pct,
 coalesce(f.entradas_efectivo,0)::numeric(14,2) entradas_efectivo,coalesce(f.salidas_efectivo,0)::numeric(14,2) salidas_efectivo,coalesce(f.flujo_neto,0)::numeric(14,2) flujo_neto
from u left join g on g.empresa_id=u.empresa_id and g.sucursal_id is not distinct from u.sucursal_id and g.periodo=u.periodo
left join f on f.empresa_id=u.empresa_id and f.sucursal_id is not distinct from u.sucursal_id and f.periodo=u.periodo;
alter view v_estado_resultados_gerencial set (security_invoker=true);
