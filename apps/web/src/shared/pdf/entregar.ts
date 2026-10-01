export const LO_QUE_DURA_EL_ENLACE_MS = 60_000;

export const TIPO_DEL_PDF = 'application/pdf';

const ARCHIVO_DE_PRUEBA = 'presupuesto.pdf';

const SE_IGNORAN = ['AbortError', 'InvalidStateError'];

export function sePuedenCompartirArchivos(archivo?: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.canShare !== 'function') return false;
  try {
    const prueba = archivo ?? new File([], ARCHIVO_DE_PRUEBA, { type: TIPO_DEL_PDF });
    return navigator.canShare({ files: [prueba] });
  } catch {
    return false;
  }
}

export function esUnIphoneConLaAppInstalada(): boolean {
  if (typeof navigator === 'undefined') return false;
  const enIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const instalada =
    ('standalone' in navigator && navigator.standalone === true) ||
    (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches);
  return enIos && instalada;
}

export function descargarElArchivo(archivo: File): void {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = archivo.name;
  enlace.rel = 'noopener';
  enlace.hidden = true;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, LO_QUE_DURA_EL_ENLACE_MS);
}

export function compartirElArchivo(archivo: File, titulo: string): void {
  if (!sePuedenCompartirArchivos(archivo)) {
    descargarElArchivo(archivo);
    return;
  }
  navigator.share({ files: [archivo], title: titulo }).catch((error: unknown) => {
    if (error instanceof DOMException && SE_IGNORAN.includes(error.name)) return;
    descargarElArchivo(archivo);
  });
}
