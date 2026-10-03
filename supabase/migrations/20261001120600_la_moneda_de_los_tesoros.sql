-- La moneda de cada tesoro (ADR 0081): un tesoro es en pesos o en dólares, se elige al crearlo y no
-- cambia nunca. Los cuatro de siempre son de la moneda del taller.
--
-- Aditiva: una columna con su default, así toda fila de hoy queda en pesos sin rellenar nada, y sus dos
-- checks, que las filas de hoy cumplen por ese default. El grant de update de la moneda hace falta
-- porque el alta de un tesoro es un upsert y Postgres pide UPDATE sobre las columnas del on conflict
-- do update; como el grant no la puede hacer inmutable, la cuida un trigger que rechaza con MN034 un
-- cambio de moneda y deja pasar el reenvío del alta con la misma. private.sembrar_los_tesoros no
-- cambia: los cuatro de siempre nacen en pesos por el default.

alter table public.tesoros
  add column moneda text not null default 'ARS',
  add constraint tesoros_moneda_valida check (moneda in ('ARS', 'USD')),
  add constraint tesoros_los_de_siempre_en_la_moneda_del_taller check (clave is null or moneda = 'ARS');

comment on column public.tesoros.moneda is 'La moneda del tesoro: ARS o USD, con una lista y no un formato para que una moneda nueva sea una decisión con su migración. Se elige al crearlo y no cambia nunca (private.cuidar_la_moneda_del_tesoro, MN034). Los cuatro de siempre son de la moneda del taller (ARS). Todo su saldo, sus metas y sus asientos del libro mayor van en esta moneda; nunca se suma con un tesoro de otra (ADR 0081).';

grant insert (moneda) on table public.tesoros to authenticated;
grant update (moneda) on table public.tesoros to authenticated;

create function private.cuidar_la_moneda_del_tesoro()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- El reenvío del alta (un upsert con la misma moneda) pasa: solo rechaza un cambio de verdad.
  if new.moneda is distinct from old.moneda then
    raise exception 'Ese tesoro sigue en su moneda'
      using errcode = 'MN034',
            detail = format('moneda %s, pedida %s', old.moneda, new.moneda),
            hint = 'La moneda de un tesoro no se cambia. Si lo necesitás en la otra moneda, creá uno nuevo y pasá la plata con una compra o una venta.';
  end if;
  return new;
end;
$$;

revoke all on function private.cuidar_la_moneda_del_tesoro() from public, anon, authenticated;

comment on function private.cuidar_la_moneda_del_tesoro() is 'Trigger de tesoros, antes de un update de moneda: rechaza con MN034 que un tesoro cambie de moneda. El grant de update de la columna existe solo porque el alta es un upsert; el reenvío del alta con la misma moneda pasa (ADR 0081).';

create trigger cuidar_la_moneda
  before update of moneda on public.tesoros
  for each row execute function private.cuidar_la_moneda_del_tesoro();
