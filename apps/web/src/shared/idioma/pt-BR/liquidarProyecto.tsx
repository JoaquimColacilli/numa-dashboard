import type { Mensajes } from '../es';

import { plural } from './plural';

export const liquidarProyecto = {
  pantalla: {
    cobrado: {
      titulo: (trabajo) => `Receber “${trabajo}”`,
      verbo: 'Receber e dividir',
      verboConMonto: (monto) => `Receber e dividir ${monto}`,
      volver: 'Voltar sem receber',
      dia: 'Data do recebimento',
      ayudaDelDia: (mes, anio) =>
        `O dia em que o dinheiro terminou de entrar. Os tetos da fila contam em ${mes} de ${anio}.`,
      siTeEquivocaste: 'Se você errou, dá para reabrir pela ficha e a divisão é desfeita.',
    },
    perdido: {
      titulo: (trabajo) => `Dar “${trabajo}” como perdido`,
      verbo: 'Dar como perdido e liquidar o sinal',
      verboConMonto: (monto) => `Dar como perdido e liquidar ${monto}`,
      volver: 'Voltar sem fechar',
      dia: 'Data do fechamento',
      ayudaDelDia: (mes, anio) =>
        `O dia em que o sinal passa a ser da marcenaria. A divisão conta em ${mes} de ${anio}.`,
      siTeEquivocaste: 'Se você errou, dá para reativar pela ficha e a divisão é desfeita.',
    },
    trio: {
      presupuesto: 'Orçamento',
      cobrado: 'Recebido',
      saldo: 'Saldo',
      sinSaldo: 'Sem saldo',
    },
    pagoFinal: 'Pagamento final',
    registrarElPagoFinalDe: (monto) => `Registrar o pagamento final de ${monto}`,
    ayudaDelPagoFinal:
      'Fica registrado como mais um pagamento do projeto e entra na conta abaixo. Se o cliente ficou devendo, desmarque e receba o que entrou.',
    concepto: 'Descrição',
    monto: 'Valor',
    fechaDelPago: 'Data do pagamento',
    maunEnNegativo: (maun, saldo, tesoros) =>
      `Depois de receber, ${maun} fica em ${saldo}: parte do que você recebeu está em ${tesoros}.`,
    entreComillas: (nombre) => `“${nombre}”`,
    venderDolares: 'Vender dólares',
    montoATesoro: (monto, tesoro) => `${monto} para ${tesoro}`,
    vanACadaTesoro: (lista, cantidad) =>
      plural(cantidad, { one: `Vai ${lista}.`, other: `Vão ${lista}.` }),
    seReparteElIngreso: (monto) =>
      `A receita deste projeto é dividida: ${monto} (o recebido menos as despesas).`,
    quedaEnElLibro:
      'Fica no livro-caixa com a data, mas não mexe nas caixinhas: já estava nos seus saldos.',
    seMuevenLosSaldos: 'Os saldos das caixinhas mudam com isso.',
    noHayIngreso:
      'Não há receita para dividir: nenhuma caixinha muda e o prejuízo fica registrado no caixa da marcenaria.',
    trayendoLosTesoros:
      'Carregando as caixinhas da marcenaria. Sem elas a divisão não sai: o botão é liberado assim que chegarem.',
    sena: {
      queLePasa: 'O que acontece com o sinal',
      titulo: 'Isso movimenta dinheiro, mesmo sendo um orçamento que não deu certo',
      retenida: (monto) =>
        `Os ${monto} de sinal que você retém deixam de ser um adiantamento e passam a ser receita da marcenaria.`,
      diezmo: (monto) => `Daí sai o dízimo: ${monto}.`,
      sinDiezmo: 'Este sinal não paga dízimo, conforme a configuração da marcenaria.',
      otrasObligaciones: (lista) => `As outras obrigações saem igual: ${lista}.`,
      conSueldo: 'E também paga o pró-labore, conforme a configuração da marcenaria.',
      sinSueldo: 'Não paga pró-labore: um orçamento que não deu certo não é um projeto.',
      loQueSobraQuedaEnElTaller:
        'O resto desce pela fila como em qualquer recebimento, e o que sobra fica na marcenaria.',
      loQueSobraVaA: (tesoro) =>
        `O resto desce pela fila como em qualquer recebimento, e o que sobra vai para ${tesoro}.`,
      sinSenaRetenida: 'Não há sinal retido, então nenhum dinheiro sai das caixinhas.',
      gastosComoPerdida: (monto) =>
        `Os ${monto} de despesas que você registrou ficam como prejuízo da marcenaria.`,
      sePuedeDeshacer:
        'Dá para desfazer: ao reativar o orçamento, ele volta para as consultas e o dinheiro é descontado das caixinhas.',
    },
  },
  reversion: {
    cobro: {
      abrir: 'Reabrir o recebimento',
      pregunta: 'Reabrir o recebimento?',
      confirmar: 'Reabrir e desfazer a divisão',
    },
    presupuesto: {
      abrir: 'Reativar o orçamento',
      pregunta: 'Reativar o orçamento?',
      confirmar: 'Reativar e desfazer a divisão',
    },
    yaEnLaApertura:
      'Esta divisão já estava nos seus saldos quando você começou a usar o app, então desfazê-la não mexe no dinheiro das caixinhas. Os pagamentos e as despesas voltam a poder ser editados.',
    seDeshaceElReparto:
      'A divisão é desfeita. Isto volta de cada caixinha para o caixa da marcenaria:',
    loQueVuelve: 'O que volta para o caixa da marcenaria',
    elMesDe: (fecha) =>
      `Este fechamento deixa de contar no mês de ${fecha}, e o que faltar para os tetos da fila fica à vista.`,
    sinTesoros:
      'Esta divisão não mexeu em nenhuma caixinha, então desfazê-la também não movimenta dinheiro. Os pagamentos e as despesas voltam a poder ser editados.',
    vuelveAEntregado: (Negrita, fecha) => (
      <>
        Volta para <Negrita>Entregue</Negrita>. Quando você receber de novo, a data deste
        recebimento ({fecha}) já vem preenchida e dá para corrigir. O novo recebimento usa a mesma
        fila deste: corrigir uma despesa não reescreve os tetos nem a divisão com a fila de hoje.
      </>
    ),
    vuelveAEntregadoSinFecha: (Negrita) => (
      <>
        Volta para <Negrita>Entregue</Negrita>. Quando você receber de novo, a data deste
        recebimento já vem preenchida e dá para corrigir. O novo recebimento usa a mesma fila deste:
        corrigir uma despesa não reescreve os tetos nem a divisão com a fila de hoje.
      </>
    ),
    loQueSiMira:
      'O que conta, sim, é o que o seu pró-labore já recebeu nesse mês, como num recebimento novo.',
    vuelveALasConsultas: 'Volta para as consultas, na etapa',
    noGuardaLaFecha: (Negrita) => (
      <>
        Diferente de reabrir um recebimento, isto <Negrita>não guarda a data</Negrita>: um orçamento
        que volta está vivo de novo e, se mais adiante você o der como perdido outra vez, é um
        fechamento novo, com o dia que escolher e a fila daquele momento.
      </>
    ),
    dejarloComoEsta: 'Deixar como está',
  },
} satisfies Mensajes['liquidarProyecto'];
