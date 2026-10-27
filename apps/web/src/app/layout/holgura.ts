import { useLayoutEffect, useState, type RefObject } from 'react';

const RESPIRO = 12;

export interface Holgura {
  anclados: number;
  contenido: number;
}

const SIN_HOLGURA: Holgura = { anclados: 0, contenido: 0 };

function seEstaEscribiendo(): boolean {
  const activo = document.activeElement;
  return (
    activo instanceof HTMLElement &&
    (activo.tagName === 'INPUT' || activo.tagName === 'TEXTAREA' || activo.isContentEditable)
  );
}

export function useHolguraInferior(
  pie: HTMLDivElement | null,
  principal: RefObject<HTMLElement | null>,
  conBarra: boolean,
): Holgura {
  const [holgura, setHolgura] = useState(SIN_HOLGURA);

  useLayoutEffect(() => {
    if (!pie) return;
    const contenedor = principal.current;

    const actualizar = () => {
      const caja = pie.getBoundingClientRect();
      const fondoDelContenido = contenedor?.getBoundingClientRect().bottom ?? caja.bottom;
      const anclados = Math.ceil(caja.height) + RESPIRO;
      const medido =
        pie.childElementCount === 0
          ? 0
          : Math.max(0, Math.ceil(fondoDelContenido - caja.top)) + RESPIRO;
      const laBarraSeFue = conBarra && pie.querySelector('[data-barra-inferior]') === null;
      setHolgura((previa) => {
        const contenido =
          seEstaEscribiendo() || laBarraSeFue ? Math.max(previa.contenido, medido) : medido;
        return previa.anclados === anclados && previa.contenido === contenido
          ? previa
          : { anclados, contenido };
      });
    };

    actualizar();
    const observador = 'ResizeObserver' in globalThis ? new ResizeObserver(actualizar) : null;
    observador?.observe(pie, { box: 'border-box' });
    if (contenedor) observador?.observe(contenedor, { box: 'border-box' });
    const alTerminarDeEscribir = () => {
      requestAnimationFrame(actualizar);
    };
    window.addEventListener('resize', actualizar);
    window.addEventListener('orientationchange', actualizar);
    globalThis.visualViewport?.addEventListener('resize', actualizar);
    document.addEventListener('focusout', alTerminarDeEscribir);
    return () => {
      observador?.disconnect();
      window.removeEventListener('resize', actualizar);
      window.removeEventListener('orientationchange', actualizar);
      globalThis.visualViewport?.removeEventListener('resize', actualizar);
      document.removeEventListener('focusout', alTerminarDeEscribir);
      setHolgura(SIN_HOLGURA);
    };
  }, [pie, principal, conBarra]);

  return holgura;
}
