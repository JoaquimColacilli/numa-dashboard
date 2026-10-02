export const armarLaVidriera = {
  losVideosNoVan:
    'Los videos no se pueden subir: uno del celular pesa entre 50 y 200 MB, y el espacio para los archivos de todo el taller es de 1 GB. Subí una foto o una captura del video.',
  queSeSube: 'fotos y capturas',
  botonDeSumar: (cantidad: number): string =>
    cantidad === 0
      ? 'Sumar fotos'
      : cantidad === 1
        ? 'Sumar 1 foto'
        : `Sumar ${String(cantidad)} fotos`,
  sinCompartir: (cantidad: number): string =>
    cantidad === 1
      ? 'Una de las fotos que elegiste está sin compartir: el cliente de ese trabajo todavía no la vio. En tu vidriera la ven todos tus clientes, también él.'
      : `${String(cantidad)} de las fotos que elegiste están sin compartir: los clientes de esos trabajos todavía no las vieron. En tu vidriera las ven todos tus clientes, también ellos.`,
  exceso: (elegidas: number, libres: number): string =>
    libres === 1
      ? `Elegiste ${String(elegidas)} fotos y en tu vidriera entra 1 más: se suben la primera.`
      : `Elegiste ${String(elegidas)} fotos y en tu vidriera entran ${String(libres)} más: se suben las primeras ${String(libres)}.`,
  corteAlSumar: (hechas: number, total: number): string =>
    hechas === 0
      ? 'No se sumó ninguna: se cortó la señal. Probá con las demás cuando vuelva.'
      : hechas === 1
        ? `Se sumaron la primera de las ${String(total)}: se cortó la señal. Probá con las demás cuando vuelva.`
        : `Se sumaron las primeras ${String(hechas)} de las ${String(total)}: se cortó la señal. Probá con las demás cuando vuelva.`,
  corteAlSubir: (hechas: number, total: number): string =>
    hechas === 0
      ? 'No se subió ninguna: se cortó la señal. Probá con las demás cuando vuelva.'
      : hechas === 1
        ? `Se subieron la primera de las ${String(total)}: se cortó la señal. Probá con las demás cuando vuelva.`
        : `Se subieron las primeras ${String(hechas)} de las ${String(total)}: se cortó la señal. Probá con las demás cuando vuelva.`,
  noSePudoCopiar: (motivo: string): string => `Una de las fotos no se pudo copiar. ${motivo}`,
  origen: {
    subida: 'Subida para la vidriera',
    deUnTrabajo: 'De un trabajo',
    deTrabajo: (titulo: string): string => `De «${titulo}»`,
  },
  sacaste: 'Sacaste una foto de tu vidriera.',
  deshacer: 'Deshacer',
  fotos: {
    sinNada:
      'Todavía no hay nada en tu vidriera. Tus clientes la ven cuando sumes una foto o cargues una red.',
    sinFotos: 'Todavía no sumaste fotos: tus clientes ven solo tus redes.',
    acciones: {
      antes: 'Mover antes',
      despues: 'Mover después',
      sacar: 'Sacar',
    },
    llena: (tope: number): string =>
      `Tu vidriera ya tiene sus ${String(tope)} fotos. Sacá una para sumar otra.`,
    titulo: 'Fotos',
    deTantas: (fotos: number, tope: number): string => `${String(fotos)} de ${String(tope)}`,
    enOrden: 'Las fotos de tu vidriera, en el orden en que las ve tu cliente',
    fotoDe: (numero: number, total: number): string => `Foto ${String(numero)} de ${String(total)}`,
    sumar: 'Sumar fotos',
  },
  hoja: {
    titulo: 'Sumar fotos a la vidriera',
    entranMas: (libres: number): string =>
      libres === 1 ? 'Entra 1 foto más.' : `Entran ${String(libres)} fotos más.`,
    lasVenTodos: 'Las fotos que sumes las ven todos tus clientes, en la página de cada trabajo.',
    deDondeSalen: 'De dónde salen las fotos',
    pestanas: {
      trabajos: 'De tus trabajos',
      subir: 'Subir nuevas',
    },
    sumaste: (cantidad: number): string =>
      cantidad === 1
        ? 'Sumaste una foto a tu vidriera.'
        : `Sumaste ${String(cantidad)} fotos a tu vidriera.`,
    fotoDelTrabajo: (numero: number, titulo: string): string =>
      `Foto ${String(numero)} de «${titulo}»`,
    yaEsta: 'Ya está en tu vidriera',
    sinCompartir: 'Sin compartir',
    sinFotosEnLosTrabajos:
      'Todavía no hay fotos en tus trabajos. Podés subir fotos nuevas en «Subir nuevas».',
    delCelular:
      'Fotos o capturas del celular o de la compu. Se achican antes de subirse, como las de los trabajos.',
    elegirFotos: 'Elegir fotos',
    sumando: (actual: number, total: number): string =>
      `Sumando ${String(actual)} de ${String(total)}…`,
    subiendo: (actual: number, total: number): string =>
      `Subiendo ${String(actual)} de ${String(total)}…`,
    elegisteTodas: (elegidas: number): string =>
      `Elegiste ${String(elegidas)}: es lo que entra en tu vidriera.`,
    elegisteDe: (elegidas: number, libres: number): string =>
      `Elegiste ${String(elegidas)} de ${String(libres)} que entran.`,
    sumarIgual: 'Sumar igual',
    revisar: 'Revisar',
    cancelar: 'Cancelar',
  },
} as const;
