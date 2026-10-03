import type { Mensajes } from '../es';
import { plural } from './plural';

export const recibirAvisos = {
  noElegisteNada: 'Você não escolheu nada na mensagem do sistema. Quando quiser, toque de novo.',
  elNavegadorNoDejoPedir: 'O navegador não deixou pedir a permissão. Tente de novo.',
  elNavegadorNoPudoAnotarse:
    'Não foi possível inscrever o navegador no serviço de notificações. Se estiver sem internet, tente quando a conexão voltar.',
  sinSenalParaActivar:
    'Sem internet não é possível ativar as notificações. Tente quando a conexão voltar.',
  sinSenalParaApagar:
    'Sem internet não é possível desativar as notificações: este dispositivo continua recebendo. Tente quando a conexão voltar.',
  queAvisa: {
    entregas: {
      etiqueta: 'Entregas',
      detalle: 'A entrega de cada projeto em andamento: a confirmada ou, se não houver, a prevista',
    },
    visitas: {
      etiqueta: 'Visitas e visitas técnicas',
      detalle: 'As visitas que você agendou nas consultas',
    },
    presupuestos: {
      etiqueta: 'Orçamentos a vencer',
      detalle: 'O prazo para entregar um orçamento',
    },
    seguimientos: {
      etiqueta: 'Escrever de novo',
      detalle: 'Quem, entre os retornos, está esperando uma mensagem sua',
    },
    vencimientos: {
      etiqueta: 'Vencimentos',
      detalle: 'O dia de pagamento de cada conta que você ainda não pagou',
    },
    anotaciones: {
      etiqueta: 'Minhas anotações',
      detalle: 'O que você anota: materiais, trabalho da marcenaria',
    },
  },
  laMananaDelDia: 'na manhã do dia',
  elDiaAnterior: 'no dia anterior',
  diasAntes: ({ dias }) => plural(dias, { one: '# dia antes', other: '# dias antes' }),
  todaviaNoSalioNinguno: 'Nenhuma foi enviada ainda.',
  salioHoy: ({ hora }) => `A última saiu hoje às ${hora}.`,
  salioAyer: ({ hora }) => `A última saiu ontem às ${hora}.`,
  salioElDia: ({ fecha, hora }) => `A última saiu em ${fecha} às ${hora}.`,
  tambienLlegan: ({ otros }) =>
    plural(otros, {
      one: 'Também chegam no seu outro dispositivo.',
      other: 'Também chegam nos seus outros # dispositivos.',
    }),
  elServidorTodaviaNoPuede: 'O servidor ainda não pode enviar notificações.',
  teMandamosUnaPrueba: 'Enviamos uma notificação de teste: ela deve chegar em alguns segundos.',
  loSacamosDeLaLista:
    'Este dispositivo não recebia mais notificações e foi tirado da lista. Ative de novo.',
  elServicioNoRespondio: 'O serviço de notificações não respondeu. Tente de novo daqui a pouco.',
  pasosEnElIphone: {
    compartir: 'Toque no botão de compartilhar, embaixo, no meio.',
    agregarAInicio: 'Escolha “Adicionar à Tela de Início”.',
    abrirDesdeElIcono: 'Abra o NUMA pelo ícone novo.',
  },
  pasosEnLaApp: {
    abrirLosAjustes: 'Abra as configurações do celular.',
    buscarNuma: 'Procure o NUMA na lista de apps.',
    permitir: 'Ative “Permitir notificações” e volte aqui.',
  },
  pasosEnElNavegador: {
    tocarElIcono: 'Toque no ícone à esquerda do endereço da página.',
    buscarNotificaciones: 'Procure “Notificações” e mude para permitir.',
    volver: 'Volte aqui e toque em “Já permiti”.',
  },
  eligeDondeVivis: 'Escolha onde você mora para ativar as notificações.',
  todaviaFiguraBloqueado: 'A permissão ainda aparece bloqueada. Revise os passos e toque de novo.',
  zonas: {
    argentina: 'Argentina',
    cordoba: 'Córdoba',
    uruguay: 'Uruguai',
    chile: 'Chile',
    bolivia: 'Bolívia',
    espana: 'Espanha',
  },
  zonaConDesfase: ({ lugar, desfase }) => `${lugar} (${desfase})`,
  activados: 'Notificações ativadas neste dispositivo.',
  yaNoRecibe: 'Este dispositivo não recebe mais notificações.',
  cambiosGuardados: 'Alterações das notificações salvas.',
  sinSenalNoSeGuardan:
    'Sem internet não é possível salvar as notificações: a alteração não ficou. Tente quando a conexão voltar.',
  noSeGuardoElCambio: 'Não foi possível salvar a alteração das notificações. Tente de novo.',
  sinSenalParaLaPrueba: 'Sem internet não é possível enviar o teste.',
  noSePudoMandarLaPrueba: 'Não foi possível enviar o teste. Tente de novo daqui a pouco.',
  queTeAviseALaManana: 'Receber uma notificação de manhã',
  aLasTeLlega: ({ hora }) =>
    `Às ${hora} chega uma notificação com as entregas, as visitas e os orçamentos que vencem. Depois de ativar, você pode escolher do que ela avisa e com quanta antecedência.`,
  dondeVivis: 'Onde você mora?',
  elAvisoLoMandaUnServidor:
    'Quem envia a notificação é um servidor, não o seu celular, então ele precisa saber o seu fuso horário para enviar no horário que você escolheu.',
  eligeTuZonaHoraria: 'Escolha seu fuso horário',
  activando: 'Ativando…',
  activarLosAvisos: 'Ativar notificações',
  elSistemaTeVaAPreguntar:
    'O sistema vai perguntar se você permite. Se disser que não, depois vai ser preciso liberar manualmente.',
  leyendoTusAvisos: 'Carregando suas notificações…',
  sinSenalNoPodemosLeer: 'Sem internet não é possível carregar suas notificações',
  noPudimosLeerTuConfiguracion: 'Não foi possível carregar suas configurações de notificações',
  losActivosSiguenAndando:
    'As notificações que já estavam ativas continuam funcionando. O que não deu para carregar foram suas preferências, para mostrar aqui.',
  reintentar: 'Tentar de novo',
  todaviaNoEstanListos: 'As notificações ainda não estão prontas',
  faltanLasClaves:
    'O servidor não tem as chaves para enviar notificações, então por enquanto não é possível ativá-las em nenhum dispositivo. Isso não se resolve por esta tela.',
  mientrasTanto: 'Enquanto isso, a agenda continua mostrando tudo.',
  primeroAgregaNuma: 'Primeiro, adicione o NUMA à Tela de Início',
  enElIphoneSoloLlegan:
    'No iPhone, as notificações só chegam se o app estiver na Tela de Início. Não é uma exigência nossa: é do sistema. Leva trinta segundos e, além disso, o app abre mais rápido.',
  iphoneEnSafari: 'iPhone, no Safari',
  cuandoLaAbras: 'Quando abrir pelo ícone, volte aqui e você vai poder ativar as notificações.',
  esteNavegadorNoPuede: 'Este navegador não pode receber notificações',
  paraRecibirlos:
    'Para receber, abra o NUMA no Chrome, no Edge ou no Firefox. Enquanto isso, a agenda continua mostrando tudo.',
  estanBloqueados: 'As notificações estão bloqueadas',
  leDijisteQueNo:
    'Você recusou a permissão e o app não pode perguntar de novo: quem decide é o sistema. Dá para liberar manualmente em dois toques.',
  yaLoHabilite: 'Já permiti',
  esUnRecordatorio:
    'É um lembrete, não um alarme. O serviço que envia as notificações pode pular uma sem avisar, principalmente se o celular estiver sem internet, e se o app passar uma semana sem uso o servidor pausa e as notificações param de sair. Para o que não pode ficar para trás, abra a agenda: está tudo lá, sempre.',
  activosEnEsteDispositivo: 'Notificações ativas neste dispositivo.',
  probar: 'Testar',
  queTeAvisa: 'Sobre o que avisar',
  anticipacionDe: ({ aviso }) => `Antecedência: ${aviso}`,
  aQueHora: 'Horário',
  otraHora: 'Outro horário',
  enEsteDispositivo: 'Neste dispositivo',
  apagarlosAca: 'Desativar aqui não muda o que chega nos seus outros dispositivos.',
  apagarLosAvisos: 'Desativar notificações neste dispositivo',
} satisfies Mensajes['recibirAvisos'];
