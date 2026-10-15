'use server';
import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirSesion } from '@/lib/sesion';

export async function crearCategoria(fd:FormData){
 const {perfil}=await requerirSesion(); if(!['dueno','administrador'].includes(perfil.rol)) throw new Error('Sin permiso');
 const sb=await crearClienteServidor(); const nombre=String(fd.get('nombre')||'').trim(); if(!nombre) return;
 const {error}=await sb.from('categorias_gasto').insert({empresa_id:perfil.empresa_id,nombre}); if(error) throw new Error(error.message); revalidatePath('/gastos');
}
export async function registrarGasto(fd:FormData){
 const {perfil}=await requerirSesion(); if(!['dueno','administrador','contador'].includes(perfil.rol)) throw new Error('Sin permiso');
 const sb=await crearClienteServidor(); const monto=Number(fd.get('monto')); const concepto=String(fd.get('concepto')||'').trim(); if(!concepto||!(monto>0)) throw new Error('Concepto y monto son obligatorios');
 const {error}=await sb.from('gastos').insert({empresa_id:perfil.empresa_id,sucursal_id:fd.get('sucursal_id')||null,categoria_id:fd.get('categoria_id')||null,fecha:fd.get('fecha'),concepto,proveedor:fd.get('proveedor')||null,tipo:fd.get('tipo'),destino:fd.get('destino'),forma_pago:fd.get('forma_pago')||null,referencia:fd.get('referencia')||null,comprobante_url:fd.get('comprobante_url')||null,monto,notas:fd.get('notas')||null,created_by:perfil.id}); if(error) throw new Error(error.message); revalidatePath('/gastos'); revalidatePath('/radar');
}
