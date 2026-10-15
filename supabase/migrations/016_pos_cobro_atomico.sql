-- PANIA 2.2 — Cobro de POS en una sola operación atómica.
-- Antes: crear venta -> abrirla -> agregar producto por producto (varios viajes al servidor).
-- Ahora: una venta con todas sus líneas se registra completa o no se registra.
-- Corre con los permisos del usuario (SECURITY INVOKER): la RLS existente sigue mandando.

create or replace function registrar_venta_pos(
  p_sucursal uuid, p_canal text, p_forma_pago text, p_turno text,
  p_cliente uuid, p_campana uuid, p_lineas jsonb
) returns uuid
language plpgsql set search_path = public as $$
declare
  v_emp uuid := mi_empresa_id();
  v_id  uuid;
begin
  if v_emp is null then raise exception 'Sin empresa activa'; end if;
  if coalesce(mi_rol()::text, '') not in ('dueno','administrador','encargado','caja') then
    raise exception 'Tu rol no puede registrar ventas';
  end if;
  if p_lineas is null or jsonb_typeof(p_lineas) <> 'array' or jsonb_array_length(p_lineas) = 0 then
    raise exception 'La venta no tiene productos';
  end if;
  if jsonb_array_length(p_lineas) > 200 then
    raise exception 'Demasiadas líneas en una sola venta';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_lineas) x
    left join productos p on p.id = (x->>'producto_id')::uuid and p.empresa_id = v_emp and p.activo
    where p.id is null or coalesce((x->>'cantidad')::numeric, 0) <= 0
  ) then
    raise exception 'Hay productos inválidos o cantidades en cero';
  end if;

  insert into ventas (empresa_id, sucursal_id, vendedor_id, canal, forma_pago, turno, cliente_id, campana_id, estado)
  values (v_emp, p_sucursal, auth.uid(),
          coalesce(nullif(p_canal, ''), 'mostrador')::canal_venta,
          nullif(p_forma_pago, ''), nullif(p_turno, ''), p_cliente, p_campana, 'cerrada')
  returning id into v_id;

  insert into venta_detalle (empresa_id, venta_id, producto_id, cantidad)
  select v_emp, v_id, (x->>'producto_id')::uuid, (x->>'cantidad')::numeric
  from jsonb_array_elements(p_lineas) x;

  return v_id;
end $$;

revoke all on function registrar_venta_pos(uuid, text, text, text, uuid, uuid, jsonb) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function registrar_venta_pos(uuid, text, text, text, uuid, uuid, jsonb) to authenticated';
  end if;
end $$;
