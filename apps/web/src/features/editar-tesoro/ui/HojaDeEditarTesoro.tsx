import { useMutation } from '@tanstack/react-query';
import { useRef, useState, type SyntheticEvent } from 'react';

import { useReplicaDelTaller } from '@/entities/replica';
import {
  MUTACION_DE_TESORO,
  tesoroPorId,
  tesorosDelTaller,
  type TesoroDelTaller,
} from '@/entities/tesoro';
import { ajustesDe, filaPorId, type CambiosDeAjustes, type Replica } from '@/shared/api';
import { hayCambios, metaDeAvisos } from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja } from '@/shared/ui';

import {
  bajadaDeLaEdicion,
  borradorDe,
  cambiosDeCocos,
  cambiosDelTesoro,
  datosQueSeEditan,
  hayDiferencias,
  hayErrores,
  revisarElTesoro,
  type BorradorDelTesoro,
  type ErroresDelTesoro,
} from '../model/tesoro';
import { CamposDelTesoro } from './CamposDelTesoro';
import { HojaDeArchivar } from './HojaDeArchivar';

export interface EdicionDeLoDeCocos {
  id: string;
  cambios: CambiosDeAjustes;
  previos: CambiosDeAjustes;
}

export interface HojaDeEditarTesoroProps {
  tesoroId: string;
  alCerrar: () => void;
  alGuardarLoDeCocos: (edicion: EdicionDeLoDeCocos) => void;
  alCambiarDolares?: (ruta: string) => void;
}

export function HojaDeEditarTesoro({
  tesoroId,
  alCerrar,
  alGuardarLoDeCocos,
  alCambiarDolares,
}: HojaDeEditarTesoroProps) {
  const replica = useReplicaDelTaller();
  const tesoro = tesoroPorId(tesorosDelTaller(replica), tesoroId);
  const [inicial] = useState(() => (tesoro ? borradorDe(tesoro) : null));
  const [borrador, setBorrador] = useState<BorradorDelTesoro | null>(inicial);
  const [archivando, setArchivando] = useState(false);

  if (!tesoro || !inicial || !borrador) return null;

  if (archivando) {
    return (
      <HojaDeArchivar
        tesoroId={tesoro.id}
        alCerrar={alCerrar}
        alVolver={() => {
          setArchivando(false);
        }}
        {...(alCambiarDolares === undefined ? {} : { alCambiarDolares })}
      />
    );
  }

  return (
    <FormularioDelTesoro
      tesoro={tesoro}
      inicial={inicial}
      borrador={borrador}
      setBorrador={setBorrador}
      alCerrar={alCerrar}
      alArchivar={() => {
        setArchivando(true);
      }}
      alGuardarLoDeCocos={alGuardarLoDeCocos}
      replica={replica}
    />
  );
}

interface FormularioDelTesoroProps {
  tesoro: TesoroDelTaller;
  inicial: BorradorDelTesoro;
  borrador: BorradorDelTesoro;
  setBorrador: (cambio: (previo: BorradorDelTesoro | null) => BorradorDelTesoro | null) => void;
  alCerrar: () => void;
  alArchivar: () => void;
  alGuardarLoDeCocos: (edicion: EdicionDeLoDeCocos) => void;
  replica: Replica;
}

function FormularioDelTesoro({
  tesoro,
  inicial,
  borrador,
  setBorrador,
  alCerrar,
  alArchivar,
  alGuardarLoDeCocos,
  replica,
}: FormularioDelTesoroProps) {
  const tesoros = tesorosDelTaller(replica);
  const esCocos = tesoro.clave === 'cocos';
  const conMeta = tesoro.clave === null || esCocos;
  const [errores, setErrores] = useState<ErroresDelTesoro>({});
  const campoDelNombre = useRef<HTMLInputElement>(null);
  const [sujeto] = useState(tesoro.nombre);

  const editar = useMutation({
    ...MUTACION_DE_TESORO,
    meta: metaDeAvisos('tesoroEditado', { sujeto }),
  });

  function cambiar(cambios: Partial<BorradorDelTesoro>) {
    setBorrador((previo) => (previo ? { ...previo, ...cambios } : previo));
    setErrores({});
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>) {
    evento.preventDefault();
    const encontrados = revisarElTesoro(borrador, { conRinde: esCocos });
    setErrores(encontrados);
    if (hayErrores(encontrados)) {
      if (encontrados.nombre !== undefined) campoDelNombre.current?.focus();
      return;
    }

    const delTesoro = cambiosDelTesoro(
      datosQueSeEditan(tesoro, filaPorId(replica, 'tesoros', tesoro.id)),
      tesoro.clave,
      borrador,
    );
    if (hayDiferencias(delTesoro)) editar.mutate({ id: tesoro.id, ...delTesoro });

    const ajustes = ajustesDe(replica);
    if (esCocos && ajustes) {
      const deCocos = cambiosDeCocos(ajustes, borrador);
      if (hayDiferencias(deCocos)) alGuardarLoDeCocos({ id: ajustes.id, ...deCocos });
    }
    alCerrar();
  }

  return (
    <Hoja
      titulo={tesoro.nombre}
      bajada={bajadaDeLaEdicion(tesoro.clave)}
      alCerrar={alCerrar}
      conCambios={hayCambios(inicial, borrador)}
    >
      <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="@container flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5">
          <CamposDelTesoro
            borrador={borrador}
            cambiar={cambiar}
            errores={errores}
            tesoros={tesoros}
            excepto={tesoro.id}
            conMeta={conMeta}
            conRinde={esCocos}
            campoDelNombre={campoDelNombre}
          />
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            {tesoro.clave === null && !tesoro.archivado && (
              <Button type="button" variant="secundario" onClick={alArchivar}>
                Archivar
              </Button>
            )}
            <Button type="submit">Guardar</Button>
          </FilaDeAcciones>
        </footer>
      </form>
    </Hoja>
  );
}
