import type { Mensajes } from '../es';
import { plural } from './plural';

export const recuperarAcceso = {
  siHayUnaCuenta:
    'Se houver uma conta com esse e-mail, você vai receber um link para criar uma senha nova. Abra neste mesmo dispositivo. Se não chegar em alguns minutos, olhe a caixa de spam.',
  contrasenaCorta: ({ minimo }) =>
    plural(minimo, {
      one: 'A senha precisa ter pelo menos # caractere.',
      other: 'A senha precisa ter pelo menos # caracteres.',
    }),
  contrasenaNueva: 'Nova senha',
  alMenos: ({ minimo }) =>
    plural(minimo, {
      one: 'Pelo menos # caractere. No olho você vê o que digitou.',
      other: 'Pelo menos # caracteres. No olho você vê o que digitou.',
    }),
  guardando: 'Salvando…',
  guardarLaContrasena: 'Salvar senha',
  escribiUnMailValido: 'Digite um e-mail válido.',
  email: 'E-mail',
  ejemploDeMail: 'voce@suamarcenaria.com.br',
  mandandoElEnlace: 'Enviando o link…',
  mandarmeElEnlace: 'Enviar o link',
} satisfies Mensajes['recuperarAcceso'];
