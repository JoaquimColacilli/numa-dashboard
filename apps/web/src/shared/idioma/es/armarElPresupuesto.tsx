import type { ReactNode } from 'react';

import type { Envoltorio } from '@/shared/lib';

export const armarElPresupuesto = {
  titulo: 'El presupuesto',
  cerrar: 'Cerrar',
  pestanas: {
    queMirar: 'Qué mirar',
    armarlo: 'Armarlo',
    comoLoVe: 'Ver cómo lo ve tu cliente',
  },
  guardado: {
    seGuardaSolo: 'Se guarda solo mientras lo armás',
    hoy: 'Guardado hoy',
    el: (fecha: string) => `Guardado el ${fecha}`,
  },
  asiLoVeria:
    'Así lo vería tu cliente si lo mandás hoy. Lo de tu página no cambia hasta que lo mandes.',
  verElPdf: 'Ver el PDF',
  pdf: 'PDF',
  mandarElPresupuesto: 'Mandar el presupuesto',
  mandarLaRevision: (revision: number) => `Mandar la revisión ${String(revision)}`,
  seNumeraCuandoVuelvaLaSenal: 'Se numera cuando vuelva la señal.',
  opcion: (letra: string) => `Opción ${letra}`,
  encabezado: {
    titulo: 'Encabezado',
    bajada: 'El número, la fecha y tu cliente salen solos. El título y la obra van arriba de todo.',
    numero: 'Número',
    seAsignaAlMandarlo: 'Se asigna al mandarlo',
    numeroYProxima: (numero: string, revision: number) =>
      `Nº ${numero} · próxima: Rev. ${String(revision)}`,
    llevaElDia: (ejemplo: string) => `Lleva el día en que lo mandes, como ${ejemplo}.`,
    elNumeroNoCambia: 'El número no cambia: cada vez que lo mandás, sube la revisión.',
    cliente: 'Cliente',
    sinCliente: 'Sin cliente',
    saleDeSuFicha: 'Sale de su ficha.',
    tituloDelTrabajo: 'Título',
    ejemploDelTitulo: 'Cocina, placard del dormitorio…',
    obra: 'Obra',
    ejemploDeLaObra: 'Calle y número, barrio',
    plazo: 'Plazo de fabricación',
    diasHabiles: 'días hábiles',
    ayudaDelPlazo:
      'Desde que se acredita la seña. Lo usan el aviso del plazo y la entrega estimada.',
  },
  validez: {
    titulo: 'Validez',
    dias: (dias: number) => `${String(dias)} días`,
    otro: 'Otro',
    sinVencimiento: 'Sin vencimiento',
    cuantosDias: 'Cuántos días vale',
    diasCorridos: 'días corridos',
    sinFechaLimite: 'Tu cliente no ve una fecha límite.',
    valeHasta: (fecha: string) => `Si lo mandás hoy, vale hasta el ${fecha}.`,
    salenDeAjustes: (dias: number) => `Los ${String(dias)} días salen de Ajustes.`,
  },
  detalle: {
    titulo: 'Detalle',
    bajada:
      'Cada mueble con su nombre y su descripción técnica, en el orden en que los va a leer tu cliente.',
    cuantos: (cuantos: number) => (cuantos === 1 ? '1 mueble' : `${String(cuantos)} muebles`),
    descripcionGeneral: 'Descripción general',
    opcional: '(opcional)',
    ejemploGeneral:
      'Lo que vale para todo el trabajo: la línea, los materiales, cómo abren los frentes…',
    muebles: 'Muebles',
    todosConDescripcion: 'todos con su descripción',
    conDescripcion: (conDescripcion: number, total: number) =>
      `${String(conDescripcion)} de ${String(total)} con descripción`,
    sinMuebles: 'Sin muebles. Agregá por lo menos uno con su descripción para poder mandarlo.',
    quiteElMueble: 'Quité el mueble.',
    quiteElMuebleLlamado: (nombre: string) => `Quité «${nombre}».`,
    agregarUnMueble: 'Agregar un mueble',
    mueble: {
      nombre: (numero: number) => `Nombre del mueble ${String(numero)}`,
      ejemploDelNombre: 'Bajomesada, alacena, placard…',
      descripcionTecnica: 'Descripción técnica',
      ejemploDeLaDescripcion:
        'Bajomesada en L 2.07 x 1.83, altura 880 mm, en Melamina sobre Aglomerado de 18 mm Blanco…',
      queLleva: 'Medidas, material y espesor, color y marca de la placa.',
      subir: (numero: number) => `Subir el mueble ${String(numero)}`,
      subirLlamado: (nombre: string) => `Subir «${nombre}»`,
      bajar: (numero: number) => `Bajar el mueble ${String(numero)}`,
      bajarLlamado: (nombre: string) => `Bajar «${nombre}»`,
      quitar: (numero: number) => `Quitar el mueble ${String(numero)}`,
      quitarLlamado: (nombre: string) => `Quitar «${nombre}»`,
    },
  },
  herrajes: {
    titulo: 'Herrajes',
    bajada:
      'Uno por renglón, con sus propiedades. Podés traer los de «Lo que hace falta»: vienen sin las cantidades.',
    cuantos: (cuantos: number) => `${String(cuantos)} ${cuantos === 1 ? 'herraje' : 'herrajes'}`,
    cuantosSinMostrar: (cuantos: number) =>
      `${String(cuantos)} ${cuantos === 1 ? 'herraje' : 'herrajes'} · no se muestran`,
    mostrarlos: 'Mostrarlos en el presupuesto',
    noVan: 'No van en el presupuesto. La lista queda guardada por si los volvés a mostrar.',
    todaviaNoHay: 'Todavía no hay herrajes. Traelos de «Lo que hace falta» o escribilos acá abajo.',
    herraje: (numero: number) => `Herraje ${String(numero)}`,
    sacarElHerraje: (numero: number) => `Sacar Herraje ${String(numero)}`,
    traje: (cuantos: number) =>
      `Traje ${String(cuantos)} ${cuantos === 1 ? 'herraje' : 'herrajes'} de «Lo que hace falta».`,
    yaEstanTodos: 'Ya están todos los herrajes de «Lo que hace falta».',
    agregarUnHerraje: 'Agregar un herraje',
    ejemploDelHerraje: 'Correderas, bisagras, pistones…',
    traer: 'Traer de «Lo que hace falta»',
  },
  casillas: {
    aTenerEnCuenta: {
      titulo: 'A tener en cuenta',
      bajada: 'Lo que este trabajo no incluye. Tildá lo que tu cliente tiene que saber.',
      ejemplo: 'No incluye el retiro de los muebles existentes.',
      propia: (numero: number) => `A tener en cuenta: propia ${String(numero)}`,
      sacarLaPropia: (numero: number) => `Sacar A tener en cuenta: propia ${String(numero)}`,
    },
    incluye: {
      titulo: 'Incluye',
      bajada: 'Lo que sí va. Las de siempre vienen tildadas.',
      ejemplo: 'Retiro de los restos de la instalación.',
      propia: (numero: number) => `Incluye: propia ${String(numero)}`,
      sacarLaPropia: (numero: number) => `Sacar Incluye: propia ${String(numero)}`,
    },
    avisos: {
      titulo: 'Avisos',
      bajada: 'Tus textos de siempre, con los números de este presupuesto.',
      ejemplo: 'La fecha de producción se reserva según la agenda del taller…',
      propia: (numero: number) => `Avisos: propia ${String(numero)}`,
      sacarLaPropia: (numero: number) => `Sacar Avisos: propia ${String(numero)}`,
    },
    condiciones: {
      titulo: 'Condiciones',
      bajada: 'Lo que tu cliente tiene que asegurar para la instalación.',
      ejemplo: 'El edificio debe permitir el uso del ascensor…',
      propia: (numero: number) => `Condiciones: propia ${String(numero)}`,
      sacarLaPropia: (numero: number) => `Sacar Condiciones: propia ${String(numero)}`,
    },
    van: (van: number, total: number) => `Van ${String(van)} de ${String(total)}`,
    apareceCuandoPague: 'Aparece cuando tu cliente pague algo: dice cuánto ya pagó.',
    soloEnEste: 'Solo en este presupuesto',
    agregarOtra: 'Agregar otra',
  },
  sena: {
    conElTotal: {
      taller: (porcentaje: string) =>
        `Con el total, acá se ve la seña del ${porcentaje} del taller.`,
      trabajo: (porcentaje: string) =>
        `Con el total, acá se ve la seña del ${porcentaje} de este trabajo.`,
    },
    conElTotalYLoPagado: {
      taller: (porcentaje: string, pagado: string) =>
        `Con el total, acá se ve la seña del ${porcentaje} del taller y lo que ya pagó (${pagado}).`,
      trabajo: (porcentaje: string, pagado: string) =>
        `Con el total, acá se ve la seña del ${porcentaje} de este trabajo y lo que ya pagó (${pagado}).`,
    },
    laQueLeVasAPedir: 'La seña que le vas a pedir',
    senaDel: {
      taller: (porcentaje: string) => `Seña del ${porcentaje} del taller`,
      trabajo: (porcentaje: string) => `Seña del ${porcentaje} de este trabajo`,
    },
    yaPago: 'Ya pagó',
    leFaltaParaLaSena: 'Le falta para la seña',
    segunLaQueElija: {
      taller: (porcentaje: string) => `La seña del ${porcentaje} del taller, según la que elija`,
      trabajo: (porcentaje: string) =>
        `La seña del ${porcentaje} de este trabajo, según la que elija`,
    },
    yaPagoSeDescuenta: (Monto: Envoltorio, monto: string) => (
      <>
        Ya pagó <Monto>{monto}</Monto>: se descuenta de la seña de la que elija.
      </>
    ),
  },
  valores: {
    titulo: 'Valores',
    bajada:
      'Es el presupuesto del trabajo: si lo cambiás acá, cambia también en la ficha. La seña la calcula la app.',
    opciones: (cuantas: number) => `${String(cuantas)} opciones`,
    queIncluye: (letra: string) => `Qué incluye la opción ${letra}`,
    ejemploDeLaOpcion: 'Qué la hace distinta: frentes, material, un mueble más…',
    laAprobo: 'La aprobó',
    importe: (letra: string) => `Importe de la opción ${letra}`,
    quitar: (letra: string) => `Quitar la opción ${letra}`,
    agregarUnaOpcion: 'Agregar una opción',
    total: 'Total del presupuesto',
    masDeUnaOpcion: 'Ofrecerle más de una opción',
  },
  abonado: {
    titulo: 'Lo que ya pagó, en el aviso del relevamiento',
    enDolares: (monto: string) => `En dólares: ${monto}`,
    enPesos: (monto: string) => `En pesos: ${monto}`,
    ayudaEnDolares: 'Es lo que descontó del precio. El PDF lo resta de la seña.',
    ayudaEnPesos:
      'Es lo que pagó, por su valor en pesos. El PDF no lo resta de la seña en dólares: lo dice el aviso.',
  },
  modificacion: {
    etiqueta: 'Valor de una modificación de más',
    ayuda:
      'Lo dice el aviso de las modificaciones. Arranca en el de Ajustes y lo podés poner en pesos o en dólares.',
  },
  moneda: {
    loQueDice: 'Lo que dice de la moneda, para este trabajo',
    deDondeSale:
      'Va debajo de la forma de pago. Sale de «Tu presupuesto» en Ajustes, según en qué moneda es el precio y en cuál te paga.',
    retocada: 'Retocada para este trabajo. La de siempre sigue igual en Ajustes.',
    volverALaDeSiempre: 'Volver a la de siempre',
  },
  formaDePago: {
    titulo: 'Forma de pago',
    bajada:
      'Elegí una de tus formas de siempre y retocá el texto para este trabajo. No cambia cómo te paga en su página.',
    noMostrarla: 'No mostrarla',
    noVa: 'La forma de pago no va en este presupuesto. Tu cliente igual ve en su página cómo pagarte la seña.',
    loQueDice: 'Lo que dice, para este trabajo',
    volverAlDeSiempre: 'Volver al de siempre',
    retocado: 'Retocado para este trabajo. La de siempre sigue igual en Ajustes.',
    laSenaDeEsteTrabajo: (sena: string) => `El ${sena} es la seña de este trabajo.`,
  },
  garantia: {
    titulo: 'Garantía',
    bajada: 'Va siempre: la ley pide por lo menos 6 meses para un mueble nuevo.',
    meses: (meses: number) => `${String(meses)} ${meses === 1 ? 'mes' : 'meses'}`,
    seCambiaEnAjustes: 'Se cambia en Ajustes',
  },
  mandar: {
    campos: {
      titulo: 'Título',
      muebles: 'Detalle',
      valores: 'Valores',
      queCambio: 'Qué cambió',
    },
    loQueFalta: {
      titulo: 'Ponele un título al trabajo.',
      muebles: 'Describí por lo menos un mueble.',
      total: 'Poné el total del presupuesto.',
      opciones: 'Cada opción necesita su importe.',
      queCambio: 'Contale a tu cliente qué cambió.',
      queCambioLargo: 'Lo que cambió tiene que entrar en 280 caracteres.',
    },
    leFaltaAlgo: 'Le falta algo para mandarlo',
    noSePudoMandar: 'No se pudo mandar el presupuesto.',
    numeroYCliente: (numero: string, cliente: string) => `Nº ${numero} · ${cliente}`,
    quePasa: 'Qué pasa al mandarlo',
    loVeYLoPuedeBajar:
      'Tu cliente lo ve en su página con el número y la fecha de hoy, y lo puede bajar en PDF.',
    loVeArribaDeLoQueCambio:
      'Tu cliente lo ve en su página con el número y la fecha de hoy, arriba de todo lo que cambió.',
    noVence: 'No vence: no le mostramos una fecha límite.',
    valeHasta: (fecha: string) => `Vale hasta el ${fecha}.`,
    pasaA: (estado: ReactNode) => <>Pasa a {estado}</>,
    seTilda: 'Se tilda «Armar el presupuesto» en Qué falta.',
    quedaGuardada: (revision: number) =>
      `La revisión ${String(revision)} queda guardada en la ficha, con su PDF.`,
    conLaReferencia: (dolar: string) =>
      `Cada total en dólares lleva sus pesos con el dólar a ${dolar} de hoy, y no se recalcula más.`,
    conElDolarDeHoy:
      'Cada total en dólares lleva sus pesos con el dólar de hoy, y no se recalcula más.',
    dolar: {
      pregunta: '¿A cuánto está hoy el dólar del presupuesto?',
      ayuda:
        'Hace falta para mandarlo: cada total en dólares lleva al lado sus pesos con este dólar. Queda como el dólar del día, y en este presupuesto no cambia más.',
    },
    queCambio: 'Qué cambió',
    contador: (usados: number, maximo: number) => `${String(usados)} de ${String(maximo)}`,
    ejemploDeQueCambio: 'Pasamos la alacena a Gris Grafito y sumamos…',
    loLeeTuCliente:
      'Lo lee tu cliente arriba del presupuesto. Hace falta para mandar una revisión.',
    cancelar: 'Cancelar',
    mandando: 'Mandando…',
    mandar: 'Mandar',
    guardando: 'Guardando…',
    listo: {
      titulo: 'Listo',
      numero: (numero: string) => `Nº ${numero}`,
      numeroYRevision: (numero: string, revision: number) =>
        `Nº ${numero} · Rev. ${String(revision)}`,
      yaLoPuedeVer: (nombre: string) => `${nombre} ya lo puede ver en su página.`,
      tuClienteYaLoPuedeVer: 'Tu cliente ya lo puede ver en su página.',
      yaVeLaRevision: (nombre: string, revision: number) =>
        `${nombre} ya ve la revisión ${String(revision)} en su página.`,
      tuClienteYaVeLaRevision: (revision: number) =>
        `Tu cliente ya ve la revisión ${String(revision)} en su página.`,
      avisale: 'Avisale por WhatsApp',
      conElEnlace: (Mensaje: Envoltorio, mensaje: string) => (
        <>
          «<Mensaje>{mensaje}</Mensaje>», con el enlace a su página.
        </>
      ),
      sinEnlace: 'Todavía no tiene enlace: al tocar, se crea y va en el mensaje.',
      mandarleElLink: 'Mandarle el link por WhatsApp',
      descargarElPdf: 'Descargar el PDF',
    },
    anotado: {
      titulo: 'Anotado sin señal',
      elPresupuesto: 'El presupuesto',
      laRevision: (revision: number) => `La revisión ${String(revision)}`,
      quedoEnLaCola: (nombre: string) =>
        `Quedó en la cola: apenas haya señal se manda solo, con su número, y ${nombre} lo ve en su página. El link por WhatsApp lo vas a tener en la tarjeta del presupuesto cuando se mande.`,
      quedoEnLaColaTuCliente:
        'Quedó en la cola: apenas haya señal se manda solo, con su número, y Tu cliente lo ve en su página. El link por WhatsApp lo vas a tener en la tarjeta del presupuesto cuando se mande.',
      listo: 'Listo',
    },
  },
  tarjeta: {
    todaviaSinTotal: 'Todavía sin total.',
    total: 'Total',
    acordadoAlAprobar: (monto: string) => `Acordado al aprobar: ${monto}`,
    todaviaSinMuebles: 'Todavía sin muebles.',
    muebles: 'Muebles',
    sinNombre: 'Sin nombre',
    rev: (revision: number) => `Rev. ${String(revision)}`,
    laPrimera: 'La primera que le mandaste.',
    revisionesAnteriores: 'Revisiones anteriores',
    armaloAca:
      'Armalo acá y tu cliente lo ve en su página: el detalle, lo que incluye, las condiciones y el total. También lo puede bajar en PDF.',
    armarElPresupuesto: 'Armar el presupuesto',
    borrador: 'Borrador',
    sinTituloTodavia: 'Sin título todavía',
    guardadoHoySinNumero: 'Guardado hoy · Todavía sin número',
    guardadoElSinNumero: (fecha: string) => `Guardado el ${fecha} · Todavía sin número`,
    seguirArmandolo: 'Seguir armándolo',
    mandado: (cuando: string) => `Mandado ${cuando}`,
    vencio: (fecha: string) => `Venció el ${fecha}. Mandá una revisión o cambiale la fecha.`,
    queCambioEnLaRevision: (revision: number) => `Qué cambió en la revisión ${String(revision)}`,
    cambiosSinMandar: (revision: number) =>
      `Tenés cambios sin mandar: tu cliente sigue viendo la revisión ${String(revision)}.`,
    hacerCambios: 'Hacer cambios',
    aceptado: 'Aceptado',
    loAcepto: (fecha: string) => `Lo aceptó el ${fecha}: es el presupuesto del trabajo.`,
    loAceptoConLaOpcion: (fecha: string, letra: string) =>
      `Lo aceptó el ${fecha}, con la opción ${letra}: es el presupuesto del trabajo.`,
  },
} as const;
