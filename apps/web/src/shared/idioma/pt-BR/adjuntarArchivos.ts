import type { Mensajes } from '../es';
import { plural } from './plural';

export const adjuntarArchivos = {
  titulo: 'Arquivos',
  queVeElCliente: (total, compartidos) =>
    plural(total, {
      '=0': `# arquivos · o cliente vê ${String(compartidos)}`,
      one: `# arquivo · o cliente vê ${String(compartidos)}`,
      other: `# arquivos · o cliente vê ${String(compartidos)}`,
    }),
  queVeElClienteTodos: (total) =>
    plural(total, {
      '=0': '# arquivos · o cliente vê todos',
      one: '# arquivo · visível para o cliente',
      other: '# arquivos · o cliente vê todos',
    }),
  queSeSube:
    'Fotos, capturas de tela e PDF. As fotos são reduzidas antes do envio. Vídeos não entram.',
  noVeNinguno:
    'O cliente não vê nenhum: cada arquivo é enviado como privado e compartilhado um por um.',
  elegirCualesVe: 'Escolher quais ele vê',
  sinArchivos: 'Ainda não há arquivos deste projeto.',
  fotosEImagenes: 'Fotos e imagens',
  ver: (nombre) => `Ver ${nombre}`,
  documentos: 'Documentos',
  borrarUno: (nombre) => `Excluir “${nombre}”`,
  subir: 'Enviar fotos ou PDF',
  subiendo: (actual, total) => `Enviando ${String(actual)} de ${String(total)}…`,
  recienSubidos: 'Recém-enviados',
  borrar: 'Excluir',
  subidos: (cantidad) =>
    plural(cantidad, { one: 'Arquivo enviado.', other: '# arquivos enviados.' }),
  borraste: (nombre) => `Você excluiu “${nombre}”.`,
  deshacer: 'Desfazer',
} satisfies Mensajes['adjuntarArchivos'];
