'use client';

import {useMemo,useState} from 'react';
type Venta={id:string;nombre:string;dias:number;diaria:number;ventas7:number;ventas30:number;utilidad30:number;calidad:string};
type Flujo={id:string;nombre:string;dias:number;entradas:number;salidas:number;flujo7:number;flujo30:number;calidad:string};
const mx=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0);
const pct=(n:number)=>`${Math.max(0,Math.min(100,n))}%`;
function Calidad({dias,calidad,flujo=false}:{dias:number;calidad:string;flujo?:boolean}){
 const lista=calidad.toLowerCase();
 const estado=flujo&&dias<7?'aprendiendo':lista.includes('alta')?'alta':lista.includes('media')?'media':'aprendiendo';
 return <span className={'pv-chip pv-chip-'+estado}><span className="pv-dot"/> {flujo&&dias<7?'En aprendizaje':calidad}</span>;
}
function Barra({valor,maximo,tipo}:{valor:number;maximo:number;tipo:'verde'|'dorado'|'coral'}){
 return <div className="pv-bar-track" role="img" aria-label={`${mx(valor)} de ${mx(maximo)}`}><div className={'pv-bar pv-bar-'+tipo} style={{width:pct(maximo>0?Math.max(0,valor)/maximo*100:0)}}/></div>;
}
export default function ProyeccionesVisual({ventas,flujos}:{ventas:Venta[];flujos:Flujo[]}){
 const [sucursal,setSucursal]=useState('todas');
 const [periodo,setPeriodo]=useState<7|30>(30);
 const opciones=useMemo(()=>Array.from(new Map([...ventas,...flujos].map(x=>[x.id,x.nombre])).entries()),[ventas,flujos]);
 const v=ventas.filter(x=>sucursal==='todas'||x.id===sucursal);
 const f=flujos.filter(x=>sucursal==='todas'||x.id===sucursal);
 const ventasTotal=v.reduce((a,x)=>a+x.ventas30,0);
 const utilidadTotal=v.reduce((a,x)=>a+x.utilidad30,0);
 const fValidos=f.filter(x=>x.dias>=7);
 const flujoTotal=fValidos.reduce((a,x)=>a+x.flujo30,0);
 const maxVentas=Math.max(1,...v.map(x=>periodo===7?x.ventas7:x.ventas30));
 const maxFlujo=Math.max(1,...f.map(x=>Math.max(x.entradas,x.salidas)));
 return <main className="pv">
  <div className="pv-heading"><div><span className="pv-eyebrow">PANIA · INTELIGENCIA DE NEGOCIO</span><h1>Proyecciones <span className="pv-heading-star">✦</span></h1><p>Anticipa ventas, utilidad y liquidez con datos reales de cada sucursal.</p></div><div className="pv-filter"><label htmlFor="pv-sucursal">Sucursal</label><select id="pv-sucursal" value={sucursal} onChange={e=>setSucursal(e.target.value)}><option value="todas">Todas las sucursales</option>{opciones.map(([id,nombre])=><option key={id} value={id}>{nombre}</option>)}</select></div></div>
  <div className="pv-metrics">
   <article className="pv-metric pv-metric-sales"><div><span className="pv-metric-label">Ventas estimadas · 30 días</span><strong>{mx(ventasTotal)}</strong><small>Basado en actividad registrada</small></div><span className="pv-illustration" aria-hidden="true">📈</span></article>
   <article className="pv-metric pv-metric-profit"><div><span className="pv-metric-label">Utilidad bruta · 30 días</span><strong>{mx(utilidadTotal)}</strong><small>Estimación, no ganancia garantizada</small></div><span className="pv-illustration" aria-hidden="true">🥐</span></article>
   <article className="pv-metric pv-metric-cash"><div><span className="pv-metric-label">Flujo neto · 30 días</span><strong>{fValidos.length?mx(flujoTotal):'En aprendizaje'}</strong><small>{fValidos.length?`${fValidos.length} sucursal(es) con base suficiente`:'Se requieren 7 días reales por sucursal'}</small></div><span className="pv-illustration" aria-hidden="true">💰</span></article>
  </div>
  <div className="pv-section-head"><div><span className="pv-eyebrow">COMPORTAMIENTO ESTIMADO</span><h2>Ventas por sucursal</h2></div><div className="pv-segments" aria-label="Periodo estimado"><button type="button" aria-pressed={periodo===7} className={periodo===7?'active':''} onClick={()=>setPeriodo(7)}>7 días</button><button type="button" aria-pressed={periodo===30} className={periodo===30?'active':''} onClick={()=>setPeriodo(30)}>30 días</button></div></div>
  <section className="pv-panel"><p className="pv-note">Comparación de montos proyectados por sucursal; no representa ventas reales día a día.</p>{v.length===0?<p className="pv-empty">No hay proyecciones de ventas para esta selección.</p>:<div className="pv-bars">{v.map(x=><div className="pv-bar-row" key={x.id}><div className="pv-bar-meta"><b>{x.nombre}</b><span>{mx(periodo===7?x.ventas7:x.ventas30)}</span></div><Barra valor={periodo===7?x.ventas7:x.ventas30} maximo={maxVentas} tipo="verde"/><div className="pv-bar-sub"><span>{x.dias} días reales</span><Calidad dias={x.dias} calidad={x.calidad}/></div></div>)}</div>}</section>
  <div className="pv-duo">
   <section className="pv-panel"><div className="pv-panel-title"><span className="pv-panel-icon">🍞</span><div><h2>Rentabilidad estimada</h2><p>Ventas y utilidad bruta para los próximos 30 días</p></div></div>{v.length===0?<p className="pv-empty">Sin datos disponibles.</p>:v.map(x=><div className="pv-branch" key={x.id}><div className="pv-branch-top"><b>{x.nombre}</b><Calidad dias={x.dias} calidad={x.calidad}/></div><div className="pv-branch-stats"><div><small>Ventas</small><strong>{mx(x.ventas30)}</strong></div><div><small>Utilidad bruta</small><strong>{mx(x.utilidad30)}</strong></div><div><small>Venta / día</small><strong>{mx(x.diaria)}</strong></div></div><div className="pv-ratio"><span>Utilidad / ventas estimadas</span><b>{x.ventas30>0?(x.utilidad30/x.ventas30*100).toFixed(1)+'%':'—'}</b></div><Barra valor={Math.max(0,x.utilidad30)} maximo={Math.max(1,x.ventas30)} tipo="dorado"/></div>)}</section>
   <section className="pv-panel"><div className="pv-panel-title"><span className="pv-panel-icon">🏦</span><div><h2>Flujo de efectivo</h2><p>Entradas y salidas diarias estimadas</p></div></div>{f.length===0?<p className="pv-empty">Sin movimientos asignados a sucursales activas.</p>:f.map(x=><div className="pv-branch" key={x.id}><div className="pv-branch-top"><b>{x.nombre}</b><Calidad dias={x.dias} calidad={x.calidad} flujo/></div>{x.dias<7?<div className="pv-learning"><span aria-hidden="true">🌱</span><div><b>Aprendiendo de tus movimientos</b><p>{x.dias} de 7 días reales necesarios. Faltan {7-x.dias} para habilitar la proyección de flujo.</p></div></div>:<div className="pv-flow-values"><span>7 días: <b>{mx(x.flujo7)}</b></span><span>30 días: <b>{mx(x.flujo30)}</b></span></div>}<div className="pv-flow-line"><span>Entradas / día</span><b>{mx(x.entradas)}</b></div><Barra valor={x.entradas} maximo={maxFlujo} tipo="verde"/><div className="pv-flow-line"><span>Salidas / día</span><b>{mx(x.salidas)}</b></div><Barra valor={x.salidas} maximo={maxFlujo} tipo="coral"/></div>)}</section>
  </div>
  <aside className="pv-explain"><span aria-hidden="true">💡</span><div><b>Cómo interpretar estas cifras</b><p>Son estimaciones basadas en registros existentes, no resultados garantizados. PANIA solo muestra flujo proyectado a 7 y 30 días cuando una sucursal acumula al menos 7 días reales. Los movimientos sin sucursal no se atribuyen a una sucursal ficticia.</p></div></aside>
 </main>;
}
