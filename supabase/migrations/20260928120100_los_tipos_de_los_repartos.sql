-- Los repartos por tipo de tesoro (ADR 0078, los tipos de tesoro): además de los pasos y las partes,
-- una fila por cada obligación que no es el diezmo (Ingresos Brutos, por ejemplo) y otra por el
-- superávit cuando no es Maun. Los pasos guardan cómo se llenan (modo) y las obligaciones sobre qué
-- se calculan (base).
--
-- Dos columnas nuevas, en null, así el alter no reescribe ninguna fila. El check de forma pasa a su
-- versión nueva con el rito de packages/db/CLAUDE.md: el nuevo se agrega not valid y con nombre
-- propio, se valida, se saca el viejo y se renombra el nuevo al nombre de siempre. No hace falta
-- rellenar nada: el check nuevo toma como «por mes» un paso con modo null, que es como quedaron los
-- que se escribieron antes de esta migración, y una parte sin tope, que es como quedaron todas.
--
-- Lo que autorizó el dueño aunque la regla lo cuente como destructivo, porque no borra ni cambia un
-- dato que exista: el cambio del check con ese rito.

alter table public.repartos
  add column modo text,
  add column base text;

comment on column public.repartos.modo is
  'En un paso, cómo se llena: mes (hasta su monto en cada mes del calendario), saldo (junta hasta tener su monto de saldo: se renueva al pagar en un compromiso, se repone al usarlo en un ahorro fijo) o trabajo (su monto en cada cobro, solo en un ahorro fijo). Null en los pasos que se liquidaron antes de que existiera, que fueron por mes, y en los demás tipos (ADR 0078).';
comment on column public.repartos.base is
  'En una obligación, sobre qué se calcula su porcentaje: cobrado (todo lo que entró del trabajo, como Ingresos Brutos) o ingreso (lo que llega después de las obligaciones de arriba). Null en los demás tipos.';
comment on column public.repartos.tipo is
  'obligacion (un porcentaje de lo cobrado o del ingreso, salvo el diezmo, que va a dist_diezmo_* del proyecto), paso (un compromiso o un ahorro fijo, que se llena hasta su tope), parte (un porcentaje de lo que sobra, con tope si va hasta la meta) o superavit (lo que queda, cuando no es Maun).';
comment on column public.repartos.posicion is
  'El lugar en la liquidación, desde 1: las obligaciones que no son el diezmo, los pasos en el orden de la fila, las partes del reparto y el superávit si no es Maun.';
comment on column public.repartos.clase is 'En un paso, sueldo, fijos o prioridad; en los demás tipos, null.';
comment on column public.repartos.objetivo_centavos is 'En un paso, su monto según la fila (cero para el sueldo de un perdido sin sueldo).';
comment on column public.repartos.previo_centavos is
  'En un paso, lo que llevaba según su modo antes de esta liquidación, con el piso de su meta: lo del mes, su saldo o cero. Es el previo que entró a la cuenta.';
comment on column public.repartos.tope_centavos is
  'En un paso, lo que le faltaba (el objetivo entero si no va por mes). En una parte que va hasta la meta, lo que le faltaba para la meta; null si junta sin fin.';
comment on column public.repartos.por_mes is
  'En un paso, si su tope descuenta lo que ya lleva: true en los tres modos, false solo en el sueldo de la fila de siempre de un taller que paga por trabajo.';
comment on column public.repartos.porcentaje_bp is 'En una obligación o una parte, su porcentaje en puntos básicos.';
comment on column public.repartos.monto_centavos is 'Lo que pasó de Maun a este tesoro. En Maun (un paso de gastos fijos) queda donde estaba.';
comment on table public.repartos is
  'Lo que recibió cada tesoro en una liquidación por la fila: una fila por obligación que no es el diezmo, por paso, por parte y por el superávit si no es Maun, en ese orden y con los ids que manda la app. Es parte de la distribución congelada (ADR 0003): reabrir el cobro las borra lógicamente y volver a cobrar escribe otras. La escriben private.liquidar() y private.revertir_liquidacion(); la app solo lee (ADR 0078).';

alter table public.repartos
  add constraint repartos_forma_por_tipo check (
    coalesce(
      case tipo
        when 'obligacion' then
          porcentaje_bp between 1 and 10000
          and base in ('cobrado', 'ingreso')
          and clase is null
          and modo is null
          and objetivo_centavos is null
          and previo_centavos is null
          and tope_centavos is null
          and por_mes is null
        when 'paso' then
          clase in ('sueldo', 'fijos', 'prioridad')
          and case clase
            when 'sueldo' then coalesce(modo, 'mes') = 'mes'
            when 'fijos' then coalesce(modo, 'mes') in ('mes', 'saldo')
            else coalesce(modo, 'mes') in ('mes', 'saldo', 'trabajo')
          end
          and objetivo_centavos >= 0
          and previo_centavos >= 0
          and tope_centavos >= 0
          and por_mes is not null
          and porcentaje_bp is null
          and base is null
          and monto_centavos <= tope_centavos
        when 'parte' then
          porcentaje_bp between 1 and 10000
          and (tope_centavos is null or (tope_centavos >= 0 and monto_centavos <= tope_centavos))
          and clase is null
          and modo is null
          and base is null
          and objetivo_centavos is null
          and previo_centavos is null
          and por_mes is null
        when 'superavit' then
          clase is null
          and modo is null
          and base is null
          and objetivo_centavos is null
          and previo_centavos is null
          and tope_centavos is null
          and por_mes is null
          and porcentaje_bp is null
      end,
      false
    )
  ) not valid;

alter table public.repartos validate constraint repartos_forma_por_tipo;

alter table public.repartos drop constraint repartos_forma_segun_tipo;

alter table public.repartos rename constraint repartos_forma_por_tipo to repartos_forma_segun_tipo;
