import type { Envoltorio } from '@/shared/lib';

export const paginaNuevaContrasena = {
  listoYaEntraste: 'Listo, ya entraste',
  guardamosLaContrasena:
    'Guardamos la contraseña nueva. Si entrás desde otro dispositivo, usá esta.',
  irAlTaller: 'Ir al taller',
  unSegundo: 'Un segundo',
  estamosValidando: 'Estamos validando el enlace del correo.',
  verificandoElEnlace: 'Verificando el enlace…',
  sinSenal: 'Sin señal',
  esteEnlaceNoSirve: 'Este enlace no sirve',
  seValidaContraElServidor: 'El enlace se valida contra el servidor y ahora no hay señal.',
  losEnlacesDelCorreo:
    'Los enlaces del correo se abren en el mismo navegador desde el que los pediste, y vencen.',
  pedirOtroEnlace: 'Pedir otro enlace',
  buscaSenal:
    'Buscá señal y volvé a abrir el enlace del correo. Si ya no funciona, pedí uno nuevo: el servidor manda pocos mails por hora.',
  pediUnoNuevo: 'Pedí uno nuevo desde este dispositivo y abrilo sin copiarlo a otro navegador.',
  seAbreDesdeElCorreo: 'Esta pantalla se abre desde el correo',
  paraCambiarLaContrasena:
    'Para cambiar la contraseña hay que pedir el enlace y abrirlo desde el mail.',
  volverAlTaller: 'Volver al taller',
  asiNadie: 'Así nadie que agarre el dispositivo desbloqueado puede cambiarla.',
  poneUnaContrasenaNueva: 'Poné una contraseña nueva',
  esPara: ({ email, Fuerte }: { email: string; Fuerte: Envoltorio }) => (
    <>
      Es para <Fuerte>{email}</Fuerte>.
    </>
  ),
} as const;
