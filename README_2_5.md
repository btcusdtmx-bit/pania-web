# PANIA 2.5.0 — Operación Real de Panadería

Hito acumulativo sobre 2.4.0. No reemplaza el motor de inventario/producción existente: lo completa y hace visible.

## Circuito
Compra → materia prima → producción → producto terminado → venta → ticket → dinero.

## Nuevo
- Ticket POS con folio, efectivo recibido, cambio e impresión.
- Inventario explicado como Materia prima + Producto terminado.
- Producción guiada y conectada al motor existente de recetas/consumos/mermas.
- Compras Contado / Crédito, vencimiento, saldo y abonos a proveedor.
- Finanzas: Tengo / Debo / Me deben / Posición neta.
- Migración 020_operacion_real_panaderia.sql.

## Instalación segura
1. Instalar paquete y ejecutar `npm run build`.
2. Solo si el build pasa, ejecutar migración 020 en Supabase.
3. Probar una compra a crédito, producción, venta y ticket.


## 2.5.2 — Operación compacta
- POS: sólo 5 ventas recientes por defecto; historial con filtros por periodo, sucursal, pago y folio/importe.
- Proyecciones: elimina la fila ficticia General y no extrapola flujo con menos de 7 días reales por sucursal.
- Producción: prioriza la orden activa del día, captura visual de buenas/merma y sólo 5 producciones recientes por defecto.
- Merma del día muestra piezas y, para roles autorizados, impacto económico.
- Sin migración SQL nueva.


## 2.5.3 Stock vendible
- Inventario con búsqueda, filtro por sucursal/estado y stock terminado más visible.
- POS muestra stock por sucursal, marca agotados y limita el carrito.
- SQL 021 bloquea sobreventa en servidor incluso con dos cajas concurrentes.

## 2.5.4 — Asistente PANIA / Flowise
- Integra un asistente gerencial de solo lectura mediante Flowise.
- PANIA arma un contexto autorizado desde Supabase y lo envía al motor IA; Flowise no necesita acceso directo a la base.
- Credenciales sólo del lado servidor.
- Variables: FLOWISE_BASE_URL, FLOWISE_CHATFLOW_ID y opcional FLOWISE_API_KEY. Alternativamente FLOWISE_PREDICTION_URL.
- Primera fase restringida a Dueño/Administrador. No ejecuta ventas, inventario, producción ni movimientos financieros.


## 2.5.5 — Intelligence Engine Nativo
- Retira la dependencia operativa de Flowise y sus variables de entorno.
- Asistente PANIA funciona sin API de IA externa ni costo por consulta.
- Motor determinista y explicable para resumen gerencial, ventas, rentabilidad, flujo, stock, prioridades y producción.
- No inventa cantidades de producción cuando no existe historia suficiente.
- Mantiene modo solo lectura para Dueño/Administrador y respeta sesión/RLS.
- Arquitectura separada en `src/lib/intelligence/` para permitir una capa NLP local futura (por ejemplo Transformers.js) sin reemplazar el motor de negocio.
- Sin migración SQL nueva; 021 sigue siendo la última migración requerida.
