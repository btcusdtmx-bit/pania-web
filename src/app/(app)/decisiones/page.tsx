import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import DecisionesPanel from './DecisionesPanel';
export default async function Decisiones(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador'].includes(perfil.rol))return <section className="panel"><h2>Sin acceso</h2></section>;
 const sb=await crearClienteServidor();
 const [{data:r},{data:s}]=await Promise.all([
  sb.from('v_recomendaciones_pania').select('*').order('prioridad').order('impacto_estimado',{ascending:false}),
  sb.from('sucursales').select('id,nombre')
 ]);
 const sm=new Map((s??[]).map((x:any)=>[x.id,x.nombre]));
 const rows=(r??[]).map((x:any)=>({
  tipo:String(x.tipo??''), prioridad:Number(x.prioridad??99),
  severidad:String(x.severidad??''), hallazgo:String(x.hallazgo??''),
  evidencia:String(x.evidencia??''), recomendacion:String(x.recomendacion??''),
  impacto:Number(x.impacto_estimado??0), ruta:String(x.ruta_accion??''),
  sucursal:x.sucursal_id?String(sm.get(x.sucursal_id)??'Sucursal'):''
 }));
 return <DecisionesPanel rows={rows}/>;
}
