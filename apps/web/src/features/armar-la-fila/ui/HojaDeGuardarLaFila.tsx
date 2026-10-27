import { conDesde, conElPagaSolaDesde, type Money } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { pruebaDeUnCobro } from '@/entities/fila';
import { MUTACION_DE_MOVIMIENTO, vaEntreTesoros } from '@/entities/movimiento';
import { useReplicaDelTaller } from '@/entities/replica';
import { datosDelMesDeLaReplica } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  formatearPesos,
  mesEnUnaFrase,
  metaDeAvisos,
  TINTA,
  useAnchoDePantalla,
  uuidv7,
  type Envoltorio,
  type TintaDeTesoro,
} from '@/shared/lib';
import { Ayuda, Button, FilaDeAcciones, Hoja, Icono, type NombreDeIcono } from '@/shared/ui';

import { MUTACION_DE_LA_FILA } from '../api/mutacion';
import { descartarElBorrador } from '../model/borrador';
import { comparacionDeLaFila } from '../model/comparacion';
import {
  faltaElegir,
  loQueSePagaSolo,
  movimientosDeLaPlataDeAntes,
  type QueHacerConLaPlata,
} from '../model/pagaSola';
import { COBRO_DE_EJEMPLO } from '../model/prueba';
import { cuantasCosas, renglonDelCambio } from '../model/textos';
import { loQueEstabaGuardado, tesoroDe, type VistaDeLaFila } from '../model/vista';
import { LoQueSePagaSolo } from './LoQueSePagaSolo';

export interface HojaDeGuardarLaFilaProps {
  vista: VistaDeLaFila;
  monto: Money | null;
  cobrado?: Money | null;
  alCerrar: () => void;
  alGuardar?: () => void;
}

function nombreEnLaTinta(tinta: TintaDeTesoro): Envoltorio {
  return function NombreEnLaTinta({ children }: { children: ReactNode }) {
    return (
      <span translate="no" className={`font-semibold ${TINTA[tinta].texto}`}>
        {children}
      </span>
    );
  };
}

const NOMBRE_EN_LA_TINTA: Readonly<Record<TintaDeTesoro, Envoltorio>> = {
  hogar: nombreEnLaTinta('hogar'),
  maun: nombreEnLaTinta('maun'),
  diezmo: nombreEnLaTinta('diezmo'),
  cocos: nombreEnLaTinta('cocos'),
  grana: nombreEnLaTinta('grana'),
  mostaza: nombreEnLaTinta('mostaza'),
  petroleo: nombreEnLaTinta('petroleo'),
  ciruela: nombreEnLaTinta('ciruela'),
};

function RenglonDelCambio({ icono, children }: { icono: NombreDeIcono; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="mt-px flex size-7 flex-none items-center justify-center rounded-control bg-surface-2 text-ink"
      >
        <Icono nombre={icono} tamano={15} />
      </span>
      <span className="min-w-0 text-body leading-relaxed">{children}</span>
    </li>
  );
}

export function HojaDeGuardarLaFila({
  vista: laDeAhora,
  monto,
  cobrado = null,
  alCerrar,
  alGuardar,
}: HojaDeGuardarLaFilaProps) {
  const m = useMensajes().armarLaFila;
  const textos = m.guardar;
  const replica = useReplicaDelTaller();
  const [vista] = useState(laDeAhora);
  const enCelular = useAnchoDePantalla() === 'movil';
  const guardar = useMutation({ ...MUTACION_DE_LA_FILA, meta: metaDeAvisos('filaGuardada') });
  const pasar = useMutation({
    ...MUTACION_DE_MOVIMIENTO,
    meta: metaDeAvisos('movimientoNuevo', { silencioso: true }),
  });
  const borrador = vista.borrador;
  const [pagosSolos] = useState(() =>
    borrador === null
      ? []
      : loQueSePagaSolo(borrador.base, borrador.fila, datosDelMesDeLaReplica(replica), vista.hoy),
  );
  const [elegidos, setElegidos] = useState<Readonly<Record<string, QueHacerConLaPlata>>>({});
  const falta = faltaElegir(pagosSolos, elegidos);
  const cobro = monto !== null && monto > 0 ? monto : COBRO_DE_EJEMPLO;
  const mes = mesEnUnaFrase(vista.mes);

  const comparacion = (() => {
    if (borrador === null) return [];
    try {
      const probar = (fila: typeof borrador.fila) =>
        pruebaDeUnCobro(replica, fila, {
          monto: cobro,
          cobrado: monto !== null && monto > 0 ? cobrado : null,
          enCero: false,
          hoy: vista.hoy,
        });
      return comparacionDeLaFila(
        probar(borrador.base),
        probar(borrador.fila),
        vista.sistema,
        vista.tesoros.map((tesoro) => tesoro.id),
      );
    } catch {
      return [];
    }
  })();

  const enCero = vista.fila.pasos.filter((paso) => paso.tope <= 0);
  const cuantas = vista.cambios.length + (borrador?.pasadoAMensual === true ? 1 : 0);
  const sePuede =
    borrador !== null && vista.ajustesId !== null && vista.problemas.length === 0 && !falta;

  function guardarLaFila(): void {
    if (borrador === null || vista.ajustesId === null || !sePuede) return;
    guardar.mutate({
      ajustesId: vista.ajustesId,
      version: borrador.version,
      fila: conElPagaSolaDesde(
        borrador.base,
        conDesde(borrador.base, borrador.fila, vista.mes),
        vista.hoy,
      ),
      guardadaEn: new Date().toISOString(),
      previa: loQueEstabaGuardado(replica),
    });
    for (const movimiento of movimientosDeLaPlataDeAntes(
      pagosSolos,
      elegidos,
      vista.sistema.maun,
      vista.hoy,
      uuidv7,
    )) {
      pasar.mutate(movimiento);
    }
    alGuardar?.();
    alCerrar();
    descartarElBorrador();
  }

  return (
    <Hoja
      titulo={textos.titulo}
      bajada={textos.revision(vista.revision)}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <section aria-labelledby="lo-que-cambia" className="flex flex-col gap-2.5">
            <h3 id="lo-que-cambia" className="text-label font-medium text-text-2">
              {cuantasCosas(cuantas)}
            </h3>
            <ul className="flex flex-col gap-2">
              {borrador?.pasadoAMensual === true && (
                <RenglonDelCambio icono="calendar">{textos.sueldoPorMes}</RenglonDelCambio>
              )}
              {vista.cambios.map((cambio) => {
                const { icono, frase } = renglonDelCambio(cambio, {
                  antes: vista.base,
                  despues: vista.fila,
                  nombreDe: (tesoro) => tesoroDe(vista, tesoro).nombre,
                });
                return (
                  <RenglonDelCambio key={`${cambio.tipo}-${cambio.tesoro}`} icono={icono}>
                    {frase(NOMBRE_EN_LA_TINTA[tesoroDe(vista, cambio.tesoro).tinta])}
                  </RenglonDelCambio>
                );
              })}
            </ul>
          </section>

          <section
            aria-labelledby="la-comparacion"
            className="flex flex-col gap-2 rounded-field border border-hairline bg-surface-3 px-3.5 py-3"
          >
            <h3
              id="la-comparacion"
              className="flex items-center gap-1.5 text-label font-medium text-text-2"
            >
              {textos.conUnCobroDe(formatearPesos(cobro))}
              <Ayuda que={textos.deDondeSale}>{textos.comparacion(mes)}</Ayuda>
            </h3>
            {comparacion.length === 0 ? (
              <p className="text-label text-text-2">{textos.igualQueHoy}</p>
            ) : (
              <table className="w-full text-label tabular-nums">
                <thead>
                  <tr className="text-meta text-text-3">
                    <th scope="col" className="pb-1 text-left font-normal">
                      {textos.tesoro}
                    </th>
                    <th scope="col" className="pb-1 text-right font-normal">
                      {textos.hoy}
                    </th>
                    <th scope="col" className="pb-1 text-right font-normal">
                      {textos.conLosCambios}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparacion.map((renglon) => {
                    const tesoro = tesoroDe(vista, renglon.tesoro);
                    return (
                      <tr key={renglon.tesoro} className="border-t border-hairline">
                        <th scope="row" className="py-1.5 text-left font-normal">
                          <span translate="no" className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className={`size-2 flex-none rounded-pill ${TINTA[tesoro.tinta].fondo}`}
                            />
                            {tesoro.nombre}
                          </span>
                        </th>
                        <td translate="no" className="py-1.5 text-right text-text-2">
                          {formatearPesos(renglon.hoy)}
                        </td>
                        <td translate="no" className="py-1.5 text-right font-semibold">
                          {formatearPesos(renglon.conLosCambios)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {pagosSolos.length > 0 && (
            <ul className="flex flex-col gap-3">
              {pagosSolos.map((pago) => {
                const tesoro = tesoroDe(vista, pago.tesoro);
                return (
                  <LoQueSePagaSolo
                    key={pago.tesoro}
                    pago={pago}
                    tesoro={tesoro}
                    maun={tesoroDe(vista, vista.sistema.maun)}
                    otros={vista.tesoros.filter(
                      (otro) =>
                        !otro.archivado &&
                        vaEntreTesoros(otro) &&
                        otro.id !== pago.tesoro &&
                        otro.id !== vista.sistema.maun &&
                        otro.moneda === tesoro.moneda,
                    )}
                    hoy={vista.hoy}
                    elegido={elegidos[pago.tesoro]}
                    Nombre={NOMBRE_EN_LA_TINTA[tesoro.tinta]}
                    alElegir={(elegido) => {
                      setElegidos((previos) => ({ ...previos, [pago.tesoro]: elegido }));
                    }}
                  />
                );
              })}
            </ul>
          )}

          {enCero.map((paso) => {
            const tesoro = tesoroDe(vista, paso.tesoro);
            return (
              <p
                key={paso.tesoro}
                className="flex items-start gap-2.5 text-label leading-relaxed text-text-2"
              >
                <Icono nombre="triangle-alert" tamano={16} className="mt-0.5 flex-none" />
                <span>
                  {textos.quedaEnCero(
                    NOMBRE_EN_LA_TINTA[tesoro.tinta],
                    tesoro.nombre,
                    formatearPesos(0),
                  )}
                </span>
              </p>
            );
          })}

          <p className="flex items-start gap-2.5 text-label leading-relaxed text-text-2">
            <Icono nombre="info" tamano={16} className="mt-0.5 flex-none" />
            {textos.cuandoValen(mes)}
          </p>
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          {falta && (
            <p role="status" className="mb-2 text-label text-text-2">
              {textos.faltaElegir}
            </p>
          )}
          <FilaDeAcciones>
            <Button variant="secundario" onClick={alCerrar}>
              {textos.seguirEditando}
            </Button>
            <Button disabled={!sePuede} onClick={guardarLaFila}>
              {m.barra.guardarLaFila}
            </Button>
          </FilaDeAcciones>
        </footer>
      </div>
    </Hoja>
  );
}
