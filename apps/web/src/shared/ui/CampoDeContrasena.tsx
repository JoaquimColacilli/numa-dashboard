import {
  CampoDeContrasena as CampoDeLaUi,
  type CampoDeContrasenaProps as PropsDelCampo,
} from '@maun/ui';

import { useMensajes } from '@/shared/idioma';

export type CampoDeContrasenaProps = Omit<PropsDelCampo, 'etiquetaDeMostrar'>;

export function CampoDeContrasena(props: CampoDeContrasenaProps) {
  const { mostrar } = useMensajes().ui.contrasena;
  return <CampoDeLaUi {...props} etiquetaDeMostrar={mostrar} />;
}
