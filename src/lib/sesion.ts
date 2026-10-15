import { cache } from 'react';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { esAdmin, tienePermiso, type AccionPermiso, type Modulo, type PermisosPersonalizados } from '@/lib/roles';
export type Perfil={id:string;empresa_id:string;sucursal_id:string|null;nombre:string;rol:string;activo:boolean;rol_empresa_id:string|null};
export const obtenerContexto=cache(async()=>{const supabase=await crearClienteServidor();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data:perfil}=await supabase.from('perfiles').select('id,empresa_id,sucursal_id,nombre,rol,activo,rol_empresa_id').eq('id',user.id).maybeSingle<Perfil>();let permisos:PermisosPersonalizados|null=null;if(perfil?.rol_empresa_id){const {data:r}=await supabase.from('roles_empresa').select('permisos,activo').eq('id',perfil.rol_empresa_id).eq('empresa_id',perfil.empresa_id).maybeSingle<{permisos:PermisosPersonalizados;activo:boolean}>();if(r?.activo)permisos=r.permisos??{};}const {data:empresa}=perfil?await supabase.from('empresas').select('id,nombre').eq('id',perfil.empresa_id).maybeSingle<{id:string;nombre:string}>():{data:null};return{user,perfil,empresa,permisos}});
export async function requerirSesion(){const ctx=await obtenerContexto();if(!ctx)redirect('/login');if(!ctx.perfil)redirect('/bienvenida');if(!ctx.perfil.activo)redirect('/login?error=Usuario%20desactivado');
const sb=await crearClienteServidor();
const {data:s,error}=await sb.from('suscripciones_pania')
.select('estado,modalidad,prueba_hasta,periodo_fin')
.eq('empresa_id',ctx.perfil.empresa_id)
.maybeSingle();
if(error||!s)redirect('/suscripcion');
const ahora=Date.now();
const vigente=s.estado==='prueba'
  ? !!s.prueba_hasta && Date.parse(s.prueba_hasta)>=ahora
  : s.estado==='activa' && (
      s.modalidad==='contado' ||
      (!s.periodo_fin || Date.parse(s.periodo_fin)>=ahora)
    );
if(!vigente)redirect('/suscripcion');
return{user:ctx.user,perfil:ctx.perfil,empresa:ctx.empresa,permisos:ctx.permisos}}
export async function requerirAdmin(){const ctx=await requerirSesion();if(!esAdmin(ctx.perfil.rol))redirect('/');return ctx}
export async function requerirPermiso(modulo:Modulo,accion:AccionPermiso='ver'){const ctx=await requerirSesion();if(!tienePermiso(ctx.perfil.rol,modulo,accion,ctx.permisos))redirect('/?error=Sin%20permiso');return ctx}
export const conMensaje=(ruta:string,tipo:'error'|'ok',texto:string)=>`${ruta}${ruta.includes('?')?'&':'?'}${tipo}=${encodeURIComponent(texto)}`;
