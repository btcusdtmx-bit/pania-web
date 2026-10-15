'use server';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { conMensaje } from '@/lib/sesion';

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function registrarEmpresa(fd: FormData) {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { error } = await supabase.rpc('registrar_empresa', {
    p_empresa: texto(fd, 'empresa'),
    p_nombre: texto(fd, 'nombre'),
    p_sucursal: texto(fd, 'sucursal') || 'Principal',
    p_rfc: texto(fd, 'rfc') || null,
  });

  if (error) {
    const msg = error.message.includes('ya pertenece')
      ? 'Tu usuario ya pertenece a una empresa. Si no puedes entrar, pide a tu administrador que reactive tu acceso.'
      : error.message.includes('obligatorios')
        ? 'Escribe el nombre de tu panadería y el tuyo.'
        : 'No se pudo registrar la panadería. Intenta de nuevo.';
    redirect(conMensaje('/bienvenida', 'error', msg));
  }
  redirect('/');
}
