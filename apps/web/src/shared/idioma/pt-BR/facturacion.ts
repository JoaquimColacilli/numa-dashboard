import type { Mensajes } from '../es';

export const facturacion = {
  prueba: 'Teste',
  resumen: {
    sinConectar:
      'Ainda não está conectado. Você conecta uma única vez, com um procedimento no site da ARCA.',
    conectada: (puntoDeVenta) => `Conectado à ARCA · Ponto de venda ${puntoDeVenta}`,
    ver: 'Ver o faturamento',
    etiqueta: 'Faturamento com a ARCA',
  },
  pagina: {
    titulo: 'Faturamento',
    ajustes: 'Configurações',
  },
  conexion: {
    titulo: 'A conexão com a ARCA',
    sinConectar:
      'Ainda não está conectado. Você conecta uma única vez, com um procedimento no site da ARCA.',
    conectar: 'Conectar com a ARCA',
    renovar: 'Renovar o certificado',
    arca: 'ARCA',
    conectada: 'Conectado',
    enPrueba: 'Em teste',
    cuit: 'CUIT',
    puntoDeVenta: 'Ponto de venda',
    desde: 'Desde',
    modoPrueba:
      'Você está no modo teste: as notas fiscais saem com “Teste” e não valem para a ARCA.',
    probar: 'Verificar a conexão',
    sinSenal: 'Para verificar a conexão, você precisa de internet.',
    anda: (numero) => `A ARCA responde e o NUMA entra bem. A última Factura C é a ${numero}.`,
    andaSinFacturas:
      'A ARCA responde e o NUMA entra bem. Ainda não há notas fiscais neste ponto de venda.',
    noContesta: 'A ARCA não está respondendo agora. Tente daqui a pouco.',
    noEntra: 'O NUMA não conseguiu entrar na ARCA com o certificado.',
    esperando: (hora) => `Esperando a ARCA: tente de novo às ${hora}.`,
    apagada: 'O faturamento de verdade ainda não está ligado.',
    vence: (fecha) => `O certificado vence em ${fecha}.`,
    noSePudo: 'Não foi possível verificar a conexão. Tente de novo daqui a pouco.',
  },
  datos: {
    titulo: 'Seus dados nas notas fiscais',
    nombre: 'Nome ou razão social',
    domicilio: 'Endereço',
    condicion: 'Condição',
    monotributo: 'Monotributo',
    soloMonotributo: 'O NUMA só emite nota fiscal se você está no monotributo.',
    sinCargar: 'Não informado',
    seCambia: 'Altere em Seu orçamento',
    ingresosBrutos: 'Ingresos Brutos',
    inicio: 'Início das atividades',
    ayuda:
      'Esses dados saem nas suas notas fiscais. Se não souber algum, pergunte ao seu contador.',
    ingresosBrutosLargo: (maximo) => `Não pode passar de ${String(maximo)} caracteres.`,
  },
  concepto: {
    titulo: 'O que você fatura',
    opciones: { 1: 'Produtos', 2: 'Serviços', 3: 'Produtos e serviços' },
    ayuda:
      'Quem define é o seu contador. Muda o que diz a nota fiscal e as datas que a ARCA aceita.',
    muebles: (precio) =>
      `Se o seu monotributo é de venda de bens móveis, nenhum móvel que você vender pode valer mais de ${precio}. Se um projeto passar disso, fale com o seu contador.`,
  },
  categoria: {
    titulo: 'Sua categoria do monotributo',
    sinElegir: 'Não escolhida',
    opcion: (letra, tope) => `${letra} · até ${tope} por ano`,
    ayuda:
      'É revisada até 5 de fevereiro e 5 de agosto, com o que você faturou nos últimos 12 meses.',
  },
  cambios: {
    ingresosBrutos: 'Ingresos Brutos',
    inicio: 'o início das atividades',
    concepto: 'o que você fatura',
    categoria: 'sua categoria',
    cuantos: (cuantos) => (cuantos === 1 ? '1 alteração' : `${String(cuantos)} alterações`),
  },
  asistente: {
    titulo: 'Conectar com a ARCA',
    volver: 'Faturamento',
    bajada:
      'Você faz isso uma única vez, num computador e com a sua clave fiscal (a senha da ARCA). Você vai e volta entre o NUMA e o site da ARCA: o NUMA te dá um pedido de certificado, a ARCA assina e você traz de volta aqui.',
    antesDeEmpezar: 'Antes de começar',
    loQueNecesitas:
      'Você precisa do seu CUIT, de uma clave fiscal de nível 3 ou mais e dos seus dados completos em Seu orçamento. Se a sua clave for de nível 2, você sobe de nível no app Mi ARCA ou numa agência da ARCA. Se tiver dúvidas sobre o que você fatura, fale antes com o seu contador.',
    enNuma: 'No NUMA',
    enArca: 'Na ARCA',
    paso: (numero) => `Passo ${String(numero)}:`,
    hecho: 'Feito.',
    sinSenal: 'Para isso você precisa de internet.',
    apagada: 'O faturamento de verdade ainda não está ligado. Avise o Joaco.',
    enPrueba: 'Esta marcenaria está no modo teste.',
    noSePudo: 'Não foi possível. Tente de novo daqui a pouco.',
    abreEnOtraPestana: 'abre numa aba nova',
    pedido: {
      titulo: 'Baixe o pedido de certificado',
      texto: 'É um arquivo que pede à ARCA um certificado para o NUMA.',
      bajar: 'Baixar o pedido',
      bajarDeNuevo: 'Baixar o pedido de novo',
      listo:
        'Pronto: numa-produccion.csr foi baixado. Se você perder, baixe de novo e envie o novo para a ARCA.',
      otroPedido: 'Baixar outro pedido?',
      siBajasOtro: 'Se você baixar outro pedido, o certificado que você enviou deixa de servir.',
      bajarOtro: 'Baixar outro pedido',
      cancelar: 'Cancelar',
      noMonotributo: 'O NUMA só emite nota fiscal se você está no monotributo.',
      faltanTusDatos: 'Complete seu CUIT e seu nome ou razão social em Seu orçamento.',
      irATuPresupuesto: 'Ir para Seu orçamento',
    },
    ingresar: {
      titulo: 'Entre na ARCA',
      texto: 'Em arca.gob.ar, toque em “Iniciar sesión” e entre com seu CUIT e sua clave fiscal.',
    },
    certificados: {
      titulo: 'Abra os certificados digitais',
      texto:
        'Nos seus serviços, procure “Administración de Certificados Digitales” e abra. Se perguntar quem você representa, escolha o seu nome.',
      siNoLoEncontras:
        'Se não encontrar, adicione em “Administrador de Relaciones de Clave Fiscal” › “Nueva Relación”, procurando esse serviço e confirmando com o seu CUIT, e entre de novo na ARCA.',
    },
    alias: {
      titulo: 'Cadastre o certificado do NUMA',
      texto:
        'Toque em “Agregar alias”. Em “Alias” escreva numa, em “Seleccionar archivo” escolha numa-produccion.csr e toque em “Agregar alias”. Se você já tem o alias numa (porque está renovando ou porque já enviou outro pedido), entre em “Ver” e adicione ali o pedido novo.',
    },
    descargar: {
      titulo: 'Baixe o certificado',
      texto: 'Na lista, à direita de numa, toque em “Ver” e depois em “Descargar”.',
      guia: 'O guia da ARCA para o certificado',
    },
    subir: {
      titulo: 'Envie o certificado',
      texto: 'Escolha o arquivo que você baixou da ARCA.',
      elegir: 'Escolher o certificado',
      elegirOtro: 'Escolher outro certificado',
      archivo: 'O certificado que você baixou da ARCA',
      listo: (fecha) => `Certificado pronto. Vence em ${fecha}.`,
      motivos: {
        'no-es-un-certificado':
          'Esse arquivo não é um certificado. Escolha o que você baixou da ARCA.',
        'no-es-de-este-pedido':
          'Esse certificado não é do último pedido que você baixou do NUMA. Envie esse pedido para a ARCA e baixe o certificado de novo.',
        'otro-cuit': 'Esse certificado é de outro CUIT.',
        vencido: 'Esse certificado está vencido.',
      },
    },
    autorizar: {
      titulo: 'Autorize o certificado a emitir notas fiscais',
      texto:
        'Volte aos seus serviços e abra “Administrador de Relaciones de Clave Fiscal”. Toque em “Nueva Relación” e depois em “Buscar”. Escolha “ARCA” (em algumas telas diz “AFIP”), depois “WebServices” e depois “Facturación Electrónica”.',
    },
    representante: {
      titulo: 'Escolha o certificado do NUMA',
      texto:
        'Toque no segundo “Buscar”, o do representante, escolha o certificado numa e toque em “Confirmar”. Na tela seguinte, toque em “Confirmar” de novo.',
      guia: 'O guia da ARCA para autorizar',
    },
    puntosDeVenta: {
      titulo: 'Abra os pontos de venda',
      texto:
        'Volte aos seus serviços, procure “Administración de puntos de venta y domicilios” e abra. Se pedir para escolher quem você representa, escolha o seu nome. Toque em “A/B/M de puntos de venta / emisión” e feche o aviso de “ATENCION” que aparece.',
    },
    puntoDeVenta: {
      titulo: 'Crie o ponto de venda do NUMA',
      texto: 'Toque em “Agregar..” e preencha:',
      campos: [
        {
          termino: 'Número',
          texto: 'um de cinco dígitos que você não esteja usando, por exemplo 00003. Anote.',
        },
        { termino: 'Nombre Fantasía', texto: 'NUMA.' },
        {
          termino: 'Sistema',
          texto: 'o que diz “Factura Electrónica”, “Monotributo” e “Web Services”.',
        },
        { termino: 'Nuevo domicilio', texto: 'o da marcenaria.' },
        { termino: 'Actividad', texto: 'a da marcenaria, a mesma do seu monotributo.' },
      ],
      despues: 'Deixe “Dominio Asociado” vazio. Toque em “Aceptar” e confirme se perguntar.',
    },
    conectar: {
      titulo: 'Conecte',
      texto: 'Escreva o número do ponto de venda que você criou.',
      campo: 'Ponto de venda',
      faltaElNumero: 'Escreva o número do ponto de venda, de um a cinco dígitos.',
      boton: 'Conectar',
      probando: 'Verificando com a ARCA…',
      listo:
        'Pronto, o faturamento ficou conectado. Já dá para emitir nota fiscal dos seus recebimentos.',
      volver: 'Voltar para Faturamento',
      deVerdad: 'Conectar o faturamento de verdade?',
      desdeAhora:
        'A partir de agora, cada nota fiscal que você emitir no NUMA vai ser real, no seu nome e com validade fiscal.',
      cancelar: 'Cancelar',
      cambiarElCertificado: 'Trocar o certificado?',
      desdeAhoraElNuevo: 'A partir de agora, o NUMA vai usar o certificado novo.',
      cambiar: 'Trocar o certificado',
      certificadoCambiado: 'Pronto, o NUMA já usa o certificado novo.',
      motivos: {
        'login-rechazado': 'A ARCA não deixa entrar com o certificado: revise os passos 7 e 8.',
        'sin-punto-de-venta': (puntoDeVenta) =>
          `A ARCA não tem o ponto de venda ${puntoDeVenta} para web services: revise o número ou o passo 10.`,
        'punto-de-venta-de-otro-taller':
          'Esse ponto de venda já é usado por outra marcenaria no NUMA.',
        'comprobantes-en-vuelo':
          'Há notas fiscais anteriores esperando a ARCA: tente de novo daqui a pouco.',
        'otro-punto-de-venta': 'Para renovar, o ponto de venda tem que ser o mesmo.',
        'otro-cuit': 'Esse certificado é de outro CUIT.',
        'sin-certificado': 'Primeiro envie o certificado, no passo 6.',
        'arca-no-contesta': 'A ARCA não está respondendo agora. Tente daqui a pouco.',
        esperando: (hora) => `A ARCA pede para esperar: tente de novo às ${hora}.`,
      },
    },
    renovacion: {
      siNoDejaEntrar: 'Se a ARCA não deixar entrar com o certificado novo',
      rechazado:
        'A ARCA não deixa entrar com o certificado novo: autorize-o a emitir notas fiscais com os passos 7 e 8.',
    },
    capturas: {
      '01-ingresar': 'A tela de entrada da ARCA, com o campo do CUIT e o botão “Siguiente”.',
      '02-certificados-digitales':
        'A busca dos seus serviços na ARCA, com “Administración de Certificados Digitales” escolhido.',
      '03-agregar-alias':
        'A tela “Agregar alias” da ARCA, com o alias numa e o arquivo numa-produccion.csr escolhido, antes de tocar em “Agregar alias”.',
      '04-descargar':
        'O certificado de numa na ARCA, depois de tocar em “Ver”, com o botão “Descargar”.',
      '05-elegir-el-servicio':
        'A tela “Nueva Relación” da ARCA, com o serviço “Facturación Electrónica” escolhido e o segundo “Buscar”, o do representante.',
      '06-representante':
        'O representante na ARCA, com o certificado numa escolhido, antes de tocar em “Confirmar”.',
      '07-puntos-de-venta':
        'O menu dos pontos de venda da ARCA, com o botão “A/B/M de puntos de venta / emisión”.',
      '08-agregar-punto-de-venta':
        'O cadastro do ponto de venda na ARCA, completo com o número, NUMA, o sistema, o endereço e a atividade, antes de tocar em “Aceptar”.',
    },
  },
  cobrosYFacturas: 'Recebimentos e notas fiscais',
  renglon: {
    sinFacturar: 'Sem nota fiscal',
    facturar: 'Emitir nota fiscal',
    facturarElPago: (monto, dia) => `Emitir a nota fiscal do pagamento de ${monto} de ${dia}`,
    enDolares: 'Em dólares: por enquanto, a nota fiscal é feita à mão.',
    enCola: 'Nota fiscal solicitada sem internet: sai quando a internet voltar.',
    pidiendo: 'Solicitando a nota fiscal à ARCA…',
    demora: 'A ARCA não responde. O NUMA continua tentando.',
    anulando: (numero) => `Anulando a Factura C ${numero}…`,
    anulada: (nombre) => `${nombre}, anulada`,
    noAnulo: (motivo) => `A ARCA não anulou a nota fiscal: ${motivo}`,
    rechazada: (motivo) => `A ARCA não autorizou: ${motivo}`,
    volverAPedir: 'Solicitar de novo',
    aRevisar: 'Confira na ARCA: o NUMA não sabe se ela foi autorizada.',
  },
  motivos: {
    condicionIva: 'confira a condição do cliente perante o IVA.',
    documento: 'confira o CUIT ou o DNI do cliente.',
    deArca: (texto, codigo) => `${texto} (código ${codigo}).`,
    sinMotivo: 'A ARCA não disse por quê.',
  },
  anuncios: {
    autorizada: (numero) => `A Factura C ${numero} foi autorizada.`,
    anulada: (numero) => `A Factura C ${numero} foi anulada.`,
    rechazada: 'A ARCA não autorizou a nota fiscal.',
    notaRechazada: (numero) => `A ARCA não anulou a Factura C ${numero}.`,
    aRevisar: 'Há uma nota fiscal para conferir na ARCA.',
  },
  facturar: {
    titulo: 'Emitir a nota fiscal deste pagamento',
    rotulo: 'O comprovante',
    comprobante: 'Comprovante',
    facturaC: 'Factura C',
    puntoDeVenta: 'Ponto de venda',
    numero: 'Número',
    elQueSiga: 'O próximo',
    fecha: 'Data',
    hoy: (dia) => `Hoje, ${dia}`,
    para: 'Para',
    sinCuit: 'sem CUIT',
    cuit: (cuit) => `CUIT ${cuit}`,
    dni: (dni) => `DNI ${dni}`,
    detalle: 'Descrição',
    ayudaDelDetalle: 'É o que diz a nota fiscal. Até 200 caracteres.',
    faltaElDetalle: 'Escreva a descrição da nota fiscal.',
    importe: 'Valor',
    queFacturas: (que) => `O que você fatura: ${que} · altere em Configurações`,
    modoPrueba: 'Você está no modo teste: a nota fiscal não vale para a ARCA.',
    conFechaDeHoy: (dia) => `Este recebimento é de ${dia}: a nota fiscal sai com a data de hoje.`,
    conEstaFactura: (llevas, letra, tope) =>
      `Com esta nota fiscal você soma ${llevas} faturados nos últimos 12 meses. Sua categoria ${letra} vai até ${tope}.`,
    loQueFalta: 'O que falta para emitir',
    completarlos: 'Completar',
    cargarElCuit: 'Informar o CUIT',
    revisarElCuit: 'Conferir o CUIT',
    cargarElDomicilio: 'Informar o endereço',
    cargarElDni: 'Informar o DNI',
    noSeBorra:
      'Uma nota fiscal emitida não pode ser excluída. Se você errar, ela é anulada com uma nota de crédito.',
    emitir: (monto) => `Emitir a nota fiscal de ${monto}`,
    cancelar: 'Cancelar',
    sinSenal: 'Sem internet: a nota fiscal sai quando a internet voltar.',
  },
  factura: {
    rotulo: 'A nota fiscal',
    fecha: 'Data',
    cae: 'CAE',
    venceElCae: 'Vencimento do CAE',
    importe: 'Valor',
    para: 'Para',
    detalle: 'Descrição',
    verElPdf: 'Ver o PDF',
    verElPdfDeLaNota: 'Ver o PDF da nota de crédito',
    compartir: 'Compartilhar',
    anular: 'Anular a nota fiscal',
    anuladaCon: (numero, dia) => `Anulada com a Nota de crédito C ${numero} de ${dia}.`,
    aRevisar: (numero) =>
      `O NUMA solicitou à ARCA a Factura C ${numero} e não sabe se ela foi autorizada. Confira na ARCA, em Mis Comprobantes › Emitidos. Enquanto isso, este pagamento não recebe outra nota fiscal.`,
    notaARevisar: (numero) =>
      `O NUMA solicitou à ARCA a Nota de crédito C ${numero} e não sabe se ela foi autorizada. Confira na ARCA, em Mis Comprobantes › Emitidos.`,
  },
  anular: {
    pregunta: (numero) => `Anular a Factura C ${numero}?`,
    texto: (monto, cliente) =>
      `Sai uma Nota de crédito C de ${monto} para ${cliente}. Ela fica na ARCA e não pode ser excluída. Depois você pode emitir de novo a nota fiscal deste pagamento.`,
    emitir: 'Emitir a nota de crédito',
    dejarla: 'Deixar como está',
  },
  cobro: {
    facturarElPagoFinal: 'Emitir a nota fiscal do pagamento final com a ARCA',
    aNombreDe: (nombre, condicion) => `Sai em nome de ${nombre}, ${condicion}.`,
  },
  bloqueos: {
    pagoFacturado: 'Tem uma nota fiscal da ARCA: para alterar, anule a nota fiscal primeiro.',
    trabajoConFacturas:
      'Este projeto tem notas fiscais da ARCA e não pode ser excluído. Se não for adiante, marque como perdido.',
  },
  monotributo: {
    titulo: 'Monotributo',
    sinCategoria: 'Sem categoria',
    categoriaDe: (letra) => `Categoria ${letra}`,
    facturados: 'faturados nos últimos 12 meses',
    rango: (desde) => `de ${desde} até hoje`,
    barra: (porcentaje, letra, tope) => `${porcentaje} % do teto da categoria ${letra}, ${tope}`,
    deTope: (porcentaje, tope) => `${porcentaje} % de ${tope}`,
    topeDeLa: (letra) => `teto da ${letra}`,
    cerca: (letra) => `Você está chegando ao teto da categoria ${letra}.`,
    pasado: (letra) =>
      `Você passou do teto da categoria ${letra}. Na próxima recategorização você vai para outra: fale com o seu contador.`,
    fuera: 'Você passou do teto do monotributo. Fale com o seu contador já.',
    proxima: 'Próxima recategorização',
    hasta: (dia) => `até ${dia}`,
    cobrosSinFacturar: 'Recebimentos sem nota fiscal',
    cobros: (cuantos) => (cuantos === 1 ? '1 recebimento' : `${String(cuantos)} recebimentos`),
    cobrosSinFacturarEnPalabras: (cuantos) =>
      cuantos === 1
        ? '1 recebimento sem nota fiscal'
        : `${String(cuantos)} recebimentos sem nota fiscal`,
    todosConFactura: (desde) => `Todos os seus recebimentos desde ${desde} têm nota fiscal.`,
    pie: 'Conta o que você faturou com o NUMA. Se você também fatura por fora, confira no Monitor de Facturación da ARCA.',
    elegiTuCategoria: 'Escolha sua categoria em Configurações para ver quanto falta para o teto.',
    elegirLaCategoria: 'Escolher a categoria',
    enPrueba: 'No modo teste nada conta: as notas fiscais de teste não são de verdade.',
  },
  cobrosSinFacturar: {
    titulo: 'Recebimentos sem nota fiscal',
    bajada: (desde) => `O que você recebeu em pesos desde ${desde} e ainda não tem nota fiscal.`,
    vacia: (desde) => `Tudo o que você recebeu desde ${desde} tem nota fiscal.`,
    detalle: (trabajo, dia) => `${trabajo} · ${dia}`,
  },
  alertas: {
    laFactura: 'a Factura C',
    laNota: 'a Nota de crédito C',
    fueraDeNuma: {
      tituloDeLaFactura: 'A ARCA tem uma nota fiscal que o NUMA não fez',
      tituloDeLaNota: 'A ARCA tem uma nota de crédito que o NUMA não fez',
      texto: (documento, puntoDeVenta, deArca, deNuma) =>
        `No ponto de venda ${puntoDeVenta}, a ARCA está n${documento} ${deArca} e o NUMA fez até a ${deNuma}. Se você fez por fora, está tudo certo; se não, confira na ARCA.`,
      sinNinguna: (documento, puntoDeVenta, deArca) =>
        `No ponto de venda ${puntoDeVenta}, a ARCA está n${documento} ${deArca} e o NUMA ainda não fez nenhuma. Se você fez por fora, está tudo certo; se não, confira na ARCA.`,
      yaLoRevise: 'Revisado',
    },
    aRevisar: {
      tituloDeLaFactura: 'Há uma nota fiscal para conferir na ARCA',
      tituloDeLaNota: 'Há uma nota de crédito para conferir na ARCA',
      texto: (documento, numero, cliente) =>
        `O NUMA solicitou ${documento} ${numero} de ${cliente} e não sabe se ela foi autorizada.`,
      verElTrabajo: 'Ver o projeto',
    },
    certificado: {
      titulo: (fecha) => `O certificado da ARCA vence em ${fecha}`,
      texto: 'Sem certificado, o NUMA não consegue emitir notas fiscais. Renove antes dessa data.',
      renovar: 'Renovar o certificado',
    },
    sinAcceso: {
      titulo: 'O NUMA não conseguiu entrar na ARCA',
      texto: 'As notas fiscais solicitadas estão esperando. Verifique a conexão em Configurações.',
      probar: 'Verificar a conexão',
    },
  },
} satisfies Mensajes['facturacion'];
