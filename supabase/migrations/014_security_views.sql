-- PANIA 2.1 — endurecimiento de vistas
-- Las vistas deben respetar RLS/permisos del usuario que consulta.
do $$
declare r record;
begin
  for r in select schemaname, viewname from pg_views where schemaname='public'
  loop
    execute format('alter view %I.%I set (security_invoker = true)',r.schemaname,r.viewname);
  end loop;
end $$;
