import { useMensajes } from '@/shared/idioma';
import {
  Button,
  FilaDeAcciones,
  Ilustracion,
  TarjetaConLamina,
  TITULO_DE_LAMINA,
} from '@/shared/ui';

export interface BienvenidaProps {
  alEditar: () => void;
  alEntender: () => void;
  puedeEditar: boolean;
  apilada?: boolean;
}

export function Bienvenida({ alEditar, alEntender, puedeEditar, apilada = true }: BienvenidaProps) {
  const textos = useMensajes().paginaTesoros.bienvenida;
  return (
    <TarjetaConLamina
      aria-label={textos.etiqueta}
      apilada={apilada}
      dibujo={<Ilustracion nombre="la-fila" />}
      lamina="[&>svg]:w-56"
      className={apilada ? '' : 'shadow-float'}
    >
      <h2 className={TITULO_DE_LAMINA}>{textos.titulo}</h2>
      <p className="text-body leading-relaxed text-text-2">{textos.texto}</p>
      <div className="w-full pt-1">
        <FilaDeAcciones>
          <Button disabled={!puedeEditar} onClick={alEditar}>
            {textos.editarLaFila}
          </Button>
          <Button variant="secundario" onClick={alEntender}>
            {textos.entendido}
          </Button>
        </FilaDeAcciones>
      </div>
    </TarjetaConLamina>
  );
}
