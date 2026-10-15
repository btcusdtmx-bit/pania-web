import { requerirPermiso } from '@/lib/sesion';
import SimuladorCliente from './SimuladorCliente';
export default async function Simulador(){await requerirPermiso('simulador','ver');return <SimuladorCliente/>}
