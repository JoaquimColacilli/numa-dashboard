import type { Mensajes } from '../es';
import { plural } from './plural';

export const editarPerfil = {
  sinSenalParaLaFoto:
    'Sem internet não é possível trocar a foto: ela é enviada na hora e não fica guardada para depois. Tente quando a conexão voltar.',
  hastaTantasLetras: ({ maximo }) =>
    plural(maximo, {
      one: 'Até # caractere. Nome e sobrenome bastam.',
      other: 'Até # caracteres. Nome e sobrenome bastam.',
    }),
  noSePudoLeerLaImagen: 'Não foi possível ler essa imagem.',
  fotoGuardada: 'Foto salva.',
  ponerUnaFoto: 'Colocar uma foto',
  cambiarLaFoto: 'Trocar a foto',
  todaviaSinNombre: 'Ainda sem nome',
  tuNombre: 'Seu nome',
  seVeEnLaBarraLateral:
    'Aparece na barra lateral, ao lado do seu e-mail. O e-mail é o que você usa para entrar e não pode ser trocado aqui.',
  guardarElNombre: 'Salvar nome',
  encuadrarLaFoto: 'Enquadrar a foto',
  esteNavegadorNoPuedePrepararla: 'Este navegador não consegue preparar a foto.',
  noSePudoPrepararla: 'Não foi possível preparar a foto. Tente de novo.',
  arrastraLaFoto:
    'Arraste a foto para enquadrar e use o zoom para aproximar. Pelo teclado: as setas movem a foto, e + e − aproximam ou afastam.',
  recortadorDeFoto: 'recortador de foto',
  encuadreDeLaFoto: 'Enquadramento da foto',
  alejar: 'Afastar',
  zoom: 'Zoom',
  acercar: 'Aproximar',
  cancelar: 'Cancelar',
  guardarLaFoto: 'Salvar foto',
} satisfies Mensajes['editarPerfil'];
