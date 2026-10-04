import { useReplicaDelTaller } from '@/entities/replica';
import { AsistenteDeArca } from '@/features/configurar-taller';
import { ajustesDe } from '@/shared/api';

export function ConectarConArcaPage() {
  const ajustes = ajustesDe(useReplicaDelTaller());
  if (!ajustes) return null;
  return <AsistenteDeArca key={ajustes.id} ajustes={ajustes} />;
}
