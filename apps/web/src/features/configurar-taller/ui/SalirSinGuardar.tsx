import { useMensajes } from '@/shared/idioma';
import { useAnchoDePantalla } from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja } from '@/shared/ui';

export function SalirSinGuardar({
  alSeguir,
  alDescartar,
}: {
  alSeguir: () => void;
  alDescartar: () => void;
}) {
  const m = useMensajes().configurarTaller.presupuesto.salir;
  const enCelular = useAnchoDePantalla() === 'movil';
  return (
    <Hoja titulo={m.titulo} rol="alertdialog" desdeAbajo={enCelular} alCerrar={alSeguir}>
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
        <p className="text-body leading-relaxed text-text-2">{m.texto}</p>
        <FilaDeAcciones>
          <Button variant="secundario" onClick={alSeguir}>
            {m.seguirEditando}
          </Button>
          <Button variant="peligro" onClick={alDescartar}>
            {m.descartar}
          </Button>
        </FilaDeAcciones>
      </div>
    </Hoja>
  );
}
