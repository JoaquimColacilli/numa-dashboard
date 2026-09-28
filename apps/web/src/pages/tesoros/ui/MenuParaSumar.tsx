import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

import { ChipDelTesoro } from '@/entities/tesoro';
import {
  editarLaFila,
  fichaDelPaso,
  sumarComoPaso,
  tesoroDe,
  type VistaDeLaFila,
} from '@/features/armar-la-fila';
import { formatearPesos } from '@/shared/lib';
import { ConSalida, Icono, RESPALDO_DE_LA_SALIDA_MS, useSalida } from '@/shared/ui';

export interface PedidoDeSumar {
  despuesDe: string | null;
  boton: HTMLElement;
}

export interface MenuParaSumarProps {
  pedido: PedidoDeSumar | null;
  vista: VistaDeLaFila;
  alCerrar: () => void;
  alElegir: (id: string) => void;
  alPedirNuevo: (despuesDe: string | null) => void;
}

const ANCHO_DEL_MENU = 280;
const MARGEN = 12;

function lugarDelPedido(vista: VistaDeLaFila, despuesDe: string | null): number {
  if (despuesDe === null) return 1;
  return vista.fila.pasos.findIndex((paso) => paso.tesoro === despuesDe) + 2;
}

function Menu({
  pedido,
  vista,
  alCerrar,
  alElegir,
  alPedirNuevo,
}: Omit<MenuParaSumarProps, 'pedido'> & { pedido: PedidoDeSumar }) {
  const salida = useSalida();
  const saliendo = salida?.saliendo ?? false;
  const alTerminar = salida?.alTerminar;
  const menu = useRef<HTMLDivElement>(null);
  const [lugar, setLugar] = useState<{ left: number; top: number } | null>(null);
  const numero = lugarDelPedido(vista, pedido.despuesDe);
  const despuesDe =
    pedido.despuesDe === null
      ? 'después del diezmo'
      : `después de ${tesoroDe(vista, pedido.despuesDe).nombre}`;

  useLayoutEffect(() => {
    const elemento = menu.current;
    if (!elemento) return;
    const caja = pedido.boton.getBoundingClientRect();
    const alto = elemento.offsetHeight;
    const left = Math.max(
      MARGEN,
      Math.min(caja.right + 10, window.innerWidth - ANCHO_DEL_MENU - MARGEN),
    );
    const abajo = caja.top - 8 + alto <= window.innerHeight - MARGEN;
    const top = abajo ? Math.max(MARGEN, caja.top - 8) : Math.max(MARGEN, caja.bottom - alto + 8);
    setLugar({ left, top });
  }, [pedido]);

  useEffect(() => {
    if (saliendo) return;
    menu.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const alPresionar = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        alCerrar();
      }
    };
    globalThis.addEventListener('keydown', alPresionar);
    return () => {
      globalThis.removeEventListener('keydown', alPresionar);
    };
  }, [saliendo, alCerrar]);

  useEffect(() => {
    const elemento = menu.current;
    if (!saliendo || !elemento || !alTerminar) return;
    let terminado = false;
    const terminar = () => {
      if (terminado) return;
      terminado = true;
      alTerminar();
      if (pedido.boton.isConnected) pedido.boton.focus();
    };
    const alTerminarLaTransicion = (evento: TransitionEvent) => {
      if (evento.target === elemento && evento.propertyName === 'opacity') terminar();
    };
    elemento.addEventListener('transitionend', alTerminarLaTransicion);
    const respaldo = setTimeout(terminar, RESPALDO_DE_LA_SALIDA_MS);
    return () => {
      elemento.removeEventListener('transitionend', alTerminarLaTransicion);
      clearTimeout(respaldo);
    };
  }, [saliendo, alTerminar, pedido.boton]);

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar el menú"
        inert={saliendo}
        className={`fixed inset-0 z-40 cursor-default ${saliendo ? 'pointer-events-none' : ''}`}
        onClick={alCerrar}
      />
      <div
        ref={menu}
        role="menu"
        aria-label={`Sumar como paso ${String(numero)}`}
        inert={saliendo}
        data-saliendo={saliendo ? '' : undefined}
        style={{
          left: lugar?.left ?? 0,
          top: lugar?.top ?? 0,
          visibility: lugar === null ? 'hidden' : undefined,
        }}
        className={`menu-del-mas fixed z-40 flex w-[280px] origin-top-left flex-col gap-0.5 rounded-panel bg-ink p-1.5 text-paper shadow-menu ${
          saliendo ? 'pointer-events-none' : ''
        }`}
      >
        <p className="px-3 pt-2 pb-1.5 text-meta text-paper/65">
          Sumar como paso {numero}, {despuesDe}
        </p>
        {vista.estante.map((suelto, indice) => (
          <button
            key={suelto.id}
            type="button"
            role="menuitem"
            style={{ '--indice': indice } as CSSProperties}
            onClick={() => {
              editarLaFila(vista, (fila) =>
                sumarComoPaso(fila, suelto.id, suelto.clave, pedido.despuesDe),
              );
              alElegir(fichaDelPaso(suelto.id));
              alCerrar();
            }}
            className="accion-del-menu flex min-h-tap items-center gap-3 rounded-field px-3 py-1.5 text-left hover:bg-paper/10"
          >
            <ChipDelTesoro tesoro={suelto} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-medium">{suelto.nombre}</span>
              <span className="block text-meta text-paper/65">
                tiene {formatearPesos(suelto.saldo)}
              </span>
            </span>
          </button>
        ))}
        {vista.estante.length > 0 && <span aria-hidden className="mx-3 my-1 h-px bg-paper/15" />}
        <button
          type="button"
          role="menuitem"
          disabled={!vista.sincronizados}
          style={{ '--indice': vista.estante.length } as CSSProperties}
          onClick={() => {
            alCerrar();
            alPedirNuevo(pedido.despuesDe);
          }}
          className="accion-del-menu flex min-h-tap items-center gap-3 rounded-field px-3 text-left text-body hover:bg-paper/10 disabled:text-paper/40"
        >
          <span
            aria-hidden
            className="flex size-7 flex-none items-center justify-center rounded-control border border-paper/30"
          >
            <Icono nombre="plus" tamano={16} />
          </span>
          Un tesoro nuevo
        </button>
      </div>
    </>
  );
}

export function MenuParaSumar({ pedido, ...props }: MenuParaSumarProps) {
  return (
    <ConSalida valor={pedido}>{(elPedido) => <Menu {...props} pedido={elPedido} />}</ConSalida>
  );
}
