import { useEffect } from 'react';

import { useIdiomaDeLaPersona, useSesionActiva } from '@/entities/sesion';
import { estadoDeLosMensajes, usarIdioma } from '@/shared/idioma';
import { estadoDelSeudoidioma, guardarElIdioma } from '@/shared/lib';

export function IdiomaDeLaCuenta(): null {
  const { usuarioId } = useSesionActiva();
  const idioma = useIdiomaDeLaPersona();

  useEffect(() => {
    guardarElIdioma(usuarioId, idioma);
    const seudo = estadoDelSeudoidioma() === 'activo';
    const { arrancando, ...puesto } = estadoDeLosMensajes();
    const enCamino = arrancando ?? puesto;
    if (seudo ? enCamino.seudo : !enCamino.seudo && enCamino.idioma === idioma) return;
    void usarIdioma(idioma, seudo).catch(() => false);
  }, [usuarioId, idioma]);

  return null;
}
