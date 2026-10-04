import { CONDICIONES_FISCALES, type CondicionFiscal } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { MUTACION_DE_AJUSTES } from '@/entities/replica';
import type { FilaDe } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  enLista,
  Ir,
  metaDeAvisos,
  RUTA_DE_AJUSTES,
  RUTA_DEL_PRESUPUESTO_EN_AJUSTES,
  useAlgoEnCurso,
  useIr,
  useVolver,
} from '@/shared/lib';
import { ConSalida, Icono, Pagina, SeccionEnFila, SeccionesEnFilas } from '@/shared/ui';

import {
  cambiosDeLaFacturacion,
  conexionDelTaller,
  datosDeLaFacturacion,
  problemaDeLaFacturacion,
  type DatosDeLaFacturacion,
} from '../../model/facturacion';
import { BarraDeGuardado } from '../presupuesto/BarraDeGuardado';
import { SalirSinGuardar } from '../SalirSinGuardar';
import { ConexionConArca } from './ConexionConArca';
import {
  CategoriaDelMonotributo,
  DatosEnLasFacturas,
  QueFacturas,
} from './SeccionesDeLaFacturacion';

const TITULO_DEL_CONCEPTO = 'titulo-que-facturas';
const TITULO_DE_LA_CATEGORIA = 'titulo-categoria-del-monotributo';

function condicionDe(valor: string | null): CondicionFiscal | null {
  return CONDICIONES_FISCALES.find((condicion) => condicion === valor) ?? null;
}

export interface PantallaDeLaFacturacionProps {
  ajustes: FilaDe<'ajustes'>;
}

export function PantallaDeLaFacturacion({ ajustes }: PantallaDeLaFacturacionProps) {
  const m = useMensajes().facturacion;
  const vuelta = useVolver(RUTA_DE_AJUSTES, m.pagina.ajustes);
  const ir = useIr();
  const [guardados, setGuardados] = useState(() => datosDeLaFacturacion(ajustes));
  const [borrador, setBorrador] = useState(guardados);
  const [intentoGuardar, setIntentoGuardar] = useState(false);
  const [problema, setProblema] = useState<ReturnType<typeof problemaDeLaFacturacion>>(null);
  const [salida, setSalida] = useState<{ seguir: () => void } | null>(null);
  const contenedor = useRef<HTMLDivElement>(null);

  const guardar = useMutation({
    ...MUTACION_DE_AJUSTES,
    meta: metaDeAvisos('datosDeFacturacion'),
  });

  const cambios = cambiosDeLaFacturacion(guardados, borrador);
  const hayCambios = cambios.campos.length > 0;
  useAlgoEnCurso(hayCambios);

  useEffect(() => {
    if (!hayCambios) return;
    const avisar = (evento: BeforeUnloadEvent) => {
      evento.preventDefault();
    };
    window.addEventListener('beforeunload', avisar);
    return () => {
      window.removeEventListener('beforeunload', avisar);
    };
  }, [hayCambios]);

  function cambiar(parcial: Partial<DatosDeLaFacturacion>): void {
    const siguiente = { ...borrador, ...parcial };
    setBorrador(siguiente);
    if (intentoGuardar) setProblema(problemaDeLaFacturacion(siguiente));
  }

  function salirA(seguir: () => void): void {
    if (hayCambios) {
      setSalida({ seguir });
      return;
    }
    seguir();
  }

  function alGuardar(): void {
    const encontrado = problemaDeLaFacturacion(borrador);
    setIntentoGuardar(true);
    setProblema(encontrado);
    if (encontrado !== null) {
      requestAnimationFrame(() => {
        const invalido = contenedor.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        invalido?.focus({ preventScroll: true });
        invalido?.scrollIntoView({ block: 'center' });
      });
      return;
    }
    const antes = guardados;
    const limpio: DatosDeLaFacturacion = {
      ...borrador,
      ingresosBrutos: borrador.ingresosBrutos.trim(),
    };
    guardar.mutate(
      { id: ajustes.id, cambios: cambios.cambios, previos: cambios.previos },
      {
        onError: () => {
          setGuardados(antes);
        },
      },
    );
    setGuardados(limpio);
    setBorrador(limpio);
    setIntentoGuardar(false);
  }

  const nombresDeLosCambios = cambios.campos.map((campo) =>
    campo === 'inicioDeActividades' ? m.cambios.inicio : m.cambios[campo],
  );

  return (
    <Pagina className="gap-3 md:gap-4">
      <header className="flex flex-col items-start gap-1.5">
        <Ir
          a={RUTA_DE_AJUSTES}
          alTocar={() => {
            salirA(vuelta.volver);
          }}
          className="-ml-1 flex min-h-tap items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
        >
          <Icono nombre="chevron-left" tamano={20} />
          {vuelta.etiqueta}
        </Ir>
        <h1 className="font-display text-h1 leading-tight lg:text-h1-lg">{m.pagina.titulo}</h1>
      </header>

      <div ref={contenedor} className="contents">
        <SeccionesEnFilas>
          <SeccionEnFila id="titulo-conexion-con-arca" titulo={m.conexion.titulo}>
            <ConexionConArca conexion={conexionDelTaller(ajustes)} />
          </SeccionEnFila>

          <SeccionEnFila id="titulo-datos-en-las-facturas" titulo={m.datos.titulo}>
            <DatosEnLasFacturas
              taller={{
                titular: ajustes.taller_titular,
                domicilio: ajustes.taller_domicilio,
                condicion: condicionDe(ajustes.taller_condicion_fiscal),
              }}
              datos={borrador}
              errorDeIngresosBrutos={problema === 'ingresos-brutos-largo'}
              enlaceAlPresupuesto={
                <Ir
                  a={RUTA_DEL_PRESUPUESTO_EN_AJUSTES}
                  alTocar={() => {
                    salirA(() => {
                      ir(RUTA_DEL_PRESUPUESTO_EN_AJUSTES);
                    });
                  }}
                  className="inline-flex min-h-tap items-center gap-1 self-start rounded-field text-label font-semibold underline underline-offset-3"
                >
                  {m.datos.seCambia}
                  <Icono nombre="arrow-right" tamano={14} grosor={2} />
                </Ir>
              }
              alCambiar={cambiar}
            />
          </SeccionEnFila>

          <SeccionEnFila id={TITULO_DEL_CONCEPTO} titulo={m.concepto.titulo}>
            <QueFacturas
              idDelTitulo={TITULO_DEL_CONCEPTO}
              concepto={borrador.concepto}
              alCambiar={(concepto) => {
                cambiar({ concepto });
              }}
            />
          </SeccionEnFila>

          <SeccionEnFila id={TITULO_DE_LA_CATEGORIA} titulo={m.categoria.titulo}>
            <CategoriaDelMonotributo
              idDelTitulo={TITULO_DE_LA_CATEGORIA}
              categoria={borrador.categoria}
              alCambiar={(categoria) => {
                cambiar({ categoria });
              }}
            />
          </SeccionEnFila>
        </SeccionesEnFilas>
      </div>

      {hayCambios && (
        <BarraDeGuardado
          cambios={enLista(nombresDeLosCambios)}
          cuantos={m.cambios.cuantos(cambios.campos.length)}
          queRevisar={problema === null ? null : m.cambios.ingresosBrutos}
          guardando={false}
          alGuardar={alGuardar}
        />
      )}

      <ConSalida valor={salida}>
        {(abierta) => (
          <SalirSinGuardar
            alSeguir={() => {
              setSalida(null);
            }}
            alDescartar={() => {
              setSalida(null);
              setBorrador(guardados);
              setProblema(null);
              setIntentoGuardar(false);
              abierta.seguir();
            }}
          />
        )}
      </ConSalida>
    </Pagina>
  );
}
