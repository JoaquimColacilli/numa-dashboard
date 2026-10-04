import { comprobantesDelTaller } from '@/entities/factura';
import { useReplicaDelTaller } from '@/entities/replica';
import { ajustesDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';

import { facturacionDelTaller } from '../model/taller';
import { ListaDePagos, type ListaDePagosProps } from './ListaDePagos';

export function CobrosYFacturas(props: ListaDePagosProps) {
  const m = useMensajes().facturacion;
  const replica = useReplicaDelTaller();
  const { pagos } = props;
  if (pagos.length === 0) return null;
  const ids = new Set(pagos.map((pago) => pago.id));
  const conFacturasDeVerdad = comprobantesDelTaller(replica).some(
    (comprobante) => comprobante.ambiente === 'produccion' && ids.has(comprobante.pago_id),
  );
  if (!facturacionDelTaller(ajustesDe(replica)).conectado && !conFacturasDeVerdad) return null;
  return (
    <section
      aria-label={m.cobrosYFacturas}
      className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <h2 className="mb-1.5 text-section font-semibold">{m.cobrosYFacturas}</h2>
      <ListaDePagos {...props} />
    </section>
  );
}
