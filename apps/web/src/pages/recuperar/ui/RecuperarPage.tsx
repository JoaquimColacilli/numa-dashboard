import { useState, type ReactNode } from 'react';

import { ConfirmacionDelPedido, FormularioDePedido } from '@/features/recuperar-acceso';
import { useMensajes } from '@/shared/idioma';
import { Ir } from '@/shared/lib';
import { ENLACE_DE_ACCESO, PantallaDeAcceso } from '@/shared/ui';

function Entra({ children }: { children: ReactNode }) {
  return (
    <Ir a="/acceso" className={ENLACE_DE_ACCESO}>
      {children}
    </Ir>
  );
}

export function RecuperarPage() {
  const m = useMensajes();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <PantallaDeAcceso
        titulo={m.paginaRecuperar.revisaTuCorreo}
        pose="saludando"
        bajada={m.paginaRecuperar.elEnlaceTeLleva}
        nota={m.paginaRecuperar.pocosMailsPorHora}
      >
        <ConfirmacionDelPedido
          email={email}
          alCambiar={() => {
            setEnviado(false);
          }}
        />
      </PantallaDeAcceso>
    );
  }

  return (
    <PantallaDeAcceso
      titulo={m.paginaRecuperar.recuperaElAcceso}
      pose="pensando"
      bajada={m.paginaRecuperar.teMandamosUnEnlace}
      pie={<p>{m.paginaRecuperar.teAcordaste({ Enlace: Entra })}</p>}
    >
      <FormularioDePedido
        emailInicial={email}
        alPedir={(pedido) => {
          setEmail(pedido);
          setEnviado(true);
        }}
      />
    </PantallaDeAcceso>
  );
}
