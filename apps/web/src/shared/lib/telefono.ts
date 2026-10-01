const PREFIJO_ARGENTINA = '54';
const LARGO_NACIONAL = 10;
const CON_QUINCE = /^(\d{2,4})15(\d{6,8})$/;

export function telefonoParaWhatsapp(telefono: string): string | null {
  const digitos = telefono.replace(/\D/g, '');
  if (digitos === '') return null;

  if (telefono.trim().startsWith('+')) return digitos;
  if (digitos.startsWith('00')) return digitos.slice(2);
  if (digitos.startsWith(PREFIJO_ARGENTINA) && digitos.length > LARGO_NACIONAL + 1) return digitos;

  const sinCero = digitos.startsWith('0') ? digitos.slice(1) : digitos;
  const sinQuince = sinCero.replace(CON_QUINCE, '$1$2');
  return `${PREFIJO_ARGENTINA}9${sinQuince}`;
}

export function enlaceParaEscribir(telefono: string, mensaje: string): string | null {
  const numero = telefonoParaWhatsapp(telefono);
  return numero === null ? null : `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export function whatsappCon(telefono: string, texto: string): string {
  const numero = telefonoParaWhatsapp(telefono);
  const mensaje = encodeURIComponent(texto);
  return numero === null
    ? `https://wa.me/?text=${mensaje}`
    : `https://wa.me/${numero}?text=${mensaje}`;
}

export function mensajeParaElCliente(
  cliente: string,
  trabajo: string,
  url: string,
  hayPagoPendiente = false,
): string {
  const nombre = cliente.trim() === '' ? 'Hola' : `Hola ${cliente.split(' ')[0] ?? cliente}`;
  const que = hayPagoPendiente ? 'cómo va y cómo pagarlo' : 'cómo va';
  return `${nombre}, acá podés ver ${que} tu ${trabajo.toLocaleLowerCase('es-AR')}: ${url}`;
}
