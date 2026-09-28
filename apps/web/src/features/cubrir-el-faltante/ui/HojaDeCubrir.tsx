import { useMutation } from '@tanstack/react-query';
import { useId, useState, type SyntheticEvent } from 'react';

import { MUTACION_DE_MOVIMIENTO } from '@/entities/movimiento';
import { useReplicaDelTaller } from '@/entities/replica';
import { ChipDelTesoro, tesoroPorId, tesorosDelTaller } from '@/entities/tesoro';
import { filaDelTaller } from '@/shared/api';
import { formatearPesos, hoyEnElTaller, metaDeAvisos, uuidv7 } from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja, Icono, MoneyInput } from '@/shared/ui';

import {
  candidatosParaCubrir,
  fuentesIniciales,
  mesEnPalabras,
  movimientosParaCubrir,
  notaDelCandidato,
  revisarLaCobertura,
  type Fuente,
} from '../model/cubrir';

export interface HojaDeCubrirProps {
  tesoroDelPaso: string;
  mes: string;
  faltante: number;
  alCerrar: () => void;
}

function mismasFuentes(una: readonly Fuente[], otra: readonly Fuente[]): boolean {
  return (
    una.length === otra.length &&
    una.every((fuente, indice) => {
      const par = otra[indice];
      return par !== undefined && par.id === fuente.id && par.monto === fuente.monto;
    })
  );
}

export function HojaDeCubrir({ tesoroDelPaso, mes, faltante, alCerrar }: HojaDeCubrirProps) {
  const replica = useReplicaDelTaller();
  const tesoros = tesorosDelTaller(replica);
  const paso = tesoroPorId(tesoros, tesoroDelPaso);
  const candidatos = candidatosParaCubrir(tesoros, tesoroDelPaso);
  const [iniciales] = useState(() => fuentesIniciales(candidatos, faltante));
  const [fuentes, setFuentes] = useState<Fuente[]>(iniciales);
  const id = useId();

  const pasar = useMutation({
    ...MUTACION_DE_MOVIMIENTO,
    meta: metaDeAvisos('faltanteCubierto'),
  });
  const pasarEnSilencio = useMutation({
    ...MUTACION_DE_MOVIMIENTO,
    meta: metaDeAvisos('faltanteCubierto', { silencioso: true }),
  });

  if (!paso) return null;

  const enPalabras = mesEnPalabras(mes);
  const seRenueva = filaDelTaller(replica).fila.pasos.some(
    (unPaso) => unPaso.tesoro === tesoroDelPaso && unPaso.modo === 'saldo',
  );
  const revision = revisarLaCobertura(fuentes, candidatos, faltante);

  function elegir(tesoroId: string, elegido: boolean) {
    setFuentes((previas) =>
      elegido
        ? [...previas, { id: tesoroId, monto: null }]
        : previas.filter((fuente) => fuente.id !== tesoroId),
    );
  }

  function cambiarMonto(tesoroId: string, monto: number | null) {
    setFuentes((previas) =>
      previas.map((fuente) => (fuente.id === tesoroId ? { ...fuente, monto } : fuente)),
    );
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!paso || !revision.sePuede) return;
    const movimientos = movimientosParaCubrir({
      fuentes,
      candidatos,
      paso,
      mes,
      hoy: hoyEnElTaller(),
      nuevoId: uuidv7,
    });
    movimientos.forEach((movimiento, indice) => {
      if (indice === movimientos.length - 1) pasar.mutate(movimiento);
      else pasarEnSilencio.mutate(movimiento);
    });
    alCerrar();
  }

  return (
    <Hoja
      titulo="Cubrir los gastos fijos"
      bajada={
        seRenueva
          ? `Faltan ${formatearPesos(faltante)} para completar su monto`
          : `Faltan ${formatearPesos(faltante)} en ${enPalabras}`
      }
      antes={<ChipDelTesoro tesoro={paso} />}
      alCerrar={alCerrar}
      conCambios={!mismasFuentes(iniciales, fuentes)}
    >
      <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <p className="text-body leading-relaxed text-text-2">
            {seRenueva
              ? 'Elegí de qué tesoro sale lo que falta. Lo que pases queda en el tesoro: el próximo cobro solo junta lo que siga faltando.'
              : `Elegí de qué tesoro sale lo que falta. Lo que pases cuenta para el tope de ${enPalabras}: el próximo cobro no lo vuelve a llenar.`}
          </p>

          <ul aria-label="De qué tesoro sale" className="flex flex-col gap-2">
            {candidatos.map((candidato) => {
              const fuente = fuentes.find((una) => una.id === candidato.id);
              const elegido = fuente !== undefined;
              const nota = notaDelCandidato(candidato);
              const noAlcanza = revision.sinSaldo.has(candidato.id);
              const sinPlata = candidato.saldo <= 0;
              const idDelDetalle = `${id}-${candidato.id}`;
              return (
                <li
                  key={candidato.id}
                  className={`@container rounded-field border px-3.5 py-2.5 ${
                    elegido ? 'border-ink ring-1 ring-ink' : 'border-border'
                  }`}
                >
                  <div className="grid grid-cols-1 items-center gap-2 @[20rem]:grid-cols-[minmax(0,1fr)_8rem] @[20rem]:gap-3">
                    <label
                      className={`flex min-h-tap min-w-0 items-center gap-3 ${
                        sinPlata && !elegido ? 'text-text-3' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={elegido}
                        disabled={sinPlata && !elegido}
                        onChange={(evento) => {
                          elegir(candidato.id, evento.target.checked);
                        }}
                        className="size-5 flex-none accent-ink"
                      />
                      <ChipDelTesoro tesoro={candidato} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-medium">
                          {candidato.nombre}
                        </span>
                        <span className="block text-meta text-text-3 tabular-nums">
                          tiene {formatearPesos(candidato.saldo)}
                        </span>
                      </span>
                    </label>
                    {elegido && (
                      <MoneyInput
                        aria-label={`Cuánto sale de ${candidato.nombre}`}
                        aria-describedby={idDelDetalle}
                        aria-invalid={noAlcanza ? true : undefined}
                        value={fuente.monto}
                        placeholder="0"
                        onChange={(monto) => {
                          cambiarMonto(candidato.id, monto);
                        }}
                        className={`min-h-tap w-full min-w-0 rounded-field border bg-paper px-3 text-right text-body ${
                          noAlcanza ? 'border-alerta' : 'border-border'
                        }`}
                      />
                    )}
                  </div>
                  {elegido && (
                    <p
                      id={idDelDetalle}
                      className={`mt-1 pl-18 text-meta tabular-nums ${
                        noAlcanza ? 'font-medium text-alerta' : 'text-text-2'
                      }`}
                    >
                      {noAlcanza
                        ? `No alcanza: ${candidato.nombre} tiene ${formatearPesos(candidato.saldo)}.`
                        : `${candidato.nombre} queda en ${formatearPesos(candidato.saldo - (fuente.monto ?? 0))}`}
                    </p>
                  )}
                  {nota !== null && <p className="mt-1 pl-18 text-meta text-text-3">{nota}</p>}
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-1 border-t border-ink pt-2">
            <p className="flex items-baseline justify-between gap-3 text-body">
              <span className="text-label text-text-2">Cubrís</span>
              <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                {formatearPesos(revision.cubierto)} de {formatearPesos(faltante)}
                {revision.completo && <Icono nombre="check" tamano={16} grosor={2.25} />}
              </span>
            </p>
            {revision.deMas > 0 && (
              <p role="alert" className="text-label font-medium text-alerta">
                Te pasás por {formatearPesos(revision.deMas)}: faltan {formatearPesos(faltante)}.
              </p>
            )}
          </div>
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            <Button type="submit" disabled={!revision.sePuede}>
              Pasar {formatearPesos(revision.cubierto)} a {paso.nombre}
            </Button>
          </FilaDeAcciones>
        </footer>
      </form>
    </Hoja>
  );
}
