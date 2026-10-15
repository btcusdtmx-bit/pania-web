# PANIA 2.4.0 — Comercialización y Superadministrador

- Panel `/pania-admin` separado de la operación de las panaderías.
- Contratos mensual, anual y licencia de contado.
- Estados prueba, activa, vencida, pausada y cancelada.
- Registro manual de pagos PANIA, separado de ventas/caja de clientes.
- MRR estimado, clientes activos y próximos vencimientos.
- Licencia de contado sin vencimiento de uso; soporte/actualizaciones se controlan aparte con `soporte_hasta`.
- No se borran datos al vencer o pausar un contrato.
- No incluye todavía checkout ni webhooks reales de Mercado Pago/Stripe.

Migración nueva: `019_comercial_superadmin.sql`.
