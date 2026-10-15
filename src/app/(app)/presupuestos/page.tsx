import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import {guardarPresupuesto} from './actions';

const mx=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n||0);
const num=(n:unknown)=>Number(n)||0;

export default async function Presupuestos(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador'].includes(perfil.rol))
  return <section className="panel"><h2>Sin acceso</h2></section>;

 const sb=await crearClienteServidor();
 const [{data:p},{data:e},{data:c},{data:s}]=await Promise.all([
  sb.from('v_presupuesto_vs_real').select('*,categorias_gasto(nombre),sucursales(nombre)').order('periodo',{ascending:false}).limit(100),
  sb.from('v_punto_equilibrio_mes').select('*,sucursales(nombre)').order('periodo',{ascending:false}).limit(24),
  sb.from('categorias_gasto').select('id,nombre').eq('activo',true).order('nombre'),
  sb.from('sucursales').select('id,nombre').eq('activa',true)
 ]);

 const presupuestos=p??[];
 const equilibrio=e??[];
 const top=equilibrio[0];
 const puede=['dueno','administrador'].includes(perfil.rol);
 const mesActual=new Date().toISOString().slice(0,7);
 const partidasActuales=presupuestos.filter((x:any)=>String(x.periodo??'').slice(0,7)===mesActual);
 const presupuestoMes=partidasActuales.reduce((a:number,x:any)=>a+num(x.presupuesto),0);
 const gastadoMes=partidasActuales.reduce((a:number,x:any)=>a+num(x.real),0);
 const consumo=presupuestoMes>0?gastadoMes/presupuestoMes*100:0;

 return <main className="pres-v3">
  <header className="pres-v3-header">
   <div>
    <span className="pres-v3-eyebrow">📊 PLANIFICACIÓN FINANCIERA</span>
    <h1>Presupuesto y punto de equilibrio</h1>
    <p>Planea tus gastos, controla el presupuesto y conoce cuánto necesitas vender.</p>
   </div>
   <span className="pres-v3-header-icon" aria-hidden="true">🎯</span>
  </header>

  {top&&<section className="pres-v3-kpis">
   <article className="pres-v3-kpi"><span className="pres-v3-icon">🏢</span><small>Gastos fijos · mes</small><strong>{mx(num(top.gastos_fijos))}</strong><span>Costos fijos de operación</span></article>
   <article className="pres-v3-kpi"><span className="pres-v3-icon">📈</span><small>Margen de contribución</small><strong>{(num(top.margen_contribucion_pct)*100).toFixed(1)}%</strong><span>Margen observado</span></article>
   <article className="pres-v3-kpi"><span className="pres-v3-icon">🎯</span><small>Ventas para equilibrio</small><strong>{mx(num(top.ventas_equilibrio))}</strong><span>Meta para cubrir costos</span></article>
   <article className="pres-v3-kpi"><span className="pres-v3-icon">🛡️</span><small>Margen de seguridad</small><strong>{mx(num(top.margen_seguridad))}</strong><span>Distancia respecto al equilibrio</span></article>
  </section>}

  <section className="pres-v3-control">
   <div className="pres-v3-title"><div><h2>💰 Control del presupuesto</h2><p>Consumo de partidas del mes actual, según los registros consultados.</p></div><span>{mesActual}</span></div>
   <div className="pres-v3-resumen">
    <div><small>Presupuestado</small><strong>{mx(presupuestoMes)}</strong></div>
    <div><small>Gastado</small><strong>{mx(gastadoMes)}</strong></div>
    <div><small>Disponible</small><strong>{mx(presupuestoMes-gastadoMes)}</strong></div>
   </div>
   <div className="pres-v3-progress-info"><span>Presupuesto consumido</span><strong>{presupuestoMes>0?consumo.toFixed(1)+'%':'Sin presupuesto'}</strong></div>
   <div className="pres-v3-track"><div className="pres-v3-fill" style={{width:`${Math.min(100,Math.max(0,consumo))}%`,background:consumo>=100?'#d94b47':consumo>=80?'#e7a436':'#15936c'}}/></div>
   <p className="pres-v3-note">El resumen utiliza las partidas del mes actual incluidas en los últimos 100 registros. Los presupuestos generales y por categoría pueden superponerse; no deben sumarse como un total consolidado si representan el mismo gasto.</p>
  </section>

  {puede&&<section className="pres-v3-form-panel">
   <div className="pres-v3-title"><div><h2>✍️ Nuevo presupuesto mensual</h2><p>Asigna un límite de gasto por mes, categoría y sucursal.</p></div><span>CAPTURA RÁPIDA</span></div>
   <form action={guardarPresupuesto} className="pres-v3-form">
    <label>Mes<input name="periodo" type="month" required defaultValue={mesActual}/></label>
    <label>Categoría<select name="categoria_id"><option value="">Total general</option>{(c??[]).map((x:any)=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
    <label>Monto presupuestado<input name="monto" type="number" min="0" step=".01" placeholder="0.00" required/></label>
    <label>Sucursal<select name="sucursal_id"><option value="">General</option>{(s??[]).map((x:any)=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select></label>
    <label className="pres-v3-notas">Notas<input name="notas" placeholder="Ej. Presupuesto de mantenimiento"/></label>
    <div className="pres-v3-save"><button type="submit">✓ Guardar presupuesto</button></div>
   </form>
  </section>}

  <section className="pres-v3-lista">
   <div className="pres-v3-title"><div><h2>📋 Presupuesto vs. gasto real</h2><p>Revisa el consumo de cada partida y su disponibilidad.</p></div><span>{presupuestos.length} PARTIDAS</span></div>
   <div className="pres-v3-partidas">
    {presupuestos.map((x:any)=>{
     const limite=num(x.presupuesto);
     const real=num(x.real);
     const pct=limite>0?real/limite*100:0;
     const estado=limite<=0?(real>0?'Sin límite':'Sin asignar'):pct>=100?'Excedido':pct>=80?'Por agotarse':'En control';
     return <article key={x.id} className="pres-v3-partida">
      <div className="pres-v3-partida-top">
       <div><strong>📁 {x.categorias_gasto?.nombre??'General'}</strong><small>{String(x.periodo??'').slice(0,7)} · {x.sucursales?.nombre??'General'}</small></div>
       <span className={'pres-v3-estado '+(estado==='Excedido'?'rojo':estado==='Por agotarse'?'amarillo':'verde')}>{estado}</span>
      </div>
      <div className="pres-v3-partida-cifras">
       <span>Presupuesto <strong>{mx(limite)}</strong></span>
       <span>Gastado <strong>{mx(real)}</strong></span>
       <span>Disponible <strong>{mx(num(x.disponible))}</strong></span>
      </div>
      <div className="pres-v3-track"><div className="pres-v3-fill" style={{width:`${Math.min(100,Math.max(0,pct))}%`,background:pct>=100?'#d94b47':pct>=80?'#e7a436':'#15936c'}}/></div>
      <small>{limite>0?pct.toFixed(1)+'% utilizado':'Sin porcentaje de consumo disponible'}</small>
     </article>;
    })}
   </div>
   {!presupuestos.length&&<p className="vacio">Aún no hay presupuestos registrados.</p>}
  </section>

  <section className="pres-v3-historial">
   <details>
    <summary>📈 Historial de punto de equilibrio <span>Ver análisis mensual</span></summary>
    <div className="tabla-caja">
     <table><thead><tr><th>Mes</th><th>Sucursal</th><th>Ventas</th><th>Gastos fijos</th><th>Margen %</th><th>Equilibrio</th><th>Seguridad</th></tr></thead>
      <tbody>{equilibrio.map((x:any,i:number)=><tr key={i}>
       <td>{x.periodo?.slice(0,7)}</td><td>{x.sucursales?.nombre??'General'}</td>
       <td>{mx(num(x.ventas_netas))}</td><td>{mx(num(x.gastos_fijos))}</td>
       <td>{(num(x.margen_contribucion_pct)*100).toFixed(1)}%</td>
       <td>{mx(num(x.ventas_equilibrio))}</td><td>{mx(num(x.margen_seguridad))}</td>
      </tr>)}</tbody>
     </table>
    </div>
    <p className="vacio">El punto de equilibrio usa gastos clasificados como fijos y el margen de contribución observado en ventas.</p>
   </details>
  </section>
 </main>;
}
