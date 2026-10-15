import { Suspense } from 'react';
import LoginCliente from './LoginCliente';

export default function Login() {
  return <Suspense fallback={<main className="entrada">Cargando PANIA...</main>}><LoginCliente /></Suspense>;
}
