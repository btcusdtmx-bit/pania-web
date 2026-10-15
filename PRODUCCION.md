# PANIA 2.0 — Preparación para producción

## Base de datos
La instalación incremental existente debe tener `001` a `012` aplicadas en orden. Para una base que ya llegó a PANIA 1.9, ejecutar **solo `013_produccion_hardening.sql`**. El script 013 no vuelve a crear módulos anteriores: verifica objetos críticos y añade índices seguros.

## Variables obligatorias
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — solo servidor, necesaria para invitaciones.

No publicar `.env.local` ni la service role.

## Supabase antes de abrir a usuarios
1. Configurar Site URL y Redirect URLs del dominio real.
2. Configurar las plantillas de correo indicadas en README.
3. Confirmar RLS habilitado y probar al menos dueño, administrador, contador, encargado y caja con empresas/sucursales separadas.
4. Hacer respaldo antes de migraciones y definir respaldo periódico.
5. Probar alta, compra, producción, venta, gasto y cierre con datos de prueba antes de cargar operación real.

## Despliegue
- Instalar dependencias con `npm ci` cuando exista lockfile.
- Ejecutar `npm run build`; no publicar si falla.
- Arrancar con `npm run start`.
- `/api/health` debe responder `status: ok`.

## Límites que 2.0 mantiene visibles
- Caja/Bancos registra movimientos manuales; ventas, compras y gastos todavía no generan automáticamente movimientos bancarios/caja.
- Las proyecciones usan comportamiento histórico reciente; no son garantía.
- El simulador no altera datos reales.
- “Decisiones IA” en 2.0 usa reglas explicables; no llama un LLM externo.
- Punto de equilibrio actual es una aproximación operativa y debe interpretarse con la clasificación vigente de costos.

## Criterio de salida
No considerar producción certificada hasta completar build en el entorno real y pruebas end-to-end contra el proyecto Supabase real.
