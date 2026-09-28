import { useRef, useState } from 'react';

import { BarraDeEdicionCelular, Probador, sePuedeEditar } from '@/features/armar-la-fila';
import { nombreDelMes } from '@/shared/lib';
import { Ayuda, Icono, Pagina } from '@/shared/ui';

import type { PantallaDeTesoros } from '../model/pantalla';
import { Bienvenida } from './Bienvenida';
import { MenuParaSumar, type PedidoDeSumar } from './MenuParaSumar';
import { PlanoCompleto } from './PlanoCompleto';
import { PlanoVertical } from './PlanoVertical';

export function TesorosEnElCelular({ pantalla }: { pantalla: PantallaDeTesoros }) {
  const { vista } = pantalla;
  const [pedido, setPedido] = useState<PedidoDeSumar | null>(null);
  const [completo, setCompleto] = useState(false);
  const botonDelPlano = useRef<HTMLButtonElement>(null);
  const mes = nombreDelMes(vista.mes).toLowerCase();

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
            <span className="text-label text-text-2">Cómo se reparte cada cobro</span>
            <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">Tesoros</h1>
          </div>
          <div className="flex flex-none items-center gap-2 pb-0.5">
            <button
              ref={botonDelPlano}
              type="button"
              aria-label="Ver el plano completo"
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
              Editar
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

      {!vista.armando && (
        <section
          aria-label="Probar un cobro"
          className="flex flex-col gap-2.5 rounded-panel border border-hairline bg-paper px-4 py-4"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-body-lg font-semibold">Probá un cobro</h2>
            <Ayuda que="Cómo se prueba un cobro">
              Escribí lo que te dejaría un trabajo y la fila muestra por dónde baja cada peso.{' '}
              <strong className="font-semibold">Con lo de {mes}</strong> tiene en cuenta lo que ya
              entró; <strong className="font-semibold">mes en cero</strong> arranca con los topes
              vacíos.
            </Ayuda>
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
        alTocar={tocar}
        alSumar={(despuesDe, boton) => {
          setPedido({ despuesDe, boton });
        }}
        alNuevo={() => {
          pantalla.abrir({ tipo: 'nuevo', lugar: 'estante', despuesDe: undefined });
        }}
      />

      <MenuParaSumar
        pedido={pedido}
        vista={vista}
        alCerrar={() => {
          setPedido(null);
        }}
        alElegir={tocar}
        alPedirNuevo={(despuesDe) => {
          pantalla.abrir({ tipo: 'nuevo', lugar: 'paso', despuesDe });
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
