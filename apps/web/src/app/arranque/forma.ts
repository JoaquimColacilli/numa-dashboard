import { claimsGuardados } from '@/shared/api';
import { bloqueoDe, esCelular, esUnaPaginaPublica } from '@/shared/lib';

export type FormaDelArranque = 'acceso' | 'bloqueo' | 'marco';

export function formaDelArranque(ruta: string): FormaDelArranque | null {
  if (esUnaPaginaPublica(ruta)) return null;
  const sesion = claimsGuardados();
  if (sesion === undefined) return 'acceso';
  return esCelular() && bloqueoDe(sesion.usuarioId) !== null ? 'bloqueo' : 'marco';
}
