#!/usr/bin/env python3
"""PANIA 2.5.8: parche visual no destructivo. Ejecutar en la raíz del repositorio."""
from pathlib import Path
import sys, shutil, datetime
root=Path.cwd()
css=root/'src/app/globals.css'
nav=root/'src/components/Nav.tsx'
if not css.exists() or not nav.exists():
    sys.exit('ERROR: ejecutar desde /workspaces/PANIA. No se modificó nada.')
marker='/* PANIA 2.5.8 — normalización visual */'
backup=root/'respaldos'/('visual_2_5_8_'+datetime.datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=True)
for p in (css,nav):
    dest=backup/p.relative_to(root)
    dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(p,dest)
styles=r'''
/* PANIA 2.5.8 — normalización visual */
/* Modo claro explícito para evitar mezclar tokens oscuros con tarjetas blancas. */
:root {color-scheme:light;--masa:#f7f6f1;--papel:#fff;--tinta:#1b302b;--apagado:#53645f;--linea:#d8e1da;--centeno:#155b50;--centeno-oscuro:#10483f;--trigo:#94631b;--ok:#17643d;--problema:#a52a25;--problema-fondo:#fff0ef;--ok-fondo:#eaf5ee;--pania-crema:#f7f6f1;--pania-suave:#edf3ef;--pania-verde:#155b50;--pania-verde2:#176a5b}
@media (prefers-color-scheme:dark){:root{color-scheme:light;--masa:#f7f6f1;--papel:#fff;--tinta:#1b302b;--apagado:#53645f;--linea:#d8e1da;--centeno:#155b50;--centeno-oscuro:#10483f;--trigo:#94631b;--ok:#17643d;--problema:#a52a25;--problema-fondo:#fff0ef;--ok-fondo:#eaf5ee}}
body{background:var(--masa);color:var(--tinta)}
.contenido{color:var(--tinta);min-width:0}
.contenido h1,.contenido h2,.contenido h3{color:var(--tinta)}
.contenido .cabecera h1,.contenido .hero h1{color:var(--tinta)}
.contenido p,.contenido label,.contenido dt,.contenido td{color:inherit}
.contenido .panel,.contenido .kpi,.contenido .inv-card,.contenido .inv-detalle,.contenido .compra-step,.contenido .catalogo-card,.contenido .kpi-compra{color:var(--tinta)}
.contenido .kpi strong,.contenido .mejora-grid strong,.contenido .inv-detalle h2{color:var(--tinta)}
.contenido .inv-ok{color:#17643d}.contenido .inv-danger{color:#a52a25}.contenido .inv-warn{color:#925006}.contenido .inv-value{color:#164e75}
.contenido .inv-kpi strong{color:inherit}
.contenido .inv-card h2{color:var(--tinta)}.contenido .inv-comprar h2{color:#a52a25}
.contenido .inv-reponer strong,.contenido .inv-tabla strong,.contenido .inv-detalle dd{color:var(--tinta)}
.contenido .inv-reponer .rojo,.contenido .inv-sugerido strong{color:#a52a25!important}
.contenido .inv-status.sin{color:#9d241f}.contenido .inv-status.bajo{color:#915006}.contenido .inv-status.bien{color:#17643d}
.contenido .inv-buscar,.contenido input,.contenido select,.contenido textarea{color:var(--tinta)}
.contenido input::placeholder,.contenido textarea::placeholder{color:#667771;opacity:1}
.contenido .inv-tabs a:not(.activo){color:var(--tinta)}
.contenido .acciones-rapidas>a{font-size:1rem}.contenido .acciones-rapidas small{color:#53645f;font-size:.8rem}
.contenido .inv-kpi small,.contenido .kpi small,.contenido .kpi-compra small{color:#53645f}
.contenido .inv-kpi-icon,.contenido .inv-mini-icon,.contenido .inv-detalle-icon{line-height:1.2}
.contenido button:focus-visible,.contenido a:focus-visible,.lateral a:focus-visible{outline:3px solid #c08b2d;outline-offset:3px}
.contenido .boton.secundario{background:#fff;color:#155b50;border-color:#8bb7aa}
.contenido .boton.secundario:hover{background:#e9f4ef}
.contenido .inv-reponer,.contenido .inv-tabla td{overflow-wrap:anywhere}
.contenido .inv-kpi{min-width:0}.contenido .inv-kpi strong{overflow-wrap:anywhere;font-size:clamp(1.2rem,2vw,1.75rem)}
.pania-icon{display:inline-block;width:1.15rem;height:1.15rem;flex:none;vertical-align:-.18em;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.nav-icono .pania-icon{width:1.2rem;height:1.2rem}.nav-icono{display:inline-flex;align-items:center;justify-content:center;flex:none}
@media(max-width:700px){.contenido .inv-kpi strong{font-size:1.45rem}.contenido .inv-card,.contenido .inv-detalle{padding:.85rem}}
'''
current=css.read_text()
if marker in current:
    current=current[:current.index(marker)].rstrip()+'\n'
css.write_text(current+'\n'+styles.strip()+'\n')
# Sustituir únicamente el renderizado del icono del menú; roles.ts permanece intacto.
nav_src=nav.read_text()
old="<span className=\"nav-icono\">{i.icono??'•'}</span>"
if old in nav_src:
    nav_src=nav_src.replace("import Link from 'next/link';", "import Link from 'next/link'; import {PaniaIcon} from '@/components/PaniaIcon';",1)
    nav_src=nav_src.replace(old,'<span className="nav-icono"><PaniaIcon ruta={i.href}/></span>')
    nav.write_text(nav_src)
else:
    print('AVISO: Nav.tsx tiene otra estructura; no se modificó la navegación.')
icon=root/'src/components/PaniaIcon.tsx'
if not icon.exists():
    icon.write_text('''import type {SVGProps} from 'react';
const rutas: Record<string,string> = {
 '/':'M3 10 12 3l9 7v10H3z M9 20v-7h6v7',
 '/ventas':'M3 4h18v16H3z M7 9h10 M7 13h5 M15 16h2',
 '/produccion':'M4 19h16 M6 19v-8l6-6 6 6v8 M9 14h6',
 '/inventario':'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',
 '/compras':'M3 4h2l2 11h11l3-8H6 M9 20h.01 M17 20h.01',
 '/finanzas':'M3 17l6-6 4 4 8-9 M15 6h6v6',
 '/gastos':'M12 3v18 M5 14l7 7 7-7 M4 7h16',
 '/presupuestos':'M4 4h16v16H4z M8 15v2 M12 11v6 M16 8v9',
 '/asistente':'M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z',
 '/decisiones':'M4 12l5 5L20 6',
 '/radar':'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10 M12 12h.01',
 '/alertas':'M12 3L2 21h20z M12 9v5 M12 18h.01',
 '/proyecciones':'M3 17l6-6 4 4 8-9 M15 6h6v6',
 '/simulador':'M4 4h16v16H4z M8 8h8 M8 12h3 M8 16h3 M15 15h2',
 '/clientes':'M16 20v-2a4 4 0 0 0-8 0v2 M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8',
 '/marketing':'M3 10v4h4l10 5V5L7 10z M7 14l2 6',
 '/productos':'M3 7l9-4 9 4-9 4z M3 7v10l9 4 9-4V7 M12 11v10',
 '/ingredientes':'M12 21V9 M12 14C7 14 5 11 5 7c4 0 7 2 7 7 M12 11c0-4 3-6 7-6 0 4-2 6-7 6',
 '/recetas':'M5 3h12l3 3v15H5z M8 10h8 M8 14h8 M8 18h5',
 '/usuarios':'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8 M4 21v-2a8 8 0 0 1 16 0v2',
 '/configuracion':'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M5.6 5.6l2.1 2.1 M16.3 16.3l2.1 2.1 M18.4 5.6l-2.1 2.1 M7.7 16.3l-2.1 2.1 M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8',
 '/auditoria':'M4 12l5 5L20 6',
 '/plataforma':'M12 3l9 5v8l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v8',
};
export function PaniaIcon({ruta,...props}: {ruta:string}&SVGProps<SVGSVGElement>){return <svg className="pania-icon" viewBox="0 0 24 24" aria-hidden="true" {...props}><path d={rutas[ruta]??rutas['/productos']}/></svg>}
''')
else:
    print('AVISO: PaniaIcon.tsx ya existe; se respetó el archivo.')
print('OK: parche visual aplicado. Respaldo:',backup)
print('Validar: npx tsc --noEmit --incremental false && npm run build')
