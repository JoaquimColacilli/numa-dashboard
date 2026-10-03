import type { LoQueGastaste, LoQueMasUsas, PeriodoResuelto } from '@maun/domain';
import { useId } from 'react';

import { categoriaEnPantalla, esCategoriaDelCatalogo } from '@/entities/movimiento';
import { nombreDeLaCategoria } from '@/entities/proyecto';
import { useMensajes } from '@/shared/idioma';
import { rutaDeFinanzasDelTesoro } from '@/shared/lib';
import { Ayuda, RankingDeBarras, VerLosNumeros, type GrupoDelRanking } from '@/shared/ui';

import { conMayuscula, cuandoEnLaFrase, pesos, rangoEnElTexto } from '../model/textos';
import { Acciones, Chico, Falta, Figura, Fuerte, IrA, Seccion, TituloDeFigura } from './piezas';

function ListaDeUsos({
  titulo,
  usos,
  sinNada,
}: {
  titulo: string;
  usos: LoQueMasUsas;
  sinNada: string;
}) {
  const textos = useMensajes().paginaEstadisticas.gastos;
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <h3 className="text-label font-semibold">{titulo}</h3>
      {usos.primeros.length === 0 ? (
        <p className="text-label text-text-2">{sinNada}</p>
      ) : (
        <RankingDeBarras
          forma="nombre-arriba"
          grupos={[
            {
              clave: 'usos',
              nombre: null,
              renglones: usos.primeros.map((uso) => ({
                clave: uso.clave,
                nombre: uso.nombre,
                valor: uso.trabajos,
                valorTexto: textos.enTrabajos(Chico, uso.trabajos),
                esDato: true,
              })),
            },
          ]}
        />
      )}
      {usos.mas > 0 && <p className="text-meta text-text-3">{textos.yMas(usos.mas)}</p>}
    </div>
  );
}

export interface SeccionDeLoQueGastasteProps {
  gastos: LoQueGastaste;
  resuelto: PeriodoResuelto;
  hoy: string;
  probar: string | null;
}

export function SeccionDeLoQueGastaste({
  gastos,
  resuelto,
  hoy,
  probar,
}: SeccionDeLoQueGastasteProps) {
  const mensajes = useMensajes();
  const textos = mensajes.paginaEstadisticas;
  const idDelTitulo = useId();
  const idDelAparte = useId();
  const hayGastos = gastos.trabajos.length + gastos.taller.length > 0;
  const hayUsos = gastos.materiales.primeros.length + gastos.herrajes.primeros.length > 0;
  const rango = resuelto.largo === 'todo' ? null : rangoEnElTexto(resuelto, hoy);
  const sinGastos = rango === null ? textos.gastos.vacioDeTodo : textos.gastos.vacio(rango);

  if (!hayGastos && !hayUsos) {
    return (
      <Seccion
        numero={2}
        titulo={textos.secciones.gastos}
        ayuda={textos.ayudas.gastos}
        frase={null}
        subtitulo={textos.gastos.subtitulo}
        vacio={{ loQuePaso: sinGastos, probar }}
      />
    );
  }

  const cuando = conMayuscula(cuandoEnLaFrase(resuelto, hoy));
  const frase = !hayGastos
    ? sinGastos
    : gastos.enElTaller === 0
      ? textos.gastos.fraseSoloTrabajos(Fuerte, cuando, pesos(gastos.total))
      : gastos.enLosTrabajos === 0
        ? textos.gastos.fraseSoloTaller(Fuerte, cuando, pesos(gastos.total))
        : textos.gastos.frase(
            Fuerte,
            cuando,
            pesos(gastos.total),
            pesos(gastos.enLosTrabajos),
            pesos(gastos.enElTaller),
          );

  const grupos: GrupoDelRanking[] = [
    ...(gastos.trabajos.length === 0
      ? []
      : [
          {
            clave: 'trabajos',
            nombre: textos.gastos.enLosTrabajos,
            totalTexto: pesos(gastos.enLosTrabajos),
            renglones: gastos.trabajos.map((gasto) => ({
              clave: gasto.categoria ?? 'sin-categoria',
              nombre:
                gasto.categoria === null
                  ? textos.gastos.sinCategoria
                  : nombreDeLaCategoria(gasto.categoria),
              valor: gasto.monto,
              valorTexto: pesos(gasto.monto),
              sinDato: gasto.categoria === null,
            })),
          },
        ]),
    ...(gastos.taller.length === 0
      ? []
      : [
          {
            clave: 'taller',
            nombre: textos.gastos.enElTaller,
            totalTexto: pesos(gastos.enElTaller),
            renglones: gastos.taller.map((gasto) => ({
              clave: gasto.categoria === '' ? 'sin-categoria' : gasto.categoria,
              nombre:
                gasto.categoria === ''
                  ? textos.gastos.sinCategoria
                  : categoriaEnPantalla(gasto.categoria),
              valor: gasto.monto,
              valorTexto: pesos(gasto.monto),
              sinDato: gasto.categoria === '',
              esDato: gasto.categoria !== '' && !esCategoriaDelCatalogo(gasto.categoria),
            })),
          },
        ]),
  ];

  const cien = pesos(10_000);
  const filas = [
    ...gastos.trabajos.map((gasto) => ({
      clave: `trabajos-${gasto.categoria ?? 'sin-categoria'}`,
      celdas: [
        textos.gastos.tabla.enLosTrabajos(
          gasto.categoria === null
            ? textos.gastos.sinCategoria
            : nombreDeLaCategoria(gasto.categoria),
        ),
        pesos(gasto.monto),
        pesos(gasto.deCada100 * 100),
      ],
    })),
    ...gastos.taller.map((gasto) => ({
      clave: `taller-${gasto.categoria === '' ? 'sin-categoria' : gasto.categoria}`,
      celdas: [
        textos.gastos.tabla.enElTaller(
          gasto.categoria === ''
            ? textos.gastos.sinCategoria
            : categoriaEnPantalla(gasto.categoria),
        ),
        pesos(gasto.monto),
        pesos(gasto.deCada100 * 100),
      ],
    })),
  ];

  return (
    <Seccion
      numero={2}
      titulo={textos.secciones.gastos}
      ayuda={textos.ayudas.gastos}
      frase={frase}
      subtitulo={textos.gastos.subtitulo}
    >
      {hayGastos && (
        <Figura>
          <figcaption className="sr-only">{textos.gastos.figura}</figcaption>
          <RankingDeBarras forma="en-una-linea" grupos={grupos} />
          {gastos.sinCategoria > 0 && (
            <Falta>{textos.gastos.falta(pesos(gastos.sinCategoria))}</Falta>
          )}
        </Figura>
      )}
      <Figura separada={hayGastos} etiquetadaPor={[idDelTitulo, idDelAparte].join(' ')}>
        <TituloDeFigura
          titulo={textos.gastos.loQueMasUsas}
          aparte={textos.gastos.enCuantosTrabajos}
          idDelTitulo={idDelTitulo}
          idDelAparte={idDelAparte}
          ayuda={
            <Ayuda que={textos.queEs(textos.gastos.loQueMasUsas)}>
              {textos.ayudas.loQueMasUsas}
            </Ayuda>
          }
        />
        {hayUsos ? (
          <div className="@container">
            <div className="grid grid-cols-1 gap-4.5 @min-[34rem]:grid-cols-2 @min-[34rem]:gap-6">
              <ListaDeUsos
                titulo={textos.gastos.materiales}
                usos={gastos.materiales}
                sinNada={textos.gastos.sinMateriales}
              />
              <ListaDeUsos
                titulo={textos.gastos.herrajes}
                usos={gastos.herrajes}
                sinNada={textos.gastos.sinHerrajes}
              />
            </div>
          </div>
        ) : (
          <p className="text-label leading-snug text-text-2">{textos.gastos.sinNadaAnotado}</p>
        )}
      </Figura>
      {hayGastos ? (
        <VerLosNumeros
          textos={{
            ver: mensajes.ui.comparacion.verLosNumeros,
            ocultar: mensajes.ui.comparacion.ocultarLosNumeros,
          }}
          tablas={[
            {
              titulo: textos.gastos.tabla.titulo,
              columnas: [
                { clave: 'categoria', titulo: textos.gastos.tabla.categoria },
                { clave: 'monto', titulo: textos.gastos.tabla.monto },
                { clave: 'de-cada-cien', titulo: textos.gastos.tabla.deCadaCien(cien) },
              ],
              filas,
            },
          ]}
        >
          <IrA a={rutaDeFinanzasDelTesoro('maun')}>{textos.gastos.irAFinanzas}</IrA>
        </VerLosNumeros>
      ) : (
        <Acciones>
          <IrA a={rutaDeFinanzasDelTesoro('maun')}>{textos.gastos.irAFinanzas}</IrA>
        </Acciones>
      )}
    </Seccion>
  );
}
