import {
  sumarDias,
  UMBRAL_MEDIANA,
  type LasEntregas,
  type PeriodoResuelto,
  type PuntoDeEntrega,
} from '@maun/domain';
import { Fragment, type ReactNode } from 'react';

import { cuantosTrabajos, diasEnPartes, enDias, resumenDeLosDias } from '@/entities/entrega';
import { useMensajes, type Mensajes } from '@/shared/idioma';
import {
  fechaDelRotulo,
  RUTA_DEL_ANALITICO,
  rutaDelProyecto,
  techoDeDias,
  useIr,
} from '@/shared/lib';
import {
  Forma,
  Lectura,
  PuntosEnUnEje,
  RenglonesDePuntos,
  useEleccion,
  VerLosNumeros,
} from '@/shared/ui';

import { cuandoEnLaFrase, porcentaje, rangoEnElTexto } from '../model/textos';
import {
  Dato,
  EnLaLeyenda,
  Figura,
  Fuerte,
  IrA,
  Leyenda,
  Negrita,
  Seccion,
  TituloDeFigura,
} from './piezas';

type TextosDeLasEntregas = Mensajes['paginaEstadisticas']['entregas'];

function comoLlego(punto: PuntoDeEntrega, textos: TextosDeLasEntregas): string {
  if (punto.como === 'a-tiempo') return textos.aTiempo;
  if (punto.como === 'tarde') return textos.tardeDias(punto.atraso);
  return textos.sinFecha;
}

function comoLlegoEnLaTabla(punto: PuntoDeEntrega, textos: TextosDeLasEntregas): string {
  if (punto.como === 'a-tiempo') return textos.tabla.aTiempo;
  if (punto.como === 'tarde') return textos.tabla.tarde(punto.atraso);
  return textos.tabla.sinFecha;
}

export interface SeccionDeLasEntregasProps {
  entregas: LasEntregas;
  resuelto: PeriodoResuelto;
  hoy: string;
  probar: string | null;
}

export function SeccionDeLasEntregas({
  entregas,
  resuelto,
  hoy,
  probar,
}: SeccionDeLasEntregasProps) {
  const mensajes = useMensajes();
  const textos = mensajes.paginaEstadisticas;
  const eleccion = useEleccion();
  const ir = useIr();
  const { demora, aTiempo, puntos } = entregas;

  if (puntos.length === 0) {
    return (
      <Seccion
        numero={3}
        titulo={textos.secciones.entregas}
        ayuda={textos.ayudas.entregas}
        frase={null}
        subtitulo={textos.entregas.subtituloSinEntregas}
        vacio={{
          loQuePaso:
            resuelto.largo === 'todo'
              ? textos.entregas.vacioDeTodo
              : textos.entregas.vacio(rangoEnElTexto(resuelto, hoy)),
          probar,
        }}
      />
    );
  }

  let frase: ReactNode;
  if (demora.modo === 'casos') {
    frase = textos.entregas.fraseConPocos(
      Fuerte,
      puntos.length,
      resumenDeLosDias(demora),
      entregas.faltan,
    );
  } else {
    const tardas = enDias(demora.mediana);
    frase =
      aTiempo.n === 0
        ? textos.entregas.fraseSinPromesas(Fuerte, tardas)
        : aTiempo.porcentaje === null
          ? textos.entregas.frase(Fuerte, aTiempo.k, aTiempo.n, tardas)
          : textos.entregas.fraseConPorcentaje(
              Fuerte,
              aTiempo.k,
              aTiempo.n,
              porcentaje(aTiempo.porcentaje),
              tardas,
            );
  }

  const dias = puntos.map((punto) => punto.dias);
  const maximo = techoDeDias(dias);
  const menor = Math.min(...dias);
  const mayor = Math.max(...dias);
  const mostrado = puntos.find((punto) => punto.id === eleccion.mostrada) ?? null;
  const abrir = (proyectoId: string) => {
    ir(rutaDelProyecto(proyectoId));
  };

  return (
    <Seccion
      numero={3}
      titulo={textos.secciones.entregas}
      ayuda={textos.ayudas.entregas}
      frase={frase}
      subtitulo={textos.entregas.subtitulo(puntos.length, cuandoEnLaFrase(resuelto, hoy))}
    >
      <Figura>
        <figcaption className="sr-only">{textos.entregas.figura}</figcaption>
        <Leyenda>
          <EnLaLeyenda marca={<Forma forma="lleno" />}>{textos.entregas.aTiempo}</EnLaLeyenda>
          <EnLaLeyenda marca={<Forma forma="hueco" />}>{textos.entregas.tarde}</EnLaLeyenda>
          <EnLaLeyenda marca={<Forma forma="contexto" />}>{textos.entregas.sinFecha}</EnLaLeyenda>
        </Leyenda>
        <Lectura
          accion={
            mostrado === null
              ? null
              : {
                  texto: textos.entregas.verElTrabajo,
                  alTocar: () => {
                    abrir(mostrado.id);
                  },
                }
          }
        >
          {mostrado === null
            ? textos.entregas.tocaUnPunto
            : textos.entregas.lectura(
                Negrita,
                <Dato>{mostrado.titulo}</Dato>,
                enDias(mostrado.dias),
                comoLlego(mostrado, textos.entregas),
              )}
        </Lectura>
        <PuntosEnUnEje
          nombre={textos.entregas.figura}
          puntos={puntos.map((punto) => ({
            clave: punto.id,
            dias: punto.dias,
            forma: punto.como,
            etiqueta:
              demora.modo === 'casos'
                ? textos.entregas.diasCortos(diasEnPartes(punto.dias).numero)
                : punto.como === 'tarde'
                  ? textos.entregas.atraso(punto.atraso)
                  : null,
            nombre: textos.entregas.punto(
              punto.titulo,
              enDias(punto.dias),
              comoLlego(punto, textos.entregas),
            ),
          }))}
          maximo={maximo}
          mediana={
            demora.modo === 'mediana'
              ? { dias: demora.mediana, texto: textos.entregas.mediana(enDias(demora.mediana)) }
              : null
          }
          cota={
            menor === mayor
              ? null
              : {
                  desde: menor,
                  hasta: mayor,
                  texto: textos.entregas.cota(
                    diasEnPartes(menor).numero,
                    diasEnPartes(mayor).numero,
                  ),
                }
          }
          eleccion={eleccion}
          alAbrir={abrir}
        />
      </Figura>

      {entregas.porTipo.length > 0 && (
        <Figura separada>
          <TituloDeFigura
            titulo={textos.entregas.porTipo}
            aparte={textos.entregas.medianaDesde(UMBRAL_MEDIANA)}
          />
          <RenglonesDePuntos
            renglones={entregas.porTipo.map((tipo) => ({
              clave: tipo.grupo.clave,
              nombre: tipo.grupo.nombre,
              detalle: cuantosTrabajos(tipo.dias.length),
              dias: tipo.dias,
              mediana: tipo.mediana,
              medianaTexto: enDias(tipo.mediana),
            }))}
            maximo={maximo}
          />
          {entregas.deAUno.length > 0 && (
            <p className="text-meta leading-snug text-text-3">
              {textos.entregas.deAUno}{' '}
              {entregas.deAUno.map((punto, indice) => (
                <Fragment key={punto.id}>
                  {indice > 0 && ' · '}
                  <Dato>{punto.titulo}</Dato>, {enDias(punto.dias)}
                </Fragment>
              ))}
            </p>
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
            titulo: textos.entregas.tabla.titulo,
            columnas: [
              { clave: 'trabajo', titulo: textos.entregas.tabla.trabajo },
              { clave: 'arranco', titulo: textos.entregas.tabla.arranco, enElCelular: false },
              { clave: 'entrego', titulo: textos.entregas.tabla.entrego, enElCelular: false },
              { clave: 'dias', titulo: textos.entregas.tabla.dias },
              { clave: 'prometida', titulo: textos.entregas.tabla.prometida, enElCelular: false },
              { clave: 'como', titulo: textos.entregas.tabla.comoLlego },
            ],
            filas: puntos.map((punto) => ({
              clave: punto.id,
              celdas: [
                <Dato key="titulo">{punto.titulo}</Dato>,
                fechaDelRotulo(sumarDias(punto.entregado, -punto.dias)),
                fechaDelRotulo(punto.entregado),
                diasEnPartes(punto.dias).numero,
                punto.prometido === null
                  ? textos.tarjetas.sinDato
                  : fechaDelRotulo(punto.prometido),
                comoLlegoEnLaTabla(punto, textos.entregas),
              ],
            })),
          },
        ]}
      >
        <IrA a={RUTA_DEL_ANALITICO}>{textos.entregas.irAlAnalitico}</IrA>
      </VerLosNumeros>
    </Seccion>
  );
}
