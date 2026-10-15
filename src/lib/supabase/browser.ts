'use client';

import { createBrowserClient } from '@supabase/ssr';

export function crearClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error('Falta configurar la conexión pública con Supabase');
  }

  return createBrowserClient(url, anon);
}
