import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { mensajeDeAcceso, salir } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { limpiarDatosLocales, useEstadoSync } from '@/shared/lib';
import { Button, FilaDeAcciones } from '@/shared/ui';

export function EntrarConOtraCuenta() {
  const m = useMensajes();
  const queryClient = useQueryClient();
  const pendientes = useIsMutating();
  const sinSenal = useEstadoSync().tipo === 'sin-conexion';
  const [avisando, setAvisando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState('');

  async function salirDeLaCuenta(): Promise<void> {
    setSaliendo(true);
    setError('');
    try {
      await salir();
    } catch (fallo) {
      setError(mensajeDeAcceso(fallo));
    } finally {
      await limpiarDatosLocales(queryClient);
      setSaliendo(false);
    }
  }

  const alerta =
    error === '' ? null : (
      <p role="alert" className="text-label leading-relaxed font-medium text-alerta">
        {error}
      </p>
    );

  if (avisando && pendientes > 0) {
    const losPendientes = { cantidad: pendientes };
    return (
      <div className="flex flex-col gap-3">
        <div
          role="alert"
          className="flex flex-col gap-1.5 rounded-field bg-alerta-tint px-3.5 py-3 text-label leading-relaxed text-alerta"
        >
          <p className="font-semibold">{m.cerrarSesion.hayCambiosDeEsteTelefono(losPendientes)}</p>
          <p>{m.cerrarSesion.siEntrasConOtraCuenta(losPendientes)}</p>
          <p>
            {sinSenal
              ? m.cerrarSesion.paraNoPerderlosSinSenal(losPendientes)
              : m.cerrarSesion.paraNoPerderlosConSenal(losPendientes)}
          </p>
        </div>
        <FilaDeAcciones>
          <Button
            variant="peligro"
            cargando={saliendo}
            onClick={() => {
              void salirDeLaCuenta();
            }}
          >
            {saliendo ? m.cerrarSesion.saliendo : m.cerrarSesion.borrarYSalir(losPendientes)}
          </Button>
          <Button
            variant="secundario"
            disabled={saliendo}
            onClick={() => {
              setAvisando(false);
            }}
          >
            {m.cerrarSesion.noVolver}
          </Button>
        </FilaDeAcciones>
        {alerta}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        variant="terciario"
        className="-ml-3"
        cargando={saliendo}
        onClick={() => {
          if (pendientes > 0) setAvisando(true);
          else void salirDeLaCuenta();
        }}
      >
        {m.cerrarSesion.entrarConOtraCuenta}
      </Button>
      {alerta}
    </div>
  );
}
