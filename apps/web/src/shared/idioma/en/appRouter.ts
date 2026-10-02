import type { Mensajes } from '../es';

export const appRouter = {
  sinTaller: "Your account isn't linked to any shop.",
  elTallerSeCreaSolo:
    "Your shop is created automatically when you confirm your account, so this shouldn't happen. Try again; if it keeps happening, log out and log back in.",
} satisfies Mensajes['appRouter'];
