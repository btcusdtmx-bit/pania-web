import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirSesion } from '@/lib/sesion';
import { crearCategoria, registrarGasto } from './actions';

const mx=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n||0);

export default async function Gastos(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador'].includes(perfil.rol))
  return <section className="panel"><h2>Sin acceso</h2></section>;

 const sb=await crearClienteServidor();
 const [{data:g},{data:c},{data:s}]=await Promise.all([
  sb.from('gastos').select('*,categorias_gasto(nombre),sucursales(nombre)').order('fecha',{ascending:false}).limit(100),
  sb.from('categorias_gasto').select('*').eq('activo',true).order('nombre'),
  sb.from('sucursales').select('id,nombre').eq('activa',true).order('nombre')
 ]);

 const gastos=g??[];
 const total=gastos.reduce((a:any,x:any)=>a+Number(x.monto),0);
 const puede=['dueno','administrador'].includes(perfil.rol);
 const operativos=gastos.filter((x:any)=>x.destino==='operativo').reduce((a:number,x:any)=>a+Number(x.monto),0);
 const marketing=gastos.filter((x:any)=>x.destino==='marketing').reduce((a:number,x:any)=>a+Number(x.monto),0);

 return <main className="gastos-v3">
  <header className="gastos-v3-header">
   <div>
    <span className="gastos-v3-eyebrow">💳 CONTROL FINANCIERO</span>
    <h1>Gastos de tu panadería</h1>
    <p>Registra tus gastos en pocos pasos y mantén el control de tu operación.</p>
   </div>
   <span className="gastos-v3-header-icon" aria-hidden="true">🧾</span>
  </header>

  <section className="gastos-v3-kpis">
   <article className="gastos-v3-kpi">
    <span className="gastos-v3-icon">💰</span>
    <small>Gastos registrados</small>
    <strong>{mx(total)}</strong>
    <span>Últimos {gastos.length} movimientos consultados</span>
   </article>
   <article className="gastos-v3-kpi">
    <span className="gastos-v3-icon">📋</span>
    <small>Movimientos</small>
    <strong>{gastos.length}</strong>
    <span>Registros disponibles</span>
   </article>
   <article className="gastos-v3-kpi">
    <span className="gastos-v3-icon">🏪</span>
    <small>Operación</small>
    <strong>{mx(operativos)}</strong>
    <span>Gastos operativos</span>
   </article>
   <article className="gastos-v3-kpi">
    <span className="gastos-v3-icon">📣</span>
    <small>Marketing</small>
    <strong>{mx(marketing)}</strong>
    <span>Promoción y publicidad</span>
   </article>
  </section>

  {puede&&<section className="gastos-v3-form-panel">
   <div className="gastos-v3-section-title">
    <div><h2>✍️ Registrar nuevo gasto</h2><p>Captura primero lo esencial. Los demás datos son opcionales.</p></div>
    <span>CAPTURA RÁPIDA</span>
   </div>

   <form action={registrarGasto} className="gastos-v3-form">
    <div className="gastos-v3-principales">
     <label className="gastos-v3-concepto">Concepto
      <input name="concepto" placeholder="Ej. Compra de artículos de limpieza" required/>
     </label>
     <label>Monto (MXN)
      <input name="monto" type="number" min="0.01" step="0.01" placeholder="0.00" required/>
     </label>
     <label>Categoría
      <select name="categoria_id">
       <option value="">Sin categoría</option>
       {(c??[]).map((x:any)=><option key={x.id} value={x.id}>{x.nombre}</option>)}
      </select>
     </label>
     <label>Forma de pago
      <select name="forma_pago">
       <option>Efectivo</option><option>Tarjeta</option><option>Transferencia</option><option>Crédito</option>
      </select>
     </label>
    </div>

    <details className="gastos-v3-detalles">
     <summary>⚙️ Más detalles del gasto <span>Fecha, sucursal, proveedor, clasificación y comprobante</span></summary>
     <div className="gastos-v3-adicionales">
      <label>Fecha<input name="fecha" type="date" required defaultValue={new Date().toISOString().slice(0,10)}/></label>
      <label>Sucursal<select name="sucursal_id"><option value="">General</option>{(s??[]).map((x:any)=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
      <label>Proveedor<input name="proveedor" placeholder="Opcional"/></label>
      <label>Tipo<select name="tipo"><option value="variable">Variable</option><option value="fijo">Fijo</option></select></label>
      <label>Destino<select name="destino"><option value="operativo">Operativo</option><option value="marketing">Marketing</option></select></label>
      <label>Referencia<input name="referencia" placeholder="Folio o referencia"/></label>
      <label>Comprobante URL<input name="comprobante_url" type="url" placeholder="https://..."/></label>
      <label>Notas<input name="notas" placeholder="Observaciones"/></label>
     </div>
    </details>

    <div className="gastos-v3-acciones">
     <p>El gasto se registrará con la información capturada.</p>
     <button type="submit">✓ Guardar gasto</button>
    </div>
   </form>

   <details className="gastos-v3-categorias">
    <summary>＋ Administrar categorías</summary>
    <form action={crearCategoria} className="form-inline">
     <input name="nombre" placeholder="Nueva categoría de gasto" required/>
     <button type="submit" className="secundario">Agregar categoría</button>
    </form>
   </details>
  </section>}

  <section className="gastos-v3-historial">
   <div className="gastos-v3-section-title">
    <div><h2>📑 Últimos gastos</h2><p>Consulta los últimos 100 movimientos registrados.</p></div>
    <span>{gastos.length} REGISTROS</span>
   </div>
   <div className="tabla-caja">
    <table>
     <thead><tr><th>Fecha</th><th>Concepto</th><th>Categoría</th><th>Sucursal</th><th>Tipo</th><th>Destino</th><th>Pago</th><th>Monto</th></tr></thead>
     <tbody>{gastos.map((x:any)=><tr key={x.id}>
      <td>{x.fecha}</td><td><strong>{x.concepto}</strong></td>
      <td>{x.categorias_gasto?.nombre??'—'}</td>
      <td>{x.sucursales?.nombre??'General'}</td>
      <td>{x.tipo}</td><td>{x.destino}</td>
      <td>{x.forma_pago??'—'}</td>
      <td><strong>{mx(Number(x.monto))}</strong></td>
     </tr>)}</tbody>
    </table>
   </div>
   {!gastos.length&&<p className="vacio">Aún no hay gastos registrados.</p>}
  </section>
 </main>;
}
