import { redirect } from 'next/navigation';
import { Aviso } from '@/components/Aviso';
import { obtenerContexto } from '@/lib/sesion';
import { cerrarSesion } from '../login/actions';
import { registrarEmpresa } from './actions';

export default async function Bienvenida({ searchParams }: { searchParams: Promise<{ [k: string]: string | undefined }> }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect('/login');
  if (ctx.perfil) redirect('/');
  const q = await searchParams;
  const interes = String(ctx.user.user_metadata?.plan_interes ?? '');
  const plan = ['basico','negocio','multi'].includes(interes) ? interes : null;
  return (
    <main className="entrada">
      <div className="entrada-caja">
        <h1>Registra tu panadería</h1>
        {plan && <p>Plan seleccionado: <strong>PANIA {plan.charAt(0).toUpperCase()+plan.slice(1)}</strong>. La contratación y activación del plan se completarán por separado, sin cobros automáticos.</p>}
        <p>Con estos datos dejamos listo tu negocio. Después podrás agregar sucursales y a tu equipo.</p>
        <div className="panel">
          <Aviso error={q.error} />
          <form className="campos" action={registrarEmpresa}>
            <label>Nombre de la panadería
              <input name="empresa" required />
            </label>
            <label>Tu nombre
              <input name="nombre" autoComplete="name" required />
            </label>
            <label>Nombre de la primera sucursal
              <input name="sucursal" defaultValue="Principal" />
            </label>
            <label>RFC <small>Opcional</small>
              <input name="rfc" autoCapitalize="characters" />
            </label>
            <button type="submit">Crear mi panadería</button>
          </form>
        </div>
        <form action={cerrarSesion} className="cambio-modo">
          <button type="submit" className="secundario chico">Salir</button>
        </form>
      </div>
    </main>
  );
}
