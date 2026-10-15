# PANIA 2.3.1 — Cierre de roles y permisos

- Caja/Ventas: POS + clientes; sin Finanzas, Gastos, costos ni análisis.
- Producción: producción, inventario necesario y recetas.
- Compras: compras, inventario e ingredientes/proveedores.
- Contabilidad: ventas en consulta, compras, gastos, finanzas, presupuestos y análisis.
- Administrador: operación y equipo.
- Dueño: control total del negocio y Plan PANIA.
- Menú móvil también respeta el rol.
- RLS 018 endurece perfiles, sucursales, gastos, caja/bancos y presupuestos.
- La sucursal asignada sigue siendo el límite de datos operativos.

Ejecutar `018_cierre_roles_permisos.sql` en Supabase después de 017.
