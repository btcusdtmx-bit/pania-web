'use client';

import {FormEvent, useState} from 'react';
import {usePathname} from 'next/navigation';

type Mensaje = {rol:'usuario'|'panito'; texto:string};

const modulos: Record<string,string> = {
  ventas:'Ventas', inventario:'Inventario',
  compras:'Compras', produccion:'Producción',
  recetas:'Recetas', finanzas:'Finanzas',
  clientes:'Clientes', marketing:'Marketing',
  asistente:'Asistente', presupuestos:'Presupuestos'
};

export function PanitoFlotante({rol}:{rol:string}) {
  const ruta = usePathname() || '/';
  const modulo = modulos[ruta.split('/')[1]] || 'Inicio';
  const autorizado = rol === 'dueno' || rol === 'administrador';
  const [abierto,setAbierto] = useState(false);
  const [pregunta,setPregunta] = useState('');
  const [cargando,setCargando] = useState(false);
  const [mensajes,setMensajes] = useState<Mensaje[]>([
    {rol:'panito',texto:'¡Hola! Soy PANITO, tu asistente de PANIA.'}
  ]);

  async function enviar(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const texto = pregunta.trim();
    if (!texto || cargando || !autorizado) return;
    setPregunta('');
    setMensajes(m=>[...m,{rol:'usuario',texto}]);
    setCargando(true);
    try {
      const r = await fetch('/api/asistente',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({pregunta:texto})
      });
      const data = await r.json();
      setMensajes(m=>[...m,{
        rol:'panito',
        texto:data.respuesta || data.error || 'No pude responder.'
      }]);
    } catch {
      setMensajes(m=>[...m,{
        rol:'panito',
        texto:'No pude conectarme con el asistente.'
      }]);
    } finally {
      setCargando(false);
    }
  }

  return <div className="panito-flotante">
    {abierto && <section className="panito-panel" aria-label="Asistente PANITO">
      <header className="panito-cabecera">
        <div><strong>PANITO</strong><small>Asistente · {modulo}</small></div>
        <button type="button" onClick={()=>setAbierto(false)}
          aria-label="Cerrar PANITO">×</button>
      </header>
      <div className="panito-mensajes" role="log" aria-live="polite">
        {mensajes.map((m,i)=><div key={i}
          className={'panito-mensaje '+m.rol}>
          <strong>{m.rol==='panito'?'PANITO':'Tú'}</strong>
          <p>{m.texto}</p>
        </div>)}
        {cargando && <p>Analizando información…</p>}
        {!autorizado && <p className="panito-aviso">
          El análisis gerencial está disponible para dueños y administradores.
          Puedes consultar los módulos habilitados en el menú de PANIA.
        </p>}
      </div>
      {autorizado && <form className="panito-form" onSubmit={enviar}>
        <input aria-label="Pregunta para PANITO"
          placeholder={'Pregunta sobre '+modulo.toLowerCase()+'…'}
          value={pregunta} onChange={e=>setPregunta(e.target.value)}/>
        <button type="submit" disabled={cargando || !pregunta.trim()}>
          Enviar
        </button>
      </form>}
      <small className="panito-pie">Modo lectura · Sin modificar datos</small>
    </section>}
    <button className="panito-boton" type="button"
      aria-label={abierto?'Cerrar asistente PANITO':'Abrir asistente PANITO'}
      aria-expanded={abierto}
      onClick={()=>setAbierto(v=>!v)}>
      <img src="/mascotas/panito.png" alt="" />
    </button>
  </div>;
}
