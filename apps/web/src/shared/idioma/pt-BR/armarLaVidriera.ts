import type { Mensajes } from '../es';
import { plural } from './plural';

const VOLTAR = 'Tente as outras quando a internet voltar.';

export const armarLaVidriera = {
  losVideosNoVan:
    'Não é possível enviar vídeos: um vídeo do celular pesa entre 50 e 200 MB, e o espaço para os arquivos de toda a marcenaria é de 1 GB. Envie uma foto ou uma captura de tela do vídeo.',
  queSeSube: 'fotos e capturas de tela',
  botonDeSumar: (cantidad) =>
    plural(cantidad, {
      '=0': 'Adicionar fotos',
      one: 'Adicionar # foto',
      other: 'Adicionar # fotos',
    }),
  sinCompartir: (cantidad) =>
    plural(cantidad, {
      '=0': '# das fotos que você escolheu não estão compartilhadas: os clientes desses projetos ainda não as viram. Todos os seus clientes veem a sua vitrine, inclusive eles.',
      one: 'Uma das fotos que você escolheu não está compartilhada: o cliente desse projeto ainda não a viu. Todos os seus clientes veem a sua vitrine, inclusive ele.',
      other:
        '# das fotos que você escolheu não estão compartilhadas: os clientes desses projetos ainda não as viram. Todos os seus clientes veem a sua vitrine, inclusive eles.',
    }),
  exceso: (elegidas, libres) =>
    plural(libres, {
      '=0': `Você escolheu ${String(elegidas)} fotos e não cabe mais nenhuma na sua vitrine.`,
      one: `Você escolheu ${String(elegidas)} fotos e na sua vitrine cabe mais #: só a primeira vai ser enviada.`,
      other: `Você escolheu ${String(elegidas)} fotos e na sua vitrine cabem mais #: só as primeiras # vão ser enviadas.`,
    }),
  corteAlSumar: (hechas, total) =>
    plural(hechas, {
      '=0': `Nenhuma foi adicionada: a internet caiu. ${VOLTAR}`,
      one: `Só a primeira das ${String(total)} foi adicionada: a internet caiu. ${VOLTAR}`,
      other: `Só as primeiras # das ${String(total)} foram adicionadas: a internet caiu. ${VOLTAR}`,
    }),
  corteAlSubir: (hechas, total) =>
    plural(hechas, {
      '=0': `Nenhuma foi enviada: a internet caiu. ${VOLTAR}`,
      one: `Só a primeira das ${String(total)} foi enviada: a internet caiu. ${VOLTAR}`,
      other: `Só as primeiras # das ${String(total)} foram enviadas: a internet caiu. ${VOLTAR}`,
    }),
  noSePudoCopiar: (motivo) => `Não foi possível copiar uma das fotos. ${motivo}`,
  origen: {
    subida: 'Enviada para a vitrine',
    deUnTrabajo: 'De um projeto',
    deTrabajo: (titulo) => `De “${titulo}”`,
  },
  sacaste: 'Você tirou uma foto da sua vitrine.',
  deshacer: 'Desfazer',
  fotos: {
    sinNada:
      'Ainda não há nada na sua vitrine. Seus clientes a veem quando você adicionar uma foto ou uma rede social.',
    sinFotos: 'Você ainda não adicionou fotos: seus clientes veem só as suas redes sociais.',
    acciones: {
      antes: 'Mover para antes',
      despues: 'Mover para depois',
      sacar: 'Tirar',
    },
    llena: (tope) => `Sua vitrine já tem as ${String(tope)} fotos. Tire uma para adicionar outra.`,
    titulo: 'Fotos',
    deTantas: (fotos, tope) => `${String(fotos)} de ${String(tope)}`,
    enOrden: 'As fotos da sua vitrine, na ordem em que o cliente as vê',
    fotoDe: (numero, total) => `Foto ${String(numero)} de ${String(total)}`,
    sumar: 'Adicionar fotos',
  },
  hoja: {
    titulo: 'Adicionar fotos à vitrine',
    entranMas: (libres) =>
      plural(libres, {
        '=0': 'Não cabem mais fotos.',
        one: 'Cabe mais # foto.',
        other: 'Cabem mais # fotos.',
      }),
    lasVenTodos:
      'Todos os seus clientes veem as fotos que você adicionar, na página de cada projeto.',
    deDondeSalen: 'De onde vêm as fotos',
    pestanas: {
      trabajos: 'Dos seus projetos',
      subir: 'Enviar novas',
    },
    sumaste: (cantidad) =>
      plural(cantidad, {
        '=0': 'Você adicionou # fotos à sua vitrine.',
        one: 'Você adicionou uma foto à sua vitrine.',
        other: 'Você adicionou # fotos à sua vitrine.',
      }),
    fotoDelTrabajo: (numero, titulo) => `Foto ${String(numero)} de “${titulo}”`,
    yaEsta: 'Já está na sua vitrine',
    sinCompartir: 'Não compartilhada',
    sinFotosEnLosTrabajos:
      'Ainda não há fotos nos seus projetos. Você pode enviar fotos novas em Enviar novas.',
    delCelular:
      'Fotos ou capturas de tela do celular ou do computador. São reduzidas antes do envio, como as dos projetos.',
    elegirFotos: 'Escolher fotos',
    sumando: (actual, total) => `Adicionando ${String(actual)} de ${String(total)}…`,
    subiendo: (actual, total) => `Enviando ${String(actual)} de ${String(total)}…`,
    elegisteTodas: (elegidas) => `Você escolheu ${String(elegidas)}: é o que cabe na sua vitrine.`,
    elegisteDe: (elegidas, libres) =>
      `Você escolheu ${String(elegidas)} das ${String(libres)} que cabem.`,
    sumarIgual: 'Adicionar mesmo assim',
    revisar: 'Revisar',
    cancelar: 'Cancelar',
  },
} satisfies Mensajes['armarLaVidriera'];
