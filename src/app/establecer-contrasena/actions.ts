'use server';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { conMensaje } from '@/lib/sesion';

export async function guardarContrasena(fd: FormData) {
  const password = String(fd.get('password') ?? '');
  const repetir = String(fd.get('repetir') ?? '');
  if (password.length < 8) redirect(conMensaje('/establecer-contrasena', 'error', 'La contraseña debe tener al menos 8 caracteres.'));
  if (password !== repetir) redirect(conMensaje('/establecer-contrasena', 'error', 'Las contraseñas no coinciden.'));

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(conMensaje('/establecer-contrasena', 'error', 'No se pudo guardar la contraseña. Intenta de nuevo.'));
  redirect('/');
}
