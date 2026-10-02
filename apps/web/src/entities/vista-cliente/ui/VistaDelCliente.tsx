import {
  conceptoDeSiempre,
  conceptoEnPantalla,
  estaAprobada,
  hayComoPagar,
  loQueSePagoEnOtraMoneda,
  notaDelRelevamiento,
  textoDeLaProyeccion,
  type ArchivoDelCliente,
  type Moneda,
  type ProyeccionDeLaEntrega,
  type RelevamientoPorHacer,
  type SenaDeLaVista,
  type VistaAntesDelPresupuesto,
  type VistaAprobada,
  type VistaDelCliente as Vista,
  type VistaEsperandoLaSena,
} from '@maun/domain';
import { useId, useState } from 'react';

import { urlDelArchivo } from '@/shared/api';
import { useFormatosDelCliente, useMensajesDelCliente } from '@/shared/idioma-del-cliente';
import {
  ConSalida,
  Icono,
  MontoQueEntra,
  Pagina,
  PrincipalYApoyo,
  TarjetaConLamina,
  TrabajoEnEtapa,
  useVisor,
  VisorDeImagenes,
} from '@/shared/ui';

import { etapaDelDibujo } from '../model/etapa';
import type { CoordinacionConPedido, MandarLaEntrega } from '../model/mandar';
import { ID_DE_COMO_PAGAR } from '../model/presupuesto';
import {
  bajadaDeLaEntrega,
  claveDeLaEntrega,
  lineaDeLaSena,
  pieDeLosPagos,
  saldoDeLaVista,
  sinPagosTodavia,
  textoDeLaSenaAcordada,
  textoDeLoQueSePago,
  textoDelPrecioEnPesos,
  textoDelTitular,
  textoDelTotalPagado,
  valorDeLaEntrega,
  type Escritura,
} from '../model/textos';
import { CaminoDeHitos } from './CaminoDeHitos';
import { ComoPagar } from './ComoPagar';
import { CoordinarLaEntrega } from './CoordinarLaEntrega';
import { ElPresupuesto, ElPresupuestoAceptado } from './ElPresupuesto';
import { useEscritura } from './escritura';
import { VidrieraDelTaller } from './VidrieraDelTaller';

export interface VistaDelClienteProps {
  vista: Vista;
  hoy: string;
  alMandar?: MandarLaEntrega;
}

const TARJETA = 'rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5';

function coordinacionConPedido(vista: Vista): CoordinacionConPedido | null {
  if (!estaAprobada(vista) || vista.coordinacion === null) return null;
  return vista.coordinacion.situacion === 'sin-pedido' ? null : vista.coordinacion;
}

function esImagen(archivo: ArchivoDelCliente): boolean {
  return archivo.tipo === 'image/webp' || archivo.tipo === 'image/jpeg';
}

function tipoDelArchivo(archivo: ArchivoDelCliente, { t }: Escritura): string {
  if (esImagen(archivo)) return t.pagina.tipos.imagen;
  return archivo.tipo === 'application/pdf' ? t.pagina.tipos.pdf : t.pagina.tipos.otro;
}

function Cifra({
  clave,
  valor,
  grande = false,
  tono = '',
  importe = true,
  enPesos = null,
}: {
  clave: string;
  valor: string;
  grande?: boolean;
  tono?: string;
  importe?: boolean;
  enPesos?: string | null;
}) {
  return (
    <span className="flex flex-col gap-px">
      <span className="text-label text-text-2">{clave}</span>
      <span
        translate={importe ? 'no' : undefined}
        className={`font-semibold tabular-nums ${grande ? 'text-money-lg' : 'text-body-lg'} ${tono}`}
      >
        {valor}
      </span>
      {enPesos !== null && (
        <span className="text-label leading-normal text-pretty text-text-2">{enPesos}</span>
      )}
    </span>
  );
}

function Dato({
  clave,
  valor,
  fuerte = false,
  delTrabajo = false,
}: {
  clave: string;
  valor: string;
  fuerte?: boolean;
  delTrabajo?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3.5 border-t border-hairline-soft py-2.5 first:border-t-0">
      <dt className="flex-none text-label text-text-2">{clave}</dt>
      <dd
        translate={delTrabajo ? 'no' : undefined}
        className={`text-right text-body leading-normal ${fuerte ? 'font-semibold' : 'font-medium'}`}
      >
        {valor}
      </dd>
    </div>
  );
}

function Titular({ texto, bajada }: { texto: string; bajada: string }) {
  return (
    <div className="mt-3 flex flex-col gap-1">
      <span className="text-money-xl leading-tight font-semibold text-pretty">{texto}</span>
      {bajada !== '' && <span className="text-body text-text-2">{bajada}</span>}
    </div>
  );
}

function RelevamientoTecnico({ relevamiento }: { relevamiento: RelevamientoPorHacer }) {
  const titulo = useId();
  const m = useMensajesDelCliente();
  const f = useFormatosDelCliente();
  return (
    <section aria-labelledby={titulo} className="mt-3.5 border-t border-hairline-soft pt-3.5">
      <h3 id={titulo} className="text-body font-semibold">
        {relevamiento.titulo}
      </h3>
      <div className="mt-1.5 flex max-w-[560px] flex-col gap-2 text-body leading-relaxed text-pretty text-text-2">
        {relevamiento.lineas.map((linea) => (
          <p key={linea}>{linea}</p>
        ))}
        {relevamiento.valor !== null && (
          <p>{m.vista.pagina.valorDelRelevamiento(f.pesos(relevamiento.valor))}</p>
        )}
      </div>
    </section>
  );
}

function CifrasDeLaSena({ sena, moneda }: { sena: SenaDeLaVista; moneda: Moneda }) {
  const m = useMensajesDelCliente();
  const f = useFormatosDelCliente();
  switch (sena.situacion) {
    case 'sin-presupuesto':
      return null;
    case 'falta':
    case 'cubierta':
      return (
        <Cifra clave={m.vista.pagina.cifras.senaParaArrancar} valor={f.plata(sena.sena, moneda)} />
      );
  }
}

function EntradaAntesDelPresupuesto({
  vista,
  titular,
  bajada,
}: {
  vista: VistaAntesDelPresupuesto;
  titular: string;
  bajada: string;
}) {
  const m = useMensajesDelCliente();
  const f = useFormatosDelCliente();
  return (
    <>
      <Titular texto={titular} bajada={bajada} />
      {vista.pagado > 0 && (
        <>
          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 self-stretch border-t border-hairline-soft pt-3.5">
            <Cifra
              clave={m.vista.pagina.cifras.pagaste}
              valor={f.plata(vista.pagado, vista.moneda)}
            />
          </div>
          <p className="mt-2.5 text-body leading-relaxed text-text-2">
            {m.vista.pagina.quedaACuenta}
          </p>
        </>
      )}
    </>
  );
}

function lineaDeLaEntrada(vista: VistaEsperandoLaSena, escritura: Escritura): string {
  const { t, f, hoy } = escritura;
  if (vista.proyeccion.situacion === 'vencida') {
    return t.pagina.presupuestoVencido(f.fechaLarga(vista.proyeccion.vencio, hoy));
  }
  if (vista.opciones > 0) return t.pagina.miraLasOpciones(vista.opciones);
  return lineaDeLaSena(vista.sena, vista.pagado, vista.moneda, escritura);
}

function cifraDelPresupuesto(vista: VistaEsperandoLaSena, { t, f }: Escritura): string {
  if (vista.opciones > 0) return t.pagina.opciones(vista.opciones);
  return vista.presupuesto === null ? '—' : f.plata(vista.presupuesto, vista.moneda);
}

function EntradaEsperandoLaSena({
  vista,
  titular,
  bajada,
  hoy,
}: {
  vista: VistaEsperandoLaSena;
  titular: string;
  bajada: string;
  hoy: string;
}) {
  const escritura = useEscritura(hoy);
  const { t, f } = escritura;
  const linea = lineaDeLaEntrada(vista, escritura);
  return (
    <>
      <Titular texto={titular} bajada={bajada} />
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 self-stretch border-t border-hairline-soft pt-3.5">
        <Cifra
          clave={t.pagina.cifras.presupuesto}
          valor={cifraDelPresupuesto(vista, escritura)}
          grande
          importe={vista.opciones === 0}
          enPesos={
            vista.opciones === 0 ? textoDelPrecioEnPesos(vista.precioEnPesos, escritura) : null
          }
        />
        <CifrasDeLaSena sena={vista.sena} moneda={vista.moneda} />
        <Cifra clave={t.pagina.cifras.pagaste} valor={f.plata(vista.pagado, vista.moneda)} />
      </div>
      {linea !== '' && <p className="mt-2.5 text-body leading-relaxed text-text-2">{linea}</p>}
    </>
  );
}

function EntradaAprobada({
  vista,
  titular,
  hoy,
}: {
  vista: VistaAprobada;
  titular: string;
  hoy: string;
}) {
  const escritura = useEscritura(hoy);
  const { t, f } = escritura;
  const saldo = saldoDeLaVista(vista, escritura);
  const bajada = bajadaDeLaEntrega(vista.datos.entrega, escritura);
  const precio = vista.precio === null ? '—' : f.plata(vista.precio, vista.moneda);
  const precioEnPesos = textoDelPrecioEnPesos(vista.precioEnPesos, escritura);

  if (vista.foco === 'saldo') {
    return (
      <>
        <div className="mt-3 flex flex-col gap-0.5">
          <span className="text-body text-text-2">{saldo.etiqueta}</span>
          <MontoQueEntra tamano="destacado" className={`leading-tight font-semibold ${saldo.tono}`}>
            {saldo.texto}
          </MontoQueEntra>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 text-body">
          <span className="flex items-baseline gap-2">
            <span className="text-text-2">{t.pagina.cifras.vale}</span>
            <span translate="no" className="font-semibold tabular-nums">
              {precio}
            </span>
          </span>
          {precioEnPesos !== null && (
            <span className="w-full text-label leading-normal text-pretty text-text-2">
              {precioEnPesos}
            </span>
          )}
          <span className="flex items-baseline gap-2">
            <span className="text-text-2">{t.pagina.cifras.pagaste}</span>
            <span translate="no" className="font-semibold tabular-nums">
              {f.plata(vista.pagado, vista.moneda)}
            </span>
          </span>
        </div>
        <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1 self-stretch border-t border-hairline-soft pt-3.5">
          <span className="text-body-lg font-semibold">{titular}</span>
          {bajada !== '' && <span className="text-body text-text-2">{bajada}</span>}
        </div>
      </>
    );
  }

  return (
    <>
      <Titular texto={titular} bajada={bajada} />
      <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2 self-stretch border-t border-hairline-soft pt-3.5">
        <Cifra clave={saldo.etiqueta} valor={saldo.texto} grande tono={saldo.tono} />
        <Cifra clave={t.pagina.cifras.vale} valor={precio} enPesos={precioEnPesos} />
        <Cifra clave={t.pagina.cifras.pagaste} valor={f.plata(vista.pagado, vista.moneda)} />
      </div>
    </>
  );
}

function EntradaDeLaVista({ vista, bajada, hoy }: { vista: Vista; bajada: string; hoy: string }) {
  const escritura = useEscritura(hoy);
  const titular = textoDelTitular(vista.titular, escritura);
  switch (vista.etapa) {
    case 'antes-del-presupuesto':
      return <EntradaAntesDelPresupuesto vista={vista} titular={titular} bajada={bajada} />;
    case 'esperando-la-sena':
      return <EntradaEsperandoLaSena vista={vista} titular={titular} bajada={bajada} hoy={hoy} />;
    case 'aprobado':
    case 'fabricacion':
    case 'listo':
    case 'entregado':
    case 'pagado':
      return <EntradaAprobada vista={vista} titular={titular} hoy={hoy} />;
  }
}

function TarjetaDelTrabajo({ vista, hoy }: { vista: VistaAprobada; hoy: string }) {
  const escritura = useEscritura(hoy);
  const { t, f } = escritura;
  const { datos } = vista;
  const total = textoDelTotalPagado(vista, escritura);
  return (
    <section aria-label={t.pagina.datos.titulo}>
      <dl className="rounded-panel border border-hairline bg-paper px-4 py-1">
        <Dato
          clave={t.pagina.datos.direccion}
          valor={datos.direccion ?? t.pagina.datos.aConfirmar}
          delTrabajo={datos.direccion !== null}
        />
        <Dato
          clave={t.pagina.datos.empezamos}
          valor={datos.inicio === null ? t.pagina.datos.todaviaNo : f.fechaLarga(datos.inicio, hoy)}
          delTrabajo={datos.inicio !== null}
        />
        <Dato
          clave={claveDeLaEntrega(datos.entrega, escritura)}
          valor={valorDeLaEntrega(datos.entrega, escritura)}
          fuerte
        />
        <Dato
          clave={t.pagina.datos.sena}
          valor={textoDeLaSenaAcordada(datos.sena, vista.moneda, escritura)}
        />
        {total !== null && <Dato clave={t.pagina.datos.total} valor={total} />}
      </dl>
    </section>
  );
}

function ParaCuando({
  proyeccion,
  sena,
  hoy,
}: {
  proyeccion: ProyeccionDeLaEntrega;
  sena: SenaDeLaVista;
  hoy: string;
}) {
  const { t, f } = useEscritura(hoy);
  const [principal, ...resto] = textoDeLaProyeccion(
    proyeccion,
    { enUnaFrase: (fecha) => f.fechaEnUnaFrase(fecha, hoy) },
    sena.situacion,
    t.delDominio.proyeccion,
  );
  return (
    <section aria-label={t.pagina.paraCuando}>
      <div className={TARJETA}>
        <p className="text-body leading-relaxed font-medium text-pretty">{principal}</p>
        {resto.map((linea) => (
          <p key={linea} className="mt-1.5 text-label leading-relaxed text-text-2">
            {linea}
          </p>
        ))}
      </div>
    </section>
  );
}

function ApoyoDeLaVista({ vista, hoy }: { vista: Vista; hoy: string }) {
  switch (vista.etapa) {
    case 'antes-del-presupuesto':
      return <ComoPagar como={vista.comoPagar} hoy={hoy} id={ID_DE_COMO_PAGAR} />;
    case 'esperando-la-sena':
      return (
        <>
          {vista.proyeccion.situacion !== 'vencida' && (
            <ParaCuando proyeccion={vista.proyeccion} sena={vista.sena} hoy={hoy} />
          )}
          <ComoPagar como={vista.comoPagar} hoy={hoy} id={ID_DE_COMO_PAGAR} />
        </>
      );
    case 'aprobado':
    case 'fabricacion':
    case 'listo':
    case 'entregado':
    case 'pagado':
      return (
        <>
          <TarjetaDelTrabajo vista={vista} hoy={hoy} />
          <ComoPagar como={vista.comoPagar} hoy={hoy} id={ID_DE_COMO_PAGAR} />
        </>
      );
  }
}

function CierreDeLosPagos({ vista, hoy }: { vista: Vista; hoy: string }) {
  const escritura = useEscritura(hoy);
  const { t, f } = escritura;
  switch (vista.etapa) {
    case 'antes-del-presupuesto':
    case 'esperando-la-sena':
      return vista.pagos.length === 0 ? null : (
        <div className="flex min-h-12 items-baseline justify-between border-t border-ink py-3 text-body font-semibold">
          <span>{t.pagina.aCuentaDeLaSena}</span>
          <span translate="no" className="tabular-nums">
            {f.plata(vista.pagado, vista.moneda)}
          </span>
        </div>
      );
    case 'aprobado':
    case 'fabricacion':
    case 'listo':
    case 'entregado':
    case 'pagado': {
      const saldo = saldoDeLaVista(vista, escritura);
      return (
        <div className="flex min-h-12 items-baseline justify-between border-t border-ink py-3 text-body font-semibold">
          <span>{saldo.etiqueta}</span>
          <span translate="no" className={`tabular-nums ${saldo.tono}`}>
            {saldo.texto}
          </span>
        </div>
      );
    }
  }
}

export function VistaDelCliente({ vista, hoy, alMandar }: VistaDelClienteProps) {
  const escritura = useEscritura(hoy);
  const { t, f } = escritura;
  const [anuncio, setAnuncio] = useState('');
  const visor = useVisor();
  const coordinacion = coordinacionConPedido(vista);
  const nota = notaDelRelevamiento(
    vista,
    {
      larga: (fecha) => f.fechaLarga(fecha, hoy),
      corta: f.diaYMesCorto,
    },
    t.delDominio.nota,
  );

  const visuales = vista.archivos.filter(esImagen);
  const documentos = vista.archivos.filter((archivo) => !esImagen(archivo));

  const hayConQuePagar = hayComoPagar(vista.comoPagar);
  const textoSinPagos = sinPagosTodavia(vista, escritura);
  const textoDelPie = pieDeLosPagos(vista, hayConQuePagar, escritura);

  return (
    <Pagina quieta className="gap-3 md:gap-4">
      <header className="flex items-center justify-between gap-3 px-1">
        <span translate="no" className="min-w-0 font-display text-lema leading-tight">
          {vista.taller}
        </span>
      </header>

      <PrincipalYApoyo
        amplio
        separacion="gap-y-3 @min-[40rem]/apoyo:gap-y-4"
        apoyo={
          <div className="@container flex flex-col gap-3 md:gap-4">
            <ApoyoDeLaVista vista={vista} hoy={hoy} />

            <VidrieraDelTaller vidriera={vista.vidriera} taller={vista.taller} />

            <p data-fin-de-la-vista className="px-1 text-label leading-relaxed text-text-3">
              {t.pagina.finDeLaVista}
            </p>
          </div>
        }
      >
        <div className="flex flex-col gap-3 md:gap-4">
          <TarjetaConLamina
            como="section"
            aria-label={t.pagina.tuMueble}
            dibujo={<TrabajoEnEtapa etapa={etapaDelDibujo(vista)} />}
            lamina="[&>svg]:w-56 @min-[40rem]/con-lamina:[&>svg]:w-72"
            apilada
          >
            <span translate="no" className="text-body text-text-2">
              {vista.cliente}
            </span>
            <h1
              translate="no"
              className="font-display text-h1 leading-tight text-pretty lg:text-h1-lg"
            >
              {vista.titulo}
            </h1>

            <EntradaDeLaVista vista={vista} bajada={nota?.resumen ?? ''} hoy={hoy} />
          </TarjetaConLamina>

          {vista.etapa === 'esperando-la-sena' && vista.elPresupuesto !== null && (
            <ElPresupuesto
              presupuesto={vista.elPresupuesto}
              hoy={hoy}
              hayComoPagar={hayConQuePagar}
            />
          )}

          <p
            role="status"
            className={
              anuncio === ''
                ? 'sr-only'
                : 'flex items-start gap-2.5 rounded-panel border border-hairline bg-paper px-4 py-3 text-body leading-relaxed font-medium'
            }
          >
            {anuncio !== '' && (
              <span aria-hidden className="mt-0.5 flex-none text-hogar">
                <Icono nombre="circle-check" tamano={18} />
              </span>
            )}
            {anuncio}
          </p>

          {coordinacion !== null && (
            <CoordinarLaEntrega
              key={coordinacion.propuesta.id}
              coordinacion={coordinacion}
              hoy={hoy}
              alMandar={alMandar}
              alAnunciar={setAnuncio}
            />
          )}

          <section aria-label={t.pagina.enQueAnda} className={`@container ${TARJETA}`}>
            <h2 className="mb-3.5 text-section font-semibold">{t.pagina.elCaminoDeTuMueble}</h2>
            <CaminoDeHitos hitos={vista.hitos} nota={nota} hoy={hoy} />
            {vista.sigue !== '' && (
              <p className="mt-3.5 text-body leading-relaxed text-text-2">{vista.sigue}</p>
            )}
            {vista.etapa === 'antes-del-presupuesto' && vista.relevamientoPorHacer !== null && (
              <RelevamientoTecnico relevamiento={vista.relevamientoPorHacer} />
            )}
          </section>

          {vista.eventos.length > 0 && (
            <section aria-label={t.pagina.loQueFuePasando} className={TARJETA}>
              <h2 className="mb-1 text-section font-semibold">{t.pagina.loQueFuePasando}</h2>
              <ol className="list-none">
                {vista.eventos.map((evento, indice) => (
                  <li
                    key={evento.id}
                    className="grid grid-cols-[18px_1fr_auto] items-start gap-x-3"
                  >
                    <span aria-hidden className="flex h-full flex-col items-center">
                      <span
                        className={`h-4 w-px flex-none ${indice === 0 ? 'bg-transparent' : 'bg-hairline'}`}
                      />
                      <span
                        className={`size-2 flex-none rounded-pill ${indice === 0 ? 'bg-ink' : 'bg-border'}`}
                      />
                      <span
                        className={`w-px flex-1 ${indice === vista.eventos.length - 1 ? 'bg-transparent' : 'bg-hairline'}`}
                      />
                    </span>
                    <span className="min-w-0 py-3">
                      <span className="block text-body leading-normal text-pretty">
                        {evento.texto}
                      </span>
                      <span
                        translate="no"
                        className="mt-0.5 block text-label text-text-3 tabular-nums"
                      >
                        {f.fechaLarga(evento.fecha, hoy)}
                      </span>
                    </span>
                    <span
                      translate="no"
                      className="py-3 text-body font-semibold whitespace-nowrap text-hogar tabular-nums"
                    >
                      {evento.monto === null ? '' : f.plata(evento.monto, vista.moneda)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-label={t.pagina.loQuePagaste} className={TARJETA}>
            <h2 className="mb-1.5 text-section font-semibold">{t.pagina.loQuePagaste}</h2>
            {vista.pagos.length === 0 ? (
              textoSinPagos !== '' && (
                <p className="border-t border-hairline py-3.5 text-body leading-normal text-text-2">
                  {textoSinPagos}
                </p>
              )
            ) : (
              <ul className="list-none">
                {vista.pagos.map((pago) => {
                  const enOtraMoneda = loQueSePagoEnOtraMoneda(pago, vista.moneda);
                  return (
                    <li
                      key={pago.id}
                      className="flex min-h-12 items-baseline gap-3 border-t border-hairline-soft py-2.5"
                    >
                      <span className="min-w-0 flex-1">
                        {pago.concepto.trim() === '' ? (
                          <span className="block text-body font-medium">{t.pagina.pago}</span>
                        ) : conceptoDeSiempre(pago.concepto) !== null ? (
                          <span className="block text-body font-medium">
                            {conceptoEnPantalla(pago.concepto, t.conceptosDeSiempre)}
                          </span>
                        ) : (
                          <span translate="no" className="block text-body font-medium">
                            {pago.concepto}
                          </span>
                        )}
                        <span translate="no" className="block text-label text-text-3 tabular-nums">
                          {f.fechaLarga(pago.fecha, hoy)}
                        </span>
                        {enOtraMoneda !== null && (
                          <span className="block text-label leading-normal text-pretty text-text-2">
                            {textoDeLoQueSePago(enOtraMoneda, escritura)}
                          </span>
                        )}
                      </span>
                      <span
                        translate="no"
                        className="flex-none text-body font-semibold tabular-nums"
                      >
                        {f.plata(pago.monto, vista.moneda)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <CierreDeLosPagos vista={vista} hoy={hoy} />
            <p className="mt-2.5 text-label leading-normal text-text-3">{textoDelPie}</p>
          </section>

          {estaAprobada(vista) && vista.elPresupuesto !== null && (
            <ElPresupuestoAceptado presupuesto={vista.elPresupuesto} />
          )}

          <section aria-label={t.pagina.fotosYPlanos} className={TARJETA}>
            <div className="mb-3 flex items-baseline justify-between gap-2.5">
              <h2 className="text-section font-semibold">{t.pagina.fotosYPlanos}</h2>
              {vista.archivos.length > 0 && (
                <span className="text-label text-text-3">
                  {t.pagina.archivos(vista.archivos.length)}
                </span>
              )}
            </div>

            {vista.archivos.length === 0 ? (
              <div className="flex flex-col gap-2 rounded-field border border-dashed border-border px-4 py-5">
                <span className="text-body font-medium">{t.pagina.todaviaNoHayFotos}</span>
                <span className="text-body leading-normal text-text-2">
                  {t.pagina.acaVanAAparecer}
                </span>
              </div>
            ) : (
              <>
                {visuales.length > 0 && (
                  <ul className="grid list-none grid-cols-2 gap-2.5">
                    {visuales.map((archivo) => (
                      <li key={archivo.id}>
                        <button
                          type="button"
                          aria-label={t.pagina.ver(archivo.nombre)}
                          onClick={(evento) => {
                            visor.abrir(archivo.id, evento.currentTarget);
                          }}
                          className="flex w-full flex-col overflow-hidden rounded-field border border-hairline text-left hover:border-ink"
                        >
                          <img
                            src={urlDelArchivo(archivo.rutaMini)}
                            alt=""
                            width={archivo.ancho ?? undefined}
                            height={archivo.alto ?? undefined}
                            loading="lazy"
                            className="aspect-4/3 w-full bg-surface object-cover"
                          />
                          <span className="flex items-center gap-2 border-t border-hairline-soft px-2.5 py-2">
                            <Icono nombre="image" tamano={15} />
                            <span
                              translate="no"
                              className="min-w-0 flex-1 truncate text-label leading-normal"
                            >
                              {archivo.nombre}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {documentos.length > 0 && (
                  <ul className={`list-none ${visuales.length > 0 ? 'mt-3.5' : ''}`}>
                    {documentos.map((archivo) => (
                      <li key={archivo.id}>
                        <a
                          href={urlDelArchivo(archivo.ruta)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-14 items-center gap-3 border-t border-hairline-soft py-2.5 no-underline"
                        >
                          <span className="flex size-9.5 flex-none items-center justify-center rounded-field bg-surface">
                            <Icono nombre="file-text" tamano={18} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span translate="no" className="block truncate text-body font-medium">
                              {archivo.nombre}
                            </span>
                            <span className="block text-meta text-text-3">
                              {tipoDelArchivo(archivo, escritura)}
                            </span>
                          </span>
                          <Icono nombre="arrow-up-right" tamano={16} />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            <ConSalida valor={visor.abierta}>
              {(inicial) => (
                <VisorDeImagenes
                  imagenes={visuales.map((archivo) => ({
                    id: archivo.id,
                    nombre: archivo.nombre,
                    url: urlDelArchivo(archivo.ruta),
                    ancho: archivo.ancho,
                    alto: archivo.alto,
                  }))}
                  inicial={inicial}
                  alCerrar={visor.cerrar}
                />
              )}
            </ConSalida>
          </section>
        </div>
      </PrincipalYApoyo>
    </Pagina>
  );
}
