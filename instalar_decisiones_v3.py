from pathlib import Path
from datetime import datetime
import shutil

root=Path.cwd()
page=root/'src/app/(app)/decisiones/page.tsx'
client=root/'src/app/(app)/decisiones/DecisionesPanel.tsx'
css=root/'src/app/globals.css'
if not page.exists() or not css.exists():
    raise SystemExit('ERROR: Ejecuta este instalador desde /workspaces/PANIA')
backup=root/'respaldos'/('decisiones_v3_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=True)
for p in (page,client,css):
    if p.exists():
        dest=backup/(p.name+'.bak')
        shutil.copy2(p,dest)
page.write_text('''import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import {DecisionesPanel, type Decision} from './DecisionesPanel';

export default async function Decisiones(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador'].includes(perfil.rol))return <section className="panel"><h2>Sin acceso</h2></section>;
 const sb=await crearClienteServidor();
 const [{data:r,error},{data:s}]=await Promise.all([
  sb.from('v_recomendaciones_pania').select('*').order('prioridad').order('impacto_estimado',{ascending:false}),
  sb.from('sucursales').select('id,nombre')
 ]);
 if(error)return <section className="panel"><h2>No fue posible cargar las decisiones</h2><p>{error.message}</p></section>;
 const sucursales=Object.fromEntries((s??[]).map((x:any)=>[String(x.id),String(x.nombre)]));
 return <DecisionesPanel rows={(r??[]) as Decision[]} sucursales={sucursales}/>;
}
''')
client.write_text('''\'use client\';
import {useMemo,useState} from 'react';

export type Decision={
 tipo?:string|null; prioridad?:number|null; severidad?:string|null;
 hallazgo?:string|null; evidencia?:string|null; recomendacion?:string|null;
 impacto_estimado?:number|string|null; ruta_accion?:string|null; sucursal_id?:string|null;
};
const mx=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0);
const txt=(v:unknown)=>String(v??'').trim();
const nivel=(r:Decision)=>Number(r.prioridad)===1?'Crítica':Number(r.prioridad)===2?'Alta':Number(r.prioridad)===3?'Media':txt(r.severidad)||'Informativa';
const clase=(r:Decision)=>Number(r.prioridad)===1?'critica':Number(r.prioridad)===2?'alta':'normal';
const ruta=(r:Decision)=>{const x=txt(r.ruta_accion);return x.startsWith('/')&&!x.startsWith('//')?x:null};
const clave=(r:Decision)=>[txt(r.tipo).toLowerCase(),txt(r.hallazgo).toLowerCase(),txt(r.recomendacion).toLowerCase(),txt(r.ruta_accion),txt(r.sucursal_id)].join('|');

type Grupo={id:string;item:Decision;cantidad:number;impacto:number;evidencias:string[]};
export function DecisionesPanel({rows,sucursales}:{rows:Decision[];sucursales:Record<string,string>}){
 const [filtro,setFiltro]=useState('todas');
 const [busqueda,setBusqueda]=useState('');
 const [mostrarTodas,setMostrarTodas]=useState(false);
 const grupos=useMemo(()=>{
  const mapa=new Map<string,Grupo>();
  for(const r of rows){
   const id=clave(r);const existente=mapa.get(id);
   const evidencia=txt(r.evidencia);
   if(existente){existente.cantidad++;if(evidencia&&!existente.evidencias.includes(evidencia))existente.evidencias.push(evidencia);}
   else mapa.set(id,{id,item:r,cantidad:1,impacto:Number(r.impacto_estimado)||0,evidencias:evidencia?[evidencia]:[]});
  }
  return [...mapa.values()].sort((a,b)=>(Number(a.item.prioridad)||99)-(Number(b.item.prioridad)||99)||b.impacto-a.impacto);
 },[rows]);
 const criticos=grupos.filter(g=>Number(g.item.prioridad)===1).length;
 const impacto=grupos.reduce((s,g)=>s+g.impacto,0);
 const filtrados=grupos.filter(g=>{
  const coincide=filtro==='todas'||(filtro==='criticas'&&Number(g.item.prioridad)===1)||(filtro==='otras'&&Number(g.item.prioridad)!==1);
  const texto=[g.item.hallazgo,g.item.recomendacion,g.item.tipo,...g.evidencias].join(' ').toLowerCase();
  return coincide&&texto.includes(busqueda.trim().toLowerCase());
 });
 const visibles=mostrarTodas?filtrados:filtrados.slice(0,12);
 return <main className="dec-v3">
  <header className="dec-hero"><div><span className="dec-eyebrow">✦ INTELIGENCIA PANIA · ACCIONES CON EVIDENCIA</span><h1>Centro de decisiones</h1><p>Detecta lo importante, entiende el motivo y actúa desde el módulo correcto.</p></div><span className="dec-readonly">● Análisis de solo lectura</span></header>
  <section className="dec-metricas" aria-label="Indicadores de decisiones">
   <article className="dec-metrica"><span>Hallazgos diferentes</span><strong>{grupos.length}</strong><small>{rows.length} registros de origen</small></article>
   <article className="dec-metrica dec-metrica-critica"><span>Atención crítica</span><strong>{criticos}</strong><small>Hallazgos únicos prioritarios</small></article>
   <article className="dec-metrica"><span>Impacto referencial</span><strong>{mx(impacto)}</strong><small>Sin duplicar hallazgos idénticos</small></article>
  </section>
  <section className="dec-seccion"><div className="dec-titulo"><div><span className="dec-eyebrow">TU PLAN DE ACCIÓN</span><h2>¿Qué debería atender hoy?</h2><p>Las primeras tres prioridades, ordenadas por urgencia e impacto.</p></div></div>
   <div className="dec-top">{grupos.slice(0,3).map((g,i)=><article key={g.id} className="dec-accion"><div className="dec-accion-enc"><span className="dec-numero">{i+1}</span><span className={'dec-prioridad '+clase(g.item)}>{nivel(g.item)}</span></div><h3>{txt(g.item.recomendacion)||txt(g.item.hallazgo)||'Revisar hallazgo'}</h3><p className="dec-hallazgo">{txt(g.item.hallazgo)||'Revisar evidencia registrada'}</p><div className="dec-accion-pie"><span>{g.impacto>0?mx(g.impacto)+' · referencial':'Sin impacto cuantificado'}</span>{ruta(g.item)?<a className="dec-abrir" href={ruta(g.item)!}>Revisar evidencia →</a>:<span className="dec-sinruta">Sin ruta disponible</span>}</div></article>)}{!grupos.length&&<div className="dec-vacio">No hay recomendaciones pendientes con las reglas actuales.</div>}</div>
  </section>
  <section className="dec-seccion"><div className="dec-titulo"><div><span className="dec-eyebrow">SEGUIMIENTO</span><h2>Explorar recomendaciones</h2><p>Los hallazgos idénticos se muestran juntos, sin eliminar datos.</p></div><span className="dec-contador">{filtrados.length} resultados</span></div>
   <div className="dec-filtros"><div className="dec-pestanas"><button type="button" className={filtro==='todas'?'activo':''} onClick={()=>{setFiltro('todas');setMostrarTodas(false)}}>Todas</button><button type="button" className={filtro==='criticas'?'activo':''} onClick={()=>{setFiltro('criticas');setMostrarTodas(false)}}>Críticas</button><button type="button" className={filtro==='otras'?'activo':''} onClick={()=>{setFiltro('otras');setMostrarTodas(false)}}>Otras</button></div><input aria-label="Buscar recomendaciones" placeholder="Buscar hallazgo o evidencia..." value={busqueda} onChange={e=>{setBusqueda(e.target.value);setMostrarTodas(false)}}/></div>
   <div className="dec-lista">{visibles.map(g=><details key={g.id} className="dec-fila"><summary><span className={'dec-prioridad '+clase(g.item)}>{nivel(g.item)}</span><span className="dec-fila-principal"><strong>{txt(g.item.hallazgo)||txt(g.item.recomendacion)||'Hallazgo'}</strong><small>{txt(g.item.recomendacion)}</small></span><span className="dec-fila-impacto">{g.impacto>0?mx(g.impacto):'—'}</span><span className="dec-fila-ver">Detalles ⌄</span></summary><div className="dec-detalle"><p><b>Recomendación:</b> {txt(g.item.recomendacion)||'No especificada'}</p><p><b>Evidencia:</b> {g.evidencias.length?g.evidencias.join(' · '):'No detallada'}</p>{g.item.sucursal_id&&<p><b>Sucursal:</b> {sucursales[String(g.item.sucursal_id)]||'Sucursal'}</p>}{g.cantidad>1&&<p><b>Registros agrupados:</b> {g.cantidad} (se conservan en la fuente)</p>}{ruta(g.item)&&<a className="dec-abrir" href={ruta(g.item)!}>Abrir módulo →</a>}</div></details>)}{!filtrados.length&&<div className="dec-vacio">No hay resultados para este filtro.</div>}</div>
   {!mostrarTodas&&filtrados.length>12&&<button type="button" className="dec-mas" onClick={()=>setMostrarTodas(true)}>Mostrar las {filtrados.length} recomendaciones</button>}
  </section>
  <p className="dec-nota">Las recomendaciones provienen de reglas y datos autorizados de PANIA. El impacto es orientativo, no una ganancia garantizada. Esta pantalla no ejecuta movimientos.</p>
 </main>;
}
''')
marker='/* PANIA DECISIONES V3 */'
style='''
/* PANIA DECISIONES V3 */
.dec-v3{width:100%;max-width:1440px;margin:0 auto;padding:4px 0 40px;color:#173a32;font-family:inherit}
.dec-hero{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:22px;flex-wrap:wrap}
.dec-hero h1{font-size:clamp(28px,3vw,38px);margin:6px 0 8px;color:#123c32;letter-spacing:-.035em}
.dec-hero p,.dec-titulo p{color:#667b73;margin:0;line-height:1.5}
.dec-eyebrow{font-size:11px;letter-spacing:.13em;font-weight:900;color:#16806c}
.dec-readonly{border-radius:999px;background:#e8f5ee;color:#146b51;padding:9px 13px;font-size:12px;font-weight:800}
.dec-metricas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;margin-bottom:25px}
.dec-metrica{background:white;border:1px solid #dce8df;border-radius:17px;padding:20px 22px;display:grid;gap:8px;box-shadow:0 5px 20px #0c3a2510}
.dec-metrica span{color:#58746b;font-size:13px;font-weight:700}.dec-metrica strong{font-size:clamp(27px,3vw,38px);letter-spacing:-.04em;line-height:1.15}.dec-metrica small{color:#84978e;font-size:12px}
.dec-metrica-critica{background:#fff7ef;border-color:#f4dac7}.dec-metrica-critica strong{color:#a34b22}
.dec-seccion{background:#fff;border:1px solid #e1e9e3;border-radius:19px;padding:23px;margin:18px 0;box-shadow:0 7px 24px #173d2810}
.dec-titulo{display:flex;justify-content:space-between;align-items:center;gap:15px;margin-bottom:19px}.dec-titulo h2{font-size:21px;margin:5px 0 5px;color:#183e33}.dec-contador{font-size:12px;font-weight:800;color:#688478;white-space:nowrap}
.dec-top{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.dec-accion{border:1px solid #dce8e0;background:linear-gradient(150deg,#f7fbf8,#fff);border-radius:15px;padding:18px;display:flex;flex-direction:column;gap:12px;min-width:0}.dec-accion-enc{display:flex;justify-content:space-between;align-items:center}.dec-numero{display:grid;place-items:center;background:#126b59;color:white;border-radius:11px;width:34px;height:34px;font-weight:900}.dec-prioridad{display:inline-flex;width:max-content;align-items:center;border-radius:999px;font-size:11px;font-weight:900;padding:6px 10px;background:#edf4f1;color:#47685b}.dec-prioridad.critica{background:#ffe5d8;color:#9c3d17}.dec-prioridad.alta{background:#fff1cb;color:#916000}.dec-accion h3{font-size:16px;line-height:1.4;margin:0;color:#173d33}.dec-hallazgo{font-size:13px;color:#687e73;line-height:1.5;margin:0;flex:1}.dec-accion-pie{border-top:1px solid #dfe9e3;padding-top:12px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px;align-items:center;font-size:12px;font-weight:800}.dec-abrir{display:inline-flex;text-decoration:none!important;background:#116c59;color:#fff!important;padding:10px 13px;border-radius:9px;font-size:12px;font-weight:800;white-space:nowrap}.dec-abrir:hover{background:#094b3d}.dec-sinruta{color:#7c8d84;font-size:12px}
.dec-filtros{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap}.dec-pestanas{display:flex;gap:5px;background:#f2f6f3;border-radius:11px;padding:5px}.dec-pestanas button{background:transparent!important;color:#49675b!important;border:0!important;border-radius:8px!important;padding:9px 13px!important;font-size:12px!important;font-weight:800;cursor:pointer}.dec-pestanas button.activo{background:#116b58!important;color:white!important}.dec-filtros input{width:min(100%,330px);border:1px solid #dce5de;border-radius:10px;padding:10px 13px;background:white;font-size:13px}
.dec-lista{border:1px solid #e4ebe5;border-radius:12px;overflow:hidden}.dec-fila+ .dec-fila{border-top:1px solid #e4ebe5}.dec-fila summary{display:flex;align-items:center;gap:15px;padding:14px 16px;cursor:pointer;list-style:none}.dec-fila summary::-webkit-details-marker{display:none}.dec-fila[open] summary{background:#f4faf6}.dec-fila-principal{flex:1;min-width:0;display:grid;gap:5px}.dec-fila-principal strong{font-size:13px;color:#173a32}.dec-fila-principal small{font-size:12px;color:#6b7d73;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dec-fila-impacto{font-weight:900;font-size:13px;min-width:85px;text-align:right}.dec-fila-ver{font-size:12px;color:#11735d;font-weight:800}.dec-detalle{padding:15px 18px 18px;background:#fbfdfa;border-top:1px solid #e3eee6;font-size:13px;line-height:1.55}.dec-detalle p{margin:0 0 9px}.dec-mas{display:block;margin:17px auto 0;border:1px solid #bdd9ca!important;background:#f3faf5!important;color:#126650!important;border-radius:10px;padding:12px 18px;font-weight:800;cursor:pointer}.dec-vacio{padding:25px;color:#75877b}.dec-nota{font-size:12px;color:#72877c;margin:16px 4px}
@media(max-width:900px){.dec-top{grid-template-columns:1fr}.dec-metricas{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:560px){.dec-metricas{grid-template-columns:1fr}.dec-seccion{padding:15px}.dec-fila summary{gap:8px;padding:12px 9px;flex-wrap:wrap}.dec-fila-impacto{min-width:0}.dec-fila-ver{margin-left:auto}.dec-filtros input{width:100%}.dec-readonly{font-size:11px}}
'''
current=css.read_text()
if marker in current:
    current=current[:current.index(marker)].rstrip()+'\n'
css.write_text(current+'\n'+style)
print('DECISIONES V3 INSTALADO')
print('Respaldo:',backup)
print('Archivos modificados: page.tsx, DecisionesPanel.tsx, globals.css')
print('Ejecuta: npm run build')
