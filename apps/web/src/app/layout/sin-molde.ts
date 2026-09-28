import { RUTA_DE_TESOROS } from '@/shared/lib';

const A_TODO_EL_ANCHO: readonly string[] = [RUTA_DE_TESOROS];

export function esUnPlanoATodoElAncho(pathname: string): boolean {
  return A_TODO_EL_ANCHO.includes(pathname);
}
