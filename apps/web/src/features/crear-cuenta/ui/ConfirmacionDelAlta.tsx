import { mensajeDeAcceso, reenviarConfirmacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { MailEnviado } from '@/shared/ui';

import { RUTA_DE_CONFIRMACION } from './FormularioDeRegistro';

export function ConfirmacionDelAlta({
  email,
  alCambiar,
}: {
  email: string;
  alCambiar: () => void;
}) {
  const m = useMensajes();
  return (
    <MailEnviado
      email={email}
      alCambiar={alCambiar}
      detalle={m.crearCuenta.abriElEnlace}
      reenviar={async () => {
        try {
          await reenviarConfirmacion(email, `${window.location.origin}${RUTA_DE_CONFIRMACION}`);
          return undefined;
        } catch (fallo) {
          return mensajeDeAcceso(fallo);
        }
      }}
    />
  );
}
