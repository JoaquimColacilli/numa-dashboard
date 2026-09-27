import { enOrden, type FilaEnLaVidriera } from '@maun/domain';

import { filaPorId, filasDe, type Replica } from '@/shared/api';

import type { FotoEnLaVidriera } from '../api/mutacion';

export const SUBIDA_PARA_LA_VIDRIERA = 'Subida para la vidriera';

export const DE_UN_TRABAJO = 'De un trabajo';

export function filaParaOrdenar(foto: FotoEnLaVidriera): FilaEnLaVidriera {
  return { id: foto.id, orden: foto.orden, creadaEn: foto.created_at };
}

export function fotosDeLaVidriera(replica: Replica): FotoEnLaVidriera[] {
  const fotos = filasDe(replica, 'fotos_de_la_vidriera').map((foto) => ({
    ...filaParaOrdenar(foto),
    foto,
  }));
  return enOrden(fotos).map((una) => una.foto);
}

export function origenDeLaFoto(replica: Replica, foto: FotoEnLaVidriera): string {
  if (foto.archivo_de_origen === null) return SUBIDA_PARA_LA_VIDRIERA;
  const archivo = filaPorId(replica, 'archivos', foto.archivo_de_origen);
  const trabajo = archivo ? filaPorId(replica, 'proyectos', archivo.proyecto_id) : undefined;
  return trabajo ? `De «${trabajo.titulo}»` : DE_UN_TRABAJO;
}
