# 0003. Distribución congelada y libro mayor como vista

Estado: aceptada, 2026-09-11, con la evidencia de la fase 2 (ver al final). La cascada, la liquidación (cobrar o cerrar como perdido), la reversión y los topes mensuales se detallan en el ADR 0011.

- Enmendado el 2026-09-28 por el [ADR 0078](0078-los-tesoros-configurables-y-la-fila.md): lo congelado de un cobro por la fila suma la fila con la que se repartió, su revisión, lo que el mes llevaba y una fila de `repartos` por cada paso y cada parte. El libro mayor lleva la cuenta por id de tesoro. Ver la nota al final de «Cómo quedó en la base».

## Contexto

El sistema viejo borraba y regeneraba los movimientos derivados de un proyecto en cada guardado. De ahí salieron sus tres errores:

- El sueldo sumaba a HOGAR y nunca restaba de MAUN, así que la plata se duplicaba.
- El pago de diezmo no salía de ningún tesoro.
- La ganancia se repartía sobre el presupuesto y no sobre lo cobrado.

Hay además un problema de historia. Si el sueldo configurado cambia el año que viene, recalcular distribuciones ya cerradas reescribe el pasado.

## Decisión

- Cuando un proyecto se liquida (pasa a cobrado, o se cierra como perdido con la seña retenida), se congela su distribución. Se guardan los importes calculados en ese momento (diezmo, sueldo, costos fijos y remanente) junto con los parámetros usados. La base es lo efectivamente cobrado menos los gastos del proyecto.
- El libro mayor es una vista (`security_invoker = true`) que une los movimientos manuales con los derivados de las distribuciones congeladas. Hay una sola fuente de verdad, la historia es inmutable y no existe un job de sincronización que se desfase.
- Todo movimiento tiene contrapartida: si algo entra en un tesoro, sale de otro o de afuera, de forma explícita.

## Alternativas descartadas

- **Regenerar los movimientos en cada guardado.** Es lo que hacía el sistema viejo y fue la fuente de sus bugs.
- **Una tabla de movimientos derivados mantenida por triggers.** Es un segundo lugar que sincronizar, y se desfasa.
- **Calcular siempre al vuelo sin congelar.** La historia cambiaría cada vez que cambian los ajustes.

## Consecuencias

- Corregir una distribución cerrada es una operación explícita: reabrir el cobro, reactivar el perdido o registrar un ajuste. Nunca es un efecto colateral de editar.
- Se guarda redundancia a propósito: los importes congelados y sus parámetros.

## Cómo quedó en la base (fase 2A, con los cambios de la 2B)

- **Movimientos con contrapartida explícita.** Cada fila de `movimientos` tiene `tesoro_origen` y `tesoro_destino`, y null en un lado significa "afuera". Un ingreso es `(null → hogar)`, un gasto `(maun → null)`, un aporte a Cocos `(maun → cocos)`. Una transferencia es una sola fila, no dos que se pueden desfasar. Un check por tipo fija qué lados lleva cada uno.
- **`movimientos` guarda solo lo cargado a mano.** Lo derivado de proyectos no se guarda: la vista `libro_mayor` lo arma desde `pagos` (entran a MAUN), `gastos` (salen de MAUN) y la distribución congelada de los proyectos cobrados o perdidos (el diezmo pasa de MAUN a DIEZMO y el sueldo de MAUN a HOGAR; los fijos y el remanente se quedan en MAUN y no generan filas).
- **El campo que distingue lo manual de lo derivado vive en la vista** (`libro_mayor.origen`: `manual`, `pago`, `gasto_proyecto`, `distribucion`), no en la tabla. El brief lo pedía como columna de `movimientos`. Guardar ahí los derivados sería volver a regenerarlos en cada guardado, que es justo lo que esta decisión elimina. `movimientos.proyecto_id` existe para un movimiento manual atribuible a un proyecto, como el ajuste que corrige una distribución cerrada.
- **La vista es un libro mayor de verdad**: una fila por cada tesoro que toca un asiento, con importe con signo. El saldo de un tesoro es `sum(monto_centavos) where tesoro = X`.
- **La distribución congelada son columnas de `proyectos`:**
  - la fecha de la liquidación, lo cobrado y los gastos sobre los que se calculó;
  - el porcentaje de diezmo, los objetivos y los topes de sueldo y fijos aplicados, y lo que el mes ya llevaba liquidado;
  - el instante de la liquidación y los cuatro escalones.

  Tres checks: cobrado o perdido si y solo si la distribución está completa; los escalones suman exactamente la ganancia neta; y cada tope sale de su objetivo y de lo que el mes ya llevaba.

- **Ganancia negativa:** diezmo, sueldo y fijos en cero, y la pérdida entera en el remanente, que es el único escalón que puede ser negativo. Así la suma siempre cierra.
- **Las columnas de la distribución no tienen grant para el cliente.** Las escribe `private.liquidar`, detrás de `cobrar_proyecto` y `cerrar_perdido`:
  - calcula la cascada en SQL y rechaza si la versión, los totales, los topes, la fecha o la distribución no son los que vio el cliente;
  - su primera sentencia bloquea el proyecto con `for update`, y recién después bloquea los ajustes del household y suma pagos, gastos y lo liquidado en el mes;
  - del otro lado, la guarda de pagos y gastos toma `for share` sobre el mismo proyecto, así que un pago que llega en el mismo instante que la liquidación queda adentro de la distribución o se rechaza, nunca afuera en silencio.
- **Una vez liquidado, los pagos y gastos del proyecto no se tocan** (`MN001`), y el proyecto no se borra si tiene pagos o gastos vivos. Corregir es reabrir, reactivar o registrar un ajuste, como dice arriba.

**Enmendado el 2026-09-28 por el [ADR 0078](0078-los-tesoros-configurables-y-la-fila.md).** La decisión no cambia: se congela, y la vista arma lo derivado. Cambia qué se congela y cómo se nombra un tesoro.

- **Un cobro por la fila congela más.** Además de los cuatro escalones de siempre (con lo que da `columnasDeSiempre`, así los checks de `proyectos` siguen valiendo sin tocarlos), guarda `dist_fila` (la fila con la que se repartió, la guardada o la de siempre armada en ese momento), `dist_fila_version` y `dist_previo` (lo que cada paso llevaba del mes según la base), y una fila de `repartos` por paso y por parte, con el tesoro, su nombre de ese día y el monto. Guardar una fila nueva no toca ninguna liquidación hecha: los cambios valen desde el próximo cobro.
- **Reabrir borra lógicamente los repartos** y guarda la foto en `reapertura_fila`, así volver a cobrar reparte con la fila con la que se había cobrado, como ya pasaba con la fecha y los objetivos.
- **Los movimientos nombran sus tesoros por id** (`desde_id`, `hacia_id`), porque un tesoro del dueño no tiene clave. `tesoro_origen` y `tesoro_destino` siguen, y un trigger completa un lado desde el otro: una app sin actualizar sigue escribiendo la clave.
- **La vista suma un origen, `reparto`**: cada reparto vivo de un proyecto liquidado pasa su monto de Maun a su tesoro. Suma también `tesoro_id` y `contrapartida_id` al final; el saldo de un tesoro es `sum(monto_centavos) where tesoro_id = X`. `tesoro` sigue con la clave, así las consultas de antes dan lo mismo.

## Evidencia de la fase 2

- **Saldos en una sola consulta sobre volúmenes realistas: confirmado.** 6 ms con un año de datos, 23 ms con diez años y 100 ms con 100.000 filas, medido en la base real (ADR 0009).
- **TypeScript y SQL dan igual en todos los casos: confirmado.** `packages/db/tests/dominio-vs-sql.test.ts` compara las dos cascadas en más de 5.000 casos, y compara lo que congela cada liquidación, paso a paso, contra el dominio.
- **Cobro parcial y reapertura sin excepciones ad hoc: confirmado.**
  - Los pagos se acumulan en el proyecto y la distribución se calcula sobre su suma al cobrar.
  - Reabrir es una función que descongela y guarda la fecha y los objetivos del cobro original. Cobrar de nuevo recalcula con esos objetivos y esa fecha, no con los ajustes de hoy: corregir un gasto no reescribe el sueldo de un cobro viejo.
  - Ninguna de las dos necesitó un caso especial en la vista. El perdido con seña tampoco: la vista solo pasó a mirar los dos estados liquidados.
- **Lo que la tiraría abajo** sigue en observación: que reabrir resulte frecuente, o que el cobro en cuotas exija distribuir por pago en vez de por proyecto. Con el uso real se ve.

## Qué evidencia de la fase 2 la confirma o la tira abajo

- **La confirma** si:
  - los saldos por tesoro salen de la vista con una sola query sobre volúmenes realistas (años de movimientos);
  - el test que compara la cascada en TypeScript contra la de SQL da igual en todos los casos;
  - el cobro parcial y la reapertura se modelan sin excepciones ad hoc.
- **La tira abajo** si:
  - reabrir o corregir proyectos cobrados resulta frecuente y congelar obliga a flujos manuales engorrosos;
  - la vista necesita lógica que solo rinde materializada y termina siendo una tabla con triggers;
  - el cobro en cuotas exige distribuir por pago en vez de por proyecto.
