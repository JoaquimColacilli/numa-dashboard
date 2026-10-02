import { PLANTILLA_DE_SIEMPRE } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';

import type { FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  Ir,
  metaDeAvisos,
  RUTA_DE_AJUSTES,
  useAlgoEnCurso,
  useAnchoDePantalla,
  useVolver,
  uuidv7,
} from '@/shared/lib';
import {
  Button,
  ConSalida,
  FilaDeAcciones,
  Hoja,
  Icono,
  Pagina,
  SeccionEnFila,
  SeccionesEnFilas,
} from '@/shared/ui';

import { MUTACION_DE_AJUSTES } from '../../api/mutacion';
import { MUTACION_DE_LA_PLANTILLA } from '../../api/plantilla';
import {
  borradorDeLaPantalla,
  borradorDeLosAjustes,
  cambiosDeLaPantalla,
  cobroParaUsar,
  cuantosCambios,
  datosDelTaller,
  diferenciasDeLosDatos,
  loQueSeDeshace,
  mismaPlantilla,
  plantillaDelBorrador,
  problemasDeLaPantalla,
  sinLoQuitado,
  textoDeLosCambios,
  valoresDeMuestra,
  type BorradorDeLaPantalla,
  type DatosEditables,
  type FilaEditable,
  type FormaEditable,
  type GrupoDeClausulas,
  type NumerosEditables,
  type ProblemaDeLaPantalla,
} from '../../model/presupuestoDelTaller';
import { BarraDeGuardado } from './BarraDeGuardado';
import { DatosDelPresupuesto } from './DatosDelPresupuesto';
import { FormasDePago } from './FormasDePago';
import { GarantiaDelPresupuesto } from './GarantiaDelPresupuesto';
import { ListaDeClausulas } from './ListaDeClausulas';
import { LosTextosDeSiempre } from './LosTextosDeSiempre';
import { NumerosDelPresupuesto } from './NumerosDelPresupuesto';
import { BajadaConUbicacion, type LugarEnElPresupuesto } from './piezas';

const GARANTIA = 'garantia';

interface LoGuardado {
  borrador: BorradorDeLaPantalla;
  version: number;
}

function Bajada({ lugar, children }: { lugar: LugarEnElPresupuesto; children: ReactNode }) {
  return <BajadaConUbicacion lugar={lugar}>{children}</BajadaConUbicacion>;
}

function SalirSinGuardar({
  alSeguir,
  alDescartar,
}: {
  alSeguir: () => void;
  alDescartar: () => void;
}) {
  const m = useMensajes().configurarTaller.presupuesto.salir;
  const enCelular = useAnchoDePantalla() === 'movil';
  return (
    <Hoja titulo={m.titulo} rol="alertdialog" desdeAbajo={enCelular} alCerrar={alSeguir}>
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
        <p className="text-body leading-relaxed text-text-2">{m.texto}</p>
        <FilaDeAcciones>
          <Button variant="secundario" onClick={alSeguir}>
            {m.seguirEditando}
          </Button>
          <Button variant="peligro" onClick={alDescartar}>
            {m.descartar}
          </Button>
        </FilaDeAcciones>
      </div>
    </Hoja>
  );
}

export interface PantallaDelPresupuestoDelTallerProps {
  nombreDelTaller: string;
  ajustes: FilaDe<'ajustes'>;
}

export function PantallaDelPresupuestoDelTaller({
  nombreDelTaller,
  ajustes,
}: PantallaDelPresupuestoDelTallerProps) {
  const m = useMensajes().configurarTaller.presupuesto;
  const vuelta = useVolver(RUTA_DE_AJUSTES, m.ajustes);
  const [guardado, setGuardado] = useState<LoGuardado>(() => ({
    borrador: borradorDeLosAjustes(ajustes, nombreDelTaller),
    version: ajustes.plantilla_del_presupuesto_version,
  }));
  const [borrador, setBorrador] = useState(guardado.borrador);
  const [abierta, setAbierta] = useState<string | null>(null);
  const [recienAgregada, setRecienAgregada] = useState<string | null>(null);
  const [problemas, setProblemas] = useState<readonly ProblemaDeLaPantalla[]>([]);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  const guardarLosDatos = useMutation({
    ...MUTACION_DE_AJUSTES,
    meta: metaDeAvisos('presupuestoDelTaller'),
  });
  const guardarLosDatosCallado = useMutation({
    ...MUTACION_DE_AJUSTES,
    meta: metaDeAvisos('presupuestoDelTaller', { silencioso: true }),
  });
  const guardarLosTextos = useMutation({
    ...MUTACION_DE_LA_PLANTILLA,
    meta: metaDeAvisos('presupuestoDelTaller'),
  });

  const cambios = cambiosDeLaPantalla(borrador, guardado.borrador);
  useAlgoEnCurso(cambios.hay);

  useEffect(() => {
    if (!cambios.hay) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
    };
    window.addEventListener('beforeunload', avisar);
    return () => {
      window.removeEventListener('beforeunload', avisar);
    };
  }, [cambios.hay]);

  const valores = valoresDeMuestra(borrador.numeros, guardado.borrador.numeros, ajustes);
  const porCampo: Readonly<Record<string, string>> = Object.fromEntries(
    problemas.map(({ campo, mensaje }) => [campo, mensaje]),
  );
  const aDeshacer = loQueSeDeshace(plantillaDelBorrador(guardado.borrador), valores);
  const cobro = cobroParaUsar(ajustes);

  function cambiar(cambio: (previo: BorradorDeLaPantalla) => BorradorDeLaPantalla): void {
    setBorrador((previo) => {
      const siguiente = cambio(previo);
      if (intentoGuardar) setProblemas(problemasDeLaPantalla(siguiente));
      return siguiente;
    });
  }

  function abrir(id: string | null): void {
    setAbierta(id);
    setRecienAgregada(null);
  }

  function cambiarLaLista(grupo: GrupoDeClausulas, filas: FilaEditable[]): void {
    cambiar((previo) => ({ ...previo, listas: { ...previo.listas, [grupo]: filas } }));
  }

  function agregar(grupo: GrupoDeClausulas): void {
    const id = uuidv7();
    const nueva: FilaEditable = {
      id,
      titulo: '',
      texto: '',
      tildadaPorDefecto: grupo !== 'aTenerEnCuenta',
      quitada: false,
    };
    cambiar((previo) => ({
      ...previo,
      listas: { ...previo.listas, [grupo]: [...previo.listas[grupo], nueva] },
    }));
    setAbierta(id);
    setRecienAgregada(id);
  }

  function agregarForma(): void {
    const id = uuidv7();
    const nueva: FormaEditable = { id, nombre: '', texto: '', quitada: false };
    cambiar((previo) => ({ ...previo, formas: [...previo.formas, nueva] }));
    setAbierta(id);
    setRecienAgregada(id);
  }

  function irAlPrimerProblema(primero: ProblemaDeLaPantalla): void {
    const [tipo, id] = primero.campo.split(':');
    if ((tipo === 'texto' || tipo === 'nombre') && id !== undefined) setAbierta(id);
    if (primero.campo === 'texto-de-la-garantia') setAbierta(GARANTIA);
    requestAnimationFrame(() => {
      const invalido = document.querySelector<HTMLElement>(
        'main [aria-invalid="true"], main [data-abierta] [role="textbox"]',
      );
      invalido?.focus({ preventScroll: true });
      invalido?.scrollIntoView({ block: 'center' });
    });
  }

  function guardar(): void {
    const encontrados = problemasDeLaPantalla(borrador);
    setIntentoGuardar(true);
    setProblemas(encontrados);
    const [primero] = encontrados;
    if (primero !== undefined) {
      irAlPrimerProblema(primero);
      return;
    }

    const antes = guardado;
    const limpio = sinLoQuitado(borrador);
    const datos = diferenciasDeLosDatos(ajustes, limpio.datos);
    const hayDatos = Object.keys(datos.cambios).length > 0;
    const hayTextos = !mismaPlantilla(limpio, antes.borrador);

    if (hayTextos) {
      guardarLosTextos.mutate(
        {
          ajustesId: ajustes.id,
          version: antes.version,
          plantilla: plantillaDelBorrador(limpio),
          previa: {
            plantilla_del_presupuesto: ajustes.plantilla_del_presupuesto,
            plantilla_del_presupuesto_version: ajustes.plantilla_del_presupuesto_version,
          },
        },
        {
          onError: () => {
            setGuardado((actual) => ({
              borrador: { ...antes.borrador, datos: actual.borrador.datos },
              version: antes.version,
            }));
          },
        },
      );
    }
    if (hayDatos) {
      const conAviso = hayTextos ? guardarLosDatosCallado : guardarLosDatos;
      conAviso.mutate(
        { id: ajustes.id, cambios: datos.cambios, previos: datos.previos },
        {
          onError: () => {
            setGuardado((actual) => ({
              ...actual,
              borrador: { ...actual.borrador, datos: antes.borrador.datos },
            }));
          },
        },
      );
    }

    setGuardado({ borrador: limpio, version: hayTextos ? antes.version + 1 : antes.version });
    setBorrador(limpio);
    setAbierta(null);
    setIntentoGuardar(false);
  }

  function volverALosDeSiempre(): void {
    const antes = guardado;
    const deSiempre = borradorDeLaPantalla(
      datosDelTaller(ajustes, nombreDelTaller),
      PLANTILLA_DE_SIEMPRE,
    );
    guardarLosTextos.mutate(
      {
        ajustesId: ajustes.id,
        version: antes.version,
        plantilla: null,
        previa: {
          plantilla_del_presupuesto: ajustes.plantilla_del_presupuesto,
          plantilla_del_presupuesto_version: ajustes.plantilla_del_presupuesto_version,
        },
      },
      {
        onError: () => {
          setGuardado((actual) => ({
            borrador: { ...antes.borrador, datos: actual.borrador.datos },
            version: antes.version,
          }));
        },
      },
    );
    setGuardado({
      borrador: { ...deSiempre, datos: antes.borrador.datos },
      version: antes.version + 1,
    });
    setBorrador((actual) => ({ ...deSiempre, datos: actual.datos }));
    setAbierta(null);
    setProblemas([]);
    setIntentoGuardar(false);
  }

  const lista = (grupo: GrupoDeClausulas, lugar: LugarEnElPresupuesto) => (
    <SeccionEnFila
      id={`titulo-${grupo}`}
      titulo={m.grupos[grupo].titulo}
      bajada={
        <Bajada lugar={lugar}>
          <p>{m.grupos[grupo].dondeVa}</p>
          <p>{m.grupos[grupo].tildadas}</p>
        </Bajada>
      }
    >
      <ListaDeClausulas
        grupo={grupo}
        filas={borrador.listas[grupo]}
        guardadas={guardado.borrador.listas[grupo]}
        valores={valores}
        abierta={abierta}
        recienAgregada={recienAgregada}
        problemas={porCampo}
        alAbrir={abrir}
        alCambiarLaLista={(filas) => {
          cambiarLaLista(grupo, filas);
        }}
        alAgregar={() => {
          agregar(grupo);
        }}
      />
    </SeccionEnFila>
  );

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex flex-col items-start gap-1.5">
        <Ir
          a={RUTA_DE_AJUSTES}
          alTocar={() => {
            if (cambios.hay) {
              setSaliendo(true);
              return;
            }
            vuelta.volver();
          }}
          className="-ml-1 flex min-h-tap items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
        >
          <Icono nombre="chevron-left" tamano={20} />
          {vuelta.etiqueta}
        </Ir>
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{m.titulo}</h1>
        <p className="max-w-[560px] text-body leading-relaxed text-pretty text-text-2">{m.queEs}</p>
      </header>

      <SeccionesEnFilas>
        <SeccionEnFila
          id="titulo-datos-del-presupuesto"
          titulo={m.secciones.datos.titulo}
          bajada={
            <Bajada lugar="datos">
              <p>{m.secciones.datos.bajada}</p>
            </Bajada>
          }
        >
          <DatosDelPresupuesto
            nombre={nombreDelTaller}
            datos={borrador.datos}
            cobro={cobro}
            problemas={porCampo}
            alCambiar={(cambiosDeLosDatos: Partial<DatosEditables>) => {
              cambiar((previo) => ({
                ...previo,
                datos: { ...previo.datos, ...cambiosDeLosDatos },
              }));
            }}
          />
        </SeccionEnFila>

        <SeccionEnFila
          id="titulo-numeros-del-presupuesto"
          titulo={m.secciones.numeros.titulo}
          bajada={
            <p className="text-label leading-relaxed text-text-2">{m.secciones.numeros.bajada}</p>
          }
        >
          <NumerosDelPresupuesto
            numeros={borrador.numeros}
            problemas={porCampo}
            alCambiar={(cambiosDeLosNumeros: Partial<NumerosEditables>) => {
              cambiar((previo) => ({
                ...previo,
                numeros: { ...previo.numeros, ...cambiosDeLosNumeros },
              }));
            }}
          />
        </SeccionEnFila>

        {lista('aTenerEnCuenta', 'aTenerEnCuenta')}
        {lista('incluye', 'incluye')}

        <SeccionEnFila
          id="titulo-formas-de-pago"
          titulo={m.secciones.formas.titulo}
          bajada={
            <Bajada lugar="formasDePago">
              <p>{m.secciones.formas.dondeVa}</p>
              <p>{m.secciones.formas.comoSeUsa}</p>
            </Bajada>
          }
        >
          <FormasDePago
            formas={borrador.formas}
            guardadas={guardado.borrador.formas}
            valores={valores}
            abierta={abierta}
            recienAgregada={recienAgregada}
            problemas={porCampo}
            alAbrir={abrir}
            alCambiarLaLista={(formas) => {
              cambiar((previo) => ({ ...previo, formas }));
            }}
            alAgregar={agregarForma}
          />
        </SeccionEnFila>

        {lista('avisos', 'avisos')}
        {lista('condiciones', 'condiciones')}

        <SeccionEnFila
          id="titulo-garantia"
          titulo={m.secciones.garantia.titulo}
          bajada={
            <Bajada lugar="garantia">
              <p>{m.secciones.garantia.bajada}</p>
            </Bajada>
          }
        >
          <GarantiaDelPresupuesto
            texto={borrador.garantia}
            guardado={guardado.borrador.garantia}
            valores={valores}
            abierta={abierta === GARANTIA}
            problema={porCampo['texto-de-la-garantia']}
            alAbrir={() => {
              abrir(GARANTIA);
            }}
            alCerrar={() => {
              abrir(null);
            }}
            alCambiar={(garantia) => {
              cambiar((previo) => ({ ...previo, garantia }));
            }}
          />
        </SeccionEnFila>

        <SeccionEnFila id="titulo-textos-de-siempre" titulo={m.secciones.textosDeSiempre}>
          <LosTextosDeSiempre
            loQueSeDeshace={aDeshacer}
            conCambiosSinGuardar={!mismaPlantilla(borrador, guardado.borrador)}
            alVolver={volverALosDeSiempre}
          />
        </SeccionEnFila>
      </SeccionesEnFilas>

      {cambios.hay && (
        <BarraDeGuardado
          cambios={textoDeLosCambios(cambios)}
          cuantos={cuantosCambios(cambios)}
          queRevisar={problemas[0]?.queRevisar ?? null}
          guardando={false}
          alGuardar={guardar}
        />
      )}

      <ConSalida valor={saliendo}>
        {() => (
          <SalirSinGuardar
            alSeguir={() => {
              setSaliendo(false);
            }}
            alDescartar={() => {
              setSaliendo(false);
              setBorrador(guardado.borrador);
              vuelta.volver();
            }}
          />
        )}
      </ConSalida>
    </Pagina>
  );
}
