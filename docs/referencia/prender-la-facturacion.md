# Prender la facturación con ARCA

Para Joaquim, después del merge del PR de la facturación ([ADR 0085](../adr/0085-la-factura-con-arca.md)).
Nada de esto lo hace un agente: es la regla de `AGENTS.md` sobre la producción de ARCA.

Es una sola cosa, una vez: prender la producción. Después, cada taller se conecta solo desde Ajustes ›
Facturación › «Conectar con ARCA», con el asistente: hace su certificado, lo autoriza, crea su punto de
venta y conecta, sin que tengas que estar. Hasta que prendas, el asistente le dice al dueño «La facturación
de verdad todavía no está prendida. Avisale a Joaco.». Los nombres de los menús de ARCA son los de hoy y
pueden cambiar.

## Prender la producción, una sola vez

Desde la raíz del repo, en PowerShell:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$llave = [Convert]::ToBase64String($bytes)
$tmp = Join-Path $env:TEMP "numa-produccion.env"
"ARCA_PRODUCCION_LLAVE=$llave`nARCA_PRODUCCION_HABILITADA=si" | Set-Content -NoNewline -Encoding ascii $tmp
pnpm --filter @maun/db sb secrets set --env-file $tmp
Remove-Item $tmp
Remove-Variable bytes, llave
pnpm --filter @maun/db sb functions deploy facturar --use-api --no-verify-jwt
```

La llave cifra las claves de los certificados de los talleres. No la guardes en ningún lado ni la cambies:
si se cambia, cada taller tiene que volver a hacer su certificado. El último comando vuelve a desplegar la
función para que tome los secretos. Prender no factura nada: un taller empieza a facturar recién cuando se
conecta. Los secretos son de todo el proyecto, así que no despliegues ninguna función de prueba mientras
estén cargados.

## Avisale a Eliseo

Ya puede conectarse: Ajustes › Facturación › «Conectar con ARCA», desde una compu y con su clave fiscal de
nivel 3 (si es de nivel 2, la sube desde la app Mi ARCA o en una oficina de ARCA). Antes, conviene que hable
con su contador de esto:

- Qué factura: productos, servicios o las dos cosas, y si su monotributo es de venta de cosas muebles o de
  servicios. Con venta de cosas muebles, ninguna unidad puede pasar el precio unitario máximo, que es
  $ 716.840,77 desde agosto de 2026.
- Su categoría actual.
- Cuándo se factura el saldo: el día del cobro o, si vende cosas muebles, hasta fin del mes de la entrega.
  Lo de la visita y la seña se facturan el día en que entra la plata.
- El número de Ingresos Brutos y la fecha de inicio de actividades.
- Que el punto de venta nuevo es solo para NUMA.

Cuando esté conectado, que haga la primera factura con el próximo cobro real, mire el PDF y la busque en
ARCA, en «Mis Comprobantes» › «Emitidos».

## Si algo sale mal

- **Apagar todo al instante:** `pnpm --filter @maun/db sb secrets set ARCA_PRODUCCION_HABILITADA=no`, y
  después `pnpm --filter @maun/db sb functions deploy facturar --use-api --no-verify-jwt`. Lo pedido queda
  esperando, no sale nada más y nadie puede conectarse.
- **Sacarle el botón a un taller:** `pnpm --filter @maun/db db:facturacion --desconectar --email
  MAIL-DEL-DUEÑO`. Se niega si hay algo en vuelo; con `--forzar`, acepta lo que esté a revisar. Las
  facturas ya hechas se siguen viendo y se pueden anular, y el taller puede volver a conectarse desde
  Ajustes.
- **Un taller que se trabó en el asistente:** `db:facturacion --listar` te muestra en qué quedó su
  certificado (`pedido`, `subido` o `activo`). Si bajó el pedido más de una vez, el certificado que suba
  tiene que ser el del último.
- **Una factura mal hecha** se anula desde su pago, con la nota de crédito.
- **Una factura «a revisar»** que el control no resuelve: mirala en «Mis Comprobantes» y cerrala con
  `db:facturacion --resolver ID --como autorizada --cae CAE --vence AAAA-MM-DD --fecha AAAA-MM-DD`, o
  `--como rechazada` si ARCA no la tiene.

## Lo que vuelve

- **Cada febrero y agosto:** la escala nueva del monotributo (`AGENTS.md` lo dice; se la podés pedir a un
  agente).
- **Los certificados de los talleres vencen:** cada taller renueva el suyo desde Ajustes, con «Renovar el
  certificado», e Inicio le avisa 30 días antes.
- **El certificado de prueba** vence el 2/10/2028; lo renovás en WSASS como lo sacaste.
- **Las capturas del asistente,** si ARCA cambia sus pantallas.
- **La limpieza de los intercambios con ARCA de más de dos años** no está hecha (el ADR 0085 dice por qué):
  lo primero que se podría borrar es de 2028.

## Las capturas del asistente

Cada paso de ARCA del asistente lleva una captura de la página de ARCA. Las sacás vos, porque un agente no
puede entrar a ARCA. Con tu clave fiscal se sacan las que no piden confirmar nada, sin tocar nunca «Agregar
alias», «Confirmar» ni «Aceptar». Las que necesitan el trámite hecho (la 04, la 06 y la 08) puede sacarlas
cualquiera que lo haga de verdad, por ejemplo Eliseo, cambiando sus datos antes. No hace falta que estén
todas: un paso sin captura sale igual, con el enlace a la guía de ARCA. Hoy están la 01, la 02, la 03, la
05 y la 07.

Antes de cada captura, cambiá en la pantalla el nombre, el CUIT y la dirección por los inventados de
siempre: «RIVAS MARTIN», 20-30123456-3 y «Pasaje Los Robles 450». Si aparecen otros puntos de venta,
relaciones o certificados, tapalos. Lo más fácil es abrir la consola de DevTools, escribir
`document.designMode = 'on'` y editar el texto en la página. Si la pantalla está dentro de un marco, elegí
ese marco arriba de la consola, y si no te deja, tapalo en Paint.

Las listas desplegables (el representado, el domicilio, la actividad) no se editan así. Para esas
pantallas, pegá en la consola este comando, con el nombre y la calle tal como los muestra ARCA en lugar de
`APELLIDO NOMBRE` y `CALLE Y NUMERO`:

```js
const cambiar = (t) => t.replace(/\d{2}-\d{8}-\d/g, '20-30123456-3').replace(/\b\d{11}\b/g, '20301234563').replace(/APELLIDO NOMBRE/gi, 'RIVAS MARTIN').replace(/CALLE Y NUMERO/gi, 'PASAJE LOS ROBLES 450').replace(/AGENCIA NRO \d+/gi, 'AGENCIA NRO 1');
const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (w.nextNode()) w.currentNode.nodeValue = cambiar(w.currentNode.nodeValue);
```

| Archivo                         | Qué muestra                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `01-ingresar.png`               | La pantalla de ingreso de ARCA, con el CUIT inventado                                                                                         |
| `02-certificados-digitales.png` | El buscador de tus servicios con «Administración de Certificados Digitales» encontrado                                                        |
| `03-agregar-alias.png`          | «Agregar alias» con `numa` y `numa-produccion.csr` elegido, antes de confirmar                                                                |
| `04-descargar.png`              | El certificado de `numa` con «Descargar», después de tocar «Ver»                                                                              |
| `05-elegir-el-servicio.png`     | «Nueva Relación» con ARCA › WebServices › «Facturación Electrónica» elegido                                                                   |
| `06-representante.png`          | La búsqueda del representante con el certificado `numa` elegido, antes de «Confirmar»                                                         |
| `07-puntos-de-venta.png`        | El menú de «Administración de puntos de venta y domicilios», con «A/B/M de puntos de venta / emisión»                                         |
| `08-agregar-punto-de-venta.png` | «Alta de Punto de Venta / Emisión» completo (el número, «NUMA», el sistema de monotributo, el domicilio y la actividad), antes de «Aceptar» |

Van con la ventana del navegador de unos 1280 px de ancho, sacadas con Win + Shift + S y solo con la
página. Pasáselas a un agente: las mira (que no muestren un CUIT ni una dirección que no sean los
inventados), las pasa a WebP de 1200 px de ancho como las que ya están y las suma a
`apps/web/src/assets/arca/` con el mismo nombre. El asistente las toma solo en el build siguiente, sin
tocar código.
