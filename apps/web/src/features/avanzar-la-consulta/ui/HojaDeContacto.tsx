import { contestadas, MONEDA_DEL_TALLER, type PreguntaDeLaConsulta } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';

import { ClienteCombobox, MUTACION_DE_CLIENTE } from '@/entities/cliente';
import {
  CamposDelPago,
  dolarDelDiaParaUnPago,
  hijosDelProyecto,
  marcaDelCampo,
  MUTACION_DE_PROYECTO,
  pagosDelProyecto,
  preguntasDelTaller,
  RenglonesDelEstimativo,
  respuestasConLoEscrito,
  type Proyecto,
  type ValorDelPago,
} from '@/entities/proyecto';
import { CasillaDeLaApertura } from '@/entities/movimiento';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  aperturaDeLaReplica,
  filasDe,
  mensajeDeSincronizacion,
  totalesDelProyecto,
} from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { formatearLaPlata, hoyEnElTaller, metaDeAvisos, uuidv7 } from '@/shared/lib';
import { Button, Campo, FilaDeAcciones, Hoja } from '@/shared/ui';

import {
  conLaSena,
  diaDeLaSena,
  erroresDelContacto,
  etiquetaDeLaVisita,
  hayCambiosEnElContacto,
  hayQueGuardar,
  muestraElVencimiento,
  muestraLaVigencia,
  ofreceMarcarLaVisita,
  pedidoDelContacto,
  senaEditable,
  valorDeLaSena,
  valoresConOtraVisita,
  valoresDelContacto,
  type ErroresDelContacto,
  type ValoresDelContacto,
} from '../model/contacto';
import { monedaDeLaConsulta, paraLosPagos } from '../model/pagoDeLaConsulta';

export interface HojaDeContactoProps {
  proyecto?: Proyecto;
  visitaInicial?: string;
  visitaPropuesta?: { dia: string; hora: string | null } | null;
  enfocarLaVisita?: boolean;
  enfocarLaVigencia?: boolean;
  alCerrar: () => void;
  alGuardar?: (id: string) => void;
  alCrearUnTesoroEnDolares?: (alCrear: (tesoroId: string) => void) => void;
}

export function HojaDeContacto({
  proyecto,
  visitaInicial,
  visitaPropuesta = null,
  enfocarLaVisita = false,
  enfocarLaVigencia = false,
  alCerrar,
  alGuardar,
  alCrearUnTesoroEnDolares,
}: HojaDeContactoProps) {
  const textos = useMensajes().avanzarLaConsulta.contacto;
  const delEstimativo = useMensajes().proyecto.paraElEstimativo;
  const replica = useReplicaDelTaller();
  const idCampos = useId();
  const cuerpo = useRef<HTMLDivElement>(null);
  const hoy = hoyEnElTaller();
  const apertura = aperturaDeLaReplica(replica);
  const delTrabajo = monedaDeLaConsulta(proyecto);
  const para = paraLosPagos(replica);

  const clientes = filasDe(replica, 'clientes');
  const pagos = proyecto === undefined ? [] : pagosDelProyecto(replica, proyecto.id);
  const sena = senaEditable(pagos);
  const cobrado = totalesDelProyecto(replica, proyecto?.id ?? '').cobradoEnSuMoneda;

  const alAbrir = useRef({ id: proyecto?.id ?? uuidv7(), idDeSenaNueva: uuidv7() });
  const [iniciales] = useState<ValoresDelContacto>(() => {
    const valores = valoresDelContacto(proyecto, sena, visitaInicial, para, hoy);
    return visitaPropuesta === null
      ? valores
      : { ...valores, visita: visitaPropuesta.dia, visitaHora: visitaPropuesta.hora ?? '' };
  });
  const [valores, setValores] = useState<ValoresDelContacto>(iniciales);
  const [preguntas] = useState(() => preguntasDelTaller(replica));
  const [telefono, setTelefono] = useState<string | undefined>(undefined);
  const [errores, setErrores] = useState<ErroresDelContacto>({});
  const [rechazo, setRechazo] = useState<unknown>(null);
  const yaTermino = useRef(false);
  const enfocarAlAbrir = useRef(
    enfocarLaVigencia && muestraLaVigencia(proyecto)
      ? 'input[name="vale_hasta"]'
      : enfocarLaVisita
        ? 'input[name="visita"]'
        : 'input',
  );

  const guardar = useMutation({
    ...MUTACION_DE_PROYECTO,
    meta: metaDeAvisos('contactoGuardado', { errorEnPantalla: true }),
  });
  const editarCliente = useMutation(MUTACION_DE_CLIENTE);

  const cliente = clientes.find((fila) => fila.id === valores.clienteId);
  const telefonoVisible = telefono ?? cliente?.telefono ?? '';

  useEffect(() => {
    cuerpo.current?.querySelector<HTMLInputElement>(enfocarAlAbrir.current)?.focus();
  }, []);

  useEffect(() => {
    if (!guardar.isPaused || yaTermino.current) return;
    yaTermino.current = true;
    if (alGuardar) alGuardar(alAbrir.current.id);
    else alCerrar();
  }, [guardar.isPaused, alGuardar, alCerrar]);

  function cambiar<Campo extends keyof ValoresDelContacto>(
    campo: Campo,
    valor: ValoresDelContacto[Campo],
  ): void {
    setValores((previos) => ({ ...previos, [campo]: valor }));
    setErrores((previos) => ({
      ...previos,
      [campo === 'clienteId' ? 'cliente' : campo]: undefined,
    }));
  }

  function cambiarLaSena(valor: ValorDelPago): void {
    setValores((previos) => conLaSena(previos, valor));
    setErrores((previos) => ({
      ...previos,
      cotizacionDeLaSena: undefined,
      tesoroDeLaSena: undefined,
    }));
  }

  function responder(pregunta: PreguntaDeLaConsulta, texto: string): void {
    setValores((previos) => ({
      ...previos,
      respuestas: { ...previos.respuestas, [pregunta.id]: texto },
    }));
  }

  function entraAlTesoroNuevo(tesoroId: string): void {
    setValores((previos) => ({ ...previos, tesoroDeLaSena: tesoroId }));
    setErrores((previos) => ({ ...previos, tesoroDeLaSena: undefined }));
  }

  function terminar(): void {
    if (yaTermino.current) return;
    yaTermino.current = true;
    if (alGuardar) alGuardar(alAbrir.current.id);
    else alCerrar();
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const encontrados = erroresDelContacto(valores, telefonoVisible, hoy, {
      monedaDelTrabajo: delTrabajo,
      tesorosEnDolares: para.tesorosEnDolares,
    });
    setErrores(encontrados);
    if (Object.values(encontrados).some((mensaje) => mensaje !== undefined)) return;

    const telefonoAnterior = cliente?.telefono ?? '';
    if (telefono !== undefined && telefono.trim() !== telefonoAnterior.trim()) {
      editarCliente.mutate({
        id: valores.clienteId,
        cambios: { telefono: telefono.trim() },
        previos: { telefono: telefonoAnterior },
      });
    }

    const pedido = pedidoDelContacto({
      id: alAbrir.current.id,
      proyecto,
      valores,
      sena,
      idDeSenaNueva: alAbrir.current.idDeSenaNueva,
      hoy,
      apertura,
    });

    if (!hayQueGuardar(proyecto, pedido)) {
      terminar();
      return;
    }

    setRechazo(null);
    guardar.mutate(
      {
        pedido,
        previos: {
          proyecto: proyecto ?? null,
          ...hijosDelProyecto(replica, alAbrir.current.id),
        },
        ...(proyecto === undefined
          ? { respuestas: respuestasConLoEscrito([], preguntas, valores.respuestas, true) }
          : {}),
      },
      { onSuccess: terminar, onError: setRechazo },
    );
  }

  const esContactoSinEtapa = proyecto === undefined || proyecto.estado === 'contacto';
  const cuenta = contestadas(
    preguntas,
    respuestasConLoEscrito([], preguntas, valores.respuestas),
    valores.direccion,
  );

  return (
    <Hoja
      titulo={proyecto ? textos.titulo.editar : textos.titulo.nuevo}
      alCerrar={alCerrar}
      conCambios={hayCambiosEnElContacto(iniciales, valores, cliente?.telefono ?? '', telefono)}
    >
      {(pedirCierre) => (
        <form noValidate onSubmit={enviar} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div
            ref={cuerpo}
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4 md:px-6 md:py-5"
          >
            <div {...marcaDelCampo('cliente')} className="contents">
              <ClienteCombobox
                clientes={clientes}
                elegidoId={valores.clienteId === '' ? null : valores.clienteId}
                alElegir={(elegido) => {
                  cambiar('clienteId', elegido?.id ?? '');
                  setTelefono(undefined);
                }}
                error={errores.cliente}
              />
            </div>

            {valores.clienteId !== '' && (
              <Campo
                {...marcaDelCampo('telefono')}
                etiqueta={textos.telefono}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="11 5555-5555"
                value={telefonoVisible}
                onChange={(evento) => {
                  setTelefono(evento.target.value);
                }}
                error={errores.telefono}
                ayuda={errores.telefono === undefined ? textos.ayudaDelTelefono : undefined}
              />
            )}

            <Campo
              {...marcaDelCampo('titulo')}
              etiqueta={textos.quePide}
              placeholder={textos.ejemploDeQuePide}
              maxLength={200}
              value={valores.titulo}
              onChange={(evento) => {
                cambiar('titulo', evento.target.value);
              }}
              error={errores.titulo}
            />

            {proyecto === undefined && (
              <section
                aria-labelledby={`${idCampos}-estimativo`}
                className="flex flex-col rounded-panel border border-hairline px-4 pt-3 pb-1"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 id={`${idCampos}-estimativo`} className="text-body font-semibold">
                    {delEstimativo.titulo}
                  </h3>
                  <span className="text-label text-text-2 tabular-nums">
                    {delEstimativo.contestadas(cuenta.contestadas, cuenta.total)}
                  </span>
                </div>
                <p className="mt-0.5 text-meta leading-normal text-text-3">{delEstimativo.ayuda}</p>
                <RenglonesDelEstimativo
                  preguntas={preguntas}
                  respuestas={respuestasConLoEscrito([], preguntas, valores.respuestas)}
                  domicilio={valores.direccion}
                  domicilioDelCliente={cliente?.direccion ?? ''}
                  alResponder={responder}
                  alCambiarElDomicilio={(direccion) => {
                    cambiar('direccion', direccion);
                  }}
                />
              </section>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                {...marcaDelCampo('visita')}
                etiqueta={etiquetaDeLaVisita(proyecto, hoy)}
                name="visita"
                type="date"
                value={valores.visita}
                onChange={(evento) => {
                  const visita = evento.target.value;
                  setValores((previos) => valoresConOtraVisita(proyecto, previos, visita, hoy));
                }}
                ayuda={esContactoSinEtapa ? textos.ayudaDeLaVisita : undefined}
              />

              <Campo
                {...marcaDelCampo('horaDeLaVisita')}
                etiqueta={textos.horaDeLaVisita}
                name="visita_hora"
                type="time"
                value={valores.visitaHora}
                onChange={(evento) => {
                  cambiar('visitaHora', evento.target.value);
                }}
                ayuda={textos.ayudaDeLaHora}
              />

              {pagos.length > 1 ? (
                <div {...marcaDelCampo('pagos')} className="flex flex-col gap-1.5">
                  <span className="text-label text-text-2">{textos.senaCobrada}</span>
                  <span
                    translate="no"
                    className="flex h-field items-center text-body-lg font-semibold tabular-nums"
                  >
                    {formatearLaPlata(cobrado)}
                  </span>
                  <span className="text-meta text-text-3">{textos.variosPagos(pagos.length)}</span>
                </div>
              ) : (
                <div {...marcaDelCampo('pagos')} className="contents">
                  <CamposDelPago
                    etiqueta={textos.senaCobrada}
                    valor={valorDeLaSena(valores)}
                    alCambiar={cambiarLaSena}
                    monedaDelTrabajo={delTrabajo}
                    tesorosEnDolares={para.tesorosEnDolares}
                    dolarDelDia={dolarDelDiaParaUnPago(
                      { moneda: valores.monedaDeLaSena, fecha: diaDeLaSena(valores, hoy) },
                      delTrabajo,
                      para.dolarDelDia,
                    )}
                    alCrearUnTesoroEnDolares={
                      alCrearUnTesoroEnDolares === undefined
                        ? undefined
                        : () => {
                            alCrearUnTesoroEnDolares(entraAlTesoroNuevo);
                          }
                    }
                    errores={{
                      cotizacion: errores.cotizacionDeLaSena,
                      tesoro: errores.tesoroDeLaSena,
                    }}
                    ayudaDelMonto={
                      valores.monedaDeLaSena === MONEDA_DEL_TALLER
                        ? textos.ayudaDeLaSena
                        : textos.ayudaDeLaSenaEnDolares
                    }
                  />
                </div>
              )}

              {pagos.length <= 1 && (valores.sena ?? 0) > 0 && (
                <div className="flex flex-col gap-1">
                  <Campo
                    etiqueta={textos.diaDeLaSena}
                    type="date"
                    max={hoy}
                    value={diaDeLaSena(valores, hoy)}
                    onChange={(evento) => {
                      cambiar('diaDeLaSena', evento.target.value);
                    }}
                    error={errores.diaDeLaSena}
                    ayuda={
                      errores.diaDeLaSena === undefined && valores.diaDeLaSena === null
                        ? textos.ayudaDelDiaDeLaSena
                        : undefined
                    }
                  />
                  <CasillaDeLaApertura
                    fecha={diaDeLaSena(valores, hoy)}
                    apertura={apertura}
                    marcada={valores.senaEnLaApertura}
                    alCambiar={(marcada) => {
                      cambiar('senaEnLaApertura', marcada);
                    }}
                  />
                </div>
              )}
            </div>

            {ofreceMarcarLaVisita(proyecto, valores, hoy) && (
              <label className="-mt-1 flex min-h-tap cursor-pointer items-start gap-3 py-1">
                <input
                  {...marcaDelCampo('visitaHecha')}
                  type="checkbox"
                  checked={valores.visitaHecha}
                  onChange={(evento) => {
                    cambiar('visitaHecha', evento.target.checked);
                  }}
                  className="mt-0.5 size-5 flex-none accent-ink"
                />
                <span className="flex min-w-0 flex-col">
                  <span className="text-body font-medium text-ink">{textos.yaFuiARelevar}</span>
                  <span className="text-meta text-text-3">{textos.ayudaDeYaFui}</span>
                </span>
              </label>
            )}

            {muestraElVencimiento(proyecto) && (
              <Campo
                {...marcaDelCampo('vencimiento')}
                etiqueta={textos.entregarElPresupuestoAntesDel}
                type="date"
                value={valores.vencimiento}
                onChange={(evento) => {
                  cambiar('vencimiento', evento.target.value);
                }}
                ayuda={
                  proyecto?.estado === 'a_presupuestar'
                    ? textos.ayudaDelVencimientoAPresupuestar
                    : textos.ayudaDelVencimiento
                }
              />
            )}

            {muestraLaVigencia(proyecto) && (
              <Campo
                {...marcaDelCampo('valeHasta')}
                etiqueta={textos.valeHasta}
                name="vale_hasta"
                type="date"
                value={valores.valeHasta}
                onChange={(evento) => {
                  cambiar('valeHasta', evento.target.value);
                }}
                ayuda={textos.ayudaDeValeHasta}
              />
            )}

            <div {...marcaDelCampo('notas')} className="flex flex-col gap-1.5">
              <label htmlFor={`${idCampos}-notas`} className="text-label text-text-2">
                {textos.notas}
              </label>
              <textarea
                id={`${idCampos}-notas`}
                rows={3}
                value={valores.notas}
                onChange={(evento) => {
                  cambiar('notas', evento.target.value);
                }}
                placeholder={textos.ejemploDeNotas}
                className="rounded-field border border-border bg-paper px-3.5 py-2.5 text-body-lg text-ink"
              />
              {errores.notas !== undefined && (
                <span role="alert" className="text-label font-medium text-alerta">
                  {errores.notas}
                </span>
              )}
            </div>

            {rechazo !== null && (
              <p role="alert" className="text-label font-medium text-alerta">
                {mensajeDeSincronizacion(rechazo)}
              </p>
            )}
          </div>

          <footer className="flex-none border-t border-hairline bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
            <FilaDeAcciones>
              <Button type="button" variant="secundario" onClick={pedirCierre}>
                {textos.cancelar}
              </Button>
              <Button type="submit" cargando={guardar.isPending && !guardar.isPaused}>
                {proyecto ? textos.guardar.editar : textos.guardar.nuevo}
              </Button>
            </FilaDeAcciones>
          </footer>
        </form>
      )}
    </Hoja>
  );
}
