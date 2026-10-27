import { ESTADOS_DE_CONSULTA, EN_SEGUIMIENTO, type EstadoProyecto } from '@maun/domain';

export const CAMPOS_DEL_TRABAJO = [
  'cliente',
  'telefono',
  'titulo',
  'tipo',
  'moneda',
  'presupuesto',
  'sena',
  'formaDePago',
  'visita',
  'horaDeLaVisita',
  'visitaHecha',
  'vencimiento',
  'valeHasta',
  'inicio',
  'entrega',
  'horaDeLaEntrega',
  'estado',
  'direccion',
  'comprobante',
  'notas',
  'opciones',
  'pagos',
  'gastos',
] as const;

export type CampoDelTrabajo = (typeof CAMPOS_DEL_TRABAJO)[number];

export const ATRIBUTO_DEL_CAMPO = 'data-campo-del-trabajo';

const DE_LA_CONSULTA: readonly CampoDelTrabajo[] = [
  'telefono',
  'visita',
  'horaDeLaVisita',
  'visitaHecha',
  'vencimiento',
  'valeHasta',
];

export function esUnaConsulta(estado: EstadoProyecto | undefined): boolean {
  return (
    estado === undefined ||
    estado === EN_SEGUIMIENTO ||
    (ESTADOS_DE_CONSULTA as readonly EstadoProyecto[]).includes(estado)
  );
}

export function camposDelTrabajo(estado: EstadoProyecto | undefined): CampoDelTrabajo[] {
  const consulta = esUnaConsulta(estado);
  return CAMPOS_DEL_TRABAJO.filter((campo) => {
    if (campo === 'valeHasta') return estado === 'presupuesto_enviado';
    return consulta || !DE_LA_CONSULTA.includes(campo);
  });
}

export function marcaDelCampo(campo: CampoDelTrabajo): Readonly<Record<string, CampoDelTrabajo>> {
  return { [ATRIBUTO_DEL_CAMPO]: campo };
}
