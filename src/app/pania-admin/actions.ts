'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requerirAdminPania } from '@/lib/pania-admin';
const R='/pania-admin';
const t=(f:FormData,k:string)=>String(f.get(k)??'').trim();
const n=(f:FormData,k:string)=>Number(t(f,k)||0);
const volver=(tipo:'ok'|'error',m:string)=>redirect(`${R}?${tipo}=${encodeURIComponent(m)}`);

export async function guardarContrato(f:FormData){
 const {admin}=await requerirAdminPania();
 const empresa_id=t(f,'empresa_id'),plan_id=t(f,'plan_id'),modalidad=t(f,'modalidad'),estado=t(f,'estado');
 if(!empresa_id||!plan_id||!['mensual','anual','contado'].includes(modalidad)||!['prueba','activa','vencida','pausada','cancelada'].includes(estado)) volver('error','Datos comerciales incompletos.');
 const periodo_fin=t(f,'periodo_fin')||null,prueba_hasta=t(f,'prueba_hasta')||null,soporte_hasta=t(f,'soporte_hasta')||null;
 const payload:any={empresa_id,plan_id,modalidad,estado,precio_contratado:n(f,'precio_contratado')||null,periodo_fin:modalidad==='contado'?null:periodo_fin,prueba_hasta:estado==='prueba'?prueba_hasta:null,soporte_hasta:modalidad==='contado'?soporte_hasta:null,actualizado_en:new Date().toISOString(),proveedor_pago:'manual'};
 if(modalidad==='contado'&&estado==='activa') payload.licencia_comprada_en=new Date().toISOString();
 const {error}=await admin.from('suscripciones_pania').upsert(payload,{onConflict:'empresa_id'});
 if(error) volver('error',`No se pudo guardar: ${error.message}`);
 revalidatePath(R); volver('ok','Contrato actualizado.');
}

export async function registrarPago(f:FormData){
 const {user,admin}=await requerirAdminPania();
 const empresa_id=t(f,'empresa_id'),monto=n(f,'monto'),concepto=t(f,'concepto'),referencia=t(f,'referencia_externa')||null;
 if(!empresa_id||monto<=0) volver('error','Indica empresa y monto válido.');
 const {data:s}=await admin.from('suscripciones_pania').select('id').eq('empresa_id',empresa_id).maybeSingle();
 const {error}=await admin.from('pagos_pania').insert({empresa_id,suscripcion_id:s?.id??null,proveedor:'manual',referencia_externa:referencia,monto,moneda:'MXN',estado:'pagado',pagado_en:new Date().toISOString(),concepto:concepto||'Pago PANIA',registrado_por:user.id});
 if(error) volver('error',`No se pudo registrar el pago: ${error.message}`);
 revalidatePath(R); volver('ok','Pago registrado.');
}
