#!/usr/bin/env python3
"""PANIA: rediseño seguro del Inicio, preservando consultas y operaciones."""
from pathlib import Path
from datetime import datetime
import shutil, sys
root=Path.cwd()
page=root/'src/app/(app)/page.tsx'
css=root/'src/app/globals.css'
if not page.exists() or not css.exists():
    sys.exit('ERROR: Ejecuta este script desde la raíz del proyecto PANIA.')
s=page.read_text(encoding='utf-8'); c=css.read_text(encoding='utf-8')
marker='return <><header className="cabecera hero"'
if 'pania-home-259' in s:
    sys.exit('La actualización 2.5.9 ya está aplicada; no se modificó nada.')
if s.count(marker)!=1 or 'const ventas=Number(er?.ventas_netas??0)' not in s or 'const decisiones=' not in s:
    sys.exit('ERROR: Inicio diferente al revisado. No se modificó ningún archivo.')
new=r'''return <div className="pania-home-259">
<header className="cabecera hero home-hero"><div className="home-welcome"><p className="eyebrow">{empresa?.nombre??'Mi panadería'} · Centro de control</p><h1><span className="home-bread" aria-hidden="true">🥖</span> Hola, {perfil.nombre.split(' ')[0]}. Así va tu negocio.</h1><p>Lo importante primero: dinero, operación y decisiones.</p></div><div className="home-header-actions"><div className="home-date"><span>Fecha de consulta</span><strong>{new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'long',year:'numeric',timeZone:'America/Mexico_City'}).format(new Date())}</strong></div><Link className="boton primario" href="/ventas">＋ Nueva venta</Link></div></header>
<section className="kpis home-kpis" aria-label="Indicadores del negocio">
<article className="kpi home-kpi home-kpi-sales"><span className="home-kpi-symbol" aria-hidden="true">▥</span><div><span>Ventas del mes</span><strong>{mx(ventas)}</strong><small>Ingresos registrados</small></div></article>
<article className="kpi home-kpi home-kpi-profit"><span className="home-kpi-symbol" aria-hidden="true">◉</span><div><span>Ganancia operativa</span><strong>{mx(util)}</strong><small>Después de gastos</small></div></article>
<article className="kpi home-kpi home-kpi-cash"><span className="home-kpi-symbol" aria-hidden="true">▣</span><div><span>Disponible</span><strong>{mx(liquidez)}</strong><small>Caja + bancos</small></div></article>
<article className="kpi home-kpi home-kpi-margin"><span className="home-kpi-symbol" aria-hidden="true">◴</span><div><span>Margen</span><strong>{pct(Number(er?.margen_operativo_pct??0))}</strong><small>{clientes??0} clientes activos</small></div></article>
</section>
<section className="acciones-rapidas home-actions" aria-label="Acciones rápidas"><Link href="/ventas"><span className="home-action-icon" aria-hidden="true">▣</span><span><strong>Vender</strong><small>Abrir punto de venta</small></span><b aria-hidden="true">›</b></Link><Link href="/produccion"><span className="home-action-icon" aria-hidden="true">◒</span><span><strong>Producir</strong><small>Nueva orden</small></span><b aria-hidden="true">›</b></Link><Link href="/compras"><span className="home-action-icon" aria-hidden="true">↓</span><span><strong>Comprar</strong><small>Entrada de insumos</small></span><b aria-hidden="true">›</b></Link><Link href="/gastos"><span className="home-action-icon" aria-hidden="true">≡</span><span><strong>Registrar gasto</strong><small>Salida de dinero</small></span><b aria-hidden="true">›</b></Link></section>
<section className="dashboard-grid home-main-grid"><article className="panel negocio-hoy"><div className="panel-titulo"><div><p className="eyebrow">RESULTADO DEL MES</p><h2>Tu negocio hoy</h2></div><Link href="/finanzas">Ver finanzas →</Link></div><div className="puente"><div><span>Ventas</span><strong>{mx(ventas)}</strong></div><b>−</b><div><span>Costo + gastos</span><strong>{mx(ventas-util)}</strong></div><b>=</b><div className={util>=0?'positivo':'negativo'}><span>Ganancia</span><strong>{mx(util)}</strong></div></div><div className="home-financial-rows"><div className="estado-linea"><span>Utilidad bruta</span><strong>{mx(er?.utilidad_bruta??0)}</strong></div><div className="estado-linea"><span>Gastos operativos y marketing</span><strong>{mx(gastos)}</strong></div><div className="estado-linea"><span>Flujo neto</span><strong>{mx(er?.flujo_neto??0)}</strong></div></div></article>
<article className="panel atencion"><div className="panel-titulo"><div><p className="eyebrow">PANIA TE AVISA</p><h2>Necesita tu atención</h2></div><Link href="/decisiones">Ver todo →</Link></div>{decisiones.length?decisiones.map((x:any,i)=><Link className="alerta-negocio" href={x.ruta_accion||'/decisiones'} key={i}><span className={`alerta-punto ${x.severidad==='critica'?'rojo':'ambar'}`}></span><span><strong>{x.hallazgo}</strong><small>{x.veces>1?`${x.veces} eventos agrupados · `:''}{x.evidencia}</small></span><b>{mx(x.impacto)}</b><span className="home-alert-arrow" aria-hidden="true">›</span></Link>):<p className="vacio">No hay alertas urgentes.</p>}</article></section>
<section className="panel home-opportunities"><div className="panel-titulo"><div><p className="eyebrow">OPORTUNIDAD · DATOS REALES</p><h2>¿Dónde puedo mejorar?</h2></div><Link href="/radar">Abrir Radar →</Link></div><div className="mejora-grid"><div><span>Fugas medibles · 7 días</span><strong>{mx(fugas)}</strong><small>Merma, insumos y margen</small></div><div><span>Último día registrado</span><strong>{mx(hoy?.fugas_medibles??0)}</strong><small>Impacto detectado</small></div><div><span>Sobreproducción</span><strong>{mx(hoy?.fuga_sobreproduccion_estimada??0)}</strong><small>Estimación recuperable</small></div></div></section>
</div>;}'''
start=s.index(marker)
updated=s[:start]+new
style=r'''

/* PANIA Inicio 2.5.9: diseño visual aislado, sin alterar lógica */
.pania-home-259{color:#18332e}
.pania-home-259 .home-hero{align-items:center;margin-bottom:1.35rem;gap:1.2rem}
.pania-home-259 .home-welcome{min-width:0}
.pania-home-259 .home-hero h1{font-family:var(--serif);font-size:clamp(1.65rem,2.7vw,2.65rem);line-height:1.15;letter-spacing:-.025em;margin:.25rem 0 .35rem;color:#102c29}
.pania-home-259 .home-hero p:not(.eyebrow){color:#526560}
.pania-home-259 .home-bread{font-size:.8em;margin-right:.3rem;vertical-align:baseline}
.pania-home-259 .home-header-actions{display:flex;align-items:center;gap:.7rem;flex-wrap:wrap;justify-content:flex-end}
.pania-home-259 .home-date{display:grid;gap:.15rem;border:1px solid #dce6e1;background:#fff;border-radius:12px;padding:.55rem .9rem;font-size:.8rem;min-width:175px}
.pania-home-259 .home-date span{color:#5b6e69}.pania-home-259 .home-date strong{font-size:.84rem;color:#173c37}
.pania-home-259 .home-kpis{gap:.85rem}
.pania-home-259 .home-kpi{display:flex;align-items:center;gap:.8rem;min-width:0;padding:1.1rem;border-radius:16px;border:1px solid #dfe8e3;box-shadow:0 5px 20px #16382c08}
.pania-home-259 .home-kpi>div{display:grid;gap:.12rem;min-width:0}
.pania-home-259 .home-kpi>div>span{font-size:.82rem;color:#425b55}
.pania-home-259 .home-kpi strong{font-size:clamp(1.4rem,2.05vw,2rem);color:#102c29;overflow-wrap:anywhere}
.pania-home-259 .home-kpi small{font-size:.74rem;color:#526761}
.pania-home-259 .home-kpi-symbol{display:grid;place-items:center;flex:none;width:48px;height:48px;border-radius:50%;font-family:var(--sans);font-size:1.65rem;font-weight:750}
.pania-home-259 .home-kpi-sales{background:#f0faf5}.pania-home-259 .home-kpi-sales .home-kpi-symbol{background:#d9f5e7;color:#088451}
.pania-home-259 .home-kpi-profit{background:#fff9f0}.pania-home-259 .home-kpi-profit .home-kpi-symbol{background:#fff0d4;color:#bb7800}
.pania-home-259 .home-kpi-cash{background:#f1f8ff}.pania-home-259 .home-kpi-cash .home-kpi-symbol{background:#deeeff;color:#1464b7}
.pania-home-259 .home-kpi-margin{background:#f7f3ff}.pania-home-259 .home-kpi-margin .home-kpi-symbol{background:#ece3ff;color:#6434b8}
.pania-home-259 .home-actions>a{background:#f3f9f6;border:1px solid #dce9e3;border-radius:15px;gap:.75rem;font-size:1rem;min-width:0;padding:.8rem}
.pania-home-259 .home-action-icon{display:grid;place-items:center;flex:none;width:45px;height:45px;border-radius:12px;background:#126d5d;color:#fff;font-size:1.4rem}
.pania-home-259 .home-actions>a>span:nth-child(2){min-width:0}.pania-home-259 .home-actions strong{font-size:.95rem;color:#133d34}.pania-home-259 .home-actions small{font-size:.75rem;color:#566b65}
.pania-home-259 .home-actions>a>b{margin-left:auto;color:#205b4e;font-size:1.5rem;font-weight:500}
.pania-home-259 .home-main-grid{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:stretch}
.pania-home-259 .home-main-grid>.panel{min-width:0;padding:1.2rem;border-radius:16px}
.pania-home-259 .panel-titulo h2{font-family:var(--serif);font-size:1.65rem;color:#15322c}
.pania-home-259 .panel-titulo a{color:#126555}
.pania-home-259 .puente{background:#f2f7f4;border-radius:13px;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr);gap:.55rem;padding:1rem}
.pania-home-259 .puente strong{font-family:var(--sans);font-size:clamp(.98rem,1.5vw,1.35rem);overflow-wrap:anywhere}
.pania-home-259 .home-financial-rows{margin-top:.55rem}
.pania-home-259 .estado-linea{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem .35rem;border-bottom:1px solid #e5ece8;color:#38534c}
.pania-home-259 .estado-linea:last-child{border-bottom:0}.pania-home-259 .estado-linea strong{color:#173c37}
.pania-home-259 .alerta-negocio{grid-template-columns:auto minmax(0,1fr) auto auto;gap:.7rem;padding:1rem .1rem}
.pania-home-259 .alerta-negocio strong{color:#24342f}.pania-home-259 .alerta-negocio>b{color:#17332e;white-space:nowrap}
.pania-home-259 .home-alert-arrow{font-size:1.35rem;color:#47685f}
.pania-home-259 .home-opportunities{border-radius:16px;padding:1.2rem}
.pania-home-259 .home-opportunities .mejora-grid>div{border:1px solid #e3ebe6;background:#f5f9f6;padding:1rem}
@media(max-width:1100px){.pania-home-259 .home-main-grid{grid-template-columns:1fr}.pania-home-259 .home-kpi{padding:.85rem}.pania-home-259 .home-kpi-symbol{width:40px;height:40px}}
@media(max-width:700px){.pania-home-259 .home-header-actions{width:100%;justify-content:stretch}.pania-home-259 .home-header-actions>*{flex:1}.pania-home-259 .home-date{min-width:0}.pania-home-259 .home-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.pania-home-259 .home-kpi{display:grid;gap:.5rem}.pania-home-259 .home-actions{grid-template-columns:1fr 1fr}.pania-home-259 .home-actions>a{padding:.65rem;gap:.45rem}.pania-home-259 .home-action-icon{width:36px;height:36px}.pania-home-259 .home-actions>a>b{display:none}.pania-home-259 .puente{grid-template-columns:1fr auto 1fr auto 1fr}.pania-home-259 .puente>b{display:block}.pania-home-259 .puente strong{font-size:.9rem}.pania-home-259 .alerta-negocio{grid-template-columns:auto minmax(0,1fr) auto}.pania-home-259 .home-alert-arrow{display:none}}
@media(max-width:420px){.pania-home-259 .home-kpis{grid-template-columns:1fr 1fr}.pania-home-259 .home-kpi strong{font-size:1.3rem}.pania-home-259 .home-kpi small{font-size:.68rem}.pania-home-259 .puente{grid-template-columns:1fr;gap:.3rem}.pania-home-259 .puente>b{display:none}.pania-home-259 .home-actions{grid-template-columns:1fr 1fr}}
'''
if 'PANIA Inicio 2.5.9' in c:
    sys.exit('ERROR: CSS 2.5.9 ya existe. No se modificó ningún archivo.')
backup=root/'respaldos'/('inicio_visual_2_5_9_'+datetime.now().strftime('%Y%m%d_%H%M%S'))
backup.mkdir(parents=True,exist_ok=False)
shutil.copy2(page,backup/'page.tsx');shutil.copy2(css,backup/'globals.css')
try:
    page.write_text(updated,encoding='utf-8');css.write_text(c+style,encoding='utf-8')
except Exception:
    shutil.copy2(backup/'page.tsx',page);shutil.copy2(backup/'globals.css',css)
    raise
print('OK: Inicio PANIA 2.5.9 actualizado. Datos y consultas conservados.')
print('Respaldo:',backup)
print('Ahora ejecuta: npx tsc --noEmit --incremental false && npm run build')
