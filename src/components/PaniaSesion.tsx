'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { crearClienteNavegador } from '@/lib/supabase/browser';
import type { Perfil } from '@/lib/sesion';
import type { PermisosPersonalizados } from '@/lib/roles';

type ContextoPania = {
  cargando: boolean;
  user: User | null;
  perfil: Perfil | null;
  empresa: { id: string; nombre: string } | null;
  permisos: PermisosPersonalizados | null;
  suscripcionVigente: boolean;
};

const Contexto = createContext<ContextoPania | null>(null);

const inicial: ContextoPania = {
  cargando: true,
  user: null,
  perfil: null,
  empresa: null,
  permisos: null,
  suscripcionVigente: false,
};

export function PaniaSesion({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<ContextoPania>(inicial);

  useEffect(() => {
    const supabase = crearClienteNavegador();
    let activo = true;

    async function cargar() {
      setEstado((anterior) => ({ ...anterior, cargando: true }));

      try {
        const { data: auth, error: errorAuth } =
          await supabase.auth.getUser();

        if (errorAuth || !auth.user) {
          if (activo) setEstado({ ...inicial, cargando: false });
          return;
        }

        const user = auth.user;

        const { data: perfil, error: errorPerfil } = await supabase
          .from('perfiles')
          .select('id,empresa_id,sucursal_id,nombre,rol,activo,rol_empresa_id')
          .eq('id', user.id)
          .maybeSingle<Perfil>();

        if (errorPerfil || !perfil || !perfil.activo) {
          if (activo) {
            setEstado({
              ...inicial,
              cargando: false,
              user,
            });
          }
          return;
        }

        const [empresaRes, rolesRes, suscripcionRes] = await Promise.all([
          supabase
            .from('empresas')
            .select('id,nombre')
            .eq('id', perfil.empresa_id)
            .maybeSingle<{ id: string; nombre: string }>(),

          perfil.rol_empresa_id
            ? supabase
                .from('roles_empresa')
                .select('permisos,activo')
                .eq('id', perfil.rol_empresa_id)
                .eq('empresa_id', perfil.empresa_id)
                .maybeSingle<{
                  permisos: PermisosPersonalizados;
                  activo: boolean;
                }>()
            : Promise.resolve({ data: null, error: null }),

          supabase
            .from('suscripciones_pania')
            .select('estado,modalidad,prueba_hasta,periodo_fin')
            .eq('empresa_id', perfil.empresa_id)
            .maybeSingle(),
        ]);

        const s = suscripcionRes.data;
        const ahora = Date.now();

        const vigente = !!s && (
          s.estado === 'prueba'
            ? !!s.prueba_hasta &&
              Date.parse(s.prueba_hasta) >= ahora
            : s.estado === 'activa' &&
              (
                s.modalidad === 'contado' ||
                (!s.periodo_fin ||
                  Date.parse(s.periodo_fin) >= ahora)
              )
        );

        if (activo) {
          setEstado({
            cargando: false,
            user,
            perfil,
            empresa: empresaRes.data,
            permisos: rolesRes.data?.activo
              ? rolesRes.data.permisos ?? {}
              : null,
            suscripcionVigente: vigente,
          });
        }
      } catch {
        if (activo) setEstado({ ...inicial, cargando: false });
      }
    }

    void cargar();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      setTimeout(() => {
        if (activo) void cargar();
      }, 0);
    });

    return () => {
      activo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Contexto.Provider value={estado}>
      {children}
    </Contexto.Provider>
  );
}

export function usarSesionPania() {
  const contexto = useContext(Contexto);

  if (!contexto) {
    throw new Error('Falta PaniaSesion en el árbol de componentes');
  }

  return contexto;
}
