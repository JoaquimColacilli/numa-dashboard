import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { trabajoConFacturasDeVerdad } from '@/entities/factura';
import { hijosDelProyecto, MUTACION_DE_BAJA_DE_PROYECTO, type Proyecto } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { useMensajes } from '@/shared/idioma';
import { metaDeAvisos } from '@/shared/lib';
import { Button, ConSalida, FilaDeAcciones, Hoja, Icono } from '@/shared/ui';

export interface BorradoDelProyectoProps {
  proyecto: Proyecto;
  variante: 'proyecto' | 'contacto';
  alBorrar: () => void;
}

export function BorradoDelProyecto({ proyecto, variante, alBorrar }: BorradoDelProyectoProps) {
  const replica = useReplicaDelTaller();
  const m = useMensajes();
  const textos = m.editarProyecto.borrado;
  const conFacturas = trabajoConFacturasDeVerdad(replica, proyecto.id);
  const borrar = useMutation({
    ...MUTACION_DE_BAJA_DE_PROYECTO,
    meta: metaDeAvisos(variante === 'contacto' ? 'contactoBorrado' : 'proyectoBorrado', {
      sujeto: proyecto.titulo,
    }),
  });
  const [confirmando, setConfirmando] = useState(false);
  const { pagos, gastos, opciones, necesidades } = hijosDelProyecto(replica, proyecto.id);

  return (
    <>
      <Button
        variant="herramienta"
        size="herramienta"
        className="sm:px-4"
        aria-label={textos.borrar}
        onClick={() => {
          setConfirmando(true);
        }}
      >
        <Icono nombre="trash-2" tamano={16} />
        <span className="hidden sm:inline">{textos.borrar}</span>
      </Button>

      <ConSalida valor={confirmando}>
        {() => (
          <Hoja
            titulo={textos.pregunta(proyecto.titulo)}
            rol="alertdialog"
            ancho="angosto"
            alCerrar={() => {
              setConfirmando(false);
            }}
          >
            <div className="flex flex-col gap-3.5 px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
              <p className="text-label leading-relaxed text-text-2">
                {conFacturas
                  ? m.facturacion.bloqueos.trabajoConFacturas
                  : pagos.length === 0 && gastos.length === 0
                    ? variante === 'contacto'
                      ? textos.sinPlataDelContacto
                      : textos.sinPlataDelProyecto
                    : textos.conPlata(pagos.length, gastos.length)}
              </p>
              <FilaDeAcciones>
                <Button
                  variant="secundario"
                  onClick={() => {
                    setConfirmando(false);
                  }}
                >
                  {textos.cancelar}
                </Button>
                {!conFacturas && (
                  <Button
                    variant="peligro"
                    onClick={() => {
                      borrar.mutate({
                        id: proyecto.id,
                        borradoEn: new Date().toISOString(),
                        previos: { proyecto, pagos, gastos, opciones, necesidades },
                      });
                      setConfirmando(false);
                      alBorrar();
                    }}
                  >
                    {variante === 'contacto' ? textos.borrarElContacto : textos.borrarElProyecto}
                  </Button>
                )}
              </FilaDeAcciones>
            </div>
          </Hoja>
        )}
      </ConSalida>
    </>
  );
}
