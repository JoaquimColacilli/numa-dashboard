import type { ReactNode } from 'react';

import {
  EscalaDelReparto,
  Globo,
  GloboConGuia,
  LineaDePuntos,
  MarcaDeRevision,
  MarcasDeCorte,
  NivelDelMes,
  RotuloDelPlano,
} from '@/entities/fila';
import { CantoDelTesoro, ChipDelTesoro } from '@/entities/tesoro';
import { NOMBRE_DE_LA_CLASE, porciento } from '@/features/armar-la-fila';
import { formatearPesos, TINTA } from '@/shared/lib';
import { Icono } from '@/shared/ui';

import {
  renglonesALaVista,
  type DatosDeLaParte,
  type DatosDelDiezmo,
  type DatosDelEstante,
  type DatosDelOrigen,
  type DatosDelPaso,
  type DatosDelReparto,
  type DatosDelTitulo,
  type Revision,
} from '../model/disposicion';

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
  claseDelNombre,
  cifra,
  rotulo,
  unidad,
}: {
  chip: ReactNode;
  nombre: string;
  claseDelNombre: string;
  cifra: ReactNode;
  rotulo: ReactNode;
  unidad?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {chip}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-body leading-snug font-semibold ${claseDelNombre}`}>
            {nombre}
          </span>
          <span className="flex-none text-body leading-snug font-semibold tabular-nums">
            {cifra}
          </span>
        </div>
        <div className="mt-px flex items-baseline justify-between gap-2">
          <RotuloDelPlano className="truncate">{rotulo}</RotuloDelPlano>
          {unidad !== undefined && <RotuloDelPlano className="flex-none">{unidad}</RotuloDelPlano>}
        </div>
      </div>
    </div>
  );
}

function Antes({ revision }: { revision: Revision | null }) {
  if (revision?.antes === null || revision?.antes === undefined) return null;
  return (
    <span>
      antes <span className="line-through">{revision.antes}</span>
    </span>
  );
}

export function CuerpoDelOrigen({ data }: { data: DatosDelOrigen }) {
  return (
    <div className="relative flex h-full w-full items-center gap-3 rounded-pill border-[1.5px] border-ink bg-paper pr-5 pl-3 text-left text-ink">
      <span aria-hidden className="relative flex size-8 flex-none items-center justify-center">
        <span className="absolute inset-0 rounded-pill border-[1.5px] border-ink" />
        <span className="absolute inset-[7px] rounded-pill border border-ink" />
        <span className="size-1.5 rounded-pill bg-ink" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body leading-snug font-semibold">Cada cobro</span>
        <span className="truncate text-meta text-text-2">
          {data.prueba !== null
            ? `Probando con ${formatearPesos(data.prueba)}`
            : data.cobros === 0
              ? 'La ganancia de cada trabajo'
              : `${formatearPesos(data.ganancia)} en ${String(data.cobros)} ${data.cobros === 1 ? 'cobro' : 'cobros'}`}
        </span>
      </span>
    </div>
  );
}

export function CuerpoDelDiezmo({ data, elegida }: { data: DatosDelDiezmo; elegida: boolean }) {
  return (
    <Ficha elegida={elegida} className="px-3.5 pt-3 pb-4">
      <Encabezado
        chip={<ChipDelTesoro tesoro={data.tesoro} />}
        nombre={data.tesoro.nombre}
        claseDelNombre={TINTA[data.tesoro.tinta].texto}
        cifra={porciento(data.porcentaje)}
        rotulo={
          <span className="flex items-center gap-1">
            <Icono nombre="lock" tamano={10} grosor={2.25} />
            Siempre primero
          </span>
        }
      />
      <div className="mt-1.5 text-meta text-text-2">
        {data.prueba === null ? (
          <LineaDePuntos
            izquierda={`En ${data.mes}`}
            derecha={<span className="font-medium text-ink">{formatearPesos(data.delMes)}</span>}
          />
        ) : (
          <LineaDePuntos
            izquierda="De este cobro"
            derecha={
              <span className="font-semibold text-ink">+ {formatearPesos(data.prueba)}</span>
            }
          />
        )}
      </div>
      <CantoDelTesoro tinta={data.tesoro.tinta} />
    </Ficha>
  );
}

function EstadoDelPaso({ falta, tope }: { falta: number; tope: number }) {
  if (tope <= 0) return <span className="text-text-3">sin tope todavía</span>;
  return falta <= 0 ? (
    <span className="flex items-center gap-1 font-semibold text-ink">
      <Icono nombre="check" tamano={13} grosor={2.25} />
      Completo
    </span>
  ) : (
    <span className="font-semibold text-ink tabular-nums">faltan {formatearPesos(falta)}</span>
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
  const { tesoro, paso, delMes, prueba } = data;
  const lleva = delMes.recibido + delMes.cubierto;
  const vacioEnLaPrueba = prueba !== null && prueba.monto <= 0;
  const renglones = renglonesALaVista(paso.renglones);
  const mas = paso.renglones.length - renglones.length;
  const clase = NOMBRE_DE_LA_CLASE[paso.clase];
  const antes = <Antes revision={data.revision} />;
  const conAntes = data.revision !== null && data.revision.antes !== null;
  const unidad = conAntes ? antes : data.porTrabajo ? 'por trabajo' : 'por mes';

  return (
    <Ficha
      elegida={elegida}
      punteada={vacioEnLaPrueba}
      revision={data.revision}
      className={`px-3.5 pt-3 pb-4 ${data.arrastrando ? 'shadow-float' : ''}`}
      afuera={
        enLienzo ? (
          <GloboConGuia numero={data.numero} />
        ) : (
          <span className="absolute -top-2.5 -left-2.5 z-10">
            <Globo numero={data.numero} />
          </span>
        )
      }
    >
      <Encabezado
        chip={<ChipDelTesoro tesoro={tesoro} />}
        nombre={tesoro.nombre}
        claseDelNombre={TINTA[tesoro.tinta].texto}
        cifra={formatearPesos(paso.tope)}
        rotulo={
          clase.toLowerCase() === tesoro.nombre.toLowerCase()
            ? `${String(paso.renglones.length)} ${paso.renglones.length === 1 ? 'renglón' : 'renglones'}`
            : clase
        }
        unidad={unidad}
      />
      {paso.clase === 'fijos' && renglones.length > 0 && (
        <ul className="mt-2 flex flex-col border-t border-hairline-soft pt-1.5 text-meta text-text-2">
          {renglones.map((renglon, indice) => (
            <li key={`${renglon.nombre}-${String(indice)}`} className="h-4.5">
              <LineaDePuntos
                izquierda={renglon.nombre === '' ? 'Sin nombre' : renglon.nombre}
                derecha={formatearPesos(renglon.monto)}
              />
            </li>
          ))}
          {mas > 0 && <li className="h-4.5">y {mas} más</li>}
        </ul>
      )}
      <div className="mt-2.5">
        <NivelDelMes
          tinta={tesoro.tinta}
          lleva={lleva}
          prueba={prueba?.monto ?? 0}
          tope={paso.tope}
          etiqueta={`${tesoro.nombre} en ${data.mes}`}
          texto={
            paso.tope <= 0
              ? 'Sin tope todavía'
              : `${formatearPesos(lleva)} de ${formatearPesos(paso.tope)}`
          }
        />
        <div className="mt-1 flex items-baseline justify-between gap-2 text-meta">
          {prueba === null ? (
            <>
              <span className="text-text-2 tabular-nums">lleva {formatearPesos(lleva)}</span>
              <EstadoDelPaso falta={delMes.falta} tope={paso.tope} />
            </>
          ) : vacioEnLaPrueba ? (
            <>
              <span className="text-text-2">+ {formatearPesos(prueba.monto)}</span>
              <span className="text-text-2">
                {prueba.quedaba <= 0 ? 'ya estaba completo' : 'no le llega nada'}
              </span>
            </>
          ) : (
            <>
              <span className="font-semibold text-ink tabular-nums">
                + {formatearPesos(prueba.monto)}
              </span>
              {prueba.falta <= 0 ? (
                <span className="text-text-2">completa el tope</span>
              ) : (
                <span className="text-text-2 tabular-nums">
                  le faltan {formatearPesos(prueba.falta)}
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <CantoDelTesoro tinta={tesoro.tinta} punteado={vacioEnLaPrueba} />
    </Ficha>
  );
}

export function ChipNeutro({ icono }: { icono: 'split' }) {
  return (
    <span
      aria-hidden
      className="flex size-7 flex-none items-center justify-center rounded-control bg-surface-2 text-ink"
    >
      <Icono nombre={icono} tamano={16} />
    </span>
  );
}

export function CuerpoDelReparto({ data, elegida }: { data: DatosDelReparto; elegida: boolean }) {
  return (
    <Ficha elegida={elegida} className="px-3.5 pt-3 pb-3">
      <Encabezado
        chip={<ChipNeutro icono="split" />}
        nombre="Lo que sobra"
        claseDelNombre="text-ink"
        cifra={data.prueba === null ? porciento(data.aTesoros) : formatearPesos(data.prueba)}
        rotulo={
          data.prueba === null ? 'Se reparte' : data.prueba > 0 ? 'Se reparte así' : 'No sobra nada'
        }
        unidad={data.prueba === null ? 'a tesoros' : 'de este cobro'}
      />
      <div className="mt-2.5">
        <EscalaDelReparto partes={data.escala} />
      </div>
    </Ficha>
  );
}

function metaDe(tesoro: DatosDeLaParte['tesoro']): string {
  if (tesoro.meta === null || tesoro.meta <= 0) return formatearPesos(tesoro.saldo);
  const avance = Math.max(0, Math.floor((tesoro.saldo / tesoro.meta) * 100));
  return `${String(avance)}% de ${formatearPesos(tesoro.meta)}`;
}

export function CuerpoDeLaParte({ data, elegida }: { data: DatosDeLaParte; elegida: boolean }) {
  const { tesoro } = data;
  const vacia = data.prueba !== null && data.prueba <= 0;
  const conMeta = tesoro.meta !== null && tesoro.meta > 0;
  return (
    <Ficha elegida={elegida} punteada={vacia} revision={data.revision} className="px-3 pt-3 pb-4">
      <Encabezado
        chip={<ChipDelTesoro tesoro={tesoro} />}
        nombre={tesoro.nombre}
        claseDelNombre={TINTA[tesoro.tinta].texto}
        cifra={porciento(data.porcentaje)}
        rotulo={data.resto ? 'El resto' : 'Del sobrante'}
        unidad={
          data.revision !== null && data.revision.antes !== null ? (
            <Antes revision={data.revision} />
          ) : undefined
        }
      />
      <div className="mt-2 flex flex-col gap-0.5 text-meta text-text-2">
        {data.prueba === null ? (
          <LineaDePuntos
            izquierda={`En ${data.mes}`}
            derecha={<span className="font-medium text-ink">{formatearPesos(data.delMes)}</span>}
          />
        ) : (
          <LineaDePuntos
            izquierda="De este cobro"
            derecha={
              <span className={`font-semibold ${vacia ? 'text-text-3' : 'text-ink'}`}>
                + {formatearPesos(data.prueba)}
              </span>
            }
          />
        )}
        <LineaDePuntos izquierda={conMeta ? 'Meta' : 'Tiene'} derecha={metaDe(tesoro)} />
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
  const { tesoro } = data;
  return (
    <Ficha elegida={elegida} punteada className="px-3 pt-3 pb-3">
      <div className="flex items-start gap-2.5">
        <ChipDelTesoro tesoro={tesoro} />
        <div className="min-w-0 flex-1">
          <span
            className={`block truncate text-body leading-snug font-semibold ${TINTA[tesoro.tinta].texto}`}
          >
            {tesoro.nombre}
          </span>
          <span className="block truncate text-meta text-text-2">
            {tesoro.descripcion === '' ? 'Sin descripción' : tesoro.descripcion}
          </span>
        </div>
      </div>
      <div className="mt-2 text-meta text-text-2">
        <LineaDePuntos
          izquierda={data.armando && conFlechas ? 'Uní una flecha acá' : 'Tiene'}
          derecha={<span className="font-medium text-ink">{formatearPesos(tesoro.saldo)}</span>}
        />
      </div>
    </Ficha>
  );
}

export function CuerpoNuevoTesoro({
  alTocar,
  deshabilitado = false,
  children,
}: {
  alTocar: () => void;
  deshabilitado?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={alTocar}
      className="nodrag relative flex h-full w-full items-center justify-center gap-2 rounded-lamina border border-dashed border-text-3 bg-paper text-label font-medium text-text-2 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:hover:border-text-3 disabled:hover:text-text-2"
    >
      <Icono nombre="plus" tamano={16} grosor={2} />
      Nuevo tesoro
      {children}
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
