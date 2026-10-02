import type { Centinelas } from '../centinelas';

export const centinelas: Centinelas = {
  'paginaClientes.clientes': {
    llamar: (m) => m.paginaClientes.clientes(37),
    tieneQueDecir: ['37'],
  },
  'paginaClientes.sinOrigen': {
    llamar: (m) => m.paginaClientes.sinOrigen(37),
    tieneQueDecir: ['37'],
  },
  'paginaClientes.deTantos': {
    llamar: (m) => m.paginaClientes.deTantos(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'paginaClientes.nadieCoincide': {
    llamar: (m) => m.paginaClientes.nadieCoincide('«CONSULTA»'),
    tieneQueDecir: ['«CONSULTA»'],
  },
  'paginaClientes.crearComoNuevo': {
    llamar: (m) => m.paginaClientes.crearComoNuevo('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'paginaClientes.ultimoTrabajo': {
    llamar: (m) => m.paginaClientes.ultimoTrabajo('«TÍTULO»', '«CUÁNDO»'),
    tieneQueDecir: ['«TÍTULO»', '«CUÁNDO»'],
  },
  'paginaClientes.debe': {
    llamar: (m) => m.paginaClientes.debe('«MONTO»'),
    tieneQueDecir: ['«MONTO»'],
  },
  'paginaClientes.ficha.clienteDesde': {
    llamar: (m) => m.paginaClientes.ficha.clienteDesde('«FECHA»'),
    tieneQueDecir: ['«FECHA»'],
  },
  'paginaClientes.ficha.proyectos': {
    llamar: (m) => m.paginaClientes.ficha.proyectos(37),
    tieneQueDecir: ['37'],
  },
  'paginaClientes.ficha.proyectosYConsultas': {
    llamar: (m) => m.paginaClientes.ficha.proyectosYConsultas(37, 59),
    tieneQueDecir: ['37', '59'],
  },
  'paginaClientes.ficha.sinTrabajosCon': {
    llamar: (m) => m.paginaClientes.ficha.sinTrabajosCon('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'paginaClientes.ficha.faseConCuando': {
    llamar: (m) => m.paginaClientes.ficha.faseConCuando('«FASE»', '«CUÁNDO»'),
    tieneQueDecir: ['«FASE»', '«CUÁNDO»'],
  },
  'paginaClientes.ficha.arrancarUnProyecto': {
    llamar: (m) => m.paginaClientes.ficha.arrancarUnProyecto('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
  'paginaClientes.ficha.borrarA': {
    llamar: (m) => m.paginaClientes.ficha.borrarA('«NOMBRE»'),
    tieneQueDecir: ['«NOMBRE»'],
  },
};
