import type { Mensajes } from '../es';
import { plural } from './plural';

function marcadas(cuantas: number, total: number): string {
  if (cuantas === 0) return total === 1 ? 'não marcada' : 'nenhuma marcada';
  if (cuantas === total) return total === 1 ? 'marcada' : 'todas marcadas';
  return plural(cuantas, { one: '# marcada', other: '# marcadas' });
}

function marcados(cuantos: number, total: number): string {
  if (cuantos === 0) return total === 1 ? 'não marcado' : 'nenhum marcado';
  if (cuantos === total) return total === 1 ? 'marcado' : 'todos marcados';
  return plural(cuantos, { one: '# marcado', other: '# marcados' });
}

export const configurarTaller = {
  guardado: 'Salvo.',
  enLaCola: 'Ficou na fila: vai ser salvo quando a internet voltar.',
  cuit: (numero) => `CUIT ${numero}`,
  errorDelCuit:
    'Um CUIT (identificação fiscal argentina) tem 11 dígitos. Deixe em branco se não tiver em mãos.',
  configuracion: {
    nombreDelTaller: 'Nome da marcenaria',
    sueldo: 'Seu pró-labore',
    ayudaDelSueldoPorMes:
      'O que a sua casa precisa por mês. Os recebimentos do mês vão cobrindo e, depois de coberto, o que sobra fica na marcenaria.',
    ayudaDelSueldoPorTrabajo: 'O que cada projeto recebido transfere para a casa.',
    costosFijos: 'Custos fixos por mês',
    ayudaDeLosCostosFijos: 'Aluguel, contas e tudo o que se paga mesmo quando não entra trabalho.',
    metaDeCocos: 'Meta do Cocos',
    ayudaDeLaMeta: 'Quanto você quer alcançar na reserva investida.',
    sena: 'Sinal que você pede (%)',
    ayudaDeLaSena:
      'A parte do orçamento que você pede para confirmar um projeto. O normal é a metade, e dá para mudar em um projeto específico.',
    relevamiento: 'Valor da visita técnica',
    ayudaDelRelevamiento:
      'O cliente vê na própria página enquanto falta ir medir. Se deixar em branco, o cliente vê o que é a visita técnica, mas não o preço.',
    vigencia: 'Dias de validade do orçamento',
    ayudaDeLaVigencia:
      'Contam a partir do dia em que você envia. O cliente vê até quando pode pagar o sinal, e a data pode ser mudada em cada projeto.',
    tasa: 'Taxa anual do Cocos (%)',
    ayudaDeLaTasa: 'Serve só para fazer projeções. Se não souber, deixe em 0.',
    guardarTodo: 'Salvar configuração',
    guardarElReparto: 'Salvar pró-labore e custos',
    errores: {
      nombre: (caracteres) =>
        plural(caracteres, {
          one: 'Digite um nome para a marcenaria, com até # caractere.',
          other: 'Digite um nome para a marcenaria, com até # caracteres.',
        }),
      importe: 'Digite um valor, por exemplo 1.800.000. Pode deixar em 0.',
      tasa: 'Digite a taxa como porcentagem, por exemplo 40. Pode deixar em 0.',
      sena: 'Digite o sinal como porcentagem entre 0 e 100, por exemplo 50.',
      vigencia: (maximo) =>
        `Digite por quantos dias um orçamento vale, entre 1 e ${String(maximo)}. O normal são 15.`,
    },
  },
  cobro: {
    alias: 'Alias',
    ayudaDelAlias:
      'Alias (apelido da conta, como uma chave Pix): o que o cliente digita no banco ou na carteira digital.',
    cbuOCvu: 'CBU ou CVU',
    cvuDeLaBilletera: 'CVU da carteira digital',
    ayudaDelCbu:
      'Os 22 dígitos. O CBU é o número da conta bancária argentina, e o CVU, o da carteira digital. Aparecem de quatro em quatro para facilitar a leitura; o cliente copia de uma vez.',
    titular: 'Titular da conta',
    ayudaDelTitular: 'Em nome de quem está. É o que o cliente vê no banco antes de confirmar.',
    cuitDelTitular: 'CUIT do titular',
    ayudaDelCuit: 'Opcional. É a identificação fiscal argentina do titular.',
    link: 'Link do Mercado Pago',
    ayudaDelLink:
      'Opcional. No app do Mercado Pago, entre em “Cobrar”, “Link de pago”, “Link sin monto definido”. Copie e cole aqui. O cliente vê como um botão para pagar você.',
    comision:
      'O que entrar por este link é uma cobrança do Mercado Pago e tem desconto de comissão, mesmo que o cliente pague com dinheiro da própria conta: em Buenos Aires, 6,60% mais IVA (o imposto argentino sobre o consumo) se você quiser o dinheiro na hora e 1,56% mais IVA esperando 35 dias. Receber por transferência no alias não custa nada.',
    verLosCostos: 'Ver as tarifas no Mercado Pago',
    guardar: 'Salvar dados',
    errores: {
      aliasConOtrosCaracteres:
        'Um alias só pode ter letras, números, ponto e hífen. Nada de espaços, sublinhados ou acentos.',
      aliasDeOtroLargo:
        'Um alias tem de 6 a 20 caracteres. Se não lembrar, confira no app do banco.',
      cbuDeOtroLargo: 'Um CBU ou CVU tem 22 dígitos. Copie do banco em vez de digitar de memória.',
      cbuConOtroBanco:
        'Este número não fecha: o dígito verificador do banco não bate. Confira os oito primeiros.',
      cbuConOtraCuenta:
        'Este número não fecha: o dígito verificador da conta não bate. Confira os catorze últimos.',
      titularLargo: (caracteres) =>
        plural(caracteres, {
          one: 'O nome do titular pode ter até # caractere.',
          other: 'O nome do titular pode ter até # caracteres.',
        }),
      linkLargo: (caracteres) =>
        plural(caracteres, {
          one: 'Um link do Mercado Pago não passa de # caractere. Copie de novo no app.',
          other: 'Um link do Mercado Pago não passa de # caracteres. Copie de novo no app.',
        }),
      linkSinHttps:
        'Cole o link inteiro, começando por https://. Use o botão de copiar do app do Mercado Pago.',
      linkDeOtroSitio: (sitios) =>
        `Este link não é do Mercado Pago. Ele precisa começar com um destes: ${sitios}.`,
    },
    avisos: {
      aliasConSeparadorEnLaPunta:
        'Começa ou termina com ponto ou hífen. A norma do Banco Central argentino não proíbe: se for o seu, salve assim mesmo.',
      aliasConSeparadoresSeguidos:
        'Tem dois pontos ou hífens seguidos. A norma do Banco Central argentino não proíbe: se for o seu, salve assim mesmo.',
      cuitAmbiguo:
        'O dígito verificador deste CUIT cai no caso que não tem uma convenção única. Salve assim mesmo se copiou certo.',
      cuitConOtroPrefijo:
        'Os CUIT começam com 20, 23, 24, 27, 30, 33 ou 34. Confira, mas você pode salvar assim mesmo.',
      cuitConOtroVerificador:
        'O dígito verificador não bate. Confira, mas você pode salvar assim mesmo.',
    },
  },
  redes: {
    nombres: {
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
    },
    ejemplos: {
      instagram: '@suamarcenaria',
      facebook: 'facebook.com/suamarcenaria',
      tiktok: '@suamarcenaria',
    },
    ayuda:
      'Opcionais. Cole o link do seu perfil ou digite seu usuário com o @. O que ficar em branco não aparece.',
    guardar: 'Salvar redes sociais',
    errores: {
      instagram: {
        'otra-red':
          'Esse link não é do Instagram. Cole o link do seu perfil ou digite seu usuário com o @.',
        'no-es-un-perfil':
          'Esse link não é do seu perfil: é de uma publicação, um reel, um story ou outra parte do Instagram. Cole o link do seu perfil ou digite seu usuário com o @.',
        usuario:
          'Digite seu usuário do Instagram, com ou sem o @: letras, números, pontos e sublinhados, sem espaços.',
      },
      facebook: {
        'otra-red':
          'Esse link não é do Facebook. Cole o link da página ou do perfil da marcenaria.',
        'no-es-un-perfil':
          'Esse link não é da sua página: é de uma publicação, um grupo ou um link de compartilhamento. Entre na página da marcenaria e copie o endereço.',
        usuario:
          'Cole o endereço da página da marcenaria, como facebook.com/suamarcenaria: o nome vai sem espaços, com letras, números ou pontos.',
      },
      tiktok: {
        'otra-red':
          'Esse link não é do TikTok. Cole o link do seu perfil ou digite seu usuário com o @.',
        'no-es-un-perfil':
          'Esse link não é do seu perfil: é de um vídeo, um link curto ou outra parte do TikTok. Cole o link do seu perfil, que tem seu usuário com o @, ou digite seu usuário.',
        usuario:
          'Digite seu usuário do TikTok, com ou sem o @: letras, números, pontos e sublinhados, sem espaços.',
      },
    },
  },
  resena: {
    enlace: 'Link para deixar uma avaliação no Google',
    ayuda:
      'Opcional. No Google, procure sua empresa, toque em “Pedir avaliações” e copie o link que aparece. Todo cliente vê depois de responder à pesquisa de satisfação, seja qual for a resposta.',
    guardar: 'Salvar link',
    errores: {
      largo:
        'Esse link é longo demais. Copie o link curto que o Google mostra ao tocar em “Pedir avaliações”.',
      'sin-https': 'Precisa começar com https://. Copie o link inteiro do Google.',
      'otro-sitio':
        'Precisa ser um link do Google para deixar uma avaliação, como os que começam com https://g.page/ ou https://search.google.com/.',
    },
  },
  presupuesto: {
    ajustes: 'Configurações',
    titulo: 'Seu orçamento',
    queEs:
      'O que se repete em todos os seus orçamentos. Cada orçamento novo começa com isto e você pode ajustar em cada um; os que você já enviou não mudam. Toque em um texto para mudar.',
    salir: {
      titulo: 'Fechar sem salvar?',
      texto: 'O que você mudou ainda não foi salvo e, se sair, vai se perder.',
      seguirEditando: 'Continuar editando',
      descartar: 'Descartar',
    },
    secciones: {
      datos: {
        titulo: 'Seus dados no orçamento',
        bajada:
          'Vão no topo e no rodapé de cada página, como a lei exige: quem emite o orçamento, o CUIT (identificação fiscal argentina) e o endereço.',
      },
      numeros: {
        titulo: 'Números',
        bajada:
          'Completam seus textos: o que aparece marcado em cinza nos avisos e na garantia vem daqui.',
      },
      formas: {
        titulo: 'Formas de pagamento',
        dondeVa: 'Vai depois dos valores, com o prazo e a validade.',
        comoSeUsa:
          'Em cada orçamento você escolhe uma e pode ajustar. A primeira já vem escolhida.',
      },
      garantia: {
        titulo: 'Garantia',
        bajada:
          'Fecha o orçamento e não pode ser retirada: a lei exige garantia em todo móvel novo.',
      },
      textosDeSiempre: 'Textos padrão',
    },
    grupos: {
      aTenerEnCuenta: {
        titulo: 'Observações',
        resumen: (total, tildadas) =>
          `${plural(total, { '=0': '0 observações', one: '# observação', other: '# observações' })} · ${marcadas(tildadas, total)}`,
        dondeVa:
          'O que o projeto não inclui. Vai em um quadro, logo depois da descrição dos móveis.',
        tildadas:
          'O que você marcar aqui já vem marcado em cada orçamento novo. O resto você marca quando precisar.',
        tildada: 'Marcada em cada orçamento novo',
        tildadaCon: (texto) => `Marcada em cada orçamento novo: “${texto}”`,
        tildadaElTextoNuevo: 'Marcada em cada orçamento novo: o texto novo',
        agregar: 'Adicionar observação',
        quitar: 'Remover esta observação',
        etiquetaDelTexto: 'Texto da observação',
        nuevaSinGuardar: 'Nova, não salva',
        lleno: (cuantas) =>
          plural(cuantas, {
            one: 'Cabe no máximo # observação: para adicionar outra, remova uma.',
            other: 'Cabem no máximo # observações: para adicionar outra, remova uma.',
          }),
        seVaUna: (texto) => `Sai a observação que você adicionou: “${texto}”`,
        seVanVarias: (cuantas) =>
          plural(cuantas, { other: 'Saem as observações que você adicionou (#).' }),
      },
      incluye: {
        titulo: 'O que está incluso',
        resumen: (total, tildados) =>
          `${plural(total, { '=0': '0 itens', one: '# item', other: '# itens' })} · ${marcados(tildados, total)}`,
        dondeVa: 'A lista com marcas que vai depois de “Observações”.',
        tildadas: 'O que você marcar aqui já vem marcado em cada orçamento novo.',
        tildada: 'Marcado em cada orçamento novo',
        tildadaCon: (texto) => `Marcado em cada orçamento novo: “${texto}”`,
        tildadaElTextoNuevo: 'Marcado em cada orçamento novo: o texto novo',
        agregar: 'Adicionar item incluso',
        quitar: 'Remover da lista',
        etiquetaDelTexto: 'Item incluso',
        nuevaSinGuardar: 'Novo, não salvo',
        lleno: (cuantos) =>
          plural(cuantos, {
            one: 'Cabe no máximo # item: para adicionar outro, remova um.',
            other: 'Cabem no máximo # itens: para adicionar outro, remova um.',
          }),
        seVaUna: (texto) => `Sai o que você adicionou em “O que está incluso”: “${texto}”`,
        seVanVarias: (cuantos) =>
          plural(cuantos, { other: 'Sai o que você adicionou em “O que está incluso” (#).' }),
      },
      avisos: {
        titulo: 'Avisos',
        resumen: (total, tildados) =>
          `${plural(total, { '=0': '0 avisos', one: '# aviso', other: '# avisos' })} · ${marcados(tildados, total)}`,
        dondeVa: 'Vão no final do orçamento, antes das condições.',
        tildadas: 'O que você marcar aqui já vem marcado em cada orçamento novo.',
        tildada: 'Marcado em cada orçamento novo',
        tildadaCon: (texto) => `Marcado em cada orçamento novo: “${texto}”`,
        tildadaElTextoNuevo: 'Marcado em cada orçamento novo: o texto novo',
        agregar: 'Adicionar aviso',
        quitar: 'Remover este aviso',
        etiquetaDelTexto: 'Texto do aviso',
        nuevaSinGuardar: 'Novo, não salvo',
        lleno: (cuantos) =>
          plural(cuantos, {
            one: 'Cabe no máximo # aviso: para adicionar outro, remova um.',
            other: 'Cabem no máximo # avisos: para adicionar outro, remova um.',
          }),
        seVaUna: (texto) => `Sai o aviso que você adicionou: “${texto}”`,
        seVanVarias: (cuantos) =>
          plural(cuantos, { other: 'Saem os avisos que você adicionou (#).' }),
      },
      condiciones: {
        titulo: 'Condições',
        resumen: (total, tildadas) =>
          `${plural(total, { '=0': '0 condições', one: '# condição', other: '# condições' })} · ${marcadas(tildadas, total)}`,
        dondeVa: 'O que o cliente precisa deixar pronto. Vão depois dos avisos.',
        tildadas: 'O que você marcar aqui já vem marcado em cada orçamento novo.',
        tildada: 'Marcada em cada orçamento novo',
        tildadaCon: (texto) => `Marcada em cada orçamento novo: “${texto}”`,
        tildadaElTextoNuevo: 'Marcada em cada orçamento novo: o texto novo',
        agregar: 'Adicionar condição',
        quitar: 'Remover esta condição',
        etiquetaDelTexto: 'Texto da condição',
        nuevaSinGuardar: 'Nova, não salva',
        lleno: (cuantas) =>
          plural(cuantas, {
            one: 'Cabe no máximo # condição: para adicionar outra, remova uma.',
            other: 'Cabem no máximo # condições: para adicionar outra, remova uma.',
          }),
        seVaUna: (texto) => `Sai a condição que você adicionou: “${texto}”`,
        seVanVarias: (cuantas) =>
          plural(cuantas, { other: 'Saem as condições que você adicionou (#).' }),
      },
    },
    lista: {
      cambiar: 'Editar:',
      tituloOpcional: 'Título (opcional)',
      ayudaDelTitulo: 'Vai em negrito, acima do texto.',
      asiLoLeeTuCliente: 'como o cliente vai ler',
      ejemploDelTexto: 'Escreva do jeito que você quer que o cliente leia…',
      listo: 'Concluir',
      ordenar: 'Ordenar',
      ayudaAlOrdenar: 'Suba ou desça cada um: é nessa ordem que aparecem no orçamento.',
      cambiadoSinGuardar: 'Alterado, não salvo',
      seVaCuandoGuardes: 'Sai quando você salvar.',
      deshacer: 'Desfazer',
      subir: (texto) => `Mover “${texto}” para cima`,
      bajar: (texto) => `Mover “${texto}” para baixo`,
      subirElTextoNuevo: 'Mover o texto novo para cima',
      bajarElTextoNuevo: 'Mover o texto novo para baixo',
      loMarcadoSeCompletaSolo: 'O que está marcado se completa sozinho',
      sumarUnDato: 'Adicionar um dado que se completa sozinho',
    },
    huecos: {
      plazo: {
        nombre: 'Prazo',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> é o prazo de fabricação de cada orçamento, em dias úteis. Começa
            com o de “Números”, e em cada orçamento você pode mudar.
          </>
        ),
      },
      modificaciones: {
        nombre: 'Modificações',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> são as que estão incluídas no preço. Vêm de “Números”.
          </>
        ),
      },
      valor_modificacion: {
        nombre: 'Valor de uma modificação',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> é o valor de cada modificação extra. Vem de “Números”.
          </>
        ),
      },
      relevamiento: {
        nombre: 'Valor pago da visita técnica',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> é o que o cliente pagou até o dia em que você envia o orçamento;
            aqui o exemplo é o valor da visita técnica de “Sua marcenaria”. Se nada foi pago, este
            aviso não aparece.
          </>
        ),
      },
      sena: {
        nombre: 'Sinal',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> é o sinal de cada projeto; aqui o exemplo é o de “Sua marcenaria”.
          </>
        ),
      },
      meses: {
        nombre: 'Meses de garantia',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> é a duração da garantia. Vem de “Números”.
          </>
        ),
      },
    },
    formas: {
      vaElegida: 'Já vem escolhida',
      cambiarLaForma: 'Editar forma de pagamento',
      sinNombre: 'Sem nome',
      nuevaSinGuardar: 'Nova, não salva',
      nombre: 'Nome',
      ayudaDelNombre: 'É só para você escolher em cada orçamento. O cliente lê o texto abaixo.',
      loQueLeeTuCliente: 'O que o cliente lê',
      ejemploDelTexto: 'Por exemplo: sinal de 50% e o saldo em duas parcelas…',
      quitar: 'Remover esta forma de pagamento',
      cuantas: (cuantas) =>
        plural(cuantas, {
          '=0': '0 formas de pagamento',
          one: '# forma de pagamento',
          other: '# formas de pagamento',
        }),
      ayudaAlOrdenar: 'Suba ou desça cada uma: a primeira já vem escolhida em cada orçamento novo.',
      subirLaNueva: 'Mover a forma de pagamento nova para cima',
      bajarLaNueva: 'Mover a forma de pagamento nova para baixo',
      agregar: 'Adicionar forma de pagamento',
      lleno: (cuantas) =>
        plural(cuantas, {
          one: 'Cabe no máximo # forma de pagamento: para adicionar outra, remova uma.',
          other: 'Cabem no máximo # formas de pagamento: para adicionar outra, remova uma.',
        }),
    },
    garantia: {
      cambiarElTexto: 'Editar o texto da garantia:',
      texto: 'Texto da garantia',
    },
    datos: {
      asiSale: 'Assim aparece no topo de cada orçamento',
      vacio: 'Aqui vão seu nome ou razão social, seu CUIT, sua condição fiscal e seu endereço.',
      enComoTePagan: (Quien, quien) => (
        <>
          Em “Como você recebe” você tem <Quien>{quien}</Quien>. Se o orçamento for nesse nome, não
          precisa digitar de novo.
        </>
      ),
      usarElCobro: 'Usar o titular e o CUIT',
      cambiarTusDatos: 'Mudar seus dados',
      nombreORazonSocial: 'Nome ou razão social',
      ayudaDelNombre: 'Em nome de quem está o CUIT.',
      cuit: 'CUIT (identificação fiscal argentina)',
      ayudaDelCuit: 'Aparece ao lado do seu nome.',
      condicionFiscal: 'Condição fiscal',
      elegila: 'Escolha',
      ayudaDeLaCondicion: 'Aparece abaixo do seu CUIT.',
      domicilio: 'Endereço',
      ejemploDelDomicilio: 'Rua e número, cidade',
      ayudaDelDomicilio: 'O da marcenaria, com a cidade.',
      telefono: 'Telefone',
      ayudaDelTelefono: 'Com o telefone, o cliente tem um botão para falar com você pelo WhatsApp.',
      email: 'E-mail',
      ayudaDelEmail: 'Aparece ao lado do telefone.',
      tuCuit: 'seu CUIT',
      tuDomicilio: 'seu endereço',
    },
    numeros: {
      plazo: 'Prazo de fabricação (dias úteis)',
      ayudaDelPlazo: 'O que vem em cada orçamento novo. Em cada um você pode mudar.',
      garantia: 'Garantia (meses)',
      ayudaDeLaGarantia: 'A lei exige pelo menos 6 meses.',
      modificaciones: 'Modificações incluídas',
      ayudaDeLasModificaciones: 'As do projeto 3D que estão incluídas no preço.',
      valor: 'Valor de cada modificação extra',
      ayudaDelValor: 'O que você cobra por cada uma além dessas.',
    },
    problemas: {
      titularLargo: (caracteres) =>
        plural(caracteres, {
          one: 'O nome pode ter até # caractere.',
          other: 'O nome pode ter até # caracteres.',
        }),
      elNombre: 'o nome',
      elCuit: 'o CUIT',
      domicilioLargo: (caracteres) =>
        plural(caracteres, {
          one: 'O endereço pode ter até # caractere.',
          other: 'O endereço pode ter até # caracteres.',
        }),
      elDomicilio: 'o endereço',
      telefonoLargo: (caracteres) =>
        plural(caracteres, {
          one: 'O telefone pode ter até # caractere.',
          other: 'O telefone pode ter até # caracteres.',
        }),
      elTelefono: 'o telefone',
      emailMal: 'Confira o e-mail: precisa ser como marcenaria@exemplo.com.',
      elEmail: 'o e-mail',
      plazo: 'Digite o prazo em dias úteis, entre 1 e 365.',
      elPlazo: 'o prazo de fabricação',
      garantiaCorta: 'A lei exige pelo menos 6 meses.',
      garantia: 'Digite os meses de garantia, entre 6 e 120.',
      losMeses: 'os meses de garantia',
      modificaciones: 'Digite quantas estão incluídas no preço, entre 0 e 10.',
      lasModificaciones: 'as modificações incluídas',
      valor: 'Digite quanto custa uma modificação extra. Pode ser 0.',
      elValor: 'o valor de uma modificação',
      textoVacio: 'Escreva o texto ou remova da lista.',
      unTextoVacio: 'um texto vazio',
      textoLargo: (caracteres) =>
        plural(caracteres, {
          one: 'Um texto pode ter até # caractere.',
          other: 'Um texto pode ter até # caracteres.',
        }),
      unTextoLargo: 'um texto longo demais',
      sinFormas: 'Deixe pelo menos uma forma de pagamento: em cada orçamento você escolhe uma.',
      lasFormas: 'as formas de pagamento',
      formaSinNombre: 'Dê um nome para escolher em cada orçamento.',
      elNombreDeLaForma: 'o nome de uma forma de pagamento',
      formaVacia: 'Escreva como o cliente paga ou remova.',
      unaFormaVacia: 'uma forma de pagamento vazia',
      garantiaVacia: 'A garantia não pode ficar vazia.',
      garantiaLarga: (caracteres) =>
        plural(caracteres, {
          one: 'A garantia pode ter até # caractere.',
          other: 'A garantia pode ter até # caracteres.',
        }),
      elTextoDeLaGarantia: 'o texto da garantia',
      textos: 'Há um texto que não pode ser salvo assim.',
      losTextos: 'os textos',
    },
    cambios: {
      tusDatos: 'seus dados',
      losNumeros: 'os números',
      primero: {
        nuevos: (cuantos) => plural(cuantos, { one: 'um texto novo', other: '# textos novos' }),
        cambiados: (cuantos) =>
          plural(cuantos, { one: 'um texto alterado', other: '# textos alterados' }),
        quitados: (cuantos) =>
          plural(cuantos, { one: 'um texto removido', other: '# textos removidos' }),
      },
      despues: {
        nuevos: (cuantos) => plural(cuantos, { one: 'um novo', other: '# novos' }),
        cambiados: (cuantos) => plural(cuantos, { one: 'um alterado', other: '# alterados' }),
        quitados: (cuantos) => plural(cuantos, { one: 'um removido', other: '# removidos' }),
      },
      elOrden: 'a ordem',
      loQueSaleTildado: 'o que vem marcado',
      cuantos: (cuantos) => plural(cuantos, { one: '# alteração', other: '# alterações' }),
    },
    barra: {
      sinGuardar: 'Não salvo',
      conLosCambios: (cambios) => `: ${cambios}`,
      noSeGuardo: (queRevisar) => `Não foi possível salvar: confira ${queRevisar}.`,
      guardarLosCambios: 'Salvar alterações',
    },
    seDeshace: {
      vuelve: (texto) => `Volta o texto “${texto}”, que você tinha removido.`,
      vuelveASuTexto: (texto) => `“${texto}” volta ao texto padrão.`,
      vuelveTildado: (texto) => `O texto “${texto}” volta a vir marcado.`,
      vuelveSinTildar: (texto) => `O texto “${texto}” volta a vir desmarcado.`,
      vuelvenLasFormas: 'Voltam as três formas de pagamento padrão, com os textos delas.',
      lasFormasVuelven: 'As formas de pagamento voltam aos textos padrão.',
      laGarantiaVuelveASuTexto: 'A garantia volta ao texto padrão.',
      elPlazoVuelve: (dias) =>
        plural(dias, {
          one: 'O prazo volta para # dia útil.',
          other: 'O prazo volta para # dias úteis.',
        }),
      vuelvenLasModificaciones: (cuantas, valor) =>
        plural(cuantas, {
          one: `Volta a entrar # modificação, e cada uma extra custa ${valor}.`,
          other: `Voltam a entrar # modificações, e cada uma extra custa ${valor}.`,
        }),
      laGarantiaVuelve: (meses) =>
        plural(meses, {
          one: 'A garantia volta para # mês.',
          other: 'A garantia volta para # meses.',
        }),
    },
    textosDeSiempre: {
      sinCambios:
        'Você está usando os textos padrão, os da sua planilha. O que mudar acima fica como seu, e daqui você pode voltar a eles quando quiser.',
      cambiaste: (cuantas) =>
        plural(cuantas, {
          one: 'Você mudou # coisa nos textos da sua planilha, os que vieram com o app. Se mudar de ideia, pode voltar a eles: seus dados não mudam.',
          other:
            'Você mudou # coisas nos textos da sua planilha, os que vieram com o app. Se mudar de ideia, pode voltar a eles: seus dados não mudam.',
        }),
      volver: 'Voltar aos textos padrão',
      pregunta: 'Voltar aos textos padrão?',
      bajadaDeLaPregunta: 'Os da sua planilha, que vieram com o app',
      seDeshacen: (cuantas) =>
        plural(cuantas, {
          one: '# coisa vai ser desfeita',
          other: '# coisas vão ser desfeitas',
        }),
      tambienSePierde:
        'O que você mudou nos textos e ainda não salvou também se perde. Seus dados não mudam, e os orçamentos que você já enviou ficam como estavam.',
      tusDatosNoCambian:
        'Seus dados não mudam, e os orçamentos que você já enviou ficam como estavam.',
      cancelar: 'Cancelar',
      volverALosDeSiempre: 'Voltar aos padrões',
    },
    resumen: {
      tusDatos: 'Seus dados',
      faltan: (cuantos, que) =>
        cuantos === 1
          ? `Falta ${que}, que a lei exige em um orçamento.`
          : `Faltam ${que}, que a lei exige em um orçamento.`,
      plazo: 'Prazo',
      diasHabiles: (dias) => plural(dias, { one: '#\u00a0dia útil', other: '#\u00a0dias úteis' }),
      garantia: 'Garantia',
      meses: (meses) => plural(meses, { one: '#\u00a0mês', other: '#\u00a0meses' }),
      textos: 'Textos',
      cuantosTextos: (incluye, avisos, condiciones) =>
        `${plural(incluye, { '=0': '0\u00a0itens inclusos', one: '#\u00a0item incluso', other: '#\u00a0itens inclusos' })}, ${plural(avisos, { '=0': '0\u00a0avisos', one: '#\u00a0aviso', other: '#\u00a0avisos' })} e ${plural(condiciones, { '=0': '0\u00a0condições', one: '#\u00a0condição', other: '#\u00a0condições' })}`,
      cambiar: 'Mudar o que vai nos seus orçamentos',
    },
  },
} satisfies Mensajes['configurarTaller'];
