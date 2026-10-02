import type { ReactNode } from 'react';

import type { Envoltorio } from '@/shared/lib';

function cuantas(cantidad: number, singular: string, plural: string): string {
  return `${String(cantidad)}\u00a0${cantidad === 1 ? singular : plural}`;
}

function tildadasEnFemenino(tildadas: number, total: number): string {
  if (tildadas === 0) return total === 1 ? 'sin tildar' : 'ninguna tildada';
  if (tildadas === total) return total === 1 ? 'tildada' : 'todas tildadas';
  return tildadas === 1 ? '1 tildada' : `${String(tildadas)} tildadas`;
}

function tildadosEnMasculino(tildados: number, total: number): string {
  if (tildados === 0) return total === 1 ? 'sin tildar' : 'ninguno tildado';
  if (tildados === total) return total === 1 ? 'tildado' : 'todos tildados';
  return tildados === 1 ? '1 tildado' : `${String(tildados)} tildados`;
}

export const configurarTaller = {
  guardado: 'Guardado.',
  enLaCola: 'Quedó en la cola: se guarda cuando vuelva la señal.',
  cuit: (numero: string) => `CUIT ${numero}`,
  errorDelCuit: 'Un CUIT tiene 11 dígitos. Dejalo vacío si no lo tenés a mano.',
  configuracion: {
    nombreDelTaller: 'Nombre del taller',
    sueldo: 'Sueldo que te asignás',
    ayudaDelSueldoPorMes:
      'Lo que tu casa necesita por mes. Los cobros del mes lo van pagando y, una vez cubierto, lo que sobra queda en el taller.',
    ayudaDelSueldoPorTrabajo: 'Lo que cada trabajo cobrado transfiere al hogar.',
    costosFijos: 'Costos fijos por mes',
    ayudaDeLosCostosFijos: 'Alquiler, servicios y todo lo que se paga aunque no entre trabajo.',
    metaDeCocos: 'Meta de Cocos',
    ayudaDeLaMeta: 'A cuánto querés llegar en el ahorro invertido.',
    sena: 'Seña que pedís (%)',
    ayudaDeLaSena:
      'Qué parte del presupuesto pedís para confirmar un trabajo. Lo normal es la mitad, y en un trabajo puntual la podés cambiar.',
    relevamiento: 'Valor del relevamiento',
    ayudaDelRelevamiento:
      'Tu cliente lo ve en su página mientras falta ir a medir. Si lo dejás vacío, ve qué es el relevamiento pero no el precio.',
    vigencia: 'Días que vale un presupuesto',
    ayudaDeLaVigencia:
      'Se cuentan desde el día que lo mandás. Tu cliente ve hasta cuándo puede dejar la seña, y en cada trabajo la fecha se puede cambiar.',
    tasa: 'Tasa anual de Cocos (%)',
    ayudaDeLaTasa: 'Solo sirve para proyectar. Si no la sabés, dejala en 0.',
    guardarTodo: 'Guardar la configuración',
    guardarElReparto: 'Guardar el sueldo y los costos',
    errores: {
      nombre: (caracteres: number) =>
        `Poné un nombre para el taller, de hasta ${String(caracteres)} caracteres.`,
      importe: 'Escribí un importe, por ejemplo 1.800.000. Podés dejarlo en 0.',
      tasa: 'Escribí la tasa como un porcentaje, por ejemplo 40. Podés dejarla en 0.',
      sena: 'Escribí la seña como un porcentaje entre 0 y 100, por ejemplo 50.',
      vigencia: (maximo: number) =>
        `Escribí cuántos días vale un presupuesto, entre 1 y ${String(maximo)}. Lo normal son 15.`,
    },
  },
  cobro: {
    alias: 'Alias',
    ayudaDelAlias: 'El que tu cliente escribe en su banco o en su billetera.',
    cbuOCvu: 'CBU o CVU',
    cvuDeLaBilletera: 'CVU de la billetera',
    ayudaDelCbu:
      'Los 22 dígitos. Se muestran de a cuatro para leerlos; el cliente lo copia de una.',
    titular: 'Titular de la cuenta',
    ayudaDelTitular:
      'A nombre de quién está. Es lo que el cliente ve en su banco antes de confirmar.',
    cuitDelTitular: 'CUIT del titular',
    ayudaDelCuit: 'Opcional.',
    link: 'Link de Mercado Pago',
    ayudaDelLink:
      'Opcional. En tu app de Mercado Pago: Cobrar, Link de pago, Link sin monto definido. Copialo y pegalo acá. Tu cliente lo ve como un botón para pagarte.',
    comision:
      'Lo que entre por este enlace es un cobro de Mercado Pago y te descuenta comisión, aunque tu cliente pague con dinero de su propia cuenta: en Buenos Aires, 6,60 % más IVA si querés la plata al instante y 1,56 % más IVA esperando 35 días. Que te transfieran al alias no te cuesta nada.',
    verLosCostos: 'Ver los costos en Mercado Pago',
    guardar: 'Guardar los datos',
    errores: {
      aliasConOtrosCaracteres:
        'Un alias lleva letras, números, punto y guion medio. Nada más: ni espacios, ni guion bajo, ni acentos.',
      aliasDeOtroLargo:
        'Un alias tiene entre 6 y 20 caracteres. Si no te acordás, miralo en tu banco.',
      cbuDeOtroLargo:
        'Un CBU o un CVU tiene 22 dígitos. Copialo de tu banco, no lo escribas de memoria.',
      cbuConOtroBanco:
        'Este número no cierra: el control del banco da otro dígito. Revisá los primeros ocho.',
      cbuConOtraCuenta:
        'Este número no cierra: el control de la cuenta da otro dígito. Revisá los últimos catorce.',
      titularLargo: (caracteres: number) =>
        `El nombre del titular entra en ${String(caracteres)} caracteres.`,
      linkLargo: (caracteres: number) =>
        `Un link de Mercado Pago no pasa los ${String(caracteres)} caracteres. Copialo de nuevo desde la app.`,
      linkSinHttps:
        'Pegá el link entero, arrancando por https://. Usá el botón de copiar de la app de Mercado Pago.',
      linkDeOtroSitio: (sitios: string) =>
        `Este link no es de Mercado Pago. Tiene que empezar por ${sitios}.`,
    },
    avisos: {
      aliasConSeparadorEnLaPunta:
        'Arranca o termina con un punto o un guion. La norma del banco central no lo prohíbe: si es el tuyo, guardalo igual.',
      aliasConSeparadoresSeguidos:
        'Tiene dos puntos o guiones seguidos. La norma del banco central no lo prohíbe: si es el tuyo, guardalo igual.',
      cuitAmbiguo:
        'El verificador de este CUIT cae en el caso que no tiene una convención única. Guardalo igual si lo copiaste bien.',
      cuitConOtroPrefijo:
        'Los CUIT arrancan con 20, 23, 24, 27, 30, 33 o 34. Revisalo, pero podés guardarlo igual.',
      cuitConOtroVerificador:
        'El dígito verificador no cierra. Revisalo, pero podés guardarlo igual.',
    },
  },
  redes: {
    nombres: {
      instagram: 'Instagram',
      facebook: 'Facebook',
      tiktok: 'TikTok',
    },
    ejemplos: {
      instagram: '@tutaller',
      facebook: 'facebook.com/tutaller',
      tiktok: '@tutaller',
    },
    ayuda:
      'Opcionales. Pegá el enlace de tu perfil, o escribí tu usuario con la @. Lo que dejes vacío no aparece.',
    guardar: 'Guardar las redes',
    errores: {
      instagram: {
        'otra-red':
          'Ese enlace no es de Instagram. Pegá el de tu perfil, o escribí tu usuario con la @.',
        'no-es-un-perfil':
          'Ese enlace no es el de tu perfil: es de una publicación, un reel, una historia u otra parte de Instagram. Pegá el de tu perfil, o escribí tu usuario con la @.',
        usuario:
          'Escribí tu usuario de Instagram, con la @ o sin ella: letras, números, puntos y guiones bajos, sin espacios.',
      },
      facebook: {
        'otra-red': 'Ese enlace no es de Facebook. Pegá el de la página o el perfil del taller.',
        'no-es-un-perfil':
          'Ese enlace no es el de tu página: es de una publicación, un grupo o algo para compartir. Entrá a la página del taller y copiá su dirección.',
        usuario:
          'Pegá la dirección de la página del taller, como facebook.com/tutaller: el nombre va sin espacios, con letras, números o puntos.',
      },
      tiktok: {
        'otra-red':
          'Ese enlace no es de TikTok. Pegá el de tu perfil, o escribí tu usuario con la @.',
        'no-es-un-perfil':
          'Ese enlace no es el de tu perfil: es de un video, un enlace corto u otra parte de TikTok. Pegá el de tu perfil, que lleva tu usuario con la @, o escribí tu usuario.',
        usuario:
          'Escribí tu usuario de TikTok, con la @ o sin ella: letras, números, puntos y guiones bajos, sin espacios.',
      },
    },
  },
  resena: {
    enlace: 'Enlace para dejar una reseña en Google',
    ayuda:
      'Opcional. En Google, buscá tu negocio, tocá «Pedir reseñas» y copiá el enlace que te da. Lo ve cada cliente después de contestar la encuesta, conteste lo que conteste.',
    guardar: 'Guardar el enlace',
    errores: {
      largo:
        'Ese enlace es demasiado largo. Copiá el corto que te da Google al tocar «Pedir reseñas».',
      'sin-https': 'Tiene que empezar con https://. Copialo entero desde Google.',
      'otro-sitio':
        'Tiene que ser un enlace de Google para dejar una reseña, como los que empiezan con https://g.page/ o https://search.google.com/.',
    },
  },
  presupuesto: {
    ajustes: 'Ajustes',
    titulo: 'Tu presupuesto',
    queEs:
      'Lo que se repite en todos tus presupuestos. Cada presupuesto nuevo arranca con esto y en cada uno lo podés retocar; los que ya mandaste no cambian. Tocá un texto para cambiarlo.',
    salir: {
      titulo: '¿Cerrar sin guardar?',
      texto: 'Lo que cambiaste todavía no se guardó, y si salís se pierde.',
      seguirEditando: 'Seguir editando',
      descartar: 'Descartar',
    },
    secciones: {
      datos: {
        titulo: 'Tus datos en el presupuesto',
        bajada:
          'Van arriba de todo y al pie de cada hoja, como pide la ley: quién presupuesta, su CUIT y su domicilio.',
      },
      numeros: {
        titulo: 'Números',
        bajada:
          'Completan tus textos: lo que ves marcado en gris en los avisos y en la garantía sale de acá.',
      },
      formas: {
        titulo: 'Formas de pago',
        dondeVa: 'Va después de los valores, con el plazo y la validez.',
        comoSeUsa: 'En cada presupuesto elegís una y la podés retocar. La primera va elegida.',
      },
      garantia: {
        titulo: 'Garantía',
        bajada:
          'Cierra el presupuesto y no se puede quitar: la ley pide garantía en todo mueble nuevo.',
      },
      textosDeSiempre: 'Los textos de siempre',
    },
    grupos: {
      aTenerEnCuenta: {
        titulo: 'A tener en cuenta',
        resumen: (total: number, tildadas: number) =>
          `${total === 1 ? '1 aclaración' : `${String(total)} aclaraciones`} · ${tildadasEnFemenino(tildadas, total)}`,
        dondeVa:
          'Lo que el trabajo no incluye. Va en una caja, justo después del detalle de los muebles.',
        tildadas:
          'Lo que tildás acá sale tildado en cada presupuesto nuevo. Lo demás lo tildás vos cuando hace falta.',
        tildada: 'Tildada en cada presupuesto nuevo',
        tildadaCon: (texto: string) => `Tildada en cada presupuesto nuevo: «${texto}»`,
        tildadaElTextoNuevo: 'Tildada en cada presupuesto nuevo: el texto nuevo',
        agregar: 'Agregar una aclaración',
        quitar: 'Quitar esta aclaración',
        etiquetaDelTexto: 'Texto de la aclaración',
        nuevaSinGuardar: 'Nueva, sin guardar',
        lleno: (cuantas: number) =>
          `Entran ${String(cuantas)} como mucho: para sumar otra, quitá una.`,
        seVaUna: (texto: string) => `Se va la aclaración que agregaste: «${texto}»`,
        seVanVarias: (cuantas: number) =>
          `Se van las aclaraciones que agregaste (${String(cuantas)}).`,
      },
      incluye: {
        titulo: 'Qué incluye',
        resumen: (total: number, tildadas: number) =>
          `${total === 1 ? '1 cosa' : `${String(total)} cosas`} · ${tildadasEnFemenino(tildadas, total)}`,
        dondeVa: 'La lista con tildes que va después de «A\u00a0tener\u00a0en\u00a0cuenta».',
        tildadas: 'Lo que tildás acá sale tildado en cada presupuesto nuevo.',
        tildada: 'Tildada en cada presupuesto nuevo',
        tildadaCon: (texto: string) => `Tildada en cada presupuesto nuevo: «${texto}»`,
        tildadaElTextoNuevo: 'Tildada en cada presupuesto nuevo: el texto nuevo',
        agregar: 'Agregar algo que incluye',
        quitar: 'Quitarla de la lista',
        etiquetaDelTexto: 'Lo que incluye',
        nuevaSinGuardar: 'Nueva, sin guardar',
        lleno: (cuantas: number) =>
          `Entran ${String(cuantas)} como mucho: para sumar otra, quitá una.`,
        seVaUna: (texto: string) => `Se va lo que sumaste a «Qué incluye»: «${texto}»`,
        seVanVarias: (cuantas: number) =>
          `Se van lo que sumaste a «Qué incluye» (${String(cuantas)}).`,
      },
      avisos: {
        titulo: 'Avisos',
        resumen: (total: number, tildados: number) =>
          `${total === 1 ? '1 aviso' : `${String(total)} avisos`} · ${tildadosEnMasculino(tildados, total)}`,
        dondeVa: 'Van al final del presupuesto, antes de las condiciones.',
        tildadas: 'Lo que tildás acá sale tildado en cada presupuesto nuevo.',
        tildada: 'Tildado en cada presupuesto nuevo',
        tildadaCon: (texto: string) => `Tildado en cada presupuesto nuevo: «${texto}»`,
        tildadaElTextoNuevo: 'Tildado en cada presupuesto nuevo: el texto nuevo',
        agregar: 'Agregar un aviso',
        quitar: 'Quitar este aviso',
        etiquetaDelTexto: 'Texto del aviso',
        nuevaSinGuardar: 'Nuevo, sin guardar',
        lleno: (cuantos: number) =>
          `Entran ${String(cuantos)} como mucho: para sumar otro, quitá uno.`,
        seVaUna: (texto: string) => `Se va el aviso que agregaste: «${texto}»`,
        seVanVarias: (cuantos: number) => `Se van los avisos que agregaste (${String(cuantos)}).`,
      },
      condiciones: {
        titulo: 'Condiciones',
        resumen: (total: number, tildadas: number) =>
          `${total === 1 ? '1 condición' : `${String(total)} condiciones`} · ${tildadasEnFemenino(tildadas, total)}`,
        dondeVa: 'Lo que tiene que dejar listo tu cliente. Van después de los avisos.',
        tildadas: 'Lo que tildás acá sale tildado en cada presupuesto nuevo.',
        tildada: 'Tildada en cada presupuesto nuevo',
        tildadaCon: (texto: string) => `Tildada en cada presupuesto nuevo: «${texto}»`,
        tildadaElTextoNuevo: 'Tildada en cada presupuesto nuevo: el texto nuevo',
        agregar: 'Agregar una condición',
        quitar: 'Quitar esta condición',
        etiquetaDelTexto: 'Texto de la condición',
        nuevaSinGuardar: 'Nueva, sin guardar',
        lleno: (cuantas: number) =>
          `Entran ${String(cuantas)} como mucho: para sumar otra, quitá una.`,
        seVaUna: (texto: string) => `Se va la condición que agregaste: «${texto}»`,
        seVanVarias: (cuantas: number) =>
          `Se van las condiciones que agregaste (${String(cuantas)}).`,
      },
    },
    lista: {
      cambiar: 'Cambiar:',
      tituloOpcional: 'Título (opcional)',
      ayudaDelTitulo: 'Va en negrita, arriba del texto.',
      asiLoLeeTuCliente: 'así lo lee tu cliente',
      ejemploDelTexto: 'Escribilo como querés que lo lea tu cliente…',
      listo: 'Listo',
      ordenar: 'Ordenar',
      ayudaAlOrdenar: 'Subí o bajá cada uno: así salen en el presupuesto.',
      cambiadoSinGuardar: 'Cambiado, sin guardar',
      seVaCuandoGuardes: 'Se va cuando guardes.',
      deshacer: 'Deshacer',
      subir: (texto: string) => `Subir «${texto}»`,
      bajar: (texto: string) => `Bajar «${texto}»`,
      subirElTextoNuevo: 'Subir el texto nuevo',
      bajarElTextoNuevo: 'Bajar el texto nuevo',
      loMarcadoSeCompletaSolo: 'Lo marcado se completa solo',
      sumarUnDato: 'Sumar un dato que se completa solo',
    },
    huecos: {
      plazo: {
        nombre: 'El plazo',
        explicacion: (Dato: Envoltorio, valor: string) => (
          <>
            <Dato>{valor}</Dato> es el plazo de fabricación de cada presupuesto, en días hábiles.
            Arranca en el de «Números» y en cada presupuesto lo podés cambiar.
          </>
        ),
      },
      modificaciones: {
        nombre: 'Las modificaciones',
        explicacion: (Dato: Envoltorio, valor: string) => (
          <>
            <Dato>{valor}</Dato> son las que entran en el precio. Salen de «Números».
          </>
        ),
      },
      valor_modificacion: {
        nombre: 'El valor de una modificación',
        explicacion: (Dato: Envoltorio, valor: string) => (
          <>
            <Dato>{valor}</Dato> es lo que sale cada modificación de más. Sale de «Números».
          </>
        ),
      },
      relevamiento: {
        nombre: 'Lo pagado del relevamiento',
        explicacion: (Dato: Envoltorio, valor: string) => (
          <>
            <Dato>{valor}</Dato> es lo que te pagó tu cliente hasta el día que le mandás el
            presupuesto; acá va de ejemplo el valor del relevamiento de «Tu taller». Si no te pagó
            nada, este aviso no sale.
          </>
        ),
      },
      sena: {
        nombre: 'La seña',
        explicacion: (Dato: Envoltorio, valor: string) => (
          <>
            <Dato>{valor}</Dato> es la seña de cada trabajo; acá va de ejemplo la de «Tu taller».
          </>
        ),
      },
      meses: {
        nombre: 'Los meses de garantía',
        explicacion: (Dato: Envoltorio, valor: string) => (
          <>
            <Dato>{valor}</Dato> son los meses de garantía. Salen de «Números».
          </>
        ),
      },
    },
    formas: {
      vaElegida: 'Va elegida de entrada',
      cambiarLaForma: 'Cambiar la forma de pago',
      sinNombre: 'Sin nombre',
      nuevaSinGuardar: 'Nueva, sin guardar',
      nombre: 'Nombre',
      ayudaDelNombre:
        'Es para vos, para elegirla en cada presupuesto. Tu cliente lee el texto de abajo.',
      loQueLeeTuCliente: 'Lo que lee tu cliente',
      ejemploDelTexto: 'Por ejemplo: seña del 50% y el saldo en dos cuotas…',
      quitar: 'Quitar esta forma de pago',
      cuantas: (cuantas: number) =>
        cuantas === 1 ? '1 forma de pago' : `${String(cuantas)} formas de pago`,
      ayudaAlOrdenar: 'Subí o bajá cada una: la primera va elegida en cada presupuesto nuevo.',
      subirLaNueva: 'Subir la forma de pago nueva',
      bajarLaNueva: 'Bajar la forma de pago nueva',
      agregar: 'Agregar una forma de pago',
      lleno: (cuantas: number) =>
        `Entran ${String(cuantas)} como mucho: para sumar otra, quitá una.`,
    },
    garantia: {
      cambiarElTexto: 'Cambiar el texto de la garantía:',
      texto: 'Texto de la garantía',
    },
    datos: {
      asiSale: 'Así sale arriba de cada presupuesto',
      vacio: 'Acá van tu nombre o razón social, tu CUIT, tu condición fiscal y tu domicilio.',
      enComoTePagan: (Quien: Envoltorio, quien: ReactNode) => (
        <>
          En «Cómo te pagan» tenés a <Quien>{quien}</Quien>. Si presupuestás a ese nombre, no hace
          falta que los escribas de nuevo.
        </>
      ),
      usarElCobro: 'Usar el titular y el CUIT',
      cambiarTusDatos: 'Cambiar tus datos',
      nombreORazonSocial: 'Nombre o razón social',
      ayudaDelNombre: 'A nombre de quién está el CUIT.',
      cuit: 'CUIT',
      ayudaDelCuit: 'Sale al lado de tu nombre.',
      condicionFiscal: 'Condición fiscal',
      elegila: 'Elegila',
      ayudaDeLaCondicion: 'Sale debajo de tu CUIT.',
      domicilio: 'Domicilio',
      ejemploDelDomicilio: 'Calle y número, localidad',
      ayudaDelDomicilio: 'El del taller, con la localidad.',
      telefono: 'Teléfono',
      ayudaDelTelefono: 'Con el teléfono, tu cliente tiene un botón para escribirte por WhatsApp.',
      email: 'Email',
      ayudaDelEmail: 'Sale al lado del teléfono.',
      tuCuit: 'tu CUIT',
      tuDomicilio: 'tu domicilio',
    },
    numeros: {
      plazo: 'Plazo de fabricación (días hábiles)',
      ayudaDelPlazo: 'El que arranca en cada presupuesto nuevo. En cada uno lo podés cambiar.',
      garantia: 'Garantía (meses)',
      ayudaDeLaGarantia: 'La ley pide por lo menos 6 meses.',
      modificaciones: 'Modificaciones incluidas',
      ayudaDeLasModificaciones: 'Las del diseño 3D que entran en el precio.',
      valor: 'Valor de una modificación de más',
      ayudaDelValor: 'Lo que cobrás cada una que pase de esas.',
    },
    problemas: {
      titularLargo: (caracteres: number) => `El nombre entra en ${String(caracteres)} caracteres.`,
      elNombre: 'el nombre',
      elCuit: 'el CUIT',
      domicilioLargo: (caracteres: number) =>
        `El domicilio entra en ${String(caracteres)} caracteres.`,
      elDomicilio: 'el domicilio',
      telefonoLargo: (caracteres: number) =>
        `El teléfono entra en ${String(caracteres)} caracteres.`,
      elTelefono: 'el teléfono',
      emailMal: 'Revisá el mail: tiene que ser como taller@ejemplo.com.',
      elEmail: 'el mail',
      plazo: 'Escribí el plazo en días hábiles, entre 1 y 365.',
      elPlazo: 'el plazo de fabricación',
      garantiaCorta: 'La ley pide por lo menos 6 meses.',
      garantia: 'Escribí los meses de garantía, entre 6 y 120.',
      losMeses: 'los meses de garantía',
      modificaciones: 'Escribí cuántas entran en el precio, entre 0 y 10.',
      lasModificaciones: 'las modificaciones incluidas',
      valor: 'Escribí cuánto sale una modificación de más. Puede ser 0.',
      elValor: 'el valor de una modificación',
      textoVacio: 'Escribí el texto o quitalo de la lista.',
      unTextoVacio: 'un texto vacío',
      textoLargo: (caracteres: number) => `Un texto entra en ${String(caracteres)} caracteres.`,
      unTextoLargo: 'un texto muy largo',
      sinFormas: 'Dejá por lo menos una forma de pago: en cada presupuesto elegís una.',
      lasFormas: 'las formas de pago',
      formaSinNombre: 'Ponele un nombre, así la elegís en cada presupuesto.',
      elNombreDeLaForma: 'el nombre de una forma de pago',
      formaVacia: 'Escribí cómo te paga o quitala.',
      unaFormaVacia: 'una forma de pago vacía',
      garantiaVacia: 'La garantía no puede quedar vacía.',
      garantiaLarga: (caracteres: number) =>
        `La garantía entra en ${String(caracteres)} caracteres.`,
      elTextoDeLaGarantia: 'el texto de la garantía',
      textos: 'Hay un texto que no se puede guardar así.',
      losTextos: 'los textos',
    },
    cambios: {
      tusDatos: 'tus datos',
      losNumeros: 'los números',
      primero: {
        nuevos: (cuantos: number) =>
          cuantos === 1 ? 'un texto nuevo' : `${String(cuantos)} textos nuevos`,
        cambiados: (cuantos: number) =>
          cuantos === 1 ? 'un texto cambiado' : `${String(cuantos)} textos cambiados`,
        quitados: (cuantos: number) =>
          cuantos === 1 ? 'un texto quitado' : `${String(cuantos)} textos quitados`,
      },
      despues: {
        nuevos: (cuantos: number) => (cuantos === 1 ? 'uno nuevo' : `${String(cuantos)} nuevos`),
        cambiados: (cuantos: number) =>
          cuantos === 1 ? 'uno cambiado' : `${String(cuantos)} cambiados`,
        quitados: (cuantos: number) =>
          cuantos === 1 ? 'uno quitado' : `${String(cuantos)} quitados`,
      },
      elOrden: 'el orden',
      loQueSaleTildado: 'lo que sale tildado',
      cuantos: (cuantos: number) => (cuantos === 1 ? '1 cambio' : `${String(cuantos)} cambios`),
    },
    barra: {
      sinGuardar: 'Sin guardar',
      conLosCambios: (cambios: string) => `: ${cambios}`,
      noSeGuardo: (queRevisar: string) => `No se guardó: revisá ${queRevisar}.`,
      guardarLosCambios: 'Guardar los cambios',
    },
    seDeshace: {
      vuelve: (texto: string) => `Vuelve «${texto}», que habías quitado.`,
      vuelveASuTexto: (texto: string) => `«${texto}» vuelve a su texto de siempre.`,
      vuelveTildado: (texto: string) => `«${texto}» vuelve a salir tildado.`,
      vuelveSinTildar: (texto: string) => `«${texto}» vuelve a salir sin tildar.`,
      vuelvenLasFormas: 'Vuelven las tres formas de pago de siempre, con sus textos.',
      lasFormasVuelven: 'Las formas de pago vuelven a sus textos de siempre.',
      laGarantiaVuelveASuTexto: 'La garantía vuelve a su texto de siempre.',
      elPlazoVuelve: (dias: number) => `El plazo vuelve a ${String(dias)} días hábiles.`,
      vuelvenLasModificaciones: (cuantas: number, valor: string) =>
        `Vuelven a entrar ${String(cuantas)} modificaciones, y cada una de más vale ${valor}.`,
      laGarantiaVuelve: (meses: number) => `La garantía vuelve a ${String(meses)} meses.`,
    },
    textosDeSiempre: {
      sinCambios:
        'Estás usando los textos de siempre, los de tu planilla. Lo que cambies arriba queda como tuyo, y desde acá vas a poder volver a estos cuando quieras.',
      cambiaste: (cuantas: number) =>
        `Cambiaste ${cuantas === 1 ? '1 cosa' : `${String(cuantas)} cosas`} de los textos de tu planilla, con los que arrancó la app. Si te arrepentís, podés volver a ellos: tus datos no se tocan.`,
      volver: 'Volver a los textos de siempre',
      pregunta: '¿Volvés a los textos de siempre?',
      bajadaDeLaPregunta: 'Los de tu planilla, con los que arrancó la app',
      seDeshacen: (cuantas: number) =>
        cuantas === 1 ? 'Se deshace 1 cosa' : `Se deshacen ${String(cuantas)} cosas`,
      tambienSePierde:
        'Lo que cambiaste de los textos y todavía no guardaste también se pierde. Tus datos no cambian, y los presupuestos que ya mandaste quedan como salieron.',
      tusDatosNoCambian:
        'Tus datos no cambian, y los presupuestos que ya mandaste quedan como salieron.',
      cancelar: 'Cancelar',
      volverALosDeSiempre: 'Volver a los de siempre',
    },
    resumen: {
      tusDatos: 'Tus datos',
      faltan: (cuantos: number, que: string) =>
        cuantos === 1
          ? `Falta ${que}, que la ley pide en un presupuesto.`
          : `Faltan ${que}, que la ley pide en un presupuesto.`,
      plazo: 'Plazo',
      diasHabiles: (dias: number) => cuantas(dias, 'día hábil', 'días hábiles'),
      garantia: 'Garantía',
      meses: (meses: number) => cuantas(meses, 'mes', 'meses'),
      textos: 'Textos',
      cuantosTextos: (incluye: number, avisos: number, condiciones: number) =>
        `${cuantas(incluye, 'cosa que incluye', 'cosas que incluye')}, ${cuantas(avisos, 'aviso', 'avisos')} y ${cuantas(condiciones, 'condición', 'condiciones')}`,
      cambiar: 'Cambiar lo que va en tus presupuestos',
    },
  },
} as const;
