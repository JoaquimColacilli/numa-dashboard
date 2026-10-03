import { fechaConAnio, fechaEnUnaFrase } from '@/shared/lib';

import type { Mensajes } from '../es';
import type { FaltanParaLosTiempos } from '../es/paginaEstadisticas';
import { plural } from './plural';

function projetos(cantidad: number): string {
  return plural(cantidad, { one: '# projeto', other: '# projetos' });
}

function consultas(cantidad: number): string {
  return plural(cantidad, { one: '# consulta', other: '# consultas' });
}

function oDia(fecha: string): string {
  return fechaEnUnaFrase(fecha, fecha, 'pt-BR');
}

const O_QUE_FALTA_PARA_OS_TEMPOS: Readonly<Record<FaltanParaLosTiempos, string>> = {
  ambos: 'quanto você leva para enviá-los e quanto os clientes demoram para responder',
  mandarlos: 'quanto você leva para enviá-los',
  contesten: 'quanto os clientes demoram para responder',
};

function casosParaOsTempos(cual: FaltanParaLosTiempos, cantidad: number): string {
  return cual === 'contesten'
    ? plural(cantidad, { one: '# resposta', other: '# respostas' })
    : plural(cantidad, { one: '# orçamento', other: '# orçamentos' });
}

export const paginaEstadisticas = {
  titulo: 'Estatísticas',
  bajada: 'Como vai a marcenaria, com o que você registra no NUMA.',
  queEs: (que) => `O que é: ${que}`,
  vacio: {
    titulo: 'Ainda não há nada para mostrar',
    detalle: 'Quando você receber pelo primeiro projeto, vai ver aqui como vai a marcenaria.',
  },
  periodo: {
    leyenda: 'Período',
    largos: { tres: '3 meses', seis: '6 meses', doce: '12 meses', todo: 'Tudo' },
    anteriores: (meses) => `Os ${String(meses)} meses anteriores`,
    siguientes: (meses) => `Os ${String(meses)} meses seguintes`,
    entre: (desde, hasta) => `${desde} – ${hasta}`,
    mesYAnio: (mes, anio) => `${mes} ${anio}`,
    mesDeOtroAnio: (mes, anio) => `${mes} de ${anio}`,
    desde: (cuando) => `Desde ${cuando}`,
    contra: (rango) => `vs. ${rango}`,
    contraHastaElMismoDia: (rango) => `vs. ${rango}, até o mesmo dia`,
    enLaFrase: (desde, hasta) => `entre ${desde} e ${hasta}`,
    desdeEnLaFrase: (cuando) => `desde ${cuando}`,
    trimestre: (numero) => `T${String(numero)}`,
  },
  meses: {
    m01: 'jan',
    m02: 'fev',
    m03: 'mar',
    m04: 'abr',
    m05: 'mai',
    m06: 'jun',
    m07: 'jul',
    m08: 'ago',
    m09: 'set',
    m10: 'out',
    m11: 'nov',
    m12: 'dez',
  },
  probaCon: {
    tres: 'Experimente 6 ou 12 meses.',
    seis: 'Experimente 12 meses.',
    doce: 'Experimente Tudo.',
  },
  ayudas: {
    dejaron: (hasta) =>
      `O que você recebeu de cada projeto menos o que gastou nele, nos projetos que você terminou de receber nestes meses. É a receita da fila, a mesma que você vê mês a mês no Início, e inclui o sinal que ficou com você de um projeto perdido. Para comparar meses, leva os valores a pesos de hoje com a inflação do INDEC, que vai até ${hasta}.`,
    dejaronConElIndiceViejo: (hasta) =>
      `O que você recebeu de cada projeto menos o que gastou nele, nos projetos que você terminou de receber nestes meses. É a receita da fila, a mesma que você vê mês a mês no Início, e inclui o sinal que ficou com você de um projeto perdido. A inflação do INDEC que vem nesta versão vai até ${hasta} e faltam os últimos meses, então cada mês fica em pesos do próprio mês.`,
    gastos:
      'Tudo o que saiu de Maun como despesa: as dos projetos, pela categoria que você escolheu, e as da marcenaria, pela categoria da movimentação. O que você paga de outras caixinhas, como as contas da fila, aparece em Finanças.',
    loQueMasUsas:
      'Em quantos projetos você anotou cada item em “O que é preciso”. Conta vezes, não dinheiro nem quantidades, e junta os nomes que só mudam em maiúsculas ou acentos.',
    entregas:
      'Dias corridos desde que você começou até entregar. Metade dos projetos levou menos que isso e a outra metade mais, então um projeto que se arrastou não mexe no número. No prazo é no dia da entrega confirmada ou antes. Os projetos do sistema antigo não têm o dia da entrega.',
    consultas: (desde) =>
      `As consultas que chegaram nestes meses e onde estão hoje. O que você aprovou direto também conta como orçamento. O NUMA registra as etapas desde ${fechaConAnio(desde, 'pt-BR')}.`,
    opiniones:
      'As pesquisas que você enviou nestes meses e o que os clientes responderam. A pesquisa leva o seu nome e o do cliente: não é anônima, então as notas costumam ser altas.',
    viene:
      'Os projetos em andamento, com os dias desde que você começou, e o que falta receber do que você já entregou (o Início soma também o que está em andamento). O tempo que você costuma levar sai das suas entregas dos últimos 12 meses.',
    pesosDeHoy:
      'Os valores de outros meses levados a preços de hoje com a inflação do INDEC, para poder compará-los. Os dois últimos meses ficam como foram recebidos, porque o INDEC ainda não publicou a inflação deles.',
  },
  resumen: {
    loQueTeDejaron: 'O que os projetos te deixaram',
    mas: (porcentaje, rango) => `${porcentaje}% a mais que em ${rango}`,
    menos: (porcentaje, rango) => `${porcentaje}% a menos que em ${rango}`,
    igual: (rango) => `O mesmo que em ${rango}`,
    contandoLaInflacion: 'já contando a inflação',
    enPesosDeCadaMes: 'em pesos de cada mês',
    teDejaron: (rango, monto, cantidad) =>
      `Em ${rango} os projetos te deixaram ${monto}, de ${projetos(cantidad)}`,
    conCasosVas: (cantidad) =>
      `Com ${projetos(cantidad)} em cada período, você vai ver quanto mudou`,
    sinCobrarAntes: (rango) => `Em ${rango} você não recebeu por nenhum projeto`,
    deCada100: (Fuerte, cien, quedaron) => (
      <>
        De cada <Fuerte>{cien}</Fuerte> que você recebeu, ficaram <Fuerte>{quedaron}</Fuerte> para
        você.
      </>
    ),
    seComieron: 'As despesas comeram o que você recebeu nestes meses.',
    elPeriodo: 'o período',
    base: (cobrados, perdidos, enDolares) => {
      const sinais =
        perdidos === 0
          ? null
          : plural(perdidos, { one: 'o sinal de 1 perdido', other: 'o sinal de # perdidos' });
      const dolares = enDolares === 0 ? '' : `, ${String(enDolares)} em dólares contados em pesos`;
      if (cobrados === 0) {
        return sinais === null
          ? ''
          : `${sinais.charAt(0).toUpperCase()}${sinais.slice(1)}${dolares}`;
      }
      const pagos = plural(cobrados, { one: '# projeto pago', other: '# projetos pagos' });
      return `${pagos}${sinais === null ? '' : ` e ${sinais}`}${dolares}`;
    },
  },
  tarjetas: {
    nombre: 'Os números do período',
    sinDato: '—',
    kDeN: (Chico, cuantos, deCuantos) => (
      <>
        {String(cuantos)} <Chico>de {String(deCuantos)}</Chico>
      </>
    ),
    porcentaje: (porcentaje) => `${porcentaje}%`,
    gastaste: {
      etiqueta: 'Você gastou',
      debajo: 'nos projetos e na marcenaria',
      vacio: 'Sem despesas nestes meses',
    },
    entrega: {
      etiqueta: 'Tempo de entrega',
      dias: (Chico, numero, cantidad) => (
        <>
          {numero} <Chico>{cantidad === 1 ? 'dia' : 'dias'}</Chico>
        </>
      ),
      entre: (Chico, desde, hasta) => (
        <>
          {desde} a {hasta} <Chico>dias</Chico>
        </>
      ),
      aTiempo: (aTiempo, total) => `${String(aTiempo)} de ${String(total)} no prazo`,
      aTiempoConPorcentaje: (porcentaje, aTiempo, total) =>
        `${porcentaje}% no prazo (${String(aTiempo)} de ${String(total)})`,
      deAUna: (entregas) => plural(entregas, { one: '1 entrega', other: '# entregas, uma a uma' }),
      sinPromesas: 'sem data prometida',
      vacio: 'Sem entregas nestes meses',
    },
    aprobaron: {
      etiqueta: 'Aprovados',
      debajo: (esperan) =>
        esperan === 0
          ? 'orçamentos'
          : plural(esperan, {
              one: 'orçamentos · 1 aguarda',
              other: 'orçamentos · # aguardam',
            }),
      debajoConCuenta: (cuantos, deCuantos, esperan) =>
        esperan === 0
          ? `${String(cuantos)} de ${String(deCuantos)} orçamentos`
          : `${String(cuantos)} de ${String(deCuantos)} orçamentos · ${String(esperan)} ${
              esperan === 1 ? 'aguarda' : 'aguardam'
            }`,
      vacio: 'Sem orçamentos nestes meses',
    },
    conformes: {
      etiqueta: 'Gostaram',
      debajo: 'clientes que responderam',
      debajoConCuenta: (cuantos, deCuantos) =>
        `${String(cuantos)} de ${String(deCuantos)} clientes que responderam`,
      vacio: 'Sem respostas nestes meses',
    },
  },
  secciones: {
    dejaron: 'Quanto os projetos me deixaram?',
    gastos: 'Para onde vai o meu dinheiro?',
    entregas: 'Eu entrego no prazo?',
    consultas: 'Quantos orçamentos são aprovados?',
    opiniones: 'O que os meus clientes acham?',
    viene: 'O que vem por aí?',
  },
  dejaron: {
    frase: (Fuerte, cobrados, total) => (
      <>
        Você recebeu por <Fuerte>{projetos(cobrados)}</Fuerte> e eles te deixaram{' '}
        <Fuerte>{total}</Fuerte>.
      </>
    ),
    fraseSoloSenas: (Fuerte, perdidos, total) => (
      <>
        Você não recebeu por nenhum projeto, e ficou com <Fuerte>{total}</Fuerte> do sinal de{' '}
        {plural(perdidos, { one: '1 projeto perdido', other: '# projetos perdidos' })}.
      </>
    ),
    mejorMes: (Fuerte, mes, monto, cantidad) => (
      <>
        {mes} foi o seu melhor mês: <Fuerte>{monto}</Fuerte> de {projetos(cantidad)}.
      </>
    ),
    mejorTrimestre: (Fuerte, trimestre, monto, cantidad) => (
      <>
        O seu melhor trimestre foi {trimestre}: <Fuerte>{monto}</Fuerte> de {projetos(cantidad)}.
      </>
    ),
    mejorAnio: (Fuerte, anio, monto, cantidad) => (
      <>
        {anio} foi o seu melhor ano: <Fuerte>{monto}</Fuerte> de {projetos(cantidad)}.
      </>
    ),
    subtitulo:
      'Pelo mês em que você terminou de receber cada projeto. Os meses anteriores, levados a pesos de hoje.',
    subtituloEnPesosDeCadaMes:
      'Pelo mês em que você terminou de receber cada projeto, em pesos de cada mês.',
    figura: 'O que os projetos te deixaram, mês a mês',
    tocaUnMes: 'Toque em um mês para ver quanto ele deixou e quais foram os projetos.',
    tocaUnaColumna: 'Toque em uma coluna para ver quanto ela deixou e quais foram os projetos.',
    lectura: (Fuerte, monto, cuando, cantidad) => (
      <>
        <Fuerte>{monto}</Fuerte> em {cuando} · {projetos(cantidad)}
      </>
    ),
    lecturaConHoy: (Fuerte, deHoy, cuando, comoSeCobro, cantidad) => (
      <>
        <Fuerte>{deHoy}</Fuerte> em {cuando}, em pesos de hoje · {comoSeCobro} como foi recebido ·{' '}
        {projetos(cantidad)}
      </>
    ),
    lecturaSinTrabajos: (cuando) => `Em ${cuando} você não recebeu por nenhum projeto.`,
    verLosDe: (cantidad, cuando) =>
      cantidad === 1
        ? `Ver o projeto de ${cuando}`
        : `Ver os ${String(cantidad)} projetos de ${cuando}`,
    columna: (cuando, monto, cantidad) =>
      `${cuando}: ${monto} em pesos de hoje, ${projetos(cantidad)}`,
    columnaEnPesosDeCadaMes: (cuando, monto, cantidad) =>
      `${cuando}: ${monto}, ${projetos(cantidad)}`,
    columnaVacia: (cuando) => `${cuando}: nenhum projeto recebido`,
    sinRegistro: 'sem registro',
    hastaHoy: (cuando) => `* ${cuando}, até hoje.`,
    trabajosDe: (cuando) => `Os projetos de ${cuando}`,
    trabajosDelPeriodo: 'Os projetos do período',
    cobradoEl: (dia) => `recebido em ${dia}`,
    senaDeUnPerdido: 'sinal de um projeto perdido',
    cuenta: (cobrado, gastos) => `${cobrado} − ${gastos}`,
    totalDe: (cuando) => `Total de ${cuando}`,
    totalDelPeriodo: 'Total do período',
    verLosDelPeriodo: (cantidad) =>
      cantidad === 1 ? 'Ver o projeto' : `Ver os ${String(cantidad)} projetos`,
    esconderLaLista: 'Esconder a lista',
    vacio: (rango) => `Em ${rango} você não recebeu por nenhum projeto.`,
    vacioDeTodo: 'Você ainda não recebeu por nenhum projeto.',
    estimado: {
      titulo: 'O que você estimou e o que ficou para você',
      deCadaCien: (cien) => `de cada ${cien} de cada projeto`,
      loQueEstimaste: 'o que você estimou',
      loQueTeQuedo: 'o que ficou',
      descripcion: (titulo, estimado, real, cien) =>
        `${titulo}: você estimou ${estimado} de cada ${cien} e ficaram ${real}`,
      verTodos: (cantidad) => `Ver os ${String(cantidad)} projetos`,
      verMenos: 'Ver menos',
      sinCostos:
        'Quando você registrar os custos estimados de um projeto, vai ver aqui quanto ficou contra o que você estimou.',
    },
    tabla: {
      titulo: {
        mes: 'O que os projetos te deixaram, por mês.',
        trimestre: 'O que os projetos te deixaram, por trimestre.',
        anio: 'O que os projetos te deixaram, por ano.',
      },
      enNegrita: 'Em negrito, o período escolhido.',
      cuando: { mes: 'Mês', trimestre: 'Trimestre', anio: 'Ano' },
      trabajos: 'Projetos',
      comoSeCobro: 'Como foi recebido',
      enPesosDeHoy: 'Em pesos de hoje',
      hastaHoy: (cuando) => `${cuando} (até hoje)`,
    },
  },
  gastos: {
    frase: (Fuerte, cuando, total, enLosTrabajos, enElTaller) => (
      <>
        {cuando} você gastou <Fuerte>{total}</Fuerte>: <Fuerte>{enLosTrabajos}</Fuerte> nos projetos
        e <Fuerte>{enElTaller}</Fuerte> na marcenaria.
      </>
    ),
    fraseSoloTrabajos: (Fuerte, cuando, total) => (
      <>
        {cuando} você gastou <Fuerte>{total}</Fuerte>, tudo nos projetos.
      </>
    ),
    fraseSoloTaller: (Fuerte, cuando, total) => (
      <>
        {cuando} você gastou <Fuerte>{total}</Fuerte>, tudo na marcenaria.
      </>
    ),
    subtitulo:
      'Pelo dia de cada despesa. As dos projetos vão pela categoria que você escolheu ao registrá-las.',
    figura: 'O que você gastou, por categoria',
    enLosTrabajos: 'Nos projetos',
    enElTaller: 'Na marcenaria',
    sinCategoria: 'Sem categoria',
    falta: (monto) =>
      `${monto} são despesas sem categoria. A partir de agora, ao registrar uma despesa no projeto, você escolhe se foi madeira, ferragens, frete, ajudante ou outro.`,
    loQueMasUsas: 'O que você mais usa',
    enCuantosTrabajos: 'em quantos projetos você anotou em “O que é preciso”',
    materiales: 'Materiais',
    herrajes: 'Ferragens',
    enTrabajos: (Chico, cantidad) => (
      <>
        {String(cantidad)} <Chico>{cantidad === 1 ? 'projeto' : 'projetos'}</Chico>
      </>
    ),
    yMas: (cantidad) => `e mais ${String(cantidad)}`,
    sinMateriales: 'Sem materiais nestes meses.',
    sinHerrajes: 'Sem ferragens nestes meses.',
    sinNadaAnotado:
      'Quando você anotar materiais e ferragens em “O que é preciso” dos seus projetos, vai ver aqui quais você mais usa.',
    tabla: {
      titulo: 'O que você gastou, por categoria',
      categoria: 'Categoria',
      monto: 'Valor',
      deCadaCien: (cien) => `De cada ${cien} gastos`,
      enLosTrabajos: (categoria) => `${categoria}, nos projetos`,
      enElTaller: (categoria) => `${categoria}, na marcenaria`,
    },
    irAFinanzas: 'Ver as despesas em Finanças',
    vacio: (rango) => `Em ${rango} você não registrou despesas.`,
    vacioDeTodo: 'Você ainda não registrou despesas.',
  },
  entregas: {
    frase: (Fuerte, aTiempo, conFecha, tardas) => (
      <>
        Você entregou{' '}
        <Fuerte>
          {String(aTiempo)} de {String(conFecha)}
        </Fuerte>{' '}
        projetos no dia prometido ou antes. Você leva <Fuerte>{tardas}</Fuerte>: metade dos projetos
        leva menos.
      </>
    ),
    fraseConPorcentaje: (Fuerte, aTiempo, conFecha, porcentaje, tardas) => (
      <>
        Você entregou{' '}
        <Fuerte>
          {String(aTiempo)} de {String(conFecha)}
        </Fuerte>{' '}
        projetos ({porcentaje}%) no dia prometido ou antes. Você leva <Fuerte>{tardas}</Fuerte>:
        metade dos projetos leva menos.
      </>
    ),
    fraseSinPromesas: (Fuerte, tardas) => (
      <>
        Você leva <Fuerte>{tardas}</Fuerte>: metade dos projetos leva menos.
      </>
    ),
    fraseConPocos: (Fuerte, cantidad, tardaste, faltan) => (
      <>
        Você entregou <Fuerte>{projetos(cantidad)}</Fuerte>: levaram {tardaste}. Com mais{' '}
        {plural(faltan, { one: '1 entrega', other: '# entregas' })} você vai ver quanto costuma
        levar.
      </>
    ),
    subtitulo: (cantidad, cuando) =>
      cantidad === 1
        ? `O projeto que você entregou ${cuando}, desde que começou até entregar, em dias corridos.`
        : `Os ${String(cantidad)} projetos que você entregou ${cuando}, desde que começou até entregar, em dias corridos.`,
    subtituloSinEntregas: 'Desde que você começou até entregar, em dias corridos.',
    aTiempo: 'no prazo',
    tarde: 'atrasado',
    sinFecha: 'sem data prometida',
    figura: 'Quantos dias cada projeto levou',
    mediana: (dias) => `metade, em menos de ${dias}`,
    cota: (desde, hasta) => `de ${desde} a ${hasta} dias`,
    diasCortos: (dias) => `${dias} d`,
    atraso: (dias) => `+${String(dias)}`,
    tardeDias: (dias) => plural(dias, { one: '1 dia de atraso', other: '# dias de atraso' }),
    punto: (titulo, dias, como) => `${titulo}: ${dias}, ${como}`,
    lectura: (Fuerte, titulo, dias, como) => (
      <>
        <Fuerte>{titulo}</Fuerte> · {dias} · {como}
      </>
    ),
    tocaUnPunto: 'Toque em um ponto para ver de qual projeto é.',
    verElTrabajo: 'Ver o projeto',
    porTipo: 'Por tipo de projeto',
    medianaDesde: (cantidad) => `mediana a partir de ${String(cantidad)} projetos de um tipo`,
    deAUno: 'Um a um:',
    tabla: {
      titulo: 'As entregas do período, uma a uma',
      trabajo: 'Projeto',
      arranco: 'Começou',
      entrego: 'Entregou',
      dias: 'Dias',
      prometida: 'Data prometida',
      comoLlego: 'Como chegou',
      aTiempo: 'No prazo',
      tarde: (dias) => plural(dias, { one: '1 dia de atraso', other: '# dias de atraso' }),
      sinFecha: 'Sem data prometida',
    },
    irAlAnalitico: 'Ver a Análise das entregas',
    vacio: (rango) => `Em ${rango} você não entregou projetos com o dia da entrega.`,
    vacioDeTodo: 'Você ainda não entregou projetos com o dia da entrega.',
  },
  consultas: {
    frase: (Fuerte, cuantas, presupuestos, trabajosHechos, esperan, desde) => (
      <>
        De <Fuerte>{consultas(cuantas)}</Fuerte> que {cuantas === 1 ? 'chegou' : 'chegaram'}
        {desde === null ? '' : ` desde ${desde}`},{' '}
        {presupuestos === 0 ? (
          'você não enviou orçamentos'
        ) : (
          <>
            você enviou orçamento para <Fuerte>{String(presupuestos)}</Fuerte>
          </>
        )}{' '}
        e{' '}
        {trabajosHechos === 0 ? (
          'nenhuma virou projeto.'
        ) : (
          <>
            <Fuerte>{String(trabajosHechos)}</Fuerte>{' '}
            {trabajosHechos === 1 ? 'virou projeto.' : 'viraram projetos.'}
          </>
        )}
        {esperan === 0
          ? ''
          : ` ${plural(esperan, { one: '1 orçamento aguarda resposta.', other: '# orçamentos aguardam resposta.' })}`}
      </>
    ),
    subtitulo: (cuando) => `As consultas que chegaram ${cuando}, e onde estão hoje.`,
    antesDelRegistro: (desde) =>
      `O NUMA registra as etapas desde ${fechaConAnio(desde, 'pt-BR')}: o que veio antes não tem data.`,
    figura: 'Das consultas aos projetos',
    pasos: {
      consultas: 'Consultas',
      presupuestos: 'Orçamentos enviados',
      trabajos: 'Viraram projetos',
    },
    cuenta: (Fuerte, cuantas, deCuantas) => (
      <>
        <Fuerte>{String(cuantas)}</Fuerte> de {String(deCuantas)}
      </>
    ),
    primera: (Fuerte, cuantas) => <Fuerte>{String(cuantas)}</Fuerte>,
    perdiste: (perdidas, despues, antes) =>
      perdidas === 0
        ? 'Você não perdeu nenhuma.'
        : `Você perdeu ${String(perdidas)}: ${String(despues)} depois do orçamento e ${String(antes)} antes.`,
    siguenAbiertas: (abiertas) =>
      abiertas === 0
        ? ''
        : plural(abiertas, {
            one: ' 1 continua em aberto.',
            other: ' # continuam em aberto.',
          }),
    presupuestosQueMandaste: 'Os orçamentos que você enviou',
    unoPorPresupuesto: 'um por orçamento',
    aprobados: (Fuerte, cuantos) => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte> {cuantos === 1 ? 'aprovado' : 'aprovados'}
      </>
    ),
    perdidos: (Fuerte, cuantos) => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte> {cuantos === 1 ? 'perdido' : 'perdidos'}
      </>
    ),
    esperan: (Fuerte, cuantos) => (
      <>
        <Fuerte>{String(cuantos)}</Fuerte>{' '}
        {cuantos === 1 ? 'aguarda resposta' : 'aguardam resposta'}
      </>
    ),
    sinCasos: '—',
    alPresupuesto: 'da consulta ao orçamento',
    aLaRespuesta: 'do orçamento à resposta',
    medianaDe: (cuantos) => `mediana de ${String(cuantos)}`,
    faltan: (embudo, tiempos, casos) => {
      const paraOFunil =
        embudo === null
          ? null
          : `Com ${consultas(embudo)} você vai ver o caminho da consulta ao projeto`;
      if (tiempos === null) return `${paraOFunil ?? ''}.`;
      const oQue = O_QUE_FALTA_PARA_OS_TEMPOS[tiempos];
      const comQuantos = casosParaOsTempos(tiempos, casos);
      return paraOFunil === null
        ? `Com ${comQuantos} você vai ver ${oQue}.`
        : `${paraOFunil}, e com ${comQuantos}, ${oQue}.`;
    },
    tabla: {
      titulo: 'Das consultas aos projetos',
      paso: 'Etapa',
      cuantas: 'Quantas',
      deCuantas: 'De quantas',
      tiempos: 'Quanto leva cada etapa',
      tiempo: 'Etapa',
      mediana: 'Metade, em menos de',
      sobreCuantos: 'Sobre quantos',
      sinDato: '—',
    },
    verLas: (cuantas) => (cuantas === 1 ? 'Ver a consulta' : `Ver as ${String(cuantas)} consultas`),
    esconderLaLista: 'Esconder a lista',
    lasConsultas: 'As consultas do período',
    entro: (dia) => `chegou em ${dia}`,
    donde: {
      trabajo: 'Virou projeto',
      perdida: 'Perdida',
      abierta: 'Em aberto',
    },
    vacio: (rango) => `Em ${rango} não chegaram consultas.`,
    vacioDeTodo: 'Ainda não chegaram consultas desde que o NUMA registra as etapas.',
  },
  opiniones: {
    frase: (Fuerte, conformes, contestaron) => (
      <>
        <Fuerte>
          {String(conformes)} de {String(contestaron)}
        </Fuerte>{' '}
        clientes gostaram ou gostaram muito do móvel.
      </>
    ),
    fraseConPorcentaje: (Fuerte, conformes, contestaron, porcentaje) => (
      <>
        <Fuerte>
          {String(conformes)} de {String(contestaron)}
        </Fuerte>{' '}
        clientes ({porcentaje}%) gostaram ou gostaram muito do móvel.
      </>
    ),
    fraseConPocos: (Fuerte, contestaron, conformes, todosMuyConformes) => {
      if (contestaron === 1) {
        return conformes === 1 ? (
          <>
            <Fuerte>1 cliente</Fuerte> respondeu e{' '}
            {todosMuyConformes ? 'gostou muito' : 'gostou ou gostou muito'} do móvel.
          </>
        ) : (
          <>
            <Fuerte>1 cliente</Fuerte> respondeu.
          </>
        );
      }
      const quem =
        conformes === contestaron
          ? `os ${String(contestaron)} ${todosMuyConformes ? 'gostaram muito' : 'gostaram ou gostaram muito'}`
          : conformes === 0
            ? 'nenhum gostou ou gostou muito'
            : `${String(conformes)} gostaram ou gostaram muito`;
      return (
        <>
          <Fuerte>{`${String(contestaron)} clientes`}</Fuerte> responderam, e {quem} do móvel.
        </>
      );
    },
    fraseSinEscala: (Fuerte, contestaron) => (
      <>
        <Fuerte>{contestaron === 1 ? '1 cliente' : `${String(contestaron)} clientes`}</Fuerte>{' '}
        {contestaron === 1 ? 'respondeu' : 'responderam'}.
      </>
    ),
    sinRespuestas: (enviadas) =>
      plural(enviadas, {
        one: 'Você enviou 1 pesquisa e ninguém respondeu ainda.',
        other: 'Você enviou # pesquisas e ninguém respondeu ainda.',
      }),
    subtitulo: (enviadas, cuando, contestaron) =>
      enviadas === 1
        ? `Da pesquisa que você enviou ${cuando}, ${contestaron === 1 ? 'você recebeu resposta' : 'ainda não há resposta'}.`
        : `Das ${String(enviadas)} pesquisas que você enviou ${cuando}, ${String(contestaron)} foram respondidas.`,
    subtituloSinEncuestas: (cuando) =>
      `As pesquisas que você enviou ${cuando} e o que os clientes responderam.`,
    unPuntoPorPersona: 'um ponto por pessoa',
    losDosDeArriba: 'as duas de cima da escala',
    elResto: 'o resto',
    tiempos: 'Prazos',
    trato: 'Atendimento',
    kDeN: (cuantos, deCuantos) => `${String(cuantos)} de ${String(deCuantos)}`,
    kDeNConPorcentaje: (cuantos, deCuantos, porcentaje) =>
      `${String(cuantos)} de ${String(deCuantos)} (${porcentaje}%)`,
    irAOpiniones: 'Ver as respostas em Opiniões',
    vacio: (rango) => `Em ${rango} você não enviou pesquisas.`,
    vacioDeTodo: 'Você ainda não enviou pesquisas.',
  },
  viene: {
    frase: (Fuerte, enCurso, listos, teDeben, entregados) => (
      <>
        {enCurso === 0 ? (
          'Você não tem projetos em andamento.'
        ) : (
          <>
            Você tem{' '}
            <Fuerte>
              {enCurso === 1
                ? '1 projeto em andamento'
                : `${String(enCurso)} projetos em andamento`}
            </Fuerte>
            {listos === 0
              ? '.'
              : enCurso === 1
                ? ', e ele já está pronto.'
                : listos === 1
                  ? ', e 1 já está pronto.'
                  : `, e ${String(listos)} já estão prontos.`}
          </>
        )}
        {teDeben === null ? null : (
          <>
            {' '}
            Falta receber <Fuerte>{teDeben}</Fuerte> de{' '}
            {entregados === 1 ? '1 projeto entregue' : `${String(entregados)} projetos entregues`}.
          </>
        )}
      </>
    ),
    nada: 'Você não tem projetos em andamento nem nada a receber.',
    yEnDolares: (pesos, dolares) => `${pesos} e ${dolares}`,
    subtitulo: (hoy) => `Hoje, ${hoy}. Isto não muda com o período.`,
    enCurso: 'Em andamento',
    diasContraLoNormal: 'dias desde que você começou, contra o tempo que você costuma levar',
    diasDesdeQueArrancaste: 'dias desde que você começou',
    loNormal: (dias) => `${dias}, o que você costuma levar`,
    hastaLaPromesa: 'até a data prometida',
    detalle: (dias, cuando) => `${dias} · ${cuando}`,
    prometidoParaHoy: 'Prometido para hoje',
    prometidoParaElDia: (fecha) => `Prometido para ${oDia(fecha)}`,
    prometidoPara: (dia) => `Prometido para ${dia}`,
    estimadoParaHoy: 'Previsto para hoje',
    estimadoParaElDia: (fecha) => `Previsto para ${oDia(fecha)}`,
    estimadoPara: (dia) => `Previsto para ${dia}`,
    sinFechaPrometida: 'Sem data prometida',
    sinArranque: 'Sem data de início',
    listo: 'Pronto',
    atrasado: (dias) => plural(dias, { one: '1 dia de atraso', other: '# dias de atraso' }),
    paso: (dias) => `Passou de ${dias}`,
    porCobrar: 'A receber',
    delMasViejo: 'do que você já entregou, do mais antigo ao mais novo',
    entregado: (cuando) => `entregue ${cuando}`,
    sinDiaDeEntrega: 'sem dia de entrega',
    teDeben: 'Falta receber',
    irAActivos: 'Ver os ativos',
  },
} satisfies Mensajes['paginaEstadisticas'];
