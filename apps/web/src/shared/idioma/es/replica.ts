export const replica = {
  noSeSincronizo: (detalle: string) => `No se pudo sincronizar. ${detalle}`,
  sinRespuesta: 'El servidor tarda en responder. Sigue intentando solo.',
} as const;
