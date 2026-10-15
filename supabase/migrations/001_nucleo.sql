-- =====================================================================
-- PANADERÍA — NÚCLEO: recetas → costos → compras → inventario →
--             producción → ventas → utilidad  (+ Radar de Utilidad)
-- Destino: Supabase / PostgreSQL 15+
--
-- Convenciones
--  * Todas las tablas de negocio llevan empresa_id (RLS multi-empresa).
--    Los movimientos operativos llevan además sucursal_id.
--  * El stock NO se edita: se calcula sumando movimientos_inventario.
--  * Los costos de ingredientes están versionados (vigente_desde).
--  * Precios en venta_detalle van SIN IVA; productos.precio_publico lleva IVA.
--  * Cantidad en movimientos: positiva = entra, negativa = sale.
--  * "Utilidad" del Radar en esta fase = utilidad BRUTA (ventas netas − costo
--    del producto vendido). Gastos operativos llegan en la Fase 6.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Tipos ----------------------------------------------------
create type rol_usuario as enum
  ('dueno','administrador','contador','encargado','produccion','compras','caja','marketing','consulta');
create type tipo_movimiento as enum
  ('compra','consumo_produccion','entrada_produccion','venta','merma','ajuste',
   'transferencia_salida','transferencia_entrada','devolucion');
create type motivo_merma as enum
  ('quemado','mala_preparacion','caducidad','dano','error_produccion',
   'no_vendido','devolucion','faltante','otro');
create type estado_orden as enum ('planeada','en_proceso','cerrada');
create type canal_venta as enum
  ('mostrador','whatsapp','facebook','instagram','pedido','delivery','mayoreo','otro');

-- ---------- CORE -----------------------------------------------------
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  rfc text,
  creado_en timestamptz not null default now()
);

create table sucursales (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nombre text not null,
  activa boolean not null default true,
  unique (empresa_id, nombre)
);

create table almacenes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  sucursal_id uuid not null references sucursales(id),
  nombre text not null,
  unique (sucursal_id, nombre)
);

-- Usuarios: extiende auth.users de Supabase
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid not null references empresas(id),
  sucursal_id uuid references sucursales(id),
  nombre text not null,
  rol rol_usuario not null default 'consulta',
  activo boolean not null default true
);

create table categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  tipo text not null check (tipo in ('producto','ingrediente')),
  nombre text not null,
  unique (empresa_id, tipo, nombre)
);

create table proveedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nombre text not null,
  rfc text,
  dias_credito int not null default 0,
  activo boolean not null default true
);

-- ---------- CATÁLOGO: ingredientes, productos, recetas ---------------
create table ingredientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  nombre text not null,
  categoria_id uuid references categorias(id),
  tipo text not null default 'materia_prima' check (tipo in ('materia_prima','empaque')),
  unidad text not null,                       -- unidad base: kg, l, pza...
  stock_minimo numeric(14,4) not null default 0,
  stock_maximo numeric(14,4),
  activo boolean not null default true,
  unique (empresa_id, nombre)
);

-- Historial de costo por unidad base (versionado)
create table ingrediente_costos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  ingrediente_id uuid not null references ingredientes(id),
  costo_unitario numeric(14,4) not null check (costo_unitario >= 0),
  vigente_desde timestamptz not null default now(),
  origen text not null default 'manual' check (origen in ('manual','compra','importacion')),
  compra_detalle_id uuid
);
create index on ingrediente_costos (ingrediente_id, vigente_desde desc);

create table productos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  sku text not null,
  nombre text not null,
  categoria_id uuid references categorias(id),
  unidad text not null default 'pza',
  precio_publico numeric(12,2) not null check (precio_publico >= 0),  -- con IVA
  iva_tasa numeric(5,4) not null default 0,                           -- 0 ó 0.16
  costo_base_precio numeric(12,4),   -- costo con el que se fijó el precio (para "margen erosionado")
  vida_util_dias int,
  activo boolean not null default true,
  unique (empresa_id, sku)
);

create table recetas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  producto_id uuid not null references productos(id),
  version int not null default 1,
  rendimiento_piezas numeric(12,2) not null check (rendimiento_piezas > 0),
  merma_esperada_pct numeric(5,2) not null default 0 check (merma_esperada_pct between 0 and 100),
  mano_obra_lote numeric(12,2) not null default 0,
  energia_lote numeric(12,2) not null default 0,   -- gas, luz, agua
  otros_lote numeric(12,2) not null default 0,
  vigente boolean not null default true,
  unique (producto_id, version)
);
create unique index recetas_una_vigente on recetas (producto_id) where vigente;

create table receta_detalle (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  receta_id uuid not null references recetas(id) on delete cascade,
  ingrediente_id uuid not null references ingredientes(id),
  cantidad numeric(14,4) not null check (cantidad > 0),   -- por lote, en unidad base
  unique (receta_id, ingrediente_id)
);

-- ---------- COMPRAS --------------------------------------------------
create table compras (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  sucursal_id uuid not null references sucursales(id),
  almacen_id uuid references almacenes(id),
  proveedor_id uuid not null references proveedores(id),
  fecha date not null default current_date,
  folio_factura text,
  forma_pago text,
  vence_el date,
  creado_por uuid references perfiles(id),
  creado_en timestamptz not null default now()
);

create table compra_detalle (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  compra_id uuid not null references compras(id) on delete cascade,
  ingrediente_id uuid not null references ingredientes(id),
  cantidad numeric(14,4) not null check (cantidad > 0),
  costo_unitario numeric(14,4) not null check (costo_unitario >= 0),
  subtotal numeric(14,2) generated always as (round(cantidad * costo_unitario, 2)) stored
);

-- ---------- INVENTARIO (fuente única de verdad) ----------------------
create table movimientos_inventario (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  sucursal_id uuid not null references sucursales(id),
  almacen_id uuid references almacenes(id),
  ocurrido_en timestamptz not null default now(),
  tipo tipo_movimiento not null,
  ingrediente_id uuid references ingredientes(id),
  producto_id uuid references productos(id),
  cantidad numeric(14,4) not null,          -- con signo
  costo_unitario numeric(14,4),
  referencia_tabla text,
  referencia_id uuid,
  turno text,
  creado_por uuid references perfiles(id),
  check ((ingrediente_id is null) <> (producto_id is null))   -- uno u otro
);
create index on movimientos_inventario (empresa_id, sucursal_id, ocurrido_en);
create index on movimientos_inventario (ingrediente_id) where ingrediente_id is not null;
create index on movimientos_inventario (producto_id) where producto_id is not null;

-- ---------- PRODUCCIÓN y MERMAS --------------------------------------
create table ordenes_produccion (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  sucursal_id uuid not null references sucursales(id),
  fecha date not null default current_date,
  turno text,
  responsable_id uuid references perfiles(id),
  hora_inicio timestamptz,
  hora_fin timestamptz,
  estado estado_orden not null default 'planeada'
);

create table produccion_detalle (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  orden_id uuid not null references ordenes_produccion(id) on delete cascade,
  producto_id uuid not null references productos(id),
  receta_id uuid not null references recetas(id),
  piezas_planeadas numeric(12,2) not null default 0,
  piezas_reales numeric(12,2) not null default 0,     -- buenas, entran a inventario
  piezas_merma numeric(12,2) not null default 0,      -- perdidas durante producción
  merma_motivo motivo_merma not null default 'error_produccion',
  costo_real_pieza numeric(14,4),                     -- se llena al cerrar la orden
  unique (orden_id, producto_id)
);

-- Teórico vs real, por ingrediente
create table produccion_consumo (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  orden_id uuid not null references ordenes_produccion(id) on delete cascade,
  produccion_detalle_id uuid not null references produccion_detalle(id) on delete cascade,
  ingrediente_id uuid not null references ingredientes(id),
  cantidad_teorica numeric(14,4) not null default 0,
  cantidad_real numeric(14,4) not null default 0,
  costo_unitario numeric(14,4),
  unique (produccion_detalle_id, ingrediente_id)
);

create table mermas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  sucursal_id uuid not null references sucursales(id),
  almacen_id uuid references almacenes(id),
  fecha date not null default current_date,
  turno text,
  producto_id uuid references productos(id),
  ingrediente_id uuid references ingredientes(id),
  cantidad numeric(14,4) not null check (cantidad > 0),
  costo_unitario numeric(14,4) not null default 0,
  motivo motivo_merma not null,
  origen text not null default 'almacen' check (origen in ('produccion','almacen')),
  orden_id uuid references ordenes_produccion(id),
  registrado_por uuid references perfiles(id),
  evidencia_url text,
  check ((ingrediente_id is null) <> (producto_id is null))
);

-- ---------- VENTAS ---------------------------------------------------
create table ventas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  sucursal_id uuid not null references sucursales(id),
  fecha_hora timestamptz not null default now(),
  turno text,
  vendedor_id uuid references perfiles(id),
  canal canal_venta not null default 'mostrador',
  forma_pago text,
  estado text not null default 'cerrada' check (estado in ('cerrada','cancelada'))
);
create index on ventas (empresa_id, sucursal_id, fecha_hora);

create table venta_detalle (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id),
  venta_id uuid not null references ventas(id) on delete cascade,
  producto_id uuid not null references productos(id),
  cantidad numeric(12,2) not null check (cantidad > 0),
  precio_unitario_neto numeric(12,4),     -- sin IVA; si es null se toma del producto
  iva_tasa numeric(5,4),
  costo_unitario numeric(14,4),           -- snapshot del costo REAL al vender
  costo_estandar_unitario numeric(14,4)   -- snapshot del costo ESTÁNDAR de receta (para margen erosionado)
);

-- ---------- AUDITORÍA ------------------------------------------------
create table auditoria (
  id bigint generated always as identity primary key,
  empresa_id uuid,
  usuario_id uuid,
  ocurrido_en timestamptz not null default now(),
  operacion text not null,
  tabla text not null,
  registro_id uuid,
  valor_anterior jsonb,
  valor_nuevo jsonb
);

-- =====================================================================
-- FUNCIONES
-- =====================================================================

-- Costo vigente de un ingrediente a una fecha
create or replace function costo_ingrediente(p_ing uuid, p_fecha timestamptz default now())
returns numeric language sql stable as $$
  select costo_unitario from ingrediente_costos
  where ingrediente_id = p_ing and vigente_desde <= p_fecha
  order by vigente_desde desc limit 1
$$;

-- Empresa del usuario autenticado (para RLS)
create or replace function mi_empresa_id()
returns uuid language sql stable security definer set search_path = public as $$
  select empresa_id from perfiles where id = auth.uid()
$$;

-- =====================================================================
-- VISTAS DE COSTEO
-- =====================================================================

create or replace view v_costo_receta with (security_invoker = true) as
select
  r.id  as receta_id, r.empresa_id, r.producto_id, p.sku, p.nombre as producto,
  r.rendimiento_piezas, r.merma_esperada_pct,
  coalesce(sum(rd.cantidad * c.costo_unitario), 0)                    as costo_mp_lote,
  count(rd.id) filter (where c.costo_unitario is null)                as ingredientes_sin_costo,
  r.mano_obra_lote + r.energia_lote + r.otros_lote                    as costo_conversion_lote,
  round((coalesce(sum(rd.cantidad * c.costo_unitario), 0)
         + r.mano_obra_lote + r.energia_lote + r.otros_lote) / r.rendimiento_piezas, 4) as costo_pieza,
  round(p.precio_publico / (1 + p.iva_tasa), 4)                       as precio_neto,
  case when count(rd.id) = 0 or count(rd.id) filter (where c.costo_unitario is null) > 0
       then 'baja' else 'alta' end                                    as calidad_dato
from recetas r
join productos p on p.id = r.producto_id
left join receta_detalle rd on rd.receta_id = r.id
left join lateral (
  select ic.costo_unitario from ingrediente_costos ic
  where ic.ingrediente_id = rd.ingrediente_id
  order by ic.vigente_desde desc limit 1
) c on true
where r.vigente
group by r.id, p.id;

-- Margen por producto (estándar)
create or replace view v_margen_producto with (security_invoker = true) as
select receta_id, empresa_id, producto_id, sku, producto, costo_pieza, precio_neto,
       round(precio_neto - costo_pieza, 4) as utilidad_pieza,
       round((precio_neto - costo_pieza) / nullif(precio_neto, 0) * 100, 2) as margen_pct,
       calidad_dato
from v_costo_receta;

-- Costo actual de un producto: último costo real de producción; si no hay, el estándar
create or replace function costo_producto(p_prod uuid)
returns numeric language sql stable as $$
  select coalesce(
    (select costo_unitario from movimientos_inventario
      where producto_id = p_prod and tipo = 'entrada_produccion'
      order by ocurrido_en desc limit 1),
    (select costo_pieza from v_costo_receta where producto_id = p_prod limit 1))
$$;

-- Stock actual (suma de movimientos)
create or replace view v_stock_ingredientes with (security_invoker = true) as
select m.empresa_id, m.sucursal_id, i.id as ingrediente_id, i.nombre, i.unidad,
       sum(m.cantidad) as stock, i.stock_minimo,
       (sum(m.cantidad) < i.stock_minimo) as bajo_minimo
from movimientos_inventario m join ingredientes i on i.id = m.ingrediente_id
group by m.empresa_id, m.sucursal_id, i.id;

create or replace view v_stock_productos with (security_invoker = true) as
select m.empresa_id, m.sucursal_id, p.id as producto_id, p.nombre, sum(m.cantidad) as stock
from movimientos_inventario m join productos p on p.id = m.producto_id
group by m.empresa_id, m.sucursal_id, p.id;

-- =====================================================================
-- TRIGGERS: automatización (evitar doble captura)
-- =====================================================================

-- COMPRA → nuevo costo versionado + entrada de inventario
create or replace function trg_compra_detalle_alta() returns trigger language plpgsql as $$
declare c compras;
begin
  select * into c from compras where id = new.compra_id;
  insert into ingrediente_costos (empresa_id, ingrediente_id, costo_unitario, vigente_desde, origen, compra_detalle_id)
  values (new.empresa_id, new.ingrediente_id, new.costo_unitario, c.fecha::timestamptz, 'compra', new.id);
  insert into movimientos_inventario
    (empresa_id, sucursal_id, almacen_id, ocurrido_en, tipo, ingrediente_id, cantidad, costo_unitario,
     referencia_tabla, referencia_id, creado_por)
  values (new.empresa_id, c.sucursal_id, c.almacen_id, c.fecha::timestamptz, 'compra', new.ingrediente_id,
          new.cantidad, new.costo_unitario, 'compra_detalle', new.id, c.creado_por);
  return new;
end $$;
create trigger t_compra_detalle_alta after insert on compra_detalle
  for each row execute function trg_compra_detalle_alta();

-- VENTA → costo snapshot, precio neto y salida de inventario
create or replace function trg_venta_detalle_antes() returns trigger language plpgsql as $$
declare p productos;
begin
  select * into p from productos where id = new.producto_id;
  new.iva_tasa := coalesce(new.iva_tasa, p.iva_tasa);
  new.precio_unitario_neto := coalesce(new.precio_unitario_neto, round(p.precio_publico / (1 + p.iva_tasa), 4));
  new.costo_unitario := coalesce(new.costo_unitario, costo_producto(new.producto_id));
  new.costo_estandar_unitario := coalesce(new.costo_estandar_unitario,
    (select costo_pieza from v_costo_receta where producto_id = new.producto_id limit 1));
  return new;
end $$;
create trigger t_venta_detalle_antes before insert on venta_detalle
  for each row execute function trg_venta_detalle_antes();

create or replace function trg_venta_detalle_despues() returns trigger language plpgsql as $$
declare v ventas;
begin
  select * into v from ventas where id = new.venta_id;
  insert into movimientos_inventario
    (empresa_id, sucursal_id, ocurrido_en, tipo, producto_id, cantidad, costo_unitario,
     referencia_tabla, referencia_id, turno, creado_por)
  values (new.empresa_id, v.sucursal_id, v.fecha_hora, 'venta', new.producto_id, -new.cantidad,
          new.costo_unitario, 'venta_detalle', new.id, v.turno, v.vendedor_id);
  return new;
end $$;
create trigger t_venta_detalle_despues after insert on venta_detalle
  for each row execute function trg_venta_detalle_despues();

-- MERMA de almacén → salida de inventario (la de producción ya no entró)
create or replace function trg_merma_alta() returns trigger language plpgsql as $$
begin
  if new.origen = 'almacen' then
    insert into movimientos_inventario
      (empresa_id, sucursal_id, almacen_id, ocurrido_en, tipo, ingrediente_id, producto_id, cantidad,
       costo_unitario, referencia_tabla, referencia_id, turno, creado_por)
    values (new.empresa_id, new.sucursal_id, new.almacen_id, new.fecha::timestamptz, 'merma',
            new.ingrediente_id, new.producto_id, -new.cantidad, new.costo_unitario,
            'mermas', new.id, new.turno, new.registrado_por);
  end if;
  return new;
end $$;
create trigger t_merma_alta after insert on mermas
  for each row execute function trg_merma_alta();

-- AUDITORÍA genérica (valor anterior / nuevo)
create or replace function trg_auditar() returns trigger language plpgsql security definer set search_path = public as $$
declare v_old jsonb := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end;
        v_new jsonb := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end;
begin
  insert into auditoria (empresa_id, usuario_id, operacion, tabla, registro_id, valor_anterior, valor_nuevo)
  values (coalesce((v_new->>'empresa_id')::uuid, (v_old->>'empresa_id')::uuid), auth.uid(), tg_op, tg_table_name,
          coalesce((v_new->>'id')::uuid, (v_old->>'id')::uuid), v_old, v_new);
  return coalesce(new, old);
end $$;

do $$ declare t text; begin
  foreach t in array array['productos','ingredientes','ingrediente_costos','recetas','receta_detalle',
                           'proveedores','compras','mermas','ventas'] loop
    execute format('create trigger t_aud_%1$s after insert or update or delete on %1$s
                    for each row execute function trg_auditar()', t);
  end loop;
end $$;

-- =====================================================================
-- CIERRE DE ORDEN DE PRODUCCIÓN
--  1) calcula consumo teórico (conserva el real si ya fue capturado)
--  2) descuenta ingredientes  3) da entrada al producto terminado
--  4) calcula costo real por pieza  5) registra merma de producción
-- =====================================================================
create or replace function cerrar_orden_produccion(p_orden uuid) returns void
language plpgsql as $$
declare o ordenes_produccion; d record; v_lotes numeric; v_costo_ins numeric; v_costo_pieza numeric;
begin
  select * into o from ordenes_produccion where id = p_orden for update;
  if o.id is null then raise exception 'Orden % no existe', p_orden; end if;
  if o.estado = 'cerrada' then raise exception 'La orden ya está cerrada'; end if;

  for d in
    select pd.*, rc.rendimiento_piezas, rc.mano_obra_lote, rc.energia_lote, rc.otros_lote
    from produccion_detalle pd join recetas rc on rc.id = pd.receta_id
    where pd.orden_id = p_orden
  loop
    v_lotes := (d.piezas_reales + d.piezas_merma) / d.rendimiento_piezas;

    insert into produccion_consumo
      (empresa_id, orden_id, produccion_detalle_id, ingrediente_id, cantidad_teorica, cantidad_real, costo_unitario)
    select o.empresa_id, p_orden, d.id, rd.ingrediente_id, rd.cantidad * v_lotes, rd.cantidad * v_lotes,
           costo_ingrediente(rd.ingrediente_id, o.fecha::timestamptz)
    from receta_detalle rd where rd.receta_id = d.receta_id
    on conflict (produccion_detalle_id, ingrediente_id)
      do update set cantidad_teorica = excluded.cantidad_teorica, costo_unitario = excluded.costo_unitario;

    -- consumo extra capturado a mano (no está en receta): completar costo
    update produccion_consumo
       set costo_unitario = costo_ingrediente(ingrediente_id, o.fecha::timestamptz)
     where produccion_detalle_id = d.id and costo_unitario is null;

    select coalesce(sum(cantidad_real * costo_unitario), 0) into v_costo_ins
      from produccion_consumo where produccion_detalle_id = d.id;

    v_costo_pieza := case when d.piezas_reales > 0
      then (v_costo_ins + (d.mano_obra_lote + d.energia_lote + d.otros_lote) * v_lotes) / d.piezas_reales end;
    update produccion_detalle set costo_real_pieza = v_costo_pieza where id = d.id;

    insert into movimientos_inventario
      (empresa_id, sucursal_id, ocurrido_en, tipo, ingrediente_id, cantidad, costo_unitario,
       referencia_tabla, referencia_id, turno, creado_por)
    select o.empresa_id, o.sucursal_id, o.fecha::timestamptz, 'consumo_produccion', pc.ingrediente_id,
           -pc.cantidad_real, pc.costo_unitario, 'produccion_detalle', d.id, o.turno, o.responsable_id
    from produccion_consumo pc where pc.produccion_detalle_id = d.id;

    if d.piezas_reales > 0 then
      insert into movimientos_inventario
        (empresa_id, sucursal_id, ocurrido_en, tipo, producto_id, cantidad, costo_unitario,
         referencia_tabla, referencia_id, turno, creado_por)
      values (o.empresa_id, o.sucursal_id, o.fecha::timestamptz, 'entrada_produccion', d.producto_id,
              d.piezas_reales, v_costo_pieza, 'produccion_detalle', d.id, o.turno, o.responsable_id);
    end if;

    if d.piezas_merma > 0 then
      insert into mermas (empresa_id, sucursal_id, fecha, turno, producto_id, cantidad, costo_unitario,
                          motivo, origen, orden_id, registrado_por)
      values (o.empresa_id, o.sucursal_id, o.fecha, o.turno, d.producto_id, d.piezas_merma,
              coalesce((select costo_pieza from v_costo_receta where receta_id = d.receta_id), 0),
              d.merma_motivo, 'produccion', p_orden, o.responsable_id);
    end if;
  end loop;

  update ordenes_produccion set estado = 'cerrada', hora_fin = coalesce(hora_fin, now()) where id = p_orden;
end $$;

-- =====================================================================
-- RADAR DE UTILIDAD (vistas diarias por sucursal)
--  Zona horaria fija para agrupar por día; ajustar si cambia.
--  HECHOS medibles: merma, insumos, margen erosionado.
--  ESTIMACIÓN (calidad media): sobreproducción.
--  Pendiente (estimación, otra fase): venta perdida por agotado.
-- =====================================================================

create or replace view v_utilidad_dia with (security_invoker = true) as
select v.empresa_id, v.sucursal_id,
       (v.fecha_hora at time zone 'America/Mexico_City')::date as fecha,
       round(sum(d.cantidad * d.precio_unitario_neto), 2)                       as ventas_netas,
       round(sum(d.cantidad * coalesce(d.costo_unitario, 0)), 2)                as costo_vendido,
       round(sum(d.cantidad * (d.precio_unitario_neto - coalesce(d.costo_unitario, 0))), 2) as utilidad_bruta,
       count(distinct v.id)                                                     as tickets,
       count(*) filter (where d.costo_unitario is null or d.costo_unitario = 0) as lineas_sin_costo
from ventas v join venta_detalle d on d.venta_id = v.id
where v.estado = 'cerrada'
group by 1, 2, 3;

-- Merma por encima del estándar de la receta (producción) + merma de almacén completa
create or replace view v_fuga_merma_dia with (security_invoker = true) as
with prod as (
  select o.empresa_id, o.sucursal_id, o.fecha,
         greatest(0, pd.piezas_merma - rc.merma_esperada_pct / 100 * (pd.piezas_reales + pd.piezas_merma))
           * coalesce(cr.costo_pieza, 0) as fuga
  from produccion_detalle pd
  join ordenes_produccion o on o.id = pd.orden_id and o.estado = 'cerrada'
  join recetas rc on rc.id = pd.receta_id
  left join v_costo_receta cr on cr.receta_id = rc.id
), alm as (
  select empresa_id, sucursal_id, fecha, cantidad * costo_unitario as fuga
  from mermas where origen = 'almacen'
)
select empresa_id, sucursal_id, fecha, round(sum(fuga), 2) as fuga_merma
from (select * from prod union all select * from alm) x
group by 1, 2, 3;

-- Consumo real de insumos sobre el teórico
create or replace view v_fuga_insumos_dia with (security_invoker = true) as
select o.empresa_id, o.sucursal_id, o.fecha,
       round(sum(greatest(0, pc.cantidad_real - pc.cantidad_teorica) * coalesce(pc.costo_unitario, 0)), 2) as fuga_insumos
from produccion_consumo pc join ordenes_produccion o on o.id = pc.orden_id and o.estado = 'cerrada'
group by 1, 2, 3;

-- Margen erosionado: costo ESTÁNDAR por encima del costo con el que se fijó el precio.
-- Usa el estándar (no el real) para no contar dos veces la merma y los insumos de más.
create or replace view v_fuga_margen_dia with (security_invoker = true) as
select v.empresa_id, v.sucursal_id,
       (v.fecha_hora at time zone 'America/Mexico_City')::date as fecha,
       round(sum(greatest(0, d.costo_estandar_unitario - p.costo_base_precio) * d.cantidad), 2) as fuga_margen
from ventas v
join venta_detalle d on d.venta_id = v.id
join productos p on p.id = d.producto_id and p.costo_base_precio is not null
where v.estado = 'cerrada'
group by 1, 2, 3;

-- Sobreproducción: piezas producidas que no se vendieron ni se mermaron, por encima
-- de lo normal (promedio móvil de las 28 observaciones previas). ESTIMACIÓN.
create or replace view v_fuga_sobreproduccion_dia with (security_invoker = true) as
with dia as (
  select o.empresa_id, o.sucursal_id, o.fecha, pd.producto_id,
         sum(pd.piezas_reales) as producido,
         max(coalesce(pd.costo_real_pieza, 0)) as costo
  from produccion_detalle pd join ordenes_produccion o on o.id = pd.orden_id and o.estado = 'cerrada'
  group by 1, 2, 3, 4
), calc as (
  select dia.*,
         coalesce((select sum(d.cantidad) from ventas v join venta_detalle d on d.venta_id = v.id
                    where v.sucursal_id = dia.sucursal_id and d.producto_id = dia.producto_id
                      and v.estado = 'cerrada'
                      and (v.fecha_hora at time zone 'America/Mexico_City')::date = dia.fecha), 0) as vendido,
         coalesce((select sum(m.cantidad) from mermas m
                    where m.sucursal_id = dia.sucursal_id and m.producto_id = dia.producto_id
                      and m.origen = 'almacen' and m.fecha = dia.fecha), 0) as merma_alm
  from dia
), exc as (
  select *, greatest(0, producido - vendido - merma_alm) as excedente from calc
), base as (
  select *, coalesce(avg(excedente) over (
            partition by sucursal_id, producto_id order by fecha
            rows between 28 preceding and 1 preceding), 0) as excedente_normal
  from exc
)
select empresa_id, sucursal_id, fecha,
       round(sum(greatest(0, excedente - excedente_normal) * costo), 2) as fuga_sobreproduccion
from base group by 1, 2, 3;

-- Radar: utilidad del día + fugas + utilidad potencial
create or replace view v_radar_utilidad_dia with (security_invoker = true) as
select u.empresa_id, u.sucursal_id, u.fecha,
       u.ventas_netas, u.utilidad_bruta,
       coalesce(m.fuga_merma, 0)             as fuga_merma,
       coalesce(i.fuga_insumos, 0)           as fuga_insumos,
       coalesce(g.fuga_margen, 0)            as fuga_margen,
       coalesce(m.fuga_merma,0) + coalesce(i.fuga_insumos,0) + coalesce(g.fuga_margen,0) as fugas_medibles,
       coalesce(s.fuga_sobreproduccion, 0)   as fuga_sobreproduccion_estimada,
       u.utilidad_bruta + coalesce(m.fuga_merma,0) + coalesce(i.fuga_insumos,0) + coalesce(g.fuga_margen,0)
                                             as utilidad_potencial_medible,
       case when u.lineas_sin_costo > 0 then 'baja' else 'alta' end as calidad_dato
from v_utilidad_dia u
left join v_fuga_merma_dia  m using (empresa_id, sucursal_id, fecha)
left join v_fuga_insumos_dia i using (empresa_id, sucursal_id, fecha)
left join v_fuga_margen_dia  g using (empresa_id, sucursal_id, fecha)
left join v_fuga_sobreproduccion_dia s using (empresa_id, sucursal_id, fecha);

-- =====================================================================
-- RLS: cada usuario ve solo su empresa.
-- (Permisos por rol, p. ej. caja solo inserta ventas, se afinan en Fase 1.)
-- =====================================================================
do $$ declare t text; begin
  foreach t in array array['sucursales','almacenes','perfiles','categorias','proveedores','ingredientes',
    'ingrediente_costos','productos','recetas','receta_detalle','compras','compra_detalle',
    'movimientos_inventario','ordenes_produccion','produccion_detalle','produccion_consumo','mermas',
    'ventas','venta_detalle','auditoria'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy empresa_%1$s on %1$I using (empresa_id = mi_empresa_id())
                    with check (empresa_id = mi_empresa_id())', t);
  end loop;
  alter table empresas enable row level security;
  create policy empresa_propia on empresas using (id = mi_empresa_id());
end $$;
