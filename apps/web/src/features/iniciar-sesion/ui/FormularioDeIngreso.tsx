import { useEffect, useState, type ReactNode, type SyntheticEvent } from 'react';

import {
  codigoDeAcceso,
  entrar,
  esFalloDeRed,
  esperarHuellaDelAutocompletado,
  mensajeDeAcceso,
  reenviarConfirmacion,
} from '@/shared/api';
import { mensajes, useMensajes } from '@/shared/idioma';
import { anotarIngresoConContrasena } from '@/shared/lib';
import { Button, Campo, CampoDeContrasena } from '@/shared/ui';

const MAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function mensajeDelIngreso(fallo: unknown): string {
  return esFalloDeRed(fallo) ? mensajes().iniciarSesion.sinSenalParaEntrar : mensajeDeAcceso(fallo);
}

interface ErrorDelFormulario {
  campo?: 'email' | 'contrasena';
  mensaje: string;
}

function ReenvioDeConfirmacion({ email }: { email: string }) {
  const m = useMensajes();
  const [mandando, setMandando] = useState(false);
  const [resultado, setResultado] = useState<{ error: boolean; texto: string } | undefined>(
    undefined,
  );

  async function mandar(): Promise<void> {
    setMandando(true);
    setResultado(undefined);
    try {
      await reenviarConfirmacion(email, `${window.location.origin}/acceso`);
      setResultado({
        error: false,
        texto: mensajes().iniciarSesion.teMandamosElEnlaceDeNuevo({ email }),
      });
    } catch (fallo) {
      setResultado({ error: true, texto: mensajeDeAcceso(fallo) });
    } finally {
      setMandando(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="secundario"
        size="chico"
        cargando={mandando}
        onClick={() => {
          void mandar();
        }}
      >
        {mandando ? m.iniciarSesion.mandandolo : m.iniciarSesion.mandarmeElEnlaceDeNuevo}
      </Button>
      {resultado !== undefined && (
        <p
          role={resultado.error ? 'alert' : 'status'}
          className={`text-label leading-relaxed ${resultado.error ? 'font-medium text-alerta' : 'text-text-2'}`}
        >
          {resultado.texto}
        </p>
      )}
    </div>
  );
}

export function FormularioDeIngreso({ olvido }: { olvido?: ReactNode }) {
  const m = useMensajes();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<ErrorDelFormulario | undefined>(undefined);
  const [sinConfirmar, setSinConfirmar] = useState(false);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    const control = new AbortController();
    esperarHuellaDelAutocompletado(control.signal).catch((fallo: unknown) => {
      if (control.signal.aborted) return;
      setError({ mensaje: mensajeDelIngreso(fallo) });
    });
    return () => {
      control.abort();
    };
  }, []);

  async function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    setSinConfirmar(false);
    if (!MAIL.test(email)) {
      setError({ campo: 'email', mensaje: m.iniciarSesion.escribiUnMailValido });
      return;
    }
    if (contrasena === '') {
      setError({ campo: 'contrasena', mensaje: m.iniciarSesion.escribiTuContrasena });
      return;
    }

    setEntrando(true);
    setError(undefined);
    try {
      await entrar(email, contrasena);
      anotarIngresoConContrasena();
    } catch (fallo) {
      setError({ mensaje: mensajeDelIngreso(fallo) });
      setSinConfirmar(codigoDeAcceso(fallo) === 'email_not_confirmed');
    } finally {
      setEntrando(false);
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
        etiqueta={m.iniciarSesion.email}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username webauthn"
        value={email}
        error={error?.campo === 'email' ? error.mensaje : undefined}
        onChange={(evento) => {
          setEmail(evento.target.value);
        }}
        placeholder={m.iniciarSesion.ejemploDeMail}
      />
      <CampoDeContrasena
        etiqueta={m.iniciarSesion.contrasena}
        name="password"
        autoComplete="current-password"
        accesorio={olvido}
        value={contrasena}
        error={error?.campo === 'contrasena' ? error.mensaje : undefined}
        onChange={(evento) => {
          setContrasena(evento.target.value);
        }}
      />
      {error !== undefined && error.campo === undefined && (
        <div className="flex flex-col gap-2.5">
          <p role="alert" className="text-label leading-relaxed font-medium text-alerta">
            {error.mensaje}
          </p>
          {sinConfirmar && <ReenvioDeConfirmacion email={email} />}
        </div>
      )}
      <Button type="submit" size="grande" cargando={entrando} className="mt-1 w-full">
        {entrando ? m.iniciarSesion.entrando : m.iniciarSesion.entrar}
      </Button>
    </form>
  );
}
