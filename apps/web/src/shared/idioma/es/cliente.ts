export const cliente = {
  origenes: {
    referido: {
      etiqueta: 'Referido',
      detalle: 'Lo recomendó alguien que ya trabajó con el taller.',
    },
    volvio: {
      etiqueta: 'Cliente que volvió',
      detalle: 'Ya había hecho un trabajo y volvió por otro.',
    },
    redes: {
      etiqueta: 'Instagram',
      detalle: 'Escribió por las redes del taller.',
    },
    cartel: {
      etiqueta: 'Cartel del taller',
      detalle: 'Pasó por la puerta y vio el cartel.',
    },
    otro: {
      etiqueta: 'Otro',
      detalle: 'Llegó por otro camino.',
    },
  },
  condiciones: {
    consumidor_final: { etiqueta: 'Consumidor final', comprobante: 'remito o factura B' },
    monotributo: { etiqueta: 'Monotributo', comprobante: 'factura C' },
    responsable_inscripto: { etiqueta: 'Responsable inscripto', comprobante: 'factura A' },
    exento: { etiqueta: 'Exento', comprobante: 'factura B' },
  },
  cuit: 'CUIT',
  cuitOCuil: 'CUIT o CUIL',
  ordenes: {
    nombre: 'Nombre',
    ultimo: 'Último trabajo',
    facturado: 'Total facturado',
  },
  formulario: {
    largoMaximo: (maximo: number): string => `No puede pasar de ${String(maximo)} caracteres.`,
    faltaElNombre: 'El nombre es lo único que no puede faltar.',
    revisaElMail: 'Revisá el mail: le falta el arroba o el punto.',
    cuitIncompleto: (digitos: number): string =>
      `Un CUIT tiene ${String(digitos)} dígitos. Dejalo vacío si no lo tenés a mano.`,
    cuitAmbiguo:
      'El verificador de este CUIT cae en el caso que no tiene convención única. Guardalo igual si lo copiaste bien.',
    cuitConOtroPrefijo:
      'Los CUIT arrancan con 20, 23, 24, 27, 30, 33 o 34. Guardalo igual si es el que te pasaron.',
    cuitQueNoCierra: 'El dígito verificador no cierra. Revisalo, pero podés guardarlo igual.',
  },
  contacto: {
    llamar: 'Llamar',
    whatsapp: 'WhatsApp',
    llamarA: (nombre: string): string => `Llamar a ${nombre}`,
    escribirleA: (nombre: string): string => `Escribirle a ${nombre} por WhatsApp`,
    llamarASinTelefono: (nombre: string): string => `Llamar a ${nombre}: no tiene teléfono cargado`,
    escribirleASinTelefono: (nombre: string): string =>
      `Escribirle a ${nombre} por WhatsApp: no tiene teléfono cargado`,
    sinTelefono: 'Sin teléfono cargado',
    agregaloDesdeEditar:
      'Sin teléfono cargado: agregalo desde Editar para poder llamar o escribir.',
  },
  combobox: {
    cliente: 'Cliente',
    sinDatos: 'Sin datos de contacto todavía',
    cambiar: (nombre: string): string => `Cambiar el cliente, ahora ${nombre}`,
    buscar: 'Buscá por nombre, o escribí uno nuevo',
    crear: (nombre: string): string => `Crear «${nombre}»`,
    quedaCargado: 'Queda cargado con el nombre; el resto lo completás después',
  },
} as const;
