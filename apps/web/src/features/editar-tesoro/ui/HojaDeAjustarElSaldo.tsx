import { MOTIVOS_DEL_AJUSTE, plata } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState, type SyntheticEvent } from 'react';

import { categoriaEnPantalla, MUTACION_DE_MOVIMIENTO } from '@/entities/movimiento';
import { ChipDelTesoro, type TesoroDelTaller } from '@/entities/tesoro';
import { useMensajes } from '@/shared/idioma';
import {
  formatearLaPlata,
  hoyEnElTaller,
  metaDeAvisos,
  useAnchoDePantalla,
  uuidv7,
} from '@/shared/lib';
import { Button, Campo, FilaDeAcciones, Hoja, MoneyInput } from '@/shared/ui';

import {
  diferenciaDelAjuste,
  movimientoDelAjuste,
  SIN_MOTIVO,
  type MotivoDelAjuste,
} from '../model/ajuste';

export interface HojaDeAjustarElSaldoProps {
  tesoro: TesoroDelTaller;
  alCerrar: () => void;
  alVolver?: () => void;
}

const PIE =
  'flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3';

export function HojaDeAjustarElSaldo({ tesoro, alCerrar, alVolver }: HojaDeAjustarElSaldoProps) {
  const textos = useMensajes().editarTesoro.ajustar;
  const hoy = hoyEnElTaller();
  const enCelular = useAnchoDePantalla() === 'movil';
  const moneda = tesoro.saldo.moneda;
  const saldo = tesoro.saldo.importe;
  const [tieneAhora, setTieneAhora] = useState<number | null>(saldo >= 0 ? saldo : null);
  const [motivo, setMotivo] = useState<MotivoDelAjuste>(SIN_MOTIVO);
  const [fecha, setFecha] = useState(hoy);
  const ajustar = useMutation({
    ...MUTACION_DE_MOVIMIENTO,
    meta: metaDeAvisos('saldoAjustado', { sujeto: tesoro.nombre }),
  });

  const ajuste = diferenciaDelAjuste(
    saldo,
    tieneAhora === null ? null : plata(moneda, tieneAhora).importe,
  );
  const enVivo =
    ajuste === null
      ? textos.quedaIgual
      : ajuste.sentido === 'suma'
        ? textos.seSuman(formatearLaPlata(plata(moneda, ajuste.monto)))
        : textos.seRestan(formatearLaPlata(plata(moneda, ajuste.monto)));
  const fechaValida = fecha !== '' && fecha <= hoy;

  function enviar(evento: SyntheticEvent<HTMLFormElement>): void {
    evento.preventDefault();
    if (ajuste === null || !fechaValida) return;
    ajustar.mutate(movimientoDelAjuste({ id: uuidv7(), tesoro: tesoro.id, ajuste, motivo, fecha }));
    alCerrar();
  }

  return (
    <Hoja
      titulo={textos.titulo(tesoro.nombre)}
      bajada={textos.bajada}
      antes={<ChipDelTesoro tesoro={tesoro} />}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
    >
      <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-1.5">
            <MoneyInput
              etiqueta={textos.tieneAhora}
              moneda={moneda}
              value={tieneAhora}
              onChange={setTieneAhora}
            />
            <p
              role="status"
              translate="no"
              className={`text-label font-medium tabular-nums ${ajuste === null ? 'text-text-3' : 'text-ink'}`}
            >
              {enVivo}
            </p>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-label text-text-2">{textos.porQue}</legend>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS_DEL_AJUSTE.map((uno) => {
                const elegido = motivo.de === 'lista' && motivo.motivo === uno;
                return (
                  <button
                    key={uno}
                    type="button"
                    aria-pressed={elegido}
                    onClick={() => {
                      setMotivo(elegido ? SIN_MOTIVO : { de: 'lista', motivo: uno });
                    }}
                    className={`min-h-tap rounded-pill border px-4 text-label font-medium ${
                      elegido
                        ? 'border-ink bg-ink text-paper'
                        : 'border-border text-ink hover:bg-surface'
                    }`}
                  >
                    {categoriaEnPantalla(uno)}
                  </button>
                );
              })}
            </div>
            <Campo
              etiqueta={textos.oEscribilo}
              maxLength={60}
              value={motivo.de === 'libre' ? motivo.texto : ''}
              onChange={(evento) => {
                setMotivo({ de: 'libre', texto: evento.target.value });
              }}
            />
          </fieldset>

          <Campo
            etiqueta={textos.fecha}
            type="date"
            max={hoy}
            value={fecha}
            onChange={(evento) => {
              setFecha(evento.target.value);
            }}
            error={fechaValida ? undefined : textos.fechaQueNoPaso}
          />
        </div>

        <footer className={PIE}>
          <FilaDeAcciones>
            <Button type="button" variant="secundario" onClick={alVolver ?? alCerrar}>
              {textos.volver}
            </Button>
            <Button type="submit" disabled={ajuste === null || !fechaValida}>
              {textos.ajustar}
            </Button>
          </FilaDeAcciones>
        </footer>
      </form>
    </Hoja>
  );
}
