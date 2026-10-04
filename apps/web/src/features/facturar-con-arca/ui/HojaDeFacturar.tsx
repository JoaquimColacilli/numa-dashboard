import { LARGO_MAXIMO_DEL_DETALLE } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import {
  CapsulaDePrueba,
  LoQueFaltaParaFacturar,
  MUTACION_DE_LA_FACTURA,
  usePedidosEnLaCola,
} from '@/entities/factura';
import { useReplicaDelTaller } from '@/entities/replica';
import { useMensajes } from '@/shared/idioma';
import {
  enPesosEnteros,
  fechaCorta,
  fechaCortaSinAnio,
  formatearPesos,
  hoyEnElTaller,
  metaDeAvisos,
  useAnchoDePantalla,
  useHaySenal,
  uuidv7,
} from '@/shared/lib';
import {
  Button,
  Campo,
  FilaDeAcciones,
  Hoja,
  Icono,
  Recuadro,
  RotuloEnCasillas,
} from '@/shared/ui';

import { datosDeLaHojaDeFacturar } from '../model/hoja';
import { Bloque, CuerpoDeLaHoja, Nota, PieDeLaHoja } from './piezas';

export interface HojaDeFacturarProps {
  pagoId: string;
  alCerrar: () => void;
  alEditarElCliente?: ((clienteId: string) => void) | undefined;
}

export function HojaDeFacturar({ pagoId, alCerrar, alEditarElCliente }: HojaDeFacturarProps) {
  const m = useMensajes();
  const t = m.facturacion.facturar;
  const replica = useReplicaDelTaller();
  const enLaCola = usePedidosEnLaCola();
  const haySenal = useHaySenal();
  const enCelular = useAnchoDePantalla() === 'movil';
  const hoy = hoyEnElTaller();
  const datos = datosDeLaHojaDeFacturar(replica, pagoId, hoy, enLaCola);
  const [detalle, setDetalle] = useState(datos?.detalle ?? '');
  const [intento, setIntento] = useState(false);
  const pedir = useMutation({
    ...MUTACION_DE_LA_FACTURA,
    meta: metaDeAvisos('facturaPedida', { sujeto: datos?.receptor.nombre ?? '' }),
  });

  if (datos === null) return null;

  const faltaElDetalle = detalle.trim() === '';
  const puedeEmitir = datos.faltas.length === 0 && !datos.yaTieneFactura;
  const { receptor } = datos;
  const linea = [
    m.cliente.condiciones[receptor.condicion].etiqueta,
    receptor.cuit !== null
      ? t.cuit(receptor.cuit)
      : receptor.condicion === 'consumidor_final'
        ? null
        : t.sinCuit,
    receptor.dni === null ? null : t.dni(receptor.dni),
  ]
    .filter((parte) => parte !== null)
    .join(' · ');

  function emitir(): void {
    setIntento(true);
    if (faltaElDetalle || datos === null) return;
    pedir.mutate({
      pedido: { id: uuidv7(), pagoId: datos.pago.id, detalle: detalle.trim() },
      proyectoId: datos.proyecto.id,
    });
    alCerrar();
  }

  return (
    <Hoja
      titulo={t.titulo}
      marca={datos.prueba ? <CapsulaDePrueba /> : undefined}
      alCerrar={alCerrar}
      desdeAbajo={enCelular}
      conCambios={detalle !== datos.detalle}
    >
      {(pedirCierre) => (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <CuerpoDeLaHoja>
            <RotuloEnCasillas
              etiqueta={t.rotulo}
              casillas={[
                { titulo: t.comprobante, valor: t.facturaC },
                { titulo: t.puntoDeVenta, valor: datos.puntoDeVenta },
                { titulo: t.numero, valor: t.elQueSiga },
                { titulo: t.fecha, valor: t.hoy(fechaCortaSinAnio(hoy)) },
              ]}
            />
            <Bloque etiqueta={t.para}>
              <span translate="no" className="text-body font-semibold">
                {receptor.nombre}
              </span>
              <span className="text-label text-text-2">{linea}</span>
            </Bloque>
            <Campo
              etiqueta={t.detalle}
              value={detalle}
              maxLength={LARGO_MAXIMO_DEL_DETALLE}
              ayuda={t.ayudaDelDetalle}
              error={intento && faltaElDetalle ? t.faltaElDetalle : undefined}
              onChange={(evento) => {
                setDetalle(evento.target.value);
              }}
            />
            <Bloque etiqueta={t.importe}>
              <span translate="no" className="text-h1 leading-tight font-semibold tabular-nums">
                {formatearPesos(datos.importe)}
              </span>
              <span className="text-meta text-text-3">
                {t.queFacturas(m.facturacion.concepto.opciones[datos.concepto])}
              </span>
            </Bloque>
            {datos.prueba && <Recuadro tono="atencion">{t.modoPrueba}</Recuadro>}
            {datos.cobroViejo !== null && (
              <Nota icono="calendar">
                {t.conFechaDeHoy(
                  datos.cobroViejo.slice(0, 4) === hoy.slice(0, 4)
                    ? fechaCortaSinAnio(datos.cobroViejo)
                    : fechaCorta(datos.cobroViejo),
                )}
              </Nota>
            )}
            {datos.tope !== null && (
              <>
                <Nota icono="info">
                  {t.conEstaFactura(
                    formatearPesos(datos.tope.llevas),
                    datos.tope.categoria,
                    formatearPesos(enPesosEnteros(datos.tope.tope)),
                  )}
                </Nota>
                {datos.tope.nivel === 'cerca' && (
                  <Recuadro tono="atencion">
                    {m.facturacion.monotributo.cerca(datos.tope.categoria)}
                  </Recuadro>
                )}
                {datos.tope.nivel === 'pasado' && (
                  <Recuadro tono="alerta">
                    {m.facturacion.monotributo.pasado(datos.tope.categoria)}
                  </Recuadro>
                )}
                {datos.tope.nivel === 'fuera' && (
                  <Recuadro tono="alerta">{m.facturacion.monotributo.fuera}</Recuadro>
                )}
              </>
            )}
            {datos.faltas.length > 0 && (
              <section aria-label={t.loQueFalta}>
                <LoQueFaltaParaFacturar
                  faltas={datos.faltas}
                  cliente={{ id: datos.receptor.clienteId, nombre: datos.receptor.nombre }}
                  alEditarElCliente={alEditarElCliente}
                />
              </section>
            )}
            {datos.yaTieneFactura && (
              <Recuadro tono="alerta">{m.api.rechazos.MN042.factura.titulo}</Recuadro>
            )}
            <Nota icono="file-text">{t.noSeBorra}</Nota>
          </CuerpoDeLaHoja>
          <PieDeLaHoja>
            <div className="flex flex-col gap-2">
              {!haySenal && (
                <p className="flex items-center gap-1.5 text-meta text-text-3">
                  <Icono nombre="cloud-off" tamano={14} className="flex-none" />
                  {t.sinSenal}
                </p>
              )}
              <FilaDeAcciones>
                <Button variant="secundario" onClick={pedirCierre}>
                  {t.cancelar}
                </Button>
                <Button disabled={!puedeEmitir} onClick={emitir}>
                  {t.emitir(formatearPesos(datos.importe))}
                </Button>
              </FilaDeAcciones>
            </div>
          </PieDeLaHoja>
        </div>
      )}
    </Hoja>
  );
}
