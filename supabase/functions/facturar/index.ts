import { baseDeSupabase } from './base.ts';
import { configuracionDelEntorno } from './entorno.ts';
import { crearManejador } from './manejador.ts';

const configuracion = await configuracionDelEntorno(Deno.env);

Deno.serve(
  crearManejador({
    configuracion,
    base: baseDeSupabase(configuracion.supabaseUrl, configuracion.claveDelServidor),
    pedir: fetch,
    ahora: () => new Date(),
  }),
);
