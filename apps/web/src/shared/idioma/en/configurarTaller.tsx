import type { Mensajes } from '../es';
import { plural } from './plural';

function marcadas(cuantas: number, total: number): string {
  if (cuantas === 0) return total === 1 ? 'not checked' : 'none checked';
  if (cuantas === total) return total === 1 ? 'checked' : 'all checked';
  return plural(cuantas, { other: '# checked' });
}

export const configurarTaller = {
  guardado: 'Saved.',
  enLaCola: "Queued: it'll be saved when you're back online.",
  cuit: (numero) => `CUIT ${numero}`,
  errorDelCuit:
    "A CUIT (Argentine tax ID) has 11 digits. Leave it blank if you don't have it handy.",
  configuracion: {
    nombreDelTaller: 'Shop name',
    sueldo: "Your owner's pay",
    ayudaDelSueldoPorMes:
      "What your household needs each month. Each month's payments cover it and, once it's covered, the rest stays in the shop.",
    ayudaDelSueldoPorTrabajo: 'What each paid job transfers to the household.',
    costosFijos: 'Monthly fixed costs',
    ayudaDeLosCostosFijos: 'Rent, utilities and everything you pay even when no work comes in.',
    metaDeCocos: 'Cocos goal',
    ayudaDeLaMeta: 'How much you want your invested savings to reach.',
    sena: 'Deposit you ask for (%)',
    ayudaDeLaSena:
      "The part of the quote you ask for to confirm a job. It's usually half, and you can change it for a specific job.",
    relevamiento: 'Site measure fee',
    ayudaDelRelevamiento:
      'Your client sees it on their page until you go measure. If you leave it blank, they see what the site measure is but not the price.',
    vigencia: 'Days a quote is valid',
    ayudaDeLaVigencia:
      'Counted from the day you send it. Your client sees the deadline to pay the deposit, and you can change the date for each job.',
    tasa: 'Cocos annual rate (%)',
    ayudaDeLaTasa: "Only used for projections. If you don't know it, leave it at 0.",
    guardarTodo: 'Save settings',
    guardarElReparto: 'Save pay and costs',
    errores: {
      nombre: (caracteres) =>
        plural(caracteres, {
          one: 'Enter a name for your shop, up to # character.',
          other: 'Enter a name for your shop, up to # characters.',
        }),
      importe: 'Enter an amount, for example 1,800,000. You can leave it at 0.',
      tasa: 'Enter the rate as a percentage, for example 40. You can leave it at 0.',
      sena: 'Enter the deposit as a percentage between 0 and 100, for example 50.',
      vigencia: (maximo) =>
        `Enter how many days a quote is valid, between 1 and ${String(maximo)}. Usually it's 15.`,
    },
  },
  cobro: {
    alias: 'Alias',
    ayudaDelAlias:
      'The nickname of your Argentine account: the one your client types in their bank or wallet app.',
    cbuOCvu: 'CBU or CVU',
    cvuDeLaBilletera: 'Wallet CVU',
    ayudaDelCbu:
      "All 22 digits. A CBU is an Argentine bank account number, and a CVU is a digital wallet one. They're shown in groups of four so they're easy to read; your client copies it in one go.",
    titular: 'Account holder',
    ayudaDelTitular:
      "Whose name it's under. It's what your client sees in their bank before confirming.",
    cuitDelTitular: "Account holder's CUIT",
    ayudaDelCuit: "Optional. It's the account holder's Argentine tax ID.",
    link: 'Mercado Pago link',
    ayudaDelLink:
      'Optional. In your Mercado Pago app, go to “Cobrar”, “Link de pago”, “Link sin monto definido”. Copy it and paste it here. Your client sees it as a button to pay you.',
    comision:
      "Anything paid through this link is a Mercado Pago charge and they take a fee, even if your client pays with money from their own account: in Buenos Aires, 6.60% plus IVA (Argentine VAT) if you want the money right away, and 1.56% plus IVA if you wait 35 days. Transfers to your alias don't cost you anything.",
    verLosCostos: 'See the fees on Mercado Pago',
    guardar: 'Save details',
    errores: {
      aliasConOtrosCaracteres:
        'An alias can only have letters, numbers, periods and hyphens. No spaces, underscores or accents.',
      aliasDeOtroLargo:
        "An alias has 6 to 20 characters. If you don't remember it, check your bank app.",
      cbuDeOtroLargo:
        'A CBU or CVU has 22 digits. Copy it from your bank instead of typing it from memory.',
      cbuConOtroBanco:
        "This number doesn't add up: the bank check digit doesn't match. Check the first eight digits.",
      cbuConOtraCuenta:
        "This number doesn't add up: the account check digit doesn't match. Check the last fourteen digits.",
      titularLargo: (caracteres) =>
        plural(caracteres, {
          one: "The account holder's name can be up to # character.",
          other: "The account holder's name can be up to # characters.",
        }),
      linkLargo: (caracteres) =>
        plural(caracteres, {
          one: "A Mercado Pago link can't be longer than # character. Copy it again from the app.",
          other:
            "A Mercado Pago link can't be longer than # characters. Copy it again from the app.",
        }),
      linkSinHttps:
        'Paste the whole link, starting with https://. Use the copy button in the Mercado Pago app.',
      linkDeOtroSitio: (sitios) =>
        `This isn't a Mercado Pago link. It has to start with one of these: ${sitios}.`,
    },
    avisos: {
      aliasConSeparadorEnLaPunta:
        "It starts or ends with a period or a hyphen. Argentina's Central Bank rules don't forbid it: if it's yours, save it anyway.",
      aliasConSeparadoresSeguidos:
        "It has two periods or hyphens in a row. Argentina's Central Bank rules don't forbid it: if it's yours, save it anyway.",
      cuitAmbiguo:
        "This CUIT's check digit falls in the case with no single convention. Save it anyway if you copied it correctly.",
      cuitConOtroPrefijo:
        'CUITs start with 20, 23, 24, 27, 30, 33 or 34. Check it, but you can save it anyway.',
      cuitConOtroVerificador:
        "The check digit doesn't match. Check it, but you can save it anyway.",
    },
  },
  redes: {
    nombres: {
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
    },
    ejemplos: {
      instagram: '@yourshop',
      facebook: 'facebook.com/yourshop',
      tiktok: '@yourshop',
    },
    ayuda:
      "Optional. Paste your profile link, or type your username with the @. Whatever you leave blank won't show.",
    guardar: 'Save social links',
    errores: {
      instagram: {
        'otra-red':
          "That link isn't from Instagram. Paste your profile link, or type your username with the @.",
        'no-es-un-perfil':
          "That link isn't your profile: it's a post, a reel, a story or another part of Instagram. Paste your profile link, or type your username with the @.",
        usuario:
          'Type your Instagram username, with or without the @: letters, numbers, periods and underscores, no spaces.',
      },
      facebook: {
        'otra-red': "That link isn't from Facebook. Paste the link to your shop's page or profile.",
        'no-es-un-perfil':
          "That link isn't your page: it's a post, a group or a share link. Go to your shop's page and copy its address.",
        usuario:
          "Paste your shop's page address, like facebook.com/yourshop: the name has no spaces, just letters, numbers or periods.",
      },
      tiktok: {
        'otra-red':
          "That link isn't from TikTok. Paste your profile link, or type your username with the @.",
        'no-es-un-perfil':
          "That link isn't your profile: it's a video, a short link or another part of TikTok. Paste your profile link, which has your username with the @, or type your username.",
        usuario:
          'Type your TikTok username, with or without the @: letters, numbers, periods and underscores, no spaces.',
      },
    },
  },
  resena: {
    enlace: 'Link to leave a Google review',
    ayuda:
      'Optional. On Google, search for your business, tap “Ask for reviews” and copy the link it gives you. Every client sees it after answering the survey, whatever they answer.',
    guardar: 'Save link',
    errores: {
      largo:
        'That link is too long. Copy the short one Google gives you when you tap “Ask for reviews”.',
      'sin-https': 'It has to start with https://. Copy the whole link from Google.',
      'otro-sitio':
        'It has to be a Google review link, like the ones that start with https://g.page/ or https://search.google.com/.',
    },
  },
  presupuesto: {
    ajustes: 'Settings',
    titulo: 'Your quote',
    queEs:
      "What repeats in all your quotes. Every new quote starts with this and you can tweak it in each one; the ones you already sent don't change. Tap a text to change it.",
    salir: {
      titulo: 'Close without saving?',
      texto: "Your changes haven't been saved yet, and they'll be lost if you leave.",
      seguirEditando: 'Keep editing',
      descartar: 'Discard',
    },
    secciones: {
      datos: {
        titulo: 'Your details on the quote',
        bajada:
          'They go at the very top and at the foot of every page, as the law requires: who issues the quote, their CUIT (Argentine tax ID) and their address.',
      },
      numeros: {
        titulo: 'Numbers',
        bajada:
          'They fill in your texts: what you see highlighted in gray in the notices and the warranty comes from here.',
      },
      formas: {
        titulo: 'Payment options',
        dondeVa: 'It goes after the prices, with the lead time and the validity.',
        comoSeUsa: 'In each quote you pick one and can tweak it. The first one comes selected.',
      },
      garantia: {
        titulo: 'Warranty',
        bajada:
          "It closes the quote and can't be removed: the law requires a warranty on all new furniture.",
      },
      textosDeSiempre: 'Default texts',
    },
    grupos: {
      aTenerEnCuenta: {
        titulo: 'Good to know',
        resumen: (total, tildadas) =>
          `${plural(total, { one: '# note', other: '# notes' })} · ${marcadas(tildadas, total)}`,
        dondeVa:
          "What the job doesn't include. It goes in a box, right after the furniture details.",
        tildadas:
          'What you check here comes checked in every new quote. You check the rest yourself when needed.',
        tildada: 'Checked in every new quote',
        tildadaCon: (texto) => `Checked in every new quote: “${texto}”`,
        tildadaElTextoNuevo: 'Checked in every new quote: the new text',
        agregar: 'Add a note',
        quitar: 'Remove this note',
        etiquetaDelTexto: 'Note text',
        nuevaSinGuardar: 'New, not saved',
        lleno: (cuantas) =>
          plural(cuantas, {
            one: 'You can have up to # note: to add another, remove one.',
            other: 'You can have up to # notes: to add another, remove one.',
          }),
        seVaUna: (texto) => `The note you added goes away: “${texto}”`,
        seVanVarias: (cuantas) => plural(cuantas, { other: 'The notes you added go away (#).' }),
      },
      incluye: {
        titulo: "What's included",
        resumen: (total, tildadas) =>
          `${plural(total, { one: '# item', other: '# items' })} · ${marcadas(tildadas, total)}`,
        dondeVa: 'The checklist that goes after “Good\u00a0to\u00a0know”.',
        tildadas: 'What you check here comes checked in every new quote.',
        tildada: 'Checked in every new quote',
        tildadaCon: (texto) => `Checked in every new quote: “${texto}”`,
        tildadaElTextoNuevo: 'Checked in every new quote: the new text',
        agregar: 'Add an included item',
        quitar: 'Remove it from the list',
        etiquetaDelTexto: 'Included item',
        nuevaSinGuardar: 'New, not saved',
        lleno: (cuantas) =>
          plural(cuantas, {
            one: 'You can have up to # item: to add another, remove one.',
            other: 'You can have up to # items: to add another, remove one.',
          }),
        seVaUna: (texto) => `What you added to “What's included” goes away: “${texto}”`,
        seVanVarias: (cuantas) =>
          plural(cuantas, { other: "What you added to “What's included” goes away (#)." }),
      },
      avisos: {
        titulo: 'Notices',
        resumen: (total, tildados) =>
          `${plural(total, { one: '# notice', other: '# notices' })} · ${marcadas(tildados, total)}`,
        dondeVa: 'They go at the end of the quote, before the conditions.',
        tildadas: 'What you check here comes checked in every new quote.',
        tildada: 'Checked in every new quote',
        tildadaCon: (texto) => `Checked in every new quote: “${texto}”`,
        tildadaElTextoNuevo: 'Checked in every new quote: the new text',
        agregar: 'Add a notice',
        quitar: 'Remove this notice',
        etiquetaDelTexto: 'Notice text',
        nuevaSinGuardar: 'New, not saved',
        lleno: (cuantos) =>
          plural(cuantos, {
            one: 'You can have up to # notice: to add another, remove one.',
            other: 'You can have up to # notices: to add another, remove one.',
          }),
        seVaUna: (texto) => `The notice you added goes away: “${texto}”`,
        seVanVarias: (cuantos) => plural(cuantos, { other: 'The notices you added go away (#).' }),
      },
      condiciones: {
        titulo: 'Conditions',
        resumen: (total, tildadas) =>
          `${plural(total, { one: '# condition', other: '# conditions' })} · ${marcadas(tildadas, total)}`,
        dondeVa: 'What your client has to have ready. They go after the notices.',
        tildadas: 'What you check here comes checked in every new quote.',
        tildada: 'Checked in every new quote',
        tildadaCon: (texto) => `Checked in every new quote: “${texto}”`,
        tildadaElTextoNuevo: 'Checked in every new quote: the new text',
        agregar: 'Add a condition',
        quitar: 'Remove this condition',
        etiquetaDelTexto: 'Condition text',
        nuevaSinGuardar: 'New, not saved',
        lleno: (cuantas) =>
          plural(cuantas, {
            one: 'You can have up to # condition: to add another, remove one.',
            other: 'You can have up to # conditions: to add another, remove one.',
          }),
        seVaUna: (texto) => `The condition you added goes away: “${texto}”`,
        seVanVarias: (cuantas) =>
          plural(cuantas, { other: 'The conditions you added go away (#).' }),
      },
    },
    lista: {
      cambiar: 'Edit:',
      tituloOpcional: 'Title (optional)',
      ayudaDelTitulo: 'It goes in bold, above the text.',
      asiLoLeeTuCliente: 'as your client will read it',
      ejemploDelTexto: 'Write it the way you want your client to read it…',
      listo: 'Done',
      ordenar: 'Reorder',
      ayudaAlOrdenar: 'Move each one up or down: this is the order they appear in on the quote.',
      cambiadoSinGuardar: 'Changed, not saved',
      seVaCuandoGuardes: 'It goes away when you save.',
      deshacer: 'Undo',
      subir: (texto) => `Move “${texto}” up`,
      bajar: (texto) => `Move “${texto}” down`,
      subirElTextoNuevo: 'Move the new text up',
      bajarElTextoNuevo: 'Move the new text down',
      loMarcadoSeCompletaSolo: 'Highlighted items fill in on their own',
      sumarUnDato: 'Add an item that fills in on its own',
    },
    huecos: {
      plazo: {
        nombre: 'Lead time',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> is each quote's lead time, in business days. It starts with the one
            in “Numbers”, and you can change it in each quote.
          </>
        ),
      },
      modificaciones: {
        nombre: 'Modifications',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> are the ones included in the price. They come from “Numbers”.
          </>
        ),
      },
      valor_modificacion: {
        nombre: 'Price of a modification',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> is the price of each extra modification. It comes from “Numbers”.
          </>
        ),
      },
      relevamiento: {
        nombre: 'Site measure paid',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> is what your client has paid you by the day you send the quote; the
            example here is the site measure fee from “Your shop”. If nothing has been paid, this
            notice doesn't show.
          </>
        ),
      },
      sena: {
        nombre: 'Deposit',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> is each job's deposit; the example here is the one from “Your
            shop”.
          </>
        ),
      },
      meses: {
        nombre: 'Warranty months',
        explicacion: (Dato, valor) => (
          <>
            <Dato>{valor}</Dato> is how long the warranty lasts. It comes from “Numbers”.
          </>
        ),
      },
    },
    formas: {
      vaElegida: 'Selected by default',
      cambiarLaForma: 'Edit payment option',
      sinNombre: 'Unnamed',
      nuevaSinGuardar: 'New, not saved',
      nombre: 'Name',
      ayudaDelNombre:
        "It's just for you, to pick it in each quote. Your client reads the text below.",
      loQueLeeTuCliente: 'What your client reads',
      ejemploDelTexto: 'For example: 50% deposit and the balance in two installments…',
      quitar: 'Remove this payment option',
      cuantas: (cuantas) =>
        plural(cuantas, { one: '# payment option', other: '# payment options' }),
      ayudaAlOrdenar: 'Move each one up or down: the first one comes selected in every new quote.',
      subirLaNueva: 'Move the new payment option up',
      bajarLaNueva: 'Move the new payment option down',
      agregar: 'Add a payment option',
      lleno: (cuantas) =>
        plural(cuantas, {
          one: 'You can have up to # payment option: to add another, remove one.',
          other: 'You can have up to # payment options: to add another, remove one.',
        }),
    },
    garantia: {
      cambiarElTexto: 'Edit the warranty text:',
      texto: 'Warranty text',
    },
    datos: {
      asiSale: 'This is how it shows at the top of every quote',
      vacio: 'Your name or company name, your CUIT, your tax status and your address go here.',
      enComoTePagan: (Quien, quien) => (
        <>
          In “How clients pay you” you have <Quien>{quien}</Quien>. If you quote under that name,
          you don't need to type them again.
        </>
      ),
      usarElCobro: 'Use the account holder and CUIT',
      cambiarTusDatos: 'Change your details',
      nombreORazonSocial: 'Name or company name',
      ayudaDelNombre: 'Whose name the CUIT is under.',
      cuit: 'CUIT (Argentine tax ID)',
      ayudaDelCuit: 'Shown next to your name.',
      condicionFiscal: 'Tax status',
      elegila: 'Choose one',
      ayudaDeLaCondicion: 'Shown below your CUIT.',
      domicilio: 'Address',
      ejemploDelDomicilio: 'Street and number, city',
      ayudaDelDomicilio: "Your shop's, with the city.",
      telefono: 'Phone',
      ayudaDelTelefono:
        'With your phone number, your client gets a button to message you on WhatsApp.',
      email: 'Email',
      ayudaDelEmail: 'Shown next to the phone.',
      tuCuit: 'your CUIT',
      tuDomicilio: 'your address',
    },
    numeros: {
      plazo: 'Lead time (business days)',
      ayudaDelPlazo: 'The one every new quote starts with. You can change it in each one.',
      garantia: 'Warranty (months)',
      ayudaDeLaGarantia: 'The law requires at least 6 months.',
      modificaciones: 'Modifications included',
      ayudaDeLasModificaciones: 'The 3D design modifications included in the price.',
      valor: 'Price of each extra modification',
      ayudaDelValor: 'What you charge for each one beyond those.',
    },
    problemas: {
      titularLargo: (caracteres) =>
        plural(caracteres, {
          one: 'The name can be up to # character.',
          other: 'The name can be up to # characters.',
        }),
      elNombre: 'the name',
      elCuit: 'the CUIT',
      domicilioLargo: (caracteres) =>
        plural(caracteres, {
          one: 'The address can be up to # character.',
          other: 'The address can be up to # characters.',
        }),
      elDomicilio: 'the address',
      telefonoLargo: (caracteres) =>
        plural(caracteres, {
          one: 'The phone can be up to # character.',
          other: 'The phone can be up to # characters.',
        }),
      elTelefono: 'the phone',
      emailMal: 'Check the email: it has to look like shop@example.com.',
      elEmail: 'the email',
      plazo: 'Enter the lead time in business days, between 1 and 365.',
      elPlazo: 'the lead time',
      garantiaCorta: 'The law requires at least 6 months.',
      garantia: 'Enter the warranty months, between 6 and 120.',
      losMeses: 'the warranty months',
      modificaciones: 'Enter how many are included in the price, between 0 and 10.',
      lasModificaciones: 'the modifications included',
      valor: 'Enter the price of an extra modification. It can be 0.',
      elValor: 'the price of a modification',
      textoVacio: 'Write the text or remove it from the list.',
      unTextoVacio: 'an empty text',
      textoLargo: (caracteres) =>
        plural(caracteres, {
          one: 'A text can be up to # character.',
          other: 'A text can be up to # characters.',
        }),
      unTextoLargo: "a text that's too long",
      sinFormas: 'Keep at least one payment option: you pick one in each quote.',
      lasFormas: 'the payment options',
      formaSinNombre: 'Give it a name so you can pick it in each quote.',
      elNombreDeLaForma: 'the name of a payment option',
      formaVacia: 'Write how your client pays you, or remove it.',
      unaFormaVacia: 'an empty payment option',
      garantiaVacia: "The warranty can't be empty.",
      garantiaLarga: (caracteres) =>
        plural(caracteres, {
          one: 'The warranty can be up to # character.',
          other: 'The warranty can be up to # characters.',
        }),
      elTextoDeLaGarantia: 'the warranty text',
      textos: "There's a text that can't be saved like this.",
      losTextos: 'the texts',
    },
    cambios: {
      tusDatos: 'your details',
      losNumeros: 'the numbers',
      primero: {
        nuevos: (cuantos) => plural(cuantos, { one: 'one new text', other: '# new texts' }),
        cambiados: (cuantos) =>
          plural(cuantos, { one: 'one changed text', other: '# changed texts' }),
        quitados: (cuantos) =>
          plural(cuantos, { one: 'one removed text', other: '# removed texts' }),
      },
      despues: {
        nuevos: (cuantos) => plural(cuantos, { one: 'one new', other: '# new' }),
        cambiados: (cuantos) => plural(cuantos, { one: 'one changed', other: '# changed' }),
        quitados: (cuantos) => plural(cuantos, { one: 'one removed', other: '# removed' }),
      },
      elOrden: 'the order',
      loQueSaleTildado: 'what comes checked',
      cuantos: (cuantos) => plural(cuantos, { one: '# change', other: '# changes' }),
    },
    barra: {
      sinGuardar: 'Not saved',
      conLosCambios: (cambios) => `: ${cambios}`,
      noSeGuardo: (queRevisar) => `Not saved: check ${queRevisar}.`,
      guardarLosCambios: 'Save changes',
    },
    seDeshace: {
      vuelve: (texto) => `“${texto}” comes back; you had removed it.`,
      vuelveASuTexto: (texto) => `“${texto}” goes back to its default text.`,
      vuelveTildado: (texto) => `“${texto}” comes checked again.`,
      vuelveSinTildar: (texto) => `“${texto}” comes unchecked again.`,
      vuelvenLasFormas: 'The three default payment options come back, with their texts.',
      lasFormasVuelven: 'The payment options go back to their default texts.',
      laGarantiaVuelveASuTexto: 'The warranty goes back to its default text.',
      elPlazoVuelve: (dias) =>
        plural(dias, {
          one: 'The lead time goes back to # business day.',
          other: 'The lead time goes back to # business days.',
        }),
      vuelvenLasModificaciones: (cuantas, valor) =>
        plural(cuantas, {
          one: `# modification is included again, and each extra one costs ${valor}.`,
          other: `# modifications are included again, and each extra one costs ${valor}.`,
        }),
      laGarantiaVuelve: (meses) =>
        plural(meses, {
          one: 'The warranty goes back to # month.',
          other: 'The warranty goes back to # months.',
        }),
    },
    textosDeSiempre: {
      sinCambios:
        "You're using the default texts, the ones from your spreadsheet. Whatever you change above stays as yours, and from here you can go back to these whenever you want.",
      cambiaste: (cuantas) =>
        plural(cuantas, {
          one: 'You changed # thing in the texts from your spreadsheet, the ones the app started with. If you change your mind, you can go back to them: your details stay as they are.',
          other:
            'You changed # things in the texts from your spreadsheet, the ones the app started with. If you change your mind, you can go back to them: your details stay as they are.',
        }),
      volver: 'Go back to the default texts',
      pregunta: 'Go back to the default texts?',
      bajadaDeLaPregunta: 'The ones from your spreadsheet, which the app started with',
      seDeshacen: (cuantas) =>
        plural(cuantas, { one: '# thing gets undone', other: '# things get undone' }),
      tambienSePierde:
        "Whatever you changed in the texts and haven't saved yet is lost too. Your details don't change, and the quotes you already sent stay as they were.",
      tusDatosNoCambian:
        "Your details don't change, and the quotes you already sent stay as they were.",
      cancelar: 'Cancel',
      volverALosDeSiempre: 'Go back to the defaults',
    },
    resumen: {
      tusDatos: 'Your details',
      faltan: (cuantos, que) =>
        cuantos === 1
          ? `Add ${que}: the law requires it on a quote.`
          : `Add ${que}: the law requires them on a quote.`,
      plazo: 'Lead time',
      diasHabiles: (dias) =>
        plural(dias, { one: '#\u00a0business day', other: '#\u00a0business days' }),
      garantia: 'Warranty',
      meses: (meses) => plural(meses, { one: '#\u00a0month', other: '#\u00a0months' }),
      textos: 'Texts',
      cuantosTextos: (incluye, avisos, condiciones) =>
        `${plural(incluye, { one: '#\u00a0included item', other: '#\u00a0included items' })}, ${plural(avisos, { one: '#\u00a0notice', other: '#\u00a0notices' })} and ${plural(condiciones, { one: '#\u00a0condition', other: '#\u00a0conditions' })}`,
      cambiar: 'Change what goes in your quotes',
    },
  },
} satisfies Mensajes['configurarTaller'];
