import type { Mensajes } from '../es';
import { plural } from './plural';

export const appProviders = {
  seGuardaronLasAnotadas: ({ veces }) =>
    plural(veces, {
      one: 'Saved the item you added offline.',
      other: 'Saved the # items you added offline.',
    }),
  anotadasSinSenal: ({ veces }) =>
    plural(veces, {
      one: "# item added offline: it'll save on its own when you're back online.",
      other: "# items added offline: they'll save on their own when you're back online.",
    }),
  estabaAnotadoSinSenal: ({ hecho }) => `${hecho} It was added offline.`,
} satisfies Mensajes['appProviders'];
