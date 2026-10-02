import type { Mensajes } from '../es';

export const appRouter = {
  sinTaller: 'Sua conta não ficou vinculada a nenhuma marcenaria.',
  elTallerSeCreaSolo:
    'A marcenaria é criada automaticamente quando você confirma a conta, então isso não deveria acontecer. Tente de novo; se continuar igual, saia e entre de novo.',
} satisfies Mensajes['appRouter'];
