import { HojaDeCubrir } from '@/features/cubrir-el-faltante';
import { HojaDeGuardarLaFila, HojaDeLaFicha } from '@/features/armar-la-fila';
import { HojaDeEditarTesoro, HojaDeTesoroNuevo } from '@/features/editar-tesoro';
import { ConSalida } from '@/shared/ui';

import type { HojaDeTesoros, PantallaDeTesoros } from '../model/pantalla';

function deTipo<T extends HojaDeTesoros['tipo']>(
  hoja: HojaDeTesoros | null,
  tipo: T,
): Extract<HojaDeTesoros, { tipo: T }> | null {
  return hoja?.tipo === tipo ? (hoja as Extract<HojaDeTesoros, { tipo: T }>) : null;
}

export function HojasDeTesoros({ pantalla }: { pantalla: PantallaDeTesoros }) {
  const { hoja, cerrar, vista } = pantalla;
  return (
    <>
      <ConSalida valor={deTipo(hoja, 'nuevo')}>
        {(pedido) => (
          <HojaDeTesoroNuevo
            fila={vista.fila}
            lugarInicial={pedido.lugar}
            despuesDe={pedido.despuesDe}
            alCerrar={cerrar}
            alCrear={pantalla.alCrear}
          />
        )}
      </ConSalida>
      <ConSalida valor={deTipo(hoja, 'editar')}>
        {(pedido) => (
          <HojaDeEditarTesoro
            tesoroId={pedido.tesoro}
            alCerrar={cerrar}
            alGuardarLoDeCocos={pantalla.alGuardarLoDeCocos}
          />
        )}
      </ConSalida>
      <ConSalida valor={deTipo(hoja, 'cubrir')}>
        {(pedido) => (
          <HojaDeCubrir
            tesoroDelPaso={pedido.paso.tesoro}
            mes={vista.mes}
            faltante={pedido.paso.falta ?? 0}
            alCerrar={cerrar}
          />
        )}
      </ConSalida>
      <ConSalida valor={deTipo(hoja, 'guardar')}>
        {() => (
          <HojaDeGuardarLaFila
            vista={vista}
            monto={pantalla.prueba.monto}
            cobrado={pantalla.prueba.cobrado}
            alCerrar={cerrar}
            alGuardar={() => {
              pantalla.elegir(null);
            }}
          />
        )}
      </ConSalida>
      <ConSalida valor={deTipo(hoja, 'ficha')}>
        {(pedido) => (
          <HojaDeLaFicha
            vista={vista}
            elegido={pantalla.elegido ?? pedido.id}
            prueba={pantalla.prueba}
            resultado={pantalla.resultado}
            alElegir={pantalla.elegir}
            alProbar={pantalla.probar}
            alCubrir={(paso) => {
              pantalla.abrir({ tipo: 'cubrir', paso });
            }}
            alEditarTesoro={(tesoro) => {
              pantalla.abrir({ tipo: 'editar', tesoro });
            }}
            alRegistrarElPago={pantalla.registrarElPago}
            insumos={pantalla.insumos}
            alCerrar={() => {
              pantalla.elegir(null);
              cerrar();
            }}
          />
        )}
      </ConSalida>
    </>
  );
}
