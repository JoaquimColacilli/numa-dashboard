export const editarPerfil = {
  sinSenalParaLaFoto:
    'Sin señal no se puede cambiar la foto: se sube en el momento y no queda anotada para después. Probá cuando vuelva la señal.',
  hastaTantasLetras: ({ maximo }: { maximo: number }) =>
    `Hasta ${String(maximo)} letras. Con el nombre y el apellido alcanza.`,
  noSePudoLeerLaImagen: 'No se pudo leer esa imagen.',
  fotoGuardada: 'Foto guardada.',
  ponerUnaFoto: 'Poner una foto',
  cambiarLaFoto: 'Cambiar la foto',
  todaviaSinNombre: 'Todavía sin nombre',
  tuNombre: 'Tu nombre',
  seVeEnLaBarraLateral:
    'Se ve en la barra lateral, al lado de tu mail. El mail es con el que entrás y no se cambia desde acá.',
  guardarElNombre: 'Guardar el nombre',
  encuadrarLaFoto: 'Encuadrar la foto',
  esteNavegadorNoPuedePrepararla: 'Este navegador no puede preparar la foto.',
  noSePudoPrepararla: 'No se pudo preparar la foto. Probá de nuevo.',
  arrastraLaFoto:
    'Arrastrá la foto para encuadrarla y acercala con el zoom. Con el teclado: las flechas la mueven y + y − la acercan o la alejan.',
  recortadorDeFoto: 'recortador de foto',
  encuadreDeLaFoto: 'Encuadre de la foto',
  alejar: 'Alejar',
  zoom: 'Zoom',
  acercar: 'Acercar',
  cancelar: 'Cancelar',
  guardarLaFoto: 'Guardar la foto',
} as const;
