-- PANIA | Registro de panaderia con prueba gratuita de 30 dias
-- No modifica empresas ni suscripciones existentes.
-- Mantiene la firma original de registrar_empresa.

create or replace function public.registrar_empresa(
  p_empresa text,
  p_nombre text,
  p_sucursal text default 'Principal',
  p_rfc text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_emp uuid;
  v_suc uuid;
  v_plan uuid;
  v_codigo text;
begin
  if auth.uid() is null then
    raise exception 'Debes iniciar sesion';
  end if;

  if exists (
    select 1 from public.perfiles
    where id = auth.uid()
  ) then
    raise exception 'Este usuario ya pertenece a una empresa';
  end if;

  if coalesce(trim(p_empresa), '') = ''
     or coalesce(trim(p_nombre), '') = '' then
    raise exception 'Nombre de empresa y de usuario son obligatorios';
  end if;

  -- El plan solicitado se registra en Supabase Auth.
  -- Si no existe o no esta activo, se utiliza Basico.
  select
    case
      when raw_user_meta_data->>'plan_interes'
        in ('basico','negocio','multi')
      then raw_user_meta_data->>'plan_interes'
      else 'basico'
    end
  into v_codigo
  from auth.users
  where id = auth.uid();

  select id into v_plan
  from public.planes_pania
  where codigo = v_codigo and activo = true;

  if v_plan is null then
    select id into v_plan
    from public.planes_pania
    where codigo = 'basico' and activo = true;
  end if;

  if v_plan is null then
    raise exception 'No hay un plan inicial disponible';
  end if;

  insert into public.empresas(nombre,rfc)
  values(trim(p_empresa),nullif(trim(p_rfc),''))
  returning id into v_emp;

  insert into public.sucursales(empresa_id,nombre)
  values(v_emp,coalesce(nullif(trim(p_sucursal),''),'Principal'))
  returning id into v_suc;

  insert into public.almacenes(empresa_id,sucursal_id,nombre)
  values(v_emp,v_suc,'Almacén general');

  insert into public.perfiles(id,empresa_id,sucursal_id,nombre,rol)
  values(auth.uid(),v_emp,null,trim(p_nombre),'dueno');

  insert into public.categorias(empresa_id,tipo,nombre)
  select v_emp,'producto',n
  from unnest(array[
    'Pan salado','Pan dulce','Pastelería',
    'Galletas','Bebidas','Especiales'
  ]) n;

  insert into public.categorias(empresa_id,tipo,nombre)
  select v_emp,'ingrediente',n
  from unnest(array[
    'Harinas','Lácteos y huevo','Grasas',
    'Azúcares y endulzantes','Levaduras y mejorantes',
    'Rellenos y toppings','Empaque'
  ]) n;

  -- Prueba gratuita: 30 dias desde la primera activacion.
  insert into public.suscripciones_pania(
    empresa_id,
    plan_id,
    estado,
    prueba_hasta,
    periodo_inicio,
    modalidad,
    precio_contratado
  )
  values(
    v_emp,
    v_plan,
    'prueba',
    now() + interval '30 days',
    now(),
    'mensual',
    0
  );

  return v_emp;
end;
$$;

-- Conservar acceso exclusivamente para usuarios autenticados.
revoke all on function public.registrar_empresa(
  text,text,text,text
) from public, anon;

grant execute on function public.registrar_empresa(
  text,text,text,text
) to authenticated;
