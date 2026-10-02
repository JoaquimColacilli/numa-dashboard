-- Los dólares del taller (ADR 0081): el dólar del día, uno por taller, con la fecha para la que vale,
-- y la cuenta en dólares para recibir transferencias. El dólar del día lo carga el dueño con la regla
-- de su presupuesto; con él la página del cliente calcula cuántos pesos son hoy un importe en dólares,
-- solo si es de hoy. La cuenta en dólares es opcional, porque casi siempre le pagan en billetes: el
-- titular y el CUIT son los de la cuenta en pesos.
--
-- Aditiva: cuatro columnas nuevas, el dólar del día nulo y la cuenta vacía por defecto, y checks solo
-- sobre ellas, que las filas de hoy cumplen sin relleno. Grants de update, como sus vecinas.

alter table public.ajustes
  add column dolar_del_dia_centavos bigint,
  add column dolar_del_dia_el date,
  add column cobro_dolares_cbu text not null default '',
  add column cobro_dolares_alias text not null default '',
  add constraint ajustes_dolar_del_dia_con_su_fecha check (
    (dolar_del_dia_centavos is null) = (dolar_del_dia_el is null)
  ),
  add constraint ajustes_dolar_del_dia_en_rango check (
    dolar_del_dia_centavos is null or dolar_del_dia_centavos between 100 and 10000000
  ),
  add constraint ajustes_cobro_dolares_cbu_formato check (
    cobro_dolares_cbu = '' or cobro_dolares_cbu ~ '^[0-9]{22}$'
  ),
  add constraint ajustes_cobro_dolares_alias_formato check (
    cobro_dolares_alias = '' or cobro_dolares_alias ~ '^[A-Za-z0-9.-]{6,20}$'
  );

comment on column public.ajustes.dolar_del_dia_centavos is 'El dólar del día del taller, en centavos de peso por dólar, de 100 a 10.000.000, o null si nunca se cargó. Lo carga el dueño con la regla de su presupuesto: con él la página de un trabajo en dólares dice cuántos pesos son hoy, solo si dolar_del_dia_el es hoy en el taller, y la hoja de mandar el presupuesto lo congela como referencia. Va con su fecha o sin ninguna de las dos (ADR 0081).';
comment on column public.ajustes.dolar_del_dia_el is 'El día para el que vale el dólar del día, o null si nunca se cargó. Va con dolar_del_dia_centavos o sin ninguno de los dos (ADR 0081).';
comment on column public.ajustes.cobro_dolares_cbu is 'El CBU de la cuenta en dólares del taller, 22 dígitos sin espacios ni guiones, o vacío. Mismo formato que cobro_cbu; el titular y el CUIT son los de la cuenta en pesos. Viaja a la página del cliente solo si el pago que toca se ofrece en dólares por transferencia (ADR 0081).';
comment on column public.ajustes.cobro_dolares_alias is 'El alias de la cuenta en dólares del taller, o vacío. Mismo formato que cobro_alias (el del BCRA). Viaja a la página del cliente solo si el pago que toca se ofrece en dólares por transferencia (ADR 0081).';

grant update (dolar_del_dia_centavos, dolar_del_dia_el, cobro_dolares_cbu, cobro_dolares_alias)
  on table public.ajustes to authenticated;
