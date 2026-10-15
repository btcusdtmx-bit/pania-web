import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirSesion } from '@/lib/sesion';
import PosCaja from './PosCaja';
import TicketVenta from './TicketVenta';

type Fila = { id: string; sucursal_id: string; vendedor_id: string; fecha_hora: string; turno: string | null; canal: string; forma_pago: string | null; estado: string; folio_ticket:string|null; efectivo_recibido:number|null; cambio:number|null };
type Det = { id: string; venta_id: string; producto_id: string; cantidad: number; precio_unitario_neto: number; iva_tasa: number };

const dinero = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
const zona = 'America/Mexico_City';
const dia = (d: string | Date) => new Date(d).toLocaleDateString('en-CA', { timeZone: zona });

export default async function Ventas({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
  const { perfil, empresa } = await requerirSesion();
  const q = await searchParams;
  if (!['dueno', 'administrador', 'contador', 'encargado', 'caja', 'consulta'].includes(perfil.rol))
    return <section className="panel"><h2>Sin acceso</h2><p>Tu rol no tiene acceso a ventas.</p></section>;
  const puede = ['dueno', 'administrador', 'encargado', 'caja'].includes(perfil.rol);
  const sb = await crearClienteServidor();

  const [{ data: suc }, { data: prods }, { data: cats }, { data: ventas }, { data: clientes }, { data: campanas }, { data: stockProductos }] = await Promise.all([
    sb.from('sucursales').select('id,nombre').eq('activa', true).order('nombre'),
    sb.from('productos').select('id,nombre,precio_publico,unidad,categoria_id').eq('activo', true).order('nombre'),
    sb.from('categorias').select('id,nombre').eq('tipo', 'producto').order('nombre'),
    sb.from('ventas').select('id,sucursal_id,vendedor_id,fecha_hora,turno,canal,forma_pago,estado,folio_ticket,efectivo_recibido,cambio').order('fecha_hora', { ascending: false }).limit(100).returns<Fila[]>(),
    puede ? sb.from('clientes').select('id,nombre,telefono').eq('activo', true).order('nombre') : Promise.resolve({ data: [] }),
    puede ? sb.from('campanas_marketing').select('id,nombre').eq('estado', 'activa').order('nombre') : Promise.resolve({ data: [] }),
    puede ? sb.from('v_stock_productos').select('sucursal_id,producto_id,stock') : Promise.resolve({ data: [] }),
  ]);

  const ids = (ventas ?? []).map(v => v.id);
  const vendedorIds=[...new Set((ventas??[]).map(v=>v.vendedor_id).filter(Boolean))];
  const {data:vendedores}=vendedorIds.length?await sb.from('perfiles').select('id,nombre').in('id',vendedorIds):{data:[]};
  const vendedoresMap=new Map((vendedores??[]).map((x:any)=>[x.id as string,x.nombre as string]));
  const { data: det } = ids.length
    ? await sb.from('venta_detalle').select('id,venta_id,producto_id,cantidad,precio_unitario_neto,iva_tasa').in('venta_id', ids).returns<Det[]>()
    : { data: [] as Det[] };

  const pmap = new Map((prods ?? []).map(p => [p.id as string, p]));
  const cmap = new Map((cats ?? []).map(c => [c.id as string, c.nombre as string]));
  const smap = new Map((suc ?? []).map(s => [s.id as string, s.nombre as string]));
  const porVenta = new Map<string, Det[]>();
  (det ?? []).forEach(d => porVenta.set(d.venta_id, [...(porVenta.get(d.venta_id) ?? []), d]));
  const totalDe = (id: string) => (porVenta.get(id) ?? []).reduce((a, d) => a + Number(d.cantidad) * Number(d.precio_unitario_neto) * (1 + Number(d.iva_tasa)), 0);
  const historialAbierto=q.historial==='1';
  const filtroTexto=(q.buscar??'').trim().toLowerCase();
  const filtroPago=q.pago??''; const filtroSucursal=q.sucursal??''; const filtroPeriodo=q.periodo??'hoy';
  const ahora=Date.now(); const diasFiltro=filtroPeriodo==='7d'?7:filtroPeriodo==='30d'?30:1;
  const ventasFiltradas=(ventas??[]).filter(v=>{ const edad=(ahora-new Date(v.fecha_hora).getTime())/86400000; const coincidePeriodo=filtroPeriodo==='todo'||edad<=diasFiltro; const coincidePago=!filtroPago||v.forma_pago===filtroPago; const coincideSucursal=!filtroSucursal||v.sucursal_id===filtroSucursal; const texto=`${v.folio_ticket??''} ${totalDe(v.id).toFixed(2)}`.toLowerCase(); return coincidePeriodo&&coincidePago&&coincideSucursal&&(!filtroTexto||texto.includes(filtroTexto)); });
  const ventasVisibles=historialAbierto?ventasFiltradas:ventasFiltradas.slice(0,5);

  const hoy = dia(new Date());
  const deHoy = (ventas ?? []).filter(v => v.estado !== 'cancelada' && dia(v.fecha_hora) === hoy);
  const totalHoy = deHoy.reduce((a, v) => a + totalDe(v.id), 0);
  const ticket = deHoy.length ? totalHoy / deHoy.length : 0;
  const categoriasUsadas = [...new Set((prods ?? []).map(p => cmap.get(p.categoria_id as string)).filter(Boolean) as string[])];

  return (
    <>
      <header className="cabecera">
        <h1>Ventas / POS</h1>
        <p>Toca los productos, elige el pago y cobra. Cada venta descuenta inventario al instante.</p>
      </header>

      <section className="panel resumen-dia">
        <div className="dato"><span className="valor">{dinero(totalHoy)}</span><span className="etiqueta">Vendido hoy</span></div>
        <div className="dato"><span className="valor">{deHoy.length}</span><span className="etiqueta">Ventas hoy</span></div>
        <div className="dato"><span className="valor">{dinero(ticket)}</span><span className="etiqueta">Ticket promedio</span></div>
      </section>

      {puede && (
        <PosCaja
          productos={(prods ?? []).map(p => ({ id: p.id, nombre: p.nombre, precio: Number(p.precio_publico), unidad: p.unidad, categoria: cmap.get(p.categoria_id as string) ?? 'Sin categoría', stockPorSucursal: Object.fromEntries((stockProductos ?? []).filter((x:any)=>x.producto_id===p.id).map((x:any)=>[x.sucursal_id,Number(x.stock)])) }))}
          categorias={categoriasUsadas}
          sucursales={(suc ?? []).map(s => ({ id: s.id, nombre: s.nombre }))}
          sucursalInicial={perfil.sucursal_id ?? ((suc ?? []).length === 1 ? suc![0].id : '')}
          clientes={(clientes ?? []).map((c: any) => ({ id: c.id, nombre: c.nombre, extra: c.telefono ?? undefined }))}
          campanas={(campanas ?? []).map((c: any) => ({ id: c.id, nombre: c.nombre }))}
        />
      )}

      <section className="panel">
        <div className="panel-titulo"><div><h2>Ventas recientes</h2><p className="vacio">Últimas operaciones de caja. Abre una venta para ver productos y reimprimir.</p></div>{!historialAbierto&&<a className="boton chico" href="/ventas?historial=1&periodo=7d">Ver historial</a>}</div>
        {historialAbierto&&<form className="filtros-historial" method="get"><input type="hidden" name="historial" value="1"/><input name="buscar" defaultValue={q.buscar??''} placeholder="Folio o importe"/><select name="periodo" defaultValue={filtroPeriodo}><option value="hoy">Hoy</option><option value="7d">7 días</option><option value="30d">30 días</option><option value="todo">Todo</option></select><select name="sucursal" defaultValue={filtroSucursal}><option value="">Todas las sucursales</option>{(suc??[]).map((x:any)=><option key={x.id} value={x.id}>{x.nombre}</option>)}</select><select name="pago" defaultValue={filtroPago}><option value="">Todos los pagos</option><option value="efectivo">Efectivo</option><option value="tarjeta">Tarjeta</option><option value="transferencia">Transferencia</option><option value="mixto">Mixto</option><option value="credito">Crédito</option></select><button className="chico">Filtrar</button><a className="boton chico secundario" href="/ventas">Cerrar historial</a></form>}
        <div className="lista-ventas compacta">
          {ventasVisibles.map(v => (
            <details key={v.id} className="venta-item">
              <summary><span>{new Date(v.fecha_hora).toLocaleString('es-MX',{timeZone:zona,dateStyle:'short',timeStyle:'short'})}</span><span>{smap.get(v.sucursal_id)??'—'} · {v.forma_pago??'—'} · {v.folio_ticket??'Sin folio'}</span><strong>{dinero(totalDe(v.id))}</strong></summary>
              <ul>{(porVenta.get(v.id)??[]).map(d=><li key={d.id}><span>{Number(d.cantidad)} × {pmap.get(d.producto_id)?.nombre??'Producto'}</span><span>{dinero(Number(d.cantidad)*Number(d.precio_unitario_neto)*(1+Number(d.iva_tasa)))}</span></li>)}</ul>
              {v.folio_ticket&&<TicketVenta ticket={{folio:v.folio_ticket,fecha:v.fecha_hora,negocio:empresa?.nombre??'Mi panadería',sucursal:smap.get(v.sucursal_id)??'Sucursal',cajero:vendedoresMap.get(v.vendedor_id)??'—',formaPago:v.forma_pago??'—',total:totalDe(v.id),recibido:v.efectivo_recibido==null?null:Number(v.efectivo_recibido),cambio:v.cambio==null?null:Number(v.cambio),lineas:(porVenta.get(v.id)??[]).map(d=>{const precio=Number(d.precio_unitario_neto)*(1+Number(d.iva_tasa));return{nombre:pmap.get(d.producto_id)?.nombre??'Producto',cantidad:Number(d.cantidad),precio,importe:Number(d.cantidad)*precio}})}}/>}
            </details>
          ))}
          {!ventasVisibles.length&&<p className="vacio">No hay ventas con esos filtros.</p>}
        </div>
      </section>
    </>
  );
}
