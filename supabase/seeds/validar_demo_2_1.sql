select 'clientes DEMO' objeto,count(*) cantidad from clientes where nombre like 'DEMO %'
union all select 'campañas DEMO',count(*) from campanas_marketing where nombre like 'DEMO %'
union all select 'gastos DEMO',count(*) from gastos where referencia like 'DEMO21-%'
union all select 'cuentas DEMO',count(*) from cuentas_dinero where nombre like 'DEMO %'
union all select 'movimientos DEMO',count(*) from movimientos_dinero where referencia like 'DEMO21-%';
select * from v_estado_resultados_gerencial order by periodo desc limit 2;
select * from v_recomendaciones_pania order by prioridad,impacto_estimado desc limit 10;
