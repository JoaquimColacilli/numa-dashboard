import { useParams } from 'react-router';

import { PantallaDelPresupuesto, sePuedeMandarOtra } from '@/features/armar-el-presupuesto';
import { useReplicaDelTaller } from '@/entities/replica';
import { filaPorId } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { rutaDelProyecto, useVolver } from '@/shared/lib';
import {
  Button,
  ESCENA_EN_LA_LAMINA,
  Ilustracion,
  Pagina,
  TarjetaConLamina,
  TITULO_DE_LAMINA,
} from '@/shared/ui';

function Aviso({
  titulo,
  texto,
  volver,
  etiqueta,
}: {
  titulo: string;
  texto: string;
  volver: () => void;
  etiqueta: string;
}) {
  return (
    <Pagina>
      <TarjetaConLamina
        como="div"
        dibujo={<Ilustracion nombre="anulado" />}
        lamina={ESCENA_EN_LA_LAMINA}
      >
        <h1 className={TITULO_DE_LAMINA}>{titulo}</h1>
        <p className="max-w-[44ch] text-body leading-relaxed text-text-2">{texto}</p>
        <div className="w-full pt-2">
          <Button onClick={volver}>{etiqueta}</Button>
        </div>
      </TarjetaConLamina>
    </Pagina>
  );
}

export function ProyectoPresupuestoPage() {
  const replica = useReplicaDelTaller();
  const { id = '' } = useParams();
  const { comun, presupuesto: textos } = useMensajes().paginaProyectos;
  const proyecto = filaPorId(replica, 'proyectos', id);
  const aProyectos = useVolver('/proyectos', comun.proyectos);
  const alTrabajo = useVolver(rutaDelProyecto(id), textos.volverAlTrabajo);

  if (proyecto === undefined) {
    return (
      <Aviso
        titulo={comun.noEsta}
        texto={comun.noEstaTexto}
        volver={aProyectos.volver}
        etiqueta={comun.volverAProyectos}
      />
    );
  }

  if (!sePuedeMandarOtra(proyecto.estado)) {
    return (
      <Aviso
        titulo={textos.yaNoSeCambia}
        texto={textos.yaNoSeCambiaTexto}
        volver={alTrabajo.volver}
        etiqueta={textos.volverAlTrabajo}
      />
    );
  }

  return <PantallaDelPresupuesto key={proyecto.id} proyecto={proyecto} />;
}
