import { TINTA, type TintaDeTesoro } from '@/shared/lib';
import { Icono, type NombreDeIcono } from '@/shared/ui';

export interface ChipDelTesoroProps {
  tesoro: { tinta: TintaDeTesoro; icono: NombreDeIcono };
  tamano?: 'normal' | 'grande';
}

export function ChipDelTesoro({ tesoro, tamano = 'normal' }: ChipDelTesoroProps) {
  const tinta = TINTA[tesoro.tinta];
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center ${tinta.tinte} ${tinta.texto} ${
        tamano === 'grande' ? 'size-10 rounded-field' : 'size-7 rounded-control'
      }`}
    >
      <Icono nombre={tesoro.icono} tamano={tamano === 'grande' ? 20 : 16} />
    </span>
  );
}

export interface CantoDelTesoroProps {
  tinta: TintaDeTesoro;
  punteado?: boolean;
}

export function CantoDelTesoro({ tinta, punteado = false }: CantoDelTesoroProps) {
  return (
    <span
      aria-hidden
      className={`absolute inset-x-0 bottom-0 h-[5px] ${punteado ? 'opacity-40' : ''} ${TINTA[tinta].fondo}`}
    />
  );
}
