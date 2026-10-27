import { centavos, queEsElTesoro } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useRef, useState, type SyntheticEvent } from 'react';

import { useReplicaDelTaller } from '@/entities/replica';
import {
  MUTACION_DE_TESORO,
  tesoroPorId,
  tesorosDelTaller,
  type TesoroDelTaller,
} from '@/entities/tesoro';
import { filaDelTaller, filaPorId, type Replica } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { hayCambios, metaDeAvisos } from '@/shared/lib';
import { Button, FilaDeAcciones, Hoja } from '@/shared/ui';

import {
  admiteMeta,
  bajadaDeLaEdicion,
  borradorDe,
  cambiosDelTesoro,
  datosQueSeEditan,
  hayDiferencias,
  hayErrores,
  metaQueVieneDeLosAjustes,
  revisarElTesoro,
  type BorradorDelTesoro,
  type ErroresDelTesoro,
} from '../model/tesoro';
import { CamposDelTesoro } from './CamposDelTesoro';
import { HojaDeAjustarElSaldo } from './HojaDeAjustarElSaldo';
import { HojaDeArchivar } from './HojaDeArchivar';

export interface HojaDeEditarTesoroProps {
  tesoroId: string;
  alCerrar: () => void;
  alCambiarDolares?: (ruta: string) => void;
}

export function HojaDeEditarTesoro({
  tesoroId,
  alCerrar,
  alCambiarDolares,
}: HojaDeEditarTesoroProps) {
  const replica = useReplicaDelTaller();
  const tesoro = tesoroPorId(tesorosDelTaller(replica), tesoroId);
  const [inicial] = useState(() => (tesoro ? borradorDe(tesoro) : null));
  const [borrador, setBorrador] = useState<BorradorDelTesoro | null>(inicial);
  const [archivando, setArchivando] = useState(false);
  const [ajustando, setAjustando] = useState(false);

  if (!tesoro || !inicial || !borrador) return null;

  if (ajustando) {
    return (
      <HojaDeAjustarElSaldo
        tesoro={tesoro}
        alCerrar={alCerrar}
        alVolver={() => {
          setAjustando(false);
        }}
      />
    );
  }

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
      alAjustar={() => {
        setAjustando(true);
      }}
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
  alAjustar: () => void;
  replica: Replica;
}

function FormularioDelTesoro({
  tesoro,
  inicial,
  borrador,
  setBorrador,
  alCerrar,
  alArchivar,
  alAjustar,
  replica,
}: FormularioDelTesoroProps) {
  const m = useMensajes();
  const textos = m.editarTesoro.editar;
  const tesoros = tesorosDelTaller(replica);
  const que = queEsElTesoro(filaDelTaller(replica).fila, {
    id: tesoro.id,
    clave: tesoro.clave,
    meta: tesoro.meta === null ? null : centavos(tesoro.meta.importe),
  });
  const conMeta = admiteMeta(tesoro.clave) && (que === 'caja' || que === 'meta');
  const seArchiva = (tesoro.clave === null || tesoro.clave === 'cocos') && !tesoro.archivado;
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
    const encontrados = revisarElTesoro(borrador);
    setErrores(encontrados);
    if (hayErrores(encontrados)) {
      if (encontrados.nombre !== undefined) campoDelNombre.current?.focus();
      return;
    }

    const fila = filaPorId(replica, 'tesoros', tesoro.id);
    const delTesoro = cambiosDelTesoro(
      datosQueSeEditan(tesoro, fila),
      conMeta,
      borrador,
      metaQueVieneDeLosAjustes(tesoro, fila),
    );
    if (hayDiferencias(delTesoro)) editar.mutate({ id: tesoro.id, ...delTesoro });
    alCerrar();
  }

  return (
    <Hoja
      titulo={tesoro.nombre}
      bajada={bajadaDeLaEdicion(conMeta)}
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
            campoDelNombre={campoDelNombre}
          />
        </div>

        <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
          <FilaDeAcciones>
            {!tesoro.archivado && (
              <Button type="button" variant="secundario" onClick={alAjustar}>
                {m.editarTesoro.ajustar.boton}
              </Button>
            )}
            {seArchiva && (
              <Button type="button" variant="secundario" onClick={alArchivar}>
                {textos.archivar}
              </Button>
            )}
            <Button type="submit">{textos.guardar}</Button>
          </FilaDeAcciones>
        </footer>
      </form>
    </Hoja>
  );
}
