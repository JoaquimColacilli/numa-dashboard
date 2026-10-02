import { useParams } from 'react-router';

import { resumenDeProyecto, rutaDelProyecto } from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { PantallaDeLaVista, useVistaDelTrabajo } from '@/entities/vista-cliente';
import { BotonDelQr } from '@/features/compartir-con-el-cliente';
import { useMensajes } from '@/shared/idioma';
import { hoyLocal, Ir, useEstadoSync, useVolver } from '@/shared/lib';
import { Icono } from '@/shared/ui';

export function ProyectoVistaClientePage() {
  const replica = useReplicaDelTaller();
  const { id = '' } = useParams();
  const textos = useMensajes().paginaProyectos.vistaCliente;
  const resumen = resumenDeProyecto(replica, id, hoyLocal());
  const resultado = useVistaDelTrabajo(id);
  const sync = useEstadoSync();
  const desactualizada = sync.tipo === 'sin-conexion' && resultado.estado === 'lista';
  const vuelta = useVolver(
    rutaDelProyecto(id),
    resumen === undefined ? textos.volverAlTrabajo : textos.volverA(resumen.proyecto.titulo),
    { fija: true },
  );

  return (
    <>
      <div className="mx-auto flex w-full max-w-content flex-col gap-3 px-(--page-pad-mobile) pt-4 md:px-(--page-pad-tablet) lg:px-(--page-pad-desktop)">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Ir
            a={rutaDelProyecto(id)}
            alTocar={vuelta.volver}
            className="-ml-1 flex min-h-tap w-fit items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
          >
            <Icono nombre="chevron-left" tamano={20} />
            {vuelta.etiqueta}
          </Ir>
          {resumen !== undefined && (
            <BotonDelQr proyectoId={id} trabajo={resumen.proyecto.titulo} />
          )}
        </div>
        {desactualizada && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-panel border border-hairline bg-paper px-4 py-2.5 text-label font-medium text-text-2"
          >
            <Icono nombre="cloud-off" tamano={16} />
            {textos.sinSenal}
          </p>
        )}
      </div>
      <PantallaDeLaVista
        resultado={resultado}
        tituloMuerto={textos.noEsta}
        textoMuerto={textos.noEstaTexto}
      />
    </>
  );
}
