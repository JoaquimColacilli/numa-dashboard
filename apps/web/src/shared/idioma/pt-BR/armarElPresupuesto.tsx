import type { Mensajes } from '../es';
import { plural } from './plural';

function conPuntoFinal(frase: string): string {
  return frase.endsWith('.') ? frase : `${frase}.`;
}

export const armarElPresupuesto = {
  titulo: 'Orçamento',
  cerrar: 'Fechar',
  pestanas: {
    queMirar: 'O que ver',
    armarlo: 'Preparar',
    comoLoVe: 'Ver como o cliente vê',
  },
  guardado: {
    seGuardaSolo: 'Salva sozinho enquanto você prepara',
    hoy: 'Salvo hoje',
    el: (fecha) => `Salvo em ${fecha}`,
  },
  asiLoVeria:
    'É assim que o cliente veria se você enviasse hoje. A página do cliente não muda até você enviar.',
  verElPdf: 'Ver PDF',
  pdf: 'PDF',
  mandarElPresupuesto: 'Enviar orçamento',
  mandarLaRevision: (revision) => `Enviar revisão ${String(revision)}`,
  seNumeraCuandoVuelvaLaSenal: 'Recebe o número quando a internet voltar.',
  opcion: (letra) => `Opção ${letra}`,
  encabezado: {
    titulo: 'Cabeçalho',
    bajada: 'O número, a data e o cliente aparecem sozinhos. O título e a obra vão no topo.',
    numero: 'Número',
    seAsignaAlMandarlo: 'Definido ao enviar',
    numeroYProxima: (numero, revision) => `Nº ${numero} · próxima: Rev. ${String(revision)}`,
    llevaElDia: (ejemplo) => `Leva a data em que você enviar, como ${ejemplo}.`,
    elNumeroNoCambia: 'O número não muda: cada vez que você envia, a revisão sobe.',
    cliente: 'Cliente',
    sinCliente: 'Sem cliente',
    saleDeSuFicha: 'Vem da ficha do cliente.',
    tituloDelTrabajo: 'Título',
    ejemploDelTitulo: 'Cozinha, armário do quarto…',
    obra: 'Obra',
    ejemploDeLaObra: 'Rua e número, bairro',
    plazo: 'Prazo de fabricação',
    diasHabiles: 'dias úteis',
    ayudaDelPlazo:
      'A partir de quando o sinal é creditado. O aviso do prazo e a previsão de entrega usam este número.',
  },
  validez: {
    titulo: 'Validade',
    dias: (dias) => plural(dias, { one: '# dia', other: '# dias' }),
    otro: 'Outro',
    sinVencimiento: 'Sem vencimento',
    cuantosDias: 'Quantos dias vale',
    diasCorridos: 'dias corridos',
    sinFechaLimite: 'O cliente não vê uma data limite.',
    valeHasta: (fecha) => conPuntoFinal(`Se você enviar hoje, vale até ${fecha}`),
    salenDeAjustes: (dias) =>
      plural(dias, {
        one: 'O # dia vem das Configurações.',
        other: 'Os # dias vêm das Configurações.',
      }),
  },
  detalle: {
    titulo: 'Detalhes',
    bajada: 'Cada móvel com nome e descrição técnica, na ordem em que o cliente vai ler.',
    cuantos: (cuantos) => plural(cuantos, { '=0': '0 móveis', one: '# móvel', other: '# móveis' }),
    descripcionGeneral: 'Descrição geral',
    opcional: '(opcional)',
    ejemploGeneral: 'O que vale para todo o projeto: a linha, os materiais, como abrem as frentes…',
    muebles: 'Móveis',
    todosConDescripcion: 'todos com descrição',
    conDescripcion: (conDescripcion, total) =>
      `${String(conDescripcion)} de ${String(total)} com descrição`,
    sinMuebles: 'Sem móveis. Adicione pelo menos um com descrição para poder enviar.',
    quiteElMueble: 'Móvel removido.',
    quiteElMuebleLlamado: (nombre) => `Móvel removido: “${nombre}”.`,
    agregarUnMueble: 'Adicionar móvel',
    mueble: {
      nombre: (numero) => `Nome do móvel ${String(numero)}`,
      ejemploDelNombre: 'Gabinete de pia, armário aéreo, guarda-roupa…',
      descripcionTecnica: 'Descrição técnica',
      ejemploDeLaDescripcion:
        'Gabinete de pia em L 2,07 x 1,83, altura 880 mm, em MDP melamínico branco de 18 mm…',
      queLleva: 'Medidas, material e espessura, cor e marca da chapa.',
      subir: (numero) => `Mover o móvel ${String(numero)} para cima`,
      subirLlamado: (nombre) => `Mover “${nombre}” para cima`,
      bajar: (numero) => `Mover o móvel ${String(numero)} para baixo`,
      bajarLlamado: (nombre) => `Mover “${nombre}” para baixo`,
      quitar: (numero) => `Remover o móvel ${String(numero)}`,
      quitarLlamado: (nombre) => `Remover “${nombre}”`,
    },
  },
  herrajes: {
    titulo: 'Ferragens',
    bajada:
      'Uma por linha, com as especificações. Você pode trazer as de “O que é preciso”: vêm sem as quantidades.',
    cuantos: (cuantos) => plural(cuantos, { one: '# ferragem', other: '# ferragens' }),
    cuantosSinMostrar: (cuantos) =>
      plural(cuantos, {
        one: '# ferragem · não aparece',
        other: '# ferragens · não aparecem',
      }),
    mostrarlos: 'Mostrar no orçamento',
    noVan: 'Não vão no orçamento. A lista fica salva caso você volte a mostrar.',
    todaviaNoHay: 'Ainda não há ferragens. Traga de “O que é preciso” ou digite aqui embaixo.',
    herraje: (numero) => `Ferragem ${String(numero)}`,
    sacarElHerraje: (numero) => `Remover ferragem ${String(numero)}`,
    traje: (cuantos) =>
      plural(cuantos, {
        one: '# ferragem trazida de “O que é preciso”.',
        other: '# ferragens trazidas de “O que é preciso”.',
      }),
    yaEstanTodos: 'Todas as ferragens de “O que é preciso” já estão aqui.',
    agregarUnHerraje: 'Adicionar ferragem',
    ejemploDelHerraje: 'Corrediças, dobradiças, pistões…',
    traer: 'Trazer de “O que é preciso”',
  },
  casillas: {
    aTenerEnCuenta: {
      titulo: 'Observações',
      bajada: 'O que este projeto não inclui. Marque o que o cliente precisa saber.',
      ejemplo: 'Não inclui a retirada dos móveis existentes.',
      propia: (numero) => `Observações: item extra ${String(numero)}`,
      sacarLaPropia: (numero) => `Remover o item extra ${String(numero)} de Observações`,
    },
    incluye: {
      titulo: 'Incluso',
      bajada: 'O que vai incluso. Os de sempre já vêm marcados.',
      ejemplo: 'Retirada das sobras da montagem.',
      propia: (numero) => `Incluso: item extra ${String(numero)}`,
      sacarLaPropia: (numero) => `Remover o item extra ${String(numero)} de Incluso`,
    },
    avisos: {
      titulo: 'Avisos',
      bajada: 'Seus textos de sempre, com os números deste orçamento.',
      ejemplo: 'A data de produção é reservada conforme a agenda da marcenaria…',
      propia: (numero) => `Avisos: item extra ${String(numero)}`,
      sacarLaPropia: (numero) => `Remover o item extra ${String(numero)} de Avisos`,
    },
    condiciones: {
      titulo: 'Condições',
      bajada: 'O que o cliente precisa garantir para a montagem.',
      ejemplo: 'O prédio deve permitir o uso do elevador…',
      propia: (numero) => `Condições: item extra ${String(numero)}`,
      sacarLaPropia: (numero) => `Remover o item extra ${String(numero)} de Condições`,
    },
    van: (van, total) => `${String(van)} de ${String(total)} no orçamento`,
    apareceCuandoPague: 'Aparece quando o cliente pagar algo: diz quanto já foi pago.',
    soloEnEste: 'Só neste orçamento',
    agregarOtra: 'Adicionar outra',
  },
  sena: {
    conElTotal: {
      taller: (porcentaje) => `Com o total, aqui aparece o sinal de ${porcentaje} da marcenaria.`,
      trabajo: (porcentaje) => `Com o total, aqui aparece o sinal de ${porcentaje} deste projeto.`,
    },
    conElTotalYLoPagado: {
      taller: (porcentaje, pagado) =>
        `Com o total, aqui aparece o sinal de ${porcentaje} da marcenaria e o que já foi pago (${pagado}).`,
      trabajo: (porcentaje, pagado) =>
        `Com o total, aqui aparece o sinal de ${porcentaje} deste projeto e o que já foi pago (${pagado}).`,
    },
    laQueLeVasAPedir: 'O sinal que você vai pedir',
    senaDel: {
      taller: (porcentaje) => `Sinal de ${porcentaje} da marcenaria`,
      trabajo: (porcentaje) => `Sinal de ${porcentaje} deste projeto`,
    },
    yaPago: 'Já pago',
    leFaltaParaLaSena: 'Falta para o sinal',
    segunLaQueElija: {
      taller: (porcentaje) => `O sinal de ${porcentaje} da marcenaria, conforme a opção escolhida`,
      trabajo: (porcentaje) => `O sinal de ${porcentaje} deste projeto, conforme a opção escolhida`,
    },
    yaPagoSeDescuenta: (Monto, monto) => (
      <>
        Já foi pago <Monto>{monto}</Monto>: o valor é descontado do sinal da opção escolhida.
      </>
    ),
  },
  valores: {
    titulo: 'Valores',
    bajada:
      'É o valor do orçamento do projeto: se mudar aqui, muda também na ficha. O app calcula o sinal.',
    opciones: (cuantas) => plural(cuantas, { one: '# opção', other: '# opções' }),
    queIncluye: (letra) => `O que a opção ${letra} inclui`,
    ejemploDeLaOpcion: 'O que a diferencia: frentes, material, um móvel a mais…',
    laAprobo: 'O cliente aprovou',
    importe: (letra) => `Valor da opção ${letra}`,
    quitar: (letra) => `Remover a opção ${letra}`,
    agregarUnaOpcion: 'Adicionar opção',
    total: 'Total do orçamento',
    masDeUnaOpcion: 'Oferecer mais de uma opção',
  },
  formaDePago: {
    titulo: 'Forma de pagamento',
    bajada:
      'Escolha uma das suas formas de sempre e ajuste o texto para este projeto. Não muda o jeito de pagar que o cliente vê na página.',
    noMostrarla: 'Não mostrar',
    noVa: 'A forma de pagamento não vai neste orçamento. Mesmo assim, o cliente vê na página como pagar o sinal.',
    loQueDice: 'O que diz, para este projeto',
    volverAlDeSiempre: 'Voltar ao padrão',
    retocado: 'Ajustado para este projeto. O padrão continua igual em Configurações.',
    laSenaDeEsteTrabajo: (sena) => `O sinal deste projeto é de ${sena}.`,
  },
  garantia: {
    titulo: 'Garantia',
    bajada: 'Vai sempre: a lei exige pelo menos 6 meses para um móvel novo.',
    meses: (meses) => plural(meses, { one: '# mês', other: '# meses' }),
    seCambiaEnAjustes: 'Mude em Configurações',
  },
  mandar: {
    campos: {
      titulo: 'Título',
      muebles: 'Detalhes',
      valores: 'Valores',
      queCambio: 'O que mudou',
    },
    loQueFalta: {
      titulo: 'Dê um título ao projeto.',
      muebles: 'Descreva pelo menos um móvel.',
      total: 'Informe o total do orçamento.',
      opciones: 'Cada opção precisa de um valor.',
      queCambio: 'Conte ao cliente o que mudou.',
      queCambioLargo: 'O que mudou precisa caber em 280 caracteres.',
    },
    leFaltaAlgo: 'Falta algo para enviar',
    noSePudoMandar: 'Não foi possível enviar o orçamento.',
    numeroYCliente: (numero, cliente) => `Nº ${numero} · ${cliente}`,
    quePasa: 'O que acontece ao enviar',
    loVeYLoPuedeBajar:
      'O cliente vê na página com o número e a data de hoje, e pode baixar em PDF.',
    loVeArribaDeLoQueCambio:
      'O cliente vê na página com o número e a data de hoje, com o que mudou no topo.',
    noVence: 'Não vence: não mostramos uma data limite.',
    valeHasta: (fecha) => conPuntoFinal(`Vale até ${fecha}`),
    pasaA: (estado) => <>Passa para {estado}</>,
    seTilda: '“Preparar o orçamento” fica marcado em O que falta.',
    quedaGuardada: (revision) =>
      `A revisão ${String(revision)} fica salva na ficha do projeto, com o PDF.`,
    queCambio: 'O que mudou',
    contador: (usados, maximo) => `${String(usados)} de ${String(maximo)}`,
    ejemploDeQueCambio: 'Mudamos o armário aéreo para Cinza Grafite e adicionamos…',
    loLeeTuCliente: 'O cliente lê no topo do orçamento. É obrigatório para enviar uma revisão.',
    cancelar: 'Cancelar',
    mandando: 'Enviando…',
    mandar: 'Enviar',
    guardando: 'Salvando…',
    listo: {
      titulo: 'Enviado',
      numero: (numero) => `Nº ${numero}`,
      numeroYRevision: (numero, revision) => `Nº ${numero} · Rev. ${String(revision)}`,
      yaLoPuedeVer: (nombre) => `${nombre} já pode ver na própria página.`,
      tuClienteYaLoPuedeVer: 'O cliente já pode ver na própria página.',
      yaVeLaRevision: (nombre, revision) =>
        `${nombre} já vê a revisão ${String(revision)} na própria página.`,
      tuClienteYaVeLaRevision: (revision) =>
        `O cliente já vê a revisão ${String(revision)} na própria página.`,
      avisale: 'Avise pelo WhatsApp',
      conElEnlace: (Mensaje, mensaje) => (
        <>
          “<Mensaje>{mensaje}</Mensaje>”, com o link para a página do cliente.
        </>
      ),
      sinEnlace: 'Ainda não tem link: ao tocar, ele é criado e vai na mensagem.',
      mandarleElLink: 'Enviar o link pelo WhatsApp',
      descargarElPdf: 'Baixar PDF',
    },
    anotado: {
      titulo: 'Salvo sem internet',
      elPresupuesto: 'O orçamento',
      laRevision: (revision) => `A revisão ${String(revision)}`,
      quedoEnLaCola: (nombre) =>
        `Ficou na fila: assim que a internet voltar, é enviado sozinho, com o número, e ${nombre} vê na própria página. O link pelo WhatsApp vai estar no cartão do orçamento quando for enviado.`,
      quedoEnLaColaTuCliente:
        'Ficou na fila: assim que a internet voltar, é enviado sozinho, com o número, e o cliente vê na própria página. O link pelo WhatsApp vai estar no cartão do orçamento quando for enviado.',
      listo: 'Concluir',
    },
  },
  tarjeta: {
    todaviaSinTotal: 'Ainda sem total.',
    total: 'Total',
    acordadoAlAprobar: (monto) => `Combinado na aprovação: ${monto}`,
    todaviaSinMuebles: 'Ainda sem móveis.',
    muebles: 'Móveis',
    sinNombre: 'Sem nome',
    rev: (revision) => `Rev. ${String(revision)}`,
    laPrimera: 'A primeira que você enviou.',
    revisionesAnteriores: 'Revisões anteriores',
    armaloAca:
      'Prepare aqui e o cliente vê na própria página: os detalhes, o que está incluso, as condições e o total. Também dá para baixar em PDF.',
    armarElPresupuesto: 'Preparar o orçamento',
    borrador: 'Rascunho',
    sinTituloTodavia: 'Ainda sem título',
    guardadoHoySinNumero: 'Salvo hoje · Ainda sem número',
    guardadoElSinNumero: (fecha) => `Salvo em ${fecha} · Ainda sem número`,
    seguirArmandolo: 'Continuar preparando',
    mandado: (cuando) => `Enviado ${cuando}`,
    vencio: (fecha) => `Venceu em ${fecha}: envie uma revisão ou mude a data.`,
    queCambioEnLaRevision: (revision) => `O que mudou na revisão ${String(revision)}`,
    cambiosSinMandar: (revision) =>
      `Você tem alterações não enviadas: o cliente continua vendo a revisão ${String(revision)}.`,
    hacerCambios: 'Fazer alterações',
    aceptado: 'Aceito',
    loAcepto: (fecha) => `Aceito em ${fecha}: é o orçamento do projeto.`,
    loAceptoConLaOpcion: (fecha, letra) =>
      `Aceito em ${fecha}, com a opção ${letra}: é o orçamento do projeto.`,
  },
} satisfies Mensajes['armarElPresupuesto'];
