import { Aviso } from '@/components/Aviso';
import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirAdmin } from '@/lib/sesion';
import { crearSucursal, cambiarEstadoSucursal, crearCategoria, quitarCategoria } from './actions';
import './configuracion.css';

type Categoria = { id: string; tipo: string; nombre: string };
type Sucursal = { id: string; nombre: string; activa: boolean };

export default async function Configuracion({ searchParams }: { searchParams: Promise<{ [k: string]: string | undefined }> }) {
  await requerirAdmin();
  const q = await searchParams;
  const supabase = await crearClienteServidor();
  const [{ data: sucursales, error: errorSucursales }, { data: categorias, error: errorCategorias }] = await Promise.all([
    supabase.from('sucursales').select('id, nombre, activa').order('nombre').returns<Sucursal[]>(),
    supabase.from('categorias').select('id, tipo, nombre').order('nombre').returns<Categoria[]>(),
  ]);
  const listaSucursales = sucursales ?? [];
  const listaCategorias = categorias ?? [];
  const activas = listaSucursales.filter(s => s.activa).length;
  const producto = listaCategorias.filter(c => c.tipo === 'producto');
  const ingrediente = listaCategorias.filter(c => c.tipo === 'ingrediente');
  const grupos = [
    { tipo: 'producto', titulo: 'Categorías de productos', icono: '🥐', descripcion: 'Organiza los productos de venta.', lista: producto },
    { tipo: 'ingrediente', titulo: 'Categorías de ingredientes', icono: '🌾', descripcion: 'Clasifica materias primas y empaques.', lista: ingrediente },
  ];

  return (
    <main className="cv">
      <header className="cv-header">
        <div><span className="cv-eyebrow">PANIA · ADMINISTRACIÓN</span><h1>⚙️ Sucursales y categorías</h1><p>Administra dónde opera tu panadería y cómo se organiza su catálogo.</p></div>
        <a href="#cv-nueva-sucursal" className="cv-head-action">＋ Nueva sucursal</a>
      </header>
      <Aviso error={q.error} ok={q.ok} />
      {(errorSucursales || errorCategorias) && <p className="cv-error" role="alert">No se pudo consultar toda la información de configuración. {errorSucursales?.message ?? errorCategorias?.message}</p>}
      <section className="cv-stats" aria-label="Resumen de configuración">
        <article className="cv-stat cv-stat-green"><span className="cv-stat-icon">🏪</span><div><strong>{listaSucursales.length}</strong><b>Sucursales registradas</b><small>{activas} activas</small></div></article>
        <article className="cv-stat cv-stat-blue"><span className="cv-stat-icon">✓</span><div><strong>{activas}</strong><b>Sucursales activas</b><small>Disponibles para operar</small></div></article>
        <article className="cv-stat cv-stat-yellow"><span className="cv-stat-icon">🥐</span><div><strong>{producto.length}</strong><b>Categorías de productos</b><small>Clasificación comercial</small></div></article>
        <article className="cv-stat cv-stat-purple"><span className="cv-stat-icon">🌾</span><div><strong>{ingrediente.length}</strong><b>Categorías de ingredientes</b><small>Materias primas y empaques</small></div></article>
      </section>

      <section className="cv-panel cv-branches">
        <div className="cv-section-head"><span className="cv-section-icon">🏬</span><div><h2>Sucursales</h2><p>Gestiona las ubicaciones de venta, compras y producción.</p></div><span className="cv-count">{listaSucursales.length} registradas</span></div>
        <div className="cv-branch-grid">
          {listaSucursales.map(s => (
            <article className="cv-branch" key={s.id}>
              <span className="cv-branch-symbol" aria-hidden="true">🏪</span>
              <div className="cv-branch-main"><strong>{s.nombre}</strong><span className={`cv-status ${s.activa ? 'cv-on' : 'cv-off'}`}>● {s.activa ? 'Activa' : 'Desactivada'}</span></div>
              <form action={cambiarEstadoSucursal}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="activa" value={s.activa ? '0' : '1'} /><button type="submit" className={s.activa ? 'cv-danger' : 'cv-outline'}>{s.activa ? 'Desactivar' : 'Reactivar'}</button></form>
            </article>
          ))}
          {!listaSucursales.length && <p className="cv-empty">No hay sucursales registradas.</p>}
        </div>
        <div className="cv-create" id="cv-nueva-sucursal"><div><h3>＋ Agregar sucursal</h3><p>Al crearla, PANIA también intentará registrar su almacén general.</p></div><form action={crearSucursal}><label htmlFor="cv-sucursal-nombre">Nombre de la sucursal</label><div className="cv-inline"><input id="cv-sucursal-nombre" name="nombre" required maxLength={120} placeholder="Ej. Sucursal Centro" /><button type="submit">Agregar sucursal</button></div></form></div>
      </section>

      <section className="cv-category-grid" aria-label="Administración de categorías">
        {grupos.map(g => <article className="cv-panel cv-category" key={g.tipo}>
          <div className="cv-section-head"><span className="cv-section-icon">{g.icono}</span><div><h2>{g.titulo}</h2><p>{g.descripcion}</p></div><span className="cv-count">{g.lista.length}</span></div>
          <div className="cv-category-list">{g.lista.map((c, i) => <div className="cv-category-item" key={c.id}>
            <span className={`cv-cat-icon cv-cat-${i % 5}`} aria-hidden="true">{g.tipo === 'producto' ? '🥖' : '🌿'}</span>
            <strong>{c.nombre}</strong>
            <details className="cv-remove"><summary aria-label={`Opciones de ${c.nombre}`} title={`Opciones de ${c.nombre}`}>⋯</summary><div className="cv-remove-content"><p>¿Quitar «{c.nombre}»? Solo se podrá eliminar si no tiene registros relacionados.</p><form action={quitarCategoria}><input type="hidden" name="id" value={c.id} /><button type="submit" className="cv-danger">Confirmar eliminación</button></form></div></details>
          </div>)}{!g.lista.length && <p className="cv-empty">Aún no hay categorías de este tipo.</p>}</div>
          <form className="cv-category-form" action={crearCategoria}><input type="hidden" name="tipo" value={g.tipo} /><label htmlFor={`cv-categoria-${g.tipo}`}>Nueva categoría</label><div className="cv-inline"><input id={`cv-categoria-${g.tipo}`} name="nombre" required maxLength={120} placeholder={g.tipo === 'producto' ? 'Ej. Pan artesanal' : 'Ej. Semillas'} /><button type="submit">＋ Agregar</button></div></form>
        </article>)}
      </section>
      <aside className="cv-note">🔒 Solo administradores pueden cambiar esta configuración. Las sucursales existentes conservan sus registros; las categorías relacionadas con productos o ingredientes no se eliminan si la base de datos lo impide.</aside>
    </main>
  );
}
