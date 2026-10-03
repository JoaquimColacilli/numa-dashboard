import {
  cotizacionLeida,
  esCotizacion,
  totalEnPesos,
  totalQueDescuenta,
  type Cotizacion,
  type ImporteDeUnPago,
} from './cotizacion.ts';
import { largoDelTexto, sinBlancosEnLasPuntas, tieneTexto } from './encuesta.ts';
import { DIAS_HABILES_DE_ENTREGA, esFechaQueExiste } from './fechas.ts';
import type { Idioma } from './idioma.ts';
import {
  aplicarPorcentaje,
  BASE_PUNTOS_BASICOS,
  centavos,
  centavosEn,
  esMoneda,
  maximo,
  MONEDA_DEL_TALLER,
  puntosBasicos,
  restar,
  type Moneda,
  type MonedaDelTaller,
  type Money,
  type PuntosBasicos,
} from './money.ts';
import type { Plata } from './plata.ts';
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

export const COMBINACIONES_DE_LA_MONEDA = [
  'dolaresEnPesos',
  'dolaresEnDolares',
  'dolaresEnPesosODolares',
  'pesosEnDolares',
  'pesosEnPesosODolares',
] as const;

export type CombinacionDeLaMoneda = (typeof COMBINACIONES_DE_LA_MONEDA)[number];

export type ClausulasDeLaMoneda = Readonly<Record<CombinacionDeLaMoneda, string>>;

export const COBROS_POSIBLES: readonly (readonly Moneda[])[] = [['ARS'], ['USD'], ['ARS', 'USD']];

export const LARGO_DE_LA_CLAUSULA_DEL_DOCUMENTO = 4000;

export interface ReferenciaEnPesos {
  cotizacion: Cotizacion;
  fecha: string;
}

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
  valorDeUnaModificacion: Money<Moneda>;
  monedaDeLaModificacion: Moneda;
  clausulasDeLaMoneda: ClausulasDeLaMoneda;
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

export const CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE: ClausulasDeLaMoneda = {
  dolaresEnPesos:
    'Se paga en pesos. Cada pago se convierte al tipo de cambio vendedor del dólar billete del Banco de la Nación Argentina al cierre del día hábil anterior a la fecha del pago, y se descuenta del saldo en dólares.',
  dolaresEnDolares:
    'Se paga en dólares estadounidenses. Si alguna parte se paga en pesos, se convierte al tipo de cambio vendedor del dólar billete del Banco de la Nación Argentina al cierre del día hábil anterior a ese pago.',
  dolaresEnPesosODolares:
    'Se paga en dólares estadounidenses o en pesos. Cada pago en pesos se convierte al tipo de cambio vendedor del dólar billete del Banco de la Nación Argentina al cierre del día hábil anterior a la fecha del pago, y se descuenta del saldo en dólares.',
  pesosEnDolares:
    'Se paga en dólares estadounidenses. Cada pago se toma a la cotización que se acuerde ese día y se descuenta del saldo en pesos.',
  pesosEnPesosODolares:
    'Si una parte se paga en dólares, se toma a la cotización que se acuerde ese día y se descuenta del saldo en pesos.',
};

export const PLANTILLA_DE_SIEMPRE: PlantillaDelPresupuesto = {
  forma: 1,
  plazoDeFabricacion: 30,
  modificacionesIncluidas: 2,
  valorDeUnaModificacion: centavos(5_000_000),
  monedaDeLaModificacion: MONEDA_DEL_TALLER,
  clausulasDeLaMoneda: CLAUSULAS_DE_LA_MONEDA_DE_SIEMPRE,
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

const PLANTILLA_DE_SIEMPRE_EN_INGLES: PlantillaDelPresupuesto = {
  forma: 1,
  plazoDeFabricacion: PLANTILLA_DE_SIEMPRE.plazoDeFabricacion,
  modificacionesIncluidas: PLANTILLA_DE_SIEMPRE.modificacionesIncluidas,
  valorDeUnaModificacion: PLANTILLA_DE_SIEMPRE.valorDeUnaModificacion,
  monedaDeLaModificacion: PLANTILLA_DE_SIEMPRE.monedaDeLaModificacion,
  clausulasDeLaMoneda: {
    dolaresEnPesos:
      'Payment is made in pesos. Each payment is converted at the Banco de la Nación Argentina US dollar banknote selling rate at the close of the business day before the payment date, and is deducted from the balance in dollars.',
    dolaresEnDolares:
      'Payment is made in US dollars. If any part is paid in pesos, it is converted at the Banco de la Nación Argentina US dollar banknote selling rate at the close of the business day before that payment.',
    dolaresEnPesosODolares:
      'Payment is made in US dollars or in pesos. Each payment in pesos is converted at the Banco de la Nación Argentina US dollar banknote selling rate at the close of the business day before the payment date, and is deducted from the balance in dollars.',
    pesosEnDolares:
      'Payment is made in US dollars. Each payment is converted at the rate agreed on that day and is deducted from the balance in pesos.',
    pesosEnPesosODolares:
      'If any part is paid in dollars, it is converted at the rate agreed on that day and is deducted from the balance in pesos.',
  },
  garantiaMeses: PLANTILLA_DE_SIEMPRE.garantiaMeses,
  incluye: [
    {
      id: 'incluye-visita',
      titulo: null,
      texto: 'Home visit to take measurements and settle the details.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-diseno',
      titulo: null,
      texto: '3D design based on the agreed requirements.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-fabricacion',
      titulo: null,
      texto: 'Development and manufacturing based on the proposed design.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-transporte',
      titulo: null,
      texto: 'Transport and delivery.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-instalacion',
      titulo: null,
      texto: 'Installation and finishing work at the home.',
      tildadaPorDefecto: true,
    },
  ],
  aTenerEnCuenta: [
    { id: 'no-mesada', titulo: null, texto: 'Countertop not included.', tildadaPorDefecto: false },
    {
      id: 'no-bacha',
      titulo: null,
      texto: 'Sink and faucets not included.',
      tildadaPorDefecto: false,
    },
    {
      id: 'no-conexiones',
      titulo: null,
      texto: 'Water, gas, and electrical connections not included.',
      tildadaPorDefecto: false,
    },
    {
      id: 'no-electrodomesticos',
      titulo: null,
      texto: 'Appliance installation not included.',
      tildadaPorDefecto: false,
    },
  ],
  formasDePago: [
    {
      id: 'sena-y-entrega',
      nombre: 'Deposit and balance on delivery',
      texto: '{sena} deposit to confirm the job, and the balance on delivery.',
    },
    {
      id: 'sena-y-cuotas',
      nombre: 'Deposit and installments',
      texto:
        '{sena} deposit to confirm the job, and the balance in installments, to be agreed before work begins.',
    },
    {
      id: 'todo-al-confirmar',
      nombre: 'Full payment upfront',
      texto: 'Full payment when the job is confirmed.',
    },
  ],
  avisos: [
    {
      id: 'aviso-plazo',
      titulo: null,
      texto:
        'The estimated lead time is {plazo} business days from when the deposit clears and the final project specifications are confirmed. This lead time reflects current production and material supply times. If the work is finished before the stated lead time, the client will be notified to arrange an earlier delivery. The stated lead times may be affected by delays in material supply, logistics, or external factors beyond the manufacturing process. Should any of these occur, the client will be informed in a timely manner.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-aceptacion',
      titulo: null,
      texto:
        'Paying the deposit and starting the project imply acceptance of the design, technical specifications, lead times, and conditions set out in this document.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-modificaciones',
      titulo: null,
      texto:
        'This quote includes a 3D design and up to {modificaciones}. Additional modifications (a complete redesign) have an estimated cost of {valor_modificacion} each.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-relevamiento',
      titulo: null,
      texto:
        'The amount paid for the site measure and 3D design ({relevamiento}) covers the site visit, measurements, layout, and 3D design. This amount is already included in the total of this quote and is deducted from the deposit.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-colores',
      titulo: null,
      texto:
        'The colors and patterns of the boards may look different on screens or in samples than they do in reality.',
      tildadaPorDefecto: true,
    },
  ],
  condiciones: [
    {
      id: 'condicion-espacio',
      titulo: 'Installation site conditions',
      texto:
        'The client must ensure adequate access and space for bringing in and installing the furniture. Exceptional situations that call for special maneuvers or additional work may require prior coordination.',
      tildadaPorDefecto: true,
    },
    {
      id: 'condicion-perforaciones',
      titulo: null,
      texto:
        'The client is solely responsible for disclosing and clearly marking the routes of cables and pipes in walls that may be drilled. MAUN is not liable for damage resulting from drilling in areas that were not marked or were incorrectly reported by the owner.',
      tildadaPorDefecto: true,
    },
  ],
  garantia:
    'Warranty for {meses} from delivery and installation, against manufacturing or installation defects. It does not cover damage from impacts, moisture or leaks, heat or direct sunlight, use other than intended, or repairs made by others.',
};

const PLANTILLA_DE_SIEMPRE_EN_PORTUGUES: PlantillaDelPresupuesto = {
  forma: 1,
  plazoDeFabricacion: PLANTILLA_DE_SIEMPRE.plazoDeFabricacion,
  modificacionesIncluidas: PLANTILLA_DE_SIEMPRE.modificacionesIncluidas,
  valorDeUnaModificacion: PLANTILLA_DE_SIEMPRE.valorDeUnaModificacion,
  monedaDeLaModificacion: PLANTILLA_DE_SIEMPRE.monedaDeLaModificacion,
  clausulasDeLaMoneda: {
    dolaresEnPesos:
      'O pagamento é feito em pesos. Cada pagamento é convertido pela cotação de venda do dólar em espécie do Banco de la Nación Argentina no fechamento do dia útil anterior à data do pagamento e é descontado do saldo em dólares.',
    dolaresEnDolares:
      'O pagamento é feito em dólares norte-americanos. Se alguma parte for paga em pesos, ela é convertida pela cotação de venda do dólar em espécie do Banco de la Nación Argentina no fechamento do dia útil anterior a esse pagamento.',
    dolaresEnPesosODolares:
      'O pagamento é feito em dólares norte-americanos ou em pesos. Cada pagamento em pesos é convertido pela cotação de venda do dólar em espécie do Banco de la Nación Argentina no fechamento do dia útil anterior à data do pagamento e é descontado do saldo em dólares.',
    pesosEnDolares:
      'O pagamento é feito em dólares norte-americanos. Cada pagamento é convertido pela cotação combinada nesse dia e é descontado do saldo em pesos.',
    pesosEnPesosODolares:
      'Se uma parte for paga em dólares, ela é convertida pela cotação combinada nesse dia e é descontada do saldo em pesos.',
  },
  garantiaMeses: PLANTILLA_DE_SIEMPRE.garantiaMeses,
  incluye: [
    {
      id: 'incluye-visita',
      titulo: null,
      texto: 'Visita ao local para medição e definição dos detalhes.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-diseno',
      titulo: null,
      texto: 'Projeto 3D conforme os requisitos estabelecidos.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-fabricacion',
      titulo: null,
      texto: 'Desenvolvimento e fabricação com base no projeto proposto.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-transporte',
      titulo: null,
      texto: 'Transporte e entrega.',
      tildadaPorDefecto: true,
    },
    {
      id: 'incluye-instalacion',
      titulo: null,
      texto: 'Montagem e acabamentos no local.',
      tildadaPorDefecto: true,
    },
  ],
  aTenerEnCuenta: [
    { id: 'no-mesada', titulo: null, texto: 'Bancada não inclusa.', tildadaPorDefecto: false },
    {
      id: 'no-bacha',
      titulo: null,
      texto: 'Cuba e torneira não inclusas.',
      tildadaPorDefecto: false,
    },
    {
      id: 'no-conexiones',
      titulo: null,
      texto: 'Ligações de água, gás e eletricidade não inclusas.',
      tildadaPorDefecto: false,
    },
    {
      id: 'no-electrodomesticos',
      titulo: null,
      texto: 'Instalação de eletrodomésticos não inclusa.',
      tildadaPorDefecto: false,
    },
  ],
  formasDePago: [
    {
      id: 'sena-y-entrega',
      nombre: 'Sinal e saldo na entrega',
      texto: 'Sinal de {sena} para confirmar o projeto e o saldo na entrega.',
    },
    {
      id: 'sena-y-cuotas',
      nombre: 'Sinal e parcelas',
      texto:
        'Sinal de {sena} para confirmar o projeto e o saldo em parcelas, a combinar antes de começar.',
    },
    {
      id: 'todo-al-confirmar',
      nombre: 'Tudo na confirmação',
      texto: 'Pagamento total na confirmação do projeto.',
    },
  ],
  avisos: [
    {
      id: 'aviso-plazo',
      titulo: null,
      texto:
        'O prazo estimado de fabricação é de {plazo} dias úteis a partir do recebimento do sinal e da confirmação das especificações finais do projeto. Este prazo considera os tempos atuais de produção e de fornecimento de materiais. Caso o trabalho seja concluído antes do prazo indicado, o cliente será avisado para combinar uma entrega antecipada. Os prazos indicados podem ser afetados por atrasos no fornecimento de materiais, na logística ou por fatores externos alheios ao processo de fabricação. Caso essas situações ocorram, o cliente será informado oportunamente.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-aceptacion',
      titulo: null,
      texto:
        'O pagamento do sinal e o início do projeto implicam a aceitação do design, das especificações técnicas, dos prazos de fabricação e das condições detalhadas neste documento.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-modificaciones',
      titulo: null,
      texto:
        'Este orçamento inclui projeto 3D e até {modificaciones}. Modificações adicionais (novo projeto completo) têm um valor estimado de {valor_modificacion} cada.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-relevamiento',
      titulo: null,
      texto:
        'O valor pago pela visita técnica e pelo projeto 3D ({relevamiento}) cobre a visita à obra, a tomada de medidas, o estudo e o projeto 3D. Esse valor já está incluído no total deste orçamento e é descontado do valor do sinal.',
      tildadaPorDefecto: true,
    },
    {
      id: 'aviso-colores',
      titulo: null,
      texto:
        'As cores e os padrões das chapas podem parecer diferentes nas telas ou nas amostras do que são na realidade.',
      tildadaPorDefecto: true,
    },
  ],
  condiciones: [
    {
      id: 'condicion-espacio',
      titulo: 'Condições do local de montagem',
      texto:
        'O cliente deverá garantir condições adequadas de acesso e de espaço para a entrada e a montagem do mobiliário. Situações excepcionais que exijam manobras especiais ou trabalhos adicionais podem precisar de coordenação prévia.',
      tildadaPorDefecto: true,
    },
    {
      id: 'condicion-perforaciones',
      titulo: null,
      texto:
        'É responsabilidade exclusiva do cliente informar e deixar claramente definidos os trajetos de cabos e tubulações nas paredes que possam ser perfuradas. A MAUN não se responsabiliza por danos decorrentes de perfurações em áreas não sinalizadas ou informadas incorretamente pelo proprietário.',
      tildadaPorDefecto: true,
    },
  ],
  garantia:
    'Garantia de {meses} a partir da entrega e da montagem, contra defeitos de fabricação ou de montagem. Não cobre danos causados por batidas, umidade ou infiltrações, calor ou sol direto, uso diferente do previsto, nem reparos feitos por terceiros.',
};

export const PLANTILLAS_DE_SIEMPRE: Readonly<Record<Idioma, PlantillaDelPresupuesto>> = {
  es: PLANTILLA_DE_SIEMPRE,
  en: PLANTILLA_DE_SIEMPRE_EN_INGLES,
  'pt-BR': PLANTILLA_DE_SIEMPRE_EN_PORTUGUES,
};

export function plantillaDeSiempre(idioma: Idioma): PlantillaDelPresupuesto {
  return PLANTILLAS_DE_SIEMPRE[idioma];
}

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

export interface ModificacionDelBorrador {
  importe: Money<Moneda>;
  moneda: Moneda;
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
  clausulaDeLaMoneda: string | null;
  modificacion: ModificacionDelBorrador | null;
  monedaDeLoAbonado: Moneda | null;
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

export interface OpcionDelDocumento<M extends Moneda = MonedaDelTaller> {
  id: string;
  letra: string;
  descripcion: string;
  total: Money<M>;
}

export type ValoresDelPresupuesto<M extends Moneda = MonedaDelTaller> =
  | { tipo: 'total'; total: Money<M> }
  | { tipo: 'opciones'; opciones: readonly OpcionDelDocumento<M>[] };

export interface TextoConTitulo {
  titulo: string | null;
  texto: string;
}

export interface MuebleDelDocumento {
  nombre: string;
  descripcion: string;
}

interface ComunDelDocumento {
  taller: DatosDelTaller;
  cliente: string;
  titulo: string;
  obra: string;
  descripcion: string;
  muebles: readonly MuebleDelDocumento[];
  herrajes: readonly string[];
  aTenerEnCuenta: readonly string[];
  incluye: readonly string[];
  senaBp: PuntosBasicos;
  abonado: Money<Moneda>;
  formaDePago: string | null;
  clausulaDeLaMoneda: string | null;
  cobraEn: readonly Moneda[];
  plazoDeFabricacion: number;
  validezDias: number | null;
  avisos: readonly TextoConTitulo[];
  condiciones: readonly TextoConTitulo[];
  garantia: string;
  garantiaMeses: number;
}

export interface DocumentoEnPesos extends ComunDelDocumento {
  forma: 1;
  valores: ValoresDelPresupuesto | null;
}

export interface DocumentoEnDolares extends ComunDelDocumento {
  forma: 2;
  moneda: 'USD';
  valores: ValoresDelPresupuesto<'USD'> | null;
  monedaDeLoAbonado: Moneda;
  referencia: ReferenciaEnPesos | null;
}

export type DocumentoDelPresupuesto = DocumentoEnPesos | DocumentoEnDolares;

export interface OpcionDelTrabajo<M extends Moneda = MonedaDelTaller> {
  id: string;
  descripcion: string;
  monto: Money<M>;
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

export function cobraEnLeido(valor: unknown): readonly Moneda[] | null {
  if (!Array.isArray(valor)) return null;
  const leido = valor as readonly unknown[];
  return (
    COBROS_POSIBLES.find(
      (posible) =>
        posible.length === leido.length &&
        posible.every((moneda, lugar) => leido[lugar] === moneda),
    ) ?? null
  );
}

export function combinacionDeLaMoneda(
  moneda: Moneda,
  cobraEn: readonly Moneda[] | null,
): CombinacionDeLaMoneda | null {
  const enPesos = (cobraEn ?? [MONEDA_DEL_TALLER]).includes(MONEDA_DEL_TALLER);
  const enDolares = (cobraEn ?? []).includes('USD');
  if (moneda === MONEDA_DEL_TALLER) {
    if (!enDolares) return null;
    return enPesos ? 'pesosEnPesosODolares' : 'pesosEnDolares';
  }
  if (!enDolares) return 'dolaresEnPesos';
  return enPesos ? 'dolaresEnPesosODolares' : 'dolaresEnDolares';
}

export function monedaDelDocumento(documento: DocumentoDelPresupuesto): Moneda {
  return documento.forma === 2 ? documento.moneda : MONEDA_DEL_TALLER;
}

export function monedaDeLoAbonadoDelDocumento(documento: DocumentoDelPresupuesto): Moneda {
  return documento.forma === 2 ? documento.monedaDeLoAbonado : MONEDA_DEL_TALLER;
}

export function monedaDeLoAbonado(
  borrador: Pick<BorradorDelPresupuesto, 'monedaDeLoAbonado'>,
  monedaDelTrabajo: Moneda,
): Moneda {
  if (monedaDelTrabajo === MONEDA_DEL_TALLER) return MONEDA_DEL_TALLER;
  return borrador.monedaDeLoAbonado ?? monedaDelTrabajo;
}

export function abonadoEn(
  pagos: Iterable<ImporteDeUnPago>,
  monedaDelTrabajo: Moneda,
  moneda: Moneda,
): Money<Moneda> {
  return moneda === monedaDelTrabajo
    ? totalQueDescuenta(pagos, monedaDelTrabajo)
    : totalEnPesos(pagos);
}

export function modificacionDelPresupuesto(
  plantilla: Pick<PlantillaDelPresupuesto, 'valorDeUnaModificacion' | 'monedaDeLaModificacion'>,
  borrador: Pick<BorradorDelPresupuesto, 'modificacion'> | null,
): ModificacionDelBorrador {
  return (
    borrador?.modificacion ?? {
      importe: plantilla.valorDeUnaModificacion,
      moneda: plantilla.monedaDeLaModificacion,
    }
  );
}

export function clausulaDeLaMonedaDelTrabajo(
  plantilla: Pick<PlantillaDelPresupuesto, 'clausulasDeLaMoneda'>,
  borrador: Pick<BorradorDelPresupuesto, 'clausulaDeLaMoneda'>,
  moneda: Moneda,
  cobraEn: readonly Moneda[] | null,
): string | null {
  const combinacion = combinacionDeLaMoneda(moneda, cobraEn);
  if (combinacion === null) return null;
  return borrador.clausulaDeLaMoneda ?? plantilla.clausulasDeLaMoneda[combinacion];
}

export function valoresDelTrabajo<M extends Moneda = MonedaDelTaller>(
  presupuesto: Money<M> | null,
  opciones: readonly OpcionDelTrabajo<M>[],
): ValoresDelPresupuesto<M> | null {
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
    clausulaDeLaMoneda: null,
    modificacion: null,
    monedaDeLoAbonado: null,
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

export interface Formatos {
  plata: (importe: Money<Moneda>, moneda: Moneda) => string;
  porcentaje: (puntos: PuntosBasicos) => string;
  modificaciones: (cantidad: number) => string;
  meses: (cantidad: number) => string;
}

interface ComunDeLaEntrada {
  borrador: BorradorDelPresupuesto;
  plantilla: PlantillaDelPresupuesto;
  taller: DatosDelTaller;
  cliente: string;
  senaBp: PuntosBasicos;
  abonado: Money<Moneda>;
  cobraEn: readonly Moneda[] | null;
}

export type EntradaDelDocumento =
  | (ComunDeLaEntrada & {
      moneda: MonedaDelTaller;
      valores: ValoresDelPresupuesto | null;
    })
  | (ComunDeLaEntrada & {
      moneda: 'USD';
      valores: ValoresDelPresupuesto<'USD'> | null;
      referencia: ReferenciaEnPesos | null;
    });

export interface EntradaDeLosHuecos {
  plazoDeFabricacion: number;
  plantilla: Pick<
    PlantillaDelPresupuesto,
    | 'modificacionesIncluidas'
    | 'valorDeUnaModificacion'
    | 'monedaDeLaModificacion'
    | 'garantiaMeses'
  >;
  modificacion: ModificacionDelBorrador | null;
  abonado: Money<Moneda>;
  monedaDeLoAbonado: Moneda;
  senaBp: PuntosBasicos;
}

export function huecosDelPresupuesto(
  entrada: EntradaDeLosHuecos,
  formatos: Formatos,
): Record<Hueco, string> {
  const { plantilla } = entrada;
  const modificacion = modificacionDelPresupuesto(plantilla, entrada);
  return {
    plazo: String(entrada.plazoDeFabricacion),
    modificaciones: formatos.modificaciones(plantilla.modificacionesIncluidas),
    valor_modificacion: formatos.plata(modificacion.importe, modificacion.moneda),
    relevamiento: formatos.plata(entrada.abonado, entrada.monedaDeLoAbonado),
    sena: `${formatos.porcentaje(entrada.senaBp)}%`,
    meses: formatos.meses(plantilla.garantiaMeses),
  };
}

export function textoDeLaGarantia(
  plantilla: Pick<PlantillaDelPresupuesto, 'garantia' | 'garantiaMeses'>,
  formatos: Pick<Formatos, 'meses'>,
): string {
  return completarHuecos(plantilla.garantia, { meses: formatos.meses(plantilla.garantiaMeses) });
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
  const deLoAbonado = monedaDeLoAbonado(borrador, entrada.moneda);
  const huecos = huecosDelPresupuesto(
    {
      plazoDeFabricacion: borrador.plazoDeFabricacion,
      plantilla,
      modificacion: borrador.modificacion,
      abonado: entrada.abonado,
      monedaDeLoAbonado: deLoAbonado,
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
  const clausula = clausulaDeLaMonedaDelTrabajo(
    plantilla,
    borrador,
    entrada.moneda,
    entrada.cobraEn,
  );

  const comun: ComunDelDocumento = {
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
    senaBp: entrada.senaBp,
    abonado: entrada.abonado,
    formaDePago: forma === null ? null : completar(forma) || null,
    clausulaDeLaMoneda: clausula === null ? null : completar(clausula) || null,
    cobraEn: entrada.cobraEn ?? [MONEDA_DEL_TALLER],
    plazoDeFabricacion: borrador.plazoDeFabricacion,
    validezDias: borrador.validezDias,
    avisos: conTextos(lasElegidas(plantilla.avisos, borrador.avisos)),
    condiciones: conTextos(lasElegidas(plantilla.condiciones, borrador.condiciones)),
    garantia: completar(plantilla.garantia),
    garantiaMeses: plantilla.garantiaMeses,
  };
  if (entrada.moneda === MONEDA_DEL_TALLER) {
    return { forma: 1, ...comun, valores: entrada.valores };
  }
  return {
    forma: 2,
    moneda: entrada.moneda,
    ...comun,
    valores: entrada.valores,
    monedaDeLoAbonado: deLoAbonado,
    referencia: entrada.referencia,
  };
}

export interface CuentaDeUnValor<M extends Moneda = MonedaDelTaller> {
  id: string | null;
  letra: string | null;
  descripcion: string;
  total: Money<M>;
  sena: Money<M>;
  pagado: Money<M>;
  faltaParaLaSena: Money<M>;
  saldo: Money<M>;
}

export function cuentasDelPresupuesto<M extends Moneda = MonedaDelTaller>(
  valores: ValoresDelPresupuesto<M>,
  senaBp: PuntosBasicos,
  pagado: Money<M>,
): CuentaDeUnValor<M>[] {
  const cero = 0 as Money<M>;
  const unValor = (
    id: string | null,
    letra: string | null,
    descripcion: string,
    total: Money<M>,
  ): CuentaDeUnValor<M> => {
    const esperada = aplicarPorcentaje(total, senaBp);
    return {
      id,
      letra,
      descripcion,
      total,
      sena: esperada,
      pagado,
      faltaParaLaSena: maximo(cero, restar(esperada, pagado)),
      saldo: maximo(cero, restar(total, maximo(esperada, pagado))),
    };
  };
  if (valores.tipo === 'total') return [unValor(null, null, '', valores.total)];
  return valores.opciones.map((opcion) =>
    unValor(opcion.id, opcion.letra, opcion.descripcion, opcion.total),
  );
}

export function soloLaAceptada<D extends DocumentoDelPresupuesto>(
  documento: D,
  opcionId: string | null,
): D {
  if (documento.valores?.tipo !== 'opciones' || opcionId === null) return documento;
  const opciones = documento.valores.opciones.filter(({ id }) => id === opcionId);
  return {
    ...documento,
    valores: opciones.length === 0 ? null : { tipo: 'opciones', opciones },
  };
}

export function totalPropuesto<M extends Moneda = MonedaDelTaller>(
  valores: ValoresDelPresupuesto<M> | null,
): Money<M> | null {
  if (valores === null) return null;
  if (valores.tipo === 'total') return valores.total;
  const [unica, ...otras] = valores.opciones;
  return unica === undefined || otras.length > 0 ? null : unica.total;
}

export function acordadoAlAprobar<M extends Moneda = MonedaDelTaller>(
  valores: ValoresDelPresupuesto<M> | null,
  precio: Money<M> | null,
): Money<M> | null {
  if (precio === null) return null;
  return totalPropuesto(valores) === precio ? null : precio;
}

export function acordadoConElDocumento(
  documento: DocumentoDelPresupuesto,
  precio: Plata | null,
): Money<Moneda> | null {
  if (precio === null || precio.moneda !== monedaDelDocumento(documento)) return null;
  return acordadoAlAprobar<Moneda>(documento.valores, precio.importe);
}

export function plazoDelPresupuesto(
  documento: Pick<DocumentoDelPresupuesto, 'plazoDeFabricacion'> | null,
): number {
  return documento?.plazoDeFabricacion ?? DIAS_HABILES_DE_ENTREGA;
}

export interface FrasesConNumero {
  numero: (numero: string) => string;
  conRevision: (numero: string, revision: number) => string;
}

export interface FrasesDelNumero extends FrasesConNumero {
  sinNumero: string;
}

function conElNumero(numero: string, revision: number, frases: FrasesConNumero): string {
  return revision <= 1 ? frases.numero(numero) : frases.conRevision(numero, revision);
}

export function numeroVisible(
  numero: string | null,
  revision: number,
  frases: FrasesDelNumero,
): string {
  return numero === null ? frases.sinNumero : conElNumero(numero, revision, frases);
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
  frases: FrasesDelNumero,
): string {
  const cliente = sinProhibidos(documento.cliente).replace(/\s+/g, ' ').trim();
  const cabeza = numeroVisible(numero, revision, frases);
  return `${cliente === '' ? cabeza : `${cabeza} - ${cliente}`}.pdf`;
}

export function tituloDelArchivo(
  numero: string | null,
  revision: number,
  frases: FrasesDelNumero,
): string {
  return numeroVisible(numero, revision, frases);
}

export function mensajeParaElTaller(
  numero: string,
  revision: number,
  frases: FrasesConNumero,
): string {
  return conElNumero(numero, revision, frases);
}

export const CAMPOS_QUE_FALTAN = ['titulo', 'muebles', 'valores', 'queCambio'] as const;

export type CampoQueFalta = (typeof CAMPOS_QUE_FALTAN)[number];

export const MOTIVOS_DE_LO_QUE_FALTA = [
  'titulo',
  'muebles',
  'total',
  'opciones',
  'queCambio',
  'queCambioLargo',
] as const;

export type MotivoDeLoQueFalta = (typeof MOTIVOS_DE_LO_QUE_FALTA)[number];

export interface LoQueFalta {
  campo: CampoQueFalta;
  motivo: MotivoDeLoQueFalta;
}

function faltanLosValores(
  valores: ValoresDelPresupuesto<Moneda> | null,
): MotivoDeLoQueFalta | null {
  if (valores === null) return 'total';
  if (valores.tipo === 'total') return valores.total <= 0 ? 'total' : null;
  return valores.opciones.length === 0 || valores.opciones.some(({ total }) => total <= 0)
    ? 'opciones'
    : null;
}

export function problemasParaMandar(
  documento: Pick<DocumentoDelPresupuesto, 'titulo' | 'muebles' | 'valores'>,
  revisionQueSeManda: number,
  queCambio: string,
): LoQueFalta[] {
  const falta: LoQueFalta[] = [];
  if (!tieneTexto(documento.titulo)) falta.push({ campo: 'titulo', motivo: 'titulo' });
  if (!documento.muebles.some(({ descripcion }) => tieneTexto(descripcion))) {
    falta.push({ campo: 'muebles', motivo: 'muebles' });
  }
  const deLosValores = faltanLosValores(documento.valores);
  if (deLosValores !== null) falta.push({ campo: 'valores', motivo: deLosValores });
  if (revisionQueSeManda > 1) {
    const escrito = sinBlancosEnLasPuntas(queCambio);
    if (escrito === '') {
      falta.push({ campo: 'queCambio', motivo: 'queCambio' });
    } else if (largoDelTexto(escrito) > LARGOS_DEL_PRESUPUESTO.queCambio) {
      falta.push({ campo: 'queCambio', motivo: 'queCambioLargo' });
    }
  }
  return falta;
}

export function resumenDeLosValores<M extends Moneda = MonedaDelTaller>(
  valores: ValoresDelPresupuesto<M> | null,
  plata: (importe: Money<M>) => string,
  opcion: (letra: string, importe: string) => string,
): string | null {
  if (valores === null) return null;
  if (valores.tipo === 'total') return plata(valores.total);
  return valores.opciones.map(({ letra, total }) => opcion(letra, plata(total))).join(' · ');
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

function conLoDeLaUltima(
  entrada: EntradaDelDocumento,
  ultima: DocumentoDelPresupuesto,
): EntradaDelDocumento {
  const deLaUltima = { abonado: ultima.abonado, taller: ultima.taller };
  if (entrada.moneda === MONEDA_DEL_TALLER) return { ...entrada, ...deLaUltima };
  return {
    ...entrada,
    ...deLaUltima,
    referencia: ultima.forma === 2 ? ultima.referencia : entrada.referencia,
  };
}

export function hayCambiosSinMandar(
  entrada: EntradaDelDocumento,
  ultima: DocumentoDelPresupuesto | null,
  formatos: Formatos,
): boolean {
  if (ultima === null) return true;
  const hoy = documentoDelPresupuesto(conLoDeLaUltima(entrada, ultima), formatos);
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

function valoresLeidos<M extends Moneda>(
  moneda: M,
  valor: unknown,
): ValoresDelPresupuesto<M> | null {
  if (!esObjeto(valor)) return null;
  if (valor.tipo === 'total') {
    const total = entero(valor.total);
    return total === null ? null : { tipo: 'total', total: centavosEn(moneda, total) };
  }
  if (valor.tipo !== 'opciones' || !Array.isArray(valor.opciones)) return null;
  const opciones = valor.opciones.flatMap((una: unknown, indice: number) => {
    if (!esObjeto(una) || typeof una.id !== 'string') return [];
    const total = entero(una.total);
    if (total === null) return [];
    const letra = typeof una.letra === 'string' && una.letra !== '' ? una.letra : null;
    return [
      {
        id: una.id,
        letra: letra ?? letraDeLaOpcion(indice),
        descripcion: textoLeido(una.descripcion),
        total: centavosEn(moneda, total),
      },
    ];
  });
  return opciones.length === 0 ? null : { tipo: 'opciones', opciones };
}

function referenciaLeida(valor: unknown): ReferenciaEnPesos | null {
  if (!esObjeto(valor)) return null;
  const leida = cotizacionLeida(valor.cotizacion);
  const fecha = valor.fecha;
  if (leida === null || typeof fecha !== 'string' || !esFechaQueExiste(fecha)) return null;
  return { cotizacion: leida, fecha };
}

export function leerDocumento(valor: unknown): DocumentoDelPresupuesto | null {
  if (!esObjeto(valor) || (valor.forma !== 1 && valor.forma !== 2)) return null;
  const sena = enteroEn(valor.senaBp, { desde: 0, hasta: BASE_PUNTOS_BASICOS });
  const forma = textoLeido(valor.formaDePago);
  const clausula = textoLeido(valor.clausulaDeLaMoneda);
  const deLoAbonado =
    valor.forma === 1
      ? MONEDA_DEL_TALLER
      : esMoneda(valor.monedaDeLoAbonado)
        ? valor.monedaDeLoAbonado
        : 'USD';
  const rangos = RANGOS_DEL_PRESUPUESTO;
  const comun: ComunDelDocumento = {
    taller: tallerLeido(valor.taller),
    cliente: textoLeido(valor.cliente),
    titulo: textoLeido(valor.titulo),
    obra: textoLeido(valor.obra),
    descripcion: textoLeido(valor.descripcion),
    muebles: mueblesLeidos(valor.muebles),
    herrajes: textosLeidos(valor.herrajes),
    aTenerEnCuenta: textosLeidos(valor.aTenerEnCuenta),
    incluye: textosLeidos(valor.incluye),
    senaBp: sena === null ? SENA_HABITUAL : puntosBasicos(sena),
    abonado: centavosEn(deLoAbonado, entero(valor.abonado) ?? 0),
    formaDePago: forma === '' ? null : forma,
    clausulaDeLaMoneda: clausula === '' ? null : clausula,
    cobraEn: cobraEnLeido(valor.cobraEn) ?? [MONEDA_DEL_TALLER],
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
  if (valor.forma === 1) {
    return { forma: 1, ...comun, valores: valoresLeidos(MONEDA_DEL_TALLER, valor.valores) };
  }
  const referencia = referenciaLeida(valor.referencia);
  if (valor.moneda !== 'USD' || referencia === null) return null;
  return {
    forma: 2,
    moneda: 'USD',
    ...comun,
    valores: valoresLeidos('USD', valor.valores),
    monedaDeLoAbonado: deLoAbonado,
    referencia,
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
  | 'garantia-larga'
  | 'clausula-de-la-moneda-vacia'
  | 'clausula-de-la-moneda-larga';

function sonClausulasDeLaMoneda(valor: unknown): boolean {
  if (valor === undefined) return true;
  return (
    esObjeto(valor) &&
    COMBINACIONES_DE_LA_MONEDA.every((combinacion) => typeof valor[combinacion] === 'string')
  );
}

function problemaDeLasClausulasDeLaMoneda(
  valor: unknown,
): 'clausula-de-la-moneda-vacia' | 'clausula-de-la-moneda-larga' | null {
  if (valor === undefined) return null;
  for (const combinacion of COMBINACIONES_DE_LA_MONEDA) {
    const texto = (valor as ClausulasDeLaMoneda)[combinacion];
    if (!tieneTexto(texto)) return 'clausula-de-la-moneda-vacia';
    if (largoDelTexto(texto) > LARGOS_DEL_PRESUPUESTO.textoDeClausula) {
      return 'clausula-de-la-moneda-larga';
    }
  }
  return null;
}

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
    typeof valor.garantia !== 'string' ||
    !(valor.monedaDeLaModificacion === undefined || esMoneda(valor.monedaDeLaModificacion)) ||
    !sonClausulasDeLaMoneda(valor.clausulasDeLaMoneda)
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
  return problemaDeLasClausulasDeLaMoneda(valor.clausulasDeLaMoneda);
}

function clausulasDe(valor: unknown): Clausula[] {
  return (valor as readonly Clausula[]).map((una) => ({
    id: una.id,
    titulo: tituloLeido(una.titulo),
    texto: una.texto,
    tildadaPorDefecto: una.tildadaPorDefecto,
  }));
}

export function leerPlantilla(valor: unknown, idioma: Idioma): PlantillaDelPresupuesto | null {
  if (problemaDeLaPlantilla(valor) !== null) return null;
  const leida = valor as Readonly<Record<string, unknown>>;
  const monedaDeLaModificacion = esMoneda(leida.monedaDeLaModificacion)
    ? leida.monedaDeLaModificacion
    : MONEDA_DEL_TALLER;
  const clausulas = leida.clausulasDeLaMoneda as ClausulasDeLaMoneda | undefined;
  return {
    forma: 1,
    plazoDeFabricacion: leida.plazoDeFabricacion as number,
    modificacionesIncluidas: leida.modificacionesIncluidas as number,
    valorDeUnaModificacion: centavosEn(
      monedaDeLaModificacion,
      leida.valorDeUnaModificacion as number,
    ),
    monedaDeLaModificacion,
    clausulasDeLaMoneda:
      clausulas === undefined
        ? plantillaDeSiempre(idioma).clausulasDeLaMoneda
        : {
            dolaresEnPesos: clausulas.dolaresEnPesos,
            dolaresEnDolares: clausulas.dolaresEnDolares,
            dolaresEnPesosODolares: clausulas.dolaresEnPesosODolares,
            pesosEnDolares: clausulas.pesosEnDolares,
            pesosEnPesosODolares: clausulas.pesosEnPesosODolares,
          },
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

export function plantillaDelTaller(guardada: unknown, idioma: Idioma): PlantillaDelPresupuesto {
  return leerPlantilla(guardada, idioma) ?? plantillaDeSiempre(idioma);
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
  | 'validez-fuera-de-rango'
  | 'clausula-de-la-moneda-larga'
  | 'modificacion-fuera-de-rango';

function esModificacion(valor: unknown): boolean {
  return (
    valor === undefined ||
    valor === null ||
    (esObjeto(valor) && entero(valor.importe) !== null && esMoneda(valor.moneda))
  );
}

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
    (valor.validezDias === null || entero(valor.validezDias) !== null) &&
    (valor.clausulaDeLaMoneda === undefined ||
      valor.clausulaDeLaMoneda === null ||
      typeof valor.clausulaDeLaMoneda === 'string') &&
    esModificacion(valor.modificacion) &&
    (valor.monedaDeLoAbonado === undefined ||
      valor.monedaDeLoAbonado === null ||
      esMoneda(valor.monedaDeLoAbonado))
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
  const clausula = valor.clausulaDeLaMoneda;
  if (typeof clausula === 'string' && largoDelTexto(clausula) > largos.textoDeClausula) {
    return 'clausula-de-la-moneda-larga';
  }
  const modificacion = valor.modificacion;
  if (esObjeto(modificacion) && importeFuera(modificacion.importe as number)) {
    return 'modificacion-fuera-de-rango';
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
    clausulaDeLaMoneda:
      typeof valor.clausulaDeLaMoneda === 'string' ? valor.clausulaDeLaMoneda : null,
    modificacion: modificacionLeida(valor.modificacion),
    monedaDeLoAbonado: esMoneda(valor.monedaDeLoAbonado) ? valor.monedaDeLoAbonado : null,
  };
}

function modificacionLeida(valor: unknown): ModificacionDelBorrador | null {
  if (!esObjeto(valor) || !esMoneda(valor.moneda)) return null;
  const importe = entero(valor.importe);
  return importe === null
    ? null
    : { importe: centavosEn(valor.moneda, importe), moneda: valor.moneda };
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
  | 'texto-largo'
  | 'cotizacion-fuera-de-rango';

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
    entero(valor.garantiaMeses) !== null &&
    (valor.clausulaDeLaMoneda === undefined ||
      valor.clausulaDeLaMoneda === null ||
      esTexto(valor.clausulaDeLaMoneda)) &&
    (valor.cobraEn === undefined || cobraEnLeido(valor.cobraEn) !== null) &&
    (valor.forma === 1 || esLaMonedaDeUnDocumentoEnDolares(valor))
  );
}

function esLaMonedaDeUnDocumentoEnDolares(valor: Readonly<Record<string, unknown>>): boolean {
  const referencia = valor.referencia;
  return (
    esMoneda(valor.moneda) &&
    valor.moneda !== MONEDA_DEL_TALLER &&
    esMoneda(valor.monedaDeLoAbonado) &&
    esObjeto(referencia) &&
    entero(referencia.cotizacion) !== null &&
    esTexto(referencia.fecha) &&
    esFechaQueExiste(referencia.fecha)
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
    [documento.clausulaDeLaMoneda ?? '', LARGO_DE_LA_CLAUSULA_DEL_DOCUMENTO],
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
  if (
    !esObjeto(valor) ||
    (valor.forma !== 1 && valor.forma !== 2) ||
    !tieneLaFormaDeUnDocumento(valor)
  ) {
    return 'forma-invalida';
  }
  const documento = valor as unknown as DocumentoDelPresupuesto;
  const rangos = RANGOS_DEL_PRESUPUESTO;
  if (documento.senaBp < 0 || documento.senaBp > BASE_PUNTOS_BASICOS) return 'sena-fuera-de-rango';
  if (importeFuera(documento.abonado)) return 'abonado-fuera-de-rango';
  if (documento.forma === 2 && !esCotizacion((valor.referencia as ReferenciaEnPesos).cotizacion)) {
    return 'cotizacion-fuera-de-rango';
  }
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
