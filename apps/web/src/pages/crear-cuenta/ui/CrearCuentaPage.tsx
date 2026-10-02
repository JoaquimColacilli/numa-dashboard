import { useState, type ReactNode } from 'react';

import { ConfirmacionDelAlta, FormularioDeRegistro } from '@/features/crear-cuenta';
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

export function CrearCuentaPage() {
  const m = useMensajes();
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <PantallaDeAcceso
        titulo={m.paginaCrearCuenta.revisaTuCorreo}
        pose="saludando"
        bajada={m.paginaCrearCuenta.faltaUnPaso}
        nota={m.paginaCrearCuenta.pocosMailsPorHora}
      >
        <ConfirmacionDelAlta
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
      titulo={m.paginaCrearCuenta.creaTuCuenta}
      pose="midiendo"
      bajada={m.paginaCrearCuenta.confirmasElMail}
      nota={m.paginaCrearCuenta.unaVezAdentro}
      pie={<p>{m.paginaCrearCuenta.yaTenesCuenta({ Enlace: Entra })}</p>}
    >
      <FormularioDeRegistro
        emailInicial={email}
        alCrear={(creado) => {
          setEmail(creado);
          setEnviado(true);
        }}
      />
    </PantallaDeAcceso>
  );
}
