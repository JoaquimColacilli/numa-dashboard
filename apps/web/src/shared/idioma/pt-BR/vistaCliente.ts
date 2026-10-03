import type { Mensajes } from '../es';

export const vistaCliente = {
  acaNoSeGuardaNada: 'Nada é salvo aqui: é assim que o cliente vê.',
  loQueVeConElDiaAceptado: (boton, titular) =>
    `Quando o cliente toca em ${boton}, a entrega fica confirmada e ele lê no topo: “${titular}”`,
  volverAEmpezar: 'Começar de novo',
  ayuda: {
    comoLoVeTuCliente: 'Como o cliente vê',
    lamina: (numero, total) => `${String(numero)} de ${String(total)}`,
    atras: 'Voltar',
    siguiente: 'Próxima',
    listo: 'Concluir',
    laminas: {
      enlace: {
        titulo: 'O link e a página',
        entrada: 'Cada projeto tem seu link. O cliente abre no celular, sem conta nem senha.',
        noVence: {
          titulo: 'Não vence',
          texto:
            'Você envia uma vez e ele serve para sempre. Só para de funcionar se você desativar o link ou der o projeto como perdido.',
        },
        seActualiza: {
          titulo: 'Atualiza sozinha',
          texto:
            'Sempre que abre, o cliente vê o que você registrou por último. Não precisa avisar nada.',
        },
        loMismo: {
          titulo: 'É o que você vê',
          texto:
            'O botão Ver como o cliente vê e o link mostram a mesma página, gerada do mesmo lugar.',
        },
        silencio: {
          titulo: 'Datas, não contagens',
          texto:
            'Mostra o dia de cada etapa e o que vem a seguir. Nunca quanto tempo faz que nada acontece: isso faz o cliente contar contra você, e uma obra passa semanas sem nada visível.',
        },
        vidriera: {
          titulo: 'Sua vitrine',
          texto:
            'No fim da página, as fotos e as redes sociais que você escolhe em Configurações, em Sua vitrine. Todo cliente as vê na página do projeto dele, em todas as etapas, e pode compartilhar suas redes sociais de lá.',
        },
      },
      antes: {
        titulo: 'Antes do orçamento',
        estimativo: {
          titulo: 'Enviamos uma estimativa',
          texto:
            'Só se você enviou uma estimativa: ela aparece marcada, como uma etapa antes do orçamento, com o dia em que você tocou em Marcar estimativa como enviada, e o orçamento fica em andamento. O cliente nunca vê o valor.',
        },
        relevamiento: {
          titulo: 'O valor ainda pode mudar',
          texto:
            'Com a estimativa enviada e a visita técnica pendente, aparece um (i) que explica isso, com o dia da visita se já estiver agendada: ao lado do dia da estimativa enquanto o projeto está em Estimativa enviada, e no orçamento em andamento quando você passa o projeto para Visita técnica ou A orçar. Quando você toca em Marcar visita técnica como feita, ele conta que o valor vem das medidas. Ao aprovar, ele some.',
        },
        relevamientoTecnico: {
          titulo: 'Visita técnica',
          texto:
            'Enquanto falta a visita técnica, abaixo das etapas o cliente lê o que é a visita e quanto custa, com o valor que você registra em Configurações, em Sua marcenaria. Se deixar vazio, ele lê o que é, mas não o preço. Quando você toca em Marcar visita técnica como feita ou envia o orçamento, isso some.',
        },
        sinMedir: {
          titulo: 'Se não precisar medir',
          texto:
            'Passe para A orçar sem registrar a visita: não aparecem nem o (i) nem a visita técnica.',
        },
        sinNada: {
          titulo: 'Nada enviado ainda',
          texto:
            'O link funciona mesmo assim: o cliente vê o projeto e todas as etapas, com a primeira em andamento.',
        },
      },
      presupuesto: {
        titulo: 'O orçamento e a aprovação',
        paso1: {
          titulo: 'Orçamento enviado',
          texto:
            'É a primeira etapa de todo projeto que não teve estimativa. Enquanto você prepara, o cliente vê em andamento, e no dia em que você passa o contato para Orçamento enviado, ela fica marcada com essa data.',
        },
        esperando: {
          titulo: 'Enquanto espera o sinal',
          texto:
            'O cliente não vê o endereço nem as datas que você registrou: elas aparecem quando ele aprova. Vê para quando poderia ficar pronto se pagar o sinal antes do dia até o qual o orçamento vale, ou se aprovar antes desse dia quando o que já pagou cobre o sinal.',
        },
        paso2: {
          titulo: 'Aprovado, sinal recebido',
          texto:
            'Fica em andamento desde que você envia o orçamento: “Quando você aprovar e pagar o sinal”, ou “Quando você aprovar” se o que o cliente pagou já cobre o sinal. Fica marcada quando você passa o projeto para Projetos; se faltar o sinal, continua em andamento com “Quando você pagar o sinal” até o cliente pagar ou até você começar. O sinal que você registrar ali aparece em “O que você pagou”.',
        },
        pie: 'Se a data de início que você registrou ao aprovar for hoje ou antes, nesse mesmo dia a etapa 2 fica marcada e a 3 fica em andamento, com essa data de início.',
      },
      elPresupuesto: {
        titulo: 'O orçamento que você envia',
        entrada:
          'Quando você envia pelo app, ele aparece na página do cliente, abaixo de “Seu móvel”, e pode ser baixado em PDF.',
        rotulo: {
          titulo: 'Com o número',
          texto:
            'O cliente vê o número, a revisão, o dia em que você enviou e até quando vale, e abaixo tudo o que você montou: o detalhamento, o que está incluso, os valores e seus textos.',
        },
        revision: {
          titulo: 'As revisões',
          texto:
            'Se você enviar uma revisão, o cliente vê a última, com o que você contou que mudou. Não vê as anteriores.',
        },
        opciones: {
          titulo: 'Com opções',
          texto:
            'O cliente vê cada opção com o total e o sinal, e a página pede que escolha. Quando você aprova uma, as outras somem da página.',
        },
        vencido: {
          titulo: 'Se vencer',
          texto:
            'Aparece “Venceu em …” e a página deixa de pedir o sinal: pede que o cliente fale com você para atualizar. Acontece também com um orçamento que você enviou por fora do app.',
        },
        aceptado: {
          titulo: 'Quando o cliente aprova',
          texto:
            'O cartão diminui e desce, depois de “O que você pagou”: o orçamento aceito, com a opção e o dia, e o detalhamento recolhido.',
        },
      },
      taller: {
        titulo: 'A marcenaria e a entrega',
        paso3: {
          titulo: 'Em fabricação',
          texto:
            'Fica em andamento desde que a etapa 2 fica marcada: “Vamos começar a fabricar”, e no topo o cliente lê que o projeto está na fila da marcenaria. Na data de início que você registrou, passa para “Estamos fabricando”, com esse dia, e fica marcada quando você entrega.',
        },
        paso4: {
          titulo: 'Entregue',
          texto: 'Fica marcada quando você toca em Marcar como entregue, com a data desse dia.',
        },
        estimada: {
          titulo: 'A data prevista',
          texto:
            'Enquanto você fabrica, o cliente lê a entrega prevista que você registrou como “Previsão de entrega”. Se você mudar a data, na próxima vez que abrir ele vê a nova. Uma data que já passou ele não vê: a página do projeto avisa para você mudar.',
        },
        pie: 'Sem data de início registrada, a etapa 3 nunca diz “Estamos fabricando”: fica em “Vamos começar a fabricar” até você entregar, e aí fica marcada sem data.',
      },
      listo: {
        titulo: 'Quando está pronto',
        entrada:
          'Você toca em Marcar como pronto na página do projeto, e a entrega é combinada pela página do cliente.',
        listo: {
          titulo: 'Seu móvel está pronto',
          texto:
            'É o que o cliente lê no topo, e a etapa 4 diz “Pronto para entrega”. Se você não pedir nada, ele lê que o próximo passo é combinar o dia.',
        },
        unDia: {
          titulo: 'Um dia que você propõe',
          texto:
            'O cliente vê com dois botões: Fica bom para mim e Não posso nesse dia. Se aceitar, a entrega fica confirmada sozinha.',
        },
        susDias: {
          titulo: 'Os dias do cliente',
          texto:
            'Se você pedir os dias do cliente, ou se ele não puder no dia que você propôs, ele marca num calendário os dias que ficam bons, de manhã, à tarde ou nos dois horários, e pode deixar uma nota. Escolhe de depois de amanhã até 30 dias, sem domingos. Você confirma um.',
        },
        comprometida: {
          titulo: 'A entrega confirmada',
          texto:
            'Com o dia confirmado, o cliente lê “Boa notícia! Vamos entregar em…”. Você também pode definir a entrega enquanto fabrica. Se precisar mudar, você muda pela página do projeto: o cliente não pode.',
        },
        pie: 'As respostas do cliente chegam ao app aberto e ao Início, sem notificação no celular.',
      },
      saldo: {
        titulo: 'Quando fica quitado',
        paso5: {
          titulo: 'Pago',
          texto:
            'Desde a entrega, fica em andamento enquanto o cliente deve: “Quando estiver quitado”. Fica marcada quando não sobra saldo, ou quando você fecha o projeto com Receber e dividir.',
        },
        foco: {
          titulo: 'Se o cliente deve, o saldo vem primeiro',
          texto:
            'Entregue e com dinheiro pendente, a página põe o saldo no topo, maior que o status.',
        },
        primeroLaEntrega: {
          titulo: 'Primeiro sai da marcenaria',
          texto:
            'Mesmo que o cliente pague tudo antes, a etapa 5 não fica marcada até o móvel ser entregue: desde que você passa para Projetos, diz “Já está pago”.',
        },
        transferir: {
          titulo: 'Como o cliente transfere',
          texto:
            'Se você registrou seus dados em Configurações, o cliente vê ao lado do saldo, com um botão para copiar cada um. Deixa de ver quando está tudo pago.',
        },
      },
      atras: {
        titulo: 'Voltar atrás',
        entrada: 'Pode, e nada do que o cliente já viu se perde.',
        retrocede: {
          titulo: 'As etapas voltam',
          texto:
            'Se você voltar o projeto, por exemplo com Voltar para orçamento, o cliente passa a ver a etapa em que está hoje.',
        },
        sinRastro: {
          titulo: 'O cliente não fica sabendo',
          texto:
            'Não aparece nenhum aviso nem fica uma linha em “O que já aconteceu”: ele vê menos etapas marcadas e nada mais.',
        },
        fechas: {
          titulo: 'As datas ficam',
          texto:
            'O que já foi registrado continua salvo. Se você avançar de novo, aparecem as mesmas datas de antes.',
        },
      },
      nunca: {
        titulo: 'O que o cliente nunca vê',
        tuPlata: {
          titulo: 'Seu dinheiro',
          texto:
            'Nem os custos, nem o que fica para você, nem o dízimo, nem a divisão, nem suas notas da obra. As opções ele vê enquanto decide; quando você aprova uma, as que não foram escolhidas somem.',
        },
        fotos: {
          titulo: 'As fotos que você não marcou',
          texto:
            'Começam desativadas, inclusive as que você já tinha enviado. O cliente só vê as que você ativa uma a uma em Compartilhar, e as que você adiciona à sua vitrine.',
        },
        otros: {
          titulo: 'Outro projeto',
          texto:
            'O link abre esse móvel e nada mais: nem outro projeto do cliente, nem outro cliente seu. Das fotos da sua vitrine, ele vê a foto, sem nada do projeto de onde ela veio.',
        },
      },
    },
  },
} satisfies Mensajes['vistaCliente'];
