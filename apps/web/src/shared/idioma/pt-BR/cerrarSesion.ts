import type { Mensajes } from '../es';
import { plural } from './plural';

export const cerrarSesion = {
  hayCambiosSinSincronizar: ({ cantidad }) =>
    plural(cantidad, {
      one: 'Há # alteração sem sincronizar: se você sair, ela se perde.',
      other: 'Há # alterações sem sincronizar: se você sair, elas se perdem.',
    }),
  cerrarSesionIgual: 'Sair mesmo assim',
  cerrando: 'Saindo…',
  cerrarSesion: 'Sair',
  hayCambiosDeEsteTelefono: ({ cantidad }) =>
    plural(cantidad, {
      one: 'Há # alteração deste celular sem sincronizar.',
      other: 'Há # alterações deste celular sem sincronizar.',
    }),
  siEntrasConOtraCuenta: ({ cantidad }) =>
    plural(cantidad, {
      one: 'Se você entrar com outra conta, a alteração é apagada deste celular e não chega à marcenaria: não tem como recuperar.',
      other:
        'Se você entrar com outra conta, as alterações são apagadas deste celular e não chegam à marcenaria: não tem como recuperar.',
    }),
  paraNoPerderlosSinSenal: ({ cantidad }) =>
    plural(cantidad, {
      one: 'Para não perder a alteração, entre com a digital e espere a conexão voltar para ela sincronizar.',
      other:
        'Para não perder as alterações, entre com a digital e espere a conexão voltar para elas sincronizarem.',
    }),
  paraNoPerderlosConSenal: ({ cantidad }) =>
    plural(cantidad, {
      one: 'Para não perder a alteração, entre com a digital ou a senha e espere ela sincronizar.',
      other:
        'Para não perder as alterações, entre com a digital ou a senha e espere elas sincronizarem.',
    }),
  saliendo: 'Saindo…',
  borrarYSalir: ({ cantidad }) =>
    plural(cantidad, {
      one: 'Apagar a alteração e sair',
      other: 'Apagar as # alterações e sair',
    }),
  noVolver: 'Não, voltar',
  entrarConOtraCuenta: 'Entrar com outra conta',
} satisfies Mensajes['cerrarSesion'];
