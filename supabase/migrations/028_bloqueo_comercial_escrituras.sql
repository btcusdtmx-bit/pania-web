-- PANIA | Restricciones comerciales de escritura
-- Mantiene lectura independiente de la vigencia.

drop policy if exists pania_vigencia_productos on public.productos;
drop policy if exists pania_vigencia_productos on public.productos;
drop policy if exists pania_vigencia_categorias on public.categorias;
drop policy if exists pania_vigencia_categorias on public.categorias;
drop policy if exists pania_vigencia_ingredientes on public.ingredientes;
drop policy if exists pania_vigencia_ingredientes on public.ingredientes;
drop policy if exists pania_vigencia_ingrediente_costos on public.ingrediente_costos;
drop policy if exists pania_vigencia_ingrediente_costos on public.ingrediente_costos;
drop policy if exists pania_vigencia_recetas on public.recetas;
drop policy if exists pania_vigencia_recetas on public.recetas;
drop policy if exists pania_vigencia_receta_detalle on public.receta_detalle;
drop policy if exists pania_vigencia_receta_detalle on public.receta_detalle;
drop policy if exists pania_vigencia_proveedores on public.proveedores;
drop policy if exists pania_vigencia_proveedores on public.proveedores;
drop policy if exists pania_vigencia_compras on public.compras;
drop policy if exists pania_vigencia_compras on public.compras;
drop policy if exists pania_vigencia_compra_detalle on public.compra_detalle;
drop policy if exists pania_vigencia_compra_detalle on public.compra_detalle;
drop policy if exists pania_vigencia_movimientos_inventario on public.movimientos_inventario;
drop policy if exists pania_vigencia_movimientos_inventario on public.movimientos_inventario;
drop policy if exists pania_vigencia_ordenes_produccion on public.ordenes_produccion;
drop policy if exists pania_vigencia_ordenes_produccion on public.ordenes_produccion;
drop policy if exists pania_vigencia_produccion_detalle on public.produccion_detalle;
drop policy if exists pania_vigencia_produccion_detalle on public.produccion_detalle;
drop policy if exists pania_vigencia_produccion_consumo on public.produccion_consumo;
drop policy if exists pania_vigencia_produccion_consumo on public.produccion_consumo;
drop policy if exists pania_vigencia_mermas on public.mermas;
drop policy if exists pania_vigencia_mermas on public.mermas;
drop policy if exists pania_vigencia_ventas on public.ventas;
drop policy if exists pania_vigencia_ventas on public.ventas;
drop policy if exists pania_vigencia_venta_detalle on public.venta_detalle;
drop policy if exists pania_vigencia_venta_detalle on public.venta_detalle;
drop policy if exists pania_vigencia_clientes on public.clientes;
drop policy if exists pania_vigencia_clientes on public.clientes;
drop policy if exists pania_vigencia_campanas_marketing on public.campanas_marketing;
drop policy if exists pania_vigencia_campanas_marketing on public.campanas_marketing;
drop policy if exists pania_vigencia_categorias_gasto on public.categorias_gasto;
drop policy if exists pania_vigencia_categorias_gasto on public.categorias_gasto;
drop policy if exists pania_vigencia_gastos on public.gastos;
drop policy if exists pania_vigencia_gastos on public.gastos;
drop policy if exists pania_vigencia_cuentas_dinero on public.cuentas_dinero;
drop policy if exists pania_vigencia_cuentas_dinero on public.cuentas_dinero;
drop policy if exists pania_vigencia_movimientos_dinero on public.movimientos_dinero;
drop policy if exists pania_vigencia_movimientos_dinero on public.movimientos_dinero;
drop policy if exists pania_vigencia_presupuestos_gasto on public.presupuestos_gasto;
drop policy if exists pania_vigencia_presupuestos_gasto on public.presupuestos_gasto;

-- PANIA | Bloqueo comercial de escrituras
-- Conserva las políticas existentes.
-- No restringe SELECT para preservar consulta de datos.

drop policy if exists pania_vigencia_productos_insert on public.productos;
create policy pania_vigencia_productos_insert on public.productos as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_productos_update on public.productos;
create policy pania_vigencia_productos_update on public.productos as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_productos_delete on public.productos;
create policy pania_vigencia_productos_delete on public.productos as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_categorias_insert on public.categorias;
create policy pania_vigencia_categorias_insert on public.categorias as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_categorias_update on public.categorias;
create policy pania_vigencia_categorias_update on public.categorias as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_categorias_delete on public.categorias;
create policy pania_vigencia_categorias_delete on public.categorias as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_ingredientes_insert on public.ingredientes;
create policy pania_vigencia_ingredientes_insert on public.ingredientes as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ingredientes_update on public.ingredientes;
create policy pania_vigencia_ingredientes_update on public.ingredientes as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ingredientes_delete on public.ingredientes;
create policy pania_vigencia_ingredientes_delete on public.ingredientes as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_ingrediente_costos_insert on public.ingrediente_costos;
create policy pania_vigencia_ingrediente_costos_insert on public.ingrediente_costos as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ingrediente_costos_update on public.ingrediente_costos;
create policy pania_vigencia_ingrediente_costos_update on public.ingrediente_costos as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ingrediente_costos_delete on public.ingrediente_costos;
create policy pania_vigencia_ingrediente_costos_delete on public.ingrediente_costos as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_recetas_insert on public.recetas;
create policy pania_vigencia_recetas_insert on public.recetas as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_recetas_update on public.recetas;
create policy pania_vigencia_recetas_update on public.recetas as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_recetas_delete on public.recetas;
create policy pania_vigencia_recetas_delete on public.recetas as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_receta_detalle_insert on public.receta_detalle;
create policy pania_vigencia_receta_detalle_insert on public.receta_detalle as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_receta_detalle_update on public.receta_detalle;
create policy pania_vigencia_receta_detalle_update on public.receta_detalle as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_receta_detalle_delete on public.receta_detalle;
create policy pania_vigencia_receta_detalle_delete on public.receta_detalle as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_proveedores_insert on public.proveedores;
create policy pania_vigencia_proveedores_insert on public.proveedores as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_proveedores_update on public.proveedores;
create policy pania_vigencia_proveedores_update on public.proveedores as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_proveedores_delete on public.proveedores;
create policy pania_vigencia_proveedores_delete on public.proveedores as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_compras_insert on public.compras;
create policy pania_vigencia_compras_insert on public.compras as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_compras_update on public.compras;
create policy pania_vigencia_compras_update on public.compras as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_compras_delete on public.compras;
create policy pania_vigencia_compras_delete on public.compras as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_compra_detalle_insert on public.compra_detalle;
create policy pania_vigencia_compra_detalle_insert on public.compra_detalle as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_compra_detalle_update on public.compra_detalle;
create policy pania_vigencia_compra_detalle_update on public.compra_detalle as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_compra_detalle_delete on public.compra_detalle;
create policy pania_vigencia_compra_detalle_delete on public.compra_detalle as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_movimientos_inventario_insert on public.movimientos_inventario;
create policy pania_vigencia_movimientos_inventario_insert on public.movimientos_inventario as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_movimientos_inventario_update on public.movimientos_inventario;
create policy pania_vigencia_movimientos_inventario_update on public.movimientos_inventario as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_movimientos_inventario_delete on public.movimientos_inventario;
create policy pania_vigencia_movimientos_inventario_delete on public.movimientos_inventario as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_ordenes_produccion_insert on public.ordenes_produccion;
create policy pania_vigencia_ordenes_produccion_insert on public.ordenes_produccion as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ordenes_produccion_update on public.ordenes_produccion;
create policy pania_vigencia_ordenes_produccion_update on public.ordenes_produccion as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ordenes_produccion_delete on public.ordenes_produccion;
create policy pania_vigencia_ordenes_produccion_delete on public.ordenes_produccion as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_produccion_detalle_insert on public.produccion_detalle;
create policy pania_vigencia_produccion_detalle_insert on public.produccion_detalle as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_produccion_detalle_update on public.produccion_detalle;
create policy pania_vigencia_produccion_detalle_update on public.produccion_detalle as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_produccion_detalle_delete on public.produccion_detalle;
create policy pania_vigencia_produccion_detalle_delete on public.produccion_detalle as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_produccion_consumo_insert on public.produccion_consumo;
create policy pania_vigencia_produccion_consumo_insert on public.produccion_consumo as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_produccion_consumo_update on public.produccion_consumo;
create policy pania_vigencia_produccion_consumo_update on public.produccion_consumo as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_produccion_consumo_delete on public.produccion_consumo;
create policy pania_vigencia_produccion_consumo_delete on public.produccion_consumo as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_mermas_insert on public.mermas;
create policy pania_vigencia_mermas_insert on public.mermas as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_mermas_update on public.mermas;
create policy pania_vigencia_mermas_update on public.mermas as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_mermas_delete on public.mermas;
create policy pania_vigencia_mermas_delete on public.mermas as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_ventas_insert on public.ventas;
create policy pania_vigencia_ventas_insert on public.ventas as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ventas_update on public.ventas;
create policy pania_vigencia_ventas_update on public.ventas as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_ventas_delete on public.ventas;
create policy pania_vigencia_ventas_delete on public.ventas as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_venta_detalle_insert on public.venta_detalle;
create policy pania_vigencia_venta_detalle_insert on public.venta_detalle as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_venta_detalle_update on public.venta_detalle;
create policy pania_vigencia_venta_detalle_update on public.venta_detalle as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_venta_detalle_delete on public.venta_detalle;
create policy pania_vigencia_venta_detalle_delete on public.venta_detalle as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_clientes_insert on public.clientes;
create policy pania_vigencia_clientes_insert on public.clientes as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_clientes_update on public.clientes;
create policy pania_vigencia_clientes_update on public.clientes as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_clientes_delete on public.clientes;
create policy pania_vigencia_clientes_delete on public.clientes as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_campanas_marketing_insert on public.campanas_marketing;
create policy pania_vigencia_campanas_marketing_insert on public.campanas_marketing as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_campanas_marketing_update on public.campanas_marketing;
create policy pania_vigencia_campanas_marketing_update on public.campanas_marketing as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_campanas_marketing_delete on public.campanas_marketing;
create policy pania_vigencia_campanas_marketing_delete on public.campanas_marketing as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_categorias_gasto_insert on public.categorias_gasto;
create policy pania_vigencia_categorias_gasto_insert on public.categorias_gasto as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_categorias_gasto_update on public.categorias_gasto;
create policy pania_vigencia_categorias_gasto_update on public.categorias_gasto as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_categorias_gasto_delete on public.categorias_gasto;
create policy pania_vigencia_categorias_gasto_delete on public.categorias_gasto as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_gastos_insert on public.gastos;
create policy pania_vigencia_gastos_insert on public.gastos as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_gastos_update on public.gastos;
create policy pania_vigencia_gastos_update on public.gastos as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_gastos_delete on public.gastos;
create policy pania_vigencia_gastos_delete on public.gastos as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_cuentas_dinero_insert on public.cuentas_dinero;
create policy pania_vigencia_cuentas_dinero_insert on public.cuentas_dinero as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_cuentas_dinero_update on public.cuentas_dinero;
create policy pania_vigencia_cuentas_dinero_update on public.cuentas_dinero as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_cuentas_dinero_delete on public.cuentas_dinero;
create policy pania_vigencia_cuentas_dinero_delete on public.cuentas_dinero as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_movimientos_dinero_insert on public.movimientos_dinero;
create policy pania_vigencia_movimientos_dinero_insert on public.movimientos_dinero as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_movimientos_dinero_update on public.movimientos_dinero;
create policy pania_vigencia_movimientos_dinero_update on public.movimientos_dinero as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_movimientos_dinero_delete on public.movimientos_dinero;
create policy pania_vigencia_movimientos_dinero_delete on public.movimientos_dinero as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));

drop policy if exists pania_vigencia_presupuestos_gasto_insert on public.presupuestos_gasto;
create policy pania_vigencia_presupuestos_gasto_insert on public.presupuestos_gasto as restrictive for insert to authenticated with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_presupuestos_gasto_update on public.presupuestos_gasto;
create policy pania_vigencia_presupuestos_gasto_update on public.presupuestos_gasto as restrictive for update to authenticated using (public.pania_acceso_vigente(empresa_id)) with check (public.pania_acceso_vigente(empresa_id));
drop policy if exists pania_vigencia_presupuestos_gasto_delete on public.presupuestos_gasto;
create policy pania_vigencia_presupuestos_gasto_delete on public.presupuestos_gasto as restrictive for delete to authenticated using (public.pania_acceso_vigente(empresa_id));
