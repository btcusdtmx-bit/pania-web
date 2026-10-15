'use client';

import {useMemo,useState} from 'react';
import './alertas.css';

type Alerta={tipo?:string|null;titulo?:string|null;detalle?:string|null;severidad?:string|null;valor_afectado?:number|string|null;accion?:string|null;sucursal_id?:string|null};
const moneda=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0);
const nombreNivel=(s:string)=>({critica:'Crítica',alta:'Alta',media:'Media',baja:'Baja'}[s]||'Sin clasificar');
const iconoTipo=(tipo:string)=>/inventario|stock|insumo/i.test(tipo)?'📦':/utilidad|fuga|margen/i.test(tipo)?'📉':/flujo|caja|banco/i.test(tipo)?'💸':/venta|equilibrio/i.test(tipo)?'🧾':/cliente|recurrencia/i.test(tipo)?'👥':/marketing|campaña|roi/i.test(tipo)?'📣':/presupuesto|gasto/i.test(tipo)?'📊':'🔔';
const peso={critica:0,alta:1,media:2,baja:3};
export default function AlertasVisual({alertas,sucursales}:{alertas:Alerta[];sucursales:Record<string,string>}){
 const [filtro,setFiltro]=useState('todas');const [busqueda,setBusqueda]=useState('');const [cantidad,setCantidad]=useState(8);
 const resumen=useMemo(()=>({criticas:alertas.filter(a=>a.severidad==='critica').length,altas:alertas.filter(a=>a.severidad==='alta').length,otras:alertas.filter(a=>!['critica','alta'].includes(a.severidad||'')).length,impacto:alertas.reduce((s,a)=>s+(Number(a.valor_afectado)||0),0)}),[alertas]);
 const visibles=useMemo(()=>alertas.filter(a=>(filtro==='todas'||a.severidad===filtro)&&[a.titulo,a.detalle,a.tipo,a.accion,a.sucursal_id?sucursales[a.sucursal_id]:null].some(v=>String(v||'').toLocaleLowerCase('es').includes(busqueda.toLocaleLowerCase('es')))),[alertas,filtro,busqueda,sucursales]);
 const mostrar=visibles.slice(0,cantidad);
 const seleccionar=(valor:string)=>{setFiltro(valor);setCantidad(8)};
 return <main className="pania-alertas-v3">
  <section className="al-hero"><div><div className="al-eyebrow">CENTRO DE CONTROL · PANIA</div><h1>Alertas inteligentes <span>✦</span></h1><p>Detecta lo que necesita atención y actúa con datos reales, no con predicciones.</p><div className="al-hero-note"><span className="al-live"/> Reglas verificables · Actualizado con los datos de PANIA</div></div><div className="al-hero-art" aria-hidden="true"><div className="al-art-circle">🔔</div><span className="al-art-float a">⚡</span><span className="al-art-float b">📈</span></div></section>
  <section className="al-stats" aria-label="Resumen de alertas">
   <div className="al-stat al-stat-total"><div className="al-stat-top"><span>Alertas detectadas</span><span className="al-stat-emoji">🔔</span></div><strong>{alertas.length}</strong><small>Situaciones identificadas por las reglas</small></div>
   <div className="al-stat al-stat-critical"><div className="al-stat-top"><span>Críticas</span><span className="al-stat-emoji">🚨</span></div><strong>{resumen.criticas}</strong><small>Requieren atención inmediata</small></div>
   <div className="al-stat al-stat-high"><div className="al-stat-top"><span>Prioridad alta</span><span className="al-stat-emoji">⚠️</span></div><strong>{resumen.altas}</strong><small>Atender después de las críticas</small></div>
   <div className="al-stat al-stat-other"><div className="al-stat-top"><span>Otras prioridades</span><span className="al-stat-emoji">📋</span></div><strong>{resumen.otras}</strong><small>Media, baja o sin clasificar</small></div>
  </section>
  <section className="al-content"><div className="al-section-title"><div><span className="al-overline">BANDEJA DE ATENCIÓN</span><h2>Qué requiere atención</h2><p>Ordenadas por gravedad y valor afectado. Usa los filtros para enfocarte.</p></div><div className="al-count">{visibles.length} de {alertas.length} alertas</div></div>
   <div className="al-toolbar"><div className="al-filters" role="group" aria-label="Filtrar por prioridad">{[['todas','Todas'],['critica','🔴 Críticas'],['alta','🟠 Altas'],['media','🟡 Medias'],['baja','🟢 Bajas']].map(([v,t])=><button type="button" key={v} className={filtro===v?'al-active':''} onClick={()=>seleccionar(v)} aria-pressed={filtro===v}>{t}</button>)}</div><label className="al-search"><span aria-hidden="true">⌕</span><input value={busqueda} onChange={e=>{setBusqueda(e.target.value);setCantidad(8)}} placeholder="Buscar alerta, sucursal o acción..." aria-label="Buscar alertas"/></label></div>
   {mostrar.length?<div className="al-alert-grid">{mostrar.map((a,i)=>{const nivel=a.severidad||'otra';const impacto=a.valor_afectado==null?null:Number(a.valor_afectado);return <article key={`${a.tipo||'alerta'}-${a.titulo||''}-${i}-${cantidad}`} className={`al-alert al-level-${nivel}`}><div className="al-alert-icon" aria-hidden="true">{iconoTipo(a.tipo||a.titulo||'')}</div><div className="al-alert-body"><div className="al-alert-meta"><span className="al-severity">{nombreNivel(nivel)}</span>{a.sucursal_id&&<span className="al-branch">📍 {sucursales[a.sucursal_id]||'Sucursal'}</span>}</div><h3>{a.titulo||'Alerta detectada'}</h3>{a.detalle&&<p>{a.detalle}</p>}{a.accion&&<div className="al-action"><span aria-hidden="true">↗</span><div><b>Qué hacer</b><span>{a.accion}</span></div></div>}</div>{impacto!==null&&<div className="al-impact"><small>Valor afectado</small><strong>{moneda(impacto)}</strong></div>}</article>})}</div>:<div className="al-empty"><span>✨</span><h3>{alertas.length?'No hay alertas con estos filtros':'Sin alertas detectadas'}</h3><p>{alertas.length?'Prueba otra prioridad o cambia la búsqueda.':'Las reglas actuales no detectaron problemas activos.'}</p></div>}
   {visibles.length>cantidad&&<button type="button" className="al-more" onClick={()=>setCantidad(c=>c+8)}>Mostrar más alertas ({visibles.length-cantidad} restantes) ↓</button>}
  </section>
  <section className="al-rules"><div className="al-rules-icon">🛡️</div><div><h2>Reglas que vigila PANIA</h2><p>Inventario · Utilidad · Flujo de caja · Presupuestos · Punto de equilibrio · Recurrencia de clientes · Marketing</p><small>Las alertas se generan mediante reglas verificables sobre información registrada.</small></div></section>
 </main>
}
