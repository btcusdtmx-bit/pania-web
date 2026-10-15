'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';
import { conMensaje, requerirAdmin } from '@/lib/sesion';

const RUTA = '/configuracion';
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function crearSucursal(fd: FormData) {
  const { perfil } = await requerirAdmin();
  const nombre = texto(fd, 'nombre');
  if (!nombre) redirect(conMensaje(RUTA, 'error', 'Escribe el nombre de la sucursal.'));

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from('sucursales').insert({ empresa_id: perfil.empresa_id, nombre }).select('id').single();
  if (error || !data) {
    redirect(conMensaje(RUTA, 'error', error?.code === '23505' ? 'Ya existe una sucursal con ese nombre.' : 'No se pudo crear la sucursal.'));
  }
  await supabase.from('almacenes').insert({ empresa_id: perfil.empresa_id, sucursal_id: data.id, nombre: 'Almacén general' });
  revalidatePath(RUTA);
  redirect(conMensaje(RUTA, 'ok', `Sucursal «${nombre}» creada.`));
}

export async function cambiarEstadoSucursal(fd: FormData) {
  await requerirAdmin();
  const id = texto(fd, 'id');
  const activa = texto(fd, 'activa') === '1';
  const supabase = await crearClienteServidor();

  if (!activa) {
    const { count } = await supabase.from('sucursales').select('id', { count: 'exact', head: true }).eq('activa', true);
    if ((count ?? 0) <= 1) redirect(conMensaje(RUTA, 'error', 'Debe quedar al menos una sucursal activa.'));
  }
  const { data, error } = await supabase.from('sucursales').update({ activa }).eq('id', id).select('id');
  if (error || !data?.length) redirect(conMensaje(RUTA, 'error', 'No se pudo cambiar la sucursal.'));
  revalidatePath(RUTA);
  redirect(conMensaje(RUTA, 'ok', activa ? 'Sucursal reactivada.' : 'Sucursal desactivada.'));
}

export async function crearCategoria(fd: FormData) {
  const { perfil } = await requerirAdmin();
  const nombre = texto(fd, 'nombre');
  const tipo = texto(fd, 'tipo');
  if (!nombre || !['producto', 'ingrediente'].includes(tipo)) redirect(conMensaje(RUTA, 'error', 'Escribe el nombre de la categoría.'));

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from('categorias').insert({ empresa_id: perfil.empresa_id, tipo, nombre });
  if (error) redirect(conMensaje(RUTA, 'error', error.code === '23505' ? 'Esa categoría ya existe.' : 'No se pudo crear la categoría.'));
  revalidatePath(RUTA);
  redirect(conMensaje(RUTA, 'ok', 'Categoría creada.'));
}

export async function quitarCategoria(fd: FormData) {
  await requerirAdmin();
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from('categorias').delete().eq('id', texto(fd, 'id'));
  if (error) {
    redirect(conMensaje(RUTA, 'error', error.code === '23503' ? 'No se puede quitar: ya hay productos o ingredientes en esa categoría.' : 'No se pudo quitar la categoría.'));
  }
  revalidatePath(RUTA);
  redirect(conMensaje(RUTA, 'ok', 'Categoría quitada.'));
}
