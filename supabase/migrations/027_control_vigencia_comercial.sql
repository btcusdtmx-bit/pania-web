-- PANIA | Control de vigencia comercial
-- No modifica datos existentes.

create or replace function public.pania_acceso_vigente(
  p_empresa uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_empresa = public.mi_empresa_id()
    and exists (
      select 1
      from public.suscripciones_pania s
      where s.empresa_id = p_empresa
        and (
          (
            s.estado = 'prueba'
            and s.prueba_hasta >= now()
          )
          or
          (
            s.estado = 'activa'
            and (
              s.modalidad = 'contado'
              or (
                s.modalidad in ('mensual','anual')
                and (s.periodo_fin is null or s.periodo_fin >= now())
              )
            )
          )
        )
    );
$$;

revoke all on function public.pania_acceso_vigente(uuid)
from public, anon, authenticated;

grant execute on function public.pania_acceso_vigente(uuid)
to authenticated;
