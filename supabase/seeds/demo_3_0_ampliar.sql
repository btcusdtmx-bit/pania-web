-- PANIA DEMO 3.0 — ampliación gerencial sobre el DEMO existente.
-- No duplica ventas ni reemplaza datos reales: agrega variedad a gastos, clientes, campañas y flujo DEMO.
do $$
declare emp uuid; suc uuid; usr uuid; cat_renta uuid; cat_mant uuid; banco uuid; camp uuid; i int;
begin
 select p.empresa_id,p.sucursal_id,p.id into emp,suc,usr from perfiles p where p.activo order by case when p.rol='dueno' then 0 else 1 end limit 1;
 if emp is null then raise exception 'No existe perfil activo'; end if;
 insert into categorias_gasto(empresa_id,nombre) values(emp,'Renta DEMO 3.0'),(emp,'Mantenimiento DEMO 3.0') on conflict(empresa_id,nombre) do nothing;
 select id into cat_renta from categorias_gasto where empresa_id=emp and nombre='Renta DEMO 3.0'; select id into cat_mant from categorias_gasto where empresa_id=emp and nombre='Mantenimiento DEMO 3.0';
 insert into gastos(empresa_id,sucursal_id,categoria_id,fecha,concepto,proveedor,tipo,destino,forma_pago,referencia,monto,created_by)
 select emp,suc,cat_renta,date_trunc('month',current_date)::date+1,'Renta del local DEMO','Arrendador DEMO','fijo','operativo','transferencia','DEMO30-RENTA',8500,usr where not exists(select 1 from gastos where empresa_id=emp and referencia='DEMO30-RENTA');
 insert into gastos(empresa_id,sucursal_id,categoria_id,fecha,concepto,proveedor,tipo,destino,forma_pago,referencia,monto,created_by)
 select emp,suc,cat_mant,current_date-3,'Mantenimiento de horno DEMO','Servicio técnico','variable','operativo','transferencia','DEMO30-MANT',1850,usr where not exists(select 1 from gastos where empresa_id=emp and referencia='DEMO30-MANT');
 insert into clientes(empresa_id,nombre,telefono,email,notas,created_by)
 select emp,'DEMO 3.0 Cliente '||i,'2290030'||lpad(i::text,3,'0'),'cliente'||i||'@demo.pania.local',case when i<=4 then 'Frecuente' when i<=8 then 'Ocasional' else 'Nuevo' end,usr from generate_series(1,12) i
 on conflict(empresa_id,telefono) where telefono is not null and telefono<>'' do nothing;
 insert into campanas_marketing(empresa_id,nombre,canal,fecha_inicio,fecha_fin,presupuesto,objetivo,estado,created_by)
 select emp,'DEMO 3.0 Combo café + pan','Instagram',current_date-14,current_date+7,1200,'Aumentar ticket promedio','activa',usr where not exists(select 1 from campanas_marketing where empresa_id=emp and nombre='DEMO 3.0 Combo café + pan');
 select id into camp from campanas_marketing where empresa_id=emp and nombre='DEMO 3.0 Combo café + pan';
 select id into banco from cuentas_dinero where empresa_id=emp and tipo='banco' order by created_at limit 1;
 if banco is not null then
  insert into movimientos_dinero(empresa_id,sucursal_id,cuenta_id,fecha,tipo,concepto,monto,referencia,origen,created_by)
  select emp,suc,banco,date_trunc('month',current_date)::date+1,'salida','Pago renta DEMO',8500,'DEMO30-FLUJO-RENTA','gasto',usr where not exists(select 1 from movimientos_dinero where empresa_id=emp and referencia='DEMO30-FLUJO-RENTA');
  insert into movimientos_dinero(empresa_id,sucursal_id,cuenta_id,fecha,tipo,concepto,monto,referencia,origen,created_by)
  select emp,suc,banco,current_date-3,'salida','Mantenimiento horno DEMO',1850,'DEMO30-FLUJO-MANT','gasto',usr where not exists(select 1 from movimientos_dinero where empresa_id=emp and referencia='DEMO30-FLUJO-MANT');
 end if;
 insert into presupuestos_gasto(empresa_id,sucursal_id,categoria_id,periodo,monto,notas,created_by)
 values(emp,suc,cat_renta,date_trunc('month',current_date)::date,8500,'DEMO 3.0',usr),(emp,suc,cat_mant,date_trunc('month',current_date)::date,1500,'DEMO 3.0: excedido intencionalmente',usr)
 on conflict(empresa_id,sucursal_id,categoria_id,periodo) do update set monto=excluded.monto,notas=excluded.notas;
end $$;
