cd /workspaces/PANIA
python3 PANIA_POS_layout_2_5_11.py
npx tsc --noEmit --incremental false && npm run build#!/usr/bin/env python3
"""Corrige distribución POS 2.5.10 sin modificar lógica TSX ni datos."""
from pathlib import Path
from datetime import datetime
import shutil,sys
root=Path.cwd(); css=root/'src/app/globals.css'; pos=root/'src/app/(app)/ventas/PosCaja.tsx'
if not css.is_file() or not pos.is_file(): sys.exit('ERROR: ejecutar en raíz PANIA')
s=css.read_text(encoding='utf-8'); p=pos.read_text(encoding='utf-8')
marker='/* PANIA POS visual 2.5.10'
if marker not in s or 'pania-pos-2510' not in p: sys.exit('ERROR: primero debe estar instalado POS 2.5.10; no se modificó nada')
if 'PANIA POS layout 2.5.11' in s: sys.exit('POS layout 2.5.11 ya aplicado; sin cambios')
# Solo reescribir el bloque propio del parche previo. No alterar CSS global ni páginas ajenas.
a=s.index(marker); tail=s[a:]
if '/* PANIA ' in tail[len(marker):]: sys.exit('ERROR: hay estilos posteriores de PANIA; revisión manual necesaria')
style='''/* PANIA POS layout 2.5.11 — sustituye SOLO bloque visual 2.5.10 */
.pania-pos-2510{--pos-ink:#17352e;--pos-green:#126455;--pos-line:#dce7e1;--pos-muted:#63756e;display:grid;grid-template-columns:minmax(0,3fr) minmax(350px,2fr);gap:1.1rem;align-items:start;width:100%;max-width:100%;min-width:0;color:var(--pos-ink)}
.pania-pos-2510 *, .pania-pos-2510 *::before,.pania-pos-2510 *::after{box-sizing:border-box}
.pania-pos-2510 .pos-catalogo,.pania-pos-2510 .pos-carrito{min-width:0;max-width:100%}
.pania-pos-2510 .pos-catalogo{display:grid;gap:.75rem}
.pania-pos-2510 .pania-pos-section-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.35rem}
.pania-pos-2510 .pania-pos-eyebrow{font:800 .68rem/1.5 system-ui,sans-serif;letter-spacing:.1em;color:#176c5c}
.pania-pos-2510 .pania-pos-section-head h2,.pania-pos-2510 .pania-pos-checkout-head h2{font-family:Georgia,serif;color:#16332d;font-size:clamp(1.35rem,2vw,1.75rem);line-height:1.2;margin:.12rem 0 .3rem}
.pania-pos-2510 .pania-pos-section-head p,.pania-pos-2510 .pania-pos-checkout-head p{font:400 .82rem/1.5 system-ui,sans-serif;color:var(--pos-muted);margin:0}
.pania-pos-2510 .pania-pos-catalog-count{flex:none;font:600 .75rem system-ui,sans-serif;color:#386b5e;border:1px solid #d6e8df;background:#eef7f2;border-radius:99px;padding:.4rem .65rem}
.pania-pos-2510 .pos-busqueda input{width:100%;background:#fff;border:1px solid #cdded5;border-radius:12px;min-height:49px;padding:.75rem .9rem;font:400 .92rem system-ui,sans-serif;color:#17382f}
.pania-pos-2510 .pos-busqueda input:focus-visible{outline:2px solid #268976;outline-offset:2px}
.pania-pos-2510 .chips{display:flex;flex-wrap:wrap;gap:.4rem}
.pania-pos-2510 .chip{border-radius:10px;border:1px solid #d7e5dd;background:#fff;color:#21473e;font:600 .79rem system-ui,sans-serif;padding:.55rem .75rem;min-height:39px}
.pania-pos-2510 .chip.activo{background:#126455;color:#fff;border-color:#126455}
.pania-pos-2510 .pos-rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,155px),1fr));gap:.7rem}
.pania-pos-2510 .pos-prod{position:relative;min-width:0;min-height:122px;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:.45rem;border:1px solid #dce6e0;border-radius:13px;background:#fff;padding:.9rem;box-shadow:0 3px 12px #1a433008;text-align:left;transition:border-color .15s,transform .15s,box-shadow .15s}
.pania-pos-2510 .pos-prod:hover:not(:disabled){transform:translateY(-2px);border-color:#60ad97;box-shadow:0 8px 20px #1a433013}
.pania-pos-2510 .pos-prod.en-carrito{border-color:#15806b;background:#f1faf6;box-shadow:inset 0 0 0 1px #15806b}
.pania-pos-2510 .pos-prod.agotado{opacity:.65}
.pania-pos-2510 .pos-nombre{font:750 .88rem/1.35 system-ui,sans-serif;color:#19372f}
.pania-pos-2510 .pos-precio{font:800 1.15rem/1.2 system-ui,sans-serif;color:#0e594a}
.pania-pos-2510 .pos-stock{font:600 .72rem/1.4 system-ui,sans-serif}
.pania-pos-2510 .pos-carrito{position:sticky;top:1rem;display:flex;flex-direction:column;gap:.85rem;border:1px solid #dce7e1;border-radius:17px;padding:1.2rem;background:#fff;box-shadow:0 10px 30px #133e2910}
.pania-pos-2510 .pania-pos-checkout-head{display:flex;justify-content:space-between;gap:.7rem;align-items:center;padding-bottom:.85rem;border-bottom:1px solid #e7eee9}
.pania-pos-2510 .pania-pos-checkout-icon{display:grid;place-items:center;flex:none;width:42px;height:42px;border-radius:12px;background:#e5f5ee;color:#106b58;font-size:1.4rem}
.pania-pos-2510 .pos-lineas{margin:0;max-height:32vh;overflow-y:auto;overflow-x:hidden}
.pania-pos-2510 .pos-lineas li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.4rem .65rem;align-items:center;padding:.65rem 0;border-bottom:1px solid #e8eee9}
.pania-pos-2510 .pos-lin-info{min-width:0}
.pania-pos-2510 .pos-lin-info strong{font:700 .84rem system-ui,sans-serif;color:#1c3830;overflow-wrap:anywhere}
.pania-pos-2510 .pos-qty{grid-column:1;grid-row:2;justify-self:start}
.pania-pos-2510 .pos-imp{grid-column:2;grid-row:1 / span 2;text-align:right;min-width:0;font:800 .95rem system-ui,sans-serif}
.pania-pos-2510 .pos-qty button{background:#eff7f2;border:1px solid #d5e7dc;border-radius:8px;color:#145d4d;min-width:35px;min-height:35px;width:35px;padding:0}
.pania-pos-2510 .pos-qty input{border:1px solid #d7e5de;border-radius:7px;text-align:center;width:48px;min-height:35px}
.pania-pos-2510 .pos-total{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.6rem;margin:.2rem 0;padding:1rem;border-radius:13px;background:#eaf6ef;border:1px solid #d0e9dc}
.pania-pos-2510 .pos-total>span{display:grid;gap:.25rem;font:750 .85rem system-ui,sans-serif;color:#215d4d}
.pania-pos-2510 .pos-total>span small{font:500 .72rem system-ui,sans-serif;color:#5c796c}
.pania-pos-2510 .pos-total strong{font:800 clamp(1.6rem,2.6vw,2.2rem)/1.2 system-ui,sans-serif;color:#0d5848;white-space:nowrap}
.pania-pos-2510 .pania-pos-payment{margin:.15rem 0}
.pania-pos-2510 .pania-pos-field-title{font:800 .82rem system-ui,sans-serif;color:#27483f;margin:0 0 .55rem}
.pania-pos-2510 .pania-pos-payment .chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem}
.pania-pos-2510 .pania-pos-payment .chip{min-width:0;justify-content:center;padding:.6rem .3rem}
.pania-pos-2510 .pos-cambio{border:1px solid #e3ece6;background:#f7faf8;border-radius:12px;padding:.85rem}
.pania-pos-2510 .pos-acciones{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:.55rem}
.pania-pos-2510 .pos-cobrar{width:100%;min-height:55px;border-radius:12px;background:#126455;color:#fff;font:800 1rem system-ui,sans-serif;box-shadow:0 5px 12px #12645522}
.pania-pos-2510 .pos-cobrar:disabled{opacity:.55;box-shadow:none}
.pania-pos-2510 .pos-extra{border-top:1px solid #e6ede8;padding-top:.75rem}
.pania-pos-2510 label{font:600 .82rem system-ui,sans-serif;color:#37554b}
.pania-pos-2510 select,.pania-pos-2510 input{max-width:100%}
.pania-pos-2510 select{border-radius:10px;border-color:#d7e5dd;background:#fff}
@media(max-width:1150px){.pania-pos-2510{grid-template-columns:minmax(0,1fr)}.pania-pos-2510 .pos-carrito{position:static}.pania-pos-2510 .pos-rejilla{grid-template-columns:repeat(auto-fill,minmax(min(100%,145px),1fr))}}
@media(max-width:600px){.pania-pos-2510 .pania-pos-catalog-count{display:none}.pania-pos-2510 .pos-carrito{padding:.85rem}.pania-pos-2510 .pos-total strong{font-size:1.7rem}.pania-pos-2510 .pos-acciones{grid-template-columns:1fr}.pania-pos-2510 .pos-prod{min-height:108px;padding:.75rem}.pania-pos-2510 .pania-pos-payment .chips{grid-template-columns:repeat(2,minmax(0,1fr))}}
'''
backup=root/'respaldos'/('pos_layout_2_5_11_'+datetime.now().strftime('%Y%m%d_%H%M%S'));backup.mkdir(parents=True,exist_ok=False)
shutil.copy2(css,backup/'globals.css.bak')
css.write_text(s[:a].rstrip()+'\n\n'+style,encoding='utf-8')
print('OK: POS 2.5.11 layout aplicado. Solo globals.css modificado. Respaldo:',backup)
print('Validar: npx tsc --noEmit --incremental false && npm run build')
