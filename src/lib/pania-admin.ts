import 'server-only';
import { redirect } from 'next/navigation';
import { crearClienteServidor } from '@/lib/supabase/server';
import { crearClienteAdmin } from '@/lib/supabase/admin';

export async function requerirAdminPania(){
  const sb=await crearClienteServidor();
  const {data:{user}}=await sb.auth.getUser();
  if(!user) redirect('/login');
  const admin=crearClienteAdmin();
  const {data}=await admin.from('administradores_pania').select('user_id,activo').eq('user_id',user.id).eq('activo',true).maybeSingle();
  if(!data) redirect('/?error=Acceso%20reservado%20al%20Superadministrador%20PANIA');
  return {user,admin};
}
