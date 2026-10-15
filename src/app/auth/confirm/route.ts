import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { crearClienteServidor } from '@/lib/supabase/server';

// Destino de los enlaces de correo (invitación y confirmación de cuenta).
// Requiere que las plantillas de correo de Supabase apunten aquí; ver README.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const tipo = searchParams.get('type') as EmailOtpType | null;
  const siguiente = searchParams.get('next') ?? '/';
  const destino = siguiente.startsWith('/') && !siguiente.startsWith('//') ? siguiente : '/';

  if (tokenHash && tipo) {
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(destino, request.url));
  }
  return NextResponse.redirect(new URL('/login?error=' + encodeURIComponent('El enlace venció o ya se usó. Pide uno nuevo.'), request.url));
}
