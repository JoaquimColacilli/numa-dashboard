import { describe, expect, it } from 'vitest';

import {
  cargarMensajesDelCliente,
  MENSAJES_DEL_CLIENTE_EN_CASTELLANO,
} from '@/shared/idioma-del-cliente';

import {
  enlaceParaEscribir,
  mensajeParaElCliente,
  telefonoParaWhatsapp,
  whatsappCon,
} from './telefono';

const TEXTOS = MENSAJES_DEL_CLIENTE_EN_CASTELLANO.whatsapp;

describe('el teléfono para WhatsApp', () => {
  it('un número de acá va con el 54 y el 9, sin el cero ni el quince', () => {
    expect(telefonoParaWhatsapp('11 5555-5555')).toBe('5491155555555');
    expect(telefonoParaWhatsapp('011 15 5555-5555')).toBe('5491155555555');
  });

  it('sin dígitos no hay a dónde escribir', () => {
    expect(telefonoParaWhatsapp('')).toBeNull();
    expect(telefonoParaWhatsapp('sin teléfono')).toBeNull();
  });
});

describe('el enlace para escribir', () => {
  it('abre WhatsApp con el mensaje ya escrito', () => {
    expect(
      enlaceParaEscribir('11 5555-5555', 'Hola, te escribo por el presupuesto Nº 20260920-01.'),
    ).toBe(
      'https://wa.me/5491155555555?text=Hola%2C%20te%20escribo%20por%20el%20presupuesto%20N%C2%BA%2020260920-01.',
    );
  });

  it('sin teléfono no hay enlace', () => {
    expect(enlaceParaEscribir('', 'Hola')).toBeNull();
  });
});

describe('el mensaje para el cliente', () => {
  it('lo saluda por el nombre y le manda la dirección', () => {
    expect(
      mensajeParaElCliente(TEXTOS, 'Marcela Duarte', 'Placard 3 puertas', 'https://m/v/t'),
    ).toBe('Hola Marcela, acá podés ver cómo va tu placard 3 puertas: https://m/v/t');
  });

  it('sin nombre saluda igual', () => {
    expect(mensajeParaElCliente(TEXTOS, '  ', 'Mesada', 'https://m/v/t')).toContain(
      'Hola, acá podés ver',
    );
  });

  it('con un pago pendiente, también le dice que ahí ve cómo pagarlo', () => {
    expect(mensajeParaElCliente(TEXTOS, 'Marcela', 'Placard', 'https://m/v/t', true)).toBe(
      'Hola Marcela, acá podés ver cómo va y cómo pagarlo tu placard: https://m/v/t',
    );
  });

  it('con todo pagado, el mensaje es el de siempre', () => {
    expect(mensajeParaElCliente(TEXTOS, 'Marcela', 'Placard', 'https://m/v/t', false)).toBe(
      'Hola Marcela, acá podés ver cómo va tu placard: https://m/v/t',
    );
  });

  it('en inglés y en portugués deja el trabajo como lo escribió el dueño', async () => {
    const en = (await cargarMensajesDelCliente('en')).whatsapp;
    const ptBR = (await cargarMensajesDelCliente('pt-BR')).whatsapp;
    expect(mensajeParaElCliente(en, 'Marcela Duarte', 'Placard 3 puertas', 'https://m/v/t')).toBe(
      'Hi Marcela, you can see how Placard 3 puertas is coming along here: https://m/v/t',
    );
    expect(mensajeParaElCliente(ptBR, '', 'Placard', 'https://m/v/t', true)).toBe(
      'Olá. Aqui você acompanha o andamento de Placard e vê como pagar: https://m/v/t',
    );
  });

  it('en los tres idiomas la dirección va al final, después de los dos puntos', async () => {
    for (const idioma of ['es', 'en', 'pt-BR'] as const) {
      const textos = (await cargarMensajesDelCliente(idioma)).whatsapp;
      for (const conPago of [false, true]) {
        for (const cliente of ['Marcela', '']) {
          expect(mensajeParaElCliente(textos, cliente, 'Placard', '', conPago)).toMatch(/: $/u);
        }
      }
    }
  });
});

describe('WhatsApp con el mensaje', () => {
  it('con teléfono abre el chat de esa persona, y sin teléfono deja elegir a quién', () => {
    expect(whatsappCon('+54 9 11 4088-2210', 'hola')).toBe('https://wa.me/5491140882210?text=hola');
    expect(whatsappCon('', 'hola')).toBe('https://wa.me/?text=hola');
    expect(whatsappCon('', '¿Cómo te fue?')).toBe(
      'https://wa.me/?text=%C2%BFC%C3%B3mo%20te%20fue%3F',
    );
  });

  it('un número cargado como se dice acá abre el chat de esa persona, no uno de otro país', () => {
    expect(whatsappCon('11 4088-2210', 'hola')).toBe('https://wa.me/5491140882210?text=hola');
    expect(whatsappCon('011 15 4088-2210', 'hola')).toBe('https://wa.me/5491140882210?text=hola');
  });
});
