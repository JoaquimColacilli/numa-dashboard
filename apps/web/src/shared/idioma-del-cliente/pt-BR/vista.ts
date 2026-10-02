import type { MensajesDelCliente } from '../es';

export const vista = {
  delDominio: {
    hitos: {
      estimativo: {
        etiqueta: 'Enviamos uma estimativa',
        futuro: 'Enviamos uma estimativa',
      },
      presupuesto: { etiqueta: 'Orçamento enviado', futuro: 'Vamos enviar o orçamento' },
      aprobado: {
        etiqueta: 'Aprovado, sinal recebido',
        futuro: 'Quando você aprovar e pagar o sinal',
      },
      fabricacion: { etiqueta: 'Em fabricação', futuro: 'Vamos começar a fabricar' },
      entregado: { etiqueta: 'Entregue', futuro: 'Entregamos e montamos' },
      pagado: { etiqueta: 'Pago', futuro: 'Quando estiver quitado' },
    },
    aprobadoSinLaSena: 'Aprovado',
    cuandoLoApruebes: 'Quando você aprovar',
    cuandoDejesLaSena: 'Quando você pagar o sinal',
    yaEstaPagado: 'Já está pago',
    enCurso: {
      estimativo: 'Enviamos uma estimativa',
      presupuesto: 'Estamos preparando seu orçamento',
      aprobado: 'Recebemos o sinal e seu projeto já está na nossa fila',
      fabricacion: 'Estamos fabricando',
      entregado: 'Já está montado na sua casa',
      pagado: 'Pronto, está quitado',
    },
    presupuestoMandado: 'Enviamos o orçamento',
    titularDelAprobado: {
      cubierta: 'Recebemos o sinal e seu projeto já está na nossa fila',
      falta: 'Você aprovou. Com o sinal, seu projeto entra na nossa fila',
      'sin-presupuesto': 'Você aprovou e seu projeto já está na nossa fila',
    },
    sigue: {
      estimativo: 'Se seguirmos em frente, a próxima novidade aqui vai ser o orçamento.',
      presupuesto: 'A próxima novidade aqui vai ser o orçamento.',
      aprobado: 'A próxima novidade aqui vai ser o início da fabricação.',
      fabricacion: 'A próxima novidade aqui vai ser a entrega.',
      entregado: 'A próxima novidade aqui vai ser o pagamento do saldo.',
    },
    titularListo: 'Seu móvel está pronto',
    listoParaEntregar: 'Pronto para entrega',
    sigueListo: {
      'sin-pedido': 'O próximo passo é combinar o dia da entrega.',
      'un-dia': 'O próximo passo é você nos dizer se esse dia funciona.',
      'sus-dias': 'O próximo passo é você nos mandar os dias que funcionam.',
      mandados: 'O próximo passo é confirmarmos o dia.',
    },
    sigueConLaComprometida: 'A próxima novidade aqui vai ser a entrega.',
    sigueConElPresupuestoMandado: 'O próximo passo é você aprovar e pagar o sinal.',
    sigueConLaSenaCubierta: 'O próximo passo é você aprovar.',
    sigueConElPresupuestoVencido: 'O próximo passo é falar com a marcenaria para atualizar.',
    sigueFaltaLaSena: 'O próximo passo é você pagar o sinal.',
    sigueFaltaMedir: {
      estimativo:
        'Se seguirmos em frente, o próximo passo é a visita técnica, para enviarmos o orçamento.',
      presupuesto: 'O próximo passo é a visita técnica, para podermos enviar o orçamento.',
    },
    relevamientoTecnico: 'Visita técnica',
    queEsElRelevamiento: [
      'O próximo passo é a visita técnica no local. Nela tiramos as medidas exatas, verificamos as instalações e definimos os detalhes construtivos para projetar seu móvel milímetro a milímetro.',
      'Com essa visita, enviamos o projeto 3D e o orçamento final.',
    ],
    eventos: {
      estimativo: 'Enviamos uma estimativa',
      relevamiento: 'Fizemos a visita técnica',
      presupuesto: 'Enviamos o orçamento',
      pago: 'Recebemos seu pagamento',
      pagoQueSalda: 'Recebemos o pagamento e está quitado',
      saldoQueSalda: 'Recebemos o saldo e está quitado',
      aprobado: 'Você aprovou o orçamento',
      inicio: 'Começamos a fabricar na marcenaria',
      listo: 'Terminamos seu móvel',
      entregado: 'Entregamos e montamos',
    },
    comoPagar: {
      titulo: 'Como pagar',
      etiquetaDelImporte: { sena: 'Agora, o sinal', saldo: 'Agora, o saldo' },
      nombre: { sena: 'o sinal', saldo: 'o saldo' },
      porTransferenciaOEnEfectivo: 'por transferência ou em dinheiro',
      porTransferencia: 'por transferência',
      enEfectivo: 'em dinheiro',
      pasosParaTransferir:
        'Copie o alias, cole em Transferir no app do seu banco ou da sua carteira digital, digite o valor e confirme.',
      soloEfectivo: {
        sena: 'O sinal é em dinheiro, em mãos. Combine com a marcenaria.',
        saldo: 'O saldo é em dinheiro, em mãos. Combine com a marcenaria.',
      },
      tambienEfectivo: {
        sena: 'Você também pode pagar o sinal em dinheiro, em mãos, combinando com a marcenaria.',
        saldo: 'Você também pode pagar o saldo em dinheiro, em mãos, combinando com a marcenaria.',
      },
    },
    proyeccion: {
      coordinamosLaEntrega: 'Quando você aprovar e pagar o sinal, combinamos a data de entrega.',
      coordinamosLaEntregaAlAprobar: 'Quando você aprovar, combinamos a data de entrega.',
      vencio: (fecha) => `Este orçamento venceu em ${fecha}. Fale com a marcenaria para atualizar.`,
      siLoAprobasAntesDel: (antesDe, listoPara) =>
        `Se você aprovar antes de ${antesDe}, podemos ter tudo pronto até ${listoPara}.`,
      siDejasLaSenaAntesDel: (antesDe, listoPara) =>
        `Se você pagar o sinal antes de ${antesDe}, podemos ter tudo pronto até ${listoPara}.`,
      vamosTomandoLosTrabajos: 'Pegamos os projetos na ordem em que os sinais chegam.',
    },
    nota: {
      pendiente: {
        etiqueta: 'Por que o valor ainda pode mudar',
        titulo: 'O valor ainda pode mudar',
      },
      hecho: {
        etiqueta: 'De onde vem este valor',
        titulo: 'O valor já foi calculado com as medidas reais',
      },
      yaFuimosAMedir: 'Já fizemos a visita técnica.',
      fuimosAMedirEl: (fecha) => `Fizemos a visita técnica em ${fecha}.`,
      armamosElPresupuesto: 'Com essas medidas, montamos o orçamento final.',
      cerrandoElPresupuesto: 'Com essas medidas, estamos fechando o orçamento final.',
      resumenYaFuimos: 'Visita técnica feita',
      medidoEl: (fecha) => `Medido em ${fecha}`,
      faltaMedirDelEstimado: [
        'O que enviamos é uma estimativa, feita com base no que conversamos.',
        'Para fechar, precisamos ir até a sua casa tirar as medidas.',
      ],
      sinFechaParaLaVisita: 'Ainda não temos data para a visita.',
      quedamosEnIrEl: (fecha) => `Combinamos de ir em ${fecha}.`,
      resumenFaltaMedir: 'Valor estimado, falta a visita técnica',
    },
  },
  pantalla: {
    abriendo: 'Carregando seu móvel',
    sinSenal: {
      titulo: 'Sem internet',
      texto: 'Você precisa de internet para ver o projeto. Tente de novo quando a conexão voltar.',
    },
    error: {
      titulo: 'Não foi possível carregar a página',
      texto: 'A conexão caiu antes de os dados chegarem. O link continua valendo.',
      reintentar: 'Tentar de novo',
    },
    muerto: {
      enlace: {
        titulo: 'Este link não funciona mais',
        texto:
          'A marcenaria desativa os links que compartilha quando precisa. Peça um novo a quem enviou e você vai poder ver tudo de novo.',
      },
      trabajo: {
        titulo: 'Esse projeto não está aqui',
        texto:
          'Talvez você tenha excluído, ou o link aponta para um projeto de outra marcenaria.',
      },
    },
  },
  comoPagar: {
    oPorMercadoPago:
      'Ou pague pelo Mercado Pago, sem copiar nada: toque no botão, digite o valor acima e confirme.',
    pedileLosDatos:
      'Para transferir, peça os dados da conta à marcenaria: eles ainda não foram cadastrados.',
  },
} satisfies MensajesDelCliente['vista'];
