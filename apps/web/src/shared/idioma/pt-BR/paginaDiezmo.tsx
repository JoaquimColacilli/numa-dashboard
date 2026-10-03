import { formatearPorcentaje } from '@/shared/lib';

import type { Mensajes } from '../es';

export const paginaDiezmo = {
  titulo: 'Dízimo',
  registrarDiezmo: 'Registrar dízimo',
  estadoDelDiezmo: 'Situação do dízimo',
  debesElImporte: (importe, Importe) => (
    <>
      Você deve <Importe>{importe}</Importe>
    </>
  ),
  pagasteElImporteDeMas: (importe, Importe) => (
    <>
      Você pagou <Importe>{importe}</Importe> a mais
    </>
  ),
  generadoYPagado: 'Gerado e pago',
  generadoEnTotal: 'Total gerado',
  pagadoEnTotal: 'Total pago',
  pagadoSobreLoGenerado: 'Pago sobre o gerado',
  yaEstaPagado: (porcentaje) =>
    `${formatearPorcentaje(porcentaje * 100, 'pt-BR')}% do que foi gerado já está pago`,
  loGeneradoYLoPagado: 'O que foi gerado e pago',
  regla: {
    cobrado: (porcentaje) => `${porcentaje}% do que você recebe de cada projeto`,
    ingreso: (porcentaje) =>
      `${porcentaje}% da receita de cada projeto (o recebido menos as despesas)`,
  },
  todaviaSinDiezmo: {
    cobrado: (porcentaje) =>
      `Ainda não foi gerado dízimo. ${porcentaje}% do que você recebe de cada projeto é registrado aqui automaticamente quando você recebe. Depois você vai quitando com pagamentos.`,
    ingreso: (porcentaje) =>
      `Ainda não foi gerado dízimo. ${porcentaje}% da receita de cada projeto (o recebido menos as despesas) é registrado aqui automaticamente quando você recebe. Depois você vai quitando com pagamentos.`,
  },
  todaviaSinDiezmoNiRegla:
    'Ainda não foi gerado dízimo. O dízimo de cada projeto é registrado aqui automaticamente quando você recebe. Depois você vai quitando com pagamentos.',
} satisfies Mensajes['paginaDiezmo'];
