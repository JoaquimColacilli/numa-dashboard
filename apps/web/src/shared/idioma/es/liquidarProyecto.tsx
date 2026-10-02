import type { Envoltorio } from '@/shared/lib';

export const liquidarProyecto = {
  pantalla: {
    cobrado: {
      titulo: (trabajo: string) => `Cobrar «${trabajo}»`,
      verbo: 'Cobrar y repartir',
      verboConMonto: (monto: string) => `Cobrar y repartir ${monto}`,
      volver: 'Volver sin cobrar',
      dia: 'Día del cobro',
      ayudaDelDia: (mes: string, anio: string) =>
        `El día en que terminó de entrar la plata. Los topes de la fila se cuentan en ${mes} de ${anio}.`,
      siTeEquivocaste: 'Si te equivocaste, se reabre desde la ficha y el reparto se deshace.',
    },
    perdido: {
      titulo: (trabajo: string) => `Dar por perdido «${trabajo}»`,
      verbo: 'Dar por perdido y liquidar la seña',
      verboConMonto: (monto: string) => `Dar por perdido y liquidar la seña ${monto}`,
      volver: 'Volver sin cerrarlo',
      dia: 'Día del cierre',
      ayudaDelDia: (mes: string, anio: string) =>
        `El día en que la seña pasa a ser del taller. El reparto se cuenta en ${mes} de ${anio}.`,
      siTeEquivocaste: 'Si te equivocaste, se reactiva desde la ficha y el reparto se deshace.',
    },
    trio: {
      presupuesto: 'Presupuesto',
      cobrado: 'Cobrado',
      saldo: 'Saldo',
      sinSaldo: 'Sin saldo',
    },
    pagoFinal: 'Pago final',
    conceptoDelPagoFinal: 'Saldo final en la entrega',
    registrarElPagoFinalDe: (monto: string) => `Registrar el pago final de ${monto}`,
    ayudaDelPagoFinal:
      'Queda cargado como un pago más del proyecto, y entra en la cuenta de abajo. Si el cliente te quedó debiendo, destildalo y cobrá lo que entró.',
    concepto: 'Concepto',
    monto: 'Monto',
    fechaDelPago: 'Fecha del pago',
    montoATesoro: (monto: string, tesoro: string) => `${monto} a ${tesoro}`,
    vanACadaTesoro: (lista: string, cantidad: number) =>
      cantidad === 1 ? `Va ${lista}.` : `Van ${lista}.`,
    seReparteElIngreso: (monto: string) =>
      `Se reparte el ingreso de este trabajo: ${monto} (lo cobrado menos los gastos).`,
    quedaEnElLibro:
      'Queda en el libro con su fecha, pero no mueve los tesoros: ya estaba en tus saldos.',
    seMuevenLosSaldos: 'Los saldos de los tesoros se mueven con esto.',
    noHayIngreso:
      'No hay ingreso que repartir: no se mueve ningún tesoro y la pérdida queda anotada en la caja del taller.',
    trayendoLosTesoros:
      'Estamos trayendo los tesoros del taller. Sin ellos el reparto no puede salir: el botón se habilita apenas lleguen.',
    sena: {
      queLePasa: 'Qué pasa con la seña',
      titulo: 'Esto mueve plata, aunque sea un presupuesto que no salió',
      retenida: (monto: string) =>
        `Los ${monto} de seña que retenés dejan de ser un anticipo y pasan a ser ingreso del taller.`,
      diezmo: (monto: string) => `De ahí sale el diezmo: ${monto}.`,
      sinDiezmo: 'Esta seña no paga diezmo, según está configurado el taller.',
      otrasObligaciones: (lista: string) => `Las demás obligaciones salen igual: ${lista}.`,
      conSueldo: 'Y también paga sueldo, según está configurado el taller.',
      sinSueldo: 'No paga sueldo: un presupuesto que no prosperó no es un trabajo.',
      loQueSobraQuedaEnElTaller:
        'Lo demás baja por la fila como en cualquier cobro, y lo que sobra queda en el taller.',
      loQueSobraVaA: (tesoro: string) =>
        `Lo demás baja por la fila como en cualquier cobro, y lo que sobra va a ${tesoro}.`,
      sinSenaRetenida: 'No hay seña retenida, así que no se mueve plata de los tesoros.',
      gastosComoPerdida: (monto: string) =>
        `Los ${monto} de gastos que cargaste quedan como pérdida del taller.`,
      sePuedeDeshacer:
        'Se puede deshacer: reactivando el presupuesto vuelve a las consultas y la plata se descuenta de los tesoros.',
    },
  },
  reversion: {
    cobro: {
      abrir: 'Reabrir el cobro',
      pregunta: '¿Reabrís el cobro?',
      confirmar: 'Reabrir y deshacer el reparto',
    },
    presupuesto: {
      abrir: 'Reactivar el presupuesto',
      pregunta: '¿Reactivás el presupuesto?',
      confirmar: 'Reactivar y deshacer el reparto',
    },
    yaEnLaApertura:
      'Este reparto ya estaba en tus saldos cuando empezaste con la app, así que deshacerlo no mueve plata de los tesoros. Los pagos y los gastos vuelven a poder editarse.',
    seDeshaceElReparto: 'Se deshace el reparto. Esto vuelve de cada tesoro a la caja del taller:',
    loQueVuelve: 'Lo que vuelve a la caja del taller',
    elMesDe: (fecha: string) =>
      `El mes de ${fecha} deja de contar esta liquidación, y lo que les falte a los topes de la fila queda a la vista.`,
    sinTesoros:
      'Este reparto no movió ningún tesoro, así que deshacerlo tampoco mueve plata. Los pagos y los gastos vuelven a poder editarse.',
    vuelveAEntregado: (Negrita: Envoltorio, fecha: string) => (
      <>
        Vuelve a <Negrita>Entregado</Negrita>. Cuando lo vuelvas a cobrar, el día de este cobro (
        {fecha}) viene puesto y lo podés corregir. Se vuelve a cobrar con la misma fila de este
        cobro: corregir un gasto no te reescribe los topes ni el reparto con la fila de hoy.
      </>
    ),
    vuelveAEntregadoSinFecha: (Negrita: Envoltorio) => (
      <>
        Vuelve a <Negrita>Entregado</Negrita>. Cuando lo vuelvas a cobrar, el día de este cobro
        viene puesto y lo podés corregir. Se vuelve a cobrar con la misma fila de este cobro:
        corregir un gasto no te reescribe los topes ni el reparto con la fila de hoy.
      </>
    ),
    loQueSiMira: 'Lo que sí mira es lo que tu sueldo ya recibió ese mes, como en un cobro nuevo.',
    vuelveALasConsultas: 'Vuelve a las consultas, en',
    noGuardaLaFecha: (Negrita: Envoltorio) => (
      <>
        A diferencia de reabrir un cobro, esto <Negrita>no guarda la fecha</Negrita>: un presupuesto
        que revive está vivo otra vez, y si más adelante lo volvés a dar por perdido es un cierre
        nuevo, con el día que elijas y la fila de ese momento.
      </>
    ),
    dejarloComoEsta: 'Dejarlo como está',
  },
} as const;
