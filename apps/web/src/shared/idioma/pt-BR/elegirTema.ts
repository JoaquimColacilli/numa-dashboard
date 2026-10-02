import type { Mensajes } from '../es';

export const elegirTema = {
  tema: 'Tema',
  opciones: {
    light: 'Claro',
    dark: 'Escuro',
    system: 'Igual ao sistema',
  },
  ahoraSeVeOscuro: 'Agora está escuro, porque o sistema está assim.',
  ahoraSeVeClaro: 'Agora está claro, porque o sistema está assim.',
  quedaElegido: 'Fica salvo neste dispositivo.',
} satisfies Mensajes['elegirTema'];
