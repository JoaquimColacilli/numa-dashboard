import type { Mensajes } from '../es';

import { plural } from './plural';

export const compartirConElCliente = {
  volverAlTrabajo: 'Voltar ao projeto',
  titulo: 'Compartilhar com o cliente',
  queVe:
    'O cliente vê o preço, o que pagou, o que falta, como pagar você e em que pé está o móvel. Não vê seus custos, seu lucro, o dízimo nem o detalhamento. O código QR abre o mesmo link: quem escaneia vê exatamente o mesmo, e desativar o link desliga os dois.',
  verComoLoVeEl: 'Ver como o cliente vê',
  sinEnlace: {
    titulo: 'Você ainda não compartilhou este projeto',
    texto:
      'É criado um link só deste projeto. Quem tiver o link pode abrir sem conta nem senha, então envie só para o seu cliente. Você pode desativar quando quiser.',
    crear: 'Criar o link',
  },
  deBaja: {
    titulo: 'O link está desativado',
    texto:
      'Se o cliente abrir, vê um aviso de que o link não funciona mais e nada do projeto. Você pode criar um novo quando quiser; o anterior não volta.',
    crear: 'Criar um link novo',
  },
  activo: {
    elEnlace: 'O link',
    enlaceActivo: 'Link ativo',
    creadoEl: (fecha) => `criado em ${fecha} · não vence`,
    copiar: 'Copiar',
    copiado: 'Copiado',
    enWhatsappVaADecir: 'No WhatsApp vai aparecer:',
    mandarseloPorWhatsapp: 'Enviar pelo WhatsApp',
    darDeBaja: 'Desativar',
    sinLaDireccion:
      'Este link foi criado antes de o endereço dele ser salvo na sua marcenaria, e o endereço ficou só no app antigo. O que o cliente tem não funciona mais: crie um novo e envie.',
    crearUnoNuevo: 'Criar um novo',
    noVeNingunArchivo: (total) =>
      plural(total, {
        one: 'Com este link, o cliente vê 0 de # arquivo: escolha abaixo o que mostrar.',
        other: 'Com este link, o cliente vê 0 de # arquivos: escolha abaixo quais mostrar.',
      }),
    archivosQueVe: (compartidos, total) =>
      plural(total, {
        one: `Com este link, o cliente vê ${String(compartidos)} de # arquivo.`,
        other: `Com este link, o cliente vê ${String(compartidos)} de # arquivos.`,
      }),
    visitas: (veces) => `${veces}.`,
    visitasYLaUltima: (veces, fecha) => `${veces}. A última vez foi em ${fecha}.`,
  },
  sinSenal:
    'Para criar o link você precisa de internet: ele é salvo na hora e só funciona a partir daí.',
  baja: {
    titulo: 'Desativar o link?',
    texto:
      'O cliente vai deixar de ver o projeto pelo link que você enviou. Se precisar depois, crie um novo.',
    dejarloComoEsta: 'Deixar como está',
    darloDeBaja: 'Desativar',
  },
  comoTePaga: {
    titulo: 'Como o cliente paga',
    elegi:
      'Escolha como você vai receber cada pagamento. O cliente vê na página dele, ao lado de quanto precisa pagar. A transferência não tem taxa para você.',
    nadaQueCobrar: 'Este projeto já está quitado: não falta nada para receber.',
    alMenosUna: 'Deixe pelo menos uma: senão o cliente não sabe como pagar você.',
    sinDatosParaTransferir:
      'Você ainda não registrou alias nem CBU, então por enquanto só pode receber em dinheiro.',
    cargalosEnAjustes: 'Registrar em Configurações',
    comoTeLaPaga: {
      sena: 'Sinal: como o cliente paga',
      saldo: 'Saldo: como o cliente paga',
    },
  },
  archivos: {
    titulo: 'Quais arquivos o cliente vê',
    cuantosVe: (compartidos, total) => `${String(compartidos)} de ${String(total)} compartilhados`,
    marcaUnoPorUno: 'Ative um por um. O que você não ativar não existe para o cliente.',
    noVeNinguno: (total) =>
      plural(total, {
        one: 'Você tem um arquivo e o cliente não o vê.',
        other: 'Você tem # arquivos e o cliente não vê nenhum.',
      }),
    prendeAbajo: 'Ative abaixo os que quiser mostrar.',
    sinArchivos: 'Este projeto ainda não tem arquivos. Envie pela página do projeto.',
    compartir: (nombre) => `Compartilhar ${nombre}`,
  },
  qr: {
    mostrarElQr: 'Mostrar o código QR',
    titulo: 'Mostre o código',
    escanealo: 'Escaneie com a câmera do celular',
    dibujando: 'Gerando o código',
    codigoDelEnlace: (trabajo) => `Código QR do link de ${trabajo}`,
    copiado: 'Copiado',
    copiarElEnlace: 'Copiar o link',
    listo: 'Concluir',
    esElMismoEnlace:
      'É o mesmo link que você envia pelo WhatsApp: se desativar, este código deixa de funcionar.',
  },
} satisfies Mensajes['compartirConElCliente'];
