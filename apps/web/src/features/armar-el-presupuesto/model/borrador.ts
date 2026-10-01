import type { BorradorDelPresupuesto, FormaElegida, Mueble, Propia, Seleccion } from '@maun/domain';

export type GrupoDeCasillas = 'aTenerEnCuenta' | 'incluye' | 'avisos' | 'condiciones';

export interface MuebleQuitado {
  mueble: Mueble;
  indice: number;
}

export function conUnMuebleMas(
  borrador: BorradorDelPresupuesto,
  id: string,
): BorradorDelPresupuesto {
  return { ...borrador, muebles: [...borrador.muebles, { id, nombre: '', descripcion: '' }] };
}

export function conElMuebleEditado(
  borrador: BorradorDelPresupuesto,
  id: string,
  cambios: Partial<Omit<Mueble, 'id'>>,
): BorradorDelPresupuesto {
  return {
    ...borrador,
    muebles: borrador.muebles.map((mueble) =>
      mueble.id === id ? { ...mueble, ...cambios } : mueble,
    ),
  };
}

export function sinElMueble(
  borrador: BorradorDelPresupuesto,
  id: string,
): { borrador: BorradorDelPresupuesto; quitado: MuebleQuitado | null } {
  const indice = borrador.muebles.findIndex((mueble) => mueble.id === id);
  const mueble = borrador.muebles[indice];
  if (mueble === undefined) return { borrador, quitado: null };
  return {
    borrador: { ...borrador, muebles: borrador.muebles.filter((otro) => otro.id !== id) },
    quitado: { mueble, indice },
  };
}

export function conElMuebleDeVuelta(
  borrador: BorradorDelPresupuesto,
  { mueble, indice }: MuebleQuitado,
): BorradorDelPresupuesto {
  if (borrador.muebles.some((otro) => otro.id === mueble.id)) return borrador;
  const muebles = [...borrador.muebles];
  muebles.splice(Math.min(indice, muebles.length), 0, mueble);
  return { ...borrador, muebles };
}

export function conElMuebleMovido(
  borrador: BorradorDelPresupuesto,
  id: string,
  hacia: -1 | 1,
): BorradorDelPresupuesto {
  const indice = borrador.muebles.findIndex((mueble) => mueble.id === id);
  const destino = indice + hacia;
  const mueble = borrador.muebles[indice];
  const otro = borrador.muebles[destino];
  if (mueble === undefined || otro === undefined) return borrador;
  const muebles = [...borrador.muebles];
  muebles[destino] = mueble;
  muebles[indice] = otro;
  return { ...borrador, muebles };
}

function claveDelTexto(texto: string): string {
  return texto
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function conLosHerrajesTraidos(
  borrador: BorradorDelPresupuesto,
  nombres: readonly string[],
  idNuevo: () => string,
): { borrador: BorradorDelPresupuesto; traidos: Propia[] } {
  const yaEstan = new Set(borrador.herrajes.lista.map(({ texto }) => claveDelTexto(texto)));
  const traidos: Propia[] = [];
  for (const nombre of nombres) {
    const clave = claveDelTexto(nombre);
    if (clave === '' || yaEstan.has(clave)) continue;
    yaEstan.add(clave);
    traidos.push({ id: idNuevo(), texto: nombre.trim() });
  }
  return {
    borrador: {
      ...borrador,
      herrajes: { ...borrador.herrajes, lista: [...borrador.herrajes.lista, ...traidos] },
    },
    traidos,
  };
}

export function sinLosTraidos(
  borrador: BorradorDelPresupuesto,
  traidos: readonly Propia[],
): BorradorDelPresupuesto {
  const ids = new Set(traidos.map(({ id }) => id));
  return {
    ...borrador,
    herrajes: {
      ...borrador.herrajes,
      lista: borrador.herrajes.lista.filter(({ id }) => !ids.has(id)),
    },
  };
}

export function conUnHerrajeMas(
  borrador: BorradorDelPresupuesto,
  herraje: Propia,
): BorradorDelPresupuesto {
  return {
    ...borrador,
    herrajes: { ...borrador.herrajes, lista: [...borrador.herrajes.lista, herraje] },
  };
}

export function conElHerrajeEditado(
  borrador: BorradorDelPresupuesto,
  id: string,
  texto: string,
): BorradorDelPresupuesto {
  return {
    ...borrador,
    herrajes: {
      ...borrador.herrajes,
      lista: borrador.herrajes.lista.map((herraje) =>
        herraje.id === id ? { ...herraje, texto } : herraje,
      ),
    },
  };
}

export function sinElHerraje(borrador: BorradorDelPresupuesto, id: string): BorradorDelPresupuesto {
  return {
    ...borrador,
    herrajes: {
      ...borrador.herrajes,
      lista: borrador.herrajes.lista.filter((herraje) => herraje.id !== id),
    },
  };
}

function conLaSeleccion(
  borrador: BorradorDelPresupuesto,
  grupo: GrupoDeCasillas,
  cambiar: (seleccion: Seleccion) => Seleccion,
): BorradorDelPresupuesto {
  return { ...borrador, [grupo]: cambiar(borrador[grupo]) };
}

export function conLaCasilla(
  borrador: BorradorDelPresupuesto,
  grupo: GrupoDeCasillas,
  id: string,
  tildada: boolean,
): BorradorDelPresupuesto {
  return conLaSeleccion(borrador, grupo, (seleccion) => ({
    ...seleccion,
    tildadas: tildada
      ? [...seleccion.tildadas.filter((otra) => otra !== id), id]
      : seleccion.tildadas.filter((otra) => otra !== id),
  }));
}

export function conUnaPropiaMas(
  borrador: BorradorDelPresupuesto,
  grupo: GrupoDeCasillas,
  id: string,
): BorradorDelPresupuesto {
  return conLaSeleccion(borrador, grupo, (seleccion) => ({
    ...seleccion,
    propias: [...seleccion.propias, { id, texto: '' }],
  }));
}

export function conLaPropiaEditada(
  borrador: BorradorDelPresupuesto,
  grupo: GrupoDeCasillas,
  id: string,
  texto: string,
): BorradorDelPresupuesto {
  return conLaSeleccion(borrador, grupo, (seleccion) => ({
    ...seleccion,
    propias: seleccion.propias.map((propia) => (propia.id === id ? { ...propia, texto } : propia)),
  }));
}

export function sinLaPropia(
  borrador: BorradorDelPresupuesto,
  grupo: GrupoDeCasillas,
  id: string,
): BorradorDelPresupuesto {
  return conLaSeleccion(borrador, grupo, (seleccion) => ({
    ...seleccion,
    propias: seleccion.propias.filter((propia) => propia.id !== id),
  }));
}

export function conLaForma(
  borrador: BorradorDelPresupuesto,
  forma: FormaElegida | null,
): BorradorDelPresupuesto {
  return { ...borrador, formaDePago: forma };
}
