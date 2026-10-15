'use client';
import {useMemo,useState} from 'react';
import {crearCampana,registrarGastoCampana} from './actions';

type Campana={id:string;nombre:string;canal:string;fechaInicio:string;fechaFin:string|null;presupuesto:number;gasto:number;ingresos:number;ventas:number;clientes:number;costoVenta:number|null;roi:number|null;estado:string};
type Props={campanas:Campana[];puedeEditar:boolean;error:string|null};
const money=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0);
const number=(n:number)=>new Intl.NumberFormat('es-MX').format(n||0);
const fmtDate=(s:string|null)=>s?(/^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):s):'—';
const color=['#136f5c','#61c9a2','#8ab7f4','#f3c36b','#c3a2f6','#ec8c87'];
const channelIcon=(s:string)=>({Facebook:'f',Instagram:'◎',WhatsApp:'✆',Google:'G',Volantes:'▤',Otro:'✦'} as Record<string,string>)[s]||'✦';
function Donut({items,total,center}:{items:{name:string;value:number}[];total:number;center:string}){
 let offset=0;
 const background=total>0?`conic-gradient(${items.map((x,i)=>{const start=offset;offset+=x.value/total*100;return `${color[i%color.length]} ${start}% ${offset}%`}).join(',')})`:'#e6eeeb';
 return <div className="mv-donut-layout"><div className="mv-donut" style={{background}} role="img" aria-label={items.map(x=>`${x.name}: ${money(x.value)}`).join(', ')||'Sin datos'}><div><b>{center}</b><small>Total</small></div></div><div className="mv-legend">{items.length?items.map((x,i)=><div key={x.name}><span className="mv-dot" style={{background:color[i%color.length]}}/><span>{x.name}</span><b>{total?Math.round(x.value/total*100):0}%</b></div>):<p>Sin ingresos atribuibles</p>}</div></div>;
}
export default function MarketingVisual({campanas,puedeEditar,error}:Props){
 const [busqueda,setBusqueda]=useState('');
 const [estado,setEstado]=useState('todas');
 const [canal,setCanal]=useState('todos');
 const [mostrarForm,setMostrarForm]=useState(true);
 const [mostrarInversion,setMostrarInversion]=useState(false);
 const [detalle,setDetalle]=useState<string|null>(null);
 const [orden,setOrden]=useState<'recientes'|'roi'|'ingresos'>('recientes');
 const gasto=campanas.reduce((a,c)=>a+c.gasto,0),ingresos=campanas.reduce((a,c)=>a+c.ingresos,0);
 const roi=gasto>0?(ingresos-gasto)/gasto*100:null;
 const activas=campanas.filter(x=>x.estado==='activa').length;
 const canales=useMemo(()=>Array.from(new Set(campanas.map(x=>x.canal))),[campanas]);
 const porCanal=useMemo(()=>Array.from(campanas.reduce((m,c)=>m.set(c.canal,(m.get(c.canal)||0)+c.ingresos),new Map<string,number>()).entries()).map(([name,value])=>({name,value})).filter(x=>x.value>0).sort((a,b)=>b.value-a.value),[campanas]);
 const porROI=campanas.filter(c=>c.roi!==null&&c.gasto>0).sort((a,b)=>(b.roi??0)-(a.roi??0)).slice(0,5);
 const maxROI=Math.max(1,...porROI.map(c=>Math.max(0,c.roi??0)));
 const comparativa=[...campanas].sort((a,b)=>b.ingresos-a.ingresos).slice(0,6);
 const maxComp=Math.max(1,...comparativa.map(x=>Math.max(x.gasto,x.ingresos)));
 const filtradas=campanas.filter(x=>(estado==='todas'||x.estado===estado)&&(canal==='todos'||x.canal===canal)&&`${x.nombre} ${x.canal}`.toLowerCase().includes(busqueda.toLowerCase())).sort((a,b)=>orden==='roi'?(b.roi??-Infinity)-(a.roi??-Infinity):orden==='ingresos'?b.ingresos-a.ingresos:b.fechaInicio.localeCompare(a.fechaInicio));
 const csv=()=>{const rows=[['Campaña','Canal','Inicio','Fin','Presupuesto','Inversión','Ingresos atribuibles','Ventas atribuidas','Clientes atribuidos','ROI (%)','Estado'],...filtradas.map(x=>[x.nombre,x.canal,x.fechaInicio,x.fechaFin??'',x.presupuesto,x.gasto,x.ingresos,x.ventas,x.clientes,x.roi===null?'':(x.roi*100).toFixed(1),x.estado])];const str='\ufeff'+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');const blob=new Blob([str],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='PANIA_campanas_marketing.csv';a.click();URL.revokeObjectURL(url)};
 return <main className="mv">
 <header className="mv-header"><div><span className="mv-eyebrow">PANIA · CRECIMIENTO</span><h1><span aria-hidden="true">📣</span> Marketing y ROI</h1><p>Conoce la inversión y las ventas vinculadas explícitamente a cada campaña.</p></div>{puedeEditar&&<button className="mv-primary" type="button" onClick={()=>{setMostrarForm(v=>!v);document.getElementById('mv-crear')?.scrollIntoView({behavior:'smooth',block:'nearest'})}}>＋ {mostrarForm?'Ocultar formulario':'Nueva campaña'}</button>}</header>
 {error&&<p className="mv-error" role="alert">No fue posible cargar las campañas: {error}</p>}
 <section className="mv-kpis">
 <article className="mv-kpi mv-kpi-green"><span className="mv-kpi-icon">📣</span><div><strong>{money(gasto)}</strong><span>Inversión registrada</span><small>Gastos reales vinculados</small></div></article>
 <article className="mv-kpi mv-kpi-blue"><span className="mv-kpi-icon">🛒</span><div><strong>{money(ingresos)}</strong><span>Ingresos atribuibles</span><small>Solo ventas asociadas</small></div></article>
 <article className="mv-kpi mv-kpi-gold"><span className="mv-kpi-icon">📊</span><div><strong>{roi===null?'—':roi.toFixed(1)+'%'}</strong><span>ROI atribuible global</span><small>{roi===null?'Sin inversión registrada':'Ingresos menos inversión / inversión'}</small></div></article>
 <article className="mv-kpi mv-kpi-purple"><span className="mv-kpi-icon">🎯</span><div><strong>{number(activas)}</strong><span>Campañas activas</span><small>{number(campanas.length)} campañas registradas</small></div></article>
 </section>
 <div className="mv-workspace">
 {puedeEditar&&mostrarForm&&<section className="mv-panel mv-form-panel" id="mv-crear"><div className="mv-panel-title"><span>📢</span><div><h2>Nueva campaña</h2><p>Registra una campaña para medir su desempeño</p></div></div><form action={crearCampana} className="mv-form">
 <label>Nombre de la campaña *<input name="nombre" required placeholder="Ej. Promoción de roles 2x1"/></label>
 <label>Canal<select name="canal"><option>Facebook</option><option>Instagram</option><option>WhatsApp</option><option>Google</option><option>Volantes</option><option>Otro</option></select></label>
 <label>Inicio *<input name="fecha_inicio" type="date" required/></label><label>Fin<input name="fecha_fin" type="date"/></label>
 <label>Presupuesto<input name="presupuesto" type="number" min="0" step=".01" placeholder="0.00"/></label>
 <label>Objetivo<input name="objetivo" placeholder="Ventas, clientes nuevos, recurrencia..."/></label>
 <label>Estado<select name="estado"><option value="activa">Activa</option><option value="borrador">Borrador</option><option value="pausada">Pausada</option><option value="finalizada">Finalizada</option></select></label>
 <button className="mv-primary mv-submit" type="submit">Crear campaña</button></form></section>}
 <section className="mv-panel"><div className="mv-panel-title"><span>📈</span><div><h2>Ingresos vs. inversión</h2><p>Comparación por campaña registrada</p></div></div><div className="mv-chart-legend"><span><i style={{background:'#1d8067'}}/> Ingresos</span><span><i style={{background:'#efb752'}}/> Inversión</span></div>{comparativa.length?<div className="mv-comparative">{comparativa.map(c=><div key={c.id} className="mv-comparative-row"><div className="mv-comp-name" title={c.nombre}>{c.nombre}</div><div className="mv-comp-bars"><div className="mv-bar-green" style={{width:`${Math.max(0,c.ingresos)/maxComp*100}%`}}/><div className="mv-bar-gold" style={{width:`${Math.max(0,c.gasto)/maxComp*100}%`}}/></div><b>{money(c.ingresos)}</b></div>)}</div>:<p className="mv-empty">Todavía no hay campañas registradas.</p>}<p className="mv-note">Barras comparativas de montos registrados; no representan una serie mensual.</p></section>
 <section className="mv-panel"><div className="mv-panel-title"><span>🌐</span><div><h2>Ingresos por canal</h2><p>Distribución de ventas atribuibles</p></div></div><Donut items={porCanal} total={ingresos} center={money(ingresos)}/></section>
 <section className="mv-panel"><div className="mv-panel-title"><span>🏆</span><div><h2>Top campañas por ROI</h2><p>Solo campañas con inversión y ROI calculable</p></div></div>{porROI.length?<div className="mv-rank">{porROI.map(c=><div key={c.id}><span title={c.nombre}>{c.nombre}</span><div className="mv-track"><div style={{width:`${Math.max(0,c.roi??0)/maxROI*100}%`}}/></div><strong>{((c.roi??0)*100).toFixed(1)}%</strong></div>)}</div>:<p className="mv-empty">Sin campañas con ROI calculable.</p>}</section>
 </div>
 {puedeEditar&&<section className="mv-investment"><button type="button" onClick={()=>setMostrarInversion(v=>!v)} aria-expanded={mostrarInversion}>💳 Registrar inversión de campaña <span>{mostrarInversion?'−':'＋'}</span></button>{mostrarInversion&&<form action={registrarGastoCampana} className="mv-form mv-invest-form"><label>Campaña<select name="campana_id" required>{campanas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label><label>Fecha<input name="fecha" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label><label>Concepto<input name="concepto" required placeholder="Ej. Publicidad en Meta"/></label><label>Monto<input name="monto" type="number" min=".01" step=".01" required/></label><label>Forma de pago<input name="forma_pago" placeholder="Ej. Transferencia"/></label><button type="submit" className="mv-primary" disabled={!campanas.length}>Guardar inversión</button></form>}</section>}
 <section className="mv-panel mv-table-panel"><div className="mv-table-head"><div className="mv-panel-title"><span>🗂️</span><div><h2>Campañas registradas</h2><p>{filtradas.length} de {campanas.length} campañas</p></div></div><div className="mv-table-tools"><input type="search" value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar campaña..." aria-label="Buscar campaña"/><select aria-label="Filtrar por estado" value={estado} onChange={e=>setEstado(e.target.value)}><option value="todas">Todos los estados</option><option value="activa">Activas</option><option value="borrador">Borradores</option><option value="pausada">Pausadas</option><option value="finalizada">Finalizadas</option></select><select aria-label="Filtrar por canal" value={canal} onChange={e=>setCanal(e.target.value)}><option value="todos">Todos los canales</option>{canales.map(c=><option key={c}>{c}</option>)}</select><select aria-label="Ordenar campañas" value={orden} onChange={e=>setOrden(e.target.value as 'recientes' | 'roi' | 'ingresos')}><option value="recientes">Más recientes</option><option value="roi">Mayor ROI</option><option value="ingresos">Más ingresos</option></select><button type="button" onClick={csv}>↓ Exportar CSV</button></div></div>
 <div className="mv-table-scroll"><table><thead><tr><th>Campaña</th><th>Canal</th><th>Inicio</th><th>Inversión</th><th>Ingresos</th><th>ROI</th><th>Estado</th><th>Detalle</th></tr></thead><tbody>{filtradas.map(c=><tr key={c.id}><td><strong>{c.nombre}</strong></td><td><span className="mv-channel"><span>{channelIcon(c.canal)}</span>{c.canal}</span></td><td>{fmtDate(c.fechaInicio)}</td><td>{money(c.gasto)}</td><td>{money(c.ingresos)}</td><td><strong className={c.roi!==null&&c.roi<0?'mv-loss':'mv-gain'}>{c.roi===null?'—':(c.roi*100).toFixed(1)+'%'}</strong></td><td><span className={'mv-status mv-status-'+c.estado}>{c.estado}</span></td><td><button className="mv-detail-button" type="button" onClick={()=>setDetalle(detalle===c.id?null:c.id)} aria-expanded={detalle===c.id}>{detalle===c.id?'Ocultar':'Ver'}</button></td></tr>).flatMap(row=>{const id=row.key;const c=filtradas.find(x=>x.id===id);return c&&detalle===c.id?[row,<tr key={c.id+'-detalle'} className="mv-expanded"><td colSpan={8}><div><span>Presupuesto: <b>{money(c.presupuesto)}</b></span><span>Fin: <b>{fmtDate(c.fechaFin)}</b></span><span>Ventas atribuidas: <b>{number(c.ventas)}</b></span><span>Clientes atribuidos: <b>{number(c.clientes)}</b></span><span>Costo por venta: <b>{c.costoVenta===null?'—':money(c.costoVenta)}</b></span></div></td></tr>]:[row]})}</tbody></table>{!filtradas.length&&<p className="mv-empty">No hay campañas que coincidan con los filtros.</p>}</div></section>
 <aside className="mv-disclaimer">💡 PANIA calcula ingresos atribuibles solo cuando la venta está vinculada a una campaña. No estima ventas faltantes ni atribuye conversiones sin evidencia. Las gráficas utilizan exclusivamente los datos disponibles.</aside>
 </main>;
}
