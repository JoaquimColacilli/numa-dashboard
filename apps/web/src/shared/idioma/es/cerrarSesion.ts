export const cerrarSesion = {
  hayCambiosSinSincronizar: ({ cantidad }: { cantidad: number }): string =>
    cantidad === 1
      ? 'Hay 1 cambio sin sincronizar: si cerrás sesión, se pierde.'
      : `Hay ${String(cantidad)} cambios sin sincronizar: si cerrás sesión, se pierden.`,
  cerrarSesionIgual: 'Cerrar sesión igual',
  cerrando: 'Cerrando…',
  cerrarSesion: 'Cerrar sesión',
  hayCambiosDeEsteTelefono: ({ cantidad }: { cantidad: number }): string =>
    cantidad === 1
      ? 'Hay 1 cambio de este teléfono sin sincronizar.'
      : `Hay ${String(cantidad)} cambios de este teléfono sin sincronizar.`,
  siEntrasConOtraCuenta: ({ cantidad }: { cantidad: number }): string =>
    cantidad === 1
      ? 'Si entrás con otra cuenta, se borra de este teléfono y no llega al taller: no hay forma de recuperarlo.'
      : 'Si entrás con otra cuenta, se borran de este teléfono y no llegan al taller: no hay forma de recuperarlos.',
  paraNoPerderlosSinSenal: ({ cantidad }: { cantidad: number }): string =>
    cantidad === 1
      ? 'Para no perderlo, entrá con la huella y esperá a que vuelva la señal para que se sincronice.'
      : 'Para no perderlos, entrá con la huella y esperá a que vuelva la señal para que se sincronicen.',
  paraNoPerderlosConSenal: ({ cantidad }: { cantidad: number }): string =>
    cantidad === 1
      ? 'Para no perderlo, entrá con la huella o la contraseña y esperá a que se sincronice.'
      : 'Para no perderlos, entrá con la huella o la contraseña y esperá a que se sincronicen.',
  saliendo: 'Saliendo…',
  borrarYSalir: ({ cantidad }: { cantidad: number }): string =>
    cantidad === 1 ? 'Borrar el cambio y salir' : `Borrar los ${String(cantidad)} cambios y salir`,
  noVolver: 'No, volver',
  entrarConOtraCuenta: 'Entrar con otra cuenta',
} as const;
