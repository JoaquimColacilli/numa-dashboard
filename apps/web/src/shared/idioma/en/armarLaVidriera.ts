import type { Mensajes } from '../es';
import { plural } from './plural';

const VUELVA = "Try the others when you're back online.";

export const armarLaVidriera = {
  losVideosNoVan:
    "Videos can't be uploaded: one from a phone weighs between 50 and 200 MB, and the space for the whole shop's files is 1 GB. Upload a photo or a screenshot from the video.",
  queSeSube: 'photos and screenshots',
  botonDeSumar: (cantidad) =>
    plural(cantidad, { '=0': 'Add photos', one: 'Add # photo', other: 'Add # photos' }),
  sinCompartir: (cantidad) =>
    plural(cantidad, {
      one: "One of the photos you picked isn't shared: the client of that job hasn't seen it yet. All your clients see your showcase, them included.",
      other:
        "# of the photos you picked aren't shared: the clients of those jobs haven't seen them yet. All your clients see your showcase, them included.",
    }),
  exceso: (elegidas, libres) =>
    plural(libres, {
      '=0': `You picked ${String(elegidas)} photos and your showcase has no room left.`,
      one: `You picked ${String(elegidas)} photos and your showcase has room for # more: only the first one will be uploaded.`,
      other: `You picked ${String(elegidas)} photos and your showcase has room for # more: only the first # will be uploaded.`,
    }),
  corteAlSumar: (hechas, total) =>
    plural(hechas, {
      '=0': `None were added: you went offline. ${VUELVA}`,
      one: `Only the first of the ${String(total)} was added: you went offline. ${VUELVA}`,
      other: `Only the first # of the ${String(total)} were added: you went offline. ${VUELVA}`,
    }),
  corteAlSubir: (hechas, total) =>
    plural(hechas, {
      '=0': `None were uploaded: you went offline. ${VUELVA}`,
      one: `Only the first of the ${String(total)} was uploaded: you went offline. ${VUELVA}`,
      other: `Only the first # of the ${String(total)} were uploaded: you went offline. ${VUELVA}`,
    }),
  noSePudoCopiar: (motivo) => `One of the photos couldn't be copied. ${motivo}`,
  origen: {
    subida: 'Uploaded for the showcase',
    deUnTrabajo: 'From a job',
    deTrabajo: (titulo) => `From “${titulo}”`,
  },
  sacaste: 'You removed a photo from your showcase.',
  deshacer: 'Undo',
  fotos: {
    sinNada:
      "There's nothing in your showcase yet. Your clients see it once you add a photo or a social link.",
    sinFotos: "You haven't added photos yet: your clients only see your social links.",
    acciones: {
      antes: 'Move earlier',
      despues: 'Move later',
      sacar: 'Remove',
    },
    llena: (tope) =>
      `Your showcase already has its ${String(tope)} photos. Remove one to add another.`,
    titulo: 'Photos',
    deTantas: (fotos, tope) => `${String(fotos)} of ${String(tope)}`,
    enOrden: 'Your showcase photos, in the order your client sees them',
    fotoDe: (numero, total) => `Photo ${String(numero)} of ${String(total)}`,
    sumar: 'Add photos',
  },
  hoja: {
    titulo: 'Add photos to the showcase',
    entranMas: (libres) =>
      plural(libres, {
        '=0': 'No room for more photos.',
        one: 'Room for # more photo.',
        other: 'Room for # more photos.',
      }),
    lasVenTodos: "All your clients see the photos you add, on each job's page.",
    deDondeSalen: 'Where the photos come from',
    pestanas: {
      trabajos: 'From your jobs',
      subir: 'Upload new',
    },
    sumaste: (cantidad) =>
      plural(cantidad, {
        one: 'You added a photo to your showcase.',
        other: 'You added # photos to your showcase.',
      }),
    fotoDelTrabajo: (numero, titulo) => `Photo ${String(numero)} from “${titulo}”`,
    yaEsta: 'Already in your showcase',
    sinCompartir: 'Not shared',
    sinFotosEnLosTrabajos:
      'There are no photos in your jobs yet. You can upload new ones in Upload new.',
    delCelular:
      "Photos or screenshots from your phone or computer. They're shrunk before uploading, like the ones in your jobs.",
    elegirFotos: 'Choose photos',
    sumando: (actual, total) => `Adding ${String(actual)} of ${String(total)}…`,
    subiendo: (actual, total) => `Uploading ${String(actual)} of ${String(total)}…`,
    elegisteTodas: (elegidas) =>
      `You picked ${String(elegidas)}: that's all your showcase can take.`,
    elegisteDe: (elegidas, libres) =>
      `You picked ${String(elegidas)} of the ${String(libres)} that fit.`,
    sumarIgual: 'Add anyway',
    revisar: 'Review',
    cancelar: 'Cancel',
  },
} satisfies Mensajes['armarLaVidriera'];
