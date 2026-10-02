import type { Mensajes } from '../es';
import { plural } from './plural';

export const appProviders = {
  seGuardaronLasAnotadas: ({ veces }) =>
    plural(veces, {
      one: 'O item registrado sem internet foi salvo.',
      other: 'Os # itens registrados sem internet foram salvos.',
    }),
  anotadasSinSenal: ({ veces }) =>
    plural(veces, {
      one: '# item registrado sem internet: ele vai ser salvo sozinho quando a conexão voltar.',
      other:
        '# itens registrados sem internet: eles vão ser salvos sozinhos quando a conexão voltar.',
    }),
  estabaAnotadoSinSenal: ({ hecho }) => `${hecho} O registro foi feito sem internet.`,
} satisfies Mensajes['appProviders'];
