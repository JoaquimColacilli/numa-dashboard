import type { Mensajes } from '../es';
import { plural } from './plural';

export const cerrarSesion = {
  hayCambiosSinSincronizar: ({ cantidad }) =>
    plural(cantidad, {
      one: "# change isn't synced: if you log out, it'll be lost.",
      other: "# changes aren't synced: if you log out, they'll be lost.",
    }),
  cerrarSesionIgual: 'Log out anyway',
  cerrando: 'Logging out…',
  cerrarSesion: 'Log out',
  hayCambiosDeEsteTelefono: ({ cantidad }) =>
    plural(cantidad, {
      one: "There's # change on this phone that isn't synced.",
      other: "There are # changes on this phone that aren't synced.",
    }),
  siEntrasConOtraCuenta: ({ cantidad }) =>
    plural(cantidad, {
      one: "If you log in with another account, the change is deleted from this phone and never reaches the shop: there's no way to get it back.",
      other:
        "If you log in with another account, the changes are deleted from this phone and never reach the shop: there's no way to get them back.",
    }),
  paraNoPerderlosSinSenal: ({ cantidad }) =>
    plural(cantidad, {
      one: "To keep it, log in with your fingerprint and wait until you're back online so it can sync.",
      other:
        "To keep them, log in with your fingerprint and wait until you're back online so they can sync.",
    }),
  paraNoPerderlosConSenal: ({ cantidad }) =>
    plural(cantidad, {
      one: 'To keep it, log in with your fingerprint or password and wait for it to sync.',
      other: 'To keep them, log in with your fingerprint or password and wait for them to sync.',
    }),
  saliendo: 'Logging out…',
  borrarYSalir: ({ cantidad }) =>
    plural(cantidad, {
      one: 'Delete the change and log out',
      other: 'Delete the # changes and log out',
    }),
  noVolver: 'No, go back',
  entrarConOtraCuenta: 'Log in with another account',
} satisfies Mensajes['cerrarSesion'];
