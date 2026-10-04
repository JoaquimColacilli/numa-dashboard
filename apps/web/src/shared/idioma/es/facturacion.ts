export const facturacion = {
  prueba: 'Prueba',
  resumen: {
    sinConectar: 'Todavía no está conectada. Se conecta una sola vez, con un trámite en ARCA.',
    conectada: (puntoDeVenta: string) => `Conectada con ARCA · Punto de venta ${puntoDeVenta}`,
    ver: 'Ver la facturación',
    etiqueta: 'Facturación con ARCA',
  },
  pagina: {
    titulo: 'Facturación',
    ajustes: 'Ajustes',
  },
  conexion: {
    titulo: 'La conexión con ARCA',
    sinConectar: 'Todavía no está conectada. Se conecta una sola vez, con un trámite en ARCA.',
    conectar: 'Conectar con ARCA',
    renovar: 'Renovar el certificado',
    arca: 'ARCA',
    conectada: 'Conectada',
    enPrueba: 'En prueba',
    cuit: 'CUIT',
    puntoDeVenta: 'Punto de venta',
    desde: 'Desde',
    modoPrueba: 'Estás en modo prueba: las facturas salen con «Prueba» y no valen para ARCA.',
    probar: 'Probar la conexión',
    sinSenal: 'Para probar la conexión necesitás señal.',
    anda: (numero: string) =>
      `ARCA contesta y NUMA entra bien. La última factura C es la ${numero}.`,
    andaSinFacturas:
      'ARCA contesta y NUMA entra bien. Todavía no hay facturas en este punto de venta.',
    noContesta: 'ARCA no contesta ahora. Probá en un rato.',
    noEntra: 'NUMA no pudo entrar a ARCA con el certificado.',
    esperando: (hora: string) => `Esperando a ARCA: probá de nuevo a las ${hora}.`,
    apagada: 'La facturación de verdad todavía no está prendida.',
    vence: (fecha: string) => `El certificado vence el ${fecha}.`,
    noSePudo: 'No se pudo probar la conexión. Probá de nuevo en un rato.',
  },
  datos: {
    titulo: 'Tus datos en las facturas',
    nombre: 'Nombre o razón social',
    domicilio: 'Domicilio',
    condicion: 'Condición',
    monotributo: 'Monotributo',
    soloMonotributo: 'NUMA factura solo si sos monotributista.',
    sinCargar: 'Sin cargar',
    seCambia: 'Se cambia en Tu presupuesto',
    ingresosBrutos: 'Ingresos Brutos',
    inicio: 'Inicio de actividades',
    ayuda: 'Estos datos salen en tus facturas. Si no sabés alguno, preguntale a tu contador.',
    ingresosBrutosLargo: (maximo: number) => `No puede pasar de ${String(maximo)} caracteres.`,
  },
  concepto: {
    titulo: 'Qué facturás',
    opciones: { 1: 'Productos', 2: 'Servicios', 3: 'Productos y servicios' },
    ayuda: 'Lo define tu contador. Cambia lo que dice la factura y las fechas que acepta ARCA.',
    muebles: (precio: string) =>
      `Si tu monotributo es de venta de cosas muebles, ningún mueble que vendas puede valer más de ${precio}. Si un trabajo lo pasa, hablalo con tu contador.`,
  },
  categoria: {
    titulo: 'Tu categoría del monotributo',
    sinElegir: 'Sin elegir',
    opcion: (letra: string, tope: string) => `${letra} · hasta ${tope} por año`,
    ayuda:
      'Se revisa hasta el 5 de febrero y el 5 de agosto, con lo que facturaste en los últimos 12 meses.',
  },
  cambios: {
    ingresosBrutos: 'Ingresos Brutos',
    inicio: 'el inicio de actividades',
    concepto: 'qué facturás',
    categoria: 'tu categoría',
    cuantos: (cuantos: number) => (cuantos === 1 ? '1 cambio' : `${String(cuantos)} cambios`),
  },
  asistente: {
    titulo: 'Conectar con ARCA',
    volver: 'Facturación',
    bajada:
      'Se hace una sola vez, desde una compu y con tu clave fiscal. Vas a ir y volver entre NUMA y la página de ARCA: NUMA te da un pedido de certificado, ARCA te lo firma y vos lo traés de vuelta acá.',
    antesDeEmpezar: 'Antes de empezar',
    loQueNecesitas:
      'Necesitás tu CUIT, tu clave fiscal de nivel 3 o más y tus datos completos en Tu presupuesto. Si tu clave es de nivel 2, la subís desde la app Mi ARCA o en una oficina de ARCA. Si tenés dudas sobre qué facturás, hablalo antes con tu contador.',
    enNuma: 'En NUMA',
    enArca: 'En ARCA',
    paso: (numero: number) => `Paso ${String(numero)}:`,
    hecho: 'Hecho.',
    sinSenal: 'Para esto necesitás señal.',
    apagada: 'La facturación de verdad todavía no está prendida. Avisale a Joaco.',
    enPrueba: 'Este taller está en modo prueba.',
    noSePudo: 'No se pudo. Probá de nuevo en un rato.',
    abreEnOtraPestana: 'se abre en una pestaña nueva',
    pedido: {
      titulo: 'Bajá el pedido del certificado',
      texto: 'Es un archivo que le pide a ARCA un certificado para NUMA.',
      bajar: 'Bajar el pedido',
      bajarDeNuevo: 'Bajar el pedido de nuevo',
      listo:
        'Listo: se bajó numa-produccion.csr. Si lo perdés, bajalo de nuevo y subí el nuevo a ARCA.',
      otroPedido: '¿Bajás otro pedido?',
      siBajasOtro: 'Si bajás otro pedido, el certificado que subiste deja de servir.',
      bajarOtro: 'Bajar otro pedido',
      cancelar: 'Cancelar',
      noMonotributo: 'NUMA factura solo si sos monotributista.',
      faltanTusDatos: 'Completá tu CUIT y tu nombre o razón social en Tu presupuesto.',
      irATuPresupuesto: 'Ir a Tu presupuesto',
    },
    ingresar: {
      titulo: 'Entrá a ARCA',
      texto: 'En arca.gob.ar tocá «Iniciar sesión» y entrá con tu CUIT y tu clave fiscal.',
    },
    certificados: {
      titulo: 'Abrí los certificados digitales',
      texto:
        'En tus servicios buscá «Administración de Certificados Digitales» y abrilo. Si te pregunta a quién representás, elegí tu nombre.',
      siNoLoEncontras:
        'Si no lo encontrás, sumalo desde «Administrador de Relaciones de Clave Fiscal» › «Nueva Relación», buscando ese servicio y confirmando con tu CUIT, y volvé a entrar a ARCA.',
    },
    alias: {
      titulo: 'Dá de alta el certificado de NUMA',
      texto:
        'Tocá «Agregar alias». En «Alias» escribí numa, en «Seleccionar archivo» elegí numa-produccion.csr y tocá «Agregar alias». Si ya tenés el alias numa (porque estás renovando o porque ya subiste otro pedido), entrá a «Ver» y agregá ahí el pedido nuevo.',
    },
    descargar: {
      titulo: 'Bajá el certificado',
      texto: 'En la lista, a la derecha de numa, tocá «Ver» y después «Descargar».',
      guia: 'La guía de ARCA para el certificado',
    },
    subir: {
      titulo: 'Subí el certificado',
      texto: 'Elegí el archivo que bajaste de ARCA.',
      elegir: 'Elegir el certificado',
      elegirOtro: 'Elegir otro certificado',
      archivo: 'El certificado que bajaste de ARCA',
      listo: (fecha: string) => `Certificado listo. Vence el ${fecha}.`,
      motivos: {
        'no-es-un-certificado': 'Ese archivo no es un certificado. Elegí el que bajaste de ARCA.',
        'no-es-de-este-pedido':
          'Ese certificado no es del último pedido que bajaste de NUMA. Subí ese pedido a ARCA y bajá el certificado de nuevo.',
        'otro-cuit': 'Ese certificado es de otro CUIT.',
        vencido: 'Ese certificado está vencido.',
      },
    },
    autorizar: {
      titulo: 'Autorizá el certificado a facturar',
      texto:
        'Volvé a tus servicios y abrí «Administrador de Relaciones de Clave Fiscal». Tocá «Nueva Relación» y después «Buscar». Elegí «ARCA» (en algunas pantallas dice «AFIP»), después «WebServices» y después «Facturación Electrónica».',
    },
    representante: {
      titulo: 'Elegí el certificado de NUMA',
      texto:
        'Tocá el segundo «Buscar», el del representante, elegí el certificado numa y tocá «Confirmar». En la pantalla que sigue, tocá «Confirmar» otra vez.',
      guia: 'La guía de ARCA para autorizarlo',
    },
    puntosDeVenta: {
      titulo: 'Abrí los puntos de venta',
      texto:
        'Volvé a tus servicios, buscá «Administración de puntos de venta y domicilios» y abrilo. Si te pide elegir a quién representás, elegí tu nombre. Tocá «A/B/M de puntos de venta / emisión» y cerrá el aviso de «ATENCION» que aparece.',
    },
    puntoDeVenta: {
      titulo: 'Creá el punto de venta de NUMA',
      texto: 'Tocá «Agregar..» y completá:',
      campos: [
        {
          termino: 'Número',
          texto: 'uno de cinco cifras que no estés usando, por ejemplo 00003. Anotalo.',
        },
        { termino: 'Nombre Fantasía', texto: 'NUMA.' },
        {
          termino: 'Sistema',
          texto: 'la que dice «Factura Electrónica», «Monotributo» y «Web Services».',
        },
        { termino: 'Nuevo domicilio', texto: 'el del taller.' },
        { termino: 'Actividad', texto: 'la del taller, la misma de tu monotributo.' },
      ],
      despues: 'Dejá vacío «Dominio Asociado». Tocá «Aceptar» y confirmá si te lo pregunta.',
    },
    conectar: {
      titulo: 'Conectá',
      texto: 'Escribí el número del punto de venta que creaste.',
      campo: 'Punto de venta',
      faltaElNumero: 'Escribí el número del punto de venta, de una a cinco cifras.',
      boton: 'Conectar',
      probando: 'Probando con ARCA…',
      listo: 'Listo, la facturación quedó conectada. Ya podés facturar tus cobros.',
      volver: 'Volver a Facturación',
      deVerdad: '¿Conectás la facturación de verdad?',
      desdeAhora:
        'Desde ahora, cada factura que hagas en NUMA va a ser real, a tu nombre y con validez fiscal.',
      cancelar: 'Cancelar',
      cambiarElCertificado: '¿Cambiás el certificado?',
      desdeAhoraElNuevo: 'Desde ahora, NUMA va a usar el certificado nuevo.',
      cambiar: 'Cambiar el certificado',
      certificadoCambiado: 'Listo, NUMA ya usa el certificado nuevo.',
      motivos: {
        'login-rechazado': 'ARCA no deja entrar con el certificado: revisá los pasos 7 y 8.',
        'sin-punto-de-venta': (puntoDeVenta: string) =>
          `ARCA no tiene el punto de venta ${puntoDeVenta} para web services: revisá el número o el paso 10.`,
        'punto-de-venta-de-otro-taller': 'Ese punto de venta ya lo usa otro taller en NUMA.',
        'comprobantes-en-vuelo':
          'Hay facturas de antes esperando a ARCA: probá de nuevo en un rato.',
        'otro-punto-de-venta': 'Para renovar, el punto de venta tiene que ser el mismo.',
        'otro-cuit': 'Ese certificado es de otro CUIT.',
        'sin-certificado': 'Primero subí el certificado, en el paso 6.',
        'arca-no-contesta': 'ARCA no contesta ahora. Probá en un rato.',
        esperando: (hora: string) => `ARCA pide esperar: probá de nuevo a las ${hora}.`,
      },
    },
    renovacion: {
      siNoDejaEntrar: 'Si ARCA no deja entrar con el certificado nuevo',
      rechazado:
        'ARCA no deja entrar con el certificado nuevo: autorizalo a facturar con los pasos 7 y 8.',
    },
    capturas: {
      '01-ingresar':
        'La pantalla de ingreso de ARCA, con el campo del CUIT y el botón «Siguiente».',
      '02-certificados-digitales':
        'El buscador de tus servicios en ARCA, con «Administración de Certificados Digitales» elegido.',
      '03-agregar-alias':
        'La pantalla «Agregar alias» de ARCA, con el alias numa y el archivo numa-produccion.csr elegido, antes de tocar «Agregar alias».',
      '04-descargar':
        'El certificado de numa en ARCA, después de tocar «Ver», con el botón «Descargar».',
      '05-elegir-el-servicio':
        'La pantalla «Nueva Relación» de ARCA, con el servicio «Facturación Electrónica» elegido y el segundo «Buscar», el del representante.',
      '06-representante':
        'El representante en ARCA, con el certificado numa elegido, antes de tocar «Confirmar».',
      '07-puntos-de-venta':
        'El menú de los puntos de venta de ARCA, con el botón «A/B/M de puntos de venta / emisión».',
      '08-agregar-punto-de-venta':
        'El alta del punto de venta en ARCA, completa con el número, NUMA, el sistema, el domicilio y la actividad, antes de tocar «Aceptar».',
    },
  },
  cobrosYFacturas: 'Cobros y facturas',
  renglon: {
    sinFacturar: 'Sin facturar',
    facturar: 'Facturar',
    facturarElPago: (monto: string, dia: string) => `Facturar el pago de ${monto} del ${dia}`,
    enDolares: 'En dólares: por ahora se factura a mano.',
    enCola: 'Factura pedida sin señal: sale cuando vuelva.',
    pidiendo: 'Pidiéndole la factura a ARCA…',
    demora: 'ARCA no contesta. NUMA lo sigue intentando.',
    anulando: (numero: string) => `Anulando la factura C ${numero}…`,
    anulada: (nombre: string) => `${nombre}, anulada`,
    noAnulo: (motivo: string) => `ARCA no anuló la factura: ${motivo}`,
    rechazada: (motivo: string) => `ARCA no la autorizó: ${motivo}`,
    volverAPedir: 'Volver a pedir',
    aRevisar: 'Revisala en ARCA: NUMA no sabe si quedó autorizada.',
  },
  motivos: {
    condicionIva: 'revisá la condición frente al IVA del cliente.',
    documento: 'revisá el CUIT o el DNI del cliente.',
    deArca: (texto: string, codigo: string) => `${texto} (código ${codigo}).`,
    sinMotivo: 'ARCA no dijo por qué.',
  },
  anuncios: {
    autorizada: (numero: string) => `La factura C ${numero} quedó autorizada.`,
    anulada: (numero: string) => `La factura C ${numero} quedó anulada.`,
    rechazada: 'ARCA no autorizó la factura.',
    notaRechazada: (numero: string) => `ARCA no anuló la factura C ${numero}.`,
    aRevisar: 'Hay una factura para revisar en ARCA.',
  },
  facturar: {
    titulo: 'Facturar este pago',
    rotulo: 'El comprobante',
    comprobante: 'Comprobante',
    facturaC: 'Factura C',
    puntoDeVenta: 'Punto de venta',
    numero: 'Número',
    elQueSiga: 'El que siga',
    fecha: 'Fecha',
    hoy: (dia: string) => `Hoy, ${dia}`,
    para: 'Para',
    sinCuit: 'sin CUIT',
    cuit: (cuit: string) => `CUIT ${cuit}`,
    dni: (dni: string) => `DNI ${dni}`,
    detalle: 'Detalle',
    ayudaDelDetalle: 'Es lo que dice la factura. Hasta 200 letras.',
    faltaElDetalle: 'Escribí el detalle de la factura.',
    importe: 'Importe',
    queFacturas: (que: string) => `Qué facturás: ${que} · se cambia en Ajustes`,
    modoPrueba: 'Estás en modo prueba: la factura no vale para ARCA.',
    conFechaDeHoy: (dia: string) => `Este cobro es del ${dia}: la factura sale con fecha de hoy.`,
    conEstaFactura: (llevas: string, letra: string, tope: string) =>
      `Con esta factura llevás ${llevas} facturados en los últimos 12 meses. Tu categoría ${letra} llega a ${tope}.`,
    loQueFalta: 'Lo que falta para facturar',
    completarlos: 'Completarlos',
    cargarElCuit: 'Cargar el CUIT',
    revisarElCuit: 'Revisar el CUIT',
    cargarElDomicilio: 'Cargar el domicilio',
    cargarElDni: 'Cargar el DNI',
    noSeBorra:
      'Una factura emitida no se borra. Si te equivocás, se anula con una nota de crédito.',
    emitir: (monto: string) => `Emitir la factura de ${monto}`,
    cancelar: 'Cancelar',
    sinSenal: 'Sin señal: la factura sale cuando vuelva.',
  },
  factura: {
    rotulo: 'La factura',
    fecha: 'Fecha',
    cae: 'CAE',
    venceElCae: 'Vence el CAE',
    importe: 'Importe',
    para: 'Para',
    detalle: 'Detalle',
    verElPdf: 'Ver el PDF',
    verElPdfDeLaNota: 'Ver el PDF de la nota',
    compartir: 'Compartir',
    anular: 'Anular la factura',
    anuladaCon: (numero: string, dia: string) =>
      `Anulada con la nota de crédito C ${numero} del ${dia}.`,
    aRevisar: (numero: string) =>
      `NUMA le pidió a ARCA la factura C ${numero} y no sabe si quedó autorizada. Fijate en ARCA, en Mis Comprobantes › Emitidos. Mientras tanto, este pago no se vuelve a facturar.`,
    notaARevisar: (numero: string) =>
      `NUMA le pidió a ARCA la nota de crédito C ${numero} y no sabe si quedó autorizada. Fijate en ARCA, en Mis Comprobantes › Emitidos.`,
  },
  anular: {
    pregunta: (numero: string) => `¿Anulás la factura C ${numero}?`,
    texto: (monto: string, cliente: string) =>
      `Sale una nota de crédito C por ${monto} para ${cliente}. Queda en ARCA y no se borra. Después podés volver a facturar este pago.`,
    emitir: 'Emitir la nota de crédito',
    dejarla: 'Dejarla como está',
  },
  cobro: {
    facturarElPagoFinal: 'Facturar el pago final con ARCA',
    aNombreDe: (nombre: string, condicion: string) => `Sale a nombre de ${nombre}, ${condicion}.`,
  },
  bloqueos: {
    pagoFacturado: 'Tiene una factura de ARCA: para cambiarlo, anulala primero.',
    trabajoConFacturas:
      'Este trabajo tiene facturas de ARCA y no se puede borrar. Si no sigue, dalo por perdido.',
  },
  monotributo: {
    titulo: 'Monotributo',
    sinCategoria: 'Sin categoría',
    categoriaDe: (letra: string) => `Categoría ${letra}`,
    facturados: 'facturados en los últimos 12 meses',
    rango: (desde: string) => `de ${desde} a hoy`,
    barra: (porcentaje: string, letra: string, tope: string) =>
      `${porcentaje} % del tope de la categoría ${letra}, ${tope}`,
    deTope: (porcentaje: string, tope: string) => `${porcentaje} % de ${tope}`,
    topeDeLa: (letra: string) => `tope de la ${letra}`,
    cerca: (letra: string) => `Te acercás al tope de la ${letra}.`,
    pasado: (letra: string) =>
      `Pasaste el tope de la ${letra}. En la próxima recategorización te toca otra: hablalo con tu contador.`,
    fuera: 'Pasaste el tope del monotributo. Hablalo ya con tu contador.',
    proxima: 'Próxima recategorización',
    hasta: (dia: string) => `hasta el ${dia}`,
    cobrosSinFacturar: 'Cobros sin facturar',
    cobros: (cuantos: number) => (cuantos === 1 ? '1 cobro' : `${String(cuantos)} cobros`),
    cobrosSinFacturarEnPalabras: (cuantos: number) =>
      cuantos === 1 ? '1 cobro sin facturar' : `${String(cuantos)} cobros sin facturar`,
    todosConFactura: (desde: string) => `Todos tus cobros desde el ${desde} tienen factura.`,
    pie: 'Cuenta lo que facturaste con NUMA. Si facturás por otro lado, miralo también en el Monitor de Facturación de ARCA.',
    elegiTuCategoria: 'Elegí tu categoría en Ajustes para ver cuánto te falta para el tope.',
    elegirLaCategoria: 'Elegir la categoría',
    enPrueba: 'En modo prueba no cuenta nada: las facturas de prueba no son de verdad.',
  },
  cobrosSinFacturar: {
    titulo: 'Cobros sin facturar',
    bajada: (desde: string) =>
      `Lo que cobraste en pesos desde el ${desde} y todavía no tiene factura.`,
    vacia: (desde: string) => `Todo lo que cobraste desde el ${desde} tiene su factura.`,
    detalle: (trabajo: string, dia: string) => `${trabajo} · ${dia}`,
  },
  alertas: {
    laFactura: 'la factura C',
    laNota: 'la nota de crédito C',
    fueraDeNuma: {
      tituloDeLaFactura: 'ARCA tiene una factura que NUMA no hizo',
      tituloDeLaNota: 'ARCA tiene una nota de crédito que NUMA no hizo',
      texto: (documento: string, puntoDeVenta: string, deArca: string, deNuma: string) =>
        `En el punto de venta ${puntoDeVenta}, ARCA va por ${documento} ${deArca} y NUMA hizo hasta la ${deNuma}. Si la hiciste por otro lado, está todo bien; si no, revisala en ARCA.`,
      sinNinguna: (documento: string, puntoDeVenta: string, deArca: string) =>
        `En el punto de venta ${puntoDeVenta}, ARCA va por ${documento} ${deArca} y NUMA todavía no hizo ninguna. Si la hiciste por otro lado, está todo bien; si no, revisala en ARCA.`,
      yaLoRevise: 'Ya lo revisé',
    },
    aRevisar: {
      tituloDeLaFactura: 'Hay una factura para revisar en ARCA',
      tituloDeLaNota: 'Hay una nota de crédito para revisar en ARCA',
      texto: (documento: string, numero: string, cliente: string) =>
        `NUMA pidió ${documento} ${numero} de ${cliente} y no sabe si quedó autorizada.`,
      verElTrabajo: 'Ver el trabajo',
    },
    certificado: {
      titulo: (fecha: string) => `El certificado de ARCA vence el ${fecha}`,
      texto: 'Sin certificado, NUMA no puede facturar. Renovalo antes de esa fecha.',
      renovar: 'Renovar el certificado',
    },
    sinAcceso: {
      titulo: 'NUMA no pudo entrar a ARCA',
      texto: 'Las facturas pedidas esperan. Probá la conexión en Ajustes.',
      probar: 'Probar la conexión',
    },
  },
} as const;
