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
  return (
    <TarjetaConLamina
      aria-label="La fila, la primera vez"
      apilada={apilada}
      dibujo={<Ilustracion nombre="la-fila" />}
      lamina="[&>svg]:w-56"
      className={apilada ? '' : 'shadow-float'}
    >
      <h2 className={TITULO_DE_LAMINA}>Cada cobro baja por la fila</h2>
      <p className="text-body leading-relaxed text-text-2">
        La armamos con lo que tenías en Ajustes: primero el diezmo, después tu sueldo y los costos
        fijos, y lo que sobra queda en Maun. Ahora podés sumar tesoros, ordenar los topes y repartir
        lo que sobra.
      </p>
      <div className="w-full pt-1">
        <FilaDeAcciones>
          <Button disabled={!puedeEditar} onClick={alEditar}>
            Editar la fila
          </Button>
          <Button variant="secundario" onClick={alEntender}>
            Entendido
          </Button>
        </FilaDeAcciones>
      </div>
    </TarjetaConLamina>
  );
}
