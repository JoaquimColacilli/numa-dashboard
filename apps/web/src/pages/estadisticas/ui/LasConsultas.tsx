import {
  ETAPAS_ANOTADAS_DESDE,
  PUNTOS_DE_LA_TASA,
  UMBRAL_DEL_EMBUDO,
  UMBRAL_MEDIANA,
  type LasConsultas,
  type PeriodoResuelto,
  type ResumenDeDias,
} from '@maun/domain';
import { useId, useState } from 'react';

import { EnlaceACliente } from '@/entities/cliente';
import { enDias } from '@/entities/entrega';
import { useMensajes } from '@/shared/idioma';
import { diaYMes } from '@/shared/lib';
import { Embudo, PuntosDeCasos, VerLosNumeros } from '@/shared/ui';

import { conMayuscula, cuandoEnLaFrase, rangoEnElTexto } from '../model/textos';
import {
  BotonQueAbre,
  Cifra,
  CifraChica,
  Falta,
  Figura,
  Fuerte,
  Lista,
  RenglonConEnlace,
  Seccion,
  TituloDeFigura,
} from './piezas';

type FaltanParaLosTiempos = 'ambos' | 'mandarlos' | 'contesten';

function queFaltaParaLosTiempos(
  alPresupuesto: ResumenDeDias,
  aLaRespuesta: ResumenDeDias,
): FaltanParaLosTiempos | null {
  const sinAlPresupuesto = alPresupuesto.modo === 'casos';
  const sinALaRespuesta = aLaRespuesta.modo === 'casos';
  if (sinAlPresupuesto && sinALaRespuesta) return 'ambos';
  if (sinAlPresupuesto) return 'mandarlos';
  return sinALaRespuesta ? 'contesten' : null;
}

interface Tiempo {
  clave: string;
  que: string;
  resumen: ResumenDeDias;
}

export interface SeccionDeLasConsultasProps {
  consultas: LasConsultas;
  resuelto: PeriodoResuelto;
  hoy: string;
  clientes: ReadonlyMap<string, string>;
  probar: string | null;
}

export function SeccionDeLasConsultas({
  consultas,
  resuelto,
  hoy,
  clientes,
  probar,
}: SeccionDeLasConsultasProps) {
  const mensajes = useMensajes();
  const textos = mensajes.paginaEstadisticas;
  const [conLaLista, setConLaLista] = useState(false);
  const idDeLaLista = useId();

  const subtitulo = (
    <>
      {textos.consultas.subtitulo(cuandoEnLaFrase(resuelto, hoy))}
      {consultas.antesDelRegistro && (
        <> {textos.consultas.antesDelRegistro(ETAPAS_ANOTADAS_DESDE)}</>
      )}
    </>
  );
  const ayuda = textos.ayudas.consultas(ETAPAS_ANOTADAS_DESDE);

  if (consultas.consultas === 0) {
    return (
      <Seccion
        numero={4}
        titulo={textos.secciones.consultas}
        ayuda={ayuda}
        frase={null}
        subtitulo={subtitulo}
        vacio={{
          loQuePaso:
            resuelto.largo === 'todo'
              ? textos.consultas.vacioDeTodo
              : textos.consultas.vacio(rangoEnElTexto(resuelto, hoy)),
          probar,
        }}
      />
    );
  }

  const conEmbudo = consultas.modo === 'embudo';
  const tiempos: Tiempo[] = [
    {
      clave: 'al-presupuesto',
      que: textos.consultas.alPresupuesto,
      resumen: consultas.alPresupuesto,
    },
    {
      clave: 'a-la-respuesta',
      que: textos.consultas.aLaRespuesta,
      resumen: consultas.aLaRespuesta,
    },
  ];
  const conMediana = tiempos.flatMap((tiempo) =>
    tiempo.resumen.modo === 'mediana'
      ? [{ ...tiempo, mediana: tiempo.resumen.mediana, n: tiempo.resumen.n }]
      : [],
  );
  const faltanLosTiempos = queFaltaParaLosTiempos(consultas.alPresupuesto, consultas.aLaRespuesta);
  const falta =
    conEmbudo && faltanLosTiempos === null
      ? null
      : textos.consultas.faltan(
          conEmbudo ? null : UMBRAL_DEL_EMBUDO,
          faltanLosTiempos,
          UMBRAL_MEDIANA,
        );

  return (
    <Seccion
      numero={4}
      titulo={textos.secciones.consultas}
      ayuda={ayuda}
      frase={textos.consultas.frase(
        Fuerte,
        consultas.consultas,
        consultas.presupuestos,
        consultas.trabajos,
        consultas.esperan,
        consultas.antesDelRegistro ? diaYMes(ETAPAS_ANOTADAS_DESDE, hoy) : null,
      )}
      subtitulo={subtitulo}
    >
      {conEmbudo && (
        <Figura>
          <figcaption className="sr-only">{textos.consultas.figura}</figcaption>
          <Embudo
            pasos={[
              {
                clave: 'consultas',
                nombre: textos.consultas.pasos.consultas,
                cantidad: consultas.consultas,
                cuenta: textos.consultas.primera(Cifra, consultas.consultas),
              },
              {
                clave: 'presupuestos',
                nombre: textos.consultas.pasos.presupuestos,
                cantidad: consultas.presupuestos,
                cuenta: textos.consultas.cuenta(Cifra, consultas.presupuestos, consultas.consultas),
              },
              {
                clave: 'trabajos',
                nombre: textos.consultas.pasos.trabajos,
                cantidad: consultas.aprobados,
                cuenta: textos.consultas.cuenta(Cifra, consultas.aprobados, consultas.presupuestos),
                fuerte: true,
              },
            ]}
          />
          <p className="text-meta leading-snug text-text-3">
            {textos.consultas.perdiste(
              consultas.perdidas,
              consultas.perdidasDespues,
              consultas.perdidasAntes,
            )}
            {textos.consultas.siguenAbiertas(consultas.abiertas)}
          </p>
        </Figura>
      )}

      {consultas.presupuestos > 0 ? (
        <Figura separada={conEmbudo}>
          <TituloDeFigura
            titulo={textos.consultas.presupuestosQueMandaste}
            aparte={
              consultas.modoDeLosPresupuestos === 'puntos'
                ? textos.consultas.unoPorPresupuesto
                : null
            }
          />
          <PuntosDeCasos
            nombre={textos.consultas.presupuestosQueMandaste}
            grupos={[
              {
                clave: 'aprobados',
                forma: 'lleno',
                cantidad: consultas.aprobados,
                rotulo: textos.consultas.aprobados(CifraChica, consultas.aprobados),
              },
              {
                clave: 'perdidos',
                forma: 'cruz',
                cantidad: consultas.perdidos,
                rotulo: textos.consultas.perdidos(CifraChica, consultas.perdidos),
              },
              {
                clave: 'esperan',
                forma: 'hueco',
                cantidad: consultas.esperan,
                rotulo: textos.consultas.esperan(CifraChica, consultas.esperan),
              },
            ]}
            maximoDePuntos={PUNTOS_DE_LA_TASA}
            sinCasos={textos.consultas.sinCasos}
          />
          {conMediana.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              {conMediana.map((tiempo) => (
                <div
                  key={tiempo.clave}
                  className="flex min-w-0 flex-col gap-0.5 rounded-field bg-ink/6 px-3 py-2.5"
                >
                  <span className="text-[1.25rem] leading-tight font-semibold">
                    {enDias(tiempo.mediana)}
                  </span>
                  <span className="text-label leading-snug text-text-2">{tiempo.que}</span>
                  <span className="text-meta text-text-3">
                    {textos.consultas.medianaDe(tiempo.n)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {falta !== null && <Falta>{falta}</Falta>}
        </Figura>
      ) : (
        falta !== null && <Falta>{falta}</Falta>
      )}

      <VerLosNumeros
        textos={{
          ver: mensajes.ui.comparacion.verLosNumeros,
          ocultar: mensajes.ui.comparacion.ocultarLosNumeros,
        }}
        tablas={[
          {
            titulo: textos.consultas.tabla.titulo,
            columnas: [
              { clave: 'paso', titulo: textos.consultas.tabla.paso },
              { clave: 'cuantas', titulo: textos.consultas.tabla.cuantas },
              { clave: 'de-cuantas', titulo: textos.consultas.tabla.deCuantas },
            ],
            filas: [
              {
                clave: 'consultas',
                celdas: [
                  textos.consultas.pasos.consultas,
                  String(consultas.consultas),
                  textos.consultas.tabla.sinDato,
                ],
              },
              {
                clave: 'presupuestos',
                celdas: [
                  textos.consultas.pasos.presupuestos,
                  String(consultas.presupuestos),
                  String(consultas.consultas),
                ],
              },
              {
                clave: 'trabajos',
                celdas: [
                  textos.consultas.pasos.trabajos,
                  String(consultas.aprobados),
                  String(consultas.presupuestos),
                ],
              },
            ],
          },
          {
            titulo: textos.consultas.tabla.tiempos,
            columnas: [
              { clave: 'tiempo', titulo: textos.consultas.tabla.tiempo },
              { clave: 'mediana', titulo: textos.consultas.tabla.mediana },
              { clave: 'sobre-cuantos', titulo: textos.consultas.tabla.sobreCuantos },
            ],
            filas: tiempos.map((tiempo) => ({
              clave: tiempo.clave,
              celdas: [
                conMayuscula(tiempo.que),
                tiempo.resumen.modo === 'mediana'
                  ? enDias(tiempo.resumen.mediana)
                  : textos.consultas.tabla.sinDato,
                String(tiempo.resumen.n),
              ],
            })),
          },
        ]}
      >
        <BotonQueAbre
          abierto={conLaLista}
          controla={idDeLaLista}
          alTocar={() => {
            setConLaLista((antes) => !antes);
          }}
        >
          {conLaLista
            ? textos.consultas.esconderLaLista
            : textos.consultas.verLas(consultas.consultas)}
        </BotonQueAbre>
      </VerLosNumeros>
      <Lista id={idDeLaLista} etiqueta={textos.consultas.lasConsultas} oculta={!conLaLista}>
        {consultas.cohorte.map((consulta) => {
          const cliente = clientes.get(consulta.clienteId);
          return (
            <RenglonConEnlace
              key={consulta.proyectoId}
              proyectoId={consulta.proyectoId}
              titulo={consulta.titulo}
              arriba={
                cliente === undefined ? null : (
                  <EnlaceACliente id={consulta.clienteId} nombre={cliente} />
                )
              }
              detalle={textos.consultas.entro(diaYMes(consulta.entro, hoy))}
              valor={
                <span className="text-meta font-semibold">
                  {textos.consultas.donde[consulta.donde]}
                </span>
              }
            />
          );
        })}
      </Lista>
    </Seccion>
  );
}
