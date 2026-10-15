-- PANIA 1.6.0 — Motor determinista de alertas
create table if not exists alertas_config(
 empresa_id uuid primary key references empresas(id) on delete cascade,
 dias_cliente_riesgo int not null default 30,
 roi_minimo numeric(8,4) not null default 0,
 margen_seguridad_minimo numeric(14,2) not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table alertas_config enable row level security;
create policy alertas_config_select on alertas_config for select using(empresa_id=mi_empresa_id());
create policy alertas_config_write on alertas_config for all using(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador')) with check(empresa_id=mi_empresa_id() and mi_rol() in ('dueno','administrador'));

create or replace view v_alertas_pania as
select empresa_id,sucursal_id,'inventario_bajo'::text tipo,'alta'::text severidad,
'Ingrediente bajo mínimo: '||nombre titulo,
'Stock actual '||round(stock,2)||' '||unidad||'; mínimo '||round(stock_minimo,2)||' '||unidad detalle,
null::numeric valor_afectado,'Revisar compras y reabastecer antes de afectar producción.'::text accion
from v_stock_ingredientes where bajo_minimo
union all
select empresa_id,sucursal_id,'stock_negativo','critica','Stock negativo: '||nombre,
'Existencia calculada: '||round(stock,2),abs(stock)::numeric,'Revisar movimientos y corregir la causa; PANIA no modifica el stock directamente.'
from v_stock_ingredientes where stock<0
union all
select empresa_id,sucursal_id,'fuga_utilidad',case when fugas_medibles>utilidad_bruta*.20 then 'critica' else 'alta' end,
'Fugas de utilidad detectadas', 'Merma, insumos o margen están erosionando el resultado.',fugas_medibles,
'Abrir Radar de Utilidad y corregir primero la fuga de mayor impacto.'
from v_radar_utilidad_dia where fugas_medibles>0
union all
select empresa_id,sucursal_id,'flujo_negativo','alta','Flujo de efectivo negativo',
'Las salidas del día superaron las entradas.',abs(flujo_neto),'Revisar Caja/Bancos y compromisos inmediatos de pago.'
from v_flujo_efectivo_dia where flujo_neto<0
union all
select empresa_id,sucursal_id,'presupuesto_excedido','alta','Presupuesto excedido',
'El gasto real superó el presupuesto del periodo.',abs(disponible),'Revisar la categoría y contener gasto no esencial.'
from v_presupuesto_vs_real where disponible<0
union all
select empresa_id,sucursal_id,'bajo_equilibrio','alta','Ventas por debajo del punto de equilibrio',
'El mes aún no cubre la estructura fija.',abs(margen_seguridad),'Priorizar ventas de mayor margen y revisar gasto fijo.'
from v_punto_equilibrio_mes where margen_seguridad<0
union all
select empresa_id,null::uuid,'cliente_riesgo','media','Cliente por recuperar: '||nombre,
coalesce(dias_sin_comprar,0)||' días sin compra.',gasto_acumulado,'Considerar una acción de recuperación basada en su historial real.'
from v_clientes_recurrencia where compras>0 and dias_sin_comprar>30
union all
select empresa_id,null::uuid,'roi_negativo','alta','Campaña con ROI negativo: '||nombre,
'La inversión atribuida supera los ingresos atribuidos.',gasto_real-ingresos_atribuidos,'Revisar o pausar la campaña antes de aumentar inversión.'
from v_campanas_roi where gasto_real>0 and roi<0;
