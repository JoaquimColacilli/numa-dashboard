import { rechazoDeLaBase } from '@maun/db';

import { mensajes, type Mensajes } from '@/shared/idioma';

import { traducirRechazo, type ContextoDelRechazo } from './rechazos';

type MensajeDeAcceso = keyof Mensajes['api']['acceso'];

const POR_CODIGO: Readonly<Record<string, MensajeDeAcceso>> = {
  invalid_credentials: 'credencialesInvalidas',
  email_not_confirmed: 'mailSinConfirmar',
  user_already_exists: 'cuentaRepetida',
  email_exists: 'cuentaRepetida',
  weak_password: 'contrasenaDebil',
  same_password: 'mismaContrasena',
  over_email_send_rate_limit: 'demasiadosMails',
  over_request_rate_limit: 'demasiadosIntentos',
  validation_failed: 'formatoInvalido',
  email_address_invalid: 'mailInvalido',
  email_address_not_authorized: 'mailNoAutorizado',
  signup_disabled: 'altasCerradas',
  email_provider_disabled: 'accesoConMailCerrado',
  user_banned: 'cuentaSuspendida',
  user_not_found: 'cuentaInexistente',
  flow_state_not_found: 'enlaceEnOtroNavegador',
  bad_code_verifier: 'enlaceEnOtroNavegador',
  pkce_code_verifier_not_found: 'enlaceEnOtroNavegador',
  flow_state_expired: 'enlaceVencido',
  otp_expired: 'enlaceVencido',
  session_not_found: 'sesionTerminada',
  session_expired: 'sesionTerminada',
  refresh_token_not_found: 'sesionTerminada',
  refresh_token_already_used: 'sesionTerminada',
  reauthentication_needed: 'hayQueConfirmar',
  request_timeout: 'servidorLento',
  unexpected_failure: 'servidorConProblemas',
  passkey_disabled: 'huellaDeshabilitada',
  too_many_passkeys: 'demasiadasHuellas',
  webauthn_credential_exists: 'huellaRepetida',
  webauthn_challenge_expired: 'huellaVencida',
  webauthn_challenge_not_found: 'huellaVencida',
  webauthn_verification_failed: 'huellaSinVerificar',
  ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED: 'huellaRepetida',
  ERROR_CEREMONY_ABORTED: 'huellaCancelada',
  ERROR_INVALID_DOMAIN: 'huellaEnOtraDireccion',
  ERROR_INVALID_RP_ID: 'huellaEnOtraDireccion',
  ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT: 'sinHuellaEnElDispositivo',
  ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT: 'sinHuellaEnElDispositivo',
  ERROR_AUTHENTICATOR_GENERAL_ERROR: 'sensorConProblemas',
};

const POR_NOMBRE: Readonly<Record<string, MensajeDeAcceso>> = {
  AuthSessionMissingError: 'sesionTerminada',
  AuthPKCECodeVerifierMissingError: 'enlaceEnOtroNavegador',
  AuthInvalidTokenResponseError: 'respuestaInesperada',
  NotAllowedError: 'huellaCancelada',
  AbortError: 'huellaCancelada',
  SecurityError: 'huellaEnOtraDireccion',
};

function mensajeDe(
  tabla: Readonly<Record<string, MensajeDeAcceso>>,
  clave: string,
): string | undefined {
  const cual = Object.hasOwn(tabla, clave) ? tabla[clave] : undefined;
  return cual === undefined ? undefined : mensajes().api.acceso[cual];
}

const MENSAJE_DE_RED = /failed to fetch|networkerror|network request failed|load failed/i;

const SIN_WEBAUTHN = /does not support webauthn/i;

export class RechazoDeAcceso extends Error {
  readonly code: string;

  constructor(codigo: string) {
    super(codigo);
    this.name = 'RechazoDeAcceso';
    this.code = codigo;
  }
}

function codigoDeAuth(error: unknown): { codigo: string; estado: number; nombre: string } {
  if (typeof error !== 'object' || error === null) return { codigo: '', estado: 0, nombre: '' };
  const posible = error as Record<string, unknown>;
  const detalles = posible.details;
  const delDetalle =
    typeof detalles === 'object' && detalles !== null
      ? (detalles as Record<string, unknown>).code
      : undefined;
  const codigo =
    typeof posible.code === 'string' && posible.code !== ''
      ? posible.code
      : typeof delDetalle === 'string'
        ? delDetalle
        : '';
  return {
    codigo,
    estado: typeof posible.status === 'number' ? posible.status : 0,
    nombre: typeof posible.name === 'string' ? posible.name : '',
  };
}

export function codigoDeAcceso(error: unknown): string {
  return codigoDeAuth(error).codigo;
}

export function esFalloDeRed(error: unknown): boolean {
  if (error instanceof TypeError) return true;

  const { nombre, estado } = codigoDeAuth(error);
  if (nombre === 'FunctionsFetchError') return true;
  if (nombre === 'AuthRetryableFetchError') return estado === 0 || estado >= 500;
  if (nombre === 'StorageUnknownError') {
    const original = (error as Record<string, unknown>).originalError;
    const mensaje = error instanceof Error ? error.message : '';
    return original instanceof TypeError || MENSAJE_DE_RED.test(mensaje);
  }

  const rechazo = rechazoDeLaBase(error);
  return rechazo !== undefined && rechazo.codigo === '' && MENSAJE_DE_RED.test(rechazo.mensaje);
}

export function mensajeDeAcceso(error: unknown): string {
  const { acceso, accesoConCodigo } = mensajes().api;
  if (esFalloDeRed(error)) return acceso.sinRed;

  const { codigo, estado, nombre } = codigoDeAuth(error);
  const porCodigo = mensajeDe(POR_CODIGO, codigo);
  if (porCodigo !== undefined) return porCodigo;
  const porNombre = mensajeDe(POR_NOMBRE, nombre);
  if (porNombre !== undefined) return porNombre;
  if (error instanceof Error && SIN_WEBAUTHN.test(error.message)) return acceso.navegadorSinHuella;
  if (estado === 429) return acceso.demasiadosIntentos;
  if (estado > 0 || nombre.startsWith('Auth')) {
    return codigo === '' ? acceso.generico : accesoConCodigo(codigo);
  }

  const rechazo = rechazoDeLaBase(error);
  if (rechazo?.codigo.startsWith('MN')) {
    return rechazo.hint === '' ? rechazo.mensaje : `${rechazo.mensaje} ${rechazo.hint}`;
  }
  if (rechazo && rechazo.codigo !== '') return accesoConCodigo(rechazo.codigo);
  return acceso.generico;
}

export function mensajeDeSincronizacion(error: unknown, contexto?: ContextoDelRechazo): string {
  if (esFalloDeRed(error)) return mensajes().api.acceso.sinRed;
  const traducido = traducirRechazo(error, contexto);
  if (traducido) return `${traducido.titulo} ${traducido.queHacer}`;
  return mensajeDeAcceso(error);
}

export function errorDelEnlace(direccion: string): string | undefined {
  let url: URL;
  try {
    url = new URL(direccion);
  } catch {
    return undefined;
  }
  const delHash = new URLSearchParams(url.hash.replace(/^#/, ''));
  const leer = (clave: string) => url.searchParams.get(clave) ?? delHash.get(clave);
  const codigo = leer('error_code');
  if (codigo === null && leer('error') === null && leer('error_description') === null) {
    return undefined;
  }
  return (
    (codigo === null ? undefined : mensajeDe(POR_CODIGO, codigo)) ??
    mensajes().api.acceso.enlaceDelCorreo
  );
}

export function esAltaRepetida(
  usuario: { identities?: readonly unknown[] | null } | null | undefined,
): boolean {
  return Array.isArray(usuario?.identities) && usuario.identities.length === 0;
}
