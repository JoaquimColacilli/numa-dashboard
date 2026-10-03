import type { Mensajes } from '../es';
import { plural } from './plural';

const proyectos = (cantidad: number): string =>
  plural(cantidad, { '=0': '# projetos', one: '# projeto', other: '# projetos' });

export const paginaClientes = {
  titulo: 'Clientes',
  nuevoCliente: 'Novo cliente',
  vacioTitulo: 'A lista de clientes da marcenaria, ainda vazia',
  vacioDetalle:
    'Registre cada cliente uma vez só: endereço, telefone e como faturar. Da próxima vez que ligarem, já está tudo aqui.',
  cargaTuPrimerCliente: 'Registrar o primeiro cliente',
  buscarPlaceholder: 'Nome, telefone ou endereço',
  buscarCliente: 'Buscar cliente',
  deDondeVienen: 'De onde vêm os projetos',
  clientes: (cantidad) =>
    plural(cantidad, { '=0': '# clientes', one: '# cliente', other: '# clientes' }),
  sinOrigen: (cantidad) => plural(cantidad, { other: '# sem origem anotada' }),
  deTantos: (filas, total) => `${String(filas)} de ${String(total)}`,
  ordenarPor: 'Ordenar por',
  nadieCoincide: (consulta) => `Nenhum cliente corresponde a “${consulta}”.`,
  crearComoNuevo: (nombre) => `Criar “${nombre}” como novo cliente`,
  ultimoTrabajo: (titulo, cuando) => `${titulo}, ${cuando}`,
  sinTrabajosTodavia: 'Ainda sem projetos',
  sinTrabajos: 'Sem projetos',
  debe: (monto) => `deve ${monto}`,
  ficha: {
    llamar: 'Ligar',
    whatsapp: 'WhatsApp',
    email: 'E-mail',
    mapa: 'Mapa',
    borrar: 'Excluir',
    editar: 'Editar',
    clienteDesde: (fecha) => `cliente desde ${fecha}`,
    contacto: 'Contato',
    telefono: 'Telefone',
    sinTelefono: 'Sem telefone',
    sinEmail: 'Sem e-mail',
    direccion: 'Endereço',
    sinDireccion: 'Sem endereço',
    comoLlego: 'Como chegou',
    sinAnotar: 'Não anotado',
    todaviaNoAnotaste: 'Você ainda não anotou de onde veio.',
    facturacion: 'Faturamento',
    condicion: 'Condição',
    comprobante: 'Comprovante',
    cuit: 'CUIT',
    cuitOCuil: 'CUIT / CUIL',
    razonSocial: 'Razão social',
    domicilioFiscal: 'End. fiscal',
    historial: 'Histórico',
    proyectos,
    proyectosYConsultas: (cantidad, consultas) =>
      `${proyectos(cantidad)}, ${plural(consultas, { other: '# em consulta' })}`,
    totalFacturado: 'Total faturado',
    saldoPendiente: 'Saldo pendente',
    sinSaldo: 'Sem saldo',
    sinTrabajosCon: (nombre) =>
      `Ainda não há projetos com ${nombre}. Quando você começar um, ele aparece aqui com o status.`,
    fases: {
      consultas: 'Consulta',
      seguimiento: 'Retorno',
      obra: 'Projeto',
    },
    faseConCuando: (fase, cuando) => `${fase}, ${cuando}`,
    sinPresupuesto: 'Sem orçamento',
    noEsta: 'Esse cliente não está aqui',
    noEstaDetalle:
      'Talvez você tenha excluído em outro aparelho, ou o link aponte para um cliente de outra marcenaria.',
    volverAClientes: 'Voltar para Clientes',
    arrancarUnProyecto: (nombre) => `Começar um projeto com ${nombre}`,
    borrarA: (nombre) => `Excluir ${nombre}?`,
    sinTrabajosCargados: 'Não tem projetos registrados, então nenhum histórico se perde.',
    conProyectosVivos:
      'Se ainda tiver projetos ativos, não vai dar: primeiro é preciso excluí-los ou passá-los para outro cliente.',
    cancelar: 'Cancelar',
    borrarElCliente: 'Excluir cliente',
  },
} satisfies Mensajes['paginaClientes'];
