import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import ClientesVisual from './ClientesVisual';
import './clientes.css';

export default async function Clientes(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador','encargado','caja','marketing'].includes(perfil.rol))return <section className="panel"><h2>Sin acceso</h2></section>;
 const sb=await crearClienteServidor();
 const {data,error}=await sb.from('v_clientes_recurrencia').select('*').order('gasto_acumulado',{ascending:false});
 const puede=['dueno','administrador','encargado','caja'].includes(perfil.rol);
 return <ClientesVisual puedeCrear={puede} error={error?.message??null} clientes={(data??[]).map((x:any)=>({
  id:String(x.id),nombre:String(x.nombre??''),telefono:x.telefono?String(x.telefono):null,
  compras:Number(x.compras)||0,ultimaCompra:x.ultima_compra?String(x.ultima_compra):null,
  diasSinComprar:x.dias_sin_comprar==null?null:Number(x.dias_sin_comprar),
  ticketPromedio:Number(x.ticket_promedio)||0,gastoAcumulado:Number(x.gasto_acumulado)||0
 }))}/>;
}
