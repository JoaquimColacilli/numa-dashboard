import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const presupuesto = {
  titulo: 'Orçamento',
  tituloDelEstimativo: 'Estimativa',
  esUnNumeroEstimado: 'É um valor estimado: o orçamento final sai depois da visita técnica.',
  elQueAceptaste: 'O orçamento que você aceitou',
  borrador: 'Rascunho',
  verElDetalle: 'Ver os detalhes',
  vencido: {
    cuando: (fecha) => `Venceu em ${fecha}.`,
    queHacer: 'Fale com a marcenaria para atualizar.',
  },
  queCambio: (revision) => `O que mudou na revisão ${String(revision)}`,
  secciones: {
    detalle: 'Detalhes',
    herrajes: 'Ferragens',
    aTenerEnCuenta: 'Observações',
    incluye: 'Incluso',
    valores: 'Valores',
    avisos: 'Avisos',
    condiciones: 'Condições',
    garantia: 'Garantia',
  },
  valores: {
    total: 'Total',
    opcion: (letra) => `Opção ${letra}`,
    sena: (porcentaje) => `Sinal (${porcentaje}%)`,
    acordado: (monto) => `Acordado na aprovação: ${monto}`,
    yaPagaste: 'Você já pagou',
    teFaltaParaLaSena: 'Falta para o sinal',
    laSenaEstaCubierta: 'O sinal está coberto',
    despuesElSaldo: 'Depois, o saldo',
    elegiLaOpcion: 'Escolha a opção que preferir e avise a marcenaria.',
    referencia: (pesos, dolar, fecha) =>
      `São ${pesos} com o dólar a ${dolar}, a cotação válida para pagamentos feitos em ${fecha}.`,
    referenciaConLaSena: (pesos, sena, dolar, fecha) =>
      `São ${pesos}, e o sinal ${sena}, com o dólar a ${dolar}, a cotação válida para pagamentos feitos em ${fecha}.`,
  },
  definiciones: {
    formaDePago: 'Forma de pagamento',
    moneda: 'Moeda',
    plazo: 'Prazo de fabricação',
    entrega: 'Previsão de entrega',
    senaAntesDel: 'Sinal até',
    validez: 'Validade',
  },
  diasHabiles: (dias) => plural(dias, { one: '# dia útil', other: '# dias úteis' }),
  validez: {
    vencio: (fecha) => `Venceu em ${fecha}`,
    sinVencimiento: 'Sem vencimento',
    hasta: (fecha) => `Até ${fecha}`,
  },
  meses: (meses) => plural(meses, { one: '# mês', other: '# meses' }),
  acciones: {
    descargar: 'Baixar o PDF',
    compartir: 'Compartilhar',
    compartirElPdf: 'Compartilhar o PDF',
    escribirle: 'Falar com a marcenaria',
    comoDejarLaSena: 'Como pagar o sinal',
  },
  pdf: {
    preparando: 'Preparando o PDF…',
    listo: 'O PDF está pronto.',
    noSePudo: 'Não foi possível gerar o PDF. Toque de novo para tentar outra vez.',
  },
  aprobar: {
    aprobarEstaOpcion: 'Aprovar esta opção',
    aprobar: 'Aprovar',
    tituloDeLaOpcion: (letra) => `Aprovar a opção ${letra}`,
    tituloDelPresupuesto: 'Aprovar o orçamento',
    tituloDelEstimativo: 'Aprovar a estimativa',
    loQueAprobas: 'O que você está aprovando',
    queDia: 'Que dia fica bom para a gente ir medir?',
    queHorario: 'Em que horário?',
    franjas: {
      manana: 'De manhã',
      tarde: 'À tarde',
      me_da_igual: 'Tanto faz',
    },
    algoQueTengamosQueSaber: 'Algo que a gente precise saber',
    opcional: '(opcional)',
    loLee: (taller) => `O que você escrever aqui é lido por ${taller} para combinar a visita.`,
    contador: (usados, maximo) => `${String(usados)} de ${String(maximo)}`,
    cancelar: 'Cancelar',
    mandando: 'Enviando…',
    aprobasteLaOpcion: (letra, fecha) => `Você aprovou a opção ${letra} em ${fecha}.`,
    loAprobaste: (fecha) => `Você aprovou em ${fecha}.`,
    propusiste: {
      manana: (dia, taller) =>
        `Você sugeriu ${dia}, de manhã, para a medição. ${taller} vai escrever para confirmar.`,
      tarde: (dia, taller) =>
        `Você sugeriu ${dia}, à tarde, para a medição. ${taller} vai escrever para confirmar.`,
      me_da_igual: (dia, taller) =>
        `Você sugeriu ${dia} para a medição. ${taller} vai escrever para confirmar.`,
    },
    laSenaVaAntesDel: (fecha) => `Para confirmar os prazos, o sinal deve ser pago até ${fecha}.`,
    comoPagar: 'Como pagar',
    estoLeAvisa:
      'Isto avisa a marcenaria do que você escolheu. O orçamento fica confirmado com o sinal.',
    estoLeAvisaDelEstimativo: 'Isto avisa a marcenaria do que você escolheu.',
    teEquivocaste: (taller) => `Se enganou? Escreva para ${taller}`,
    motivos: {
      forma: 'A página enviou algo que não esperávamos. Recarregue e tente de novo.',
      opcion: 'Essa opção não está mais no orçamento. Recarregue a página.',
      dia: 'Escolha o dia que fica bom para a gente ir medir.',
      fuera: 'Esse dia não pode mais ser escolhido. Escolha outro.',
      franja: 'Escolha de manhã, à tarde ou tanto faz.',
      largo: 'O que você escreveu passa de 300 caracteres.',
      revision: 'A marcenaria enviou uma revisão nova. Recarregue a página para ver.',
      respondida: 'Este orçamento já tem a sua resposta. Recarregue a página.',
      'sin-senal':
        'Não foi possível enviar: a conexão caiu. O que você escolheu continua aqui; tente de novo quando a internet voltar.',
      'no-se-pudo': 'Não conseguimos enviar. Tente de novo daqui a pouco.',
    },
  },
  mensajeAlTaller: {
    numero: (numero) => `Olá, estou entrando em contato sobre o orçamento Nº ${numero}.`,
    conRevision: (numero, revision) =>
      `Olá, estou entrando em contato sobre o orçamento Nº ${numero} Rev. ${String(revision)}.`,
  },
} satisfies MensajesDelCliente['presupuesto'];
