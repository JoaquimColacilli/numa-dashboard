import type { FranjaDeEntrega } from './entrega.ts';
import { faseDe, type EstadoProyecto } from './estados.ts';
import { diasEntre, esMes, mesesDelRango, sumarDias } from './fechas.ts';
import { vencimientosDelPaso, type Fila, type GastoDeUnTesoro } from './fila.ts';
import type { Money } from './money.ts';

export const CATEGORIAS_DEL_TRABAJO = ['presupuesto', 'visita', 'entrega'] as const;

export const CATEGORIAS_DERIVADAS = [...CATEGORIAS_DEL_TRABAJO, 'seguimiento'] as const;

export const CATEGORIA_DEL_VENCIMIENTO = 'vencimiento';

export const CATEGORIAS_PROPIAS = ['materiales', 'taller'] as const;

export const CATEGORIAS_DE_AGENDA = [
  ...CATEGORIAS_DERIVADAS,
  CATEGORIA_DEL_VENCIMIENTO,
  ...CATEGORIAS_PROPIAS,
] as const;

export type CategoriaDelTrabajo = (typeof CATEGORIAS_DEL_TRABAJO)[number];

export type CategoriaDerivada = (typeof CATEGORIAS_DERIVADAS)[number];

export type CategoriaDelVencimiento = typeof CATEGORIA_DEL_VENCIMIENTO;

export type CategoriaPropia = (typeof CATEGORIAS_PROPIAS)[number];

export type CategoriaDeAgenda = CategoriaDerivada | CategoriaDelVencimiento | CategoriaPropia;

export interface ProyectoDeLaAgenda {
  id: string;
  clienteId: string;
  titulo: string;
  estado: EstadoProyecto;
  fechaVisita: string | null;
  visitaHora: string | null;
  visitaHecha: boolean;
  entregaEstimada: string | null;
  entregaHora: string | null;
  entregaComprometida: string | null;
  entregaFranja: FranjaDeEntrega | null;
  vencimientoPresupuesto: string | null;
  direccionEntrega: string;
  importante: Readonly<Record<CategoriaDelTrabajo, boolean>>;
}

export interface ClienteDeLaAgenda {
  id: string;
  nombre: string;
  zona: string;
}

export interface AnotacionDeLaAgenda {
  id: string;
  fecha: string;
  hora: string | null;
  texto: string;
  categoria: CategoriaPropia;
  proyectoId: string | null;
  hecha: boolean;
  importante: boolean;
}

export interface ProximoDeLaAgenda {
  id: string;
  proyectoId: string;
  fecha: string;
  hechoEl: string | null;
  nota: string;
  importante: boolean;
}

export interface VencimientoDeLaAgenda {
  id: string;
  tesoro: string;
  nombreDelTesoro: string;
  renglon: string;
  monto: Money;
  fecha: string;
  pagado: boolean;
}

export interface DatosDeLaAgenda {
  proyectos: readonly ProyectoDeLaAgenda[];
  clientes: readonly ClienteDeLaAgenda[];
  anotaciones: readonly AnotacionDeLaAgenda[];
  proximos: readonly ProximoDeLaAgenda[];
  vencimientos: readonly VencimientoDeLaAgenda[];
}

export interface RangoDeLaAgenda {
  desde: string;
  hasta: string;
}

export interface EventoDerivado {
  clase: 'derivada';
  id: string;
  categoria: CategoriaDerivada;
  fecha: string;
  hora: string | null;
  proyectoId: string;
  clienteId: string;
  titulo: string;
  cliente: string;
  lugar: string;
  hecha: boolean;
  importante: boolean;
  comprometida: boolean;
  franja: FranjaDeEntrega | null;
}

export interface EventoPropio {
  clase: 'propia';
  id: string;
  categoria: CategoriaPropia;
  fecha: string;
  hora: string | null;
  texto: string;
  proyectoId: string | null;
  proyecto: string | null;
  hecha: boolean;
  importante: boolean;
}

export interface EventoVencimiento {
  clase: 'vencimiento';
  id: string;
  categoria: CategoriaDelVencimiento;
  fecha: string;
  hora: null;
  tesoro: string;
  nombreDelTesoro: string;
  renglon: string;
  monto: Money;
  hecha: boolean;
  importante: boolean;
}

export type EventoDeLaAgenda = EventoDerivado | EventoPropio | EventoVencimiento;

const ESTADOS_CON_LA_ENTREGA_HECHA: readonly EstadoProyecto[] = ['entregado', 'cobrado'];

const PESO_DE_LA_CATEGORIA: Readonly<Record<CategoriaDeAgenda, number>> = {
  presupuesto: 0,
  visita: 1,
  entrega: 2,
  seguimiento: 3,
  vencimiento: 4,
  materiales: 5,
  taller: 6,
};

function entregaHecha(estado: EstadoProyecto): boolean {
  return ESTADOS_CON_LA_ENTREGA_HECHA.includes(estado);
}

function derivadosDelProyecto(
  proyecto: ProyectoDeLaAgenda,
  cliente: ClienteDeLaAgenda | undefined,
): EventoDerivado[] {
  const enConsulta = faseDe(proyecto.estado) === 'consultas';
  const entregada = entregaHecha(proyecto.estado);
  const comun = {
    clase: 'derivada' as const,
    proyectoId: proyecto.id,
    clienteId: proyecto.clienteId,
    titulo: proyecto.titulo,
    cliente: cliente?.nombre ?? '',
    comprometida: false,
    franja: null,
  };
  const zona = cliente?.zona ?? '';
  const eventos: EventoDerivado[] = [];

  const comprometida = proyecto.entregaComprometida;
  const prometida = comprometida ?? proyecto.entregaEstimada;
  if ((proyecto.estado === 'en_curso' || entregada) && prometida !== null) {
    eventos.push({
      ...comun,
      id: `entrega:${proyecto.id}`,
      categoria: 'entrega',
      fecha: prometida,
      hora: comprometida === null ? proyecto.entregaHora : null,
      comprometida: comprometida !== null,
      franja: comprometida === null ? null : proyecto.entregaFranja,
      lugar: proyecto.direccionEntrega.trim() === '' ? zona : proyecto.direccionEntrega,
      hecha: entregada,
      importante: proyecto.importante.entrega,
    });
  }
  if ((enConsulta || proyecto.visitaHecha) && proyecto.fechaVisita !== null) {
    eventos.push({
      ...comun,
      id: `visita:${proyecto.id}`,
      categoria: 'visita',
      fecha: proyecto.fechaVisita,
      hora: proyecto.visitaHora,
      lugar: zona,
      hecha: proyecto.visitaHecha,
      importante: proyecto.importante.visita,
    });
  }
  if (
    enConsulta &&
    proyecto.estado !== 'presupuesto_enviado' &&
    proyecto.estado !== 'presupuesto_estimativo' &&
    proyecto.vencimientoPresupuesto !== null
  ) {
    eventos.push({
      ...comun,
      id: `presupuesto:${proyecto.id}`,
      categoria: 'presupuesto',
      fecha: proyecto.vencimientoPresupuesto,
      hora: null,
      lugar: zona,
      hecha: false,
      importante: proyecto.importante.presupuesto,
    });
  }
  return eventos;
}

function derivadoDelSeguimiento(
  proximo: ProximoDeLaAgenda,
  proyecto: ProyectoDeLaAgenda,
  cliente: ClienteDeLaAgenda | undefined,
): EventoDerivado {
  const nombre = cliente?.nombre.trim() ?? '';
  const nota = proximo.nota.trim();
  return {
    clase: 'derivada',
    id: `seguimiento:${proximo.id}`,
    categoria: 'seguimiento',
    fecha: proximo.hechoEl ?? proximo.fecha,
    hora: null,
    proyectoId: proyecto.id,
    clienteId: proyecto.clienteId,
    titulo: nombre === '' ? proyecto.titulo : nombre,
    cliente: '',
    lugar: nota === '' ? proyecto.titulo : `${proyecto.titulo} · ${nota}`,
    hecha: proximo.hechoEl !== null,
    importante: proximo.importante,
    comprometida: false,
    franja: null,
  };
}

function propioDeLaAnotacion(
  anotacion: AnotacionDeLaAgenda,
  proyecto: ProyectoDeLaAgenda | undefined,
): EventoPropio {
  return {
    clase: 'propia',
    id: anotacion.id,
    categoria: anotacion.categoria,
    fecha: anotacion.fecha,
    hora: anotacion.hora,
    texto: anotacion.texto,
    proyectoId: anotacion.proyectoId,
    proyecto: proyecto?.titulo ?? null,
    hecha: anotacion.hecha,
    importante: anotacion.importante,
  };
}

function eventoDelVencimiento(vencimiento: VencimientoDeLaAgenda): EventoVencimiento {
  return {
    clase: 'vencimiento',
    id: vencimiento.id,
    categoria: CATEGORIA_DEL_VENCIMIENTO,
    fecha: vencimiento.fecha,
    hora: null,
    tesoro: vencimiento.tesoro,
    nombreDelTesoro: vencimiento.nombreDelTesoro,
    renglon: vencimiento.renglon,
    monto: vencimiento.monto,
    hecha: vencimiento.pagado,
    importante: false,
  };
}

function textoDe(evento: EventoDeLaAgenda): string {
  if (evento.clase === 'propia') return evento.texto;
  if (evento.clase === 'vencimiento') return evento.renglon;
  return evento.titulo;
}

function compararEventos(uno: EventoDeLaAgenda, otro: EventoDeLaAgenda): number {
  if (uno.fecha !== otro.fecha) return uno.fecha < otro.fecha ? -1 : 1;

  const horaUno = uno.hora ?? '';
  const horaOtro = otro.hora ?? '';
  if (horaUno !== horaOtro) {
    if (horaUno === '') return 1;
    if (horaOtro === '') return -1;
    return horaUno < horaOtro ? -1 : 1;
  }

  const peso = PESO_DE_LA_CATEGORIA[uno.categoria] - PESO_DE_LA_CATEGORIA[otro.categoria];
  if (peso !== 0) return peso;

  const porTexto = textoDe(uno).localeCompare(textoDe(otro), 'es');
  if (porTexto !== 0) return porTexto;

  return uno.id < otro.id ? -1 : 1;
}

export function eventosDeLaAgenda(
  datos: DatosDeLaAgenda,
  rango: RangoDeLaAgenda,
): EventoDeLaAgenda[] {
  if (diasEntre(rango.desde, rango.hasta) < 0) {
    throw new RangeError(
      `El rango de la agenda va de una fecha a otra igual o posterior: ${rango.desde} a ${rango.hasta} no.`,
    );
  }
  const adentro = (fecha: string) => fecha >= rango.desde && fecha <= rango.hasta;

  const clientes = new Map(datos.clientes.map((cliente) => [cliente.id, cliente]));
  const proyectos = new Map(datos.proyectos.map((proyecto) => [proyecto.id, proyecto]));
  const eventos: EventoDeLaAgenda[] = [];

  for (const proyecto of datos.proyectos) {
    for (const evento of derivadosDelProyecto(proyecto, clientes.get(proyecto.clienteId))) {
      if (adentro(evento.fecha)) eventos.push(evento);
    }
  }
  for (const proximo of datos.proximos) {
    const proyecto = proyectos.get(proximo.proyectoId);
    if (proyecto === undefined) continue;
    const evento = derivadoDelSeguimiento(proximo, proyecto, clientes.get(proyecto.clienteId));
    if (adentro(evento.fecha)) eventos.push(evento);
  }
  for (const vencimiento of datos.vencimientos) {
    if (adentro(vencimiento.fecha)) eventos.push(eventoDelVencimiento(vencimiento));
  }
  for (const anotacion of datos.anotaciones) {
    if (!adentro(anotacion.fecha)) continue;
    const proyecto =
      anotacion.proyectoId === null ? undefined : proyectos.get(anotacion.proyectoId);
    eventos.push(propioDeLaAnotacion(anotacion, proyecto));
  }

  return eventos.sort(compararEventos);
}

export interface RangoDeMeses {
  desde: string;
  hasta: string;
}

export interface EntradaDeLosVencimientos {
  fila: Fila;
  nombres: ReadonlyMap<string, string>;
  guardada: string | null;
  gastos: readonly GastoDeUnTesoro[];
}

export function vencimientosDeLaFila(
  entrada: EntradaDeLosVencimientos,
  meses: RangoDeMeses,
): VencimientoDeLaAgenda[] {
  const lista = mesesDelRango(meses.desde, meses.hasta);
  if (entrada.guardada !== null && !esMes(entrada.guardada)) {
    throw new RangeError(`El mes del guardado va como AAAA-MM: ${entrada.guardada} no.`);
  }

  const vencimientos: VencimientoDeLaAgenda[] = [];
  for (const paso of entrada.fila.pasos) {
    const rige = paso.desde ?? entrada.guardada;
    for (const mes of lista) {
      if (rige !== null && mes < rige) continue;
      for (const vencimiento of vencimientosDelPaso(paso, mes, entrada.gastos)) {
        vencimientos.push({
          id: `vencimiento:${paso.tesoro}:${String(vencimiento.indice)}:${vencimiento.fecha}`,
          tesoro: paso.tesoro,
          nombreDelTesoro: entrada.nombres.get(paso.tesoro) ?? '',
          renglon: vencimiento.renglon,
          monto: vencimiento.monto,
          fecha: vencimiento.fecha,
          pagado: vencimiento.pagado,
        });
      }
    }
  }
  return vencimientos;
}

export interface RangoDeHoras {
  desde: number;
  hasta: number;
}

export const HORARIO_DEL_TALLER: RangoDeHoras = { desde: 7, hasta: 20 };

export const TODO_EL_RELOJ: RangoDeHoras = { desde: 0, hasta: 23 };

export interface FranjaDelDia {
  hora: number;
  desde: string;
  eventos: EventoDeLaAgenda[];
}

export interface DiaPorHoras {
  todoElDia: EventoDeLaAgenda[];
  franjas: FranjaDelDia[];
  rango: RangoDeHoras;
}

const HORA = /^(\d{2}):(\d{2})/;

export function horaDelEvento(evento: EventoDeLaAgenda): number | null {
  const partes = evento.hora === null ? null : HORA.exec(evento.hora);
  if (partes === null) return null;
  const hora = Number(partes[1]);
  return hora >= 0 && hora <= 23 ? hora : null;
}

export function rangoQueEntra(
  eventos: readonly EventoDeLaAgenda[],
  rango: RangoDeHoras = HORARIO_DEL_TALLER,
): RangoDeHoras {
  let { desde, hasta } = rango;
  for (const evento of eventos) {
    const hora = horaDelEvento(evento);
    if (hora === null) continue;
    if (hora < desde) desde = hora;
    if (hora > hasta) hasta = hora;
  }
  return { desde, hasta };
}

export function diaPorHoras(
  eventos: readonly EventoDeLaAgenda[],
  rango: RangoDeHoras = HORARIO_DEL_TALLER,
): DiaPorHoras {
  const conHoras = rangoQueEntra(eventos, rango);
  const franjas: FranjaDelDia[] = [];
  for (let hora = conHoras.desde; hora <= conHoras.hasta; hora += 1) {
    franjas.push({ hora, desde: `${String(hora).padStart(2, '0')}:00`, eventos: [] });
  }

  const todoElDia: EventoDeLaAgenda[] = [];
  for (const evento of eventos) {
    const hora = horaDelEvento(evento);
    const franja = hora === null ? undefined : franjas[hora - conHoras.desde];
    if (franja === undefined) todoElDia.push(evento);
    else franja.eventos.push(evento);
  }

  return { todoElDia, franjas, rango: conHoras };
}

export function puedeArrastrarse(evento: EventoDeLaAgenda): boolean {
  if (evento.clase === 'vencimiento' || evento.hecha || evento.categoria === 'seguimiento') {
    return false;
  }
  return evento.clase === 'propia' || !evento.comprometida;
}

export const AVISOS_DE_LA_AGENDA = [
  'entregas',
  'visitas',
  'presupuestos',
  'seguimientos',
  'vencimientos',
  'anotaciones',
] as const;

export type AvisoDeLaAgenda = (typeof AVISOS_DE_LA_AGENDA)[number];

export const ANTICIPACIONES = [0, 1, 2, 3] as const;

export type Anticipacion = (typeof ANTICIPACIONES)[number];

export interface PreferenciaDeAviso {
  activo: boolean;
  anticipacion: Anticipacion;
}

export type PreferenciasDeAvisos = Readonly<Record<AvisoDeLaAgenda, PreferenciaDeAviso>>;

export const PREFERENCIAS_INICIALES: PreferenciasDeAvisos = {
  entregas: { activo: true, anticipacion: 2 },
  visitas: { activo: true, anticipacion: 1 },
  presupuestos: { activo: true, anticipacion: 1 },
  seguimientos: { activo: true, anticipacion: 0 },
  vencimientos: { activo: true, anticipacion: 0 },
  anotaciones: { activo: false, anticipacion: 0 },
};

export const AVISO_DE_LA_CATEGORIA: Readonly<Record<CategoriaDeAgenda, AvisoDeLaAgenda>> = {
  entrega: 'entregas',
  visita: 'visitas',
  presupuesto: 'presupuestos',
  seguimiento: 'seguimientos',
  vencimiento: 'vencimientos',
  materiales: 'anotaciones',
  taller: 'anotaciones',
};

export function eventosParaAvisar(
  datos: DatosDeLaAgenda,
  hoy: string,
  preferencias: PreferenciasDeAvisos,
): EventoDeLaAgenda[] {
  const mayor = Math.max(...AVISOS_DE_LA_AGENDA.map((aviso) => preferencias[aviso].anticipacion));

  return eventosDeLaAgenda(datos, { desde: hoy, hasta: sumarDias(hoy, mayor) }).filter((evento) => {
    const preferencia = preferencias[AVISO_DE_LA_CATEGORIA[evento.categoria]];
    if (!preferencia.activo) return false;
    if (evento.hecha) return false;
    return diasEntre(hoy, evento.fecha) <= preferencia.anticipacion;
  });
}
