import {
  enlaceDelQr,
  NOMBRE_DE_LA_CONDICION_DEL_RECEPTOR,
  numeroDelComprobante,
} from '@maun/domain';
import { Document, Page, Path, Svg, Text, View, type DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

import { mediodiaEnElTaller } from '../armado';
import { ESTILOS as s } from '../estilos';
import { COLOR } from '../medidas';
import type { FacturaEnPdf, ReceptorEnPdf } from '../tipos';
import {
  documentoDelReceptorEnPdf,
  fechaDeLaFactura,
  IDIOMA_DE_LA_FACTURA,
  pesosDeLaFactura,
  tituloDeLaFactura,
} from './armado';
import { ESTILOS_DE_LA_FACTURA as f, LADO_DEL_QR } from './estilos';
import { trazoDelQr } from './qr';
import { TEXTOS_DE_LA_FACTURA as t } from './textos';

function Encabezado({ factura }: { factura: FacturaEnPdf }) {
  const { emisor } = factura;
  const lineas = [emisor.razonSocial, emisor.domicilio, t.responsableMonotributo].filter(
    (linea) => linea !== '',
  );
  const datos = [
    `${t.fechaDeEmision} ${fechaDeLaFactura(factura.fecha)}`,
    t.cuit(emisor.cuit),
    emisor.ingresosBrutos === '' ? '' : t.ingresosBrutos(emisor.ingresosBrutos),
    emisor.inicioDeActividades === null
      ? ''
      : t.inicioDeActividades(fechaDeLaFactura(emisor.inicioDeActividades)),
  ].filter((dato) => dato !== '');
  return (
    <View style={s.encabezado}>
      <View style={s.emisor}>
        <Text style={s.marca}>{emisor.nombreDelTaller}</Text>
        <View style={s.datosDelTaller}>
          {lineas.map((linea) => (
            <Text key={linea} style={s.datoDelTaller}>
              {linea}
            </Text>
          ))}
        </View>
      </View>

      <View style={s.centro}>
        <View style={s.equis}>
          <Text style={s.equisLetra}>{t.letra}</Text>
        </View>
        <Text style={f.codigo}>{t.codigo[factura.tipo]}</Text>
      </View>

      <View style={s.derecha}>
        <View style={s.rotulo}>
          <View style={s.rotuloArriba}>
            <Text style={s.rotuloTipo}>{t.tipo[factura.tipo]}</Text>
            <Text style={s.numero}>
              {t.numero(numeroDelComprobante(factura.puntoDeVenta, factura.numero))}
            </Text>
          </View>
          <View style={f.rotuloDatos}>
            {datos.map((dato) => (
              <Text key={dato} style={f.rotuloDato}>
                {dato}
              </Text>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function Receptor({ receptor }: { receptor: ReceptorEnPdf }) {
  const casillas = [
    { titulo: t.cliente, valor: receptor.nombre, peso: 1.3 },
    {
      titulo: t.condicionFrenteAlIva,
      valor: NOMBRE_DE_LA_CONDICION_DEL_RECEPTOR[receptor.condicion],
      peso: 1.1,
    },
    { titulo: t.documento, valor: documentoDelReceptorEnPdf(receptor), peso: 1 },
    {
      titulo: t.domicilio,
      valor: receptor.domicilio === '' ? t.sinDato : receptor.domicilio,
      peso: 1.4,
    },
  ];
  return (
    <View style={f.receptor} wrap={false}>
      {casillas.map((casilla, indice) => (
        <View
          key={casilla.titulo}
          style={[
            s.datoDelTrabajo,
            { flexGrow: casilla.peso },
            indice > 0 ? s.datoDelTrabajoConFilete : {},
          ]}
        >
          <Text style={s.casillaTitulo}>{casilla.titulo}</Text>
          <Text style={s.datoDelTrabajoValor}>{casilla.valor}</Text>
        </View>
      ))}
    </View>
  );
}

function Detalle({ factura }: { factura: FacturaEnPdf }) {
  const importe = pesosDeLaFactura(factura.importe);
  return (
    <View style={f.tabla} wrap={false}>
      <View style={f.tablaFila}>
        <View style={f.colDescripcion}>
          <Text style={s.rotuloChico}>{t.descripcion}</Text>
        </View>
        <View style={f.colCantidad}>
          <Text style={s.rotuloChico}>{t.cantidad}</Text>
        </View>
        <View style={f.colPrecio}>
          <Text style={s.rotuloChico}>{t.precioUnitario}</Text>
        </View>
        <View style={f.colImporte}>
          <Text style={s.rotuloChico}>{t.importe}</Text>
        </View>
      </View>
      <View style={[f.tablaFila, f.tablaFilaConFilete]}>
        <View style={f.colDescripcion}>
          <Text style={s.renglon}>{factura.detalle}</Text>
        </View>
        <View style={f.colCantidad}>
          <Text style={s.renglon}>1</Text>
        </View>
        <View style={f.colPrecio}>
          <Text style={s.renglon}>{importe}</Text>
        </View>
        <View style={f.colImporte}>
          <Text style={[s.renglon, s.fuerte]}>{importe}</Text>
        </View>
      </View>
    </View>
  );
}

function Autorizacion({ factura }: { factura: FacturaEnPdf }) {
  const qr = trazoDelQr(
    enlaceDelQr({
      tipo: factura.tipo,
      cuitEmisor: factura.emisor.cuit,
      puntoDeVenta: factura.puntoDeVenta,
      numero: factura.numero,
      fecha: factura.fecha,
      importe: factura.importe,
      docTipo: factura.receptor.docTipo,
      docNro: factura.receptor.docNro,
      cae: factura.cae,
    }),
  );
  return (
    <View fixed style={f.autorizacion}>
      <Svg
        style={f.qr}
        width={LADO_DEL_QR}
        height={LADO_DEL_QR}
        viewBox={`0 0 ${String(qr.lado)} ${String(qr.lado)}`}
      >
        <Path d={qr.d} fill={COLOR.ink} />
      </Svg>
      <View style={f.autorizacionTextos}>
        <Text style={f.autorizacionFuerte}>{t.cae(factura.cae)}</Text>
        <Text style={f.autorizacionDato}>{t.venceElCae(fechaDeLaFactura(factura.caeVence))}</Text>
        <Text style={f.autorizacionNota}>{t.autorizado}</Text>
      </View>
    </View>
  );
}

export function FacturaPdf(factura: FacturaEnPdf): ReactElement<DocumentProps> {
  const titulo = tituloDeLaFactura(factura);
  return (
    <Document
      title={titulo}
      author={factura.emisor.razonSocial}
      subject={factura.receptor.nombre}
      keywords={[
        t.palabraClave[factura.tipo],
        numeroDelComprobante(factura.puntoDeVenta, factura.numero),
      ].join(', ')}
      creator={factura.emisor.razonSocial}
      language={IDIOMA_DE_LA_FACTURA}
      creationDate={mediodiaEnElTaller(factura.fecha)}
    >
      <Page size="A4" style={[s.pagina, f.pagina]}>
        <Encabezado factura={factura} />
        <Receptor receptor={factura.receptor} />

        {factura.anulaA !== null && (
          <View style={s.marco} wrap={false}>
            <Text style={f.anula}>
              {t.anula(
                numeroDelComprobante(factura.anulaA.puntoDeVenta, factura.anulaA.numero),
                fechaDeLaFactura(factura.anulaA.fecha),
              )}
            </Text>
          </View>
        )}

        <Detalle factura={factura} />

        <View style={f.total} wrap={false}>
          <Text style={f.totalEtiqueta}>{t.importeTotal}</Text>
          <Text style={f.totalMonto}>{pesosDeLaFactura(factura.importe)}</Text>
        </View>

        <Autorizacion factura={factura} />

        {factura.prueba && (
          <View fixed style={f.marcaDePrueba}>
            <Text style={f.marcaDePruebaTexto}>{t.prueba}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
