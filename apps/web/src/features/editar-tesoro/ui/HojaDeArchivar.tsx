import { plata } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useState } from 'react';

import {
  MUTACION_DE_MOVIMIENTO,
  rutaParaComprarDolaresPara,
  rutaParaVenderDolares,
} from '@/entities/movimiento';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  ChipDelTesoro,
  MUTACION_DE_ARCHIVO_DE_TESORO,
  tesoroPorId,
  tesorosDelTaller,
} from '@/entities/tesoro';
import { useMensajes } from '@/shared/idioma';
import {
  formatearLaPlata,
  hoyEnElTaller,
  metaDeAvisos,
  useAnchoDePantalla,
  uuidv7,
} from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja } from '@/shared/ui';

import {
  cambioParaArchivar,
  comoQuedaElDestino,
  destinosDelArchivo,
  porQueEnPalabras,
  porQueNoSeArchiva,
  transferenciaDelArchivo,
} from '../model/archivo';

export interface HojaDeArchivarProps {
  tesoroId: string;
  alCerrar: () => void;
  alVolver?: () => void;
  alCambiarDolares?: (ruta: string) => void;
}

const PIE =
  'flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3';

export function HojaDeArchivar({
  tesoroId,
  alCerrar,
  alVolver,
  alCambiarDolares,
}: HojaDeArchivarProps) {
  const m = useMensajes();
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
  const cambio = bloqueo === null ? cambioParaArchivar(tesoro, destinos) : null;
  const destino = destinos.find((uno) => uno.id === destinoId) ?? destinos[0];
  const conPlata = tesoro.saldo.importe !== 0;
  const monto = formatearLaPlata(plata(tesoro.saldo.moneda, Math.abs(tesoro.saldo.importe)));

  function confirmar() {
    if (!tesoro || bloqueo !== null || cambio !== null) return;
    if (conPlata) {
      if (!destino) return;
      const movimiento = transferenciaDelArchivo({
        id: uuidv7(),
        archivado: tesoro,
        destino,
        hoy: hoyEnElTaller(),
      });
      if (!movimiento) return;
      transferir.mutate(movimiento);
    }
    archivar.mutate({ id: tesoro.id, archivadoEn: new Date().toISOString(), previo: null });
    alCerrar();
  }

  function irAlCambio() {
    if (!tesoro || cambio === null || alCambiarDolares === undefined) return;
    alCambiarDolares(
      cambio === 'vender' ? rutaParaVenderDolares(tesoro) : rutaParaComprarDolaresPara(tesoro),
    );
    alCerrar();
  }

  const textos = m.editarTesoro.archivar;
  const etiqueta = !conPlata
    ? textos.archivar(tesoro.nombre)
    : tesoro.saldo.importe > 0
      ? textos.pasarA(monto, destino?.nombre ?? '')
      : textos.pasarDesde(monto, destino?.nombre ?? '');

  return (
    <Hoja
      titulo={textos.titulo(tesoro.nombre)}
      bajada={textos.tiene(formatearLaPlata(tesoro.saldo))}
      antes={<ChipDelTesoro tesoro={tesoro} />}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
        {bloqueo !== null ? (
          <div className="flex flex-col gap-1.5 rounded-field border border-alerta px-3.5 py-3 text-label leading-relaxed">
            <p className="font-semibold">{textos.todaviaNo(tesoro.nombre)}</p>
            <p>{porQueEnPalabras(tesoro.nombre, bloqueo)}</p>
            <p className="text-text-2">{textos.queHacer}</p>
          </div>
        ) : cambio !== null ? (
          <div
            data-archivo-sin-destino
            className="flex flex-col gap-1.5 rounded-field border border-alerta px-3.5 py-3 text-label leading-relaxed"
          >
            <p className="font-semibold">{textos.todaviaNo(tesoro.nombre)}</p>
            <p>{cambio === 'vender' ? textos.conDolaresSinDestino : textos.debeDolaresSinOrigen}</p>
          </div>
        ) : (
          <>
            <p className="text-body leading-relaxed text-text-2">
              {!conPlata
                ? textos.sinPlata(tesoro.nombre)
                : tesoro.saldo.importe > 0
                  ? textos.conPlata(tesoro.nombre)
                  : textos.debe(monto, tesoro.nombre)}
            </p>
            {conPlata && (
              <fieldset className="flex flex-col gap-2">
                <legend className="sr-only">
                  {tesoro.saldo.importe > 0 ? textos.aDondePasa : textos.deDondeSale}
                </legend>
                {destinos.map((candidato) => {
                  const elegido = candidato.id === destino?.id;
                  const queda = comoQuedaElDestino(candidato, tesoro);
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
                        <span translate="no" className="block truncate text-body font-medium">
                          {candidato.nombre}
                        </span>
                        <span className="block text-meta text-text-3 tabular-nums">
                          {elegido && queda !== null
                            ? textos.quedaEn(formatearLaPlata(queda))
                            : textos.tieneEnLaLista(formatearLaPlata(candidato.saldo))}
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
            <Button onClick={volver}>{textos.entendido}</Button>
          </FilaDeAcciones>
        ) : cambio !== null ? (
          <FilaDeAcciones>
            <Button variant="secundario" onClick={volver}>
              {textos.noArchivar}
            </Button>
            {alCambiarDolares !== undefined && (
              <Button onClick={irAlCambio}>
                {cambio === 'vender' ? m.movimiento.venderDolares : m.movimiento.comprarDolares}
              </Button>
            )}
          </FilaDeAcciones>
        ) : (
          <FilaDeAcciones>
            <Button variant="secundario" onClick={volver}>
              {textos.noArchivar}
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
