'use server';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { conMensaje } from '@/lib/sesion';

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function iniciarSesion(fd: FormData) {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({
    email: texto(fd, 'email'),
    password: String(fd.get('password') ?? ''),
  });
  if (error) redirect(conMensaje('/login', 'error', 'Correo o contraseña incorrectos.'));
  redirect('/');
}

export async function crearCuenta(fd: FormData) {
  const password = String(fd.get('password') ?? '');
  if (password.length < 8) {
    redirect(conMensaje('/login?modo=registro', 'error', 'La contraseña debe tener al menos 8 caracteres.'));
  }
  const supabase = await crearClienteServidor();
  const plan = texto(fd, 'plan');
  const planElegido = ['basico','negocio','multi'].includes(plan) ? plan : null;
  const { data, error } = await supabase.auth.signUp({ email: texto(fd, 'email'), password, options: { data: { plan_interes: planElegido } } });
  if (error) {
    redirect(conMensaje('/login?modo=registro', 'error', 'No se pudo crear la cuenta. Revisa el correo o intenta iniciar sesión.'));
  }
  if (!data.session) {
    redirect(conMensaje('/login', 'ok', 'Te enviamos un correo. Confírmalo y luego inicia sesión.'));
  }
  redirect('/bienvenida');
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect('/login');
}
