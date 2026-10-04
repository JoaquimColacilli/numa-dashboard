import type { Mensajes } from '../es';
import { plural } from './plural';

export const cliente = {
  origenes: {
    referido: {
      etiqueta: 'Indicação',
      detalle: 'Alguém que já trabalhou com a marcenaria fez a indicação.',
    },
    volvio: {
      etiqueta: 'Cliente que voltou',
      detalle: 'Já tinha feito um projeto e voltou para outro.',
    },
    redes: {
      etiqueta: 'Instagram',
      detalle: 'Escreveu pelas redes sociais da marcenaria.',
    },
    cartel: {
      etiqueta: 'Placa da marcenaria',
      detalle: 'Passou pela porta e viu a placa.',
    },
    otro: {
      etiqueta: 'Outro',
      detalle: 'Chegou por outro caminho.',
    },
  },
  condiciones: {
    consumidor_final: { etiqueta: 'Consumidor final', comprobante: 'remito ou fatura B' },
    monotributo: { etiqueta: 'Monotributo', comprobante: 'fatura C' },
    responsable_inscripto: { etiqueta: 'Contribuinte inscrito no IVA', comprobante: 'fatura A' },
    exento: { etiqueta: 'Isento de IVA', comprobante: 'fatura B' },
  },
  cuit: 'CUIT',
  cuitOCuil: 'CUIT ou CUIL',
  ordenes: {
    nombre: 'Nome',
    ultimo: 'Último projeto',
    facturado: 'Total faturado',
  },
  formulario: {
    largoMaximo: (maximo) =>
      plural(maximo, {
        one: 'Não pode passar de # caractere.',
        other: 'Não pode passar de # caracteres.',
      }),
    faltaElNombre: 'O nome é a única coisa que não pode faltar.',
    revisaElMail: 'Confira o e-mail: está faltando o @ ou o ponto.',
    cuitIncompleto: (digitos) =>
      `Um CUIT tem ${String(digitos)} dígitos. Deixe em branco se não tiver à mão.`,
    cuitAmbiguo:
      'O dígito verificador deste CUIT cai no caso que não tem convenção única. Salve assim mesmo se copiou certo.',
    cuitConOtroPrefijo:
      'Os CUIT começam com 20, 23, 24, 27, 30, 33 ou 34. Salve assim mesmo se foi o que passaram para você.',
    cuitQueNoCierra: 'O dígito verificador não bate. Confira, mas dá para salvar assim mesmo.',
    dniInvalido:
      'Um DNI (documento de identidade argentino) tem 7 ou 8 números. Deixe vazio se não tiver à mão.',
  },
  contacto: {
    llamar: 'Ligar',
    whatsapp: 'WhatsApp',
    llamarA: (nombre) => `Ligar para ${nombre}`,
    escribirleA: (nombre) => `Escrever para ${nombre} pelo WhatsApp`,
    llamarASinTelefono: (nombre) => `Ligar para ${nombre}: não tem telefone registrado`,
    escribirleASinTelefono: (nombre) =>
      `Escrever para ${nombre} pelo WhatsApp: não tem telefone registrado`,
    sinTelefono: 'Sem telefone registrado',
    agregaloDesdeEditar:
      'Sem telefone registrado: adicione em Editar para poder ligar ou escrever.',
  },
  combobox: {
    cliente: 'Cliente',
    sinDatos: 'Ainda sem dados de contato',
    cambiar: (nombre) => `Trocar o cliente, agora ${nombre}`,
    buscar: 'Busque pelo nome, ou digite um novo',
    crear: (nombre) => `Criar “${nombre}”`,
    quedaCargado: 'Fica registrado com o nome; o resto você completa depois',
  },
} satisfies Mensajes['cliente'];
