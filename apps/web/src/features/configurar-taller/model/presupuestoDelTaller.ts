import {
  centavos,
  centavosEn,
  COMBINACIONES_DE_LA_MONEDA,
  CONDICIONES_FISCALES,
  formatearCuit,
  HUECOS,
  huecosDelPresupuesto,
  idiomaLeido,
  largoDelTexto,
  LARGOS_DEL_PRESUPUESTO,
  MONEDA_DEL_TALLER,
  NOMBRE_DE_LA_CONDICION,
  plantillaDeSiempre,
  plantillaDelTaller,
  problemaDeLaPlantilla,
  RANGOS_DEL_PRESUPUESTO,
  revisarCuit,
  tieneTexto,
  TOPES_DEL_PRESUPUESTO,
  usaElHueco,
  type Clausula,
  type ClausulasDeLaMoneda,
  type CombinacionDeLaMoneda,
  type CondicionFiscal,
  type DatosDelTaller,
  type Hueco,
  type Idioma,
  type Moneda,
  type PlantillaDelPresupuesto,
} from '@maun/domain';

import { senaDelTaller } from '@/entities/proyecto';
import type { CambiosDeAjustes, FilaDe } from '@/shared/api';
import { mensajes } from '@/shared/idioma';
import { formatosDelDocumento } from '@/shared/idioma-del-cliente';
import { etiquetaActual, formatearPlata } from '@/shared/lib';

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

export function idiomaDeLosClientesDeLosAjustes(ajustes: Ajustes): Idioma {
  return idiomaLeido(ajustes.idioma_de_los_clientes);
}

export function plantillaDeLosAjustes(ajustes: Ajustes): PlantillaDelPresupuesto {
  return plantillaDelTaller(
    ajustes.plantilla_del_presupuesto,
    idiomaDeLosClientesDeLosAjustes(ajustes),
  );
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

export interface ConfiguracionDelGrupo {
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

export const GRUPO: Readonly<Record<GrupoDeClausulas, ConfiguracionDelGrupo>> = {
  aTenerEnCuenta: { conTitulo: false, datos: [] },
  incluye: { conTitulo: false, datos: [] },
  avisos: { conTitulo: false, datos: DATOS_DE_LOS_TEXTOS_LARGOS },
  condiciones: { conTitulo: true, datos: DATOS_DE_LOS_TEXTOS_LARGOS },
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
  idioma: Idioma;
  datos: DatosEditables;
  numeros: NumerosEditables;
  monedaDelValor: Moneda;
  listas: Readonly<Record<GrupoDeClausulas, readonly FilaEditable[]>>;
  formas: readonly FormaEditable[];
  clausulasDeLaMoneda: ClausulasDeLaMoneda;
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
  idioma: Idioma,
): BorradorDeLaPantalla {
  return {
    idioma,
    datos: datosEditables(datos),
    numeros: numerosEditables(plantilla),
    monedaDelValor: plantilla.monedaDeLaModificacion,
    listas: {
      aTenerEnCuenta: plantilla.aTenerEnCuenta.map(filaEditable),
      incluye: plantilla.incluye.map(filaEditable),
      avisos: plantilla.avisos.map(filaEditable),
      condiciones: plantilla.condiciones.map(filaEditable),
    },
    formas: plantilla.formasDePago.map((forma) => ({ ...forma, quitada: false })),
    clausulasDeLaMoneda: plantilla.clausulasDeLaMoneda,
    garantia: plantilla.garantia,
  };
}

export function borradorDeLosAjustes(ajustes: Ajustes, nombre: string): BorradorDeLaPantalla {
  return borradorDeLaPantalla(
    datosDelTaller(ajustes, nombre),
    plantillaDeLosAjustes(ajustes),
    idiomaDeLosClientesDeLosAjustes(ajustes),
  );
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

export function valoresDeMuestra(
  numeros: NumerosEditables,
  guardados: NumerosEditables,
  ajustes: Ajustes,
  monedaDelValor: Moneda = MONEDA_DEL_TALLER,
): Valores {
  const idioma = idiomaDeLosClientesDeLosAjustes(ajustes);
  const siempre = plantillaDeSiempre(idioma);
  const plazo = plazoValido(numeros) ?? plazoValido(guardados) ?? siempre.plazoDeFabricacion;
  const modificaciones =
    modificacionesValidas(numeros) ??
    modificacionesValidas(guardados) ??
    siempre.modificacionesIncluidas;
  const meses = garantiaValida(numeros) ?? garantiaValida(guardados) ?? siempre.garantiaMeses;
  const valor = numeros.valor ?? guardados.valor ?? siempre.valorDeUnaModificacion;
  return huecosDelPresupuesto(
    {
      plazoDeFabricacion: plazo,
      plantilla: {
        modificacionesIncluidas: modificaciones,
        valorDeUnaModificacion: centavosEn(monedaDelValor, valor),
        monedaDeLaModificacion: monedaDelValor,
        garantiaMeses: meses,
      },
      modificacion: null,
      abonado: centavos(valorDelRelevamiento(ajustes) ?? VALOR_DEL_RELEVAMIENTO_DE_SIEMPRE),
      monedaDeLoAbonado: MONEDA_DEL_TALLER,
      senaBp: senaDelTaller(ajustes),
    },
    formatosDelDocumento(idioma),
  );
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

export function clausulasCambiadas(
  actuales: ClausulasDeLaMoneda,
  guardadas: ClausulasDeLaMoneda,
): CombinacionDeLaMoneda[] {
  return COMBINACIONES_DE_LA_MONEDA.filter(
    (combinacion) => actuales[combinacion] !== guardadas[combinacion],
  );
}

export function cambiosDeLaPantalla(
  actual: BorradorDeLaPantalla,
  guardado: BorradorDeLaPantalla,
): CambiosDeLaPantalla {
  const cuenta: Cuenta = { nuevas: 0, cambiadas: 0, quitadas: 0, orden: false, tildes: false };
  cuenta.cambiadas += clausulasCambiadas(
    actual.clausulasDeLaMoneda,
    guardado.clausulasDeLaMoneda,
  ).length;
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
  const numeros =
    !mismosNumeros(actual.numeros, guardado.numeros) ||
    actual.monedaDelValor !== guardado.monedaDelValor;
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

function enUnaLista(partes: readonly string[]): string {
  return new Intl.ListFormat(etiquetaActual(), { type: 'conjunction' }).format(partes);
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
  return mensajes().configurarTaller.presupuesto.cambios.cuantos(cuenta);
}

export function textoDeLosCambios(cambios: CambiosDeLaPantalla): string {
  const textos = mensajes().configurarTaller.presupuesto.cambios;
  const partes: string[] = [];
  if (cambios.datos) partes.push(textos.tusDatos);
  if (cambios.numeros) partes.push(textos.losNumeros);
  const cantidades = [
    [cambios.nuevas, 'nuevos'],
    [cambios.cambiadas, 'cambiados'],
    [cambios.quitadas, 'quitados'],
  ] as const;
  cantidades
    .filter(([cantidad]) => cantidad > 0)
    .forEach(([cantidad, cuales], indice) => {
      partes.push((indice === 0 ? textos.primero : textos.despues)[cuales](cantidad));
    });
  if (cambios.orden) partes.push(textos.elOrden);
  if (cambios.tildes) partes.push(textos.loQueSaleTildado);
  return enUnaLista(partes);
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
  | `nombre:${string}`
  | `clausula:${CombinacionDeLaMoneda}`;

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
  const { configurarTaller } = mensajes();
  const textos = configurarTaller.presupuesto.problemas;
  const problemas: ProblemaDeLaPantalla[] = [];
  if (largoDelTexto(datos.titular.trim()) > LARGOS_DE_LOS_DATOS.titular) {
    problemas.push({
      campo: 'titular',
      mensaje: textos.titularLargo(LARGOS_DE_LOS_DATOS.titular),
      queRevisar: textos.elNombre,
    });
  }
  const cuit = revisarCuit(datos.cuit);
  if (cuit.estado === 'invalido' && cuit.motivo === 'largo') {
    problemas.push({
      campo: 'cuit',
      mensaje: configurarTaller.errorDelCuit,
      queRevisar: textos.elCuit,
    });
  }
  if (largoDelTexto(datos.domicilio.trim()) > LARGOS_DE_LOS_DATOS.domicilio) {
    problemas.push({
      campo: 'domicilio',
      mensaje: textos.domicilioLargo(LARGOS_DE_LOS_DATOS.domicilio),
      queRevisar: textos.elDomicilio,
    });
  }
  if (largoDelTexto(datos.telefono.trim()) > LARGOS_DE_LOS_DATOS.telefono) {
    problemas.push({
      campo: 'telefono',
      mensaje: textos.telefonoLargo(LARGOS_DE_LOS_DATOS.telefono),
      queRevisar: textos.elTelefono,
    });
  }
  const email = datos.email.trim();
  if (
    email !== '' &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || largoDelTexto(email) > LARGOS_DE_LOS_DATOS.email)
  ) {
    problemas.push({
      campo: 'email',
      mensaje: textos.emailMal,
      queRevisar: textos.elEmail,
    });
  }
  return problemas;
}

function problemasDeLosNumeros(numeros: NumerosEditables): ProblemaDeLaPantalla[] {
  const textos = mensajes().configurarTaller.presupuesto.problemas;
  const problemas: ProblemaDeLaPantalla[] = [];
  if (plazoValido(numeros) === null) {
    problemas.push({
      campo: 'plazo',
      mensaje: textos.plazo,
      queRevisar: textos.elPlazo,
    });
  }
  if (garantiaValida(numeros) === null) {
    const meses = Number(numeros.garantia.trim());
    problemas.push({
      campo: 'garantia',
      mensaje:
        /^\d+$/.test(numeros.garantia.trim()) && meses < RANGOS_DEL_PRESUPUESTO.garantiaMeses.desde
          ? textos.garantiaCorta
          : textos.garantia,
      queRevisar: textos.losMeses,
    });
  }
  if (modificacionesValidas(numeros) === null) {
    problemas.push({
      campo: 'modificaciones',
      mensaje: textos.modificaciones,
      queRevisar: textos.lasModificaciones,
    });
  }
  if (numeros.valor === null) {
    problemas.push({
      campo: 'valor',
      mensaje: textos.valor,
      queRevisar: textos.elValor,
    });
  }
  return problemas;
}

function problemaDelTextoDeLaFila(id: string, texto: string): ProblemaDeLaPantalla | null {
  const textos = mensajes().configurarTaller.presupuesto.problemas;
  if (!tieneTexto(texto)) {
    return {
      campo: `texto:${id}`,
      mensaje: textos.textoVacio,
      queRevisar: textos.unTextoVacio,
    };
  }
  if (largoDelTexto(texto.trim()) > LARGOS_DEL_PRESUPUESTO.textoDeClausula) {
    return {
      campo: `texto:${id}`,
      mensaje: textos.textoLargo(LARGOS_DEL_PRESUPUESTO.textoDeClausula),
      queRevisar: textos.unTextoLargo,
    };
  }
  return null;
}

function problemaDeLaClausula(
  combinacion: CombinacionDeLaMoneda,
  texto: string,
): ProblemaDeLaPantalla | null {
  const textos = mensajes().configurarTaller.presupuesto.problemas;
  if (!tieneTexto(texto)) {
    return {
      campo: `clausula:${combinacion}`,
      mensaje: textos.clausulaVacia,
      queRevisar: textos.unaClausulaDeLaMoneda,
    };
  }
  if (largoDelTexto(texto.trim()) > LARGOS_DEL_PRESUPUESTO.textoDeClausula) {
    return {
      campo: `clausula:${combinacion}`,
      mensaje: textos.textoLargo(LARGOS_DEL_PRESUPUESTO.textoDeClausula),
      queRevisar: textos.unaClausulaDeLaMoneda,
    };
  }
  return null;
}

export function problemasDeLaPantalla(borrador: BorradorDeLaPantalla): ProblemaDeLaPantalla[] {
  const textos = mensajes().configurarTaller.presupuesto.problemas;
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
      mensaje: textos.sinFormas,
      queRevisar: textos.lasFormas,
    });
  }
  for (const forma of formas) {
    if (!tieneTexto(forma.nombre)) {
      problemas.push({
        campo: `nombre:${forma.id}`,
        mensaje: textos.formaSinNombre,
        queRevisar: textos.elNombreDeLaForma,
      });
    }
    if (!tieneTexto(forma.texto)) {
      problemas.push({
        campo: `texto:${forma.id}`,
        mensaje: textos.formaVacia,
        queRevisar: textos.unaFormaVacia,
      });
    }
  }
  for (const combinacion of COMBINACIONES_DE_LA_MONEDA) {
    const problema = problemaDeLaClausula(combinacion, borrador.clausulasDeLaMoneda[combinacion]);
    if (problema !== null) problemas.push(problema);
  }
  if (!tieneTexto(borrador.garantia)) {
    problemas.push({
      campo: 'texto-de-la-garantia',
      mensaje: textos.garantiaVacia,
      queRevisar: textos.elTextoDeLaGarantia,
    });
  } else if (largoDelTexto(borrador.garantia.trim()) > LARGOS_DEL_PRESUPUESTO.textoDeClausula) {
    problemas.push({
      campo: 'texto-de-la-garantia',
      mensaje: textos.garantiaLarga(LARGOS_DEL_PRESUPUESTO.textoDeClausula),
      queRevisar: textos.elTextoDeLaGarantia,
    });
  }
  if (problemas.length === 0 && problemaDeLaPlantilla(plantillaDelBorrador(borrador)) !== null) {
    problemas.push({
      campo: 'textos',
      mensaje: textos.textos,
      queRevisar: textos.losTextos,
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
  const textos = mensajes().configurarTaller.presupuesto.datos;
  const faltan: string[] = [];
  if (datos.cuit.trim() === '') faltan.push(textos.tuCuit);
  if (datos.domicilio.trim() === '') faltan.push(textos.tuDomicilio);
  return { renglones, faltan };
}

export function queFalta(faltan: readonly string[]): string {
  return enUnaLista(faltan);
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
  siempre: PlantillaDelPresupuesto,
): LoQueSeDeshace[] {
  const textos = mensajes().configurarTaller.presupuesto;
  const vuelve = textos.seDeshace;
  const cosas: LoQueSeDeshace[] = [];
  const sumar = (icono: IconoDeLoQueSeDeshace, texto: string) => {
    cosas.push({ icono, texto });
  };
  for (const grupo of GRUPOS_EN_ORDEN) {
    const delGrupo = textos.grupos[grupo];
    const ahora = guardada[grupo];
    const deSiempre = siempre[grupo];
    const agregadas = ahora.filter(({ id }) => !deSiempre.some((clausula) => clausula.id === id));
    const [unaSola] = agregadas;
    if (agregadas.length === 1 && unaSola !== undefined) {
      sumar('minus', delGrupo.seVaUna(textoCorto(unaSola.texto, valores)));
    } else if (agregadas.length > 1) {
      sumar('minus', delGrupo.seVanVarias(agregadas.length));
    }
    for (const clausula of deSiempre) {
      const corto = textoCorto(clausula.texto, valores);
      const guardadaAhora = ahora.find(({ id }) => id === clausula.id);
      if (guardadaAhora === undefined) {
        sumar('plus', vuelve.vuelve(corto));
        continue;
      }
      if (guardadaAhora.texto !== clausula.texto || guardadaAhora.titulo !== clausula.titulo) {
        sumar('pencil-line', vuelve.vuelveASuTexto(corto));
      }
      if (guardadaAhora.tildadaPorDefecto !== clausula.tildadaPorDefecto) {
        sumar(
          'list-checks',
          clausula.tildadaPorDefecto ? vuelve.vuelveTildado(corto) : vuelve.vuelveSinTildar(corto),
        );
      }
    }
  }
  if (!mismasClaves(guardada.formasDePago, siempre.formasDePago)) {
    sumar('wallet', vuelve.vuelvenLasFormas);
  } else if (
    guardada.formasDePago.some((forma, indice) => {
      const deSiempre = siempre.formasDePago[indice];
      return forma.texto !== deSiempre?.texto || forma.nombre !== deSiempre.nombre;
    })
  ) {
    sumar('wallet', vuelve.lasFormasVuelven);
  }
  if (clausulasCambiadas(guardada.clausulasDeLaMoneda, siempre.clausulasDeLaMoneda).length > 0) {
    sumar('wallet', vuelve.lasClausulasDeLaMonedaVuelven);
  }
  if (guardada.garantia !== siempre.garantia) {
    sumar('shield', vuelve.laGarantiaVuelveASuTexto);
  }
  if (guardada.plazoDeFabricacion !== siempre.plazoDeFabricacion) {
    sumar('calendar', vuelve.elPlazoVuelve(siempre.plazoDeFabricacion));
  }
  if (
    guardada.modificacionesIncluidas !== siempre.modificacionesIncluidas ||
    guardada.valorDeUnaModificacion !== siempre.valorDeUnaModificacion ||
    guardada.monedaDeLaModificacion !== siempre.monedaDeLaModificacion
  ) {
    sumar(
      'pencil-ruler',
      vuelve.vuelvenLasModificaciones(
        siempre.modificacionesIncluidas,
        formatearPlata(siempre.valorDeUnaModificacion, siempre.monedaDeLaModificacion),
      ),
    );
  }
  if (guardada.garantiaMeses !== siempre.garantiaMeses) {
    sumar('shield', vuelve.laGarantiaVuelve(siempre.garantiaMeses));
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
  const siempre = plantillaDeSiempre(borrador.idioma);
  const { clausulasDeLaMoneda } = borrador;
  return {
    forma: 1,
    plazoDeFabricacion: plazoValido(borrador.numeros) ?? siempre.plazoDeFabricacion,
    modificacionesIncluidas:
      modificacionesValidas(borrador.numeros) ?? siempre.modificacionesIncluidas,
    valorDeUnaModificacion: centavosEn(
      borrador.monedaDelValor,
      borrador.numeros.valor ?? siempre.valorDeUnaModificacion,
    ),
    monedaDeLaModificacion: borrador.monedaDelValor,
    clausulasDeLaMoneda: {
      dolaresEnPesos: clausulasDeLaMoneda.dolaresEnPesos.trim(),
      dolaresEnDolares: clausulasDeLaMoneda.dolaresEnDolares.trim(),
      dolaresEnPesosODolares: clausulasDeLaMoneda.dolaresEnPesosODolares.trim(),
      pesosEnDolares: clausulasDeLaMoneda.pesosEnDolares.trim(),
      pesosEnPesosODolares: clausulasDeLaMoneda.pesosEnPesosODolares.trim(),
    },
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

export function resumenDelTexto(texto: string, valores: Valores): string | null {
  const completo = textoCompleto(texto, valores);
  if (completo === '') return null;
  const palabras = completo.split(/\s+/);
  return palabras.length <= 7 ? completo : `${palabras.slice(0, 6).join(' ')}…`;
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
