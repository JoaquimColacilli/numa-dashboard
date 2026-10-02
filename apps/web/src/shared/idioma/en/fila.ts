import type { Mensajes } from '../es';

export const fila = {
  laFilaRepartePesos: 'The waterfall only splits pesos: a dollar bucket stays on the shelf.',
  tipos: {
    obligacion: 'Obligation',
    compromiso: 'Bill',
    'ahorro-fijo': 'Fixed savings',
    'ahorro-por-porcentaje': 'Savings',
    superavit: 'Surplus',
  },
  grupos: {
    obligaciones: 'Obligations',
    compromisos: 'Bills',
    ahorros: 'Savings',
    superavit: 'Surplus',
  },
  descripcionDelTipo: {
    obligacion: 'obligation',
    compromiso: 'bill',
    'ahorro-fijo': 'savings',
    'ahorro-por-porcentaje': 'savings',
    superavit: 'surplus',
  },
  descripcionDeLosInsumos: 'supplies',
  tituloDelModo: {
    compromiso: 'How it fills up',
    'ahorro-fijo': "How it's set aside",
  },
  modo: {
    compromiso: { mes: 'per month', saldo: 'refills when you pay', trabajo: 'per job' },
    'ahorro-fijo': { mes: 'per month', saldo: 'refills when you use it', trabajo: 'per job' },
  },
  opcionDelModo: {
    compromiso: { mes: 'Per month', saldo: 'Refills when you pay', trabajo: 'Per job' },
    'ahorro-fijo': { mes: 'Per month', saldo: 'Refills when you use it', trabajo: 'Per job' },
  },
  base: {
    cobrado: "of what you're paid",
    ingreso: 'of income',
  },
  etiquetaDeLaBase: {
    cobrado: "What you're paid",
    ingreso: 'Income',
  },
  lugares: {
    obligacion: 'As an obligation',
    compromiso: 'As a bill',
    'ahorro-fijo': 'As fixed savings',
    reparto: 'In the split',
    superavit: "To get what's left",
  },
  ayudas: {
    fila: {
      que: 'How to read the waterfall',
      entraArriba: 'Each income comes in at the top and flows down the waterfall.',
      primeroLasObligaciones:
        'Obligations come out first. Then bills and fixed savings fill up, in numbered order.',
      loQueSobra: "What's left is split by percentage, and whatever remains is the surplus.",
      bordeDeTrazos: 'A card with a dashed border gets nothing in the test.',
    },
    mapa: {
      que: 'What the income shows',
      texto:
        "It's the map of how each payment gets split. The amounts come from a test or from what came in this month. When a client pays you for a job, the payment shows you how it was split.",
    },
    queEs: {
      que: 'What each kind of step is',
      compromiso: {
        rotulo: 'Bill:',
        texto:
          "what you have to pay, like wages, rent or installments. Owner's pay always goes to Hogar.",
      },
      ahorroFijo: {
        rotulo: 'Fixed savings:',
        texto: "an amount you set aside from profit, like the shop's stock.",
      },
    },
    monto: {
      que: 'What the amount is',
      texto: (monto) =>
        `It gets up to ${monto}, depending on how it fills up. Anything over that keeps flowing down to the next step.`,
    },
    lugar: {
      que: 'How the order works',
      texto:
        'Money goes through 1, then 2, and so on: obligations first, then bills and fixed savings. Whatever reaches the bottom gets split.',
    },
    reparto: {
      que: "How what's left gets split",
      texto: "Splits what's left after fixed savings. Whatever isn't split goes to the surplus.",
      conEjemplo: (porcentaje, sobrante, parte) =>
        `Splits what's left after fixed savings. ${porcentaje}% of ${sobrante} is ${parte}. Whatever isn't split goes to the surplus.`,
    },
    loDeHoy: {
      que: 'What the test starts from',
      texto:
        "Each step starts with what it already has: this month's amount or its balance, depending on how it fills up. All at zero is as if they were all empty.",
    },
    prueba: {
      que: 'How to test a payment',
      texto: 'Enter what a job would net you and the waterfall shows where each peso goes.',
    },
    grupos: {
      obligaciones: {
        que: 'What obligations are',
        texto:
          "They always take a share of every income, like the tithe or Ingresos Brutos (Argentina's provincial gross receipts tax). They stay owed until you record the payment, and then they go back to zero.",
      },
      compromisos: {
        que: 'What bills are',
        texto:
          'They collect up to the amount you have to pay: wages, rent, installments or electricity. They stay owed until you record the payment. If you give them a due day, they show up on the calendar and remind you.',
      },
      ahorros: {
        que: 'What savings are',
        texto:
          "They set aside part of the profit: a fixed amount per month or per job, or a percentage of what's left. They can keep collecting with no end or until they reach their goal.",
      },
      superavit: {
        que: 'What the surplus is',
        texto: "What's left after everything. Extra expenses and surprises come out of here.",
      },
    },
    insumos: {
      que: 'What supplies are',
      texto:
        "What's left of the deposit for each job in progress: what you were paid minus what you've already spent on that job. It stays in Maun until the job is paid.",
    },
    ingreso: {
      que: 'What income is',
      texto: 'What each job nets: what you were paid minus expenses.',
    },
    ingresoLibre: {
      que: 'What free income is',
      texto: 'Income minus obligations.',
    },
    ganancia: {
      que: 'What profit is',
      texto: "What's left after obligations and bills.",
    },
    base: {
      que: "What it's calculated on",
      cobrado: {
        rotulo: "Of what you're paid:",
        texto:
          "everything that came in from the job, like Ingresos Brutos (Argentina's provincial gross receipts tax).",
      },
      ingreso: {
        rotulo: 'Of income:',
        texto: "what's left after the obligations above.",
      },
      cuotaFija:
        "If you pay Ingresos Brutos as a fixed monthly amount (for example, inside the monotributo, Argentina's simplified tax regime for small businesses), add it as a bill.",
    },
    modo: {
      compromiso: {
        mes: { rotulo: 'Per month:', texto: 'gets up to the amount each month.' },
        saldo: {
          rotulo: 'Refills when you pay:',
          texto:
            'collects until it has the amount, and when you record the payment it starts collecting again.',
        },
      },
      ahorroFijo: {
        mes: { rotulo: 'Per month:', texto: 'up to the amount each month.' },
        saldo: {
          rotulo: 'Refills when you use it:',
          texto:
            'collects until it has the amount, and when you spend from it, it starts collecting again.',
        },
        trabajo: { rotulo: 'Per job:', texto: 'the amount from each payment.' },
      },
    },
    meta: {
      que: 'What “up to the goal” means',
      texto:
        'When the bucket reaches its goal it stops receiving, and its share keeps flowing down to the surplus.',
    },
    superavit: {
      que: "Where what's left lands",
      texto: "Choose which bucket gets what's left. If it's Maun, it stays in the shop's cash.",
    },
  },
} satisfies Mensajes['fila'];
