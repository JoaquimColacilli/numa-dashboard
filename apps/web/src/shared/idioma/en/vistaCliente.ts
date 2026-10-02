import type { Mensajes } from '../es';

export const vistaCliente = {
  acaNoSeGuardaNada: 'Nothing is saved here: this is what your client sees.',
  loQueVeConElDiaAceptado: (boton, titular) =>
    `When they tap ${boton}, the delivery is confirmed and your client sees this at the top: “${titular}”`,
  volverAEmpezar: 'Start over',
  ayuda: {
    comoLoVeTuCliente: 'What your client sees',
    lamina: (numero, total) => `${String(numero)} of ${String(total)}`,
    atras: 'Back',
    siguiente: 'Next',
    listo: 'Done',
    laminas: {
      enlace: {
        titulo: 'The link and the page',
        entrada:
          'Each job has its own link. Your client opens it on their phone, with no account or password.',
        noVence: {
          titulo: "It doesn't expire",
          texto:
            'You send it once and it works for good. It only stops working if you turn it off or mark the job as lost.',
        },
        seActualiza: {
          titulo: 'It updates on its own',
          texto:
            "Every time they open it, they see your latest updates. There's no need to tell them anything.",
        },
        loMismo: {
          titulo: "It's what you see",
          texto:
            'The See what your client sees button and the link show the same page, built from the same source.',
        },
        silencio: {
          titulo: 'Dates, not countdowns',
          texto:
            "It shows the day of each step and what comes next. Never how long it's been since anything happened: that gets them counting against you, and a job can go weeks with nothing to show.",
        },
        vidriera: {
          titulo: 'Your showcase',
          texto:
            'At the bottom of the page, the photos and social links you choose in Settings, under Your showcase. Every client sees them on their job page, at every stage, and can share your social links from there.',
        },
      },
      antes: {
        titulo: 'Before the quote',
        estimativo: {
          titulo: 'We sent you an estimate',
          texto:
            'Only if you sent them an estimate: it shows up checked off, as a step before the quote, with the day you tapped Mark estimate as sent, and the quote stays in progress. They never see the number.',
        },
        relevamiento: {
          titulo: 'The number may still change',
          texto:
            "With the estimate sent and the site measure pending, an (i) shows up to explain it, with the day of the visit if it's scheduled: next to the estimate's date while the job is in Estimate sent, and on the quote in progress once you move it to Site measure or To quote. When you tap Mark site measure as done, it tells them the number comes from the measurements. Once it's approved, it goes away.",
        },
        relevamientoTecnico: {
          titulo: 'Site measure',
          texto:
            'While the measuring is still pending, below the steps they read what the visit is and what it costs, with the amount you set in Settings, under Your shop. If you leave it empty, they read what it is but not the price. When you tap Mark site measure as done or send the quote, it goes away.',
        },
        sinMedir: {
          titulo: 'If no measuring is needed',
          texto:
            'Move it to To quote without adding the visit: neither the (i) nor the site measure shows up for them.',
        },
        sinNada: {
          titulo: 'Nothing sent yet',
          texto:
            'The link still works: they see the job and all the steps, with the first one in progress.',
        },
      },
      presupuesto: {
        titulo: 'The quote and the approval',
        paso1: {
          titulo: 'Quote sent',
          texto:
            "It's the first step of every job that had no estimate. While you prepare it, they see it in progress, and the day you move the contact to Quote sent, it's checked off with that date.",
        },
        esperando: {
          titulo: 'While waiting for the deposit',
          texto:
            "They don't see the address or the dates you've added: those show up once they approve it. They see when it could be ready if they pay the deposit before the date the quote is valid until, or if they approve it before that day when what they've paid already covers the deposit.",
        },
        paso2: {
          titulo: 'Approved, deposit received',
          texto:
            "It's in progress from the moment you send the quote: “Once you approve it and pay the deposit,” or “Once you approve it” if what they've paid already covers it. It's checked off when you move the job to Jobs; if the deposit is missing, it stays in progress with “Once you pay the deposit” until they pay it or you start. The deposit you add there shows up under “What you've paid.”",
        },
        pie: 'If the start date you set when approving is today or earlier, step 2 is checked off that same day and step 3 goes in progress, with that start date.',
      },
      elPresupuesto: {
        titulo: 'The quote you send',
        entrada:
          'When you send it from the app, it shows up on their page, below “Your furniture,” and they can download it as a PDF.',
        rotulo: {
          titulo: 'With its number',
          texto:
            "They see the number, the revision, the day you sent it and how long it's valid, and below, everything you put together: the details, what's included, the prices and your texts.",
        },
        revision: {
          titulo: 'Revisions',
          texto:
            "If you send a revision, they see the latest one, with what you told them changed. They don't see the earlier ones.",
        },
        opciones: {
          titulo: 'With options',
          texto:
            'They see each option with its total and its deposit, and the page asks them to choose. When you approve one, the others disappear from their page.',
        },
        vencido: {
          titulo: 'If it expires',
          texto:
            'They see “Expired on …” and the page stops asking for the deposit: it asks them to message you to update it. This also happens with a quote you sent outside the app.',
        },
        aceptado: {
          titulo: 'When they approve it',
          texto:
            "The card gets smaller and moves down, after “What you've paid”: the quote they accepted, with the option and the day, and the details collapsed.",
        },
      },
      taller: {
        titulo: 'The shop and the delivery',
        paso3: {
          titulo: 'In production',
          texto:
            "It's in progress from the moment step 2 is checked off: “We'll start building it,” and at the top they read that they're in your queue. On the start date you set, it changes to “We're building it,” with that day, and it's checked off when you deliver it.",
        },
        paso4: {
          titulo: 'Delivered',
          texto: "It's checked off when you tap Mark as delivered, with that day's date.",
        },
        estimada: {
          titulo: 'The estimated date',
          texto:
            "While you build it, they read the estimated delivery you set as “Estimated delivery.” If you move it, they see the new one the next time they open the page. They don't see a date that has passed: the job page warns you so you can move it.",
        },
        pie: "Without a start date, step 3 never says “We're building it”: it stays on “We'll start building it” until you deliver it, and then it's checked off with no date.",
      },
      listo: {
        titulo: "When it's ready",
        entrada:
          'You tap Mark as ready on the job page, and the delivery is set up from their page.',
        listo: {
          titulo: 'Your furniture is ready',
          texto:
            "That's what they read at the very top, and step 4 says “Ready for delivery.” If you don't ask them for anything, they read that the next step is agreeing on the day.",
        },
        unDia: {
          titulo: 'A day you propose',
          texto:
            "They see it with two buttons: Works for me and That day doesn't work. If they accept, the delivery is confirmed on its own.",
        },
        susDias: {
          titulo: 'Their days',
          texto:
            "If you ask for their days, or they can't make the one you proposed, they mark the days that work for them on a calendar, morning, afternoon or both, and can leave you a note. They choose from the day after tomorrow up to 30 days out, no Sundays. You confirm one.",
        },
        comprometida: {
          titulo: 'The confirmed delivery',
          texto:
            "With the day confirmed, they read “Good news! We're delivering on…” You can also set it while you're building it. If it needs to change, you change it from the job page: they can't.",
        },
        pie: 'Their replies reach the open app and Home, with no notification on your phone.',
      },
      saldo: {
        titulo: "When it's paid in full",
        paso5: {
          titulo: 'Paid',
          texto:
            "From delivery on, it's in progress while they owe you: “Once it's paid in full.” It's checked off when there's no balance left, or when you close the job with Collect and split.",
        },
        foco: {
          titulo: 'If they owe you, the balance comes first',
          texto:
            'Delivered and with money pending, the page puts the balance at the very top, bigger than the status.',
        },
        primeroLaEntrega: {
          titulo: 'First it leaves the shop',
          texto:
            "Even if they pay everything up front, step 5 isn't checked off until the furniture is delivered: from the moment you move it to Jobs, it says “Already paid.”",
        },
        transferir: {
          titulo: 'How they transfer',
          texto:
            'If you added your details in Settings, they see them next to the balance, with a button to copy each one. They stop seeing them once everything is paid.',
        },
      },
      atras: {
        titulo: 'Going back',
        entrada: "You can, and it doesn't break anything they've already seen.",
        retrocede: {
          titulo: 'The steps go back',
          texto:
            'If you move the job back, for example with Back to quote, they see the step where it is now.',
        },
        sinRastro: {
          titulo: "They aren't told",
          texto:
            "No notice pops up and no line is left in “What's happened so far”: they see fewer steps checked off, and that's it.",
        },
        fechas: {
          titulo: 'The dates stay',
          texto:
            "What's already recorded stays saved. If you move forward again, it shows the same dates as before.",
        },
      },
      nunca: {
        titulo: 'What they never see',
        tuPlata: {
          titulo: 'Your money',
          texto:
            "Not your costs, what you keep, the tithe, the split, or your job notes. They see the options while they decide; when you approve one, the ones they didn't choose disappear.",
        },
        fotos: {
          titulo: "Photos you didn't share",
          texto:
            "They start off hidden, even the ones you'd already uploaded. They only see the ones you turn on one by one in Share, and the ones you add to your showcase.",
        },
        otros: {
          titulo: 'Other jobs',
          texto:
            'The link opens that piece of furniture and nothing else: not another job of theirs, not another client of yours. From your showcase photos they see the photo, with nothing about the job it came from.',
        },
      },
    },
  },
} satisfies Mensajes['vistaCliente'];
