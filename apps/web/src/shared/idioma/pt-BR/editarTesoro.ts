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
    ayudaDeLaMeta: 'Opcional. Se você definir, o Início mostra quanto falta.',
    rinde: 'Rendimento por ano (%)',
    ayudaDelRinde: 'Serve só para projetar. Se você não souber, deixe em 0.',
  },
  iconos: {
    receipt: 'Recibo',
    package: 'Pacote',
    'building-2': 'Prédio',
    wrench: 'Chave inglesa',
    vault: 'Cofre',
    landmark: 'Banco',
    coins: 'Moedas',
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
    rinde: 'Digite o rendimento como porcentagem, por exemplo 40. Pode deixar em 0.',
    monto: 'Informe até quanto recebe.',
    montoGrande: 'O valor não pode ser tão alto.',
    porcentajeDeLaObligacion: (minimo, maximo) =>
      `Informe uma porcentagem de ${minimo} a ${maximo}.`,
    porcentajeDelReparto: (minimo, libre) =>
      `Informe uma porcentagem de ${minimo} a ${libre}, o que ainda está livre.`,
  },
  bajada: {
    conRinde: 'Nome, cor, ícone, meta e rendimento',
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
