'use client';
import { useId } from 'react';

type LineaTicket={nombre:string;cantidad:number;precio:number;importe:number};
export type TicketData={folio:string;fecha:string;negocio:string;sucursal:string;cajero:string;formaPago:string;total:number;recibido?:number|null;cambio?:number|null;lineas:LineaTicket[]};
const mx=(n:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(n||0);

export default function TicketVenta({ticket,visible=false,onNueva}:{ticket:TicketData;visible?:boolean;onNueva?:()=>void}){
 const rid=useId().replace(/:/g,'');
 const id=`ticket-${ticket.folio.replace(/[^a-zA-Z0-9_-]/g,'-')}-${rid}`;
 const imprimir=()=>{
  const el=document.getElementById(id); if(!el)return;
  const w=window.open('','_blank','width=420,height=700'); if(!w)return;
  w.document.open();
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${ticket.folio}</title><style>@page{size:80mm auto;margin:0}html,body{margin:0;padding:0;background:#fff;color:#111}body{width:72mm;padding:4mm;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:1.3}.ticket-documento{width:72mm}.ticket-centro{text-align:center;display:grid;gap:2px}.ticket-logo{font-size:20px;letter-spacing:.12em}.ticket-separador{border-top:1px dashed #111;margin:8px 0}.ticket-meta{display:grid;grid-template-columns:1fr auto;gap:3px 8px}.ticket-meta b{text-align:right}.ticket-cab-linea,.ticket-linea,.ticket-total{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:start}.ticket-cab-linea{font-weight:800;margin-bottom:4px}.ticket-linea{margin:5px 0}.ticket-linea small{display:block;margin-left:18px}.ticket-total{font-size:15px}.ticket-gracias{text-align:center;margin:8px 0 0}</style></head><body>${el.outerHTML}</body></html>`);
  w.document.close(); w.focus(); setTimeout(()=>{w.print();w.close()},250);
 };
 return <div className={visible?'ticket-wrap':'ticket-reimpresion'}>
   <article id={id} className={`ticket-documento ${visible?'':'ticket-oculto-pantalla'}`}>
    <div className="ticket-centro"><strong className="ticket-logo">PANIA</strong><b>{ticket.negocio||'Mi panadería'}</b><span>{ticket.sucursal||'Sucursal'}</span></div>
    <div className="ticket-separador"/>
    <div className="ticket-meta"><span>Ticket</span><b>{ticket.folio}</b><span>Fecha</span><b>{new Intl.DateTimeFormat('es-MX',{dateStyle:'short',timeStyle:'short',timeZone:'America/Mexico_City'}).format(new Date(ticket.fecha))}</b><span>Cajero</span><b>{ticket.cajero||'—'}</b></div>
    <div className="ticket-separador"/>
    <div className="ticket-cab-linea"><span>Cant. Producto</span><span>Importe</span></div>
    {ticket.lineas.map((l,i)=><div className="ticket-linea" key={`${l.nombre}-${i}`}><span><b>{l.cantidad}</b> {l.nombre}<small>{mx(l.precio)} c/u</small></span><b>{mx(l.importe)}</b></div>)}
    <div className="ticket-separador"/>
    <div className="ticket-total"><span>TOTAL</span><strong>{mx(ticket.total)}</strong></div>
    <div className="ticket-meta"><span>Forma de pago</span><b>{ticket.formaPago||'—'}</b>{ticket.recibido!=null&&<><span>Recibido</span><b>{mx(ticket.recibido)}</b></>}{ticket.cambio!=null&&<><span>Cambio</span><b>{mx(ticket.cambio)}</b></>}</div>
    <div className="ticket-separador"/><p className="ticket-gracias">¡Gracias por su compra!</p>
   </article>
   <div className="ticket-acciones"><button type="button" onClick={imprimir}>{visible?'Imprimir ticket':'Reimprimir ticket'}</button>{visible&&onNueva&&<button type="button" className="secundario" onClick={onNueva}>Nueva venta</button>}</div>
  </div>
}
