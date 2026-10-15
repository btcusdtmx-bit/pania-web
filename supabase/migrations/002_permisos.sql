-- =====================================================================
-- PANADERÍA — PERMISOS POR ROL (correr DESPUÉS de panaderia_nucleo.sql)
--
-- Reglas
--  * Aislamiento por empresa (siempre) y por sucursal cuando el perfil
--    tiene sucursal_id asignado (NULL = ve todas las sucursales).
--  * Permisos definidos en UNA sola matriz (abajo), fácil de auditar.
--  * Sin política de DELETE = nadie puede borrar. Por defecto solo se
--    permite borrar en catálogos y solo a dueño/administrador; ventas,
--    compras, movimientos, mermas, producción y auditoría son permanentes
--    (se corrigen con ajustes o cancelaciones, no con borrado).
--  * Los triggers y cerrar_orden_produccion() corren como SECURITY DEFINER
--    para que, por ejemplo, caja pueda vender sin ver recetas ni costos.
--    Requiere que el dueño de las funciones tenga BYPASSRLS (en Supabase
--    es el rol postgres).
--  * Limitación conocida: RLS filtra filas, no columnas. Caja ve el
--    costo_unitario de los movimientos de producto terminado.
-- =====================================================================

-- ---------- Ayudantes de sesión --------------------------------------
create or replace function mi_empresa_id()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from perfiles where id = auth.uid() and activo
$$;

create or replace function mi_rol()
returns rol_usuario language sql stable security definer set search_path = public as $$
  select rol from perfiles where id = auth.uid() and activo
$$;

create or replace function mi_sucursal_id()
returns uuid language sql stable security definer set search_path = public as $$
  select sucursal_id from perfiles where id = auth.uid() and activo
$$;

-- ---------- Triggers y funciones que deben saltarse la RLS -----------
alter function trg_compra_detalle_alta()   security definer set search_path = public;
alter function trg_venta_detalle_antes()   security definer set search_path = public;
alter function trg_venta_detalle_despues() security definer set search_path = public;
alter function trg_merma_alta()            security definer set search_path = public;

-- Cierre de orden: la lógica queda interna y no ejecutable por usuarios;
-- el envoltorio valida rol, empresa y sucursal antes de llamarla.
alter function cerrar_orden_produccion(uuid) rename to _cerrar_orden_produccion;
alter function _cerrar_orden_produccion(uuid) security definer set search_path = public;
revoke all on function _cerrar_orden_produccion(uuid) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on function _cerrar_orden_produccion(uuid) from anon, authenticated';
  end if;
end $$;

create or replace function cerrar_orden_produccion(p_orden uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if mi_rol() is null or mi_rol() not in ('dueno','administrador','encargado','produccion') then
    raise exception 'Sin permiso para cerrar órdenes de producción';
  end if;
  if not exists (
    select 1 from ordenes_produccion
    where id = p_orden and empresa_id = mi_empresa_id()
      and (mi_sucursal_id() is null or sucursal_id = mi_sucursal_id())
  ) then
    raise exception 'Orden no encontrada';
  end if;
  perform _cerrar_orden_produccion(p_orden);
end $$;

-- ---------- MATRIZ DE PERMISOS ---------------------------------------
-- formato: 'tabla|comando|roles separados por coma'
-- Roles: dueno, administrador, contador, encargado, produccion, compras,
--        caja, marketing, consulta
do $$
declare
  p record; fila text; partes text[]; t text; cmd text; roles text[];
  cond text; chk text; extra text; pol text;
  con_sucursal text[] := array['compras','movimientos_inventario','ordenes_produccion','mermas','ventas'];
  detalle jsonb := '{"compra_detalle":["compras","compra_id"],
                     "produccion_detalle":["ordenes_produccion","orden_id"],
                     "produccion_consumo":["ordenes_produccion","orden_id"],
                     "venta_detalle":["ventas","venta_id"]}';
  todos text := 'dueno,administrador,contador,encargado,produccion,compras,caja,marketing,consulta';
  adm   text := 'dueno,administrador';
  matriz text[];
begin
  matriz := array[
    -- catálogo comercial
    'categorias|select|'||todos,               'categorias|insert|'||adm,
    'categorias|update|'||adm,                 'categorias|delete|'||adm,
    'productos|select|'||todos,                'productos|insert|'||adm,
    'productos|update|'||adm,                  'productos|delete|'||adm,
    -- catálogo de costos
    'ingredientes|select|dueno,administrador,contador,encargado,produccion,compras,consulta',
    'ingredientes|insert|dueno,administrador,compras',
    'ingredientes|update|dueno,administrador,compras',
    'ingredientes|delete|'||adm,
    'ingrediente_costos|select|dueno,administrador,contador,compras',
    'ingrediente_costos|insert|dueno,administrador,compras',   -- sin update/delete: historial inmutable
    'recetas|select|dueno,administrador,contador,encargado,produccion',
    'recetas|insert|'||adm,  'recetas|update|'||adm,  'recetas|delete|'||adm,
    'receta_detalle|select|dueno,administrador,contador,encargado,produccion',
    'receta_detalle|insert|'||adm,  'receta_detalle|update|'||adm,  'receta_detalle|delete|'||adm,
    'proveedores|select|dueno,administrador,contador,compras',
    'proveedores|insert|dueno,administrador,compras',
    'proveedores|update|dueno,administrador,compras',
    'proveedores|delete|'||adm,
    -- compras
    'compras|select|dueno,administrador,contador,compras',
    'compras|insert|dueno,administrador,compras',
    'compras|update|dueno,administrador,compras',
    'compra_detalle|select|dueno,administrador,contador,compras',
    'compra_detalle|insert|dueno,administrador,compras',
    'compra_detalle|update|dueno,administrador,compras',
    -- inventario: escritura normal solo vía triggers/funciones; ajustes manuales controlados
    'movimientos_inventario|select|dueno,administrador,contador,encargado,produccion,compras,consulta',
    'movimientos_inventario|insert|dueno,administrador,encargado',
    -- producción y mermas
    'ordenes_produccion|select|dueno,administrador,contador,encargado,produccion,consulta',
    'ordenes_produccion|insert|dueno,administrador,encargado,produccion',
    'ordenes_produccion|update|dueno,administrador,encargado,produccion',
    'produccion_detalle|select|dueno,administrador,contador,encargado,produccion,consulta',
    'produccion_detalle|insert|dueno,administrador,encargado,produccion',
    'produccion_detalle|update|dueno,administrador,encargado,produccion',
    'produccion_consumo|select|dueno,administrador,contador,encargado,produccion,consulta',
    'produccion_consumo|insert|dueno,administrador,encargado,produccion',
    'produccion_consumo|update|dueno,administrador,encargado,produccion',
    'mermas|select|dueno,administrador,contador,encargado,produccion,consulta',
    'mermas|insert|dueno,administrador,encargado,produccion',
    'mermas|update|dueno,administrador,encargado',
    -- ventas (cancelar = update de estado, nunca borrar)
    'ventas|select|dueno,administrador,contador,encargado,caja,consulta',
    'ventas|insert|dueno,administrador,encargado,caja',
    'ventas|update|dueno,administrador,encargado',
    'venta_detalle|select|dueno,administrador,contador,encargado,caja,consulta',
    'venta_detalle|insert|dueno,administrador,encargado,caja',
    'venta_detalle|update|dueno,administrador,encargado',
    -- estructura
    'sucursales|select|'||todos,  'sucursales|insert|'||adm,  'sucursales|update|'||adm,
    'almacenes|select|'||todos,   'almacenes|insert|'||adm,   'almacenes|update|'||adm,
    'perfiles|select|'||todos,    'perfiles|insert|'||adm,    'perfiles|update|'||adm,
    'auditoria|select|dueno,administrador,contador'            -- solo lectura; se escribe por trigger
  ];

  -- 1) limpiar políticas previas (las genéricas del núcleo)
  for p in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on %I', p.policyname, p.tablename);
  end loop;

  -- 2) crear políticas desde la matriz
  foreach fila in array matriz loop
    partes := string_to_array(fila, '|');
    t := partes[1]; cmd := partes[2]; roles := string_to_array(partes[3], ',');

    cond := format('empresa_id = mi_empresa_id() and mi_rol()::text = any(%L::text[])', roles::text);
    if t = any(con_sucursal) then
      cond := cond || ' and (mi_sucursal_id() is null or sucursal_id = mi_sucursal_id())';
    elsif detalle ? t then
      cond := cond || format(' and exists (select 1 from %I x where x.id = %I and (mi_sucursal_id() is null or x.sucursal_id = mi_sucursal_id()))',
                             detalle->t->>0, detalle->t->>1);
    end if;
    chk := cond;
    if t = 'movimientos_inventario' and cmd = 'insert' then
      chk := chk || ' and tipo = ''ajuste''';
    end if;

    pol := format('p_%s_%s', t, cmd);
    if cmd = 'select' or cmd = 'delete' then
      execute format('create policy %I on %I for %s using (%s)', pol, t, cmd, cond);
    elsif cmd = 'insert' then
      execute format('create policy %I on %I for insert with check (%s)', pol, t, chk);
    else
      execute format('create policy %I on %I for update using (%s) with check (%s)', pol, t, cond, chk);
    end if;
  end loop;
end $$;

-- ---------- Casos especiales -----------------------------------------
-- Caja solo ve movimientos de producto terminado (para saber si hay pan)
create policy p_movimientos_caja_select on movimientos_inventario for select
  using (empresa_id = mi_empresa_id() and mi_rol() = 'caja' and producto_id is not null
         and (mi_sucursal_id() is null or sucursal_id = mi_sucursal_id()));

-- Nadie escala privilegios: solo el dueño crea, edita, degrada o desactiva dueños
create policy p_perfiles_no_escalar_ins on perfiles as restrictive for insert
  with check (rol <> 'dueno' or mi_rol() = 'dueno');
create policy p_perfiles_no_escalar_upd on perfiles as restrictive for update
  using (rol <> 'dueno' or mi_rol() = 'dueno')          -- un administrador no toca a un dueño existente
  with check (rol <> 'dueno' or mi_rol() = 'dueno');    -- ni asciende a nadie a dueño

-- Empresa: todos ven la propia; solo el dueño la edita
create policy p_empresas_select on empresas for select using (id = mi_empresa_id());
create policy p_empresas_update on empresas for update
  using (id = mi_empresa_id() and mi_rol() = 'dueno')
  with check (id = mi_empresa_id() and mi_rol() = 'dueno');
