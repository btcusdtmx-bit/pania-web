-- PANIA 2.5.3 — Stock vendible y bloqueo de sobreventa
-- El POS puede mostrar stock, pero la base de datos es la autoridad final.

create or replace function registrar_venta_pos(
  p_sucursal uuid, p_canal text, p_forma_pago text, p_turno text,
  p_cliente uuid, p_campana uuid, p_lineas jsonb,
  p_efectivo_recibido numeric default null
) returns uuid
language plpgsql set search_path = public as $$
declare
  v_emp uuid:=mi_empresa_id(); v_id uuid; v_total numeric; v_folio text;
  r record; v_stock numeric;
begin
 if v_emp is null then raise exception 'Sin empresa activa'; end if;
 if coalesce(mi_rol()::text,'') not in ('dueno','administrador','encargado','caja') then raise exception 'Tu rol no puede registrar ventas'; end if;
 if not exists(select 1 from sucursales s where s.id=p_sucursal and s.empresa_id=v_emp and s.activa) then raise exception 'Sucursal inválida'; end if;
 if p_lineas is null or jsonb_typeof(p_lineas)<>'array' or jsonb_array_length(p_lineas)=0 then raise exception 'La venta no tiene productos'; end if;
 if jsonb_array_length(p_lineas)>200 then raise exception 'Demasiadas líneas en una sola venta'; end if;
 if exists(select 1 from jsonb_array_elements(p_lineas) x left join productos p on p.id=(x->>'producto_id')::uuid and p.empresa_id=v_emp and p.activo where p.id is null or coalesce((x->>'cantidad')::numeric,0)<=0) then raise exception 'Hay productos inválidos o cantidades en cero'; end if;

 -- Serializa cobros del mismo producto/sucursal para impedir dos cajas vendiendo la última pieza a la vez.
 for r in
   select (x->>'producto_id')::uuid producto_id, sum((x->>'cantidad')::numeric) cantidad
   from jsonb_array_elements(p_lineas) x group by 1 order by 1
 loop
   perform pg_advisory_xact_lock(hashtextextended(p_sucursal::text||':'||r.producto_id::text,0));
   select coalesce(sum(m.cantidad),0) into v_stock
   from movimientos_inventario m
   where m.empresa_id=v_emp and m.sucursal_id=p_sucursal and m.producto_id=r.producto_id;
   if v_stock < r.cantidad then
     raise exception 'Stock insuficiente para %. Disponible: %, solicitado: %',
       (select nombre from productos where id=r.producto_id), v_stock, r.cantidad;
   end if;
 end loop;

 select coalesce(sum((x->>'cantidad')::numeric*p.precio_publico),0) into v_total from jsonb_array_elements(p_lineas) x join productos p on p.id=(x->>'producto_id')::uuid;
 if p_forma_pago='efectivo' and p_efectivo_recibido is not null and p_efectivo_recibido<v_total then raise exception 'El efectivo recibido es menor al total'; end if;
 insert into ventas(empresa_id,sucursal_id,vendedor_id,canal,forma_pago,turno,cliente_id,campana_id,estado,efectivo_recibido,cambio)
 values(v_emp,p_sucursal,auth.uid(),coalesce(nullif(p_canal,''),'mostrador')::canal_venta,nullif(p_forma_pago,''),nullif(p_turno,''),p_cliente,p_campana,'cerrada',p_efectivo_recibido,
 case when p_forma_pago='efectivo' and p_efectivo_recibido is not null then greatest(p_efectivo_recibido-v_total,0) else null end) returning id into v_id;
 v_folio:='PAN-'||to_char(current_date,'YYYYMMDD')||'-'||upper(substr(replace(v_id::text,'-',''),1,8));
 update ventas set folio_ticket=v_folio where id=v_id;
 insert into venta_detalle(empresa_id,venta_id,producto_id,cantidad)
 select v_emp,v_id,(x->>'producto_id')::uuid,(x->>'cantidad')::numeric from jsonb_array_elements(p_lineas) x;
 return v_id;
end $$;
revoke all on function registrar_venta_pos(uuid,text,text,text,uuid,uuid,jsonb,numeric) from public;
grant execute on function registrar_venta_pos(uuid,text,text,text,uuid,uuid,jsonb,numeric) to authenticated;
