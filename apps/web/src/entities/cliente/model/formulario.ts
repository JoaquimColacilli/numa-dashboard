import { formatearCuit, LARGO_DE_CUIT, revisarCuit, revisarDni } from '@maun/domain';
import { z } from 'zod';

import { COLUMNAS_DE_CLIENTE, type DatosDeCliente } from '@/shared/api';
import { mensajes } from '@/shared/idioma';

import { CONDICIONES_EN_ORDEN, ORIGENES_EN_ORDEN, type Cliente } from './catalogos';

function textos() {
  return mensajes().cliente.formulario;
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function largoDeCuitAceptable(cuit: string): boolean {
  const revision = revisarCuit(cuit);
  return revision.estado !== 'invalido' || revision.motivo !== 'largo';
}

function dniAceptable(dni: string): boolean {
  return revisarDni(dni).estado !== 'invalido';
}

function dniParaGuardar(dni: string): string {
  const revision = revisarDni(dni);
  return revision.estado === 'valido' ? revision.dni : '';
}

export const CLIENTE_EN_BLANCO: DatosDeCliente = {
  nombre: '',
  zona: '',
  telefono: '',
  email: '',
  direccion: '',
  origen_contacto: null,
  origen_detalle: '',
  condicion_fiscal: 'consumidor_final',
  cuit: '',
  dni: '',
  razon_social: '',
  domicilio_fiscal: '',
  notas: '',
};

function texto(maximo: number) {
  return z
    .string()
    .trim()
    .max(maximo, { error: () => textos().largoMaximo(maximo) });
}

export const esquemaDeCliente = z.object({
  nombre: texto(200).min(1, { error: () => textos().faltaElNombre }),
  zona: texto(200),
  telefono: texto(200),
  email: texto(200).refine((valor) => valor === '' || EMAIL.test(valor), {
    error: () => textos().revisaElMail,
  }),
  direccion: texto(500),
  origen_contacto: z.enum(ORIGENES_EN_ORDEN).nullable(),
  origen_detalle: texto(500),
  condicion_fiscal: z.enum(CONDICIONES_EN_ORDEN),
  cuit: texto(20).refine(largoDeCuitAceptable, {
    error: () => textos().cuitIncompleto(LARGO_DE_CUIT),
  }),
  dni: texto(20).refine(dniAceptable, { error: () => textos().dniInvalido }),
  razon_social: texto(200),
  domicilio_fiscal: texto(500),
  notas: texto(10_000),
});

export type FormularioDeCliente = z.infer<typeof esquemaDeCliente>;

export function advertenciaDeCuit(cuit: string): string | undefined {
  const revision = revisarCuit(cuit);
  if (revision.estado === 'ambiguo') return textos().cuitAmbiguo;
  if (revision.estado === 'invalido' && revision.motivo === 'prefijo') {
    return textos().cuitConOtroPrefijo;
  }
  if (revision.estado === 'invalido' && revision.motivo === 'verificador') {
    return textos().cuitQueNoCierra;
  }
  return undefined;
}

export function valoresDelFormulario(cliente: Cliente | undefined): FormularioDeCliente {
  const datos = cliente ?? CLIENTE_EN_BLANCO;
  return {
    nombre: datos.nombre,
    zona: datos.zona,
    telefono: datos.telefono,
    email: datos.email,
    direccion: datos.direccion,
    origen_contacto: datos.origen_contacto,
    origen_detalle: datos.origen_detalle,
    condicion_fiscal: datos.condicion_fiscal,
    cuit: datos.cuit,
    dni: (datos as Partial<DatosDeCliente>).dni ?? '',
    razon_social: datos.razon_social,
    domicilio_fiscal: datos.domicilio_fiscal,
    notas: datos.notas,
  };
}

export function datosDelFormulario(valores: FormularioDeCliente): DatosDeCliente {
  return { ...valores, cuit: formatearCuit(valores.cuit), dni: dniParaGuardar(valores.dni) };
}

export function cambiosDeCliente(
  antes: DatosDeCliente,
  ahora: DatosDeCliente,
): Partial<DatosDeCliente> {
  const cambios: Partial<DatosDeCliente> = {};
  for (const columna of COLUMNAS_DE_CLIENTE) {
    if (antes[columna] === ahora[columna]) continue;
    if (columna === 'origen_contacto') cambios.origen_contacto = ahora.origen_contacto;
    else if (columna === 'condicion_fiscal') cambios.condicion_fiscal = ahora.condicion_fiscal;
    else cambios[columna] = ahora[columna];
  }
  return cambios;
}
