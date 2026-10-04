import { useReplicaDelTaller } from '@/entities/replica';
import { PantallaDeLaFacturacion } from '@/features/configurar-taller';
import { ajustesDe } from '@/shared/api';

export function FacturacionPage() {
  const ajustes = ajustesDe(useReplicaDelTaller());
  if (!ajustes) return null;
  return <PantallaDeLaFacturacion key={ajustes.id} ajustes={ajustes} />;
}
