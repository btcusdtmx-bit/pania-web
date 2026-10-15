import { crearClienteServidor } from '@/lib/supabase/server';
import { requerirSesion } from '@/lib/sesion';
import PlanesVisual from './PlanesVisual';
import './plataforma.css';

type Plan={id:string;nombre:string;precio_mensual:number;precio_anual:number|null;max_sucursales:number|null;max_usuarios:number|null};
type Sus={estado:string;prueba_hasta:string|null;periodo_fin:string|null;plan_id:string};

export default async function Plataforma(){
 const {perfil}=await requerirSesion();
 if(perfil.rol!=='dueno') return <section className="panel"><h1>Suscripción PANIA</h1><p>Solo el dueño puede administrar el plan de PANIA.</p></section>;
 const sb=await crearClienteServidor();
 const [planesRes,susRes,sucRes,usuariosRes,productosRes,recetasRes]=await Promise.all([
  sb.from('planes_pania').select('id,nombre,precio_mensual,precio_anual,max_sucursales,max_usuarios').eq('activo',true).order('precio_mensual').returns<Plan[]>(),
  sb.from('suscripciones_pania').select('estado,prueba_hasta,periodo_fin,plan_id').maybeSingle<Sus>(),
  sb.from('sucursales').select('id',{count:'exact',head:true}),
  sb.from('perfiles').select('id',{count:'exact',head:true}),
  sb.from('productos').select('id',{count:'exact',head:true}),
  sb.from('recetas').select('id',{count:'exact',head:true}),
 ]);
 const planes=planesRes.data??[];
 const sus=susRes.data;
 const actual=planes.find(p=>p.id===sus?.plan_id);
 return <PlanesVisual planes={planes} sus={sus??null} actual={actual??null} counts={{sucursales:sucRes.error?null:sucRes.count,usuarios:usuariosRes.error?null:usuariosRes.count,productos:productosRes.error?null:productosRes.count,recetas:recetasRes.error?null:recetasRes.count}} error={planesRes.error?.message??susRes.error?.message??null}/>;
}
