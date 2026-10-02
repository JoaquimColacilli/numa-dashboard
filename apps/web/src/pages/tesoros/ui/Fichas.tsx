import type { Money } from '@maun/domain';
import type { ReactNode } from 'react';

import {
  AyudaDeLaGanancia,
  AyudaDelGrupo,
  AyudaDelIngresoLibre,
  AyudaDelMapa,
  BASE_EN_PALABRAS,
  EscalaDelReparto,
  Globo,
  GloboConGuia,
  LineaDePuntos,
  MarcaDeRevision,
  MarcasDeCorte,
  modoEnPalabras,
  NivelDelMes,
  NOMBRE_DEL_GRUPO,
  NOMBRE_DEL_TIPO,
  RotuloDelPlano,
} from '@/entities/fila';
import { categoriaEnPantalla } from '@/entities/movimiento';
import { CantoDelTesoro, ChipDelTesoro } from '@/entities/tesoro';
import { llegoALaMeta, notaDelPasoEnLaPrueba, porciento } from '@/features/armar-la-fila';
import { useMensajes } from '@/shared/idioma';
import { formatearLaPlata, formatearPesos, TINTA } from '@/shared/lib';
import { Icono, type NombreDeIcono } from '@/shared/ui';

import {
  renglonesALaVista,
  textoDeLosInsumos,
  textoDelIngreso,
  type DatosDeLaObligacion,
  type DatosDeLaParte,
  type DatosDeLosInsumos,
  type DatosDelEstante,
  type DatosDelIngreso,
  type DatosDelPaso,
  type DatosDelReparto,
  type DatosDelTitulo,
  type Flujo,
  type GrupoConFranja,
  type Revision,
} from '../model/disposicion';

const EN_EL_LIENZO = 'pointer-events-auto nodrag nopan';

export interface FichaProps {
  children: ReactNode;
  elegida: boolean;
  punteada?: boolean;
  className?: string;
  afuera?: ReactNode;
  revision?: Revision | null;
}

export function Ficha({
  children,
  elegida,
  punteada = false,
  className = '',
  afuera,
  revision = null,
}: FichaProps) {
  return (
    <div className="relative h-full w-full">
      {afuera}
      {revision !== null && <MarcaDeRevision numero={revision.numero} />}
      <div
        className={`relative h-full w-full overflow-hidden rounded-lamina bg-paper text-left text-ink ${
          elegida
            ? 'border border-ink ring-1 ring-ink'
            : punteada
              ? 'border border-dashed border-text-3'
              : 'border border-border'
        } ${className}`}
      >
        {children}
      </div>
      {elegida && <MarcasDeCorte />}
    </div>
  );
}

function Encabezado({
  chip,
  nombre,
  nombreTraducible = false,
  claseDelNombre,
  cifra,
  rotulo,
  despuesDelRotulo,
  unidad,
  unidadAncha = false,
}: {
  chip: ReactNode;
  nombre: string;
  nombreTraducible?: boolean;
  claseDelNombre: string;
  cifra: ReactNode;
  rotulo: ReactNode;
  despuesDelRotulo?: string | null;
  unidad?: ReactNode;
  unidadAncha?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {chip}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            translate={nombreTraducible ? undefined : 'no'}
            className={`truncate text-body leading-snug font-semibold ${claseDelNombre}`}
          >
            {nombre}
          </span>
          <span
            translate="no"
            className="flex-none text-body leading-snug font-semibold tabular-nums"
          >
            {cifra}
          </span>
        </div>
        <div className="mt-px flex items-start justify-between gap-2">
          <RotuloDelPlano className="flex h-[1lh] min-w-0 flex-1 flex-wrap items-baseline overflow-hidden">
            <span className="flex-none">{rotulo}</span>
            {despuesDelRotulo !== undefined && despuesDelRotulo !== null && (
              <span className="flex-none whitespace-pre"> · {despuesDelRotulo}</span>
            )}
          </RotuloDelPlano>
          {unidad !== undefined && (
            <RotuloDelPlano
              className={`flex-none text-right ${unidadAncha ? 'max-w-[68%]' : 'max-w-[48%]'}`}
            >
              {unidad}
            </RotuloDelPlano>
          )}
        </div>
      </div>
    </div>
  );
}

function Tachado({ children }: { children: ReactNode }) {
  return (
    <span translate="no" className="line-through">
      {children}
    </span>
  );
}

function Antes({ revision }: { revision: Revision | null }) {
  const textos = useMensajes().paginaTesoros.fichas;
  if (revision?.antes === null || revision?.antes === undefined) return null;
  return <span>{textos.antes(Tachado, revision.antes)}</span>;
}

function SimboloDeEntrada() {
  return (
    <span aria-hidden className="relative flex size-8 flex-none items-center justify-center">
      <span className="absolute inset-0 rounded-pill border-[1.5px] border-ink" />
      <span className="absolute inset-[7px] rounded-pill border border-ink" />
      <span className="size-1.5 rounded-pill bg-ink" />
    </span>
  );
}

export function CuerpoDeLaSena() {
  const textos = useMensajes().paginaTesoros.plano;
  return (
    <div className="relative flex h-full w-full items-center gap-3 rounded-pill border-[1.5px] border-ink bg-paper pr-5 pl-3 text-left text-ink">
      <SimboloDeEntrada />
      <span className="min-w-0 flex-1 text-body-sm leading-tight font-semibold">
        {textos.senaDeLosTrabajos}
      </span>
    </div>
  );
}

export function CuerpoDelIngreso({ data }: { data: DatosDelIngreso }) {
  const textos = useMensajes().paginaTesoros.fichas;
  return (
    <div className="relative flex h-full w-full items-center gap-3 rounded-pill border-[1.5px] border-ink bg-paper pr-4 pl-3 text-left text-ink">
      <SimboloDeEntrada />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center justify-between gap-2">
          <span className="text-body leading-snug font-semibold">{textos.ingreso}</span>
          <AyudaDelMapa className={EN_EL_LIENZO} />
        </span>
        <span className="text-meta leading-snug text-text-2">
          {textoDelIngreso({ ingreso: data.ingreso, cobros: data.cobros }, data.mes, data.prueba)}
        </span>
      </span>
    </div>
  );
}

function ChipNeutro({ icono }: { icono: NombreDeIcono }) {
  return (
    <span
      aria-hidden
      className="flex size-7 flex-none items-center justify-center rounded-control bg-surface-2 text-ink"
    >
      <Icono nombre={icono} tamano={16} />
    </span>
  );
}

export function CuerpoDeLosInsumos({
  data,
  elegida,
}: {
  data: DatosDeLosInsumos;
  elegida: boolean;
}) {
  const textos = useMensajes().paginaTesoros.fichas;
  return (
    <Ficha elegida={elegida} punteada className="px-3 pt-3 pb-3">
      <div className="flex items-start gap-2.5">
        <ChipNeutro icono="hand-coins" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-body leading-snug font-semibold">
            {textos.insumos}
          </span>
          <span className="block truncate text-meta text-text-2">{textoDeLosInsumos(data)}</span>
        </div>
      </div>
      <div className="mt-2 text-meta text-text-2">
        <LineaDePuntos
          izquierda={textos.queda}
          derecha={
            <span translate="no" className="font-medium text-ink">
              {formatearPesos(data.total)}
            </span>
          }
        />
      </div>
    </Ficha>
  );
}

export function Candado() {
  const textos = useMensajes().paginaTesoros.fichas;
  return (
    <span title={textos.candado} className="inline-flex">
      <Icono nombre="lock" tamano={10} grosor={2.25} />
    </span>
  );
}

export function CuerpoDeLaObligacion({
  data,
  elegida,
  enLienzo,
}: {
  data: DatosDeLaObligacion;
  elegida: boolean;
  enLienzo: boolean;
}) {
  const textos = useMensajes().paginaTesoros.fichas;
  const { tesoro, obligacion, prueba } = data;
  const vacia = prueba !== null && prueba <= 0;
  const conAntes = data.revision !== null && data.revision.antes !== null;
  return (
    <Ficha
      elegida={elegida}
      punteada={vacia}
      revision={data.revision}
      className={`px-3.5 pt-3 pb-4 ${data.arrastrando ? 'shadow-float' : ''}`}
      afuera={<GloboDeLaFicha numero={data.numero} enLienzo={enLienzo} />}
    >
      <Encabezado
        chip={<ChipDelTesoro tesoro={tesoro} />}
        nombre={tesoro.nombre}
        claseDelNombre={TINTA[tesoro.tinta].texto}
        cifra={porciento(obligacion.porcentaje)}
        rotulo={
          data.diezmo ? (
            <span className="inline-flex items-center gap-1">
              <Candado />
              {NOMBRE_DEL_TIPO.obligacion}
            </span>
          ) : (
            NOMBRE_DEL_TIPO.obligacion
          )
        }
        unidad={conAntes ? <Antes revision={data.revision} /> : undefined}
      />
      <div className="mt-1.5 flex flex-col gap-0.5 text-meta text-text-2">
        <span className="truncate first-letter:uppercase">{BASE_EN_PALABRAS[obligacion.base]}</span>
        {prueba === null ? (
          <LineaDePuntos
            izquierda={textos.aPagar}
            derecha={
              <span translate="no" className="font-medium text-ink">
                {formatearPesos(data.aPagar)}
              </span>
            }
          />
        ) : (
          <LineaDePuntos
            izquierda={textos.deEsteCobro}
            derecha={
              <span
                translate="no"
                className={`font-semibold ${vacia ? 'text-text-3' : 'text-ink'}`}
              >
                + {formatearPesos(prueba)}
              </span>
            }
          />
        )}
      </div>
      <CantoDelTesoro tinta={tesoro.tinta} punteado={vacia} />
    </Ficha>
  );
}

function GloboDeLaFicha({ numero, enLienzo }: { numero: number; enLienzo: boolean }) {
  return enLienzo ? (
    <GloboConGuia numero={numero} />
  ) : (
    <span className="absolute -top-2.5 -left-2.5 z-10">
      <Globo numero={numero} />
    </span>
  );
}

function EstadoDelPaso({ falta, tope }: { falta: number; tope: number }) {
  const textos = useMensajes().paginaTesoros.fichas;
  if (tope <= 0) return <span className="text-text-3">{textos.sinMontoTodavia}</span>;
  return falta <= 0 ? (
    <span className="flex items-center gap-1 font-semibold text-ink">
      <Icono nombre="check" tamano={13} grosor={2.25} />
      {textos.completo}
    </span>
  ) : (
    <span className="font-semibold text-ink tabular-nums">
      {textos.faltan(formatearPesos(falta))}
    </span>
  );
}

function RenglonDelPaso({
  nombre,
  monto,
  dia,
  pagado,
}: {
  nombre: string;
  monto: number;
  dia: number | null;
  pagado: boolean;
}) {
  const textos = useMensajes().paginaTesoros.fichas;
  return (
    <LineaDePuntos
      izquierda={
        <span className="inline-flex max-w-full min-w-0 items-baseline gap-1">
          {nombre === '' ? (
            <span className="truncate">{textos.sinNombre}</span>
          ) : (
            <span translate="no" className="truncate">
              {categoriaEnPantalla(nombre)}
            </span>
          )}
          {dia !== null && (
            <span className="flex-none text-text-3">
              {textos.venceEl(dia)}
              {pagado && (
                <>
                  <Icono
                    nombre="check"
                    tamano={12}
                    grosor={2.5}
                    className="ml-0.5 inline align-[-1px] text-ink"
                  />
                  <span className="sr-only"> {textos.pagado}</span>
                </>
              )}
            </span>
          )}
        </span>
      }
      derecha={<span translate="no">{formatearPesos(monto)}</span>}
    />
  );
}

function MetaDelAhorro({
  tinta,
  meta,
  hastaLaMeta,
  nombre,
}: {
  tinta: DatosDelPaso['tesoro']['tinta'];
  meta: NonNullable<DatosDelPaso['delMes']['meta']>;
  hastaLaMeta: boolean;
  nombre: string;
}) {
  const textos = useMensajes().paginaTesoros.fichas;
  const avance = meta.meta <= 0 ? 0 : Math.min(100, Math.floor((meta.saldo / meta.meta) * 100));
  const deLaMeta = textos.avanceDeLaMeta(String(avance), formatearPesos(meta.meta));
  return (
    <div className="flex h-4.5 items-center gap-2 text-meta text-text-2">
      <span
        role="meter"
        aria-label={textos.suMeta(nombre)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={avance}
        aria-valuetext={deLaMeta}
        className="relative h-1 w-12 flex-none overflow-hidden rounded-[2px] bg-surface-2"
      >
        <span
          className={`absolute inset-y-0 left-0 ${TINTA[tinta].fondo}`}
          style={{ width: `${String(avance)}%` }}
        />
      </span>
      <span translate="no" className="min-w-0 flex-1 truncate tabular-nums">
        {deLaMeta}
      </span>
      {hastaLaMeta && <span className="flex-none">{textos.hastaLaMeta}</span>}
    </div>
  );
}

function PieDelPaso({ data }: { data: DatosDelPaso }) {
  const textos = useMensajes().paginaTesoros.fichas;
  const { tesoro, paso, delMes, prueba, conDeuda } = data;
  const vacioEnLaPrueba = prueba !== null && prueba.monto <= 0;
  const lleva = delMes.lleva;
  if (paso.modo === 'trabajo') {
    return (
      <div className="flex flex-col gap-0.5 text-meta text-text-2">
        {prueba === null ? (
          <LineaDePuntos
            izquierda={textos.enElMes(data.mes)}
            derecha={
              <span translate="no" className="font-medium text-ink">
                {formatearPesos(delMes.recibido)}
              </span>
            }
          />
        ) : (
          <LineaDePuntos
            izquierda={textos.deEsteCobro}
            derecha={
              <span
                translate="no"
                className={`font-semibold ${vacioEnLaPrueba ? 'text-text-3' : 'text-ink'}`}
              >
                + {formatearPesos(prueba.monto)}
              </span>
            }
          />
        )}
        <span className="truncate">
          {prueba !== null && prueba.llegaALaMeta
            ? llegoALaMeta()
            : textos.recibeEnCadaCobro(formatearPesos(paso.tope))}
        </span>
      </div>
    );
  }
  const enSaldo = paso.modo === 'saldo';
  const deLaIzquierda = enSaldo
    ? conDeuda
      ? textos.aPagarMonto(formatearPesos(lleva))
      : textos.tieneMonto(formatearPesos(lleva))
    : textos.llevaMonto(formatearPesos(lleva));
  return (
    <div>
      <NivelDelMes
        tinta={tesoro.tinta}
        lleva={lleva}
        prueba={prueba?.monto ?? 0}
        tope={paso.tope}
        etiqueta={
          enSaldo
            ? textos.nivelDelSaldo(tesoro.nombre)
            : textos.nivelDelMes(tesoro.nombre, data.mes)
        }
        texto={
          paso.tope <= 0
            ? textos.sinMontoTodaviaDelNivel
            : textos.deTotal(formatearPesos(lleva), formatearPesos(paso.tope))
        }
      />
      <div className="mt-1 flex items-baseline justify-between gap-2 text-meta">
        {prueba === null ? (
          <>
            <span className="text-text-2 tabular-nums">{deLaIzquierda}</span>
            <EstadoDelPaso falta={delMes.falta ?? 0} tope={paso.tope} />
          </>
        ) : vacioEnLaPrueba ? (
          <>
            <span translate="no" className="text-text-2">
              + {formatearPesos(prueba.monto)}
            </span>
            <span className="text-text-2">
              {prueba.llegaALaMeta
                ? llegoALaMeta()
                : prueba.quedaba <= 0
                  ? textos.yaEstabaCompleto
                  : textos.noLeLlegaNada}
            </span>
          </>
        ) : (
          <>
            <span translate="no" className="font-semibold text-ink tabular-nums">
              + {formatearPesos(prueba.monto)}
            </span>
            <span className="text-text-2 tabular-nums">
              {notaDelPasoEnLaPrueba({
                tope: prueba.quedaba,
                falta: prueba.falta,
                llegaALaMeta: prueba.llegaALaMeta,
              })}
            </span>
          </>
        )}
      </div>
      {conDeuda && !enSaldo && delMes.aPagar !== null && (
        <div className="mt-0.5 text-meta text-text-2">
          <LineaDePuntos
            izquierda={textos.aPagar}
            derecha={
              <span translate="no" className="font-medium text-ink">
                {formatearPesos(delMes.aPagar)}
              </span>
            }
          />
        </div>
      )}
    </div>
  );
}

export function CuerpoDelPaso({
  data,
  elegida,
  enLienzo,
}: {
  data: DatosDelPaso;
  elegida: boolean;
  enLienzo: boolean;
}) {
  const m = useMensajes();
  const textos = m.paginaTesoros.fichas;
  const { tesoro, paso, delMes, prueba, tipo } = data;
  const vacioEnLaPrueba = prueba !== null && prueba.monto <= 0;
  const renglones = renglonesALaVista(paso.renglones);
  const mas = paso.renglones.length - renglones.length;
  const conAntes = data.revision !== null && data.revision.antes !== null;
  const modo = data.porTrabajo ? m.fila.modo[tipo].trabajo : modoEnPalabras(paso.modo, tipo);
  const pagados = new Map(
    delMes.vencimientos.map((vencimiento) => [vencimiento.indice, vencimiento]),
  );
  const despues =
    paso.clase === 'sueldo'
      ? textos.sueldo
      : paso.clase === 'fijos'
        ? textos.renglonPorRenglon
        : null;

  return (
    <Ficha
      elegida={elegida}
      punteada={vacioEnLaPrueba}
      revision={data.revision}
      className={`px-3.5 pt-3 pb-4 ${data.arrastrando ? 'shadow-float' : ''}`}
      afuera={<GloboDeLaFicha numero={data.numero} enLienzo={enLienzo} />}
    >
      <Encabezado
        chip={<ChipDelTesoro tesoro={tesoro} />}
        nombre={tesoro.nombre}
        claseDelNombre={TINTA[tesoro.tinta].texto}
        cifra={formatearPesos(paso.tope)}
        rotulo={NOMBRE_DEL_TIPO[tipo]}
        despuesDelRotulo={despues}
        unidad={conAntes ? <Antes revision={data.revision} /> : modo}
      />
      {paso.clase === 'fijos' && renglones.length > 0 && (
        <ul className="mt-2 flex flex-col border-t border-hairline-soft pt-1.5 text-meta text-text-2">
          {renglones.map((renglon, indice) => (
            <li key={`${renglon.nombre}-${String(indice)}`} className="h-4.5">
              <RenglonDelPaso
                nombre={renglon.nombre}
                monto={renglon.monto}
                dia={renglon.dia}
                pagado={pagados.get(indice)?.pagado ?? false}
              />
            </li>
          ))}
          {mas > 0 && <li className="h-4.5">{textos.yMas(mas)}</li>}
        </ul>
      )}
      <div className="mt-2.5">
        <PieDelPaso data={data} />
        {tipo === 'ahorro-fijo' && delMes.meta !== null && (
          <div className="mt-0.5">
            <MetaDelAhorro
              tinta={tesoro.tinta}
              meta={delMes.meta}
              hastaLaMeta={paso.hastaLaMeta}
              nombre={tesoro.nombre}
            />
          </div>
        )}
      </div>
      <CantoDelTesoro tinta={tesoro.tinta} punteado={vacioEnLaPrueba} />
    </Ficha>
  );
}

const TAMANO_DEL_MONTO_LARGO: readonly (readonly [largo: number, clase: string])[] = [
  [16, 'text-label'],
  [15, 'text-body-sm'],
];

function MontoQueSobra({ monto }: { monto: Money }) {
  const texto = formatearPesos(monto);
  const clase = TAMANO_DEL_MONTO_LARGO.find(([largo]) => texto.length >= largo)?.[1];
  return <span className={clase}>{texto}</span>;
}

export function CuerpoDelReparto({ data, elegida }: { data: DatosDelReparto; elegida: boolean }) {
  const textos = useMensajes().paginaTesoros.fichas;
  return (
    <Ficha elegida={elegida} className="px-3.5 pt-3 pb-3">
      <Encabezado
        chip={<ChipNeutro icono="split" />}
        nombre={textos.loQueSobra}
        nombreTraducible
        claseDelNombre="text-ink"
        cifra={
          data.prueba === null ? porciento(data.aTesoros) : <MontoQueSobra monto={data.prueba} />
        }
        rotulo={
          data.prueba === null
            ? textos.seReparte
            : data.prueba > 0
              ? textos.seReparteAsi
              : textos.noSobraNada
        }
        unidad={data.prueba === null ? textos.aAhorros : textos.deEsteCobroUnidad}
      />
      <div className="mt-2.5">
        <EscalaDelReparto partes={data.escala} />
      </div>
    </Ficha>
  );
}

export function CuerpoDeLaParte({ data, elegida }: { data: DatosDeLaParte; elegida: boolean }) {
  const textos = useMensajes().paginaTesoros.fichas;
  const { tesoro, meta } = data;
  const vacia = data.prueba !== null && data.prueba <= 0;
  const conAntes = data.revision !== null && data.revision.antes !== null;
  const avance =
    meta === null || meta.meta <= 0 ? 0 : Math.min(100, Math.floor((meta.saldo / meta.meta) * 100));
  return (
    <Ficha elegida={elegida} punteada={vacia} revision={data.revision} className="px-3 pt-3 pb-4">
      <Encabezado
        chip={<ChipDelTesoro tesoro={tesoro} />}
        nombre={tesoro.nombre}
        claseDelNombre={TINTA[tesoro.tinta].texto}
        cifra={porciento(data.porcentaje)}
        rotulo={
          data.superavit ? NOMBRE_DEL_TIPO.superavit : NOMBRE_DEL_TIPO['ahorro-por-porcentaje']
        }
        unidadAncha
        unidad={
          conAntes ? (
            <Antes revision={data.revision} />
          ) : data.superavit ? (
            textos.elResto
          ) : data.hastaLaMeta && meta !== null ? (
            textos.hastaLaMetaUnidad
          ) : undefined
        }
      />
      <div className="mt-2 flex flex-col gap-0.5 text-meta text-text-2">
        {data.prueba === null ? (
          <LineaDePuntos
            izquierda={textos.enElMes(data.mes)}
            derecha={
              <span translate="no" className="font-medium text-ink">
                {formatearPesos(data.delMes)}
              </span>
            }
          />
        ) : (
          <LineaDePuntos
            izquierda={data.llegaALaMeta ? llegoALaMeta() : textos.deEsteCobro}
            derecha={
              <span
                translate="no"
                className={`font-semibold ${vacia ? 'text-text-3' : 'text-ink'}`}
              >
                + {formatearPesos(data.prueba)}
              </span>
            }
          />
        )}
        {meta === null ? (
          <LineaDePuntos
            izquierda={textos.tiene}
            derecha={<span translate="no">{formatearLaPlata(tesoro.saldo)}</span>}
          />
        ) : (
          <span className="flex h-4.5 items-center gap-2">
            <span
              aria-hidden
              className="relative h-1 w-10 flex-none overflow-hidden rounded-[2px] bg-surface-2"
            >
              <span
                className={`absolute inset-y-0 left-0 ${TINTA[tesoro.tinta].fondo}`}
                style={{ width: `${String(avance)}%` }}
              />
            </span>
            <span translate="no" className="min-w-0 flex-1 truncate tabular-nums">
              {textos.avanceDeLaMeta(String(avance), formatearPesos(meta.meta))}
            </span>
          </span>
        )}
      </div>
      <CantoDelTesoro tinta={tesoro.tinta} punteado={vacia} />
    </Ficha>
  );
}

export function CuerpoDelEstante({
  data,
  elegida,
  conFlechas,
}: {
  data: DatosDelEstante;
  elegida: boolean;
  conFlechas: boolean;
}) {
  const textos = useMensajes().paginaTesoros.fichas;
  const { tesoro } = data;
  return (
    <Ficha elegida={elegida} punteada className="px-3 pt-3 pb-3">
      <div className="flex items-start gap-2.5">
        <ChipDelTesoro tesoro={tesoro} />
        <div className="min-w-0 flex-1">
          <span
            translate="no"
            className={`block truncate text-body leading-snug font-semibold ${TINTA[tesoro.tinta].texto}`}
          >
            {tesoro.nombre}
          </span>
          {tesoro.descripcion === '' ? (
            <span className="block truncate text-meta text-text-2">{textos.sinDescripcion}</span>
          ) : (
            <span translate="no" className="block truncate text-meta text-text-2">
              {tesoro.descripcion}
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 text-meta text-text-2">
        <LineaDePuntos
          izquierda={data.armando && conFlechas ? textos.uniUnaFlecha : textos.tiene}
          derecha={
            <span translate="no" className="font-medium text-ink">
              {formatearLaPlata(tesoro.saldo)}
            </span>
          }
        />
      </div>
    </Ficha>
  );
}

export function CuerpoNuevoTesoro({
  alTocar,
  alEnfocar,
  deshabilitado = false,
  enLienzo = false,
}: {
  alTocar: () => void;
  alEnfocar?: (boton: HTMLButtonElement) => void;
  deshabilitado?: boolean;
  enLienzo?: boolean;
}) {
  const textos = useMensajes().paginaTesoros.fichas;
  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={alTocar}
      onFocus={(evento) => {
        alEnfocar?.(evento.currentTarget);
      }}
      className={`relative flex h-full w-full items-center justify-center gap-2 rounded-lamina border border-dashed border-text-3 bg-paper text-label font-medium text-text-2 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:hover:border-text-3 disabled:hover:text-text-2 ${
        enLienzo ? EN_EL_LIENZO : ''
      }`}
    >
      <Icono nombre="plus" tamano={16} grosor={2} />
      {textos.nuevoTesoro}
    </button>
  );
}

export function TituloDelEstante({ data }: { data: DatosDelTitulo }) {
  return (
    <div className="flex h-full items-end gap-2 pb-0.5">
      <RotuloDelPlano className="font-semibold text-ink">{data.texto}</RotuloDelPlano>
      <span className="text-meta text-text-3">{data.bajada}</span>
    </div>
  );
}

export function FranjaDelTipo({ grupo }: { grupo: GrupoConFranja }) {
  return (
    <div className="relative flex h-full w-full items-center justify-end pr-3.5">
      <span className="flex flex-col items-center gap-2">
        <AyudaDelGrupo grupo={grupo} className={EN_EL_LIENZO} />
        <RotuloDelPlano className="rotate-180 font-semibold whitespace-nowrap text-text-2 [writing-mode:vertical-rl]">
          {NOMBRE_DEL_GRUPO[grupo]}
        </RotuloDelPlano>
      </span>
      <span
        aria-hidden
        className="absolute inset-y-0 right-0 w-1.5 rounded-l-[3px] border-y border-l border-text-3"
      />
    </div>
  );
}

export function RotuloDelFlujo({
  flujo,
  monto,
  enLienzo = false,
}: {
  flujo: Flujo;
  monto: Money | null;
  enLienzo?: boolean;
}) {
  const textos = useMensajes().paginaTesoros.fichas;
  const nombre =
    flujo === 'cobro'
      ? textos.seCobraElTrabajo
      : flujo === 'libre'
        ? textos.ingresoLibre
        : textos.ganancia;
  const clases = enLienzo ? EN_EL_LIENZO : '';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border bg-paper py-px pr-1 pl-1.5 whitespace-nowrap ${
        flujo !== 'cobro' && monto !== null ? 'border-ink/30' : 'border-hairline'
      } ${flujo === 'cobro' ? 'pr-1.5' : ''}`}
    >
      <RotuloDelPlano className="font-semibold">{nombre}</RotuloDelPlano>
      {flujo !== 'cobro' && monto !== null && (
        <span translate="no" className="text-badge font-semibold text-ink tabular-nums">
          {formatearPesos(monto)}
        </span>
      )}
      {flujo === 'libre' && <AyudaDelIngresoLibre className={clases} />}
      {flujo === 'ganancia' && <AyudaDeLaGanancia className={clases} />}
    </span>
  );
}

export function TituloDelGrupo({ grupo }: { grupo: GrupoConFranja }) {
  return (
    <div className="flex items-center gap-1.5 px-1 pb-2">
      <RotuloDelPlano className="font-semibold text-ink">{NOMBRE_DEL_GRUPO[grupo]}</RotuloDelPlano>
      <AyudaDelGrupo grupo={grupo} />
    </div>
  );
}
