import type { Mensajes } from '../es';
import { plural } from './plural';

const cosas = (cantidad: number): string =>
  plural(cantidad, { '=0': '# compromissos', one: '# compromisso', other: '# compromissos' });

const hechas = (cantidad: number): string =>
  plural(cantidad, { '=0': '# concluídos', one: '# concluído', other: '# concluídos' });

export const agenda = {
  categorias: {
    entrega: 'Entrega',
    presupuesto: 'Orçamento',
    visita: 'Visita técnica',
    seguimiento: 'Retorno',
    vencimiento: 'Vencimento',
    materiales: 'Materiais',
    taller: 'Marcenaria',
  },
  ayudaDeLaPropia: {
    materiales: 'comprar, encomendar, retirar',
    taller: 'serviço, recados, recebimentos',
  },
  derivadas: {
    entrega: {
      accion: 'Entregar',
      nombre: (titulo) => `Entregar: ${titulo}`,
      corto: (titulo) => `Entrega: ${titulo}`,
      origen: 'Vem da previsão de entrega do projeto.',
      abrir: 'Abrir o projeto',
      abrirUno: (titulo) => `Abrir o projeto: ${titulo}`,
      hecha: 'entregue',
    },
    visita: {
      accion: 'Visita técnica',
      nombre: (titulo) => `Visita técnica: ${titulo}`,
      corto: (titulo) => `Visita técnica: ${titulo}`,
      origen: 'Vem da data da visita técnica da consulta.',
      abrir: 'Abrir a consulta',
      abrirUno: (titulo) => `Abrir a consulta: ${titulo}`,
      hecha: 'visita feita',
    },
    presupuesto: {
      accion: 'Enviar orçamento',
      nombre: (titulo) => `Enviar orçamento: ${titulo}`,
      corto: (titulo) => `Orçamento: ${titulo}`,
      origen: 'Vem do prazo do orçamento da consulta.',
      abrir: 'Abrir a consulta',
      abrirUno: (titulo) => `Abrir a consulta: ${titulo}`,
      hecha: 'enviado',
    },
    seguimiento: {
      accion: 'Retomar contato com',
      nombre: (nombre) => `Retomar contato com ${nombre}`,
      corto: (nombre) => `Escrever para ${nombre}`,
      origen: 'Vem do retorno do projeto.',
      abrir: 'Abrir o retorno',
      abrirUno: (nombre) => `Abrir o retorno: ${nombre}`,
      hecha: 'contato feito',
    },
  },
  vencimiento: {
    accion: 'Vence',
    nombre: (renglon) => `Vence: ${renglon}`,
    corto: (renglon) => `Vence: ${renglon}`,
    origen: 'Vem do dia de pagamento de uma conta da fila.',
    masAdelante: 'O pagamento pode ser registrado a partir do mês do vencimento.',
    hecha: 'pago',
    pagado: 'Pago',
    registrar: 'Registrar o pagamento',
    verEnTesoros: 'Ver em Caixinhas',
    monto: (monto, tesoro) => `${monto} de ${tesoro}`,
  },
  propiaHecha: 'feita',
  estaComprometida: 'Está confirmada com o cliente. Para mudar, abra o projeto.',
  comoSeMueve: {
    seguimiento:
      'Quando escrever para o cliente, registre: ali você escolhe se o projeto volta, se continua com outra data ou se não vai adiante.',
    arrastrando: 'Arraste no mês para mover, ou mude a data lá.',
    conLaFecha: 'Para mover, mude a data lá.',
  },
  franjas: {
    manana: 'de manhã',
    tarde: 'à tarde',
  },
  registrarElContacto: 'Registrar o contato',
  marcarComoImportante: 'Marcar como importante',
  sacarLaMarca: 'Tirar a marca de importante',
  borrar: (texto) => `Excluir “${texto}”`,
  urgencia: {
    vencio: (cuando) => `venceu ${cuando}`,
    atrasada: (cuando) => `atrasado (${cuando})`,
    hoy: 'hoje',
    manana: 'amanhã',
  },
  etiquetasDelDia: {
    hoy: 'hoje',
    manana: 'amanhã',
    ayer: 'ontem',
  },
  mesConAnio: (mes, anio) => `${mes} de ${anio}`,
  cuentas: {
    citas: (cantidad) =>
      plural(cantidad, { '=0': '# compromissos', one: '# compromisso', other: '# compromissos' }),
    vencimientos: (cantidad) =>
      plural(cantidad, { '=0': '# vencimentos', one: '# vencimento', other: '# vencimentos' }),
    anotaciones: (cantidad) =>
      plural(cantidad, { '=0': '# anotações', one: '# anotação', other: '# anotações' }),
    cosasAnotadas: (cantidad) =>
      plural(cantidad, { '=0': '# anotações', one: '# anotação', other: '# anotações' }),
    hechas,
    cosas,
    cosasYHechas: (pendientes, listas) => `${cosas(pendientes)} e ${hechas(listas)}`,
  },
  nadaEnElMes: 'nada agendado',
  nadaEnElDia: 'Nada agendado',
  nadaAgendado: 'nada agendado',
  caminos: {
    explicacion:
      'As visitas técnicas e as entregas não são anotadas: vêm da consulta e do projeto, e aparecem sozinhas na agenda.',
    cargarUnaConsulta: 'Registrar uma consulta',
    conLaVisita: 'com a visita técnica nesse dia',
    cargarUnProyecto: 'Registrar um projeto',
    conLaEntrega: 'com a previsão de entrega nesse dia',
  },
  dia: {
    cerrar: 'Fechar o dia',
    libre: 'Este dia está livre',
    libreDetalle:
      'Não há entregas nem visitas técnicas, e você ainda não anotou nada. Se precisar comprar algo ou deixar algo pronto, anote.',
    anotar: 'Anotar algo para este dia',
    todoElDia: 'Dia todo',
    nadaPendiente: 'Não há nada pendente para este dia.',
    pendienteDel: (dia) => `Pendências de ${dia}`,
    hecho: 'Concluído',
    nadaSinHora: 'Nada sem horário para este dia.',
    soloElHorario: 'Ver só o horário da marcenaria',
    lasDemasHoras: 'Ver os outros horários',
  },
  grilla: {
    ayudaDelArrastre:
      'Para mover para outro dia, arraste, ou pegue com a barra de espaço, mova com as setas e solte com Enter. Escape deixa onde estava. Também dá para mudar a data abrindo o item.',
    celda: (dia, cuenta) => `${dia}: ${cuenta}`,
    celdaDeHoy: (dia, cuenta) => `${dia}, hoje: ${cuenta}`,
    celdaMarcada: (dia, cuenta) => `${dia}: ${cuenta}, com algo marcado`,
    celdaDeHoyMarcada: (dia, cuenta) => `${dia}, hoje: ${cuenta}, com algo marcado`,
    verTodas: (cantidad, dia) =>
      plural(cantidad, {
        '=0': `Ver os # compromissos de ${dia}`,
        one: `Ver o # compromisso de ${dia}`,
        other: `Ver os # compromissos de ${dia}`,
      }),
    mas: (cantidad) => plural(cantidad, { other: '+# mais' }),
  },
  tira: {
    diasDelMes: 'Dias do mês',
    dia: (dia, cuenta) => `${dia}, ${cuenta}`,
    diaMarcado: (dia, cuenta) => `${dia}, ${cuenta}, com algo marcado`,
  },
  arrastre: {
    loDejaste: (dia) => `Você deixou onde estava, em ${dia}.`,
    moviste: (nombre, dia) => `Você moveu ${nombre} para ${dia}. Dá para desfazer no aviso.`,
    agarrasteConTeclado: (nombre, dia) =>
      `Você pegou ${nombre}, de ${dia}. Mova com as setas, solte com Enter e cancele com Escape.`,
    agarraste: (nombre, dia) => `Você pegou ${nombre}, de ${dia}.`,
    sobre: (nombre, dia) => `${nombre}, sobre ${dia}.`,
    sinDia: 'Não há dia para esse lado.',
  },
} satisfies Mensajes['agenda'];
