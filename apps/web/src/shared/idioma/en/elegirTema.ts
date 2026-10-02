import type { Mensajes } from '../es';

export const elegirTema = {
  tema: 'Theme',
  opciones: {
    light: 'Light',
    dark: 'Dark',
    system: 'Same as system',
  },
  ahoraSeVeOscuro: "It's dark right now, because that's how your system is set.",
  ahoraSeVeClaro: "It's light right now, because that's how your system is set.",
  quedaElegido: 'Saved on this device.',
} satisfies Mensajes['elegirTema'];
