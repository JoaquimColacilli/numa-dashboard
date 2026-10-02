import { useCallback, useState, type ReactNode } from 'react';

import { AccionesDeContacto, rutaDelCliente } from '@/entities/cliente';
import {
  enOtrosTesoros,
  ESTADO,
  EstadoBadge,
  etapaAlVolver,
  historiaDelSeguimiento,
  insumosDelProyecto,
  loCobradoEnPalabras,
  pendienteDelSeguimiento,
  RUTA_DE_SEGUIMIENTO,
  rutaDeCierre,
  textoDelResultado,
  type ResumenDeProyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { ArchivosDelTrabajo } from '@/features/adjuntar-archivos';
import { TarjetaDelPresupuesto } from '@/features/armar-el-presupuesto';
import { HojaDeContacto } from '@/features/avanzar-la-consulta';
import { BorradoDelProyecto, NotasDelProyecto } from '@/features/editar-proyecto';
import { HojaDeRegistrarElContacto } from '@/features/hacer-el-seguimiento';
import { useMensajes } from '@/shared/idioma';
import {
  destinoDeLaTarjeta,
  fechaLarga,
  formatearLaPlata,
  formatearPlata,
  hoyEnElTaller,
  relativa,
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
  PanelDePaso,
  PrincipalYApoyo,
} from '@/shared/ui';

import { ConTesoroEnDolaresNuevo } from './ConTesoroEnDolaresNuevo';
import { InsumosDelTrabajo } from './InsumosDelTrabajo';

function Dato({
  clave,
  children,
  tono = '',
  dato = false,
}: {
  clave: string;
  children: ReactNode;
  tono?: string;
  dato?: boolean;
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] items-center gap-3 border-t border-hairline-soft py-2.5 text-body first:border-t-0">
      <dt className="text-text-3">{clave}</dt>
      <dd
        translate={dato ? 'no' : undefined}
        className={`leading-snug font-medium tabular-nums ${tono}`}
      >
        {children}
      </dd>
    </div>
  );
}

type HojaAbierta = 'registrar' | 'editar' | null;

export interface FichaDeSeguimientoProps {
  resumen: ResumenDeProyecto;
}

export function FichaDeSeguimiento(props: FichaDeSeguimientoProps) {
  return (
    <ConTesoroEnDolaresNuevo>
      {(pedir) => <FichaDelSeguimiento {...props} pedirUnTesoroEnDolares={pedir} />}
    </ConTesoroEnDolaresNuevo>
  );
}

function FichaDelSeguimiento({
  resumen,
  pedirUnTesoroEnDolares,
}: FichaDeSeguimientoProps & {
  pedirUnTesoroEnDolares: (alCrear: (tesoroId: string) => void) => void;
}) {
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const { comun, seguimiento: textos } = useMensajes().paginaProyectos;
  const vuelta = useVolver(RUTA_DE_SEGUIMIENTO, textos.seguimiento);
  const { proyecto, cliente } = resumen;
  const avisos = useAvisosDelProyecto(proyecto.id);
  const [hoja, setHoja] = useState<HojaAbierta>(null);
  const cerrarLaHoja = useCallback(() => {
    setHoja(null);
  }, []);

  const hoy = hoyEnElTaller();
  const nombre = cliente?.nombre ?? resumen.nombreDelCliente;
  const telefono = cliente?.telefono ?? '';
  const pendiente = pendienteDelSeguimiento(replica, proyecto.id);
  const historia = historiaDelSeguimiento(replica, proyecto.id);
  const insumos = insumosDelProyecto(replica, proyecto.id);
  const atrasado = pendiente !== undefined && pendiente.fecha < hoy;

  const paso =
    pendiente === undefined
      ? textos.sinDia
      : pendiente.fecha === hoy
        ? textos.hoy
        : atrasado
          ? textos.leTocaba(fechaLarga(pendiente.fecha, hoy))
          : textos.leVolvesAEscribir(fechaLarga(pendiente.fecha, hoy));
  const detalle =
    pendiente === undefined
      ? ''
      : [relativa(pendiente.fecha, hoy), pendiente.nota.trim()]
          .filter((parte) => parte !== '')
          .join(' · ');

  return (
    <Pagina className="gap-3 md:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-y-2">
        <Ir
          a={RUTA_DE_SEGUIMIENTO}
          alTocar={vuelta.volver}
          className="-ml-1 flex min-h-tap items-center gap-1 rounded-pill pr-1 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
        >
          <Icono nombre="chevron-left" tamano={20} />
          {vuelta.etiqueta}
        </Ir>
        <div className="ml-auto flex flex-none gap-1">
          <BorradoDelProyecto
            proyecto={proyecto}
            variante="contacto"
            alBorrar={() => {
              ir(RUTA_DE_SEGUIMIENTO, { como: 'terminar' });
            }}
          />
          <Button
            variant="herramienta"
            size="herramienta"
            className="sm:px-4"
            aria-label={comun.editar}
            onClick={() => {
              setHoja('editar');
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
              <AccionesDeContacto nombre={nombre} telefono={telefono} amplias />
            </section>

            <PanelDePaso
              titulo={textos.proximoContacto}
              paso={paso}
              detalle={detalle}
              icono="calendar"
              tono={atrasado ? 'atencion' : 'normal'}
            >
              {pendiente !== undefined && (
                <FilaDeAcciones className="mt-3">
                  <Button
                    onClick={() => {
                      setHoja('registrar');
                    }}
                  >
                    <Icono nombre="message-circle" tamano={18} />
                    {textos.registrarElContacto}
                  </Button>
                </FilaDeAcciones>
              )}
              <p className="mt-3 text-meta leading-relaxed text-text-3">
                {textos.cuandoLeEscribas}
              </p>
            </PanelDePaso>
          </div>
        }
      >
        <div className="flex flex-col gap-3 md:gap-4">
          <TarjetaDelPresupuesto proyecto={proyecto} />

          <section
            aria-label={textos.datosDelTrabajo}
            className="rounded-panel border border-hairline bg-paper px-4 md:px-5"
          >
            <dl>
              <Dato clave={comun.estabaEn}>{ESTADO[etapaAlVolver(pendiente)].etiqueta}</Dato>
              <Dato clave={comun.presupuesto} dato={proyecto.presupuesto_centavos !== null}>
                {proyecto.presupuesto_centavos === null
                  ? comun.todaviaSinPresupuesto
                  : formatearPlata(proyecto.presupuesto_centavos, resumen.moneda)}
              </Dato>
              <Dato
                clave={comun.senaCobrada}
                tono={resumen.cobradoEnPesos > 0 ? 'text-hogar' : ''}
                dato={resumen.cobradoEnPesos > 0}
              >
                {resumen.cobradoEnPesos > 0
                  ? formatearLaPlata(resumen.cobradoEnSuMoneda)
                  : comun.sinSena}
              </Dato>
              <Dato clave={comun.telefono} dato={telefono.trim() !== ''}>
                {telefono.trim() === '' ? comun.sinTelefono : telefono}
              </Dato>
            </dl>
          </section>

          {insumos !== null &&
            (insumos.entro !== 0 || insumos.gastado !== 0 || insumos.enDolares.length > 0) && (
              <InsumosDelTrabajo insumos={insumos} otros={enOtrosTesoros(replica, insumos)} />
            )}

          <section
            aria-labelledby="historia-del-seguimiento"
            className="rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5"
          >
            <h2 id="historia-del-seguimiento" className="text-section font-semibold">
              {textos.historia}
            </h2>
            {historia.length === 0 ? (
              <p className="mt-1.5 text-label text-text-2">{textos.sinHistoria}</p>
            ) : (
              <ol className="mt-1.5 flex list-none flex-col">
                {historia.map((contacto) => (
                  <li key={contacto.id} className="border-t border-hairline-soft py-2.5">
                    <p className="text-body">
                      <span translate="no" className="font-semibold">
                        {fechaLarga(contacto.hecho_el ?? contacto.fecha, hoy)}
                      </span>
                      {textoDelResultado(contacto.resultado) !== '' && (
                        <span className="text-text-2">
                          <span translate="no">{' · '}</span>
                          {textoDelResultado(contacto.resultado)}
                        </span>
                      )}
                    </p>
                    {contacto.respuesta.trim() !== '' && (
                      <p translate="no" className="mt-0.5 text-label leading-snug text-text-2">
                        {contacto.respuesta}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </section>

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
            <Button
              variant="secundario"
              className="mt-2.5"
              onClick={() => {
                ir(rutaDeCierre(proyecto.id));
              }}
            >
              <Icono nombre="x" tamano={16} />
              {comun.darPorPerdido}
            </Button>
          </section>
        </div>
      </PrincipalYApoyo>

      <ConSalida valor={hoja}>
        {(abierta) =>
          abierta === 'registrar' && pendiente !== undefined ? (
            <HojaDeRegistrarElContacto
              proyecto={proyecto}
              pendiente={pendiente}
              nombre={nombre}
              telefono={telefono}
              alCerrar={cerrarLaHoja}
            />
          ) : (
            <HojaDeContacto
              proyecto={proyecto}
              alCerrar={cerrarLaHoja}
              alCrearUnTesoroEnDolares={pedirUnTesoroEnDolares}
            />
          )
        }
      </ConSalida>
    </Pagina>
  );
}
