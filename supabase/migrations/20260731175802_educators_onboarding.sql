-- Desbloquea el onboarding.
--
-- La política educators_rw usa is_active_educator(), que consulta la propia
-- tabla educators. Un usuario recién registrado todavía no tiene fila ahí, así
-- que la función devuelve false y RLS le impedía crear su primer registro:
-- ningún educador nuevo podía completar el alta.
--
-- Estas dos políticas son permisivas y se suman (OR) a la existente, sin
-- ampliar nada más: cada quien solo alcanza su propia fila.

create policy educators_self_insert on public.educators
  for insert to authenticated
  with check (id = (select auth.uid()));

-- El insert del onboarding usa RETURNING, y Postgres evalúa las políticas de
-- SELECT sobre la fila devuelta. Sin esta, el alta fallaba al leerse de vuelta.
create policy educators_self_read on public.educators
  for select to authenticated
  using (id = (select auth.uid()));
