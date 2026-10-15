-- PANIA 2.1 — Completa el DEMO ya cargado sin duplicar ventas.
-- Añade Clientes, Marketing, Gastos, Presupuestos y Caja/Bancos.
do $$
declare emp uuid; suc uuid; usr uuid; caja uuid; banco uuid; cat_nom uuid; cat_ser uuid; cat_mkt uuid; camp_ok uuid; camp_bad uuid; c1 uuid;c2 uuid;c3 uuid;c4 uuid;c5 uuid; d date;
begin
 select p.empresa_id,p.sucursal_id,p.id into emp,suc,usr from perfiles p where p.activo order by case when p.rol='dueno' then 0 else 1 end limit 1;
 if emp is null then raise exception 'No existe un perfil activo'; end if;
 if not exists(select 1 from productos where empresa_id=emp and sku like 'DEMO-%') then raise exception 'Primero carga el DEMO operativo de PANIA'; end if;

 insert into clientes(empresa_id,nombre,telefono,email,notas,created_by) values
 (emp,'DEMO Ana López','2290001001','ana.demo@pania.local','Cliente frecuente DEMO',usr),
 (emp,'DEMO Carlos Ruiz','2290001002','carlos.demo@pania.local','Compra fin de semana',usr),
 (emp,'DEMO María Torres','2290001003','maria.demo@pania.local','Cliente de pedidos',usr),
 (emp,'DEMO Oficina Centro','2290001004','oficina.demo@pania.local','Cliente corporativo',usr),
 (emp,'DEMO Cliente por recuperar','2290001005','recuperar.demo@pania.local','Caso intencional de riesgo',usr)
 on conflict(empresa_id,telefono) where telefono is not null and telefono<>'' do update set nombre=excluded.nombre
 ;
 select id into c1 from clientes where empresa_id=emp and telefono='2290001001';select id into c2 from clientes where empresa_id=emp and telefono='2290001002';select id into c3 from clientes where empresa_id=emp and telefono='2290001003';select id into c4 from clientes where empresa_id=emp and telefono='2290001004';select id into c5 from clientes where empresa_id=emp and telefono='2290001005';

 -- Distribuye clientes entre tickets DEMO recientes.
 with x as(select id,row_number() over(order by fecha_hora) n from ventas where empresa_id=emp and estado='cerrada' and fecha_hora::date>=current_date-35)
 update ventas v set cliente_id=case x.n%5 when 0 then c1 when 1 then c2 when 2 then c3 when 3 then c4 else null end from x where v.id=x.id;
 -- Cliente en riesgo: ticket histórico pequeño usando un ticket existente antiguo si lo hay; si no, queda creado sin falsear ventas del mes.
 update ventas set cliente_id=c5 where id=(select id from ventas where empresa_id=emp and estado='cerrada' and fecha_hora::date<current_date-30 order by fecha_hora desc limit 1);

 insert into campanas_marketing(empresa_id,nombre,canal,fecha_inicio,fecha_fin,presupuesto,objetivo,estado,created_by)
 select emp,'DEMO Desayuno recurrente','WhatsApp',current_date-25,current_date,900,'Aumentar recompra','finalizada',usr where not exists(select 1 from campanas_marketing where empresa_id=emp and nombre='DEMO Desayuno recurrente');
 insert into campanas_marketing(empresa_id,nombre,canal,fecha_inicio,fecha_fin,presupuesto,objetivo,estado,created_by)
 select emp,'DEMO Anuncio sin retorno','Facebook',current_date-20,current_date,2200,'Caso de ROI negativo','finalizada',usr where not exists(select 1 from campanas_marketing where empresa_id=emp and nombre='DEMO Anuncio sin retorno');
 select id into camp_ok from campanas_marketing where empresa_id=emp and nombre='DEMO Desayuno recurrente';select id into camp_bad from campanas_marketing where empresa_id=emp and nombre='DEMO Anuncio sin retorno';
 with x as(select id,row_number() over(order by fecha_hora desc) n from ventas where empresa_id=emp and estado='cerrada' and fecha_hora::date>=current_date-25)
 update ventas v set campana_id=case when x.n between 1 and 5 then camp_ok when x.n=6 then camp_bad else v.campana_id end from x where v.id=x.id;

 insert into categorias_gasto(empresa_id,nombre) values(emp,'Nómina DEMO'),(emp,'Servicios DEMO'),(emp,'Marketing DEMO') on conflict(empresa_id,nombre) do nothing;
 select id into cat_nom from categorias_gasto where empresa_id=emp and nombre='Nómina DEMO';select id into cat_ser from categorias_gasto where empresa_id=emp and nombre='Servicios DEMO';select id into cat_mkt from categorias_gasto where empresa_id=emp and nombre='Marketing DEMO';
 insert into gastos(empresa_id,sucursal_id,categoria_id,fecha,concepto,proveedor,tipo,destino,forma_pago,referencia,monto,created_by)
 select emp,suc,cat_nom,current_date-6,'Nómina quincenal DEMO','Personal','fijo','operativo','transferencia','DEMO21-NOM',14500,usr where not exists(select 1 from gastos where empresa_id=emp and referencia='DEMO21-NOM');
 insert into gastos(empresa_id,sucursal_id,categoria_id,fecha,concepto,proveedor,tipo,destino,forma_pago,referencia,monto,created_by)
 select emp,suc,cat_ser,current_date-12,'Luz, gas e internet DEMO','Servicios','fijo','operativo','transferencia','DEMO21-SER',4800,usr where not exists(select 1 from gastos where empresa_id=emp and referencia='DEMO21-SER');
 insert into gastos(empresa_id,sucursal_id,categoria_id,fecha,concepto,proveedor,tipo,destino,forma_pago,referencia,monto,campana_id,created_by)
 select emp,suc,cat_mkt,current_date-18,'Publicidad campaña positiva DEMO','Meta','variable','marketing','tarjeta','DEMO21-MKT1',700,camp_ok,usr where not exists(select 1 from gastos where empresa_id=emp and referencia='DEMO21-MKT1');
 insert into gastos(empresa_id,sucursal_id,categoria_id,fecha,concepto,proveedor,tipo,destino,forma_pago,referencia,monto,campana_id,created_by)
 select emp,suc,cat_mkt,current_date-10,'Publicidad sin retorno DEMO','Meta','variable','marketing','tarjeta','DEMO21-MKT2',2200,camp_bad,usr where not exists(select 1 from gastos where empresa_id=emp and referencia='DEMO21-MKT2');

 insert into presupuestos_gasto(empresa_id,sucursal_id,categoria_id,periodo,monto,notas,created_by) values
 (emp,suc,cat_nom,date_trunc('month',current_date)::date,16000,'DEMO',usr),(emp,suc,cat_ser,date_trunc('month',current_date)::date,4500,'DEMO: excedido intencionalmente',usr),(emp,suc,cat_mkt,date_trunc('month',current_date)::date,2500,'DEMO',usr)
 on conflict(empresa_id,sucursal_id,categoria_id,periodo) do update set monto=excluded.monto,notas=excluded.notas;

 insert into cuentas_dinero(empresa_id,sucursal_id,nombre,tipo,saldo_inicial) select emp,suc,'DEMO Caja mostrador','caja',3500 where not exists(select 1 from cuentas_dinero where empresa_id=emp and nombre='DEMO Caja mostrador');
 insert into cuentas_dinero(empresa_id,sucursal_id,nombre,tipo,banco,numero_referencia,saldo_inicial) select emp,suc,'DEMO Banco principal','banco','Banco DEMO','4321',12000 where not exists(select 1 from cuentas_dinero where empresa_id=emp and nombre='DEMO Banco principal');
 select id into caja from cuentas_dinero where empresa_id=emp and nombre='DEMO Caja mostrador';select id into banco from cuentas_dinero where empresa_id=emp and nombre='DEMO Banco principal';
 -- Entradas diarias iguales a ventas cerradas: no altera las ventas, sólo representa su cobro.
 for d in select distinct fecha_hora::date from ventas where empresa_id=emp and estado='cerrada' and fecha_hora::date>=current_date-35 loop
  insert into movimientos_dinero(empresa_id,sucursal_id,cuenta_id,fecha,tipo,concepto,monto,referencia,origen,created_by)
  select emp,suc,case when extract(day from d)::int%2=0 then caja else banco end,d,'entrada','Cobro ventas DEMO',sum(vd.cantidad*vd.precio_unitario_neto), 'DEMO21-VENTA-'||d,'venta',usr
  from ventas v join venta_detalle vd on vd.venta_id=v.id where v.empresa_id=emp and v.estado='cerrada' and v.fecha_hora::date=d
  having not exists(select 1 from movimientos_dinero where empresa_id=emp and referencia='DEMO21-VENTA-'||d);
 end loop;
 insert into movimientos_dinero(empresa_id,sucursal_id,cuenta_id,fecha,tipo,concepto,monto,referencia,origen,created_by)
 select emp,suc,banco,current_date-6,'salida','Pago nómina DEMO',14500,'DEMO21-FLUJO-NOM','gasto',usr where not exists(select 1 from movimientos_dinero where empresa_id=emp and referencia='DEMO21-FLUJO-NOM');
 insert into movimientos_dinero(empresa_id,sucursal_id,cuenta_id,fecha,tipo,concepto,monto,referencia,origen,created_by)
 select emp,suc,banco,current_date-12,'salida','Pago servicios DEMO',4800,'DEMO21-FLUJO-SER','gasto',usr where not exists(select 1 from movimientos_dinero where empresa_id=emp and referencia='DEMO21-FLUJO-SER');
end $$;
