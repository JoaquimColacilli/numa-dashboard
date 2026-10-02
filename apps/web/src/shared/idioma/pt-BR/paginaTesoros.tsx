import type { TipoDelPaso } from '@maun/domain';

import type { Mensajes } from '../es';

import { fila } from './fila';
import { plural } from './plural';

type LugarQueSeMueve = 'obligacion' | TipoDelPaso;

const NOMBRE: Readonly<Record<LugarQueSeMueve, string>> = {
  obligacion: 'obrigação',
  compromiso: 'conta',
  'ahorro-fijo': 'reserva fixa',
};

export const paginaTesoros = {
  menu: {
    alPrincipio: (lugar) => `${lugar}, no início`,
    despuesDe: (lugar, nombre) => `${lugar}, depois de ${nombre}`,
    cerrar: 'Fechar o menu',
    sumarUnTesoro: (encabezado) => `Adicionar uma caixinha: ${encabezado}`,
    comoEntra: 'Como entra',
    tiene: (saldo) => `tem ${saldo}`,
    unTesoroNuevo: 'Uma caixinha nova',
  },
  union: {
    llevala: 'Leve até uma caixinha',
    ahiNo: 'Não dá para ligar aí',
    soltaParaCrear: 'Solte para criar uma caixinha aqui',
    soltaAlReparto: (nombre) => `Solte: ${nombre} entra na divisão`,
    soltaYPasaASer: (nombre, lugar, numero) =>
      `Solte: ${nombre} passa a ser a ${NOMBRE[lugar]} ${String(numero)}`,
    soltaYEntraComo: (nombre, lugar, numero) =>
      `Solte: ${nombre} entra como ${NOMBRE[lugar]} ${String(numero)}`,
    soloCambianDeLugar: 'Só as obrigações e as etapas da fila mudam de lugar.',
    yaEsElPrimero: (nombre, grupo) => `${nombre} já é a primeira ${NOMBRE[grupo]}.`,
    yaEsElUltimo: (nombre, grupo) => `${nombre} já é a última ${NOMBRE[grupo]}.`,
    pasaASer: (nombre, grupo, numero, cuantos) =>
      `${nombre} passa a ser a ${NOMBRE[grupo]} ${String(numero)} de ${String(cuantos)}.`,
  },
  rotulo: {
    deAjustes: 'das Configurações',
    controles: 'Controles da planta',
    alejar: 'Afastar',
    acercar: 'Aproximar',
    verTodaLaFila: 'Ver a fila inteira',
    rotuloDelPlano: 'Carimbo da planta',
    plano: 'Planta',
    laFilaDeLosTesoros: 'A fila das caixinhas',
    revision: 'Rev.',
    rige: 'Vale',
    escala: 'Esc.',
  },
  plano: {
    eraEl: (numero) => `era o ${String(numero)}`,
    flecha: 'Seta da fila',
    etiquetaDeLaObligacion: (numero, cuantos, nombre, porcentaje, base, aPagar) =>
      `Obrigação ${String(numero)} de ${String(cuantos)}: ${nombre}, ${porcentaje} ${fila.base[base]}; a pagar ${aPagar}`,
    etiquetaDelDiezmo: (numero, cuantos, nombre, porcentaje, base, aPagar) =>
      `Obrigação ${String(numero)} de ${String(cuantos)}: ${nombre}, ${porcentaje} ${fila.base[base]}; a pagar ${aPagar}; não pode sair da fila`,
    etiquetaDelPaso: (encabezado, cifra, estado) => `${encabezado}, ${cifra}; ${estado}`,
    encabezadoDelPaso: (tipo, numero, cuantos, nombre) =>
      `${fila.tipos[tipo]} ${String(numero)} de ${String(cuantos)}: ${nombre}`,
    encabezadoDelSueldo: (tipo, numero, cuantos, nombre) =>
      `${fila.tipos[tipo]} ${String(numero)} de ${String(cuantos)}: ${nombre}, pró-labore`,
    cifraPorTrabajo: (tipo, tope) => `${tope} ${fila.modo[tipo].trabajo}`,
    cifraDelSaldo: (tipo, tope) => `até ${tope}, ${fila.modo[tipo].saldo}`,
    cifraDelMes: (tipo, tope) => `até ${tope} ${fila.modo[tipo].mes}`,
    enElMesRecibio: (recibido) => `no mês ${recibido}`,
    aPagarYFaltan: (lleva, falta) => `a pagar ${lleva}, faltam ${falta}`,
    aPagarCompleto: (lleva) => `a pagar ${lleva}, completo`,
    tieneYFaltan: (lleva, falta) => `tem ${lleva}, faltam ${falta}`,
    tieneCompleto: (lleva) => `tem ${lleva}, completo`,
    llevaYFaltan: (lleva, falta) => `acumulou ${lleva}, faltam ${falta}`,
    llevaCompleto: (lleva) => `acumulou ${lleva}, completo`,
    etiquetaDeLaParte: (nombre, porcentaje) => `Reserva: ${nombre}, ${porcentaje} do que sobra`,
    etiquetaDeLaParteConMeta: (nombre, porcentaje, saldo, meta) =>
      `Reserva: ${nombre}, ${porcentaje} do que sobra; tem ${saldo} da meta de ${meta}`,
    etiquetaDeLaParteHastaLaMeta: (nombre, porcentaje, saldo, meta) =>
      `Reserva: ${nombre}, ${porcentaje} do que sobra, até a meta; tem ${saldo} da meta de ${meta}`,
    pruebaDeUnTrabajo: (deja) => `Simulação: um projeto que rende ${deja}`,
    ingresoDelMes: (mes, ingreso, cobros) =>
      plural(cobros, {
        '=0': `Receita de ${mes}: ${ingreso} em 0 recebimentos`,
        one: `Receita de ${mes}: ${ingreso} em # recebimento`,
        other: `Receita de ${mes}: ${ingreso} em # recebimentos`,
      }),
    trabajosEnCurso: (trabajos) =>
      plural(trabajos, {
        '=0': 'Nenhum projeto em andamento',
        one: '# projeto em andamento',
        other: '# projetos em andamento',
      }),
    etiquetaDeLosInsumos: (total, trabajos) =>
      plural(trabajos, {
        '=0': `Insumos: ${total}, nenhum projeto em andamento`,
        one: `Insumos: ${total}, # projeto em andamento`,
        other: `Insumos: ${total}, # projetos em andamento`,
      }),
    senaDeLosTrabajos: 'Sinal dos projetos em andamento',
    entrada: 'entrada',
    rolDelReparto: 'divisão',
    parteDelReparto: (nombre, porcentaje) => `${nombre} ${porcentaje}`,
    etiquetaDelReparto: (partes) => `O que sobra é dividido: ${partes.join(', ')}`,
    etiquetaDelResto: (nombre, porcentaje) =>
      `Superávit: ${nombre} recebe o resto, ${porcentaje}, e os centavos`,
    restoConPorcentaje: (porcentaje) => `resto ${porcentaje}`,
    estante: 'Estante',
    todosEnLaFila: 'Todas estão na fila',
    noRecibenDeLosCobros: 'Não ganham nada dos recebimentos',
    rolDelEstante: 'caixinha na estante',
    etiquetaDelEstante: (nombre, saldo) => `${nombre}, na estante, tem ${saldo}`,
  },
  fichas: {
    antes: (Tachado, valor) => (
      <>
        antes <Tachado>{valor}</Tachado>
      </>
    ),
    ingreso: 'Receita',
    insumos: 'Insumos',
    queda: 'Sobra',
    candado: 'O dízimo não pode sair da fila',
    aPagar: 'A pagar',
    deEsteCobro: 'Deste recebimento',
    sinMontoTodavia: 'sem valor ainda',
    completo: 'Completo',
    faltan: (falta) => `faltam ${falta}`,
    sinNombre: 'Sem nome',
    venceEl: (dia) => `· vence dia ${String(dia)}`,
    pagado: 'pago',
    suMeta: (nombre) => `${nombre}, a meta`,
    avanceDeLaMeta: (avance, meta) => `${avance}% de ${meta}`,
    hastaLaMeta: 'até a meta',
    enElMes: (mes) => `Em ${mes}`,
    recibeEnCadaCobro: (monto) => `Recebe ${monto} a cada recebimento`,
    aPagarMonto: (monto) => `a pagar ${monto}`,
    tieneMonto: (monto) => `tem ${monto}`,
    llevaMonto: (monto) => `acumulou ${monto}`,
    nivelDelSaldo: (nombre) => `${nombre}, o que tem`,
    nivelDelMes: (nombre, mes) => `${nombre} em ${mes}`,
    sinMontoTodaviaDelNivel: 'Sem valor ainda',
    deTotal: (parte, total) => `${parte} de ${total}`,
    yaEstabaCompleto: 'já tinha o valor todo',
    noLeLlegaNada: 'não recebe nada',
    sueldo: 'Pró-labore',
    renglonPorRenglon: 'Item por item',
    yMas: (cuantos) => `e mais ${String(cuantos)}`,
    loQueSobra: 'O que sobra',
    seReparte: 'É dividido',
    seReparteAsi: 'Dividido assim',
    noSobraNada: 'Não sobra nada',
    aAhorros: 'para reservas',
    deEsteCobroUnidad: 'deste recebimento',
    elResto: 'O resto',
    hastaLaMetaUnidad: 'Até a meta',
    tiene: 'Saldo',
    sinDescripcion: 'Sem descrição',
    uniUnaFlecha: 'Ligue uma seta aqui',
    nuevoTesoro: 'Nova caixinha',
    seCobraElTrabajo: 'O projeto é pago',
    ingresoLibre: 'Receita livre',
    ganancia: 'Lucro',
  },
  bienvenida: {
    etiqueta: 'A fila, primeira vez',
    titulo: 'Cada recebimento desce pela fila',
    texto:
      'Montamos com o que você tinha em Configurações: primeiro o dízimo, depois o seu pró-labore e os custos fixos, e o que sobra fica em Maun. Agora você pode adicionar caixinhas, ordenar os valores e dividir o que sobra.',
    editarLaFila: 'Editar a fila',
    entendido: 'Entendi',
  },
  planoCompleto: {
    titulo: 'A planta da fila',
    comoSeMira: 'Como ver a planta',
    ayuda:
      'Arraste com um dedo para se mover e junte dois dedos para aproximar, ou use os botões de baixo. Para mudar a fila, feche a planta e toque em Editar.',
    rotulo: (revision, rige) => `Rev. ${String(revision)} · Vale ${rige} · Só para ver`,
    cerrar: 'Fechar a planta',
  },
  planoVertical: {
    sumarAca: 'Adicionar aqui',
    lugarDe: (nombre) => `Lugar de ${nombre}`,
    subir: 'Subir',
    bajar: 'Descer',
    editar: 'Editar',
    laFila: 'A fila',
    estante: 'Estante',
  },
  celular: {
    insumos: 'Insumos',
    sinTrabajos: 'Nenhum projeto em andamento',
    loQueQuedaDeLaSena: (trabajos) =>
      plural(trabajos, {
        one: 'O que sobra do sinal de # projeto em andamento',
        other: 'O que sobra do sinal de # projetos em andamento',
      }),
    unTrabajo: 'Um projeto',
    comoSeReparte: 'Como cada recebimento é dividido',
    tesoros: 'Caixinhas',
    verElPlanoCompleto: 'Ver a planta inteira',
    editar: 'Editar',
    probarUnCobro: 'Simular um recebimento',
    probaUnCobro: 'Simule um recebimento',
  },
  compu: {
    comoSeReparte: 'Como é dividido o que cada projeto rende',
    tesoros: 'Caixinhas',
    nuevoTesoro: 'Nova caixinha',
    editarLaFila: 'Editar a fila',
    cerrarElDetalle: 'Fechar o detalhe',
    listo: 'Concluir',
    probarUnCobro: 'Simular um recebimento',
    detalle: 'Detalhe',
  },
  lienzo: {
    sumarUnTesoroAca: 'Adicionar uma caixinha aqui',
    elegirLaFicha: 'Enter ou espaço escolhe o cartão e Esc solta.',
    elegirYMoverLaFicha:
      'Enter ou espaço escolhe o cartão e Esc solta. Enquanto você edita a fila, Alt com as setas para cima e para baixo muda o cartão escolhido de lugar dentro do tipo dele, e Delete tira da fila.',
    flecha: 'Seta por onde o dinheiro desce.',
    dejarDeMover: 'Parar de mover a planta',
    croquis: 'Esboço da fila',
    manija: 'Alça para ligar a outra caixinha',
  },
} satisfies Mensajes['paginaTesoros'];
