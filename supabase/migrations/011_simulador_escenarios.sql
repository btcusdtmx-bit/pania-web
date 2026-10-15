-- PANIA 1.8.0 — Base real para simulador ¿Qué pasa si?
-- El simulador no escribe escenarios ni altera datos operativos.
create or replace view v_simulador_base as
with u as(
 select empresa_id,sucursal_id,
 coalesce(avg(ventas_netas),0)::numeric(14,2) ventas_dia,
 coalesce(avg(costo_vendido),0)::numeric(14,2) costo_dia,
 coalesce(avg(utilidad_bruta),0)::numeric(14,2) utilidad_bruta_dia,
 count(distinct fecha)::int dias_datos
 from v_utilidad_dia where fecha>=current_date-27 group by 1,2
), g as(
 select empresa_id,sucursal_id,
 coalesce(avg(gastos_totales),0)::numeric(14,2) gastos_dia,
 coalesce(avg(gastos_fijos),0)::numeric(14,2) gastos_fijos_dia,
 coalesce(avg(gastos_variables),0)::numeric(14,2) gastos_variables_dia
 from v_gastos_dia where fecha>=current_date-27 group by 1,2
), r as(
 select empresa_id,sucursal_id,
 coalesce(avg(fugas_medibles),0)::numeric(14,2) fugas_dia
 from v_radar_utilidad_dia where fecha>=current_date-27 group by 1,2
)
select u.empresa_id,u.sucursal_id,u.dias_datos,u.ventas_dia,u.costo_dia,u.utilidad_bruta_dia,
coalesce(g.gastos_dia,0)::numeric(14,2) gastos_dia,
coalesce(g.gastos_fijos_dia,0)::numeric(14,2) gastos_fijos_dia,
coalesce(g.gastos_variables_dia,0)::numeric(14,2) gastos_variables_dia,
coalesce(r.fugas_dia,0)::numeric(14,2) fugas_dia,
(u.utilidad_bruta_dia-coalesce(g.gastos_dia,0))::numeric(14,2) utilidad_operativa_dia
from u left join g on g.empresa_id=u.empresa_id and g.sucursal_id is not distinct from u.sucursal_id
left join r on r.empresa_id=u.empresa_id and r.sucursal_id is not distinct from u.sucursal_id;
