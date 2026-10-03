import type { Mensajes } from '../es';

export const archivo = {
  sinSenal:
    "You can't upload files offline: they upload right away and aren't saved for later. Try again when you're back online.",
  losVideosNoEntran:
    "Videos can't be uploaded: one from a phone weighs between 50 and 200 MB, and the space for the whole shop's files is 1 GB. Upload photos or screenshots from the video, and drawings and quotes as PDFs.",
  queSeSubeAUnTrabajo: 'photos, screenshots and PDFs',
  noSePuedeSubir: (nombre, queSeSube) =>
    `“${nombre}” can't be uploaded. You can upload ${queSeSube}.`,
  pdfMuyPesado: (nombre, peso) =>
    `“${nombre}” is ${peso}, and a PDF can be up to 10 MB. If it's a scan, save it at a lower quality and try again.`,
  sinNombre: 'File',
  navegadorSinLienzo: "This browser can't prepare the image.",
  noSePudoPreparar: "Couldn't prepare the image. Try again.",
  conElNombre: (nombre, motivo) => `“${nombre}”: ${motivo}`,
  noSeSubio: (nombre, motivo) => `Couldn't upload “${nombre}”. ${motivo}`,
} satisfies Mensajes['archivo'];
