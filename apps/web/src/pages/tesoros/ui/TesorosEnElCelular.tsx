import { useEffect, useRef, useState } from 'react';

import { AyudaDeLaPrueba, AyudaDeLosInsumos } from '@/entities/fila';
import { fraseDeLosInsumos, type InsumosDeLosTrabajos } from '@/entities/proyecto';
import { BarraDeEdicionCelular, Probador, sePuedeEditar } from '@/features/armar-la-fila';
import { useMensajes } from '@/shared/idioma';
import { formatearPesos, Ir, rutaDelProyecto } from '@/shared/lib';
import { Icono, Pagina } from '@/shared/ui';

import type { PantallaDeTesoros } from '../model/pantalla';
import { Bienvenida } from './Bienvenida';
import { MenuParaSumar, type PedidoDeSumar } from './MenuParaSumar';
import { PlanoCompleto } from './PlanoCompleto';
import { PlanoVertical } from './PlanoVertical';

function TarjetaDeLosInsumos({ insumos }: { insumos: InsumosDeLosTrabajos }) {
  const textos = useMensajes().paginaTesoros.celular;
  const cuantos = insumos.trabajos.length;
  return (
    <section
      aria-label={textos.insumos}
      className="flex flex-col gap-2.5 rounded-panel border border-hairline bg-paper px-4 py-4"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex size-9 flex-none items-center justify-center rounded-field bg-surface-2 text-ink"
        >
          <Icono nombre="hand-coins" tamano={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 text-body-lg leading-snug font-semibold">
            {textos.insumos}
            <AyudaDeLosInsumos />
          </h2>
          <p className="text-label text-text-2">
            {cuantos === 0 ? textos.sinTrabajos : textos.loQueQuedaDeLaSena(cuantos)}
          </p>
        </div>
        <span translate="no" className="flex-none text-body-lg font-semibold tabular-nums">
          {formatearPesos(insumos.total)}
        </span>
      </div>
      {cuantos > 0 && (
        <ul className="-mx-2 flex flex-col border-t border-hairline-soft pt-1">
          {insumos.trabajos.map((trabajo) => (
            <li key={trabajo.proyectoId}>
              <Ir
                a={rutaDelProyecto(trabajo.proyectoId)}
                className="flex min-h-tap items-center justify-between gap-3 rounded-field px-2 py-1"
              >
                {trabajo.titulo === '' ? (
                  <span className="min-w-0 truncate text-body">{textos.unTrabajo}</span>
                ) : (
                  <span translate="no" className="min-w-0 truncate text-body">
                    {trabajo.titulo}
                  </span>
                )}
                <span className="flex-none text-label font-semibold tabular-nums">
                  {fraseDeLosInsumos(trabajo) ?? (
                    <span translate="no">{formatearPesos(trabajo.queda)}</span>
                  )}
                </span>
              </Ir>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function TesorosEnElCelular({ pantalla }: { pantalla: PantallaDeTesoros }) {
  const textos = useMensajes().paginaTesoros.celular;
  const { vista } = pantalla;
  const [pedido, setPedido] = useState<PedidoDeSumar | null>(null);
  const [completo, setCompleto] = useState(false);
  const botonDelPlano = useRef<HTMLButtonElement>(null);
  const desdeElEnlace = pantalla.desdeElEnlace;

  useEffect(() => {
    if (desdeElEnlace === null) return;
    document
      .querySelector(`[data-ficha="${desdeElEnlace}"]`)
      ?.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [desdeElEnlace]);

  const tocar = (id: string) => {
    pantalla.elegir(id);
    pantalla.abrir({ tipo: 'ficha', id });
  };

  return (
    <Pagina className="gap-3">
      {vista.armando ? (
        <BarraDeEdicionCelular
          vista={vista}
          className="-mx-(--page-pad-mobile) -mt-4"
          alGuardar={() => {
            pantalla.abrir({ tipo: 'guardar' });
          }}
        />
      ) : (
        <header className="flex items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label text-text-2">{textos.comoSeReparte}</span>
            <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{textos.tesoros}</h1>
          </div>
          <div className="flex flex-none items-center gap-2 pb-0.5">
            <button
              ref={botonDelPlano}
              type="button"
              aria-label={textos.verElPlanoCompleto}
              onClick={() => {
                setCompleto(true);
              }}
              className="apretable flex size-tap items-center justify-center rounded-pill border border-hairline bg-paper text-ink"
            >
              <Icono nombre="maximize-2" tamano={19} />
            </button>
            <button
              type="button"
              disabled={!sePuedeEditar(vista)}
              onClick={pantalla.empezar}
              className="apretable flex min-h-tap items-center gap-2 rounded-pill bg-ink px-4 text-body font-medium text-paper disabled:bg-hairline disabled:text-text-3"
            >
              <Icono nombre="pencil" tamano={17} />
              {textos.editar}
            </button>
          </div>
        </header>
      )}

      {pantalla.primeraVez && (
        <Bienvenida
          puedeEditar={sePuedeEditar(vista)}
          alEditar={pantalla.empezar}
          alEntender={pantalla.entender}
        />
      )}

      {!vista.armando && <TarjetaDeLosInsumos insumos={pantalla.insumos} />}

      {!vista.armando && (
        <section
          aria-label={textos.probarUnCobro}
          className="flex flex-col gap-2.5 rounded-panel border border-hairline bg-paper px-4 py-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-body-lg font-semibold">{textos.probaUnCobro}</h2>
            <AyudaDeLaPrueba />
          </div>
          <Probador
            vista={vista}
            prueba={pantalla.prueba}
            resultado={pantalla.resultado}
            alProbar={pantalla.probar}
            forma="celular"
          />
        </section>
      )}

      <PlanoVertical
        vista={vista}
        resultado={pantalla.resultado}
        elegido={pantalla.elegido}
        insumos={pantalla.insumosEnElPlano}
        alTocar={tocar}
        alSumar={(tramo, boton) => {
          setPedido({ tramo, boton });
        }}
        alNuevo={() => {
          pantalla.abrir({ tipo: 'nuevo', lugar: 'estante' });
        }}
      />

      <MenuParaSumar
        pedido={pedido}
        vista={vista}
        alCerrar={() => {
          setPedido(null);
        }}
        alElegir={tocar}
        alPedirNuevo={(lugar, despuesDe) => {
          pantalla.abrir({ tipo: 'nuevo', lugar, despuesDe });
        }}
      />

      {completo && (
        <PlanoCompleto
          pantalla={pantalla}
          alCerrar={() => {
            setCompleto(false);
            botonDelPlano.current?.focus();
          }}
        />
      )}
    </Pagina>
  );
}
