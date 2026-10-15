'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { crearClienteNavegador } from '@/lib/supabase/browser';

export default function LoginCliente() {
  const router = useRouter();
  const params = useSearchParams();
  const registro = params.get('modo') === 'registro';
  const planParam = params.get('plan') ?? '';
  const plan = ['basico', 'negocio', 'multi'].includes(planParam)
    ? planParam
    : 'basico';

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [correcto, setCorrecto] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (cargando) return;

    const formulario = new FormData(evento.currentTarget);
    const email = String(formulario.get('email') ?? '').trim();
    const password = String(formulario.get('password') ?? '');

    setCargando(true);
    setMensaje('');
    setCorrecto(false);

    try {
      const supabase = crearClienteNavegador();

      if (registro) {
        if (password.length < 8) {
          throw new Error('La contraseña debe tener al menos 8 caracteres.');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { plan_interes: plan },
            emailRedirectTo: `${window.location.origin}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/auth/confirm`,
          },
        });

        if (error) throw error;

        if (!data.session) {
          setCorrecto(true);
          setMensaje('Revisa tu correo y confirma tu cuenta para continuar.');
          return;
        }

        router.push('/bienvenida');
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/');
      router.refresh();
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : 'No se pudo completar la operación.'
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="entrada">
      <div className="entrada-caja">
        <h1>{registro ? 'Comienza con PANIA' : 'Bienvenido a PANIA'}</h1>
        <p>
          {registro
            ? 'Crea tu cuenta para registrar tu panadería.'
            : 'Entra para ver cuánto vendes y cuánto ganas.'}
        </p>
        <div className="panel">
          {mensaje && (
            <p role="status" className={correcto ? 'aviso-ok' : 'aviso-error'}>
              {mensaje}
            </p>
          )}

          <form className="campos" onSubmit={enviar}>
            {registro && (
              <p>
                Plan elegido: <strong>PANIA {plan.charAt(0).toUpperCase() + plan.slice(1)}</strong>
              </p>
            )}

            <label>
              Correo
              <input name="email" type="email" autoComplete="email" required />
            </label>

            <label>
              Contraseña
              {registro && <small>Mínimo 8 caracteres</small>}
              <input
                name="password"
                type="password"
                minLength={registro ? 8 : undefined}
                autoComplete={registro ? 'new-password' : 'current-password'}
                required
              />
            </label>

            <button type="submit" disabled={cargando}>
              {cargando ? 'Procesando...' : registro ? 'Crear cuenta' : 'Entrar'}
            </button>
          </form>

          <p className="cambio-modo">
            {registro ? (
              <>¿Ya tienes cuenta? <Link href="/login">Entrar</Link></>
            ) : (
              <>¿Tu panadería aún no está registrada? <Link href="/inicio#planes">Ver planes y crear cuenta</Link></>
            )}
          </p>
          <p className="cambio-modo">
            <Link href="/inicio">← Conocer PANIA</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
