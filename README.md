# PANIA 2.0 — Sistema operativo para panaderías

Estado: integración funcional completa hasta recomendaciones, con preparación de despliegue. Ver `PRODUCCION.md` antes de publicar.

# Centro de control de la panadería — Fase 1 (base administrativa)

Next.js 16 (App Router) + Supabase. Alcance de esta fase: registro de la panadería,
sucursales, usuarios con roles, categorías base e historial de cambios.

## Puesta en marcha

1. **Crea un proyecto en Supabase** y, en *SQL Editor*, corre en orden:
   `supabase/migrations/001_nucleo.sql`, `002_permisos.sql`, `003_fase1.sql`.
2. **Variables de entorno**: copia `.env.example` a `.env.local` y llena las tres claves
   (Settings → API). La clave `service_role` solo vive en el servidor.
3. **Plantillas de correo** (Authentication → Email Templates). Cambia el enlace para que
   apunte a esta app:
   - *Invite user*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/establecer-contrasena`
   - *Confirm signup*: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/bienvenida`
   - En Authentication → URL Configuration, pon tu dirección real en *Site URL*.
4. `npm install` y `npm run dev` → http://localhost:3000

## Flujo
- Quien crea cuenta y no tiene perfil llega a **/bienvenida** y registra su panadería
  (función SQL `registrar_empresa`): queda como dueño, con una sucursal, un almacén y categorías base.
- El dueño o administrador invita por correo desde **Usuarios**. La persona recibe un enlace,
  elige su contraseña y entra con el rol y la sucursal asignados.
- Quien tiene sucursal asignada solo ve esa sucursal; sin sucursal ve todas.
- Todo cambio de usuarios, sucursales y categorías aparece en **Historial de cambios**.

## Seguridad (resumen)
- La seguridad real está en la base de datos (RLS por empresa, rol y sucursal); las pantallas
  solo ocultan lo que no corresponde.
- Un administrador no puede crear, degradar ni desactivar a un dueño.
- No se borran usuarios ni sucursales: se desactivan. Nadie puede editar ni borrar la auditoría.
- Un usuario desactivado deja de ver datos. Si intenta entrar, verá la pantalla de registro de
  panadería y el aviso de que su usuario ya pertenece a una empresa.

## Pendiente / límites conocidos
- Probado: SQL y permisos en PostgreSQL local, compilación, tipos y acceso sin sesión.
  **No probado** contra un proyecto real de Supabase (invitaciones por correo, confirmación de cuenta,
  pantallas con sesión iniciada).
- El listado de correos usa `auth.admin.listUsers` (hasta 1,000 usuarios); suficiente para una panadería.
- Aún no hay recuperación de contraseña desde la pantalla de acceso.
- Siguientes fases: recetas y costos, compras e inventario, producción, ventas y el Radar de Utilidad.

## PANIA v0.3.0 — Productos e Ingredientes

- Catálogo de productos conectado a `productos` con SKU, categoría, unidad, precio público, IVA, vida útil y costo base de precio.
- Catálogo de ingredientes conectado a `ingredientes` con tipo, unidad y stock mínimo/máximo.
- Registro de nuevos costos en `ingrediente_costos` sin sobrescribir el historial.
- Navegación y visibilidad alineadas a los roles/RLS existentes.
- Recetas y costeo por receta quedan para PANIA v0.4.0.


## PANIA v0.4.0 — Recetas y Costeo Automático

- Recetas vigentes por producto con versionado consecutivo.
- Ingredientes y cantidades por lote conectados a `receta_detalle`.
- Rendimiento, merma esperada, mano de obra, energía y otros costos por lote.
- Costeo calculado exclusivamente desde `v_costo_receta`: materia prima + conversión → costo por pieza.
- Precio neto, utilidad bruta por pieza y margen bruto.
- Indicador de calidad: advierte ingredientes sin costo vigente.
- Crear una nueva versión deja la anterior no vigente sin borrar su historia.
- Edición restringida a dueño/administrador conforme a RLS; contador/encargado/producción consultan.
- Compras e inventario quedan para PANIA v0.5.0/v0.6.0.
