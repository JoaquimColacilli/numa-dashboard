import { useMensajes } from '@/shared/idioma';
import { Icono, type NombreDeIcono } from '@/shared/ui';

import { enlaceDeLlamada, enlaceDeWhatsapp } from '../model/contacto';

export interface AccionesDeContactoProps {
  nombre: string;
  telefono: string;
  amplias?: boolean;
}

interface Accion {
  id: string;
  icono: NombreDeIcono;
  etiqueta: string;
  nombreAccesible: string;
  sinTelefono: string;
  href: string | null;
  externo: boolean;
}

export function AccionesDeContacto({ nombre, telefono, amplias = false }: AccionesDeContactoProps) {
  const textos = useMensajes().cliente.contacto;
  const acciones: readonly Accion[] = [
    {
      id: 'llamar',
      icono: 'phone',
      etiqueta: textos.llamar,
      nombreAccesible: textos.llamarA(nombre),
      sinTelefono: textos.llamarASinTelefono(nombre),
      href: enlaceDeLlamada(telefono),
      externo: false,
    },
    {
      id: 'whatsapp',
      icono: 'message-circle',
      etiqueta: textos.whatsapp,
      nombreAccesible: textos.escribirleA(nombre),
      sinTelefono: textos.escribirleASinTelefono(nombre),
      href: enlaceDeWhatsapp(telefono),
      externo: true,
    },
  ];

  const forma = amplias
    ? 'flex min-h-[60px] flex-1 flex-col items-center justify-center gap-1.5 rounded-panel border border-hairline bg-paper text-meta font-medium'
    : 'flex size-11 flex-none items-center justify-center rounded-pill border border-border';

  return (
    <div className={amplias ? 'flex flex-col gap-1.5' : 'flex gap-2'}>
      <div className={amplias ? 'flex gap-2' : 'contents'}>
        {acciones.map((accion) =>
          accion.href === null ? (
            <button
              key={accion.id}
              type="button"
              disabled
              aria-label={accion.sinTelefono}
              title={textos.sinTelefono}
              className={`${forma} cursor-not-allowed text-text-3`}
            >
              <Icono nombre={accion.icono} tamano={amplias ? 20 : 18} />
              {amplias && accion.etiqueta}
            </button>
          ) : (
            <a
              key={accion.id}
              href={accion.href}
              aria-label={accion.nombreAccesible}
              title={accion.nombreAccesible}
              target={accion.externo ? '_blank' : undefined}
              rel={accion.externo ? 'noopener noreferrer' : undefined}
              className={`${forma} text-ink hover:bg-surface`}
            >
              <Icono nombre={accion.icono} tamano={amplias ? 20 : 18} />
              {amplias && accion.etiqueta}
            </a>
          ),
        )}
      </div>
      {amplias && telefono.trim() === '' && (
        <p className="px-1 text-meta text-text-3">{textos.agregaloDesdeEditar}</p>
      )}
    </div>
  );
}
