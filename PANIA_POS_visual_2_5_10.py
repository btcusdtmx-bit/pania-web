#!/usr/bin/env python3
"""PANIA POS 2.5.10: solo presentación; respaldo y guardas estrictas."""
from pathlib import Path
from datetime import datetime
import shutil, sys
root=Path.cwd(); pos=root/'src/app/(app)/ventas/PosCaja.tsx'; css=root/'src/app/globals.css'
if not pos.is_file() or not css.is_file(): sys.exit('ERROR: ejecutar en la raíz de PANIA.')
s=pos.read_text(encoding='utf-8'); c=css.read_text(encoding='utf-8')
if 'pania-pos-2510' in s or 'PANIA POS visual 2.5.10' in c: sys.exit('POS 2.5.10 ya instalado; sin cambios.')
changes=[
 ('<div className="pos">','<div className="pos pania-pos-2510">'),
 ('<section className="pos-catalogo">','<section className="pos-catalogo" aria-label="Catálogo de productos"><div className="pania-pos-section-head"><div><span className="pania-pos-eyebrow">PUNTO DE VENTA</span><h2>Elige tus productos</h2><p>Busca, selecciona y agrega a la venta.</p></div><span className="pania-pos-catalog-count">{filtrados.length} productos</span></div>'),
 ('<h2>Venta actual</h2>','<div className="pania-pos-checkout-head"><div><span className="pania-pos-eyebrow">COBRO RÁPIDO</span><h2>Venta actual</h2><p>{piezas > 0 ? `${piezas} piezas seleccionadas` : "Lista para tu siguiente cliente"}</p></div><span className="pania-pos-checkout-icon" aria-hidden="true">▤</span></div>'),
 ('<div className="pos-total"><span>{piezas > 0 ? `${piezas} pza` : \'Total\'}</span><strong>{mx(total)}</strong></div>', '<div className="pos-total"><span>Total a cobrar <small>{piezas > 0 ? `${piezas} piezas` : "Sin productos"}</small></span><strong>{mx(total)}</strong></div>'),
 ('<div className="chips" role="radiogroup" aria-label="Forma de pago">','<div className="pania-pos-payment"><p className="pania-pos-field-title">Método de pago</p><div className="chips" role="radiogroup" aria-label="Forma de pago">'),
 ("        </div>\n\n        {pago === 'efectivo' && total > 0 && (", "        </div></div>\n\n        {pago === 'efectivo' && total > 0 && ("),
 ('<button type="submit" className="pos-cobrar"', '<button type="submit" className="pos-cobrar"'),
]
for old,new in changes:
 if s.count(old)!=1: sys.exit('ERROR: estructura POS distinta en '+repr(old[:70])+'. Sin cambios.')
 s=s.replace(old,new,1)
style=r'''

/* PANIA POS visual 2.5.10 — estilos aislados; no altera operaciones */
.pania-pos-2510{--pos-ink:#18342f;--pos-green:#126455;--pos-line:#dce7e1;--pos-muted:#63756e;align-items:start;gap:1rem;color:var(--pos-ink)}
.pania-pos-2510 .pos-catalogo{min-width:0}
.pania-pos-2510 .pania-pos-section-head{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem}
.pania-pos-2510 .pania-pos-eyebrow{font:800 .68rem/1.5 system-ui,sans-serif;letter-spacing:.12em;color:#176c5c}
.pania-pos-2510 .pania-pos-section-head h2,.pania-pos-2510 .pania-pos-checkout-head h2{font-family:Georgia,serif;color:#16332d;font-size:clamp(1.45rem,2vw,1.85rem);line-height:1.2;margin:.15rem 0 .3rem}
.pania-pos-2510 .pania-pos-section-head p,.pania-pos-2510 .pania-pos-checkout-head p{font-size:.81rem;color:var(--pos-muted);margin:0}
.pania-pos-2510 .pania-pos-catalog-count{flex:none;font-size:.75rem;color:#386b5e;border:1px solid #d6e8df;background:#eef7f2;border-radius:99px;padding:.4rem .65rem}
.pania-pos-2510 .pos-busqueda input{background:#fff;border:1px solid #cdded5;border-radius:13px;min-height:52px;padding:.8rem 1rem;font-size:.94rem;color:#17382f;box-shadow:0 3px 12px #14392b08}
.pania-pos-2510 .pos-busqueda input:focus{outline:2px solid #268976;outline-offset:2px}
.pania-pos-2510 .chips{gap:.4rem}
.pania-pos-2510 .chip{border-radius:11px;border:1px solid #d7e5dd;background:#fff;color:#21473e;font-family:system-ui,sans-serif;font-size:.79rem;font-weight:600;padding:.55rem .75rem;min-height:37px}
.pania-pos-2510 .chip.activo{background:#126455;color:#fff;border-color:#126455}
.pania-pos-2510 .pos-rejilla{gap:.65rem}
.pania-pos-2510 .pos-prod{position:relative;min-height:116px;border:1px solid #dce6e0;border-radius:13px;background:#fff;padding:1rem;box-shadow:0 3px 12px #1a433008;text-align:left;transition:border-color .15s,transform .15s,box-shadow .15s}
.pania-pos-2510 .pos-prod:hover:not(:disabled){transform:translateY(-2px);border-color:#60ad97;box-shadow:0 8px 20px #1a433013}
.pania-pos-2510 .pos-prod.en-carrito{border-color:#15806b;background:#f1faf6;box-shadow:inset 0 0 0 1px #15806b}
.pania-pos-2510 .pos-prod.agotado{opacity:.65}
.pania-pos-2510 .pos-nombre{font-size:.9rem;font-weight:750;color:#19372f}
.pania-pos-2510 .pos-precio{font-family:Georgia,serif;font-size:1.17rem;font-weight:700;color:#0e594a}
.pania-pos-2510 .pos-stock{font-size:.73rem}
.pania-pos-2510 .pos-carrito{min-width:0;border:1px solid #dce7e1;border-radius:18px;padding:1.15rem;background:#fff;box-shadow:0 10px 30px #133e2910}
.pania-pos-2510 .pania-pos-checkout-head{display:flex;justify-content:space-between;gap:.7rem;align-items:center;padding-bottom:1rem;border-bottom:1px solid #e7eee9;margin-bottom:1rem}
.pania-pos-2510 .pania-pos-checkout-icon{display:grid;place-items:center;flex:none;width:46px;height:46px;border-radius:13px;background:#e5f5ee;color:#106b58;font-size:1.65rem}
.pania-pos-2510 .pos-lineas{margin:.65rem 0}
.pania-pos-2510 .pos-lineas li{padding:.75rem 0;border-bottom:1px solid #e8eee9;gap:.45rem}
.pania-pos-2510 .pos-lin-info strong{color:#1c3830;font-size:.85rem}
.pania-pos-2510 .pos-qty button{background:#eff7f2;border:1px solid #d5e7dc;border-radius:8px;color:#145d4d;min-width:29px;min-height:31px}
.pania-pos-2510 .pos-qty input{border:1px solid #d7e5de;border-radius:7px;text-align:center;max-width:58px}
.pania-pos-2510 .pos-total{margin:1rem 0;padding:1.1rem;border-radius:14px;background:#eaf6ef;border:1px solid #d0e9dc;display:flex;align-items:center;justify-content:space-between;gap:.75rem}
.pania-pos-2510 .pos-total>span{display:grid;gap:.25rem;font-size:.85rem;font-weight:750;color:#215d4d}
.pania-pos-2510 .pos-total>span small{font-size:.7rem;font-weight:500;color:#5c796c}
.pania-pos-2510 .pos-total strong{font-family:Georgia,serif;color:#0d5848;font-size:clamp(1.6rem,2.3vw,2.2rem);white-space:nowrap}
.pania-pos-2510 .pania-pos-payment{margin:.9rem 0 1.1rem}
.pania-pos-2510 .pania-pos-field-title{font-size:.79rem;font-weight:800;color:#27483f;margin:0 0 .55rem}
.pania-pos-2510 .pania-pos-payment .chips{display:flex;flex-wrap:wrap}
.pania-pos-2510 .pania-pos-payment .chip{flex:1 1 auto;min-width:78px}
.pania-pos-2510 .pos-cambio{border:1px solid #e3ece6;background:#f7faf8;border-radius:12px;padding:.85rem;margin-bottom:1rem}
.pania-pos-2510 .pos-cobrar{width:100%;min-height:54px;border-radius:12px;background:#126455;color:#fff;font-size:1rem;font-weight:800;box-shadow:0 5px 12px #12645522}
.pania-pos-2510 .pos-cobrar:disabled{opacity:.55;box-shadow:none}
.pania-pos-2510 .pos-extra{border-top:1px solid #e6ede8;margin-top:1rem;padding-top:.75rem}
.pania-pos-2510 label{font-size:.8rem;color:#37554b}
.pania-pos-2510 select{border-radius:10px;border-color:#d7e5dd;background:#fff}
@media(max-width:900px){.pania-pos-2510 .pos-carrito{padding:1rem}}
@media(max-width:600px){.pania-pos-2510 .pania-pos-section-head{align-items:start}.pania-pos-2510 .pania-pos-catalog-count{display:none}.pania-pos-2510 .pos-total strong{font-size:1.7rem}.pania-pos-2510 .pos-prod{min-height:105px;padding:.75rem}}
'''
if 'PANIA POS visual 2.5.10' in c: sys.exit('CSS ya aplicado; sin cambios.')
backup=root/'respaldos'/('pos_visual_2_5_10_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=False)
shutil.copy2(pos,backup/'PosCaja.tsx');shutil.copy2(css,backup/'globals.css')
try:
 pos.write_text(s,encoding='utf-8');css.write_text(c+style,encoding='utf-8')
except Exception:
 shutil.copy2(backup/'PosCaja.tsx',pos);shutil.copy2(backup/'globals.css',css);raise
print('OK: POS 2.5.10 aplicado. No se modificaron actions.ts ni TicketVenta.tsx.');print('Respaldo:',backup)
print('Validar: npx tsc --noEmit --incremental false && npm run build')
