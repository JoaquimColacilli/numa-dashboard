import { formatearPorcentaje } from '@/shared/lib';

import type { Mensajes } from '../es';

export const paginaDiezmo = {
  titulo: 'Tithe',
  registrarDiezmo: 'Add tithe payment',
  estadoDelDiezmo: 'Tithe status',
  debesElImporte: (importe, Importe) => (
    <>
      You owe <Importe>{importe}</Importe>
    </>
  ),
  pagasteElImporteDeMas: (importe, Importe) => (
    <>
      You overpaid by <Importe>{importe}</Importe>
    </>
  ),
  generadoYPagado: 'Generated and paid',
  generadoEnTotal: 'Total generated',
  pagadoEnTotal: 'Total paid',
  pagadoSobreLoGenerado: "Paid out of what's generated",
  yaEstaPagado: (porcentaje) =>
    `${formatearPorcentaje(porcentaje * 100, 'en')}% of what's generated is already paid`,
  loGeneradoYLoPagado: "What's been generated and paid",
  regla: {
    cobrado: (porcentaje) => `${porcentaje}% of what you collect on each job`,
    ingreso: (porcentaje) =>
      `${porcentaje}% of each job's income (what you collect minus expenses)`,
  },
  todaviaSinDiezmo: {
    cobrado: (porcentaje) =>
      `No tithe generated yet. ${porcentaje}% of what you collect on each job is recorded here automatically when you get paid. Then you pay it off with payments.`,
    ingreso: (porcentaje) =>
      `No tithe generated yet. ${porcentaje}% of each job's income (what you collect minus expenses) is recorded here automatically when you get paid. Then you pay it off with payments.`,
  },
  todaviaSinDiezmoNiRegla:
    "No tithe generated yet. Each job's tithe is recorded here automatically when you get paid. Then you pay it off with payments.",
} satisfies Mensajes['paginaDiezmo'];
