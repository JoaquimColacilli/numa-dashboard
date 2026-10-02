import type { MensajesDelCliente } from '../es';

import { plural } from './plural';

const VEJA_AS_OPCOES: readonly string[] = [
  '',
  'Veja a opção no orçamento e conte para a gente o que achou.',
  'Veja as duas opções no orçamento e conte para a gente qual você prefere.',
  'Veja as três opções no orçamento e conte para a gente qual você prefere.',
  'Veja as quatro opções no orçamento e conte para a gente qual você prefere.',
  'Veja as cinco opções no orçamento e conte para a gente qual você prefere.',
  'Veja as seis opções no orçamento e conte para a gente qual você prefere.',
];

const DIAS = [
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
  'domingo',
] as const;

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const;

function diaDoMes(dia: number): string {
  return dia === 1 ? '1º' : String(dia);
}

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
    sigueConElPresupuestoVencido: 'O próximo passo é falar com a gente para atualizar.',
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
        sena: 'O sinal é em dinheiro, em mãos. Combine com a gente.',
        saldo: 'O saldo é em dinheiro, em mãos. Combine com a gente.',
      },
      tambienEfectivo: {
        sena: 'Você também pode pagar o sinal em dinheiro, em mãos, combinando com a gente.',
        saldo: 'Você também pode pagar o saldo em dinheiro, em mãos, combinando com a gente.',
      },
    },
    proyeccion: {
      coordinamosLaEntrega: 'Quando você aprovar e pagar o sinal, combinamos a data de entrega.',
      coordinamosLaEntregaAlAprobar: 'Quando você aprovar, combinamos a data de entrega.',
      vencio: (fecha) => `Este orçamento venceu em ${fecha}. Fale com a gente para atualizar.`,
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
        texto: 'Talvez você tenha excluído, ou o link aponta para um projeto de outra marcenaria.',
      },
    },
  },
  comoPagar: {
    oPorMercadoPago:
      'Ou pague pelo Mercado Pago, sem copiar nada: toque no botão, digite o valor acima e confirme.',
    pedileLosDatos:
      'Para transferir, peça os dados da conta para a gente: eles ainda não foram cadastrados.',
    pagarConMercadoPago: 'Pagar com Mercado Pago',
    despues: (nombre, comoSePaga) => `Depois, ${nombre}, ${comoSePaga}.`,
    despuesConElImporte: (nombre, importe, comoSePaga) =>
      `Depois, ${nombre}: ${importe}, ${comoSePaga}.`,
    vencio: (fecha) =>
      `Este orçamento venceu em ${fecha}. Fale com a gente para atualizar antes de pagar.`,
    copiarElMonto: 'Copiar o valor',
    alias: 'Alias',
    copiarElAlias: 'Copiar o alias',
    cbu: 'CBU',
    copiarElCbu: 'Copiar o CBU',
    cvu: 'CVU',
    copiarElCvu: 'Copiar o CVU',
    titular: 'Titular da conta',
    copiarElTitular: 'Copiar o titular',
    cuit: 'CUIT do titular',
    copiarElCuit: 'Copiar o CUIT',
    fijateQueSeaEsta:
      'Antes de confirmar, o banco mostra em nome de quem está a conta: confira se é esta.',
  },
  pagina: {
    tuMueble: 'Seu móvel',
    enQueAnda: 'Em que pé está',
    elCaminoDeTuMueble: 'Seu móvel, passo a passo',
    loQueFuePasando: 'O que já aconteceu',
    loQuePagaste: 'O que você pagou',
    fotosYPlanos: 'Fotos e desenhos',
    archivos: (cantidad) => plural(cantidad, { one: '# arquivo', other: '# arquivos' }),
    todaviaNoHayFotos: 'Ainda não há fotos',
    acaVanAAparecer:
      'Aqui vão aparecer os desenhos, os renders e as fotos que compartilharmos, do design à entrega.',
    ver: (nombre) => `Ver ${nombre}`,
    tipos: {
      imagen: 'Imagem',
      pdf: 'PDF',
      otro: 'Arquivo',
    },
    pago: 'Pagamento',
    finDeLaVista:
      'Montamos esta página para você, e ela se atualiza sozinha conforme o projeto avança. Se algo não bater, fale com a gente.',
    buenasNoticias: (cuando) => `Boa notícia! Vamos entregar em ${cuando}.`,
    cifras: {
      presupuesto: 'Orçamento',
      senaParaArrancar: 'Sinal para começar',
      pagaste: 'Você pagou',
      vale: 'Valor',
    },
    opciones: (cantidad) => plural(cantidad, { one: '# opção', other: '# opções' }),
    miraLasOpciones: (cantidad) =>
      VEJA_AS_OPCOES[cantidad] ??
      'Veja todas as opções no orçamento e conte para a gente qual você prefere.',
    presupuestoVencido: (fecha) =>
      `O orçamento venceu em ${fecha}: fale com a gente para atualizar.`,
    valorDelRelevamiento: (valor) =>
      `A visita técnica custa ${valor} e, se você decidir seguir em frente, esse valor é abatido do sinal do projeto.`,
    quedaACuenta: 'O que você pagou é abatido do sinal.',
    teQuedanParaLaSena: (falta) =>
      `O que você pagou é abatido do sinal: faltam ${falta} para completar.`,
    laSenaYaEstaCubierta: 'O que você pagou já cobre o sinal.',
    aCuentaDeLaSena: 'Abatido do sinal',
    saldo: {
      faltaElPresupuesto: 'Falta o orçamento',
      estaSaldado: 'Está quitado',
      teFaltaPagar: 'Falta pagar',
    },
    datos: {
      titulo: 'Dados do projeto',
      direccion: 'Endereço',
      empezamos: 'Começamos',
      todaviaNo: 'Ainda não',
      sena: 'Sinal',
      total: 'Total',
      aConfirmar: 'A confirmar',
      senaPagada: (sena) => `${sena} · pago`,
      senaQueFalta: (sena, falta) => `${sena} · faltam ${falta}`,
      totalPagado: (total) => `${total} · pago`,
    },
    entrega: {
      estimada: 'Previsão de entrega',
      confirmada: 'Entrega confirmada',
      entregado: 'Entregue',
      entrega: 'Entrega',
      aCoordinar: 'A combinar',
      fechaEstimada: (fecha) => `Previsão de entrega: ${fecha}`,
      entregadoEl: (fecha) => `Entregue em ${fecha}`,
      siNecesitasCambiarElDia: 'Se precisar mudar o dia, fale com a gente.',
      podemosEntregarlo: 'Podemos entregar.',
    },
    paraCuando: 'Para quando',
    pagos: {
      sinPagosAprobado:
        'Ainda não há nenhum pagamento registrado. O primeiro é o sinal: assim que registrarmos, ele aparece aqui.',
      losAnotaElTaller:
        'Os pagamentos aparecem aqui quando registramos, não no momento em que você transfere.',
      elPagoSeCoordina: 'Para pagar, fale com a gente para combinar.',
      noQuedaNada: 'Obrigado. Não há nada pendente.',
    },
  },
  coordinar: {
    titulo: 'Vamos combinar a entrega',
    teProponemos: 'Propomos este dia:',
    meQuedaBien: 'Fica bom para mim',
    mandando: 'Enviando…',
    noPuedoEseDia: 'Não posso nesse dia',
    marcaLosDias: {
      'un-dia':
        'Marque os dias que ficam bons para você e se é de manhã, à tarde ou nos dois horários. Entregamos de segunda a sábado.',
      'sus-dias':
        'Para combinar a entrega, marque os dias que ficam bons para você e se é de manhã, à tarde ou nos dois horários. Entregamos de segunda a sábado.',
    },
    llegasteAlMaximo: 'Você chegou a dez dias, que é o máximo.',
    tusDias: 'Seus dias',
    horarioDel: (dia) => `Horário de ${dia}`,
    franjas: {
      manana: 'De manhã',
      tarde: 'À tarde',
    },
    sacar: (dia) => `Tirar ${dia}`,
    sacarEsteDia: 'Tirar este dia',
    algoQueTengamosQueSaber: 'Tem algo que precisamos saber?',
    porEjemplo:
      'Por exemplo, se tem porteiro, o andar ou um horário em que você não pode. Se não marcar dias, conte aqui quando fica bom para você.',
    mandarMisDias: 'Enviar meus dias',
    volverAlDiaQueTePropusimos: 'Voltar ao dia que propusemos',
    dejarlosComoEstaban: 'Deixar como estavam',
    cambiarMisDias: 'Mudar meus dias',
    quedoConfirmada: 'Você disse que esse dia fica bom: a entrega está confirmada.',
    losDiasMandados: 'Você mandou estes dias. Vamos escolher um e confirmar nesta página.',
    laNotaMandada: 'Você deixou uma nota. Vamos escolher o dia e confirmar nesta página.',
    conFranja: {
      manana: (dia) => `${dia}, de manhã`,
      tarde: (dia) => `${dia}, à tarde`,
    },
    conLasDosFranjas: (dia) => `${dia}, de manhã ou à tarde`,
    listoTusDias: 'Pronto: recebemos seus dias. Vamos confirmar um.',
    listoElDia: 'Pronto: o dia da entrega está confirmado.',
    listoTeEsperamos: (cuando) => `Pronto: nos vemos em ${cuando}.`,
    yaEstabaConfirmada: 'Já confirmamos o dia da entrega: ele aparece acima.',
    cambioElPedido:
      'Enquanto você escolhia, mudamos o que pedimos. A página já está atualizada: veja o que mudou.',
    motivos: {
      forma: 'A página enviou algo que não esperávamos. Recarregue e tente de novo.',
      propuesta: 'Esse dia não pode mais ser aceito: pedimos os seus dias. Recarregue a página.',
      vacia: 'Marque pelo menos um dia ou escreva quando fica bom para você.',
      demasiados: 'São mais de dez dias: tire algum.',
      repetido: 'O mesmo dia veio duas vezes. Recarregue a página e tente de novo.',
      fuera:
        'Um dos dias ficou fora dos que podem ser escolhidos. Recarregue a página e escolha de novo.',
      domingo: 'Não entregamos aos domingos. Tire esse dia.',
      franja: 'Falta escolher manhã ou tarde em um dos dias.',
      largo: 'A nota passa de 500 caracteres.',
      tope: 'Você já respondeu muitas vezes. Fale com a gente.',
      'sin-senal':
        'Não foi possível enviar: a conexão caiu. O que você marcou continua aqui; tente de novo quando a internet voltar.',
      'no-se-pudo': 'Não foi possível enviar. Tente de novo daqui a pouco.',
    },
    calendario: {
      iniciales: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
      meses: MESES,
      dia: (diaDeLaSemana, dia, mes) =>
        `${DIAS[diaDeLaSemana] ?? ''}, ${diaDoMes(dia)} de ${(MESES[mes] ?? '').toLowerCase()}`,
    },
  },
  notaDelRelevamiento: {
    entendido: 'Entendi',
  },
  vidriera: {
    masTrabajos: 'Mais trabalhos nossos',
    enLasRedes: 'Siga a gente nas redes',
    fotosDeOtrosTrabajos: 'Fotos de outros trabalhos nossos',
    foto: (numero, total) => `Foto ${String(numero)} de ${String(total)}`,
    fotosAnteriores: 'Fotos anteriores',
    fotosSiguientes: 'Próximas fotos',
    enInstagram: (usuario) => `${usuario} no Instagram`,
    facebook: 'Nosso Facebook',
    tiktok: 'Nosso TikTok',
    compartir: 'Compartilhar',
    copiado: 'Copiado',
    paraCompartir: 'Para compartilhar, use este link',
    copiarElEnlace: 'Copiar o link',
  },
} satisfies MensajesDelCliente['vista'];
