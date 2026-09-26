import type { ComoQuedo } from '@/shared/lib';

export interface LoQueSeComparte {
  title: string;
  url: string;
}

export interface CompartirDelSistema {
  compartir: (datos: LoQueSeComparte) => Promise<void>;
  puede: (datos: LoQueSeComparte) => boolean;
}

export type ComoQuedoLoCompartido = 'compartido' | 'cancelado' | 'copiado' | 'fallo';

export function compartirDelSistema(): CompartirDelSistema | undefined {
  const compartir: unknown = Reflect.get(navigator, 'share');
  const puede: unknown = Reflect.get(navigator, 'canShare');
  if (typeof compartir !== 'function' || typeof puede !== 'function') return undefined;
  return {
    compartir: (compartir as CompartirDelSistema['compartir']).bind(navigator),
    puede: (puede as CompartirDelSistema['puede']).bind(navigator),
  };
}

function esCancelacion(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

export async function compartirLaRed(
  datos: LoQueSeComparte,
  medios: {
    delSistema: CompartirDelSistema | undefined;
    copiar: (texto: string) => Promise<ComoQuedo>;
  },
): Promise<ComoQuedoLoCompartido> {
  const { delSistema } = medios;
  if (delSistema !== undefined && delSistema.puede(datos)) {
    try {
      await delSistema.compartir(datos);
      return 'compartido';
    } catch (error) {
      return esCancelacion(error) ? 'cancelado' : 'fallo';
    }
  }
  return (await medios.copiar(datos.url)) === 'copiado' ? 'copiado' : 'fallo';
}
