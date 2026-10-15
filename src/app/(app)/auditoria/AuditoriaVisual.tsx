'use client';
import { useMemo, useState } from 'react';

export type EventoAuditoria = {
  id: number; fecha: string; usuario: string; modulo: string; tabla: string; operacion: string;
  titulo: string; cambios: { campo: string; antes: string; despues: string }[];
  nivel: 'revisar' | 'atencion' | 'informativo'; motivo: string;
};
const acciones: Record<string, string> = { INSERT: 'Alta', UPDATE: 'Cambio', DELETE: 'Baja' };
const niveles: Record<EventoAuditoria['nivel'], string> = { revisar: 'Revisar', atencion: 'Atención', informativo: 'Informativo' };
const formatoFecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' });
function csvCelda(valor: string | number) { return `"${String(valor).replace(/"/g, '""')}"`; }

export default function AuditoriaVisual({ registros, error }: { registros: EventoAuditoria[]; error: string | null }) {
  const [texto, setTexto] = useState('');
  const [nivel, setNivel] = useState('todos');
  const [modulo, setModulo] = useState('todos');
  const [usuario, setUsuario] = useState('todos');
  const [operacion, setOperacion] = useState('todas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [expandido, setExpandido] = useState<number | null>(null);
  const modulos = useMemo(() => Array.from(new Set(registros.map((r) => r.modulo))).sort(), [registros]);
  const usuarios = useMemo(() => Array.from(new Set(registros.map((r) => r.usuario))).sort(), [registros]);
  const filtrados = useMemo(() => registros.filter((r) => {
    const fecha = r.fecha.slice(0, 10);
    return (nivel === 'todos' || r.nivel === nivel)
      && (modulo === 'todos' || r.modulo === modulo)
      && (usuario === 'todos' || r.usuario === usuario)
      && (operacion === 'todas' || r.operacion === operacion)
      && (!desde || fecha >= desde) && (!hasta || fecha <= hasta)
      && `${r.titulo} ${r.usuario} ${r.modulo} ${r.motivo} ${r.cambios.map((c) => c.campo).join(' ')}`.toLowerCase().includes(texto.toLowerCase());
  }), [registros, nivel, modulo, usuario, operacion, desde, hasta, texto]);
  const revisar = registros.filter((r) => r.nivel === 'revisar').length;
  const atencion = registros.filter((r) => r.nivel === 'atencion').length;
  const personas = new Set(registros.map((r) => r.usuario)).size;
  function exportar() {
    const filas = [
      ['ID', 'Fecha ISO', 'Usuario', 'Módulo', 'Operación', 'Clasificación', 'Motivo', 'Referencia', 'Campos modificados'],
      ...filtrados.map((r) => [r.id, r.fecha, r.usuario, r.modulo, acciones[r.operacion] ?? r.operacion, niveles[r.nivel], r.motivo, r.titulo, r.cambios.map((c) => c.campo).join('; ')]),
    ];
    const contenido = '\ufeff' + filas.map((fila) => fila.map(csvCelda).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8' }));
    const enlace = document.createElement('a'); enlace.href = url; enlace.download = 'PANIA_auditoria_filtrada.csv'; enlace.click();
    URL.revokeObjectURL(url);
  }
  return <main className="av">
    <header className="av-header"><div><span className="av-eyebrow">PANIA · CONTROL INTERNO</span><h1>🛡️ Centro de auditoría</h1><p>Identifica movimientos relevantes, consulta qué cambió y conserva la trazabilidad de las operaciones.</p></div><button type="button" className="av-export" onClick={exportar}>↓ Exportar resultados</button></header>
    {error && <div role="alert" className="av-error">No se pudo consultar la auditoría: {error}</div>}
    <section className="av-kpis" aria-label="Resumen de auditoría">
      <article className="av-kpi av-green"><span>📋</span><div><strong>{registros.length}</strong><b>Eventos consultados</b><small>Hasta los últimos 100 registros</small></div></article>
      <article className="av-kpi av-rose"><span>⚠️</span><div><strong>{revisar}</strong><b>Eventos para revisar</b><small>Clasificación automática</small></div></article>
      <article className="av-kpi av-gold"><span>🔎</span><div><strong>{atencion}</strong><b>Movimientos de atención</b><small>Costos, mermas y cambios sensibles</small></div></article>
      <article className="av-kpi av-blue"><span>👥</span><div><strong>{personas}</strong><b>Actores identificados</b><small>En los eventos consultados</small></div></article>
    </section>
    <div className="av-summary"><div><h2>🎯 Prioridades de revisión</h2><p>Los niveles indican qué eventos conviene examinar primero. No representan hallazgos confirmados.</p></div><div className="av-summary-stats"><span className="av-pill av-review">{revisar} revisar</span><span className="av-pill av-attention">{atencion} atención</span><span className="av-pill av-info">{registros.length - revisar - atencion} informativos</span></div></div>
    <section className="av-panel"><div className="av-panel-title"><div><h2>📑 Historial e investigación</h2><p>Filtra los eventos y abre cualquier registro para comparar sus campos anteriores y nuevos.</p></div><span className="av-count">{filtrados.length} resultados</span></div>
      <div className="av-filters"><label>Buscar<input type="search" placeholder="Usuario, registro o campo..." value={texto} onChange={(e) => setTexto(e.target.value)} /></label><label>Prioridad<select value={nivel} onChange={(e) => setNivel(e.target.value)}><option value="todos">Todas</option><option value="revisar">Revisar</option><option value="atencion">Atención</option><option value="informativo">Informativo</option></select></label><label>Módulo<select value={modulo} onChange={(e) => setModulo(e.target.value)}><option value="todos">Todos</option>{modulos.map((m) => <option key={m}>{m}</option>)}</select></label><label>Usuario<select value={usuario} onChange={(e) => setUsuario(e.target.value)}><option value="todos">Todos</option>{usuarios.map((u) => <option key={u}>{u}</option>)}</select></label><label>Operación<select value={operacion} onChange={(e) => setOperacion(e.target.value)}><option value="todas">Todas</option><option value="INSERT">Alta</option><option value="UPDATE">Cambio</option><option value="DELETE">Baja</option></select></label><label>Desde<input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></label><label>Hasta<input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} /></label><button type="button" className="av-reset" onClick={() => { setTexto(''); setNivel('todos'); setModulo('todos'); setUsuario('todos'); setOperacion('todas'); setDesde(''); setHasta(''); }}>Limpiar filtros</button></div>
      <div className="av-table-scroll"><table><thead><tr><th>Fecha</th><th>Responsable</th><th>Movimiento</th><th>Referencia</th><th>Prioridad</th><th>Detalle</th></tr></thead><tbody>{filtrados.map((r) => <FragmentoFila key={r.id} registro={r} expandido={expandido === r.id} alternar={() => setExpandido(expandido === r.id ? null : r.id)} />)}</tbody></table>{filtrados.length === 0 && <div className="av-empty">No se encontraron movimientos con los filtros seleccionados.</div>}</div>
    </section>
    <aside className="av-note"><b>Alcance y seguridad.</b> Esta vista consulta únicamente los últimos 100 eventos disponibles para tu cuenta. Las clasificaciones son reglas de priorización, no dictámenes de auditoría. Los registros no se pueden modificar desde aquí; se ocultan campos potencialmente sensibles en la comparación y en la exportación. Para un expediente formal, conciliaciones y seguimiento de hallazgos será necesario ampliar el sistema.</aside>
  </main>;
}
function FragmentoFila({ registro: r, expandido, alternar }: { registro: EventoAuditoria; expandido: boolean; alternar: () => void }) {
  return <><tr><td className="av-date">{formatoFecha.format(new Date(r.fecha))}</td><td>{r.usuario}</td><td><b>{acciones[r.operacion] ?? r.operacion}</b><small>{r.modulo}</small></td><td className="av-ref">{r.titulo}</td><td><span className={`av-pill av-${r.nivel === 'revisar' ? 'review' : r.nivel === 'atencion' ? 'attention' : 'info'}`}>{niveles[r.nivel]}</span></td><td><button className="av-open" type="button" aria-expanded={expandido} onClick={alternar}>{expandido ? 'Cerrar' : 'Ver cambios'}</button></td></tr>{expandido && <tr className="av-detail"><td colSpan={6}><div className="av-detail-header"><b>Evento #{r.id}</b><span>{r.motivo}</span><span>Tabla: {r.tabla}</span></div>{r.cambios.length ? <div className="av-diff"><div className="av-diff-head"><b>Campo</b><b>Valor anterior</b><b>Valor nuevo</b></div>{r.cambios.map((c) => <div className="av-diff-row" key={c.campo}><b>{c.campo}</b><span>{c.antes}</span><span>{c.despues}</span></div>)}</div> : <p className="av-no-diff">No hay diferencias de campos visibles para este movimiento. Puede ser un alta, una baja o un registro con campos reservados.</p>}</td></tr>}</>;
}
