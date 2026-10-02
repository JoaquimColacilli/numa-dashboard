import type { Mensajes } from '../es';

export const fila = {
  laFilaRepartePesos: 'A fila só divide pesos: uma caixinha em dólares fica na estante.',
  tipos: {
    obligacion: 'Obrigação',
    compromiso: 'Conta',
    'ahorro-fijo': 'Reserva fixa',
    'ahorro-por-porcentaje': 'Reserva',
    superavit: 'Superávit',
  },
  grupos: {
    obligaciones: 'Obrigações',
    compromisos: 'Contas',
    ahorros: 'Reservas',
    superavit: 'Superávit',
  },
  descripcionDelTipo: {
    obligacion: 'obrigação',
    compromiso: 'conta',
    'ahorro-fijo': 'reserva',
    'ahorro-por-porcentaje': 'reserva',
    superavit: 'superávit',
  },
  descripcionDeLosInsumos: 'insumos',
  tituloDelModo: {
    compromiso: 'Como se completa',
    'ahorro-fijo': 'Como se separa',
  },
  modo: {
    compromiso: { mes: 'por mês', saldo: 'renova a cada pagamento', trabajo: 'por projeto' },
    'ahorro-fijo': { mes: 'por mês', saldo: 'repõe a cada uso', trabajo: 'por projeto' },
  },
  opcionDelModo: {
    compromiso: { mes: 'Por mês', saldo: 'Renova a cada pagamento', trabajo: 'Por projeto' },
    'ahorro-fijo': { mes: 'Por mês', saldo: 'Repõe a cada uso', trabajo: 'Por projeto' },
  },
  base: {
    cobrado: 'sobre o que você recebe',
    ingreso: 'sobre a receita',
  },
  etiquetaDeLaBase: {
    cobrado: 'O que você recebe',
    ingreso: 'A receita',
  },
  lugares: {
    obligacion: 'Como obrigação',
    compromiso: 'Como conta',
    'ahorro-fijo': 'Como reserva fixa',
    reparto: 'Na divisão',
    superavit: 'Para receber o que sobra',
  },
  ayudas: {
    fila: {
      que: 'Como ler a fila',
      entraArriba: 'Cada receita entra no topo e desce pela fila.',
      primeroLasObligaciones:
        'Primeiro saem as obrigações. Depois se completam as contas e as reservas fixas, na ordem dos números.',
      loQueSobra: 'O que sobra é dividido por porcentagem, e o que resta é o superávit.',
      bordeDeTrazos: 'Um cartão com borda tracejada não recebe nada na simulação.',
    },
    mapa: {
      que: 'O que a receita mostra',
      texto:
        'É o mapa de como cada recebimento é dividido. Os valores são de uma simulação ou do que entrou no mês. Quando você recebe por um projeto, o recebimento mostra como foi dividido.',
    },
    queEs: {
      que: 'O que é cada tipo de etapa',
      compromiso: {
        rotulo: 'Conta:',
        texto:
          'o que você precisa pagar, como salários, aluguel ou parcelas. O pró-labore vai sempre para Hogar.',
      },
      ahorroFijo: {
        rotulo: 'Reserva fixa:',
        texto: 'um valor que você separa do lucro, como o estoque da marcenaria.',
      },
    },
    monto: {
      que: 'O que é o valor',
      texto: (monto) =>
        `Recebe até ${monto}, conforme o jeito de completar. O que passar disso segue para baixo, para a próxima etapa.`,
    },
    lugar: {
      que: 'Como funciona a ordem',
      texto:
        'O dinheiro passa pelo 1, depois pelo 2, e assim por diante: primeiro as obrigações, depois as contas e as reservas fixas. O que chega lá embaixo é dividido.',
    },
    reparto: {
      que: 'Como o que sobra é dividido',
      texto:
        'Divide o que sobra depois das reservas fixas. O que não é dividido vai para o superávit.',
      conEjemplo: (porcentaje, sobrante, parte) =>
        `Divide o que sobra depois das reservas fixas. ${porcentaje}% de ${sobrante} são ${parte}. O que não é dividido vai para o superávit.`,
    },
    loDeHoy: {
      que: 'Com o que se simula',
      texto:
        'Cada etapa começa com o que já tem: o do mês ou o saldo dela, conforme o jeito de completar. Tudo zerado é como se todas estivessem vazias.',
    },
    prueba: {
      que: 'Como simular um recebimento',
      texto: 'Digite o que um projeto renderia e a fila mostra por onde desce cada peso.',
    },
    grupos: {
      obligaciones: {
        que: 'O que são as obrigações',
        texto:
          'Sempre separam uma parte de cada receita, como o dízimo ou o Ingresos Brutos (imposto provincial argentino sobre o faturamento). Ficam como dívida até você registrar o pagamento, e aí voltam a zero.',
      },
      compromisos: {
        que: 'O que são as contas',
        texto:
          'Juntam até o valor do que você precisa pagar: salários, aluguel, parcelas ou a luz. Ficam como dívida até você registrar o pagamento. Se você definir o dia de pagamento, elas aparecem na agenda e avisam você.',
      },
      ahorros: {
        que: 'O que são as reservas',
        texto:
          'Separam uma parte do lucro: um valor fixo por mês ou por projeto, ou uma porcentagem do que sobra. Podem juntar sem limite ou até chegar à meta.',
      },
      superavit: {
        que: 'O que é o superávit',
        texto: 'O que sobra depois de tudo. Daqui saem as despesas extras e os imprevistos.',
      },
    },
    insumos: {
      que: 'O que são os insumos',
      texto:
        'O que sobra do sinal de cada projeto em andamento: o que você recebeu menos o que já gastou nesse projeto. Fica em Maun até o projeto ser pago.',
    },
    ingreso: {
      que: 'O que é a receita',
      texto: 'O que cada projeto rende: o que você recebeu menos as despesas.',
    },
    ingresoLibre: {
      que: 'O que é a receita livre',
      texto: 'A receita menos as obrigações.',
    },
    ganancia: {
      que: 'O que é o lucro',
      texto: 'O que fica depois das obrigações e das contas.',
    },
    base: {
      que: 'Sobre o que é calculado',
      cobrado: {
        rotulo: 'Sobre o que você recebe:',
        texto:
          'tudo o que entrou do projeto, como o Ingresos Brutos (imposto provincial argentino sobre o faturamento).',
      },
      ingreso: {
        rotulo: 'Sobre a receita:',
        texto: 'o que fica depois das obrigações de cima.',
      },
      cuotaFija:
        'Se você paga o Ingresos Brutos como uma parcela fixa por mês (por exemplo, dentro do monotributo, o regime tributário simplificado da Argentina para pequenos negócios), registre como uma conta.',
    },
    modo: {
      compromiso: {
        mes: { rotulo: 'Por mês:', texto: 'recebe até o valor a cada mês.' },
        saldo: {
          rotulo: 'Renova a cada pagamento:',
          texto: 'junta até ter o valor e, quando você registra o pagamento, volta a juntar.',
        },
      },
      ahorroFijo: {
        mes: { rotulo: 'Por mês:', texto: 'até o valor a cada mês.' },
        saldo: {
          rotulo: 'Repõe a cada uso:',
          texto: 'junta até ter o valor e, quando você gasta dela, volta a juntar.',
        },
        trabajo: { rotulo: 'Por projeto:', texto: 'o valor a cada recebimento.' },
      },
    },
    meta: {
      que: 'O que é “até a meta”',
      texto:
        'Quando a caixinha chega à meta, para de receber, e a parte dela segue para baixo até o superávit.',
    },
    superavit: {
      que: 'Onde cai o que sobra',
      texto: 'Escolha qual caixinha recebe o que sobra. Se for Maun, fica no caixa da marcenaria.',
    },
  },
} satisfies Mensajes['fila'];
