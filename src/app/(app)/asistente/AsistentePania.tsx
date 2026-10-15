'use client';

import {FormEvent,KeyboardEvent,useEffect,useRef,useState} from 'react';

type M={rol:'usuario'|'pania';texto:string};

const accesos=[
 {icono:'📊',titulo:'Mis ventas',detalle:'Ingresos y rentabilidad',pregunta:'Resume ventas y rentabilidad'},
 {icono:'📦',titulo:'Inventario',detalle:'Existencias y faltantes',pregunta:'¿Qué productos tienen poco stock?'},
 {icono:'🥐',titulo:'Producción',detalle:'Qué revisar en producción',pregunta:'¿Qué debería revisar hoy en producción?'},
 {icono:'💡',titulo:'Recomendaciones',detalle:'Prioridades del negocio',pregunta:'¿Qué debería revisar hoy?'}
];

export function AsistentePania({empresa}:{empresa:string}){
 const saludo=`Hola. Soy el asistente de ${empresa}. Puedo analizar la información que PANIA me comparta en modo lectura.`;
 const [ms,setMs]=useState<M[]>([{rol:'pania',texto:saludo}]);
 const [q,setQ]=useState('');
 const [cargando,setCargando]=useState(false);
 const [error,setError]=useState('');
 const final=useRef<HTMLDivElement>(null);
 const textarea=useRef<HTMLTextAreaElement>(null);
 const pendiente=useRef(false);

 useEffect(()=>{final.current?.scrollIntoView({behavior:'smooth',block:'nearest'});},[ms,cargando]);

 const enviar=async(texto:string)=>{
  const pregunta=texto.trim();
  if(!pregunta||pendiente.current)return;

  pendiente.current=true;
  setError('');
  setMs(x=>[...x,{rol:'usuario',texto:pregunta}]);
  setQ('');
  setCargando(true);

  try{
   const r=await fetch('/api/asistente',{
    method:'POST',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({pregunta})
   });
   const j=await r.json();
   if(!r.ok){
    throw new Error(j.error||'No se pudo consultar PANIA.');
   }
   setMs(x=>[...x,{rol:'pania',texto:j.respuesta||'No encontré una respuesta disponible.'}]);
  }catch(e){
   const mensaje=e instanceof Error?e.message:'No pude consultar el motor inteligente de PANIA.';
   setError(mensaje);
   setMs(x=>[...x,{rol:'pania',texto:'No pude completar la consulta. Intenta nuevamente.'}]);
  }finally{
   pendiente.current=false;
   setCargando(false);
   textarea.current?.focus();
  }
 };

 const submit=(e:FormEvent)=>{
  e.preventDefault();
  void enviar(q);
 };

 const tecla=(e:KeyboardEvent<HTMLTextAreaElement>)=>{
  if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){
   e.preventDefault();
   void enviar(q);
  }
 };

 const nuevaConversacion=()=>{
  if(pendiente.current)return;
  setMs([{rol:'pania',texto:saludo}]);
  setQ('');
  setError('');
  textarea.current?.focus();
 };

 return <main className="asv3">
  <section className="asv3-bienvenida">
   <div className="asv3-bienvenida-texto">
    <span className="asv3-etiqueta">✦ INTELIGENCIA PANIA</span>
    <h2>¿Qué revisamos hoy?</h2>
    <p>Consulta la información de {empresa}, detecta situaciones importantes y recibe recomendaciones.</p>
   </div>
   <div className="asv3-mascota" aria-hidden="true">👨‍🍳</div>
  </section>

  <section className="asv3-accesos" aria-label="Consultas rápidas">
   {accesos.map(x=><button
    type="button"
    key={x.titulo}
    disabled={cargando}
    onClick={()=>void enviar(x.pregunta)}
    className="asv3-acceso">
    <span className="asv3-acceso-icono">{x.icono}</span>
    <strong>{x.titulo}</strong>
    <small>{x.detalle}</small>
    <span className="asv3-acceso-flecha">Consultar →</span>
   </button>)}
  </section>

  <section className="asv3-chat">
   <div className="asv3-chat-cabecera">
    <div className="asv3-chat-identidad">
     <span className="asv3-avatar">✦</span>
     <div><strong>Asistente PANIA</strong><small>Motor inteligente nativo · Solo lectura</small></div>
    </div>
    <button type="button" onClick={nuevaConversacion} disabled={cargando} className="asv3-nuevo">↻ Nueva conversación</button>
   </div>

   <div className="asv3-mensajes" aria-live="polite" aria-relevant="additions text">
    {ms.map((m,i)=><div key={i} className={'asv3-mensaje '+m.rol}>
     <span className="asv3-mensaje-avatar">{m.rol==='pania'?'✦':'👤'}</span>
     <div className="asv3-burbuja">
      <strong>{m.rol==='pania'?'PANIA':'Tú'}</strong>
      <p>{m.texto}</p>
     </div>
    </div>)}
    {cargando&&<div className="asv3-mensaje pania">
     <span className="asv3-mensaje-avatar">✦</span>
     <div className="asv3-burbuja"><strong>PANIA</strong><p>✦ Analizando la información disponible…</p></div>
    </div>}
    <div ref={final}/>
   </div>

   <form className="asv3-form" onSubmit={submit}>
    {error&&<p className="asv3-error" role="alert">{error}</p>}
    <div className="asv3-compositor">
     <textarea
      ref={textarea}
      value={q}
      onChange={e=>setQ(e.target.value)}
      onKeyDown={tecla}
      placeholder="Pregúntame sobre ventas, inventario, producción o tu negocio..."
      rows={2}
      disabled={cargando}
      aria-label="Pregunta para PANIA"
     />
     <button type="submit" disabled={cargando||!q.trim()}>{cargando?'Analizando…':'Enviar ➤'}</button>
    </div>
    <div className="asv3-pie">
     <span>Enter para enviar · Shift + Enter para otra línea</span>
     <span>🔒 Consulta segura · No ejecuta movimientos</span>
    </div>
   </form>
  </section>
 </main>;
}
