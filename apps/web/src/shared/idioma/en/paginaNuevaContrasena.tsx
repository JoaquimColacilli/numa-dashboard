import type { Mensajes } from '../es';

export const paginaNuevaContrasena = {
  listoYaEntraste: "Done, you're in",
  guardamosLaContrasena:
    'Your new password is saved. If you log in from another device, use this one.',
  irAlTaller: 'Go to your shop',
  unSegundo: 'One moment',
  estamosValidando: 'Checking the link from your email.',
  verificandoElEnlace: 'Checking the link…',
  sinSenal: 'Offline',
  esteEnlaceNoSirve: "This link doesn't work",
  seValidaContraElServidor: "The link is checked against the server, and you're offline right now.",
  losEnlacesDelCorreo:
    'Email links only open in the same browser you requested them from, and they expire.',
  pedirOtroEnlace: 'Request another link',
  buscaSenal:
    'Get back online and open the email link again. If it no longer works, request a new one: the server only sends a few emails per hour.',
  pediUnoNuevo:
    'Request a new one from this device and open it without copying it to another browser.',
  seAbreDesdeElCorreo: 'This screen opens from your email',
  paraCambiarLaContrasena: 'To change your password, request the link and open it from the email.',
  volverAlTaller: 'Back to your shop',
  asiNadie: 'That way, nobody who picks up the unlocked device can change it.',
  poneUnaContrasenaNueva: 'Set a new password',
  esPara: ({ email, Fuerte }) => (
    <>
      It's for <Fuerte>{email}</Fuerte>.
    </>
  ),
} satisfies Mensajes['paginaNuevaContrasena'];
