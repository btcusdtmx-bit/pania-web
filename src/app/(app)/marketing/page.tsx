import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import MarketingVisual from './MarketingVisual';
import './marketing.css';

export default async function Marketing(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador','marketing'].includes(perfil.rol))return <section className="panel"><h2>Sin acceso</h2></section>;
 const sb=await crearClienteServidor();
 const {data,error}=await sb.from('v_campanas_roi').select('*').order('fecha_inicio',{ascending:false});
 const puede=['dueno','administrador','marketing'].includes(perfil.rol);
 return <MarketingVisual puedeEditar={puede} error={error?.message??null} campanas={(data??[]).map((x:any)=>({
  id:String(x.id),nombre:String(x.nombre??''),canal:String(x.canal??'Otro'),
  fechaInicio:String(x.fecha_inicio??''),fechaFin:x.fecha_fin?String(x.fecha_fin):null,
  presupuesto:Number(x.presupuesto??0),gasto:Number(x.gasto_real??0),
  ingresos:Number(x.ingresos_atribuidos??0),ventas:Number(x.ventas_atribuidas??0),
  clientes:Number(x.clientes_atribuidos??0),costoVenta:x.costo_por_venta==null?null:Number(x.costo_por_venta),
  roi:x.roi==null?null:Number(x.roi),estado:String(x.estado??'')
 }))}/>;
}
