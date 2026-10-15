import {NextResponse} from 'next/server';
import {requerirSesion} from '@/lib/sesion';
import {crearClienteServidor} from '@/lib/supabase/server';
import {responderPania,type ContextoPania} from '@/lib/intelligence/engine';
export const dynamic='force-dynamic';
const n=(v:unknown)=>Number(v??0);
export async function POST(req:Request){
  try{
    const {perfil,empresa}=await requerirSesion();
    if(!['dueno','administrador'].includes(perfil.rol))return NextResponse.json({error:'Tu rol no tiene acceso al asistente gerencial.'},{status:403});
    const body=await req.json().catch(()=>({}));
    const pregunta=String(body?.pregunta??'').trim().slice(0,1200);
    if(!pregunta)return NextResponse.json({error:'Escribe una pregunta.'},{status:400});
    const sb=await crearClienteServidor();
    const desde=new Date(Date.now()-30*86400000).toISOString().slice(0,10);
    const [{data:er},{data:stock},{data:rec},{count:prod},{count:ventas},{data:radar},{data:sucursales}]=await Promise.all([
      sb.from('v_estado_resultados_gerencial').select('*').order('periodo',{ascending:false}).limit(1),
      sb.from('v_stock_productos').select('nombre,stock,sucursal_id').order('stock',{ascending:true}).limit(60),
      sb.from('v_recomendaciones_pania').select('hallazgo,evidencia,prioridad,impacto_estimado,recomendacion,ruta_accion,sucursal_id').order('prioridad').limit(10),
      sb.from('ordenes_produccion').select('id',{count:'exact',head:true}).in('estado',['planeada','en_proceso']),
      sb.from('ventas').select('id',{count:'exact',head:true}).eq('estado','cerrada').gte('fecha_hora',new Date(Date.now()-30*86400000).toISOString()),
      sb.from('v_radar_utilidad_dia').select('fecha,ventas_netas,utilidad_bruta,fugas_medibles,fuga_sobreproduccion_estimada,calidad_dato').gte('fecha',desde).order('fecha',{ascending:false}).limit(30),
      sb.from('sucursales').select('id,nombre')
    ]);
    const ultimo:any=er?.[0]??null;const nombres=new Map((sucursales??[]).map((x:any)=>[String(x.id),String(x.nombre)]));

    const preguntaNormalizada=pregunta.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const necesitaVentas=/venta|vend/.test(preguntaNormalizada);

    let ventasDetalladas:NonNullable<ContextoPania['ventasDetalladas']>=[];
    if(necesitaVentas){
      const desdeVentas=new Date(Date.now()-48*3600000).toISOString();
      const ventasPanito:any[]=[];
      let pagina=0;
      while(true){
        const {data,error}=await sb.from('ventas')
          .select('id,fecha_hora,sucursal_id')
          .eq('empresa_id',perfil.empresa_id)
          .eq('estado','cerrada')
          .gte('fecha_hora',desdeVentas)
          .order('fecha_hora',{ascending:false})
          .range(pagina*500,pagina*500+499);
        if(error)throw error;
        ventasPanito.push(...(data??[]));
        if(!data||data.length<500)break;
        pagina++;
        if(pagina>=20)throw new Error('Demasiadas ventas para el resumen piloto.');
      }
      const idsVentas=ventasPanito.map(x=>x.id);
      const detallesPanito:any[]=[];
      for(let i=0;i<idsVentas.length;i+=100){
        const {data,error}=await sb.from('venta_detalle')
          .select('venta_id,producto_id,cantidad,precio_unitario_neto,iva_tasa')
          .eq('empresa_id',perfil.empresa_id)
          .in('venta_id',idsVentas.slice(i,i+100));
        if(error)throw error;
        detallesPanito.push(...(data??[]));
      }
      const productosIds=[...new Set(detallesPanito.map(x=>x.producto_id))];
      const productosPanito:any[]=[];
      for(let i=0;i<productosIds.length;i+=100){
        const {data,error}=await sb.from('productos')
          .select('id,nombre').eq('empresa_id',perfil.empresa_id)
          .in('id',productosIds.slice(i,i+100));
        if(error)throw error;
        productosPanito.push(...(data??[]));
      }
      const nombresProductos=new Map(productosPanito.map(x=>[x.id,x.nombre]));
      const ventaPorId=new Map(ventasPanito.map(x=>[x.id,x]));
      const fechaMX=(d:string)=>new Intl.DateTimeFormat('en-CA',{
        timeZone:'America/Mexico_City',year:'numeric',
        month:'2-digit',day:'2-digit'
      }).format(new Date(d));
      ventasDetalladas=detallesPanito.map(d=>{
        const v=ventaPorId.get(d.venta_id);
        return {
          fecha:fechaMX(v.fecha_hora),
          sucursal:nombres.get(String(v.sucursal_id))??'Sucursal',
          producto:nombresProductos.get(d.producto_id)??'Producto',
          cantidad:Number(d.cantidad),
          importe:Number(d.cantidad)*Number(d.precio_unitario_neto)*
            (1+Number(d.iva_tasa))
        };
      });
    }
    const contexto:ContextoPania={
      ventasDetalladas,
      empresa:empresa?.nombre??'Panadería',
      estado:ultimo?{periodo:ultimo.periodo,ventas_netas:n(ultimo.ventas_netas),costo_ventas:n(ultimo.costo_ventas),utilidad_bruta:n(ultimo.utilidad_bruta),gastos_operativos:n(ultimo.gastos_operativos),gastos_marketing:n(ultimo.gastos_marketing),utilidad_operativa:n(ultimo.utilidad_operativa),margen_bruto_pct:n(ultimo.margen_bruto_pct),margen_operativo_pct:n(ultimo.margen_operativo_pct),entradas_efectivo:n(ultimo.entradas_efectivo),salidas_efectivo:n(ultimo.salidas_efectivo),flujo_neto:n(ultimo.flujo_neto)}:null,
      stock:(stock??[]).map((x:any)=>({producto:String(x.nombre??'Producto'),stock:n(x.stock),sucursal:nombres.get(String(x.sucursal_id))??'Sucursal'})),
      recomendaciones:(rec??[]).map((x:any)=>({...x,impacto_estimado:n(x.impacto_estimado),prioridad:n(x.prioridad)})),
      radar:(radar??[]).map((x:any)=>({fecha:x.fecha,ventas_netas:n(x.ventas_netas),utilidad_bruta:n(x.utilidad_bruta),fugas_medibles:n(x.fugas_medibles),fuga_sobreproduccion_estimada:n(x.fuga_sobreproduccion_estimada),calidad_dato:x.calidad_dato})),
      ordenesActivas:prod??0,ventasRecientes:ventas??0
    };
    return NextResponse.json(responderPania(pregunta,contexto));
  }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Error del asistente.'},{status:500})}
}
