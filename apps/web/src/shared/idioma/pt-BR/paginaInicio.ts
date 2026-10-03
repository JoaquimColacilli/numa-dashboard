import { ETIQUETAS_DE_IDIOMA } from '@maun/domain';

import { formatearPorcentaje } from '@/shared/lib';

import type { Mensajes } from '../es';
import { plural } from './plural';

const LISTA = new Intl.ListFormat(ETIQUETAS_DE_IDIOMA['pt-BR'], { type: 'conjunction' });

function porciento(porcentaje: number): string {
  return formatearPorcentaje(porcentaje * 100, 'pt-BR');
}

export const paginaInicio = {
  titulo: 'Início',
  agenda: 'Agenda',
  tuCuenta: 'Sua conta',
  tuCuentaConOpinionesNuevas: (nuevas) =>
    plural(nuevas, {
      one: 'Sua conta. # opinião nova',
      other: 'Sua conta. # opiniões novas',
    }),
  lista: (partes) => LISTA.format(partes),
  mensajeDelMes: {
    hogarEnNegativo: (monto) =>
      `A casa está no vermelho: ${monto}. Os gastos passaram do que entrou.`,
    sinMovimiento: (mes) => `${mes} ainda não tem movimentações.`,
    compromisosYAhorrosCubiertos: (mes) => `As contas e as reservas de ${mes} já estão cobertas.`,
    faltanParaLlenar: (monto, mes) =>
      `Faltam ${monto} para completar as contas e as reservas de ${mes}.`,
    sueldoCubierto: (mes) => `O pró-labore de ${mes} já está coberto.`,
    facturoYNoEntro: (monto, mes) =>
      `A marcenaria faturou ${monto} em ${mes} e ainda não entrou nada na casa: o pró-labore é transferido quando você recebe por um projeto.`,
    faltanParaElSueldo: (monto, mes) => `Faltam ${monto} para cobrir o pró-labore de ${mes}.`,
  },
  comparacion: {
    subio: (porcentaje, mes) => `+${porciento(porcentaje)}% vs. ${mes}`,
    bajo: (porcentaje, mes) => `−${porciento(porcentaje)}% vs. ${mes}`,
  },
  accesos: 'Atalhos',
  entregaMasProxima: 'Próxima entrega',
  sinEntregasProgramadas: 'Nenhuma entrega agendada',
  comprometida: (cuando) => `${cuando}, confirmada`,
  pendienteDeCobro: 'A receber',
  proyectosEnCurso: (proyectos) =>
    plural(proyectos, {
      '=0': 'Nenhum projeto em andamento',
      one: '# projeto em andamento',
      other: '# projetos em andamento',
    }),
  diezmo: 'Dízimo',
  proyeccionDeCocos: 'Projeção de Cocos',
  cocosEnUnAnio: 'Cocos em um ano',
  conLaTasaQueCargaste: 'com a taxa que você registrou, sem novos aportes',
  faltaParaLaMeta: 'falta para a meta',
  diaDelMes: (dia, dias) => `dia ${String(dia)} de ${String(dias)}`,
  panorama: {
    titulo: 'Panorama',
    queEs: 'O que é o panorama',
    ayuda: 'Onde está o dinheiro e para que você pode usá-lo.',
    paraPagar: 'A pagar',
    nadaPendiente: 'nada pendente',
    ahorros: 'Reservas',
    todaviaSinAhorros: 'ainda sem reservas',
    superavit: 'Superávit',
    enElTesoro: (tesoro) => `em ${tesoro}`,
    enElTesoroQueNoAlcanza: (tesoro) => `em ${tesoro}, que não é suficiente`,
    insumos: 'Insumos dos projetos',
    sinTrabajosEnCurso: 'nenhum projeto em andamento',
    deTrabajos: (trabajos) => plural(trabajos, { one: 'de um projeto', other: 'de # projetos' }),
    enTesoros: (tesoros) => plural(tesoros, { one: 'em uma caixinha', other: 'em # caixinhas' }),
    enDolares: 'Em dólares',
  },
  laFila: {
    titulo: (mes) => `A fila de ${mes}`,
    queEs: 'O que é a fila do mês',
    ayuda:
      'Assim vai o mês: cada recebimento separa as obrigações, completa as contas e as reservas nesta ordem, e o que sobra é dividido. A linha fina marca o dia de hoje.',
    verLaFila: 'Ver a fila',
    loQueSobra: 'O que sobra',
    tesoro: 'Caixinha',
    sinCobros: 'Ainda não houve recebimentos este mês',
    ingresoEnCobros: (ingreso, cobros) =>
      plural(cobros, {
        one: `${ingreso} de receita em um recebimento`,
        other: `${ingreso} de receita em # recebimentos`,
      }),
    regla: {
      cobrado: (porcentaje) => `${porcentaje}% sobre o que você recebe`,
      ingreso: (porcentaje) => `${porcentaje}% sobre a receita`,
    },
    apartado: (monto) => `${monto} reservado`,
    aPagar: (monto) => `A pagar: ${monto}`,
    alDia: 'Em dia',
    sueldo: 'pró-labore',
    costosFijos: 'custos fixos',
    hastaLaMeta: (modo) => `${modo} · até a meta`,
    paso: (numero, tesoro) => `Etapa ${String(numero)}: ${tesoro}`,
    porCobro: (monto) => `${monto} por recebimento`,
    deTope: (lleva, tope) => `${lleva} de ${tope}`,
    cubierto: 'Coberto',
    esperaSuTurno: 'Aguardando a vez',
    llegoALaMeta: 'Atingiu a meta',
    recibioEsteMes: (monto) => `Recebeu ${monto} este mês`,
    recibeEnCadaCobro: 'Recebe o valor a cada recebimento',
    faltan: (monto) => `Faltam ${monto}`,
    sobra: {
      cuandoSeLlenan: {
        queda: {
          ambos: (tesoro, falta) =>
            `Quando as contas e as reservas fixas estiverem completas, o que sobra fica em ${tesoro}: faltam ${falta}.`,
          compromisos: (tesoro, falta) =>
            `Quando as contas estiverem completas, o que sobra fica em ${tesoro}: faltam ${falta}.`,
          ahorros: (tesoro, falta) =>
            `Quando as reservas fixas estiverem completas, o que sobra fica em ${tesoro}: faltam ${falta}.`,
        },
        va: {
          ambos: (tesoro, falta) =>
            `Quando as contas e as reservas fixas estiverem completas, o que sobra vai para ${tesoro}: faltam ${falta}.`,
          compromisos: (tesoro, falta) =>
            `Quando as contas estiverem completas, o que sobra vai para ${tesoro}: faltam ${falta}.`,
          ahorros: (tesoro, falta) =>
            `Quando as reservas fixas estiverem completas, o que sobra vai para ${tesoro}: faltam ${falta}.`,
        },
      },
      deCadaCobro: {
        queda: (tesoro) => `O que sobra de cada recebimento fica em ${tesoro}.`,
        va: (tesoro) => `O que sobra de cada recebimento vai para ${tesoro}.`,
      },
      yaLlenos: {
        queda: {
          ambos: (tesoro) =>
            `As contas e as reservas fixas já estão completas: o que sobra de cada recebimento fica em ${tesoro}.`,
          compromisos: (tesoro) =>
            `As contas já estão completas: o que sobra de cada recebimento fica em ${tesoro}.`,
          ahorros: (tesoro) =>
            `As reservas fixas já estão completas: o que sobra de cada recebimento fica em ${tesoro}.`,
        },
        va: {
          ambos: (tesoro) =>
            `As contas e as reservas fixas já estão completas: o que sobra de cada recebimento vai para ${tesoro}.`,
          compromisos: (tesoro) =>
            `As contas já estão completas: o que sobra de cada recebimento vai para ${tesoro}.`,
          ahorros: (tesoro) =>
            `As reservas fixas já estão completas: o que sobra de cada recebimento vai para ${tesoro}.`,
        },
      },
      yaSeRepartieron: {
        queda: (repartido, lista, tesoro) =>
          `Já foram divididos ${repartido}: ${lista}. O resto ficou em ${tesoro}.`,
        va: (repartido, lista, tesoro) =>
          `Já foram divididos ${repartido}: ${lista}. O resto foi para ${tesoro}.`,
      },
      seReparteCuandoSeLlenan: {
        ambos: (falta) =>
          `É dividido quando as contas e as reservas fixas estiverem completas: faltam ${falta}.`,
        compromisos: (falta) => `É dividido quando as contas estiverem completas: faltam ${falta}.`,
        ahorros: (falta) =>
          `É dividido quando as reservas fixas estiverem completas: faltam ${falta}.`,
      },
      elProximoCobroSeReparte: 'O que o próximo recebimento deixar é dividido.',
      yaLlenosYSeReparte: {
        ambos:
          'As contas e as reservas fixas já estão completas: o que o próximo recebimento deixar é dividido.',
        compromisos: 'As contas já estão completas: o que o próximo recebimento deixar é dividido.',
        ahorros:
          'As reservas fixas já estão completas: o que o próximo recebimento deixar é dividido.',
      },
      reparto: (lista) => `${lista}.`,
      parte: (tesoro, porcentaje) => `${tesoro} ${porcentaje}%`,
      parteHastaSuMeta: (tesoro, porcentaje) => `${tesoro} ${porcentaje}% até a meta`,
      elResto: (tesoro) => `o resto para ${tesoro}`,
      recibio: (tesoro, monto) => `${tesoro} ${monto}`,
    },
    diasQueQuedan: (quedan) =>
      plural(quedan, {
        '=0': 'Hoje é o último dia do mês.',
        one: 'Resta um dia no mês.',
        other: 'Restam # dias no mês.',
      }),
    elProximoCobroLosLlena:
      'O próximo recebimento completa esse valor primeiro, ou você pode cobrir agora com outra caixinha.',
    tesoroEnLaFrase: (tesoro) => tesoro,
    losCostosFijos: 'os custos fixos',
  },
  faltante: {
    faltaPara: (tesoro) => `Falta para ${tesoro}`,
    elegirDeQueTesoroSacar: 'Escolher de qual caixinha tirar',
  },
  perfil: {
    nadaAgendado: 'Nada agendado por enquanto',
    hoy: 'Hoje',
    manana: 'Amanhã',
    proximo: (cuando, evento) => `${cuando}: ${evento}`,
    loQueNoEntraEnLaBarra: 'O que não cabe na barra',
    opiniones: 'Opiniões',
    loQueContestaron: 'O que seus clientes responderam',
    nuevas: (nuevas) => plural(nuevas, { one: '# nova', other: '# novas' }),
    opino: (cliente) => `${cliente} opinou`,
    opinaron: (clientes) => `${clientes} opinaram`,
    yMas: (mas) => plural(mas, { other: 'mais #' }),
    estadisticas: 'Estatísticas',
    comoVieneElTaller: 'Como vai a marcenaria',
    tesoros: 'Caixinhas',
    comoSeReparte: 'Como cada recebimento é dividido',
    diezmo: 'Dízimo',
    agenda: 'Agenda',
    laApp: 'O app',
    ajustes: 'Configurações',
    tuTaller: 'Sua marcenaria, como você recebe e a vitrine',
  },
  estadisticas: {
    comoVieneElTaller: 'Como vai a marcenaria',
    verLasEstadisticas: 'Ver as estatísticas',
  },
  hoyEnLaAgenda: {
    titulo: 'Hoje na agenda',
    verLaAgenda: 'Ver a agenda',
    nadaParaHoy: 'Nada agendado para hoje.',
    yMas: (mas) => plural(mas, { other: 'e mais #' }),
  },
  metas: {
    titulo: 'Metas',
    diezmoPagado: 'Dízimo pago',
    deLaMeta: (saldo, meta) => `${saldo} de ${meta}`,
  },
  portada: {
    arrancaAca: 'Sua marcenaria começa aqui',
    cargaElSueldo:
      'Registre o pró-labore que você se paga e seus custos fixos para que o Início mostre quanto falta a cada mês. Depois, o primeiro projeto.',
    cargarSueldoYCostosFijos: 'Registrar pró-labore e custos fixos',
    cargarElPrimerProyecto: 'Registrar o primeiro projeto',
    elCorte: (mes) => `O corte de ${mes}`,
  },
  respuestas: {
    loQueContestaron: 'Respostas sobre a entrega',
    laEntregaDeSu: (trabajo) => `A entrega de “${trabajo}”`,
    tePasoSusDias: (cliente) => `${cliente} mandou os dias em que pode`,
    tuClienteTePasoSusDias: 'Seu cliente mandou os dias em que pode',
    aceptoElDiaQueLePropusiste: (cliente) => `${cliente} aceitou o dia que você sugeriu`,
    tuClienteAceptoElDiaQueLePropusiste: 'Seu cliente aceitou o dia que você sugeriu',
    aceptoEl: (cliente, fecha) => `${cliente} aceitou: ${fecha}`,
    tuClienteAceptoEl: (fecha) => `Seu cliente aceitou: ${fecha}`,
  },
  ultimaOpinion: {
    opinoDeSu: (cliente, trabajo) => `${cliente} opinou sobre “${trabajo}”`,
    unClienteOpinoDeSu: (trabajo) => `Um cliente opinou sobre “${trabajo}”`,
    comentario: (comentario) => `“${comentario}”`,
  },
  tarjetas: {
    titulo: 'Caixinhas',
    gastoMasDeLoQueEntro: 'gastou mais do que entrou',
    enNegativo: 'no vermelho',
    tipos: (tipos) => LISTA.format(tipos),
    pusoEnLosTrabajos: (monto) => `colocou ${monto} nos projetos`,
    noAlcanzaParaLosInsumos: (monto) => `não cobre ${monto} de insumos`,
    sonInsumos: (monto) => `${monto} são insumos`,
    deLaMeta: (porcentaje) => `${porciento(porcentaje)}% da meta`,
  },
} satisfies Mensajes['paginaInicio'];
