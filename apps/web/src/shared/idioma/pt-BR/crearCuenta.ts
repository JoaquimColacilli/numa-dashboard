import type { Mensajes } from '../es';
import { plural } from './plural';

export const crearCuenta = {
  abriElEnlace:
    'Abra o link neste mesmo dispositivo: ao confirmar, sua marcenaria é criada e você entra. Se não chegar em alguns minutos, olhe a caixa de spam.',
  escribiUnMailValido: 'Digite um e-mail válido: é para ele que vai o link de confirmação.',
  contrasenaCorta: ({ minimo }) =>
    plural(minimo, {
      one: 'A senha precisa ter pelo menos # caractere.',
      other: 'A senha precisa ter pelo menos # caracteres.',
    }),
  email: 'E-mail',
  ejemploDeMail: 'voce@suamarcenaria.com.br',
  contrasena: 'Senha',
  alMenos: ({ minimo }) =>
    plural(minimo, {
      one: 'Pelo menos # caractere. No olho você vê o que digitou.',
      other: 'Pelo menos # caracteres. No olho você vê o que digitou.',
    }),
  creandoLaCuenta: 'Criando a conta…',
  crearLaCuenta: 'Criar conta',
} satisfies Mensajes['crearCuenta'];
