import {
  claveBancariaDe,
  formatearCbu,
  seOfrece,
  type ComoPagar as Como,
  type FormasEnUnaMoneda,
  type ImporteEnLaOtraMoneda,
  type Moneda,
  type PagoEnLaOtraMoneda,
} from '@maun/domain';
import { useId, type ReactNode } from 'react';

import {
  plataParaElBanco,
  useFormatosDelCliente,
  useMensajesDelCliente,
} from '@/shared/idioma-del-cliente';
import { DatoCopiable, Icono, LogoDeMercadoPago } from '@/shared/ui';

export interface ComoPagarProps {
  como: Como | null;
  hoy: string;
  id?: string;
}

const NOTA = 'mt-1.5 text-label leading-relaxed text-text-2';

function DespuesViene({
  siguiente,
  moneda,
}: {
  siguiente: NonNullable<Como['siguiente']>;
  moneda: Moneda;
}) {
  const { comoPagar } = useMensajesDelCliente().vista;
  const f = useFormatosDelCliente();
  return (
    <p className="mt-2.5 border-t border-hairline-soft pt-2.5 text-label leading-normal text-text-2">
      {siguiente.monto === null
        ? comoPagar.despues(siguiente.nombre, siguiente.comoSePaga)
        : comoPagar.despuesConElImporte(
            siguiente.nombre,
            f.plata(siguiente.monto, moneda),
            siguiente.comoSePaga,
          )}
    </p>
  );
}

function PorMercadoPago({ link, texto }: { link: string; texto: string }) {
  const { comoPagar } = useMensajesDelCliente().vista;
  return (
    <div className="mt-2.5 border-t border-hairline-soft pt-2.5">
      <p className="text-label leading-relaxed text-text-2">{texto}</p>
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

function ImporteQueToca({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline-soft py-2.5 first:border-t-0">
      <span className="min-w-0 flex-1">
        <span className="block text-label text-text-2">{etiqueta}</span>
        <span
          translate="no"
          className="block text-money-lg leading-tight font-semibold break-all tabular-nums"
        >
          {valor}
        </span>
      </span>
    </div>
  );
}

function LaCuenta({ formas }: { formas: FormasEnUnaMoneda }) {
  const { comoPagar } = useMensajesDelCliente().vista;
  if (!formas.transferencia) return null;
  const { cuenta } = formas;
  const clave = cuenta.cbu === null ? null : claveBancariaDe(cuenta.cbu);
  return (
    <>
      {cuenta.alias !== null && (
        <DatoCopiable
          etiqueta={comoPagar.alias}
          valor={cuenta.alias}
          nombre={comoPagar.copiarElAlias}
        />
      )}
      {cuenta.cbu !== null && (
        <DatoCopiable
          etiqueta={clave === 'cvu' ? comoPagar.cvu : comoPagar.cbu}
          valor={formatearCbu(cuenta.cbu)}
          paraCopiar={cuenta.cbu}
          nombre={clave === 'cvu' ? comoPagar.copiarElCvu : comoPagar.copiarElCbu}
        />
      )}
      {cuenta.titular !== null && (
        <DatoCopiable
          etiqueta={comoPagar.titular}
          valor={cuenta.titular}
          nombre={comoPagar.copiarElTitular}
        />
      )}
      {cuenta.cuit !== null && (
        <DatoCopiable
          etiqueta={comoPagar.cuit}
          valor={cuenta.cuit}
          nombre={comoPagar.copiarElCuit}
        />
      )}
    </>
  );
}

function ComoSeHace({
  formas,
  pasos,
  oPorMercadoPago,
}: {
  formas: FormasEnUnaMoneda;
  pasos: string;
  oPorMercadoPago: string;
}) {
  const { comoPagar } = useMensajesDelCliente().vista;
  const { cuenta } = formas;
  return (
    <>
      {formas.transferencia && (
        <p className="mt-2.5 text-label leading-relaxed text-text-2">{pasos}</p>
      )}

      {formas.transferencia && (cuenta.titular !== null || cuenta.cuit !== null) && (
        <p className={NOTA}>{comoPagar.fijateQueSeaEsta}</p>
      )}

      {formas.faltanLosDatos && <p className={NOTA}>{comoPagar.pedileLosDatos}</p>}

      {formas.link !== null && <PorMercadoPago link={formas.link} texto={oPorMercadoPago} />}

      {formas.efectivo && <p className={NOTA}>{formas.enEfectivo}</p>}
    </>
  );
}

function Logo({ formas }: { formas: FormasEnUnaMoneda }) {
  if (!formas.mercadoPago) return null;
  return <LogoDeMercadoPago decorativo={formas.link !== null} className="-my-1" />;
}

function useNotaDeLaOtraMoneda(importe: ImporteEnLaOtraMoneda): string {
  const { comoPagar } = useMensajesDelCliente().vista;
  const f = useFormatosDelCliente();
  switch (importe.situacion) {
    case 'convertido':
      return comoPagar.hoySon(f.pesos(importe.monto), f.pesos(importe.cotizacion));
    case 'te-lo-pasa-el-taller':
      return comoPagar.teLoPasaElTaller;
    case 'lo-acordas-con-el-taller':
      return comoPagar.loAcordasConElTaller;
  }
}

function EnLaOtraMoneda({ otra, pasos }: { otra: PagoEnLaOtraMoneda; pasos: string }) {
  const { comoPagar } = useMensajesDelCliente().vista;
  const { importe } = otra;
  const nota = useNotaDeLaOtraMoneda(importe);
  const convertido = importe.situacion === 'convertido' ? importe : null;
  return (
    <>
      <p className="mt-1.5 text-body leading-relaxed text-pretty text-text-2">{nota}</p>

      {(convertido !== null || otra.transferencia) && (
        <div className="mt-1.5">
          {convertido !== null && (
            <DatoCopiable
              etiqueta={comoPagar.hoyEnPesos}
              valor={plataParaElBanco(convertido.monto, otra.moneda)}
              paraCopiar={convertido.montoParaPegar}
              nombre={comoPagar.copiarElMontoEnPesos}
            />
          )}
          <LaCuenta formas={otra} />
        </div>
      )}

      <ComoSeHace
        formas={otra}
        pasos={pasos}
        oPorMercadoPago={
          convertido === null
            ? comoPagar.oPorMercadoPagoSinElMonto
            : comoPagar.oPorMercadoPagoEnPesos
        }
      />
    </>
  );
}

function EnUnaMoneda({
  titulo,
  formas,
  children,
}: {
  titulo: string;
  formas: FormasEnUnaMoneda;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="mt-3.5 border-t border-hairline-soft pt-3.5">
      <div className="flex items-center justify-between gap-3">
        <h3 id={id} className="text-body font-semibold">
          {titulo}
        </h3>
        <Logo formas={formas} />
      </div>
      {children}
    </div>
  );
}

function ElQueToca({ como }: { como: Como }) {
  const { comoPagar } = useMensajesDelCliente().vista;
  if (como.monto === null || como.montoParaPegar === null) return null;
  return (
    <DatoCopiable
      etiqueta={como.etiquetaDelImporte}
      valor={plataParaElBanco(como.monto, como.moneda)}
      paraCopiar={como.montoParaPegar}
      nombre={comoPagar.copiarElMonto}
      destacado
    />
  );
}

function Seccion({
  id,
  titulo,
  logo,
  children,
}: {
  id: string | undefined;
  titulo: string;
  logo: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-label={titulo}
      className="relative scroll-mt-4 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-section font-semibold">{titulo}</h2>
        {logo}
      </div>
      {children}
    </section>
  );
}

export function ComoPagar({ como, hoy, id }: ComoPagarProps) {
  const { comoPagar } = useMensajesDelCliente().vista;
  const f = useFormatosDelCliente();
  if (como === null) return null;

  const otra =
    como.enLaOtraMoneda !== null && seOfrece(como.enLaOtraMoneda) ? como.enLaOtraMoneda : null;
  const enSuMoneda = seOfrece(como);
  if (como.vencio === null && !enSuMoneda && otra === null) return null;

  const despues = como.siguiente !== null && (
    <DespuesViene siguiente={como.siguiente} moneda={como.moneda} />
  );

  if (otra === null) {
    return (
      <Seccion id={id} titulo={como.titulo} logo={<Logo formas={como} />}>
        {como.vencio !== null && <ElPresupuestoVencio vencio={como.vencio} hoy={hoy} />}

        <div className="mt-1.5">
          <ElQueToca como={como} />
          <LaCuenta formas={como} />
        </div>

        <ComoSeHace formas={como} pasos={como.pasos} oPorMercadoPago={comoPagar.oPorMercadoPago} />

        {despues}
      </Seccion>
    );
  }

  if (!enSuMoneda) {
    return (
      <Seccion id={id} titulo={como.titulo} logo={<Logo formas={otra} />}>
        {como.monto !== null && (
          <div className="mt-1.5">
            <ImporteQueToca
              etiqueta={como.etiquetaDelImporte}
              valor={f.plata(como.monto, como.moneda)}
            />
          </div>
        )}

        <EnLaOtraMoneda otra={otra} pasos={como.pasos} />

        {despues}
      </Seccion>
    );
  }

  return (
    <Seccion id={id} titulo={como.titulo} logo={null}>
      {como.monto !== null && (
        <div className="mt-1.5">
          <ElQueToca como={como} />
        </div>
      )}

      <EnUnaMoneda titulo={comoPagar.enMoneda[como.moneda]} formas={como}>
        {como.transferencia && (
          <div className="mt-1.5">
            <LaCuenta formas={como} />
          </div>
        )}
        <ComoSeHace formas={como} pasos={como.pasos} oPorMercadoPago={comoPagar.oPorMercadoPago} />
      </EnUnaMoneda>

      <EnUnaMoneda titulo={comoPagar.enMoneda[otra.moneda]} formas={otra}>
        <EnLaOtraMoneda otra={otra} pasos={como.pasos} />
      </EnUnaMoneda>

      {despues}
    </Seccion>
  );
}
