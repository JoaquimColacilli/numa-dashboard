import type { Mensajes } from '../es';

export const coordinarLaEntrega = {
  franjas: {
    manana: 'De manhã',
    tarde: 'À tarde',
  },
  sinHorario: 'Sem horário',
  dia: 'Dia',
  horario: 'Horário',
  cancelar: 'Cancelar',
  errores: {
    sinDia: 'Escolha o dia.',
    propuestaDesdeManana: 'O dia que você propõe precisa ser a partir de amanhã.',
    fechaQuePaso: 'Essa data já passou e o cliente não a veria: escolha uma a partir de hoje.',
  },
  laEntrega: 'Entrega',
  estimada: 'Prevista',
  sinFecha: 'Sem data',
  ponerleFecha: 'Definir data',
  cambiar: 'Alterar',
  comprometidaConElCliente: 'Confirmada com o cliente',
  todaviaNo: 'Ainda não',
  laAceptoTuCliente: 'O cliente aceitou',
  laAcepto: (cliente) => `${cliente} aceitou`,
  comprometerUnDia: 'Confirmar um dia',
  sacar: 'Remover',
  yaPaso: {
    estimada:
      'A previsão de entrega já passou: o cliente não a vê. Mude para um dia que ainda vai chegar.',
    comprometida:
      'A entrega confirmada já passou: o cliente não a vê. Mude a data ou marque em O que falta que você já entregou.',
  },
  mientrasLoFabricas:
    'O cliente vê a data prevista como “Previsão de entrega”. Quando o móvel estiver pronto, toque em Marcar como pronto e vocês combinam o dia.',
  proponeleUnDia: 'Proponha um dia ou peça que o cliente marque os dias e horários que lhe servem.',
  lePropusisteEl: (fecha) => `Você propôs ${fecha}. Ainda sem resposta.`,
  lePedisteSusDias: 'Você pediu os dias ao cliente. Ainda sem resposta.',
  proponerleOtroDia: 'Propor outro dia',
  proponerleUnDia: 'Propor um dia',
  pedirleOtrosDias: 'Pedir outros dias',
  pedirleSusDias: 'Pedir os dias ao cliente',
  sinSenal: 'Para pedir o dia você precisa de internet: o cliente só vê quando chegar.',
  verComoLoVeTuCliente: 'Ver como o cliente vê',
  verComoLoVe: (cliente) => `Ver como ${cliente} vê`,
  respuesta: {
    tuClienteTeDejoUnaNota: 'O cliente deixou uma nota',
    teDejoUnaNota: (cliente) => `${cliente} deixou uma nota`,
    tuClienteTePasoSusDias: 'O cliente mandou os dias que pode. Confirme um:',
    tePasoSusDias: (cliente) => `${cliente} mandou os dias que pode. Confirme um:`,
    yaPaso: 'já passou',
    confirmarEl: (fecha) => `Confirmar ${fecha}`,
  },
  hojas: {
    estimada: {
      titulo: 'Previsão de entrega',
      ayuda: 'O cliente vê como “Previsão de entrega” enquanto você fabrica.',
      boton: 'Salvar',
    },
    comprometida: {
      titulo: 'Entrega confirmada',
      ayuda:
        'É o dia que você combinou com o cliente. Aparece como uma boa notícia no link do cliente.',
      boton: 'Confirmar',
    },
    propuesta: {
      titulo: 'Propor um dia',
      ayuda:
        'O cliente vê no link com o botão Fica bom para mim. Se aceitar, a entrega fica confirmada sozinha.',
      boton: 'Propor',
      tuCliente: (trabajo) => `Seu cliente · ${trabajo}`,
    },
  },
} satisfies Mensajes['coordinarLaEntrega'];
