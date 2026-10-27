import {
  diaDeLaSemana,
  diasEntre,
  ETIQUETAS_DE_IDIOMA,
  IDIOMA_BASE,
  type CategoriaDerivada,
  type EventoDeLaAgenda,
  type EventoVencimiento,
  type Idioma,
} from '@maun/domain';

import type { RespuestaParaElAviso } from './base.ts';

export interface CargaDelAviso {
  titulo: string;
  cuerpo: string;
  url: string;
  etiqueta: string;
  lang?: string;
}

interface TextosDeLaRespuesta {
  titulo: string;
  aprobo: (cliente: string, que: string) => string;
  elEstimativo: string;
  elPresupuesto: string;
  laOpcion: (letra: string, estimativo: boolean) => string;
  propone: (dia: string, franja: string | null) => string;
  franjas: Readonly<Record<'manana' | 'tarde', string>>;
  dias: readonly string[];
  elDia: (nombre: string, numero: number) => string;
}

interface TextosDelAviso {
  accion: Readonly<Record<CategoriaDerivada, (titulo: string) => string>>;
  vence: (renglon: string, monto: string) => string;
  sePago: (tesoro: string, monto: string) => string;
  pusoMaun: (monto: string) => string;
  respuesta: TextosDeLaRespuesta;
  hoy: string;
  manana: string;
  enDias: (dias: number) => string;
  renglon: (queDice: string, cuando: string) => string;
  masEnLaAgenda: (cuantos: number) => string;
  loQueViene: string;
  hoyTenes: (cuantas: number) => string;
  prueba: { titulo: string; cuerpo: string };
  plata: (centavos: number) => string;
}

const MAXIMO_DE_RENGLONES = 4;

export function pesos(centavos: number): string {
  const absoluto = Math.abs(centavos);
  const enteros = String(Math.floor(absoluto / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const resto = absoluto % 100;
  const decimales = resto === 0 ? '' : `,${String(resto).padStart(2, '0')}`;
  return `${centavos < 0 ? '-' : ''}$\u00a0${enteros}${decimales}`;
}

function comoDecimal(centavos: number): `${number}` {
  const absoluto = Math.abs(centavos);
  const resto = String(absoluto % 100).padStart(2, '0');
  return `${centavos < 0 ? '-' : ''}${String(Math.floor(absoluto / 100))}.${resto}` as `${number}`;
}

function pesosEn(idioma: Exclude<Idioma, 'es'>): (centavos: number) => string {
  return (centavos) => {
    const conCentavos = centavos % 100 !== 0;
    return new Intl.NumberFormat(ETIQUETAS_DE_IDIOMA[idioma], {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: conCentavos ? 2 : 0,
      maximumFractionDigits: conCentavos ? 2 : 0,
    }).format(comoDecimal(centavos));
  };
}

const TEXTOS: Readonly<Record<Idioma, TextosDelAviso>> = {
  es: {
    accion: {
      entrega: (titulo) => `Entregar: ${titulo}`,
      visita: (titulo) => `Relevamiento: ${titulo}`,
      presupuesto: (titulo) => `Entregar presupuesto: ${titulo}`,
      seguimiento: (titulo) => `Volver a escribirle a ${titulo}`,
    },
    vence: (renglon, monto) => `Vence: ${renglon}, ${monto}`,
    sePago: (tesoro, monto) => `Se pagó ${tesoro}: ${monto}`,
    pusoMaun: (monto) => ` · Maun puso ${monto}`,
    respuesta: {
      titulo: 'Tu cliente aprobó',
      aprobo: (cliente, que) => `${cliente} aprobó ${que}`,
      elEstimativo: 'el estimativo',
      elPresupuesto: 'el presupuesto',
      laOpcion: (letra, estimativo) =>
        `la opción ${letra} ${estimativo ? 'del estimativo' : 'del presupuesto'}`,
      propone: (dia, franja) =>
        ` y propone ${dia}${franja === null ? '' : ` ${franja}`} para medir`,
      franjas: { manana: 'a la mañana', tarde: 'a la tarde' },
      dias: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
      elDia: (nombre, numero) => `el ${nombre} ${String(numero)}`,
    },
    hoy: 'hoy',
    manana: 'mañana',
    enDias: (dias) => `en ${String(dias)} días`,
    renglon: (queDice, cuando) => `${queDice} (${cuando})`,
    masEnLaAgenda: (cuantos) => `y ${String(cuantos)} más en la agenda`,
    loQueViene: 'Lo que viene en la agenda',
    hoyTenes: (cuantas) =>
      cuantas === 1
        ? 'Hoy tenés 1 cosa en la agenda'
        : `Hoy tenés ${String(cuantas)} cosas en la agenda`,
    prueba: {
      titulo: 'Aviso de prueba',
      cuerpo: 'Si ves esto, los avisos llegan a este dispositivo.',
    },
    plata: pesos,
  },
  en: {
    accion: {
      entrega: (titulo) => `Deliver: ${titulo}`,
      visita: (titulo) => `Site measure: ${titulo}`,
      presupuesto: (titulo) => `Send quote: ${titulo}`,
      seguimiento: (titulo) => `Follow up with ${titulo}`,
    },
    vence: (renglon, monto) => `Due: ${renglon}, ${monto}`,
    sePago: (tesoro, monto) => `Paid ${tesoro}: ${monto}`,
    pusoMaun: (monto) => ` · Maun put in ${monto}`,
    respuesta: {
      titulo: 'Your client approved',
      aprobo: (cliente, que) => `${cliente} approved ${que}`,
      elEstimativo: 'the estimate',
      elPresupuesto: 'the quote',
      laOpcion: (letra, estimativo) =>
        `option ${letra} of the ${estimativo ? 'estimate' : 'quote'}`,
      propone: (dia, franja) =>
        ` and suggests ${dia}${franja === null ? '' : ` ${franja}`} for the site measure`,
      franjas: { manana: 'in the morning', tarde: 'in the afternoon' },
      dias: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      elDia: (nombre, numero) => `${nombre} ${String(numero)}`,
    },
    hoy: 'today',
    manana: 'tomorrow',
    enDias: (dias) => `in ${String(dias)} days`,
    renglon: (queDice, cuando) => `${queDice} (${cuando})`,
    masEnLaAgenda: (cuantos) => `and ${String(cuantos)} more on your calendar`,
    loQueViene: 'Coming up on your calendar',
    hoyTenes: (cuantas) =>
      cuantas === 1
        ? 'You have 1 thing on your calendar today'
        : `You have ${String(cuantas)} things on your calendar today`,
    prueba: {
      titulo: 'Test notification',
      cuerpo: 'If you can see this, notifications are reaching this device.',
    },
    plata: pesosEn('en'),
  },
  'pt-BR': {
    accion: {
      entrega: (titulo) => `Entregar: ${titulo}`,
      visita: (titulo) => `Visita técnica: ${titulo}`,
      presupuesto: (titulo) => `Enviar orçamento: ${titulo}`,
      seguimiento: (titulo) => `Retomar contato com ${titulo}`,
    },
    vence: (renglon, monto) => `Vence: ${renglon}, ${monto}`,
    sePago: (tesoro, monto) => `Pago ${tesoro}: ${monto}`,
    pusoMaun: (monto) => ` · Maun colocou ${monto}`,
    respuesta: {
      titulo: 'Seu cliente aprovou',
      aprobo: (cliente, que) => `${cliente} aprovou ${que}`,
      elEstimativo: 'a estimativa',
      elPresupuesto: 'o orçamento',
      laOpcion: (letra, estimativo) =>
        `a opção ${letra} ${estimativo ? 'da estimativa' : 'do orçamento'}`,
      propone: (dia, franja) =>
        ` e propõe ${dia}${franja === null ? ',' : `, ${franja},`} para a visita técnica`,
      franjas: { manana: 'de manhã', tarde: 'à tarde' },
      dias: [
        'domingo',
        'segunda-feira',
        'terça-feira',
        'quarta-feira',
        'quinta-feira',
        'sexta-feira',
        'sábado',
      ],
      elDia: (nombre, numero) => `${nombre}, ${String(numero)}`,
    },
    hoy: 'hoje',
    manana: 'amanhã',
    enDias: (dias) => `em ${String(dias)} dias`,
    renglon: (queDice, cuando) => `${queDice} (${cuando})`,
    masEnLaAgenda: (cuantos) => `e mais ${String(cuantos)} na agenda`,
    loQueViene: 'Próximos compromissos na agenda',
    hoyTenes: (cuantas) =>
      cuantas === 1
        ? 'Hoje você tem 1 compromisso na agenda'
        : `Hoje você tem ${String(cuantas)} compromissos na agenda`,
    prueba: {
      titulo: 'Notificação de teste',
      cuerpo: 'Se você está vendo isto, as notificações chegam a este aparelho.',
    },
    plata: pesosEn('pt-BR'),
  },
};

function cuando(textos: TextosDelAviso, dia: string, fecha: string): string {
  const dias = diasEntre(dia, fecha);
  if (dias === 0) return textos.hoy;
  if (dias === 1) return textos.manana;
  return textos.enDias(dias);
}

function queDiceElVencimiento(textos: TextosDelAviso, evento: EventoVencimiento): string {
  const nombre = evento.renglon ?? evento.nombreDelTesoro;
  if (evento.pagoSolo === null) return textos.vence(nombre, textos.plata(evento.monto));
  const { pagado, pusoMaun } = evento.pagoSolo;
  const deMaun = pusoMaun > 0 ? textos.pusoMaun(textos.plata(pusoMaun)) : '';
  return `${textos.sePago(nombre, textos.plata(pagado))}${deMaun}`;
}

function queDice(textos: TextosDelAviso, evento: EventoDeLaAgenda): string {
  if (evento.clase === 'propia') return evento.texto;
  if (evento.clase === 'vencimiento') return queDiceElVencimiento(textos, evento);
  return textos.accion[evento.categoria](evento.titulo);
}

function esFranjaConNombre(franja: string | null): franja is 'manana' | 'tarde' {
  return franja === 'manana' || franja === 'tarde';
}

export function fraseDeLaRespuesta(
  respuesta: RespuestaParaElAviso,
  idioma: Idioma = IDIOMA_BASE,
): string {
  const textos = TEXTOS[idioma].respuesta;
  const que =
    respuesta.letra === null
      ? respuesta.estimativo
        ? textos.elEstimativo
        : textos.elPresupuesto
      : textos.laOpcion(respuesta.letra, respuesta.estimativo);
  const propone =
    respuesta.dia === null
      ? ''
      : textos.propone(
          textos.elDia(
            textos.dias[diaDeLaSemana(respuesta.dia)] ?? '',
            Number(respuesta.dia.slice(8, 10)),
          ),
          esFranjaConNombre(respuesta.franja) ? textos.franjas[respuesta.franja] : null,
        );
  return `${textos.aprobo(respuesta.cliente, que)}${propone}.`;
}

function conSuIdioma(idioma: Idioma): { lang?: string } {
  return idioma === IDIOMA_BASE ? {} : { lang: ETIQUETAS_DE_IDIOMA[idioma] };
}

export function cargaDelAviso(
  eventos: readonly EventoDeLaAgenda[],
  dia: string,
  idioma: Idioma = IDIOMA_BASE,
  respuestas: readonly RespuestaParaElAviso[] = [],
): CargaDelAviso {
  const textos = TEXTOS[idioma];
  const deLosClientes = respuestas
    .slice(0, MAXIMO_DE_RENGLONES)
    .map((respuesta) => fraseDeLaRespuesta(respuesta, idioma));
  const lugar = MAXIMO_DE_RENGLONES - deLosClientes.length;
  const renglones = [
    ...deLosClientes,
    ...eventos
      .slice(0, lugar)
      .map((evento) => textos.renglon(queDice(textos, evento), cuando(textos, dia, evento.fecha))),
  ];
  if (eventos.length > lugar) {
    renglones.push(textos.masEnLaAgenda(eventos.length - lugar));
  }
  const deHoy = eventos.filter((evento) => evento.fecha === dia).length;
  const titulo =
    deHoy === 0
      ? eventos.length === 0
        ? textos.respuesta.titulo
        : textos.loQueViene
      : textos.hoyTenes(deHoy);

  return {
    titulo,
    cuerpo: renglones.join('\n'),
    url: '/agenda',
    etiqueta: `agenda-${dia}`,
    ...conSuIdioma(idioma),
  };
}

export function cargaDeLaRespuesta(
  respuesta: RespuestaParaElAviso,
  idioma: Idioma = IDIOMA_BASE,
): CargaDelAviso {
  return {
    titulo: TEXTOS[idioma].respuesta.titulo,
    cuerpo: fraseDeLaRespuesta(respuesta, idioma),
    url: `/proyectos/${respuesta.proyecto_id}`,
    etiqueta: `respuesta-${respuesta.id}`,
    ...conSuIdioma(idioma),
  };
}

export function cargaDeLaPrueba(idioma: Idioma = IDIOMA_BASE): CargaDelAviso {
  const { titulo, cuerpo } = TEXTOS[idioma].prueba;
  return { titulo, cuerpo, url: '/ajustes/avisos', etiqueta: 'prueba', ...conSuIdioma(idioma) };
}

export const CARGA_DE_LA_PRUEBA: CargaDelAviso = cargaDeLaPrueba();
