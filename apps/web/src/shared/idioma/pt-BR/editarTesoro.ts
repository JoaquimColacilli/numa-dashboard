import type { Mensajes } from '../es';

import { plural } from './plural';

export const editarTesoro = {
  moneda: {
    pregunta: 'Em qual moeda?',
    pesos: 'Pesos',
    dolares: 'Dólares',
    nota: 'Depois não dá para mudar a moeda. Uma caixinha em dólares vai para a estante: a fila só divide pesos.',
    enPesos: 'Em pesos',
    enDolares: 'Em dólares',
  },
  ajustar: {
    boton: 'Ajustar o saldo',
    titulo: (nombre) => `Ajustar o saldo de ${nombre}`,
    bajada: 'Para ficar com o que tem de verdade.',
    tieneAhora: 'Tem agora',
    seSuman: (monto) => `Somam-se ${monto}`,
    seRestan: (monto) => `Subtraem-se ${monto}`,
    quedaIgual: 'Fica igual',
    porQue: 'Por quê (opcional)',
    oEscribilo: 'Ou escreva',
    fecha: 'Data',
    fechaQueNoPaso: 'Escolha hoje ou um dia que já passou.',
    ajustar: 'Ajustar',
    volver: 'Voltar',
  },
  archivar: {
    conDolaresSinDestino:
      'Para arquivar, venda os dólares ou passe para outra caixinha em dólares.',
    debeDolaresSinOrigen:
      'Para arquivar, compre os dólares que faltam ou traga de outra caixinha em dólares.',
    queHacer:
      'Tire da fila, registre o recebimento do projeto reaberto que usa essa caixinha e passe o dinheiro dela para outra caixinha. Depois arquive.',
    deSiempre: (nombre) => `${nombre} é uma das caixinhas de sempre: não dá para arquivar.`,
    enLaFila: (nombre) => `${nombre} está na fila: cada recebimento passa dinheiro para ela.`,
    enUnCobroReabierto: (nombre, trabajo) =>
      `${nombre} está na divisão de “${trabajo}”, que você reabriu: quando esse projeto for recebido de novo, ela recebe dinheiro.`,
    loQueTenia: (nombre) => `Saldo de ${nombre} ao arquivar`,
    loQueLeFaltaba: (nombre) => `O que faltava em ${nombre} para arquivar`,
    titulo: (nombre) => `Arquivar ${nombre}`,
    tiene: (saldo) => `Saldo: ${saldo}`,
    todaviaNo: (nombre) => `Ainda não dá para arquivar ${nombre}.`,
    sinPlata: (nombre) =>
      `${nombre} para de receber dinheiro e continua aparecendo com o nome nas divisões que você já fez.`,
    conPlata: (nombre) =>
      `Antes de arquivar, para onde vai o dinheiro? ${nombre} para de receber dinheiro e continua aparecendo com o nome nas divisões que você já fez.`,
    debe: (monto, nombre) =>
      `Antes de arquivar, o saldo precisa ficar zerado: faltam ${monto}. De qual caixinha sai? ${nombre} para de receber dinheiro e continua aparecendo com o nome nas divisões que você já fez.`,
    aDondePasa: 'Para onde vai o dinheiro',
    deDondeSale: 'De onde sai o dinheiro',
    quedaEn: (saldo) => `fica com ${saldo}`,
    tieneEnLaLista: (saldo) => `tem ${saldo}`,
    entendido: 'Entendi',
    noArchivar: 'Não arquivar',
    archivar: (nombre) => `Arquivar ${nombre}`,
    pasarA: (monto, destino) => `Passar ${monto} para ${destino} e arquivar`,
    pasarDesde: (monto, origen) => `Trazer ${monto} de ${origen} e arquivar`,
  },
  campos: {
    sinNombre: 'Sem nome',
    asiSeVe: 'Como fica',
    nombre: 'Nome',
    paraQueEs: 'Para que serve',
    opcional: 'Opcional',
    color: 'Cor',
    tambienLaUsa: (nombre) => `${nombre} também usa: dá para diferenciar pelo nome e pelo ícone.`,
    icono: 'Ícone',
    meta: 'Meta',
    ayudaDeLaMeta: 'Opcional. Se você definir, junta até chegar e o Início mostra quanto falta.',
    objetivo: 'Objetivo',
    ayudaDelObjetivo: 'Junta até chegar. Depois, a parte dela segue para baixo.',
    paraCuando: 'Para quando',
    ayudaDeLaFecha: 'Opcional: uma data estimada para chegar.',
  },
  iconos: {
    receipt: 'Recibo',
    package: 'Pacote',
    'building-2': 'Prédio',
    wrench: 'Chave inglesa',
    vault: 'Cofre',
    landmark: 'Banco',
    coins: 'Moedas',
    banknote: 'Cédulas',
    'trending-up': 'Seta para cima',
    'piggy-bank': 'Porquinho',
    car: 'Carro',
    truck: 'Caminhão',
    plane: 'Avião',
    'graduation-cap': 'Capelo',
    gift: 'Presente',
    shield: 'Escudo',
    sprout: 'Broto',
    house: 'Casa',
    hammer: 'Martelo',
    church: 'Igreja',
  },
  errores: {
    nombre: (maximo) =>
      plural(maximo, {
        one: 'Dê um nome, de até # caractere.',
        other: 'Dê um nome, de até # caracteres.',
      }),
    descripcion: (maximo) =>
      plural(maximo, { one: 'Até # caractere.', other: 'Até # caracteres.' }),
    meta: 'Informe o objetivo: até quanto junta.',
    fechaSinMeta: 'Para colocar uma data, informe primeiro o objetivo.',
    fechaDeLaMeta: 'A data vai de hoje em diante.',
    diaDePago: 'O dia de pagamento vai de 1 a 31.',
    monto: 'Informe até quanto recebe.',
    montoGrande: 'O valor não pode ser tão alto.',
    porcentajeDeLaObligacion: (minimo, maximo) =>
      `Informe uma porcentagem de ${minimo} a ${maximo}.`,
    porcentajeDelReparto: (minimo, libre) =>
      `Informe uma porcentagem de ${minimo} a ${libre}, o que ainda está livre.`,
  },
  bajada: {
    conMeta: 'Nome, cor, ícone e meta',
    deSiempre: 'Nome, cor e ícone',
  },
  lugar: {
    alEstante: 'Para a estante',
    estante: 'Não entra na divisão dos recebimentos: você coloca na fila depois',
    obligacion: 'Uma porcentagem de cada recebimento, como o Ingresos Brutos (imposto provincial)',
    obligacionesLlenas: (tope) =>
      plural(tope, { one: 'Cabe só # obrigação.', other: 'Cabem até # obrigações.' }),
    compromiso: 'Junta o que você precisa pagar, como o aluguel',
    ahorroFijo: 'Um valor fixo que você separa do lucro',
    pasosLlenos: (tope) =>
      plural(tope, {
        one: 'Cabe só # conta ou reserva fixa.',
        other: 'Cabem até # contas e reservas fixas.',
      }),
    repartoLleno: (tope) =>
      plural(tope, {
        one: 'A divisão aceita só # caixinha.',
        other: 'A divisão aceita até # caixinhas.',
      }),
    repartoEnCien: 'A divisão já soma 100%.',
    reparto: 'Uma porcentagem do que sobra',
    superavit: (nombre) => `Recebe o que sobra, que hoje vai para ${nombre}`,
    alFinal: 'No fim do seu tipo',
    alPrincipio: 'No início do seu tipo',
    despuesDe: (nombre) => `Após ${nombre}`,
    elAnterior: 'o anterior',
    libre: (libre) => `Ainda há ${libre}% livres na divisão.`,
    libreHastaCien: (libre, porcentaje) =>
      `Ainda há ${libre}% livres na divisão: com ${porcentaje}%, a divisão chega a 100%.`,
    libreConResto: (libre, porcentaje, nombre, resto) =>
      `Ainda há ${libre}% livres na divisão: com ${porcentaje}%, ${nombre} fica com os outros ${resto}%.`,
  },
  sugerencias: {
    stockDelTaller: 'Estoque da marcenaria',
    maquinaria: 'Máquinas',
    vehiculo: 'Veículo',
    inmueble: 'Imóvel',
    ingresosBrutos: 'Ingresos Brutos',
    gastosFijos: 'Custos fixos',
    sueldos: 'Salários',
    alquiler: 'Aluguel',
    cuotas: 'Parcelas',
    superavit: 'Superávit',
  },
  nuevo: {
    titulo: 'Nova caixinha',
    bajada: 'Mais um lugar para o dinheiro',
    queEs: 'O que é?',
    otroTipo: 'Mudar',
    tipos: {
      caja: {
        titulo: 'Caixa',
        que: 'O que é um caixa',
        ejemplo: 'Estoque da marcenaria, um caixa pequeno',
        ayuda:
          'Junta sem limite. Não vence nem volta a zero sozinha. Maun é o caixa geral da marcenaria.',
      },
      'deuda-destinada': {
        titulo: 'Obrigação',
        que: 'O que é uma obrigação',
        ejemplo: 'Imposto sobre receita bruta',
        ayuda:
          'Leva uma parte de cada recebimento, em porcentagem ou um valor fixo. Fica para entregar até você registrar o pagamento.',
      },
      'deuda-obligatoria': {
        titulo: 'Conta',
        que: 'O que é uma conta',
        ejemplo: 'O aluguel, os salários',
        ayuda:
          'Junta até o limite entre um vencimento e o seguinte. No dia de pagamento é paga e começa do zero. Se não chegou ao limite, Maun põe o que falta.',
      },
      meta: {
        titulo: 'Meta',
        ejemplo: 'Uma máquina, o galpão',
        que: 'O que é uma meta',
        ayuda:
          'Junta até chegar ao objetivo. Quando chega, deixa de receber e a parte dela segue para baixo.',
      },
    },
    enDolares: 'Uma caixinha em dólares é um caixa ou uma meta: a fila divide pesos.',
    comoRecibe: 'Como recebe dinheiro?',
    seLleva: 'Leva',
    unPorcentaje: 'Uma porcentagem',
    unMontoFijo: 'Um valor fixo',
    montoFijo: 'Valor de cada recebimento',
    ayudaDelMontoFijo: 'Nunca mais do que entra.',
    tope: 'Limite',
    ayudaDelTope: 'O que junta entre um dia de pagamento e o seguinte.',
    diaDePago: 'Dia de pagamento',
    ayudaDelDiaDePago: 'De 1 a 31. Se o mês não tiver esse dia, o último.',
    seLaPaga: 'Se paga sozinha',
    sobreQueSeCalcula: 'Sobre o que é calculado',
    nombresSugeridos: 'Nomes sugeridos',
    dondeVa: 'Onde fica',
    porcentaje: 'Porcentagem (%)',
    antesDelDiezmo: 'Antes do dízimo',
    monto: 'Valor',
    ayudaDelCompromiso:
      'Junta até esse valor e renova a cada pagamento: quando você registra o pagamento, volta a juntar.',
    ayudaDelAhorroFijo: 'Recebe até esse valor por mês. O que passar disso segue para baixo.',
    porcentajeDeLoQueSobra: 'Porcentagem do que sobra (%)',
    crear: 'Criar a caixinha',
  },
  editar: {
    archivar: 'Arquivar',
    guardar: 'Salvar',
  },
} satisfies Mensajes['editarTesoro'];
