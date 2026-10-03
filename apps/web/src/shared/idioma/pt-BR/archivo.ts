import type { Mensajes } from '../es';

export const archivo = {
  sinSenal:
    'Sem internet não dá para enviar arquivos: eles são enviados na hora e não ficam guardados para depois. Tente quando a internet voltar.',
  losVideosNoEntran:
    'Não é possível enviar vídeos: um vídeo do celular pesa entre 50 e 200 MB, e o espaço para os arquivos de toda a marcenaria é de 1 GB. Envie fotos ou capturas de tela do vídeo, e os desenhos e orçamentos em PDF.',
  queSeSubeAUnTrabajo: 'fotos, capturas de tela e PDF',
  noSePuedeSubir: (nombre, queSeSube) =>
    `Não é possível enviar “${nombre}”: dá para enviar ${queSeSube}.`,
  pdfMuyPesado: (nombre, peso) =>
    `“${nombre}” tem ${peso}, e um PDF pode ter até 10 MB. Se for uma digitalização, salve com menos qualidade e tente de novo.`,
  sinNombre: 'Arquivo',
  navegadorSinLienzo: 'Este navegador não consegue preparar a imagem.',
  noSePudoPreparar: 'Não foi possível preparar a imagem. Tente de novo.',
  conElNombre: (nombre, motivo) => `“${nombre}”: ${motivo}`,
  noSeSubio: (nombre, motivo) => `Não foi possível enviar “${nombre}”. ${motivo}`,
} satisfies Mensajes['archivo'];
