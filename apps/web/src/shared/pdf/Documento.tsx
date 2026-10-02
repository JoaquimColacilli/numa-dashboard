import {
  cuentasDelPresupuesto,
  ETIQUETAS_DE_IDIOMA,
  type CuentaDeUnValor,
  type DocumentoDelPresupuesto,
  type Moneda,
  type Money,
  type TextoConTitulo,
} from '@maun/domain';
import { Document, Page, Path, Svg, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';

import {
  casillasDelRotuloDelPdf,
  conQueCambio,
  deQuienEs,
  fechaDeCreacion,
  lineaDelAceptado,
  lineasDelTaller,
  pieDelTaller,
  textoDeLaPagina,
  textoDeLaValidez,
  textoDelPlazo,
  tituloDelPdf,
} from './armado';
import { ESTILOS as s } from './estilos';
import type { LenguaDelPdf } from './lengua';
import { LETRA_DE_ARCA, LEYENDA_DE_ARCA } from './leyenda';
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

function Encabezado({ p, l }: { p: PresupuestoEnPdf; l: LenguaDelPdf }) {
  const { taller } = p.documento;
  const { rotulo } = l.m.ui;
  const { lema, leyendaDeArca } = l.m.documento;
  const lineas = lineasDelTaller(taller);
  return (
    <View style={s.encabezado}>
      <View style={s.emisor}>
        <Text style={s.marca}>{taller.nombre}</Text>
        <Text style={s.lema}>{lema}</Text>
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
          <Text style={s.equisLetra}>{LETRA_DE_ARCA}</Text>
        </View>
        <Text style={s.leyenda}>{LEYENDA_DE_ARCA}</Text>
        {leyendaDeArca.aclarar && (
          <Text style={s.aclaracionDeLaLeyenda}>{leyendaDeArca.aclaracion}</Text>
        )}
      </View>

      <View style={s.derecha}>
        <View style={s.rotulo}>
          <View style={s.rotuloArriba}>
            <Text style={s.rotuloTipo}>{rotulo.presupuesto}</Text>
            {p.numero === null ? (
              <Text style={s.numeroSinAsignar}>{rotulo.sinNumero}</Text>
            ) : (
              <Text style={s.numero}>{rotulo.numero(p.numero)}</Text>
            )}
          </View>
          <View style={s.rotuloAbajo}>
            {casillasDelRotuloDelPdf(p, l).map((casilla, indice) => (
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

function DatosDelTrabajo({
  documento,
  l,
}: {
  documento: DocumentoDelPresupuesto;
  l: LenguaDelPdf;
}) {
  const { datos: titulos } = l.m.pdf;
  const datos = [
    { titulo: titulos.cliente, valor: documento.cliente, peso: 1 },
    { titulo: titulos.obra, valor: documento.obra, peso: 1.35 },
    { titulo: titulos.trabajo, valor: documento.titulo, peso: 1.15 },
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

function CajaDelTotal({
  cuenta,
  senaBp,
  acordado,
  l,
}: {
  cuenta: CuentaDeUnValor<Moneda>;
  senaBp: number;
  acordado: Money<Moneda> | null;
  l: LenguaDelPdf;
}) {
  const { valores } = l.m.presupuesto;
  const delPdf = l.m.pdf.valores;
  const plata = l.f.pesos;
  const conAbonado = cuenta.pagado > 0;
  return (
    <View style={s.valores}>
      {cuenta.letra !== null && (
        <View style={s.opcionElegida}>
          <Text style={s.marcoTitulo}>{valores.opcion(cuenta.letra)}</Text>
          {cuenta.descripcion !== '' && <Text style={s.renglon}>{cuenta.descripcion}</Text>}
        </View>
      )}
      <View style={s.totalFila}>
        <Text style={s.totalEtiqueta}>{valores.total}</Text>
        <Text style={s.totalMonto}>{plata(cuenta.total)}</Text>
      </View>
      {acordado !== null && <Text style={s.acordado}>{valores.acordado(plata(acordado))}</Text>}
      <View style={s.desglose}>
        <LineaDePuntos
          izquierda={valores.sena(l.f.porcentaje(senaBp))}
          derecha={plata(cuenta.sena)}
        />
        {conAbonado && (
          <LineaDePuntos
            izquierda={delPdf.relevamientoAbonado}
            derecha={`− ${plata(cuenta.pagado)}`}
          />
        )}
        {conAbonado && (
          <View style={s.cierre}>
            <LineaDePuntos
              izquierda={delPdf.senaAAbonar}
              derecha={cuenta.faltaParaLaSena > 0 ? plata(cuenta.faltaParaLaSena) : delPdf.cubierta}
              fuerte
            />
          </View>
        )}
        <LineaDePuntos izquierda={delPdf.saldo} derecha={plata(cuenta.saldo)} />
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
  l,
}: {
  cuentas: CuentaDeUnValor<Moneda>[];
  senaBp: number;
  abonado: number;
  l: LenguaDelPdf;
}) {
  const { valores } = l.m.presupuesto;
  const delPdf = l.m.pdf.valores;
  const { rotulo } = l.m.ui;
  const plata = l.f.pesos;
  const conAbonado = abonado > 0;
  const aAbonar = (cuenta: CuentaDeUnValor<Moneda>) =>
    cuenta.faltaParaLaSena > 0 ? plata(cuenta.faltaParaLaSena) : delPdf.cubierta;
  const anchoTotal = {
    width: anchoDeColumna(
      cuentas.map((cuenta) => plata(cuenta.total)),
      12,
      80,
    ),
  };
  const anchoSena = {
    width: anchoDeColumna(
      cuentas.map((cuenta) => plata(cuenta.sena)),
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
            <Text style={s.rotuloChico}>{rotulo.opcion}</Text>
          </View>
          <View style={[s.colMonto, anchoTotal]}>
            <Text style={s.rotuloChico}>{valores.total}</Text>
          </View>
          <View style={[s.colMonto, anchoSena]}>
            <Text style={s.rotuloChico}>{valores.sena(l.f.porcentaje(senaBp))}</Text>
          </View>
          {conAbonado && (
            <View style={[s.colMonto, anchoAAbonar]}>
              <Text style={s.rotuloChico}>{delPdf.senaAAbonar}</Text>
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
              <Text style={s.marcoTitulo}>{valores.opcion(cuenta.letra ?? '')}</Text>
              {cuenta.descripcion !== '' && <Text style={s.renglon}>{cuenta.descripcion}</Text>}
            </View>
            <View style={[s.colMonto, anchoTotal]}>
              <Text style={s.montoTotal}>{plata(cuenta.total)}</Text>
            </View>
            <View style={[s.colMonto, anchoSena]}>
              <Text style={s.renglon}>{plata(cuenta.sena)}</Text>
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
        {conAbonado ? delPdf.elegiConLoAbonado(plata(abonado)) : valores.elegiLaOpcion}
      </Text>
    </View>
  );
}

function Valores({
  documento,
  acordado,
  l,
}: {
  documento: DocumentoDelPresupuesto;
  acordado: Money<Moneda> | null;
  l: LenguaDelPdf;
}) {
  const { valores, senaBp, abonado } = documento;
  if (valores === null) return null;
  const cuentas = cuentasDelPresupuesto<Moneda>(valores, senaBp, abonado);
  const unica = cuentas.length === 1 ? cuentas[0] : undefined;
  const alto =
    unica === undefined
      ? 3 + cuentas.reduce((suma, cuenta) => suma + 2 + renglones(cuenta.descripcion, 38), 0)
      : 9 + (unica.letra === null ? 0 : 1 + renglones(unica.descripcion, 80));
  return (
    <Seccion
      titulo={l.m.presupuesto.secciones.valores}
      primeraEntera={alto < RENGLONES_POR_HOJA}
      presencia={5 * CUERPO * INTERLINEADO}
      piezas={[
        unica === undefined ? (
          <TablaDeOpciones
            key="opciones"
            cuentas={cuentas}
            senaBp={senaBp}
            abonado={abonado}
            l={l}
          />
        ) : (
          <CajaDelTotal key="total" cuenta={unica} senaBp={senaBp} acordado={acordado} l={l} />
        ),
      ]}
    />
  );
}

function FormaPlazoYValidez({ p, l }: { p: PresupuestoEnPdf; l: LenguaDelPdf }) {
  const { documento } = p;
  const { definiciones } = l.m.presupuesto;
  const filas = [
    { termino: definiciones.formaDePago, valor: documento.formaDePago },
    { termino: definiciones.plazo, valor: textoDelPlazo(documento.plazoDeFabricacion, l) },
    { termino: definiciones.validez, valor: textoDeLaValidez(p, l) },
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

function ATenerEnCuenta({ textos, titulo }: { textos: readonly string[]; titulo: string }) {
  if (textos.length === 0) return null;
  return (
    <View
      style={s.caja}
      wrap={textos.reduce((suma, texto) => suma + renglones(texto, 60), 0) >= RENGLONES_POR_HOJA}
    >
      <View style={s.cajaRotulo}>
        <Text style={s.rotuloChico}>{titulo}</Text>
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

function LineaDelAceptado({
  el,
  letra,
  l,
}: {
  el: string | null;
  letra: string | null;
  l: LenguaDelPdf;
}) {
  return (
    <View style={s.marco} wrap={false}>
      <View style={{ paddingTop: CENTRO_DE_LA_MAYUSCULA - 8 }}>
        <CirculoTildado />
      </View>
      <View style={s.marcoCuerpo}>
        <Text style={s.marcoTitulo}>{lineaDelAceptado(el, letra, l)}</Text>
      </View>
    </View>
  );
}

export function PresupuestoPdf(p: PresupuestoEnPdf, l: LenguaDelPdf) {
  const { documento } = p;
  const { taller } = documento;
  const { secciones } = l.m.presupuesto;
  const titulo = tituloDelPdf(p, l);
  const deQuien = deQuienEs(documento);
  const { palabrasClave } = l.m.pdf;

  return (
    <Document
      title={titulo}
      author={taller.nombre}
      subject={deQuien}
      keywords={[palabrasClave.presupuesto, p.numero ?? palabrasClave.borrador, documento.cliente]
        .filter(Boolean)
        .join(', ')}
      creator={taller.nombre}
      language={ETIQUETAS_DE_IDIOMA[l.idioma]}
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

        <Encabezado p={p} l={l} />
        <DatosDelTrabajo documento={documento} l={l} />

        {p.aceptado !== null && (
          <LineaDelAceptado el={p.aceptado.el} letra={p.aceptado.letra} l={l} />
        )}

        {conQueCambio(p) && (
          <View style={s.marco} wrap={false}>
            <MarcaDeRevision numero={p.revision} />
            <View style={s.marcoCuerpo}>
              <Text style={s.marcoTitulo}>{l.m.presupuesto.queCambio(p.revision)}</Text>
              <Text style={s.renglon}>{p.queCambio}</Text>
            </View>
          </View>
        )}

        {documento.descripcion !== '' && <Text style={s.entrada}>{documento.descripcion}</Text>}

        {documento.muebles.length > 0 && (
          <Seccion
            titulo={secciones.detalle}
            primeraEntera={documento.muebles[0] === undefined || muebleEntero(documento.muebles[0])}
            piezas={documento.muebles.flatMap((mueble, indice) =>
              piezasDelMueble(mueble, indice, indice < documento.muebles.length - 1),
            )}
          />
        )}

        {documento.herrajes.length > 0 && (
          <Seccion
            titulo={secciones.herrajes}
            conElTitulo={2}
            piezas={documento.herrajes.map((herraje, indice) => (
              <View key={`${String(indice)}-${herraje}`} style={s.item} wrap={false}>
                <View style={s.punto} />
                <Text style={s.textoDeItem}>{herraje}</Text>
              </View>
            ))}
          />
        )}

        <ATenerEnCuenta textos={documento.aTenerEnCuenta} titulo={secciones.aTenerEnCuenta} />

        {documento.incluye.length > 0 && (
          <Seccion
            titulo={secciones.incluye}
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

        <Valores documento={documento} acordado={p.aceptado?.acordado ?? null} l={l} />
        <FormaPlazoYValidez p={p} l={l} />

        {documento.avisos.length > 0 && (
          <Seccion titulo={secciones.avisos} piezas={notas(documento.avisos)} />
        )}
        {documento.condiciones.length > 0 && (
          <Seccion titulo={secciones.condiciones} piezas={notas(documento.condiciones)} />
        )}
        {documento.garantia !== '' && (
          <Seccion
            titulo={secciones.garantia}
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
            render={({ pageNumber, totalPages }) =>
              textoDeLaPagina(titulo, pageNumber, totalPages, l)
            }
          />
        </View>

        {p.borrador && (
          <View fixed style={s.borrador}>
            <Text style={s.borradorTexto}>{l.m.pdf.marcaDeAgua}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
