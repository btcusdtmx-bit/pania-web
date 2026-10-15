'use server';
import { revalidatePath } from 'next/cache';
import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirSesion } from '@/lib/sesion';
export type LineaTicket={nombre:string;cantidad:number;precio:number;importe:number};
export type EstadoVenta = { n:number; ok?:string; error?:string; total?:number; ventaId?:string; folio?:string; recibido?:number|null; cambio?:number|null; fecha?:string; negocio?:string; sucursal?:string; cajero?:string; formaPago?:string; lineasTicket?:LineaTicket[] };
const ROLES_CAJA=['dueno','administrador','encargado','caja'], CANALES=['mostrador','whatsapp','facebook','instagram','pedido','delivery','mayoreo','otro'], PAGOS=['efectivo','tarjeta','transferencia','mixto','credito'];
const t=(f:FormData,k:string)=>String(f.get(k)??'').trim();
export async function cobrarVenta(_prev:EstadoVenta,fd:FormData):Promise<EstadoVenta>{
 const n=Date.now(),{perfil}=await requerirSesion(); if(!ROLES_CAJA.includes(perfil.rol))return{n,error:'Tu rol no puede registrar ventas.'};
 const solicitud_cobro_id=t(fd,'solicitud_cobro_id');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(solicitud_cobro_id))return{n,error:'Identificador de cobro inválido. Vuelve a preparar la venta.'};
 const sucursal_id=t(fd,'sucursal_id'); if(!sucursal_id)return{n,error:'Selecciona la sucursal.'};
 let crudo:unknown; try{crudo=JSON.parse(t(fd,'lineas')||'[]')}catch{return{n,error:'No se pudo leer el carrito.'}}; if(!Array.isArray(crudo)||!crudo.length)return{n,error:'Agrega al menos un producto.'};
 const ac=new Map<string,number>(); for(const l of crudo as {producto_id?:unknown;cantidad?:unknown}[]){const id=String(l?.producto_id??''),c=Number(l?.cantidad);if(!id||!Number.isFinite(c)||c<=0||c>10000)return{n,error:'Revisa las cantidades del carrito.'};ac.set(id,Math.round(((ac.get(id)??0)+c)*100)/100)}
 const lineas=[...ac].map(([producto_id,cantidad])=>({producto_id,cantidad})),canal=CANALES.includes(t(fd,'canal'))?t(fd,'canal'):'mostrador',forma_pago=PAGOS.includes(t(fd,'forma_pago'))?t(fd,'forma_pago'):'efectivo';
 const recibido=t(fd,'efectivo_recibido')===''?null:Number(t(fd,'efectivo_recibido')); if(recibido!==null&&(!Number.isFinite(recibido)||recibido<0))return{n,error:'Revisa el efectivo recibido.'};
 const sb=await crearClienteServidor(); const {data:id,error}=await sb.rpc('registrar_venta_pos',{p_sucursal:sucursal_id,p_canal:canal,p_forma_pago:forma_pago,p_turno:t(fd,'turno')||null,p_cliente:t(fd,'cliente_id')||null,p_campana:t(fd,'campana_id')||null,p_lineas:lineas,p_efectivo_recibido:recibido,p_solicitud_cobro_id:solicitud_cobro_id});
 if(error||!id)return{n,error:`No se pudo registrar la venta: ${error?.message??'error desconocido'}`};
 const [{data:detalle},{data:v},{data:sucursal},{data:empresa}]=await Promise.all([
  sb.from('venta_detalle').select('producto_id,cantidad,precio_unitario_neto,iva_tasa').eq('venta_id',id),
  sb.from('ventas').select('folio_ticket,efectivo_recibido,cambio,fecha_hora').eq('id',id).single(),
  sb.from('sucursales').select('nombre').eq('id',sucursal_id).single(),
  sb.from('empresas').select('nombre').eq('id',perfil.empresa_id).single()
 ]);
 const productoIds=(detalle??[]).map((d:any)=>d.producto_id); const {data:nombres}=productoIds.length?await sb.from('productos').select('id,nombre').in('id',productoIds):{data:[]};
 const nm=new Map((nombres??[]).map((p:any)=>[p.id as string,p.nombre as string]));
 const lineasTicket:LineaTicket[]=(detalle??[]).map((d:any)=>{const precio=Number(d.precio_unitario_neto)*(1+Number(d.iva_tasa||0)),cantidad=Number(d.cantidad);return{nombre:nm.get(d.producto_id)??'Producto',cantidad,precio,importe:cantidad*precio}});
 const total=lineasTicket.reduce((a,l)=>a+l.importe,0);
 revalidatePath('/ventas');revalidatePath('/inventario');revalidatePath('/'); return{n,ok:'Venta cobrada.',total,ventaId:id as string,folio:v?.folio_ticket??undefined,recibido:v?.efectivo_recibido==null?null:Number(v.efectivo_recibido),cambio:v?.cambio==null?null:Number(v.cambio),fecha:v?.fecha_hora??new Date().toISOString(),negocio:empresa?.nombre??'Mi panadería',sucursal:sucursal?.nombre??'Sucursal',cajero:perfil.nombre,formaPago:forma_pago,lineasTicket};
}
