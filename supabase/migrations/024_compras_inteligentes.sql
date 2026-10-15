-- PANIA 2.5.7 — Compras Inteligentes
-- Migración maestra corregida y reejecutable.
-- Respeta la firma histórica de v_compras_saldo y v_compras_saldo_real.

alter table compras
  add column if not exists cuenta_pago_id uuid references cuentas_dinero(id);

alter table compras
  add column if not exists monto_pagado_inicial numeric(14,2) not null default 0;

alter table compras drop constraint if exists compras_monto_pagado_inicial_check;
alter table compras add constraint compras_monto_pagado_inicial_check
  check (monto_pagado_inicial >= 0);

alter table compras drop constraint if exists compras_condicion_pago_check;
alter table compras add constraint compras_condicion_pago_check
  check (condicion_pago in ('contado','credito','mixto'));

-- IMPORTANTE: no agregar/reordenar columnas aquí.
-- Otras vistas de PANIA dependen de esta firma histórica.
create or replace view v_compras_saldo with (security_invoker=true) as
select
  c.id,
  c.empresa_id,
  c.sucursal_id,
  c.proveedor_id,
  c.fecha,
  c.folio_factura,
  c.forma_pago,
  c.condicion_pago,
  c.vence_el,
  coalesce(d.total, 0)::numeric(14,2) as total,
  (coalesce(c.monto_pagado_inicial, 0) + coalesce(p.pagado, 0))::numeric(14,2) as pagado,
  greatest(
    coalesce(d.total, 0) - coalesce(c.monto_pagado_inicial, 0) - coalesce(p.pagado, 0),
    0
  )::numeric(14,2) as saldo,
  case
    when greatest(
      coalesce(d.total, 0) - coalesce(c.monto_pagado_inicial, 0) - coalesce(p.pagado, 0),
      0
    ) = 0 then 'pagada'
    when c.vence_el is not null and c.vence_el < current_date then 'vencida'
    else 'pendiente'
  end as estado_pago
from compras as c
left join (
  select compra_id, sum(subtotal) as total
  from compra_detalle
  group by compra_id
) as d on d.compra_id = c.id
left join (
  select compra_id, sum(monto) as pagado
  from pagos_proveedor
  group by compra_id
) as p on p.compra_id = c.id;

-- Conserva exactamente las 16 columnas históricas de esta vista.
create or replace view v_compras_saldo_real with (security_invoker=true) as
select
  v.id,
  v.empresa_id,
  v.sucursal_id,
  v.proveedor_id,
  v.fecha,
  v.folio_factura,
  v.forma_pago,
  v.condicion_pago,
  v.vence_el,
  v.total,
  v.pagado,
  v.saldo,
  v.estado_pago,
  case
    when v.condicion_pago = 'contado' then v.total
    else v.pagado
  end as pagado_real,
  case
    when v.condicion_pago = 'contado' then 0
    else v.saldo
  end as saldo_real,
  case
    when v.condicion_pago = 'contado' then 'pagada'
    else v.estado_pago
  end as estado_real
from v_compras_saldo as v;

create or replace function registrar_compra_integral(
  p_proveedor uuid,
  p_sucursal uuid,
  p_almacen uuid,
  p_fecha date,
  p_folio text,
  p_condicion text,
  p_cuenta uuid,
  p_pago_inicial numeric,
  p_vence date,
  p_lineas jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp uuid := mi_empresa_id();
  v_rol text := coalesce(mi_rol()::text, '');
  v_id uuid;
  v_total numeric(14,2);
  v_pago numeric(14,2) := greatest(coalesce(p_pago_inicial, 0), 0);
  v_saldo numeric(14,2);
  v_forma text;
  v_cuenta_saldo numeric(14,2);
begin
  if v_emp is null then
    raise exception 'Sin empresa activa';
  end if;

  if v_rol not in ('dueno','administrador','compras','contador') then
    raise exception 'Tu rol no puede registrar compras';
  end if;

  if p_proveedor is null or not exists (
    select 1 from proveedores
    where id = p_proveedor and empresa_id = v_emp and activo
  ) then
    raise exception 'Proveedor inválido';
  end if;

  if p_sucursal is null or not exists (
    select 1 from sucursales
    where id = p_sucursal and empresa_id = v_emp and activa
  ) then
    raise exception 'Sucursal inválida';
  end if;

  if p_almacen is null or not exists (
    select 1 from almacenes
    where id = p_almacen and empresa_id = v_emp and sucursal_id = p_sucursal
  ) then
    raise exception 'Selecciona un almacén válido';
  end if;

  if p_lineas is null
     or jsonb_typeof(p_lineas) <> 'array'
     or jsonb_array_length(p_lineas) = 0 then
    raise exception 'Agrega al menos un ingrediente';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_lineas) as x
    left join ingredientes as i
      on i.id = (x->>'ingrediente_id')::uuid
     and i.empresa_id = v_emp
     and i.activo
    where i.id is null
       or coalesce((x->>'cantidad')::numeric, 0) <= 0
       or coalesce((x->>'costo_unitario')::numeric, -1) < 0
  ) then
    raise exception 'Hay partidas inválidas';
  end if;

  select round(sum(
    (x->>'cantidad')::numeric * (x->>'costo_unitario')::numeric
  ), 2)
  into v_total
  from jsonb_array_elements(p_lineas) as x;

  if p_condicion not in ('contado','credito','mixto') then
    raise exception 'Condición de pago inválida';
  end if;

  if p_condicion = 'contado' then
    v_pago := v_total;
  end if;

  if v_pago > v_total then
    raise exception 'El pago supera el total';
  end if;

  v_saldo := v_total - v_pago;

  if v_pago > 0 then
    if p_cuenta is null then
      raise exception 'Selecciona la cuenta de donde saldrá el dinero';
    end if;

    select saldo
    into v_cuenta_saldo
    from v_saldos_dinero
    where id = p_cuenta and empresa_id = v_emp;

    if v_cuenta_saldo is null then
      raise exception 'Cuenta de pago inválida';
    end if;

    if v_cuenta_saldo < v_pago then
      raise exception 'Saldo insuficiente en la cuenta seleccionada';
    end if;

    select case
      when tipo = 'caja' then 'efectivo'
      else coalesce(nullif(banco, ''), 'banco')
    end
    into v_forma
    from cuentas_dinero
    where id = p_cuenta and empresa_id = v_emp and activa;

    if v_forma is null then
      raise exception 'Cuenta de pago inválida o inactiva';
    end if;
  end if;

  if v_saldo > 0 and p_vence is null then
    raise exception 'Indica la fecha de vencimiento del saldo pendiente';
  end if;

  insert into compras (
    empresa_id, sucursal_id, almacen_id, proveedor_id, fecha,
    folio_factura, forma_pago, condicion_pago, vence_el, creado_por,
    cuenta_pago_id, monto_pagado_inicial
  ) values (
    v_emp, p_sucursal, p_almacen, p_proveedor, coalesce(p_fecha, current_date),
    nullif(p_folio, ''), v_forma, p_condicion,
    case when v_saldo > 0 then p_vence else null end,
    auth.uid(), p_cuenta, v_pago
  ) returning id into v_id;

  -- El trigger t_compra_detalle_alta ya existente hace dos cosas por cada partida:
  -- 1) versiona el costo del ingrediente; 2) registra la entrada a inventario.
  insert into compra_detalle (
    empresa_id, compra_id, ingrediente_id, cantidad, costo_unitario
  )
  select
    v_emp,
    v_id,
    (x->>'ingrediente_id')::uuid,
    (x->>'cantidad')::numeric,
    (x->>'costo_unitario')::numeric
  from jsonb_array_elements(p_lineas) as x;

  if v_pago > 0 then
    insert into movimientos_dinero (
      empresa_id, sucursal_id, cuenta_id, fecha, tipo, concepto,
      monto, referencia, origen, origen_id, created_by
    ) values (
      v_emp, p_sucursal, p_cuenta, coalesce(p_fecha, current_date),
      'salida', 'Compra a proveedor', v_pago, nullif(p_folio, ''),
      'compra', v_id, auth.uid()
    );
  end if;

  return v_id;
end;
$$;

revoke all on function registrar_compra_integral(uuid,uuid,uuid,date,text,text,uuid,numeric,date,jsonb) from public;
grant execute on function registrar_compra_integral(uuid,uuid,uuid,date,text,text,uuid,numeric,date,jsonb) to authenticated;

create or replace function registrar_pago_compra(
  p_compra uuid,
  p_cuenta uuid,
  p_fecha date,
  p_monto numeric,
  p_referencia text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp uuid := mi_empresa_id();
  v_rol text := coalesce(mi_rol()::text, '');
  v_saldo numeric(14,2);
  v_disp numeric(14,2);
  v_suc uuid;
  v_pago uuid;
begin
  if v_emp is null then
    raise exception 'Sin empresa activa';
  end if;

  if v_rol not in ('dueno','administrador','compras','contador') then
    raise exception 'Sin permiso';
  end if;

  select saldo_real, sucursal_id
  into v_saldo, v_suc
  from v_compras_saldo_real
  where id = p_compra and empresa_id = v_emp;

  if v_saldo is null or p_monto <= 0 or p_monto > v_saldo + 0.01 then
    raise exception 'Monto inválido';
  end if;

  select saldo
  into v_disp
  from v_saldos_dinero
  where id = p_cuenta and empresa_id = v_emp;

  if v_disp is null or v_disp < p_monto then
    raise exception 'Saldo insuficiente';
  end if;

  insert into pagos_proveedor (
    empresa_id, compra_id, fecha, monto, forma_pago, referencia, creado_por
  ) values (
    v_emp, p_compra, coalesce(p_fecha, current_date), p_monto,
    'cuenta PANIA', nullif(p_referencia, ''), auth.uid()
  ) returning id into v_pago;

  insert into movimientos_dinero (
    empresa_id, sucursal_id, cuenta_id, fecha, tipo, concepto,
    monto, referencia, origen, origen_id, created_by
  ) values (
    v_emp, v_suc, p_cuenta, coalesce(p_fecha, current_date),
    'salida', 'Pago a proveedor', p_monto, nullif(p_referencia, ''),
    'pago_proveedor', v_pago, auth.uid()
  );

  return v_pago;
end;
$$;

revoke all on function registrar_pago_compra(uuid,uuid,date,numeric,text) from public;
grant execute on function registrar_pago_compra(uuid,uuid,date,numeric,text) to authenticated;
