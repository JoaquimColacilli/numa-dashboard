import type { MensajesDelCliente } from '../es';
import { plural } from './plural';

export const presupuesto = {
  titulo: 'Orçamento',
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
  },
  definiciones: {
    formaDePago: 'Forma de pagamento',
    plazo: 'Prazo de fabricação',
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
  mensajeAlTaller: {
    numero: (numero) => `Olá, estou entrando em contato sobre o orçamento Nº ${numero}.`,
    conRevision: (numero, revision) =>
      `Olá, estou entrando em contato sobre o orçamento Nº ${numero} Rev. ${String(revision)}.`,
  },
} satisfies MensajesDelCliente['presupuesto'];
