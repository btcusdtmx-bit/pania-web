
#!/usr/bin/env python3
"""Consolida CSS del POS, sin alterar la logica de ventas."""
from pathlib import Path
from datetime import datetime
import shutil
import sys

root = Path('/workspaces/PANIA')
if not root.exists():
    root = Path.cwd()
css = root / 'src/app/globals.css'
component = root / 'src/app/(app)/ventas/PosCaja.tsx'
if not css.is_file() or not component.is_file():
    sys.exit('ERROR: Ejecuta desde la raiz del repositorio PANIA.')
original = css.read_text(encoding='utf-8')
source = component.read_text(encoding='utf-8')
start_marker = '/* PANIA POS 2.5.12'
end_marker = '/* PANIA POS INVENTARIO 2.5.13'
if start_marker not in original or end_marker not in original:
    sys.exit('ERROR: No se encontraron los bloques CSS esperados; no se modifico nada.')
if 'pania-pos-2513' not in source:
    sys.exit('ERROR: El componente no contiene la version 2.5.13; no se modifico nada.')
start = original.index(start_marker)
# This pair of blocks was appended at end in 2.5.13. Refuse if unknown later content exists.
old_tail = original[start:]
if old_tail.count('{') != old_tail.count('}'):
    sys.exit('ERROR: El bloque CSS final tiene llaves desbalanceadas; no se modifico nada.')
if '/* PANIA POS 2.5.14' in original:
    sys.exit('La version 2.5.14 ya esta instalada.')
backup = root / 'respaldos' / ('pos_2_5_14_' + datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True, exist_ok=False)
shutil.copy2(css, backup / 'globals.css')
shutil.copy2(component, backup / 'PosCaja.tsx')

new_css = r'''/* PANIA POS 2.5.14 — unico bloque de personalizacion; inspiracion Inventario */
.pania-pos-2514{--pos-green:#116957;--pos-ink:#173a30;--pos-border:#dce7df;display:grid!important;grid-template-columns:minmax(0,1.45fr) minmax(320px,1fr)!important;gap:16px!important;align-items:start;width:100%;min-width:0}
.pania-pos-2514,.pania-pos-2514 *{box-sizing:border-box}
.pania-pos-2514 .pos-catalogo,.pania-pos-2514 .pos-carrito{min-width:0;width:100%;max-width:100%;background:#fff;border:1px solid var(--pos-border);border-radius:17px;padding:20px;box-shadow:0 5px 22px #163b2d0b}
.pania-pos-2514 .pos-catalogo{display:flex;flex-direction:column;gap:16px}
.pania-pos-2514 .pania-pos-section-head,.pania-pos-2514 .pania-pos-checkout-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin:0;padding:0 0 16px;border-bottom:1px solid #e7eee9}
.pania-pos-2514 .pania-pos-eyebrow{display:block;font:800 11px/1.5 system-ui,sans-serif;letter-spacing:.11em;color:#14735d}
.pania-pos-2514 .pania-pos-section-head h2,.pania-pos-2514 .pania-pos-checkout-head h2{font:700 clamp(23px,2vw,29px)/1.15 Georgia,serif;color:var(--pos-ink);margin:3px 0 7px}
.pania-pos-2514 .pania-pos-section-head p,.pania-pos-2514 .pania-pos-checkout-head p{font-size:12px;color:#63786d;margin:0}
.pania-pos-2514 .pania-pos-catalog-count{white-space:nowrap;background:#eaf6ee;border:1px solid #d4e8dc;border-radius:999px;padding:7px 11px;font-size:12px;color:#176a55}
.pania-pos-2514 .pos-busqueda input{width:100%;min-height:49px;padding:12px 15px;border:1px solid #cbdcd1;border-radius:11px;background:#fbfdfb;box-shadow:none;color:var(--pos-ink);font-size:14px}
.pania-pos-2514 .chips{display:flex;flex-wrap:wrap;gap:7px}
.pania-pos-2514 .chip{min-height:38px;border:1px solid #d5e2d9;border-radius:9px;padding:8px 12px;background:#fff;color:#25483b;font:600 12px/1.2 system-ui,sans-serif}
.pania-pos-2514 .chip.activo{background:var(--pos-green);border-color:var(--pos-green);color:#fff}
.pania-pos-2514 .pos-rejilla{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pania-pos-2514 .pos-prod{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:9px;min-width:0;min-height:136px;padding:15px;background:#f9fcfa;border:1px solid #dbe8df;border-radius:12px;box-shadow:none;text-align:left}
.pania-pos-2514 .pos-prod:hover:not(:disabled){background:#f0f8f2;border-color:#77b39c;transform:translateY(-1px)}
.pania-pos-2514 .pos-prod.en-carrito{background:#e9f7ee;border-color:#168367;box-shadow:inset 0 0 0 1px #168367}
.pania-pos-2514 .pos-nombre{font:750 13px/1.35 system-ui,sans-serif;color:#203d31;overflow-wrap:anywhere}
.pania-pos-2514 .pos-precio{font:800 20px/1.15 system-ui,sans-serif;color:#12604d}
.pania-pos-2514 .pos-stock{font:500 11px/1.3 system-ui,sans-serif;color:#58796b}
.pania-pos-2514 .pos-carrito{position:sticky;top:14px;display:flex;flex-direction:column;gap:15px;max-height:none!important;height:auto!important;overflow:visible!important}
.pania-pos-2514 .pania-pos-checkout-icon{background:#e8f5ed;color:#116957;border-radius:10px}
.pania-pos-2514 .pos-lineas{max-height:260px;overflow-y:auto;overflow-x:hidden;margin:0}
.pania-pos-2514 .pos-lineas li{grid-template-columns:minmax(0,1fr) auto;gap:7px 10px}
.pania-pos-2514 .pos-lin-info{min-width:0;overflow-wrap:anywhere}
.pania-pos-2514 .pos-qty{grid-column:1;grid-row:2;justify-self:start}
.pania-pos-2514 .pos-imp{grid-column:2;grid-row:1 / span 2;min-width:0}
.pania-pos-2514 .pos-total{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin:0;padding:16px;background:#eaf6ef;border:1px solid #cce5d7;border-radius:13px}
.pania-pos-2514 .pos-total strong{font:800 clamp(25px,2.5vw,36px)/1.1 system-ui,sans-serif;color:#115c47}
.pania-pos-2514 .pania-pos-payment{margin:0}
.pania-pos-2514 .pania-pos-payment .chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}
.pania-pos-2514 .pania-pos-payment .chip{width:100%;min-width:0;padding:10px 4px}
.pania-pos-2514 .pos-cambio{margin:0;padding:12px;border:1px solid #dce8df;border-radius:12px;background:#f7fbf8}
.pania-pos-2514 .pos-acciones{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:0}
.pania-pos-2514 .pos-cobrar{min-height:55px;background:var(--pos-green);color:#fff;border-radius:11px;font-weight:800;box-shadow:none}
.pania-pos-2514 .pos-extra{margin:0;padding-top:12px;border-top:1px solid #e5ede7}
.pania-pos-2514 select{min-height:44px;border-radius:10px}
.pania-pos-2514 button:focus-visible{outline:2px solid #0c8065;outline-offset:2px}
/* Modal de ticket conservado de 2.5.12 */
.pania-pos-ticket-overlay{position:fixed;inset:0;z-index:1000;background:#0b251eb3;display:flex;justify-content:center;align-items:center;padding:16px}
.pania-pos-ticket-dialog{background:#fff;max-width:480px;width:100%;max-height:92vh;overflow:auto;border-radius:16px;padding:16px;box-shadow:0 20px 70px #0004;color:#18352c}
.pania-pos-ticket-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #e2ebe5;margin-bottom:12px}
.pania-pos-ticket-toolbar button{border:1px solid #d0dfd5;background:#f5f9f6;border-radius:9px;padding:9px;color:#174f43;cursor:pointer}
.pania-pos-2514 .pania-pos-ticket-link{padding:9px 12px;border-radius:10px;background:#eff8f3;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;color:#135b49;font-size:.82rem}
.pania-pos-2514 .pania-pos-ticket-link button{padding:7px 10px;border:1px solid #9cccb8;background:#fff;color:#115b4b;border-radius:8px;cursor:pointer}
@media(max-width:1150px){.pania-pos-2514{grid-template-columns:minmax(0,1fr)!important}.pania-pos-2514 .pos-carrito{position:static}}
@media(max-width:640px){.pania-pos-2514 .pos-catalogo,.pania-pos-2514 .pos-carrito{padding:14px}.pania-pos-2514 .pos-rejilla{grid-template-columns:repeat(2,minmax(0,1fr))}.pania-pos-2514 .pos-prod{padding:12px;min-height:125px}.pania-pos-2514 .pania-pos-payment .chips{grid-template-columns:repeat(2,minmax(0,1fr))}.pania-pos-2514 .pos-acciones{grid-template-columns:1fr}.pania-pos-2514 .pania-pos-catalog-count{display:none}}
'''
# Remove legacy 2.5.12/2.5.13 scoped styles and replace with one block.
updated_css = original[:start].rstrip() + '\n\n' + new_css
updated_source = source.replace('pos pania-pos-2510 pania-pos-2512 pania-pos-2513', 'pos pania-pos-2514', 1)
if updated_source == source:
    sys.exit('ERROR: No se pudo actualizar la clase del componente.')
try:
    css.write_text(updated_css, encoding='utf-8')
    component.write_text(updated_source, encoding='utf-8')
except Exception:
    shutil.copy2(backup / 'globals.css', css)
    shutil.copy2(backup / 'PosCaja.tsx', component)
    raise
print('OK: PANIA POS 2.5.14 instalado; CSS 2.5.12/2.5.13 consolidado.')
print('Respaldo:', backup)
print('Validar: npx tsc --noEmit --incremental false && npm run build')
