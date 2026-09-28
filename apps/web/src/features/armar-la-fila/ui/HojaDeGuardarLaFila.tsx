import { conDesde, type Money } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { pruebaDeUnCobro } from '@/entities/fila';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  formatearPesos,
  metaDeAvisos,
  nombreDelMes,
  TINTA,
  useAnchoDePantalla,
} from '@/shared/lib';
import { Ayuda, Button, FilaDeAcciones, Hoja, Icono, type NombreDeIcono } from '@/shared/ui';

import { MUTACION_DE_LA_FILA } from '../api/mutacion';
import { descartarElBorrador } from '../model/borrador';
import { comparacionDeLaFila } from '../model/comparacion';
import { COBRO_DE_EJEMPLO } from '../model/prueba';
import { cuantasCosas, renglonDelCambio } from '../model/textos';
import { loQueEstabaGuardado, tesoroDe, type VistaDeLaFila } from '../model/vista';

export interface HojaDeGuardarLaFilaProps {
  vista: VistaDeLaFila;
  monto: Money | null;
  alCerrar: () => void;
  alGuardar?: () => void;
}

function Nombre({ vista, tesoro }: { vista: VistaDeLaFila; tesoro: string }) {
  const datos = tesoroDe(vista, tesoro);
  return <span className={`font-semibold ${TINTA[datos.tinta].texto}`}>{datos.nombre}</span>;
}

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
  alCerrar,
  alGuardar,
}: HojaDeGuardarLaFilaProps) {
  const replica = useReplicaDelTaller();
  const [vista] = useState(laDeAhora);
  const enCelular = useAnchoDePantalla() === 'movil';
  const guardar = useMutation({ ...MUTACION_DE_LA_FILA, meta: metaDeAvisos('filaGuardada') });
  const borrador = vista.borrador;
  const cobro = monto !== null && monto > 0 ? monto : COBRO_DE_EJEMPLO;
  const mes = nombreDelMes(vista.mes).toLowerCase();

  const comparacion = (() => {
    if (borrador === null) return [];
    try {
      const probar = (fila: typeof borrador.fila) =>
        pruebaDeUnCobro(replica, fila, { monto: cobro, mesEnCero: false, hoy: vista.hoy });
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
  const sePuede = borrador !== null && vista.ajustesId !== null && vista.problemas.length === 0;

  function guardarLaFila(): void {
    if (borrador === null || vista.ajustesId === null || !sePuede) return;
    guardar.mutate({
      ajustesId: vista.ajustesId,
      version: borrador.version,
      fila: conDesde(borrador.base, borrador.fila, vista.mes),
      guardadaEn: new Date().toISOString(),
      previa: loQueEstabaGuardado(replica),
    });
    alGuardar?.();
    alCerrar();
    descartarElBorrador();
  }

  return (
    <Hoja
      titulo="Guardar la fila"
      bajada={`Pasa a ser la revisión ${String(vista.revision)}`}
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
                <RenglonDelCambio icono="calendar">
                  El sueldo pasa a contarse por mes: los cobros del mes lo van cubriendo hasta el
                  tope.
                </RenglonDelCambio>
              )}
              {vista.cambios.map((cambio) => {
                const { icono, despuesDelNombre } = renglonDelCambio(cambio);
                return (
                  <RenglonDelCambio key={`${cambio.tipo}-${cambio.tesoro}`} icono={icono}>
                    <Nombre vista={vista} tesoro={cambio.tesoro} />
                    {despuesDelNombre}
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
              Con un cobro de {formatearPesos(cobro)}
              <Ayuda que="De dónde sale la comparación">
                Es el mismo cobro repartido con la fila de hoy y con la que estás por guardar,
                teniendo en cuenta lo que ya entró en {mes}.
              </Ayuda>
            </h3>
            {comparacion.length === 0 ? (
              <p className="text-label text-text-2">Ese cobro se reparte igual que hoy.</p>
            ) : (
              <table className="w-full text-label tabular-nums">
                <thead>
                  <tr className="text-meta text-text-3">
                    <th scope="col" className="pb-1 text-left font-normal">
                      Tesoro
                    </th>
                    <th scope="col" className="pb-1 text-right font-normal">
                      Hoy
                    </th>
                    <th scope="col" className="pb-1 text-right font-normal">
                      Con los cambios
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparacion.map((renglon) => {
                    const tesoro = tesoroDe(vista, renglon.tesoro);
                    return (
                      <tr key={renglon.tesoro} className="border-t border-hairline">
                        <th scope="row" className="py-1.5 text-left font-normal">
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className={`size-2 flex-none rounded-pill ${TINTA[tesoro.tinta].fondo}`}
                            />
                            {tesoro.nombre}
                          </span>
                        </th>
                        <td className="py-1.5 text-right text-text-2">
                          {formatearPesos(renglon.hoy)}
                        </td>
                        <td className="py-1.5 text-right font-semibold">
                          {formatearPesos(renglon.conLosCambios)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {enCero.map((paso) => (
            <p
              key={paso.tesoro}
              className="flex items-start gap-2.5 text-label leading-relaxed text-text-2"
            >
              <Icono nombre="triangle-alert" tamano={16} className="mt-0.5 flex-none" />
              <span>
                <Nombre vista={vista} tesoro={paso.tesoro} /> queda con tope {formatearPesos(0)}: no
                recibe nada hasta que le pongas uno.
              </span>
            </p>
          ))}

          <p className="flex items-start gap-2.5 text-label leading-relaxed text-text-2">
            <Icono nombre="info" tamano={16} className="mt-0.5 flex-none" />
            Los cambios valen desde el próximo cobro. Los repartos que ya hiciste no cambian, y lo
            que ya entró en {mes} sigue contando para los topes.
          </p>
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            <Button variant="secundario" onClick={alCerrar}>
              Seguir editando
            </Button>
            <Button disabled={!sePuede} onClick={guardarLaFila}>
              Guardar la fila
            </Button>
          </FilaDeAcciones>
        </footer>
      </div>
    </Hoja>
  );
}
