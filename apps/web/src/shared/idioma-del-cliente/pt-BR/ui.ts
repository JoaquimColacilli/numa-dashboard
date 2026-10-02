import type { MensajesDelCliente } from '../es';

export const ui = {
  hoja: {
    cerrar: 'Fechar',
    cerrarSinGuardar: 'Fechar sem salvar?',
    seVaAPerder: 'O que você registrou ainda não foi salvo e, se fechar, vai se perder.',
    seguirEditando: 'Continuar editando',
    descartar: 'Descartar',
  },
  copiar: {
    copiar: 'Copiar',
    copiado: 'Copiado',
    seleccionado: 'Selecionado: toque e segure e escolha Copiar',
    noSePudo: 'Não foi possível copiar. Selecione com o dedo e copie pelo menu do celular.',
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
} satisfies MensajesDelCliente['ui'];
