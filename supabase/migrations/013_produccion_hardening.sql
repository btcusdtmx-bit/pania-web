-- PANIA 2.0.0 — Verificación/hardening no destructivo
-- No recrea módulos previos. Falla de forma explícita si faltan dependencias críticas.
do $$
declare faltantes text[];
begin
 select array_agg(x) into faltantes from unnest(array[
  'empresas','perfiles','productos','ingredientes','ventas','movimientos_inventario',
  'gastos','movimientos_dinero','clientes','campanas_marketing','alertas_config'
 ]) x where to_regclass('public.'||x) is null;
 if faltantes is not null then raise exception 'PANIA 2.0: faltan objetos críticos: %', array_to_string(faltantes, ', '); end if;
end $$;

-- Índices seguros para consultas operativas frecuentes.
create index if not exists idx_ventas_empresa_sucursal_fecha on ventas(empresa_id,sucursal_id,fecha_hora);
create index if not exists idx_gastos_empresa_sucursal_fecha on gastos(empresa_id,sucursal_id,fecha);
create index if not exists idx_movdin_empresa_sucursal_fecha on movimientos_dinero(empresa_id,sucursal_id,fecha);
create index if not exists idx_clientes_empresa_activo on clientes(empresa_id,activo);
create index if not exists idx_campanas_empresa_estado on campanas_marketing(empresa_id,estado);
