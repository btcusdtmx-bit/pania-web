'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';
import { conMensaje, requerirAdmin } from '@/lib/sesion';

const RUTA='/recetas';
const t=(fd:FormData,k:string)=>String(fd.get(k)??'').trim();
const n=(fd:FormData,k:string,def=0)=>{const v=Number(t(fd,k)||def); return Number.isFinite(v)?v:NaN;};

export async function crearReceta(fd:FormData){
  const {perfil}=await requerirAdmin();
  const producto_id=t(fd,'producto_id');
  const rendimiento=n(fd,'rendimiento_piezas');
  const merma=n(fd,'merma_esperada_pct');
  const mano=n(fd,'mano_obra_lote'); const energia=n(fd,'energia_lote'); const otros=n(fd,'otros_lote');
  if(!producto_id||!Number.isFinite(rendimiento)||rendimiento<=0) redirect(conMensaje(RUTA,'error','Selecciona un producto y captura un rendimiento mayor a cero.'));
  if(!Number.isFinite(merma)||merma<0||merma>100||[mano,energia,otros].some(x=>!Number.isFinite(x)||x<0)) redirect(conMensaje(RUTA,'error','Revisa merma y costos de conversión.'));
  const sb=await crearClienteServidor();
  const {data:prev}=await sb.from('recetas').select('version').eq('producto_id',producto_id).order('version',{ascending:false}).limit(1).maybeSingle();
  const version=(prev?.version??0)+1;
  const {data:vig}=await sb.from('recetas').select('id').eq('producto_id',producto_id).eq('vigente',true).maybeSingle();
  if(vig?.id){const {error:e}=await sb.from('recetas').update({vigente:false}).eq('id',vig.id); if(e) redirect(conMensaje(RUTA,'error','No se pudo cerrar la receta vigente anterior.'));}
  const {data,error}=await sb.from('recetas').insert({empresa_id:perfil.empresa_id,producto_id,version,rendimiento_piezas:rendimiento,merma_esperada_pct:merma,mano_obra_lote:mano,energia_lote:energia,otros_lote:otros,vigente:true}).select('id').single();
  if(error) redirect(conMensaje(RUTA,'error','No se pudo crear la receta.'));
  revalidatePath(RUTA); redirect(`${RUTA}?receta=${data.id}&ok=${encodeURIComponent(`Receta v${version} creada. Agrega sus ingredientes.`)}`);
}

export async function actualizarCabecera(fd:FormData){
  await requerirAdmin(); const id=t(fd,'receta_id');
  const rendimiento=n(fd,'rendimiento_piezas'),merma=n(fd,'merma_esperada_pct'),mano=n(fd,'mano_obra_lote'),energia=n(fd,'energia_lote'),otros=n(fd,'otros_lote');
  if(!id||!Number.isFinite(rendimiento)||rendimiento<=0||!Number.isFinite(merma)||merma<0||merma>100||[mano,energia,otros].some(x=>!Number.isFinite(x)||x<0)) redirect(conMensaje(`${RUTA}?receta=${id}`,'error','Revisa los datos de la receta.'));
  const sb=await crearClienteServidor(); const {error}=await sb.from('recetas').update({rendimiento_piezas:rendimiento,merma_esperada_pct:merma,mano_obra_lote:mano,energia_lote:energia,otros_lote:otros}).eq('id',id).eq('vigente',true);
  if(error) redirect(conMensaje(`${RUTA}?receta=${id}`,'error','No se pudo actualizar la receta.'));
  revalidatePath(RUTA); redirect(conMensaje(`${RUTA}?receta=${id}`,'ok','Receta actualizada y costo recalculado.'));
}

export async function agregarIngrediente(fd:FormData){
  const {perfil}=await requerirAdmin(); const receta_id=t(fd,'receta_id'),ingrediente_id=t(fd,'ingrediente_id'),cantidad=n(fd,'cantidad');
  if(!receta_id||!ingrediente_id||!Number.isFinite(cantidad)||cantidad<=0) redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'error','Selecciona un ingrediente y una cantidad mayor a cero.'));
  const sb=await crearClienteServidor(); const {error}=await sb.from('receta_detalle').insert({empresa_id:perfil.empresa_id,receta_id,ingrediente_id,cantidad});
  if(error) redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'error',error.code==='23505'?'Ese ingrediente ya está en la receta.':'No se pudo agregar el ingrediente.'));
  revalidatePath(RUTA); redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'ok','Ingrediente agregado. El costo se recalculó automáticamente.'));
}

export async function actualizarIngrediente(fd:FormData){
  await requerirAdmin(); const receta_id=t(fd,'receta_id'),id=t(fd,'detalle_id'),cantidad=n(fd,'cantidad');
  if(!id||!Number.isFinite(cantidad)||cantidad<=0) redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'error','Captura una cantidad mayor a cero.'));
  const sb=await crearClienteServidor(); const {error}=await sb.from('receta_detalle').update({cantidad}).eq('id',id);
  if(error) redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'error','No se pudo actualizar la cantidad.'));
  revalidatePath(RUTA); redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'ok','Cantidad actualizada.'));
}

export async function quitarIngrediente(fd:FormData){
  await requerirAdmin(); const receta_id=t(fd,'receta_id'),id=t(fd,'detalle_id'); const sb=await crearClienteServidor();
  const {error}=await sb.from('receta_detalle').delete().eq('id',id); if(error) redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'error','No se pudo quitar el ingrediente.'));
  revalidatePath(RUTA); redirect(conMensaje(`${RUTA}?receta=${receta_id}`,'ok','Ingrediente retirado de la receta.'));
}
