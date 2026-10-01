import type {
  CuentaDeUnValor,
  DocumentoDelPresupuesto,
  PresupuestoAceptado,
  PresupuestoMandado,
  TextoConTitulo,
} from '@maun/domain';
import { Fragment, useId, type ReactNode } from 'react';

import { formatearPesos } from '@/shared/lib';
import {
  BloquePlegable,
  FilaDeAcciones,
  Globo,
  Icono,
  LineaDePuntos,
  MarcaDeRevision,
  RotuloDelPresupuesto,
} from '@/shared/ui';

import {
  claveDeLaSena,
  COMO_DEJAR_LA_SENA,
  cuantoDuraLaGarantia,
  EL_PRESUPUESTO,
  EL_PRESUPUESTO_QUE_ACEPTASTE,
  ELEGI_LA_OPCION,
  enlaceParaEscribirleAlTaller,
  ESCRIBIRLE_AL_TALLER,
  ID_DE_COMO_PAGAR,
  lineaDelVencido,
  partesDelPie,
  queCambioEnLaRevision,
  rotuloDelAceptado,
  rotuloDelMandado,
  textoDeLaValidez,
  textoDelAcordado,
  textoDelPlazo,
  VER_EL_DETALLE,
} from '../model/presupuesto';

const TARJETA = 'rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';

const TITULO_DE_BLOQUE = 'rotulo-del-plano text-badge font-semibold text-text-2 uppercase';

const BLOQUE = 'mt-5 border-t border-hairline-soft pt-5';

const TEXTO_CORRIDO = 'max-w-[560px] text-body leading-relaxed text-pretty';

const PARTE_QUE_NO_SE_CORTA = 36;

const BOTON_QUE_ES_UN_ENLACE =
  'inline-flex min-h-button items-center justify-center gap-2 rounded-pill border border-border bg-paper px-4 py-1.5 text-center text-body font-medium text-ink no-underline hover:bg-surface';

function TituloDeBloque({ children }: { children: ReactNode }) {
  return <h3 className={TITULO_DE_BLOQUE}>{children}</h3>;
}

function ListaConPuntos({ renglones }: { renglones: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {renglones.map((renglon, indice) => (
        <li key={`${String(indice)}-${renglon}`} className="flex gap-2.5 text-body leading-normal">
          <span aria-hidden className="mt-2 size-1.5 flex-none rounded-pill bg-text-3" />
          <span className="min-w-0 text-pretty">{renglon}</span>
        </li>
      ))}
    </ul>
  );
}

function ElTrabajo({ documento }: { documento: DocumentoDelPresupuesto }) {
  return (
    <div>
      <h3 className="text-body-lg leading-normal font-semibold text-pretty">{documento.titulo}</h3>
      {documento.obra !== '' && (
        <p className="mt-0.5 flex items-start gap-1.5 text-label leading-normal text-text-2">
          <Icono nombre="map-pin" tamano={14} className="mt-[3px] flex-none" />
          <span className="min-w-0">{documento.obra}</span>
        </p>
      )}
      {documento.descripcion !== '' && (
        <p className={`mt-3 ${TEXTO_CORRIDO} text-text-2`}>{documento.descripcion}</p>
      )}
    </div>
  );
}

function Detalle({ muebles }: { muebles: DocumentoDelPresupuesto['muebles'] }) {
  if (muebles.length === 0) return null;
  return (
    <div className={BLOQUE}>
      <TituloDeBloque>Detalle</TituloDeBloque>
      <ol className="mt-3.5 flex flex-col gap-5">
        {muebles.map((mueble, indice) => (
          <li
            key={`${String(indice)}-${mueble.nombre}`}
            className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3"
          >
            <Globo numero={indice + 1} className="-mt-px" />
            <div className="min-w-0">
              <p className="text-body leading-normal font-semibold">{mueble.nombre}</p>
              {mueble.descripcion !== '' && (
                <p className={`mt-1 ${TEXTO_CORRIDO} text-text-2`}>{mueble.descripcion}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Herrajes({ herrajes }: { herrajes: readonly string[] }) {
  if (herrajes.length === 0) return null;
  return (
    <div className={BLOQUE}>
      <TituloDeBloque>Herrajes</TituloDeBloque>
      <div className="mt-3">
        <ListaConPuntos renglones={herrajes} />
      </div>
    </div>
  );
}

function ATenerEnCuenta({ renglones }: { renglones: readonly string[] }) {
  if (renglones.length === 0) return null;
  return (
    <div className="mt-5 rounded-field bg-surface px-3.5 pt-3 pb-3.5">
      <TituloDeBloque>A tener en cuenta</TituloDeBloque>
      <div className="mt-2.5">
        <ListaConPuntos renglones={renglones} />
      </div>
    </div>
  );
}

function Incluye({ renglones }: { renglones: readonly string[] }) {
  if (renglones.length === 0) return null;
  return (
    <div className={BLOQUE}>
      <TituloDeBloque>Incluye</TituloDeBloque>
      <ul className="mt-3 flex flex-col gap-1.5">
        {renglones.map((renglon, indice) => (
          <li
            key={`${String(indice)}-${renglon}`}
            className="flex gap-2.5 text-body leading-normal"
          >
            <Icono nombre="check" tamano={16} grosor={2} className="mt-[3px] flex-none" />
            <span className="min-w-0 text-pretty">{renglon}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface LoQueSeMuestraDeLosValores {
  conLoPagado: boolean;
  acordado: number | null;
}

function CuentasDeUnValor({
  cuenta,
  senaBp,
  como,
}: {
  cuenta: CuentaDeUnValor;
  senaBp: number;
  como: LoQueSeMuestraDeLosValores;
}) {
  const pago = como.conLoPagado && cuenta.pagado > 0;
  return (
    <div className="flex flex-col text-body leading-normal">
      <LineaDePuntos
        className="pb-1"
        izquierda={<span className="font-semibold">Total</span>}
        derecha={
          <span className="text-money-lg leading-tight font-semibold">
            {formatearPesos(cuenta.total)}
          </span>
        }
      />
      {como.acordado !== null && (
        <p className="pb-1 text-label leading-normal font-semibold">
          {textoDelAcordado(como.acordado)}
        </p>
      )}
      <LineaDePuntos
        className="py-1"
        izquierda={claveDeLaSena(senaBp)}
        derecha={formatearPesos(cuenta.sena)}
      />
      {pago && (
        <>
          <LineaDePuntos
            className="py-1"
            izquierda="Ya pagaste"
            derecha={formatearPesos(cuenta.pagado)}
          />
          <div className="mt-1 border-t border-ink pt-1.5">
            {cuenta.faltaParaLaSena > 0 ? (
              <LineaDePuntos
                className="py-1 font-semibold"
                izquierda="Te falta para la seña"
                derecha={formatearPesos(cuenta.faltaParaLaSena)}
              />
            ) : (
              <p className="flex items-center gap-1.5 py-1 font-semibold text-hogar">
                <Icono nombre="circle-check" tamano={16} className="flex-none" />
                La seña está cubierta
              </p>
            )}
          </div>
        </>
      )}
      {como.conLoPagado && (
        <LineaDePuntos
          className="py-1 text-text-2"
          izquierda="Después, el saldo"
          derecha={formatearPesos(cuenta.saldo)}
        />
      )}
    </div>
  );
}

function Valores({
  documento,
  cuentas,
  conEleccion,
  como,
}: {
  documento: DocumentoDelPresupuesto;
  cuentas: readonly CuentaDeUnValor[];
  conEleccion: boolean;
  como: LoQueSeMuestraDeLosValores;
}) {
  const [unica] = cuentas;
  if (unica === undefined) return null;
  if (documento.valores?.tipo !== 'opciones') {
    return (
      <div className={BLOQUE}>
        <TituloDeBloque>Valores</TituloDeBloque>
        <div className="mt-3">
          <CuentasDeUnValor cuenta={unica} senaBp={documento.senaBp} como={como} />
        </div>
      </div>
    );
  }
  if (cuentas.length === 1) {
    return (
      <div className={BLOQUE}>
        <TituloDeBloque>Valores</TituloDeBloque>
        <h4 className="mt-3 text-body leading-normal font-semibold">Opción {unica.letra}</h4>
        {unica.descripcion !== '' && (
          <p className="mt-0.5 max-w-[560px] text-label leading-relaxed text-pretty text-text-2">
            {unica.descripcion}
          </p>
        )}
        <div className="mt-3">
          <CuentasDeUnValor cuenta={unica} senaBp={documento.senaBp} como={como} />
        </div>
      </div>
    );
  }
  return (
    <div className={`${BLOQUE} @container/valores`}>
      <TituloDeBloque>Valores</TituloDeBloque>
      <ul className="mt-3 grid grid-cols-1 gap-3 @min-[34rem]/valores:grid-cols-2">
        {cuentas.map((cuenta) => (
          <li
            key={cuenta.id ?? cuenta.letra}
            className="flex flex-col rounded-field border border-hairline px-3.5 pt-3 pb-2.5"
          >
            <h4 className="text-body leading-normal font-semibold">Opción {cuenta.letra}</h4>
            {cuenta.descripcion !== '' && (
              <p className="mt-0.5 text-label leading-relaxed text-pretty text-text-2">
                {cuenta.descripcion}
              </p>
            )}
            <div className="mt-auto pt-3">
              <CuentasDeUnValor cuenta={cuenta} senaBp={documento.senaBp} como={como} />
            </div>
          </li>
        ))}
      </ul>
      {conEleccion && (
        <p className="mt-3 text-body leading-normal text-text-2">{ELEGI_LA_OPCION}</p>
      )}
    </div>
  );
}

function Definicion({ clave, children }: { clave: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 @min-[30rem]:flex-row @min-[30rem]:gap-4">
      <dt className="text-label leading-normal text-text-2 @min-[30rem]:w-40 @min-[30rem]:flex-none @min-[30rem]:pt-px">
        {clave}
      </dt>
      <dd className="max-w-[560px] min-w-0 text-body leading-normal text-pretty">{children}</dd>
    </div>
  );
}

interface ValidezDelDocumento {
  texto: string;
  vencida: boolean;
}

function FormaPlazoYValidez({
  documento,
  validez,
}: {
  documento: DocumentoDelPresupuesto;
  validez: ValidezDelDocumento | null;
}) {
  return (
    <dl className={`${BLOQUE} flex flex-col gap-3`}>
      {documento.formaDePago !== null && (
        <Definicion clave="Forma de pago">{documento.formaDePago}</Definicion>
      )}
      <Definicion clave="Plazo de fabricación">
        {textoDelPlazo(documento.plazoDeFabricacion)}
      </Definicion>
      {validez !== null && (
        <Definicion clave="Validez">
          {validez.vencida ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-atencion">
              <Icono nombre="triangle-alert" tamano={15} className="flex-none" />
              {validez.texto}
            </span>
          ) : (
            validez.texto
          )}
        </Definicion>
      )}
    </dl>
  );
}

function Clausulas({ textos }: { textos: readonly TextoConTitulo[] }) {
  return (
    <ol className="flex flex-col gap-3.5">
      {textos.map((texto, indice) => (
        <li
          key={`${String(indice)}-${texto.texto}`}
          className="grid grid-cols-[1.5rem_minmax(0,1fr)]"
        >
          <span aria-hidden className="text-body leading-relaxed text-text-3 tabular-nums">
            {indice + 1}.
          </span>
          <div className={TEXTO_CORRIDO}>
            {texto.titulo !== null && <p className="font-semibold">{texto.titulo}</p>}
            <p className="text-text-2">{texto.texto}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Plegable({
  titulo,
  resumen,
  children,
}: {
  titulo: string;
  resumen: string;
  children: ReactNode;
}) {
  return (
    <BloquePlegable
      titulo={titulo}
      resumen={resumen}
      abiertoAlPrincipio={false}
      enTarjeta={false}
      enRenglon
      nivel="h3"
      claseDelTitulo={TITULO_DE_BLOQUE}
      className="border-b border-hairline-soft"
    >
      <div className="pb-4">{children}</div>
    </BloquePlegable>
  );
}

function LoQueHayQueSaber({ documento }: { documento: DocumentoDelPresupuesto }) {
  const { avisos, condiciones, garantia } = documento;
  if (avisos.length === 0 && condiciones.length === 0 && garantia === '') return null;
  return (
    <div className="mt-5 border-t border-hairline-soft">
      {avisos.length > 0 && (
        <Plegable titulo="Avisos" resumen={String(avisos.length)}>
          <Clausulas textos={avisos} />
        </Plegable>
      )}
      {condiciones.length > 0 && (
        <Plegable titulo="Condiciones" resumen={String(condiciones.length)}>
          <Clausulas textos={condiciones} />
        </Plegable>
      )}
      {garantia !== '' && (
        <Plegable titulo="Garantía" resumen={cuantoDuraLaGarantia(documento.garantiaMeses)}>
          <p className={`pl-6 ${TEXTO_CORRIDO} text-text-2`}>{garantia}</p>
        </Plegable>
      )}
    </div>
  );
}

function PieDelDocumento({ documento }: { documento: DocumentoDelPresupuesto }) {
  const partes = partesDelPie(documento.taller);
  return (
    <p className="mt-5 text-meta leading-relaxed text-pretty text-text-3">
      {partes.map((parte, indice) => (
        <Fragment key={`${String(indice)}-${parte}`}>
          {indice > 0 && ' · '}
          <span
            className={`${indice === 0 ? 'font-medium text-text-2' : ''} ${
              parte.length <= PARTE_QUE_NO_SE_CORTA ? 'whitespace-nowrap' : ''
            }`}
          >
            {parte}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

function CuerpoDelDocumento({
  documento,
  cuentas,
  validez,
  conEleccion,
  como,
}: {
  documento: DocumentoDelPresupuesto;
  cuentas: readonly CuentaDeUnValor[];
  validez: ValidezDelDocumento | null;
  conEleccion: boolean;
  como: LoQueSeMuestraDeLosValores;
}) {
  return (
    <>
      <ElTrabajo documento={documento} />
      <Detalle muebles={documento.muebles} />
      <Herrajes herrajes={documento.herrajes} />
      <ATenerEnCuenta renglones={documento.aTenerEnCuenta} />
      <Incluye renglones={documento.incluye} />
      <Valores documento={documento} cuentas={cuentas} conEleccion={conEleccion} como={como} />
      <FormaPlazoYValidez documento={documento} validez={validez} />
      <LoQueHayQueSaber documento={documento} />
    </>
  );
}

function Acciones({
  escribir,
  comoDejarLaSena,
  className = '',
}: {
  escribir: string | null;
  comoDejarLaSena: boolean;
  className?: string;
}) {
  if (escribir === null && !comoDejarLaSena) return null;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {escribir !== null && (
        <FilaDeAcciones>
          <a
            href={escribir}
            target="_blank"
            rel="noopener noreferrer"
            className={BOTON_QUE_ES_UN_ENLACE}
          >
            <Icono nombre="message-circle" tamano={18} />
            {ESCRIBIRLE_AL_TALLER}
          </a>
        </FilaDeAcciones>
      )}
      {comoDejarLaSena && (
        <a
          href={`#${ID_DE_COMO_PAGAR}`}
          className="flex min-h-tap items-center justify-center gap-1.5 text-body font-medium text-ink underline underline-offset-3 @min-[52rem]/apoyo:hidden"
        >
          {COMO_DEJAR_LA_SENA}
          <Icono nombre="arrow-down" tamano={16} />
        </a>
      )}
    </div>
  );
}

export interface ElPresupuestoProps {
  presupuesto: PresupuestoMandado;
  hoy: string;
  hayComoPagar: boolean;
}

export function ElPresupuesto({ presupuesto, hoy, hayComoPagar }: ElPresupuestoProps) {
  const titulo = useId();
  const vencido = presupuesto.vencio === null ? null : lineaDelVencido(presupuesto.vencio, hoy);
  const validez: ValidezDelDocumento = {
    texto: textoDeLaValidez(presupuesto, hoy),
    vencida: presupuesto.vencio !== null,
  };

  return (
    <section aria-labelledby={titulo} data-quieta className={`@container ${TARJETA}`}>
      <h2 id={titulo} className="text-section font-semibold">
        {EL_PRESUPUESTO}
      </h2>

      {vencido !== null && (
        <p className="mt-2 flex items-start gap-2 text-body leading-normal text-pretty">
          <Icono nombre="triangle-alert" tamano={17} className="mt-[3px] flex-none text-atencion" />
          <span>
            <span className="font-semibold text-atencion">{vencido.cuando}</span> {vencido.queHacer}
          </span>
        </p>
      )}

      <RotuloDelPresupuesto className="mt-3" {...rotuloDelMandado(presupuesto)} />

      {presupuesto.queCambio !== null && (
        <div className="mt-3 flex items-start gap-3 rounded-field bg-surface px-3.5 pt-3 pb-3.5">
          <MarcaDeRevision numero={presupuesto.revision} suelta />
          <div className="min-w-0">
            <h3 className="text-label leading-normal font-semibold text-text-2">
              {queCambioEnLaRevision(presupuesto.revision)}
            </h3>
            <p className={`mt-0.5 ${TEXTO_CORRIDO}`}>{presupuesto.queCambio}</p>
          </div>
        </div>
      )}

      <div className="mt-5">
        <CuerpoDelDocumento
          documento={presupuesto.documento}
          cuentas={presupuesto.cuentas}
          validez={validez}
          conEleccion={presupuesto.cuentas.length > 1}
          como={{ conLoPagado: true, acordado: null }}
        />
      </div>

      <Acciones
        className="mt-5"
        escribir={enlaceParaEscribirleAlTaller(presupuesto)}
        comoDejarLaSena={presupuesto.pideLaSena && hayComoPagar}
      />

      <PieDelDocumento documento={presupuesto.documento} />
    </section>
  );
}

export interface ElPresupuestoAceptadoProps {
  presupuesto: PresupuestoAceptado;
}

export function ElPresupuestoAceptado({ presupuesto }: ElPresupuestoAceptadoProps) {
  const titulo = useId();
  return (
    <section aria-labelledby={titulo} data-quieta className={`@container ${TARJETA}`}>
      <h2 id={titulo} className="text-section font-semibold">
        {EL_PRESUPUESTO_QUE_ACEPTASTE}
      </h2>

      <RotuloDelPresupuesto className="mt-3" {...rotuloDelAceptado(presupuesto)} />

      <BloquePlegable
        titulo={VER_EL_DETALLE}
        abiertoAlPrincipio={false}
        enTarjeta={false}
        enRenglon
        nivel="h3"
        claseDelTitulo="text-body font-semibold"
        className="mt-3.5 border-y border-hairline-soft"
      >
        <div className="pt-2 pb-5">
          <CuerpoDelDocumento
            documento={presupuesto.documento}
            cuentas={presupuesto.cuentas}
            validez={null}
            conEleccion={false}
            como={{ conLoPagado: false, acordado: presupuesto.acordado }}
          />
          <PieDelDocumento documento={presupuesto.documento} />
        </div>
      </BloquePlegable>
    </section>
  );
}
