import { useEffect, useRef, useState } from 'react';

import { useSesionActiva } from '@/entities/sesion';
import { mensajes, useMensajes } from '@/shared/idioma';
import { avisarEnPantalla, huellaDisponible, olvidarBloqueo, useBloqueoActivo } from '@/shared/lib';
import { Button, Icono } from '@/shared/ui';

import { activarHuella } from '../model/activar';

export function AjusteDeHuella() {
  const m = useMensajes();
  const { usuarioId } = useSesionActiva();
  const activo = useBloqueoActivo(usuarioId);
  const [disponible, setDisponible] = useState<boolean | undefined>(undefined);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const pedidos = useRef(new Set<AbortController>());

  useEffect(() => {
    let vigente = true;
    void huellaDisponible().then((hay) => {
      if (vigente) setDisponible(hay);
    });
    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    const vivos = pedidos.current;
    return () => {
      for (const pedido of vivos) pedido.abort();
    };
  }, []);

  async function activar(): Promise<void> {
    const pedido = new AbortController();
    pedidos.current.add(pedido);
    setActivando(true);
    setError(undefined);
    const resultado = await activarHuella(usuarioId, pedido.signal);
    pedidos.current.delete(pedido);
    setActivando(false);
    if (resultado.tipo === 'interrumpida') return;
    if (resultado.tipo === 'no-se-pudo') {
      setError(resultado.mensaje);
      return;
    }
    avisarEnPantalla({ clave: 'huella', tono: 'hecho', texto: mensajes().activarHuella.listo });
  }

  function desactivar(): void {
    olvidarBloqueo();
    setError(undefined);
    avisarEnPantalla({ clave: 'huella', tono: 'hecho', texto: m.activarHuella.yaNoLaPide });
  }

  let descripcion = m.activarHuella.seAbreSinPedirNada;
  if (disponible === undefined) descripcion = m.activarHuella.fijandonos;
  if (disponible === false) descripcion = m.activarHuella.sinHuella;
  if (activo) descripcion = m.activarHuella.conElBloqueo;

  return (
    <div className="flex flex-col items-start gap-2.5">
      <p className="text-body leading-relaxed text-text-2">{descripcion}</p>
      {activo ? (
        <Button variant="secundario" size="chico" onClick={desactivar}>
          {m.activarHuella.dejarDePedirla}
        </Button>
      ) : (
        disponible === true && (
          <Button
            variant="secundario"
            size="chico"
            cargando={activando}
            onClick={() => {
              void activar();
            }}
          >
            {!activando && <Icono nombre="fingerprint" tamano={18} />}
            {activando ? m.activarHuella.registrando : m.activarHuella.pedirlaAlAbrir}
          </Button>
        )
      )}
      {error !== undefined && (
        <p role="alert" className="text-label leading-relaxed font-medium text-alerta">
          {error}
        </p>
      )}
    </div>
  );
}
