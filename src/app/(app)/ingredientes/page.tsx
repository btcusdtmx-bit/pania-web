import {Aviso} from '@/components/Aviso';
import {crearClienteServidor} from '@/lib/supabase/server';
import {requerirSesion} from '@/lib/sesion';
import IngredientesVisual from './IngredientesVisual';
import './ingredientes.css';
type I={id:string;nombre:string;categoria_id:string|null;tipo:string;unidad:string;stock_minimo:number;stock_maximo:number|null;activo:boolean};
type C={id:string;nombre:string};
type K={ingrediente_id:string;costo_unitario:number;vigente_desde:string};
export default async function Ingredientes({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){
 const {perfil}=await requerirSesion();
 if(['caja','marketing'].includes(perfil.rol))return <section className="panel"><h2>Sin acceso</h2><p>Tu rol no tiene acceso a costos de ingredientes.</p></section>;
 const q=await searchParams,sb=await crearClienteServidor();
 const [{data:ings,error:ei},{data:cats,error:ec},{data:costos,error:ek}]=await Promise.all([
  sb.from('ingredientes').select('id,nombre,categoria_id,tipo,unidad,stock_minimo,stock_maximo,activo').order('nombre').returns<I[]>(),
  sb.from('categorias').select('id,nombre').eq('tipo','ingrediente').order('nombre').returns<C[]>(),
  sb.from('ingrediente_costos').select('ingrediente_id,costo_unitario,vigente_desde').order('vigente_desde',{ascending:false}).returns<K[]>()
 ]);
 const ult=new Map<string,K>();for(const c of costos??[])if(!ult.has(c.ingrediente_id))ult.set(c.ingrediente_id,c);
 const rows=(ings??[]).map(i=>({...i,costo:ult.get(i.id)?.costo_unitario??null,fechaCosto:ult.get(i.id)?.vigente_desde??null}));
 const puede=['dueno','administrador','compras'].includes(perfil.rol);
 return <><Aviso error={q.error} ok={q.ok}/>{(ei||ec||ek)&&<div className="aviso error">No se pudo cargar toda la información de ingredientes. Actualiza la página o revisa la conexión.</div>}<IngredientesVisual ingredientes={rows} categorias={cats??[]} puedeEditar={puede} editarId={q.editar??null}/></>;
}
