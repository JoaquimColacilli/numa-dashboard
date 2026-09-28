import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';

import { MUTACION_DE_MOVIMIENTO } from '@/entities/movimiento';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  ChipDelTesoro,
  MUTACION_DE_ARCHIVO_DE_TESORO,
  tesoroPorId,
  tesorosDelTaller,
  type TesoroDelTaller,
} from '@/entities/tesoro';
import {
  formatearPesos,
  hoyEnElTaller,
  metaDeAvisos,
  useAnchoDePantalla,
  uuidv7,
} from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja } from '@/shared/ui';

import {
  destinosDelArchivo,
  porQueEnPalabras,
  porQueNoSeArchiva,
  QUE_HACER_PARA_ARCHIVAR,
  transferenciaDelArchivo,
} from '../model/archivo';

export interface HojaDeArchivarProps {
  tesoroId: string;
  alCerrar: () => void;
  alVolver?: () => void;
}

const PIE =
  'flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3';

function queda(destino: TesoroDelTaller, archivado: TesoroDelTaller): number {
  return destino.saldo + archivado.saldo;
}

export function HojaDeArchivar({ tesoroId, alCerrar, alVolver }: HojaDeArchivarProps) {
  const replica = useReplicaDelTaller();
  const tesoros = tesorosDelTaller(replica);
  const tesoro = tesoroPorId(tesoros, tesoroId);
  const destinos = tesoro ? destinosDelArchivo(tesoros, tesoro) : [];
  const [destinoId, setDestinoId] = useState(() => destinos[0]?.id ?? null);
  const id = useId();
  const enCelular = useAnchoDePantalla() === 'movil';

  const transferir = useMutation({
    ...MUTACION_DE_MOVIMIENTO,
    meta: metaDeAvisos('movimientoNuevo', { silencioso: true }),
  });
  const archivar = useMutation({
    ...MUTACION_DE_ARCHIVO_DE_TESORO,
    meta: metaDeAvisos('tesoroArchivado', { sujeto: tesoro?.nombre ?? '' }),
  });

  if (!tesoro) return null;

  const volver = alVolver ?? alCerrar;
  const bloqueo = porQueNoSeArchiva(replica, tesoro);
  const destino = destinos.find((uno) => uno.id === destinoId) ?? destinos[0];
  const conPlata = tesoro.saldo !== 0;
  const monto = formatearPesos(Math.abs(tesoro.saldo));

  function confirmar() {
    if (!tesoro || bloqueo !== null) return;
    if (conPlata) {
      if (!destino) return;
      const movimiento = transferenciaDelArchivo({
        id: uuidv7(),
        archivado: tesoro,
        destino,
        hoy: hoyEnElTaller(),
      });
      if (movimiento) transferir.mutate(movimiento);
    }
    archivar.mutate({ id: tesoro.id, archivadoEn: new Date().toISOString(), previo: null });
    alCerrar();
  }

  const etiqueta = !conPlata
    ? `Archivar ${tesoro.nombre}`
    : tesoro.saldo > 0
      ? `Pasar ${monto} a ${destino?.nombre ?? ''} y archivar`
      : `Pasar ${monto} desde ${destino?.nombre ?? ''} y archivar`;

  return (
    <Hoja
      titulo={`Archivar ${tesoro.nombre}`}
      bajada={`Tiene ${formatearPesos(tesoro.saldo)}`}
      antes={<ChipDelTesoro tesoro={tesoro} />}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
        {bloqueo !== null ? (
          <div className="flex flex-col gap-1.5 rounded-field border border-alerta px-3.5 py-3 text-label leading-relaxed">
            <p className="font-semibold">Todavía no se puede archivar {tesoro.nombre}.</p>
            <p>{porQueEnPalabras(tesoro.nombre, bloqueo)}</p>
            <p className="text-text-2">{QUE_HACER_PARA_ARCHIVAR}</p>
          </div>
        ) : (
          <>
            <p className="text-body leading-relaxed text-text-2">
              {!conPlata
                ? ''
                : tesoro.saldo > 0
                  ? 'Antes de archivarlo, ¿a dónde pasamos lo que tiene? '
                  : `Antes de archivarlo hay que dejarlo en cero: le faltan ${monto}. ¿De qué tesoro sale? `}
              {tesoro.nombre} deja de recibir plata y sigue apareciendo con su nombre en los
              repartos que ya hiciste.
            </p>
            {conPlata && (
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">
                  {tesoro.saldo > 0 ? 'A dónde pasa la plata' : 'De dónde sale la plata'}
                </legend>
                {destinos.map((candidato) => {
                  const elegido = candidato.id === destino?.id;
                  return (
                    <label
                      key={candidato.id}
                      className={`flex min-h-tap cursor-pointer items-center gap-3 rounded-field border px-3.5 py-2.5 ${
                        elegido ? 'border-ink ring-1 ring-ink' : 'border-border'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`${id}-destino`}
                        value={candidato.id}
                        checked={elegido}
                        onChange={() => {
                          setDestinoId(candidato.id);
                        }}
                        className="size-5 flex-none accent-ink"
                      />
                      <ChipDelTesoro tesoro={candidato} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body font-medium">
                          {candidato.nombre}
                        </span>
                        <span className="block text-meta text-text-3 tabular-nums">
                          {elegido
                            ? `queda en ${formatearPesos(queda(candidato, tesoro))}`
                            : `tiene ${formatearPesos(candidato.saldo)}`}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            )}
          </>
        )}
      </div>

      <footer className={PIE}>
        {bloqueo !== null ? (
          <FilaDeAcciones>
            <Button onClick={volver}>Entendido</Button>
          </FilaDeAcciones>
        ) : (
          <FilaDeAcciones>
            <Button variant="secundario" onClick={volver}>
              No archivar
            </Button>
            <Button onClick={confirmar} disabled={conPlata && destino === undefined}>
              {etiqueta}
            </Button>
          </FilaDeAcciones>
        )}
      </footer>
    </Hoja>
  );
}
