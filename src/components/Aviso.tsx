export function Aviso({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <div className={`aviso ${error ? 'error' : 'ok'}`} role={error ? 'alert' : 'status'}>
      {error ?? ok}
    </div>
  );
}
