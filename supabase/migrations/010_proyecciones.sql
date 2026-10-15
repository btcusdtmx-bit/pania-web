-- PANIA 1.7.0 — Proyecciones deterministas de corto plazo
-- ESTIMACIONES: promedio móvil de hasta 28 días reales; nunca sustituye cifras reales.
create or replace view v_proyeccion_ventas_utilidad as
with base as(
 select empresa_id,sucursal_id,
 count(distinct fecha)::int dias_con_datos,
 avg(ventas_netas)::numeric(14,2) venta_diaria_estimada,
 avg(utilidad_bruta)::numeric(14,2) utilidad_diaria_estimada,
 max(fecha) ultima_fecha
 from v_utilidad_dia where fecha>=current_date-27 group by 1,2
)
select empresa_id,sucursal_id,dias_con_datos,ultima_fecha,venta_diaria_estimada,utilidad_diaria_estimada,
(venta_diaria_estimada*7)::numeric(14,2) ventas_7d,
(utilidad_diaria_estimada*7)::numeric(14,2) utilidad_7d,
(venta_diaria_estimada*30)::numeric(14,2) ventas_30d,
(utilidad_diaria_estimada*30)::numeric(14,2) utilidad_30d,
case when dias_con_datos>=21 then 'alta' when dias_con_datos>=7 then 'media' else 'baja' end::text calidad
from base;

create or replace view v_proyeccion_flujo as
with base as(
 select empresa_id,sucursal_id,count(distinct fecha)::int dias_con_datos,
 avg(entradas)::numeric(14,2) entrada_diaria_estimada,
 avg(salidas)::numeric(14,2) salida_diaria_estimada,
 avg(flujo_neto)::numeric(14,2) flujo_diario_estimado,max(fecha) ultima_fecha
 from v_flujo_efectivo_dia where fecha>=current_date-27 group by 1,2
)
select empresa_id,sucursal_id,dias_con_datos,ultima_fecha,entrada_diaria_estimada,salida_diaria_estimada,flujo_diario_estimado,
(flujo_diario_estimado*7)::numeric(14,2) flujo_7d,
(flujo_diario_estimado*30)::numeric(14,2) flujo_30d,
case when dias_con_datos>=21 then 'alta' when dias_con_datos>=7 then 'media' else 'baja' end::text calidad
from base;
