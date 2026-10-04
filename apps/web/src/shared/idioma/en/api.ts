import type { Mensajes } from '../es';

export const api = {
  acceso: {
    enlaceEnOtroNavegador:
      'The link opened in a different browser or app, and it only works in the one you requested it from. Request a new one from this device and open it right here.',
    enlaceVencido:
      'The link expired or was already used: each link works only once and for a short time. Request a new one.',
    sesionTerminada: "You've been signed out. Sign in again with your email and password.",
    cuentaRepetida:
      "There's already an account with that email. Sign in with your password, or request a new one if you don't remember it.",
    huellaRepetida: 'This device already has a fingerprint registered for your account.',
    huellaCancelada:
      'The fingerprint check was canceled or took too long. Try again, or sign in with your password.',
    huellaEnOtraDireccion:
      "Fingerprint sign-in can't be used from this address of the app. Open it from the usual address.",
    sinHuellaEnElDispositivo: "This device has no fingerprint or screen lock to confirm it's you.",
    huellaVencida: 'Too much time passed before the fingerprint was confirmed. Try again.',
    generico: "We couldn't complete the operation. Try again.",
    credencialesInvalidas:
      "The email or password doesn't match. Check them; if you don't remember the password, request a new one.",
    mailSinConfirmar:
      "You haven't confirmed your email yet. Open the link we sent you when you created the account, or ask us to send it again.",
    contrasenaDebil: 'That password is too weak: use at least 6 characters.',
    mismaContrasena: 'The new password is the same as the one you had. Choose another one.',
    demasiadosMails:
      'The server already sent all the emails it allows per hour. Wait a bit and request it again; in the meantime, check your spam folder.',
    demasiadosIntentos: 'Too many attempts in a row. Wait a few minutes and try again.',
    formatoInvalido: "Check the email and password: one of them isn't in a valid format.",
    mailInvalido: "That email doesn't look valid. Check that it's spelled correctly.",
    mailNoAutorizado: "The server doesn't send emails to that address. Try another email.",
    altasCerradas: "New accounts can't be created right now.",
    accesoConMailCerrado: "Signing in with email and password isn't available right now.",
    cuentaSuspendida: "This account is suspended and can't sign in.",
    cuentaInexistente: "We couldn't find that account. Check the email.",
    hayQueConfirmar:
      "To change your password, you need to confirm it's you: request the recovery link and open it from your email.",
    servidorLento: 'The server took too long to respond. Try again.',
    servidorConProblemas: 'The server had a problem. Try again in a bit.',
    huellaDeshabilitada:
      "Fingerprint sign-in isn't enabled on the server yet. In the meantime, sign in with your password.",
    demasiadasHuellas: 'Your account already has the maximum number of fingerprints registered.',
    huellaSinVerificar:
      "The server couldn't verify the fingerprint. Try again, or sign in with your password.",
    sensorConProblemas:
      'The fingerprint sensor had a problem. Try again, or sign in with your password.',
    respuestaInesperada: "The server sent a response we didn't expect. Try again.",
    sinRed: "Can't reach the server. Try again when you're back online.",
    navegadorSinHuella: "This browser can't use fingerprint sign-in. Sign in with your password.",
    enlaceDelCorreo: "The email link didn't work. Request a new one from this device.",
  },
  accesoConCodigo: (codigo) => `We couldn't complete the operation (${codigo}). Try again.`,
  rechazos: {
    esteTrabajo: 'This job',
    trabajo: (titulo) => `“${titulo}”`,
    siSigueIgual: 'Try again, and if it keeps happening, report it.',
    sinPermiso: {
      titulo: "Your account doesn't have access to this.",
      queHacer:
        'The job may belong to another shop, or your account may have been left without a shop. Sign out and sign in again.',
    },
    MN001: {
      cobro: {
        cobrado: (trabajo) => `${trabajo} was already paid.`,
        perdido: (trabajo) => `${trabajo} was already closed as lost.`,
        queHacer:
          "You may have closed it from your phone or your computer. Check how the split turned out: if it's not what you expected, reopen it.",
      },
      baja: {
        cobrado: (trabajo) =>
          `${trabajo} has payments or expenses and is paid: it can't be deleted.`,
        perdido: (trabajo) =>
          `${trabajo} has payments or expenses and is closed as lost: it can't be deleted.`,
        queHacer:
          'Deleting this money would take it out of the books. If the split is wrong, fix it by reopening it.',
      },
      otro: {
        cobrado: (trabajo) => `${trabajo} is paid and its numbers are closed.`,
        perdido: (trabajo) => `${trabajo} is closed as lost and its numbers are closed.`,
      },
      salida: {
        cobrado:
          "Reopen the payment, fix what's needed and mark it as paid again: the split is redone with the corrected numbers.",
        perdido:
          "Reactivate the quote, add what's missing and close it again: the deposit split is redone.",
      },
    },
    MN002: {
      titulo: (trabajo) => `${trabajo} was deleted.`,
      queHacer: 'You may have deleted it from another device. If you need it, add it again.',
    },
    MN003: {
      titulo: (cliente) => `“${cliente}” has jobs on record.`,
      sinCliente: 'This client has jobs on record.',
      queHacer: 'Delete those jobs, or move them to another client, and then delete the client.',
    },
    MN004: {
      titulo: "The database didn't accept that change.",
      queHacer: "This shouldn't happen. Add it again, and if it keeps happening, report it.",
    },
    MN005: {
      titulo: "This job's client was deleted.",
      queHacer: 'Choose another client for the job, or add back the client you deleted.',
    },
    MN006: {
      cobro: {
        titulo: 'The numbers changed since you saw the split.',
        queHacer:
          "A payment or an expense was added, the owner's pay or the fixed costs changed, or the waterfall changed. Open the payment again: the split is recalculated with what's there now, and you check it before confirming.",
      },
      fila: {
        titulo: 'The waterfall changed while you were editing it.',
        queHacer:
          'It was saved on another device or Settings changed. See how it looks now and make your changes again.',
      },
      cambio: (trabajo) => `${trabajo} changed since you opened it.`,
      desdeLaFicha: 'Open the job again to see how it looks now, and try again from there.',
      desdeOtroLado:
        "Something was saved from somewhere else. Open it again to see what's there now and add what's missing.",
    },
    MN007: {
      cobro: {
        titulo: (trabajo) => `${trabajo} hasn't been delivered yet.`,
        queHacer:
          'You get paid for what you already delivered. Mark it as delivered, then mark it as paid.',
      },
      cierre: {
        titulo: (trabajo) => `${trabajo} is already delivered: it can't be marked as lost.`,
        queHacer:
          'A delivered piece gets paid for, even if the client takes a while. Mark it as paid from the job.',
      },
      reapertura: (trabajo) => `${trabajo} isn't paid.`,
      reactivacion: (trabajo) => `${trabajo} isn't closed as lost.`,
      verLaFicha: 'Open the job again to see how it looks now.',
      formulario: {
        titulo: "That status change can't be made from the form.",
        queHacer:
          'Marking as paid and marking as lost have their own buttons on the job, because they split money. Go back to the job and use the button.',
      },
    },
    MN008: {
      titulo: "This app is out of date and doesn't do the same math as the server.",
      alCobrar:
        'Nothing was saved: the job is as it was. It could be the profit cutoff, or what the month has already covered. Close the app, open it again so it updates, and do it again.',
      queHacer: 'Close the app and open it again so it updates, and try again.',
    },
    MN009: {
      titulo: "This job's quote comes from the option you check.",
      queHacer:
        'Check the one the client approved, and if you want to write the quote by hand, remove the options first. Only one can be checked.',
    },
    MN012: {
      encuesta: 'That client already answered.',
      preguntas: {
        titulo: 'That client already answered: their questions stay as they are.',
        queHacer: 'To ask them something else, message them.',
      },
    },
    MN013: {
      titulo: "That question already went out in a survey: how it's answered can't change.",
      queHacer:
        'Save it as a new question: the answers you already got stay separate, with their text.',
    },
    MN014: {
      titulo: 'The question changed from somewhere else.',
      queHacer:
        "There's already a newer version of this question. Open Questions again and change it there.",
    },
    MN015: {
      sinEntregar: {
        titulo: 'You ask the client for feedback once the job is delivered.',
        queHacer: 'Mark the job as delivered and ask for it from there.',
      },
      sinPreguntas: {
        titulo: 'The survey has no questions.',
        queHacer: 'Add at least one back in Feedback › Questions.',
      },
    },
    MN016: {
      delCobro: 'The payment date is missing.',
      deUnPago: 'A payment is missing its date.',
      queHacer:
        "Nothing was saved. Enter the day the money came in and save it again: the date can't be made up.",
    },
    MN017: {
      titulo: "That date hasn't come yet.",
      queHacer:
        'Nothing was saved. Enter the day the money came in, which has to be today or earlier, and save it again.',
    },
    MN018: {
      titulo: "That money isn't from before you started using the app.",
      queHacer:
        'Only money that came in before your starting balances can already be in them. Uncheck that option, or check the date, and save it again.',
    },
    MN019: {
      titulo: "This job's follow-up was left half done.",
      queHacer:
        "Nothing was saved. This happens if you changed it from somewhere else at the same time. Open it again: if it's in follow-up, log the follow-up from there; if not, move it to follow-up with its date.",
    },
    MN021: {
      sinListo: {
        titulo: 'Delivery is arranged once the piece is ready.',
        queHacer:
          'Mark it as ready on the job and suggest a day to your client. Nothing was saved.',
      },
      comprometida: {
        titulo: 'The delivery is already confirmed.',
        queHacer: 'To change it, change the confirmed date on the job. Nothing was saved.',
      },
      fecha: {
        titulo: 'The day you suggest has to be tomorrow or later.',
        queHacer: 'Choose a day from tomorrow on. Nothing was saved.',
      },
      noSeGuardoNada: (salida) => `${salida} Nothing was saved.`,
    },
    MN022: {
      titulo: 'Your showcase already has 12 photos.',
      queHacer:
        "The photo wasn't added. This happens if you added photos from another device at the same time. Remove one from your showcase in Settings and add it again.",
    },
    MN023: {
      titulo: "Couldn't save the waterfall.",
      queHacer: 'Check it and try again.',
    },
    MN024: {
      titulo: (tesoro) => `Couldn't archive ${tesoro}.`,
      sinTesoro: "Couldn't archive the bucket.",
      queHacer:
        'Take it out of the waterfall, mark the reopened job that uses it as paid, and move its money to another bucket. Then archive it.',
    },
    MN025: {
      titulo: 'This payment is from before the app was updated.',
      queHacer:
        'Open the payment again: the split is calculated with your waterfall and you check it before confirming.',
    },
    MN026: {
      titulo: 'This quote was changed on another device.',
      queHacer: 'Open it again to see the latest version and continue from there.',
    },
    MN027: {
      titulo: 'The quote is missing something before it can be sent.',
      queHacer: 'Check that it has a title, at least one piece with its details, and a total.',
    },
    MN028: {
      titulo: "The client already approved it: the quote can't be changed.",
      queHacer: 'A change after the deposit is worked out separately with your client.',
    },
    MN029: {
      titulo: 'The amounts changed since you put it together.',
      queHacer: 'Check the amounts and send it again.',
    },
    MN030: {
      titulo: 'The quote texts were changed on another device.',
      queHacer: 'Open the screen again and save again.',
    },
    MN031: {
      plantilla: "Couldn't save your quote texts.",
      presupuesto: "Couldn't save the quote.",
      queHacer:
        'Check it and try again. If it happens again, close the app and open it again so it updates.',
    },
    MN032: {
      titulo: "This job is lost: its quote can't be changed or sent.",
      queHacer: 'If the client came back, reactivate it from the job and continue from there.',
    },
    MN033: {
      titulo: "The send date hasn't come yet.",
      queHacer: "Check your device's date and time, and send it again.",
    },
    MN034: {
      titulo: 'That bucket stays in its currency.',
      queHacer:
        "A bucket's currency can't be changed. If you need it in the other currency, create a new one and move the money with a dollar purchase or sale.",
    },
    MN035: {
      titulo: "Between pesos and dollars, it's a purchase or a sale.",
      queHacer:
        'A transfer between buckets stays in the same currency. To go from pesos to dollars, add it as a dollar purchase or sale.',
    },
    MN036: {
      titulo: "The currency can't be changed anymore.",
      queHacer: "A job picks its currency while it's still an inquiry.",
    },
    MN037: {
      titulo: "That bucket can't take this payment.",
      queHacer: "Choose a dollar bucket that isn't archived.",
    },
    MN038: {
      titulo: 'This was put together with an outdated app.',
      queHacer: 'Add it again.',
    },
    MN039: {
      titulo: 'A payment is missing its dollar rate.',
      queHacer:
        'A peso payment on a dollar job needs the rate it was taken at. Open the job and fill it in.',
    },
    MN040: {
      titulo: "Invoicing with ARCA isn't connected.",
      queHacer: 'Nothing was requested. Connect it in Settings › Invoicing and request it again.',
    },
    MN041: {
      titulo: "Something's missing to invoice this.",
      queHacer:
        "The invoice wasn't requested. Fill in what's missing and request it again from the payment.",
    },
    MN042: {
      factura: {
        titulo: 'That payment already has its invoice.',
        queHacer: "No need to request it again: you'll find its status on the payment.",
      },
      nota: {
        titulo: "That invoice is already voided or hasn't been authorized yet.",
        queHacer: 'Check how it looks on the payment: only an authorized invoice can be voided.',
      },
    },
    MN043: {
      pago: {
        titulo: 'It has an ARCA invoice: void it first to change it.',
        queHacer: 'Void the invoice with a credit note, then change the payment.',
      },
      trabajo: {
        titulo: "This job has ARCA invoices and can't be deleted.",
        queHacer: "If it's not going ahead, mark it as lost.",
      },
    },
  },
} satisfies Mensajes['api'];
