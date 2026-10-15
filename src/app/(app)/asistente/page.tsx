import {requerirPermiso} from '@/lib/sesion';
import {AsistentePania} from './AsistentePania';
export default async function Asistente(){const {empresa}=await requerirPermiso('asistente');return <><header className="cabecera hero"><div><p className="eyebrow">INTELIGENCIA PANIA · SOLO LECTURA</p><h1>Asistente PANIA</h1><p>Pregunta por ventas, inventario, producción y situación del negocio. El motor analiza datos verificables, explica y recomienda; no modifica operaciones.</p></div></header><AsistentePania empresa={empresa?.nombre??'Mi panadería'}/></>}
