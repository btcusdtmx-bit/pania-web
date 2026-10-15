-- PANIA 025
-- Consolidación del punto de entrada del POS.
-- No elimina ventas ni movimientos de inventario.

BEGIN;

-- Eliminar únicamente la firma antigua de siete argumentos.
-- La aplicación actual utiliza la firma de ocho argumentos.
DROP FUNCTION IF EXISTS public.registrar_venta_pos(
  uuid, text, text, text, uuid, uuid, jsonb
) RESTRICT;

-- Restringir el acceso público a la función vigente.
REVOKE ALL ON FUNCTION public.registrar_venta_pos(
  uuid, text, text, text, uuid, uuid, jsonb, numeric
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.registrar_venta_pos(
  uuid, text, text, text, uuid, uuid, jsonb, numeric
) TO authenticated;

COMMIT;
