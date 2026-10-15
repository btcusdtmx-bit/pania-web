export type EstadoResultados = {
  periodo?: string | null;
  ventas_netas: number;
  costo_ventas: number;
  utilidad_bruta: number;
  gastos_operativos: number;
  gastos_marketing: number;
  utilidad_operativa: number;
  margen_bruto_pct: number;
  margen_operativo_pct: number;
  entradas_efectivo: number;
  salidas_efectivo: number;
  flujo_neto: number;
};

export type StockProducto = {producto:string; stock:number; sucursal:string};
export type Recomendacion = {hallazgo?:string|null; evidencia?:string|null; prioridad?:number|null; impacto_estimado?:number|null; recomendacion?:string|null; ruta_accion?:string|null; sucursal_id?:string|null};
export type RadarDia = {fecha?:string|null; ventas_netas:number; utilidad_bruta:number; fugas_medibles:number; fuga_sobreproduccion_estimada:number; calidad_dato?:string|null};

export type VentaPanito = {
  fecha:string;
  sucursal:string;
  producto:string;
  cantidad:number;
  importe:number;
};

export type ContextoPania = {
  ventasDetalladas?:VentaPanito[];
  empresa:string;
  estado:EstadoResultados | null;
  stock:StockProducto[];
  recomendaciones:Recomendacion[];
  radar:RadarDia[];
  ordenesActivas:number;
  ventasRecientes:number;
};

const dinero=(v:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(v||0);
const pct=(v:number)=>`${((v||0)*100).toFixed(1)}%`;
const normaliza=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function calidad(ctx:ContextoPania){
  const dias=new Set(ctx.radar.map(x=>x.fecha).filter(Boolean)).size;
  if(dias>=14)return 'alta';
  if(dias>=7)return 'media';
  return 'limitada';
}

function resumen(ctx:ContextoPania){
  if(!ctx.estado)return `Todavía no tengo información suficiente del estado de resultados de ${ctx.empresa}. Puedo revisar inventario y alertas disponibles.`;
  const e=ctx.estado;
  const flujo=e.flujo_neto<0?`El flujo neto es negativo en ${dinero(Math.abs(e.flujo_neto))}.`:`El flujo neto es ${dinero(e.flujo_neto)}.`;
  const alerta=ctx.recomendaciones[0];
  return `Resumen de ${ctx.empresa}: ventas netas ${dinero(e.ventas_netas)}, utilidad bruta ${dinero(e.utilidad_bruta)} y utilidad operativa ${dinero(e.utilidad_operativa)}. Margen operativo ${pct(e.margen_operativo_pct)}. ${flujo}${alerta?` Prioridad actual: ${alerta.hallazgo ?? 'revisar una alerta operativa'}.`:''}`;
}

function inventario(ctx:ContextoPania){
  if(!ctx.stock.length)return 'No encontré existencias de producto terminado para analizar. Si todavía no hay movimientos de inventario, PANIA considera el stock en cero.';
  const agotados=ctx.stock.filter(x=>x.stock<=0);
  const bajos=ctx.stock.filter(x=>x.stock>0&&x.stock<=5);
  const foco=[...agotados,...bajos].slice(0,6);
  if(!foco.length){const min=[...ctx.stock].sort((a,b)=>a.stock-b.stock).slice(0,3);return `No veo productos agotados ni con 5 piezas o menos. Los stocks más bajos son: ${min.map(x=>`${x.producto} (${x.stock} en ${x.sucursal})`).join(', ')}.`}
  return `Atención de inventario: ${agotados.length} producto(s) agotado(s) y ${bajos.length} con stock bajo. Revisa primero ${foco.map(x=>`${x.producto}: ${x.stock} en ${x.sucursal}`).join('; ')}. PANIA no permitirá vender por encima del stock disponible.`;
}

function prioridades(ctx:ContextoPania){
  if(!ctx.recomendaciones.length)return `No hay recomendaciones activas en los datos que PANIA pudo consultar. Aun así conviene revisar inventario, flujo y producción antes de iniciar el día.`;
  const r=ctx.recomendaciones.slice(0,4);
  return `Lo que revisaría primero hoy:\n${r.map((x,i)=>`${i+1}. ${x.hallazgo ?? 'Hallazgo'}${x.evidencia?` — ${x.evidencia}`:''}${Number(x.impacto_estimado)>0?` (impacto referencial ${dinero(Number(x.impacto_estimado))})`:''}${x.recomendacion?` Recomendación: ${x.recomendacion}`:''}`).join('\n')}`;
}

function rentabilidad(ctx:ContextoPania){
  const e=ctx.estado;if(!e)return 'No tengo todavía un estado de resultados suficiente para calcular la rentabilidad.';
  return `Rentabilidad del periodo ${e.periodo??'actual'}: ventas ${dinero(e.ventas_netas)}, costo de ventas ${dinero(e.costo_ventas)}, utilidad bruta ${dinero(e.utilidad_bruta)} (${pct(e.margen_bruto_pct)}) y utilidad operativa ${dinero(e.utilidad_operativa)} (${pct(e.margen_operativo_pct)}). Gastos operativos: ${dinero(e.gastos_operativos)}; marketing: ${dinero(e.gastos_marketing)}.`;
}


function ventas(ctx:ContextoPania,pregunta:string){
  const q=normaliza(pregunta);
  const datos=ctx.ventasDetalladas??[];
  const zona='America/Mexico_City';
  const fecha=(d:string|Date)=>new Intl.DateTimeFormat('en-CA',{
    timeZone:zona,year:'numeric',month:'2-digit',day:'2-digit'
  }).format(new Date(d));
  const hoy=fecha(new Date());
  const ayer=fecha(new Date(Date.now()-86400000));
  const pideHoy=/\\bhoy\\b/.test(q);
  const pideAyer=/\\bayer\\b/.test(q);
  const periodo=pideHoy?hoy:pideAyer?ayer:null;
  const filas=periodo?datos.filter(x=>x.fecha===periodo):datos;

  if(!datos.length){
    return 'No encontré detalles de ventas cerradas en el periodo consultado.';
  }

  const total=filas.reduce((s,x)=>s+x.importe,0);
  const unidades=filas.reduce((s,x)=>s+x.cantidad,0);
  const porProducto=new Map<string,{cantidad:number;importe:number}>();
  const porSucursal=new Map<string,number>();

  for(const x of filas){
    const p=porProducto.get(x.producto)??{cantidad:0,importe:0};
    p.cantidad+=x.cantidad;
    p.importe+=x.importe;
    porProducto.set(x.producto,p);
    porSucursal.set(x.sucursal,(porSucursal.get(x.sucursal)??0)+x.importe);
  }

  const productos=[...porProducto.entries()]
    .sort((a,b)=>b[1].cantidad-a[1].cantidad).slice(0,8)
    .map(([nombre,v])=>`${nombre}: ${v.cantidad} unidades (${dinero(v.importe)})`);

  const sucursales=[...porSucursal.entries()]
    .map(([nombre,v])=>`${nombre}: ${dinero(v)}`);

  return `Ventas ${periodo??'del periodo consultado'}:
${dinero(total)} en ${unidades} unidades.
Productos:
${productos.join('\\n')||'Sin productos vendidos'}
Sucursales:
${sucursales.join('\\n')||'Sin ventas'}`;
}

function produccion(ctx:ContextoPania){
  const dias=new Set(ctx.radar.map(x=>x.fecha).filter(Boolean)).size;
  const stockBajo=ctx.stock.filter(x=>x.stock<=5).sort((a,b)=>a.stock-b.stock).slice(0,5);
  if(dias<7)return `Puedo señalar qué necesita atención, pero todavía no recomiendo una cantidad automática para mañana: sólo hay ${dias} día(s) con información reciente. ${stockBajo.length?`Productos a revisar por stock: ${stockBajo.map(x=>`${x.producto} (${x.stock})`).join(', ')}.`:''} Con 7 o más días podremos combinar venta reciente + stock + producción para una sugerencia más confiable.`;
  if(!stockBajo.length)return 'Con la información disponible no veo productos terminados con stock crítico. Para sugerir cantidades de producción por producto hace falta incorporar la demanda histórica por artículo; PANIA no inventará esa cifra.';
  return `Para planear mañana empezaría revisando estos productos por stock: ${stockBajo.map(x=>`${x.producto} (${x.stock} en ${x.sucursal})`).join(', ')}. La cantidad exacta no la invento: la siguiente mejora del motor cruzará ventas por producto, stock actual y producción pendiente antes de proponer piezas.`;
}

function flujo(ctx:ContextoPania){const e=ctx.estado;if(!e)return 'No tengo información financiera suficiente para evaluar el flujo.';return `Flujo del periodo: entradas ${dinero(e.entradas_efectivo)}, salidas ${dinero(e.salidas_efectivo)} y flujo neto ${dinero(e.flujo_neto)}. ${e.flujo_neto<0?'Es una señal de atención: hay más salida de efectivo que entrada en el periodo.':'El flujo neto no es negativo en este periodo.'}`}

export function responderPania(pregunta:string,ctx:ContextoPania){
  const q=normaliza(pregunta);
  let tipo='resumen';let respuesta='';
  if(/stock|inventario|agotad|existencia/.test(q)){tipo='inventario';respuesta=inventario(ctx)}
  else if(/produc|manana|hornear|fabricar/.test(q)){tipo='produccion';respuesta=produccion(ctx)}
  else if(/rentab|utilidad|margen|ganancia|costo/.test(q)){tipo='rentabilidad';respuesta=rentabilidad(ctx)}
  else if(/flujo|efectivo|dinero|caja/.test(q)){tipo='flujo';respuesta=flujo(ctx)}
  else if(/venta|vend/.test(q)){tipo='ventas';respuesta=ventas(ctx,pregunta)}
  else if(/revis|atencion|alert|problema|riesgo|perdiendo|perdida/.test(q)){tipo='prioridades';respuesta=prioridades(ctx)}
  else if(/como va|resumen|negocio|panaderia|hoy/.test(q)){tipo='resumen';respuesta=resumen(ctx)}
  else respuesta=`Puedo responder con datos verificables de PANIA sobre ventas, utilidad, flujo, inventario, alertas y producción. Prueba con “¿Cómo va mi panadería?”, “¿Qué tiene poco stock?”, “¿Qué debo revisar hoy?” o “¿Qué debería producir mañana?”.`;
  return {respuesta,tipo,calidad_dato:calidad(ctx),motor:'PANIA_NATIVE_1'};
}
