export const vistaCliente = {
  acaNoSeGuardaNada: 'Acá no se guarda nada: así lo ve tu cliente.',
  loQueVeConElDiaAceptado: (boton: string, titular: string) =>
    `Con «${boton}», la entrega queda comprometida y tu cliente lee arriba: «${titular}»`,
  volverAEmpezar: 'Volver a empezar',
  ayuda: {
    comoLoVeTuCliente: 'Cómo lo ve tu cliente',
    lamina: (numero: number, total: number) => `${String(numero)} de ${String(total)}`,
    atras: 'Atrás',
    siguiente: 'Siguiente',
    listo: 'Listo',
    laminas: {
      enlace: {
        titulo: 'El enlace y la pantalla',
        entrada:
          'Cada trabajo tiene su enlace. Tu cliente lo abre del celular, sin cuenta ni contraseña.',
        noVence: {
          titulo: 'No vence',
          texto:
            'Se lo pasás una vez y le sirve siempre. Deja de andar solo si lo das de baja o si das el trabajo por perdido.',
        },
        seActualiza: {
          titulo: 'Se actualiza sola',
          texto: 'Cada vez que la abre ve lo último que cargaste. No hay que avisarle nada.',
        },
        loMismo: {
          titulo: 'Es lo que ves vos',
          texto:
            '«Ver cómo lo ve él» y el enlace muestran la misma pantalla, salida del mismo lado.',
        },
        silencio: {
          titulo: 'Fechas, no cuentas',
          texto:
            'Le muestra el día de cada paso y qué sigue. Nunca cuánto hace que no pasa nada: eso lo pone a contar contra vos, y una obra lleva semanas sin nada que se vea.',
        },
        vidriera: {
          titulo: 'Tu vidriera',
          texto:
            'Al final de la página, las fotos y las redes que elegís en Ajustes, en «Tu vidriera». Las ve cada cliente en la página de su trabajo, en todas las etapas, y desde ahí puede compartir tus redes.',
        },
      },
      antes: {
        titulo: 'Antes del presupuesto',
        estimativo: {
          titulo: 'Te pasamos un número estimado',
          texto:
            'Solo si le mandaste un estimativo: le aparece tildado, como un paso antes del presupuesto, con el día que tocaste «Mandé el estimativo», y el presupuesto queda en curso. El número no lo ve nunca.',
        },
        relevamiento: {
          titulo: 'El número todavía puede cambiar',
          texto:
            'Con el estimativo mandado y la visita pendiente le aparece una (i) que se lo explica, con el día de la visita si ya está agendada: al lado del día del estimativo mientras sigue en «Estimativo enviado», y en el presupuesto en curso cuando lo pasás a relevamiento o a presupuestar. Cuando tocás «Ya fui a relevar», le cuenta que el número sale de las medidas. Al aprobarlo, se va.',
        },
        relevamientoTecnico: {
          titulo: 'Relevamiento técnico',
          texto:
            'Mientras falta ir a medir, abajo del camino lee qué es la visita y cuánto sale, con el valor que cargás en Ajustes, en «Tu taller». Si lo dejás vacío, lee qué es pero no el precio. Cuando tocás «Ya fui a relevar» o le mandás el presupuesto, se va.',
        },
        sinMedir: {
          titulo: 'Si no hace falta medir',
          texto:
            'Pasalo a «A presupuestar» sin cargar la visita: no le aparecen ni la (i) ni el relevamiento técnico.',
        },
        sinNada: {
          titulo: 'Sin nada mandado todavía',
          texto:
            'El enlace igual funciona: ve el trabajo y el camino entero, con el primer paso en curso.',
        },
      },
      presupuesto: {
        titulo: 'El presupuesto y la aprobación',
        paso1: {
          titulo: 'Presupuesto enviado',
          texto:
            'Es el primer paso de todo trabajo que no tuvo estimativo. Mientras lo preparás lo ve en curso, y el día que ponés el contacto en «Presupuesto enviado» se tilda con esa fecha.',
        },
        esperando: {
          titulo: 'Mientras espera la seña',
          texto:
            'No ve la dirección ni las fechas que tengas cargadas: esas aparecen cuando lo aprueba. Ve para cuándo podría estar listo si deja la seña antes del día hasta el que vale el presupuesto, o si lo aprueba antes de ese día cuando lo que te pagó ya cubre la seña.',
        },
        paso2: {
          titulo: 'Aprobado, seña cobrada',
          texto:
            'Queda en curso desde que le mandás el presupuesto: «Cuando lo apruebes y dejes la seña», o «Cuando lo apruebes» si lo que te pagó ya la cubre. Se tilda cuando pasás el trabajo a Proyectos; si falta la seña, sigue en curso con «Cuando dejes la seña» hasta que la deja o hasta que arrancás. La seña que cargues ahí le aparece en «Lo que pagaste».',
        },
        pie: 'Si la fecha de inicio que cargaste al aprobar es de hoy o de antes, ese mismo día se tilda el paso 2 y queda en curso el 3, con ese día de inicio.',
      },
      elPresupuesto: {
        titulo: 'El presupuesto que le mandás',
        entrada:
          'Cuando lo mandás desde la app, le aparece en su página, abajo de «Tu mueble», y lo puede bajar en PDF.',
        rotulo: {
          titulo: 'Con su número',
          texto:
            'Ve el número, la revisión, el día que se lo mandaste y hasta cuándo vale, y abajo todo lo que armaste: el detalle, lo que incluye, los valores y tus textos.',
        },
        revision: {
          titulo: 'Las revisiones',
          texto:
            'Si le mandás una revisión, ve la última, con lo que le contaste que cambió. Las anteriores no las ve.',
        },
        opciones: {
          titulo: 'Con opciones',
          texto:
            'Ve cada opción con su total y su seña, y le pide que elija. Cuando aprobás una, las otras desaparecen de su página.',
        },
        vencido: {
          titulo: 'Si vence',
          texto:
            'Le aparece «Venció el …» y la página deja de pedirle la seña: le pide que te escriba para actualizarlo. Pasa también con un presupuesto que le mandaste por fuera de la app.',
        },
        aceptado: {
          titulo: 'Cuando lo aprueba',
          texto:
            'La tarjeta se achica y baja, después de «Lo que pagaste»: el presupuesto que aceptó, con la opción y el día, y el detalle plegado.',
        },
      },
      taller: {
        titulo: 'El taller y la entrega',
        paso3: {
          titulo: 'En fabricación',
          texto:
            'Queda en curso desde que se tilda el paso 2: «Vamos a empezar a fabricarlo», y arriba lee que está en la cola del taller. El día de la fecha de inicio que cargaste pasa a «Lo estamos fabricando», con ese día, y se tilda cuando lo entregás.',
        },
        paso4: {
          titulo: 'Entregado',
          texto: 'Se marca cuando tocás «Ya lo entregué», con la fecha de ese día.',
        },
        estimada: {
          titulo: 'La fecha estimada',
          texto:
            'Mientras lo fabricás, la entrega estimada que cargaste la lee como «Fecha estimada de entrega». Si la movés, la próxima vez que abra ve la nueva. Una fecha que ya pasó no la ve: la ficha te avisa para que la muevas.',
        },
        pie: 'Sin fecha de inicio cargada, el paso 3 nunca dice «Lo estamos fabricando»: se queda en «Vamos a empezar a fabricarlo» hasta que lo entregás, y ahí se tilda sin día.',
      },
      listo: {
        titulo: 'Cuando está listo',
        entrada: 'Tocás «Ya está listo» en la ficha y la entrega se coordina desde su pantalla.',
        listo: {
          titulo: 'Tu mueble está listo',
          texto:
            'Así lo lee arriba de todo, y el paso 4 dice «Listo para entregar». Si no le pedís nada, lee que lo próximo es acordar el día.',
        },
        unDia: {
          titulo: 'Un día que le proponés',
          texto:
            'Lo ve con dos botones: «Me queda bien» y «No puedo ese día». Si lo acepta, la entrega queda comprometida sola.',
        },
        susDias: {
          titulo: 'Sus días',
          texto:
            'Si le pedís sus días, o no puede el que le propusiste, marca en un calendario los que le quedan bien, a la mañana, a la tarde o las dos, y te puede dejar una nota. Elige de pasado mañana a 30 días, sin domingos. Vos confirmás uno.',
        },
        comprometida: {
          titulo: 'La entrega comprometida',
          texto:
            'Con el día confirmado lee «¡Buenas noticias! Lo estamos entregando el…». La podés poner también mientras lo fabricás. Si hay que cambiarla, la cambiás vos desde la ficha: él no puede.',
        },
        pie: 'Lo que te contesta te llega a la app abierta y a Inicio, sin aviso al celular.',
      },
      saldo: {
        titulo: 'Cuando queda saldado',
        paso5: {
          titulo: 'Pagado',
          texto:
            'Desde la entrega queda en curso mientras te debe: «Cuando esté saldado». Se tilda cuando no queda saldo, o cuando cerrás el trabajo con «Cobrar y repartir».',
        },
        foco: {
          titulo: 'Si te debe, el saldo manda',
          texto:
            'Entregado y con plata pendiente, la pantalla le pone el saldo arriba de todo y más grande que el estado.',
        },
        primeroLaEntrega: {
          titulo: 'Primero sale del taller',
          texto:
            'Aunque te pague todo antes, el paso 5 no se tilda hasta que el mueble esté entregado: desde que lo pasás a Proyectos dice «Ya está pagado».',
        },
        transferir: {
          titulo: 'Cómo te transfiere',
          texto:
            'Si cargaste tus datos en Ajustes, los ve al lado del saldo, con un botón para copiar cada uno. Deja de verlos cuando queda todo pagado.',
        },
      },
      atras: {
        titulo: 'Volver atrás',
        entrada: 'Se puede, y no le rompe nada de lo que ya vio.',
        retrocede: {
          titulo: 'El camino retrocede',
          texto:
            'Si lo mandás para atrás, por ejemplo con «Volvió a presupuesto», él pasa a ver el paso donde está hoy.',
        },
        sinRastro: {
          titulo: 'No se entera',
          texto:
            'No le salta ningún aviso ni queda una línea en «Lo que fue pasando»: ve menos pasos marcados y nada más.',
        },
        fechas: {
          titulo: 'Las fechas quedan',
          texto: 'Lo ya anotado sigue guardado. Si volvés a avanzar, muestra las mismas de antes.',
        },
      },
      nunca: {
        titulo: 'Lo que nunca ve',
        tuPlata: {
          titulo: 'Tu plata',
          texto:
            'Ni los costos, ni lo que te queda, ni el diezmo, ni el reparto, ni tus notas de obra. Las opciones las ve mientras decide; cuando aprobás una, las que no eligió desaparecen.',
        },
        fotos: {
          titulo: 'Las fotos que no marcaste',
          texto:
            'Nacen apagadas, incluso las que ya tenías subidas. Solo ve las que prendés una por una en «Compartir», y las que sumás a tu vidriera.',
        },
        otros: {
          titulo: 'Otro trabajo',
          texto:
            'El enlace abre ese mueble y nada más: ni otro trabajo suyo, ni otro cliente tuyo. De las fotos de tu vidriera ve la foto, sin nada del trabajo del que salió.',
        },
      },
    },
  },
} as const;
