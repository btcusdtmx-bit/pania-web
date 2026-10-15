-- PANIA | Guardia comercial de operaciones
-- No modifica datos existentes ni funciones operativas.

create or replace function public.pania_guardia_comercial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    if not coalesce(
      public.pania_acceso_vigente(old.empresa_id), false
    ) then
      raise exception 'PANIA: suscripción inactiva o vencida';
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if not coalesce(
      public.pania_acceso_vigente(new.empresa_id), false
    ) then
      raise exception 'PANIA: suscripción inactiva o vencida';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function public.pania_guardia_comercial()
from public, anon, authenticated;

-- TRIGGERS COMERCIALES
-- Protegen INSERT, UPDATE y DELETE.

drop trigger if exists trg_pania_vigencia_campanas_marketing on public.campanas_marketing;
create trigger trg_pania_vigencia_campanas_marketing
before insert or update or delete
on public.campanas_marketing
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_categorias on public.categorias;
create trigger trg_pania_vigencia_categorias
before insert or update or delete
on public.categorias
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_categorias_gasto on public.categorias_gasto;
create trigger trg_pania_vigencia_categorias_gasto
before insert or update or delete
on public.categorias_gasto
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_clientes on public.clientes;
create trigger trg_pania_vigencia_clientes
before insert or update or delete
on public.clientes
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_compra_detalle on public.compra_detalle;
create trigger trg_pania_vigencia_compra_detalle
before insert or update or delete
on public.compra_detalle
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_compras on public.compras;
create trigger trg_pania_vigencia_compras
before insert or update or delete
on public.compras
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_cuentas_dinero on public.cuentas_dinero;
create trigger trg_pania_vigencia_cuentas_dinero
before insert or update or delete
on public.cuentas_dinero
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_gastos on public.gastos;
create trigger trg_pania_vigencia_gastos
before insert or update or delete
on public.gastos
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_ingrediente_costos on public.ingrediente_costos;
create trigger trg_pania_vigencia_ingrediente_costos
before insert or update or delete
on public.ingrediente_costos
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_ingredientes on public.ingredientes;
create trigger trg_pania_vigencia_ingredientes
before insert or update or delete
on public.ingredientes
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_mermas on public.mermas;
create trigger trg_pania_vigencia_mermas
before insert or update or delete
on public.mermas
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_movimientos_dinero on public.movimientos_dinero;
create trigger trg_pania_vigencia_movimientos_dinero
before insert or update or delete
on public.movimientos_dinero
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_movimientos_inventario on public.movimientos_inventario;
create trigger trg_pania_vigencia_movimientos_inventario
before insert or update or delete
on public.movimientos_inventario
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_ordenes_produccion on public.ordenes_produccion;
create trigger trg_pania_vigencia_ordenes_produccion
before insert or update or delete
on public.ordenes_produccion
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_presupuestos_gasto on public.presupuestos_gasto;
create trigger trg_pania_vigencia_presupuestos_gasto
before insert or update or delete
on public.presupuestos_gasto
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_produccion_consumo on public.produccion_consumo;
create trigger trg_pania_vigencia_produccion_consumo
before insert or update or delete
on public.produccion_consumo
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_produccion_detalle on public.produccion_detalle;
create trigger trg_pania_vigencia_produccion_detalle
before insert or update or delete
on public.produccion_detalle
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_productos on public.productos;
create trigger trg_pania_vigencia_productos
before insert or update or delete
on public.productos
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_proveedores on public.proveedores;
create trigger trg_pania_vigencia_proveedores
before insert or update or delete
on public.proveedores
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_receta_detalle on public.receta_detalle;
create trigger trg_pania_vigencia_receta_detalle
before insert or update or delete
on public.receta_detalle
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_recetas on public.recetas;
create trigger trg_pania_vigencia_recetas
before insert or update or delete
on public.recetas
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_venta_detalle on public.venta_detalle;
create trigger trg_pania_vigencia_venta_detalle
before insert or update or delete
on public.venta_detalle
for each row
execute function public.pania_guardia_comercial();

drop trigger if exists trg_pania_vigencia_ventas on public.ventas;
create trigger trg_pania_vigencia_ventas
before insert or update or delete
on public.ventas
for each row
execute function public.pania_guardia_comercial();
