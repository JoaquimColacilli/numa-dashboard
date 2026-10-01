import { useReplicaDelTaller } from '@/entities/replica';
import { PantallaDelPresupuestoDelTaller } from '@/features/configurar-taller';
import { ajustesDe, householdDe } from '@/shared/api';
import { nombreDelTaller } from '@/shared/lib';

export function PresupuestoDelTallerPage() {
  const replica = useReplicaDelTaller();
  const household = householdDe(replica);
  const ajustes = ajustesDe(replica);
  if (!household || !ajustes) return null;
  return (
    <PantallaDelPresupuestoDelTaller
      key={ajustes.id}
      nombreDelTaller={nombreDelTaller(household.nombre)}
      ajustes={ajustes}
    />
  );
}
