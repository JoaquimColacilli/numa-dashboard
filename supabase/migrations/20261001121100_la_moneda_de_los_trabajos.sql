-- La moneda de los trabajos (ADR 0081): un trabajo tiene precio en pesos o en dólares («Precio en») y
-- dice en qué le paga el cliente («Te paga en»). La moneda es la del presupuesto, las opciones, la
-- seña, el saldo y todo lo que el trabajo le cobra al cliente; los costos estimados y los gastos van
-- siempre en pesos.
--
-- Aditiva: tres columnas nuevas, la moneda con su default ('ARS', lo de hoy) y las otras dos nulas, y
-- checks solo sobre ellas, que las filas de hoy cumplen sin relleno. La moneda la escribe
-- guardar_proyecto, que es invoker: lleva grant de insert y de update. «Te paga en» va con las formas
-- de cobro y el dólar de los costos con los costos, por sus propios update: solo grant de update.
--
-- La moneda se elige mientras el trabajo es una consulta (los cinco primeros estados y en
-- seguimiento). Un trigger rechaza con MN036 que cambie después; el reenvío con la misma moneda pasa.
-- Un trabajo aprobado puede volver a presupuesto enviado, así que la puerta para corregir queda.

alter table public.proyectos
  add column moneda text not null default 'ARS',
  add column cobra_en text[],
  add column costos_cotizacion_centavos bigint,
  add constraint proyectos_moneda_valida check (moneda in ('ARS', 'USD')),
  add constraint proyectos_cobra_en_valido check (
    coalesce(
      cobra_en is null
        or cobra_en = array['ARS']
        or cobra_en = array['USD']
        or cobra_en = array['ARS', 'USD'],
      false
    )
  ),
  add constraint proyectos_costos_cotizacion_en_rango check (
    costos_cotizacion_centavos is null or costos_cotizacion_centavos between 100 and 10000000
  );

comment on column public.proyectos.moneda is 'La moneda del trabajo, «Precio en»: ARS o USD, con una lista como la de los tesoros. Es la del presupuesto, las opciones, la seña, el saldo y todo lo que el trabajo le cobra al cliente; los costos estimados y los gastos van siempre en pesos. Se elige mientras el trabajo es una consulta (los cinco primeros estados y en_seguimiento) y después no cambia (private.cuidar_la_moneda_del_trabajo, MN036). La escribe guardar_proyecto (ADR 0081).';
comment on column public.proyectos.cobra_en is 'En qué le paga el cliente, «Te paga en»: {ARS}, {USD} o {ARS,USD}, o null, que quiere decir la moneda del taller, así los trabajos de antes quedan como están. Dice qué se le ofrece al cliente en su página; la base no lo exige sobre los pagos, que registran lo que pasó. Se guarda con cobro_sena y cobro_saldo, por su propio update (ADR 0053 y 0081).';
comment on column public.proyectos.costos_cotizacion_centavos is 'En un trabajo en dólares, el dólar con que se ven en dólares los costos estimados y se calcula el margen, en centavos de peso por dólar, de 100 a 10.000.000. Los costos siguen guardados en pesos. Null es «todavía no lo puse». Se guarda con los costos, por su propio update (ADR 0081).';
comment on column public.proyectos.presupuesto_centavos is 'Presupuesto acordado, en centavos de la moneda del trabajo (proyectos.moneda). Null mientras el lead no tiene presupuesto. La distribución NO se calcula sobre esto sino sobre lo cobrado, en pesos (ADR 0081).';
comment on column public.opciones_de_presupuesto.monto_centavos is 'El importe de esta opción, en centavos de la moneda del trabajo (proyectos.moneda). Cuando se aprueba, es el presupuesto del trabajo (ADR 0081).';
comment on column public.proyectos.costo_madera_centavos is 'Lo que el dueño calcula que va a gastar en madera para este trabajo, en centavos de peso, también en un trabajo en dólares. Null es «todavía no lo estimé», que no es lo mismo que cero. No es un gasto real ni alimenta el presupuesto: el presupuesto incluye su ganancia y la decide él (ADR 0045 y 0081).';
comment on column public.proyectos.costo_herrajes_centavos is 'Lo estimado en herrajes, en centavos de peso, también en un trabajo en dólares. Null es «todavía no lo estimé».';
comment on column public.proyectos.costo_flete_centavos is 'Lo estimado en flete, en centavos de peso, también en un trabajo en dólares. Null es «todavía no lo estimé».';
comment on column public.proyectos.costo_ayudante_centavos is 'Lo estimado en ayudante, en centavos de peso, también en un trabajo en dólares. Null es «todavía no lo estimé».';

grant insert (moneda) on table public.proyectos to authenticated;
grant update (moneda, cobra_en, costos_cotizacion_centavos) on table public.proyectos to authenticated;

create function private.cuidar_la_moneda_del_trabajo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- El reenvío con la misma moneda pasa: solo rechaza un cambio de verdad fuera de consulta.
  if new.moneda is distinct from old.moneda
    and old.estado not in (
      'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado',
      'en_seguimiento'
    )
  then
    raise exception 'La moneda de un trabajo se elige mientras es una consulta'
      using errcode = 'MN036',
            detail = format('estado %s, moneda %s, pedida %s', old.estado, old.moneda, new.moneda),
            hint = 'Si hace falta cambiarla, volvé el trabajo a presupuesto enviado.';
  end if;
  return new;
end;
$$;

revoke all on function private.cuidar_la_moneda_del_trabajo() from public, anon, authenticated;

comment on function private.cuidar_la_moneda_del_trabajo() is 'Trigger de proyectos, antes de un update de moneda: rechaza con MN036 que un trabajo cambie de moneda si ya no es una consulta (los cinco primeros estados y en_seguimiento). El reenvío con la misma moneda pasa. Un trabajo aprobado puede volver a presupuesto enviado y ahí cambiarla (ADR 0081).';

create trigger cuidar_la_moneda
  before update of moneda on public.proyectos
  for each row execute function private.cuidar_la_moneda_del_trabajo();
