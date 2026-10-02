import type { Mensajes } from '../es';

export const paginaAjustes = {
  titulo: 'Settings',
  nuncaSeSincronizo: 'Not synced with the server yet.',
  ultimaSincronizacion: ({ cuando }) => `Last synced: ${cuando}.`,
  sincronizando: 'Syncing…',
  sincronizarAhora: 'Sync now',
  nadaRechazado: 'Nothing rejected or adjusted.',
  verElSujeto: ({ sujeto }) => `View “${sujeto}”`,
  tuPerfil: 'Your profile',
  apariencia: 'Appearance',
  esteDispositivo: 'This device',
  avisosDeLaAgenda: 'Calendar notifications',
  unRecordatorioALaManana:
    "A morning reminder with the deliveries, visits, quotes, and payments coming due. It's turned on separately on each device.",
  configurarLosAvisos: 'Set up notifications',
  entrarConLaHuella: 'Log in with fingerprint',
  loQueLaBaseRechazo: 'What the database rejected or adjusted',
  quedaAcaHastaQueLoDescartes: 'It stays here until you dismiss it, even if you close the app.',
  sueldoYCostosFijos: "Owner's pay and fixed costs",
  conEstoSeArmaLaFila:
    "This sets up the waterfall for each payment: first the tithe, then the bills (your pay and the fixed costs), and what's left stays in Maun.",
  seArmanEnLaFila: 'Your pay and the bills are set up in the waterfall, in Buckets.',
  verLaFila: 'See the waterfall in Buckets',
  tuTaller: 'Your shop',
  tuPresupuesto: 'Your quote',
  loQueVaEnCadaPresupuesto:
    'What goes in every quote you put together: your details, the numbers, and your usual wording.',
  comoTePagan: 'How clients pay you',
  laCuentaALaQueTeTransfieren:
    "This is the account your client transfers to. You add these details once, and they show up on the page you share, next to what the client owes you, each with a button to copy it. The account holder and the CUIT (Argentine tax ID) help the client confirm it's the right account: their bank shows whose name it's under before they confirm. Receiving a transfer doesn't cost you a fee. Everything is optional: anything you leave blank isn't shown.",
  elLinkDeMercadoPago:
    "The Mercado Pago link is separate and optional. Get it from your Mercado Pago app, under “Cobrar” → “Link de pago” → “Link sin monto definido”: you create it once and it works for all your jobs. If you add it, your client gets a button on their page that opens Mercado Pago so they can pay you from there without copying anything: we show them the amount above and they type it in. It comes after your alias, which is the option that doesn't cost you a fee.",
  resenasEnGoogle: 'Google reviews',
  lePedimosLaResena:
    "When a client finishes the survey, we ask them to leave a review on Google too. Everyone gets asked, whatever they answered: asking only happy clients goes against Google's rules, and Google can delete the shop's reviews. If you don't add the link, that request doesn't show up.",
  tuVidriera: 'Your showcase',
  loQueVenTusClientes:
    'What your clients see on their page: photos of other jobs and your social media.',
  redes: 'Social media',
  corregirElSaldoDeCocos: 'Adjust the Cocos balance',
  espacioParaArchivos: 'File storage',
  espacioUsado: ({ usado, total, Junto }) => (
    <>
      Job photos and PDFs, plus your showcase photos, take up <Junto>{usado}</Junto> of{' '}
      <Junto>{total}</Junto>.
    </>
  ),
  seEstaLlenando:
    "It's filling up. At 1 GB you won't be able to upload more files, and past that limit the whole app may stop working. Let whoever maintains the app know before it fills up.",
  cuenta: 'Account',
  versionDeLaApp: 'App version',
  avisos: 'Notifications',
  unRecordatorioConLoQueTenes:
    'A morning reminder with what you have that day. None of this replaces the calendar: what you see on the screen is what counts.',
} satisfies Mensajes['paginaAjustes'];
