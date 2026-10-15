import { Aviso } from '@/components/Aviso';
import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirSesion } from '@/lib/sesion';
import { esAdmin } from '@/lib/roles';
import { guardarProducto,cambiarEstadoProducto } from './actions';
import CatalogoProductos from './CatalogoProductos';
import './productos.css';

type P={id:string;sku:string;nombre:string;categoria_id:string|null;unidad:string;precio_publico:number;iva_tasa:number;costo_base_precio:number|null;vida_util_dias:number|null;activo:boolean};
type Categoria={id:string;nombre:string};
export default async function Productos({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const {perfil}=await requerirSesion(); const q=await searchParams; const sb=await crearClienteServidor();
 const [{data:productos,error:productosError},{data:cats,error:categoriasError}]=await Promise.all([
  sb.from('productos').select('id,sku,nombre,categoria_id,unidad,precio_publico,iva_tasa,costo_base_precio,vida_util_dias,activo').order('nombre').returns<P[]>(),
  sb.from('categorias').select('id,nombre').eq('tipo','producto').order('nombre').returns<Categoria[]>()
 ]);
 const admin=esAdmin(perfil.rol); const edit=q.editar?(productos??[]).find(x=>x.id===q.editar):undefined;
 const items=productos??[];const categories=cats??[];
 const activos=items.filter(p=>p.activo);const promedio=(vals:number[])=>vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
 const precioPromedio=promedio(activos.map(p=>Number(p.precio_publico)));
 const conCosto=activos.filter(p=>p.costo_base_precio!==null&&Number(p.precio_publico)>0);
 const costoPromedio=promedio(conCosto.map(p=>Number(p.costo_base_precio)));
 const margenPromedio=promedio(conCosto.map(p=>(Number(p.precio_publico)-Number(p.costo_base_precio))/Number(p.precio_publico)*100));
 return <main className="pv">
 <header className="pv-header"><div><span className="pv-eyebrow">PANIA · CATÁLOGO COMERCIAL</span><h1><span className="pv-heading-icon">▣</span> Productos</h1><p>Gestiona precios, IVA, vida útil y costos para mantener un margen saludable.</p></div><a href="#pv-formulario" className="pv-header-action">＋ {edit?'Editar producto':'Nuevo producto'}</a></header>
 <Aviso error={q.error} ok={q.ok}/>
 {productosError&&<div className="pv-error">No fue posible cargar los productos: {productosError.message}</div>}
 {categoriasError&&<div className="pv-error">No fue posible cargar las categorías: {categoriasError.message}</div>}
 <section className="pv-kpis" aria-label="Indicadores del catálogo">
  <article className="pv-kpi pv-green"><div className="pv-kpi-icon">▣</div><div><strong>{activos.length}</strong><span>Productos activos</span><small>{items.length} registrados en total</small></div></article>
  <article className="pv-kpi pv-blue"><div className="pv-kpi-icon">◇</div><div><strong>{precioPromedio===null?'—':peso(precioPromedio)}</strong><span>Precio promedio</span><small>Productos activos</small></div></article>
  <article className="pv-kpi pv-yellow"><div className="pv-kpi-icon">◉</div><div><strong>{costoPromedio===null?'—':peso(costoPromedio)}</strong><span>Costo base promedio</span><small>{conCosto.length} con costo registrado</small></div></article>
  <article className="pv-kpi pv-pink"><div className="pv-kpi-icon">↗</div><div><strong>{margenPromedio===null?'—':margenPromedio.toFixed(1)+'%'}</strong><span>Margen base promedio</span><small>{conCosto.length} productos evaluables</small></div></article>
 </section>
 <div className="pv-workspace">
 {admin&&<section className="pv-card pv-form-card" id="pv-formulario"><div className="pv-card-title"><span>▣</span><div><h2>{edit?'Editar producto':'Nuevo producto'}</h2><p>{edit?'Actualiza la información del producto':'Completa los datos de tu catálogo'}</p></div></div>
 <form action={guardarProducto} className="pv-form">{edit&&<input type="hidden" name="id" value={edit.id}/>}
 <div className="pv-form-section">Información básica</div>
 <label>SKU *<input name="sku" required placeholder="Ej. PAN-001" defaultValue={edit?.sku}/></label>
 <label>Nombre *<input name="nombre" required placeholder="Ej. Concha de vainilla" defaultValue={edit?.nombre}/></label>
 <label>Categoría<select name="categoria_id" defaultValue={edit?.categoria_id??''}><option value="">Sin categoría</option>{categories.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
 <label>Unidad<input name="unidad" defaultValue={edit?.unidad??'pza'} placeholder="pza"/></label>
 <div className="pv-form-section">Precios y costos</div>
 <label>Precio público *<input name="precio_publico" type="number" min="0" step="0.01" required defaultValue={edit?.precio_publico} placeholder="0.00"/></label>
 <label>IVA<select name="iva_tasa" defaultValue={String(edit?.iva_tasa??0)}><option value="0">0%</option><option value="0.16">16%</option></select></label>
 <label>Costo base<input name="costo_base_precio" type="number" min="0" step="0.0001" defaultValue={edit?.costo_base_precio??''} placeholder="0.00"/><small>Referencia para detectar erosión de margen.</small></label>
 <label>Vida útil (días)<input name="vida_util_dias" type="number" min="0" defaultValue={edit?.vida_util_dias??''} placeholder="Ej. 3"/></label>
 <button className="pv-submit" type="submit">▣ {edit?'Guardar cambios':'Crear producto'}</button>
 {edit&&<a className="pv-cancel" href="/productos">Cancelar edición</a>}
 </form></section>}
 <aside className="pv-side">
 <section className="pv-card"><div className="pv-card-title"><span>◆</span><div><h2>Categorías</h2><p>Productos registrados por categoría</p></div></div><div className="pv-categories">{categoryStats(items,categories).map((c,i)=><div className="pv-category" key={c.id}><div className={'pv-category-icon pv-category-icon-'+i%4}>{iconoCategoria(c.nombre)}</div><div><b>{c.nombre}</b><small>{c.total} {c.total===1?'producto':'productos'}</small></div><span className="pv-category-count">{c.total}</span></div>)}</div></section>
 <section className="pv-card"><div className="pv-card-title"><span>◉</span><div><h2>Distribución por categoría</h2><p>Participación en el catálogo</p></div></div><Distribucion categorias={categoryStats(items,categories)} total={items.length}/></section>
 </aside></div>
 <CatalogoProductos productos={items} categorias={categories} admin={admin} cambiarEstadoProducto={cambiarEstadoProducto}/>
 <p className="pv-note">El margen base es una referencia calculada como (precio público − costo base) / precio público. No representa utilidad neta ni descuenta IVA, gastos indirectos o mermas.</p>
 </main>;
}
function peso(v:number){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:2}).format(v)}
function iconoCategoria(n:string){const s=n.toLowerCase();return s.includes('pastel')?'🍰':s.includes('gallet')?'🍪':s.includes('boll')||s.includes('crois')?'🥐':s.includes('pan')?'🥖':'🥯'}
function categoryStats(items:P[],cats:Categoria[]){const map=new Map(cats.map(c=>[c.id,c.nombre]));const result=new Map<string,{id:string;nombre:string;total:number}>();for(const p of items){const id=p.categoria_id??'sin-categoria';const row=result.get(id)??{id,nombre:map.get(id)??'Sin categoría',total:0};row.total++;result.set(id,row)}return [...result.values()].sort((a,b)=>b.total-a.total||a.nombre.localeCompare(b.nombre));}
function Distribucion({categorias,total}:{categorias:{id:string;nombre:string;total:number}[];total:number}){const colors=['#f38b91','#65cfaa','#f7c969','#b7a0ef','#8bb5ec','#d2a17e'];let acc=0;const stops=categorias.map((c,i)=>{const a=acc;acc+=c.total/Math.max(1,total)*100;return `${colors[i%colors.length]} ${a}% ${acc}%`});return <div className="pv-distribution"><div className="pv-donut" style={{background:total?`conic-gradient(${stops.join(',')})`:'#e7ece9'}}><div><strong>{total}</strong><span>Productos</span></div></div><div className="pv-donut-legend">{categorias.map((c,i)=><div key={c.id}><i style={{background:colors[i%colors.length]}}/><span>{c.nombre}</span><b>{Math.round(c.total/Math.max(1,total)*100)}%</b></div>)}{!categorias.length&&<span>Sin productos todavía</span>}</div></div>}
