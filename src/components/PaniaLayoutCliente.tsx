'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';
import { Nav } from '@/components/Nav';
import { PanitoFlotante } from '@/components/PanitoFlotante';
import { PaniaSesion, usarSesionPania } from '@/components/PaniaSesion';
import { crearClienteNavegador } from '@/lib/supabase/browser';
import { etiquetaRol, menuParaRol } from '@/lib/roles';

function Estructura({ children }: { children: ReactNode }) {
  const router = useRouter();
  const {
    cargando,
    user,
    perfil,
    permisos,
    suscripcionVigente,
  } = usarSesionPania();

  const grupos = useMemo(
    () => perfil ? menuParaRol(perfil.rol, permisos) : [],
    [perfil, permisos]
  );

  const enlaces = grupos.flatMap(grupo => grupo.items);
  const tiene = (href: string) =>
    enlaces.some(enlace => enlace.href === href);

  const movil = [
    { h: '/', i: '⌂', t: 'Inicio' },
    ...(tiene('/ventas') ? [{ h: '/ventas', i: '▣', t: 'Vender' }] : []),
    ...(tiene('/produccion') ? [{ h: '/produccion', i: '◒', t: 'Producir' }] : []),
    ...(tiene('/compras') ? [{ h: '/compras', i: '↓', t: 'Comprar' }] : []),
    ...(tiene('/finanzas') ? [{ h: '/finanzas', i: '$', t: 'Dinero' }] : []),
    ...(tiene('/clientes') ? [{ h: '/clientes', i: '○', t: 'Clientes' }] : []),
  ].slice(0, 5);

  async function salir() {
    const supabase = crearClienteNavegador();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  if (cargando) {
    return <main className="entrada">Cargando PANIA...</main>;
  }

  if (!user) {
    return (
      <main className="entrada">
        <div className="panel">
          <h1>Inicia sesión</h1>
          <Link href="/login">Entrar a PANIA</Link>
        </div>
      </main>
    );
  }

  if (!perfil) {
    return (
      <main className="entrada">
        <div className="panel">
          <h1>Configura tu panadería</h1>
          <Link href="/bienvenida">Continuar</Link>
        </div>
      </main>
    );
  }

  if (!suscripcionVigente) {
    return (
      <main className="entrada">
        <div className="panel">
          <h1>Revisa tu suscripción</h1>
          <Link href="/suscripcion">Ver suscripción</Link>
        </div>
      </main>
    );
  }

  return (
    <div className="app">
      <aside className="lateral">
        <Link href="/" className="marca">
          <span className="marca-pan">PAN</span>
          <span className="marca-ia">IA</span>
          <small>Inteligencia para tu panadería</small>
        </Link>

        <Nav grupos={grupos} />

        <div className="yo">
          <div>
            <strong>{perfil.nombre}</strong>
            <span>{etiquetaRol(perfil.rol)}</span>
          </div>
          <button
            type="button"
            className="secundario chico"
            onClick={salir}
          >
            Salir
          </button>
        </div>
      </aside>

      <main className="contenido">{children}</main>

      <PanitoFlotante rol={perfil.rol} />

      <nav className="movil-nav">
        {movil.map((enlace, indice) => (
          <Link
            key={enlace.h}
            href={enlace.h}
            className={
              indice === 1 && enlace.h === '/ventas'
                ? 'movil-mas'
                : undefined
            }
          >
            {enlace.i}
            <small>{enlace.t}</small>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PaniaLayoutCliente({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <PaniaSesion>
      <Estructura>{children}</Estructura>
    </PaniaSesion>
  );
}
