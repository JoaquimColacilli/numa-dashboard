import {
  RENGLONES_DE_LO_ESTIMADO,
  type ColumnaDeLoQueTeDejaron,
  type IndiceDePrecios,
  type LiquidacionDelPeriodo,
  type LoQueTeDejaron,
  type PeriodoResuelto,
} from '@maun/domain';
import { useId, useState, type ReactNode } from 'react';

import { useMensajes } from '@/shared/idioma';
import { diaYMes, plataCompacta } from '@/shared/lib';
import {
  Ayuda,
  Columnas,
  Forma,
  Lectura,
  Pesas,
  useEleccion,
  VerLosNumeros,
  type AccionDeLaLectura,
  type ColumnaDeLaTabla,
  type ColumnaDelGrafico,
} from '@/shared/ui';

import {
  anioDeLaColumna,
  columnaAlEmpezar,
  columnaConSuAnio,
  columnaEnLaFrase,
  columnaEnLaTabla,
  etiquetaDeLaColumna,
  mesConAnio,
  pesos,
  rangoEnElTexto,
} from '../model/textos';
import {
  BotonQueAbre,
  EnLaLeyenda,
  Figura,
  Fuerte,
  Leyenda,
  Lista,
  Negrita,
  RenglonConEnlace,
  RenglonDelTotal,
  Seccion,
  TituloDeFigura,
} from './piezas';

function RenglonDeLiquidacion({
  liquidacion,
  hoy,
}: {
  liquidacion: LiquidacionDelPeriodo;
  hoy: string;
}) {
  const textos = useMensajes().paginaEstadisticas.dejaron;
  return (
    <RenglonConEnlace
      proyectoId={liquidacion.id}
      titulo={liquidacion.titulo}
      valor={pesos(liquidacion.neta)}
      detalle={
        liquidacion.estado === 'perdido'
          ? textos.senaDeUnPerdido
          : textos.cobradoEl(diaYMes(liquidacion.fecha, hoy))
      }
      valorDebajo={textos.cuenta(pesos(liquidacion.cobrado), pesos(liquidacion.gastos))}
    />
  );
}

function LaMejor({ mejor }: { mejor: ColumnaDeLoQueTeDejaron }) {
  const textos = useMensajes().paginaEstadisticas.dejaron;
  const monto = pesos(mejor.enPesosDeHoy);
  const cantidad = mejor.liquidaciones.length;
  if (mejor.agrupado === 'anio') return textos.mejorAnio(Fuerte, mejor.clave, monto, cantidad);
  if (mejor.agrupado === 'trimestre') {
    return textos.mejorTrimestre(Fuerte, columnaConSuAnio(mejor), monto, cantidad);
  }
  return textos.mejorMes(Fuerte, columnaAlEmpezar(mejor), monto, cantidad);
}

function LaLectura({
  columna,
  deflactado,
  hoy,
  agrupado,
}: {
  columna: ColumnaDeLoQueTeDejaron | null;
  deflactado: boolean;
  hoy: string;
  agrupado: PeriodoResuelto['agrupado'];
}): ReactNode {
  const textos = useMensajes().paginaEstadisticas.dejaron;
  if (columna === null) return agrupado === 'mes' ? textos.tocaUnMes : textos.tocaUnaColumna;
  const cuando = columnaEnLaFrase(columna, hoy);
  const cantidad = columna.liquidaciones.length;
  if (cantidad === 0) return textos.lecturaSinTrabajos(cuando);
  return deflactado && columna.enPesosDeHoy !== columna.comoSeCobro
    ? textos.lecturaConHoy(
        Negrita,
        pesos(columna.enPesosDeHoy),
        cuando,
        pesos(columna.comoSeCobro),
        cantidad,
      )
    : textos.lectura(Negrita, pesos(columna.comoSeCobro), cuando, cantidad);
}

export interface SeccionDeLoQueTeDejaronProps {
  dejaron: LoQueTeDejaron;
  resuelto: PeriodoResuelto;
  hoy: string;
  indice: IndiceDePrecios;
  probar: string | null;
}

export function SeccionDeLoQueTeDejaron({
  dejaron,
  resuelto,
  hoy,
  indice,
  probar,
}: SeccionDeLoQueTeDejaronProps) {
  const mensajes = useMensajes();
  const textos = mensajes.paginaEstadisticas;
  const eleccion = useEleccion();
  const [listaDe, setListaDe] = useState<string | null>(null);
  const [conLaLista, setConLaLista] = useState(false);
  const [todasLasPesas, setTodasLasPesas] = useState(false);
  const idDelMes = useId();
  const idDelPeriodo = useId();
  const idDeLasPesas = useId();

  const ayuda = dejaron.deflactado
    ? textos.ayudas.dejaron(mesConAnio(indice.hasta))
    : textos.ayudas.dejaronConElIndiceViejo(mesConAnio(indice.hasta));

  if (dejaron.liquidaciones.length === 0) {
    return (
      <Seccion
        numero={1}
        titulo={textos.secciones.dejaron}
        ayuda={ayuda}
        frase={null}
        subtitulo={
          dejaron.deflactado ? textos.dejaron.subtitulo : textos.dejaron.subtituloEnPesosDeCadaMes
        }
        vacio={{
          loQuePaso:
            resuelto.largo === 'todo'
              ? textos.dejaron.vacioDeTodo
              : textos.dejaron.vacio(rangoEnElTexto(resuelto, hoy)),
          probar,
        }}
      />
    );
  }

  const columnas: ColumnaDelGrafico[] = dejaron.columnas.map((columna) => ({
    clave: columna.clave,
    etiqueta: etiquetaDeLaColumna(columna),
    anio: anioDeLaColumna(columna),
    valor: columna.enPesosDeHoy,
    valorTexto: plataCompacta(columna.enPesosDeHoy),
    enPeriodo: columna.enElPeriodo,
    enCurso: columna.enCurso,
    sinRegistro: columna.sinRegistro,
    nombre:
      columna.liquidaciones.length === 0
        ? textos.dejaron.columnaVacia(columnaConSuAnio(columna))
        : dejaron.deflactado
          ? textos.dejaron.columna(
              columnaConSuAnio(columna),
              pesos(columna.enPesosDeHoy),
              columna.liquidaciones.length,
            )
          : textos.dejaron.columnaEnPesosDeCadaMes(
              columnaConSuAnio(columna),
              pesos(columna.comoSeCobro),
              columna.liquidaciones.length,
            ),
  }));
  const mostrada = dejaron.columnas.find((columna) => columna.clave === eleccion.mostrada) ?? null;
  const abierta =
    dejaron.columnas.find(
      (columna) =>
        columna.clave === listaDe &&
        columna.clave === eleccion.elegida &&
        columna.liquidaciones.length > 0,
    ) ?? null;
  const enCurso = dejaron.columnas.find((columna) => columna.enCurso) ?? null;

  const accion: AccionDeLaLectura | null =
    mostrada === null || mostrada.liquidaciones.length === 0
      ? null
      : abierta !== null && abierta.clave === mostrada.clave
        ? {
            texto: textos.dejaron.esconderLaLista,
            abierta: true,
            controla: idDelMes,
            alTocar: () => {
              setListaDe(null);
            },
          }
        : {
            texto: textos.dejaron.verLosDe(
              mostrada.liquidaciones.length,
              columnaEnLaFrase(mostrada, hoy),
            ),
            abierta: false,
            controla: idDelMes,
            alTocar: () => {
              eleccion.elegir(mostrada.clave);
              setListaDe(mostrada.clave);
            },
          };

  const pesas = todasLasPesas
    ? dejaron.estimado
    : dejaron.estimado.slice(0, RENGLONES_DE_LO_ESTIMADO);
  const cien = pesos(10_000);

  const columnasDeLaTabla: ColumnaDeLaTabla[] = [
    { clave: 'cuando', titulo: textos.dejaron.tabla.cuando[resuelto.agrupado] },
    { clave: 'trabajos', titulo: textos.dejaron.tabla.trabajos, enElCelular: false },
    { clave: 'como-se-cobro', titulo: textos.dejaron.tabla.comoSeCobro },
    ...(dejaron.deflactado
      ? [
          {
            clave: 'en-pesos-de-hoy',
            titulo: (
              <span className="inline-flex items-center gap-1">
                {textos.dejaron.tabla.enPesosDeHoy}
                <Ayuda que={textos.queEs(textos.dejaron.tabla.enPesosDeHoy)}>
                  {textos.ayudas.pesosDeHoy}
                </Ayuda>
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <Seccion
      numero={1}
      titulo={textos.secciones.dejaron}
      ayuda={ayuda}
      frase={
        dejaron.cobrados > 0 ? (
          <>
            {textos.dejaron.frase(Fuerte, dejaron.cobrados, pesos(dejaron.total))}
            {dejaron.mejor !== null && (
              <>
                {' '}
                <LaMejor mejor={dejaron.mejor} />
              </>
            )}
          </>
        ) : (
          textos.dejaron.fraseSoloSenas(Fuerte, dejaron.perdidos, pesos(dejaron.total))
        )
      }
      subtitulo={
        dejaron.deflactado ? textos.dejaron.subtitulo : textos.dejaron.subtituloEnPesosDeCadaMes
      }
    >
      <Figura>
        <figcaption className="sr-only">{textos.dejaron.figura}</figcaption>
        <Lectura accion={accion}>
          <LaLectura
            columna={mostrada}
            deflactado={dejaron.deflactado}
            hoy={hoy}
            agrupado={resuelto.agrupado}
          />
        </Lectura>
        <Columnas
          nombre={textos.dejaron.figura}
          columnas={columnas}
          eleccion={eleccion}
          formatoDelEje={(valor) => plataCompacta(valor)}
          sinRegistro={textos.dejaron.sinRegistro}
          nota={enCurso === null ? null : textos.dejaron.hastaHoy(columnaEnLaFrase(enCurso, hoy))}
          alAbrir={(clave) => {
            setListaDe(clave);
          }}
        />
        <Lista
          id={idDelMes}
          etiqueta={
            abierta === null ? '' : textos.dejaron.trabajosDe(columnaEnLaFrase(abierta, hoy))
          }
          oculta={abierta === null}
        >
          {abierta !== null && (
            <>
              {abierta.liquidaciones.map((liquidacion) => (
                <RenglonDeLiquidacion key={liquidacion.id} liquidacion={liquidacion} hoy={hoy} />
              ))}
              <RenglonDelTotal
                nombre={textos.dejaron.totalDe(columnaEnLaFrase(abierta, hoy))}
                valor={pesos(abierta.comoSeCobro)}
              />
            </>
          )}
        </Lista>
      </Figura>

      {dejaron.estimado.length === 0 ? (
        <p className="border-t border-hairline-soft pt-3.5 text-label leading-snug text-text-2">
          {textos.dejaron.estimado.sinCostos}
        </p>
      ) : (
        <Figura separada>
          <TituloDeFigura
            titulo={textos.dejaron.estimado.titulo}
            aparte={textos.dejaron.estimado.deCadaCien(cien)}
          />
          <Leyenda>
            <EnLaLeyenda marca={<Forma forma="hueco" />}>
              {textos.dejaron.estimado.loQueEstimaste}
            </EnLaLeyenda>
            <EnLaLeyenda marca={<Forma forma="lleno" />}>
              {textos.dejaron.estimado.loQueTeQuedo}
            </EnLaLeyenda>
          </Leyenda>
          <div id={idDeLasPesas}>
            <Pesas
              filas={pesas.map((pesa) => ({
                clave: pesa.id,
                nombre: pesa.titulo,
                estimado: pesa.estimado,
                real: pesa.real,
                realTexto: pesos(pesa.real * 100),
                descripcion: textos.dejaron.estimado.descripcion(
                  pesa.titulo,
                  pesos(pesa.estimado * 100),
                  pesos(pesa.real * 100),
                  cien,
                ),
              }))}
              formatoDelEje={(valor) => pesos(valor * 100)}
            />
          </div>
          {dejaron.estimado.length > RENGLONES_DE_LO_ESTIMADO && (
            <div>
              <BotonQueAbre
                abierto={todasLasPesas}
                controla={idDeLasPesas}
                alTocar={() => {
                  setTodasLasPesas((antes) => !antes);
                }}
              >
                {todasLasPesas
                  ? textos.dejaron.estimado.verMenos
                  : textos.dejaron.estimado.verTodos(dejaron.estimado.length)}
              </BotonQueAbre>
            </div>
          )}
        </Figura>
      )}

      <VerLosNumeros
        textos={{
          ver: mensajes.ui.comparacion.verLosNumeros,
          ocultar: mensajes.ui.comparacion.ocultarLosNumeros,
        }}
        tablas={[
          {
            titulo:
              resuelto.largo === 'todo'
                ? textos.dejaron.tabla.titulo[resuelto.agrupado]
                : `${textos.dejaron.tabla.titulo[resuelto.agrupado]} ${textos.dejaron.tabla.enNegrita}`,
            columnas: columnasDeLaTabla,
            filas: dejaron.columnas
              .filter((columna) => !columna.sinRegistro)
              .map((columna) => ({
                clave: columna.clave,
                celdas: [
                  columna.enCurso
                    ? textos.dejaron.tabla.hastaHoy(columnaEnLaTabla(columna))
                    : columnaEnLaTabla(columna),
                  String(columna.liquidaciones.length),
                  pesos(columna.comoSeCobro),
                  ...(dejaron.deflactado ? [pesos(columna.enPesosDeHoy)] : []),
                ],
                resaltada: resuelto.largo !== 'todo' && columna.enElPeriodo,
              })),
          },
        ]}
      >
        <BotonQueAbre
          abierto={conLaLista}
          controla={idDelPeriodo}
          alTocar={() => {
            setConLaLista((antes) => !antes);
          }}
        >
          {conLaLista
            ? textos.dejaron.esconderLaLista
            : textos.dejaron.verLosDelPeriodo(dejaron.liquidaciones.length)}
        </BotonQueAbre>
      </VerLosNumeros>
      <Lista id={idDelPeriodo} etiqueta={textos.dejaron.trabajosDelPeriodo} oculta={!conLaLista}>
        {dejaron.liquidaciones.map((liquidacion) => (
          <RenglonDeLiquidacion key={liquidacion.id} liquidacion={liquidacion} hoy={hoy} />
        ))}
        <RenglonDelTotal nombre={textos.dejaron.totalDelPeriodo} valor={pesos(dejaron.total)} />
      </Lista>
    </Seccion>
  );
}
