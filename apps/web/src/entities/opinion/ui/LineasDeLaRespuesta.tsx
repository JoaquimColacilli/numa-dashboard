import type { LineaDeLaRespuesta } from '@maun/domain';

import { useMensajes } from '@/shared/idioma';
import { useFormatosDelCliente, useMensajesDelCliente } from '@/shared/idioma-del-cliente';

import { Carita } from './Carita';
import { MarcaDelTaller } from './EncuestaDelCliente';

function MarcaDePropia() {
  const { preguntaPropia } = useMensajes().opinion;
  return (
    <span className="mt-1.5 inline-block rounded-pill border border-border px-2 py-0.5 text-badge font-semibold text-text-2">
      {preguntaPropia}
    </span>
  );
}

function conOpcionesEscritas(linea: LineaDeLaRespuesta): boolean {
  return linea.pregunta.tipo === 'una' || linea.pregunta.tipo === 'varias';
}

export interface LineasDeLaRespuestaProps {
  lineas: readonly LineaDeLaRespuesta[];
  conPropias?: boolean;
}

export function LineasDeLaRespuesta({ lineas, conPropias = false }: LineasDeLaRespuestaProps) {
  const elegidas = lineas.filter((linea) => linea.texto === null);
  const escritas = lineas.filter((linea) => linea.texto !== null);
  return (
    <>
      {elegidas.length > 0 && (
        <ul className="m-0 list-none p-0">
          {elegidas.map((linea) => (
            <li key={linea.pregunta.id} className="border-b border-hairline-soft py-3.25">
              <div translate="no" className="mb-1.25 text-label leading-snug text-text-2">
                {linea.pregunta.texto}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                {linea.pasos.map((paso) => (
                  <span key={paso.valor} className="flex items-center gap-2.25">
                    <Carita paso={paso} tamano={19} />
                    <span
                      translate={conOpcionesEscritas(linea) ? 'no' : undefined}
                      className="text-body-lg font-semibold text-ink"
                    >
                      {paso.etiqueta}
                    </span>
                  </span>
                ))}
              </div>
              {conPropias && linea.pregunta.propia && <MarcaDePropia />}
            </li>
          ))}
        </ul>
      )}
      {escritas.map((linea) => (
        <div key={linea.pregunta.id} className="mt-4">
          <div translate="no" className="mb-1.75 text-label text-text-2">
            {linea.pregunta.texto}
          </div>
          <p
            translate="no"
            className="papel-rayado m-0 rounded-field px-4 py-3.5 text-body-lg leading-7 whitespace-pre-line text-pretty"
          >
            {linea.texto}
          </p>
          {conPropias && linea.pregunta.propia && <MarcaDePropia />}
        </div>
      ))}
    </>
  );
}

export interface LoQueContestasteProps {
  taller: string;
  fecha: string;
  hoy: string;
  lineas: readonly LineaDeLaRespuesta[];
}

export function LoQueContestaste({ taller, fecha, hoy, lineas }: LoQueContestasteProps) {
  const { yaContestaste } = useMensajesDelCliente().encuesta;
  const formatos = useFormatosDelCliente();
  return (
    <div className="@container w-full">
      <div className="mx-auto w-full max-w-[560px] px-5 pt-5.5 pb-11 @lg:px-7 @lg:pt-10 @lg:pb-14">
        <MarcaDelTaller taller={taller} />
        <h1 className="mt-2 font-display text-h1 leading-tight font-normal @lg:text-h1-lg">
          {yaContestaste.titulo}
        </h1>
        <p className="mt-2 text-body leading-relaxed text-text-2">
          {yaContestaste.texto(formatos.diaYMes(fecha, hoy))}
        </p>
        <div className="mt-5.5 rounded-panel border border-hairline bg-paper px-4 pt-0.75 pb-4 [&_li:last-child]:border-b-0 [&_li:last-child]:pb-0">
          <LineasDeLaRespuesta lineas={lineas} />
        </div>
      </div>
    </div>
  );
}
