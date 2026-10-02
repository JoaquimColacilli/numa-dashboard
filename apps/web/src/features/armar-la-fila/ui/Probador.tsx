import { centavos, tipoDelPaso, type LiquidacionPorLaFila, type Money } from '@maun/domain';
import type { ReactNode } from 'react';

import { AyudaDeLoDeHoy, Globo, LineaDePuntos } from '@/entities/fila';
import { formatearPesos, TINTA } from '@/shared/lib';
import { Icono, MoneyInput } from '@/shared/ui';

import {
  ATAJOS_DE_LA_PRUEBA,
  notaDeLaParteEnLaPrueba,
  notaDelPasoEnLaPrueba,
} from '../model/prueba';
import { porciento } from '../model/textos';
import { pideLoCobrado, tesoroDe, type PruebaEnPantalla, type VistaDeLaFila } from '../model/vista';
import { Segmentado } from './Seccion';

export interface ProbadorProps {
  vista: VistaDeLaFila;
  prueba: PruebaEnPantalla;
  resultado: LiquidacionPorLaFila | null;
  alProbar: (prueba: PruebaEnPantalla) => void;
  forma?: 'panel' | 'celular' | 'flotante';
}

export const ETIQUETA_DE_LO_QUE_DEJA = 'Deja (cobrado menos gastos)';
export const ETIQUETA_DEL_TRABAJO = 'Probá con un trabajo que deje';

export function Probador({ vista, prueba, resultado, alProbar, forma = 'panel' }: ProbadorProps) {
  const conCobrado = pideLoCobrado(vista.fila);
  const cambiarMonto = (monto: number | null) => {
    alProbar({ ...prueba, monto: monto === null ? null : centavos(monto) });
  };
  const cambiarCobrado = (cobrado: number | null) => {
    alProbar({ ...prueba, cobrado: cobrado === null ? null : centavos(cobrado) });
  };
  const segmentado = (
    <Segmentado
      etiqueta="Con qué se prueba"
      chico
      opciones={[
        { id: 'hoy', etiqueta: 'Con lo de hoy' },
        { id: 'cero', etiqueta: 'Todo en cero' },
      ]}
      elegido={prueba.enCero ? 'cero' : 'hoy'}
      alElegir={(opcion) => {
        alProbar({ ...prueba, enCero: opcion === 'cero' });
      }}
    />
  );
  const seCobro = conCobrado && (
    <MoneyInput
      etiqueta="Se cobró"
      ayuda="Todo lo que entró del trabajo, para lo que se calcula sobre lo que cobrás."
      conMarcador
      value={prueba.cobrado}
      onChange={cambiarCobrado}
    />
  );

  if (forma === 'flotante') {
    return (
      <div className="flex flex-col gap-2">
        {conCobrado && (
          <MoneyInput
            etiqueta="Se cobró"
            conMarcador
            value={prueba.cobrado}
            onChange={cambiarCobrado}
          />
        )}
        <MoneyInput
          etiqueta={conCobrado ? ETIQUETA_DE_LO_QUE_DEJA : ETIQUETA_DEL_TRABAJO}
          conMarcador
          value={prueba.monto}
          onChange={cambiarMonto}
        />
        {resultado !== null && <Sobran resultado={resultado} />}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${forma === 'celular' ? 'gap-2.5' : 'gap-3'}`}>
      {seCobro}
      {forma === 'celular' && !conCobrado ? (
        <MoneyInput
          aria-label="Lo que deja el trabajo"
          conMarcador
          value={prueba.monto}
          onChange={cambiarMonto}
          className="h-field w-full rounded-field border border-border bg-paper px-3.5 text-body-lg"
        />
      ) : (
        <MoneyInput
          etiqueta={conCobrado ? ETIQUETA_DE_LO_QUE_DEJA : ETIQUETA_DEL_TRABAJO}
          conMarcador
          value={prueba.monto}
          onChange={cambiarMonto}
        />
      )}
      <div className={forma === 'celular' ? 'grid grid-cols-3 gap-1.5' : 'flex flex-wrap gap-1.5'}>
        {ATAJOS_DE_LA_PRUEBA.map((monto) => {
          const elegido = prueba.monto === monto;
          return (
            <button
              key={monto}
              type="button"
              aria-pressed={elegido}
              onClick={() => {
                alProbar({ ...prueba, monto });
              }}
              className={`apretable relative rounded-pill border px-3 text-label tabular-nums ${
                forma === 'celular'
                  ? 'min-h-9 before:absolute before:inset-x-0 before:-inset-y-1'
                  : 'min-h-tap'
              } ${
                elegido
                  ? 'border-ink bg-ink font-semibold text-paper'
                  : 'border-border bg-paper font-medium text-ink hover:bg-surface'
              }`}
            >
              {formatearPesos(monto)}
            </button>
          );
        })}
      </div>
      {forma === 'celular' ? (
        prueba.monto !== null && segmentado
      ) : (
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">{segmentado}</div>
          <span className="flex flex-none">
            <AyudaDeLoDeHoy />
          </span>
        </div>
      )}
      {forma === 'celular'
        ? resultado !== null && <Sobran resultado={resultado} conMirar />
        : resultado !== null && <TablaDeLaPrueba vista={vista} resultado={resultado} />}
    </div>
  );
}

function Sobran({
  resultado,
  conMirar = false,
}: {
  resultado: LiquidacionPorLaFila;
  conMirar?: boolean;
}) {
  return (
    <p className="text-label text-text-2">
      Sobran{' '}
      <span className="font-semibold text-ink tabular-nums">
        {formatearPesos(resultado.sobrante)}
      </span>{' '}
      para repartir.{conMirar ? ' Mirá la fila.' : ''}
    </p>
  );
}

function RenglonDeLaTabla({
  numero,
  nombre,
  punto,
  monto,
  nota,
  sangria = false,
}: {
  numero?: number;
  nombre: string;
  punto?: string;
  monto: Money;
  nota?: string | null;
  sangria?: boolean;
}) {
  return (
    <li className={`flex flex-col ${sangria ? 'pl-8' : ''}`}>
      <div className="flex items-center gap-2">
        {numero === undefined ? (
          <span
            aria-hidden
            className={`size-2 flex-none rounded-pill ${punto ?? 'bg-text-3'} ${sangria ? '' : 'mx-1.5'}`}
          />
        ) : (
          <Globo numero={numero} className="size-5! text-[10px]!" />
        )}
        <LineaDePuntos
          className="min-w-0 flex-1 text-label"
          izquierda={nombre}
          derecha={
            <span className={`font-semibold ${monto <= 0 ? 'text-text-3' : 'text-ink'}`}>
              {formatearPesos(monto)}
            </span>
          }
        />
      </div>
      {nota !== undefined && nota !== null && (
        <span className="ml-7 text-meta text-text-3">{nota}</span>
      )}
    </li>
  );
}

function Subtotal({ icono, nombre, monto }: { icono?: ReactNode; nombre: string; monto: Money }) {
  return (
    <li className="mt-1 flex items-center gap-2 border-t border-hairline pt-2">
      <span aria-hidden className="mx-1 flex w-3.5 flex-none justify-center text-text-2">
        {icono}
      </span>
      <LineaDePuntos
        className="min-w-0 flex-1 text-label font-medium"
        izquierda={nombre}
        derecha={<span className="font-semibold text-ink">{formatearPesos(monto)}</span>}
      />
    </li>
  );
}

export function TablaDeLaPrueba({
  vista,
  resultado,
}: {
  vista: Pick<VistaDeLaFila, 'tesoros' | 'sistema'>;
  resultado: LiquidacionPorLaFila;
}) {
  const suma =
    resultado.obligaciones.reduce((total, obligacion) => total + obligacion.monto, 0) +
    resultado.pasos.reduce((total, paso) => total + paso.monto, 0) +
    resultado.reparto.reduce((total, parte) => total + parte.monto, 0) +
    resultado.remanente;
  const superavit = tesoroDe(vista, resultado.superavit ?? vista.sistema.maun);
  const restoBp = 10_000 - resultado.reparto.reduce((total, parte) => total + parte.porcentaje, 0);
  const cierra = suma === resultado.neta;
  const cuantasObligaciones = resultado.obligaciones.length;
  const compromisos = resultado.pasos.filter((paso) => tipoDelPaso(paso.clase) === 'compromiso');
  const ahorros = resultado.pasos.filter((paso) => tipoDelPaso(paso.clase) === 'ahorro-fijo');
  const renglonDelPaso = (paso: (typeof resultado.pasos)[number]) => (
    <RenglonDeLaTabla
      key={paso.tesoro}
      numero={cuantasObligaciones + resultado.pasos.indexOf(paso) + 1}
      nombre={tesoroDe(vista, paso.tesoro).nombre}
      monto={paso.monto}
      nota={notaDelPasoEnLaPrueba(paso)}
    />
  );
  return (
    <div className="rounded-field border border-hairline bg-surface-3 px-3 py-3">
      <ul aria-label="Cómo baja este cobro" className="flex flex-col gap-2">
        {resultado.obligaciones.map((obligacion, indice) => {
          const tesoro = tesoroDe(vista, obligacion.tesoro);
          return (
            <RenglonDeLaTabla
              key={obligacion.tesoro}
              numero={indice + 1}
              nombre={`${obligacion.diezmo ? 'Diezmo' : tesoro.nombre} ${porciento(obligacion.porcentaje)}`}
              monto={obligacion.monto}
            />
          );
        })}
        {compromisos.length > 0 && (
          <>
            <Subtotal nombre="Ingreso libre" monto={resultado.libre} />
            {compromisos.map(renglonDelPaso)}
          </>
        )}
        <Subtotal nombre="Ganancia" monto={resultado.ganancia} />
        {ahorros.map(renglonDelPaso)}
        <Subtotal
          icono={<Icono nombre="split" tamano={14} />}
          nombre="Lo que sobra"
          monto={resultado.sobrante}
        />
        {resultado.reparto.map((parte) => {
          const tesoro = tesoroDe(vista, parte.tesoro);
          return (
            <RenglonDeLaTabla
              key={parte.tesoro}
              sangria
              nombre={`${tesoro.nombre} ${porciento(parte.porcentaje)}`}
              punto={TINTA[tesoro.tinta].fondo}
              monto={parte.monto}
              nota={notaDeLaParteEnLaPrueba(parte)}
            />
          );
        })}
        <RenglonDeLaTabla
          sangria
          nombre={`${superavit.nombre}, el resto ${porciento(restoBp)}`}
          punto={TINTA[superavit.tinta].fondo}
          monto={resultado.remanente}
        />
      </ul>
      <div className="mt-2.5 flex items-center justify-between border-t border-ink pt-2 text-label">
        <span className="rotulo-del-plano text-badge font-semibold text-text-2 uppercase">
          Suma
        </span>
        <span className="flex items-center gap-1.5 font-semibold tabular-nums">
          {formatearPesos(suma)}
          {cierra && (
            <>
              <Icono nombre="check" tamano={14} grosor={2.25} />
              <span className="sr-only">da el ingreso</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
