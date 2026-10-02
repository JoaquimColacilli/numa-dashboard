import { claveBancariaDe, formatearCbu, type ComoPagar as Como } from '@maun/domain';

import { useFormatosDelCliente, useMensajesDelCliente } from '@/shared/idioma-del-cliente';
import { DatoCopiable, Icono, LogoDeMercadoPago } from '@/shared/ui';

export interface ComoPagarProps {
  como: Como | null;
  hoy: string;
  id?: string;
}

function DespuesViene({ siguiente }: { siguiente: NonNullable<Como['siguiente']> }) {
  const { comoPagar } = useMensajesDelCliente().vista;
  const f = useFormatosDelCliente();
  return (
    <p className="mt-2.5 border-t border-hairline-soft pt-2.5 text-label leading-normal text-text-2">
      {siguiente.monto === null
        ? comoPagar.despues(siguiente.nombre, siguiente.comoSePaga)
        : comoPagar.despuesConElImporte(
            siguiente.nombre,
            f.pesos(siguiente.monto),
            siguiente.comoSePaga,
          )}
    </p>
  );
}

function PorMercadoPago({ link }: { link: string }) {
  const { comoPagar } = useMensajesDelCliente().vista;
  return (
    <div className="mt-2.5 border-t border-hairline-soft pt-2.5">
      <p className="text-label leading-relaxed text-text-2">{comoPagar.oPorMercadoPago}</p>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex min-h-tap w-full items-center justify-center gap-2 rounded-pill bg-ink px-4 text-body font-semibold text-paper sm:w-auto"
      >
        <Icono nombre="arrow-up-right" tamano={18} />
        {comoPagar.pagarConMercadoPago}
      </a>
    </div>
  );
}

function ElPresupuestoVencio({ vencio, hoy }: { vencio: string; hoy: string }) {
  const { comoPagar } = useMensajesDelCliente().vista;
  const f = useFormatosDelCliente();
  return (
    <p className="mt-2.5 flex items-start gap-2.5 rounded-field bg-atencion-tint px-3.5 py-3 text-body leading-relaxed text-pretty">
      <Icono nombre="triangle-alert" tamano={18} className="mt-[3px] flex-none text-atencion" />
      <span>{comoPagar.vencio(f.fechaLarga(vencio, hoy))}</span>
    </p>
  );
}

export function ComoPagar({ como, hoy, id }: ComoPagarProps) {
  const { comoPagar } = useMensajesDelCliente().vista;
  const f = useFormatosDelCliente();
  if (como === null) return null;
  if (como.vencio === null && !como.transferencia && !como.efectivo && !como.faltanLosDatos) {
    return null;
  }

  const cobro = como.cuenta;
  const clave = cobro.cbu === null ? null : claveBancariaDe(cobro.cbu);

  return (
    <section
      id={id}
      aria-label={como.titulo}
      className="relative scroll-mt-4 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-section font-semibold">{como.titulo}</h2>
        {como.mercadoPago && (
          <LogoDeMercadoPago decorativo={como.link !== null} className="-my-1" />
        )}
      </div>

      {como.vencio !== null && <ElPresupuestoVencio vencio={como.vencio} hoy={hoy} />}

      <div className="mt-1.5">
        {como.monto !== null && como.montoParaPegar !== null && (
          <DatoCopiable
            etiqueta={como.etiquetaDelImporte}
            valor={f.pesosParaElBanco(como.monto)}
            paraCopiar={como.montoParaPegar}
            nombre={comoPagar.copiarElMonto}
            destacado
          />
        )}

        {como.transferencia && (
          <>
            {cobro.alias !== null && (
              <DatoCopiable
                etiqueta={comoPagar.alias}
                valor={cobro.alias}
                nombre={comoPagar.copiarElAlias}
              />
            )}
            {cobro.cbu !== null && (
              <DatoCopiable
                etiqueta={clave === 'cvu' ? comoPagar.cvu : comoPagar.cbu}
                valor={formatearCbu(cobro.cbu)}
                paraCopiar={cobro.cbu}
                nombre={clave === 'cvu' ? comoPagar.copiarElCvu : comoPagar.copiarElCbu}
              />
            )}
            {cobro.titular !== null && (
              <DatoCopiable
                etiqueta={comoPagar.titular}
                valor={cobro.titular}
                nombre={comoPagar.copiarElTitular}
              />
            )}
            {cobro.cuit !== null && (
              <DatoCopiable
                etiqueta={comoPagar.cuit}
                valor={cobro.cuit}
                nombre={comoPagar.copiarElCuit}
              />
            )}
          </>
        )}
      </div>

      {como.transferencia && (
        <p className="mt-2.5 text-label leading-relaxed text-text-2">{como.pasos}</p>
      )}

      {como.transferencia && (cobro.titular !== null || cobro.cuit !== null) && (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">
          {comoPagar.fijateQueSeaEsta}
        </p>
      )}

      {como.faltanLosDatos && (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">{comoPagar.pedileLosDatos}</p>
      )}

      {como.link !== null && <PorMercadoPago link={como.link} />}

      {como.efectivo && (
        <p className="mt-1.5 text-label leading-relaxed text-text-2">{como.enEfectivo}</p>
      )}

      {como.siguiente !== null && <DespuesViene siguiente={como.siguiente} />}
    </section>
  );
}
