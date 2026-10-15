# PANIA 2.3 — Base comercial SaaS

Esta versión agrega la base para vender PANIA por suscripción sin mezclar los cobros de PANIA con la caja de cada panadería.

## Incluye
- Planes PANIA Básico, Negocio y Multi (precios iniciales editables; no son todavía oferta comercial definitiva).
- Suscripción por empresa, vigencia, prueba y estado.
- Registro idempotente de pagos para futuros webhooks de Stripe/Mercado Pago.
- Tabla separada de administradores de la plataforma PANIA.
- Plantillas de roles configurables por empresa (`roles_empresa`) y vínculo opcional en `perfiles`.
- Pantalla `/plataforma` para que el dueño vea plan y estado.

## Deliberadamente NO incluido todavía
No se agregaron claves, checkout ni webhooks reales de Stripe/Mercado Pago. Eso requiere elegir proveedor y configurar credenciales/URLs de producción. Los botones de contratación permanecen deshabilitados para evitar cobros falsos.

## Instalación
Ejecutar `017_saas_suscripciones_roles.sql` después de 016. Después ejecutar `npm run build`.

## Seguridad
El administrador de una panadería no es el Superadministrador PANIA. `administradores_pania` queda separado y no tiene políticas de cliente. Las operaciones de plataforma deberán ejecutarse exclusivamente desde backend con service role y verificación explícita del usuario administrador.
