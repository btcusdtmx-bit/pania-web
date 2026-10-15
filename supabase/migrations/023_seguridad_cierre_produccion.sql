-- PANIA 2.5.6 — Consolidación de seguridad del cierre de producción
-- Corrige instalaciones donde 022 reemplazó el wrapper protegido.
-- Mantiene RLS activo y valida rol, empresa y sucursal antes de ejecutar el cierre.

create or replace function public.cerrar_orden_produccion(p_orden uuid) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o ordenes_produccion;
  d record;
  v_lotes numeric;
  v_costo_ins numeric;
  v_costo_pieza numeric;
  v_incompletos int;
begin
  if mi_rol() is null or mi_rol() not in ('dueno','administrador','encargado','produccion') then
    raise exception 'Sin permiso para cerrar órdenes de producción';
  end if;

  select * into o
  from ordenes_produccion
  where id = p_orden
    and empresa_id = mi_empresa_id()
    and (mi_sucursal_id() is null or sucursal_id = mi_sucursal_id())
  for update;

  if o.id is null then raise exception 'Orden no encontrada'; end if;
  if o.estado = 'cerrada' then raise exception 'La orden ya está cerrada'; end if;
  if o.estado <> 'en_proceso' then raise exception 'La orden debe estar en producción antes de cerrarse'; end if;

  select count(*) into v_incompletos
  from produccion_detalle
  where orden_id=p_orden
    and abs((coalesce(piezas_reales,0)+coalesce(piezas_merma,0))-coalesce(piezas_planeadas,0)) > 0.001;
  if v_incompletos > 0 then
    raise exception 'Producción incompleta: terminadas + merma debe ser igual a planeadas en todos los productos';
  end if;
  if not exists(select 1 from produccion_detalle where orden_id=p_orden) then
    raise exception 'La orden no tiene productos';
  end if;

  for d in
    select pd.*, rc.rendimiento_piezas, rc.mano_obra_lote, rc.energia_lote, rc.otros_lote
    from produccion_detalle pd join recetas rc on rc.id=pd.receta_id
    where pd.orden_id=p_orden
  loop
    v_lotes := (d.piezas_reales+d.piezas_merma)/d.rendimiento_piezas;
    insert into produccion_consumo (empresa_id,orden_id,produccion_detalle_id,ingrediente_id,cantidad_teorica,cantidad_real,costo_unitario)
    select o.empresa_id,p_orden,d.id,rd.ingrediente_id,rd.cantidad*v_lotes,rd.cantidad*v_lotes,costo_ingrediente(rd.ingrediente_id,o.fecha::timestamptz)
    from receta_detalle rd where rd.receta_id=d.receta_id
    on conflict (produccion_detalle_id,ingrediente_id) do update set cantidad_teorica=excluded.cantidad_teorica,costo_unitario=excluded.costo_unitario;
    update produccion_consumo set costo_unitario=costo_ingrediente(ingrediente_id,o.fecha::timestamptz) where produccion_detalle_id=d.id and costo_unitario is null;
    select coalesce(sum(cantidad_real*costo_unitario),0) into v_costo_ins from produccion_consumo where produccion_detalle_id=d.id;
    v_costo_pieza := case when d.piezas_reales>0 then (v_costo_ins+(d.mano_obra_lote+d.energia_lote+d.otros_lote)*v_lotes)/d.piezas_reales end;
    update produccion_detalle set costo_real_pieza=v_costo_pieza where id=d.id;
    insert into movimientos_inventario (empresa_id,sucursal_id,ocurrido_en,tipo,ingrediente_id,cantidad,costo_unitario,referencia_tabla,referencia_id,turno,creado_por)
    select o.empresa_id,o.sucursal_id,o.fecha::timestamptz,'consumo_produccion',pc.ingrediente_id,-pc.cantidad_real,pc.costo_unitario,'produccion_detalle',d.id,o.turno,o.responsable_id from produccion_consumo pc where pc.produccion_detalle_id=d.id;
    if d.piezas_reales>0 then
      insert into movimientos_inventario (empresa_id,sucursal_id,ocurrido_en,tipo,producto_id,cantidad,costo_unitario,referencia_tabla,referencia_id,turno,creado_por)
      values(o.empresa_id,o.sucursal_id,o.fecha::timestamptz,'entrada_produccion',d.producto_id,d.piezas_reales,v_costo_pieza,'produccion_detalle',d.id,o.turno,o.responsable_id);
    end if;
    if d.piezas_merma>0 then
      insert into mermas (empresa_id,sucursal_id,fecha,turno,producto_id,cantidad,costo_unitario,motivo,origen,orden_id,registrado_por)
      values(o.empresa_id,o.sucursal_id,o.fecha,o.turno,d.producto_id,d.piezas_merma,coalesce((select costo_pieza from v_costo_receta where receta_id=d.receta_id),0),d.merma_motivo,'produccion',p_orden,o.responsable_id);
    end if;
  end loop;
  update ordenes_produccion set estado='cerrada',hora_fin=coalesce(hora_fin,now()) where id=p_orden;
end $$;

revoke all on function public.cerrar_orden_produccion(uuid) from public;
grant execute on function public.cerrar_orden_produccion(uuid) to authenticated;
