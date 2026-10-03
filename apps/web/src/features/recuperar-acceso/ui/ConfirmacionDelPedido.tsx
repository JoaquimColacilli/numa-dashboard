import { mensajeDeAcceso, pedirRecuperacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { MailEnviado } from '@/shared/ui';

import { RUTA_DE_NUEVA_CONTRASENA } from './FormularioDePedido';

export function ConfirmacionDelPedido({
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
      detalle={m.recuperarAcceso.siHayUnaCuenta}
      reenviar={async () => {
        try {
          await pedirRecuperacion(email, `${window.location.origin}${RUTA_DE_NUEVA_CONTRASENA}`);
          return undefined;
        } catch (fallo) {
          return mensajeDeAcceso(fallo);
        }
      }}
    />
  );
}
