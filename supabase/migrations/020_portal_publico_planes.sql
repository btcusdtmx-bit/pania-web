-- PANIA Portal Público V1: lectura pública limitada a catálogo comercial activo.
-- No permite consultar empresas, suscripciones, pagos ni modificar planes.
create or replace function public.planes_publicos_pania()
returns table(codigo text,nombre text,precio_mensual numeric,precio_anual numeric,max_sucursales integer,max_usuarios integer)
language sql stable security definer set search_path=public
as $$
 select p.codigo,p.nombre,p.precio_mensual,p.precio_anual,p.max_sucursales,p.max_usuarios
 from public.planes_pania p where p.activo=true order by p.precio_mensual,p.codigo;
$$;
revoke all on function public.planes_publicos_pania() from public;
grant execute on function public.planes_publicos_pania() to anon,authenticated;
