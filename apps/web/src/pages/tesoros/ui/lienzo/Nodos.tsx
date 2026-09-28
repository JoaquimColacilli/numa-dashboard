import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useContext } from 'react';

import type {
  NodoDeLaParte,
  NodoDelDiezmo,
  NodoDelEstante,
  NodoDelOrigen,
  NodoDelPaso,
  NodoDelReparto,
  NodoDelTitulo,
  NodoNuevo,
} from '../../model/disposicion';
import {
  CuerpoDeLaParte,
  CuerpoDelDiezmo,
  CuerpoDelEstante,
  CuerpoDelOrigen,
  CuerpoDelPaso,
  CuerpoDelReparto,
  CuerpoNuevoTesoro,
  TituloDelEstante,
} from '../Fichas';
import { ContextoDeLasFichas } from './contextos';

const MANIJA =
  'min-h-0! min-w-0! rounded-pill! border-[1.5px]! before:absolute before:inset-[calc(3.5px_-_22px/var(--zoom-del-lienzo,1))] before:rounded-pill [&.clickconnecting]:border-ink! [&.clickconnecting]:bg-ink!';

const QUIETA = 'size-2.5! border-text-3! bg-paper!';

const TIRADOR = 'size-3.5! border-ink! bg-ink!';

function Manijas({
  armando,
  elegida,
  entrada = true,
  salida = true,
  alCostado = false,
  desdeElCostado = false,
}: {
  armando: boolean;
  elegida: boolean;
  entrada?: boolean;
  salida?: boolean;
  alCostado?: boolean;
  desdeElCostado?: boolean;
}) {
  const { editable } = useContext(ContextoDeLasFichas);
  const activa = editable && armando;
  const oculta = activa ? '' : 'opacity-0!';
  const tira = activa && elegida;
  return (
    <>
      {entrada && (
        <Handle
          id="arriba"
          type="target"
          position={Position.Top}
          isConnectableStart={false}
          className={`${MANIJA} ${QUIETA} ${oculta}`}
        />
      )}
      {desdeElCostado && (
        <Handle
          id="izquierda"
          type="target"
          position={Position.Left}
          isConnectableStart={false}
          isConnectableEnd={false}
          className={`${MANIJA} ${QUIETA} opacity-0!`}
        />
      )}
      {salida && (
        <Handle
          id="abajo"
          type="source"
          position={Position.Bottom}
          isConnectableStart={tira}
          isConnectableEnd={false}
          className={`${MANIJA} ${tira ? TIRADOR : QUIETA} ${oculta}`}
        />
      )}
      {alCostado && (
        <Handle
          id="derecha"
          type="source"
          position={Position.Right}
          isConnectableStart={false}
          isConnectableEnd={false}
          className={`${MANIJA} ${QUIETA} opacity-0!`}
        />
      )}
    </>
  );
}

export function NodoOrigen({ data }: NodeProps<NodoDelOrigen>) {
  return (
    <div className="relative h-full w-full">
      <CuerpoDelOrigen data={data} />
      <Manijas armando={false} elegida={false} entrada={false} />
    </div>
  );
}

export function NodoDiezmo({ data, selected }: NodeProps<NodoDelDiezmo>) {
  return (
    <div className="relative h-full w-full">
      <CuerpoDelDiezmo data={data} elegida={selected} />
      <Manijas armando={data.armando} elegida={selected} alCostado />
    </div>
  );
}

export function NodoPaso({ data, selected }: NodeProps<NodoDelPaso>) {
  return (
    <div className="relative h-full w-full">
      <CuerpoDelPaso data={data} elegida={selected} enLienzo />
      <Manijas armando={data.armando} elegida={selected} alCostado />
    </div>
  );
}

export function NodoReparto({ data, selected }: NodeProps<NodoDelReparto>) {
  return (
    <div className="relative h-full w-full">
      <CuerpoDelReparto data={data} elegida={selected} />
      <Manijas armando={data.armando} elegida={selected} entrada={false} desdeElCostado />
    </div>
  );
}

export function NodoParte({ data, selected }: NodeProps<NodoDeLaParte>) {
  return (
    <div className="relative h-full w-full">
      <CuerpoDeLaParte data={data} elegida={selected} />
      <Manijas armando={false} elegida={selected} salida={false} />
    </div>
  );
}

export function NodoEstante({ data, selected }: NodeProps<NodoDelEstante>) {
  return (
    <div className="relative h-full w-full">
      <CuerpoDelEstante data={data} elegida={selected} conFlechas />
      <Manijas armando={data.armando} elegida={selected} salida={false} />
    </div>
  );
}

export function NodoNuevoTesoro({ data }: NodeProps<NodoNuevo>) {
  const { alNuevo, puedeCrear, editable } = useContext(ContextoDeLasFichas);
  return (
    <div className="relative h-full w-full">
      <CuerpoNuevoTesoro alTocar={alNuevo} deshabilitado={!editable || !puedeCrear} />
      <Manijas armando={data.armando} elegida={false} salida={false} />
    </div>
  );
}

export function NodoTitulo({ data }: NodeProps<NodoDelTitulo>) {
  return <TituloDelEstante data={data} />;
}
