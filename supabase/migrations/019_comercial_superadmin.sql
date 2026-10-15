-- PANIA 2.4 — Comercialización y Superadministrador
-- Ejecutar después de 018_seguridad_roles_final.sql.

alter table suscripciones_pania add column if not exists modalidad text not null default 'mensual';
alter table suscripciones_pania add column if not exists precio_contratado numeric(12,2);
alter table suscripciones_pania add column if not exists licencia_comprada_en timestamptz;
alter table suscripciones_pania add column if not exists soporte_hasta timestamptz;
alter table suscripciones_pania add column if not exists notas_comerciales text;

do $$ begin
  alter table suscripciones_pania add constraint suscripciones_pania_modalidad_chk
    check (modalidad in ('mensual','anual','contado'));
exception when duplicate_object then null; end $$;

alter table pagos_pania add column if not exists concepto text;
alter table pagos_pania add column if not exists registrado_por uuid references auth.users(id);

-- Para licencia de contado, periodo_fin puede quedar NULL: el derecho de uso no vence.
-- soporte_hasta controla por separado soporte/actualizaciones cuando se defina comercialmente.

create index if not exists ix_suscripciones_estado_fin on suscripciones_pania(estado, periodo_fin);
create index if not exists ix_pagos_pania_empresa_fecha on pagos_pania(empresa_id, creado_en desc);

-- El cliente sólo consulta su información. Las mutaciones comerciales se realizan
-- exclusivamente desde acciones de servidor verificadas como Superadministrador PANIA.

drop policy if exists p_admin_pania_self_select on administradores_pania;
create policy p_admin_pania_self_select on administradores_pania for select to authenticated
using (user_id = auth.uid() and activo = true);

-- Vista de estado comercial para el propio negocio. No expone pagos de terceros.
create or replace view v_estado_pania
with (security_invoker = true)
as
select s.empresa_id,s.estado,s.modalidad,s.prueba_hasta,s.periodo_inicio,s.periodo_fin,
       s.licencia_comprada_en,s.soporte_hasta,s.precio_contratado,
       p.codigo as plan_codigo,p.nombre as plan_nombre,p.max_sucursales,p.max_usuarios,
       case
         when s.estado in ('pausada','cancelada','vencida') then false
         when s.modalidad='contado' and s.estado='activa' then true
         when s.estado='prueba' and s.prueba_hasta is not null and s.prueba_hasta >= now() then true
         when s.estado='activa' and (s.periodo_fin is null or s.periodo_fin >= now()) then true
         else false
       end as acceso_activo
from suscripciones_pania s
join planes_pania p on p.id=s.plan_id;

grant select on v_estado_pania to authenticated;
