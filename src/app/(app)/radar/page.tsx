import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirSesion } from '@/lib/sesion';
import RadarVisual, {type RadarFila} from './RadarVisual';
import './radar.css';
type S={id:string;nombre:string};
export default async function Radar(){
 const {perfil}=await requerirSesion();
 if(!['dueno','administrador','contador'].includes(perfil.rol))return <section className="panel"><h2>Sin acceso</h2><p>El Radar contiene información de costos y rentabilidad.</p></section>;
 const sb=await crearClienteServidor();
 const inicio=Date.now();
 const [resultado,sucursales]=await Promise.all([
  sb.from('v_utilidad_operativa_dia').select('*').order('fecha',{ascending:false}).limit(60).returns<RadarFila[]>(),
  sb.from('sucursales').select('id,nombre').returns<S[]>()
 ]);
 console.info('[PANIA RADAR] Tiempo consulta:',Date.now()-inicio,'ms');
 if(resultado.error)console.error('[PANIA RADAR] Consulta:',resultado.error.message,resultado.error.code);
 if(sucursales.error)console.error('[PANIA RADAR] Sucursales:',sucursales.error.message,sucursales.error.code);
 const nombres=Object.fromEntries((sucursales.data??[]).map(x=>[x.id,x.nombre]));
 return <RadarVisual filas={resultado.data??[]} sucursales={nombres} error={resultado.error?.message}/>;
}
