-- PANIA 2.3: base SaaS, planes, suscripciones y roles configurables
create table if not exists planes_pania (
 id uuid primary key default gen_random_uuid(), codigo text unique not null, nombre text not null,
 precio_mensual numeric(12,2) not null default 0, precio_anual numeric(12,2),
 max_sucursales int, max_usuarios int, activo boolean not null default true,
 caracteristicas jsonb not null default '{}'::jsonb, creado_en timestamptz not null default now()
);

create table if not exists suscripciones_pania (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null unique references empresas(id),
 plan_id uuid not null references planes_pania(id), estado text not null default 'prueba'
   check (estado in ('prueba','activa','vencida','pausada','cancelada')),
 prueba_hasta timestamptz, periodo_inicio timestamptz, periodo_fin timestamptz,
 proveedor_pago text check (proveedor_pago in ('stripe','mercado_pago','manual') or proveedor_pago is null),
 cliente_externo_id text, suscripcion_externa_id text, creado_en timestamptz not null default now(), actualizado_en timestamptz not null default now()
);

create table if not exists pagos_pania (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id),
 suscripcion_id uuid references suscripciones_pania(id), proveedor text not null,
 referencia_externa text, monto numeric(12,2) not null, moneda text not null default 'MXN',
 estado text not null check (estado in ('pendiente','pagado','fallido','reembolsado')),
 pagado_en timestamptz, payload jsonb not null default '{}'::jsonb, creado_en timestamptz not null default now(),
 unique(proveedor, referencia_externa)
);

-- Administradores de la plataforma PANIA (no confundir con administradores de una panadería).
create table if not exists administradores_pania (
 user_id uuid primary key references auth.users(id) on delete cascade,
 activo boolean not null default true, creado_en timestamptz not null default now()
);

-- Plantillas simples de permisos creadas por el dueño/administrador de cada empresa.
create table if not exists roles_empresa (
 id uuid primary key default gen_random_uuid(), empresa_id uuid not null references empresas(id),
 nombre text not null, descripcion text, rol_base rol_usuario not null default 'consulta',
 permisos jsonb not null default '{}'::jsonb, activo boolean not null default true,
 creado_en timestamptz not null default now(), unique(empresa_id,nombre)
);
alter table perfiles add column if not exists rol_empresa_id uuid references roles_empresa(id);

alter table planes_pania enable row level security;
alter table suscripciones_pania enable row level security;
alter table pagos_pania enable row level security;
alter table administradores_pania enable row level security;
alter table roles_empresa enable row level security;

-- Los clientes pueden leer su plan/suscripción, nunca pagos de otras empresas.
create policy p_planes_cliente_select on planes_pania for select to authenticated using (activo);
create policy p_suscripcion_propia_select on suscripciones_pania for select to authenticated using (empresa_id = mi_empresa_id());
create policy p_pagos_propios_select on pagos_pania for select to authenticated using (empresa_id = mi_empresa_id() and mi_rol() in ('dueno','administrador','contador'));
create policy p_roles_empresa_select on roles_empresa for select to authenticated using (empresa_id = mi_empresa_id());
create policy p_roles_empresa_insert on roles_empresa for insert to authenticated with check (empresa_id = mi_empresa_id() and mi_rol() in ('dueno','administrador'));
create policy p_roles_empresa_update on roles_empresa for update to authenticated using (empresa_id = mi_empresa_id() and mi_rol() in ('dueno','administrador')) with check (empresa_id = mi_empresa_id() and mi_rol() in ('dueno','administrador'));

insert into planes_pania(codigo,nombre,precio_mensual,precio_anual,max_sucursales,max_usuarios,caracteristicas)
values
 ('basico','PANIA Básico',399,3990,1,5,'{"pos":true,"operacion":true}'::jsonb),
 ('negocio','PANIA Negocio',799,7990,3,15,'{"pos":true,"operacion":true,"finanzas":true,"inteligencia":true}'::jsonb),
 ('multi','PANIA Multi',1499,14990,null,null,'{"pos":true,"operacion":true,"finanzas":true,"inteligencia":true,"multisucursal":true}'::jsonb)
on conflict (codigo) do nothing;
