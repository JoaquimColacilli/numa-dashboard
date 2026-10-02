import type { Mensajes } from '../es';
import { plural } from './plural';

export const adjuntarArchivos = {
  titulo: 'Files',
  queVeElCliente: (total, compartidos) =>
    plural(total, {
      one: `# file · the client sees ${String(compartidos)}`,
      other: `# files · the client sees ${String(compartidos)}`,
    }),
  queVeElClienteTodos: (total) =>
    plural(total, {
      one: '# file · the client can see it',
      other: '# files · the client sees all of them',
    }),
  queSeSube:
    "Photos, screenshots and PDFs. Photos are shrunk before uploading. Videos aren't allowed.",
  noVeNinguno:
    "The client can't see any of them: each file uploads as private and is shared one by one.",
  elegirCualesVe: 'Choose which ones they see',
  sinArchivos: 'No files for this job yet.',
  fotosEImagenes: 'Photos and images',
  ver: (nombre) => `View ${nombre}`,
  documentos: 'Documents',
  borrarUno: (nombre) => `Delete “${nombre}”`,
  subir: 'Upload photos or PDFs',
  subiendo: (actual, total) => `Uploading ${String(actual)} of ${String(total)}…`,
  recienSubidos: 'Just uploaded',
  borrar: 'Delete',
  subidos: (cantidad) => plural(cantidad, { one: 'File uploaded.', other: '# files uploaded.' }),
  borraste: (nombre) => `You deleted “${nombre}”.`,
  deshacer: 'Undo',
} satisfies Mensajes['adjuntarArchivos'];
