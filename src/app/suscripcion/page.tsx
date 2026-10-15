import Link from 'next/link';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';

export default async function PaginaSuscripcion() {
  const supabase = await crearClienteServidor();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('empresa_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!perfil) redirect('/bienvenida');

  const { data: empresa } = await supabase
    .from('empresas')
    .select('nombre')
    .eq('id', perfil.empresa_id)
    .maybeSingle();

  const { data: suscripcion } = await supabase
    .from('suscripciones_pania')
    .select('estado, prueba_hasta, periodo_fin')
    .eq('empresa_id', perfil.empresa_id)
    .maybeSingle();

  return (
    <main style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      padding: 24,
      background: '#f7f5ef',
      color: '#292524'
    }}>
      <section style={{
        width: '100%',
        maxWidth: 480,
        padding: 32,
        borderRadius: 20,
        background: '#fff',
        boxShadow: '0 8px 32px #00000010'
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 800 }}>PANIA</h1>
        <h2 style={{ fontSize: 22, marginTop: 20 }}>
          Estado de tu suscripción
        </h2>

        <p style={{ marginTop: 12 }}>
          Panadería: <strong>{empresa?.nombre ?? 'Mi negocio'}</strong>
        </p>

        <p style={{ marginTop: 8 }}>
          Estado: <strong>{suscripcion?.estado ?? 'Sin suscripción'}</strong>
        </p>

        <p style={{ marginTop: 16, lineHeight: 1.6 }}>
          Si tu periodo gratuito terminó, puedes solicitar
          la activación de tu plan para continuar utilizando PANIA.
          Tus datos permanecen guardados.
        </p>

        <Link
          href="/login"
          style={{
            display: 'inline-block',
            marginTop: 24,
            color: '#78512d',
            fontWeight: 700
          }}
        >
          Volver al inicio de sesión
        </Link>
      </section>
    </main>
  );
}
