import type { Mensajes } from '../es';
import { plural } from './plural';

export const editarPerfil = {
  sinSenalParaLaFoto:
    "You can't change your photo offline: it uploads right away and isn't saved for later. Try again when you're back online.",
  hastaTantasLetras: ({ maximo }) =>
    plural(maximo, {
      one: 'Up to # character. Your first and last name is enough.',
      other: 'Up to # characters. Your first and last name is enough.',
    }),
  noSePudoLeerLaImagen: "Couldn't read that image.",
  fotoGuardada: 'Photo saved.',
  ponerUnaFoto: 'Add a photo',
  cambiarLaFoto: 'Change photo',
  todaviaSinNombre: 'No name yet',
  tuNombre: 'Your name',
  seVeEnLaBarraLateral:
    "It shows in the sidebar, next to your email. Your email is what you log in with, and it can't be changed here.",
  guardarElNombre: 'Save name',
  encuadrarLaFoto: 'Frame your photo',
  esteNavegadorNoPuedePrepararla: "This browser can't prepare the photo.",
  noSePudoPrepararla: "Couldn't prepare the photo. Try again.",
  arrastraLaFoto:
    'Drag the photo to frame it and use the zoom to get closer. With the keyboard: the arrow keys move it, and + and − zoom in or out.',
  recortadorDeFoto: 'photo cropper',
  encuadreDeLaFoto: 'Photo framing',
  alejar: 'Zoom out',
  zoom: 'Zoom',
  acercar: 'Zoom in',
  cancelar: 'Cancel',
  guardarLaFoto: 'Save photo',
} satisfies Mensajes['editarPerfil'];
