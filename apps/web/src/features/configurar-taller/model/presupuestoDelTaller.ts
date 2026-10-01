import {
  centavos,
  CONDICIONES_FISCALES,
  formatearCuit,
  HUECOS,
  largoDelTexto,
  LARGOS_DEL_PRESUPUESTO,
  NOMBRE_DE_LA_CONDICION,
  PLANTILLA_DE_SIEMPRE,
  plantillaDelTaller,
  problemaDeLaPlantilla,
  RANGOS_DEL_PRESUPUESTO,
  revisarCuit,
  tieneTexto,
  TOPES_DEL_PRESUPUESTO,
  usaElHueco,
  type Clausula,
  type CondicionFiscal,
  type DatosDelTaller,
  type Hueco,
  type PlantillaDelPresupuesto,
} from '@maun/domain';

import type { CambiosDeAjustes, FilaDe } from '@/shared/api';
import { formatearPesos, formatearPorcentaje } from '@/shared/lib';

import { diferencias, type DiferenciasDeAjustes } from './cambios';
import { VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE, valorDelRelevamiento } from './relevamiento';

type Ajustes = FilaDe<'ajustes'>;

export type Valores = Readonly<Record<Hueco, string>>;

function esCondicion(valor: unknown): valor is CondicionFiscal {
  return typeof valor === 'string' && (CONDICIONES_FISCALES as readonly string[]).includes(valor);
}

export function datosDelTaller(ajustes: Ajustes, nombre: string): DatosDelTaller {
  return {
    nombre,
    titular: ajustes.taller_titular,
    cuit: ajustes.taller_cuit,
    condicionFiscal: esCondicion(ajustes.taller_condicion_fiscal)
      ? ajustes.taller_condicion_fiscal
      : null,
    domicilio: ajustes.taller_domicilio,
    telefono: ajustes.taller_telefono,
    email: ajustes.taller_email,
  };
}

export function plantillaDeLosAjustes(ajustes: Ajustes): PlantillaDelPresupuesto {
  return plantillaDelTaller(ajustes.plantilla_del_presupuesto);
}

export interface DatosDeCobroParaUsar {
  titular: string;
  cuit: string;
}

export function cobroParaUsar(ajustes: Ajustes): DatosDeCobroParaUsar | null {
  const titular = ajustes.cobro_titular.trim();
  const cuit = ajustes.cobro_cuit.trim();
  return titular === '' && cuit === '' ? null : { titular, cuit };
}

export type GrupoDeClausulas = 'aTenerEnCuenta' | 'incluye' | 'avisos' | 'condiciones';

export const GRUPOS_EN_ORDEN: readonly GrupoDeClausulas[] = [
  'aTenerEnCuenta',
  'incluye',
  'avisos',
  'condiciones',
];

export interface TextosDelGrupo {
  titulo: string;
  cuantas: (cantidad: number) => string;
  cuantasTildadas: (tildadas: number, total: number) => string;
  dondeVa: string;
  tildadas: string;
  tildada: string;
  agregar: string;
  quitar: string;
  etiquetaDelTexto: string;
  nuevo: string;
  conTitulo: boolean;
  datos: readonly Hueco[];
}

const DATOS_DE_LOS_TEXTOS_LARGOS: readonly Hueco[] = [
  'plazo',
  'modificaciones',
  'valor_modificacion',
  'relevamiento',
  'sena',
];

function tildadasEnFemenino(tildadas: number, total: number): string {
  if (tildadas === 0) return total === 1 ? 'sin tildar' : 'ninguna tildada';
  if (tildadas === total) return total === 1 ? 'tildada' : 'todas tildadas';
  return tildadas === 1 ? '1 tildada' : `${String(tildadas)} tildadas`;
}

function tildadosEnMasculino(tildados: number, total: number): string {
  if (tildados === 0) return total === 1 ? 'sin tildar' : 'ninguno tildado';
  if (tildados === total) return total === 1 ? 'tildado' : 'todos tildados';
  return tildados === 1 ? '1 tildado' : `${String(tildados)} tildados`;
}

export const GRUPO: Readonly<Record<GrupoDeClausulas, TextosDelGrupo>> = {
  aTenerEnCuenta: {
    titulo: 'A tener en cuenta',
    cuantas: (cantidad) => (cantidad === 1 ? '1 aclaración' : `${String(cantidad)} aclaraciones`),
    cuantasTildadas: tildadasEnFemenino,
    dondeVa:
      'Lo que el trabajo no incluye. Va en una caja, justo después del detalle de los muebles.',
    tildadas:
      'Lo que tildás acá sale tildado en cada presupuesto nuevo. Lo demás lo tildás vos cuando hace falta.',
    tildada: 'Tildada en cada presupuesto nuevo',
    agregar: 'Agregar una aclaración',
    quitar: 'Quitar esta aclaración',
    etiquetaDelTexto: 'Texto de la aclaración',
    nuevo: 'Nueva',
    conTitulo: false,
    datos: [],
  },
  incluye: {
    titulo: 'Qué incluye',
    cuantas: (cantidad) => (cantidad === 1 ? '1 cosa' : `${String(cantidad)} cosas`),
    cuantasTildadas: tildadasEnFemenino,
    dondeVa: 'La lista con tildes que va después de «A\u00a0tener\u00a0en\u00a0cuenta».',
    tildadas: 'Lo que tildás acá sale tildado en cada presupuesto nuevo.',
    tildada: 'Tildada en cada presupuesto nuevo',
    agregar: 'Agregar algo que incluye',
    quitar: 'Quitarla de la lista',
    etiquetaDelTexto: 'Lo que incluye',
    nuevo: 'Nueva',
    conTitulo: false,
    datos: [],
  },
  avisos: {
    titulo: 'Avisos',
    cuantas: (cantidad) => (cantidad === 1 ? '1 aviso' : `${String(cantidad)} avisos`),
    cuantasTildadas: tildadosEnMasculino,
    dondeVa: 'Van al final del presupuesto, antes de las condiciones.',
    tildadas: 'Lo que tildás acá sale tildado en cada presupuesto nuevo.',
    tildada: 'Tildado en cada presupuesto nuevo',
    agregar: 'Agregar un aviso',
    quitar: 'Quitar este aviso',
    etiquetaDelTexto: 'Texto del aviso',
    nuevo: 'Nuevo',
    conTitulo: false,
    datos: DATOS_DE_LOS_TEXTOS_LARGOS,
  },
  condiciones: {
    titulo: 'Condiciones',
    cuantas: (cantidad) => (cantidad === 1 ? '1 condición' : `${String(cantidad)} condiciones`),
    cuantasTildadas: tildadasEnFemenino,
    dondeVa: 'Lo que tiene que dejar listo tu cliente. Van después de los avisos.',
    tildadas: 'Lo que tildás acá sale tildado en cada presupuesto nuevo.',
    tildada: 'Tildada en cada presupuesto nuevo',
    agregar: 'Agregar una condición',
    quitar: 'Quitar esta condición',
    etiquetaDelTexto: 'Texto de la condición',
    nuevo: 'Nueva',
    conTitulo: true,
    datos: DATOS_DE_LOS_TEXTOS_LARGOS,
  },
};

export interface DatoQueSeCompleta {
  nombre: string;
  explicacion: string;
}

export const DATO: Readonly<Record<Hueco, DatoQueSeCompleta>> = {
  plazo: {
    nombre: 'El plazo',
    explicacion:
      'es el plazo de fabricación de cada presupuesto, en días hábiles. Arranca en el de «Números» y en cada presupuesto lo podés cambiar.',
  },
  modificaciones: {
    nombre: 'Las modificaciones',
    explicacion: 'son las que entran en el precio. Salen de «Números».',
  },
  valor_modificacion: {
    nombre: 'El valor de una modificación',
    explicacion: 'es lo que sale cada modificación de más. Sale de «Números».',
  },
  relevamiento: {
    nombre: 'Lo pagado del relevamiento',
    explicacion:
      'es lo que te pagó tu cliente hasta el día que le mandás el presupuesto; acá va de ejemplo el valor del relevamiento de «Tu taller». Si no te pagó nada, este aviso no sale.',
  },
  sena: {
    nombre: 'La seña',
    explicacion: 'es la seña de cada trabajo; acá va de ejemplo la de «Tu taller».',
  },
  meses: {
    nombre: 'Los meses de garantía',
    explicacion: 'son los meses de garantía. Salen de «Números».',
  },
};

export type ParteDelTexto = { tipo: 'texto'; texto: string } | { tipo: 'dato'; hueco: Hueco };

function esHueco(nombre: string): nombre is Hueco {
  return (HUECOS as readonly string[]).includes(nombre);
}

export function partesDelTexto(texto: string): ParteDelTexto[] {
  const partes: ParteDelTexto[] = [];
  let desde = 0;
  for (const encontrado of texto.matchAll(/\{([a-z_]+)\}/g)) {
    const nombre = encontrado[1] ?? '';
    if (!esHueco(nombre)) continue;
    if (encontrado.index > desde) {
      partes.push({ tipo: 'texto', texto: texto.slice(desde, encontrado.index) });
    }
    partes.push({ tipo: 'dato', hueco: nombre });
    desde = encontrado.index + encontrado[0].length;
  }
  if (desde < texto.length) partes.push({ tipo: 'texto', texto: texto.slice(desde) });
  return partes;
}

export function datosDelTexto(texto: string): Hueco[] {
  return HUECOS.filter((hueco) => usaElHueco(texto, hueco));
}

export interface FilaEditable {
  id: string;
  titulo: string;
  texto: string;
  tildadaPorDefecto: boolean;
  quitada: boolean;
}

export interface FormaEditable {
  id: string;
  nombre: string;
  texto: string;
  quitada: boolean;
}

export interface DatosEditables {
  titular: string;
  cuit: string;
  condicionFiscal: CondicionFiscal | '';
  domicilio: string;
  telefono: string;
  email: string;
}

export interface NumerosEditables {
  plazo: string;
  modificaciones: string;
  valor: number | null;
  garantia: string;
}

export interface BorradorDeLaPantalla {
  datos: DatosEditables;
  numeros: NumerosEditables;
  listas: Readonly<Record<GrupoDeClausulas, readonly FilaEditable[]>>;
  formas: readonly FormaEditable[];
  garantia: string;
}

function filaEditable(clausula: Clausula): FilaEditable {
  return {
    id: clausula.id,
    titulo: clausula.titulo ?? '',
    texto: clausula.texto,
    tildadaPorDefecto: clausula.tildadaPorDefecto,
    quitada: false,
  };
}

export function datosEditables(datos: DatosDelTaller): DatosEditables {
  return {
    titular: datos.titular,
    cuit: datos.cuit,
    condicionFiscal: datos.condicionFiscal ?? '',
    domicilio: datos.domicilio,
    telefono: datos.telefono,
    email: datos.email,
  };
}

export function numerosEditables(plantilla: PlantillaDelPresupuesto): NumerosEditables {
  return {
    plazo: String(plantilla.plazoDeFabricacion),
    modificaciones: String(plantilla.modificacionesIncluidas),
    valor: plantilla.valorDeUnaModificacion,
    garantia: String(plantilla.garantiaMeses),
  };
}

export function borradorDeLaPantalla(
  datos: DatosDelTaller,
  plantilla: PlantillaDelPresupuesto,
): BorradorDeLaPantalla {
  return {
    datos: datosEditables(datos),
    numeros: numerosEditables(plantilla),
    listas: {
      aTenerEnCuenta: plantilla.aTenerEnCuenta.map(filaEditable),
      incluye: plantilla.incluye.map(filaEditable),
      avisos: plantilla.avisos.map(filaEditable),
      condiciones: plantilla.condiciones.map(filaEditable),
    },
    formas: plantilla.formasDePago.map((forma) => ({ ...forma, quitada: false })),
    garantia: plantilla.garantia,
  };
}

export function borradorDeLosAjustes(ajustes: Ajustes, nombre: string): BorradorDeLaPantalla {
  return borradorDeLaPantalla(datosDelTaller(ajustes, nombre), plantillaDeLosAjustes(ajustes));
}

function enteroEntre(texto: string, desde: number, hasta: number): number | null {
  const limpio = texto.trim();
  if (!/^\d{1,4}$/.test(limpio)) return null;
  const numero = Number(limpio);
  return numero >= desde && numero <= hasta ? numero : null;
}

export function plazoValido(numeros: NumerosEditables): number | null {
  const { desde, hasta } = RANGOS_DEL_PRESUPUESTO.plazoDeFabricacion;
  return enteroEntre(numeros.plazo, desde, hasta);
}

export function modificacionesValidas(numeros: NumerosEditables): number | null {
  const { desde, hasta } = RANGOS_DEL_PRESUPUESTO.modificacionesIncluidas;
  return enteroEntre(numeros.modificaciones, desde, hasta);
}

export function garantiaValida(numeros: NumerosEditables): number | null {
  const { desde, hasta } = RANGOS_DEL_PRESUPUESTO.garantiaMeses;
  return enteroEntre(numeros.garantia, desde, hasta);
}

function conSuPlural(cantidad: number, singular: string, plural: string): string {
  return `${String(cantidad)} ${cantidad === 1 ? singular : plural}`;
}

export function valoresDeMuestra(
  numeros: NumerosEditables,
  guardados: NumerosEditables,
  ajustes: Ajustes,
): Valores {
  const siempre = PLANTILLA_DE_SIEMPRE;
  const plazo = plazoValido(numeros) ?? plazoValido(guardados) ?? siempre.plazoDeFabricacion;
  const modificaciones =
    modificacionesValidas(numeros) ??
    modificacionesValidas(guardados) ??
    siempre.modificacionesIncluidas;
  const meses = garantiaValida(numeros) ?? garantiaValida(guardados) ?? siempre.garantiaMeses;
  const valor = numeros.valor ?? guardados.valor ?? siempre.valorDeUnaModificacion;
  return {
    plazo: String(plazo),
    modificaciones: conSuPlural(modificaciones, 'modificación', 'modificaciones'),
    valor_modificacion: formatearPesos(valor),
    relevamiento: formatearPesos(
      valorDelRelevamiento(ajustes) ?? VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE,
    ),
    sena: `${formatearPorcentaje(ajustes.sena_bp)}%`,
    meses: conSuPlural(meses, 'mes', 'meses'),
  };
}

export type Marca = 'nueva' | 'cambiada' | null;

export function marcaDeLaFila(fila: FilaEditable, guardadas: readonly FilaEditable[]): Marca {
  const guardada = guardadas.find(({ id }) => id === fila.id);
  if (guardada === undefined) return 'nueva';
  return guardada.texto !== fila.texto || guardada.titulo !== fila.titulo ? 'cambiada' : null;
}

export function marcaDeLaForma(forma: FormaEditable, guardadas: readonly FormaEditable[]): Marca {
  const guardada = guardadas.find(({ id }) => id === forma.id);
  if (guardada === undefined) return 'nueva';
  return guardada.texto !== forma.texto || guardada.nombre !== forma.nombre ? 'cambiada' : null;
}

interface Cuenta {
  nuevas: number;
  cambiadas: number;
  quitadas: number;
  orden: boolean;
  tildes: boolean;
}

function mismasClaves(una: readonly { id: string }[], otra: readonly { id: string }[]): boolean {
  return una.length === otra.length && una.every(({ id }, indice) => otra[indice]?.id === id);
}

function contarLista(
  actual: readonly FilaEditable[],
  guardada: readonly FilaEditable[],
  cuenta: Cuenta,
): void {
  const enLaLista = vivas(actual);
  for (const fila of enLaLista) {
    const marca = marcaDeLaFila(fila, guardada);
    if (marca === 'nueva') cuenta.nuevas += 1;
    if (marca === 'cambiada') cuenta.cambiadas += 1;
    const antes = guardada.find(({ id }) => id === fila.id);
    if (antes !== undefined && antes.tildadaPorDefecto !== fila.tildadaPorDefecto) {
      cuenta.tildes = true;
    }
  }
  cuenta.quitadas += guardada.filter(({ id }) => !enLaLista.some((fila) => fila.id === id)).length;
  const quedan = guardada.filter(({ id }) => enLaLista.some((fila) => fila.id === id));
  const siguen = enLaLista.filter(({ id }) => guardada.some((fila) => fila.id === id));
  if (!mismasClaves(quedan, siguen)) cuenta.orden = true;
}

export interface CambiosDeLaPantalla {
  datos: boolean;
  numeros: boolean;
  nuevas: number;
  cambiadas: number;
  quitadas: number;
  orden: boolean;
  tildes: boolean;
  hay: boolean;
}

function mismosDatos(uno: DatosEditables, otro: DatosEditables): boolean {
  return (Object.keys(uno) as (keyof DatosEditables)[]).every(
    (clave) => uno[clave].trim() === otro[clave].trim(),
  );
}

function mismosNumeros(uno: NumerosEditables, otro: NumerosEditables): boolean {
  return (
    uno.plazo.trim() === otro.plazo.trim() &&
    uno.modificaciones.trim() === otro.modificaciones.trim() &&
    uno.valor === otro.valor &&
    uno.garantia.trim() === otro.garantia.trim()
  );
}

export function cambiosDeLaPantalla(
  actual: BorradorDeLaPantalla,
  guardado: BorradorDeLaPantalla,
): CambiosDeLaPantalla {
  const cuenta: Cuenta = { nuevas: 0, cambiadas: 0, quitadas: 0, orden: false, tildes: false };
  for (const grupo of GRUPOS_EN_ORDEN) {
    contarLista(actual.listas[grupo], guardado.listas[grupo], cuenta);
  }
  const formasVivas = vivas(actual.formas);
  for (const forma of formasVivas) {
    const marca = marcaDeLaForma(forma, guardado.formas);
    if (marca === 'nueva') cuenta.nuevas += 1;
    if (marca === 'cambiada') cuenta.cambiadas += 1;
  }
  cuenta.quitadas += guardado.formas.filter(
    ({ id }) => !formasVivas.some((forma) => forma.id === id),
  ).length;
  const formasQueQuedan = guardado.formas.filter(({ id }) =>
    formasVivas.some((forma) => forma.id === id),
  );
  const formasQueSiguen = formasVivas.filter(({ id }) =>
    guardado.formas.some((forma) => forma.id === id),
  );
  if (!mismasClaves(formasQueQuedan, formasQueSiguen)) cuenta.orden = true;
  if (actual.garantia !== guardado.garantia) cuenta.cambiadas += 1;

  const datos = !mismosDatos(actual.datos, guardado.datos);
  const numeros = !mismosNumeros(actual.numeros, guardado.numeros);
  return {
    datos,
    numeros,
    ...cuenta,
    hay:
      datos ||
      numeros ||
      cuenta.nuevas + cuenta.cambiadas + cuenta.quitadas > 0 ||
      cuenta.orden ||
      cuenta.tildes,
  };
}

function enUnaFrase(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? '';
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1) ?? ''}`;
}

export function cuantosCambios(cambios: CambiosDeLaPantalla): string {
  const cuenta =
    Number(cambios.datos) +
    Number(cambios.numeros) +
    cambios.nuevas +
    cambios.cambiadas +
    cambios.quitadas +
    Number(cambios.orden) +
    Number(cambios.tildes);
  return cuenta === 1 ? '1 cambio' : `${String(cuenta)} cambios`;
}

export function textoDeLosCambios(cambios: CambiosDeLaPantalla): string {
  const partes: string[] = [];
  if (cambios.datos) partes.push('tus datos');
  if (cambios.numeros) partes.push('los números');
  const cantidades: [number, string, string][] = [
    [cambios.nuevas, 'nuevo', 'nuevos'],
    [cambios.cambiadas, 'cambiado', 'cambiados'],
    [cambios.quitadas, 'quitado', 'quitados'],
  ];
  cantidades
    .filter(([cantidad]) => cantidad > 0)
    .forEach(([cantidad, singular, plural], indice) => {
      const primero = indice === 0;
      if (cantidad === 1) partes.push(`${primero ? 'un texto' : 'uno'} ${singular}`);
      else partes.push(`${String(cantidad)} ${primero ? 'textos ' : ''}${plural}`);
    });
  if (cambios.orden) partes.push('el orden');
  if (cambios.tildes) partes.push('lo que sale tildado');
  return enUnaFrase(partes);
}

export type CampoConProblema =
  | 'titular'
  | 'cuit'
  | 'domicilio'
  | 'telefono'
  | 'email'
  | 'plazo'
  | 'modificaciones'
  | 'valor'
  | 'garantia'
  | 'formas'
  | 'texto-de-la-garantia'
  | 'textos'
  | `texto:${string}`
  | `nombre:${string}`;

export interface ProblemaDeLaPantalla {
  campo: CampoConProblema;
  mensaje: string;
  queRevisar: string;
}

export const LARGOS_DE_LOS_DATOS = {
  titular: 120,
  domicilio: 300,
  telefono: 40,
  email: 200,
} as const;

function problemasDeLosDatos(datos: DatosEditables): ProblemaDeLaPantalla[] {
  const problemas: ProblemaDeLaPantalla[] = [];
  if (largoDelTexto(datos.titular.trim()) > LARGOS_DE_LOS_DATOS.titular) {
    problemas.push({
      campo: 'titular',
      mensaje: `El nombre entra en ${String(LARGOS_DE_LOS_DATOS.titular)} caracteres.`,
      queRevisar: 'el nombre',
    });
  }
  const cuit = revisarCuit(datos.cuit);
  if (cuit.estado === 'invalido' && cuit.motivo === 'largo') {
    problemas.push({
      campo: 'cuit',
      mensaje: 'Un CUIT tiene 11 dígitos. Dejalo vacío si no lo tenés a mano.',
      queRevisar: 'el CUIT',
    });
  }
  if (largoDelTexto(datos.domicilio.trim()) > LARGOS_DE_LOS_DATOS.domicilio) {
    problemas.push({
      campo: 'domicilio',
      mensaje: `El domicilio entra en ${String(LARGOS_DE_LOS_DATOS.domicilio)} caracteres.`,
      queRevisar: 'el domicilio',
    });
  }
  if (largoDelTexto(datos.telefono.trim()) > LARGOS_DE_LOS_DATOS.telefono) {
    problemas.push({
      campo: 'telefono',
      mensaje: `El teléfono entra en ${String(LARGOS_DE_LOS_DATOS.telefono)} caracteres.`,
      queRevisar: 'el teléfono',
    });
  }
  const email = datos.email.trim();
  if (
    email !== '' &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || largoDelTexto(email) > LARGOS_DE_LOS_DATOS.email)
  ) {
    problemas.push({
      campo: 'email',
      mensaje: 'Revisá el mail: tiene que ser como taller@ejemplo.com.',
      queRevisar: 'el mail',
    });
  }
  return problemas;
}

function problemasDeLosNumeros(numeros: NumerosEditables): ProblemaDeLaPantalla[] {
  const problemas: ProblemaDeLaPantalla[] = [];
  if (plazoValido(numeros) === null) {
    problemas.push({
      campo: 'plazo',
      mensaje: 'Escribí el plazo en días hábiles, entre 1 y 365.',
      queRevisar: 'el plazo de fabricación',
    });
  }
  if (garantiaValida(numeros) === null) {
    const meses = Number(numeros.garantia.trim());
    problemas.push({
      campo: 'garantia',
      mensaje:
        /^\d+$/.test(numeros.garantia.trim()) && meses < RANGOS_DEL_PRESUPUESTO.garantiaMeses.desde
          ? 'La ley pide por lo menos 6 meses.'
          : 'Escribí los meses de garantía, entre 6 y 120.',
      queRevisar: 'los meses de garantía',
    });
  }
  if (modificacionesValidas(numeros) === null) {
    problemas.push({
      campo: 'modificaciones',
      mensaje: 'Escribí cuántas entran en el precio, entre 0 y 10.',
      queRevisar: 'las modificaciones incluidas',
    });
  }
  if (numeros.valor === null) {
    problemas.push({
      campo: 'valor',
      mensaje: 'Escribí cuánto sale una modificación de más. Puede ser 0.',
      queRevisar: 'el valor de una modificación',
    });
  }
  return problemas;
}

function problemaDelTextoDeLaFila(id: string, texto: string): ProblemaDeLaPantalla | null {
  if (!tieneTexto(texto)) {
    return {
      campo: `texto:${id}`,
      mensaje: 'Escribí el texto o quitalo de la lista.',
      queRevisar: 'un texto vacío',
    };
  }
  if (largoDelTexto(texto.trim()) > LARGOS_DEL_PRESUPUESTO.textoDeClausula) {
    return {
      campo: `texto:${id}`,
      mensaje: `Un texto entra en ${String(LARGOS_DEL_PRESUPUESTO.textoDeClausula)} caracteres.`,
      queRevisar: 'un texto muy largo',
    };
  }
  return null;
}

export function problemasDeLaPantalla(borrador: BorradorDeLaPantalla): ProblemaDeLaPantalla[] {
  const problemas = [
    ...problemasDeLosDatos(borrador.datos),
    ...problemasDeLosNumeros(borrador.numeros),
  ];
  for (const grupo of GRUPOS_EN_ORDEN) {
    for (const fila of vivas(borrador.listas[grupo])) {
      const problema = problemaDelTextoDeLaFila(fila.id, fila.texto);
      if (problema !== null) problemas.push(problema);
    }
  }
  const formas = vivas(borrador.formas);
  if (formas.length === 0) {
    problemas.push({
      campo: 'formas',
      mensaje: 'Dejá por lo menos una forma de pago: en cada presupuesto elegís una.',
      queRevisar: 'las formas de pago',
    });
  }
  for (const forma of formas) {
    if (!tieneTexto(forma.nombre)) {
      problemas.push({
        campo: `nombre:${forma.id}`,
        mensaje: 'Ponele un nombre, así la elegís en cada presupuesto.',
        queRevisar: 'el nombre de una forma de pago',
      });
    }
    if (!tieneTexto(forma.texto)) {
      problemas.push({
        campo: `texto:${forma.id}`,
        mensaje: 'Escribí cómo te paga o quitala.',
        queRevisar: 'una forma de pago vacía',
      });
    }
  }
  if (!tieneTexto(borrador.garantia)) {
    problemas.push({
      campo: 'texto-de-la-garantia',
      mensaje: 'La garantía no puede quedar vacía.',
      queRevisar: 'el texto de la garantía',
    });
  } else if (largoDelTexto(borrador.garantia.trim()) > LARGOS_DEL_PRESUPUESTO.textoDeClausula) {
    problemas.push({
      campo: 'texto-de-la-garantia',
      mensaje: `La garantía entra en ${String(LARGOS_DEL_PRESUPUESTO.textoDeClausula)} caracteres.`,
      queRevisar: 'el texto de la garantía',
    });
  }
  if (problemas.length === 0 && problemaDeLaPlantilla(plantillaDelBorrador(borrador)) !== null) {
    problemas.push({
      campo: 'textos',
      mensaje: 'Hay un texto que no se puede guardar así.',
      queRevisar: 'los textos',
    });
  }
  return problemas;
}

export function vivas<T extends { quitada: boolean }>(filas: readonly T[]): T[] {
  return filas.filter(({ quitada }) => !quitada);
}

export function sinLoQuitado(borrador: BorradorDeLaPantalla): BorradorDeLaPantalla {
  return {
    ...borrador,
    listas: {
      aTenerEnCuenta: vivas(borrador.listas.aTenerEnCuenta),
      incluye: vivas(borrador.listas.incluye),
      avisos: vivas(borrador.listas.avisos),
      condiciones: vivas(borrador.listas.condiciones),
    },
    formas: vivas(borrador.formas),
  };
}

export function cuantasPuedenSer(grupo: GrupoDeClausulas | 'formas'): number {
  return grupo === 'formas'
    ? TOPES_DEL_PRESUPUESTO.formasDePago
    : TOPES_DEL_PRESUPUESTO.clausulasPorGrupo;
}

export interface Encabezado {
  renglones: string[][];
  faltan: string[];
}

export function encabezadoDelPresupuesto(datos: DatosEditables): Encabezado {
  const titular = datos.titular.trim();
  const cuit = datos.cuit.trim() === '' ? '' : `CUIT ${formatearCuit(datos.cuit)}`;
  const condicion =
    datos.condicionFiscal === '' ? '' : NOMBRE_DE_LA_CONDICION[datos.condicionFiscal];
  const renglones = [
    [titular, cuit],
    [condicion],
    [datos.domicilio.trim()],
    [datos.telefono.trim(), datos.email.trim()],
  ]
    .map((partes) => partes.filter((parte) => parte !== ''))
    .filter((partes) => partes.length > 0);
  const faltan: string[] = [];
  if (datos.cuit.trim() === '') faltan.push('tu CUIT');
  if (datos.domicilio.trim() === '') faltan.push('tu domicilio');
  return { renglones, faltan };
}

export function queFalta(faltan: readonly string[]): string {
  return enUnaFrase(faltan);
}

function textoCompleto(texto: string, valores: Valores): string {
  return partesDelTexto(texto)
    .map((parte) => (parte.tipo === 'texto' ? parte.texto : valores[parte.hueco]))
    .join('')
    .trim();
}

function textoCorto(texto: string, valores: Valores): string {
  const completo = textoCompleto(texto, valores);
  const palabras = completo.split(/\s+/);
  return palabras.length <= 22 ? completo : `${palabras.slice(0, 12).join(' ')}…`;
}

export type IconoDeLoQueSeDeshace =
  | 'minus'
  | 'plus'
  | 'pencil-line'
  | 'list-checks'
  | 'wallet'
  | 'shield'
  | 'calendar'
  | 'pencil-ruler';

export interface LoQueSeDeshace {
  icono: IconoDeLoQueSeDeshace;
  texto: string;
}

export function loQueSeDeshace(
  guardada: PlantillaDelPresupuesto,
  valores: Valores,
): LoQueSeDeshace[] {
  const siempre = PLANTILLA_DE_SIEMPRE;
  const cosas: LoQueSeDeshace[] = [];
  const sumar = (icono: IconoDeLoQueSeDeshace, texto: string) => {
    cosas.push({ icono, texto });
  };
  const nombres: Readonly<Record<GrupoDeClausulas, [string, string]>> = {
    aTenerEnCuenta: ['la aclaración que agregaste', 'las aclaraciones que agregaste'],
    incluye: ['lo que sumaste a «Qué incluye»', 'lo que sumaste a «Qué incluye»'],
    avisos: ['el aviso que agregaste', 'los avisos que agregaste'],
    condiciones: ['la condición que agregaste', 'las condiciones que agregaste'],
  };
  for (const grupo of GRUPOS_EN_ORDEN) {
    const ahora = guardada[grupo];
    const deSiempre = siempre[grupo];
    const agregadas = ahora.filter(({ id }) => !deSiempre.some((clausula) => clausula.id === id));
    const [unaSola] = agregadas;
    if (agregadas.length === 1 && unaSola !== undefined) {
      sumar('minus', `Se va ${nombres[grupo][0]}: «${textoCorto(unaSola.texto, valores)}»`);
    } else if (agregadas.length > 1) {
      sumar('minus', `Se van ${nombres[grupo][1]} (${String(agregadas.length)}).`);
    }
    for (const clausula of deSiempre) {
      const guardadaAhora = ahora.find(({ id }) => id === clausula.id);
      if (guardadaAhora === undefined) {
        sumar('plus', `Vuelve «${textoCorto(clausula.texto, valores)}», que habías quitado.`);
        continue;
      }
      if (guardadaAhora.texto !== clausula.texto || guardadaAhora.titulo !== clausula.titulo) {
        sumar(
          'pencil-line',
          `«${textoCorto(clausula.texto, valores)}» vuelve a su texto de siempre.`,
        );
      }
      if (guardadaAhora.tildadaPorDefecto !== clausula.tildadaPorDefecto) {
        sumar(
          'list-checks',
          `«${textoCorto(clausula.texto, valores)}» vuelve a salir ${
            clausula.tildadaPorDefecto ? 'tildado' : 'sin tildar'
          }.`,
        );
      }
    }
  }
  if (!mismasClaves(guardada.formasDePago, siempre.formasDePago)) {
    sumar('wallet', 'Vuelven las tres formas de pago de siempre, con sus textos.');
  } else if (
    guardada.formasDePago.some((forma, indice) => {
      const deSiempre = siempre.formasDePago[indice];
      return forma.texto !== deSiempre?.texto || forma.nombre !== deSiempre.nombre;
    })
  ) {
    sumar('wallet', 'Las formas de pago vuelven a sus textos de siempre.');
  }
  if (guardada.garantia !== siempre.garantia) {
    sumar('shield', 'La garantía vuelve a su texto de siempre.');
  }
  if (guardada.plazoDeFabricacion !== siempre.plazoDeFabricacion) {
    sumar('calendar', `El plazo vuelve a ${String(siempre.plazoDeFabricacion)} días hábiles.`);
  }
  if (
    guardada.modificacionesIncluidas !== siempre.modificacionesIncluidas ||
    guardada.valorDeUnaModificacion !== siempre.valorDeUnaModificacion
  ) {
    sumar(
      'pencil-ruler',
      `Vuelven a entrar ${String(siempre.modificacionesIncluidas)} modificaciones, y cada una de más vale ${formatearPesos(
        siempre.valorDeUnaModificacion,
      )}.`,
    );
  }
  if (guardada.garantiaMeses !== siempre.garantiaMeses) {
    sumar('shield', `La garantía vuelve a ${String(siempre.garantiaMeses)} meses.`);
  }
  return cosas;
}

export function plantillaDelBorrador(borrador: BorradorDeLaPantalla): PlantillaDelPresupuesto {
  const clausulas = (filas: readonly FilaEditable[]): Clausula[] =>
    vivas(filas).map(({ id, titulo, texto, tildadaPorDefecto }) => ({
      id,
      titulo: titulo.trim() === '' ? null : titulo.trim(),
      texto: texto.trim(),
      tildadaPorDefecto,
    }));
  const siempre = PLANTILLA_DE_SIEMPRE;
  return {
    forma: 1,
    plazoDeFabricacion: plazoValido(borrador.numeros) ?? siempre.plazoDeFabricacion,
    modificacionesIncluidas:
      modificacionesValidas(borrador.numeros) ?? siempre.modificacionesIncluidas,
    valorDeUnaModificacion: centavos(borrador.numeros.valor ?? siempre.valorDeUnaModificacion),
    garantiaMeses: garantiaValida(borrador.numeros) ?? siempre.garantiaMeses,
    incluye: clausulas(borrador.listas.incluye),
    aTenerEnCuenta: clausulas(borrador.listas.aTenerEnCuenta),
    formasDePago: vivas(borrador.formas).map(({ id, nombre, texto }) => ({
      id,
      nombre: nombre.trim(),
      texto: texto.trim(),
    })),
    avisos: clausulas(borrador.listas.avisos),
    condiciones: clausulas(borrador.listas.condiciones),
    garantia: borrador.garantia.trim(),
  };
}

export function mismaPlantilla(una: BorradorDeLaPantalla, otra: BorradorDeLaPantalla): boolean {
  return JSON.stringify(plantillaDelBorrador(una)) === JSON.stringify(plantillaDelBorrador(otra));
}

export function cambiosDeLosDatos(datos: DatosEditables): CambiosDeAjustes {
  return {
    taller_titular: datos.titular.trim(),
    taller_cuit: datos.cuit.trim() === '' ? '' : formatearCuit(datos.cuit),
    taller_condicion_fiscal: datos.condicionFiscal === '' ? null : datos.condicionFiscal,
    taller_domicilio: datos.domicilio.trim(),
    taller_telefono: datos.telefono.trim(),
    taller_email: datos.email.trim(),
  };
}

export function diferenciasDeLosDatos(
  ajustes: Ajustes,
  datos: DatosEditables,
): DiferenciasDeAjustes {
  return diferencias(ajustes, cambiosDeLosDatos(datos));
}

export function resumenDelTexto(texto: string, valores: Valores): string {
  const completo = textoCompleto(texto, valores);
  if (completo === '') return 'el texto nuevo';
  const palabras = completo.split(/\s+/);
  return `«${palabras.length <= 7 ? completo : `${palabras.slice(0, 6).join(' ')}…`}»`;
}

export function moverEnLaLista<T extends { id: string; quitada: boolean }>(
  filas: readonly T[],
  id: string,
  hacia: -1 | 1,
): T[] {
  const orden = [...filas];
  const desde = orden.findIndex((fila) => fila.id === id);
  let hasta = desde + hacia;
  while (orden[hasta]?.quitada === true) hasta += hacia;
  const fila = orden[desde];
  if (fila === undefined || hasta < 0 || hasta >= orden.length) return orden;
  orden.splice(desde, 1);
  orden.splice(hasta, 0, fila);
  return orden;
}
