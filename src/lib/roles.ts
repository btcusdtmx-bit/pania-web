export type Rol = 'dueno'|'administrador'|'contador'|'encargado'|'produccion'|'compras'|'caja'|'marketing'|'consulta';
export type AccionPermiso = 'ver'|'crear'|'modificar'|'autorizar';
export type Modulo = 'inicio'|'ventas'|'produccion'|'inventario'|'compras'|'finanzas'|'gastos'|'presupuestos'|'decisiones'|'radar'|'alertas'|'proyecciones'|'simulador'|'clientes'|'marketing'|'productos'|'ingredientes'|'recetas'|'usuarios'|'configuracion'|'auditoria'|'plataforma'|'asistente';
export type PermisosPersonalizados = Partial<Record<Modulo, Partial<Record<AccionPermiso, boolean>>>>;

export const ROLES:{valor:Rol;etiqueta:string;descripcion:string}[]=[
{valor:'dueno',etiqueta:'Dueño',descripcion:'Control completo del negocio.'},{valor:'administrador',etiqueta:'Administrador',descripcion:'Administra operación y equipo.'},{valor:'contador',etiqueta:'Contabilidad',descripcion:'Finanzas, compras y consulta operativa.'},{valor:'encargado',etiqueta:'Encargado',descripcion:'Opera la sucursal sin administración sensible.'},{valor:'produccion',etiqueta:'Producción',descripcion:'Producción, recetas operativas e inventario sin finanzas.'},{valor:'compras',etiqueta:'Compras',descripcion:'Compras, proveedores e insumos.'},{valor:'caja',etiqueta:'Caja / Ventas',descripcion:'Punto de venta y clientes básicos, sin costos ni finanzas.'},{valor:'marketing',etiqueta:'Marketing',descripcion:'Clientes, campañas y resultados atribuibles.'},{valor:'consulta',etiqueta:'Consulta',descripcion:'Lectura operativa autorizada.'}];
export const etiquetaRol=(r:string)=>ROLES.find(x=>x.valor===r)?.etiqueta??r;
export const esAdmin=(r:string|null|undefined)=>r==='dueno'||r==='administrador';

const TODOS:AccionPermiso[]=['ver','crear','modificar','autorizar'];
const V:AccionPermiso[]=['ver']; const VC:AccionPermiso[]=['ver','crear']; const VCM:AccionPermiso[]=['ver','crear','modificar'];
export const MATRIZ_BASE:Record<Rol,Partial<Record<Modulo,AccionPermiso[]>>>={
 dueno:Object.fromEntries((['inicio','ventas','produccion','inventario','compras','finanzas','gastos','presupuestos','decisiones','radar','alertas','proyecciones','simulador','clientes','marketing','productos','ingredientes','recetas','usuarios','configuracion','auditoria','plataforma','asistente'] as Modulo[]).map(m=>[m,TODOS])),
 administrador:Object.fromEntries((['inicio','ventas','produccion','inventario','compras','finanzas','gastos','presupuestos','decisiones','radar','alertas','proyecciones','simulador','clientes','marketing','productos','ingredientes','recetas','usuarios','configuracion','auditoria','asistente'] as Modulo[]).map(m=>[m,TODOS])),
 contador:{inicio:V,ventas:V,produccion:V,inventario:V,compras:VCM,finanzas:V,gastos:VCM,presupuestos:V,decisiones:V,radar:V,alertas:V,proyecciones:V,simulador:V,clientes:V,marketing:V,productos:V,ingredientes:V,recetas:V,auditoria:V},
 encargado:{inicio:V,ventas:VCM,produccion:VCM,inventario:VCM,alertas:V,clientes:VCM,productos:V,ingredientes:V,recetas:V},
 produccion:{inicio:V,produccion:VCM,inventario:V,productos:V,ingredientes:V,recetas:V},
 compras:{inicio:V,inventario:V,compras:VCM,productos:V,ingredientes:VCM},
 caja:{inicio:V,ventas:VCM,clientes:VC,productos:V},
 marketing:{inicio:V,clientes:VCM,marketing:VCM},
 consulta:{inicio:V,ventas:V,produccion:V,inventario:V,productos:V,ingredientes:V}
};

export function tienePermisoBase(rol:string,modulo:Modulo,accion:AccionPermiso='ver'){
 const lista=MATRIZ_BASE[rol as Rol]?.[modulo]??[]; return lista.includes(accion);
}
// Un rol personalizado nunca amplía su plantilla base: sólo puede conservar o quitar permisos.
export function tienePermiso(rol:string,modulo:Modulo,accion:AccionPermiso='ver',personalizados?:PermisosPersonalizados|null){
 if(!tienePermisoBase(rol,modulo,accion)) return false;
 const valor=personalizados?.[modulo]?.[accion]; return valor!==false;
}
export const MODULOS_EDITABLES:{modulo:Modulo;etiqueta:string}[]=[
 ['ventas','Ventas / POS'],['produccion','Producción'],['inventario','Inventario'],['compras','Compras'],['finanzas','Finanzas'],['gastos','Gastos'],['presupuestos','Presupuestos'],['clientes','Clientes'],['marketing','Marketing'],['productos','Productos'],['ingredientes','Ingredientes'],['recetas','Recetas'],['usuarios','Usuarios'],['configuracion','Configuración'],['auditoria','Auditoría']
].map(([modulo,etiqueta])=>({modulo:modulo as Modulo,etiqueta}));

export type MenuItem={href:string;etiqueta:string;icono?:string;modulo:Modulo}; export type MenuGrupo={grupo:string;items:MenuItem[]};
export const MENU_GRUPOS:MenuGrupo[]=[
 {grupo:'Principal',items:[{href:'/',etiqueta:'Inicio',icono:'⌂',modulo:'inicio'}]},
 {grupo:'Operar',items:[{href:'/ventas',etiqueta:'Punto de venta',icono:'▣',modulo:'ventas'},{href:'/produccion',etiqueta:'Producción',icono:'◒',modulo:'produccion'},{href:'/inventario',etiqueta:'Inventario',icono:'□',modulo:'inventario'},{href:'/compras',etiqueta:'Compras',icono:'↓',modulo:'compras'}]},
 {grupo:'Dinero',items:[{href:'/finanzas',etiqueta:'Finanzas',icono:'$',modulo:'finanzas'},{href:'/gastos',etiqueta:'Gastos',icono:'−',modulo:'gastos'},{href:'/presupuestos',etiqueta:'Presupuesto',icono:'≋',modulo:'presupuestos'}]},
 {grupo:'Analizar',items:[{href:'/asistente',etiqueta:'Asistente IA',icono:'✦',modulo:'asistente'},{href:'/decisiones',etiqueta:'Decisiones',icono:'✦',modulo:'decisiones'},{href:'/radar',etiqueta:'Radar de utilidad',icono:'◎',modulo:'radar'},{href:'/alertas',etiqueta:'Alertas',icono:'!',modulo:'alertas'},{href:'/proyecciones',etiqueta:'Proyecciones',icono:'↗',modulo:'proyecciones'},{href:'/simulador',etiqueta:'¿Qué pasa si?',icono:'◇',modulo:'simulador'}]},
 {grupo:'Más',items:[{href:'/clientes',etiqueta:'Clientes',icono:'○',modulo:'clientes'},{href:'/marketing',etiqueta:'Marketing',icono:'◉',modulo:'marketing'},{href:'/productos',etiqueta:'Productos',icono:'◇',modulo:'productos'},{href:'/ingredientes',etiqueta:'Ingredientes',icono:'•',modulo:'ingredientes'},{href:'/recetas',etiqueta:'Recetas y costos',icono:'≡',modulo:'recetas'},{href:'/usuarios',etiqueta:'Usuarios',icono:'♙',modulo:'usuarios'},{href:'/configuracion',etiqueta:'Configuración',icono:'⚙',modulo:'configuracion'},{href:'/auditoria',etiqueta:'Auditoría',icono:'✓',modulo:'auditoria'},{href:'/plataforma',etiqueta:'Plan PANIA',icono:'◆',modulo:'plataforma'}]}
];
export function menuParaRol(rol:string,personalizados?:PermisosPersonalizados|null){return MENU_GRUPOS.map(g=>({...g,items:g.items.filter(i=>tienePermiso(rol,i.modulo,'ver',personalizados))})).filter(g=>g.items.length)}
export const RUTA_MODULO:Record<string,Modulo>={ventas:'ventas',produccion:'produccion',inventario:'inventario',compras:'compras',finanzas:'finanzas',gastos:'gastos',presupuestos:'presupuestos',decisiones:'decisiones',radar:'radar',alertas:'alertas',proyecciones:'proyecciones',simulador:'simulador',clientes:'clientes',marketing:'marketing',productos:'productos',ingredientes:'ingredientes',recetas:'recetas',usuarios:'usuarios',configuracion:'configuracion',auditoria:'auditoria',plataforma:'plataforma',asistente:'asistente'};
