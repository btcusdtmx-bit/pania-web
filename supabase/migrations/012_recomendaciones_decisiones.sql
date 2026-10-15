-- PANIA 1.9.0 — Recomendaciones explicables basadas en evidencia
-- No usa LLM ni inventa causalidad: transforma alertas verificables en decisiones priorizadas.
create or replace view v_recomendaciones_pania as
select empresa_id,sucursal_id,tipo,
case severidad when 'critica' then 1 when 'alta' then 2 when 'media' then 3 else 4 end prioridad,
severidad,titulo as hallazgo,detalle as evidencia,coalesce(valor_afectado,0)::numeric(14,2) impacto_estimado,
accion as recomendacion,
case tipo
 when 'inventario_bajo' then '/inventario'
 when 'stock_negativo' then '/inventario'
 when 'fuga_utilidad' then '/radar'
 when 'flujo_negativo' then '/finanzas'
 when 'presupuesto_excedido' then '/presupuestos'
 when 'bajo_equilibrio' then '/presupuestos'
 when 'cliente_riesgo' then '/clientes'
 when 'roi_negativo' then '/marketing'
 else '/alertas' end ruta_accion,
'REGLA_VERIFICABLE'::text origen
from v_alertas_pania;

create or replace view v_decision_resumen as
select empresa_id,
count(*)::int recomendaciones_activas,
count(*) filter(where prioridad=1)::int criticas,
count(*) filter(where prioridad=2)::int altas,
coalesce(sum(impacto_estimado),0)::numeric(14,2) impacto_total_referencial,
max(impacto_estimado)::numeric(14,2) mayor_impacto
from v_recomendaciones_pania group by empresa_id;
