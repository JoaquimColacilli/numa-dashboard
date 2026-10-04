import type { Mensajes } from '../es';

export const facturacion = {
  prueba: 'Test',
  resumen: {
    sinConectar: "It isn't connected yet. You connect it once, with a step on ARCA's site.",
    conectada: (puntoDeVenta) => `Connected to ARCA · Point of sale ${puntoDeVenta}`,
    ver: 'See invoicing',
    etiqueta: 'Invoicing with ARCA',
  },
  pagina: {
    titulo: 'Invoicing',
    ajustes: 'Settings',
  },
  conexion: {
    titulo: 'The connection to ARCA',
    sinConectar: "It isn't connected yet. You connect it once, with a step on ARCA's site.",
    conectar: 'Connect to ARCA',
    renovar: 'Renew the certificate',
    arca: 'ARCA',
    conectada: 'Connected',
    enPrueba: 'In test mode',
    cuit: 'CUIT',
    puntoDeVenta: 'Point of sale',
    desde: 'Since',
    modoPrueba: "You're in test mode: invoices come out marked “Test” and aren't valid for ARCA.",
    probar: 'Check the connection',
    sinSenal: 'You need to be online to check the connection.',
    anda: (numero) => `ARCA is responding and NUMA can log in. The last Factura C is ${numero}.`,
    andaSinFacturas:
      'ARCA is responding and NUMA can log in. There are no invoices at this point of sale yet.',
    noContesta: "ARCA isn't responding right now. Try again in a while.",
    noEntra: "NUMA couldn't log in to ARCA with the certificate.",
    esperando: (hora) => `Waiting on ARCA: try again at ${hora}.`,
    apagada: "Real invoicing isn't switched on yet.",
    vence: (fecha) => `The certificate expires on ${fecha}.`,
    noSePudo: "Couldn't check the connection. Try again in a while.",
  },
  datos: {
    titulo: 'Your details on invoices',
    nombre: 'Name or legal name',
    domicilio: 'Address',
    condicion: 'Tax status',
    monotributo: 'Monotributo',
    soloMonotributo: "NUMA only invoices if you're on the monotributo.",
    sinCargar: 'Not added',
    seCambia: 'Change it in Your quote',
    ingresosBrutos: 'Ingresos Brutos',
    inicio: 'Business start date',
    ayuda:
      "These details appear on your invoices. If you're not sure about one, ask your accountant.",
    ingresosBrutosLargo: (maximo) => `It can't be longer than ${String(maximo)} characters.`,
  },
  concepto: {
    titulo: 'What you invoice',
    opciones: { 1: 'Goods', 2: 'Services', 3: 'Goods and services' },
    ayuda:
      'Your accountant decides this. It changes what the invoice says and the dates ARCA accepts.',
    muebles: (precio) =>
      `If your monotributo is for selling goods, no piece you sell can be worth more than ${precio}. If a job goes over that, talk to your accountant.`,
  },
  categoria: {
    titulo: 'Your monotributo category',
    sinElegir: 'Not chosen',
    opcion: (letra, tope) => `${letra} · up to ${tope} a year`,
    ayuda:
      "It's reviewed by February 5 and August 5, based on what you invoiced in the last 12 months.",
  },
  cambios: {
    ingresosBrutos: 'Ingresos Brutos',
    inicio: 'the business start date',
    concepto: 'what you invoice',
    categoria: 'your category',
    cuantos: (cuantos) => (cuantos === 1 ? '1 change' : `${String(cuantos)} changes`),
  },
  asistente: {
    titulo: 'Connect to ARCA',
    volver: 'Invoicing',
    bajada:
      "You do this only once, from a computer and with your clave fiscal (your ARCA password). You'll go back and forth between NUMA and ARCA's site: NUMA gives you a certificate request, ARCA signs it and you bring it back here.",
    antesDeEmpezar: 'Before you start',
    loQueNecesitas:
      "You need your CUIT, a level 3 or higher clave fiscal and your details complete in Your quote. If your clave is level 2, you can raise it in the Mi ARCA app or at an ARCA office. If you're not sure what you invoice, talk to your accountant first.",
    enNuma: 'In NUMA',
    enArca: 'On ARCA',
    paso: (numero) => `Step ${String(numero)}:`,
    hecho: 'Done.',
    sinSenal: 'You need to be online for this.',
    apagada: "Real invoicing isn't switched on yet. Let Joaco know.",
    enPrueba: 'This shop is in test mode.',
    noSePudo: "That didn't work. Try again in a while.",
    abreEnOtraPestana: 'opens in a new tab',
    pedido: {
      titulo: 'Download the certificate request',
      texto: "It's a file that asks ARCA for a certificate for NUMA.",
      bajar: 'Download the request',
      bajarDeNuevo: 'Download the request again',
      listo:
        'Done: numa-produccion.csr was downloaded. If you lose it, download it again and upload the new one to ARCA.',
      otroPedido: 'Download another request?',
      siBajasOtro: 'If you download another request, the certificate you uploaded stops working.',
      bajarOtro: 'Download another request',
      cancelar: 'Cancel',
      noMonotributo: "NUMA only invoices if you're on the monotributo.",
      faltanTusDatos: 'Fill in your CUIT and your name or legal name in Your quote.',
      irATuPresupuesto: 'Go to Your quote',
    },
    ingresar: {
      titulo: 'Log in to ARCA',
      texto:
        'On arca.gob.ar, tap “Iniciar sesión” and log in with your CUIT and your clave fiscal.',
    },
    certificados: {
      titulo: 'Open the digital certificates',
      texto:
        'In your services, search for “Administración de Certificados Digitales” and open it. If it asks who you represent, choose your name.',
      siNoLoEncontras:
        "If you can't find it, add it from “Administrador de Relaciones de Clave Fiscal” › “Nueva Relación”, searching for that service and confirming with your CUIT, then log in to ARCA again.",
    },
    alias: {
      titulo: "Register NUMA's certificate",
      texto:
        "Tap “Agregar alias”. In “Alias” type numa, in “Seleccionar archivo” choose numa-produccion.csr and tap “Agregar alias”. If you already have the numa alias (because you're renewing or already uploaded another request), open “Ver” and add the new request there.",
    },
    descargar: {
      titulo: 'Download the certificate',
      texto: 'In the list, to the right of numa, tap “Ver” and then “Descargar”.',
      guia: "ARCA's guide to the certificate",
    },
    subir: {
      titulo: 'Upload the certificate',
      texto: 'Choose the file you downloaded from ARCA.',
      elegir: 'Choose the certificate',
      elegirOtro: 'Choose another certificate',
      archivo: 'The certificate you downloaded from ARCA',
      listo: (fecha) => `Certificate ready. It expires on ${fecha}.`,
      motivos: {
        'no-es-un-certificado':
          "That file isn't a certificate. Choose the one you downloaded from ARCA.",
        'no-es-de-este-pedido':
          "That certificate isn't from the last request you downloaded from NUMA. Upload that request to ARCA and download the certificate again.",
        'otro-cuit': 'That certificate belongs to another CUIT.',
        vencido: 'That certificate has expired.',
      },
    },
    autorizar: {
      titulo: 'Authorize the certificate to invoice',
      texto:
        'Go back to your services and open “Administrador de Relaciones de Clave Fiscal”. Tap “Nueva Relación” and then “Buscar”. Choose “ARCA” (some screens say “AFIP”), then “WebServices” and then “Facturación Electrónica”.',
    },
    representante: {
      titulo: "Choose NUMA's certificate",
      texto:
        'Tap the second “Buscar”, the one for the representative, choose the numa certificate and tap “Confirmar”. On the next screen, tap “Confirmar” again.',
      guia: "ARCA's guide to authorizing it",
    },
    puntosDeVenta: {
      titulo: 'Open the points of sale',
      texto:
        'Go back to your services, search for “Administración de puntos de venta y domicilios” and open it. If it asks who you represent, choose your name. Tap “A/B/M de puntos de venta / emisión” and close the “ATENCION” notice that appears.',
    },
    puntoDeVenta: {
      titulo: "Create NUMA's point of sale",
      texto: 'Tap “Agregar..” and fill in:',
      campos: [
        {
          termino: 'Número',
          texto: "a five-digit one you're not using, for example 00003. Write it down.",
        },
        { termino: 'Nombre Fantasía', texto: 'NUMA.' },
        {
          termino: 'Sistema',
          texto: 'the one that says “Factura Electrónica”, “Monotributo” and “Web Services”.',
        },
        { termino: 'Nuevo domicilio', texto: "your shop's address." },
        { termino: 'Actividad', texto: "your shop's, the same as in your monotributo." },
      ],
      despues: 'Leave “Dominio Asociado” empty. Tap “Aceptar” and confirm if it asks.',
    },
    conectar: {
      titulo: 'Connect',
      texto: 'Type the number of the point of sale you created.',
      campo: 'Point of sale',
      faltaElNumero: 'Type the point of sale number, one to five digits.',
      boton: 'Connect',
      probando: 'Checking with ARCA…',
      listo: 'Done, invoicing is connected. You can now invoice your payments.',
      volver: 'Back to Invoicing',
      deVerdad: 'Connect real invoicing?',
      desdeAhora:
        'From now on, every invoice you make in NUMA will be real, in your name and legally valid.',
      cancelar: 'Cancel',
      cambiarElCertificado: 'Change the certificate?',
      desdeAhoraElNuevo: 'From now on, NUMA will use the new certificate.',
      cambiar: 'Change the certificate',
      certificadoCambiado: 'Done, NUMA is now using the new certificate.',
      motivos: {
        'login-rechazado': "ARCA won't let NUMA in with the certificate: check steps 7 and 8.",
        'sin-punto-de-venta': (puntoDeVenta) =>
          `ARCA doesn't have point of sale ${puntoDeVenta} for web services: check the number or step 10.`,
        'punto-de-venta-de-otro-taller': 'Another shop in NUMA already uses that point of sale.',
        'comprobantes-en-vuelo':
          'There are earlier invoices waiting on ARCA: try again in a while.',
        'otro-punto-de-venta': 'To renew, the point of sale has to be the same.',
        'otro-cuit': 'That certificate belongs to another CUIT.',
        'sin-certificado': 'Upload the certificate first, in step 6.',
        'arca-no-contesta': "ARCA isn't responding right now. Try again in a while.",
        esperando: (hora) => `ARCA asks you to wait: try again at ${hora}.`,
      },
    },
    renovacion: {
      siNoDejaEntrar: "If ARCA won't let NUMA in with the new certificate",
      rechazado:
        "ARCA won't let NUMA in with the new certificate: authorize it to invoice with steps 7 and 8.",
    },
    capturas: {
      '01-ingresar': "ARCA's login screen, with the CUIT field and the “Siguiente” button.",
      '02-certificados-digitales':
        'The search box for your services on ARCA, with “Administración de Certificados Digitales” selected.',
      '03-agregar-alias':
        'The “Agregar alias” screen on ARCA, with the numa alias and the numa-produccion.csr file chosen, before tapping “Agregar alias”.',
      '04-descargar':
        "numa's certificate on ARCA, after tapping “Ver”, with the “Descargar” button.",
      '05-elegir-el-servicio':
        'The “Nueva Relación” screen on ARCA, with the “Facturación Electrónica” service selected and the second “Buscar”, the one for the representative.',
      '06-representante':
        'The representative on ARCA, with the numa certificate chosen, before tapping “Confirmar”.',
      '07-puntos-de-venta':
        'The points of sale menu on ARCA, with the “A/B/M de puntos de venta / emisión” button.',
      '08-agregar-punto-de-venta':
        'The new point of sale on ARCA, filled in with the number, NUMA, the system, the address and the activity, before tapping “Aceptar”.',
    },
  },
} satisfies Mensajes['facturacion'];
