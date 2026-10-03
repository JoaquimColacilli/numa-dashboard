import type { Mensajes } from '../es';

import { plural } from './plural';

export const hacerElSeguimiento = {
  plazos: {
    una_semana: 'Em uma semana',
    un_mes: 'Em um mês',
    tres_meses: 'Em três meses',
  },
  cuandoLeVolvesAEscribir: 'Quando você vai escrever de novo?',
  otroDia: 'Outro dia',
  errores: {
    sinProximoContacto: 'Escolha o dia em que você vai escrever de novo.',
    proximoContactoQuePaso: 'Esse dia já passou: escolha hoje ou mais para a frente.',
    sinDiaQueLeEscribiste: 'Informe o dia em que você escreveu.',
    diaQueNoLlego: 'Esse dia ainda não chegou: precisa ser hoje ou antes.',
    notaLarga: (caracteres) =>
      plural(caracteres, {
        one: 'Não pode passar de # caractere.',
        other: 'Não pode passar de # caracteres.',
      }),
    queSigue: 'Escolha o que aconteceu.',
  },
  ponerEnSeguimiento: {
    titulo: 'Por enquanto não',
    explicacion:
      'O cliente não disse não: disse que agora não. Passa para Retornos, sai das suas consultas e a agenda avisa no dia de escrever de novo.',
    nota: 'Nota',
    ejemploDeNota: 'Depois das férias, quando receber o 13º…',
    opcional: 'Opcional.',
    cancelar: 'Cancelar',
    pasarASeguimiento: 'Passar para Retornos',
  },
  registrarElContacto: {
    titulo: 'Registrar o contato',
    contactarA: (nombre) => `Falar com ${nombre}`,
    leTocabaEl: (fecha) => `Estava marcado para ${fecha}.`,
    leTocabaElConNota: (fecha, nota) => `Estava marcado para ${fecha}. ${nota}.`,
    queDiaLeEscribiste: 'Dia em que você escreveu',
    queTeContesto: 'O que o cliente respondeu',
    ejemploDeRespuesta: 'Para escrever depois do fim do mês, que achou mais barato…',
    opcional: 'Opcional.',
    yAhora: 'E agora?',
    opciones: {
      vuelve: {
        titulo: 'Voltou',
        detalle: 'O cliente se interessou de novo: volta para as consultas.',
      },
      otra_fecha: {
        titulo: 'Ainda não',
        detalle: 'Continua em Retornos: você escreve de novo outro dia.',
      },
      no_va: {
        titulo: 'Desistiu',
        detalle: 'Fica como perdido, com o fechamento de sempre.',
      },
    },
    vuelveA: 'Volta para',
    ayudaDeLaEtapa: 'A etapa em que estava quando você aceitou esperar. Mude se for outra.',
    notaParaLaProxima: 'Nota para a próxima vez',
    elCierre:
      'Abre o fechamento de sempre: se o cliente deixou sinal, ele vira receita da marcenaria, e o projeto vai para o Histórico. Dá para reativar.',
    cancelar: 'Cancelar',
    registrar: 'Registrar',
    botones: {
      vuelve: 'Voltar para as consultas',
      otra_fecha: 'Salvar a nova data',
      no_va: 'Ir para o fechamento',
    },
  },
} satisfies Mensajes['hacerElSeguimiento'];
