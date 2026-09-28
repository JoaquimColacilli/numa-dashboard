import type { Fila } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useRef, useState, type SyntheticEvent } from 'react';

import { useReplicaDelTaller } from '@/entities/replica';
import { MUTACION_DE_TESORO_NUEVO, tesoroPorId, tesorosDelTaller } from '@/entities/tesoro';
import { filaDelTaller, type TesoroNuevo } from '@/shared/api';
import { hayCambios, metaDeAvisos, uuidv7 } from '@/shared/lib';
import { Button, Campo, FilaDeAcciones, Hoja, MoneyInput } from '@/shared/ui';

import {
  fraseDelLibre,
  libreEnElReparto,
  opcionesDeLugar,
  porcentajeSugerido,
  revisarElLugar,
  type DondeVa,
  type ErroresDelLugar,
  type LugarDelTesoro,
} from '../model/lugar';
import {
  borradorNuevo,
  hayErrores,
  ordenAlFinal,
  revisarElTesoro,
  tesoroNuevo,
  type BorradorDelTesoro,
  type ErroresDelTesoro,
} from '../model/tesoro';
import { CamposDelTesoro } from './CamposDelTesoro';

export interface HojaDeTesoroNuevoProps {
  alCerrar: () => void;
  alCrear: (tesoro: TesoroNuevo, dondeVa: DondeVa) => void;
  fila?: Fila;
  lugarInicial?: LugarDelTesoro;
  despuesDe?: string | null;
}

export function HojaDeTesoroNuevo({
  alCerrar,
  alCrear,
  fila,
  lugarInicial = 'estante',
  despuesDe,
}: HojaDeTesoroNuevoProps) {
  const replica = useReplicaDelTaller();
  const tesoros = tesorosDelTaller(replica);
  const laFila = fila ?? filaDelTaller(replica).fila;
  const opciones = opcionesDeLugar(
    laFila,
    despuesDe,
    (id) => tesoroPorId(tesoros, id)?.nombre ?? 'el paso anterior',
  );
  const libre = libreEnElReparto(laFila);
  const id = useId();

  const [inicial] = useState(() => {
    const posible = opciones.find((opcion) => opcion.id === lugarInicial)?.sePuede ?? false;
    return {
      borrador: borradorNuevo(tesoros),
      lugar: posible ? lugarInicial : 'estante',
      tope: null as number | null,
      porcentaje: porcentajeSugerido(libre),
    };
  });
  const [borrador, setBorrador] = useState<BorradorDelTesoro>(inicial.borrador);
  const [lugar, setLugar] = useState<LugarDelTesoro>(inicial.lugar);
  const [tope, setTope] = useState<number | null>(inicial.tope);
  const [porcentaje, setPorcentaje] = useState(inicial.porcentaje);
  const [errores, setErrores] = useState<ErroresDelTesoro>({});
  const [erroresDelLugar, setErroresDelLugar] = useState<ErroresDelLugar>({});
  const campoDelNombre = useRef<HTMLInputElement>(null);

  const crear = useMutation({ ...MUTACION_DE_TESORO_NUEVO, meta: metaDeAvisos('tesoroNuevo') });

  function cambiar(cambios: Partial<BorradorDelTesoro>) {
    setBorrador((previo) => ({ ...previo, ...cambios }));
    if ('nombre' in cambios || 'descripcion' in cambios) setErrores({});
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = revisarElTesoro(borrador, { conRinde: false });
    const revisado = revisarElLugar(lugar, tope, porcentaje, laFila);
    setErrores(encontrados);
    setErroresDelLugar(revisado.errores ?? {});
    if (hayErrores(encontrados)) {
      campoDelNombre.current?.focus();
      return;
    }
    if (revisado.dondeVa === undefined) return;

    const nuevo = tesoroNuevo(borrador, uuidv7(), ordenAlFinal(tesoros));
    crear.mutate(nuevo);
    alCrear(nuevo, revisado.dondeVa);
    alCerrar();
  }

  return (
    <Hoja
      titulo="Nuevo tesoro"
      bajada="Un lugar más para la plata"
      alCerrar={alCerrar}
      conCambios={hayCambios(
        {
          ...inicial.borrador,
          lugar: inicial.lugar,
          tope: inicial.tope,
          porcentaje: inicial.porcentaje,
        },
        { ...borrador, lugar, tope, porcentaje },
      )}
    >
      <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="@container flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <CamposDelTesoro
            borrador={borrador}
            cambiar={cambiar}
            errores={errores}
            tesoros={tesoros}
            excepto={null}
            conMeta
            conRinde={false}
            campoDelNombre={campoDelNombre}
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-label text-text-2">Dónde va</legend>
            {opciones.map((opcion) => {
              const elegida = lugar === opcion.id;
              return (
                <div
                  key={opcion.id}
                  className={`rounded-field border ${
                    elegida ? 'border-ink ring-1 ring-ink' : 'border-border'
                  }`}
                >
                  <label
                    className={`flex min-h-tap items-center gap-3 px-3.5 py-2.5 ${
                      opcion.sePuede ? 'cursor-pointer' : 'text-text-3'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`${id}-lugar`}
                      value={opcion.id}
                      checked={elegida}
                      disabled={!opcion.sePuede}
                      onChange={() => {
                        setLugar(opcion.id);
                        setErroresDelLugar({});
                      }}
                      className="size-5 flex-none accent-ink"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-medium">{opcion.titulo}</span>
                      <span className="block text-label text-text-2">{opcion.detalle}</span>
                    </span>
                  </label>
                  {elegida && opcion.id === 'paso' && (
                    <div className="px-3.5 pb-3">
                      <MoneyInput
                        etiqueta="Tope por mes"
                        ayuda="Recibe hasta eso por mes. Lo que pasa de eso sigue al paso que viene."
                        value={tope}
                        error={erroresDelLugar.tope}
                        onChange={(monto) => {
                          setTope(monto);
                          setErroresDelLugar({});
                        }}
                      />
                    </div>
                  )}
                  {elegida && opcion.id === 'reparto' && (
                    <div className="px-3.5 pb-3">
                      <Campo
                        etiqueta="Porcentaje de lo que sobra (%)"
                        inputMode="decimal"
                        autoComplete="off"
                        value={porcentaje}
                        ayuda={fraseDelLibre(libre, porcentaje)}
                        error={erroresDelLugar.porcentaje}
                        onChange={(evento) => {
                          setPorcentaje(evento.target.value);
                          setErroresDelLugar({});
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </fieldset>
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            <Button type="submit">Crear el tesoro</Button>
          </FilaDeAcciones>
        </footer>
      </form>
    </Hoja>
  );
}
