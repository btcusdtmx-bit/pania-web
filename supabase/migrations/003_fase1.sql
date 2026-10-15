-- =====================================================================
-- PANADERÍA — FASE 1: BASE ADMINISTRATIVA
-- Correr después de panaderia_nucleo.sql y panaderia_permisos.sql
--
-- Problema que resuelve: un usuario recién registrado en Supabase Auth
-- todavía no tiene perfil, así que la RLS no le deja ver ni crear nada.
-- registrar_empresa() es la única puerta de entrada: crea la empresa,
-- la primera sucursal y almacén, el perfil de dueño y los catálogos base.
-- Solo puede usarla alguien autenticado y sin perfil previo.
-- =====================================================================

create or replace function registrar_empresa(
  p_empresa   text,
  p_nombre    text,
  p_sucursal  text default 'Principal',
  p_rfc       text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_emp uuid; v_suc uuid;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesión';
  end if;
  if exists (select 1 from perfiles where id = auth.uid()) then
    raise exception 'Este usuario ya pertenece a una empresa';
  end if;
  if coalesce(trim(p_empresa), '') = '' or coalesce(trim(p_nombre), '') = '' then
    raise exception 'Nombre de empresa y de usuario son obligatorios';
  end if;

  insert into empresas (nombre, rfc) values (trim(p_empresa), nullif(trim(p_rfc), '')) returning id into v_emp;
  insert into sucursales (empresa_id, nombre) values (v_emp, trim(p_sucursal)) returning id into v_suc;
  insert into almacenes (empresa_id, sucursal_id, nombre) values (v_emp, v_suc, 'Almacén general');
  insert into perfiles (id, empresa_id, sucursal_id, nombre, rol)
    values (auth.uid(), v_emp, null, trim(p_nombre), 'dueno');   -- sucursal null = ve todas

  insert into categorias (empresa_id, tipo, nombre)
  select v_emp, 'producto', n from unnest(array['Pan salado','Pan dulce','Pastelería','Galletas','Bebidas','Especiales']) n;
  insert into categorias (empresa_id, tipo, nombre)
  select v_emp, 'ingrediente', n from unnest(array['Harinas','Lácteos y huevo','Grasas','Azúcares y endulzantes','Levaduras y mejorantes','Rellenos y toppings','Empaque']) n;

  return v_emp;
end $$;

revoke all on function registrar_empresa(text, text, text, text) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'grant execute on function registrar_empresa(text, text, text, text) to authenticated';
  end if;
end $$;

-- ---------- Auditoría de la base administrativa ----------------------
-- Todo cambio en usuarios, sucursales, almacenes y categorías queda
-- registrado con usuario, fecha, valor anterior y valor nuevo.
do $$ declare t text; begin
  foreach t in array array['perfiles','sucursales','almacenes','categorias'] loop
    execute format('create trigger t_aud_%1$s after insert or update or delete on %1$s
                    for each row execute function trg_auditar()', t);
  end loop;
end $$;
