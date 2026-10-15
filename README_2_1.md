# PANIA 2.1

Hito centrado en claridad gerencial y uso real.

## Cambios
- Menú agrupado y colapsable: Operación, Catálogo, Comercial, Finanzas, Inteligencia y Administración.
- Inicio rediseñado alrededor de 3 preguntas: cómo está el negocio, dónde pierde dinero y qué hacer hoy.
- Finanzas incorpora Estado de Resultados Gerencial, margen, liquidez y punto de equilibrio.
- `014_security_views.sql`: las vistas públicas usan `security_invoker` para respetar RLS.
- `015_estado_resultados_gerencial.sql`: nueva vista mensual de gestión.
- `supabase/seeds/demo_2_1_completar.sql`: completa el DEMO existente con clientes, campañas, gastos, presupuestos, caja y bancos sin duplicar las ventas ya cargadas.

## Orden de instalación
1. Ejecutar migración 014.
2. Ejecutar migración 015.
3. Ejecutar `supabase/seeds/demo_2_1_completar.sql` sólo en el entorno DEMO/pruebas.
4. Ejecutar `supabase/seeds/validar_demo_2_1.sql`.

El Estado Gerencial es una herramienta de gestión, no un Balance General ni contabilidad de partida doble.
