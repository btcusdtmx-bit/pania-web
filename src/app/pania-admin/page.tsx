import Link from 'next/link';
import { requerirAdminPania } from '@/lib/pania-admin';
import { guardarContrato,registrarPago } from './actions';

type E={id:string;nombre:string;rfc:string|null}; type P={id:string;nombre:string;precio_mensual:number;precio_anual:number|null};
type S={empresa_id:string;plan_id:string;estado:string;modalidad:string;precio_contratado:number|null;prueba_hasta:string|null;periodo_fin:string|null;soporte_hasta:string|null};
type Pago={empresa_id:string;monto:number;estado:string;pagado_en:string|null;creado_en:string};
const fecha=(x:string|null)=>x?new Date(x).toLocaleDateString('es-MX'):'—';
export default async function PaniaAdmin({searchParams}:{searchParams:Promise<{ok?:string;error?:string}>}){
 const {admin}=await requerirAdminPania(); const q=await searchParams;
 const [{data:empresas},{data:planes},{data:sus},{data:pagos}]=await Promise.all([
  admin.from('empresas').select('id,nombre,rfc').order('nombre').returns<E[]>(),
  admin.from('planes_pania').select('id,nombre,precio_mensual,precio_anual').eq('activo',true).order('precio_mensual').returns<P[]>(),
  admin.from('suscripciones_pania').select('empresa_id,plan_id,estado,modalidad,precio_contratado,prueba_hasta,periodo_fin,soporte_hasta').returns<S[]>(),
  admin.from('pagos_pania').select('empresa_id,monto,estado,pagado_en,creado_en').eq('estado','pagado').order('creado_en',{ascending:false}).returns<Pago[]>()
 ]);
 const sm=new Map((sus??[]).map(x=>[x.empresa_id,x])); const pm=new Map((planes??[]).map(x=>[x.id,x]));
 const activos=(sus??[]).filter(x=>x.estado==='activa'||x.estado==='prueba');
 const mrr=activos.filter(x=>x.estado==='activa'&&x.modalidad==='mensual').reduce((a,x)=>a+Number(x.precio_contratado??pm.get(x.plan_id)?.precio_mensual??0),0);
 const cobrado=(pagos??[]).reduce((a,x)=>a+Number(x.monto),0);
 const vencen=(sus??[]).filter(x=>x.periodo_fin&&new Date(x.periodo_fin)>=new Date()&&new Date(x.periodo_fin).getTime()-Date.now()<=7*86400000).length;
 return <main className="contenido" style={{maxWidth:1400,margin:'0 auto'}}>
  <header className="cabecera"><div><h1>Superadministrador PANIA</h1><p>Clientes, licencias, suscripciones y cobros de PANIA. Esta caja es independiente de las ventas de cada panadería.</p></div><Link className="secundario" href="/">Ir a mi panadería</Link></header>
  {q.ok&&<div className="aviso exito">{q.ok}</div>}{q.error&&<div className="aviso error">{q.error}</div>}
  <section className="kpis"><article className="kpi"><span>Clientes</span><strong>{empresas?.length??0}</strong><small>empresas registradas</small></article><article className="kpi"><span>Activos / prueba</span><strong>{activos.length}</strong><small>con acceso comercial</small></article><article className="kpi"><span>MRR estimado</span><strong>${mrr.toLocaleString('es-MX')}</strong><small>mensualidades activas</small></article><article className="kpi"><span>Cobrado histórico</span><strong>${cobrado.toLocaleString('es-MX')}</strong><small>pagos PANIA registrados</small></article></section>
  <section className="panel"><h2>Clientes PANIA</h2><p className="muted">{vencen} contrato(s) vencen en los próximos 7 días.</p><div className="tabla-caja"><table><thead><tr><th>Empresa</th><th>Plan</th><th>Modalidad</th><th>Estado</th><th>Vigencia</th><th>Precio</th></tr></thead><tbody>{(empresas??[]).map(e=>{const s=sm.get(e.id),p=s?pm.get(s.plan_id):null;return <tr key={e.id}><td><strong>{e.nombre}</strong><br/><small>{e.rfc??'Sin RFC'}</small></td><td>{p?.nombre??'Sin plan'}</td><td>{s?.modalidad??'—'}</td><td>{s?.estado??'sin contrato'}</td><td>{s?.modalidad==='contado'?'Licencia':fecha(s?.periodo_fin??s?.prueba_hasta??null)}</td><td>{s?.precio_contratado?`$${Number(s.precio_contratado).toLocaleString('es-MX')}`:'—'}</td></tr>})}</tbody></table></div></section>
  <div className="dashboard-grid"><section className="panel"><h2>Activar o actualizar contrato</h2><form action={guardarContrato} className="formulario"><label>Empresa<select name="empresa_id" required><option value="">Selecciona…</option>{(empresas??[]).map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label><label>Plan<select name="plan_id" required>{(planes??[]).map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label><label>Modalidad<select name="modalidad"><option value="mensual">Mensual</option><option value="anual">Anual</option><option value="contado">Contado</option></select></label><label>Estado<select name="estado"><option value="prueba">Prueba</option><option value="activa">Activa</option><option value="pausada">Pausada</option><option value="vencida">Vencida</option><option value="cancelada">Cancelada</option></select></label><label>Precio contratado<input name="precio_contratado" type="number" min="0" step="0.01"/></label><label>Fin de periodo<input name="periodo_fin" type="datetime-local"/></label><label>Prueba hasta<input name="prueba_hasta" type="datetime-local"/></label><label>Soporte hasta (contado)<input name="soporte_hasta" type="datetime-local"/></label><button type="submit">Guardar contrato</button></form></section>
  <section className="panel"><h2>Registrar pago PANIA</h2><form action={registrarPago} className="formulario"><label>Empresa<select name="empresa_id" required><option value="">Selecciona…</option>{(empresas??[]).map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label><label>Monto<input name="monto" type="number" min="0.01" step="0.01" required/></label><label>Concepto<input name="concepto" placeholder="Mensualidad, licencia de contado…"/></label><label>Referencia<input name="referencia_externa" placeholder="Transferencia / folio"/></label><button type="submit">Registrar pago</button></form><p className="muted">En 2.4 los pagos son manuales. La pasarela y webhooks se conectarán después de validar el flujo comercial.</p></section></div>
 </main>
}
