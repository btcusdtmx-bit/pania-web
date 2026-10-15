#!/usr/bin/env python3
"""PANIA POS 2.5.13: unifica visualmente Ventas con Inventario sin tocar lógica ni datos."""
from pathlib import Path
from datetime import datetime
import shutil
import sys

root = Path.cwd()
pos = root / 'src/app/(app)/ventas/PosCaja.tsx'
css = root / 'src/app/globals.css'
if not pos.is_file() or not css.is_file():
    sys.exit('ERROR: ejecuta este archivo desde /workspaces/PANIA; no se modificó nada.')
p = pos.read_text(encoding='utf-8')
c = css.read_text(encoding='utf-8')
if 'pania-pos-2513' in p or 'PANIA POS INVENTARIO 2.5.13' in c:
    sys.exit('POS 2.5.13 ya está instalado. No se duplicaron cambios.')
old = '<div className="pos pania-pos-2510 pania-pos-2512">'
if p.count(old) != 1 or 'pania-pos-ticket-overlay' not in p or 'PANIA POS 2.5.12' not in c:
    sys.exit('ERROR: se requiere POS 2.5.12 con ticket separado. No se modificó nada.')
p = p.replace(old, '<div className="pos pania-pos-2510 pania-pos-2512 pania-pos-2513">', 1)
style = r'''
/* PANIA POS INVENTARIO 2.5.13 — alcance exclusivo de /ventas */
.pania-pos-2513 {
  --pania-green:#116957;--pania-ink:#183a32;--pania-line:#dbe5df;
  display:grid!important;grid-template-columns:minmax(0, 1.42fr) minmax(350px, 1fr)!important;
  gap:16px!important;align-items:start;width:100%;min-width:0;
}
.pania-pos-2513, .pania-pos-2513 * {box-sizing:border-box}
.pania-pos-2513 .pos-catalogo,.pania-pos-2513 .pos-carrito {min-width:0;max-width:100%}
.pania-pos-2513 .pos-catalogo {display:flex;flex-direction:column;gap:13px}
.pania-pos-2513 .pania-pos-section-head {margin:0;min-height:82px;align-items:center}
.pania-pos-2513 .pania-pos-section-head h2,.pania-pos-2513 .pania-pos-checkout-head h2 {
  font-family:Georgia,serif;font-size:clamp(1.45rem,2.1vw,1.85rem);font-weight:700;
  line-height:1.2;color:var(--pania-ink);margin:2px 0 6px
}
.pania-pos-2513 .pania-pos-eyebrow {font:800 11px/1.4 system-ui,sans-serif;letter-spacing:.1em;color:#13715d}
.pania-pos-2513 .pania-pos-section-head p,.pania-pos-2513 .pania-pos-checkout-head p {color:#5f7269;font-size:12px}
.pania-pos-2513 .pania-pos-catalog-count {background:#e9f5ef;border:1px solid #d1e9dd;color:#146c55;padding:7px 12px}
.pania-pos-2513 .pos-busqueda input {width:100%;min-height:54px;border-radius:12px;background:#fff;border:1px solid #d4dfd8;box-shadow:none;padding:13px 15px}
.pania-pos-2513 .chips {gap:7px}
.pania-pos-2513 .chip {border:1px solid #d6e1d9;border-radius:11px;background:#fff;color:#24483d;min-height:42px;padding:9px 13px;font-size:12px;transition:background .15s,border-color .15s}
.pania-pos-2513 .chip.activo {background:#116957;color:#fff;border-color:#116957}
.pania-pos-2513 .chip:focus-visible,.pania-pos-2513 button:focus-visible {outline:2px solid #0d8066;outline-offset:2px}
.pania-pos-2513 .pos-rejilla {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px}
.pania-pos-2513 .pos-prod {display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:8px;min-width:0;min-height:136px;padding:15px;border:1px solid #dce6df;border-radius:13px;background:#fff;box-shadow:0 5px 16px #133e2910;text-align:left}
.pania-pos-2513 .pos-prod:hover:not(:disabled) {border-color:#4b9b82;box-shadow:0 8px 20px #133e291a}
.pania-pos-2513 .pos-prod.en-carrito {background:#eff8f2;border-color:#188064}
.pania-pos-2513 .pos-nombre {font:750 13px/1.35 system-ui,sans-serif;color:#19382e;overflow-wrap:anywhere}
.pania-pos-2513 .pos-precio {font:800 19px/1.1 system-ui,sans-serif;color:#0f654f}
.pania-pos-2513 .pos-stock {font:500 11px/1.3 system-ui,sans-serif;color:#4e7466}
.pania-pos-2513 .pos-carrito {
  position:sticky;top:14px;display:flex;flex-direction:column;gap:13px;
  max-height:none!important;height:auto!important;overflow:visible!important;
  padding:20px;border:1px solid #dce6df;border-radius:16px;background:#fff;
  box-shadow:0 5px 22px #133e2910
}
.pania-pos-2513 .pania-pos-checkout-head {padding-bottom:13px;margin:0;border-bottom:1px solid #e5ede7}
.pania-pos-2513 .pania-pos-checkout-icon {background:#e5f4eb;color:#106852}
.pania-pos-2513 .pos-lineas {max-height:260px;overflow-y:auto;overflow-x:hidden;min-height:0}
.pania-pos-2513 .pos-lineas li {grid-template-columns:minmax(0,1fr) auto}
.pania-pos-2513 .pos-total {display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;background:#e8f5ec;border:1px solid #cce6d5;border-radius:14px;padding:16px;margin:0}
.pania-pos-2513 .pos-total strong {font:800 clamp(26px,2.5vw,36px)/1.1 system-ui,sans-serif;color:#115c47}
.pania-pos-2513 .pania-pos-payment {margin:0}
.pania-pos-2513 .pania-pos-payment .chips {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.pania-pos-2513 .pania-pos-payment .chip {min-width:0;width:100%;padding:10px 5px}
.pania-pos-2513 .pos-cambio {margin:0;padding:12px;border:1px solid #e0e9e2;border-radius:12px;background:#f6faf7}
.pania-pos-2513 .pos-acciones {display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:0}
.pania-pos-2513 .pos-cobrar {min-height:55px;border-radius:11px;background:#116957;color:#fff;font-weight:800;box-shadow:none}
.pania-pos-2513 .pos-extra {margin:0;padding-top:12px;border-top:1px solid #e5ede7}
.pania-pos-2513 select {min-height:44px;border-radius:10px}
@media(max-width:1150px) {
  .pania-pos-2513 {grid-template-columns:minmax(0,1fr)!important}
  .pania-pos-2513 .pos-carrito {position:static}
  .pania-pos-2513 .pos-rejilla {grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media(max-width:640px) {
  .pania-pos-2513 .pos-rejilla {grid-template-columns:repeat(2,minmax(0,1fr))}
  .pania-pos-2513 .pos-prod {min-height:125px;padding:12px}
  .pania-pos-2513 .pos-carrito {padding:15px}
  .pania-pos-2513 .pania-pos-payment .chips {grid-template-columns:repeat(2,minmax(0,1fr))}
  .pania-pos-2513 .pos-acciones {grid-template-columns:1fr}
}
'''
backup = root / 'respaldos' / ('pos_inventario_2_5_13_' + datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True, exist_ok=False)
shutil.copy2(pos, backup / 'PosCaja.tsx.bak')
shutil.copy2(css, backup / 'globals.css.bak')
try:
    pos.write_text(p, encoding='utf-8')
    css.write_text(c.rstrip() + '\n\n' + style, encoding='utf-8')
except Exception:
    shutil.copy2(backup / 'PosCaja.tsx.bak', pos)
    shutil.copy2(backup / 'globals.css.bak', css)
    raise
print('OK: PANIA POS 2.5.13 aplicado; diseño unificado con Inventario.')
print('Respaldo:', backup)
print('Validar: npx tsc --noEmit --incremental false && npm run build')
