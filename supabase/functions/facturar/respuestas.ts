import { escapar } from './xml.ts';

export interface DatoDeArca {
  codigo: number;
  mensaje: string;
}

function sobre(metodo: string, resultado: string): string {
  return `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema"><soap:Body><${metodo}Response xmlns="http://ar.gov.afip.dif.FEV1/"><${metodo}Result>${resultado}</${metodo}Result></${metodo}Response></soap:Body></soap:Envelope>`;
}

function lista(contenedor: string, elemento: string, datos: readonly DatoDeArca[]): string {
  if (datos.length === 0) return '';
  return `<${contenedor}>${datos
    .map(
      (dato) =>
        `<${elemento}><Code>${String(dato.codigo)}</Code><Msg>${escapar(dato.mensaje)}</Msg></${elemento}>`,
    )
    .join('')}</${contenedor}>`;
}

export function dummy(estado = 'OK'): string {
  return sobre(
    'FEDummy',
    `<AppServer>${estado}</AppServer><DbServer>OK</DbServer><AuthServer>OK</AuthServer>`,
  );
}

export function loginAceptado(token: string, firma: string, vence: string): string {
  const ticket = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><loginTicketResponse version="1.0"><header><source>CN=wsaahomo, O=AFIP, C=AR</source><destination>SERIALNUMBER=CUIT 20111111112, CN=numa</destination><uniqueId>1</uniqueId><generationTime>2026-10-03T09:00:00.000-03:00</generationTime><expirationTime>${vence}</expirationTime></header><credentials><token>${token}</token><sign>${firma}</sign></credentials></loginTicketResponse>`;
  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><loginCmsResponse xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov"><loginCmsReturn>${escapar(ticket)}</loginCmsReturn></loginCmsResponse></soapenv:Body></soapenv:Envelope>`;
}

export function loginRechazado(codigo: string, mensaje: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><soapenv:Fault><faultcode xmlns:ns1="http://xml.apache.org/axis/">ns1:${codigo}</faultcode><faultstring>${escapar(mensaje)}</faultstring></soapenv:Fault></soapenv:Body></soapenv:Envelope>`;
}

export const YA_TIENE_TICKET = loginRechazado(
  'coe.alreadyAuthenticated',
  'El CEE ya posee un TA valido para el acceso al WSN solicitado',
);

export const NO_AUTORIZADO = loginRechazado(
  'coe.notAuthorized',
  'Computador no autorizado a acceder al servicio',
);

export function ultimo(numero: number, puntoDeVenta = 1, tipo = 11): string {
  return sobre(
    'FECompUltimoAutorizado',
    `<PtoVta>${String(puntoDeVenta)}</PtoVta><CbteTipo>${String(tipo)}</CbteTipo><CbteNro>${String(numero)}</CbteNro>`,
  );
}

export function ultimoConErrores(errores: readonly DatoDeArca[]): string {
  return sobre(
    'FECompUltimoAutorizado',
    `<PtoVta>0</PtoVta><CbteTipo>0</CbteTipo><CbteNro>0</CbteNro>${lista('Errors', 'Err', errores)}`,
  );
}

export interface Detalle {
  numero: number;
  fecha: string;
  docTipo?: number;
  docNro?: string;
}

function detalle(datos: Detalle, resultado: string, extra: string): string {
  return `<Concepto>1</Concepto><DocTipo>${String(datos.docTipo ?? 99)}</DocTipo><DocNro>${datos.docNro ?? '0'}</DocNro><CbteDesde>${String(datos.numero)}</CbteDesde><CbteHasta>${String(datos.numero)}</CbteHasta><CbteFch>${datos.fecha}</CbteFch><Resultado>${resultado}</Resultado>${extra}`;
}

export function caeAprobado(
  datos: Detalle & { cae: string; vence: string },
  observaciones: readonly DatoDeArca[] = [],
): string {
  return sobre(
    'FECAESolicitar',
    `<FeCabResp><Cuit>20111111112</Cuit><PtoVta>1</PtoVta><CbteTipo>11</CbteTipo><FchProceso>20261003120000</FchProceso><CantReg>1</CantReg><Resultado>A</Resultado><Reproceso>N</Reproceso></FeCabResp><FeDetResp><FECAEDetResponse>${detalle(
      datos,
      'A',
      `${lista('Observaciones', 'Obs', observaciones)}<CAE>${datos.cae}</CAE><CAEFchVto>${datos.vence}</CAEFchVto>`,
    )}</FECAEDetResponse></FeDetResp>`,
  );
}

export function caeRechazado(
  datos: Detalle,
  observaciones: readonly DatoDeArca[],
  errores: readonly DatoDeArca[] = [],
): string {
  return sobre(
    'FECAESolicitar',
    `<FeCabResp><Cuit>20111111112</Cuit><PtoVta>1</PtoVta><CbteTipo>11</CbteTipo><FchProceso>20261003120000</FchProceso><CantReg>1</CantReg><Resultado>R</Resultado><Reproceso>N</Reproceso></FeCabResp><FeDetResp><FECAEDetResponse>${detalle(
      datos,
      'R',
      `${lista('Observaciones', 'Obs', observaciones)}<CAE></CAE><CAEFchVto></CAEFchVto>`,
    )}</FECAEDetResponse></FeDetResp>${lista('Errors', 'Err', errores)}`,
  );
}

export function caeSinResultado(errores: readonly DatoDeArca[]): string {
  return sobre('FECAESolicitar', lista('Errors', 'Err', errores));
}

export interface Consultado {
  tipo: number;
  puntoDeVenta: number;
  numero: number;
  fecha: string;
  importe: string;
  docTipo: number;
  docNro: string;
  cae: string;
  vence: string;
}

export function consultaEncontrada(datos: Consultado): string {
  return sobre(
    'FECompConsultar',
    `<ResultGet><Concepto>1</Concepto><DocTipo>${String(datos.docTipo)}</DocTipo><DocNro>${datos.docNro}</DocNro><CbteDesde>${String(datos.numero)}</CbteDesde><CbteHasta>${String(datos.numero)}</CbteHasta><CbteFch>${datos.fecha}</CbteFch><ImpTotal>${datos.importe}</ImpTotal><ImpTotConc>0</ImpTotConc><ImpNeto>${datos.importe}</ImpNeto><ImpOpEx>0</ImpOpEx><ImpTrib>0</ImpTrib><ImpIVA>0</ImpIVA><MonId>PES</MonId><MonCotiz>1</MonCotiz><Resultado>A</Resultado><CodAutorizacion>${datos.cae}</CodAutorizacion><EmisionTipo>CAE</EmisionTipo><FchVto>${datos.vence}</FchVto><FchProceso>20261003120000</FchProceso><PtoVta>${String(datos.puntoDeVenta)}</PtoVta><CbteTipo>${String(datos.tipo)}</CbteTipo></ResultGet>`,
  );
}

export const CONSULTA_NO_EXISTE = sobre(
  'FECompConsultar',
  lista('Errors', 'Err', [
    {
      codigo: 602,
      mensaje: 'No existen datos en nuestros registros para los parametros ingresados.',
    },
  ]),
);

export interface PuntoEnArca {
  numero: number;
  emisionTipo: string;
  bloqueado?: string;
  baja?: string;
}

export function puntosDeVenta(puntos: readonly PuntoEnArca[]): string {
  return sobre(
    'FEParamGetPtosVenta',
    `<ResultGet>${puntos
      .map(
        (punto) =>
          `<PtoVenta><Nro>${String(punto.numero)}</Nro><EmisionTipo>${punto.emisionTipo}</EmisionTipo><Bloqueado>${punto.bloqueado ?? 'N'}</Bloqueado><FchBaja>${punto.baja ?? 'NULL'}</FchBaja></PtoVenta>`,
      )
      .join('')}</ResultGet>`,
  );
}

export function condiciones(lista_: readonly { id: number; descripcion: string }[]): string {
  return sobre(
    'FEParamGetCondicionIvaReceptor',
    `<ResultGet>${lista_
      .map(
        (condicion) =>
          `<CondicionIvaReceptor><Id>${String(condicion.id)}</Id><Desc>${escapar(condicion.descripcion)}</Desc></CondicionIvaReceptor>`,
      )
      .join('')}</ResultGet>`,
  );
}
