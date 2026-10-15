'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';
import { conMensaje, requerirAdmin } from '@/lib/sesion';
const RUTA='/productos'; const t=(fd:FormData,k:string)=>String(fd.get(k)??'').trim();
export async function guardarProducto(fd:FormData){
 const {perfil}=await requerirAdmin(); const id=t(fd,'id'); const sku=t(fd,'sku'); const nombre=t(fd,'nombre');
 const precio=Number(t(fd,'precio_publico')); const iva=Number(t(fd,'iva_tasa')||0); const categoria=t(fd,'categoria_id')||null;
 const vida=t(fd,'vida_util_dias'); const costoBase=t(fd,'costo_base_precio');
 if(!sku||!nombre||!Number.isFinite(precio)||precio<0) redirect(conMensaje(RUTA,'error','SKU, nombre y precio válido son obligatorios.'));
 const payload={empresa_id:perfil.empresa_id,sku,nombre,categoria_id:categoria,unidad:t(fd,'unidad')||'pza',precio_publico:precio,iva_tasa:iva,vida_util_dias:vida?Number(vida):null,costo_base_precio:costoBase?Number(costoBase):null,activo:t(fd,'activo')!=='0'};
 const supabase=await crearClienteServidor(); const q=id?supabase.from('productos').update(payload).eq('id',id):supabase.from('productos').insert(payload); const {error}=await q;
 if(error) redirect(conMensaje(RUTA,'error',error.code==='23505'?'Ese SKU ya existe.':'No se pudo guardar el producto.'));
 revalidatePath(RUTA); redirect(conMensaje(RUTA,'ok',id?'Producto actualizado.':'Producto creado.'));
}
export async function cambiarEstadoProducto(fd:FormData){ await requerirAdmin(); const supabase=await crearClienteServidor(); const {error}=await supabase.from('productos').update({activo:t(fd,'activo')==='1'}).eq('id',t(fd,'id')); if(error) redirect(conMensaje(RUTA,'error','No se pudo cambiar el estado.')); revalidatePath(RUTA); redirect(conMensaje(RUTA,'ok','Estado actualizado.')); }
