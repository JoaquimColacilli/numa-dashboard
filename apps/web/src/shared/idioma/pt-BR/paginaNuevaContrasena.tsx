import type { Mensajes } from '../es';

export const paginaNuevaContrasena = {
  listoYaEntraste: 'Pronto, você entrou',
  guardamosLaContrasena: 'A senha nova foi salva. Se entrar por outro dispositivo, use esta.',
  irAlTaller: 'Ir para a marcenaria',
  unSegundo: 'Só um instante',
  estamosValidando: 'Estamos validando o link do e-mail.',
  verificandoElEnlace: 'Verificando o link…',
  sinSenal: 'Sem internet',
  esteEnlaceNoSirve: 'Este link não funciona',
  seValidaContraElServidor: 'O link é validado no servidor e agora você está sem internet.',
  losEnlacesDelCorreo: 'Os links do e-mail abrem no mesmo navegador em que você pediu, e expiram.',
  pedirOtroEnlace: 'Pedir outro link',
  buscaSenal:
    'Procure uma conexão e abra o link do e-mail de novo. Se não funcionar mais, peça um novo: o servidor envia poucos e-mails por hora.',
  pediUnoNuevo: 'Peça um novo neste dispositivo e abra sem copiar para outro navegador.',
  seAbreDesdeElCorreo: 'Esta tela abre pelo e-mail',
  paraCambiarLaContrasena: 'Para trocar a senha, peça o link e abra pelo e-mail.',
  volverAlTaller: 'Voltar para a marcenaria',
  asiNadie: 'Assim, ninguém que pegue o dispositivo desbloqueado consegue trocá-la.',
  poneUnaContrasenaNueva: 'Crie uma senha nova',
  esPara: ({ email, Fuerte }) => (
    <>
      É para <Fuerte>{email}</Fuerte>.
    </>
  ),
} satisfies Mensajes['paginaNuevaContrasena'];
