select 'clientes_activos' objeto,count(*) cantidad from clientes where activo
union all select 'campanas',count(*) from campanas_marketing
union all select 'gastos',count(*) from gastos
union all select 'cuentas_dinero',count(*) from cuentas_dinero
union all select 'movimientos_dinero',count(*) from movimientos_dinero
union all select 'presupuestos',count(*) from presupuestos_gasto;
select * from v_estado_resultados_gerencial order by periodo desc limit 3;
select tipo,severidad,count(*) eventos,sum(impacto_estimado) impacto from v_recomendaciones_pania group by tipo,severidad order by sum(impacto_estimado) desc nulls last;
