import type { TextosDeLaVista } from '@maun/domain';

export const vista = {
  delDominio: {
    hitos: {
      estimativo: {
        etiqueta: 'Te pasamos un número estimado',
        futuro: 'Te pasamos un número estimado',
      },
      presupuesto: {
        etiqueta: 'Presupuesto enviado',
        futuro: 'Te vamos a pasar el presupuesto',
      },
      aprobado: {
        etiqueta: 'Aprobado, seña cobrada',
        futuro: 'Cuando lo apruebes y dejes la seña',
      },
      fabricacion: { etiqueta: 'En fabricación', futuro: 'Vamos a empezar a fabricarlo' },
      entregado: { etiqueta: 'Entregado', futuro: 'Lo llevamos y lo instalamos' },
      pagado: { etiqueta: 'Pagado', futuro: 'Cuando esté saldado' },
    },
    aprobadoSinLaSena: 'Aprobado',
    cuandoLoApruebes: 'Cuando lo apruebes',
    cuandoDejesLaSena: 'Cuando dejes la seña',
    yaEstaPagado: 'Ya está pagado',
    enCurso: {
      estimativo: 'Te pasamos un número estimado',
      presupuesto: 'Estamos preparando tu presupuesto',
      aprobado: 'Recibimos la seña y ya estás en la cola del taller',
      fabricacion: 'Lo estamos fabricando',
      entregado: 'Ya está instalado en tu casa',
      pagado: 'Listo, está saldado',
    },
    presupuestoMandado: 'Te pasamos el presupuesto',
    titularDelAprobado: {
      cubierta: 'Recibimos la seña y ya estás en la cola del taller',
      falta: 'Lo aprobaste y falta la seña para entrar en la cola del taller',
      'sin-presupuesto': 'Lo aprobaste y ya estás en la cola del taller',
    },
    sigue: {
      estimativo: 'Si seguimos adelante, lo próximo que vas a ver acá es el presupuesto.',
      presupuesto: 'Lo próximo que vas a ver acá es el presupuesto.',
      aprobado: 'Lo próximo que vas a ver acá es el arranque de la fabricación.',
      fabricacion: 'Lo próximo que vas a ver acá es la entrega.',
      entregado: 'Lo próximo que vas a ver acá es el pago del saldo.',
    },
    titularListo: 'Tu mueble está listo',
    listoParaEntregar: 'Listo para entregar',
    sigueListo: {
      'sin-pedido': 'Lo próximo es acordar el día de la entrega.',
      'un-dia': 'Lo próximo es que nos digas si te queda bien ese día.',
      'sus-dias': 'Lo próximo es que nos pases los días que te quedan bien.',
      mandados: 'Lo próximo es que te confirmemos el día.',
    },
    sigueConLaComprometida: 'Lo próximo que vas a ver acá es la entrega.',
    sigueConElPresupuestoMandado: 'Lo próximo es que lo apruebes y dejes la seña.',
    sigueConLaSenaCubierta: 'Lo próximo es que lo apruebes.',
    sigueConElPresupuestoVencido: 'Lo próximo es que le escribas al taller para actualizarlo.',
    sigueFaltaLaSena: 'Lo próximo es que dejes la seña.',
    sigueFaltaMedir: {
      estimativo: 'Si seguimos adelante, lo próximo es ir a medir para pasarte el presupuesto.',
      presupuesto: 'Lo próximo es ir a medir, para poder pasarte el presupuesto.',
    },
    relevamientoTecnico: 'Relevamiento técnico',
    queEsElRelevamiento: [
      'El siguiente paso es el relevamiento técnico en obra. Es una visita donde relevamos medidas exactas, revisamos instalaciones y definimos detalles constructivos para poder proyectar tu mueble al milímetro.',
      'A partir de ese relevamiento te entregamos el diseño 3D y el presupuesto final y definitivo.',
    ],
    eventos: {
      estimativo: 'Te pasamos un número estimado',
      relevamiento: 'Fuimos a medir',
      presupuesto: 'Te pasamos el presupuesto',
      pago: 'Recibimos tu pago',
      pagoQueSalda: 'Recibimos el pago y quedó saldado',
      saldoQueSalda: 'Recibimos el saldo y quedó saldado',
      aprobado: 'Aprobaste el presupuesto',
      inicio: 'Empezamos a fabricarlo en el taller',
      listo: 'Terminamos tu mueble',
      entregado: 'Lo llevamos y lo instalamos',
    },
    comoPagar: {
      titulo: 'Cómo pagar',
      etiquetaDelImporte: { sena: 'Ahora, la seña', saldo: 'Ahora, el saldo' },
      nombre: { sena: 'la seña', saldo: 'el saldo' },
      porTransferenciaOEnEfectivo: 'por transferencia o en efectivo',
      porTransferencia: 'por transferencia',
      enEfectivo: 'en efectivo',
      pasosParaTransferir:
        'Copiá el alias, pegalo en Transferir en la app de tu banco o de tu billetera, escribí el monto y confirmá.',
      soloEfectivo: {
        sena: 'La seña es en efectivo, en mano. Lo coordinás con el taller.',
        saldo: 'El saldo es en efectivo, en mano. Lo coordinás con el taller.',
      },
      tambienEfectivo: {
        sena: 'La seña también la podés dejar en efectivo, en mano, coordinándolo con el taller.',
        saldo: 'El saldo también lo podés pagar en efectivo, en mano, coordinándolo con el taller.',
      },
    },
    proyeccion: {
      coordinamosLaEntrega: 'Cuando lo apruebes y dejes la seña, coordinamos la fecha de entrega.',
      coordinamosLaEntregaAlAprobar: 'Cuando lo apruebes, coordinamos la fecha de entrega.',
      vencio: (fecha) =>
        `Este presupuesto venció el ${fecha}. Hablá con el taller para actualizarlo.`,
      siLoAprobasAntesDel: (antesDe, listoPara) =>
        `Si lo aprobás antes del ${antesDe}, podríamos tenerlo listo para el ${listoPara}.`,
      siDejasLaSenaAntesDel: (antesDe, listoPara) =>
        `Si dejás la seña antes del ${antesDe}, podríamos tenerlo listo para el ${listoPara}.`,
      vamosTomandoLosTrabajos: 'Vamos tomando los trabajos a medida que entran las señas.',
    },
    nota: {
      pendiente: {
        etiqueta: 'Por qué el número todavía puede cambiar',
        titulo: 'El número todavía puede cambiar',
      },
      hecho: {
        etiqueta: 'De dónde sale este número',
        titulo: 'El número ya está tomado de las medidas reales',
      },
      yaFuimosAMedir: 'Ya fuimos a medir.',
      fuimosAMedirEl: (fecha) => `Fuimos a medir el ${fecha}.`,
      armamosElPresupuesto: 'Con esas medidas armamos el presupuesto final.',
      cerrandoElPresupuesto: 'Con esas medidas estamos cerrando el presupuesto final.',
      resumenYaFuimos: 'Ya fuimos a medir',
      medidoEl: (fecha) => `Medido el ${fecha}`,
      faltaMedirDelEstimado: [
        'Lo que te pasamos es un estimado, sacado de lo que hablamos.',
        'Para cerrarlo tenemos que ir a tu casa a tomar las medidas.',
      ],
      sinFechaParaLaVisita: 'Todavía no tenemos fecha para la visita.',
      quedamosEnIrEl: (fecha) => `Quedamos en ir el ${fecha}.`,
      resumenFaltaMedir: 'Número estimado, falta ir a medir',
    },
  } as const satisfies TextosDeLaVista,
  pantalla: {
    abriendo: 'Abriendo tu mueble',
    sinSenal: {
      titulo: 'Sin conexión',
      texto: 'Necesitás señal para ver el trabajo. Probá de nuevo cuando vuelva.',
    },
    error: {
      titulo: 'No pudimos cargar tu mueble',
      texto: 'Se cortó la conexión antes de que llegaran los datos. El enlace sigue siendo válido.',
      reintentar: 'Probar de nuevo',
    },
    muerto: {
      enlace: {
        titulo: 'Este enlace ya no funciona',
        texto:
          'Los enlaces que comparte el taller se dan de baja cuando hace falta. Pedile uno nuevo a quien te lo pasó y vas a poder ver todo de nuevo.',
      },
      trabajo: {
        titulo: 'Ese trabajo no está',
        texto: 'Puede que lo hayas borrado, o que el enlace apunte a un trabajo de otro taller.',
      },
    },
  },
  comoPagar: {
    oPorMercadoPago:
      'O pagá desde Mercado Pago, sin copiar nada: tocá el botón, escribí el monto de arriba y confirmá.',
    pedileLosDatos:
      'Para transferir, pedile los datos de la cuenta al taller: todavía no los cargó.',
  },
} as const;
