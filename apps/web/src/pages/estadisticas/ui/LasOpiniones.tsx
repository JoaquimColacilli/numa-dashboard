import {
  UMBRAL_MEDIANA,
  type ConformesDeUnaPregunta,
  type LasOpiniones,
  type PeriodoResuelto,
} from '@maun/domain';
import type { ReactNode } from 'react';

import { BarraDivergente, PuntosPorPersona } from '@/entities/opinion';
import { useMensajes } from '@/shared/idioma';
import { RUTA_DE_OPINIONES } from '@/shared/lib';
import { Forma, Puntitos, type Puntito } from '@/shared/ui';

import { cuandoEnLaFrase, porcentaje, rangoEnElTexto } from '../model/textos';
import {
  Acciones,
  EnLaLeyenda,
  Figura,
  Fuerte,
  IrA,
  Leyenda,
  Seccion,
  TituloDeFigura,
} from './piezas';

function OtraPregunta({ nombre, pregunta }: { nombre: string; pregunta: ConformesDeUnaPregunta }) {
  const textos = useMensajes().paginaEstadisticas.opiniones;
  const { k, n, porcentaje: elPorcentaje } = pregunta.conformes;
  return (
    <li className="grid grid-cols-[6.5rem_minmax(0,1fr)_auto] items-center gap-2.5 text-label">
      <span className="text-text-2">{nombre}</span>
      <span className="min-w-0">
        {elPorcentaje === null && (
          <Puntitos
            puntos={[
              ...Array.from({ length: k }, (): Puntito => 'lleno'),
              ...Array.from({ length: n - k }, (): Puntito => 'hueco'),
            ]}
          />
        )}
      </span>
      <span className="font-semibold whitespace-nowrap tabular-nums">
        {elPorcentaje === null
          ? textos.kDeN(k, n)
          : textos.kDeNConPorcentaje(k, n, porcentaje(elPorcentaje))}
      </span>
    </li>
  );
}

export interface SeccionDeLasOpinionesProps {
  opiniones: LasOpiniones;
  resuelto: PeriodoResuelto;
  hoy: string;
  probar: string | null;
}

export function SeccionDeLasOpiniones({
  opiniones,
  resuelto,
  hoy,
  probar,
}: SeccionDeLasOpinionesProps) {
  const textos = useMensajes().paginaEstadisticas;
  const cuando = cuandoEnLaFrase(resuelto, hoy);
  const acciones = (
    <Acciones>
      <IrA a={RUTA_DE_OPINIONES}>{textos.opiniones.irAOpiniones}</IrA>
    </Acciones>
  );

  if (opiniones.enviadas === 0) {
    return (
      <Seccion
        numero={5}
        titulo={textos.secciones.opiniones}
        ayuda={textos.ayudas.opiniones}
        frase={null}
        subtitulo={textos.opiniones.subtituloSinEncuestas(cuando)}
        vacio={{
          loQuePaso:
            resuelto.largo === 'todo'
              ? textos.opiniones.vacioDeTodo
              : textos.opiniones.vacio(rangoEnElTexto(resuelto, hoy)),
          probar,
        }}
      />
    );
  }

  const subtitulo = textos.opiniones.subtitulo(opiniones.enviadas, cuando, opiniones.contestadas);

  if (opiniones.contestadas === 0 || opiniones.titular === null || opiniones.titular.n === 0) {
    return (
      <Seccion
        numero={5}
        titulo={textos.secciones.opiniones}
        ayuda={textos.ayudas.opiniones}
        frase={
          opiniones.contestadas === 0
            ? textos.opiniones.sinRespuestas(opiniones.enviadas)
            : textos.opiniones.fraseSinEscala(Fuerte, opiniones.contestadas)
        }
        subtitulo={subtitulo}
      >
        {acciones}
      </Seccion>
    );
  }

  const titular = opiniones.titular;
  const conformes = opiniones.conformes;
  const muyConformes = titular.conteos.find((conteo) => conteo.paso.valor === 5)?.n ?? 0;
  let frase: ReactNode;
  if (conformes === null) {
    frase = textos.opiniones.fraseSinEscala(Fuerte, titular.n);
  } else if (conformes.porcentaje !== null) {
    frase = textos.opiniones.fraseConPorcentaje(
      Fuerte,
      conformes.k,
      conformes.n,
      porcentaje(conformes.porcentaje),
    );
  } else if (conformes.n < UMBRAL_MEDIANA) {
    frase = textos.opiniones.fraseConPocos(
      Fuerte,
      conformes.n,
      conformes.k,
      muyConformes === conformes.n,
    );
  } else {
    frase = textos.opiniones.frase(Fuerte, conformes.k, conformes.n);
  }

  const otras = [
    { clave: 'tiempos', nombre: textos.opiniones.tiempos, pregunta: opiniones.tiempos },
    { clave: 'trato', nombre: textos.opiniones.trato, pregunta: opiniones.trato },
  ].flatMap(({ clave, nombre, pregunta }) =>
    pregunta === null || pregunta.conformes.n === 0 ? [] : [{ clave, nombre, pregunta }],
  );

  return (
    <Seccion
      numero={5}
      titulo={textos.secciones.opiniones}
      ayuda={textos.ayudas.opiniones}
      frase={frase}
      subtitulo={subtitulo}
    >
      <Figura>
        <TituloDeFigura
          titulo={titular.pregunta.texto}
          dato
          aparte={titular.modo === 'barras' ? null : textos.opiniones.unPuntoPorPersona}
        />
        {titular.modo === 'barras' ? (
          <BarraDivergente conteos={titular.conteos} />
        ) : (
          <PuntosPorPersona conteos={titular.conteos} tipo={titular.pregunta.tipo} />
        )}
      </Figura>
      {otras.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-hairline-soft pt-3">
          <Leyenda>
            <EnLaLeyenda marca={<Forma forma="lleno" radio={3.5} />}>
              {textos.opiniones.losDosDeArriba}
            </EnLaLeyenda>
            <EnLaLeyenda marca={<Forma forma="hueco" radio={3.5} />}>
              {textos.opiniones.elResto}
            </EnLaLeyenda>
          </Leyenda>
          <ul className="flex list-none flex-col gap-2 p-0">
            {otras.map((otra) => (
              <OtraPregunta key={otra.clave} nombre={otra.nombre} pregunta={otra.pregunta} />
            ))}
          </ul>
        </div>
      )}
      {acciones}
    </Seccion>
  );
}
