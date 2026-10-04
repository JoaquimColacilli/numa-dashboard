import { useEffect, useRef, useState } from 'react';

import { estadoDeLaFacturacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { fechaCorta, Ir, RUTA_DEL_ASISTENTE_DE_ARCA, useHaySenal } from '@/shared/lib';
import { Button, Icono, Recuadro, RotuloEnCasillas, type NombreDeIcono } from '@/shared/ui';

import {
  puntoDeVentaEscrito,
  respuestaDeLaPrueba,
  type ConexionDelTaller,
  type RespuestaDeLaPrueba,
  type TonoDeLaPrueba,
} from '../../model/facturacion';

export const ENLACE_SECUNDARIO =
  'inline-flex min-h-button items-center justify-center gap-2 self-start rounded-pill border border-border bg-paper px-4 py-1.5 text-body font-medium text-ink no-underline hover:bg-surface';

const ICONO_DEL_TONO: Readonly<Record<TonoDeLaPrueba, NombreDeIcono>> = {
  bien: 'circle-check',
  atencion: 'clock',
  alerta: 'triangle-alert',
};

const COLOR_DEL_TONO: Readonly<Record<TonoDeLaPrueba, string>> = {
  bien: 'text-hogar',
  atencion: 'text-atencion',
  alerta: 'text-alerta',
};

export interface ConexionConArcaProps {
  conexion: ConexionDelTaller;
  probar?: typeof estadoDeLaFacturacion;
}

export function ConexionConArca({
  conexion,
  probar = estadoDeLaFacturacion,
}: ConexionConArcaProps) {
  const m = useMensajes().facturacion.conexion;
  const haySenal = useHaySenal();
  const [probando, setProbando] = useState(false);
  const [respuesta, setRespuesta] = useState<RespuestaDeLaPrueba | null>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  if (conexion.ambiente === null) {
    return (
      <>
        <p className="max-w-[42rem] text-body-sm leading-relaxed text-text-2">{m.sinConectar}</p>
        <Ir a={RUTA_DEL_ASISTENTE_DE_ARCA} className={ENLACE_SECUNDARIO}>
          {m.conectar}
          <Icono nombre="arrow-right" tamano={16} grosor={2} />
        </Ir>
      </>
    );
  }

  function alProbar(): void {
    setProbando(true);
    setRespuesta(null);
    probar()
      .then(
        (estado) => {
          if (montado.current) setRespuesta(respuestaDeLaPrueba(estado, m));
        },
        () => {
          if (montado.current) setRespuesta({ tono: 'alerta', texto: m.noSePudo, vence: null });
        },
      )
      .finally(() => {
        if (montado.current) setProbando(false);
      });
  }

  const enProduccion = conexion.ambiente === 'produccion';

  return (
    <>
      <RotuloEnCasillas
        etiqueta={m.titulo}
        casillas={[
          { titulo: m.arca, valor: enProduccion ? m.conectada : m.enPrueba },
          { titulo: m.cuit, valor: conexion.cuit },
          { titulo: m.puntoDeVenta, valor: puntoDeVentaEscrito(conexion.puntoDeVenta) },
          { titulo: m.desde, valor: conexion.desde === null ? '' : fechaCorta(conexion.desde) },
        ]}
      />

      {!enProduccion && <Recuadro tono="atencion">{m.modoPrueba}</Recuadro>}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secundario" cargando={probando} disabled={!haySenal} onClick={alProbar}>
          {!probando && <Icono nombre={haySenal ? 'refresh-cw' : 'cloud-off'} tamano={16} />}
          {m.probar}
        </Button>
        {enProduccion && (
          <Ir
            a={RUTA_DEL_ASISTENTE_DE_ARCA}
            className="inline-flex min-h-button items-center rounded-pill px-3 text-body font-medium text-ink underline underline-offset-3"
          >
            {m.renovar}
          </Ir>
        )}
      </div>
      {!haySenal && <p className="text-meta text-text-3">{m.sinSenal}</p>}

      {respuesta !== null && (
        <div
          role="status"
          className="flex flex-col gap-1 rounded-field bg-surface px-3 py-2.5 text-label leading-normal"
        >
          <p className="flex items-start gap-2">
            <Icono
              nombre={ICONO_DEL_TONO[respuesta.tono]}
              tamano={16}
              className={`mt-px flex-none ${COLOR_DEL_TONO[respuesta.tono]}`}
            />
            <span>{respuesta.texto}</span>
          </p>
          {respuesta.vence !== null && (
            <p className="pl-6 text-meta text-text-3">{respuesta.vence}</p>
          )}
        </div>
      )}
    </>
  );
}
