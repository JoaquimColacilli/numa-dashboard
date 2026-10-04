import { ETIQUETAS_DE_IDIOMA, type Idioma } from '@maun/domain';

import { idiomaActual, idiomaEnUso } from './idioma';
import { seudoTexto } from './seudo';
import { textosDeLib } from './textos';

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const MS_POR_DIA = 86_400_000;

function marcada(texto: string): string {
  return texto !== '' && idiomaEnUso().seudo ? seudoTexto(texto) : texto;
}

export const ZONA_DEL_TALLER = 'America/Argentina/Buenos_Aires';

const DIA_EN_EL_TALLER = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_DEL_TALLER,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function hoyEnElTaller(ahora: Date = new Date()): string {
  return DIA_EN_EL_TALLER.format(ahora);
}

const OPCIONES_DE_LA_HORA: Readonly<Record<Idioma, Intl.DateTimeFormatOptions>> = {
  es: { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
  en: { hour: 'numeric', minute: '2-digit', hourCycle: 'h12' },
  'pt-BR': { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' },
};

const HORAS_EN_EL_TALLER = new Map<Idioma, Intl.DateTimeFormat>();

export function horaEnElTaller(momento: string, idioma: Idioma = idiomaActual()): string {
  let formato = HORAS_EN_EL_TALLER.get(idioma);
  if (formato === undefined) {
    formato = new Intl.DateTimeFormat(ETIQUETAS_DE_IDIOMA[idioma], {
      ...OPCIONES_DE_LA_HORA[idioma],
      timeZone: ZONA_DEL_TALLER,
    });
    HORAS_EN_EL_TALLER.set(idioma, formato);
  }
  return marcada(formato.format(new Date(momento)));
}

const FORMA_DEL_DIA = /^\d{4}-\d{2}-\d{2}$/;

export function errorDeLaFechaDeLaPlata(fecha: string, hoy: string): string | undefined {
  if (!FORMA_DEL_DIA.test(fecha)) return textosDeLib().fechaDeLaPlata.falta;
  if (fecha > hoy) return textosDeLib().fechaDeLaPlata.futura;
  return undefined;
}

export function hoyLocal(ahora: Date = new Date()): string {
  const anio = String(ahora.getFullYear()).padStart(4, '0');
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function comoUtc(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return new Date(Date.UTC(anio ?? 0, (mes ?? 1) - 1, dia ?? 1));
}

const FORMATOS_DE_FECHA = new Map<string, Intl.DateTimeFormat>();

function conIntl(fecha: string, idioma: Idioma, opciones: Intl.DateTimeFormatOptions): string {
  const clave = `${idioma}|${JSON.stringify(opciones)}`;
  let formato = FORMATOS_DE_FECHA.get(clave);
  if (formato === undefined) {
    formato = new Intl.DateTimeFormat(ETIQUETAS_DE_IDIOMA[idioma], {
      ...opciones,
      timeZone: 'UTC',
    });
    FORMATOS_DE_FECHA.set(clave, formato);
  }
  const dia = comoUtc(fecha);
  if (idioma !== 'pt-BR' || dia.getUTCDate() !== 1) return formato.format(dia);
  return formato
    .formatToParts(dia)
    .map((parte) => (parte.type === 'day' ? `${parte.value}º` : parte.value))
    .join('');
}

const RELATIVOS = new Map<Idioma, Intl.RelativeTimeFormat>();

function relativoConIntl(
  cantidad: number,
  unidad: Intl.RelativeTimeFormatUnit,
  idioma: Idioma,
): string {
  let formato = RELATIVOS.get(idioma);
  if (formato === undefined) {
    formato = new Intl.RelativeTimeFormat(ETIQUETAS_DE_IDIOMA[idioma], { numeric: 'auto' });
    RELATIVOS.set(idioma, formato);
  }
  return formato.format(cantidad, unidad);
}

function conMayuscula(texto: string): string {
  return texto.charAt(0).toLocaleUpperCase() + texto.slice(1);
}

function otroAnio(fecha: string, hoy: string): boolean {
  return comoUtc(fecha).getUTCFullYear() !== comoUtc(hoy).getUTCFullYear();
}

export function mesDeLaFecha(fecha: string): string {
  return fecha.slice(0, 7);
}

function escribirElMes(mes: string, idioma: Idioma): string {
  if (idioma !== 'es')
    return conMayuscula(conIntl(`${mes.slice(0, 7)}-01`, idioma, { month: 'long' }));
  const indice = Number(mes.slice(5, 7)) - 1;
  return MESES[indice] ?? '';
}

export function nombreDelMes(mes: string, idioma: Idioma = idiomaActual()): string {
  return marcada(escribirElMes(mes, idioma));
}

export function mesCortoConAnio(mes: string, idioma: Idioma = idiomaActual()): string {
  if (idioma !== 'es') {
    return marcada(conIntl(`${mes}-01`, idioma, { month: 'short', year: 'numeric' }));
  }
  const numero = Number(mes.slice(5, 7));
  return marcada(`${MESES_CORTOS[numero - 1] ?? ''}. ${mes.slice(0, 4)}`);
}

export function mesEnUnaFrase(mes: string, idioma: Idioma = idiomaActual()): string {
  const nombre = nombreDelMes(mes, idioma);
  return idioma === 'en' ? nombre : nombre.toLocaleLowerCase(ETIQUETAS_DE_IDIOMA[idioma]);
}

export function diasDelMes(mes: string): number {
  const anio = Number(mes.slice(0, 4));
  const numero = Number(mes.slice(5, 7));
  return new Date(Date.UTC(anio, numero, 0)).getUTCDate();
}

export function mesAnterior(mes: string): string {
  const anio = Number(mes.slice(0, 4));
  const numero = Number(mes.slice(5, 7));
  const previo = new Date(Date.UTC(anio, numero - 2, 1));
  return `${String(previo.getUTCFullYear()).padStart(4, '0')}-${String(previo.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function diaDelMes(fecha: string): number {
  return comoUtc(fecha).getUTCDate();
}

export function fechaLarga(
  fecha: string,
  hoy: string = hoyLocal(),
  idioma: Idioma = idiomaActual(),
): string {
  if (idioma !== 'es') {
    return marcada(
      conIntl(fecha, idioma, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(otroAnio(fecha, hoy) ? { year: 'numeric' } : {}),
      }),
    );
  }
  const dia = comoUtc(fecha);
  const anio = dia.getUTCFullYear();
  const sufijo = anio === comoUtc(hoy).getUTCFullYear() ? '' : ` ${String(anio)}`;
  return marcada(
    `${DIAS[dia.getUTCDay()] ?? ''} ${String(dia.getUTCDate())} ${MESES_CORTOS[dia.getUTCMonth()] ?? ''}${sufijo}`,
  );
}

export function fechaEnUnaFrase(
  fecha: string,
  hoy: string = hoyLocal(),
  idioma: Idioma = idiomaActual(),
): string {
  if (idioma !== 'es') {
    return marcada(
      conIntl(fecha, idioma, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        ...(otroAnio(fecha, hoy) ? { year: 'numeric' } : {}),
      }),
    );
  }
  const dia = comoUtc(fecha);
  const anio = dia.getUTCFullYear();
  const mes = (MESES[dia.getUTCMonth()] ?? '').toLowerCase();
  const sufijo = anio === comoUtc(hoy).getUTCFullYear() ? '' : ` de ${String(anio)}`;
  return marcada(`${DIAS[dia.getUTCDay()] ?? ''} ${String(dia.getUTCDate())} de ${mes}${sufijo}`);
}

export function diaLocal(momento: string): string {
  return hoyLocal(new Date(momento));
}

export function diaYMes(
  fecha: string,
  hoy: string = hoyLocal(),
  idioma: Idioma = idiomaActual(),
): string {
  if (idioma !== 'es') {
    return marcada(
      conIntl(fecha, idioma, {
        month: 'long',
        day: 'numeric',
        ...(otroAnio(fecha, hoy) ? { year: 'numeric' } : {}),
      }),
    );
  }
  const dia = comoUtc(fecha);
  const anio = dia.getUTCFullYear();
  const mes = (MESES[dia.getUTCMonth()] ?? '').toLowerCase();
  const sufijo = anio === comoUtc(hoy).getUTCFullYear() ? '' : ` de ${String(anio)}`;
  return marcada(`${String(dia.getUTCDate())} de ${mes}${sufijo}`);
}

export function fechaDelRotulo(fecha: string, idioma: Idioma = idiomaActual()): string {
  return marcada(escribirElRotulo(fecha, idioma));
}

function escribirElRotulo(fecha: string, idioma: Idioma): string {
  if (idioma === 'en') return conIntl(fecha, idioma, { dateStyle: 'medium' });
  if (idioma !== 'es') {
    const partes = new Intl.DateTimeFormat(ETIQUETAS_DE_IDIOMA[idioma], {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).formatToParts(comoUtc(fecha));
    const parte = (tipo: Intl.DateTimeFormatPartTypes) =>
      partes.find((una) => una.type === tipo)?.value ?? '';
    return `${parte('day')} ${parte('month')} ${parte('year')}`;
  }
  const [anio = '', mes = '', dia = ''] = fecha.split('-');
  return `${dia}/${mes}/${anio.slice(-2)}`;
}

export function fechaCorta(fecha: string, idioma: Idioma = idiomaActual()): string {
  if (idioma !== 'es') return marcada(conIntl(fecha, idioma, { dateStyle: 'medium' }));
  const dia = comoUtc(fecha);
  return marcada(
    `${String(dia.getUTCDate())}/${String(dia.getUTCMonth() + 1)}/${String(dia.getUTCFullYear())}`,
  );
}

export function fechaCortaSinAnio(fecha: string, idioma: Idioma = idiomaActual()): string {
  if (idioma !== 'es') return marcada(conIntl(fecha, idioma, { day: 'numeric', month: 'numeric' }));
  const dia = comoUtc(fecha);
  return marcada(`${String(dia.getUTCDate())}/${String(dia.getUTCMonth() + 1)}`);
}

export function fechaConAnio(fecha: string, idioma: Idioma = idiomaActual()): string {
  if (idioma !== 'es') return marcada(conIntl(fecha, idioma, { dateStyle: 'long' }));
  const dia = comoUtc(fecha);
  const mes = (MESES[dia.getUTCMonth()] ?? '').toLowerCase();
  return marcada(`${String(dia.getUTCDate())} de ${mes} de ${String(dia.getUTCFullYear())}`);
}

export function diaYMesCorto(fecha: string, idioma: Idioma = idiomaActual()): string {
  if (idioma !== 'es') return marcada(conIntl(fecha, idioma, { month: 'short', day: 'numeric' }));
  const dia = comoUtc(fecha);
  return marcada(`${String(dia.getUTCDate())} ${MESES_CORTOS[dia.getUTCMonth()] ?? ''}`);
}

export function haceCuanto(
  fecha: string,
  hoy: string = hoyLocal(),
  idioma: Idioma = idiomaActual(),
): string {
  return marcada(escribirHaceCuanto(fecha, hoy, idioma));
}

function escribirHaceCuanto(fecha: string, hoy: string, idioma: Idioma): string {
  const dias = -diasHasta(fecha, hoy);
  if (idioma !== 'es') {
    if (dias <= 0) return relativoConIntl(0, 'day', idioma);
    if (dias < 30) return relativoConIntl(-dias, 'day', idioma);
    const meses = Math.round(dias / 30);
    if (meses < 12) return relativoConIntl(-meses, 'month', idioma);
    return relativoConIntl(-Math.round(meses / 12), 'year', idioma);
  }
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${String(dias)} días`;
  const meses = Math.round(dias / 30);
  if (meses < 12) return `hace ${String(meses)} ${meses === 1 ? 'mes' : 'meses'}`;
  const anios = Math.round(meses / 12);
  return `hace ${String(anios)} ${anios === 1 ? 'año' : 'años'}`;
}

export function diasHasta(fecha: string, desde: string = hoyLocal()): number {
  return Math.round((comoUtc(fecha).getTime() - comoUtc(desde).getTime()) / MS_POR_DIA);
}

export function relativa(
  fecha: string,
  desde: string = hoyLocal(),
  idioma: Idioma = idiomaActual(),
): string {
  return marcada(escribirLaRelativa(fecha, desde, idioma));
}

function escribirLaRelativa(fecha: string, desde: string, idioma: Idioma): string {
  const dias = diasHasta(fecha, desde);
  if (idioma !== 'es') {
    if (Math.abs(dias) < 30) return relativoConIntl(dias, 'day', idioma);
    return relativoConIntl(Math.round(dias / 30), 'month', idioma);
  }
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias === -1) return 'ayer';
  if (dias > 0)
    return dias < 30 ? `en ${String(dias)} días` : `en ${String(Math.round(dias / 30))} meses`;
  const atras = -dias;
  if (atras < 30) return `hace ${String(atras)} días`;
  const meses = Math.round(atras / 30);
  return `hace ${String(meses)} ${meses === 1 ? 'mes' : 'meses'}`;
}
