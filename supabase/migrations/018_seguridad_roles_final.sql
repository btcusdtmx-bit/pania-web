-- PANIA 2.3.2 — cierre final de roles, sucursal y permisos personalizados.
-- Ejecutar UNA sola vez después de 017. Sustituye al 018 de la versión 2.3.1.

-- Permiso efectivo: la plantilla base define el máximo y el rol personalizado sólo puede quitar.
create or replace function tiene_permiso(p_modulo text,p_accion text default 'ver') returns boolean
language plpgsql stable security definer set search_path=public as $$
declare p perfiles; custom jsonb; permitido boolean:=false;
begin
 select * into p from perfiles where id=auth.uid() and activo limit 1;
 if p.id is null then return false; end if;
 permitido := case p.rol::text
  when 'dueno' then true
  when 'administrador' then p_modulo <> 'plataforma'
  when 'contador' then p_modulo=any(array['inicio','ventas','produccion','inventario','compras','finanzas','gastos','presupuestos','decisiones','radar','alertas','proyecciones','simulador','clientes','marketing','productos','ingredientes','recetas','auditoria']) and (p_accion='ver' or (p_modulo in ('compras','gastos') and p_accion in ('crear','modificar')))
  when 'encargado' then p_modulo=any(array['inicio','ventas','produccion','inventario','alertas','clientes','productos','ingredientes','recetas']) and (p_accion='ver' or (p_modulo in ('ventas','produccion','inventario','clientes') and p_accion in ('crear','modificar')))
  when 'produccion' then p_modulo=any(array['inicio','produccion','inventario','productos','ingredientes','recetas']) and (p_accion='ver' or (p_modulo='produccion' and p_accion in ('crear','modificar')))
  when 'compras' then p_modulo=any(array['inicio','inventario','compras','productos','ingredientes']) and (p_accion='ver' or (p_modulo in ('compras','ingredientes') and p_accion in ('crear','modificar')))
  when 'caja' then p_modulo=any(array['inicio','ventas','clientes','productos']) and (p_accion='ver' or (p_modulo='ventas' and p_accion in ('crear','modificar')) or (p_modulo='clientes' and p_accion='crear'))
  when 'marketing' then p_modulo=any(array['inicio','clientes','marketing']) and (p_accion='ver' or p_accion in ('crear','modificar'))
  when 'consulta' then p_accion='ver' and p_modulo=any(array['inicio','ventas','produccion','inventario','productos','ingredientes'])
  else false end;
 if not permitido then return false; end if;
 if p.rol_empresa_id is not null then
   select permisos into custom from roles_empresa where id=p.rol_empresa_id and empresa_id=p.empresa_id and activo;
   if custom is null then return false; end if;
   if custom #>> array[p_modulo,p_accion] = 'false' then return false; end if;
 end if;
 return true;
end $$;
revoke all on function tiene_permiso(text,text) from public;
grant execute on function tiene_permiso(text,text) to authenticated;

-- Caja no puede saltarse el módulo Inventario consultando movimientos directamente.
drop policy if exists p_movimientos_caja_select on movimientos_inventario;

-- Perfiles: usuario propio; dueño/admin administran únicamente su empresa.
drop policy if exists p_perfiles_select on perfiles;
drop policy if exists p_perfiles_select_seguro on perfiles;
create policy p_perfiles_select_seguro on perfiles for select to authenticated
using (empresa_id=mi_empresa_id() and (id=auth.uid() or tiene_permiso('usuarios','ver')));
drop policy if exists p_perfiles_no_escalar_ins on perfiles;
drop policy if exists p_perfiles_no_escalar_upd on perfiles;
create policy p_perfiles_no_escalar_ins on perfiles as restrictive for insert to authenticated
with check (empresa_id=mi_empresa_id() and tiene_permiso('usuarios','crear') and (rol::text<>'dueno' or mi_rol()='dueno'));
create policy p_perfiles_no_escalar_upd on perfiles as restrictive for update to authenticated
using (empresa_id=mi_empresa_id() and tiene_permiso('usuarios','modificar'))
with check (empresa_id=mi_empresa_id() and tiene_permiso('usuarios','modificar') and (rol::text<>'dueno' or mi_rol()='dueno'));

-- Sucursal: un empleado asignado no enumera ni opera otra sucursal.
drop policy if exists p_sucursales_select on sucursales;
drop policy if exists p_sucursales_select_seguro on sucursales;
create policy p_sucursales_select_seguro on sucursales for select to authenticated
using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or id=mi_sucursal_id()));
drop policy if exists p_almacenes_select on almacenes;
drop policy if exists p_almacenes_select_seguro on almacenes;
create policy p_almacenes_select_seguro on almacenes for select to authenticated
using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()));

-- Restricciones adicionales. Se combinan con las políticas permisivas existentes y nunca amplían acceso.
do $$
declare r record; pol text; expr text;
begin
 for r in select * from (values
  ('productos','productos'),('categorias','productos'),
  ('ingredientes','ingredientes'),('ingrediente_costos','ingredientes'),
  ('recetas','recetas'),('receta_detalle','recetas'),
  ('proveedores','compras'),('compras','compras'),('compra_detalle','compras'),
  ('movimientos_inventario','inventario'),
  ('ordenes_produccion','produccion'),('produccion_detalle','produccion'),('produccion_consumo','produccion'),('mermas','produccion'),
  ('ventas','ventas'),('venta_detalle','ventas'),('clientes','clientes'),('campanas_marketing','marketing'),
  ('categorias_gasto','gastos'),('gastos','gastos'),('cuentas_dinero','finanzas'),('movimientos_dinero','finanzas'),('presupuestos_gasto','presupuestos')
 ) as x(tabla,modulo)
 loop
  pol:='p232_'||r.tabla||'_select'; execute format('drop policy if exists %I on %I',pol,r.tabla);
  execute format('create policy %I on %I as restrictive for select to authenticated using (tiene_permiso(%L,%L))',pol,r.tabla,r.modulo,'ver');
 end loop;
end $$;

-- Escrituras sensibles: el permiso personalizado también se aplica en base de datos.
do $$
declare r record; pol text;
begin
 for r in select * from (values
  ('productos','productos'),('ingredientes','ingredientes'),('recetas','recetas'),('receta_detalle','recetas'),
  ('proveedores','compras'),('compras','compras'),('compra_detalle','compras'),
  ('movimientos_inventario','inventario'),('ordenes_produccion','produccion'),('produccion_detalle','produccion'),('produccion_consumo','produccion'),('mermas','produccion'),
  ('ventas','ventas'),('venta_detalle','ventas'),('clientes','clientes'),('campanas_marketing','marketing'),
  ('categorias_gasto','gastos'),('gastos','gastos'),('cuentas_dinero','finanzas'),('movimientos_dinero','finanzas'),('presupuestos_gasto','presupuestos')
 ) as x(tabla,modulo)
 loop
  pol:='p232_'||r.tabla||'_insert'; execute format('drop policy if exists %I on %I',pol,r.tabla);
  execute format('create policy %I on %I as restrictive for insert to authenticated with check (tiene_permiso(%L,%L))',pol,r.tabla,r.modulo,'crear');
  pol:='p232_'||r.tabla||'_update'; execute format('drop policy if exists %I on %I',pol,r.tabla);
  execute format('create policy %I on %I as restrictive for update to authenticated using (tiene_permiso(%L,%L)) with check (tiene_permiso(%L,%L))',pol,r.tabla,r.modulo,'modificar',r.modulo,'modificar');
 end loop;
end $$;

-- Roles personalizados: sólo dentro de la empresa y sólo administradores autorizados.
drop policy if exists p_roles_empresa_insert on roles_empresa;
drop policy if exists p_roles_empresa_update on roles_empresa;
create policy p_roles_empresa_insert on roles_empresa for insert to authenticated
with check (empresa_id=mi_empresa_id() and tiene_permiso('usuarios','crear') and (rol_base::text<>'dueno' or mi_rol()='dueno'));
create policy p_roles_empresa_update on roles_empresa for update to authenticated
using (empresa_id=mi_empresa_id() and tiene_permiso('usuarios','modificar'))
with check (empresa_id=mi_empresa_id() and tiene_permiso('usuarios','modificar') and (rol_base::text<>'dueno' or mi_rol()='dueno'));

-- Verificación estática de la matriz base esperada (no modifica datos).
create or replace function verificar_matriz_roles_pania() returns table(rol text,ventas boolean,produccion boolean,compras boolean,finanzas boolean,usuarios boolean)
language sql stable security definer set search_path=public as $$
 values
 ('caja',true,false,false,false,false),
 ('produccion',false,true,false,false,false),
 ('compras',false,false,true,false,false),
 ('contador',true,true,true,true,false),
 ('administrador',true,true,true,true,true),
 ('dueno',true,true,true,true,true)
$$;
revoke all on function verificar_matriz_roles_pania() from public;
grant execute on function verificar_matriz_roles_pania() to authenticated;

-- Capacidades que las versiones antiguas no concedían pero sí forman parte de la matriz 2.3.2.
drop policy if exists p232_gastos_insert_operativo on gastos;
create policy p232_gastos_insert_operativo on gastos for insert to authenticated
with check (empresa_id=mi_empresa_id() and tiene_permiso('gastos','crear') and (mi_sucursal_id() is null or sucursal_id is null or sucursal_id=mi_sucursal_id()));
drop policy if exists p232_gastos_update_operativo on gastos;
create policy p232_gastos_update_operativo on gastos for update to authenticated
using (empresa_id=mi_empresa_id() and tiene_permiso('gastos','modificar'))
with check (empresa_id=mi_empresa_id() and tiene_permiso('gastos','modificar'));

drop policy if exists p232_clientes_write_operativo on clientes;
create policy p232_clientes_write_operativo on clientes for all to authenticated
using (empresa_id=mi_empresa_id() and tiene_permiso('clientes','modificar'))
with check (empresa_id=mi_empresa_id() and (tiene_permiso('clientes','crear') or tiene_permiso('clientes','modificar')));

drop policy if exists p232_compras_insert_contable on compras;
create policy p232_compras_insert_contable on compras for insert to authenticated
with check (empresa_id=mi_empresa_id() and tiene_permiso('compras','crear') and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()));
drop policy if exists p232_compra_detalle_insert_contable on compra_detalle;
create policy p232_compra_detalle_insert_contable on compra_detalle for insert to authenticated
with check (tiene_permiso('compras','crear') and exists(select 1 from compras c where c.id=compra_id and c.empresa_id=mi_empresa_id()));

-- Sucursal también restringe las tablas transaccionales aunque exista una política antigua más amplia.
drop policy if exists p232_compras_sucursal on compras;
create policy p232_compras_sucursal on compras as restrictive for all to authenticated
using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()))
with check (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()));
drop policy if exists p232_movimientos_sucursal on movimientos_inventario;
create policy p232_movimientos_sucursal on movimientos_inventario as restrictive for all to authenticated
using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()))
with check (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()));
drop policy if exists p232_produccion_sucursal on ordenes_produccion;
create policy p232_produccion_sucursal on ordenes_produccion as restrictive for all to authenticated
using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()))
with check (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()));
drop policy if exists p232_mermas_sucursal on mermas;
create policy p232_mermas_sucursal on mermas as restrictive for all to authenticated
using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()))
with check (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()));
drop policy if exists p232_ventas_sucursal on ventas;
create policy p232_ventas_sucursal on ventas as restrictive for all to authenticated
using (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()))
with check (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id=mi_sucursal_id()));

-- Excepción acotada de Marketing: puede registrar/leer únicamente gasto de campaña sin abrir el módulo Finanzas/Gastos.
drop policy if exists p232_gastos_select on gastos;
create policy p232_gastos_select on gastos as restrictive for select to authenticated
using (tiene_permiso('gastos','ver') or (tiene_permiso('marketing','ver') and destino='marketing'));
drop policy if exists p232_gastos_insert on gastos;
create policy p232_gastos_insert on gastos as restrictive for insert to authenticated
with check (tiene_permiso('gastos','crear') or (tiene_permiso('marketing','crear') and destino='marketing'));
drop policy if exists p232_gastos_update on gastos;
create policy p232_gastos_update on gastos as restrictive for update to authenticated
using (tiene_permiso('gastos','modificar') or (tiene_permiso('marketing','modificar') and destino='marketing'))
with check (tiene_permiso('gastos','modificar') or (tiene_permiso('marketing','modificar') and destino='marketing'));
drop policy if exists p232_gastos_insert_operativo on gastos;
create policy p232_gastos_insert_operativo on gastos for insert to authenticated
with check (empresa_id=mi_empresa_id() and (mi_sucursal_id() is null or sucursal_id is null or sucursal_id=mi_sucursal_id()) and (tiene_permiso('gastos','crear') or (tiene_permiso('marketing','crear') and destino='marketing')));
