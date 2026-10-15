import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import AlertasVisual from './AlertasVisual';

export default async function Alertas(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador','encargado'].includes(perfil.rol))return <section className="panel"><h2>Sin acceso</h2></section>;
 const sb=await crearClienteServidor();
 const [{data:a},{data:s}]=await Promise.all([
  sb.from('v_alertas_pania').select('*'),
  sb.from('sucursales').select('id,nombre')
 ]);
 const sucursales:Record<string,string>={};
 for(const item of s??[])sucursales[item.id]=item.nombre;
 const prioridad:Record<string,number>={critica:0,alta:1,media:2,baja:3};
 const alertas=[...(a??[])].sort((x,y)=>(prioridad[x.severidad]??9)-(prioridad[y.severidad]??9)||Number(y.valor_afectado??0)-Number(x.valor_afectado??0));
 return <AlertasVisual alertas={alertas} sucursales={sucursales}/>;
}
