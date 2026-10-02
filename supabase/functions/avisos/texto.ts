import {
  diasEntre,
  ETIQUETAS_DE_IDIOMA,
  IDIOMA_BASE,
  type CategoriaDerivada,
  type EventoDeLaAgenda,
  type Idioma,
} from '@maun/domain';

export interface CargaDelAviso {
  titulo: string;
  cuerpo: string;
  url: string;
  etiqueta: string;
  lang?: string;
}

interface TextosDelAviso {
  accion: Readonly<Record<CategoriaDerivada, (titulo: string) => string>>;
  vence: (renglon: string, monto: string) => string;
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

function queDice(textos: TextosDelAviso, evento: EventoDeLaAgenda): string {
  if (evento.clase === 'propia') return evento.texto;
  if (evento.clase === 'vencimiento') {
    return textos.vence(evento.renglon, textos.plata(evento.monto));
  }
  return textos.accion[evento.categoria](evento.titulo);
}

function conSuIdioma(idioma: Idioma): { lang?: string } {
  return idioma === IDIOMA_BASE ? {} : { lang: ETIQUETAS_DE_IDIOMA[idioma] };
}

export function cargaDelAviso(
  eventos: readonly EventoDeLaAgenda[],
  dia: string,
  idioma: Idioma = IDIOMA_BASE,
): CargaDelAviso {
  const textos = TEXTOS[idioma];
  const renglones = eventos
    .slice(0, MAXIMO_DE_RENGLONES)
    .map((evento) => textos.renglon(queDice(textos, evento), cuando(textos, dia, evento.fecha)));
  if (eventos.length > MAXIMO_DE_RENGLONES) {
    renglones.push(textos.masEnLaAgenda(eventos.length - MAXIMO_DE_RENGLONES));
  }
  const deHoy = eventos.filter((evento) => evento.fecha === dia).length;
  const titulo = deHoy === 0 ? textos.loQueViene : textos.hoyTenes(deHoy);

  return {
    titulo,
    cuerpo: renglones.join('\n'),
    url: '/agenda',
    etiqueta: `agenda-${dia}`,
    ...conSuIdioma(idioma),
  };
}

export function cargaDeLaPrueba(idioma: Idioma = IDIOMA_BASE): CargaDelAviso {
  const { titulo, cuerpo } = TEXTOS[idioma].prueba;
  return { titulo, cuerpo, url: '/ajustes/avisos', etiqueta: 'prueba', ...conSuIdioma(idioma) };
}

export const CARGA_DE_LA_PRUEBA: CargaDelAviso = cargaDeLaPrueba();
