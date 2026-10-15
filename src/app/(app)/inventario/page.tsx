import {Aviso} from '@/components/Aviso';
import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import {registrarAjuste} from './actions';

type SI={sucursal_id:string;ingrediente_id:string;nombre:string;unidad:string;stock:number;stock_minimo:number;bajo_minimo:boolean};
type SP={sucursal_id:string;producto_id:string;nombre:string;stock:number};
type S={id:string;nombre:string}; type A={id:string;nombre:string;sucursal_id:string};
type I={id:string;nombre:string;unidad:string;stock_minimo:number;stock_maximo:number|null}; type P={id:string;nombre:string;unidad:string};
type M={id:string;ocurrido_en:string;tipo:string;ingrediente_id:string|null;producto_id:string|null;cantidad:number;costo_unitario:number|null;sucursal_id:string;almacen_id:string|null;turno:string|null;referencia_tabla:string|null};
const dinero=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n||0);
const n4=(n:number)=>Number(n||0).toLocaleString('es-MX',{maximumFractionDigits:4});
const tipos:Record<string,string>={compra:'Compra',consumo_produccion:'Consumo producción',entrada_produccion:'Entrada producción',venta:'Venta',merma:'Merma',ajuste:'Ajuste',transferencia_salida:'Transferencia salida',transferencia_entrada:'Transferencia entrada',devolucion:'Devolución'};
const icono=(nombre:string)=>{const n=nombre.toLowerCase();if(n.includes('harina'))return '🌾';if(n.includes('chocolate'))return '🍫';if(n.includes('crema'))return '🥛';if(n.includes('azúcar')||n.includes('azucar'))return '🥣';if(n.includes('levadura'))return '🧂';return '🥣'};

export default async function Inventario({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const {perfil}=await requerirSesion();
 if(['caja','marketing'].includes(perfil.rol)) return <section className="panel"><h2>Sin acceso</h2><p>Tu rol no tiene acceso al inventario operativo.</p></section>;
 const q=await searchParams,sb=await crearClienteServidor(),veCostos=['dueno','administrador','contador','compras'].includes(perfil.rol);
 const [{data:si},{data:sp},{data:suc},{data:alm},{data:ings},{data:prods},{data:costos},{data:movs}]=await Promise.all([
  sb.from('v_stock_ingredientes').select('*').returns<SI[]>(),sb.from('v_stock_productos').select('*').returns<SP[]>(),
  sb.from('sucursales').select('id,nombre').eq('activa',true).order('nombre').returns<S[]>(),sb.from('almacenes').select('id,nombre,sucursal_id').eq('activo',true).order('nombre').returns<A[]>(),
  sb.from('ingredientes').select('id,nombre,unidad,stock_minimo,stock_maximo').eq('activo',true).order('nombre').returns<I[]>(),sb.from('productos').select('id,nombre,unidad').eq('activo',true).order('nombre').returns<P[]>(),
  veCostos?sb.from('ingrediente_costos').select('ingrediente_id,costo_unitario,vigente_desde').order('vigente_desde',{ascending:false}).returns<{ingrediente_id:string;costo_unitario:number;vigente_desde:string}[]>():Promise.resolve({data:[]}),
  sb.from('movimientos_inventario').select(veCostos?'id,ocurrido_en,tipo,ingrediente_id,producto_id,cantidad,costo_unitario,sucursal_id,almacen_id,turno,referencia_tabla':'id,ocurrido_en,tipo,ingrediente_id,producto_id,cantidad,sucursal_id,almacen_id,turno,referencia_tabla').order('ocurrido_en',{ascending:false}).limit(100).returns<M[]>()
 ]);
 const filtro=q.sucursal||'',buscar=(q.buscar??'').trim().toLowerCase(),estado=q.estado??'',tab=q.tab==='producto'?'producto':'materia';
 const coincide=(nombre:string,stock:number,min=0)=> (!buscar||nombre.toLowerCase().includes(buscar))&&(!estado||(estado==='agotado'?stock<=0:estado==='bajo'?stock>0&&stock<=min:estado==='disponible'?stock>min:true));
 const stockI=(si??[]).filter(x=>(!filtro||x.sucursal_id===filtro)&&coincide(x.nombre,Number(x.stock),Number(x.stock_minimo)));
 const stockP=(sp??[]).filter(x=>(!filtro||x.sucursal_id===filtro)&&coincide(x.nombre,Number(x.stock),5));
 const mov=(movs??[]).filter(x=>!filtro||x.sucursal_id===filtro);
 const cmap=new Map<string,number>();for(const c of costos??[])if(!cmap.has(c.ingrediente_id))cmap.set(c.ingrediente_id,Number(c.costo_unitario));
 const imap=new Map((ings??[]).map(x=>[x.id,x])),pmap=new Map((prods??[]).map(x=>[x.id,x])),smap=new Map((suc??[]).map(x=>[x.id,x.nombre])),amap=new Map((alm??[]).map(x=>[x.id,x.nombre]));
 const criticos=stockI.filter(x=>Number(x.stock)<=Number(x.stock_minimo)),sinExistencia=stockI.filter(x=>Number(x.stock)<=0),ok=stockI.filter(x=>Number(x.stock)>Number(x.stock_minimo));
 const valor=stockI.reduce((a,x)=>a+Math.max(0,Number(x.stock))*Number(cmap.get(x.ingrediente_id)??0),0);
 const puede=['dueno','administrador','encargado'].includes(perfil.rol);
 const detalleId=q.detalle||criticos[0]?.ingrediente_id||stockI[0]?.ingrediente_id; const detalle=stockI.find(x=>x.ingrediente_id===detalleId); const cfgDetalle=detalle?imap.get(detalle.ingrediente_id):undefined;
 const hrefBase=(extra:Record<string,string>)=>{const p=new URLSearchParams();if(filtro)p.set('sucursal',filtro);if(q.buscar)p.set('buscar',q.buscar);if(estado)p.set('estado',estado);for(const[k,v]of Object.entries(extra))if(v)p.set(k,v);return `/inventario?${p.toString()}`};
 const ultMov=detalle?mov.find(m=>m.ingrediente_id===detalle.ingrediente_id):undefined;
 return <>
  <header className="cabecera inventario-cab"><div><h1>▣ Inventario</h1><p>Materias primas y productos terminados siempre bajo control.</p></div><div className="inventario-sucursal"><span>Sucursal</span><strong>{filtro?smap.get(filtro):perfil.sucursal_id?smap.get(perfil.sucursal_id):'Todas'}</strong></div></header>
  <Aviso error={q.error} ok={q.ok}/>
  <section className="inventario-kpis">
   <div className="inv-kpi inv-ok"><span className="inv-kpi-icon">🌿</span><div><b>Materias primas OK</b><strong>{ok.length}</strong><small>Con existencia suficiente</small></div></div>
   <div className="inv-kpi inv-danger"><span className="inv-kpi-icon">⚠</span><div><b>Necesitan compra</b><strong>{criticos.length}</strong><small>Por debajo del mínimo</small></div></div>
   <div className="inv-kpi inv-warn"><span className="inv-kpi-icon">□</span><div><b>Sin existencia</b><strong>{sinExistencia.length}</strong><small>Sin stock disponible</small></div></div>
   <div className="inv-kpi inv-value"><span className="inv-kpi-icon">◉</span><div><b>Valor inventario</b><strong>{dinero(valor)}</strong><small>Costo estimado de materias primas</small></div></div>
  </section>
  <section className="inventario-toolbar">
   <div className="inv-tabs"><a className={tab==='materia'?'activo':''} href={hrefBase({tab:'materia'})}>🌿 Materia prima</a><a className={tab==='producto'?'activo':''} href={hrefBase({tab:'producto'})}>🥖 Producto terminado</a></div>
   <form method="get" className="inv-filtros"><input type="hidden" name="tab" value={tab}/><label className="inv-buscar">⌕ <input name="buscar" defaultValue={q.buscar??''} placeholder={tab==='materia'?'Buscar ingrediente…':'Buscar producto…'}/></label><label>Sucursal<select name="sucursal" defaultValue={filtro}><option value="">Todas</option>{(suc??[]).map(x=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label><label>Estado<select name="estado" defaultValue={estado}><option value="">Todos</option><option value="disponible">Disponible</option><option value="bajo">Stock bajo</option><option value="agotado">Sin existencia</option></select></label><button>Filtrar</button></form>
  </section>
  {tab==='materia'?<div className="inventario-layout"><main>
   {criticos.length>0&&<section className="inv-card inv-comprar"><div className="inv-card-head"><div><h2>🛒 Necesitas comprar</h2><p>Ingredientes por debajo del mínimo o sin existencia.</p></div><a className="boton" href="/compras?sugeridos=1">🛒 Preparar compra sugerida ({criticos.length}) →</a></div><div className="inv-reponer-lista">{criticos.map(x=>{const cfg=imap.get(x.ingrediente_id),raw=Number(x.stock),disp=Math.max(0,raw),def=Math.max(0,-raw),max=Number(cfg?.stock_maximo??x.stock_minimo),sug=Math.max(0,max-raw);return <div className="inv-reponer" key={`${x.sucursal_id}-${x.ingrediente_id}`}><div className="inv-articulo"><span>{icono(x.nombre)}</span><strong>{x.nombre}</strong></div><div><small>Disponible</small><strong className={disp<=0?'rojo':''}>{n4(disp)} {x.unidad}</strong>{def>0&&<em>Déficit: {n4(def)} {x.unidad}</em>}</div><div><small>Mínimo deseado</small><strong>{n4(x.stock_minimo)} {x.unidad}</strong></div><div className="inv-sugerido"><small>Comprar sugerido</small><strong>{n4(sug)} {x.unidad}</strong></div><a className="boton secundario" href={`/compras?ingrediente=${x.ingrediente_id}&cantidad=${sug}`}>🛒 Agregar a compra</a></div>})}</div></section>}

<section className="inv-card">
  <div className="inv-card-head">
    <div>
      <h2>🌾 Inventario de ingredientes</h2>
      <p>Selecciona un ingrediente para consultar sus existencias.</p>
    </div>
  </div>
  <div className="inv-grid-v2">
    {stockI.map(x=>{
      const raw=Number(x.stock);
      const minimo=Number(x.stock_minimo);
      const cfg=imap.get(x.ingrediente_id);
      const maximo=Number(cfg?.stock_maximo??minimo);
      const disponible=Math.max(0,raw);
      const agotado=raw<=0;
      const bajo=raw<=minimo;
      const costo=Number(cmap.get(x.ingrediente_id)??0);
      return <article
        key={`${x.sucursal_id}-${x.ingrediente_id}`}
        className={`inv-tarjeta-v2 ${agotado?'agotado':bajo?'bajo':''}`}
      >
        <div className="inv-tarjeta-imagen-v2">{icono(x.nombre)}</div>
        <strong className="inv-tarjeta-nombre-v2">{x.nombre}</strong>
        <span className={`inv-status ${agotado?'sin':bajo?'bajo':'bien'}`}>
          {agotado?'● Agotado':bajo?'● Stock bajo':'● Disponible'}
        </span>
        <div className="inv-tarjeta-cantidad-v2">
          {n4(disponible)} <small>{x.unidad}</small>
        </div>
        <div className="inv-stock-bar">
          <i style={{
            width:`${Math.min(100,Math.max(0,disponible/Math.max(1,maximo)*100))}%`,
            background:agotado?'#df5252':bajo?'#eaa33c':'#16846b'
          }}/>
        </div>
        <div className="inv-tarjeta-meta-v2">
          <span>Mínimo: {n4(minimo)} {x.unidad}</span>
          <span>{smap.get(x.sucursal_id)??'Sucursal'}</span>
        </div>
        {veCostos&&<small>Valor: {dinero(disponible*costo)}</small>}
        <div className="inv-tarjeta-acciones-v2">
          <a href={hrefBase({tab:'materia',detalle:x.ingrediente_id})}>
            Ver detalle
          </a>
          {bajo&&<a href={`/compras?ingrediente=${x.ingrediente_id}&cantidad=${Math.max(0,maximo-raw)}`}>
            Comprar
          </a>}
        </div>
      </article>;
    })}
  </div>
  {!stockI.length&&<p className="vacio">No hay ingredientes con estos filtros.</p>}
</section>

  </main><aside className="inv-detalle">{detalle?<><div className="inv-detalle-icon">{icono(detalle.nombre)}</div><h2>{detalle.nombre}</h2><span className={`inv-status ${Number(detalle.stock)<=0?'sin':Number(detalle.stock)<=Number(detalle.stock_minimo)?'bajo':'bien'}`}>{Number(detalle.stock)<=0?'● Sin existencia':Number(detalle.stock)<=Number(detalle.stock_minimo)?'● Bajo stock':'● Bien'}</span><strong className="inv-detalle-stock">{n4(Math.max(0,Number(detalle.stock)))} {detalle.unidad}</strong><small>Disponible</small><div className="inv-stock-bar"><i style={{width:`${Math.max(3,Math.min(100,(Math.max(0,Number(detalle.stock))/Math.max(1,Number(cfgDetalle?.stock_maximo??detalle.stock_minimo)))*100))}%`}}/></div><div className="inv-minmax"><span>Mínimo<br/><b>{n4(detalle.stock_minimo)} {detalle.unidad}</b></span><span>Máximo<br/><b>{cfgDetalle?.stock_maximo??'—'} {detalle.unidad}</b></span></div>{Number(detalle.stock)<Number(detalle.stock_minimo)&&<div className="inv-detalle-compra"><small>Comprar sugerido</small><strong>{n4(Math.max(0,Number(cfgDetalle?.stock_maximo??detalle.stock_minimo)-Number(detalle.stock)))} {detalle.unidad}</strong><a className="boton secundario" href={`/compras?ingrediente=${detalle.ingrediente_id}`}>🛒 Agregar a compra</a></div>}<dl><div><dt>Costo por {detalle.unidad}</dt><dd>{dinero(Number(cmap.get(detalle.ingrediente_id)??0))}</dd></div><div><dt>Valor inventario</dt><dd>{dinero(Math.max(0,Number(detalle.stock))*Number(cmap.get(detalle.ingrediente_id)??0))}</dd></div><div><dt>Último movimiento</dt><dd>{ultMov?new Date(ultMov.ocurrido_en).toLocaleDateString('es-MX'):'—'}</dd></div></dl><a className="boton secundario inv-wide" href="#movimientos">☷ Historial de movimientos</a><a className="boton secundario inv-wide" href="/compras">🛒 Ver en compras →</a></>:<p>Selecciona un ingrediente.</p>}</aside></div>:

<section className="inv-card">
  <div className="inv-card-head">
    <div>
      <h2>🥐 Productos terminados</h2>
      <p>Existencias listas para vender.</p>
    </div>
  </div>
  <div className="inv-grid-v2">
    {stockP.map(x=>{
      const stock=Number(x.stock);
      const agotado=stock<=0;
      const bajo=stock<=5;
      const dibujo=/cuernito|croissant/i.test(x.nombre)?'🥐':
        /galleta/i.test(x.nombre)?'🍪':
        /pastel/i.test(x.nombre)?'🍰':
        /dona/i.test(x.nombre)?'🍩':'🥖';
      return <article
        key={`${x.sucursal_id}-${x.producto_id}`}
        className={`inv-tarjeta-v2 ${agotado?'agotado':bajo?'bajo':''}`}
      >
        <div className="inv-tarjeta-imagen-v2">{dibujo}</div>
        <strong className="inv-tarjeta-nombre-v2">{x.nombre}</strong>
        <span className={`inv-status ${agotado?'sin':bajo?'bajo':'bien'}`}>
          {agotado?'● Agotado':bajo?'● Stock bajo':'● Disponible'}
        </span>
        <div className="inv-tarjeta-cantidad-v2">
          {n4(Math.max(0,stock))}
          <small> {pmap.get(x.producto_id)?.unidad??'pza'}</small>
        </div>
        <div className="inv-tarjeta-meta-v2">
          {smap.get(x.sucursal_id)??'Sucursal'}
        </div>
        <div className="inv-tarjeta-acciones-v2">
          <a href="/produccion">Ver producción →</a>
        </div>
      </article>;
    })}
  </div>
  {!stockP.length&&<p className="vacio">No hay productos con estos filtros.</p>}
</section>
}
  {puede&&<details className="panel inv-operativo"><summary>Ajuste controlado de inventario</summary><div className="aviso">Solo para diferencias físicas comprobadas. PANIA registra un movimiento trazable; nunca sobrescribe el stock.</div><form className="campos" action={registrarAjuste}><div className="fila"><label>Sucursal<select name="sucursal_id" required defaultValue={perfil.sucursal_id??''}><option value="">Selecciona</option>{(suc??[]).map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label><label>Almacén<select name="almacen_id"><option value="">Sin almacén</option>{(alm??[]).map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}</select></label><label>Tipo<select name="clase"><option value="ingrediente">Ingrediente</option><option value="producto">Producto terminado</option></select></label><label>Artículo<select name="item_id" required><option value="">Selecciona</option><optgroup label="Ingredientes">{(ings??[]).map(i=><option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}</optgroup><optgroup label="Productos">{(prods??[]).map(p=><option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>)}</optgroup></select></label></div><div className="fila"><label>Cantidad con signo<input name="cantidad" type="number" step="0.0001" required placeholder="-2.5 o 3"/></label><label>Motivo / evidencia<input name="motivo" required maxLength={80}/></label></div><button>Registrar ajuste trazable</button></form></details>}
  <details id="movimientos" className="panel inv-operativo"><summary>Historial de movimientos</summary><div className="tabla-caja"><table><thead><tr><th>Fecha</th><th>Movimiento</th><th>Artículo</th><th>Sucursal / almacén</th><th>Cantidad</th><th>Costo</th><th>Referencia</th></tr></thead><tbody>{mov.map(m=>{const item=m.ingrediente_id?imap.get(m.ingrediente_id):pmap.get(m.producto_id??'');return <tr key={m.id}><td>{new Date(m.ocurrido_en).toLocaleString('es-MX')}</td><td>{tipos[m.tipo]??m.tipo}</td><td>{item?.nombre??'—'}</td><td>{smap.get(m.sucursal_id)??'—'}{m.almacen_id?` / ${amap.get(m.almacen_id)??'Almacén'}`:''}</td><td><strong>{Number(m.cantidad)>0?'+':''}{n4(m.cantidad)}</strong></td><td>{veCostos&&m.costo_unitario!=null?dinero(Number(m.costo_unitario)):'Restringido'}</td><td>{m.turno??m.referencia_tabla??'—'}</td></tr>})}</tbody></table></div></details>
 </>;
}
