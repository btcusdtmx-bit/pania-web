# PANIA 2.3.2 — Seguridad y Roles

Actualización acumulativa sobre PANIA 2.3/2.3.1.

- Matriz central de permisos por módulo y acción.
- Roles personalizados restrictivos: sólo pueden quitar permisos a su plantilla base.
- Menú y rutas protegidos con la misma matriz.
- Validación de sucursal y empresa al invitar/modificar usuarios.
- Simulador protegido también a nivel de ruta servidor/API.
- RLS 018 final con restricciones para módulos operativos y financieros.
- Caja deja de tener la excepción de lectura directa de movimientos de inventario.
- UI operativa oculta costos a Producción/Encargado/Consulta.
- Conserva allowedOrigins de Codespaces para desarrollo.

## Instalación
1. Copiar este paquete sobre el árbol actual (sin borrar .env.local).
2. npm ci
3. npm run build
4. Ejecutar `supabase/migrations/018_seguridad_roles_final.sql` en Supabase, sólo después de confirmar que 017 ya está aplicada.
