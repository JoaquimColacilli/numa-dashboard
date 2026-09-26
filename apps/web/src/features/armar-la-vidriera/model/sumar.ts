import {
  ArchivoRechazado,
  esImagen,
  rutaDeLaMiniatura,
  rutaDelArchivo,
  rutaEnLaVidriera,
  SIN_SENAL_PARA_ARCHIVOS,
  subirUnArchivo,
  type Archivo,
  type DependenciasDeLaSubida,
  type DestinoDeLaSubida,
  type LoQueSeSube,
} from '@/entities/archivo';
import {
  esFalloDeRed,
  filaPorId,
  filasDe,
  mensajeDeAcceso,
  type FotoDeLaVidrieraNueva,
  type Replica,
} from '@/shared/api';
import { ImagenIlegible } from '@/shared/lib';

export const LOS_VIDEOS_NO_VAN_A_LA_VIDRIERA =
  'Los videos no se pueden subir: uno del celular pesa entre 50 y 200 MB, y el espacio para los archivos de todo el taller es de 1 GB. Subí una foto o una captura del video.';

export const LO_QUE_SE_SUBE_A_LA_VIDRIERA: LoQueSeSube = {
  acepta: 'image/*,video/*',
  conPdf: false,
  videos: LOS_VIDEOS_NO_VAN_A_LA_VIDRIERA,
  queSeSube: 'fotos y capturas',
};

export function destinoDeLaVidriera(householdId: string): DestinoDeLaSubida {
  return {
    loQueSeSube: LO_QUE_SE_SUBE_A_LA_VIDRIERA,
    ruta: (id, tipo, miniatura) =>
      rutaEnLaVidriera({ id, household_id: householdId, tipo }, miniatura),
  };
}

export type ImagenDeUnTrabajo = Archivo & { ancho: number; alto: number };

function esImagenConMedidas(archivo: Archivo): archivo is ImagenDeUnTrabajo {
  return esImagen(archivo) && archivo.ancho !== null && archivo.alto !== null;
}

export interface FotoDeUnTrabajo {
  archivo: ImagenDeUnTrabajo;
  compartida: boolean;
  yaEsta: boolean;
}

export interface TrabajoConFotos {
  id: string;
  titulo: string;
  fotos: FotoDeUnTrabajo[];
}

function masNuevaPrimero(una: Archivo, otra: Archivo): number {
  if (una.created_at !== otra.created_at) return una.created_at < otra.created_at ? 1 : -1;
  return una.id < otra.id ? 1 : una.id > otra.id ? -1 : 0;
}

export function fotosDeLosTrabajos(replica: Replica): TrabajoConFotos[] {
  const enLaVidriera = new Set(
    filasDe(replica, 'fotos_de_la_vidriera').flatMap((foto) =>
      foto.archivo_de_origen === null ? [] : [foto.archivo_de_origen],
    ),
  );
  const trabajos = new Map<string, TrabajoConFotos>();
  const imagenes = filasDe(replica, 'archivos').filter(esImagenConMedidas).sort(masNuevaPrimero);

  for (const archivo of imagenes) {
    const proyecto = filaPorId(replica, 'proyectos', archivo.proyecto_id);
    if (!proyecto) continue;
    let trabajo = trabajos.get(proyecto.id);
    if (!trabajo) {
      trabajo = { id: proyecto.id, titulo: proyecto.titulo, fotos: [] };
      trabajos.set(proyecto.id, trabajo);
    }
    trabajo.fotos.push({
      archivo,
      compartida: archivo.visible_para_cliente,
      yaEsta: enLaVidriera.has(archivo.id),
    });
  }
  return [...trabajos.values()];
}

export type DisponibilidadDeLaFoto = 'elegible' | 'ya-esta' | 'no-entra';

export function disponibilidadDeLaFoto(
  foto: FotoDeUnTrabajo,
  elegidas: readonly string[],
  libres: number,
): DisponibilidadDeLaFoto {
  if (foto.yaEsta) return 'ya-esta';
  if (elegidas.includes(foto.archivo.id)) return 'elegible';
  return elegidas.length >= libres ? 'no-entra' : 'elegible';
}

export function conLaFotoElegida(
  elegidas: readonly string[],
  foto: FotoDeUnTrabajo,
  libres: number,
): readonly string[] {
  const id = foto.archivo.id;
  if (elegidas.includes(id)) return elegidas.filter((una) => una !== id);
  if (disponibilidadDeLaFoto(foto, elegidas, libres) !== 'elegible') return elegidas;
  return [...elegidas, id];
}

export function textoDelBotonDeSumar(cantidad: number): string {
  if (cantidad === 0) return 'Sumar fotos';
  return cantidad === 1 ? 'Sumar 1 foto' : `Sumar ${String(cantidad)} fotos`;
}

export function avisoSinCompartir(cantidad: number): string {
  return cantidad === 1
    ? 'Una de las fotos que elegiste está sin compartir: el cliente de ese trabajo todavía no la vio. En tu vidriera la ven todos tus clientes, también él.'
    : `${String(cantidad)} de las fotos que elegiste están sin compartir: los clientes de esos trabajos todavía no las vieron. En tu vidriera las ven todos tus clientes, también ellos.`;
}

export function avisoDelExceso(elegidas: number, libres: number): string | null {
  if (elegidas <= libres) return null;
  const entran = libres === 1 ? 'entra 1' : `entran ${String(libres)}`;
  const primeras = libres === 1 ? 'la primera' : `las primeras ${String(libres)}`;
  return `Elegiste ${String(elegidas)} fotos y en tu vidriera ${entran} más: se suben ${primeras}.`;
}

export function avisoDelCorte(
  hechas: number,
  total: number,
  verbo: 'sumaron' | 'subieron',
): string {
  const cuantas =
    hechas === 0
      ? `No se ${verbo === 'sumaron' ? 'sumó' : 'subió'} ninguna`
      : `Se ${verbo} ${hechas === 1 ? 'la primera' : `las primeras ${String(hechas)}`} de las ${String(total)}`;
  return `${cuantas}: se cortó la señal. Probá con las demás cuando vuelva.`;
}

export interface Avance {
  actual: number;
  total: number;
}

export interface ResultadoDeSumar {
  hechas: number;
  problemas: string[];
}

export interface DependenciasDelSumado {
  copiar: (desde: string, hacia: string) => Promise<void>;
  nuevoId: () => string;
  sumar: (nueva: FotoDeLaVidrieraNueva) => void;
}

export async function sumarDeLosTrabajos(
  archivos: readonly ImagenDeUnTrabajo[],
  householdId: string,
  ordenInicial: number,
  dependencias: DependenciasDelSumado,
  alAvanzar: (avance: Avance) => void,
): Promise<ResultadoDeSumar> {
  const problemas: string[] = [];
  let hechas = 0;
  for (const [indice, archivo] of archivos.entries()) {
    alAvanzar({ actual: indice + 1, total: archivos.length });
    const id = dependencias.nuevoId();
    const destino = { id, household_id: householdId, tipo: archivo.tipo };
    try {
      await dependencias.copiar(rutaDelArchivo(archivo), rutaEnLaVidriera(destino));
      await dependencias.copiar(rutaDeLaMiniatura(archivo), rutaEnLaVidriera(destino, true));
    } catch (fallo) {
      if (esFalloDeRed(fallo)) {
        return { hechas, problemas: [avisoDelCorte(hechas, archivos.length, 'sumaron')] };
      }
      problemas.push(`Una de las fotos no se pudo copiar. ${mensajeDeAcceso(fallo)}`);
      continue;
    }
    dependencias.sumar({
      id,
      orden: ordenInicial + hechas,
      tipo: archivo.tipo,
      bytes: archivo.bytes,
      ancho: archivo.ancho,
      alto: archivo.alto,
      archivo_de_origen: archivo.id,
    });
    hechas += 1;
  }
  return { hechas, problemas };
}

function motivoDelFallo(nombre: string, fallo: unknown): string {
  if (fallo instanceof ArchivoRechazado) return fallo.message;
  if (fallo instanceof ImagenIlegible) return `«${nombre}»: ${fallo.message}`;
  if (esFalloDeRed(fallo)) return SIN_SENAL_PARA_ARCHIVOS;
  return `«${nombre}» no se pudo subir. ${mensajeDeAcceso(fallo)}`;
}

export async function subirALaVidriera(
  elegidos: readonly File[],
  householdId: string,
  ordenInicial: number,
  libres: number,
  dependencias: DependenciasDeLaSubida & { sumar: (nueva: FotoDeLaVidrieraNueva) => void },
  alAvanzar: (avance: Avance) => void,
): Promise<ResultadoDeSumar> {
  const exceso = avisoDelExceso(elegidos.length, libres);
  const problemas = exceso === null ? [] : [exceso];
  const aSubir = elegidos.slice(0, Math.max(0, libres));
  let hechas = 0;

  for (const [indice, elegido] of aSubir.entries()) {
    alAvanzar({ actual: indice + 1, total: aSubir.length });
    try {
      const subido = await subirUnArchivo(elegido, destinoDeLaVidriera(householdId), dependencias);
      if (subido.tipo === 'application/pdf') continue;
      dependencias.sumar({
        id: subido.id,
        orden: ordenInicial + hechas,
        tipo: subido.tipo,
        bytes: subido.bytes,
        ancho: subido.ancho,
        alto: subido.alto,
        archivo_de_origen: null,
      });
      hechas += 1;
    } catch (fallo) {
      if (esFalloDeRed(fallo)) {
        problemas.push(avisoDelCorte(hechas, aSubir.length, 'subieron'));
        break;
      }
      const motivo = motivoDelFallo(elegido.name, fallo);
      if (!problemas.includes(motivo)) problemas.push(motivo);
    }
  }
  return { hechas, problemas };
}
