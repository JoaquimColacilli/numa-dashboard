import {
  cuentasDelPresupuesto,
  type CuentaDeUnValor,
  type DocumentoDelPresupuesto,
  type Money,
  type TextoConTitulo,
} from '@maun/domain';
import { Document, Page, Path, Svg, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

import { formatearPesos, formatearPorcentaje } from '@/shared/lib';

import {
  casillasDelRotuloDelPdf,
  conQueCambio,
  deQuienEs,
  fechaDeCreacion,
  LEMA_DEL_TALLER,
  LEYENDA_DE_ARCA,
  lineaDelAceptado,
  lineasDelTaller,
  pieDelTaller,
  textoDeLaPagina,
  textoDeLaValidez,
  textoDelPlazo,
  tituloDelPdf,
} from './armado';
import { ESTILOS as s } from './estilos';
import {
  CENTRO_DE_LA_MAYUSCULA,
  COLOR,
  CUERPO,
  INTERLINEADO,
  PRESENCIA,
  RENGLONES_POR_HOJA,
  renglones,
} from './medidas';
import type { PresupuestoEnPdf } from './tipos';

function Globo({ numero }: { numero: number }) {
  return (
    <View style={s.globo}>
      <Text style={s.globoNumero}>{String(numero)}</Text>
    </View>
  );
}

function MarcaDeRevision({ numero }: { numero: number }) {
  return (
    <View style={s.marcaDeRevision}>
      <Svg width={22} height={20.4} viewBox="0 0 28 26">
        <Path
          d="M14 2.5 L26 23.5 H2 Z"
          fill={COLOR.paper}
          stroke={COLOR.ink}
          strokeWidth={1.75}
          strokeLinejoin="round"
        />
      </Svg>
      <Text style={s.marcaDeRevisionNumero}>{String(numero)}</Text>
    </View>
  );
}

function Tilde() {
  return (
    <Svg width={10.5} height={10.5} viewBox="0 0 24 24">
      <Path
        d="M20 6 9 17l-5-5"
        fill="none"
        stroke={COLOR.ink}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CirculoTildado() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24">
      <Path
        d="M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z"
        fill="none"
        stroke={COLOR.ink}
        strokeWidth={1.6}
      />
      <Path
        d="m8 12.2 2.7 2.7 5.3-5.4"
        fill="none"
        stroke={COLOR.ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LineaDePuntos({
  izquierda,
  derecha,
  fuerte = false,
}: {
  izquierda: string;
  derecha: string;
  fuerte?: boolean;
}) {
  const estilo = fuerte ? [s.renglon, s.fuerte] : s.renglon;
  return (
    <View style={s.lineaDePuntos}>
      <Text style={estilo}>{izquierda}</Text>
      <View style={s.puntos} />
      <Text style={estilo}>{derecha}</Text>
    </View>
  );
}

function TituloDeSeccion({ children, presencia }: { children: string; presencia?: number }) {
  return (
    <View
      style={s.tituloDeSeccion}
      {...(presencia === undefined ? {} : { minPresenceAhead: presencia })}
    >
      <Text style={s.rotuloChico}>{children}</Text>
      <View style={s.filete} />
    </View>
  );
}

function Seccion({
  titulo,
  piezas,
  conElTitulo = 1,
  primeraEntera = true,
  presencia = PRESENCIA,
}: {
  titulo: string;
  piezas: ReactNode[];
  conElTitulo?: number;
  primeraEntera?: boolean;
  presencia?: number;
}) {
  if (!primeraEntera) {
    return (
      <>
        <TituloDeSeccion presencia={presencia}>{titulo}</TituloDeSeccion>
        {piezas}
      </>
    );
  }
  return (
    <>
      <View wrap={false}>
        <TituloDeSeccion>{titulo}</TituloDeSeccion>
        {piezas.slice(0, conElTitulo)}
      </View>
      {piezas.slice(conElTitulo)}
    </>
  );
}

type MuebleDelDocumento = DocumentoDelPresupuesto['muebles'][number];

function muebleEntero(mueble: MuebleDelDocumento): boolean {
  return renglones(mueble.descripcion, 80) + 2 < RENGLONES_POR_HOJA;
}

function piezasDelMueble(
  mueble: MuebleDelDocumento,
  indice: number,
  conFilete: boolean,
): ReactNode[] {
  const clave = `${String(indice)}-${mueble.nombre}`;
  const filete = conFilete ? s.muebleConFilete : {};
  const nombre = mueble.nombre !== '' && <Text style={[s.renglon, s.fuerte]}>{mueble.nombre}</Text>;
  const descripcion = mueble.descripcion !== '' && (
    <Text style={s.parrafo}>{mueble.descripcion}</Text>
  );
  if (muebleEntero(mueble)) {
    return [
      <View key={clave} style={[s.mueble, filete]} wrap={false}>
        <Globo numero={indice + 1} />
        <View style={s.muebleCuerpo}>
          {nombre}
          {descripcion}
        </View>
      </View>,
    ];
  }
  return [
    <View
      key={`${clave}-nombre`}
      style={[s.mueble, { paddingBottom: 0 }]}
      minPresenceAhead={PRESENCIA}
    >
      <Globo numero={indice + 1} />
      <View style={s.muebleCuerpo}>{nombre}</View>
    </View>,
    <View key={`${clave}-descripcion`} style={[s.muebleLargo, filete]}>
      {descripcion}
    </View>,
  ];
}

function Encabezado({ p }: { p: PresupuestoEnPdf }) {
  const { taller } = p.documento;
  const lineas = lineasDelTaller(taller);
  return (
    <View style={s.encabezado}>
      <View style={s.emisor}>
        <Text style={s.marca}>{taller.nombre}</Text>
        <Text style={s.lema}>{LEMA_DEL_TALLER}</Text>
        {lineas.length > 0 && (
          <View style={s.datosDelTaller}>
            {lineas.map((linea) => (
              <Text key={linea} style={s.datoDelTaller}>
                {linea}
              </Text>
            ))}
          </View>
        )}
      </View>

      <View style={s.centro}>
        <View style={s.equis}>
          <Text style={s.equisLetra}>X</Text>
        </View>
        <Text style={s.leyenda}>{LEYENDA_DE_ARCA}</Text>
      </View>

      <View style={s.derecha}>
        <View style={s.rotulo}>
          <View style={s.rotuloArriba}>
            <Text style={s.rotuloTipo}>Presupuesto</Text>
            {p.numero === null ? (
              <Text style={s.numeroSinAsignar}>Sin número todavía</Text>
            ) : (
              <Text style={s.numero}>Nº {p.numero}</Text>
            )}
          </View>
          <View style={s.rotuloAbajo}>
            {casillasDelRotuloDelPdf(p).map((casilla, indice) => (
              <View
                key={casilla.titulo}
                style={[
                  s.casilla,
                  casilla.ancho === undefined
                    ? { flexGrow: 1, flexBasis: 0 }
                    : { width: casilla.ancho },
                  indice > 0 ? s.casillaConFilete : {},
                ]}
              >
                <Text style={s.casillaTitulo}>{casilla.titulo}</Text>
                <Text style={s.casillaValor}>{casilla.valor}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

function DatosDelTrabajo({ documento }: { documento: DocumentoDelPresupuesto }) {
  const datos = [
    { titulo: 'Cliente', valor: documento.cliente, peso: 1 },
    { titulo: 'Obra', valor: documento.obra, peso: 1.35 },
    { titulo: 'Trabajo', valor: documento.titulo, peso: 1.15 },
  ].filter(({ valor }) => valor !== '');
  return (
    <View style={s.datosDelTrabajo} wrap={false}>
      {datos.map((dato, indice) => (
        <View
          key={dato.titulo}
          style={[
            s.datoDelTrabajo,
            { flexGrow: dato.peso },
            indice > 0 ? s.datoDelTrabajoConFilete : {},
          ]}
        >
          <Text style={s.casillaTitulo}>{dato.titulo}</Text>
          <Text style={s.datoDelTrabajoValor}>{dato.valor}</Text>
        </View>
      ))}
    </View>
  );
}

function menos(centavos: number): string {
  return `− ${formatearPesos(centavos)}`;
}

function CajaDelTotal({
  cuenta,
  senaBp,
  acordado,
}: {
  cuenta: CuentaDeUnValor;
  senaBp: number;
  acordado: Money | null;
}) {
  const conAbonado = cuenta.pagado > 0;
  return (
    <View style={s.valores}>
      {cuenta.letra !== null && (
        <View style={s.opcionElegida}>
          <Text style={s.marcoTitulo}>Opción {cuenta.letra}</Text>
          {cuenta.descripcion !== '' && <Text style={s.renglon}>{cuenta.descripcion}</Text>}
        </View>
      )}
      <View style={s.totalFila}>
        <Text style={s.totalEtiqueta}>Total</Text>
        <Text style={s.totalMonto}>{formatearPesos(cuenta.total)}</Text>
      </View>
      {acordado !== null && (
        <Text style={s.acordado}>Acordado al aprobar: {formatearPesos(acordado)}</Text>
      )}
      <View style={s.desglose}>
        <LineaDePuntos
          izquierda={`Seña (${formatearPorcentaje(senaBp)}%)`}
          derecha={formatearPesos(cuenta.sena)}
        />
        {conAbonado && (
          <LineaDePuntos
            izquierda="Relevamiento técnico y diseño 3D ya abonado"
            derecha={menos(cuenta.pagado)}
          />
        )}
        {conAbonado && (
          <View style={s.cierre}>
            <LineaDePuntos
              izquierda="Seña a abonar"
              derecha={
                cuenta.faltaParaLaSena > 0 ? formatearPesos(cuenta.faltaParaLaSena) : 'Cubierta'
              }
              fuerte
            />
          </View>
        )}
        <LineaDePuntos izquierda="Saldo" derecha={formatearPesos(cuenta.saldo)} />
      </View>
    </View>
  );
}

function anchoDeUnImporte(texto: string, tamano: number): number {
  let em = 0;
  for (const letra of texto) em += /[.,]/.test(letra) ? 0.3 : /\s/.test(letra) ? 0.24 : 0.6;
  return em * tamano;
}

function anchoDeColumna(importes: string[], tamano: number, minimo: number): number {
  return Math.max(minimo, ...importes.map((importe) => anchoDeUnImporte(importe, tamano) + 12));
}

function TablaDeOpciones({
  cuentas,
  senaBp,
  abonado,
}: {
  cuentas: CuentaDeUnValor[];
  senaBp: number;
  abonado: number;
}) {
  const conAbonado = abonado > 0;
  const aAbonar = (cuenta: CuentaDeUnValor) =>
    cuenta.faltaParaLaSena > 0 ? formatearPesos(cuenta.faltaParaLaSena) : 'Cubierta';
  const anchoTotal = {
    width: anchoDeColumna(
      cuentas.map((cuenta) => formatearPesos(cuenta.total)),
      12,
      80,
    ),
  };
  const anchoSena = {
    width: anchoDeColumna(
      cuentas.map((cuenta) => formatearPesos(cuenta.sena)),
      CUERPO,
      76,
    ),
  };
  const anchoAAbonar = { width: anchoDeColumna(cuentas.map(aAbonar), CUERPO, 76) };
  return (
    <View>
      <View style={s.tabla}>
        <View style={s.tablaFila}>
          <View style={s.colOpcion}>
            <Text style={s.rotuloChico}>Opción</Text>
          </View>
          <View style={[s.colMonto, anchoTotal]}>
            <Text style={s.rotuloChico}>Total</Text>
          </View>
          <View style={[s.colMonto, anchoSena]}>
            <Text style={s.rotuloChico}>Seña ({formatearPorcentaje(senaBp)}%)</Text>
          </View>
          {conAbonado && (
            <View style={[s.colMonto, anchoAAbonar]}>
              <Text style={s.rotuloChico}>Seña a abonar</Text>
            </View>
          )}
        </View>
        {cuentas.map((cuenta) => (
          <View
            key={cuenta.id ?? cuenta.letra}
            style={[s.tablaFila, s.tablaFilaConFilete]}
            wrap={false}
          >
            <View style={s.colOpcion}>
              <Text style={s.marcoTitulo}>Opción {cuenta.letra}</Text>
              {cuenta.descripcion !== '' && <Text style={s.renglon}>{cuenta.descripcion}</Text>}
            </View>
            <View style={[s.colMonto, anchoTotal]}>
              <Text style={s.montoTotal}>{formatearPesos(cuenta.total)}</Text>
            </View>
            <View style={[s.colMonto, anchoSena]}>
              <Text style={s.renglon}>{formatearPesos(cuenta.sena)}</Text>
            </View>
            {conAbonado && (
              <View style={[s.colMonto, anchoAAbonar]}>
                <Text style={[s.renglon, s.fuerte]}>{aAbonar(cuenta)}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      <Text style={s.notaAlPie}>
        {conAbonado
          ? `La seña a abonar descuenta los ${formatearPesos(abonado)} ya abonados por el relevamiento técnico y diseño 3D. `
          : ''}
        Elegí la opción que prefieras y avisale al taller.
      </Text>
    </View>
  );
}

function Valores({
  documento,
  acordado,
}: {
  documento: DocumentoDelPresupuesto;
  acordado: Money | null;
}) {
  const { valores, senaBp, abonado } = documento;
  if (valores === null) return null;
  const cuentas = cuentasDelPresupuesto(valores, senaBp, abonado);
  const unica = cuentas.length === 1 ? cuentas[0] : undefined;
  const alto =
    unica === undefined
      ? 3 + cuentas.reduce((suma, cuenta) => suma + 2 + renglones(cuenta.descripcion, 38), 0)
      : 9 + (unica.letra === null ? 0 : 1 + renglones(unica.descripcion, 80));
  return (
    <Seccion
      titulo="Valores"
      primeraEntera={alto < RENGLONES_POR_HOJA}
      presencia={5 * CUERPO * INTERLINEADO}
      piezas={[
        unica === undefined ? (
          <TablaDeOpciones key="opciones" cuentas={cuentas} senaBp={senaBp} abonado={abonado} />
        ) : (
          <CajaDelTotal key="total" cuenta={unica} senaBp={senaBp} acordado={acordado} />
        ),
      ]}
    />
  );
}

function FormaPlazoYValidez({ p }: { p: PresupuestoEnPdf }) {
  const { documento } = p;
  const filas = [
    { termino: 'Forma de pago', valor: documento.formaDePago },
    { termino: 'Plazo de fabricación', valor: textoDelPlazo(documento.plazoDeFabricacion) },
    { termino: 'Validez', valor: textoDeLaValidez(p) },
  ].filter((fila): fila is { termino: string; valor: string } => fila.valor !== null);
  return (
    <View style={s.definiciones} wrap={false}>
      {filas.map((fila, indice) => (
        <View
          key={fila.termino}
          style={indice > 0 ? [s.definicion, s.definicionConFilete] : s.definicion}
        >
          <View style={s.termino}>
            <Text style={s.rotuloChico}>{fila.termino}</Text>
          </View>
          <Text style={[s.renglon, { flexGrow: 1, flexBasis: 0 }]}>{fila.valor}</Text>
        </View>
      ))}
    </View>
  );
}

function notas(textos: readonly TextoConTitulo[]): ReactNode[] {
  return textos.map(({ titulo, texto }, indice) => (
    <View key={`${String(indice)}-${texto.slice(0, 24)}`} style={s.nota} wrap={false}>
      <Text style={s.notaNumero}>{String(indice + 1)}.</Text>
      <Text style={[s.parrafo, { flexGrow: 1, flexBasis: 0 }]}>
        {titulo !== null && <Text style={s.fuerte}>{titulo}. </Text>}
        {texto}
      </Text>
    </View>
  ));
}

function ATenerEnCuenta({ textos }: { textos: readonly string[] }) {
  if (textos.length === 0) return null;
  return (
    <View
      style={s.caja}
      wrap={textos.reduce((suma, texto) => suma + renglones(texto, 60), 0) >= RENGLONES_POR_HOJA}
    >
      <View style={s.cajaRotulo}>
        <Text style={s.rotuloChico}>A tener en cuenta</Text>
      </View>
      <View style={{ flexGrow: 1, flexBasis: 0 }}>
        {textos.map((texto, indice) => (
          <Text key={`${String(indice)}-${texto}`} style={s.cajaTexto}>
            {texto}
          </Text>
        ))}
      </View>
    </View>
  );
}

function LineaDelAceptado({ el, letra }: { el: string | null; letra: string | null }) {
  return (
    <View style={s.marco} wrap={false}>
      <View style={{ paddingTop: CENTRO_DE_LA_MAYUSCULA - 8 }}>
        <CirculoTildado />
      </View>
      <View style={s.marcoCuerpo}>
        <Text style={s.marcoTitulo}>{lineaDelAceptado(el, letra)}</Text>
      </View>
    </View>
  );
}

export function PresupuestoPdf(p: PresupuestoEnPdf) {
  const { documento } = p;
  const { taller } = documento;
  const titulo = tituloDelPdf(p);
  const deQuien = deQuienEs(documento);

  return (
    <Document
      title={titulo}
      author={taller.nombre}
      subject={deQuien}
      keywords={['Presupuesto', p.numero ?? 'borrador', documento.cliente]
        .filter(Boolean)
        .join(', ')}
      creator={taller.nombre}
      language="es-AR"
      creationDate={fechaDeCreacion(p)}
    >
      <Page size="A4" style={s.pagina}>
        <View
          fixed
          style={s.cornisa}
          render={({ pageNumber }) =>
            pageNumber > 1 ? (
              <>
                <Text style={s.cornisaMarca}>{taller.nombre}</Text>
                <Text style={s.cornisaTexto}>{deQuien}</Text>
              </>
            ) : null
          }
        />

        <Encabezado p={p} />
        <DatosDelTrabajo documento={documento} />

        {p.aceptado !== null && <LineaDelAceptado el={p.aceptado.el} letra={p.aceptado.letra} />}

        {conQueCambio(p) && (
          <View style={s.marco} wrap={false}>
            <MarcaDeRevision numero={p.revision} />
            <View style={s.marcoCuerpo}>
              <Text style={s.marcoTitulo}>Qué cambió en la revisión {String(p.revision)}</Text>
              <Text style={s.renglon}>{p.queCambio}</Text>
            </View>
          </View>
        )}

        {documento.descripcion !== '' && <Text style={s.entrada}>{documento.descripcion}</Text>}

        {documento.muebles.length > 0 && (
          <Seccion
            titulo="Detalle"
            primeraEntera={documento.muebles[0] === undefined || muebleEntero(documento.muebles[0])}
            piezas={documento.muebles.flatMap((mueble, indice) =>
              piezasDelMueble(mueble, indice, indice < documento.muebles.length - 1),
            )}
          />
        )}

        {documento.herrajes.length > 0 && (
          <Seccion
            titulo="Herrajes"
            conElTitulo={2}
            piezas={documento.herrajes.map((herraje, indice) => (
              <View key={`${String(indice)}-${herraje}`} style={s.item} wrap={false}>
                <View style={s.punto} />
                <Text style={s.textoDeItem}>{herraje}</Text>
              </View>
            ))}
          />
        )}

        <ATenerEnCuenta textos={documento.aTenerEnCuenta} />

        {documento.incluye.length > 0 && (
          <Seccion
            titulo="Incluye"
            conElTitulo={2}
            piezas={documento.incluye.map((texto, indice) => (
              <View key={`${String(indice)}-${texto}`} style={s.item} wrap={false}>
                <View style={s.tilde}>
                  <Tilde />
                </View>
                <Text style={s.textoDeItem}>{texto}</Text>
              </View>
            ))}
          />
        )}

        <Valores documento={documento} acordado={p.aceptado?.acordado ?? null} />
        <FormaPlazoYValidez p={p} />

        {documento.avisos.length > 0 && (
          <Seccion titulo="Avisos" piezas={notas(documento.avisos)} />
        )}
        {documento.condiciones.length > 0 && (
          <Seccion titulo="Condiciones" piezas={notas(documento.condiciones)} />
        )}
        {documento.garantia !== '' && (
          <Seccion
            titulo="Garantía"
            piezas={[
              <Text key="garantia" style={s.parrafo}>
                {documento.garantia}
              </Text>,
            ]}
          />
        )}

        <View fixed style={s.pie}>
          <Text style={s.pieTexto}>{pieDelTaller(taller)}</Text>
          <Text
            style={s.pieTexto}
            render={({ pageNumber, totalPages }) => textoDeLaPagina(titulo, pageNumber, totalPages)}
          />
        </View>

        {p.borrador && (
          <View fixed style={s.borrador}>
            <Text style={s.borradorTexto}>BORRADOR</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
