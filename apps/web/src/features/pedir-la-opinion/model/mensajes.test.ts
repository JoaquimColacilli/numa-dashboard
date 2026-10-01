import { describe, expect, it } from 'vitest';

import { despuesDeLaEntrega, mensajeDelPedido, mensajeDelRecordatorio } from './mensajes';

const ENLACE = 'https://maun.app/o/abc';

describe('los mensajes de WhatsApp', () => {
  it('el pedido saluda por el nombre, nombra el mueble sin adivinar su género y lleva el enlace', () => {
    expect(mensajeDelPedido('Marcela Duarte', 'Placard 3 puertas con interior', ENLACE)).toBe(
      'Hola Marcela, ya terminamos tu placard. ¿Nos contás en un minuto cómo te fue? https://maun.app/o/abc',
    );
    expect(mensajeDelPedido('', 'Mesa de comedor', ENLACE)).toBe(
      'Hola, ya terminamos tu mesa. ¿Nos contás en un minuto cómo te fue? https://maun.app/o/abc',
    );
  });

  it('el recordatorio avisa que es la segunda vez', () => {
    expect(mensajeDelRecordatorio('Omar Peralta', 'Placard de dos puertas', ENLACE)).toBe(
      'Hola Omar, te escribo de nuevo por si se te pasó: ¿nos contás cómo te fue con tu placard? Es un minuto. https://maun.app/o/abc',
    );
  });
});

describe('cuánto tardó en contestar', () => {
  it('lo dice en palabras, contando desde la entrega', () => {
    expect(despuesDeLaEntrega('2026-08-27', '2026-09-02')).toBe(
      ', seis días después de la entrega',
    );
    expect(despuesDeLaEntrega('2026-09-01', '2026-09-02')).toBe(', un día después de la entrega');
    expect(despuesDeLaEntrega('2026-09-02', '2026-09-02')).toBe(', el mismo día de la entrega');
    expect(despuesDeLaEntrega('2026-08-01', '2026-09-02')).toBe(', 32 días después de la entrega');
  });

  it('sin fecha de entrega, o con una posterior, no dice nada', () => {
    expect(despuesDeLaEntrega(null, '2026-09-02')).toBe('');
    expect(despuesDeLaEntrega('2026-09-10', '2026-09-02')).toBe('');
  });
});
