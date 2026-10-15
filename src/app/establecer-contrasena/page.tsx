import { redirect } from 'next/navigation';
import { Aviso } from '@/components/Aviso';
import { obtenerContexto } from '@/lib/sesion';
import { guardarContrasena } from './actions';

export default async function EstablecerContrasena({ searchParams }: { searchParams: Promise<{ [k: string]: string | undefined }> }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect('/login');
  const q = await searchParams;
  return (
    <main className="entrada">
      <div className="entrada-caja">
        <h1>Elige tu contraseña</h1>
        <p>La usarás cada vez que entres. Mínimo 8 caracteres.</p>
        <div className="panel">
          <Aviso error={q.error} />
          <form className="campos" action={guardarContrasena}>
            <label>Contraseña
              <input name="password" type="password" minLength={8} autoComplete="new-password" required />
            </label>
            <label>Repite la contraseña
              <input name="repetir" type="password" minLength={8} autoComplete="new-password" required />
            </label>
            <button type="submit">Guardar contraseña</button>
          </form>
        </div>
      </div>
    </main>
  );
}
