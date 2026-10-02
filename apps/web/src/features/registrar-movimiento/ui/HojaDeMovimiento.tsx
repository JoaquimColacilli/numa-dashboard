import {
  CERO,
  centavos,
  centavosEn,
  cotizacionDelCambio,
  MONEDA_DEL_TALLER,
  type Cotizacion,
  type Moneda,
  type SaldosPorTesoro,
} from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type Ref, type SyntheticEvent } from 'react';

import {
  ayudaDelMovimiento,
  categoriaEnPantalla,
  categoriasDeLaClase,
  CLASE,
  claseDe,
  clasesDelGrupo,
  destinosDeLaClase,
  esUnCambio,
  GRUPOS,
  hayDolaresParaCargar,
  ladosDeLaFila,
  ladosDelMovimiento,
  MUTACION_DE_BAJA_DE_MOVIMIENTO,
  MUTACION_DE_EDICION_DE_MOVIMIENTO,
  MUTACION_DE_MOVIMIENTO,
  origenesDeLaClase,
  tesorosParaElegir,
  type ClaseDeMovimiento,
  type GrupoDeMovimiento,
  type LadoDelMovimiento,
  type LadosDelMovimiento,
} from '@/entities/movimiento';
import {
  saldoEnPesos,
  tesoroDeLaClave,
  tesoroPorId,
  type TesoroDelTaller,
} from '@/entities/tesoro';
import {
  mensajeDeSincronizacion,
  type CambiosDeMovimiento,
  type FilaDe,
  type Tesoro,
} from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  formatearPesos,
  formatearPlata,
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
  dolares: 'col-span-2 @min-[30rem]:col-span-1',
};

const LUGAR_CON_LOS_DOLARES: Readonly<Record<GrupoDeMovimiento, string>> = {
  ...LUGAR_DEL_GRUPO,
  cocos: 'col-span-2 @min-[30rem]:col-span-1',
  entre: 'col-span-2 @min-[30rem]:col-span-1',
};

function ayerLocal(hoy: string): string {
  return hoyLocal(new Date(new Date(`${hoy}T12:00:00`).getTime() - UN_DIA_MS));
}

function monedasDeLaFila(
  fila: FilaDe<'movimientos'>,
  tesoros: readonly TesoroDelTaller[],
): { desde?: Moneda; hacia?: Moneda } {
  const conColumnas = fila as Partial<FilaDe<'movimientos'>>;
  const desde = idDelLado(conColumnas.desde_id, fila.tesoro_origen, tesoros);
  const hacia = idDelLado(conColumnas.hacia_id, fila.tesoro_destino, tesoros);
  const moneda = (id: string | undefined) =>
    id === undefined ? undefined : tesoroPorId(tesoros, id)?.moneda;
  const deDesde = moneda(desde);
  const deHacia = moneda(hacia);
  return {
    ...(deDesde === undefined ? {} : { desde: deDesde }),
    ...(deHacia === undefined ? {} : { hacia: deHacia }),
  };
}

function claseDeLaFila(
  fila: FilaDe<'movimientos'>,
  tesoros: readonly TesoroDelTaller[],
): ClaseDeMovimiento {
  return (
    claseDe(fila.tipo, fila.tesoro_origen, fila.tesoro_destino, monedasDeLaFila(fila, tesoros))
      ?.id ?? 'gasto_hogar'
  );
}

function saldosDeLosDeSiempre(tesoros: readonly TesoroDelTaller[]): SaldosPorTesoro {
  const saldo = (clave: Tesoro) => {
    const tesoro = tesoroDeLaClave(tesoros, clave);
    return (tesoro === undefined ? null : saldoEnPesos(tesoro)) ?? CERO;
  };
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

function conLosDelMovimiento(
  opciones: readonly TesoroDelTaller[],
  tesoros: readonly TesoroDelTaller[],
  delMovimiento: readonly string[],
): TesoroDelTaller[] {
  const ids = new Set(opciones.map((tesoro) => tesoro.id));
  return tesoros.filter((tesoro) => ids.has(tesoro.id) || delMovimiento.includes(tesoro.id));
}

function primeroDe(
  opciones: readonly TesoroDelTaller[],
  preferido: (tesoro: TesoroDelTaller) => boolean,
): string {
  return (opciones.find(preferido) ?? opciones[0])?.id ?? '';
}

function origenPorDefecto(clase: ClaseDeMovimiento, opciones: readonly TesoroDelTaller[]): string {
  return primeroDe(opciones, (tesoro) => clase !== 'venta_de_dolares' && tesoro.clave === 'maun');
}

function destinoPorDefecto(clase: ClaseDeMovimiento, opciones: readonly TesoroDelTaller[]): string {
  return primeroDe(opciones, (tesoro) =>
    clase === 'venta_de_dolares' ? tesoro.clave === 'maun' : tesoro.clave === null,
  );
}

interface Lados {
  desde: string;
  hacia: string;
}

interface LadosQueYaTenia {
  origenes: readonly string[];
  destinos: readonly string[];
}

const SIN_LADOS_QUE_YA_TENIA: LadosQueYaTenia = { origenes: [], destinos: [] };

function ladosParaLaClase(
  clase: ClaseDeMovimiento,
  tesoros: readonly TesoroDelTaller[],
  { desde, hacia }: Lados,
  delMovimiento: LadosQueYaTenia = SIN_LADOS_QUE_YA_TENIA,
): Lados {
  if (!CLASE[clase].eligeLosLados) return { desde, hacia };
  const origenes = conLosDelMovimiento(
    origenesDeLaClase(clase, tesoros),
    tesoros,
    delMovimiento.origenes,
  );
  const elDesde = origenes.some((tesoro) => tesoro.id === desde)
    ? desde
    : origenPorDefecto(clase, origenes);
  const destinos = conLosDelMovimiento(
    destinosDeLaClase(clase, tesoros, tesoroPorId(tesoros, elDesde)),
    tesoros,
    delMovimiento.destinos.filter((id) => id !== elDesde),
  );
  const elHacia =
    hacia !== elDesde && destinos.some((tesoro) => tesoro.id === hacia)
      ? hacia
      : destinoPorDefecto(clase, destinos);
  return { desde: elDesde, hacia: elHacia };
}

function ladosIniciales(
  movimiento: FilaDe<'movimientos'> | undefined,
  clase: ClaseDeMovimiento,
  tesoros: readonly TesoroDelTaller[],
  propuestos: Partial<Lados>,
): Lados {
  if (movimiento && CLASE[clase].eligeLosLados) {
    const fila = movimiento as Partial<FilaDe<'movimientos'>>;
    const desde = idDelLado(fila.desde_id, movimiento.tesoro_origen, tesoros);
    const hacia = idDelLado(fila.hacia_id, movimiento.tesoro_destino, tesoros);
    if (desde !== undefined && hacia !== undefined) return { desde, hacia };
  }
  return ladosParaLaClase(clase, tesoros, {
    desde: propuestos.desde ?? '',
    hacia: propuestos.hacia ?? '',
  });
}

function tesoroInicialElegido(
  movimiento: FilaDe<'movimientos'> | undefined,
  clase: ClaseDeMovimiento,
  propuesto: string | undefined,
  tesoros: readonly TesoroDelTaller[],
): string {
  if (movimiento) {
    const fila = movimiento as Partial<FilaDe<'movimientos'>>;
    return (CLASE[clase].entraAlTesoro === true ? fila.hacia_id : fila.desde_id) ?? '';
  }
  const opciones = tesorosParaElegir(clase, tesoros);
  if (propuesto !== undefined && opciones.some((tesoro) => tesoro.id === propuesto)) {
    return propuesto;
  }
  return opciones[0]?.id ?? '';
}

function claseQueSePuede(
  clase: ClaseDeMovimiento,
  tesoros: readonly TesoroDelTaller[],
): ClaseDeMovimiento {
  return CLASE[clase].grupo === 'dolares' && !hayDolaresParaCargar(tesoros) ? 'gasto_hogar' : clase;
}

function cotizacionDeLosDos(
  clase: ClaseDeMovimiento,
  sale: number | null,
  entra: number | null,
): Cotizacion | null {
  if (sale === null || entra === null || sale <= 0 || entra <= 0) return null;
  if (clase === 'compra_de_dolares') {
    return cotizacionDelCambio(centavos(sale), centavosEn('USD', entra));
  }
  if (clase === 'venta_de_dolares') {
    return cotizacionDelCambio(centavos(entra), centavosEn('USD', sale));
  }
  return null;
}

function Segmentado({
  grupo,
  conDolares,
  soloEntreTesoros,
  alElegir,
}: {
  grupo: GrupoDeMovimiento;
  conDolares: boolean;
  soloEntreTesoros: boolean;
  alElegir: (nuevo: GrupoDeMovimiento) => void;
}) {
  const grupos = GRUPOS.filter((opcion) => conDolares || opcion.id !== 'dolares');
  const lugar = conDolares ? LUGAR_CON_LOS_DOLARES : LUGAR_DEL_GRUPO;
  return (
    <div className="@container">
      <div
        role="radiogroup"
        aria-label="Tipo"
        className={`grid grid-cols-6 gap-0.5 rounded-panel bg-ink/6 p-1 ${
          conDolares ? '@min-[30rem]:grid-cols-6' : '@min-[30rem]:grid-cols-5'
        }`}
      >
        {grupos.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            role="radio"
            aria-checked={grupo === opcion.id}
            disabled={soloEntreTesoros && opcion.id !== 'entre'}
            onClick={() => {
              alElegir(opcion.id);
            }}
            className={`min-h-tap rounded-[16px] px-1 text-label leading-tight disabled:opacity-40 ${lugar[opcion.id]} ${
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

function CampoDePlata({
  etiqueta,
  moneda,
  valor,
  error,
  campo,
  alCambiar,
}: {
  etiqueta: string;
  moneda: Moneda;
  valor: number | null;
  error: string | undefined;
  campo?: Ref<HTMLInputElement>;
  alCambiar: (centavos: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-label text-text-2">{etiqueta}</span>
      <span
        className={`flex h-[76px] items-center gap-2 rounded-field border px-4 ${
          error === undefined ? 'border-ink' : 'border-alerta'
        }`}
      >
        <AdornoDePlata moneda={moneda} className="text-h1 text-text-3" />
        <MoneyInput
          ref={campo}
          moneda={moneda}
          value={valor}
          placeholder="0"
          aria-label={etiqueta}
          aria-invalid={error === undefined ? undefined : true}
          onChange={alCambiar}
          className="min-w-0 flex-1 border-0 bg-transparent text-money-xl font-semibold text-ink outline-none"
        />
      </span>
      {error !== undefined && (
        <span role="alert" className="text-label font-medium text-alerta">
          {error}
        </span>
      )}
    </label>
  );
}

export interface HojaDeMovimientoProps {
  movimiento?: FilaDe<'movimientos'>;
  claseInicial?: ClaseDeMovimiento;
  tesoroInicial?: string;
  haciaInicial?: string;
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
  haciaInicial,
  montoInicial,
  categoriaInicial,
  fechaInicial,
  renglones,
  tesoros,
  tesorosSincronizados,
  metaCocos,
  alCerrar,
}: HojaDeMovimientoProps) {
  const m = useMensajes();
  const hoy = hoyLocal();
  const ayer = ayerLocal(hoy);
  const categoriasDe = (deLaClase: ClaseDeMovimiento, tesoro: string) =>
    categoriasDeLaClase(deLaClase, renglones?.get(tesoro));

  const [iniciales] = useState(() => {
    const clase = movimiento
      ? claseDeLaFila(movimiento, tesoros)
      : claseQueSePuede(claseInicial ?? 'gasto_hogar', tesoros);
    const tesoroElegido = tesoroInicialElegido(movimiento, clase, tesoroInicial, tesoros);
    const lados = ladosIniciales(movimiento, clase, tesoros, {
      ...(tesoroInicial === undefined ? {} : { desde: tesoroInicial }),
      ...(haciaInicial === undefined ? {} : { hacia: haciaInicial }),
    });
    return {
      clase,
      categoria:
        movimiento?.categoria ?? categoriaInicial ?? categoriasDe(clase, tesoroElegido)[0] ?? '',
      descripcion: movimiento?.descripcion ?? '',
      monto: movimiento?.monto_centavos ?? montoInicial ?? null,
      montoDestino:
        (movimiento as Partial<FilaDe<'movimientos'>> | undefined)?.monto_destino_centavos ?? null,
      fecha:
        movimiento?.fecha ??
        (fechaInicial !== undefined && fechaInicial <= hoy ? fechaInicial : hoy),
      tesoroElegido,
      ...lados,
    };
  });
  const [clase, setClase] = useState<ClaseDeMovimiento>(iniciales.clase);
  const [categoria, setCategoria] = useState(iniciales.categoria);
  const [descripcion, setDescripcion] = useState(iniciales.descripcion);
  const [monto, setMonto] = useState<number | null>(iniciales.monto);
  const [montoDestino, setMontoDestino] = useState<number | null>(iniciales.montoDestino);
  const [fecha, setFecha] = useState(iniciales.fecha);
  const [desde, setDesde] = useState(iniciales.desde);
  const [hacia, setHacia] = useState(iniciales.hacia);
  const [tesoroElegido, setTesoroElegido] = useState(iniciales.tesoroElegido);
  const [error, setError] = useState<string | undefined>(undefined);
  const [errorDelDestino, setErrorDelDestino] = useState<string | undefined>(undefined);
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

  const filaPrevia = movimiento as Partial<FilaDe<'movimientos'>> | undefined;
  const cubreElMes = filaPrevia?.cubre_el_mes ?? null;
  const delMovimiento = ladosDelMovimientoPara(clase);
  const origenes = conLosDelMovimiento(
    origenesDeLaClase(clase, tesoros),
    tesoros,
    delMovimiento.origenes,
  );
  const origen = tesoroPorId(tesoros, desde);
  const destinos = conLosDelMovimiento(
    destinosDeLaClase(clase, tesoros, origen),
    tesoros,
    delMovimiento.destinos.filter((id) => id !== desde),
  );
  const destino = tesoroPorId(tesoros, hacia);
  const paraElegir = conLosDelMovimiento(
    tesorosParaElegir(clase, tesoros),
    tesoros,
    movimiento !== undefined && clase === iniciales.clase ? [iniciales.tesoroElegido] : [],
  );
  const elegido = tesoroPorId(paraElegir, tesoroElegido);
  const conDolares = hayDolaresParaCargar(tesoros) || CLASE[clase].grupo === 'dolares';

  const datos = CLASE[clase];
  const cambio = esUnCambio(clase);
  const categorias = categoriasDe(clase, tesoroElegido);
  const monedaDelMonto: Moneda = datos.eligeLosLados
    ? (origen?.moneda ?? MONEDA_DEL_TALLER)
    : datos.eligeElTesoro
      ? (elegido?.moneda ?? MONEDA_DEL_TALLER)
      : MONEDA_DEL_TALLER;
  const monedaDelDestino: Moneda = destino?.moneda ?? MONEDA_DEL_TALLER;
  const cotizacion = cambio ? cotizacionDeLosDos(clase, monto, montoDestino) : null;
  const tinte =
    datos.eligeElTesoro && elegido !== undefined
      ? {
          fondo: TINTA[elegido.tinta].tinte,
          texto: TINTA[elegido.tinta].texto,
          icono: elegido.icono,
        }
      : datos.tesoro === null
        ? null
        : TESORO[datos.tesoro];
  const ayuda = ayudaDelMovimiento(clase, {
    saldos: saldosDeLosDeSiempre(tesoros),
    metaCocos: centavos(metaCocos),
    monto: monto ?? 0,
    montoDestino: montoDestino ?? 0,
    lados:
      origen && destino
        ? {
            desde: { nombre: origen.nombre, saldo: origen.saldo },
            hacia: { nombre: destino.nombre, saldo: destino.saldo },
          }
        : undefined,
    tesoro: elegido === undefined ? undefined : { nombre: elegido.nombre, saldo: elegido.saldo },
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

  function ladosDelMovimientoPara(deLaClase: ClaseDeMovimiento): LadosQueYaTenia {
    if (movimiento === undefined || deLaClase !== iniciales.clase) {
      return SIN_LADOS_QUE_YA_TENIA;
    }
    if (!esUnCambio(deLaClase)) {
      const ambos = [iniciales.desde, iniciales.hacia];
      return { origenes: ambos, destinos: ambos };
    }
    return { origenes: [iniciales.desde], destinos: [iniciales.hacia] };
  }

  function ladosPara(nueva: ClaseDeMovimiento, propuestos: Lados): Lados {
    return ladosParaLaClase(nueva, tesoros, propuestos, ladosDelMovimientoPara(nueva));
  }

  function elegirClase(nueva: ClaseDeMovimiento) {
    const lados = ladosPara(nueva, { desde, hacia });
    const delTesoro = tesorosParaElegir(nueva, tesoros).some(
      (tesoro) => tesoro.id === tesoroElegido,
    )
      ? tesoroElegido
      : (tesorosParaElegir(nueva, tesoros)[0]?.id ?? '');
    setClase(nueva);
    setDesde(lados.desde);
    setHacia(lados.hacia);
    setTesoroElegido(delTesoro);
    setCategoria(categoriasDe(nueva, delTesoro)[0] ?? '');
    setError(undefined);
    setErrorDelDestino(undefined);
    setErrorDeLosLados(undefined);
  }

  function elegirElTesoro(id: string) {
    setTesoroElegido(id);
    setCategoria(categoriasDe(clase, id)[0] ?? '');
    setErrorDeLosLados(undefined);
  }

  function elegirGrupo(grupo: GrupoDeMovimiento) {
    const primera = clasesDelGrupo(grupo)[0];
    if (primera) elegirClase(primera.id);
  }

  function elegirDesde(id: string) {
    const lados = ladosPara(clase, { desde: id, hacia: id === hacia ? desde : hacia });
    setDesde(lados.desde);
    setHacia(lados.hacia);
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
      if (elegido === undefined) return null;
      return datos.entraAlTesoro === true
        ? ladosDelMovimiento(null, elegido, tesorosSincronizados)
        : ladosDelMovimiento(elegido, null, tesorosSincronizados);
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

  function errorDelMonto(): string {
    if (!cambio) return 'Escribí cuánta plata es, por ejemplo 12.500.';
    return clase === 'compra_de_dolares'
      ? m.movimientos.cambio.faltaLoQuePagaste
      : m.movimientos.cambio.faltaLoQueVendiste;
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const importe = monto;
    const recibido = cambio ? montoDestino : null;
    const lados = ladosParaGuardar();
    const faltaElImporte = importe === null || importe === 0;
    const faltaLoRecibido = cambio && (recibido === null || recibido === 0);
    setError(faltaElImporte ? errorDelMonto() : undefined);
    setErrorDelDestino(faltaLoRecibido ? m.movimientos.cambio.faltaLoQueRecibiste : undefined);
    setErrorDeLosLados(
      lados === null ? (datos.eligeElTesoro ? FALTA_EL_TESORO : FALTAN_LOS_LADOS) : undefined,
    );
    if (importe === null || importe === 0 || faltaLoRecibido || lados === null) return;

    const previoDestino = filaPrevia?.monto_destino_centavos ?? null;
    const campos = {
      fecha,
      tipo: datos.tipo,
      ...lados,
      monto_centavos: importe,
      ...(cambio
        ? { monto_destino_centavos: recibido }
        : previoDestino === null
          ? {}
          : { monto_destino_centavos: null }),
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
          ...(cambio || previoDestino !== null ? { monto_destino_centavos: previoDestino } : {}),
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

  const monedaDelBorrado: Moneda =
    (movimiento?.tipo === 'ingreso'
      ? tesoroPorId(tesoros, filaPrevia?.hacia_id ?? '')
      : tesoroPorId(tesoros, filaPrevia?.desde_id ?? '')
    )?.moneda ?? MONEDA_DEL_TALLER;

  const selectorDeCategoria = categorias.length > 0 && (
    <label className="flex flex-col gap-1.5">
      <span className="text-label text-text-2">
        {cambio ? m.movimientos.cambio.queDolar : 'Categoría'}
      </span>
      <select
        value={categoria}
        onChange={(evento) => {
          setCategoria(evento.target.value);
        }}
        className="h-field rounded-field border border-border bg-paper px-3 text-body-lg text-ink"
      >
        {categorias.map((opcion) => (
          <option key={opcion} value={opcion}>
            {categoriaEnPantalla(opcion)}
          </option>
        ))}
        {!categorias.includes(categoria) && categoria !== '' && (
          <option value={categoria}>{categoria}</option>
        )}
      </select>
    </label>
  );

  const campoQueFue = (
    <Campo
      etiqueta="Qué fue"
      value={descripcion}
      maxLength={500}
      placeholder={datos.ejemplo}
      onChange={(evento) => {
        setDescripcion(evento.target.value);
      }}
    />
  );

  const errorDeLosLadosEnPantalla = errorDeLosLados !== undefined && (
    <p role="alert" className="text-label font-medium text-alerta">
      {errorDeLosLados}
    </p>
  );

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
          montoDestino: esUnCambio(iniciales.clase) ? iniciales.montoDestino : null,
          fecha: iniciales.fecha,
          lados: ladosElegidos(
            iniciales.clase,
            iniciales.desde,
            iniciales.hacia,
            iniciales.tesoroElegido,
          ),
        },
        {
          clase,
          categoria,
          descripcion: descripcion.trim(),
          monto,
          montoDestino: cambio ? montoDestino : null,
          fecha,
          lados: ladosElegidos(clase, desde, hacia, tesoroElegido),
        },
      )}
    >
      <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <Segmentado
            grupo={datos.grupo}
            conDolares={conDolares}
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
                    !opcion.eligeElTesoro ||
                    tesorosParaElegir(opcion.id, tesoros).length > 0 ||
                    clase === opcion.id,
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

          {cambio ? (
            <>
              <ElegirTesoro
                etiqueta={m.movimientos.cambio.salenDe}
                opciones={origenes}
                elegido={desde}
                alElegir={elegirDesde}
              />
              <CampoDePlata
                etiqueta={
                  clase === 'compra_de_dolares'
                    ? m.movimientos.cambio.pagaste
                    : m.movimientos.cambio.vendiste
                }
                moneda={monedaDelMonto}
                valor={monto}
                error={error}
                campo={campoDeMonto}
                alCambiar={(centavosNuevos) => {
                  setMonto(centavosNuevos);
                  setError(undefined);
                }}
              />
              <ElegirTesoro
                etiqueta={m.movimientos.cambio.entranA}
                opciones={destinos}
                elegido={hacia}
                alElegir={elegirHacia}
              />
              <CampoDePlata
                etiqueta={m.movimientos.cambio.recibiste}
                moneda={monedaDelDestino}
                valor={montoDestino}
                error={errorDelDestino}
                alCambiar={(centavosNuevos) => {
                  setMontoDestino(centavosNuevos);
                  setErrorDelDestino(undefined);
                }}
              />
              {errorDeLosLadosEnPantalla}
              {cotizacion !== null && (
                <p data-cotizacion-del-cambio className="text-body font-medium text-ink">
                  {clase === 'compra_de_dolares'
                    ? m.movimientos.cambio.teQuedoA(formatearPesos(cotizacion))
                    : m.movimientos.cambio.teLoPagaronA(formatearPesos(cotizacion))}
                </p>
              )}
              {selectorDeCategoria}
              {campoQueFue}
            </>
          ) : (
            <>
              {datos.eligeLosLados && (
                <div className="flex flex-col gap-3">
                  <ElegirTesoro
                    etiqueta="Sale de"
                    opciones={origenes}
                    elegido={desde}
                    alElegir={elegirDesde}
                  />
                  <ElegirTesoro
                    etiqueta="Entra a"
                    opciones={destinos}
                    elegido={hacia}
                    alElegir={elegirHacia}
                  />
                  {errorDeLosLadosEnPantalla}
                </div>
              )}

              {datos.eligeElTesoro && (
                <div className="flex flex-col gap-3">
                  <ElegirTesoro
                    etiqueta={datos.entraAlTesoro === true ? 'Entra a' : 'Sale de'}
                    opciones={paraElegir}
                    elegido={tesoroElegido}
                    alElegir={elegirElTesoro}
                  />
                  {errorDeLosLadosEnPantalla}
                </div>
              )}

              <CampoDePlata
                etiqueta="Cuánta plata"
                moneda={monedaDelMonto}
                valor={monto}
                error={error}
                campo={campoDeMonto}
                alCambiar={(centavosNuevos) => {
                  setMonto(centavosNuevos);
                  setError(undefined);
                }}
              />

              {campoQueFue}
              {selectorDeCategoria}
            </>
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
                Se va a borrar este movimiento de{' '}
                {formatearPlata(movimiento.monto_centavos, monedaDelBorrado)} y los saldos se
                recalculan sin él.
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
