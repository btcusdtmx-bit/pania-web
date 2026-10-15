import { crearClienteServidor } from '@/lib/supabase/server';
import { obtenerContexto } from '@/lib/sesion';
import { redirect } from 'next/navigation';
import AuditoriaVisual, { type EventoAuditoria } from './AuditoriaVisual';
import './auditoria.css';

type Registro = {
  id: number; usuario_id: string | null; ocurrido_en: string; operacion: string; tabla: string;
  valor_anterior: Record<string, unknown> | null; valor_nuevo: Record<string, unknown> | null;
};

const NOMBRES: Record<string, string> = {
  perfiles: 'Usuario', sucursales: 'Sucursal', almacenes: 'Almacén', categorias: 'Categoría',
  productos: 'Producto', ingredientes: 'Ingrediente', recetas: 'Receta', proveedores: 'Proveedor',
  compras: 'Compra', mermas: 'Merma', ventas: 'Venta', receta_detalle: 'Ingrediente de receta',
  ingrediente_costos: 'Costo de ingrediente',
};
const CAMPOS_SENSIBLES = /password|contrasena|contraseña|token|secret|api.?key|authorization|cookie|session|hash|salt|credencial|access.?key|refresh.?key|private.?key|correo|email|telefono|phone|direccion|address|rfc|curp|clabe|cuenta_bancaria/i;
const MAX_CAMPOS = 30;
function valorSeguro(valor: unknown): string {
  if (valor === null || valor === undefined) return 'Sin dato';
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  if (typeof valor === 'object') return '[Dato estructurado]';
  const texto = String(valor);
  return texto.length > 180 ? `${texto.slice(0, 180)}…` : texto;
}
function cambiosSeguros(registro: Registro) {
  const antes = registro.valor_anterior ?? {};
  const despues = registro.valor_nuevo ?? {};
  const llaves = Array.from(new Set([...Object.keys(antes), ...Object.keys(despues)]));
  return llaves.filter((campo) => !CAMPOS_SENSIBLES.test(campo) && !['empresa_id', 'id', 'creado_en', 'actualizado_en'].includes(campo))
    .filter((campo) => JSON.stringify(antes[campo]) !== JSON.stringify(despues[campo]))
    .slice(0, MAX_CAMPOS)
    .map((campo) => ({ campo, antes: valorSeguro(antes[campo]), despues: valorSeguro(despues[campo]) }));
}
function clasificar(registro: Registro): { nivel: 'revisar' | 'atencion' | 'informativo'; motivo: string } {
  const cambios = cambiosSeguros(registro);
  const campos = cambios.map((c) => c.campo);
  if (registro.tabla === 'perfiles' && campos.some((campo) => ['rol', 'activo', 'sucursal_id', 'rol_personalizado_id'].includes(campo))) {
    return { nivel: 'revisar', motivo: 'Cambio de acceso o permisos' };
  }
  if (registro.operacion === 'DELETE') return { nivel: 'revisar', motivo: 'Eliminación de registro' };
  if (registro.tabla === 'ingrediente_costos') return { nivel: 'atencion', motivo: 'Cambio en costos' };
  if (registro.tabla === 'mermas') return { nivel: 'atencion', motivo: 'Movimiento de merma' };
  if (registro.tabla === 'ventas' && registro.operacion === 'UPDATE' && campos.some((c) => /estado|cancel|total|importe|descuento|precio/i.test(c))) {
    return { nivel: 'atencion', motivo: 'Cambio sensible en venta' };
  }
  return { nivel: 'informativo', motivo: 'Registro de operación' };
}
export default async function Auditoria() {
  const ctx = await obtenerContexto();
  if (!ctx) redirect('/login');
  if (!ctx.perfil) redirect('/bienvenida');
  if (!['dueno', 'administrador', 'contador'].includes(ctx.perfil.rol)) redirect('/');

  const supabase = await crearClienteServidor();
  const [eventos, perfiles] = await Promise.all([
    supabase.from('auditoria').select('id, usuario_id, ocurrido_en, operacion, tabla, valor_anterior, valor_nuevo')
      .order('ocurrido_en', { ascending: false }).limit(100).returns<Registro[]>(),
    supabase.from('perfiles').select('id, nombre').returns<{ id: string; nombre: string }[]>(),
  ]);
  const nombres = new Map((perfiles.data ?? []).map((p) => [p.id, p.nombre]));
  const registros: EventoAuditoria[] = (eventos.data ?? []).map((r) => {
    const cambios = cambiosSeguros(r);
    const clasificacion = clasificar(r);
    const nombre = r.valor_nuevo?.nombre ?? r.valor_anterior?.nombre;
    return {
      id: r.id,
      fecha: r.ocurrido_en,
      usuario: r.usuario_id ? nombres.get(r.usuario_id) ?? 'Usuario no disponible' : 'Sistema / no identificado',
      modulo: NOMBRES[r.tabla] ?? r.tabla,
      tabla: r.tabla,
      operacion: r.operacion,
      titulo: typeof nombre === 'string' && !CAMPOS_SENSIBLES.test('nombre') ? valorSeguro(nombre) : `${NOMBRES[r.tabla] ?? r.tabla} #${r.id}`,
      cambios,
      ...clasificacion,
    };
  });
  return <AuditoriaVisual registros={registros} error={eventos.error?.message ?? null} />;
}
