# PANIA 2.2 — Operación más fácil

## Qué cambió
- **POS dinámico** (`/ventas`): catálogo táctil con búsqueda y categorías, carrito con +/−, forma de pago en un toque,
  cálculo de cambio en efectivo y botón **Cobrar**. Enter en el buscador agrega el primer resultado. Sin recargar la página.
- **Cobro atómico**: `016_pos_cobro_atomico.sql` crea `registrar_venta_pos`; la venta con todas sus líneas se guarda completa o no se guarda.
  Respeta la RLS y los roles existentes; el precio y el costo los sigue fijando la base de datos.
- **Ventas recientes** con total por venta y detalle desplegable; resumen del día (vendido, ventas, ticket promedio).
- **Producción**: un solo selector «Producto a producir» (antes eran producto + receta, que podían no coincidir) y ya no ofrece productos que están en la orden.
- Se agregó `tsconfig.json`.

## Instalación
1. Ejecutar `supabase/migrations/016_pos_cobro_atomico.sql` en el SQL Editor.
2. `npm install` y `npm run dev`.

## Pendiente de probar
Compila y pasa tipos, pero no se probó contra un Supabase real (cobro con rol Caja, descuento de inventario, sucursal por rol).


## PANIA 2.2.1 — rediseño aprobado
- Nuevo Centro de Control para dueño/administrador.
- Navegación reducida a Operar, Dinero, Analizar y Más.
- Acciones rápidas: vender, producir, comprar y registrar gasto.
- Recomendaciones repetidas se agrupan en Inicio.
- Navegación móvil inferior.
- DEMO 3.0 incremental: más clientes, renta, mantenimiento, campaña, presupuesto y flujo.
