import { useState, type SyntheticEvent } from 'react';

import { crearCuenta, mensajeDeAcceso } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { idiomaActual } from '@/shared/lib';
import { Button, Campo, CampoDeContrasena } from '@/shared/ui';

const MAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const LARGO_MINIMO = 6;

export const RUTA_DE_CONFIRMACION = '/acceso';

interface ErrorDelFormulario {
  campo?: 'email' | 'contrasena';
  mensaje: string;
}

export function FormularioDeRegistro({
  emailInicial = '',
  alCrear,
}: {
  emailInicial?: string;
  alCrear: (email: string) => void;
}) {
  const m = useMensajes();
  const [email, setEmail] = useState(emailInicial);
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<ErrorDelFormulario | undefined>(undefined);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!MAIL.test(email)) {
      setError({ campo: 'email', mensaje: m.crearCuenta.escribiUnMailValido });
      return;
    }
    if (contrasena.length < LARGO_MINIMO) {
      setError({
        campo: 'contrasena',
        mensaje: m.crearCuenta.contrasenaCorta({ minimo: LARGO_MINIMO }),
      });
      return;
    }

    setEnviando(true);
    setError(undefined);
    try {
      await crearCuenta(
        email,
        contrasena,
        `${window.location.origin}${RUTA_DE_CONFIRMACION}`,
        idiomaActual(),
      );
      alCrear(email);
    } catch (fallo) {
      setError({ mensaje: mensajeDeAcceso(fallo) });
      setEnviando(false);
    }
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(evento) => {
        void enviar(evento);
      }}
    >
      <Campo
        etiqueta={m.crearCuenta.email}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        value={email}
        error={error?.campo === 'email' ? error.mensaje : undefined}
        onChange={(evento) => {
          setEmail(evento.target.value);
        }}
        placeholder={m.crearCuenta.ejemploDeMail}
      />
      <CampoDeContrasena
        etiqueta={m.crearCuenta.contrasena}
        name="new-password"
        autoComplete="new-password"
        ayuda={m.crearCuenta.alMenos({ minimo: LARGO_MINIMO })}
        value={contrasena}
        error={error?.campo === 'contrasena' ? error.mensaje : undefined}
        onChange={(evento) => {
          setContrasena(evento.target.value);
        }}
      />
      {error !== undefined && error.campo === undefined && (
        <p role="alert" className="text-label leading-relaxed font-medium text-alerta">
          {error.mensaje}
        </p>
      )}
      <Button type="submit" size="grande" cargando={enviando} className="mt-1 w-full">
        {enviando ? m.crearCuenta.creandoLaCuenta : m.crearCuenta.crearLaCuenta}
      </Button>
    </form>
  );
}
