import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente con la clave de servicio: se salta la seguridad por filas.
// Úsalo solo en acciones de servidor, y solo para lo que el usuario normal no puede hacer
// (invitar por correo y consultar correos).
export function crearClienteAdmin() {
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!clave) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, clave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
