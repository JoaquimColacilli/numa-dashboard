import type { Envoltorio } from '@/shared/lib';

export const paginaAjustes = {
  titulo: 'Ajustes',
  nuncaSeSincronizo: 'Todavía no se sincronizó con el servidor.',
  ultimaSincronizacion: ({ cuando }: { cuando: string }) => `Última sincronización: ${cuando}.`,
  sincronizando: 'Sincronizando…',
  sincronizarAhora: 'Sincronizar ahora',
  nadaRechazado: 'No hay nada rechazado ni ajustado.',
  verElSujeto: ({ sujeto }: { sujeto: string }) => `Ver «${sujeto}»`,
  tuPerfil: 'Tu perfil',
  apariencia: 'Apariencia',
  esteDispositivo: 'Este dispositivo',
  avisosDeLaAgenda: 'Avisos de la agenda',
  unRecordatorioALaManana:
    'Un recordatorio a la mañana con las entregas, las visitas, los presupuestos y los pagos que vencen. Se activa en cada dispositivo.',
  configurarLosAvisos: 'Configurar los avisos',
  entrarConLaHuella: 'Entrar con la huella',
  loQueLaBaseRechazo: 'Lo que la base rechazó o ajustó',
  quedaAcaHastaQueLoDescartes: 'Queda acá hasta que lo descartes, aunque cierres la app.',
  sueldoYCostosFijos: 'Sueldo y costos fijos',
  conEstoSeArmaLaFila:
    'Con esto se arma la fila de cada cobro: primero el diezmo, después los compromisos (tu sueldo y los costos fijos), y lo que sobra queda en Maun.',
  seArmanEnLaFila: 'Tu sueldo y los compromisos se arman en la fila de Tesoros.',
  verLaFila: 'Ver la fila en Tesoros',
  tuTaller: 'Tu taller',
  tuPresupuesto: 'Tu presupuesto',
  loQueVaEnCadaPresupuesto:
    'Lo que va en cada presupuesto que armás: tus datos, los números y los textos de siempre.',
  comoTePagan: 'Cómo te pagan',
  laCuentaALaQueTeTransfieren:
    'Es la cuenta a la que te transfiere tu cliente. Se cargan una vez y aparecen en la página que le compartís, al lado de lo que tiene que pagarte, con un botón para copiar cada uno. El titular y el CUIT le sirven para confirmar que es la cuenta correcta: su banco le muestra a nombre de quién está antes de confirmar. Recibir una transferencia no te cuesta comisión. Todos son opcionales: lo que dejes vacío, no se muestra.',
  elLinkDeMercadoPago:
    'El link de Mercado Pago es aparte y es opcional. Sacalo de tu app, en Cobrar → Link de pago → Link sin monto definido: se crea una sola vez y sirve para todos tus trabajos. Si lo cargás, tu cliente ve en su página un botón que le abre Mercado Pago para pagarte desde ahí, sin copiar nada: el monto se lo decimos arriba y lo escribe él. Va después de tu alias, que es la forma que no te cuesta comisión.',
  resenasEnGoogle: 'Reseñas en Google',
  lePedimosLaResena:
    'Cuando un cliente termina la encuesta, le pedimos que deje su opinión también en Google. Se le pide a todos, contesten lo que contesten: pedírsela solo a los que quedaron contentos va contra las reglas de Google, que pueden borrar las reseñas del taller. Si no cargás el enlace, ese pedido no aparece.',
  tuVidriera: 'Tu vidriera',
  loQueVenTusClientes: 'Lo que ven tus clientes en su página: fotos de otros trabajos y tus redes.',
  redes: 'Redes',
  corregirElSaldoDeCocos: 'Corregir el saldo de Cocos',
  espacioParaArchivos: 'Espacio para archivos',
  espacioUsado: ({ usado, total, Junto }: { usado: string; total: string; Junto: Envoltorio }) => (
    <>
      Las fotos y los PDF de los trabajos, y las fotos de tu vidriera, ocupan <Junto>{usado}</Junto>{' '}
      de <Junto>{total}</Junto>.
    </>
  ),
  seEstaLlenando:
    'Se está llenando. Cuando llegue a 1 GB no se van a poder subir más archivos, y pasado ese límite la app entera puede dejar de andar. Avisale a quien te mantiene la app antes de que se llene.',
  cuenta: 'Cuenta',
  versionDeLaApp: 'Versión de la app',
  avisos: 'Avisos',
  unRecordatorioConLoQueTenes:
    'Un recordatorio a la mañana con lo que tenés ese día. Nada de esto reemplaza a la agenda: lo que manda es lo que ves en la pantalla.',
} as const;
