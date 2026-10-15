'use client';
import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
import { cobrarVenta, type EstadoVenta } from './actions';
import TicketVenta from './TicketVenta';

export type Prod = { id: string; nombre: string; precio: number; unidad: string; categoria: string; stockPorSucursal: Record<string, number> };
type Op = { id: string; nombre: string; extra?: string };
type CobroPendiente = { clave: string; campos: Record<string, string> };
const CLAVE_PENDIENTE = 'pania.pos.cobro-pendiente.v1';

const mx = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
const PAGOS: [string, string][] = [['efectivo', 'Efectivo'], ['tarjeta', 'Tarjeta'], ['transferencia', 'Transferencia'], ['mixto', 'Mixto'], ['credito', 'Crédito']];
const CANALES = ['mostrador', 'whatsapp', 'facebook', 'instagram', 'pedido', 'delivery', 'mayoreo', 'otro'];
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();


const imagenProducto = (nombre: string): string => {
  const n = norm(nombre);
  if (n.includes('concha')) return '🥐';
  if (n.includes('croissant') || n.includes('cuernito')) return '🥐';
  if (n.includes('galleta')) return '🍪';
  if (n.includes('dona') || n.includes('donut')) return '🍩';
  if (n.includes('pastel') || n.includes('tarta')) return '🍰';
  if (n.includes('bolillo') || n.includes('baguette')) return '🥖';
  if (n.includes('pan')) return '🍞';
  if (n.includes('chocolate')) return '🍫';
  return '🧁';
};

export default function PosCaja({ productos, categorias, sucursales, sucursalInicial, clientes, campanas }: {
  productos: Prod[]; categorias: string[]; sucursales: Op[]; sucursalInicial: string; clientes: Op[]; campanas: Op[];
}) {
  const [estado, accion, pendiente] = useActionState<EstadoVenta, FormData>(cobrarVenta, { n: 0 });
  const [carrito, setCarrito] = useState<Record<string, number>>({});
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState('Todas');
  const [pago, setPago] = useState('efectivo');
  const [recibido, setRecibido] = useState('');
  const [sucursal, setSucursal] = useState(sucursalInicial);
  const [ultimo, setUltimo] = useState<EstadoVenta | null>(null);
  const buscador = useRef<HTMLInputElement>(null);
  const [verTicket, setVerTicket] = useState(false);
  // Se conserva la solicitud EXACTA antes de enviarla: un reintento nunca cambia el payload.
  const [claveCobro, setClaveCobro] = useState('');
  const claveRef = useRef('');
  const formRef = useRef<HTMLFormElement>(null);
  const [recuperada, setRecuperada] = useState(false);
  const [almacenamientoFallido, setAlmacenamientoFallido] = useState(false);
  const bloqueoEdicion = pendiente || recuperada || (!!ultimo?.error && !!claveRef.current);
  const borrarPendiente = () => {
    try { sessionStorage.removeItem(CLAVE_PENDIENTE); } catch { /* almacenamiento bloqueado */ }
    claveRef.current = ''; setClaveCobro(''); setRecuperada(false);
  };
  const permitirEditar = () => {
    if (!window.confirm('La venta anterior podría haberse registrado. Comprueba primero el ticket en Ventas. ¿Crear una operación nueva?')) return;
    borrarPendiente(); setUltimo(null);
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CLAVE_PENDIENTE);
      if (!raw) return;
      const pendienteGuardado = JSON.parse(raw) as CobroPendiente;
      if (!pendienteGuardado.clave || !pendienteGuardado.campos?.lineas || !pendienteGuardado.campos.sucursal_id) return;
      const datos = pendienteGuardado.campos;
      const items = JSON.parse(datos.lineas) as { producto_id: string; cantidad: number }[];
      if (!Array.isArray(items) || !items.length) return;
      claveRef.current = pendienteGuardado.clave;
      setClaveCobro(pendienteGuardado.clave);
      setCarrito(Object.fromEntries(items.map(x => [x.producto_id, x.cantidad])));
      setSucursal(datos.sucursal_id);
      setPago(datos.forma_pago || 'efectivo');
      setRecibido(datos.efectivo_recibido || '');
      setRecuperada(true);
      // Los controles no gestionados por React se restauran con sus valores originales.
      const form = formRef.current;
      if (form) for (const nombre of ['cliente_id','canal','campana_id','turno']) {
        const el = form.elements.namedItem(nombre) as HTMLInputElement | HTMLSelectElement | null;
        if (el) el.value = datos[nombre] || '';
      }
    } catch { setAlmacenamientoFallido(true); }
  }, []);

  const prepararCobro = (e: React.FormEvent<HTMLFormElement>) => {
    if (pendiente || almacenamientoFallido) { e.preventDefault(); return; }
    const form = e.currentTarget;
    try {
      const anterior = sessionStorage.getItem(CLAVE_PENDIENTE);
      if (anterior) {
        const guardado = JSON.parse(anterior) as CobroPendiente;
        if (!claveRef.current || guardado.clave !== claveRef.current) { e.preventDefault(); setRecuperada(true); return; }
        // La solicitud original, incluidos los campos opcionales, se reenvía intacta.
        for (const [nombre, valor] of Object.entries(guardado.campos)) {
          const el = form.elements.namedItem(nombre) as HTMLInputElement | HTMLSelectElement | null;
          if (el) el.value = valor;
        }
      } else {
        if (!claveRef.current) claveRef.current = crypto.randomUUID();
        const campo = form.elements.namedItem('solicitud_cobro_id') as HTMLInputElement | null;
        if (campo) campo.value = claveRef.current;
        const campos = Object.fromEntries(Array.from(new FormData(form).entries()).map(([k,v]) => [k,String(v)]));
        sessionStorage.setItem(CLAVE_PENDIENTE, JSON.stringify({ clave: claveRef.current, campos } satisfies CobroPendiente));
      }
      const campo = form.elements.namedItem('solicitud_cobro_id') as HTMLInputElement | null;
      if (campo) campo.value = claveRef.current;
      setClaveCobro(claveRef.current);
    } catch {
      e.preventDefault(); setAlmacenamientoFallido(true);
    }
  };

  useEffect(() => {
    if (!estado.n) return;
    setUltimo(estado);
    if (estado.ok) {
      borrarPendiente(); setVerTicket(true); setCarrito({}); setRecibido('');
      setBusca(''); buscador.current?.focus();
    }
  }, [estado]);

  const filtrados = useMemo(() => {
    const q = norm(busca.trim());
    return productos.filter(p => (cat === 'Todas' || p.categoria === cat) && (!q || norm(p.nombre).includes(q)));
  }, [productos, busca, cat]);

  const pmap = useMemo(() => new Map(productos.map(p => [p.id, p])), [productos]);
  const lineas = Object.entries(carrito).filter(([, c]) => c > 0).map(([id, cantidad]) => ({ producto_id: id, cantidad }));
  const piezas = lineas.reduce((a, l) => a + l.cantidad, 0);
  const total = lineas.reduce((a, l) => a + l.cantidad * (pmap.get(l.producto_id)?.precio ?? 0), 0);
  const cambio = Number(recibido) - total;
  const stockDe = (id: string) => Math.max(0, Number(pmap.get(id)?.stockPorSucursal?.[sucursal] ?? 0));
  const excedeStock = lineas.some(l => l.cantidad > stockDe(l.producto_id));

  const sumar = (id: string, d: number) => { if (bloqueoEdicion) return; setCarrito(c => {
    const disponible=stockDe(id);
    const nuevo = Math.min(disponible, Math.round(((c[id] ?? 0) + d) * 100) / 100);
    const { [id]: _, ...resto } = c;
    return nuevo > 0 ? { ...c, [id]: nuevo } : resto;
  }); };
  const fijar = (id: string, v: string) => { if (bloqueoEdicion) return; setCarrito(c => {
    const x = Math.min(stockDe(id), Math.round(Number(v.replace(',', '.')) * 100) / 100); const { [id]: _, ...resto } = c;
    return Number.isFinite(x) && x > 0 ? { ...c, [id]: x } : resto;
  }); };

  return (
    <div className="pos pania-pos-2515">
      <section className="pos-catalogo" aria-label="Catálogo de productos"><div className="pania-pos-section-head"><div><span className="pania-pos-eyebrow">PUNTO DE VENTA</span><h2>Elige tus productos</h2><p>Busca, selecciona y agrega a la venta.</p></div><span className="pania-pos-catalog-count">{filtrados.length} productos</span></div>
        <div className="pania-pos-tools"><div className="pania-pos-tools-title"><strong>Catálogo de productos</strong><span>Selecciona los artículos para preparar la venta</span></div>
        <div className="pos-busqueda">
          <input ref={buscador} type="search" autoFocus placeholder="Buscar producto… (Enter agrega el primero)" value={busca}
            onChange={e => setBusca(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && filtrados[0]) { e.preventDefault(); sumar(filtrados[0].id, 1); setBusca(''); } }} />
        </div>
        {categorias.length > 0 && (
          <div className="chips" role="tablist" aria-label="Categorías">
            {['Todas', ...categorias].map(c => (
              <button type="button" key={c} role="tab" aria-selected={cat === c} className={`chip ${cat === c ? 'activo' : ''}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        )}
        </div>
        <div className="pania-pos-products-title"><strong>Productos disponibles</strong><span>{filtrados.length} resultados</span></div>
        <div className="pos-rejilla">
          {filtrados.map(p => {
            const c = carrito[p.id] ?? 0; const stock=stockDe(p.id); const agotado=stock<=0;
            return (
              <button type="button" key={p.id} disabled={agotado || bloqueoEdicion} className={`pos-prod ${c > 0 ? 'en-carrito' : ''} ${agotado?'agotado':''}`} onClick={() => sumar(p.id, 1)}>
                <span className="pos-v3-ilustracion" aria-hidden="true">{imagenProducto(p.nombre)}</span>
                <span className="pos-v3-datos">
                  <span className="pos-nombre">{p.nombre}</span>
                  <span className="pos-precio">{mx(p.precio)}</span>
                  <span className={`pos-stock ${stock<=0?'sin-stock':stock<=5?'stock-bajo':''}`}>
                    {stock<=0?'🔴 Agotado':stock<=5?`🟠 Solo ${stock} disponibles`:`🟢 ${stock} ${p.unidad} disponibles`}
                  </span>
                </span>
                {c > 0 && <span className="pos-badge">{c}</span>}
              </button>
            );
          })}
          {!filtrados.length && <p className="vacio">Sin resultados para «{busca}».</p>}
        </div>
      </section>

      <form ref={formRef} className="pos-carrito panel" id="carrito" action={accion} onSubmit={prepararCobro}>
        <div className="pania-pos-checkout-head"><div><span className="pania-pos-eyebrow">COBRO RÁPIDO</span><h2>Venta actual</h2><p>{piezas > 0 ? `${piezas} piezas seleccionadas` : "Lista para tu siguiente cliente"}</p></div><span className="pania-pos-checkout-icon" aria-hidden="true">▤</span></div>
        {almacenamientoFallido && <div className="aviso error" role="alert">No se pudo guardar la solicitud pendiente en esta pestaña. Habilita el almacenamiento del navegador antes de cobrar.</div>}
        {recuperada && !ultimo?.ok && <div className="aviso" role="alert">Cobro pendiente recuperado. Comprueba si ya existe el ticket antes de reintentar. No inicies otra venta hasta resolverlo.<div className="pos-acciones"><button type="submit" className="secundario" disabled={pendiente || almacenamientoFallido}>Reintentar mismo cobro</button><button type="button" className="secundario" disabled={pendiente} onClick={permitirEditar}>Descartar y preparar nueva venta</button></div></div>}
        {ultimo?.error && <div className="aviso error" role="alert">{ultimo.error}<div className="pos-acciones"><button type="submit" className="secundario" disabled={pendiente}>Reintentar mismo cobro</button><button type="button" className="secundario" disabled={pendiente} onClick={permitirEditar}>Modificar venta (nueva operación)</button></div></div>}
        {ultimo?.ok && ultimo.folio && <div className="pania-pos-ticket-link"><span>Venta registrada correctamente</span><button type="button" onClick={()=>setVerTicket(true)}>Ver último ticket</button></div>}

        <div className="pania-pos-cart-body"><div className="pania-pos-cart-caption"><strong>Detalle del pedido</strong><span>{piezas} piezas</span></div>
        {!lineas.length ? <p className="vacio">Toca un producto para agregarlo.</p> : (
          <ul className="pos-lineas">
            {lineas.map(l => {
              const p = pmap.get(l.producto_id)!;
              return (
                <li key={l.producto_id}>
                  <div className="pos-lin-info"><strong>{p.nombre}</strong><small>{mx(p.precio)} c/u</small></div>
                  <div className="pos-qty">
                    <button type="button" aria-label={`Quitar uno de ${p.nombre}`} disabled={bloqueoEdicion} onClick={() => sumar(l.producto_id, -1)}>−</button>
                    <input key={l.cantidad} aria-label={`Cantidad de ${p.nombre}`} inputMode="decimal" defaultValue={l.cantidad} disabled={bloqueoEdicion}
                      onBlur={e => fijar(l.producto_id, e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
                    <button type="button" disabled={bloqueoEdicion || l.cantidad>=stockDe(l.producto_id)} aria-label={`Agregar uno de ${p.nombre}`} onClick={() => sumar(l.producto_id, 1)}>+</button>
                  </div>
                  <strong className="pos-imp">{mx(l.cantidad * p.precio)}</strong>
                </li>
              );
            })}
          </ul>
        )}

        </div>
        <div className="pania-pos-checkout-body"><div className="pos-total"><span>Total a cobrar <small>{piezas > 0 ? `${piezas} piezas` : "Sin productos"}</small></span><strong>{mx(total)}</strong></div>

        <div className="pania-pos-payment"><p className="pania-pos-field-title">Método de pago</p><div className="chips" role="radiogroup" aria-label="Forma de pago">
          {PAGOS.map(([v, e]) => (
            <button type="button" key={v} role="radio" aria-checked={pago === v} className={`chip ${pago === v ? 'activo' : ''}`} disabled={bloqueoEdicion} onClick={() => setPago(v)}>{e}</button>
          ))}
        </div></div>

        {pago === 'efectivo' && total > 0 && (
          <div className="pos-cambio">
            <label>Recibido<input inputMode="decimal" placeholder="0.00" value={recibido} disabled={bloqueoEdicion} onChange={e => setRecibido(e.target.value)} /></label>
            <div className="chips">
              {[total, 100, 200, 500].filter((v, i, a) => v > 0 && a.indexOf(v) === i).map(v => (
                <button type="button" key={v} className="chip" disabled={bloqueoEdicion} onClick={() => setRecibido(String(Math.ceil(v * 100) / 100))}>{v === total ? 'Exacto' : mx(v)}</button>
              ))}
            </div>
            {recibido !== '' && <p className={cambio >= 0 ? 'texto-ok' : 'texto-problema'}>{cambio >= 0 ? `Cambio: ${mx(cambio)}` : `Faltan ${mx(-cambio)}`}</p>}
          </div>
        )}

        {excedeStock&&<div className="aviso error">La venta contiene más piezas que el inventario disponible.</div>}
        <label>Sucursal
          <select name="sucursal_id" required style={bloqueoEdicion ? { pointerEvents: 'none' } : undefined} value={sucursal} onChange={e=>{setSucursal(e.target.value);setCarrito({});}}>
            <option value="">Selecciona</option>
            {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </label>

        <div className="pos-acciones">
          <button type="submit" className="pos-cobrar" disabled={!lineas.length || pendiente || excedeStock || recuperada || !!ultimo?.error || almacenamientoFallido}>{pendiente ? 'Registrando…' : `Cobrar ${mx(total)}`}</button>
          {lineas.length > 0 && <button type="button" className="secundario" disabled={bloqueoEdicion} onClick={() => { setCarrito({}); setRecibido(''); borrarPendiente(); }}>Vaciar</button>}
        </div>

        </div>
        <details className="pos-extra" style={bloqueoEdicion ? { pointerEvents: 'none', opacity: .7 } : undefined}>
          <summary>Cliente, canal y campaña (opcional)</summary>
          <div className="campos">
            <label>Cliente<select name="cliente_id" defaultValue=""><option value="">Público general</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}{c.extra ? ` · ${c.extra}` : ''}</option>)}</select></label>
            <label>Canal<select name="canal" defaultValue="mostrador">{CANALES.map(c => <option key={c} value={c}>{c}</option>)}</select></label>
            <label>Campaña<select name="campana_id" defaultValue=""><option value="">Sin campaña</option>{campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
            <label>Turno<input name="turno" placeholder="Mañana / Tarde" /></label>
          </div>
        </details>

        <input type="hidden" name="solicitud_cobro_id" value={claveCobro} readOnly />
        <input type="hidden" name="forma_pago" value={pago} />
        <input type="hidden" name="efectivo_recibido" value={pago === 'efectivo' ? recibido : ''} />
        <input type="hidden" name="lineas" value={JSON.stringify(lineas)} />


      </form>

      {verTicket && ultimo?.ok && ultimo.folio && (
        <div className="pania-pos-ticket-overlay" role="presentation">
          <div className="pania-pos-ticket-dialog" role="dialog" aria-modal="true" aria-label="Ticket de venta">
            <div className="pania-pos-ticket-toolbar"><strong>Venta registrada</strong><button type="button" onClick={()=>{setVerTicket(false);setUltimo(null);}}>Cerrar y seguir vendiendo ×</button></div>
<TicketVenta visible onNueva={()=>{setVerTicket(false);setUltimo(null);}} ticket={{folio:ultimo.folio,fecha:ultimo.fecha??new Date().toISOString(),negocio:ultimo.negocio??'Mi panadería',sucursal:ultimo.sucursal??'Sucursal',cajero:ultimo.cajero??'—',formaPago:ultimo.formaPago??pago,total:ultimo.total??0,recibido:ultimo.recibido,cambio:ultimo.cambio,lineas:ultimo.lineasTicket??[]}}/>
          </div>
        </div>
      )}

      {lineas.length > 0 && <a className="pos-barra" href="#carrito">Ver venta · {piezas} pza · <strong>{mx(total)}</strong></a>}
    </div>
  );
}
