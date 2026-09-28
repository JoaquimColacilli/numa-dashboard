import { centavos, type LiquidacionPorLaFila, type Money } from '@maun/domain';

import { Globo, LineaDePuntos } from '@/entities/fila';
import { formatearPesos, nombreDelMes, TINTA } from '@/shared/lib';
import { Ayuda, Icono, MoneyInput } from '@/shared/ui';

import { ATAJOS_DE_LA_PRUEBA, notaDelPasoEnLaPrueba } from '../model/prueba';
import { porciento } from '../model/textos';
import { tesoroDe, type PruebaEnPantalla, type VistaDeLaFila } from '../model/vista';
import { Segmentado } from './Seccion';

export interface ProbadorProps {
  vista: VistaDeLaFila;
  prueba: PruebaEnPantalla;
  resultado: LiquidacionPorLaFila | null;
  alProbar: (prueba: PruebaEnPantalla) => void;
  forma?: 'panel' | 'celular' | 'flotante';
}

export function AyudaDelMes({ mes }: { mes: string }) {
  return (
    <Ayuda que="Con qué mes se prueba">
      <p>
        <strong className="font-semibold">Con lo de {mes}:</strong> los topes ya tienen lo que entró
        con los cobros del mes, así que ves qué pasaría con el próximo.
      </p>
      <p className="mt-1.5">
        <strong className="font-semibold">Mes en cero:</strong> como si fuera el primer cobro del
        mes, con todos los topes vacíos.
      </p>
    </Ayuda>
  );
}

export function Probador({ vista, prueba, resultado, alProbar, forma = 'panel' }: ProbadorProps) {
  const mes = nombreDelMes(vista.mes).toLowerCase();
  const cambiarMonto = (monto: number | null) => {
    alProbar({ ...prueba, monto: monto === null ? null : centavos(monto) });
  };
  const segmentado = (
    <Segmentado
      etiqueta="Con qué mes probar"
      chico
      opciones={[
        { id: 'mes', etiqueta: `Con lo de ${mes}` },
        { id: 'cero', etiqueta: 'Mes en cero' },
      ]}
      elegido={prueba.mesEnCero ? 'cero' : 'mes'}
      alElegir={(opcion) => {
        alProbar({ ...prueba, mesEnCero: opcion === 'cero' });
      }}
    />
  );

  if (forma === 'flotante') {
    return (
      <div className="flex flex-col gap-2">
        <MoneyInput
          etiqueta="Probá con un trabajo que deje"
          placeholder="$ 0"
          value={prueba.monto}
          onChange={cambiarMonto}
        />
        {resultado !== null && <Sobran resultado={resultado} />}
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${forma === 'celular' ? 'gap-2.5' : 'gap-3'}`}>
      {forma === 'celular' ? (
        <MoneyInput
          aria-label="Lo que deja el trabajo"
          placeholder="$ 0"
          value={prueba.monto}
          onChange={cambiarMonto}
          className="h-field w-full rounded-field border border-border bg-paper px-3.5 text-body-lg"
        />
      ) : (
        <MoneyInput
          etiqueta="Probá con un trabajo que deje"
          placeholder="$ 0"
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
          <span className="flex flex-none @max-[20rem]:hidden">
            <AyudaDelMes mes={mes} />
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
  nota?: string;
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
      {nota !== undefined && <span className="ml-7 text-meta text-text-3">{nota}</span>}
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
    resultado.diezmo +
    resultado.pasos.reduce((total, paso) => total + paso.monto, 0) +
    resultado.reparto.reduce((total, parte) => total + parte.monto, 0) +
    resultado.remanente;
  const maun = tesoroDe(vista, vista.sistema.maun);
  const restoBp = 10_000 - resultado.reparto.reduce((total, parte) => total + parte.porcentaje, 0);
  const cierra = suma === resultado.neta;
  return (
    <div className="rounded-field border border-hairline bg-surface-3 px-3 py-3">
      <ul aria-label="Cómo baja este cobro" className="flex flex-col gap-2">
        <RenglonDeLaTabla
          nombre={`Diezmo ${porciento(resultado.diezmoBp)}`}
          punto={TINTA.diezmo.fondo}
          monto={resultado.diezmo}
        />
        {resultado.pasos.map((paso, indice) => (
          <RenglonDeLaTabla
            key={paso.tesoro}
            numero={indice + 1}
            nombre={tesoroDe(vista, paso.tesoro).nombre}
            monto={paso.monto}
            nota={notaDelPasoEnLaPrueba(paso)}
          />
        ))}
        <li className="mt-1 flex items-center gap-2 border-t border-hairline pt-2">
          <Icono nombre="split" tamano={14} className="mx-1 flex-none text-text-2" />
          <LineaDePuntos
            className="min-w-0 flex-1 text-label font-medium"
            izquierda="Lo que sobra"
            derecha={
              <span className="font-semibold text-ink">{formatearPesos(resultado.sobrante)}</span>
            }
          />
        </li>
        {resultado.reparto.map((parte) => {
          const tesoro = tesoroDe(vista, parte.tesoro);
          return (
            <RenglonDeLaTabla
              key={parte.tesoro}
              sangria
              nombre={`${tesoro.nombre} ${porciento(parte.porcentaje)}`}
              punto={TINTA[tesoro.tinta].fondo}
              monto={parte.monto}
            />
          );
        })}
        <RenglonDeLaTabla
          sangria
          nombre={`${maun.nombre}, el resto ${porciento(restoBp)}`}
          punto={TINTA[maun.tinta].fondo}
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
              <span className="sr-only">da la ganancia</span>
            </>
          )}
        </span>
      </div>
    </div>
  );
}
