#!/usr/bin/env python3
"""PANIA POS 2.5.15: reestructura el JSX del POS, no solo CSS."""
from pathlib import Path
from datetime import datetime
import shutil, sys

root=Path.cwd()
pos=root/'src/app/(app)/ventas/PosCaja.tsx'
css=root/'src/app/globals.css'
if not pos.is_file() or not css.is_file(): sys.exit('ERROR: Ejecuta desde /workspaces/PANIA')
s=pos.read_text(encoding='utf-8'); c=css.read_text(encoding='utf-8')
if 'pania-pos-2515' in s: sys.exit('POS 2.5.15 ya instalado; no se duplicaron cambios')
checks=['pos pania-pos-2514','<section className="pos-catalogo"','<div className="pos-rejilla">','<form className="pos-carrito panel"','<div className="pos-total">','<div className="pania-pos-payment">','<div className="pos-acciones">','</form>']
for x in checks:
    if s.count(x)!=1: sys.exit('ERROR: Estructura distinta en '+x+'; no se modificó nada')
if '/* PANIA POS 2.5.14' not in c: sys.exit('ERROR: Falta CSS 2.5.14; no se modificó nada')
# 2.5.15 crea una barra operativa y una caja de cobro con secciones propias.
s=s.replace('pos pania-pos-2514','pos pania-pos-2515',1)
s=s.replace('<section className="pos-catalogo" aria-label="Catálogo de productos">', '<section className="pos-catalogo" aria-label="Catálogo de productos">',1)
s=s.replace('        <div className="pos-busqueda">', '''        <div className="pania-pos-tools"><div className="pania-pos-tools-title"><strong>Catálogo de productos</strong><span>Selecciona los artículos para preparar la venta</span></div>
        <div className="pos-busqueda">''',1)
s=s.replace('        <div className="pos-rejilla">','        </div>\n        <div className="pania-pos-products-title"><strong>Productos disponibles</strong><span>{filtrados.length} resultados</span></div>\n        <div className="pos-rejilla">',1)
s=s.replace('<form className="pos-carrito panel" id="carrito" action={accion}>','<form className="pos-carrito panel" id="carrito" action={accion}>',1)
s=s.replace('        {!lineas.length ? <p className="vacio">Toca un producto para agregarlo.</p> : (','        <div className="pania-pos-cart-body"><div className="pania-pos-cart-caption"><strong>Detalle del pedido</strong><span>{piezas} piezas</span></div>\n        {!lineas.length ? <p className="vacio">Toca un producto para agregarlo.</p> : (',1)
s=s.replace('        <div className="pos-total">','        </div>\n        <div className="pania-pos-checkout-body"><div className="pos-total">',1)
s=s.replace('        <details className="pos-extra">','        </div>\n        <details className="pos-extra">',1)
# Validate balanced structural inserts and close tags before writing.
if s.count('pania-pos-tools')<2 or s.count('pania-pos-checkout-body')!=1: sys.exit('ERROR: La transformación no quedó completa')
style=r'''
/* PANIA POS 2.5.15 — composición nueva inspirada en Inventario. Sin CSS de versiones anteriores en cascada. */
.pania-pos-2515{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,1fr);gap:18px;align-items:start;width:100%;min-width:0}
.pania-pos-2515,.pania-pos-2515 *{box-sizing:border-box}
.pania-pos-2515 .pos-catalogo,.pania-pos-2515 .pos-carrito{min-width:0;max-width:100%;background:transparent;border:0;box-shadow:none;padding:0}
.pania-pos-2515 .pos-catalogo{display:flex;flex-direction:column;gap:16px}
.pania-pos-2515 .pania-pos-section-head{display:flex;justify-content:space-between;align-items:center;padding:0 2px 4px;border:0;min-height:0}
.pania-pos-2515 .pania-pos-eyebrow{display:block;font:800 11px system-ui,sans-serif;letter-spacing:.1em;color:#0d6d57}
.pania-pos-2515 .pania-pos-section-head h2,.pania-pos-2515 .pania-pos-checkout-head h2{font:700 27px/1.15 Georgia,serif;color:#153c31;margin:5px 0}
.pania-pos-2515 .pania-pos-section-head p,.pania-pos-2515 .pania-pos-checkout-head p{font:400 12px/1.4 system-ui,sans-serif;color:#65796f;margin:0}
.pania-pos-2515 .pania-pos-catalog-count{background:#e9f5ed;color:#14664f;border:1px solid #d4e7da;border-radius:100px;padding:8px 12px;font-size:12px}
.pania-pos-2515 .pania-pos-tools{display:flex;flex-direction:column;gap:12px;background:#fff;border:1px solid #dce5dd;border-radius:15px;padding:18px;box-shadow:0 4px 18px #173e2c0a}
.pania-pos-2515 .pania-pos-tools-title{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap}
.pania-pos-2515 .pania-pos-tools-title strong,.pania-pos-2515 .pania-pos-products-title strong,.pania-pos-2515 .pania-pos-cart-caption strong{font:750 15px system-ui,sans-serif;color:#1a4034}
.pania-pos-2515 .pania-pos-tools-title span,.pania-pos-2515 .pania-pos-products-title span,.pania-pos-2515 .pania-pos-cart-caption span{font:500 12px system-ui,sans-serif;color:#6d8275}
.pania-pos-2515 .pos-busqueda input{width:100%;min-height:49px;border:1px solid #d4e1d7;border-radius:10px;padding:11px 14px;background:#fafdfa;color:#173d31;box-shadow:none}
.pania-pos-2515 .chips{display:flex;gap:7px;flex-wrap:wrap}
.pania-pos-2515 .chip{min-height:37px;border:1px solid #d7e2da;background:#fff;color:#295143;border-radius:9px;padding:8px 12px;font:600 12px system-ui,sans-serif}
.pania-pos-2515 .chip.activo{background:#126a55;border-color:#126a55;color:#fff}
.pania-pos-2515 .pania-pos-products-title{display:flex;justify-content:space-between;align-items:center;padding:2px 2px 0}
.pania-pos-2515 .pos-rejilla{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.pania-pos-2515 .pos-prod{display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:10px;min-width:0;min-height:140px;padding:15px;background:#fff;border:1px solid #dce5dd;border-radius:13px;box-shadow:0 4px 14px #143e290b;text-align:left}
.pania-pos-2515 .pos-prod:hover:not(:disabled){border-color:#66a88c;background:#f6fbf7;transform:translateY(-1px)}
.pania-pos-2515 .pos-prod.en-carrito{background:#eaf6ed;border-color:#168268;box-shadow:inset 0 0 0 1px #168268}
.pania-pos-2515 .pos-nombre{font:750 13px/1.3 system-ui,sans-serif;color:#203d30;overflow-wrap:anywhere}
.pania-pos-2515 .pos-precio{font:800 21px system-ui,sans-serif;color:#0e634d}
.pania-pos-2515 .pos-stock{font:500 11px system-ui,sans-serif;color:#617d6d}
.pania-pos-2515 .pos-carrito{position:sticky;top:16px;display:flex;flex-direction:column;gap:0;background:#fff;border:1px solid #dce5dd;border-radius:15px;overflow:visible;max-height:none;height:auto;box-shadow:0 4px 18px #143e290c}
.pania-pos-2515 .pania-pos-checkout-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:19px;border-bottom:1px solid #e3ebe5}
.pania-pos-2515 .pania-pos-cart-body{display:grid;gap:12px;padding:17px 19px;background:#fff}
.pania-pos-2515 .pania-pos-cart-caption{display:flex;align-items:center;justify-content:space-between;gap:10px}
.pania-pos-2515 .pania-pos-cart-body .vacio{background:#f5f8f5;border:1px dashed #d2e1d6;border-radius:11px;padding:20px 12px;text-align:center;color:#678070;margin:0;font-size:12px}
.pania-pos-2515 .pos-lineas{max-height:240px;overflow-y:auto;overflow-x:hidden;margin:0;padding:0}
.pania-pos-2515 .pos-lineas li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;padding:10px 0;border-bottom:1px solid #e6eee7}
.pania-pos-2515 .pos-lin-info{min-width:0}.pania-pos-2515 .pos-qty{grid-column:1;grid-row:2;justify-self:start}.pania-pos-2515 .pos-imp{grid-column:2;grid-row:1/span 2;min-width:0}
.pania-pos-2515 .pania-pos-checkout-body{display:flex;flex-direction:column;gap:14px;padding:18px 19px;background:#f6f9f6;border-top:1px solid #e2ebe4;border-bottom:1px solid #e2ebe4}
.pania-pos-2515 .pos-total{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:15px;background:#e3f3e9;border:1px solid #c9e4d3;border-radius:12px;margin:0}
.pania-pos-2515 .pos-total strong{font:800 clamp(24px,2.5vw,35px) system-ui,sans-serif;color:#0d5946}
.pania-pos-2515 .pania-pos-payment .chips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.pania-pos-2515 .pania-pos-payment .chip{width:100%;min-width:0;padding:10px 4px}
.pania-pos-2515 .pos-cambio{padding:12px;border:1px solid #dce7de;background:#fff;border-radius:11px}
.pania-pos-2515 .pos-acciones{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;margin:0}
.pania-pos-2515 .pos-cobrar{width:100%;min-height:56px;background:#126a55;color:#fff;border-radius:11px;font:800 15px system-ui,sans-serif;box-shadow:none}
.pania-pos-2515 .pos-extra{margin:0;padding:15px 19px;border-top:0}.pania-pos-2515 .pos-extra summary{font-size:12px}
.pania-pos-2515 .pos-carrito>label,.pania-pos-2515 .pos-carrito>.pania-pos-ticket-link,.pania-pos-2515 .pos-carrito>.aviso{margin:12px 19px}
.pania-pos-2515 .pos-carrito>label{display:grid;gap:6px;font-size:12px}.pania-pos-2515 select{min-height:43px;border-radius:9px}
.pania-pos-2515 .pania-pos-ticket-link{padding:10px;background:#edf7f0;border-radius:9px;font-size:12px}
.pania-pos-ticket-overlay{position:fixed;inset:0;z-index:1000;background:#0b251eb3;display:flex;justify-content:center;align-items:center;padding:16px}
.pania-pos-ticket-dialog{background:#fff;max-width:480px;width:100%;max-height:92vh;overflow:auto;border-radius:16px;padding:16px;box-shadow:0 20px 70px #0004;color:#18352c}
.pania-pos-ticket-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:12px;border-bottom:1px solid #e2ebe5;margin-bottom:12px}
.pania-pos-ticket-toolbar button{border:1px solid #d0dfd5;background:#f5f9f6;border-radius:9px;padding:9px;color:#174f43;cursor:pointer}
@media(max-width:1050px){.pania-pos-2515{grid-template-columns:minmax(0,1fr)}.pania-pos-2515 .pos-carrito{position:static}}
@media(max-width:640px){.pania-pos-2515 .pos-rejilla{grid-template-columns:repeat(2,minmax(0,1fr))}.pania-pos-2515 .pos-prod{padding:12px;min-height:120px}.pania-pos-2515 .pania-pos-payment .chips{grid-template-columns:repeat(2,minmax(0,1fr))}.pania-pos-2515 .pos-acciones{grid-template-columns:1fr}.pania-pos-2515 .pania-pos-catalog-count{display:none}}
'''
# Keep all CSS before 2.5.14, but replace the entire versioned block.
start=c.index('/* PANIA POS 2.5.14')
new_css=c[:start].rstrip()+'\n\n'+style
backup=root/'respaldos'/('pos_2_5_15_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=False)
shutil.copy2(pos,backup/'PosCaja.tsx.bak')
shutil.copy2(css,backup/'globals.css.bak')
try:
    pos.write_text(s,encoding='utf-8')
    css.write_text(new_css,encoding='utf-8')
except Exception:
    shutil.copy2(backup/'PosCaja.tsx.bak',pos)
    shutil.copy2(backup/'globals.css.bak',css)
    raise
print('OK: POS 2.5.15 — JSX reorganizado, paneles de operaciones y cobro diferenciados.')
print('Respaldo:',backup)
print('Ejecuta: npx tsc --noEmit --incremental false && npm run build')
