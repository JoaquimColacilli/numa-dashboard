export { claveDeReplica, claveDeTodaReplica, RAIZ_DE_REPLICA } from '@/shared/lib';
export { CLAVE_DE_AJUSTES, MUTACION_DE_AJUSTES, type EdicionDeAjustes } from './api/ajustes';
export {
  sincronizarAhora,
  useSincronizarAhora,
  type DesenlaceDeLaSincronizacion,
} from './api/sincronizarAhora';
export { MINIMO_ENTRE_PEDIDOS_MS, useCambiosEnVivo } from './api/useCambiosEnVivo';
export { opcionesDeLaReplica, traerLaReplicaSiFalta, useReplica } from './api/useReplica';
export { describirDesenlace, type DescripcionDelDesenlace } from './model/desenlace';
export { idiomaDeLosClientes } from './model/idioma';
export { useReplicaDelTaller } from './model/contexto';
export { ProveedorDeReplica } from './ui/ProveedorDeReplica';
