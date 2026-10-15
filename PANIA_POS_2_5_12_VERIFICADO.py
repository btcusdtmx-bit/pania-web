#!/usr/bin/env python3
"""PANIA POS 2.5.12: separa ticket y reorganiza caja. Ejecutar desde raiz del proyecto."""
from pathlib import Path
from datetime import datetime
import shutil, sys
root=Path.cwd()
p=root/'src/app/(app)/ventas/PosCaja.tsx'
css=root/'src/app/globals.css'
if not p.is_file() or not css.is_file(): sys.exit('ERROR: ejecuta desde la raiz de PANIA')
s=p.read_text(); c=css.read_text()
if 'pania-pos-2512' in s: sys.exit('POS 2.5.12 ya instalado; no se duplicaron cambios.')
needle='<div className="pos pania-pos-2510">'
if s.count(needle)!=1: sys.exit('ERROR: estructura POS inesperada; no se modifico nada.')
start='        {ultimo?.ok && !lineas.length && ultimo.folio && <TicketVenta visible onNueva={()=>setUltimo(null)} ticket={{'
end='lineas:ultimo.lineasTicket??[]}}/>}'
if s.count(start)!=1 or s.count(end)!=1: sys.exit('ERROR: bloque de ticket distinto; no se modifico nada.')
i=s.index(start); j=s.index(end,i)+len(end)
ticket=s[i:j]
newticket=ticket.replace('ultimo?.ok && !lineas.length && ultimo.folio','ultimo?.ok && ultimo.folio')
# Ticket is rendered in a separate panel below the POS, never inside checkout form.
s=s[:i]+'''        {ultimo?.ok && ultimo.folio && <div className="pania-pos-ticket-link"><span>Venta registrada correctamente</span><button type="button" onClick={()=>setVerTicket(true)}>Ver último ticket</button></div>}'''+s[j:]
s=s.replace(needle,'<div className="pos pania-pos-2510 pania-pos-2512">',1)
s=s.replace('  const buscador = useRef<HTMLInputElement>(null);','  const buscador = useRef<HTMLInputElement>(null);\n  const [verTicket, setVerTicket] = useState(false);',1)
s=s.replace("if (estado.ok) { setCarrito({});", "if (estado.ok) { setVerTicket(true); setCarrito({});",1)
marker='      {lineas.length > 0 && <a className="pos-barra"'
if s.count(marker)!=1: sys.exit('ERROR: ancla final inesperada')
modal='''      {verTicket && ultimo?.ok && ultimo.folio && (
        <div className="pania-pos-ticket-overlay" role="presentation">
          <div className="pania-pos-ticket-dialog" role="dialog" aria-modal="true" aria-label="Ticket de venta">
            <div className="pania-pos-ticket-toolbar"><strong>Venta registrada</strong><button type="button" onClick={()=>{setVerTicket(false);setUltimo(null);}}>Cerrar y seguir vendiendo ×</button></div>
'''+newticket.replace('{ultimo?.ok && ultimo.folio && <TicketVenta','<TicketVenta').strip().removesuffix('}')+'''
          </div>
        </div>
      )}
'''
# TicketVenta's onNueva closes both overlay and record.
modal=modal.replace('onNueva={()=>setUltimo(null)}','onNueva={()=>{setVerTicket(false);setUltimo(null);}}')
s=s.replace(marker,modal+'\n'+marker,1)
# Put the checkout primary action above optional fields, while keeping it inside the form.
a=s.index('        <div className="pos-acciones">'); b=s.index('        </div>',a)+len('        </div>')
buttons=s[a:b]
s=s[:a]+s[b:]
anchor='        <details className="pos-extra">'
if s.count(anchor)!=1: sys.exit('ERROR: formulario inesperado')
# Important: hidden inputs remain in form regardless of order.
s=s.replace(anchor,buttons+'\n\n'+anchor,1)
block='''
/* PANIA POS 2.5.12 — estilos acotados; no alteran Inventario ni Inicio */
.pania-pos-2512{display:grid!important;grid-template-columns:minmax(0,1.4fr) minmax(350px,1fr)!important;gap:18px!important;align-items:start;max-width:100%;}
.pania-pos-2512>*{min-width:0;box-sizing:border-box}
.pania-pos-2512 .pos-carrito{position:sticky;top:16px;min-width:0;max-height:calc(100vh - 32px);overflow-y:auto;overscroll-behavior:contain;padding:20px;border-radius:16px;background:#fff;border:1px solid #dce7e2;box-shadow:0 10px 28px #163b2d0c}
.pania-pos-2512 .pos-lineas{max-height:210px;overflow:auto}
.pania-pos-2512 .pos-lineas li{grid-template-columns:minmax(0,1fr) auto;gap:7px 10px}
.pania-pos-2512 .pos-lin-info{min-width:0;overflow-wrap:anywhere}
.pania-pos-2512 .pos-qty{grid-column:1;grid-row:2;justify-self:start}
.pania-pos-2512 .pos-imp{grid-column:2;grid-row:1 / span 2;align-self:center;min-width:0}
.pania-pos-2512 .pos-total{background:#e8f5ee;border:1px solid #cde5d8;border-radius:14px;margin:12px 0;padding:16px;gap:10px;flex-wrap:wrap}
.pania-pos-2512 .pos-total strong{font-family:system-ui,sans-serif;font-size:clamp(1.6rem,2.7vw,2.5rem);font-weight:800;color:#115a49}
.pania-pos-2512 .pania-pos-payment .chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.pania-pos-2512 .pania-pos-payment .chip{min-width:0;width:100%;padding:10px 5px}
.pania-pos-2512 .pos-acciones{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:12px 0}
.pania-pos-2512 .pos-cobrar{min-height:58px;background:#126455;color:#fff;font-weight:800;border-radius:12px}
.pania-pos-2512 .pos-extra{margin-top:10px}
.pania-pos-2512 .pania-pos-ticket-link{padding:9px 12px;border-radius:10px;background:#eff8f3;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;color:#135b49;font-size:.82rem}
.pania-pos-2512 .pania-pos-ticket-link button{padding:7px 10px;border:1px solid #9cccb8;background:#fff;color:#115b4b;border-radius:8px;cursor:pointer}
.pania-pos-ticket-overlay{position:fixed;inset:0;z-index:1000;background:#0b251eb3;display:flex;justify-content:center;align-items:center;padding:16px}
.pania-pos-ticket-dialog{background:#fff;max-width:480px;width:100%;max-height:92vh;overflow:auto;border-radius:16px;padding:16px;box-shadow:0 20px 70px #0004;color:#18352c}
.pania-pos-ticket-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #e2ebe5;margin-bottom:12px}
.pania-pos-ticket-toolbar button{border:1px solid #d0dfd5;background:#f5f9f6;border-radius:9px;padding:9px;color:#174f43;cursor:pointer}
@media(max-width:1100px){.pania-pos-2512{grid-template-columns:minmax(0,1fr)!important}.pania-pos-2512 .pos-carrito{position:static;max-height:none;overflow:visible}}
@media(max-width:600px){.pania-pos-2512 .pania-pos-payment .chips{grid-template-columns:repeat(2,minmax(0,1fr))}.pania-pos-2512 .pos-acciones{grid-template-columns:1fr}.pania-pos-2512 .pos-lineas li{grid-template-columns:minmax(0,1fr) auto}}
'''
backup=root/'respaldos'/('pos_2_5_12_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=True)
shutil.copy2(p,backup/'PosCaja.tsx.bak');shutil.copy2(css,backup/'globals.css.bak')
p.write_text(s);css.write_text(c+'\n'+block)
print('OK: POS 2.5.12 aplicado. Ticket separado del cobro; respaldo:',backup)
print('Ejecuta: npx tsc --noEmit --incremental false && npm run build')
