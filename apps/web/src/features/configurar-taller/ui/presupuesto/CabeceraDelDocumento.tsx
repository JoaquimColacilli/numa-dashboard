export function CabeceraDelDocumento({ nombre }: { nombre: string }) {
  return (
    <div
      translate="no"
      className="flex flex-col items-start gap-2.5 @min-[16rem]/membrete:flex-row @min-[16rem]/membrete:justify-between @min-[16rem]/membrete:gap-4"
    >
      <div className="flex min-w-0 flex-col">
        <p className="font-display text-body-lg leading-tight">{nombre}</p>
        <p className="text-meta text-text-3">Muebles a medida</p>
      </div>
      <div aria-hidden className="flex flex-none items-center gap-2">
        <span className="rotulo-del-plano w-[5.75rem] text-badge leading-tight font-semibold text-text-2 uppercase @min-[16rem]/membrete:text-right">
          Documento no válido como factura
        </span>
        <span className="flex size-8 flex-none items-center justify-center rounded-[4px] border-[1.5px] border-ink text-body-lg leading-none font-semibold">
          X
        </span>
      </div>
    </div>
  );
}
