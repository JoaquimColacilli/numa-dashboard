import { useCallback, useState, type ReactNode } from 'react';

import { AccionesDeContacto, rutaDelCliente } from '@/entities/cliente';
import {
  BloqueDeLaSena,
  CostosDeCotizar,
  enOtrosTesoros,
  EstadoBadge,
  gastosDelProyecto,
  insumosDelProyecto,
  loCobradoEnPalabras,
  opcionesDelProyecto,
  pagosDelProyecto,
  presupuestoVencido,
  RUTA_DE_CONSULTAS,
  rutaDeCierre,
  rutaDeEdicion,
  senaDelProyecto,
  senaDelTrabajo,
  situacionDelContacto,
  ultimasActividades,
  vigenciaDelPresupuesto,
  yaSeRelevo,
  type EtapaDeConsulta,
  type ResumenDeProyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { AyudaDeLaVista } from '@/entities/vista-cliente';
import { ArchivosDelTrabajo } from '@/features/adjuntar-archivos';
import { TarjetaDelPresupuesto } from '@/features/armar-el-presupuesto';
import {
  BorradoDelProyecto,
  LoQueHaceFalta,
  NotasDelProyecto,
  OpcionesDelTrabajo,
} from '@/features/editar-proyecto';
import { AvanceDelContacto, HojaDeContacto } from '@/features/avanzar-la-consulta';
import { HojaDePonerEnSeguimiento } from '@/features/hacer-el-seguimiento';
import { mensajes, useMensajes } from '@/shared/idioma';
import {
  destinoDeLaTarjeta,
  fechaLarga,
  formatearLaPlata,
  formatearPesos,
  formatearPlata,
  hoyLocal,
  relativa,
  rutaDeCompartir,
  useAvisosDelProyecto,
  Ir,
  useIr,
  useVolver,
} from '@/shared/lib';
import {
  Button,
  ConSalida,
  FilaDeAcciones,
  Icono,
  Pagina,
  PanelDeAvisos,
  PrincipalYApoyo,
} from '@/shared/ui';

import { ConTesoroEnDolaresNuevo } from './ConTesoroEnDolaresNuevo';
import { InsumosDelTrabajo } from './InsumosDelTrabajo';

function Dato({
  clave,
  valor,
  tono = '',
  accion,
  dato = false,
}: {
  clave: string;
  valor: string;
  tono?: string;
  accion?: ReactNode;
  dato?: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 border-t border-hairline-soft py-2.5 text-body first:border-t-0">
      <dt className="text-text-3">{clave}</dt>
      <dd className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 ${tono}`}>
        <span translate={dato ? 'no' : undefined} className="leading-snug font-medium tabular-nums">
          {valor}
        </span>
        {accion}
      </dd>
    </div>
  );
}

type HojaAbierta = 'contacto' | 'visita' | 'vigencia' | 'por-ahora-no' | null;

function textoDeLaVigencia(valeHasta: string | null, vencido: boolean, hoy: string): string {
  const { comun, contacto } = mensajes().paginaProyectos;
  if (valeHasta === null) return contacto.sinFecha;
  if (vencido) return contacto.vencioEl(fechaLarga(valeHasta, hoy));
  return comun.fechaYCuando(fechaLarga(valeHasta, hoy), relativa(valeHasta, hoy));
}

export interface FichaDeContactoProps {
  resumen: ResumenDeProyecto;
  etapa: EtapaDeConsulta;
}

export function FichaDeContacto(props: FichaDeContactoProps) {
  return (
    <ConTesoroEnDolaresNuevo>
      {(pedir) => <FichaDelContacto {...props} pedirUnTesoroEnDolares={pedir} />}
    </ConTesoroEnDolaresNuevo>
  );
}

function FichaDelContacto({
  resumen,
  etapa,
  pedirUnTesoroEnDolares,
}: FichaDeContactoProps & {
  pedirUnTesoroEnDolares: (alCrear: (tesoroId: string) => void) => void;
}) {
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const { comun, contacto: textos } = useMensajes().paginaProyectos;
  const vuelta = useVolver(RUTA_DE_CONSULTAS, textos.consultas);
  const avisos = useAvisosDelProyecto(resumen.proyecto.id);
  const [editando, setEditando] = useState<HojaAbierta>(null);
  const cerrarLaHoja = useCallback(() => {
    setEditando(null);
  }, []);

  const hoy = hoyLocal();
  const { proyecto, cliente } = resumen;
  const pagos = pagosDelProyecto(replica, proyecto.id);
  const gastos = gastosDelProyecto(replica, proyecto.id);
  const insumos = insumosDelProyecto(replica, proyecto.id);
  const ultimaActividad = ultimasActividades(replica).get(proyecto.id) ?? proyecto.updated_at;
  const situacion = situacionDelContacto(proyecto, ultimaActividad, hoy, resumen.cobradoEnPesos);
  const nombre = cliente?.nombre ?? resumen.nombreDelCliente;
  const relevado = yaSeRelevo(proyecto, hoy);
  const esperaAlCliente =
    proyecto.estado === 'presupuesto_enviado' || proyecto.estado === 'presupuesto_estimativo';
  const vencido = presupuestoVencido(proyecto, hoy);

  return (
    <Pagina className="gap-3 md:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <Ir
          a={RUTA_DE_CONSULTAS}
          alTocar={vuelta.volver}
          className="-ml-1 flex min-h-tap items-center gap-1 rounded-pill pr-1 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
        >
          <Icono nombre="chevron-left" tamano={20} />
          {vuelta.etiqueta}
        </Ir>
        <div className="ml-auto flex flex-none gap-1">
          <AyudaDeLaVista />
          <Button
            variant="herramienta"
            size="herramienta"
            className="sm:px-4"
            aria-label={comun.mostrarleAlCliente}
            onClick={() => {
              ir(rutaDeCompartir(proyecto.id));
            }}
          >
            <Icono nombre="eye" tamano={16} />
            <span className="hidden sm:inline">{comun.mostrarleAlCliente}</span>
          </Button>
          <BorradoDelProyecto
            proyecto={proyecto}
            variante="contacto"
            alBorrar={() => {
              ir(RUTA_DE_CONSULTAS, { como: 'terminar' });
            }}
          />
          <Button
            variant="herramienta"
            size="herramienta"
            className="sm:px-4"
            aria-label={comun.editar}
            onClick={() => {
              setEditando('contacto');
            }}
          >
            <Icono nombre="pencil" tamano={16} />
            <span className="hidden sm:inline">{comun.editar}</span>
          </Button>
        </div>
      </div>

      <header
        {...destinoDeLaTarjeta(proyecto.id)}
        className="flex flex-col gap-2 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
      >
        {cliente === undefined ? (
          <span className="text-label text-text-3">{resumen.nombreDelCliente}</span>
        ) : (
          <Ir
            a={rutaDelCliente(cliente.id)}
            translate="no"
            className="inline-flex items-center gap-1.5 self-start text-label font-medium text-text-2"
          >
            {cliente.nombre}
            <Icono nombre="chevron-right" tamano={14} />
          </Ir>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1
            translate="no"
            className="max-w-[720px] font-display text-h1 leading-tight text-pretty lg:text-h1-lg"
          >
            {proyecto.titulo}
          </h1>
          <EstadoBadge estado={proyecto.estado} />
        </div>
      </header>

      {avisos.length > 0 && <PanelDeAvisos avisos={avisos} />}

      <PrincipalYApoyo
        apoyoPrimero
        separacion="gap-y-3 @min-[40rem]/apoyo:gap-y-4"
        apoyo={
          <div className="flex flex-col gap-3 md:gap-4">
            <section aria-label={comun.contactarA(nombre)}>
              <AccionesDeContacto nombre={nombre} telefono={cliente?.telefono ?? ''} amplias />
            </section>

            <AvanceDelContacto
              proyecto={proyecto}
              etapa={etapa}
              situacion={situacion}
              cobrado={resumen.cobradoEnPesos}
              conOpciones={opcionesDelProyecto(replica, proyecto.id).length > 0}
              alAgendar={() => {
                setEditando('visita');
              }}
              alCrearUnTesoroEnDolares={pedirUnTesoroEnDolares}
            />
          </div>
        }
      >
        <div className="flex flex-col gap-3 md:gap-4">
          <TarjetaDelPresupuesto proyecto={proyecto} />

          <OpcionesDelTrabajo proyecto={proyecto} ofreceCargarLaPrimera />

          <BloqueDeLaSena
            sena={senaDelTrabajo(replica, proyecto, resumen.cobradoEnSuMoneda)}
            moneda={resumen.moneda}
            propia={senaDelProyecto(proyecto) !== null}
          />

          {insumos !== null &&
            (insumos.entro !== 0 || insumos.gastado !== 0 || insumos.enDolares.length > 0) && (
              <InsumosDelTrabajo insumos={insumos} otros={enOtrosTesoros(replica, insumos)} />
            )}

          {etapa !== 'a_presupuestar' && <CostosDeCotizar proyecto={proyecto} />}

          <section
            aria-label={textos.datosDelContacto}
            className="rounded-panel border border-hairline bg-paper px-4 pb-1.5 md:px-5"
          >
            <dl>
              <Dato
                clave={relevado ? textos.relevamiento : textos.visita}
                valor={
                  proyecto.fecha_visita === null
                    ? textos.sinFecha
                    : comun.fechaYCuando(
                        fechaLarga(proyecto.fecha_visita, hoy),
                        relativa(proyecto.fecha_visita, hoy),
                      )
                }
                accion={
                  <Button
                    variant="secundario"
                    size="chico"
                    aria-label={relevado ? textos.cambiarElRelevamiento : textos.cambiarLaVisita}
                    onClick={() => {
                      setEditando('visita');
                    }}
                  >
                    {textos.cambiar}
                  </Button>
                }
              />
              <Dato
                clave={comun.senaCobrada}
                valor={
                  resumen.cobradoEnPesos > 0
                    ? formatearLaPlata(resumen.cobradoEnSuMoneda)
                    : comun.sinSena
                }
                tono={resumen.cobradoEnPesos > 0 ? 'text-hogar' : ''}
                dato={resumen.cobradoEnPesos > 0}
              />
              <Dato
                clave={comun.presupuesto}
                valor={
                  proyecto.presupuesto_centavos === null
                    ? comun.todaviaSinPresupuesto
                    : formatearPlata(proyecto.presupuesto_centavos, resumen.moneda)
                }
                dato={proyecto.presupuesto_centavos !== null}
              />
              {proyecto.estado === 'presupuesto_enviado' && (
                <Dato
                  clave={textos.valeHasta}
                  valor={textoDeLaVigencia(vigenciaDelPresupuesto(proyecto), vencido, hoy)}
                  tono={vencido ? 'font-semibold text-atencion' : ''}
                  accion={
                    <Button
                      variant="secundario"
                      size="chico"
                      aria-label={textos.cambiarLaVigencia}
                      onClick={() => {
                        setEditando('vigencia');
                      }}
                    >
                      {textos.cambiar}
                    </Button>
                  }
                />
              )}
              {!esperaAlCliente && (
                <Dato
                  clave={textos.presupuestoAntesDel}
                  valor={
                    proyecto.vencimiento_presupuesto === null
                      ? textos.sinFechaLimite
                      : comun.fechaYCuando(
                          fechaLarga(proyecto.vencimiento_presupuesto, hoy),
                          relativa(proyecto.vencimiento_presupuesto, hoy),
                        )
                  }
                />
              )}
              <Dato
                clave={comun.telefono}
                valor={
                  cliente === undefined || cliente.telefono.trim() === ''
                    ? comun.sinTelefono
                    : cliente.telefono
                }
                dato={cliente !== undefined && cliente.telefono.trim() !== ''}
              />
              {gastos.length > 0 && (
                <Dato clave={textos.gastosCargados} valor={formatearPesos(resumen.gastos)} dato />
              )}
            </dl>
            {(pagos.length > 0 || gastos.length > 0) && (
              <p className="mt-1.5 text-meta leading-relaxed text-text-3">
                {textos.yaEntroALaCaja}
              </p>
            )}
            <Ir
              a={rutaDeEdicion(proyecto.id)}
              className="mt-2 flex min-h-tap w-fit items-center gap-1.5 rounded-field text-label font-medium underline underline-offset-3"
            >
              {textos.cargarOtroPago}
            </Ir>
          </section>

          <LoQueHaceFalta proyecto={proyecto} />

          <NotasDelProyecto
            proyecto={proyecto}
            titulo={comun.notas}
            placeholder={comun.notasEjemplo}
          />

          <ArchivosDelTrabajo proyectoId={proyecto.id} />

          <section
            aria-label={comun.siNoSale}
            className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
          >
            <h2 className="text-section font-semibold">{comun.siNoSale}</h2>
            <p className="mt-1 text-label leading-relaxed text-text-2">
              {resumen.cobradoEnPesos > 0
                ? textos.siNoSaleConSena(loCobradoEnPalabras(resumen))
                : textos.siNoSaleSinSena}
            </p>
            <FilaDeAcciones className="mt-2.5">
              <Button
                variant="secundario"
                onClick={() => {
                  setEditando('por-ahora-no');
                }}
              >
                <Icono nombre="clock" tamano={16} />
                {textos.porAhoraNo}
              </Button>
              <Button
                variant="secundario"
                onClick={() => {
                  ir(rutaDeCierre(proyecto.id));
                }}
              >
                <Icono nombre="x" tamano={16} />
                {comun.darPorPerdido}
              </Button>
            </FilaDeAcciones>
          </section>
        </div>
      </PrincipalYApoyo>

      <ConSalida valor={editando}>
        {(abierta) =>
          abierta === 'por-ahora-no' ? (
            <HojaDePonerEnSeguimiento proyecto={proyecto} nombre={nombre} alCerrar={cerrarLaHoja} />
          ) : (
            <HojaDeContacto
              proyecto={proyecto}
              enfocarLaVisita={abierta === 'visita'}
              enfocarLaVigencia={abierta === 'vigencia'}
              alCerrar={cerrarLaHoja}
              alCrearUnTesoroEnDolares={pedirUnTesoroEnDolares}
            />
          )
        }
      </ConSalida>
    </Pagina>
  );
}
