import type { Mensajes } from '../es';

export const api = {
  acceso: {
    enlaceEnOtroNavegador:
      'O link foi aberto em outro navegador ou em outro app, e só funciona no mesmo em que você o pediu. Peça um novo neste dispositivo e abra aqui mesmo.',
    enlaceVencido:
      'O link expirou ou já foi usado: cada link funciona uma única vez e por pouco tempo. Peça um novo.',
    sesionTerminada: 'Sua sessão foi encerrada. Entre de novo com seu e-mail e sua senha.',
    cuentaRepetida:
      'Já existe uma conta com esse e-mail. Entre com sua senha ou peça uma nova se não lembrar dela.',
    huellaRepetida: 'Este dispositivo já tem a digital registrada na sua conta.',
    huellaCancelada:
      'A digital foi cancelada ou demorou demais. Tente de novo ou entre com sua senha.',
    huellaEnOtraDireccion:
      'A digital não pode ser usada neste endereço do app. Abra pelo endereço de sempre.',
    sinHuellaEnElDispositivo:
      'Este dispositivo não tem digital nem bloqueio de tela para confirmar que é você.',
    huellaVencida: 'Passou tempo demais antes de confirmar a digital. Tente de novo.',
    generico: 'Não foi possível concluir a operação. Tente de novo.',
    credencialesInvalidas:
      'O e-mail ou a senha não conferem. Confira os dois; se não lembrar a senha, peça uma nova.',
    mailSinConfirmar:
      'Você ainda não confirmou o e-mail. Abra o link que enviamos quando você criou a conta ou peça para enviarmos de novo.',
    contrasenaDebil: 'A senha é muito fraca: use pelo menos 6 caracteres.',
    mismaContrasena: 'A senha nova é igual à que você já tinha. Escolha outra.',
    demasiadosMails:
      'O servidor já enviou todos os e-mails que permite por hora. Espere um pouco e peça de novo; enquanto isso, olhe a caixa de spam.',
    demasiadosIntentos: 'Foram muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
    formatoInvalido: 'Confira o e-mail e a senha: um dos dois não tem um formato válido.',
    mailInvalido: 'Esse e-mail não parece válido. Confira se está escrito certo.',
    mailNoAutorizado: 'O servidor não envia e-mails para esse endereço. Tente outro e-mail.',
    altasCerradas: 'No momento não é possível criar contas novas.',
    accesoConMailCerrado: 'No momento não é possível entrar com e-mail e senha.',
    cuentaSuspendida: 'Esta conta está suspensa e não pode entrar.',
    cuentaInexistente: 'Não encontramos essa conta. Confira o e-mail.',
    hayQueConfirmar:
      'Para mudar a senha, é preciso confirmar que é você: peça o link de recuperação e abra pelo e-mail.',
    servidorLento: 'O servidor demorou demais para responder. Tente de novo.',
    servidorConProblemas: 'O servidor teve um problema. Tente de novo daqui a pouco.',
    huellaDeshabilitada:
      'A digital ainda não está habilitada no servidor. Enquanto isso, entre com sua senha.',
    demasiadasHuellas: 'Sua conta já tem o máximo de digitais registradas.',
    huellaSinVerificar:
      'O servidor não conseguiu verificar a digital. Tente de novo ou entre com sua senha.',
    sensorConProblemas:
      'O sensor de digital teve um problema. Tente de novo ou entre com sua senha.',
    respuestaInesperada: 'O servidor respondeu algo inesperado. Tente de novo.',
    sinRed: 'Sem conexão com o servidor. Tente de novo quando a internet voltar.',
    navegadorSinHuella: 'Este navegador não pode usar a digital. Entre com sua senha.',
    enlaceDelCorreo: 'O link do e-mail não funcionou. Peça um novo neste dispositivo.',
  },
  accesoConCodigo: (codigo) => `Não foi possível concluir a operação (${codigo}). Tente de novo.`,
  rechazos: {
    esteTrabajo: 'Este projeto',
    trabajo: (titulo) => `O projeto “${titulo}”`,
    siSigueIgual: 'Tente de novo e, se continuar igual, avise.',
    sinPermiso: {
      titulo: 'Sua conta não tem acesso a isto.',
      queHacer:
        'Pode ser que o projeto seja de outra marcenaria ou que sua conta tenha ficado sem marcenaria. Saia e entre de novo.',
    },
    MN001: {
      cobro: {
        cobrado: (trabajo) => `${trabajo} já estava pago.`,
        perdido: (trabajo) => `${trabajo} já estava encerrado como perdido.`,
        queHacer:
          'Talvez você tenha fechado pelo celular ou pelo computador. Veja como ficou a divisão: se não for a que você esperava, reabra.',
      },
      baja: {
        cobrado: (trabajo) =>
          `${trabajo} tem pagamentos ou despesas e está pago: não pode ser excluído.`,
        perdido: (trabajo) =>
          `${trabajo} tem pagamentos ou despesas e está encerrado como perdido: não pode ser excluído.`,
        queHacer:
          'Excluir esse dinheiro o tiraria do livro-caixa. Se a divisão estiver errada, corrija reabrindo.',
      },
      otro: {
        cobrado: (trabajo) => `${trabajo} está pago e os números dele foram fechados.`,
        perdido: (trabajo) =>
          `${trabajo} está encerrado como perdido e os números dele foram fechados.`,
      },
      salida: {
        cobrado:
          'Reabra o recebimento, corrija o que for preciso e registre o recebimento de novo: a divisão é refeita com os números corrigidos.',
        perdido:
          'Reative o orçamento, registre o que faltar e feche de novo: a divisão do sinal é refeita.',
      },
    },
    MN002: {
      titulo: (trabajo) => `${trabajo} foi excluído.`,
      queHacer: 'Talvez você tenha excluído em outro dispositivo. Se precisar, registre de novo.',
    },
    MN003: {
      titulo: (cliente) => `“${cliente}” tem projetos cadastrados.`,
      sinCliente: 'Este cliente tem projetos cadastrados.',
      queHacer: 'Exclua esses projetos ou passe-os para outro cliente e depois exclua o cliente.',
    },
    MN004: {
      titulo: 'O banco de dados não aceitou essa alteração.',
      queHacer: 'Isso não deveria acontecer. Registre de novo e, se continuar igual, avise.',
    },
    MN005: {
      titulo: 'O cliente deste projeto foi excluído.',
      queHacer:
        'Escolha outro cliente para o projeto ou registre de novo o cliente que você excluiu.',
    },
    MN006: {
      cobro: {
        titulo: 'Os números mudaram desde que você viu a divisão.',
        queHacer:
          'Foi registrado um pagamento ou uma despesa, o pró-labore ou os custos fixos mudaram, ou a fila mudou. Abra o recebimento de novo: a divisão é recalculada com o que existe agora, e você confere antes de confirmar.',
      },
      fila: {
        titulo: 'A fila mudou enquanto você editava.',
        queHacer:
          'Ela foi salva em outro dispositivo ou as Configurações mudaram. Veja como ficou e faça suas alterações de novo.',
      },
      cambio: (trabajo) => `${trabajo} mudou desde que você o abriu.`,
      desdeLaFicha: 'Abra a ficha de novo para ver como ficou e tente outra vez a partir dela.',
      desdeOtroLado:
        'Algo foi salvo em outro lugar. Abra de novo para ver o que existe agora e registre o que faltar.',
    },
    MN007: {
      cobro: {
        titulo: (trabajo) => `${trabajo} ainda não foi entregue.`,
        queHacer:
          'Só se recebe pelo que já foi entregue. Marque como entregue e depois registre o recebimento.',
      },
      cierre: {
        titulo: (trabajo) => `${trabajo} já foi entregue: não pode ser dado como perdido.`,
        queHacer:
          'Um móvel entregue é cobrado, mesmo que o cliente demore. Registre o recebimento pela ficha.',
      },
      reapertura: (trabajo) => `${trabajo} não está pago.`,
      reactivacion: (trabajo) => `${trabajo} não está encerrado como perdido.`,
      verLaFicha: 'Abra a ficha de novo para ver como ficou.',
      formulario: {
        titulo: 'Essa mudança de status não pode ser feita pelo formulário.',
        queHacer:
          'Receber e dar como perdido são botões próprios da ficha, porque dividem dinheiro. Volte à ficha e use o botão.',
      },
    },
    MN008: {
      titulo: 'Este app ficou desatualizado e não faz a mesma conta que o servidor.',
      alCobrar:
        'Nada foi salvo: o projeto ficou como estava. Pode ser o corte do lucro ou o que o mês já tem coberto. Feche o app, abra de novo para ele se atualizar e faça de novo.',
      queHacer: 'Feche o app e abra de novo para ele se atualizar, e tente outra vez.',
    },
    MN009: {
      titulo: 'O orçamento deste projeto sai da opção que você marcar.',
      queHacer:
        'Marque a que foi aprovada e, se quiser escrever o orçamento à mão, tire as opções antes. Só é possível marcar uma.',
    },
    MN012: {
      encuesta: 'Esse cliente já respondeu.',
      preguntas: {
        titulo: 'Esse cliente já respondeu: as perguntas dele ficam como estão.',
        queHacer: 'Para perguntar mais alguma coisa, escreva para ele.',
      },
    },
    MN013: {
      titulo: 'Essa pergunta já saiu numa pesquisa de satisfação: a forma de responder não muda.',
      queHacer:
        'Salve como pergunta nova: o que já foi respondido fica separado, com o texto dela.',
    },
    MN014: {
      titulo: 'A pergunta mudou em outro lugar.',
      queHacer:
        'Já existe uma versão mais nova desta pergunta. Abra Perguntas de novo e altere por lá.',
    },
    MN015: {
      sinEntregar: {
        titulo: 'A opinião é pedida ao cliente quando o projeto está entregue.',
        queHacer: 'Marque o projeto como entregue e peça a opinião por lá.',
      },
      sinPreguntas: {
        titulo: 'A pesquisa de satisfação não tem perguntas.',
        queHacer: 'Volte a incluir pelo menos uma em Opiniões › Perguntas.',
      },
    },
    MN016: {
      delCobro: 'Falta o dia do recebimento.',
      deUnPago: 'Falta o dia de um pagamento.',
      queHacer:
        'Nada foi salvo. Informe o dia em que o dinheiro entrou e salve de novo: a data não pode ser inventada.',
    },
    MN017: {
      titulo: 'Essa data ainda não chegou.',
      queHacer:
        'Nada foi salvo. Informe o dia em que o dinheiro entrou, que precisa ser hoje ou antes, e salve de novo.',
    },
    MN018: {
      titulo: 'Esse dinheiro não é de antes de você começar a usar o app.',
      queHacer:
        'Só o que entrou antes dos saldos iniciais pode estar neles. Desmarque essa opção ou confira a data e salve de novo.',
    },
    MN019: {
      titulo: 'O retorno deste projeto ficou pela metade.',
      queHacer:
        'Nada foi salvo. Isso acontece se você mudou em outro lugar ao mesmo tempo. Abra de novo: se estiver em Retornos, registre o contato por lá; se não, coloque em Retornos com a data.',
    },
    MN021: {
      sinListo: {
        titulo: 'A entrega é combinada com o móvel pronto.',
        queHacer: 'Marque na ficha que já está pronto e proponha o dia. Nada foi salvo.',
      },
      comprometida: {
        titulo: 'A entrega já está confirmada.',
        queHacer: 'Para mudar, altere a data confirmada na ficha. Nada foi salvo.',
      },
      fecha: {
        titulo: 'O dia que você propõe precisa ser a partir de amanhã.',
        queHacer: 'Escolha um dia a partir de amanhã. Nada foi salvo.',
      },
      noSeGuardoNada: (salida) => `${salida} Nada foi salvo.`,
    },
    MN022: {
      titulo: 'Sua vitrine já tem 12 fotos.',
      queHacer:
        'A foto não foi adicionada. Isso acontece se você adicionou fotos em outro aparelho ao mesmo tempo. Tire uma da sua vitrine em Configurações e adicione de novo.',
    },
    MN023: {
      titulo: 'Não foi possível salvar a fila.',
      queHacer: 'Confira e tente de novo.',
    },
    MN024: {
      titulo: (tesoro) => `Não foi possível arquivar ${tesoro}.`,
      sinTesoro: 'Não foi possível arquivar a caixinha.',
      queHacer:
        'Tire da fila, registre o recebimento do projeto reaberto que a usa e passe o dinheiro dela para outra caixinha. Depois arquive.',
    },
    MN025: {
      titulo: 'Este recebimento é de antes da atualização do app.',
      queHacer:
        'Abra o recebimento de novo: a divisão é calculada com a sua fila e você confere antes de confirmar.',
    },
    MN026: {
      titulo: 'Este orçamento foi alterado em outro aparelho.',
      queHacer: 'Abra de novo para ver a última versão e continue a partir dela.',
    },
    MN027: {
      titulo: 'Falta alguma coisa no orçamento para enviá-lo.',
      queHacer: 'Confira se ele tem título, pelo menos um móvel com o detalhe e um total.',
    },
    MN028: {
      titulo: 'O cliente já aprovou: o orçamento não muda.',
      queHacer: 'Uma mudança depois do sinal se acerta à parte com o cliente.',
    },
    MN029: {
      titulo: 'Os valores mudaram desde que você o montou.',
      queHacer: 'Confira os valores e envie de novo.',
    },
    MN030: {
      titulo: 'Os textos do orçamento foram alterados em outro aparelho.',
      queHacer: 'Abra a tela de novo e salve outra vez.',
    },
    MN031: {
      plantilla: 'Não foi possível salvar os textos do seu orçamento.',
      presupuesto: 'Não foi possível salvar o orçamento.',
      queHacer:
        'Confira e tente de novo. Se acontecer de novo, feche o app e abra outra vez para ele se atualizar.',
    },
    MN032: {
      titulo: 'Este projeto está perdido: o orçamento dele não pode ser alterado nem enviado.',
      queHacer: 'Se o cliente voltou, reative pela ficha e continue a partir dela.',
    },
    MN033: {
      titulo: 'O dia do envio ainda não chegou.',
      queHacer: 'Confira a data e a hora do seu aparelho e envie de novo.',
    },
    MN034: {
      titulo: 'Essa caixinha continua na moeda dela.',
      queHacer:
        'A moeda de uma caixinha não muda. Se precisar dela na outra moeda, crie uma nova e passe o dinheiro com uma compra ou uma venda de dólares.',
    },
    MN035: {
      titulo: 'Entre pesos e dólares é uma compra ou uma venda.',
      queHacer:
        'Uma transferência entre caixinhas fica na mesma moeda. Para passar de pesos para dólares, registre como compra ou venda de dólares.',
    },
    MN036: {
      titulo: 'A moeda não pode mais ser alterada.',
      queHacer: 'Um projeto escolhe a moeda enquanto ainda é uma consulta.',
    },
    MN037: {
      titulo: 'Essa caixinha não recebe este pagamento.',
      queHacer: 'Escolha uma caixinha em dólares que não esteja arquivada.',
    },
    MN038: {
      titulo: 'Isto foi montado com o app desatualizado.',
      queHacer: 'Registre de novo.',
    },
    MN039: {
      titulo: 'Falta o dólar de um pagamento.',
      queHacer:
        'Um pagamento em pesos de um projeto em dólares precisa da cotação usada. Abra o projeto e complete.',
    },
    MN040: {
      titulo: 'A emissão de notas fiscais com a ARCA não está conectada.',
      queHacer: 'Nada foi solicitado. Conecte em Configurações › Faturamento e solicite de novo.',
    },
    MN041: {
      titulo: 'Falta algo para emitir a nota fiscal.',
      queHacer:
        'A nota fiscal não foi solicitada. Complete o que falta e solicite de novo pelo pagamento.',
    },
    MN042: {
      factura: {
        titulo: 'Esse pagamento já tem a nota fiscal dele.',
        queHacer: 'Não precisa solicitar de novo: o status está no pagamento.',
      },
      nota: {
        titulo: 'Essa nota fiscal já está anulada ou ainda não foi autorizada.',
        queHacer: 'Veja como ficou no pagamento: só se anula uma nota fiscal autorizada.',
      },
    },
    MN043: {
      pago: {
        titulo: 'Tem uma nota fiscal da ARCA: para alterar, anule primeiro.',
        queHacer: 'Anule a nota fiscal com uma nota de crédito e depois altere o pagamento.',
      },
      trabajo: {
        titulo: 'Este projeto tem notas fiscais da ARCA e não pode ser excluído.',
        queHacer: 'Se ele não vai seguir, marque como perdido.',
      },
    },
  },
} satisfies Mensajes['api'];
