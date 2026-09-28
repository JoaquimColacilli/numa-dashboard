import type { BaseDeLaObligacion, Fila } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useId, useRef, useState, type SyntheticEvent } from 'react';

import { AyudaDeLaBase, ETIQUETA_DE_LA_BASE } from '@/entities/fila';
import { useReplicaDelTaller } from '@/entities/replica';
import { MUTACION_DE_TESORO_NUEVO, tesoroPorId, tesorosDelTaller } from '@/entities/tesoro';
import { filaDelTaller, type TesoroNuevo } from '@/shared/api';
import { hayCambios, metaDeAvisos, uuidv7 } from '@/shared/lib';
import {
  Button,
  Campo,
  FilaDeAcciones,
  FondoDelElegido,
  Hoja,
  Interruptor,
  MoneyInput,
} from '@/shared/ui';

import {
  dondeEntra,
  fraseDelLibre,
  libreEnElReparto,
  opcionesDeLugar,
  porcentajeSugerido,
  revisarElLugar,
  SUGERENCIAS_DEL_LUGAR,
  type DondeVa,
  type ErroresDelLugar,
  type LugarDelTesoro,
  type SugerenciaDeNombre,
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
  alCrear: (tesoro: TesoroNuevo, dondeVa: DondeVa, despuesDe: string | null | undefined) => void;
  fila?: Fila;
  lugarInicial?: LugarDelTesoro;
  despuesDe?: string | null;
}

const BASES: readonly BaseDeLaObligacion[] = ['cobrado', 'ingreso'];
const BASE_INICIAL: BaseDeLaObligacion = 'ingreso';

function SobreQueSeCalcula({
  base,
  alElegir,
}: {
  base: BaseDeLaObligacion;
  alElegir: (base: BaseDeLaObligacion) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-label text-text-2">
        Sobre qué se calcula
        <AyudaDeLaBase />
      </span>
      <div
        role="radiogroup"
        aria-label="Sobre qué se calcula"
        className="relative grid grid-cols-2 gap-0.5 rounded-pill bg-ink/6 p-1"
      >
        <FondoDelElegido elegido={base} />
        {BASES.map((una) => (
          <button
            key={una}
            type="button"
            role="radio"
            aria-checked={base === una}
            data-opcion={una}
            onClick={() => {
              alElegir(una);
            }}
            className={`relative min-h-tap rounded-pill px-2 text-label ${
              base === una ? 'font-semibold text-ink' : 'font-medium text-text-2'
            }`}
          >
            {ETIQUETA_DE_LA_BASE[una]}
          </button>
        ))}
      </div>
    </div>
  );
}

function Sugerencias({
  sugerencias,
  nombre,
  alElegir,
}: {
  sugerencias: readonly SugerenciaDeNombre[];
  nombre: string;
  alElegir: (sugerencia: SugerenciaDeNombre) => void;
}) {
  if (sugerencias.length === 0) return null;
  return (
    <div role="group" aria-label="Nombres sugeridos" className="-mt-1 flex flex-wrap gap-1.5">
      {sugerencias.map((sugerencia) => {
        const elegida = nombre.trim() === sugerencia.nombre;
        return (
          <button
            key={sugerencia.nombre}
            type="button"
            aria-pressed={elegida}
            onClick={() => {
              alElegir(sugerencia);
            }}
            className={`apretable min-h-9 rounded-pill border px-3 text-label ${
              elegida
                ? 'border-ink bg-ink font-semibold text-paper'
                : 'border-hairline bg-paper font-medium text-ink hover:bg-ink/5'
            }`}
          >
            {sugerencia.nombre}
          </button>
        );
      })}
    </div>
  );
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
  const nombreDe = (id: string) => tesoroPorId(tesoros, id)?.nombre ?? 'el anterior';
  const opciones = opcionesDeLugar(laFila, nombreDe(laFila.superavit));
  const libre = libreEnElReparto(laFila);
  const id = useId();

  const [inicial] = useState(() => {
    const posible = opciones.find((opcion) => opcion.id === lugarInicial)?.sePuede ?? false;
    return {
      borrador: borradorNuevo(tesoros),
      lugar: posible ? lugarInicial : 'estante',
      monto: null as number | null,
      porcentaje: '',
      porcentajeDelReparto: porcentajeSugerido(libre),
      base: BASE_INICIAL,
      antesDelDiezmo: false,
    };
  });
  const [borrador, setBorrador] = useState<BorradorDelTesoro>(inicial.borrador);
  const [lugar, setLugar] = useState<LugarDelTesoro>(inicial.lugar);
  const [monto, setMonto] = useState<number | null>(inicial.monto);
  const [porcentaje, setPorcentaje] = useState(inicial.porcentaje);
  const [porcentajeDelReparto, setPorcentajeDelReparto] = useState(inicial.porcentajeDelReparto);
  const [base, setBase] = useState<BaseDeLaObligacion>(inicial.base);
  const [antesDelDiezmo, setAntesDelDiezmo] = useState(inicial.antesDelDiezmo);
  const [errores, setErrores] = useState<ErroresDelTesoro>({});
  const [erroresDelLugar, setErroresDelLugar] = useState<ErroresDelLugar>({});
  const campoDelNombre = useRef<HTMLInputElement>(null);

  const crear = useMutation({ ...MUTACION_DE_TESORO_NUEVO, meta: metaDeAvisos('tesoroNuevo') });
  const despuesDelElegido = lugar === inicial.lugar ? despuesDe : undefined;

  function cambiar(cambios: Partial<BorradorDelTesoro>) {
    setBorrador((previo) => ({ ...previo, ...cambios }));
    if ('nombre' in cambios || 'descripcion' in cambios) setErrores({});
  }

  function sugerir(sugerencia: SugerenciaDeNombre) {
    cambiar({ nombre: sugerencia.nombre, icono: sugerencia.icono });
    if (sugerencia.base !== undefined) setBase(sugerencia.base);
    if (sugerencia.antesDelDiezmo !== undefined) setAntesDelDiezmo(sugerencia.antesDelDiezmo);
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = revisarElTesoro(borrador, { conRinde: false });
    const revisado = revisarElLugar(
      lugar,
      {
        monto,
        porcentaje: lugar === 'reparto' ? porcentajeDelReparto : porcentaje,
        base,
        antesDelDiezmo,
      },
      laFila,
    );
    setErrores(encontrados);
    setErroresDelLugar(revisado.errores ?? {});
    if (hayErrores(encontrados)) {
      campoDelNombre.current?.focus();
      return;
    }
    if (revisado.dondeVa === undefined) return;

    const nuevo = tesoroNuevo(borrador, uuidv7(), ordenAlFinal(tesoros));
    crear.mutate(nuevo);
    alCrear(nuevo, revisado.dondeVa, despuesDelElegido);
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
          monto: inicial.monto,
          porcentaje: inicial.porcentaje,
          porcentajeDelReparto: inicial.porcentajeDelReparto,
          base: inicial.base,
          antesDelDiezmo: inicial.antesDelDiezmo,
        },
        { ...borrador, lugar, monto, porcentaje, porcentajeDelReparto, base, antesDelDiezmo },
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
            debajoDelNombre={
              <Sugerencias
                sugerencias={SUGERENCIAS_DEL_LUGAR[lugar]}
                nombre={borrador.nombre}
                alElegir={sugerir}
              />
            }
          />

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-label text-text-2">Dónde va</legend>
            {opciones.map((opcion) => {
              const elegida = lugar === opcion.id;
              const donde = elegida ? dondeEntra(opcion.id, despuesDelElegido, nombreDe) : null;
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
                  {elegida && opcion.id === 'obligacion' && (
                    <div className="flex flex-col gap-3 px-3.5 pb-3">
                      <Campo
                        etiqueta="Porcentaje (%)"
                        inputMode="decimal"
                        autoComplete="off"
                        value={porcentaje}
                        error={erroresDelLugar.porcentaje}
                        onChange={(evento) => {
                          setPorcentaje(evento.target.value);
                          setErroresDelLugar({});
                        }}
                      />
                      <SobreQueSeCalcula base={base} alElegir={setBase} />
                      <Interruptor
                        activo={antesDelDiezmo}
                        alCambiar={setAntesDelDiezmo}
                        className="min-h-tap rounded-pill text-body"
                      >
                        Antes del diezmo
                      </Interruptor>
                    </div>
                  )}
                  {elegida && (opcion.id === 'compromiso' || opcion.id === 'ahorro-fijo') && (
                    <div className="px-3.5 pb-3">
                      <MoneyInput
                        etiqueta="Monto"
                        ayuda={
                          opcion.id === 'compromiso'
                            ? 'Junta hasta eso y se renueva al pagar: cuando registrás el pago, vuelve a juntar.'
                            : 'Recibe hasta eso por mes. Lo que pasa de eso sigue abajo.'
                        }
                        value={monto}
                        error={erroresDelLugar.monto}
                        onChange={(nuevo) => {
                          setMonto(nuevo);
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
                        value={porcentajeDelReparto}
                        ayuda={fraseDelLibre(
                          libre,
                          porcentajeDelReparto,
                          nombreDe(laFila.superavit),
                        )}
                        error={erroresDelLugar.porcentaje}
                        onChange={(evento) => {
                          setPorcentajeDelReparto(evento.target.value);
                          setErroresDelLugar({});
                        }}
                      />
                    </div>
                  )}
                  {donde !== null && !(opcion.id === 'obligacion' && antesDelDiezmo) && (
                    <p className="px-3.5 pb-3 text-meta text-text-3">{donde}</p>
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
