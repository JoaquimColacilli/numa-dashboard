import type { Mensajes } from '../es';

export const ui = {
  hoja: {
    cerrar: 'Fechar',
    cerrarSinGuardar: 'Fechar sem salvar?',
    seVaAPerder: 'O que você registrou ainda não foi salvo e, se fechar, vai se perder.',
    seguirEditando: 'Continuar editando',
    descartar: 'Descartar',
  },
  deshacer: 'Desfazer',
  comparacion: {
    ocultarLosNumeros: 'Ocultar os números',
    verLosNumeros: 'Ver os números',
    concepto: 'Item',
    diferencia: 'Diferença',
  },
  copiar: {
    copiar: 'Copiar',
    copiado: 'Copiado',
    seleccionado: 'Selecionado: toque e segure e escolha Copiar',
    noSePudo: 'Não foi possível copiar. Selecione com o dedo e copie pelo menu do celular.',
  },
  guardado: {
    sinGuardar: 'Não salvo',
    sinSenal: 'Sem internet: será salvo quando a internet voltar',
    guardando: 'Salvando…',
    noSePudo: 'Não foi possível salvar',
    guardado: 'Salvo',
  },
  mail: {
    loMandamosA: 'Enviamos para',
    cambiar: 'Alterar',
    mandandoDeNuevo: 'Reenviando…',
    reenviarEn: (espera) => `Reenviar em ${espera}`,
    reenviar: 'Reenviar e-mail',
    mandadoDeNuevo: (email) => `Enviamos de novo para ${email}.`,
  },
  panelDeAvisos: {
    entendido: 'Entendi, pode tirar daqui',
  },
  acceso: {
    lema: 'Quanto falta receber, o que vai ser entregue nesta semana e para onde vai cada peso a cada recebimento.',
    unTaller: 'Uma marcenaria, quatro caixinhas.',
  },
  rotulo: {
    etiqueta: 'Carimbo do orçamento',
    presupuesto: 'Orçamento',
    numero: (numero) => `Nº ${numero}`,
    sinNumero: 'Ainda sem número',
    revision: 'Rev.',
    emitido: 'Emitido',
    opcion: 'Opção',
    aceptado: 'Aceito',
    valeHasta: 'Válido até',
    sinVencimiento: 'Sem vencimento',
    vencio: 'Venceu',
  },
  visor: {
    anterior: 'Anterior',
    siguiente: 'Próxima',
    abrirAparte: 'Abrir em outra aba',
    cuenta: (actual, total) => `${actual} de ${total}`,
  },
  contrasena: {
    mostrar: 'Mostrar a senha',
  },
} satisfies Mensajes['ui'];
