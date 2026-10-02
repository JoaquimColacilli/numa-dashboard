import {
  type CuentaDeUnValor,
  type DocumentoDelPresupuesto,
  type Moneda,
  type PresupuestoAceptado,
  type PresupuestoMandado,
  type TextoConTitulo,
} from '@maun/domain';
import { Fragment, useId, useMemo, useState, type ReactNode } from 'react';

import {
  ConElIdiomaDelCliente,
  useFormatosDelCliente,
  useMensajesDelCliente,
} from '@/shared/idioma-del-cliente';
import {
  IDIOMA_DE_LA_LEYENDA,
  sePuedenCompartirArchivos,
  usePdfDelPresupuesto,
  type PdfDelPresupuesto,
} from '@/shared/pdf';
import {
  BloquePlegable,
  Button,
  FilaDeAcciones,
  Globo,
  Icono,
  LineaDePuntos,
  MarcaDeRevision,
  RotuloDelPresupuesto,
} from '@/shared/ui';

import {
  enlaceParaEscribirleAlTaller,
  ID_DE_COMO_PAGAR,
  lineaDelVencido,
  partesDelPie,
  pdfDelAceptado,
  pdfDelBorrador,
  pdfDelMandado,
  rotuloDelAceptado,
  rotuloDelMandado,
  textoDeLaValidez,
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
          <span translate="no" className="min-w-0 text-pretty">
            {renglon}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ElTrabajo({ documento }: { documento: DocumentoDelPresupuesto }) {
  return (
    <div>
      <h3 translate="no" className="text-body-lg leading-normal font-semibold text-pretty">
        {documento.titulo}
      </h3>
      {documento.obra !== '' && (
        <p className="mt-0.5 flex items-start gap-1.5 text-label leading-normal text-text-2">
          <Icono nombre="map-pin" tamano={14} className="mt-[3px] flex-none" />
          <span translate="no" className="min-w-0">
            {documento.obra}
          </span>
        </p>
      )}
      {documento.descripcion !== '' && (
        <p translate="no" className={`mt-3 ${TEXTO_CORRIDO} text-text-2`}>
          {documento.descripcion}
        </p>
      )}
    </div>
  );
}

function Detalle({ muebles }: { muebles: DocumentoDelPresupuesto['muebles'] }) {
  const m = useMensajesDelCliente().presupuesto;
  if (muebles.length === 0) return null;
  return (
    <div className={BLOQUE}>
      <TituloDeBloque>{m.secciones.detalle}</TituloDeBloque>
      <ol className="mt-3.5 flex flex-col gap-5">
        {muebles.map((mueble, indice) => (
          <li
            key={`${String(indice)}-${mueble.nombre}`}
            className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3"
          >
            <Globo numero={indice + 1} className="-mt-px" />
            <div translate="no" className="min-w-0">
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
  const m = useMensajesDelCliente().presupuesto;
  if (herrajes.length === 0) return null;
  return (
    <div className={BLOQUE}>
      <TituloDeBloque>{m.secciones.herrajes}</TituloDeBloque>
      <div className="mt-3">
        <ListaConPuntos renglones={herrajes} />
      </div>
    </div>
  );
}

function ATenerEnCuenta({ renglones }: { renglones: readonly string[] }) {
  const m = useMensajesDelCliente().presupuesto;
  if (renglones.length === 0) return null;
  return (
    <div className="mt-5 rounded-field bg-surface px-3.5 pt-3 pb-3.5">
      <TituloDeBloque>{m.secciones.aTenerEnCuenta}</TituloDeBloque>
      <div className="mt-2.5">
        <ListaConPuntos renglones={renglones} />
      </div>
    </div>
  );
}

function Incluye({ renglones }: { renglones: readonly string[] }) {
  const m = useMensajesDelCliente().presupuesto;
  if (renglones.length === 0) return null;
  return (
    <div className={BLOQUE}>
      <TituloDeBloque>{m.secciones.incluye}</TituloDeBloque>
      <ul className="mt-3 flex flex-col gap-1.5">
        {renglones.map((renglon, indice) => (
          <li
            key={`${String(indice)}-${renglon}`}
            className="flex gap-2.5 text-body leading-normal"
          >
            <Icono nombre="check" tamano={16} grosor={2} className="mt-[3px] flex-none" />
            <span translate="no" className="min-w-0 text-pretty">
              {renglon}
            </span>
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

function Monto({ children }: { children: string }) {
  return <span translate="no">{children}</span>;
}

function CuentasDeUnValor({
  cuenta,
  senaBp,
  como,
  plata,
}: {
  cuenta: CuentaDeUnValor<Moneda>;
  senaBp: number;
  como: LoQueSeMuestraDeLosValores;
  plata: (importe: number) => string;
}) {
  const m = useMensajesDelCliente().presupuesto.valores;
  const f = useFormatosDelCliente();
  const pago = como.conLoPagado && cuenta.pagado > 0;
  return (
    <div className="flex flex-col text-body leading-normal">
      <LineaDePuntos
        className="pb-1"
        izquierda={<span className="font-semibold">{m.total}</span>}
        derecha={
          <span translate="no" className="text-money-lg leading-tight font-semibold">
            {plata(cuenta.total)}
          </span>
        }
      />
      {como.acordado !== null && (
        <p className="pb-1 text-label leading-normal font-semibold">
          {m.acordado(plata(como.acordado))}
        </p>
      )}
      <LineaDePuntos
        className="py-1"
        izquierda={m.sena(f.porcentaje(senaBp))}
        derecha={<Monto>{plata(cuenta.sena)}</Monto>}
      />
      {pago && (
        <>
          <LineaDePuntos
            className="py-1"
            izquierda={m.yaPagaste}
            derecha={<Monto>{plata(cuenta.pagado)}</Monto>}
          />
          <div className="mt-1 border-t border-ink pt-1.5">
            {cuenta.faltaParaLaSena > 0 ? (
              <LineaDePuntos
                className="py-1 font-semibold"
                izquierda={m.teFaltaParaLaSena}
                derecha={<Monto>{plata(cuenta.faltaParaLaSena)}</Monto>}
              />
            ) : (
              <p className="flex items-center gap-1.5 py-1 font-semibold text-hogar">
                <Icono nombre="circle-check" tamano={16} className="flex-none" />
                {m.laSenaEstaCubierta}
              </p>
            )}
          </div>
        </>
      )}
      {como.conLoPagado && (
        <LineaDePuntos
          className="py-1 text-text-2"
          izquierda={m.despuesElSaldo}
          derecha={<Monto>{plata(cuenta.saldo)}</Monto>}
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
  cuentas: readonly CuentaDeUnValor<Moneda>[];
  conEleccion: boolean;
  como: LoQueSeMuestraDeLosValores;
}) {
  const m = useMensajesDelCliente().presupuesto;
  const plata = useFormatosDelCliente().pesos;
  const [unica] = cuentas;
  if (unica === undefined) return null;
  if (documento.valores?.tipo !== 'opciones') {
    return (
      <div className={BLOQUE}>
        <TituloDeBloque>{m.secciones.valores}</TituloDeBloque>
        <div className="mt-3">
          <CuentasDeUnValor cuenta={unica} senaBp={documento.senaBp} como={como} plata={plata} />
        </div>
      </div>
    );
  }
  if (cuentas.length === 1) {
    return (
      <div className={BLOQUE}>
        <TituloDeBloque>{m.secciones.valores}</TituloDeBloque>
        <h4 className="mt-3 text-body leading-normal font-semibold">
          {m.valores.opcion(unica.letra ?? '')}
        </h4>
        {unica.descripcion !== '' && (
          <p
            translate="no"
            className="mt-0.5 max-w-[560px] text-label leading-relaxed text-pretty text-text-2"
          >
            {unica.descripcion}
          </p>
        )}
        <div className="mt-3">
          <CuentasDeUnValor cuenta={unica} senaBp={documento.senaBp} como={como} plata={plata} />
        </div>
      </div>
    );
  }
  return (
    <div className={`${BLOQUE} @container/valores`}>
      <TituloDeBloque>{m.secciones.valores}</TituloDeBloque>
      <ul className="mt-3 grid grid-cols-1 gap-3 @min-[34rem]/valores:grid-cols-2">
        {cuentas.map((cuenta) => (
          <li
            key={cuenta.id ?? cuenta.letra}
            className="flex flex-col rounded-field border border-hairline px-3.5 pt-3 pb-2.5"
          >
            <h4 className="text-body leading-normal font-semibold">
              {m.valores.opcion(cuenta.letra ?? '')}
            </h4>
            {cuenta.descripcion !== '' && (
              <p
                translate="no"
                className="mt-0.5 text-label leading-relaxed text-pretty text-text-2"
              >
                {cuenta.descripcion}
              </p>
            )}
            <div className="mt-auto pt-3">
              <CuentasDeUnValor
                cuenta={cuenta}
                senaBp={documento.senaBp}
                como={como}
                plata={plata}
              />
            </div>
          </li>
        ))}
      </ul>
      {conEleccion && (
        <p className="mt-3 text-body leading-normal text-text-2">{m.valores.elegiLaOpcion}</p>
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
  const m = useMensajesDelCliente().presupuesto;
  return (
    <dl className={`${BLOQUE} flex flex-col gap-3`}>
      {documento.formaDePago !== null && (
        <Definicion clave={m.definiciones.formaDePago}>
          <span translate="no">{documento.formaDePago}</span>
        </Definicion>
      )}
      <Definicion clave={m.definiciones.plazo}>
        {m.diasHabiles(documento.plazoDeFabricacion)}
      </Definicion>
      {validez !== null && (
        <Definicion clave={m.definiciones.validez}>
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
          <div translate="no" className={TEXTO_CORRIDO}>
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
  const m = useMensajesDelCliente().presupuesto;
  const { avisos, condiciones, garantia } = documento;
  if (avisos.length === 0 && condiciones.length === 0 && garantia === '') return null;
  return (
    <div className="mt-5 border-t border-hairline-soft">
      {avisos.length > 0 && (
        <Plegable titulo={m.secciones.avisos} resumen={String(avisos.length)}>
          <Clausulas textos={avisos} />
        </Plegable>
      )}
      {condiciones.length > 0 && (
        <Plegable titulo={m.secciones.condiciones} resumen={String(condiciones.length)}>
          <Clausulas textos={condiciones} />
        </Plegable>
      )}
      {garantia !== '' && (
        <Plegable titulo={m.secciones.garantia} resumen={m.meses(documento.garantiaMeses)}>
          <p translate="no" className={`pl-6 ${TEXTO_CORRIDO} text-text-2`}>
            {garantia}
          </p>
        </Plegable>
      )}
    </div>
  );
}

function PieDelDocumento({ documento }: { documento: DocumentoDelPresupuesto }) {
  const m = useMensajesDelCliente();
  const partes = partesDelPie(documento.taller, m);
  return (
    <p className="mt-5 text-meta leading-relaxed text-pretty text-text-3">
      {partes.map((parte, indice) => (
        <Fragment key={`${String(indice)}-${parte.texto}`}>
          {indice > 0 && ' · '}
          <span
            translate={parte.tipo === 'aclaracion' ? undefined : 'no'}
            lang={parte.tipo === 'leyenda' ? IDIOMA_DE_LA_LEYENDA : undefined}
            className={`${parte.tipo === 'dato' ? '' : 'font-medium text-text-2'} ${
              parte.texto.length <= PARTE_QUE_NO_SE_CORTA ? 'whitespace-nowrap' : ''
            }`}
          >
            {parte.texto}
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
  cuentas: readonly CuentaDeUnValor<Moneda>[];
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
  pdf,
  conCompartir,
  escribir,
  comoDejarLaSena,
  className = '',
}: {
  pdf: PdfDelPresupuesto;
  conCompartir: boolean;
  escribir: string | null;
  comoDejarLaSena: boolean;
  className?: string;
}) {
  const { acciones, pdf: textos } = useMensajesDelCliente().presupuesto;
  const [compartible] = useState(() => conCompartir && sePuedenCompartirArchivos());
  const preparando = pdf.estado === 'preparando';
  const descargar = (
    <Button variant="secundario" onClick={pdf.descargar}>
      <Icono nombre="download" tamano={18} />
      {preparando && pdf.esperando === 'descargar' ? textos.preparando : acciones.descargar}
    </Button>
  );
  const compartir = compartible ? (
    <Button variant="secundario" onClick={pdf.compartir}>
      <Icono nombre="share-2" tamano={18} />
      {preparando && pdf.esperando === 'compartir'
        ? textos.preparando
        : pdf.estado === 'listo'
          ? acciones.compartirElPdf
          : acciones.compartir}
    </Button>
  ) : null;
  const aEscribir =
    escribir === null ? null : (
      <a
        href={escribir}
        target="_blank"
        rel="noopener noreferrer"
        className={BOTON_QUE_ES_UN_ENLACE}
      >
        <Icono nombre="message-circle" tamano={18} />
        {acciones.escribirle}
      </a>
    );
  const sonTres = compartir !== null && aEscribir !== null;
  const estado = preparando
    ? textos.preparando
    : pdf.estado === 'listo' && pdf.esperando === null
      ? textos.listo
      : '';
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <FilaDeAcciones>
        {descargar}
        {compartir}
        {!sonTres && aEscribir}
      </FilaDeAcciones>
      {sonTres && <FilaDeAcciones>{aEscribir}</FilaDeAcciones>}
      <p role="status" className="sr-only">
        {estado}
      </p>
      {pdf.estado === 'fallo' && (
        <p role="alert" className="text-label leading-normal text-alerta">
          {textos.noSePudo}
        </p>
      )}
      {comoDejarLaSena && (
        <a
          href={`#${ID_DE_COMO_PAGAR}`}
          className="flex min-h-tap items-center justify-center gap-1.5 text-body font-medium text-ink underline underline-offset-3 @min-[52rem]/apoyo:hidden"
        >
          {acciones.comoDejarLaSena}
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
  borrador?: boolean;
}

function ElPresupuestoMandado({
  presupuesto,
  hoy,
  hayComoPagar,
  borrador = false,
}: ElPresupuestoProps) {
  const m = useMensajesDelCliente();
  const f = useFormatosDelCliente();
  const titulo = useId();
  const pdf = usePdfDelPresupuesto(
    useMemo(
      () => (borrador ? pdfDelBorrador(presupuesto) : pdfDelMandado(presupuesto)),
      [presupuesto, borrador],
    ),
    { alAbrir: borrador },
  );
  const vencido =
    presupuesto.vencio === null ? null : lineaDelVencido(presupuesto.vencio, hoy, m, f);
  const validez: ValidezDelDocumento = {
    texto: textoDeLaValidez(presupuesto, hoy, m, f),
    vencida: presupuesto.vencio !== null,
  };
  const rotulo = rotuloDelMandado(presupuesto);

  return (
    <section aria-labelledby={titulo} data-quieta className={`@container ${TARJETA}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={titulo} className="text-section font-semibold">
          {m.presupuesto.titulo}
        </h2>
        {borrador && (
          <span className="rounded-pill border border-border px-2 py-0.5 text-badge font-semibold text-text-2">
            {m.presupuesto.borrador}
          </span>
        )}
      </div>

      {vencido !== null && (
        <p className="mt-2 flex items-start gap-2 text-body leading-normal text-pretty">
          <Icono nombre="triangle-alert" tamano={17} className="mt-[3px] flex-none text-atencion" />
          <span>
            <span className="font-semibold text-atencion">{vencido.cuando}</span> {vencido.queHacer}
          </span>
        </p>
      )}

      <RotuloDelPresupuesto
        className="mt-3"
        {...rotulo}
        numero={borrador && rotulo.numero === '' ? null : rotulo.numero}
        emitido={borrador ? null : rotulo.emitido}
      />

      {presupuesto.queCambio !== null && (
        <div className="mt-3 flex items-start gap-3 rounded-field bg-surface px-3.5 pt-3 pb-3.5">
          <MarcaDeRevision numero={presupuesto.revision} suelta />
          <div className="min-w-0">
            <h3 className="text-label leading-normal font-semibold text-text-2">
              {m.presupuesto.queCambio(presupuesto.revision)}
            </h3>
            <p translate="no" className={`mt-0.5 ${TEXTO_CORRIDO}`}>
              {presupuesto.queCambio}
            </p>
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
        pdf={pdf}
        conCompartir={!borrador}
        escribir={borrador ? null : enlaceParaEscribirleAlTaller(presupuesto, m)}
        comoDejarLaSena={!borrador && presupuesto.pideLaSena && hayComoPagar}
      />

      <PieDelDocumento documento={presupuesto.documento} />
    </section>
  );
}

export function ElPresupuesto(props: ElPresupuestoProps) {
  return (
    <ConElIdiomaDelCliente idioma={props.presupuesto.idioma}>
      <ElPresupuestoMandado {...props} />
    </ConElIdiomaDelCliente>
  );
}

export interface ElPresupuestoAceptadoProps {
  presupuesto: PresupuestoAceptado;
}

function ElPresupuestoQueAcepto({ presupuesto }: ElPresupuestoAceptadoProps) {
  const m = useMensajesDelCliente().presupuesto;
  const titulo = useId();
  const pdf = usePdfDelPresupuesto(useMemo(() => pdfDelAceptado(presupuesto), [presupuesto]));
  return (
    <section aria-labelledby={titulo} data-quieta className={`@container ${TARJETA}`}>
      <h2 id={titulo} className="text-section font-semibold">
        {m.elQueAceptaste}
      </h2>

      <RotuloDelPresupuesto className="mt-3" {...rotuloDelAceptado(presupuesto)} />

      <BloquePlegable
        titulo={m.verElDetalle}
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

      <Acciones
        className="mt-4"
        pdf={pdf}
        conCompartir={false}
        escribir={null}
        comoDejarLaSena={false}
      />
    </section>
  );
}

export function ElPresupuestoAceptado(props: ElPresupuestoAceptadoProps) {
  return (
    <ConElIdiomaDelCliente idioma={props.presupuesto.idioma}>
      <ElPresupuestoQueAcepto {...props} />
    </ConElIdiomaDelCliente>
  );
}
