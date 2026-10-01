import { largoDelTexto, sinBlancosEnLasPuntas, tieneTexto } from './encuesta.ts';
import { DIAS_HABILES_DE_ENTREGA } from './fechas.ts';
import {
  aplicarPorcentaje,
  BASE_PUNTOS_BASICOS,
  centavos,
  CERO,
  maximo,
  puntosBasicos,
  restar,
  sumarTodos,
  type Money,
  type PuntosBasicos,
} from './money.ts';
import { SENA_HABITUAL } from './sena.ts';
import { DIAS_QUE_VALE_UN_PRESUPUESTO } from './vigencia.ts';

export const TOPES_DEL_PRESUPUESTO = {
  muebles: 30,
  herrajes: 40,
  propiasPorGrupo: 20,
  clausulasPorGrupo: 20,
  formasDePago: 6,
  clausulasDelDocumento: 40,
  opcionesDelDocumento: 26,
} as const;

export const LARGOS_DEL_PRESUPUESTO = {
  titulo: 200,
  obra: 300,
  descripcion: 4000,
  nombreDelMueble: 120,
  descripcionDelMueble: 4000,
  herraje: 200,
  propia: 1000,
  queCambio: 280,
  tituloDeClausula: 120,
  textoDeClausula: 2000,
  nombreDeLaForma: 60,
  id: 60,
} as const;

export const LARGOS_DEL_DOCUMENTO = {
  nombreDelTaller: 120,
  titular: 120,
  cuit: 13,
  domicilio: 300,
  telefono: 40,
  email: 200,
  cliente: 200,
  textoDerivado: 4000,
  descripcionDeLaOpcion: 500,
  letra: 3,
} as const;

export const RANGOS_DEL_PRESUPUESTO = {
  plazoDeFabricacion: { desde: 1, hasta: 365 },
  modificacionesIncluidas: { desde: 0, hasta: 10 },
  garantiaMeses: { desde: 6, hasta: 120 },
  validezDias: { desde: 1, hasta: 365 },
} as const;

export const IMPORTE_MAXIMO_DEL_PRESUPUESTO: Money = centavos(1_000_000_000_000);

export interface Clausula {
  id: string;
  titulo: string | null;
  texto: string;
  tildadaPorDefecto: boolean;
}

export interface FormaDePago {
  id: string;
  nombre: string;
  texto: string;
}

export interface PlantillaDelPresupuesto {
  forma: 1;
  plazoDeFabricacion: number;
  modificacionesIncluidas: number;
  valorDeUnaModificacion: Money;
  garantiaMeses: number;
  incluye: readonly Clausula[];
  aTenerEnCuenta: readonly Clausula[];
  formasDePago: readonly FormaDePago[];
  avisos: readonly Clausula[];
  condiciones: readonly Clausula[];
  garantia: string;
}

export const GRUPOS_DE_CLAUSULAS = ['incluye', 'aTenerEnCuenta', 'avisos', 'condiciones'] as const;

export type GrupoDeClausulas = (typeof GRUPOS_DE_CLAUSULAS)[number];

export const HUECOS = [
  'plazo',
  'modificaciones',
  'valor_modificacion',
  'relevamiento',
  'sena',
  'meses',
] as const;

export type Hueco = (typeof HUECOS)[number];

export const PLANTILLA_DE_SIEMPRE: PlantillaDelPresupuesto = {
  forma: 1,
  plazoDeFabricacion: 30,
  modificacionesIncluidas: 2,
  valorDeUnaModificacion: centavos(5_000_000),
  garantiaMeses: 6,
  incluye: [
    {
      id: 'incluye-visita',
      titulo: null,
      texto: 'Visita a domicilio para medición y definición de detalles.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-diseno',
      titulo: null,
      texto: 'Diseño 3D según los requerimientos establecidos.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-fabricacion',
      titulo: null,
      texto: 'Desarrollo y fabricación en base al diseño propuesto.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-transporte',
      titulo: null,
      texto: 'Transporte y entrega.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-instalacion',
      titulo: null,
      texto: 'Instalación y terminaciones en el domicilio.',
      tildadaPorDefecto: true,
    },
  ],
  aTenerEnCuenta: [
    { id: 'no-mesada', titulo: null, texto: 'No incluye mesada.', tildadaPorDefecto: false },
    {
      id: 'no-bacha',
      titulo: null,
      texto: 'No incluye bacha ni grifería.',
      tildadaPorDefecto: false,
    },
    {
      id: 'no-conexiones',
      titulo: null,
      texto: 'No incluye conexiones de agua, gas ni electricidad.',
      tildadaPorDefecto: false,
    },
    {
      id: 'no-electrodomesticos',
      titulo: null,
      texto: 'No incluye la colocación de electrodomésticos.',
      tildadaPorDefecto: false,
    },
  ],
  formasDePago: [
    {
      id: 'sena-y-entrega',
      nombre: 'Seña y contra entrega',
      texto: 'Seña del {sena} para confirmar el trabajo y el saldo contra entrega.',
    },
    {
      id: 'sena-y-cuotas',
      nombre: 'Seña y cuotas',
      texto:
        'Seña del {sena} para confirmar el trabajo y el saldo en cuotas, a convenir antes de empezar.',
    },
    {
      id: 'todo-al-confirmar',
      nombre: 'Todo al confirmar',
      texto: 'Pago total al confirmar el trabajo.',
    },
  ],
  avisos: [
    {
      id: 'aviso-plazo',
      titulo: null,
      texto:
        'El plazo estimado de fabricación es de {plazo} días hábiles a partir de acreditada la seña y confirmadas las especificaciones finales del proyecto. Este plazo contempla los tiempos actuales de producción y provisión de materiales. En caso de finalizar el trabajo antes del plazo indicado, se notificará al cliente para coordinar una entrega anticipada. Los plazos indicados pueden verse afectados por demoras en la provisión de materiales, logística o factores externos ajenos al proceso de fabricación. En caso de producirse estas situaciones, se informará oportunamente al cliente.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-aceptacion',
      titulo: null,
      texto:
        'El pago de la seña y el inicio del proyecto implican la aceptación del diseño, especificaciones técnicas, plazos de fabricación y condiciones detalladas en el presente documento.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-modificaciones',
      titulo: null,
      texto:
        'Este presupuesto incluye diseño 3D y hasta {modificaciones}. Modificaciones adicionales (rediseño completo) tienen un valor estimativo de {valor_modificacion} c/u.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-relevamiento',
      titulo: null,
      texto:
        'El valor abonado en concepto de relevamiento técnico y diseño 3D ({relevamiento}) contempla la visita a obra, toma de medidas, planteo y diseño 3D. Dicho importe ya se encuentra incluido en el total del presente presupuesto y se descuenta del valor de la seña.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-colores',
      titulo: null,
      texto:
        'Los colores y diseños de las placas pueden verse de un modo en las pantallas o en las muestras y variar en la realidad.',
      tildadaPorDefecto: true,
    },
  ],
  condiciones: [
    {
      id: 'condicion-espacio',
      titulo: 'Condiciones del espacio de instalación',
      texto:
        'El cliente deberá garantizar condiciones adecuadas de acceso y espacio para el ingreso e instalación del mobiliario. Situaciones excepcionales que requieran maniobras especiales o trabajos adicionales podrán requerir coordinación previa.',
      tildadaPorDefecto: true,
    },
    {
      id: 'condicion-perforaciones',
      titulo: null,
      texto:
        'Es responsabilidad exclusiva del cliente informar y dejar claramente definidas las rutas de cables y cañerías en las paredes que puedan ser perforadas. MAUN no se responsabiliza por daños derivados de perforaciones en áreas no señalizadas o mal informadas por el propietario.',
      tildadaPorDefecto: true,
    },
  ],
  garantia:
    'Garantía de {meses} desde la entrega e instalación, por defectos de fabricación o de instalación. No cubre daños por golpes, humedad o filtraciones, calor o sol directo, un uso distinto del previsto, ni arreglos hechos por otras personas.',
};

export interface Propia {
  id: string;
  texto: string;
}

export interface Seleccion {
  tildadas: readonly string[];
  propias: readonly Propia[];
}

export interface Mueble {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface FormaElegida {
  plantillaId: string;
  texto: string | null;
}

export interface HerrajesDelBorrador {
  mostrar: boolean;
  lista: readonly Propia[];
}

export interface BorradorDelPresupuesto {
  forma: 1;
  titulo: string;
  obra: string;
  descripcion: string;
  muebles: readonly Mueble[];
  herrajes: HerrajesDelBorrador;
  aTenerEnCuenta: Seleccion;
  incluye: Seleccion;
  formaDePago: FormaElegida | null;
  plazoDeFabricacion: number;
  validezDias: number | null;
  avisos: Seleccion;
  condiciones: Seleccion;
}

export const CONDICIONES_FISCALES = ['monotributo', 'responsable_inscripto', 'exento'] as const;

export type CondicionFiscal = (typeof CONDICIONES_FISCALES)[number];

export const NOMBRE_DE_LA_CONDICION: Record<CondicionFiscal, string> = {
  monotributo: 'Responsable Monotributo',
  responsable_inscripto: 'IVA Responsable Inscripto',
  exento: 'IVA Exento',
};

export interface DatosDelTaller {
  nombre: string;
  titular: string;
  cuit: string;
  condicionFiscal: CondicionFiscal | null;
  domicilio: string;
  telefono: string;
  email: string;
}

export interface OpcionDelDocumento {
  id: string;
  letra: string;
  descripcion: string;
  total: Money;
}

export type ValoresDelPresupuesto =
  { tipo: 'total'; total: Money } | { tipo: 'opciones'; opciones: readonly OpcionDelDocumento[] };

export interface TextoConTitulo {
  titulo: string | null;
  texto: string;
}

export interface MuebleDelDocumento {
  nombre: string;
  descripcion: string;
}

export interface DocumentoDelPresupuesto {
  forma: 1;
  taller: DatosDelTaller;
  cliente: string;
  titulo: string;
  obra: string;
  descripcion: string;
  muebles: readonly MuebleDelDocumento[];
  herrajes: readonly string[];
  aTenerEnCuenta: readonly string[];
  incluye: readonly string[];
  valores: ValoresDelPresupuesto | null;
  senaBp: PuntosBasicos;
  abonado: Money;
  formaDePago: string | null;
  plazoDeFabricacion: number;
  validezDias: number | null;
  avisos: readonly TextoConTitulo[];
  condiciones: readonly TextoConTitulo[];
  garantia: string;
  garantiaMeses: number;
}

export interface OpcionDelTrabajo {
  id: string;
  descripcion: string;
  monto: Money;
}

const FORMATO_DEL_ID = /^[a-z0-9-]{1,60}$/;
const FORMATO_DEL_NUMERO = /^[0-9]{8}-[0-9]{2,}$/;

export function recortado(texto: string, largo: number): string {
  return Array.from(texto).slice(0, largo).join('');
}

export function esIdDelPresupuesto(valor: unknown): valor is string {
  return typeof valor === 'string' && FORMATO_DEL_ID.test(valor);
}

export function esNumeroDePresupuesto(valor: unknown): valor is string {
  return typeof valor === 'string' && FORMATO_DEL_NUMERO.test(valor);
}

export function valoresDelTrabajo(
  presupuesto: Money | null,
  opciones: readonly OpcionDelTrabajo[],
): ValoresDelPresupuesto | null {
  if (opciones.length > 0) {
    const porId = [...opciones].sort((una, otra) => (una.id < otra.id ? -1 : 1));
    return {
      tipo: 'opciones',
      opciones: porId.map((opcion, indice) => ({
        id: opcion.id,
        letra: letraDeLaOpcion(indice),
        descripcion: opcion.descripcion,
        total: opcion.monto,
      })),
    };
  }
  return presupuesto === null ? null : { tipo: 'total', total: presupuesto };
}

export function letraDeLaOpcion(indice: number): string {
  const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return letras[indice] ?? String(indice + 1);
}

export function tildadasPorDefecto(clausulas: readonly Clausula[]): Seleccion {
  return {
    tildadas: clausulas.filter((clausula) => clausula.tildadaPorDefecto).map(({ id }) => id),
    propias: [],
  };
}

export interface EntradaDelBorradorNuevo {
  titulo: string;
  obra: string;
  plantilla: PlantillaDelPresupuesto;
  validezDias: number | null;
  idNuevo: () => string;
}

export function borradorNuevo(entrada: EntradaDelBorradorNuevo): BorradorDelPresupuesto {
  const { plantilla } = entrada;
  const primera = plantilla.formasDePago[0];
  return {
    forma: 1,
    titulo: recortado(sinBlancosEnLasPuntas(entrada.titulo), LARGOS_DEL_PRESUPUESTO.titulo),
    obra: recortado(sinBlancosEnLasPuntas(entrada.obra), LARGOS_DEL_PRESUPUESTO.obra),
    descripcion: '',
    muebles: [{ id: entrada.idNuevo(), nombre: '', descripcion: '' }],
    herrajes: { mostrar: true, lista: [] },
    aTenerEnCuenta: tildadasPorDefecto(plantilla.aTenerEnCuenta),
    incluye: tildadasPorDefecto(plantilla.incluye),
    formaDePago: primera === undefined ? null : { plantillaId: primera.id, texto: null },
    plazoDeFabricacion: plantilla.plazoDeFabricacion,
    validezDias: entrada.validezDias,
    avisos: tildadasPorDefecto(plantilla.avisos),
    condiciones: tildadasPorDefecto(plantilla.condiciones),
  };
}

export function usaElHueco(texto: string, hueco: Hueco): boolean {
  return texto.includes(`{${hueco}}`);
}

export function completarHuecos(
  texto: string,
  valores: Readonly<Partial<Record<Hueco, string>>>,
): string {
  return texto.replace(/\{([a-z_]+)\}/g, (entero, nombre: string) => {
    const valor = (HUECOS as readonly string[]).includes(nombre)
      ? valores[nombre as Hueco]
      : undefined;
    return valor ?? entero;
  });
}

function conSuPlural(cantidad: number, singular: string, plural: string): string {
  return `${String(cantidad)} ${cantidad === 1 ? singular : plural}`;
}

export interface Formatos {
  pesos: (importe: Money) => string;
  porcentaje: (puntos: PuntosBasicos) => string;
}

export interface EntradaDelDocumento {
  borrador: BorradorDelPresupuesto;
  plantilla: PlantillaDelPresupuesto;
  taller: DatosDelTaller;
  cliente: string;
  valores: ValoresDelPresupuesto | null;
  senaBp: PuntosBasicos;
  abonado: Money;
}

export interface EntradaDeLosHuecos {
  plazoDeFabricacion: number;
  plantilla: Pick<
    PlantillaDelPresupuesto,
    'modificacionesIncluidas' | 'valorDeUnaModificacion' | 'garantiaMeses'
  >;
  abonado: Money;
  senaBp: PuntosBasicos;
}

export function huecosDelPresupuesto(
  entrada: EntradaDeLosHuecos,
  formatos: Formatos,
): Record<Hueco, string> {
  const { plantilla } = entrada;
  return {
    plazo: String(entrada.plazoDeFabricacion),
    modificaciones: conSuPlural(
      plantilla.modificacionesIncluidas,
      'modificación',
      'modificaciones',
    ),
    valor_modificacion: formatos.pesos(plantilla.valorDeUnaModificacion),
    relevamiento: formatos.pesos(entrada.abonado),
    sena: `${formatos.porcentaje(entrada.senaBp)}%`,
    meses: conSuPlural(plantilla.garantiaMeses, 'mes', 'meses'),
  };
}

export function textoDeLaGarantia(
  plantilla: Pick<PlantillaDelPresupuesto, 'garantia' | 'garantiaMeses'>,
): string {
  return completarHuecos(plantilla.garantia, {
    meses: conSuPlural(plantilla.garantiaMeses, 'mes', 'meses'),
  });
}

function limpio(texto: string): string {
  return texto
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function lasElegidas(clausulas: readonly Clausula[], seleccion: Seleccion): TextoConTitulo[] {
  const tildadas = new Set(seleccion.tildadas);
  return [
    ...clausulas
      .filter((clausula) => tildadas.has(clausula.id))
      .map(({ titulo, texto }) => ({ titulo, texto })),
    ...seleccion.propias.map(({ texto }) => ({ titulo: null, texto })),
  ];
}

export function textoDeLaForma(
  plantilla: Pick<PlantillaDelPresupuesto, 'formasDePago'>,
  elegida: FormaElegida | null,
): string | null {
  if (elegida === null) return null;
  if (elegida.texto !== null) return elegida.texto;
  return plantilla.formasDePago.find(({ id }) => id === elegida.plantillaId)?.texto ?? null;
}

export function documentoDelPresupuesto(
  entrada: EntradaDelDocumento,
  formatos: Formatos,
): DocumentoDelPresupuesto {
  const { borrador, plantilla } = entrada;
  const huecos = huecosDelPresupuesto(
    {
      plazoDeFabricacion: borrador.plazoDeFabricacion,
      plantilla,
      abonado: entrada.abonado,
      senaBp: entrada.senaBp,
    },
    formatos,
  );
  const completar = (texto: string): string => limpio(completarHuecos(texto, huecos));
  const conTextos = (textos: readonly TextoConTitulo[]): TextoConTitulo[] =>
    textos
      .filter(({ texto }) => !(usaElHueco(texto, 'relevamiento') && entrada.abonado <= 0))
      .map(({ titulo, texto }) => ({ titulo, texto: completar(texto) }))
      .filter(({ texto }) => texto !== '');
  const soloTextos = (textos: readonly TextoConTitulo[]): string[] =>
    conTextos(textos).map(({ texto }) => texto);
  const forma = textoDeLaForma(plantilla, borrador.formaDePago);

  return {
    forma: 1,
    taller: entrada.taller,
    cliente: recortado(limpio(entrada.cliente), LARGOS_DEL_DOCUMENTO.cliente),
    titulo: limpio(borrador.titulo),
    obra: limpio(borrador.obra),
    descripcion: limpio(borrador.descripcion),
    muebles: borrador.muebles
      .map(({ nombre, descripcion }) => ({
        nombre: limpio(nombre),
        descripcion: limpio(descripcion),
      }))
      .filter(({ nombre, descripcion }) => nombre !== '' || descripcion !== ''),
    herrajes: borrador.herrajes.mostrar
      ? borrador.herrajes.lista.map(({ texto }) => limpio(texto)).filter((texto) => texto !== '')
      : [],
    aTenerEnCuenta: soloTextos(lasElegidas(plantilla.aTenerEnCuenta, borrador.aTenerEnCuenta)),
    incluye: soloTextos(lasElegidas(plantilla.incluye, borrador.incluye)),
    valores: entrada.valores,
    senaBp: entrada.senaBp,
    abonado: entrada.abonado,
    formaDePago: forma === null ? null : completar(forma) || null,
    plazoDeFabricacion: borrador.plazoDeFabricacion,
    validezDias: borrador.validezDias,
    avisos: conTextos(lasElegidas(plantilla.avisos, borrador.avisos)),
    condiciones: conTextos(lasElegidas(plantilla.condiciones, borrador.condiciones)),
    garantia: completar(plantilla.garantia),
    garantiaMeses: plantilla.garantiaMeses,
  };
}

export interface CuentaDeUnValor {
  id: string | null;
  letra: string | null;
  descripcion: string;
  total: Money;
  sena: Money;
  pagado: Money;
  faltaParaLaSena: Money;
  saldo: Money;
}

export function cuentasDelPresupuesto(
  valores: ValoresDelPresupuesto,
  senaBp: PuntosBasicos,
  pagado: Money,
): CuentaDeUnValor[] {
  const unValor = (
    id: string | null,
    letra: string | null,
    descripcion: string,
    total: Money,
  ): CuentaDeUnValor => {
    const esperada = aplicarPorcentaje(total, senaBp);
    return {
      id,
      letra,
      descripcion,
      total,
      sena: esperada,
      pagado,
      faltaParaLaSena: maximo(CERO, restar(esperada, pagado)),
      saldo: maximo(CERO, restar(total, maximo(esperada, pagado))),
    };
  };
  if (valores.tipo === 'total') return [unValor(null, null, '', valores.total)];
  return valores.opciones.map((opcion) =>
    unValor(opcion.id, opcion.letra, opcion.descripcion, opcion.total),
  );
}

export function soloLaAceptada(
  documento: DocumentoDelPresupuesto,
  opcionId: string | null,
): DocumentoDelPresupuesto {
  if (documento.valores?.tipo !== 'opciones' || opcionId === null) return documento;
  const opciones = documento.valores.opciones.filter(({ id }) => id === opcionId);
  return {
    ...documento,
    valores: opciones.length === 0 ? null : { tipo: 'opciones', opciones },
  };
}

export function totalPropuesto(valores: ValoresDelPresupuesto | null): Money | null {
  if (valores === null) return null;
  if (valores.tipo === 'total') return valores.total;
  const [unica, ...otras] = valores.opciones;
  return unica === undefined || otras.length > 0 ? null : unica.total;
}

export function acordadoAlAprobar(
  valores: ValoresDelPresupuesto | null,
  precio: Money | null,
): Money | null {
  if (precio === null) return null;
  return totalPropuesto(valores) === precio ? null : precio;
}

export function plazoDelPresupuesto(
  documento: Pick<DocumentoDelPresupuesto, 'plazoDeFabricacion'> | null,
): number {
  return documento?.plazoDeFabricacion ?? DIAS_HABILES_DE_ENTREGA;
}

export function numeroVisible(numero: string | null, revision: number): string {
  if (numero === null) return 'Sin número todavía';
  return revision <= 1 ? `Nº ${numero}` : `Nº ${numero} · Rev. ${String(revision)}`;
}

const PROHIBIDOS_EN_UN_ARCHIVO = '/\\:*?"<>|';

function sinProhibidos(texto: string): string {
  return Array.from(texto, (letra) =>
    letra.charCodeAt(0) < 32 || PROHIBIDOS_EN_UN_ARCHIVO.includes(letra) ? ' ' : letra,
  ).join('');
}

export function nombreDelArchivo(
  documento: Pick<DocumentoDelPresupuesto, 'cliente'>,
  numero: string | null,
  revision: number,
): string {
  const cliente = sinProhibidos(documento.cliente).replace(/\s+/g, ' ').trim();
  const cabeza =
    numero === null
      ? 'Presupuesto (borrador)'
      : revision <= 1
        ? `Presupuesto ${numero}`
        : `Presupuesto ${numero} Rev ${String(revision)}`;
  return `${cliente === '' ? cabeza : `${cabeza} - ${cliente}`}.pdf`;
}

export function tituloDelArchivo(numero: string | null, revision: number): string {
  if (numero === null) return 'Presupuesto (borrador)';
  return revision <= 1
    ? `Presupuesto ${numero}`
    : `Presupuesto ${numero} · Rev. ${String(revision)}`;
}

export function mensajeParaElTaller(numero: string, revision: number): string {
  const cual = revision <= 1 ? `Nº ${numero}` : `Nº ${numero} Rev. ${String(revision)}`;
  return `Hola, te escribo por el presupuesto ${cual}.`;
}

export const CAMPOS_QUE_FALTAN = ['titulo', 'muebles', 'valores', 'queCambio'] as const;

export type CampoQueFalta = (typeof CAMPOS_QUE_FALTAN)[number];

export interface LoQueFalta {
  campo: CampoQueFalta;
  texto: string;
}

export const TEXTOS_DE_LO_QUE_FALTA = {
  titulo: 'Ponele un título al trabajo.',
  muebles: 'Describí por lo menos un mueble.',
  total: 'Poné el total del presupuesto.',
  opciones: 'Cada opción necesita su importe.',
  queCambio: 'Contale a tu cliente qué cambió.',
  queCambioLargo: 'Lo que cambió tiene que entrar en 280 caracteres.',
} as const;

function faltanLosValores(valores: ValoresDelPresupuesto | null): string | null {
  if (valores === null) return TEXTOS_DE_LO_QUE_FALTA.total;
  if (valores.tipo === 'total') return valores.total <= 0 ? TEXTOS_DE_LO_QUE_FALTA.total : null;
  return valores.opciones.length === 0 || valores.opciones.some(({ total }) => total <= 0)
    ? TEXTOS_DE_LO_QUE_FALTA.opciones
    : null;
}

export function problemasParaMandar(
  documento: Pick<DocumentoDelPresupuesto, 'titulo' | 'muebles' | 'valores'>,
  revisionQueSeManda: number,
  queCambio: string,
): LoQueFalta[] {
  const falta: LoQueFalta[] = [];
  if (!tieneTexto(documento.titulo)) {
    falta.push({ campo: 'titulo', texto: TEXTOS_DE_LO_QUE_FALTA.titulo });
  }
  if (!documento.muebles.some(({ descripcion }) => tieneTexto(descripcion))) {
    falta.push({ campo: 'muebles', texto: TEXTOS_DE_LO_QUE_FALTA.muebles });
  }
  const deLosValores = faltanLosValores(documento.valores);
  if (deLosValores !== null) falta.push({ campo: 'valores', texto: deLosValores });
  if (revisionQueSeManda > 1) {
    const escrito = sinBlancosEnLasPuntas(queCambio);
    if (escrito === '') {
      falta.push({ campo: 'queCambio', texto: TEXTOS_DE_LO_QUE_FALTA.queCambio });
    } else if (largoDelTexto(escrito) > LARGOS_DEL_PRESUPUESTO.queCambio) {
      falta.push({ campo: 'queCambio', texto: TEXTOS_DE_LO_QUE_FALTA.queCambioLargo });
    }
  }
  return falta;
}

export function totalDeLoPagado(pagos: readonly { monto: Money }[]): Money {
  return sumarTodos(pagos.map(({ monto }) => monto));
}

export function resumenDeLosValores(
  valores: ValoresDelPresupuesto | null,
  pesos: (importe: Money) => string,
): string | null {
  if (valores === null) return null;
  if (valores.tipo === 'total') return pesos(valores.total);
  return valores.opciones.map(({ letra, total }) => `Opción ${letra} ${pesos(total)}`).join(' · ');
}

function igualesEnProfundidad(una: unknown, otra: unknown): boolean {
  if (una === otra) return true;
  if (typeof una !== 'object' || typeof otra !== 'object' || una === null || otra === null) {
    return false;
  }
  if (Array.isArray(una) !== Array.isArray(otra)) return false;
  const deUna = una as Readonly<Record<string, unknown>>;
  const deOtra = otra as Readonly<Record<string, unknown>>;
  const claves = Object.keys(deUna);
  if (claves.length !== Object.keys(deOtra).length) return false;
  return claves.every((clave) => igualesEnProfundidad(deUna[clave], deOtra[clave]));
}

export function hayCambiosSinMandar(
  entrada: EntradaDelDocumento,
  ultima: DocumentoDelPresupuesto | null,
  formatos: Formatos,
): boolean {
  if (ultima === null) return true;
  const hoy = documentoDelPresupuesto(
    { ...entrada, abonado: ultima.abonado, taller: ultima.taller },
    formatos,
  );
  return !igualesEnProfundidad(hoy, ultima);
}

function esObjeto(valor: unknown): valor is Readonly<Record<string, unknown>> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function entero(valor: unknown): number | null {
  return typeof valor === 'number' && Number.isSafeInteger(valor) ? valor : null;
}

function enRango(valor: number, rango: { desde: number; hasta: number }): boolean {
  return valor >= rango.desde && valor <= rango.hasta;
}

function textoLeido(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

function textosLeidos(valor: unknown): string[] {
  if (!Array.isArray(valor)) return [];
  return valor.filter((uno): uno is string => typeof uno === 'string' && uno !== '');
}

function importeLeido(valor: unknown): Money | null {
  const numero = entero(valor);
  return numero === null ? null : centavos(numero);
}

function enteroEn(valor: unknown, rango: { desde: number; hasta: number }): number | null {
  const numero = entero(valor);
  return numero !== null && enRango(numero, rango) ? numero : null;
}

function tituloLeido(valor: unknown): string | null {
  return typeof valor === 'string' && valor !== '' ? valor : null;
}

function textosConTituloLeidos(valor: unknown): TextoConTitulo[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((uno: unknown) => {
    if (!esObjeto(uno) || typeof uno.texto !== 'string' || uno.texto === '') return [];
    return [{ titulo: tituloLeido(uno.titulo), texto: uno.texto }];
  });
}

function mueblesLeidos(valor: unknown): MuebleDelDocumento[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((uno: unknown) => {
    if (!esObjeto(uno)) return [];
    const mueble = { nombre: textoLeido(uno.nombre), descripcion: textoLeido(uno.descripcion) };
    return mueble.nombre === '' && mueble.descripcion === '' ? [] : [mueble];
  });
}

function condicionLeida(valor: unknown): CondicionFiscal | null {
  return CONDICIONES_FISCALES.find((una) => una === valor) ?? null;
}

function tallerLeido(valor: unknown): DatosDelTaller {
  const crudo = esObjeto(valor) ? valor : {};
  return {
    nombre: textoLeido(crudo.nombre),
    titular: textoLeido(crudo.titular),
    cuit: textoLeido(crudo.cuit),
    condicionFiscal: condicionLeida(crudo.condicionFiscal),
    domicilio: textoLeido(crudo.domicilio),
    telefono: textoLeido(crudo.telefono),
    email: textoLeido(crudo.email),
  };
}

function valoresLeidos(valor: unknown): ValoresDelPresupuesto | null {
  if (!esObjeto(valor)) return null;
  if (valor.tipo === 'total') {
    const total = importeLeido(valor.total);
    return total === null ? null : { tipo: 'total', total };
  }
  if (valor.tipo !== 'opciones' || !Array.isArray(valor.opciones)) return null;
  const opciones = valor.opciones.flatMap((una: unknown, indice: number) => {
    if (!esObjeto(una) || typeof una.id !== 'string') return [];
    const total = importeLeido(una.total);
    if (total === null) return [];
    const letra = typeof una.letra === 'string' && una.letra !== '' ? una.letra : null;
    return [
      {
        id: una.id,
        letra: letra ?? letraDeLaOpcion(indice),
        descripcion: textoLeido(una.descripcion),
        total,
      },
    ];
  });
  return opciones.length === 0 ? null : { tipo: 'opciones', opciones };
}

export function leerDocumento(valor: unknown): DocumentoDelPresupuesto | null {
  if (!esObjeto(valor) || valor.forma !== 1) return null;
  const sena = enteroEn(valor.senaBp, { desde: 0, hasta: BASE_PUNTOS_BASICOS });
  const forma = textoLeido(valor.formaDePago);
  const rangos = RANGOS_DEL_PRESUPUESTO;
  return {
    forma: 1,
    taller: tallerLeido(valor.taller),
    cliente: textoLeido(valor.cliente),
    titulo: textoLeido(valor.titulo),
    obra: textoLeido(valor.obra),
    descripcion: textoLeido(valor.descripcion),
    muebles: mueblesLeidos(valor.muebles),
    herrajes: textosLeidos(valor.herrajes),
    aTenerEnCuenta: textosLeidos(valor.aTenerEnCuenta),
    incluye: textosLeidos(valor.incluye),
    valores: valoresLeidos(valor.valores),
    senaBp: sena === null ? SENA_HABITUAL : puntosBasicos(sena),
    abonado: importeLeido(valor.abonado) ?? CERO,
    formaDePago: forma === '' ? null : forma,
    plazoDeFabricacion:
      enteroEn(valor.plazoDeFabricacion, rangos.plazoDeFabricacion) ??
      PLANTILLA_DE_SIEMPRE.plazoDeFabricacion,
    validezDias: enteroEn(valor.validezDias, rangos.validezDias),
    avisos: textosConTituloLeidos(valor.avisos),
    condiciones: textosConTituloLeidos(valor.condiciones),
    garantia: textoLeido(valor.garantia),
    garantiaMeses:
      enteroEn(valor.garantiaMeses, rangos.garantiaMeses) ?? PLANTILLA_DE_SIEMPRE.garantiaMeses,
  };
}

export type ProblemaDeLaPlantilla =
  | 'forma-invalida'
  | 'plazo-fuera-de-rango'
  | 'modificaciones-fuera-de-rango'
  | 'valor-fuera-de-rango'
  | 'garantia-fuera-de-rango'
  | 'demasiadas-clausulas'
  | 'id-invalido'
  | 'id-repetido'
  | 'titulo-largo'
  | 'texto-vacio'
  | 'texto-largo'
  | 'sin-formas-de-pago'
  | 'demasiadas-formas-de-pago'
  | 'nombre-vacio'
  | 'nombre-largo'
  | 'garantia-vacia'
  | 'garantia-larga';

function esClausula(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.texto === 'string' &&
    typeof valor.tildadaPorDefecto === 'boolean' &&
    (valor.titulo === undefined || valor.titulo === null || typeof valor.titulo === 'string')
  );
}

function esFormaDePago(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    typeof valor.texto === 'string'
  );
}

function esListaDe(valor: unknown, cada: (uno: unknown) => boolean): valor is unknown[] {
  return Array.isArray(valor) && valor.every(cada);
}

function problemaDelId(id: string, vistos: Set<string>): 'id-invalido' | 'id-repetido' | null {
  if (!FORMATO_DEL_ID.test(id)) return 'id-invalido';
  if (vistos.has(id)) return 'id-repetido';
  vistos.add(id);
  return null;
}

function problemaDelTexto(texto: string, largo: number): 'texto-vacio' | 'texto-largo' | null {
  if (!tieneTexto(texto)) return 'texto-vacio';
  return largoDelTexto(texto) > largo ? 'texto-largo' : null;
}

function problemaDeLasClausulas(clausulas: readonly unknown[]): ProblemaDeLaPlantilla | null {
  if (clausulas.length > TOPES_DEL_PRESUPUESTO.clausulasPorGrupo) return 'demasiadas-clausulas';
  const vistos = new Set<string>();
  for (const una of clausulas as readonly Clausula[]) {
    const problema =
      problemaDelId(una.id, vistos) ??
      (typeof una.titulo === 'string' &&
      largoDelTexto(una.titulo) > LARGOS_DEL_PRESUPUESTO.tituloDeClausula
        ? 'titulo-largo'
        : null) ??
      problemaDelTexto(una.texto, LARGOS_DEL_PRESUPUESTO.textoDeClausula);
    if (problema !== null) return problema;
  }
  return null;
}

function problemaDeLasFormas(formas: readonly unknown[]): ProblemaDeLaPlantilla | null {
  if (formas.length === 0) return 'sin-formas-de-pago';
  if (formas.length > TOPES_DEL_PRESUPUESTO.formasDePago) return 'demasiadas-formas-de-pago';
  const vistos = new Set<string>();
  for (const una of formas as readonly FormaDePago[]) {
    const deLaForma = problemaDelId(una.id, vistos);
    if (deLaForma !== null) return deLaForma;
    if (!tieneTexto(una.nombre)) return 'nombre-vacio';
    if (largoDelTexto(una.nombre) > LARGOS_DEL_PRESUPUESTO.nombreDeLaForma) return 'nombre-largo';
    const delTexto = problemaDelTexto(una.texto, LARGOS_DEL_PRESUPUESTO.textoDeClausula);
    if (delTexto !== null) return delTexto;
  }
  return null;
}

export function problemaDeLaPlantilla(valor: unknown): ProblemaDeLaPlantilla | null {
  if (!esObjeto(valor) || valor.forma !== 1) return 'forma-invalida';
  const plazo = entero(valor.plazoDeFabricacion);
  const modificaciones = entero(valor.modificacionesIncluidas);
  const valorDeUna = entero(valor.valorDeUnaModificacion);
  const meses = entero(valor.garantiaMeses);
  const grupos = GRUPOS_DE_CLAUSULAS.map((grupo) => valor[grupo]);
  if (
    plazo === null ||
    modificaciones === null ||
    valorDeUna === null ||
    meses === null ||
    !grupos.every((grupo) => esListaDe(grupo, esClausula)) ||
    !esListaDe(valor.formasDePago, esFormaDePago) ||
    typeof valor.garantia !== 'string'
  ) {
    return 'forma-invalida';
  }
  const rangos = RANGOS_DEL_PRESUPUESTO;
  if (!enRango(plazo, rangos.plazoDeFabricacion)) return 'plazo-fuera-de-rango';
  if (!enRango(modificaciones, rangos.modificacionesIncluidas)) {
    return 'modificaciones-fuera-de-rango';
  }
  if (valorDeUna < 0 || valorDeUna > IMPORTE_MAXIMO_DEL_PRESUPUESTO) return 'valor-fuera-de-rango';
  if (!enRango(meses, rangos.garantiaMeses)) return 'garantia-fuera-de-rango';
  for (const grupo of grupos) {
    const problema = problemaDeLasClausulas(grupo);
    if (problema !== null) return problema;
  }
  const deLasFormas = problemaDeLasFormas(valor.formasDePago);
  if (deLasFormas !== null) return deLasFormas;
  if (!tieneTexto(valor.garantia)) return 'garantia-vacia';
  if (largoDelTexto(valor.garantia) > LARGOS_DEL_PRESUPUESTO.textoDeClausula) {
    return 'garantia-larga';
  }
  return null;
}

function clausulasDe(valor: unknown): Clausula[] {
  return (valor as readonly Clausula[]).map((una) => ({
    id: una.id,
    titulo: tituloLeido(una.titulo),
    texto: una.texto,
    tildadaPorDefecto: una.tildadaPorDefecto,
  }));
}

export function leerPlantilla(valor: unknown): PlantillaDelPresupuesto | null {
  if (problemaDeLaPlantilla(valor) !== null) return null;
  const leida = valor as Readonly<Record<string, unknown>>;
  return {
    forma: 1,
    plazoDeFabricacion: leida.plazoDeFabricacion as number,
    modificacionesIncluidas: leida.modificacionesIncluidas as number,
    valorDeUnaModificacion: centavos(leida.valorDeUnaModificacion as number),
    garantiaMeses: leida.garantiaMeses as number,
    incluye: clausulasDe(leida.incluye),
    aTenerEnCuenta: clausulasDe(leida.aTenerEnCuenta),
    formasDePago: (leida.formasDePago as readonly FormaDePago[]).map(({ id, nombre, texto }) => ({
      id,
      nombre,
      texto,
    })),
    avisos: clausulasDe(leida.avisos),
    condiciones: clausulasDe(leida.condiciones),
    garantia: leida.garantia as string,
  };
}

export function plantillaDelTaller(guardada: unknown): PlantillaDelPresupuesto {
  return leerPlantilla(guardada) ?? PLANTILLA_DE_SIEMPRE;
}

export type ProblemaDelPresupuesto =
  | 'forma-invalida'
  | 'titulo-largo'
  | 'obra-larga'
  | 'descripcion-larga'
  | 'demasiados-muebles'
  | 'id-invalido'
  | 'id-repetido'
  | 'nombre-del-mueble-largo'
  | 'detalle-del-mueble-largo'
  | 'demasiados-herrajes'
  | 'herraje-largo'
  | 'demasiadas-tildadas'
  | 'demasiadas-propias'
  | 'propia-larga'
  | 'forma-de-pago-larga'
  | 'plazo-fuera-de-rango'
  | 'validez-fuera-de-rango';

function esMueble(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    typeof valor.id === 'string' &&
    typeof valor.nombre === 'string' &&
    typeof valor.descripcion === 'string'
  );
}

function esPropia(valor: unknown): boolean {
  return esObjeto(valor) && typeof valor.id === 'string' && typeof valor.texto === 'string';
}

function esSeleccion(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    esListaDe(valor.tildadas, (una) => typeof una === 'string') &&
    esListaDe(valor.propias, esPropia)
  );
}

function esFormaElegida(valor: unknown): boolean {
  return (
    valor === null ||
    (esObjeto(valor) &&
      typeof valor.plantillaId === 'string' &&
      (valor.texto === null || typeof valor.texto === 'string'))
  );
}

function tieneLaFormaDeUnBorrador(valor: Readonly<Record<string, unknown>>): boolean {
  const herrajes = valor.herrajes;
  return (
    typeof valor.titulo === 'string' &&
    typeof valor.obra === 'string' &&
    typeof valor.descripcion === 'string' &&
    esListaDe(valor.muebles, esMueble) &&
    esObjeto(herrajes) &&
    typeof herrajes.mostrar === 'boolean' &&
    esListaDe(herrajes.lista, esPropia) &&
    GRUPOS_DE_CLAUSULAS.every((grupo) => esSeleccion(valor[grupo])) &&
    esFormaElegida(valor.formaDePago) &&
    entero(valor.plazoDeFabricacion) !== null &&
    (valor.validezDias === null || entero(valor.validezDias) !== null)
  );
}

function problemaDeLaSeleccion(seleccion: Seleccion): ProblemaDelPresupuesto | null {
  if (seleccion.tildadas.length > TOPES_DEL_PRESUPUESTO.clausulasPorGrupo) {
    return 'demasiadas-tildadas';
  }
  const tildadas = new Set<string>();
  for (const id of seleccion.tildadas) {
    const problema = problemaDelId(id, tildadas);
    if (problema !== null) return problema;
  }
  if (seleccion.propias.length > TOPES_DEL_PRESUPUESTO.propiasPorGrupo) return 'demasiadas-propias';
  const propias = new Set<string>();
  for (const propia of seleccion.propias) {
    const problema = problemaDelId(propia.id, propias);
    if (problema !== null) return problema;
    if (largoDelTexto(propia.texto) > LARGOS_DEL_PRESUPUESTO.propia) return 'propia-larga';
  }
  return null;
}

function problemaDeLosMuebles(muebles: readonly Mueble[]): ProblemaDelPresupuesto | null {
  if (muebles.length > TOPES_DEL_PRESUPUESTO.muebles) return 'demasiados-muebles';
  const vistos = new Set<string>();
  for (const mueble of muebles) {
    const problema = problemaDelId(mueble.id, vistos);
    if (problema !== null) return problema;
    if (largoDelTexto(mueble.nombre) > LARGOS_DEL_PRESUPUESTO.nombreDelMueble) {
      return 'nombre-del-mueble-largo';
    }
    if (largoDelTexto(mueble.descripcion) > LARGOS_DEL_PRESUPUESTO.descripcionDelMueble) {
      return 'detalle-del-mueble-largo';
    }
  }
  return null;
}

function problemaDeLosHerrajes(herrajes: readonly Propia[]): ProblemaDelPresupuesto | null {
  if (herrajes.length > TOPES_DEL_PRESUPUESTO.herrajes) return 'demasiados-herrajes';
  const vistos = new Set<string>();
  for (const herraje of herrajes) {
    const problema = problemaDelId(herraje.id, vistos);
    if (problema !== null) return problema;
    if (largoDelTexto(herraje.texto) > LARGOS_DEL_PRESUPUESTO.herraje) return 'herraje-largo';
  }
  return null;
}

export function problemaDelBorrador(valor: unknown): ProblemaDelPresupuesto | null {
  if (!esObjeto(valor) || valor.forma !== 1 || !tieneLaFormaDeUnBorrador(valor)) {
    return 'forma-invalida';
  }
  const borrador = valor as unknown as BorradorDelPresupuesto;
  const largos = LARGOS_DEL_PRESUPUESTO;
  if (largoDelTexto(borrador.titulo) > largos.titulo) return 'titulo-largo';
  if (largoDelTexto(borrador.obra) > largos.obra) return 'obra-larga';
  if (largoDelTexto(borrador.descripcion) > largos.descripcion) return 'descripcion-larga';
  const problema =
    problemaDeLosMuebles(borrador.muebles) ??
    problemaDeLosHerrajes(borrador.herrajes.lista) ??
    GRUPOS_DE_CLAUSULAS.map((grupo) => problemaDeLaSeleccion(borrador[grupo])).find(
      (uno) => uno !== null,
    ) ??
    null;
  if (problema !== null) return problema;
  const forma = borrador.formaDePago;
  if (forma !== null) {
    if (!FORMATO_DEL_ID.test(forma.plantillaId)) return 'id-invalido';
    if (forma.texto !== null && largoDelTexto(forma.texto) > largos.textoDeClausula) {
      return 'forma-de-pago-larga';
    }
  }
  const rangos = RANGOS_DEL_PRESUPUESTO;
  if (!enRango(borrador.plazoDeFabricacion, rangos.plazoDeFabricacion)) {
    return 'plazo-fuera-de-rango';
  }
  if (borrador.validezDias !== null && !enRango(borrador.validezDias, rangos.validezDias)) {
    return 'validez-fuera-de-rango';
  }
  return null;
}

function propiasLeidas(valor: unknown): Propia[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((una: unknown) =>
    esPropia(una) ? [{ id: (una as Propia).id, texto: (una as Propia).texto }] : [],
  );
}

function seleccionLeida(valor: unknown, deSiempre: readonly Clausula[]): Seleccion {
  if (!esObjeto(valor)) return tildadasPorDefecto(deSiempre);
  return {
    tildadas: Array.isArray(valor.tildadas)
      ? valor.tildadas.filter((una): una is string => typeof una === 'string')
      : [],
    propias: propiasLeidas(valor.propias),
  };
}

function formaElegidaLeida(
  valor: unknown,
  plantilla: PlantillaDelPresupuesto,
): FormaElegida | null {
  if (valor === null) return null;
  if (esObjeto(valor) && typeof valor.plantillaId === 'string') {
    return {
      plantillaId: valor.plantillaId,
      texto: typeof valor.texto === 'string' ? valor.texto : null,
    };
  }
  const primera = plantilla.formasDePago[0];
  return primera === undefined ? null : { plantillaId: primera.id, texto: null };
}

export function leerBorrador(
  valor: unknown,
  plantilla: PlantillaDelPresupuesto,
): BorradorDelPresupuesto | null {
  if (!esObjeto(valor) || valor.forma !== 1) return null;
  const herrajes = esObjeto(valor.herrajes) ? valor.herrajes : {};
  const rangos = RANGOS_DEL_PRESUPUESTO;
  return {
    forma: 1,
    titulo: textoLeido(valor.titulo),
    obra: textoLeido(valor.obra),
    descripcion: textoLeido(valor.descripcion),
    muebles: Array.isArray(valor.muebles)
      ? valor.muebles.flatMap((uno: unknown) => {
          if (!esMueble(uno)) return [];
          const { id, nombre, descripcion } = uno as Mueble;
          return [{ id, nombre, descripcion }];
        })
      : [],
    herrajes: {
      mostrar: typeof herrajes.mostrar === 'boolean' ? herrajes.mostrar : true,
      lista: propiasLeidas(herrajes.lista),
    },
    aTenerEnCuenta: seleccionLeida(valor.aTenerEnCuenta, plantilla.aTenerEnCuenta),
    incluye: seleccionLeida(valor.incluye, plantilla.incluye),
    formaDePago: formaElegidaLeida(valor.formaDePago, plantilla),
    plazoDeFabricacion:
      enteroEn(valor.plazoDeFabricacion, rangos.plazoDeFabricacion) ?? plantilla.plazoDeFabricacion,
    validezDias:
      valor.validezDias === null
        ? null
        : (enteroEn(valor.validezDias, rangos.validezDias) ?? DIAS_QUE_VALE_UN_PRESUPUESTO),
    avisos: seleccionLeida(valor.avisos, plantilla.avisos),
    condiciones: seleccionLeida(valor.condiciones, plantilla.condiciones),
  };
}

export type ProblemaDelDocumento =
  | 'forma-invalida'
  | 'sena-fuera-de-rango'
  | 'abonado-fuera-de-rango'
  | 'plazo-fuera-de-rango'
  | 'validez-fuera-de-rango'
  | 'garantia-fuera-de-rango'
  | 'importe-fuera-de-rango'
  | 'demasiados-muebles'
  | 'demasiados-herrajes'
  | 'demasiadas-clausulas'
  | 'demasiadas-opciones'
  | 'texto-largo';

function esTexto(valor: unknown): valor is string {
  return typeof valor === 'string';
}

function esTallerDelDocumento(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    esTexto(valor.nombre) &&
    esTexto(valor.titular) &&
    esTexto(valor.cuit) &&
    esTexto(valor.domicilio) &&
    esTexto(valor.telefono) &&
    esTexto(valor.email) &&
    (valor.condicionFiscal === null || condicionLeida(valor.condicionFiscal) !== null)
  );
}

function esMuebleDelDocumento(valor: unknown): boolean {
  return esObjeto(valor) && esTexto(valor.nombre) && esTexto(valor.descripcion);
}

function esTextoConTitulo(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    esTexto(valor.texto) &&
    (valor.titulo === undefined || valor.titulo === null || esTexto(valor.titulo))
  );
}

function esOpcionDelDocumento(valor: unknown): boolean {
  return (
    esObjeto(valor) &&
    esTexto(valor.id) &&
    esTexto(valor.letra) &&
    esTexto(valor.descripcion) &&
    entero(valor.total) !== null
  );
}

function sonValoresDelDocumento(valor: unknown): boolean {
  if (valor === null) return true;
  if (!esObjeto(valor)) return false;
  if (valor.tipo === 'total') return entero(valor.total) !== null;
  return valor.tipo === 'opciones' && esListaDe(valor.opciones, esOpcionDelDocumento);
}

function tieneLaFormaDeUnDocumento(valor: Readonly<Record<string, unknown>>): boolean {
  return (
    esTallerDelDocumento(valor.taller) &&
    esTexto(valor.cliente) &&
    esTexto(valor.titulo) &&
    esTexto(valor.obra) &&
    esTexto(valor.descripcion) &&
    esListaDe(valor.muebles, esMuebleDelDocumento) &&
    esListaDe(valor.herrajes, esTexto) &&
    esListaDe(valor.aTenerEnCuenta, esTexto) &&
    esListaDe(valor.incluye, esTexto) &&
    sonValoresDelDocumento(valor.valores) &&
    entero(valor.senaBp) !== null &&
    entero(valor.abonado) !== null &&
    (valor.formaDePago === null || esTexto(valor.formaDePago)) &&
    entero(valor.plazoDeFabricacion) !== null &&
    (valor.validezDias === null || entero(valor.validezDias) !== null) &&
    esListaDe(valor.avisos, esTextoConTitulo) &&
    esListaDe(valor.condiciones, esTextoConTitulo) &&
    esTexto(valor.garantia) &&
    entero(valor.garantiaMeses) !== null
  );
}

function textosDelDocumento(documento: DocumentoDelPresupuesto): [string, number][] {
  const { taller } = documento;
  const largos = LARGOS_DEL_DOCUMENTO;
  const derivado = largos.textoDerivado;
  const clausulas = [...documento.avisos, ...documento.condiciones];
  const opciones = documento.valores?.tipo === 'opciones' ? documento.valores.opciones : [];
  return [
    [taller.nombre, largos.nombreDelTaller],
    [taller.titular, largos.titular],
    [taller.cuit, largos.cuit],
    [taller.domicilio, largos.domicilio],
    [taller.telefono, largos.telefono],
    [taller.email, largos.email],
    [documento.cliente, largos.cliente],
    [documento.titulo, LARGOS_DEL_PRESUPUESTO.titulo],
    [documento.obra, LARGOS_DEL_PRESUPUESTO.obra],
    [documento.descripcion, LARGOS_DEL_PRESUPUESTO.descripcion],
    ...documento.muebles.flatMap(({ nombre, descripcion }): [string, number][] => [
      [nombre, LARGOS_DEL_PRESUPUESTO.nombreDelMueble],
      [descripcion, LARGOS_DEL_PRESUPUESTO.descripcionDelMueble],
    ]),
    ...documento.herrajes.map((herraje): [string, number] => [
      herraje,
      LARGOS_DEL_PRESUPUESTO.herraje,
    ]),
    ...[...documento.aTenerEnCuenta, ...documento.incluye].map((texto): [string, number] => [
      texto,
      derivado,
    ]),
    ...opciones.flatMap(({ letra, descripcion }): [string, number][] => [
      [letra, largos.letra],
      [descripcion, largos.descripcionDeLaOpcion],
    ]),
    [documento.formaDePago ?? '', derivado],
    ...clausulas.flatMap(({ titulo, texto }): [string, number][] => [
      [titulo ?? '', LARGOS_DEL_PRESUPUESTO.tituloDeClausula],
      [texto, derivado],
    ]),
    [documento.garantia, derivado],
  ];
}

function importeFuera(importe: number): boolean {
  return importe < 0 || importe > IMPORTE_MAXIMO_DEL_PRESUPUESTO;
}

export function problemaDelDocumento(valor: unknown): ProblemaDelDocumento | null {
  if (!esObjeto(valor) || valor.forma !== 1 || !tieneLaFormaDeUnDocumento(valor)) {
    return 'forma-invalida';
  }
  const documento = valor as unknown as DocumentoDelPresupuesto;
  const rangos = RANGOS_DEL_PRESUPUESTO;
  if (documento.senaBp < 0 || documento.senaBp > BASE_PUNTOS_BASICOS) return 'sena-fuera-de-rango';
  if (importeFuera(documento.abonado)) return 'abonado-fuera-de-rango';
  if (!enRango(documento.plazoDeFabricacion, rangos.plazoDeFabricacion)) {
    return 'plazo-fuera-de-rango';
  }
  if (documento.validezDias !== null && !enRango(documento.validezDias, rangos.validezDias)) {
    return 'validez-fuera-de-rango';
  }
  if (!enRango(documento.garantiaMeses, rangos.garantiaMeses)) return 'garantia-fuera-de-rango';
  const { valores } = documento;
  const importes =
    valores === null
      ? []
      : valores.tipo === 'total'
        ? [valores.total]
        : valores.opciones.map(({ total }) => total);
  if (importes.some(importeFuera)) return 'importe-fuera-de-rango';
  const topes = TOPES_DEL_PRESUPUESTO;
  if (documento.muebles.length > topes.muebles) return 'demasiados-muebles';
  if (documento.herrajes.length > topes.herrajes) return 'demasiados-herrajes';
  const grupos = [
    documento.aTenerEnCuenta,
    documento.incluye,
    documento.avisos,
    documento.condiciones,
  ];
  if (grupos.some((grupo) => grupo.length > topes.clausulasDelDocumento)) {
    return 'demasiadas-clausulas';
  }
  if (valores?.tipo === 'opciones' && valores.opciones.length > topes.opcionesDelDocumento) {
    return 'demasiadas-opciones';
  }
  if (textosDelDocumento(documento).some(([texto, largo]) => largoDelTexto(texto) > largo)) {
    return 'texto-largo';
  }
  return null;
}
