import type { Mensajes } from '../es';
import { plural } from './plural';

const QUANDO_VOLTAR = 'quando a internet voltar.';
const EXCLUSAO_EM_ESPERA = `Exclusão anotada sem internet: será feita automaticamente ${QUANDO_VOLTAR}`;
const ANOTADO_EM_ESPERA = `Anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`;

export const lib = {
  avisos: {
    movimientoNuevo: {
      hecho: 'Movimentação salva.',
      enCola: `Movimentação anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a movimentação.',
    },
    movimientoEditado: {
      hecho: 'Alterações da movimentação salvas.',
      enCola: `Alterações da movimentação anotadas sem internet: serão salvas automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar as alterações da movimentação.',
    },
    movimientoBorrado: {
      hecho: 'Movimentação excluída.',
      enCola: EXCLUSAO_EM_ESPERA,
      error: 'Não foi possível excluir a movimentação.',
    },
    tesoroNuevo: {
      hecho: 'Caixinha criada.',
      enCola: `Caixinha anotada sem internet: será criada automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível criar a caixinha.',
    },
    tesoroEditado: {
      hecho: 'Alterações da caixinha salvas.',
      enCola: `Alterações da caixinha anotadas sem internet: serão salvas automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar as alterações da caixinha.',
    },
    tesoroArchivado: {
      hecho: 'Caixinha arquivada.',
      enCola: `Arquivamento anotado sem internet: será feito automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível arquivar a caixinha.',
    },
    filaGuardada: {
      hecho: 'Fila salva: vale a partir do próximo recebimento.',
      enCola: `Fila anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a fila.',
    },
    faltanteCubierto: {
      hecho: 'Pronto: o dinheiro foi transferido e conta para o teto do mês.',
      enCola: `Anotado sem internet: o dinheiro será transferido automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível transferir o dinheiro para cobrir o mês.',
    },
    clienteNuevo: {
      hecho: 'Cliente salvo.',
      enCola: `Cliente anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar o cliente.',
    },
    clienteEditado: {
      hecho: 'Alterações do cliente salvas.',
      enCola: `Alterações do cliente anotadas sem internet: serão salvas automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar as alterações do cliente.',
    },
    clienteBorrado: {
      hecho: 'Cliente excluído.',
      enCola: EXCLUSAO_EM_ESPERA,
      error: 'Não foi possível excluir o cliente.',
    },
    proyectoGuardado: {
      hecho: 'Projeto salvo.',
      enCola: `Projeto anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar o projeto.',
    },
    proyectoBorrado: {
      hecho: 'Projeto excluído.',
      enCola: EXCLUSAO_EM_ESPERA,
      error: 'Não foi possível excluir o projeto.',
    },
    proyectoAvanzado: {
      hecho: 'Mudança de status salva.',
      enCola: `Mudança de status anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a mudança de status.',
    },
    contactoGuardado: {
      hecho: 'Consulta salva.',
      enCola: `Consulta anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a consulta.',
    },
    contactoAvanzado: {
      hecho: 'Etapa da consulta salva.',
      enCola: `Etapa da consulta anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a etapa da consulta.',
    },
    pasoASeguimiento: {
      hecho: 'Movido para Retornos: a agenda avisa quando escrever de novo.',
      enCola: `Movido para Retornos sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível mover para Retornos.',
    },
    contactoRegistrado: {
      hecho: 'Contato registrado.',
      enCola: `Contato registrado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível registrar o contato.',
    },
    borradorDelPresupuesto: {
      hecho: 'Orçamento salvo.',
      enCola: `Orçamento anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar o orçamento.',
    },
    presupuestoMandado: {
      hecho: 'Orçamento enviado: seu cliente já pode vê-lo na página dele.',
      enCola: `Orçamento anotado sem internet: recebe o número e chega ao cliente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível enviar o orçamento.',
    },
    presupuestoDelTaller: {
      hecho: 'Seu orçamento foi salvo.',
      enCola: `Seu orçamento foi anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar seu orçamento.',
    },
    tareaDelPresupuesto: {
      hecho: 'Tarefa do orçamento salva.',
      enCola: `Tarefa do orçamento anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a tarefa do orçamento.',
    },
    marcaDeLaAgenda: {
      hecho: 'Marcação salva.',
      enCola: `Marcação anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a marcação de importante.',
    },
    contactoBorrado: {
      hecho: 'Consulta excluída.',
      enCola: EXCLUSAO_EM_ESPERA,
      error: 'Não foi possível excluir a consulta.',
    },
    perfil: {
      hecho: 'Perfil salvo.',
      enCola: `Perfil anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar o perfil.',
    },
    anotacion: {
      hecho: 'Anotação salva.',
      enCola: `Anotação feita sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a anotação.',
    },
    anotacionBorrada: {
      hecho: 'Anotação excluída.',
      enCola: EXCLUSAO_EM_ESPERA,
      error: 'Não foi possível excluir a anotação.',
    },
    archivo: {
      hecho: 'Arquivo salvo.',
      enCola: `Arquivo anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar o arquivo.',
    },
    archivoBorrado: {
      hecho: 'Arquivo excluído.',
      enCola: EXCLUSAO_EM_ESPERA,
      error: 'Não foi possível excluir o arquivo.',
    },
    eventoMovido: {
      hecho: 'Movido na agenda.',
      enCola: `Movido sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível mover.',
    },
    costosEstimados: {
      hecho: 'Custos estimados salvos.',
      enCola: `Custos estimados anotados sem internet: serão salvos automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar os custos estimados.',
    },
    loQueHaceFalta: {
      hecho: 'O que é preciso foi salvo.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível salvar o que é preciso.',
    },
    enlaceDelCliente: {
      hecho: 'Link criado.',
      enCola: 'Para criar o link, é preciso estar com internet.',
      error: 'Não foi possível criar o link.',
    },
    bajaDelEnlace: {
      hecho: 'O link não funciona mais.',
      enCola: 'Para desativar o link, é preciso estar com internet.',
      error: 'Não foi possível desativar o link.',
    },
    formasDeCobro: {
      hecho: 'Pronto: seu cliente já sabe como fazer o pagamento.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível mudar a forma de pagamento do cliente.',
    },
    archivoCompartido: {
      hecho: 'Pronto: seu cliente já pode ver.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível mudar o que o cliente vê.',
    },
    archivoNoCompartido: {
      hecho: 'Pronto: seu cliente não vê mais.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível mudar o que o cliente vê.',
    },
    pregunta: {
      hecho: 'Pergunta salva.',
      enCola: `Pergunta anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a pergunta.',
    },
    preguntaPropia: {
      hecho: 'Adicionada à pesquisa de satisfação deste projeto.',
      enCola: `Pergunta anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a pergunta deste projeto.',
    },
    opinionLeida: {
      hecho: 'Opinião marcada como lida.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível marcar a opinião como lida.',
    },
    encuesta: {
      hecho: 'O link da pesquisa de satisfação está pronto.',
      enCola: 'Para criar o link da pesquisa de satisfação, é preciso estar com internet.',
      error: 'Não foi possível criar o link da pesquisa de satisfação.',
    },
    bajaDeLaEncuesta: {
      hecho: 'O link da pesquisa de satisfação não funciona mais.',
      enCola: 'Para desativar o link, é preciso estar com internet.',
      error: 'Não foi possível desativar o link da pesquisa de satisfação.',
    },
    recordatorio: {
      hecho: 'Ficou registrado que você lembrou o cliente.',
      enCola: `Lembrete anotado sem internet: será salvo automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível registrar o lembrete.',
    },
    yaEstaListo: {
      hecho: 'Pronto: seu cliente já vê que está terminado.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível marcar como pronto.',
    },
    todaviaNoEstaListo: {
      hecho: 'Voltou para a fabricação.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível tirar a marcação de pronto.',
    },
    entregaEstimada: {
      hecho: 'Previsão de entrega salva.',
      enCola: `Previsão de entrega anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a previsão de entrega.',
    },
    entregaComprometida: {
      hecho: 'Entrega confirmada: seu cliente já pode ver.',
      enCola: `Entrega confirmada anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a entrega confirmada.',
    },
    sinEntregaComprometida: {
      hecho: 'Não há mais entrega confirmada.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível remover a entrega confirmada.',
    },
    pedidoDeEntrega: {
      hecho: 'Pronto: seu cliente já vê no link dele.',
      enCola: 'Para pedir ao cliente, é preciso estar com internet.',
      error: 'Não foi possível enviar o pedido de entrega.',
    },
    respuestaDeEntregaLeida: {
      hecho: 'Resposta marcada como lida.',
      enCola: ANOTADO_EM_ESPERA,
      error: 'Não foi possível marcar a resposta como lida.',
    },
    fotoDeLaVidriera: {
      hecho: 'A foto está na sua vitrine.',
      enCola: `Foto anotada sem internet: será adicionada à sua vitrine automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível adicionar a foto à sua vitrine.',
    },
    fotoDeLaVidrieraMovida: {
      hecho: 'Sua vitrine ficou na nova ordem.',
      enCola: `Ordem anotada sem internet: será salva automaticamente ${QUANDO_VOLTAR}`,
      error: 'Não foi possível salvar a ordem da sua vitrine.',
    },
    fotoDeLaVidrieraSacada: {
      hecho: 'A foto saiu da sua vitrine.',
      enCola: `Anotado sem internet: sai da sua vitrine ${QUANDO_VOLTAR}`,
      error: 'Não foi possível tirar a foto da sua vitrine.',
    },
  },
  fechaDeLaPlata: {
    falta: 'Informe o dia em que o dinheiro entrou.',
    futura: 'Essa data ainda não chegou: precisa ser hoje ou antes.',
  },
  semana: {
    dias: ['seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.', 'dom.'],
    iniciales: ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'],
  },
  tintas: {
    hogar: 'Verde',
    maun: 'Madeira',
    diezmo: 'Violeta',
    cocos: 'Azul',
    grana: 'Grená',
    mostaza: 'Mostarda',
    petroleo: 'Petróleo',
    ciruela: 'Ameixa',
  },
  sync: {
    sinConexion: (pendientes) =>
      plural(pendientes, {
        '=0': 'Sem internet. Você está vendo o que foi sincronizado por último.',
        one: `Sem internet. # alteração será sincronizada ${QUANDO_VOLTAR}`,
        other: `Sem internet. # alterações serão sincronizadas ${QUANDO_VOLTAR}`,
      }),
    sincronizando: (pendientes) =>
      plural(pendientes, {
        one: 'Sincronizando # alteração…',
        other: 'Sincronizando # alterações…',
      }),
    rechazados: (rechazados) =>
      plural(rechazados, {
        one: 'Não foi possível salvar # alteração.',
        other: 'Não foi possível salvar # alterações.',
      }),
    sincronizado: 'Tudo sincronizado.',
  },
  imagenIlegible: 'Não foi possível ler essa imagem. Tente uma foto JPEG, PNG ou WebP.',
} satisfies Mensajes['lib'];
