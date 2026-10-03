import type { Mensajes } from '../es';

import { plural } from './plural';

export const paginaAnalitico = {
  volver: 'Histórico',
  titulo: 'Análise das entregas',
  bajada:
    'Quão perto você fica da data que prevê e quanto demora em cada tipo de móvel. Não mostra contas que os dados ainda não sustentam.',
  vacio: {
    titulo: 'Ainda não há entregas para comparar',
    detalle:
      'Quando você entregar um projeto com a data prevista, vai ver aqui quão perto chegou e quanto demora em cada tipo de projeto.',
  },
  dias: (valor, numero) =>
    plural(valor, { '=0': `${numero} dias`, one: `${numero} dia`, other: `${numero} dias` }),
  diasDespues: (valor, numero) =>
    plural(valor, {
      '=0': `${numero} dias depois`,
      one: `${numero} dia depois`,
      other: `${numero} dias depois`,
    }),
  diasAntes: (valor, numero) =>
    plural(valor, {
      '=0': `${numero} dias antes`,
      one: `${numero} dia antes`,
      other: `${numero} dias antes`,
    }),
  elMismoDia: 'no mesmo dia',
  trabajos: (cantidad) =>
    plural(cantidad, { '=0': '0 projetos', one: '# projeto', other: '# projetos' }),
  sinDatos: 'Ainda sem dados',
  sinFechaEstimada: 'Sem data prevista para comparar',
  enLaMediana: (desvio) => `${desvio} (mediana)`,
  medianaDeLosDias: (mediana, minimo, maximo) => `${mediana} (mediana), de ${minimo} a ${maximo}`,
  variosDias: (lista) => `${lista} dias`,
  precision: {
    titulo: 'Quão precisas são suas previsões',
    bajada: 'A primeira data prevista de cada projeto contra o dia em que você entregou.',
    sinEntregas: 'Você ainda não entregou nenhum projeto com data prevista para comparar.',
    pocos: (cantidad) =>
      plural(cantidad, {
        one: 'Com um projeto ainda é pouco para fazer uma conta: veja caso a caso.',
        other: 'Com # projetos ainda é pouco para fazer uma conta: veja caso a caso.',
      }),
    elMismoDia: 'Na mediana, você entrega no mesmo dia que previu.',
    despues: (valor, numero) =>
      plural(valor, {
        one: `Na mediana, você entrega ${numero} dia depois do previsto.`,
        other: `Na mediana, você entrega ${numero} dias depois do previsto.`,
      }),
    antes: (valor, numero) =>
      plural(valor, {
        one: `Na mediana, você entrega ${numero} dia antes do previsto.`,
        other: `Na mediana, você entrega ${numero} dias antes do previsto.`,
      }),
    extremos: (adelantado, atrasado) =>
      `O mais adiantado: ${adelantado}; o mais atrasado: ${atrasado}.`,
    aciertos: (acertados, total) => `Você acertou ${acertados} de ${total}.`,
    aciertosConPorcentaje: (acertados, total, porcentaje) =>
      `Você acertou ${acertados} de ${total} (${porcentaje}%).`,
    acertarEs: (margen) =>
      plural(margen, {
        one: 'Acertar é entregar até # dia antes ou depois.',
        other: 'Acertar é entregar até # dias antes ou depois.',
      }),
    cumplidas: (cumplidas, total) =>
      `Você cumpriu ${cumplidas} de ${total} datas de entrega confirmadas.`,
    cumplidasConPorcentaje: (cumplidas, total, porcentaje) =>
      `Você cumpriu ${cumplidas} de ${total} datas de entrega confirmadas (${porcentaje}%).`,
    importadas: (cantidad) =>
      plural(cantidad, {
        one: 'Em # projeto, a previsão é a que estava registrada no dia em que o app começou a guardar o histórico das datas, não necessariamente a primeira que você deu.',
        other:
          'Em # projetos, a previsão é a que estava registrada no dia em que o app começou a guardar o histórico das datas, não necessariamente a primeira que você deu.',
      }),
  },
  porTipo: {
    titulo: 'Quanto você demora por tipo de projeto',
    bajada: (umbral) =>
      plural(umbral, {
        one: 'Com menos de # projeto de um tipo, você vê cada caso; a partir daí, a mediana.',
        other: 'Com menos de # projetos de um tipo, você vê cada caso; a partir daí, a mediana.',
      }),
    ninguno:
      'Nenhum projeto entregue tem tipo de projeto. Coloque na ficha, em Editar, e aqui você vai vê-los agrupados.',
    sinTipo: (cantidad) =>
      plural(cantidad, {
        one: '# projeto sem tipo: coloque o tipo na ficha para que ele conte aqui.',
        other: '# projetos sem tipo: coloque o tipo na ficha de cada um para que contem aqui.',
      }),
    delArranqueALaEntrega: 'Do início à entrega',
    delArranqueAListo: 'Do início até ficar pronto',
    contraLoEstimado: 'Contra o previsto',
  },
  porCarga: {
    titulo: 'Conforme quantos projetos você tinha em andamento',
    bajada:
      'Do início à entrega, conforme quantos outros projetos havia na marcenaria quando você aprovou.',
    entre: (desde, hasta) => `${desde} ou ${hasta} em andamento`,
    oMas: (desde) => `${desde} ou mais em andamento`,
  },
  trabajoPorTrabajo: {
    titulo: 'Projeto a projeto',
    bajada: (cantidad) =>
      plural(cantidad, {
        one: '# projeto entregue, do mais novo ao mais antigo.',
        other: '# projetos entregues, do mais novo ao mais antigo.',
      }),
    esconder: 'Esconder os números',
    ver: 'Ver os números',
    sinTipo: 'Sem tipo',
    estimada: 'Prevista',
    sinFecha: 'Sem data',
    entregado: 'Entregue',
    entregadoConDesvio: (fecha, desvio) => `${fecha}, ${desvio}`,
    comprometida: 'Confirmada',
    cumplida: (fecha) => `${fecha}, cumprida`,
    noCumplida: (fecha) => `${fecha}, não cumprida`,
    tardo: 'Levou',
    sinDiaDeEntrega: (cantidad) =>
      plural(cantidad, {
        one: '# projeto entregue sem a data de entrega registrada não entra na conta.',
        other: '# projetos entregues sem a data de entrega registrada não entram na conta.',
      }),
  },
} satisfies Mensajes['paginaAnalitico'];
