'use client';
import {useState} from 'react';
type Plan={id:string;nombre:string;precio_mensual:number;precio_anual:number|null;max_sucursales:number|null;max_usuarios:number|null};
type Sus={estado:string;prueba_hasta:string|null;periodo_fin:string|null;plan_id:string};
type Counts={sucursales:number|null;usuarios:number|null;productos:number|null;recetas:number|null};
const mxn=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
const fecha=(s:string|null|undefined)=>s?new Date(s).toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'}):'—';
const cantidad=(n:number|null)=>n===null?'—':new Intl.NumberFormat('es-MX').format(n);
function nombrePlan(p:Plan){return p.nombre.toLowerCase().includes('pania')?p.nombre:`PANIA ${p.nombre}`;}
function Uso({icon,label,n,limit}:{icon:string;label:string;n:number|null;limit:number|null|undefined}){
 const percent=n!==null&&limit!=null&&limit>0?Math.min(100,100*n/limit):null;
 return <article className="pv-use"><span className="pv-use-icon">{icon}</span><div><small>{label}</small><strong>{cantidad(n)}{limit!=null?` / ${cantidad(limit)}`:''}</strong>{percent!==null?<div className="pv-progress" aria-label={`${label}: ${percent.toFixed(0)}% del límite`}><div style={{width:`${percent}%`}}/></div>:null}<small>{n===null?'Dato no disponible':limit==null?'Sin límite definido en el plan':'Límite del plan seleccionado'}</small></div></article>;
}
export default function PlanesVisual({planes,sus,actual,counts,error}:{planes:Plan[];sus:Sus|null;actual:Plan|null;counts:Counts;error:string|null}){
 const [anual,setAnual]=useState(false);
 const permiteAnual=planes.some(p=>p.precio_anual!==null);
 const periodo=sus?.periodo_fin??sus?.prueba_hasta??null;
 return <main className="pv">
 <header className="pv-header"><div><span className="pv-eyebrow">PANIA · TU CUENTA</span><h1>Plan y suscripción</h1><p>Administra el acceso de tu negocio. Consulta tus planes, límites y vigencia.</p></div><div className="pv-secure"><span>🔒</span><div><b>Tu información está protegida</b><small>La contratación todavía no está habilitada desde esta pantalla.</small></div></div></header>
 {error&&<div className="pv-error" role="alert">No se pudo consultar toda la información de suscripción: {error}</div>}
 <section className="pv-summary" aria-label="Estado de suscripción">
  <article><span className="pv-icon pv-amber">♛</span><div><small>Plan actual</small><strong>{actual?.nombre??'Sin plan'}</strong><p>{actual?'Plan registrado en PANIA':'Aún no hay un plan asignado'}</p></div></article>
  <article><span className="pv-icon pv-mint">◎</span><div><small>Estado</small><strong>{sus?.estado??'Sin suscripción'}</strong><span className="pv-state">{sus?.estado??'Sin suscripción'}</span></div></article>
  <article><span className="pv-icon pv-blue">▦</span><div><small>Vigencia</small><strong>{fecha(periodo)}</strong><p>{sus?.periodo_fin?'Fin del periodo registrado':sus?.prueba_hasta?'Fin de prueba registrada':'Sin fecha registrada'}</p></div></article>
 </section>
 <section className="pv-section"><div className="pv-section-head"><div><h2>Planes PANIA</h2><p>Compara los límites de sucursales y usuarios registrados en tu plataforma.</p></div>{permiteAnual&&<div className="pv-toggle" aria-label="Periodo de facturación"><button type="button" aria-pressed={!anual} className={!anual?'pv-selected':''} onClick={()=>setAnual(false)}>Mensual</button><button type="button" aria-pressed={anual} className={anual?'pv-selected':''} onClick={()=>setAnual(true)}>Anual</button></div>}</div>
 <div className="pv-plans">{planes.map((p,i)=>{const precio=anual&&p.precio_anual!==null?p.precio_anual:p.precio_mensual;const esAnual=anual&&p.precio_anual!==null;return <article key={p.id} className={`pv-plan ${i===0?'pv-featured':''}`}><div className="pv-plan-top"><h3>{nombrePlan(p)}</h3>{actual?.id===p.id?<span className="pv-pill">Tu plan</span>:i===0?<span className="pv-pill">Para comenzar</span>:null}</div><p className="pv-description">{p.max_sucursales===null?'Para operaciones con varias sucursales':p.max_sucursales===1?'Para una panadería con una sucursal':'Para negocios en crecimiento'}</p><div className="pv-price"><strong>{mxn(precio)}</strong><span>/{esAnual?'año':'mes'}</span></div>{anual&&p.precio_anual===null&&<small className="pv-note">Precio anual no configurado; se muestra el mensual.</small>}<ul><li>{p.max_sucursales===null?'Sucursales ilimitadas':`Hasta ${p.max_sucursales} ${p.max_sucursales===1?'sucursal':'sucursales'}`}</li><li>{p.max_usuarios===null?'Usuarios ilimitados':`Hasta ${p.max_usuarios} usuarios`}</li><li>Gestión desde PANIA</li></ul><button type="button" disabled title="La contratación estará disponible cuando se conecte la pasarela de pago">{actual?.id===p.id?'Plan registrado':'Contratación próximamente'}</button></article>})}</div>{!planes.length&&<p className="pv-empty">No hay planes activos disponibles para mostrar.</p>}
 <p className="pv-disclaimer">Los precios y límites provienen de la configuración de PANIA. Las funcionalidades incluidas en cada plan deben definirse antes de ofrecer la contratación.</p></section>
 <section className="pv-section"><div className="pv-section-head"><div><h2>Tu uso actual</h2><p>Conteos disponibles para tu sesión. Los límites se muestran únicamente cuando hay un plan asignado.</p></div></div><div className="pv-usage"><Uso icon="▣" label="Sucursales" n={counts.sucursales} limit={actual?.max_sucursales}/><Uso icon="♙" label="Usuarios" n={counts.usuarios} limit={actual?.max_usuarios}/><Uso icon="⬡" label="Productos" n={counts.productos} limit={null}/><Uso icon="▤" label="Recetas" n={counts.recetas} limit={null}/></div></section>
 <p className="pv-footnote">El historial de pagos y los botones de contratación se habilitarán únicamente después de integrar y verificar un proveedor de pagos. Ningún botón de esta página genera cargos.</p>
 </main>;
}
