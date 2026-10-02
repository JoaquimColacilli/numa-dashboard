export const compartirConElCliente = {
  volverAlTrabajo: 'Volver al trabajo',
  titulo: 'Compartir con el cliente',
  queVe:
    'Ve el precio, lo que pagó, lo que falta, cómo pagarte y en qué anda el mueble. No ve tus costos, tu ganancia, el diezmo ni el despiece. El código QR abre el mismo enlace: quien lo escanea ve exactamente lo mismo, y darlo de baja apaga los dos.',
  verComoLoVeEl: 'Ver cómo lo ve él',
  sinEnlace: {
    titulo: 'Todavía no compartiste este trabajo',
    texto:
      'Se crea un enlace propio de este trabajo. Quien lo tenga puede abrirlo sin cuenta ni contraseña, así que pasáselo solo a tu cliente. Lo podés dar de baja cuando quieras.',
    crear: 'Crear el enlace',
  },
  deBaja: {
    titulo: 'El enlace está dado de baja',
    texto:
      'Si tu cliente lo abre, ve un aviso de que no funciona más y nada del trabajo. Podés crear uno nuevo cuando quieras; el anterior no vuelve.',
    crear: 'Crear un enlace nuevo',
  },
  activo: {
    elEnlace: 'El enlace',
    enlaceActivo: 'Enlace activo',
    creadoEl: (fecha: string) => `creado el ${fecha} · no vence`,
    copiar: 'Copiar',
    copiado: 'Copiado',
    enWhatsappVaADecir: 'En WhatsApp va a decir:',
    mandarseloPorWhatsapp: 'Mandárselo por WhatsApp',
    darDeBaja: 'Dar de baja',
    sinLaDireccion:
      'Este enlace se creó antes de que la dirección se guardara en tu taller, y la dirección quedó solo en la app de antes. El que tiene tu cliente ya no anda: creá uno nuevo y mandáselo.',
    crearUnoNuevo: 'Crear uno nuevo',
    noVeNingunArchivo: (total: number) =>
      `Con este enlace el cliente ve 0 de ${String(total)} archivos: elegí abajo cuáles le mostrás.`,
    archivosQueVe: (compartidos: number, total: number) =>
      `Con este enlace el cliente ve ${String(compartidos)} de ${String(total)} archivos.`,
    visitas: (veces: string) => `${veces}.`,
    visitasYLaUltima: (veces: string, fecha: string) => `${veces}. La última vez, el ${fecha}.`,
  },
  sinSenal: 'Para crear el enlace necesitás señal: se guarda en el momento y recién ahí funciona.',
  baja: {
    titulo: '¿Damos de baja el enlace?',
    texto:
      'Tu cliente va a dejar de ver el trabajo desde el enlace que le pasaste. Si después lo necesitás, creás uno nuevo.',
    dejarloComoEsta: 'Dejarlo como está',
    darloDeBaja: 'Darlo de baja',
  },
  comoTePaga: {
    titulo: 'Cómo te paga',
    elegi:
      'Elegí por cada pago cómo se lo cobrás. Tu cliente lo ve en su página, al lado de cuánto tiene que pagarte. La transferencia no te cuesta comisión.',
    nadaQueCobrar: 'Este trabajo ya está saldado: no queda nada por cobrar.',
    alMenosUna: 'Dejá al menos una: si no, tu cliente no sabe cómo pagarte.',
    sinDatosParaTransferir:
      'Todavía no cargaste alias ni CBU, así que por ahora solo podés cobrar en efectivo.',
    cargalosEnAjustes: 'Cargalos en Ajustes',
    comoTeLaPaga: {
      sena: 'La seña: cómo te la paga',
      saldo: 'El saldo: cómo te la paga',
    },
  },
  archivos: {
    titulo: 'Qué archivos ve',
    cuantosVe: (compartidos: number, total: number) =>
      `${String(compartidos)} de ${String(total)} compartidos`,
    marcaUnoPorUno: 'Marcá uno por uno. Lo que no marques, no existe para él.',
    noVeNinguno: (total: number) =>
      total === 1
        ? 'Tenés un archivo y el cliente no lo ve.'
        : `Tenés ${String(total)} archivos y el cliente no ve ninguno.`,
    prendeAbajo: 'Prendé abajo los que quieras mostrarle.',
    sinArchivos: 'Este trabajo todavía no tiene archivos. Se suben desde su ficha.',
    compartir: (nombre: string) => `Compartir ${nombre}`,
  },
  qr: {
    mostrarElQr: 'Mostrarle el código QR',
    titulo: 'Mostrale el código',
    escanealo: 'Escaneá con la cámara del celular',
    dibujando: 'Dibujando el código',
    codigoDelEnlace: (trabajo: string) => `Código QR del enlace de ${trabajo}`,
    copiado: 'Copiado',
    copiarElEnlace: 'Copiar el enlace',
    listo: 'Listo',
    esElMismoEnlace:
      'Es el mismo enlace que le mandás por WhatsApp: si lo das de baja, este código deja de andar.',
  },
} as const;
