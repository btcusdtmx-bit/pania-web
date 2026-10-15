import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import ProyeccionesVisual from './ProyeccionesVisual';
import './proyecciones.css';

export default async function Proyecciones(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador'].includes(perfil.rol)) return <section className="panel"><h2>Sin acceso</h2></section>;
 const sb=await crearClienteServidor();
 const [{data:v},{data:f},{data:s}]=await Promise.all([
  sb.from('v_proyeccion_ventas_utilidad').select('*'),
  sb.from('v_proyeccion_flujo').select('*'),
  sb.from('sucursales').select('id,nombre').eq('activa',true)
 ]);
 const sm=new Map((s??[]).map((x:any)=>[x.id,x.nombre]));
 const ventasSucursal=(v??[]).filter((x:any)=>sm.has(x.sucursal_id));
 const flujoSucursal=(f??[]).filter((x:any)=>sm.has(x.sucursal_id));
 return <ProyeccionesVisual
  ventas={ventasSucursal.map((x:any)=>({
   id:String(x.sucursal_id),nombre:String(sm.get(x.sucursal_id)),
   dias:Number(x.dias_con_datos)||0,diaria:Number(x.venta_diaria_estimada)||0,
   ventas7:Number(x.ventas_7d)||0,ventas30:Number(x.ventas_30d)||0,
   utilidad30:Number(x.utilidad_30d)||0,calidad:String(x.calidad??'Sin clasificar')
  }))}
  flujos={flujoSucursal.map((x:any)=>({
   id:String(x.sucursal_id),nombre:String(sm.get(x.sucursal_id)),
   dias:Number(x.dias_con_datos)||0,entradas:Number(x.entrada_diaria_estimada)||0,
   salidas:Number(x.salida_diaria_estimada)||0,flujo7:Number(x.flujo_7d)||0,
   flujo30:Number(x.flujo_30d)||0,calidad:String(x.calidad??'Sin clasificar')
  }))}
 />;
}
