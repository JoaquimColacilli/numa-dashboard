import { MONEDA_DEL_TALLER, type Moneda } from '@maun/domain';
import { useId, type ReactNode, type Ref } from 'react';

import { ChipDelTesoro, type TesoroDelTaller } from '@/entities/tesoro';
import { useMensajes } from '@/shared/idioma';
import { NOMBRE_DE_LA_TINTA, TINTA } from '@/shared/lib';
import { Campo, FondoDelElegido, Icono, MoneyInput } from '@/shared/ui';

import {
  iconosParaElegir,
  LARGO_MAXIMO_DE_LA_DESCRIPCION,
  LARGO_MAXIMO_DEL_NOMBRE,
  nombreDelIcono,
  quienUsaLaTinta,
  TINTAS_EN_LA_HOJA,
  type BorradorDelTesoro,
  type ErroresDelTesoro,
} from '../model/tesoro';

export interface CamposDelTesoroProps {
  borrador: BorradorDelTesoro;
  cambiar: (cambios: Partial<BorradorDelTesoro>) => void;
  errores: ErroresDelTesoro;
  tesoros: readonly TesoroDelTaller[];
  excepto: string | null;
  conMeta: boolean;
  conRinde: boolean;
  eligeLaMoneda?: boolean;
  campoDelNombre?: Ref<HTMLInputElement>;
  debajoDelNombre?: ReactNode;
}

const MONEDAS_PARA_ELEGIR: readonly Moneda[] = [MONEDA_DEL_TALLER, 'USD'];

function LaMoneda({
  moneda,
  eligeLaMoneda,
  alElegir,
}: {
  moneda: Moneda;
  eligeLaMoneda: boolean;
  alElegir: (moneda: Moneda) => void;
}) {
  const m = useMensajes();
  const textos = m.tesoros.moneda;
  if (!eligeLaMoneda) {
    return (
      <p data-moneda-del-tesoro className="text-label text-text-2">
        {moneda === MONEDA_DEL_TALLER ? textos.enPesos : textos.enDolares}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-label text-text-2">{textos.pregunta}</span>
      <div
        role="radiogroup"
        aria-label={textos.pregunta}
        className="relative grid grid-cols-2 gap-0.5 rounded-pill bg-ink/6 p-1"
      >
        <FondoDelElegido elegido={moneda} />
        {MONEDAS_PARA_ELEGIR.map((una) => (
          <button
            key={una}
            type="button"
            role="radio"
            aria-checked={moneda === una}
            data-opcion={una}
            onClick={() => {
              alElegir(una);
            }}
            className={`relative min-h-tap rounded-pill px-2 text-label ${
              moneda === una ? 'font-semibold text-ink' : 'font-medium text-text-2'
            }`}
          >
            {una === MONEDA_DEL_TALLER ? textos.pesos : textos.dolares}
          </button>
        ))}
      </div>
      <p className="text-meta leading-relaxed text-text-3">{textos.nota}</p>
    </div>
  );
}

export function CamposDelTesoro({
  borrador,
  cambiar,
  errores,
  tesoros,
  excepto,
  conMeta,
  conRinde,
  eligeLaMoneda = false,
  campoDelNombre,
  debajoDelNombre,
}: CamposDelTesoroProps) {
  const id = useId();
  const tinta = TINTA[borrador.tinta];
  const otro = quienUsaLaTinta(tesoros, borrador.tinta, excepto);
  const nombre = borrador.nombre.trim();
  const descripcion = borrador.descripcion.trim();

  return (
    <>
      <div
        aria-hidden
        className="flex items-center gap-3 rounded-field border border-hairline bg-surface-3 px-3.5 py-3"
      >
        <ChipDelTesoro tesoro={borrador} tamano="grande" />
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-body-lg leading-snug font-semibold ${
              nombre === '' ? 'text-text-3' : tinta.texto
            }`}
          >
            {nombre === '' ? 'Sin nombre' : nombre}
          </p>
          {descripcion !== '' && <p className="truncate text-label text-text-2">{descripcion}</p>}
        </div>
        <span className="flex-none text-meta text-text-3">Así se ve</span>
      </div>

      <Campo
        ref={campoDelNombre}
        etiqueta="Nombre"
        value={borrador.nombre}
        maxLength={LARGO_MAXIMO_DEL_NOMBRE}
        autoComplete="off"
        error={errores.nombre}
        onChange={(evento) => {
          cambiar({ nombre: evento.target.value });
        }}
      />
      {debajoDelNombre}
      <Campo
        etiqueta="Para qué es"
        value={borrador.descripcion}
        maxLength={LARGO_MAXIMO_DE_LA_DESCRIPCION}
        autoComplete="off"
        ayuda="Opcional"
        error={errores.descripcion}
        onChange={(evento) => {
          cambiar({ descripcion: evento.target.value });
        }}
      />

      <LaMoneda
        moneda={borrador.moneda}
        eligeLaMoneda={eligeLaMoneda}
        alElegir={(moneda) => {
          cambiar({ moneda });
        }}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-label text-text-2">Color</legend>
        <div className="grid grid-cols-8 @md:grid-cols-4 @md:gap-2">
          {TINTAS_EN_LA_HOJA.map((opcion) => {
            const elegida = borrador.tinta === opcion;
            return (
              <label
                key={opcion}
                className={`relative flex min-h-tap cursor-pointer items-center justify-center rounded-pill has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink @md:justify-start @md:gap-2 @md:rounded-field @md:border @md:px-2.5 ${
                  elegida
                    ? 'font-semibold @md:border-ink @md:ring-1 @md:ring-ink'
                    : 'font-medium @md:border-border'
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-tinta`}
                  value={opcion}
                  checked={elegida}
                  onChange={() => {
                    cambiar({ tinta: opcion });
                  }}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={`flex aspect-square w-full max-w-10 items-center justify-center rounded-pill border @md:contents ${
                    elegida ? 'border-ink ring-1 ring-ink' : 'border-border'
                  }`}
                >
                  <span
                    className={`size-6 flex-none rounded-pill @md:size-4 ${TINTA[opcion].fondo}`}
                  />
                </span>
                <span className="sr-only text-label @md:not-sr-only @md:truncate">
                  {NOMBRE_DE_LA_TINTA[opcion]}
                </span>
              </label>
            );
          })}
        </div>
        <p className="text-meta leading-relaxed text-text-3">
          <span className="font-medium text-text-2">{NOMBRE_DE_LA_TINTA[borrador.tinta]}.</span>
          {otro !== undefined &&
            ` También la usa ${otro.nombre}: se distinguen por el nombre y el ícono.`}
        </p>
      </fieldset>

      <fieldset className="flex flex-col">
        <legend className="mb-1.5 text-label text-text-2">Ícono</legend>
        <div className="grid grid-cols-4 gap-1.5 @[20rem]:grid-cols-8 @[20rem]:gap-1 @md:gap-1.5">
          {iconosParaElegir(borrador.icono).map((opcion) => {
            const elegido = borrador.icono === opcion;
            return (
              <label
                key={opcion}
                className={`flex min-h-tap cursor-pointer items-center justify-center rounded-field border has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink @md:aspect-square ${
                  elegido
                    ? `border-ink ring-1 ring-ink ${tinta.tinte} ${tinta.texto}`
                    : 'border-border text-ink'
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-icono`}
                  value={opcion}
                  checked={elegido}
                  aria-label={nombreDelIcono(opcion)}
                  onChange={() => {
                    cambiar({ icono: opcion });
                  }}
                  className="sr-only"
                />
                <Icono nombre={opcion} tamano={18} />
              </label>
            );
          })}
        </div>
      </fieldset>

      {conMeta && (
        <MoneyInput
          etiqueta="Meta"
          ayuda="Opcional. Si la ponés, Inicio te muestra cuánto falta."
          moneda={borrador.moneda}
          conMarcador={borrador.moneda !== MONEDA_DEL_TALLER}
          value={borrador.meta}
          onChange={(meta) => {
            cambiar({ meta });
          }}
        />
      )}

      {conRinde && (
        <Campo
          etiqueta="Rinde por año (%)"
          inputMode="decimal"
          ayuda="Solo sirve para proyectar. Si no lo sabés, dejalo en 0."
          value={borrador.rinde}
          error={errores.rinde}
          onChange={(evento) => {
            cambiar({ rinde: evento.target.value });
          }}
        />
      )}
    </>
  );
}
