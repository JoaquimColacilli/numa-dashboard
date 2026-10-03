import type { ModoDePaso, TipoDelPaso } from '@maun/domain';

import type { Mensajes } from '../es';

import { fila } from './fila';
import { plural } from './plural';

const TIPO_EN_LA_FRASE: Readonly<Record<TipoDelPaso, string>> = {
  compromiso: 'conta',
  'ahorro-fijo': 'reserva fixa',
};

const PASA_A_SER: Readonly<Record<TipoDelPaso, string>> = {
  compromiso: 'uma conta',
  'ahorro-fijo': 'uma reserva fixa',
};

const VERBO_DEL_MODO: Readonly<Record<TipoDelPaso, string>> = {
  compromiso: 'se completa',
  'ahorro-fijo': 'se separa',
};

function montoConSuModo(monto: string, tipo: TipoDelPaso, modo: ModoDePaso): string {
  return modo === 'saldo'
    ? `${monto}, ${fila.modo[tipo][modo]}`
    : `${monto} ${fila.modo[tipo][modo]}`;
}

export const armarLaFila = {
  problemas: {
    'forma-invalida': 'Não foi possível ler a fila.',
    'demasiadas-obligaciones': 'Cabem até 6 obrigações.',
    'demasiados-pasos': 'Cabem até 12 etapas.',
    'demasiadas-partes': 'A divisão aceita até 8 caixinhas.',
    'tesoro-desconocido': 'Uma das caixinhas não existe mais.',
    'tesoro-en-otra-moneda': 'A fila só divide pesos: uma caixinha em dólares fica na estante.',
    'obligacion-en-hogar-o-maun': 'Hogar e Maun não podem ser obrigação.',
    'obligacion-invalida':
      'Cada obrigação precisa de uma porcentagem de 0,01% a 100% e da base de cálculo.',
    'sin-diezmo': 'Falta o dízimo entre as obrigações.',
    'diezmo-en-la-fila': 'O dízimo fica entre as obrigações.',
    'hogar-no-es-sueldo': 'Hogar só recebe o pró-labore.',
    'sueldo-no-es-hogar': 'O pró-labore vai sempre para Hogar.',
    'maun-no-es-fijos': 'Maun só pode ser uma etapa de custos fixos.',
    'tope-fuera-de-rango': 'O valor não pode ser negativo nem tão alto.',
    'renglones-en-otra-clase': 'Só os custos fixos têm itens.',
    'fijos-sin-renglones': 'Os custos fixos precisam de pelo menos um item.',
    'demasiados-renglones': 'Cabem até 12 itens.',
    'renglon-sin-nombre': 'Cada item precisa de um nome.',
    'renglon-largo': 'O nome do item é longo demais: até 40 caracteres.',
    'renglon-fuera-de-rango': 'Cada item precisa de um valor maior que zero.',
    'dia-invalido': 'O dia de pagamento vai de 1 a 31.',
    'tope-no-es-la-suma': 'O valor tem que ser a soma dos itens.',
    'desde-invalido': 'Não foi possível ler a data de início do valor.',
    'meta-fuera-de-ahorro': 'Só as reservas vão até a meta.',
    'ahorro-antes-de-compromiso': 'As reservas vêm depois das contas.',
    'maun-en-el-reparto':
      'Maun não entra na divisão: para receber o que sobra, escolha Maun como superávit.',
    'hogar-en-el-reparto': 'Hogar não entra na divisão: recebe o pró-labore.',
    'porcentaje-invalido': 'Cada porcentagem vai de 0,01% a 100%.',
    'reparto-pasa-de-cien': 'As porcentagens somam mais de 100%.',
    'sueldo-por-trabajo': 'A fila conta o pró-labore por mês.',
  },
  problemasConNombre: {
    'tesoro-archivado': (nombre) =>
      nombre === null
        ? 'Essa caixinha está arquivada: tire da fila.'
        : `A caixinha ${nombre} está arquivada: tire da fila.`,
    'tesoro-repetido': (nombre) =>
      nombre === null
        ? 'Essa caixinha aparece duas vezes: cada caixinha entra uma vez só.'
        : `A caixinha ${nombre} aparece duas vezes: cada caixinha entra uma vez só.`,
    'modo-invalido': (nombre) =>
      nombre === null
        ? 'Essa caixinha não pode se completar desse jeito.'
        : `A caixinha ${nombre} não pode se completar desse jeito.`,
    'meta-sin-monto': (nombre) =>
      nombre === null
        ? 'Essa caixinha não tem meta: defina uma ou desligue “até a meta”.'
        : `A caixinha ${nombre} não tem meta: defina uma ou desligue “até a meta”.`,
    'superavit-invalido': (nombre) => `O que sobra não pode ir para ${nombre ?? 'essa caixinha'}.`,
    'superavit-en-la-fila': (nombre) =>
      nombre === null
        ? 'Essa caixinha recebe o que sobra: não pode estar também na fila.'
        : `A caixinha ${nombre} recebe o que sobra: não pode estar também na fila.`,
  },
  cambios: {
    entraALasObligaciones: (Nombre, nombre, posicion, porcentaje, base) => (
      <>
        <Nombre>{nombre}</Nombre> entra como obrigação {String(posicion)}, com {porcentaje}{' '}
        {fila.base[base]}.
      </>
    ),
    saleDeLasObligaciones: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> sai das obrigações e volta para a estante.
      </>
    ),
    cambiaDeLugar: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre> passa do {String(antes)} para o {String(despues)} na fila.
      </>
    ),
    cambiaElPorcentajeDeLaObligacion: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} para {despues}.
      </>
    ),
    cambiaLaBase: (Nombre, nombre, base) => (
      <>
        O cálculo de <Nombre>{nombre}</Nombre> passa a ser {fila.base[base]}.
      </>
    ),
    entraALaFila: (Nombre, nombre, tipo, numero, monto, modo) => (
      <>
        <Nombre>{nombre}</Nombre> entra como {TIPO_EN_LA_FRASE[tipo]} {String(numero)}, com{' '}
        {montoConSuModo(monto, tipo, modo)}.
      </>
    ),
    entraALaFilaHastaLaMeta: (Nombre, nombre, tipo, numero, monto, modo) => (
      <>
        <Nombre>{nombre}</Nombre> entra como {TIPO_EN_LA_FRASE[tipo]} {String(numero)}, com{' '}
        {montoConSuModo(monto, tipo, modo)}, até a meta.
      </>
    ),
    saleDeLaFila: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> volta para a estante com o que tem.
      </>
    ),
    cambiaLaClase: (Nombre, nombre, tipo) => (
      <>
        <Nombre>{nombre}</Nombre> passa a ser {PASA_A_SER[tipo]}.
      </>
    ),
    cambiaElTope: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} para {despues}.
      </>
    ),
    cambiaElTopeConSuModo: (Nombre, nombre, antes, despues, tipo, modo) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} para {despues} {fila.modo[tipo][modo]}.
      </>
    ),
    cambianLosRenglones: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> muda os itens e o valor continua igual.
      </>
    ),
    cambianLosDias: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> muda os dias de pagamento.
      </>
    ),
    cambiaElModo: (Nombre, nombre, tipo, modo) =>
      modo === 'saldo' ? (
        <>
          <Nombre>{nombre}</Nombre> agora {fila.modo[tipo][modo]}.
        </>
      ) : (
        <>
          <Nombre>{nombre}</Nombre> agora {VERBO_DEL_MODO[tipo]} {fila.modo[tipo][modo]}.
        </>
      ),
    juntaHastaLaMeta: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> junta até chegar à meta.
      </>
    ),
    juntaSinFin: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> junta sem limite, mesmo depois de chegar à meta.
      </>
    ),
    entraAlReparto: (Nombre, nombre, porcentaje) => (
      <>
        <Nombre>{nombre}</Nombre> entra na divisão com {porcentaje} do que sobra.
      </>
    ),
    entraAlRepartoHastaLaMeta: (Nombre, nombre, porcentaje) => (
      <>
        <Nombre>{nombre}</Nombre> entra na divisão com {porcentaje} do que sobra, até a meta.
      </>
    ),
    saleDelReparto: (Nombre, nombre) => (
      <>
        <Nombre>{nombre}</Nombre> sai da divisão e volta para a estante.
      </>
    ),
    cambiaElPorcentaje: (Nombre, nombre, antes, despues) => (
      <>
        <Nombre>{nombre}</Nombre>: de {antes} para {despues} do que sobra.
      </>
    ),
    cambiaElSuperavit: (Nombre, nombre, antes) => (
      <>
        <Nombre>{nombre}</Nombre> recebe o que sobra, no lugar de {antes}.
      </>
    ),
  },
  cuantosCambios: (cuantos) =>
    plural(cuantos, {
      '=0': 'Nenhuma alteração ainda',
      one: '# alteração não salva',
      other: '# alterações não salvas',
    }),
  cuantosCambiosYCuandoValen: (cuantos) =>
    plural(cuantos, {
      '=0': 'Nenhuma alteração ainda · valem a partir do próximo recebimento',
      one: '# alteração não salva · vale a partir do próximo recebimento',
      other: '# alterações não salvas · valem a partir do próximo recebimento',
    }),
  paraGuardar: (problema) => `Para salvar: ${problema}`,
  cuantasCosas: (cuantas) => plural(cuantas, { one: 'Muda uma coisa', other: 'Mudam # coisas' }),
  clases: {
    sueldo: 'Pró-labore',
    fijos: 'Custos fixos',
    prioridad: 'Prioridade',
  },
  prueba: {
    llegoALaMeta: 'chegou à meta',
    yaEstabaCompleto: 'já tinha o valor todo',
    completaElMonto: 'completa o valor',
    leFaltan: (falta) => `ainda faltam ${falta}`,
  },
  ficha: {
    tesoroQueYaNoEsta: 'Uma caixinha que não existe mais',
    laFila: 'A fila',
    comoSeReparte: 'Como cada recebimento é dividido',
    enLaFila: 'Na fila',
    lugarEnLaFila: (numero, cuantos) => `${String(numero)} de ${String(cuantos)}`,
    delPaso: (tipo, lugar) => `${tipo} · ${lugar}`,
    delSueldo: (tipo, lugar) => `${tipo} · ${lugar} · Pró-labore`,
    loQueSobra: 'O que sobra',
    ahorrosPorPorcentaje: 'Reservas por porcentagem',
    superavitElResto: 'Superávit · O resto',
    enElEstante: 'Na estante',
    deLaObligacion: (lugar) => `Obrigação · ${lugar}`,
    insumos: 'Insumos',
    loQueQuedaDeCadaSena: 'O que sobra de cada sinal',
  },
  barra: {
    editandoLaFila: 'Editando a fila',
    tesoros: 'Caixinhas',
    deshacer: 'Desfazer',
    rehacer: 'Refazer',
    descartar: 'Descartar',
    descartarLosCambios: 'Descartar as alterações',
    guardarLaFila: 'Salvar a fila',
    guardar: 'Salvar',
  },
  editar: (nombre) => `Editar ${nombre}`,
  listo: 'Concluir',
  guardar: {
    titulo: 'Salvar a fila',
    revision: (numero) => `Passa a ser a revisão ${String(numero)}`,
    sueldoPorMes:
      'O pró-labore passa a ser contado por mês: os recebimentos do mês vão cobrindo até o teto.',
    conUnCobroDe: (monto) => `Com um recebimento de ${monto}`,
    deDondeSale: 'De onde vem a comparação',
    comparacion: (mes) =>
      `É o mesmo recebimento dividido com a fila de hoje e com a que você vai salvar, considerando o que já entrou em ${mes}.`,
    igualQueHoy: 'Esse recebimento é dividido igual a hoje.',
    tesoro: 'Caixinha',
    hoy: 'Hoje',
    conLosCambios: 'Com as alterações',
    quedaEnCero: (Nombre, nombre, cero) => (
      <>
        <Nombre>{nombre}</Nombre> fica com valor de {cero}: não recebe nada até você definir um.
      </>
    ),
    cuandoValen: (mes) =>
      `As alterações valem a partir do próximo recebimento. As divisões que você já fez não mudam, e o que já entrou em ${mes} continua contando.`,
    seguirEditando: 'Continuar editando',
  },
  probador: {
    loQueDeja: 'Líquido (recebido menos despesas)',
    conUnTrabajo: 'Simule um projeto que renda',
    conQueSePrueba: 'Com o que simular',
    conLoDeHoy: 'Como está hoje',
    todoEnCero: 'Tudo zerado',
    seCobro: 'O cliente pagou',
    ayudaDeLoCobrado:
      'Tudo o que entrou do projeto, para o que é calculado sobre o que você recebe.',
    loQueDejaElTrabajo: 'O que o projeto rende',
    sobran: (Monto, monto) => (
      <>
        Sobram <Monto>{monto}</Monto> para dividir.
      </>
    ),
    sobranYMira: (Monto, monto) => (
      <>
        Sobram <Monto>{monto}</Monto> para dividir. Veja a fila.
      </>
    ),
    comoBaja: 'Como este recebimento desce',
    diezmo: 'Dízimo',
    conPorcentaje: (nombre, porcentaje) => `${nombre} ${porcentaje}`,
    ingresoLibre: 'Receita livre',
    ganancia: 'Lucro',
    loQueSobra: 'O que sobra',
    elResto: (nombre, porcentaje) => `${nombre}, o resto ${porcentaje}`,
    suma: 'Soma',
    daElIngreso: 'bate com a receita',
  },
  panel: {
    cerrarElDetalle: 'Fechar o detalhe',
    subir: 'Subir',
    bajar: 'Descer',
    lugarEnLaFila: 'Lugar na fila',
    numeroDeCuantos: (Negrita, numero, cuantos) => (
      <>
        <Negrita>{String(numero)}</Negrita> de {String(cuantos)}
      </>
    ),
    vuelveAlEstante: 'Volta para a estante com o que tem. Nada é apagado.',
    registrarElPago: 'Registrar o pagamento',
    registrarElPagoDe: (nombre) => `Registrar o pagamento de ${nombre}`,
    registrarElPagoDeEsteRenglon: 'Registrar o pagamento deste item',
    porcentaje: 'Porcentagem',
    porcentajeDe: (nombre) => `Porcentagem de ${nombre}`,
    sobreQueSeCalcula: 'Sobre o que é calculado',
    sobreQueSeCalculaDe: (nombre) => `Base de cálculo de ${nombre}`,
    enElMes: (mes) => `Em ${mes}`,
    apartado: 'Separado',
    aPagar: 'A pagar',
    candadoDelDiezmo: 'O dízimo não pode sair da fila: a porcentagem e o lugar dele podem mudar.',
    sacarDeLasObligaciones: 'Tirar das obrigações',
    venceEl: 'Vence dia',
    diaDePagoDe: (nombre) => `Dia de pagamento de ${nombre}`,
    diaDePagoDeEsteRenglon: 'Dia de pagamento deste item',
    sinDia: 'sem dia',
    renglones: 'Itens',
    queSonLosRenglones: 'O que são os itens',
    ayudaDeLosRenglones:
      'Cada despesa paga todo mês. O valor da conta é a soma: quando um item muda, o valor muda a partir do próximo recebimento.',
    renglonDe: (numero, nombre) => `Item ${String(numero)} de ${nombre}`,
    sacarElRenglon: (nombre) => `Tirar o item ${nombre}`,
    sacarElRenglonNumero: (numero) => `Tirar o item ${String(numero)}`,
    montoDe: (nombre) => `Valor de ${nombre}`,
    montoDelRenglon: (numero) => `Valor do item ${String(numero)}`,
    venceElDia: (dia) => `· vence dia ${String(dia)}`,
    sumarUnRenglon: 'Adicionar um item',
    montoLaSuma: 'Valor, a soma',
    rigeDesdeElProximoCobro: 'Vale a partir do próximo recebimento',
    rigeDesde: (mes, anio) => `Vale a partir de ${mes} de ${anio}`,
    monto: 'Valor',
    comoSeLlenaDe: (tipo, nombre) =>
      tipo === 'compromiso' ? `Como ${nombre} se completa` : `Como ${nombre} se separa`,
    sueldoPorMes:
      'O pró-labore de Hogar vai sempre por mês: Hogar gasta o saldo durante o mês todo.',
    hastaLaMeta: 'Até a meta',
    juntaHastaLaMeta: 'Junta até chegar à meta.',
    juntaSinFin: 'Junta sem limite.',
    llegoASuMeta: 'Chegou à meta',
    leFaltan: (falta) => `Faltam ${falta}`,
    deTotal: (parte, total) => `${parte} de ${total}`,
    recibio: 'Recebeu',
    recibeEnCadaCobro: (monto) => `Recebe ${monto} a cada recebimento, sem olhar o mês.`,
    loApartado: 'Valor separado',
    nivelApartado: (nombre) => `${nombre}, valor separado`,
    nivelDelMes: (nombre, mes) => `${nombre} em ${mes}`,
    sinMontoTodavia: 'Sem valor ainda',
    poneElMonto: 'Defina o valor',
    completo: 'Completo',
    faltan: (falta) => `Faltam ${falta}`,
    cubrirDesdeOtroTesoro: 'Cobrir com outra caixinha',
    pagado: 'Pago',
    queEs: 'O que é',
    queEsDe: (nombre) => `O que é ${nombre}`,
    tipoDelSueldo: (tipo) => `${tipo} · o pró-labore de Hogar`,
    sacarDeLaFila: 'Tirar da fila',
    seRepartePorPorcentaje: 'Dividido por porcentagem',
    reparto: 'Divisão',
    sacarDelReparto: (nombre) => `Tirar ${nombre} da divisão`,
    hastaLaMetaDe: (nombre) => `${nombre} até a meta`,
    elResto: (nombre) => `${nombre}, o resto`,
    repartoEnCien: (nombre) =>
      `A divisão chega a 100%: ${nombre} fica só com os centavos do arredondamento.`,
    repartoConLibre: (suma, libre, nombre) =>
      `As porcentagens somam ${suma}. Os ${libre} que faltam vão para ${nombre}, que recebe o que sobra.`,
    superavitRecibe: (libre) =>
      `Recebe o que sobra depois de tudo: ${libre} do que é dividido e os centavos do arredondamento.`,
    dondeCaeLoQueSobra: 'Onde cai o que sobra',
    caeEn: (Negrita, nombre) => (
      <>
        Cai em <Negrita>{nombre}</Negrita>.
      </>
    ),
    tiene: 'Saldo',
    deLaMeta: (porcentaje, meta) => `${porcentaje}% da meta de ${meta}`,
    sumarloALaFila: 'Colocar na fila',
    noRecibeYSeEdita:
      'Agora não ganha nada dos recebimentos. Escolha onde fica: a fila passa para edição e nada muda até você salvar.',
    noRecibe: 'Agora não ganha nada dos recebimentos. Escolha onde fica.',
    noRecibeConFlechas:
      'Agora não ganha nada dos recebimentos. Ligue uma seta até o cartão dela ou escolha onde fica.',
    deLosTrabajosEnCurso: 'Dos projetos em andamento',
    sinTrabajos: 'Nenhum projeto em andamento com dinheiro.',
    enTrabajos: (cuantos) =>
      plural(cuantos, {
        one: 'Em # projeto em andamento. Fica em Maun até o projeto ser pago.',
        other: 'Em # projetos em andamento. Fica em Maun até cada projeto ser pago.',
      }),
    porTrabajo: 'Por projeto',
    unTrabajo: 'Um projeto',
    entroYGastado: (entro, gastado) => `entrou ${entro} · gasto ${gastado}`,
    lugarDeLaObligacion: (porcentaje, base) => `${porcentaje} ${fila.base[base]}`,
    lugarDelSueldo: (modo) => `pró-labore, ${fila.modo.compromiso[modo]}`,
    lugarConElResto: (tipo, modo) => `${fila.modo[tipo][modo]}, e o resto`,
    lugarDeLaParte: (porcentaje) => `${porcentaje} do que sobra`,
    lugarDeLaParteHastaLaMeta: (porcentaje) => `${porcentaje} do que sobra, até a meta`,
    lugarDelResto: 'o resto',
    lugarDelEstante: 'estante',
    deMas: (monto) => `${monto} a mais`,
    estante: 'Estante',
    listaDeTesoros: 'Lista de caixinhas',
    queEsLaLista: 'O que é a lista de caixinhas',
    ayudaDeLaLista:
      'Todas as caixinhas com o que têm hoje, na ordem da fila. Toque em uma para ver na planta.',
    numeroEnLaFila: (numero) => `número ${String(numero)} da fila, `,
    entreTodos: 'No total',
    tocaUnaFicha:
      'Toque em um cartão para ver as regras, ou simule um recebimento e veja por onde o dinheiro desce.',
    probarUnCobro: 'Simular um recebimento',
    ingresoEnCobros: (cobros) =>
      plural(cobros, {
        '=0': 'Receita em 0 recebimentos',
        one: 'Receita em # recebimento',
        other: 'Receita em # recebimentos',
      }),
    obligacionesApartadas: 'Obrigações separadas',
    losCompromisos: 'As contas',
    faltaParaLosCompromisos: 'Falta para as contas',
    llenos: 'completas',
    ahorrado: 'Reservado',
    superavit: 'Superávit',
  },
} satisfies Mensajes['armarLaFila'];
