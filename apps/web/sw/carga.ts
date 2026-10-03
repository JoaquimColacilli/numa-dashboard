export interface CargaDelAviso {
  titulo: string;
  cuerpo: string;
  url: string;
  etiqueta: string;
  lang: IdiomaDelAviso;
}

export interface DatosDelPush {
  json(): unknown;
}

const CUERPO_SIN_DATOS = {
  'es-AR': 'Hay cosas en la agenda.',
  'en-US': 'You have things on your calendar.',
  'pt-BR': 'Você tem compromissos na agenda.',
} as const;

export type IdiomaDelAviso = keyof typeof CUERPO_SIN_DATOS;

const IDIOMA_SIN_DATOS: IdiomaDelAviso = 'es-AR';

export const RUTA_DE_LA_AGENDA = '/agenda';

function idiomaDelAviso(valor: unknown): IdiomaDelAviso {
  return valor === 'en-US' || valor === 'pt-BR' ? valor : IDIOMA_SIN_DATOS;
}

function cargaSinDatos(lang: IdiomaDelAviso): CargaDelAviso {
  return {
    titulo: 'NUMA',
    cuerpo: CUERPO_SIN_DATOS[lang],
    url: RUTA_DE_LA_AGENDA,
    etiqueta: 'agenda',
    lang,
  };
}

export function cargaDelPush(datos: DatosDelPush | null): CargaDelAviso {
  if (datos === null) return cargaSinDatos(IDIOMA_SIN_DATOS);
  let valor: unknown;
  try {
    valor = datos.json();
  } catch {
    return cargaSinDatos(IDIOMA_SIN_DATOS);
  }
  if (typeof valor !== 'object' || valor === null) return cargaSinDatos(IDIOMA_SIN_DATOS);
  const campos = valor as Readonly<Record<string, unknown>>;
  const respaldo = cargaSinDatos(idiomaDelAviso(campos.lang));
  const texto = (clave: Exclude<keyof CargaDelAviso, 'lang'>): string => {
    const dato = campos[clave];
    return typeof dato === 'string' && dato !== '' ? dato : respaldo[clave];
  };
  return {
    titulo: texto('titulo'),
    cuerpo: texto('cuerpo'),
    url: texto('url'),
    etiqueta: texto('etiqueta'),
    lang: respaldo.lang,
  };
}
