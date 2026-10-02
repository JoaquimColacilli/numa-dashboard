import { CERO, centavos, type SaldosPorTesoro } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';

import {
  ayudaDelMovimiento,
  categoriasDeLaClase,
  CLASE,
  claseDe,
  clasesDelGrupo,
  gastaDesdeElTesoro,
  GRUPOS,
  ladosDeLaFila,
  ladosDelMovimiento,
  MUTACION_DE_BAJA_DE_MOVIMIENTO,
  MUTACION_DE_EDICION_DE_MOVIMIENTO,
  MUTACION_DE_MOVIMIENTO,
  vaEntreTesoros,
  type ClaseDeMovimiento,
  type GrupoDeMovimiento,
  type LadoDelMovimiento,
  type LadosDelMovimiento,
} from '@/entities/movimiento';
import { tesoroDeLaClave, tesoroPorId, type TesoroDelTaller } from '@/entities/tesoro';
import {
  mensajeDeSincronizacion,
  type CambiosDeMovimiento,
  type FilaDe,
  type Tesoro,
} from '@/shared/api';
import {
  formatearPesos,
  hayCambios,
  hoyLocal,
  metaDeAvisos,
  nombreDelMes,
  TESORO,
  TINTA,
  useEstadoSync,
  uuidv7,
} from '@/shared/lib';
import { AdornoDePlata, Button, Campo, FilaDeAcciones, Hoja, Icono, MoneyInput } from '@/shared/ui';

const UN_DIA_MS = 86_400_000;

const FALTAN_LOS_LADOS = 'Elegí de qué tesoro sale la plata y a cuál entra.';

const FALTA_EL_TESORO = 'Elegí de qué tesoro sale la plata.';

const LUGAR_DEL_GRUPO: Readonly<Record<GrupoDeMovimiento, string>> = {
  ingreso: 'col-span-2 @min-[30rem]:col-span-1',
  gasto: 'col-span-2 @min-[30rem]:col-span-1',
  diezmo: 'col-span-2 @min-[30rem]:col-span-1',
  cocos: 'col-span-3 @min-[30rem]:col-span-1',
  entre: 'col-span-3 @min-[30rem]:col-span-1',
};

function ayerLocal(hoy: string): string {
  return hoyLocal(new Date(new Date(`${hoy}T12:00:00`).getTime() - UN_DIA_MS));
}

function claseDeLaFila(fila: FilaDe<'movimientos'>): ClaseDeMovimiento {
  return claseDe(fila.tipo, fila.tesoro_origen, fila.tesoro_destino)?.id ?? 'gasto_hogar';
}

function saldosDeLosDeSiempre(tesoros: readonly TesoroDelTaller[]): SaldosPorTesoro {
  const saldo = (clave: Tesoro) => tesoroDeLaClave(tesoros, clave)?.saldo ?? CERO;
  return {
    hogar: saldo('hogar'),
    maun: saldo('maun'),
    diezmo: saldo('diezmo'),
    cocos: saldo('cocos'),
  };
}

function idDelLado(
  id: string | null | undefined,
  clave: Tesoro | null,
  tesoros: readonly TesoroDelTaller[],
): string | undefined {
  if (id !== null && id !== undefined) return id;
  return clave === null ? undefined : tesoroDeLaClave(tesoros, clave)?.id;
}

function ladosIniciales(
  movimiento: FilaDe<'movimientos'> | undefined,
  clase: ClaseDeMovimiento,
  tesoros: readonly TesoroDelTaller[],
): { desde: string; hacia: string } {
  if (movimiento && CLASE[clase].eligeLosLados) {
    const fila = movimiento as Partial<FilaDe<'movimientos'>>;
    const desde = idDelLado(fila.desde_id, movimiento.tesoro_origen, tesoros);
    const hacia = idDelLado(fila.hacia_id, movimiento.tesoro_destino, tesoros);
    if (desde !== undefined && hacia !== undefined) return { desde, hacia };
  }
  const elegibles = tesoros.filter((tesoro) => !tesoro.archivado && vaEntreTesoros(tesoro));
  const desde = tesoroDeLaClave(elegibles, 'maun')?.id ?? elegibles[0]?.id ?? '';
  const hacia =
    elegibles.find((tesoro) => tesoro.clave === null && tesoro.id !== desde) ??
    elegibles.find((tesoro) => tesoro.id !== desde);
  return { desde, hacia: hacia?.id ?? '' };
}

function tesoroInicialDelGasto(
  movimiento: FilaDe<'movimientos'> | undefined,
  propuesto: string | undefined,
  tesoros: readonly TesoroDelTaller[],
): string {
  if (movimiento) return (movimiento as Partial<FilaDe<'movimientos'>>).desde_id ?? '';
  if (propuesto !== undefined && tesoroPorId(tesoros, propuesto) !== undefined) return propuesto;
  return tesoros.find(gastaDesdeElTesoro)?.id ?? '';
}

function Segmentado({
  grupo,
  soloEntreTesoros,
  alElegir,
}: {
  grupo: GrupoDeMovimiento;
  soloEntreTesoros: boolean;
  alElegir: (nuevo: GrupoDeMovimiento) => void;
}) {
  return (
    <div className="@container">
      <div
        role="radiogroup"
        aria-label="Tipo"
        className="grid grid-cols-6 gap-0.5 rounded-panel bg-ink/6 p-1 @min-[30rem]:grid-cols-5"
      >
        {GRUPOS.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            role="radio"
            aria-checked={grupo === opcion.id}
            disabled={soloEntreTesoros && opcion.id !== 'entre'}
            onClick={() => {
              alElegir(opcion.id);
            }}
            className={`min-h-tap rounded-[16px] px-1 text-label leading-tight disabled:opacity-40 ${LUGAR_DEL_GRUPO[opcion.id]} ${
              grupo === opcion.id
                ? 'bg-elevado font-semibold text-ink shadow-float'
                : 'font-medium text-text-2'
            }`}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}

function ElegirTesoro({
  etiqueta,
  opciones,
  elegido,
  alElegir,
}: {
  etiqueta: string;
  opciones: readonly TesoroDelTaller[];
  elegido: string;
  alElegir: (id: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <span id={id} className="text-label text-text-2">
        {etiqueta}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {opciones.map((tesoro) => {
          const activo = tesoro.id === elegido;
          return (
            <button
              key={tesoro.id}
              type="button"
              aria-pressed={activo}
              onClick={() => {
                alElegir(tesoro.id);
              }}
              className={`apretable flex min-h-tap items-center gap-2 rounded-pill border px-3 text-label font-medium ${
                activo ? 'border-ink bg-ink text-paper' : 'border-border bg-paper text-ink'
              }`}
            >
              <span
                aria-hidden
                className={`size-2 flex-none rounded-pill ${activo ? 'bg-paper' : TINTA[tesoro.tinta].fondo}`}
              />
              {tesoro.nombre}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface HojaDeMovimientoProps {
  movimiento?: FilaDe<'movimientos'>;
  claseInicial?: ClaseDeMovimiento;
  tesoroInicial?: string;
  montoInicial?: number;
  categoriaInicial?: string;
  fechaInicial?: string;
  renglones?: ReadonlyMap<string, readonly string[]>;
  tesoros: readonly TesoroDelTaller[];
  tesorosSincronizados: boolean;
  metaCocos: number;
  alCerrar: () => void;
}

export function HojaDeMovimiento({
  movimiento,
  claseInicial,
  tesoroInicial,
  montoInicial,
  categoriaInicial,
  fechaInicial,
  renglones,
  tesoros,
  tesorosSincronizados,
  metaCocos,
  alCerrar,
}: HojaDeMovimientoProps) {
  const hoy = hoyLocal();
  const ayer = ayerLocal(hoy);
  const categoriasDe = (deLaClase: ClaseDeMovimiento, tesoro: string) =>
    categoriasDeLaClase(deLaClase, renglones?.get(tesoro));

  const [iniciales] = useState(() => {
    const clase = movimiento ? claseDeLaFila(movimiento) : (claseInicial ?? 'gasto_hogar');
    const tesoroDelGasto = tesoroInicialDelGasto(movimiento, tesoroInicial, tesoros);
    return {
      clase,
      categoria:
        movimiento?.categoria ?? categoriaInicial ?? categoriasDe(clase, tesoroDelGasto)[0] ?? '',
      descripcion: movimiento?.descripcion ?? '',
      monto: movimiento?.monto_centavos ?? montoInicial ?? null,
      fecha:
        movimiento?.fecha ??
        (fechaInicial !== undefined && fechaInicial <= hoy ? fechaInicial : hoy),
      tesoroDelGasto,
      ...ladosIniciales(movimiento, clase, tesoros),
    };
  });
  const [clase, setClase] = useState<ClaseDeMovimiento>(iniciales.clase);
  const [categoria, setCategoria] = useState(iniciales.categoria);
  const [descripcion, setDescripcion] = useState(iniciales.descripcion);
  const [monto, setMonto] = useState<number | null>(iniciales.monto);
  const [fecha, setFecha] = useState(iniciales.fecha);
  const [desde, setDesde] = useState(iniciales.desde);
  const [hacia, setHacia] = useState(iniciales.hacia);
  const [tesoroDelGasto, setTesoroDelGasto] = useState(iniciales.tesoroDelGasto);
  const [error, setError] = useState<string | undefined>(undefined);
  const [errorDeLosLados, setErrorDeLosLados] = useState<string | undefined>(undefined);
  const [confirmandoBaja, setConfirmandoBaja] = useState(false);

  const campoDeMonto = useRef<HTMLInputElement>(null);
  useEffect(() => {
    campoDeMonto.current?.focus();
  }, []);

  const crear = useMutation({ ...MUTACION_DE_MOVIMIENTO, meta: metaDeAvisos('movimientoNuevo') });
  const editar = useMutation({
    ...MUTACION_DE_EDICION_DE_MOVIMIENTO,
    meta: metaDeAvisos('movimientoEditado'),
  });
  const borrar = useMutation({
    ...MUTACION_DE_BAJA_DE_MOVIMIENTO,
    meta: metaDeAvisos('movimientoBorrado'),
  });
  const estadoSync = useEstadoSync();
  const enVuelo = crear.isPending || editar.isPending || borrar.isPending;
  const fallo: unknown = crear.error ?? editar.error ?? borrar.error;

  const cubreElMes =
    (movimiento as Partial<FilaDe<'movimientos'>> | undefined)?.cubre_el_mes ?? null;
  const opciones = tesoros.filter(
    (tesoro) =>
      (!tesoro.archivado && vaEntreTesoros(tesoro)) ||
      tesoro.id === iniciales.desde ||
      tesoro.id === iniciales.hacia,
  );
  const origen = tesoroPorId(tesoros, desde);
  const destino = tesoroPorId(tesoros, hacia);
  const opcionesDelGasto = tesoros.filter(
    (tesoro) => gastaDesdeElTesoro(tesoro) || tesoro.id === iniciales.tesoroDelGasto,
  );
  const delGasto = tesoroPorId(opcionesDelGasto, tesoroDelGasto);

  const datos = CLASE[clase];
  const categorias = categoriasDe(clase, tesoroDelGasto);
  const tinte =
    datos.eligeElTesoro && delGasto !== undefined
      ? {
          fondo: TINTA[delGasto.tinta].tinte,
          texto: TINTA[delGasto.tinta].texto,
          icono: delGasto.icono,
        }
      : datos.tesoro === null
        ? null
        : TESORO[datos.tesoro];
  const ayuda = ayudaDelMovimiento(clase, {
    saldos: saldosDeLosDeSiempre(tesoros),
    metaCocos: centavos(metaCocos),
    monto: centavos(monto ?? 0),
    lados:
      origen && destino
        ? {
            desde: { nombre: origen.nombre, saldo: origen.saldo },
            hacia: { nombre: destino.nombre, saldo: destino.saldo },
          }
        : undefined,
    tesoro: delGasto === undefined ? undefined : { nombre: delGasto.nombre, saldo: delGasto.saldo },
  });

  function ladosElegidos(
    deLaClase: ClaseDeMovimiento,
    uno: string,
    otro: string,
    delTesoro: string,
  ): string {
    if (CLASE[deLaClase].eligeLosLados) return `${uno}→${otro}`;
    return CLASE[deLaClase].eligeElTesoro ? delTesoro : '';
  }

  function elegirClase(nueva: ClaseDeMovimiento) {
    setClase(nueva);
    setCategoria(categoriasDe(nueva, tesoroDelGasto)[0] ?? '');
    setError(undefined);
    setErrorDeLosLados(undefined);
  }

  function elegirTesoroDelGasto(id: string) {
    setTesoroDelGasto(id);
    setCategoria(categoriasDe('gasto_tesoro', id)[0] ?? '');
    setErrorDeLosLados(undefined);
  }

  function elegirGrupo(grupo: GrupoDeMovimiento) {
    const primera = clasesDelGrupo(grupo)[0];
    if (primera) elegirClase(primera.id);
  }

  function elegirDesde(id: string) {
    if (id === hacia) setHacia(desde);
    setDesde(id);
    setErrorDeLosLados(undefined);
  }

  function elegirHacia(id: string) {
    setHacia(id);
    setErrorDeLosLados(undefined);
  }

  function ladosParaGuardar(): LadosDelMovimiento | null {
    if (datos.eligeLosLados) {
      if (!origen || !destino || origen.id === destino.id) return null;
      return ladosDelMovimiento(origen, destino, tesorosSincronizados);
    }
    if (datos.eligeElTesoro) {
      if (delGasto === undefined) return null;
      return ladosDelMovimiento(delGasto, null, tesorosSincronizados);
    }
    const lado = (clave: Tesoro | null): LadoDelMovimiento | null | undefined =>
      clave === null ? null : tesoroDeLaClave(tesoros, clave);
    const deDesde = lado(datos.desde);
    const deHacia = lado(datos.hacia);
    const soloLaClave = (clave: Tesoro | null) => (clave === null ? null : { id: clave, clave });
    return ladosDelMovimiento(
      deDesde ?? soloLaClave(datos.desde),
      deHacia ?? soloLaClave(datos.hacia),
      tesorosSincronizados && deDesde !== undefined && deHacia !== undefined,
    );
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const importe = monto;
    const lados = ladosParaGuardar();
    setError(
      importe === null || importe === 0
        ? 'Escribí cuánta plata es, por ejemplo 12.500.'
        : undefined,
    );
    setErrorDeLosLados(
      lados === null ? (datos.eligeElTesoro ? FALTA_EL_TESORO : FALTAN_LOS_LADOS) : undefined,
    );
    if (importe === null || importe === 0 || lados === null) return;

    const campos = {
      fecha,
      tipo: datos.tipo,
      ...lados,
      monto_centavos: importe,
      categoria,
      descripcion,
    } satisfies CambiosDeMovimiento;

    if (movimiento) {
      editar.mutate({
        id: movimiento.id,
        cambios: campos,
        previos: {
          fecha: movimiento.fecha,
          tipo: movimiento.tipo,
          ...ladosDeLaFila(movimiento, tesorosSincronizados),
          monto_centavos: movimiento.monto_centavos,
          categoria: movimiento.categoria,
          descripcion: movimiento.descripcion,
        },
      });
    } else {
      crear.mutate({ id: uuidv7(), ...campos });
    }
    alCerrar();
  }

  function confirmarBaja() {
    if (!movimiento) return;
    borrar.mutate({
      id: movimiento.id,
      borradoEn: new Date().toISOString(),
      previo: movimiento,
    });
    alCerrar();
  }

  return (
    <Hoja
      titulo={movimiento ? 'Editar el movimiento' : 'Cargar un movimiento'}
      alCerrar={alCerrar}
      conCambios={hayCambios(
        {
          clase: iniciales.clase,
          categoria: iniciales.categoria,
          descripcion: iniciales.descripcion.trim(),
          monto: iniciales.monto,
          fecha: iniciales.fecha,
          lados: ladosElegidos(
            iniciales.clase,
            iniciales.desde,
            iniciales.hacia,
            iniciales.tesoroDelGasto,
          ),
        },
        {
          clase,
          categoria,
          descripcion: descripcion.trim(),
          monto,
          fecha,
          lados: ladosElegidos(clase, desde, hacia, tesoroDelGasto),
        },
      )}
    >
      <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <Segmentado
            grupo={datos.grupo}
            soloEntreTesoros={cubreElMes !== null}
            alElegir={elegirGrupo}
          />

          {cubreElMes !== null && (
            <p className="text-label leading-relaxed text-text-2">
              Cubre lo que faltaba para los gastos fijos de {nombreDelMes(cubreElMes).toLowerCase()}
              , así que sigue siendo un pase entre tesoros.
            </p>
          )}

          {clasesDelGrupo(datos.grupo).length > 1 && (
            <div role="group" aria-label="Detalle del tipo" className="flex flex-wrap gap-2">
              {clasesDelGrupo(datos.grupo)
                .filter(
                  (opcion) =>
                    !opcion.eligeElTesoro || opcionesDelGasto.length > 0 || clase === opcion.id,
                )
                .map((opcion) => (
                  <button
                    key={opcion.id}
                    type="button"
                    aria-pressed={clase === opcion.id}
                    onClick={() => {
                      elegirClase(opcion.id);
                    }}
                    className={`apretable flex min-h-tap items-center gap-2 rounded-pill border px-3 text-label font-medium ${
                      clase === opcion.id
                        ? 'border-ink bg-ink text-paper'
                        : 'border-border bg-paper text-ink'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`size-2 rounded-pill ${
                        clase === opcion.id
                          ? 'bg-paper'
                          : opcion.tesoro === null
                            ? 'bg-text-3'
                            : TESORO[opcion.tesoro].barra
                      }`}
                    />
                    {opcion.corta}
                  </button>
                ))}
            </div>
          )}

          {datos.eligeLosLados && (
            <div className="flex flex-col gap-3">
              <ElegirTesoro
                etiqueta="Sale de"
                opciones={opciones}
                elegido={desde}
                alElegir={elegirDesde}
              />
              <ElegirTesoro
                etiqueta="Entra a"
                opciones={opciones.filter((tesoro) => tesoro.id !== desde)}
                elegido={hacia}
                alElegir={elegirHacia}
              />
              {errorDeLosLados !== undefined && (
                <p role="alert" className="text-label font-medium text-alerta">
                  {errorDeLosLados}
                </p>
              )}
            </div>
          )}

          {datos.eligeElTesoro && (
            <div className="flex flex-col gap-3">
              <ElegirTesoro
                etiqueta="Sale de"
                opciones={opcionesDelGasto}
                elegido={tesoroDelGasto}
                alElegir={elegirTesoroDelGasto}
              />
              {errorDeLosLados !== undefined && (
                <p role="alert" className="text-label font-medium text-alerta">
                  {errorDeLosLados}
                </p>
              )}
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-label text-text-2">Cuánta plata</span>
            <span
              className={`flex h-[76px] items-center gap-2 rounded-field border px-4 ${
                error === undefined ? 'border-ink' : 'border-alerta'
              }`}
            >
              <AdornoDePlata className="text-h1 text-text-3" />
              <MoneyInput
                ref={campoDeMonto}
                value={monto}
                placeholder="0"
                aria-label="Cuánta plata"
                aria-invalid={error === undefined ? undefined : true}
                onChange={(centavos) => {
                  setMonto(centavos);
                  setError(undefined);
                }}
                className="min-w-0 flex-1 border-0 bg-transparent text-money-xl font-semibold text-ink outline-none"
              />
            </span>
            {error !== undefined && (
              <span role="alert" className="text-label font-medium text-alerta">
                {error}
              </span>
            )}
          </label>

          <Campo
            etiqueta="Qué fue"
            value={descripcion}
            maxLength={500}
            placeholder={datos.ejemplo}
            onChange={(evento) => {
              setDescripcion(evento.target.value);
            }}
          />

          {categorias.length > 0 && (
            <label className="flex flex-col gap-1.5">
              <span className="text-label text-text-2">Categoría</span>
              <select
                value={categoria}
                onChange={(evento) => {
                  setCategoria(evento.target.value);
                }}
                className="h-field rounded-field border border-border bg-paper px-3 text-body-lg text-ink"
              >
                {categorias.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
                {!categorias.includes(categoria) && categoria !== '' && (
                  <option value={categoria}>{categoria}</option>
                )}
              </select>
            </label>
          )}

          <div className="@container flex flex-col gap-1.5">
            <span className="text-label text-text-2">Cuándo</span>
            <div className="flex flex-wrap gap-2">
              {[
                { id: hoy, etiqueta: 'Hoy' },
                { id: ayer, etiqueta: 'Ayer' },
              ].map((atajo) => (
                <button
                  key={atajo.id}
                  type="button"
                  aria-pressed={fecha === atajo.id}
                  onClick={() => {
                    setFecha(atajo.id);
                  }}
                  className={`apretable h-field rounded-pill border px-4 text-body font-medium ${
                    fecha === atajo.id
                      ? 'border-ink bg-ink text-paper'
                      : 'border-border bg-paper text-ink'
                  }`}
                >
                  {atajo.etiqueta}
                </button>
              ))}
              <input
                type="date"
                value={fecha}
                aria-label="Otra fecha"
                onChange={(evento) => {
                  setFecha(evento.target.value);
                }}
                className="h-field min-w-0 basis-full rounded-field border border-border bg-paper px-3 text-body text-ink @xs:basis-0 @xs:flex-1"
              />
            </div>
          </div>

          <p
            className={`flex items-start gap-2.5 rounded-field px-3.5 py-3 text-label leading-relaxed ${
              tinte === null ? 'bg-surface' : tinte.fondo
            }`}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex-none ${tinte === null ? 'text-text-2' : tinte.texto}`}
            >
              <Icono nombre={tinte === null ? 'arrow-left-right' : tinte.icono} tamano={18} />
            </span>
            <span>{ayuda}</span>
          </p>

          {confirmandoBaja && movimiento && (
            <div className="flex flex-col gap-2.5 rounded-field border border-alerta px-3.5 py-3">
              <p className="text-label leading-relaxed">
                Se va a borrar este movimiento de {formatearPesos(movimiento.monto_centavos)} y los
                saldos se recalculan sin él.
              </p>
              <FilaDeAcciones>
                <Button variant="peligro" size="chico" onClick={confirmarBaja}>
                  Borrarlo
                </Button>
                <Button
                  variant="secundario"
                  size="chico"
                  onClick={() => {
                    setConfirmandoBaja(false);
                  }}
                >
                  Dejarlo
                </Button>
              </FilaDeAcciones>
            </div>
          )}

          {fallo !== null && fallo !== undefined && (
            <p role="alert" className="text-label font-medium text-alerta">
              {mensajeDeSincronizacion(fallo)}
            </p>
          )}
          {enVuelo && estadoSync.tipo === 'sin-conexion' && (
            <p className="text-label text-atencion">
              Queda en la cola: se sincroniza cuando vuelva la señal.
            </p>
          )}
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            {movimiento && !confirmandoBaja && (
              <Button
                type="button"
                variant="secundario"
                onClick={() => {
                  setConfirmandoBaja(true);
                }}
              >
                <Icono nombre="trash-2" tamano={16} />
                Borrar
              </Button>
            )}
            <Button type="submit" cargando={enVuelo}>
              {movimiento ? 'Guardar los cambios' : 'Cargar el movimiento'}
            </Button>
          </FilaDeAcciones>
        </footer>
      </form>
    </Hoja>
  );
}
