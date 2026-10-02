import type { Mensajes } from '../es';

export const paginaAjustes = {
  titulo: 'Configurações',
  nuncaSeSincronizo: 'Ainda não sincronizou com o servidor.',
  ultimaSincronizacion: ({ cuando }) => `Última sincronização: ${cuando}.`,
  sincronizando: 'Sincronizando…',
  sincronizarAhora: 'Sincronizar agora',
  nadaRechazado: 'Nada foi recusado nem ajustado.',
  verElSujeto: ({ sujeto }) => `Ver “${sujeto}”`,
  tuPerfil: 'Seu perfil',
  apariencia: 'Aparência',
  idioma: 'Idioma',
  esteDispositivo: 'Este dispositivo',
  avisosDeLaAgenda: 'Notificações da agenda',
  unRecordatorioALaManana:
    'Um lembrete pela manhã com as entregas, as visitas, os orçamentos e os pagamentos que vencem. A ativação é feita em cada dispositivo.',
  configurarLosAvisos: 'Configurar notificações',
  entrarConLaHuella: 'Entrar com a digital',
  loQueLaBaseRechazo: 'O que a base de dados recusou ou ajustou',
  quedaAcaHastaQueLoDescartes: 'Fica aqui até você descartar, mesmo se fechar o app.',
  sueldoYCostosFijos: 'Pró-labore e custos fixos',
  conEstoSeArmaLaFila:
    'Com isso se monta a fila de cada recebimento: primeiro o dízimo, depois as contas (seu pró-labore e os custos fixos), e o que sobra fica em Maun.',
  seArmanEnLaFila: 'Seu pró-labore e as contas são montados na fila, em Caixinhas.',
  verLaFila: 'Ver a fila em Caixinhas',
  tuTaller: 'Sua marcenaria',
  tuPresupuesto: 'Seu orçamento',
  loQueVaEnCadaPresupuesto:
    'O que vai em cada orçamento que você monta: seus dados, os números e os textos de sempre.',
  comoTePagan: 'Como você recebe',
  laCuentaALaQueTeTransfieren:
    'É a conta para a qual o cliente transfere. Você registra os dados uma vez e eles aparecem na página que você compartilha, ao lado do valor a pagar, com um botão para copiar cada um. O titular e o CUIT (identificação fiscal argentina) ajudam o cliente a confirmar que é a conta certa: o banco mostra em nome de quem ela está antes da confirmação. Receber uma transferência não custa taxa. Todos são opcionais: o que você deixar em branco não aparece.',
  elLinkDeMercadoPago:
    'O link do Mercado Pago é à parte e opcional. Pegue o link no seu app do Mercado Pago, em “Cobrar” → “Link de pago” → “Link sin monto definido”: ele é criado uma vez só e serve para todos os seus projetos. Se você registrar o link, a página do cliente mostra um botão que abre o Mercado Pago para pagar por lá, sem copiar nada: o valor aparece acima e é só digitar. Ele vem depois do seu alias, que é a forma que não custa taxa.',
  resenasEnGoogle: 'Avaliações no Google',
  lePedimosLaResena:
    'Quando um cliente termina a pesquisa de satisfação, pedimos que deixe uma avaliação também no Google. O pedido vai para todos, seja qual for a resposta: pedir só para quem gostou vai contra as regras do Google, que pode apagar as avaliações da marcenaria. Se você não registrar o link, esse pedido não aparece.',
  tuVidriera: 'Sua vitrine',
  loQueVenTusClientes:
    'O que seus clientes veem na página deles: fotos de outros projetos e suas redes sociais.',
  redes: 'Redes sociais',
  corregirElSaldoDeCocos: 'Ajustar o saldo de Cocos',
  espacioParaArchivos: 'Espaço para arquivos',
  espacioUsado: ({ usado, total, Junto }) => (
    <>
      As fotos e os PDFs dos projetos, e as fotos da sua vitrine, ocupam <Junto>{usado}</Junto> de{' '}
      <Junto>{total}</Junto>.
    </>
  ),
  seEstaLlenando:
    'Está enchendo. Quando chegar a 1 GB, não vai ser possível enviar mais arquivos e, passado esse limite, o app inteiro pode parar de funcionar. Avise quem cuida do app antes que encha.',
  cuenta: 'Conta',
  versionDeLaApp: 'Versão do app',
  avisos: 'Notificações',
  unRecordatorioConLoQueTenes:
    'Um lembrete pela manhã com o que você tem no dia. Nada disso substitui a agenda: o que vale é o que você vê na tela.',
} satisfies Mensajes['paginaAjustes'];
