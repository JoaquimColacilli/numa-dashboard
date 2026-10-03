import type { Idioma } from '@maun/domain';

import { documento as en } from './en/documento';
import type { MensajesDelCliente } from './es';
import { documento as es } from './es/documento';
import { mensajesDelClienteListos } from './mensajes';
import { documento as ptBR } from './pt-BR/documento';

export type TextosDelDocumento = MensajesDelCliente['documento'];

const EN_LOS_TRES: Readonly<Record<Idioma, TextosDelDocumento>> = { es, en, 'pt-BR': ptBR };

export function textosDelDocumento(idioma: Idioma): TextosDelDocumento {
  return mensajesDelClienteListos(idioma)?.documento ?? EN_LOS_TRES[idioma];
}
