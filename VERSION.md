# PANIA v1.0.0

Primera versión integrada del núcleo operativo.

Flujo cubierto:
Productos e ingredientes → Recetas y costos → Compras → Inventario → Producción y mermas → Ventas/POS → Dashboard y Radar de Utilidad.

## Validación de esta entrega
- Rutas operativas verificadas estructuralmente.
- Acciones de servidor presentes para todos los módulos que modifican datos.
- Corregida directiva `use server` de Ventas/POS detectada durante integración.
- Identidad del paquete actualizada a `pania` v1.0.0.
- Compilación completa pendiente: `npm ci` excedió el tiempo disponible del entorno de construcción. Ejecutar `npm ci && npm run build` en el entorno de despliegue antes de publicar.
