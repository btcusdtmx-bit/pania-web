import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const codigo = readFileSync(
  'src/app/(app)/ventas/PosCaja.tsx',
  'utf8'
);

test('Guarda solicitudes pendientes', () => {
  assert.match(codigo, /sessionStorage\.setItem\(CLAVE_PENDIENTE/);
});

test('Recupera solicitudes al cargar', () => {
  assert.match(codigo, /sessionStorage\.getItem\(CLAVE_PENDIENTE/);
  assert.match(codigo, /setRecuperada\(true\)/);
});

test('Conserva la clave original', () => {
  assert.match(codigo, /claveRef\.current = pendienteGuardado\.clave/);
});

test('Permite reintentar el mismo cobro', () => {
  assert.match(codigo, /Reintentar mismo cobro/);
});

test('Bloquea edición durante recuperación', () => {
  assert.match(codigo, /pendiente \|\| recuperada/);
});

test('Limpia la solicitud después del éxito', () => {
  assert.match(codigo, /if \(estado\.ok\)/);
  assert.match(codigo, /borrarPendiente\(\)/);
});
