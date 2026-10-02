import { MONEDA_DEL_TALLER, type Moneda } from '@maun/domain';
import { MoneyInput as CampoDeLaUi, type MoneyInputProps as PropsDelCampo } from '@maun/ui';

import {
  adornosDelCampo,
  marcadorDelCampo,
  separadoresDelCampo,
  useIdiomaEnUso,
} from '@/shared/lib';

export interface MoneyInputProps extends Omit<PropsDelCampo, 'separadores'> {
  moneda?: Moneda;
  conMarcador?: boolean;
}

export function MoneyInput({
  moneda = MONEDA_DEL_TALLER,
  conMarcador = false,
  placeholder,
  ...props
}: MoneyInputProps) {
  const { idioma } = useIdiomaEnUso();
  return (
    <CampoDeLaUi
      {...props}
      placeholder={conMarcador ? marcadorDelCampo(moneda, idioma) : placeholder}
      separadores={separadoresDelCampo(idioma)}
    />
  );
}

export interface AdornoDePlataProps {
  moneda?: Moneda;
  lado?: 'antes' | 'despues';
  className?: string;
}

export function AdornoDePlata({
  moneda = MONEDA_DEL_TALLER,
  lado = 'antes',
  className,
}: AdornoDePlataProps) {
  const { idioma } = useIdiomaEnUso();
  const adorno = adornosDelCampo(moneda, idioma)[lado];
  if (adorno === '') return null;
  return (
    <span aria-hidden translate="no" className={className}>
      {adorno}
    </span>
  );
}
