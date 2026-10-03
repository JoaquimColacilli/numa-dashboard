import type { EstadoEnCurso, LoQueViene, TrabajoEnCurso } from '@maun/domain';

import { enDias } from '@/entities/entrega';
import { useMensajes } from '@/shared/idioma';
import {
  diaYMes,
  formatearLaPlata,
  haceCuanto,
  Ir,
  RUTA_DE_PROYECTOS,
  rutaDelProyecto,
  techoDeDias,
} from '@/shared/lib';
import { Icono, PistaDeAvance, type NombreDeIcono } from '@/shared/ui';

import { cuandoSePrometio } from '../model/textos';
import {
  Acciones,
  EnLaLeyenda,
  Figura,
  Fuerte,
  IrA,
  Leyenda,
  Lista,
  RenglonConEnlace,
  RenglonDelTotal,
  Seccion,
  TituloDeFigura,
} from './piezas';

const DIAS_DE_LA_PISTA = 45;

function MarcaDelEje() {
  return (
    <svg aria-hidden focusable="false" width={8} height={14} className="block flex-none">
      <line
        x1={4}
        x2={4}
        y1={0}
        y2={14}
        strokeWidth={1}
        strokeDasharray="6 2 1.5 2"
        className="stroke-ink"
      />
    </svg>
  );
}

function MarcaDeLaPromesa() {
  return (
    <svg aria-hidden focusable="false" width={18} height={10} className="block flex-none">
      <line
        x1={0}
        x2={13}
        y1={5}
        y2={5}
        strokeWidth={1.25}
        strokeDasharray="4 3"
        className="stroke-ink"
      />
      <path d="M15 0v10" strokeWidth={1.5} className="stroke-ink" />
    </svg>
  );
}

const COMO_SE_VE: Readonly<Record<EstadoEnCurso['cual'], { clase: string; icono: NombreDeIcono }>> =
  {
    listo: { clase: 'text-ok', icono: 'circle-check' },
    atrasado: { clase: 'text-alerta', icono: 'triangle-alert' },
    paso: { clase: 'text-atencion', icono: 'clock' },
  };

function ElEstado({ estado }: { estado: EstadoEnCurso }) {
  const textos = useMensajes().paginaEstadisticas.viene;
  const { clase, icono } = COMO_SE_VE[estado.cual];
  const texto =
    estado.cual === 'listo'
      ? textos.listo
      : estado.cual === 'atrasado'
        ? textos.atrasado(estado.dias)
        : textos.paso(enDias(estado.dias));
  return (
    <span
      className={`relative z-10 inline-flex flex-none items-center gap-1 text-meta font-semibold whitespace-nowrap ${clase}`}
    >
      <Icono nombre={icono} tamano={14} grosor={2} />
      {texto}
    </span>
  );
}

function UnoEnCurso({
  trabajo,
  normal,
  maximo,
  hoy,
}: {
  trabajo: TrabajoEnCurso;
  normal: number | null;
  maximo: number;
  hoy: string;
}) {
  const textos = useMensajes().paginaEstadisticas.viene;
  const promesa = cuandoSePrometio(trabajo.prometido, hoy);
  return (
    <li className="relative flex flex-col gap-1.25 rounded-field has-[a[data-renglon]:focus-visible]:outline-2 has-[a[data-renglon]:focus-visible]:outline-offset-2 has-[a[data-renglon]:focus-visible]:outline-ink">
      <div className="flex items-baseline justify-between gap-2.5">
        <Ir
          a={rutaDelProyecto(trabajo.id)}
          data-renglon
          translate="no"
          className="min-w-0 text-body-sm font-medium [overflow-wrap:anywhere] after:absolute after:inset-0 after:rounded-field after:content-[''] hover:underline focus-visible:outline-none"
        >
          {trabajo.titulo}
        </Ir>
        {trabajo.estado !== null && <ElEstado estado={trabajo.estado} />}
      </div>
      {trabajo.dias !== null && (
        <PistaDeAvance
          dias={trabajo.dias}
          prometido={trabajo.hastaLaPromesa}
          mediana={normal}
          maximo={maximo}
        />
      )}
      <p className="text-meta text-text-3">
        {textos.detalle(trabajo.dias === null ? textos.sinArranque : enDias(trabajo.dias), promesa)}
      </p>
    </li>
  );
}

export interface SeccionDeLoQueVieneProps {
  viene: LoQueViene;
  hoy: string;
}

export function SeccionDeLoQueViene({ viene, hoy }: SeccionDeLoQueVieneProps) {
  const textos = useMensajes().paginaEstadisticas;
  const { enCurso, porCobrar, teDeben, normal } = viene;
  const nada = enCurso.length === 0 && porCobrar.length === 0;
  const enPesos = teDeben.find((plata) => plata.moneda === 'ARS');
  const enDolares = teDeben.find((plata) => plata.moneda === 'USD');
  const loQueTeDeben =
    enPesos !== undefined && enDolares !== undefined
      ? textos.viene.yEnDolares(formatearLaPlata(enPesos), formatearLaPlata(enDolares))
      : teDeben.length === 0
        ? null
        : teDeben.map((plata) => formatearLaPlata(plata)).join(' · ');
  const maximo = techoDeDias(
    [
      ...enCurso.flatMap((trabajo) => [trabajo.dias ?? 0, trabajo.hastaLaPromesa ?? 0]),
      normal ?? 0,
    ],
    DIAS_DE_LA_PISTA,
  );
  const hayPromesas = enCurso.some((trabajo) => trabajo.hastaLaPromesa !== null);

  return (
    <Seccion
      numero={6}
      titulo={textos.secciones.viene}
      ayuda={textos.ayudas.viene}
      frase={
        nada
          ? textos.viene.nada
          : textos.viene.frase(Fuerte, enCurso.length, viene.listos, loQueTeDeben, porCobrar.length)
      }
      subtitulo={textos.viene.subtitulo(diaYMes(hoy, hoy))}
    >
      {enCurso.length > 0 && (
        <Figura>
          <TituloDeFigura
            titulo={textos.viene.enCurso}
            aparte={
              normal === null
                ? textos.viene.diasDesdeQueArrancaste
                : textos.viene.diasContraLoNormal
            }
          />
          {(normal !== null || hayPromesas) && (
            <Leyenda>
              {normal !== null && (
                <EnLaLeyenda marca={<MarcaDelEje />}>
                  {textos.viene.loNormal(enDias(normal))}
                </EnLaLeyenda>
              )}
              {hayPromesas && (
                <EnLaLeyenda marca={<MarcaDeLaPromesa />}>
                  {textos.viene.hastaLaPromesa}
                </EnLaLeyenda>
              )}
            </Leyenda>
          )}
          <ul className="flex list-none flex-col gap-3.5 p-0">
            {enCurso.map((trabajo) => (
              <UnoEnCurso
                key={trabajo.id}
                trabajo={trabajo}
                normal={normal}
                maximo={maximo}
                hoy={hoy}
              />
            ))}
          </ul>
        </Figura>
      )}
      {porCobrar.length > 0 && (
        <Figura separada={enCurso.length > 0}>
          <TituloDeFigura titulo={textos.viene.porCobrar} aparte={textos.viene.delMasViejo} />
          <Lista etiqueta={textos.viene.porCobrar}>
            {porCobrar.map((uno) => (
              <RenglonConEnlace
                key={uno.id}
                proyectoId={uno.id}
                titulo={uno.titulo}
                valor={formatearLaPlata(uno.saldo)}
                detalle={
                  uno.entregado === null
                    ? textos.viene.sinDiaDeEntrega
                    : textos.viene.entregado(haceCuanto(uno.entregado, hoy))
                }
              />
            ))}
            <RenglonDelTotal
              nombre={textos.viene.teDeben}
              valor={
                <span className="flex flex-col items-end">
                  {teDeben.map((plata) => (
                    <span key={plata.moneda}>{formatearLaPlata(plata)}</span>
                  ))}
                </span>
              }
            />
          </Lista>
        </Figura>
      )}
      <Acciones>
        <IrA a={RUTA_DE_PROYECTOS}>{textos.viene.irAActivos}</IrA>
      </Acciones>
    </Seccion>
  );
}
