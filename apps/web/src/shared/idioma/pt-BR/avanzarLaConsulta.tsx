import type { Mensajes } from '../es';

import { plural } from './plural';

export const avanzarLaConsulta = {
  conceptos: {
    senaDeLaVisita: 'Sinal da visita',
    senaAlAprobar: 'Sinal',
  },
  avance: {
    queFalta: 'O que falta',
    etapa: 'Etapa',
  },
  tareas: {
    paraElPresupuesto: 'Para o orçamento',
    hechasDe: (hechas, total) => `${hechas} de ${total}`,
  },
  paso: {
    queDiaFuiste: 'Dia em que você foi',
    entregarElPresupuestoAntesDel: 'Enviar o orçamento até',
    ayudaDelVencimiento:
      'Uma semana de trabalho a partir da visita. Mude se você prometeu para outro dia.',
    cuantoTePagoLaVisita: 'Quanto o cliente pagou pela visita',
    opcional: 'Opcional',
    ayudaDelPagoDeLaVisita:
      'Se o cliente não pagou a visita, o próximo passo é uma estimativa. Mesmo assim você pode orçar.',
    anotarElRelevamiento: 'Registrar a visita técnica',
    todaviaNo: 'Ainda não',
    cuantoPresupuestaste: 'Quanto você orçou',
    ayudaDelPresupuesto: 'Se deixar em branco, você registra quando o cliente aprovar.',
    marcarComoEnviado: 'Marcar como enviado',
    cuantoTePago: 'Quanto o cliente pagou',
    ayudaDelPago: 'Se o cliente ainda não pagou e você vai orçar mesmo assim, deixe em branco.',
    queDiaTePago: 'Dia em que o cliente pagou',
    pasarAPresupuestar: 'Começar a orçar',
    errores: {
      sinDia: 'Informe o dia da visita técnica.',
      diaQueNoLlego:
        'Esse dia ainda não chegou. Se a visita for mais para a frente, mude a data em Editar.',
    },
  },
  contacto: {
    titulo: {
      nuevo: 'Registrar contato',
      editar: 'Editar o contato',
    },
    telefono: 'Telefone',
    ayudaDelTelefono: 'Fica salvo no cliente: é o que Ligar e WhatsApp usam.',
    quePide: 'O que o cliente pede',
    ejemploDeQuePide: 'Guarda-roupa, cozinha, painel de TV…',
    visita: {
      relevada: 'Data da visita técnica',
      agendada: 'Visita',
    },
    ayudaDeLaVisita: 'Se você já foi, passa para orçar; se for mais para a frente, fica agendada.',
    horaDeLaVisita: 'Horário da visita',
    ayudaDeLaHora: 'Opcional. Com horário, a visita aparece nessa hora da agenda.',
    senaCobrada: 'Sinal recebido',
    variosPagos: (cantidad) =>
      plural(cantidad, {
        one: 'É # pagamento: corrija nos detalhes do projeto.',
        other: 'São # pagamentos: corrija nos detalhes do projeto.',
      }),
    ayudaDeLaSena: 'O que o cliente deixou na visita. Entra no caixa da marcenaria.',
    ayudaDeLaSenaEnDolares: 'O que o cliente deixou na visita.',
    diaDeLaSena: 'Data do sinal',
    ayudaDelDiaDeLaSena:
      'A da visita, se já aconteceu; se não, hoje. Mude se o cliente pagou em outro dia.',
    yaFuiARelevar: 'Já fiz a visita técnica',
    ayudaDeYaFui:
      'Na agenda, a visita fica riscada. Se você não foi, desmarque e ela volta a ficar pendente.',
    entregarElPresupuestoAntesDel: 'Enviar o orçamento até',
    ayudaDelVencimientoAPresupuestar:
      'Aparece na agenda até você enviar. Se você mudar o dia da visita técnica, a data acompanha sozinha, a menos que você a tenha definido à mão.',
    ayudaDelVencimiento: 'Aparece na agenda até você marcar que enviou.',
    valeHasta: 'Orçamento válido até',
    ayudaDeValeHasta:
      'O cliente vê isso na própria página: se pagar o sinal antes desse dia, a página mostra quando poderia ficar pronto. Depois desse dia, mostra que venceu. Sem data, não promete nenhuma.',
    notas: 'Notas',
    ejemploDeNotas: 'O que o cliente disse por telefone, medidas, como chegar…',
    cancelar: 'Cancelar',
    guardar: {
      nuevo: 'Salvar contato',
      editar: 'Salvar alterações',
    },
    errores: {
      cliente: 'Escolha um cliente ou digite um nome para cadastrar um novo.',
      titulo: 'Conte o que o cliente pede, nem que seja em duas palavras.',
      largo: (caracteres) =>
        plural(caracteres, {
          one: 'Não pode passar de # caractere.',
          other: 'Não pode passar de # caracteres.',
        }),
      notas: 'As notas estão longas demais.',
    },
  },
  pasaje: {
    volverSinAprobar: 'Voltar sem aprovar',
    consultas: 'Consultas',
    activos: 'Ativos',
    titulo: (trabajo) => `Passar “${trabajo}” para Projetos`,
    bajada:
      'O cliente aprovou: agora entram os dados da obra. O que você já recebeu não é registrado de novo, continua sendo o mesmo pagamento.',
    queOpcionAprobo: 'Qual opção o cliente aprovou',
    opcionSinDetalle: 'Opção sem detalhes',
    corregirLaOpcion: (Enlace) => (
      <>
        O orçamento do projeto é o valor da opção que você escolher. Se o cliente aprovou outro
        valor, <Enlace>corrija a opção</Enlace> antes de passar.
      </>
    ),
    presupuestoAprobado: 'Orçamento aprovado',
    senaQueCobrasAhora: 'Sinal que você recebe agora',
    porcentajeDelPresupuesto: (porcentaje) => `${porcentaje}% do orçamento`,
    senaCubierta:
      'Com o que você já recebeu, o sinal está coberto. Deixe em branco se hoje não vai receber mais nada.',
    senaComoPago:
      'Entra como um pagamento do projeto, com o dia em que o cliente pagou e a forma de pagamento daqui. Se ainda não recebeu, deixe em branco.',
    diaEnQueEntroLaSena: 'Dia em que o sinal entrou',
    yaCobradoAntes: 'Já recebido antes',
    cobradoEnTotal: 'Recebido no total',
    saldoACobrar: 'Saldo a receber',
    gastosYaCargados: 'Despesas já registradas',
    formaDePago: 'Forma de pagamento',
    fechaDeInicio: 'Data de início',
    entregaEstimada: 'Previsão de entrega',
    ayudaDeLaEntrega: (dias) =>
      plural(dias, {
        one: 'Calculada com # dia útil a partir do início.',
        other: 'Calculada com # dias úteis a partir do início.',
      }),
    ayudaDeLaEntregaDelPresupuesto: (dias) =>
      plural(dias, {
        one: 'Calculada com # dia útil a partir do início, o prazo do orçamento.',
        other: 'Calculada com # dias úteis a partir do início, o prazo do orçamento.',
      }),
    direccionDeEntrega: 'Endereço de entrega',
    ejemploDeDireccion: 'Rua e número, cidade',
    comprobanteAEmitir: 'Comprovante a emitir',
    pasarAProyectos: 'Passar para Projetos',
    errores: {
      opcion: 'Escolha a opção que o cliente aprovou.',
      presupuesto: 'Informe o orçamento que o cliente aprovou, em pesos.',
      presupuestoEnDolares: 'Informe o orçamento que o cliente aprovou, em dólares.',
    },
    acordado: {
      noEstaEnElQueLeMandaste: 'Esse valor não está no orçamento que você enviou.',
      noEstaEn: (numero) => `Esse valor não está no orçamento ${numero}.`,
      elQueLeMandasteDice: (importe) => `No orçamento que você enviou consta ${importe}.`,
      dice: (numero, importe) => `No orçamento ${numero} consta ${importe}.`,
      siLoApruebasAsi: (acordado) =>
        `Se você aprovar assim, a página do cliente, a ficha e o PDF vão mostrar “Acordado na aprovação: ${acordado}”.`,
    },
  },
} satisfies Mensajes['avanzarLaConsulta'];
