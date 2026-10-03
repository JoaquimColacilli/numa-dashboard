import { useMensajes, type Mensajes } from '@/shared/idioma';
import { useElIdiomaDelClienteSiHay } from '@/shared/idioma-del-cliente';

export type TextosDelPdf = Mensajes['pdf'];

export function useTextosDelPdf(): TextosDelPdf {
  const app = useMensajes().pdf;
  const delCliente = useElIdiomaDelClienteSiHay();
  return delCliente === null ? app : delCliente.m.presupuesto.pdf;
}
