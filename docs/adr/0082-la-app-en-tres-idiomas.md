# 0082. La app en tres idiomas

- Estado: aceptada
- Fecha: 2026-10-02
- Completa al [0005](0005-offline-first.md) y al [0035](0035-un-service-worker-propio.md) (los chunks de
  cada idioma entran al precache), al [0016](0016-el-cobro-y-el-rechazo-que-encuentra-al-usuario.md) y al
  [0023](0023-sesion-bloqueo-con-huella-y-passkeys.md) (los rechazos y los errores de la cuenta en tres
  idiomas), al [0036](0036-avisos-por-dispositivo-fuera-de-la-replica.md) (el idioma de cada aviso), al
  [0041](0041-la-version-y-las-novedades.md) (las novedades en tres idiomas), al
  [0046](0046-la-vista-del-cliente-una-lista-blanca-en-la-base.md) y al
  [0067](0067-la-vista-antes-de-aprobar.md) (el idioma en la vista del cliente), al
  [0049](0049-la-vista-previa-del-enlace.md) (`titulo_compartido` devuelve también el idioma de los clientes),
  al [0055](0055-lo-que-se-guarda-en-el-aparato-y-lo-que-no.md) (la copia local del idioma y
  `user_metadata.idioma`), al [0057](0057-las-opiniones-de-los-clientes.md) (las preguntas de la encuesta son
  datos), al [0073](0073-la-app-se-llama-numa.md) (la app ya no habla solo castellano), al
  [0075](0075-la-app-abre-sin-pantalla-en-blanco.md) (el esqueleto en el idioma de quien abre) y al
  [0080](0080-el-presupuesto-adentro-de-la-ficha.md) (el idioma de la revisión, la plantilla de siempre por
  idioma y el PDF).
- La plata en cada idioma está en el [0081](0081-los-tesoros-en-dolares.md); los trabajos en dólares, en el
  [0083](0083-los-trabajos-en-dolares.md).

## Contexto

En el tablero quedó esto, tal cual:

> Joaco: ¿idiomas? (inglés + portugués además de español)
>
> Eliseo: DEFINITIVAMENTE
> al igual que algunos detalles de las monedas no es prioritario.. pero si lo vamos a lanzar en algun
> momento.. seria bueno que se pueda configurar

La app tenía unos 2.700 textos en castellano repartidos en el código: en el JSX, en props como `titulo`,
`etiqueta` y `ayuda`, en los modelos, en los avisos, en el dominio (211 textos: el camino del cliente, la
plantilla del presupuesto, la escala de la encuesta) y en la función de los avisos. Unos 320 lugares
armaban frases a mano: plurales con `n === 1`, géneros adivinados, pedazos de frase en plantillas, meses
bajados a minúscula, listas unidas a mano. Las fechas, los números y los porcentajes salían de `Intl` con
`'es-AR'` fijo en una docena de lugares, y el campo de plata escribía puntos de miles y comas decimales a
mano.

Lo que más importa, en orden: que en castellano la app diga y muestre lo mismo que antes; que en inglés y
en portugués no quede un texto de la app en castellano ni una frase que suene traducida.

## Decisión

### Catálogos tipados escritos a mano, con `Intl`

Se compararon cinco librerías contra escribirlo a mano, con Vite 8 y la escala real de NUMA:

|                                  | A mano + `Intl`            | Paraglide JS 2.25                             | Lingui 6.8                    | i18next 26 + react-i18next 17                        | react-intl 12  | use-intl 4.14               |
| -------------------------------- | -------------------------- | --------------------------------------------- | ----------------------------- | ---------------------------------------------------- | -------------- | --------------------------- |
| Runtime (gzip)                   | 1,4 KB                     | 2,2 KB                                        | 4,1 KB                        | 22,4 KB                                              | 15,7 KB        | 14,1 KB                     |
| Un chunk por idioma              | sí                         | no: cada mensaje lleva los tres               | sí                            | sí                                                   | sí             | sí                          |
| Con Vite 8                       | sin plugin                 | plugin que baja plugins de un CDN al compilar | necesita volver a meter Babel | sin plugin                                           | sin plugin     | sin plugin                  |
| Parámetros tipados               | sí, la firma de la función | el nombre, no el tipo                         | del template del macro        | solo con recursos `as const`, y sin opciones compila | no             | sí, con mensajes `as const` |
| 1.000.000 (`many`) sin esa forma | cae en `other`             | devuelve la clave                             | cae en `other`                | devuelve la clave                                    | cae en `other` | cae en `other`              |

Con los 2.692 textos de NUMA, Paraglide deja el chunk inicial en 282 KB gzip contra 119 a mano, y a mano
el inglés y el portugués quedan aparte, con unos 48 KB cada uno. Paraglide además recarga la página al
cambiar de idioma y puede compilar cero mensajes en silencio si no encuentra su plugin.

Se eligen catálogos escritos a mano, sin dependencias: unas 200 líneas propias (la tienda del idioma, los
plurales con `Intl.PluralRules`, el seudoidioma, la regla de lint y los tests), funciones con parámetros
tipados, un chunk diferido por idioma que el service worker ya precachea, el mismo catálogo en el Worker del
PDF, cambio de idioma sin recargar y sin destello. Lo que cuesta es no tener un flujo PO para traductores. Si
entra un traductor profesional o una plataforma de traducción, el paso es Lingui con PO, cuando salga su
transformación de macros sin Babel.

### Cómo están armados

- **El castellano es la fuente** y queda en el chunk inicial; inglés y portugués llegan con `import()`. El
  tipo `Mensajes` sale del catálogo castellano con `Ensanchar` (los literales pasan a `string` y las funciones
  quedan con sus parámetros); inglés y portugués van con `satisfies Mensajes` e `import type`, así una clave
  que falta, una que sobra o un parámetro de otro tipo no compilan, y el chunk inglés no arrastra el
  castellano. Lo que el tipo no ve, una traducción que ignora un parámetro, lo ve `catalogos.test` con una
  llamada centinela por cada clave que es función.
- **Un mensaje con datos es una función** con parámetros con nombre. Una negrita en el medio de una frase la
  pone quien llama con un `Envoltorio`, así la frase queda entera y sirve igual en el DOM y en react-pdf.
- **Los plurales** con `plural(cantidad, { one, other, … })` sobre `Intl.PluralRules`, con `other` siempre de
  respaldo. En portugués 0 y 1,5 son `one`: donde el cero importa va una forma `=0`. En castellano y
  portugués 1.000.000 es `many`.
- **Las claves** van por zona (`es/tesoros.ts`, `es/paginaInicio.ts`…), una sección por slice, que un índice
  junta. `useMensajes()` en los componentes y `mensajes()` fuera de React, siempre al momento de usarlo; las
  tablas exportadas que siguen al idioma sin cambiar su API se arman con `textosDelIdioma`.
- **Dos familias de catálogos.** La de la app (`shared/idioma`), en el idioma de la persona, y la de lo que
  ve el cliente (`shared/idioma-del-cliente`: la página, la encuesta, el presupuesto y su PDF, los WhatsApp y
  la vista previa del enlace), pedida siempre con un idioma explícito, nunca el de la persona
  (`ConElIdiomaDelCliente`, `formatosDelCliente(idioma)`). En inglés o en portugués, el Worker del PDF y `/v/`
  cargan solo lo del cliente, unos 7 KB por idioma contra los 57 de la app.
- **Lo que no es catálogo vive en `shared/lib`**: el idioma en uso, los plurales, el seudoidioma, los formatos
  de fecha, plata y porcentaje. Ahí lo importan el Worker del PDF y los formateadores sin arrastrar el
  catálogo de la app; los textos de `shared/lib` llegan por `textosDeLib()`, un lector que fija
  `shared/idioma`. Es una diferencia con el diseño, que pedía un solo segmento: con uno solo, el Worker
  traía el catálogo entero de la app.
- **En las carpetas de lo que ve el cliente**, un `no-restricted-imports` prohíbe los formateadores del dueño
  (`formatearPesos`, `formatearLaPlata`, `fechaLarga`…), que escriben en el idioma de la persona. Sin esa regla,
  «Ver cómo lo ve tu cliente» con la app en castellano y los clientes en portugués saldría con los textos en
  portugués y la plata en castellano.

### Quién manda en cada lugar, y dónde se guarda

- **La persona** manda en la app del dueño entera. Su idioma va en `user_metadata.idioma`, por una mutación
  de la cola con el molde de la del perfil, así anda sin señal y llega al servidor. El orden para elegir,
  con sesión: el cambio que todavía está en la cola, después `user_metadata.idioma` y, si no hay,
  castellano. La cuenta de Eliseo no tiene idioma: con este orden su app no cambia aunque su celular esté en
  inglés. Sin sesión, el navegador, comparando por idioma (`pt-PT` va a portugués, `es-419` a castellano) y,
  si no es ninguno de los tres, castellano. Una cuenta nueva guarda el idioma en uso al crearse.
- **La copia local** (`maun:idioma`) lleva el id de la persona y sirve solo para pintar antes de React: el
  script del `head` la usa si la sesión guardada es de la misma persona, y `limpiarDatosLocales` la borra al
  salir. El script y React deciden con la misma regla y se prueban juntos, como `forma.ts`.
- **En otro aparato**: la sesión trae el idioma en sus claims; cuando se renueva con otro, la app abierta
  cambia sola (`IdiomaDeLaCuenta`, en la ruta con sesión, que además deja la copia del aparato al día).
- **Los clientes del taller** mandan en lo que ven: `ajustes.idioma_de_los_clientes` (castellano por
  defecto), que se elige en Ajustes, en «Tu taller», con «Tus clientes leen en». Viaja en la vista del cliente
  y en la encuesta pública, y `titulo_compartido` lo devuelve para la vista previa del enlace.
- **Cada revisión del presupuesto** guarda el idioma con que se armó su contenido
  (`revisiones_del_presupuesto.idioma`). La app lo manda en un parámetro nuevo de `mandar_el_presupuesto`, con
  default, y si no viene (una app vieja) la base toma el de los clientes: la cola es de cada aparato, y otro
  aparato pudo cambiar el idioma de los clientes en el medio. El presupuesto en `/v/` y su PDF van en el idioma
  de su revisión.

### El arranque, sin destello

- El script del `head` pone `<html lang>` con la regla de arriba antes de pintar, y el esqueleto que el build
  inyecta en el HTML tiene sus textos en los tres idiomas (`TEXTOS_DEL_ARRANQUE`): el script escribe el del
  idioma en el único elemento con texto, el mismo DOM que el primer render de React.
- El esqueleto tapa la app solo mientras llega el primer catálogo al arrancar. Cambiar de idioma después deja
  la pantalla como está hasta que llega el nuevo y rearma el árbol con una `key` debajo de los proveedores: la
  cola y el cache no se pierden. En castellano no se espera nada.
- En `/v/` y `/o/` el script no sabe el idioma del taller. La función de borde de la vista previa ya consulta
  `titulo_compartido` y la encuesta: escribe `<html lang>` y `data-idioma-del-taller` en el HTML que sirve, y la
  página lo confirma cuando llega la vista. Mientras carga, sin señal o con el enlace dado de baja, la página
  habla en el idioma del navegador si es uno de los tres y, si no, en castellano.
- `<html lang>` dice siempre el idioma real: con otro, el navegador ofrece traducir la página, y su traductor
  cambia nodos que maneja React y lo rompe. Lo que se muestra tal como vino de la base (nombres, títulos,
  descripciones, notas, importes) va con `translate="no"`.

### El castellano no cambia ni un carácter

Los formatos de fecha de antes son la implementación castellana; inglés y portugués usan lo que da `Intl`
con su etiqueta («Thu, Oct 1», «qui., 1º de out.»). Las horas: portugués con 24 horas e inglés con AM y PM,
siempre con `hourCycle` explícito; el castellano, como antes, también donde antes salía con 12 horas («Última
sincronización» en Ajustes usaba `es-AR` sin opciones, que desde CLDR 44 da «02:05» para las 14:05: se fijó
`h12` para no cambiarlo, y queda anotado como algo a corregir aparte). La zona es la del taller y la semana
empieza el lunes en los tres. Los tests de antes que
buscan o comparan textos en castellano pasan sin tocar sus textos, y el idioma de los tests es fijo
(`locale: 'es-AR'` en las configuraciones de Playwright y castellano en `vitest.setup.ts`, porque jsdom dice
`en-US`).

El campo de plata recibe por props los separadores del idioma: en castellano y portugués, punto de miles y
coma decimal, como antes; en inglés solo el punto abre los decimales. Al pegar, la misma lógica de
`leerImporte`, con los separadores dados vuelta en inglés. En castellano el campo se comporta igual que
antes y sus tests no cambiaron.

### La gramática se reescribe, no se extrae

Cada frase va entera al catálogo, con sus huecos con nombre, y la gramática de cada idioma vive en su
catálogo: el castellano conserva sus ayudantes (`enPalabras` con género, el artículo del faltante), y en
inglés y portugués la frase se arma para no necesitar el artículo de un texto del dueño. Nada se baja a
minúscula para meterlo en una frase fuera del castellano. La lógica que comparaba palabras pasa a comparar
códigos. «Avisos» y «Listo», que en castellano quieren decir varias cosas, son una clave por sentido.

El dominio no devuelve frases: devuelve datos y códigos y la app escribe, o recibe los textos inyectados, como
recibía `Formatos` (`TextosDeLaVista`, `TextosDeLasEscalas`, `FrasesDelNumero`). Sigue puro y con 100 % de
cobertura. La plantilla de siempre del presupuesto tiene una versión por idioma (`plantillaDeSiempre`), y la
castellana son los textos de Eliseo, textuales; `null` en `ajustes.plantilla_del_presupuesto` quiere decir la
de siempre en el idioma de los clientes.

### Lo que no se traduce

- Lo que escribió alguien: las descripciones, las notas, los textos del presupuesto que el dueño guardó, los
  nombres de los tesoros y de los clientes, las categorías que escribió y las preguntas de la encuesta (que
  son datos, también las de fábrica, sembradas en castellano). Si el idioma de los clientes no es el
  castellano y el taller tiene textos propios, Ajustes lo dice.
- Lo que la base sembró al crear la cuenta («Mi taller», Hogar, Maun, Diezmo, Cocos).
- Las marcas (NUMA, MAUN, «Taller MAUN», Mercado Pago, WhatsApp) y las palabras de la ley y los bancos
  argentinos (CUIT, ARCA, monotributo, alias, CBU, «DOCUMENTO NO VÁLIDO COMO FACTURA»); lo que las explica sí.
  En el PDF, la leyenda de ARCA queda en castellano y, en inglés y portugués, lleva debajo y más chica su
  traducción.
- Los mensajes de los `raise` de la base: la app nueva traduce cada código. Una app sin actualizar muestra el
  texto de la base, por eso va en el castellano de Eliseo y sin decir «versión».
- El manifiesto de la PWA (un idioma por build) y las novedades de antes de este cambio.

Lo que el sistema escribe con un nombre fijo y queda guardado se guarda en castellano y se traduce al
mostrarlo: las categorías del libro, «Apertura», las categorías que la app ofrece para elegir, «Qué dólar» y
los conceptos que la app propone para un pago («Seña de la visita», «Seña», «Saldo final en la entrega»,
`CONCEPTOS_DE_SIEMPRE` en el dominio). Así una misma categoría no queda en dos idiomas en la base. Un concepto
de esos se ve en el idioma de quien mira, también el cliente en su página; si el dueño deja el que propone la
app, se guarda el castellano, y si lo cambia, queda como lo escribió y con `translate="no"`.

### Las novedades

Las de antes de este cambio quedan en castellano y se ven solo en castellano (`NOVEDADES_DE_ANTES`). Desde
esta, cada entrada lleva sus líneas en los tres idiomas y el tipo lo obliga (`NOVEDADES_EN_LOS_TRES_IDIOMAS`).
En inglés y en portugués la lista empieza en la primera que tiene ese idioma. `novedades.test.ts` vale por
idioma, con su lista de palabras que no van: en la inglesa no va `bucket`, que es la palabra del glosario, y
en la portuguesa va «inteligência artificial» y no «ia», que también es un verbo.

### Los avisos

- **Los push.** `private.avisos_por_mandar` devuelve con cada aviso el idioma de su persona, leído de
  `raw_user_meta_data` y validado contra los tres (si no, castellano). Los textos viven en la función, en los
  tres idiomas; en castellano dicen exactamente lo de antes, y la carga suma `lang` solo si la persona no está
  en castellano, así los `deepEqual` de los tests de antes no cambian. El service worker usa ese `lang` (o
  `es-AR` si no viene) para la notificación y para elegir su texto de respaldo, que existe en los tres: adentro
  del service worker `navigator.languages` es el del navegador, no lo elegido en Ajustes. El aviso de prueba
  sale en el idioma de quien lo pide.
- **Los de la cola.** Un aviso en pantalla que la cola guarda copia su texto al encolar. Si la persona cambia
  de idioma con algo pendiente, ese aviso sale en el idioma de antes. Se acepta: es un texto que dura lo que
  tarda en volver la señal.

### Cómo se encuentra lo que quedó sin traducir

- La regla `maun/sin-texto-suelto` (propia, en `packages/config`, sin dependencias) marca en JSX el texto con
  letras y cualquier atributo con un texto con letras, salvo una lista de atributos de código con su motivo
  (`atributos-de-codigo.json`). Se prendió zona por zona y hoy vale en todo `apps/web/src`.
- `scripts/textos-sueltos.test.ts` recorre `src` con el compilador de TypeScript y falla con un texto para una
  persona fuera de los catálogos, con una lista de excepciones con su motivo (las novedades, que son contenido
  con su idioma; los datos de prueba). La lista de zonas que faltaban, `zonas-de-texto.json`, quedó vacía.
- El seudoidioma: un cuarto idioma derivado del castellano, acentuado, un 40 % más largo y entre `⟦ ⟧`. Lo que
  aparece sin corchetes quedó sin traducir. Es una herramienta de prueba y no está en Ajustes, ni siquiera en el
  modo de desarrollo: ninguna persona lo elige. Está en el build porque los e2e corren contra el build, y se
  prende con una clave del aparato, `maun:seudoidioma` en `activo`, que ponen los tests; para mirarlo a mano,
  `localStorage.setItem('maun:seudoidioma', 'activo')` en la consola y recargar. Las fechas también salen marcadas:
  los formateadores de `shared/lib/fechas.ts` marcan lo que escriben cuando el seudoidioma está prendido, y los
  de la familia del cliente en la página pública, donde la tienda de la app no lo está. Una función del
  catálogo que devuelve JSX sale entera adentro de un `<span data-seudo>` con sus corchetes, y el recorrido no
  mira adentro.
- Dos recorridos con el seudoidioma: uno de Vitest por Inicio, Finanzas, Ajustes y la ficha de un trabajo en
  dólares (`app/seudoidioma.test.tsx`), y uno de Playwright por todas las `PANTALLAS`, en 390 y en 1440
  (`e2e/reparto/seudoidioma.spec.ts`). Los dos fallan con un texto con letras fuera de los corchetes que no esté
  adentro de `translate="no"`, de un `<textarea>` o de un `<option>`; el de Playwright también con un texto
  marcado que no entra en su lugar. Lo que viene de la base lleva `translate="no"`: los nombres, las iniciales,
  las notas, las anotaciones de la agenda, la sigla de la condición fiscal y la copia escondida con que crece un
  campo de texto. Las flechas del lienzo de Tesoros, que React Flow nombraría en inglés, llevan una etiqueta del
  catálogo y `aria-hidden`; el crédito de React Flow es de un tercero y el recorrido no lo mira.
- Los tests que cambian de idioma cargan el catálogo con `import()`: con la suite entera en paralelo eso puede
  pasar los 5 segundos que da Vitest, así que un test tiene 20.

## Los mails de Supabase Auth

No se tocaron. Para que salgan en el idioma de la persona, cada plantilla puede elegir con `.Data.idioma`,
que es `user_metadata.idioma`: lo guarda la cuenta nueva al crearse y cada cambio de idioma en Ajustes. Una
cuenta sin idioma (la de Eliseo) sigue en castellano. El asunto también es una plantilla. Para pegar en el
panel (Authentication → Email Templates), en cada una, reemplazando el castellano por el texto que está
configurado hoy, así el castellano no cambia:

Confirmar la cuenta (asunto y cuerpo):

```gotemplate
{{ $idioma := "es" }}{{ with .Data.idioma }}{{ $idioma = . }}{{ end }}{{ if eq $idioma "en" }}Confirm your NUMA account{{ else if eq $idioma "pt-BR" }}Confirme sua conta no NUMA{{ else }}Confirmá tu cuenta de NUMA{{ end }}
```

```gotemplate
{{ $idioma := "es" }}{{ with .Data.idioma }}{{ $idioma = . }}{{ end }}
{{ if eq $idioma "en" }}
<h2>Confirm your account</h2>
<p>To start using NUMA, confirm your email address.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm my account</a></p>
{{ else if eq $idioma "pt-BR" }}
<h2>Confirme sua conta</h2>
<p>Para começar a usar o NUMA, confirme seu e-mail.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar minha conta</a></p>
{{ else }}
<h2>Confirmá tu cuenta</h2>
<p>Para empezar a usar NUMA, confirmá tu mail.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
{{ end }}
```

Cambiar la contraseña (asunto y cuerpo):

```gotemplate
{{ $idioma := "es" }}{{ with .Data.idioma }}{{ $idioma = . }}{{ end }}{{ if eq $idioma "en" }}Reset your NUMA password{{ else if eq $idioma "pt-BR" }}Redefina sua senha do NUMA{{ else }}Cambiá tu contraseña de NUMA{{ end }}
```

```gotemplate
{{ $idioma := "es" }}{{ with .Data.idioma }}{{ $idioma = . }}{{ end }}
{{ if eq $idioma "en" }}
<h2>Reset your password</h2>
<p>Someone asked to reset the password for this account. If it wasn't you, you can ignore this email.</p>
<p><a href="{{ .ConfirmationURL }}">Choose a new password</a></p>
{{ else if eq $idioma "pt-BR" }}
<h2>Redefina sua senha</h2>
<p>Pediram para redefinir a senha desta conta. Se não foi você, pode ignorar este e-mail.</p>
<p><a href="{{ .ConfirmationURL }}">Escolher uma nova senha</a></p>
{{ else }}
<h2>Cambiá tu contraseña</h2>
<p>Pidieron cambiar la contraseña de esta cuenta. Si no fuiste vos, ignorá este mail.</p>
<p><a href="{{ .ConfirmationURL }}">Elegir una contraseña nueva</a></p>
{{ end }}
```

Cambiar el mail (asunto y cuerpo):

```gotemplate
{{ $idioma := "es" }}{{ with .Data.idioma }}{{ $idioma = . }}{{ end }}{{ if eq $idioma "en" }}Confirm your new email for NUMA{{ else if eq $idioma "pt-BR" }}Confirme seu novo e-mail no NUMA{{ else }}Confirmá tu mail nuevo de NUMA{{ end }}
```

```gotemplate
{{ $idioma := "es" }}{{ with .Data.idioma }}{{ $idioma = . }}{{ end }}
{{ if eq $idioma "en" }}
<h2>Confirm your new email</h2>
<p>Confirm that you want to use {{ .NewEmail }} for your NUMA account.</p>
<p><a href="{{ .ConfirmationURL }}">Confirm the change</a></p>
{{ else if eq $idioma "pt-BR" }}
<h2>Confirme seu novo e-mail</h2>
<p>Confirme que você quer usar {{ .NewEmail }} na sua conta do NUMA.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar a mudança</a></p>
{{ else }}
<h2>Confirmá tu mail nuevo</h2>
<p>Confirmá que querés usar {{ .NewEmail }} en tu cuenta de NUMA.</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar el cambio</a></p>
{{ end }}
```

El `with` con un valor por defecto evita comparar contra una clave que no existe. Que esa forma ande igual
en el asunto es una inferencia sobre las plantillas de Go: conviene probarla con un mail real antes de
dejarla. Un proyecto gratis nuevo que manda con el correo de Supabase no puede editar las plantillas (ADR
0073); este es de antes. En la recuperación la persona no tiene sesión: la plantilla usa lo que haya quedado
en su `user_metadata`.

## Alternativas descartadas

- **Paraglide, Lingui, i18next, react-intl, use-intl**, por la tabla de arriba. La que más se acercaba es
  Lingui, y el día que haga falta un flujo PO es el paso siguiente.
- **Traducir en el service worker con claves.** El worker tendría que llevar los catálogos, no puede leer
  `localStorage`, `navigator.languages` adentro no es lo elegido y un worker viejo no conocería las claves
  nuevas. El texto se compone en la función, con el idioma de la persona.
- **La página del cliente en el idioma del navegador del cliente.** La página lleva textos que escribió el
  dueño, y mezclaría idiomas. Manda el idioma que el taller eligió para sus clientes.
- **Usar el navegador aunque haya sesión** (como el código de referencia): con eso la app de Eliseo cambiaría
  de idioma con el celular. Con sesión manda la cuenta.
- **Guardar el idioma solo en el aparato.** No llegaría a los avisos push, que se componen en el servidor, ni
  a los mails, ni al otro aparato.
- **Un selector de idioma en las pantallas sin sesión, el manifiesto por idioma y sembrar la cuenta nueva por
  idioma**: quedan afuera de este cambio.

## Consecuencias

- Todo texto nuevo entra al catálogo en los tres idiomas desde el primer día, con las palabras del glosario
  (`docs/referencia/glosario-de-idiomas.md`); la regla de lint y el test de los textos sueltos no dejan otra.
- Lo probado en e2e: `idiomas.spec.ts` cambia la app a inglés desde Ajustes y la recorre (Inicio, Tesoros,
  Finanzas, una ficha y Ajustes), pasa a portugués sin señal con el catálogo del service worker, sin un texto
  viejo, y comprueba que la cuenta quedó en portugués al volver la señal; pone a los clientes en portugués y ve
  `/v/`, el PDF con su `/Lang` y la encuesta en portugués. `el-portugues-entra.spec.ts` mide en 320 y 360, con
  un trabajo en dólares pendiente, las pestañas, la acción más larga, que ningún monto se corte y que ningún
  texto se salga de su caja (Início, Finanças, Caixinhas, una ficha, el cobro, Clientes, la ficha de una
  clienta y Configurações), y `hueco.spec.ts` corre también en portugués. La pasada en portugués a 320 encontró
  lo que el castellano no mostraba: lo pendiente en pesos y en dólares en un renglón (ahora va una moneda debajo
  de la otra); el título «Caixinhas» debajo de sus botones, los atajos de la prueba de un cobro y el total de los
  insumos cuando es largo (ahora bajan de renglón cuando no entran); «Financeiro» en la barra de abajo (en
  portugués la sección se llama «Finanças»); los montos con «ARS» de las tarjetas de Inicio, que la regla de
  `MontoQueEntra` medía como cifras (ahora cada mayúscula cuenta por 1,25, y un monto en pesos del castellano, que
  no tiene letras, sale igual que antes), y un «+-0%» de la comparación con el mes anterior. La cuenta de prueba
  queda en castellano una vez por corrida, en `sesion.setup.ts`: hacerlo en cada test topaba con el límite de
  pedidos de Supabase Auth. Un contexto que arma un spec con `browser.newContext` hereda el `locale` y la sesión
  del proyecto. Los specs que se saltean en el celular no limpian en su `afterEach`, que corre igual.
- Lo que no se pudo probar: Safari en un iPhone y Firefox con los formatos de `Intl` (lo de este documento sale
  de Chromium y Node), un aviso push de verdad en inglés y en portugués, el traductor del navegador y la app
  instalada cambiando de idioma sin señal.
- Un cambio de idioma con un aviso de la cola pendiente lo muestra en el idioma de antes (arriba).
