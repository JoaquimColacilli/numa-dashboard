import { useState, type SyntheticEvent } from 'react';

import { cambiarContrasena, mensajeDeAcceso } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { marcarDesbloqueada } from '@/shared/lib';
import { Button, CampoDeContrasena } from '@/shared/ui';

const LARGO_MINIMO = 6;

export function FormularioDeNuevaContrasena({ alCambiar }: { alCambiar: () => void }) {
  const m = useMensajes();
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState<{ campo?: 'contrasena'; mensaje: string } | undefined>(
    undefined,
  );
  const [guardando, setGuardando] = useState(false);

  async function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (contrasena.length < LARGO_MINIMO) {
      setError({
        campo: 'contrasena',
        mensaje: m.recuperarAcceso.contrasenaCorta({ minimo: LARGO_MINIMO }),
      });
      return;
    }

    setGuardando(true);
    setError(undefined);
    try {
      await cambiarContrasena(contrasena);
      marcarDesbloqueada();
      alCambiar();
    } catch (fallo) {
      setError({ mensaje: mensajeDeAcceso(fallo) });
      setGuardando(false);
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
      <CampoDeContrasena
        etiqueta={m.recuperarAcceso.contrasenaNueva}
        name="new-password"
        autoComplete="new-password"
        ayuda={m.recuperarAcceso.alMenos({ minimo: LARGO_MINIMO })}
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
      <Button type="submit" size="grande" cargando={guardando} className="mt-1 w-full">
        {guardando ? m.recuperarAcceso.guardando : m.recuperarAcceso.guardarLaContrasena}
      </Button>
    </form>
  );
}
