import { describe, expect, it } from 'vitest';

import { resultadoDelError, resultadoDeResponder } from './responder';

describe('lo que la página hace con lo que contesta la puerta', () => {
  it('traduce el estado de la base', () => {
    expect(resultadoDeResponder('guardada')).toEqual({ tipo: 'guardada' });
    expect(resultadoDeResponder('ya_confirmada')).toEqual({ tipo: 'ya-confirmada' });
    expect(resultadoDeResponder('cambio')).toEqual({ tipo: 'cambio' });
  });

  it('sin señal, lo dice y guarda lo marcado', () => {
    expect(resultadoDelError(new TypeError('Failed to fetch'))).toEqual({
      tipo: 'error',
      motivo: 'sin-senal',
    });
  });

  it('un rechazo con motivo se explica con ese motivo', () => {
    expect(
      resultadoDelError({ code: 'MN020', message: 'x', details: 'domingo', hint: '' }),
    ).toEqual({ tipo: 'error', motivo: 'domingo' });
  });

  it('cualquier otra cosa pide probar de nuevo', () => {
    expect(resultadoDelError({ code: 'XX000', message: 'x', details: '', hint: '' })).toEqual({
      tipo: 'error',
      motivo: 'no-se-pudo',
    });
  });
});
