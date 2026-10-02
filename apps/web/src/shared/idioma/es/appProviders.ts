export const appProviders = {
  seGuardaronLasAnotadas: ({ veces }: { veces: number }) =>
    `Se guardaron las ${String(veces)} cosas que estaban anotadas sin señal.`,
  anotadasSinSenal: ({ veces }: { veces: number }) =>
    `${String(veces)} cosas anotadas sin señal: se guardan solas cuando vuelva.`,
  estabaAnotadoSinSenal: ({ hecho }: { hecho: string }) => `${hecho} Estaba anotado sin señal.`,
} as const;
