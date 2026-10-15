import './usuarios.css';
import { Aviso } from '@/components/Aviso';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';
import { ROLES, etiquetaRol, MODULOS_EDITABLES, type Rol } from '@/lib/roles';
import { requerirAdmin } from '@/lib/sesion';
import { invitarUsuario, cambiarUsuario, cambiarEstadoUsuario, crearRolPersonalizado, cambiarEstadoRol } from './actions';

type Fila = { id: string; nombre: string; rol: string; rol_empresa_id:string|null; sucursal_id: string | null; activo: boolean };
type RolEmpresa={id:string;nombre:string;descripcion:string|null;rol_base:Rol;activo:boolean};

export default async function Usuarios({ searchParams }: { searchParams: Promise<{ [k: string]: string | undefined }> }) {
  const { perfil } = await requerirAdmin();
  const q = await searchParams;
  const supabase = await crearClienteServidor();

  const [{ data: filas }, { data: sucursales }, {data: rolesEmpresa}] = await Promise.all([
    supabase.from('perfiles').select('id, nombre, rol, rol_empresa_id, sucursal_id, activo').order('nombre').returns<Fila[]>(),
    supabase.from('sucursales').select('id, nombre, activa').order('nombre').returns<{ id: string; nombre: string; activa: boolean }[]>(),
    supabase.from('roles_empresa').select('id,nombre,descripcion,rol_base,activo').order('nombre').returns<RolEmpresa[]>(),
  ]);
  const personas = filas ?? [];
  const lasSucursales = sucursales ?? [];
  const nombreSucursal = (id: string | null) => (id ? lasSucursales.find((s) => s.id === id)?.nombre ?? '—' : 'Todas');

  // Los correos viven en Supabase Auth; se consultan con la clave de servicio.
  const correos = new Map<string, string>();
  try {
    const { data } = await crearClienteAdmin().auth.admin.listUsers({ perPage: 1000 });
    data?.users.forEach((u) => u.email && correos.set(u.id, u.email));
  } catch {
    // Si falta la clave de servicio la lista se muestra sin correos.
  }

  const personalizados=rolesEmpresa??[];
  const rolesInvitables = ROLES.filter((r) => r.valor !== 'dueno' || perfil.rol === 'dueno');

  const activos=personas.filter(p=>p.activo).length;
  const inactivos=personas.length-activos;
  const rolesActivos=personalizados.filter(r=>r.activo).length;
  return (
    <main className="uv">
      <header className="cabecera uv-head">
        <h1>👥 Usuarios y permisos</h1>
        <p>Quién puede entrar y qué puede hacer. Quien tenga una sucursal asignada solo ve esa sucursal.</p>
      </header>
      <Aviso error={q.error} ok={q.ok} />
      <div className="uv-kpis">
        <article className="uv-kpi uv-green"><span>👥</span><div><strong>{personas.length}</strong><b>Integrantes</b><small>Equipo registrado</small></div></article>
        <article className="uv-kpi uv-blue"><span>✓</span><div><strong>{activos}</strong><b>Accesos activos</b><small>Usuarios habilitados</small></div></article>
        <article className="uv-kpi uv-gold"><span>🔐</span><div><strong>{rolesActivos}</strong><b>Roles personalizados</b><small>Plantillas activas</small></div></article>
        <article className="uv-kpi uv-rose"><span>⏸</span><div><strong>{inactivos}</strong><b>Accesos desactivados</b><small>Usuarios sin acceso activo</small></div></article>
      </div>
      <div className="uv-layout">


      <section className="panel uv-info">
        <h2>🛡️ Perfiles preconfigurados</h2>
        <p className="vacio">Elige un rol y PANIA limita menú, páginas, acciones y datos. Caja/Ventas no ve costos, gastos ni finanzas; Producción no ve dinero; Compras no ve utilidad; Contabilidad sí ve la información financiera; Administrador y Dueño concentran la operación autorizada.</p>
      </section>

      <section className="panel uv-invite" id="invitar">
        <h2>✉️ Invitar a alguien</h2>
        <form className="campos" action={invitarUsuario}>
          <div className="fila">
            <label>Correo
              <input name="email" type="email" required />
            </label>
            <label>Nombre
              <input name="nombre" required />
            </label>
          </div>
          <div className="fila">
            <label>Rol
              <select name="rol" defaultValue="caja">
                {rolesInvitables.map((r) => (
                  <option key={r.valor} value={r.valor}>{r.etiqueta}: {r.descripcion}</option>
                ))}
              </select>
            </label>
            <label>Rol personalizado (opcional)
              <select name="rol_empresa_id" defaultValue=""><option value="">Usar plantilla estándar</option>{personalizados.filter(r=>r.activo).map(r=><option key={r.id} value={r.id}>{r.nombre} · base {etiquetaRol(r.rol_base)}</option>)}</select>
            </label>
            <label>Sucursal
              <select name="sucursal_id" defaultValue="">
                <option value="">Todas las sucursales</option>
                {lasSucursales.filter((s) => s.activa).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </label>
          </div>
          <div><button type="submit">Enviar invitación</button></div>
        </form>
      </section>


      <section className="panel uv-roles">
        <h2>🔐 Roles personalizados</h2>
        <p className="vacio">Un rol personalizado parte de una plantilla y sólo puede quitar permisos. Nunca puede ampliar lo permitido por su rol base.</p>
        <form className="campos" action={crearRolPersonalizado}>
          <div className="fila"><label>Nombre<input name="nombre" required placeholder="Ej. Cajero turno noche"/></label><label>Plantilla base<select name="rol_base" defaultValue="caja">{ROLES.filter(r=>r.valor!=='dueno').map(r=><option key={r.valor} value={r.valor}>{r.etiqueta}</option>)}</select></label></div>
          <label>Descripción<input name="descripcion" placeholder="Opcional"/></label>
          <details className="uv-permissions"><summary>Configurar permisos por módulo <small>Seleccionados = conservar los permisos permitidos por la plantilla base</small></summary><div className="tabla-caja"><table><thead><tr><th>Módulo</th><th>Ver</th><th>Crear</th><th>Modificar</th><th>Autorizar</th></tr></thead><tbody>{MODULOS_EDITABLES.map(({modulo,etiqueta})=><tr key={modulo}><td>{etiqueta}</td>{(['ver','crear','modificar','autorizar'] as const).map(a=><td key={a}><input type="checkbox" name={`${modulo}_${a}`} value="1" defaultChecked /></td>)}</tr>)}</tbody></table></div></details>
          <button type="submit">Crear rol personalizado</button>
        </form>
        {!!personalizados.length&&<div className="tabla-caja"><table><thead><tr><th>Rol</th><th>Base</th><th>Estado</th><th></th></tr></thead><tbody>{personalizados.map(r=><tr key={r.id}><td><strong>{r.nombre}</strong><div>{r.descripcion??''}</div></td><td>{etiquetaRol(r.rol_base)}</td><td>{r.activo?'Activo':'Inactivo'}</td><td><form action={cambiarEstadoRol}><input type="hidden" name="id" value={r.id}/><input type="hidden" name="activo" value={r.activo?'0':'1'}/><button className="secundario chico">{r.activo?'Desactivar':'Reactivar'}</button></form></td></tr>)}</tbody></table></div>}
      </section>
      </div>
      <section className="panel uv-team">
        <h2>👥 Equipo</h2>
        <div className="tabla-caja">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Rol y sucursal</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {personas.map((p) => {
                const yo = p.id === perfil.id;
                const intocable = yo || (p.rol === 'dueno' && perfil.rol !== 'dueno');
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.nombre}</strong>{yo && ' (tú)'}
                      <div style={{ color: 'var(--apagado)', fontSize: '.88rem' }}>{correos.get(p.id) ?? ''}</div>
                    </td>
                    <td>
                      {intocable ? (
                        <>{etiquetaRol(p.rol)} · {nombreSucursal(p.sucursal_id)}</>
                      ) : (
                        <form className="acciones" action={cambiarUsuario}>
                          <input type="hidden" name="id" value={p.id} />
                          <select name="rol" defaultValue={p.rol} aria-label={`Rol de ${p.nombre}`}>
                            {ROLES.filter((r) => r.valor !== 'dueno' || perfil.rol === 'dueno').map((r) => (
                              <option key={r.valor} value={r.valor}>{r.etiqueta}</option>
                            ))}
                          </select>
                          <select name="rol_empresa_id" defaultValue={p.rol_empresa_id ?? ''} aria-label={`Rol personalizado de ${p.nombre}`}><option value="">Plantilla estándar</option>{personalizados.filter(r=>r.activo&&r.rol_base===p.rol).map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}</select>
                          <select name="sucursal_id" defaultValue={p.sucursal_id ?? ''} aria-label={`Sucursal de ${p.nombre}`}>
                            <option value="">Todas</option>
                            {lasSucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                          </select>
                          <button type="submit" className="secundario chico">Guardar</button>
                        </form>
                      )}
                    </td>
                    <td>
                      <span className={`etiqueta-estado ${p.activo ? 'activo' : 'inactivo'}`}>{p.activo ? 'Activo' : 'Desactivado'}</span>
                    </td>
                    <td>
                      {!intocable && (
                        <form action={cambiarEstadoUsuario}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="activo" value={p.activo ? '0' : '1'} />
                          <button type="submit" className={`chico ${p.activo ? 'peligro' : 'secundario'}`}>
                            {p.activo ? 'Desactivar' : 'Reactivar'}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
