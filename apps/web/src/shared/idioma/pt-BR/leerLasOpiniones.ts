import type { Mensajes } from '../es';

export const leerLasOpiniones = {
  yaNoEsta: 'Esta resposta não está mais aqui',
  yaNoEstaDetalle:
    'Talvez o projeto tenha sido excluído em outro lugar. As respostas dos outros continuam em Resultados.',
  unCliente: 'Um cliente',
  contestoEl: (dia) => `Respondeu em ${dia}`,
  abrirElTrabajo: 'Abrir o projeto',
  escribirle: 'Escrever',
} satisfies Mensajes['leerLasOpiniones'];
