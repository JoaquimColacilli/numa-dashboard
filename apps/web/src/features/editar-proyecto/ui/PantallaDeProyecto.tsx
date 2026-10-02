import {
  entregaEstimada,
  estaLiquidado,
  ESTADOS_DE_CONSULTA,
  faseDe,
  MONEDA_DEL_TALLER,
  MONEDAS,
  type EstadoProyecto,
  type Moneda,
} from '@maun/domain';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch, type SubmitHandler } from 'react-hook-form';

import { ClienteCombobox, CONDICION, enlaceDeMapa } from '@/entities/cliente';
import {
  COMPROBANTE,
  COMPROBANTES_EN_ORDEN,
  comprobanteDeLaCondicion,
  conLaVigenciaAlMandar,
  diasQueValeElPresupuesto,
  dolarDelDiaDelTaller,
  esquemaDeProyecto,
  ESTADO,
  ESTADOS_EN_ORDEN,
  estadosDisponibles,
  FORMA_DE_PAGO,
  FORMAS_EN_ORDEN,
  gastosDelProyecto,
  hijosDelProyecto,
  monedaDeUnPagoNuevo,
  MUTACION_DE_PROYECTO,
  opcionesDelProyecto,
  opcionVacia,
  pagosDelProyecto,
  presupuestoDeLasOpciones,
  filaRevertida,
  MUTACION_DE_REVERSION,
  pedidoDeGuardado,
  pedidoDeReversion,
  rutaDeCierre,
  rutaDeCobro,
  rutaDelProyecto,
  tesorosQueRecibenDolares,
  tiposParaSugerir,
  totalDeLasFilas,
  totalesDeLosPagos,
  valoresDelFormulario,
  type FormularioDeProyecto,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import {
  ajustesDe,
  aperturaDeLaReplica,
  filaPorId,
  filasDe,
  mensajeDeSincronizacion,
} from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  formatearPesos,
  formatearPlata,
  hoyLocal,
  metaDeAvisos,
  useAltoVisible,
  useAnchoDePantalla,
  uuidv7,
  useIr,
  useVolver,
} from '@/shared/lib';
import {
  AdornoDePlata,
  Button,
  Campo,
  CamposJuntos,
  Icono,
  MoneyInput,
  SeccionesEnFilas,
} from '@/shared/ui';

import { conLaOtraMoneda, monedaDeLoMandado, type CambioDeMoneda } from '../model/moneda';
import { FilasDeOpciones } from './FilasDeOpciones';
import { FilasDinamicas } from './FilasDinamicas';
import { HojaDeCambiarLaMoneda } from './HojaDeCambiarLaMoneda';

const FECHA_ALINEADA = '@sm/datos:row-span-3 @sm/datos:grid @sm/datos:grid-rows-subgrid';

function rutaAlTerminar(id: string, volverALiquidar: 'cierre' | 'cobro' | null): string {
  if (volverALiquidar === 'cierre') return rutaDeCierre(id);
  if (volverALiquidar === 'cobro') return rutaDeCobro(id);
  return rutaDelProyecto(id);
}

export interface PantallaDeProyectoProps {
  proyectoId?: string;
  clienteInicial?: string;
  entregaInicial?: string;
  agregarUnaOpcion?: boolean;
  alCrearUnTesoroEnDolares?: (alCrear: (tesoroId: string) => void) => void;
}

function sePuedeCambiarLaMoneda(estado: EstadoProyecto | undefined): boolean {
  return (
    estado === undefined ||
    estado === 'en_seguimiento' ||
    (ESTADOS_DE_CONSULTA as readonly EstadoProyecto[]).includes(estado)
  );
}

export function PantallaDeProyecto({
  proyectoId,
  clienteInicial,
  entregaInicial,
  agregarUnaOpcion = false,
  alCrearUnTesoroEnDolares,
}: PantallaDeProyectoProps) {
  const replica = useReplicaDelTaller();
  const ir = useIr();
  const textos = useMensajes().editarProyecto.pantalla;
  const textosDelFormulario = useMensajes().proyecto.formulario;
  const cancelar = useVolver(
    proyectoId === undefined ? '/proyectos' : rutaDelProyecto(proyectoId),
    textos.cancelar,
    { fija: true },
  );
  const ancho = useAnchoDePantalla();
  const altoVisible = useAltoVisible();
  const idCampos = useId();

  const hoy = hoyLocal();
  const proyecto =
    proyectoId === undefined ? undefined : filaPorId(replica, 'proyectos', proyectoId);
  const clientes = filasDe(replica, 'clientes');

  const alAbrir = useRef({
    id: proyectoId ?? uuidv7(),
    version: proyecto?.version ?? null,
    pagos: proyectoId === undefined ? [] : pagosDelProyecto(replica, proyectoId).map((p) => p.id),
    gastos: proyectoId === undefined ? [] : gastosDelProyecto(replica, proyectoId).map((g) => g.id),
    opciones:
      proyectoId === undefined ? [] : opcionesDelProyecto(replica, proyectoId).map((o) => o.id),
  });

  const guardar = useMutation({
    ...MUTACION_DE_PROYECTO,
    meta: metaDeAvisos('proyectoGuardado', { errorEnPantalla: true }),
  });
  const [rechazo, setRechazo] = useState<unknown>(null);
  const [volverALiquidar, setVolverALiquidar] = useState<'cierre' | 'cobro' | null>(null);
  const revertir = useMutation(MUTACION_DE_REVERSION);

  const clienteDeArranque =
    clienteInicial === undefined ? undefined : filaPorId(replica, 'clientes', clienteInicial);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<FormularioDeProyecto>({
    resolver: zodResolver(esquemaDeProyecto),
    defaultValues: valoresDelFormulario(
      proyecto,
      proyectoId === undefined ? [] : pagosDelProyecto(replica, proyectoId),
      proyectoId === undefined ? [] : gastosDelProyecto(replica, proyectoId),
      proyectoId === undefined ? [] : opcionesDelProyecto(replica, proyectoId),
      {
        clienteId: clienteDeArranque?.id,
        comprobante:
          clienteDeArranque === undefined
            ? undefined
            : comprobanteDeLaCondicion(clienteDeArranque.condicion_fiscal),
        direccion: clienteDeArranque?.direccion,
        entrega: entregaInicial,
        hoy,
      },
    ),
  });

  const pagos = useFieldArray({ control, name: 'pagos', keyName: 'clave' });
  const gastos = useFieldArray({ control, name: 'gastos', keyName: 'clave' });
  const opciones = useFieldArray({ control, name: 'opciones', keyName: 'clave' });
  const { append: agregarOpcion } = opciones;
  const [agregarLaPrimeraOpcion] = useState(
    () =>
      agregarUnaOpcion &&
      proyectoId !== undefined &&
      opcionesDelProyecto(replica, proyectoId).length === 0,
  );

  useEffect(() => {
    if (!agregarLaPrimeraOpcion) return;
    const cuadro = requestAnimationFrame(() => {
      agregarOpcion(opcionVacia(uuidv7()));
    });
    return () => {
      cancelAnimationFrame(cuadro);
    };
  }, [agregarLaPrimeraOpcion, agregarOpcion]);

  const clienteId = useWatch({ control, name: 'cliente_id' });
  const inicio = useWatch({ control, name: 'fecha_inicio' });
  const direccion = useWatch({ control, name: 'direccion_entrega' });
  const presupuesto = useWatch({ control, name: 'presupuesto' });
  const formaDePago = useWatch({ control, name: 'forma_pago' });
  const filasDePagos = useWatch({ control, name: 'pagos' });
  const filasDeGastos = useWatch({ control, name: 'gastos' });
  const filasDeOpciones = useWatch({ control, name: 'opciones' });

  const cliente = clientes.find((fila) => fila.id === clienteId);
  const [entregaAuto, setEntregaAuto] = useState(
    proyecto?.entrega_estimada == null && entregaInicial === undefined,
  );
  const [comprobanteAuto, setComprobanteAuto] = useState(proyecto === undefined);

  useEffect(() => {
    if (!entregaAuto || inicio.trim() === '') return;
    setValue('entrega_estimada', entregaEstimada(inicio), { shouldDirty: true });
  }, [entregaAuto, inicio, setValue]);

  useEffect(() => {
    if (!comprobanteAuto || cliente === undefined) return;
    setValue('comprobante', comprobanteDeLaCondicion(cliente.condicion_fiscal), {
      shouldDirty: true,
    });
  }, [comprobanteAuto, cliente, setValue]);

  const liquidado = proyecto !== undefined && estaLiquidado(proyecto.estado);

  const opcionesDeEstado: EstadoProyecto[] =
    proyecto === undefined
      ? ESTADOS_EN_ORDEN.filter((estado) => faseDe(estado) === 'activos')
      : estadosDisponibles(proyecto.estado);

  const moneda = useWatch({ control, name: 'moneda' });
  const [cambiandoA, setCambiandoA] = useState<Moneda | null>(null);
  const monedaEditable = sePuedeCambiarLaMoneda(proyecto?.estado);
  const tesorosEnDolares = tesorosQueRecibenDolares(replica);
  const dolarDelDia = dolarDelDiaDelTaller(replica);

  const hayOpciones = filasDeOpciones.length > 0;
  const presupuestoEfectivo = hayOpciones ? presupuestoDeLasOpciones(filasDeOpciones) : presupuesto;

  const cobrado = totalesDeLosPagos(filasDePagos, moneda);
  const totalCobrado = cobrado.enSuMoneda;
  const totalGastos = totalDeLasFilas(filasDeGastos);
  const saldo =
    presupuestoEfectivo === null ? null : Math.max(0, presupuestoEfectivo - totalCobrado);
  const neta = cobrado.enPesos - totalGastos;

  function elegirLaMoneda(hacia: Moneda): void {
    if (hacia === moneda) return;
    const valores = getValues();
    const pidenSuDolar =
      hacia !== MONEDA_DEL_TALLER &&
      valores.pagos.some((pago) => pago.moneda === MONEDA_DEL_TALLER && (pago.monto ?? 0) > 0);
    const conImportes =
      (valores.presupuesto ?? 0) > 0 || valores.opciones.some((opcion) => (opcion.monto ?? 0) > 0);
    if (conImportes || pidenSuDolar || monedaDeLoMandado(replica, proyectoId) !== null) {
      setCambiandoA(hacia);
      return;
    }
    setValue('moneda', hacia, { shouldDirty: true });
  }

  function cambiarLaMoneda(cambio: CambioDeMoneda): void {
    const cambiado = conLaOtraMoneda(getValues(), cambio);
    const opciones = { shouldDirty: true };
    setValue('moneda', cambiado.moneda, opciones);
    setValue('presupuesto', cambiado.presupuesto, opciones);
    setValue('opciones', cambiado.opciones, opciones);
    setValue('pagos', cambiado.pagos, opciones);
  }

  function reabrirParaEditar(fila: NonNullable<typeof proyecto>): void {
    const hacia = fila.estado === 'perdido' ? 'presupuesto_enviado' : 'entregado';
    revertir.mutate({
      pedido: pedidoDeReversion(fila, hacia),
      optimista: filaRevertida(fila, hacia, new Date().toISOString()),
      previo: fila,
      titulo: fila.titulo,
    });
    alAbrir.current.version = fila.version + 1;
    setValue('estado', hacia);
    setVolverALiquidar(fila.estado === 'perdido' ? 'cierre' : 'cobro');
  }

  useEffect(() => {
    if (guardar.isPaused) {
      ir(rutaAlTerminar(alAbrir.current.id, volverALiquidar), { como: 'terminar' });
    }
  }, [guardar.isPaused, ir, volverALiquidar]);

  const enviar: SubmitHandler<FormularioDeProyecto> = (valores) => {
    const previos = hijosDelProyecto(replica, alAbrir.current.id);
    const armado = pedidoDeGuardado(
      alAbrir.current.id,
      alAbrir.current.version,
      valores,
      {
        pagos: alAbrir.current.pagos,
        gastos: alAbrir.current.gastos,
        opciones: alAbrir.current.opciones,
      },
      aperturaDeLaReplica(replica),
    );
    const pedido = {
      ...armado,
      datos: conLaVigenciaAlMandar(
        proyecto,
        armado.datos,
        hoy,
        diasQueValeElPresupuesto(ajustesDe(replica)),
      ),
    };

    setRechazo(null);
    guardar.mutate(
      { pedido, previos: { proyecto: proyecto ?? null, ...previos } },
      {
        onSuccess: () => {
          ir(rutaAlTerminar(alAbrir.current.id, volverALiquidar), { como: 'terminar' });
        },
        onError: setRechazo,
      },
    );
  };

  const enCelular = ancho === 'movil';
  const titulo = proyecto === undefined ? textos.proyectoNuevo : textos.editarProyecto;

  return (
    <div
      style={enCelular && altoVisible !== undefined ? { height: altoVisible } : undefined}
      className={
        enCelular
          ? 'fixed inset-x-0 top-0 z-30 flex h-[100dvh] flex-col bg-mesa'
          : 'flex min-h-full flex-col'
      }
    >
      <header className="flex-none border-b border-hairline bg-mesa md:sticky md:top-0 md:z-20">
        <div className="mx-auto grid w-full max-w-content grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 md:h-17 md:px-(--page-pad-tablet) md:py-0 lg:px-(--page-pad-desktop)">
          <Button variant="terciario" className="justify-self-start" onClick={cancelar.volver}>
            <Icono nombre="x" tamano={20} />
            {textos.cancelar}
          </Button>
          <span className="text-center text-body-lg font-semibold">{titulo}</span>
        </div>
      </header>

      <form
        noValidate
        onSubmit={(evento) => {
          void handleSubmit(enviar)(evento);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div
          data-pagina=""
          className={`mx-auto min-h-0 w-full max-w-content flex-1 px-(--page-pad-mobile) py-4 md:px-(--page-pad-tablet) md:py-6 lg:px-(--page-pad-desktop) lg:py-7 ${
            enCelular
              ? 'overflow-y-auto'
              : '[&_:is(input,select,textarea,button)]:scroll-mt-40 [&_:is(input,select,textarea,button)]:scroll-mb-28'
          }`}
        >
          <SeccionesEnFilas separacion="gap-3 @min-[40rem]/secciones:gap-4">
            <div className="@container/datos flex min-w-0 flex-col gap-5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5">
              <CamposJuntos separacion="gap-5">
                <ClienteCombobox
                  clientes={clientes}
                  elegidoId={clienteId === '' ? null : clienteId}
                  alElegir={(elegido) => {
                    setValue('cliente_id', elegido?.id ?? '', { shouldValidate: true });
                    if (elegido === null) return;
                    if (direccion.trim() === '') {
                      setValue('direccion_entrega', elegido.direccion, { shouldDirty: true });
                    }
                  }}
                  error={errors.cliente_id?.message}
                />

                <Campo
                  {...register('titulo')}
                  etiqueta={textos.trabajo}
                  placeholder={textos.trabajoEjemplo}
                  error={errors.titulo?.message}
                />
              </CamposJuntos>

              <Campo
                {...register('tipo_de_proyecto')}
                etiqueta={textos.tipo}
                placeholder={textos.tipoEjemplo}
                list={`${idCampos}-tipos`}
                autoComplete="off"
                maxLength={60}
                ayuda={textos.tipoAyuda}
                error={errors.tipo_de_proyecto?.message}
              />
              <datalist id={`${idCampos}-tipos`}>
                {tiposParaSugerir(filasDe(replica, 'proyectos')).map((tipo) => (
                  <option key={tipo} value={tipo} />
                ))}
              </datalist>

              <fieldset className="flex flex-col gap-1.5">
                <legend className="mb-1.5 text-label text-text-2">{textos.precioEn}</legend>
                <div className="grid grid-cols-2 gap-1 rounded-panel bg-ink/6 p-1 @sm/datos:max-w-80">
                  {MONEDAS.map((una) => (
                    <BotonDeOpcion
                      key={una}
                      elegido={moneda === una}
                      etiqueta={textos.monedas[una]}
                      deshabilitado={!monedaEditable}
                      alElegir={() => {
                        elegirLaMoneda(una);
                      }}
                    />
                  ))}
                </div>
                {!monedaEditable && (
                  <span className="text-meta text-text-3">{textos.laMonedaSeElige}</span>
                )}
              </fieldset>

              <CamposJuntos separacion="gap-5" campoMinimo="14rem">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${idCampos}-presupuesto`} className="text-label text-text-2">
                    {textos.presupuesto}
                  </label>
                  <div
                    className={`flex h-15 items-center gap-1.5 rounded-field border px-3.5 ${
                      errors.presupuesto ? 'border-alerta' : 'border-border'
                    } ${hayOpciones ? 'bg-surface' : ''}`}
                  >
                    <AdornoDePlata moneda={moneda} className="text-money-lg text-text-3" />
                    {hayOpciones ? (
                      <output
                        id={`${idCampos}-presupuesto`}
                        translate={presupuestoEfectivo === null ? undefined : 'no'}
                        className="min-w-0 flex-1 text-money-lg font-semibold text-text-2"
                      >
                        {presupuestoEfectivo === null
                          ? textos.sinDefinir
                          : formatearPlata(presupuestoEfectivo, moneda)}
                      </output>
                    ) : (
                      <Controller
                        control={control}
                        name="presupuesto"
                        render={({ field }) => (
                          <MoneyInput
                            ref={field.ref}
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            moneda={moneda}
                            id={`${idCampos}-presupuesto`}
                            placeholder="0"
                            className="min-w-0 flex-1 bg-transparent text-money-lg font-semibold outline-none"
                          />
                        )}
                      />
                    )}
                  </div>
                  {errors.presupuesto ? (
                    <span role="alert" className="text-label font-medium text-alerta">
                      {moneda === MONEDA_DEL_TALLER
                        ? errors.presupuesto.message
                        : textosDelFormulario.presupuestoNegativoEnDolares}
                    </span>
                  ) : (
                    <span className="text-meta text-text-3">
                      {hayOpciones ? textos.presupuestoDeLaOpcion : textos.presupuestoVacio}
                    </span>
                  )}
                </div>

                <Campo
                  {...register('sena')}
                  etiqueta={textos.senaPropia}
                  className="@min-[29rem]/campos:h-15"
                  inputMode="decimal"
                  placeholder={textos.senaDelTaller}
                  ayuda={textos.senaAyuda}
                  error={errors.sena?.message}
                />
              </CamposJuntos>

              <fieldset className="flex flex-col gap-1.5">
                <legend className="mb-1.5 text-label text-text-2">{textos.formaDePago}</legend>
                <div className="grid grid-cols-2 gap-1 rounded-panel bg-ink/6 p-1 @sm/datos:grid-cols-4">
                  {FORMAS_EN_ORDEN.map((forma) => (
                    <BotonDeOpcion
                      key={forma}
                      elegido={formaDePago === forma}
                      etiqueta={FORMA_DE_PAGO[forma]}
                      alElegir={() => {
                        setValue('forma_pago', forma, { shouldDirty: true });
                      }}
                    />
                  ))}
                </div>
              </fieldset>

              <div
                data-fila="fechas"
                className="grid grid-cols-1 gap-4 @sm/datos:grid-cols-2 @sm/datos:gap-x-3 @sm/datos:gap-y-1.5 @min-[44rem]/datos:grid-cols-3 @min-[44rem]/datos:gap-x-4"
              >
                <Campo
                  {...register('fecha_inicio')}
                  etiqueta={textos.fechaDeInicio}
                  type="date"
                  error={errors.fecha_inicio?.message}
                  contenedor={FECHA_ALINEADA}
                />
                <Campo
                  {...register('entrega_estimada', {
                    onChange: () => {
                      setEntregaAuto(false);
                    },
                  })}
                  etiqueta={textos.entregaEstimada}
                  type="date"
                  ayuda={entregaAuto ? textos.entregaCalculada : undefined}
                  contenedor={FECHA_ALINEADA}
                />
                <Campo
                  {...register('entrega_hora')}
                  etiqueta={textos.horaDeLaEntrega}
                  type="time"
                  ayuda={textos.horaAyuda}
                  contenedor={FECHA_ALINEADA}
                />
              </div>

              <CamposJuntos columnas={3} separacion="gap-5">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={`${idCampos}-estado`} className="text-label text-text-2">
                    {textos.estado}
                  </label>
                  <select
                    {...register('estado')}
                    id={`${idCampos}-estado`}
                    disabled={liquidado}
                    className="h-field rounded-field border border-border bg-paper px-3 text-body-lg text-ink disabled:text-text-3"
                  >
                    {opcionesDeEstado.map((estado) => (
                      <option key={estado} value={estado}>
                        {ESTADO[estado].etiqueta}
                      </option>
                    ))}
                  </select>
                  {liquidado && (
                    <span className="text-meta text-text-3">
                      {proyecto.estado === 'perdido'
                        ? textos.estadoCongelado.perdido
                        : textos.estadoCongelado.cobrado}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`${idCampos}-direccion`}
                    className="flex items-center justify-between gap-2 text-label text-text-2"
                  >
                    {textos.direccionDeEntrega}
                    {cliente !== undefined && direccion.trim() !== cliente.direccion.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setValue('direccion_entrega', cliente.direccion, { shouldDirty: true });
                        }}
                        className="min-h-tap px-1 underline underline-offset-3 @min-[50rem]/campos:-my-3"
                      >
                        {textos.usarLaDelCliente}
                      </button>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register('direccion_entrega')}
                      id={`${idCampos}-direccion`}
                      placeholder={textos.direccionEjemplo}
                      className="h-field min-w-0 flex-1 rounded-field border border-border bg-paper px-3.5 text-body-lg text-ink"
                    />
                    <a
                      href={enlaceDeMapa(direccion, '') ?? '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={textos.abrirLaDireccion}
                      aria-disabled={direccion.trim() === '' ? true : undefined}
                      className={`flex size-field flex-none items-center justify-center rounded-pill border border-border ${
                        direccion.trim() === ''
                          ? 'pointer-events-none text-text-3'
                          : 'hover:bg-surface'
                      }`}
                    >
                      <Icono nombre="map-pin" tamano={18} />
                    </a>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`${idCampos}-comprobante`}
                    className="flex items-baseline justify-between gap-2 text-label text-text-2"
                  >
                    {textos.comprobante}
                    {comprobanteAuto && cliente !== undefined && (
                      <span className="text-meta text-text-3">
                        {textos.porLaCondicion(CONDICION[cliente.condicion_fiscal].etiqueta)}
                      </span>
                    )}
                  </label>
                  <select
                    {...register('comprobante', {
                      onChange: () => {
                        setComprobanteAuto(false);
                      },
                    })}
                    id={`${idCampos}-comprobante`}
                    className="h-field rounded-field border border-border bg-paper px-3 text-body-lg text-ink"
                  >
                    {COMPROBANTES_EN_ORDEN.map((comprobante) => (
                      <option key={comprobante} value={comprobante}>
                        {COMPROBANTE[comprobante]}
                      </option>
                    ))}
                  </select>
                </div>
              </CamposJuntos>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${idCampos}-notas`} className="text-label text-text-2">
                  {textos.notasDeObra}
                </label>
                <textarea
                  {...register('notas')}
                  id={`${idCampos}-notas`}
                  rows={3}
                  placeholder={textos.notasEjemplo}
                  className="rounded-field border border-border bg-paper px-3.5 py-2.5 text-body-lg text-ink"
                />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 md:gap-4">
              {liquidado && (
                <div
                  role="alert"
                  className="rounded-panel border border-hairline bg-paper px-4 py-4 text-label leading-snug text-text-2 md:px-5"
                >
                  <p>
                    {proyecto.estado === 'perdido'
                      ? textos.repartoCerrado.perdido
                      : textos.repartoCerrado.cobrado}
                  </p>
                  <Button
                    variant="secundario"
                    size="chico"
                    className="mt-2"
                    onClick={() => {
                      reabrirParaEditar(proyecto);
                    }}
                  >
                    <Icono nombre="arrow-left-right" tamano={16} />
                    {proyecto.estado === 'perdido' ? textos.reactivarlo : textos.reabrirElCobro}
                  </Button>
                  <p className="mt-1.5 text-meta text-text-3">
                    {proyecto.estado === 'perdido'
                      ? textos.alGuardarLoCierra
                      : textos.alGuardarLoCobra}
                  </p>
                </div>
              )}
              <FilasDeOpciones
                control={control}
                register={register}
                errores={errors}
                campos={opciones}
                bloqueado={false}
              />
              <FilasDinamicas
                lista="pagos"
                control={control}
                register={register}
                setValue={setValue}
                errores={errors}
                campos={pagos}
                bloqueado={liquidado}
                apertura={aperturaDeLaReplica(replica)}
                delPago={{
                  monedaDelTrabajo: moneda,
                  monedaNueva: monedaDeUnPagoNuevo(proyecto, moneda),
                  tesorosEnDolares,
                  dolarDelDia,
                  alCrearUnTesoroEnDolares,
                }}
              />
              <FilasDinamicas
                lista="gastos"
                control={control}
                register={register}
                errores={errors}
                campos={gastos}
                bloqueado={liquidado}
              />
            </div>
          </SeccionesEnFilas>
        </div>

        <footer className="flex-none border-t border-hairline bg-mesa md:sticky md:bottom-0 md:z-20">
          <div className="@container/barra mx-auto flex w-full max-w-content flex-wrap items-center gap-3 px-(--page-pad-mobile) py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] md:px-(--page-pad-tablet) md:py-3.5 lg:px-(--page-pad-desktop)">
            {rechazo !== null && (
              <p role="alert" className="basis-full text-label font-medium text-alerta">
                {mensajeDeSincronizacion(rechazo, {
                  operacion: 'proyecto',
                  sujeto: proyecto?.titulo,
                  estado: proyecto?.estado === 'perdido' ? 'perdido' : 'cobrado',
                })}
              </p>
            )}
            <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-1 tabular-nums @min-[21rem]/barra:flex @min-[21rem]/barra:w-auto @min-[21rem]/barra:min-w-[210px] @min-[21rem]/barra:flex-1 md:gap-6 lg:gap-8">
              <Total
                etiqueta={textos.totales.presupuesto}
                valor={
                  presupuestoEfectivo === null ? '—' : formatearPlata(presupuestoEfectivo, moneda)
                }
              />
              <Total
                etiqueta={textos.totales.cobrado}
                valor={formatearPlata(totalCobrado, moneda)}
                tono="text-hogar"
              />
              <Total
                etiqueta={textos.totales.saldo}
                valor={saldo === null ? '—' : formatearPlata(saldo, moneda)}
              />
              <Total
                etiqueta={textos.totales.neta}
                valor={formatearPesos(neta)}
                tono={neta < 0 ? 'text-alerta' : 'text-maun'}
              />
            </dl>
            <Button
              type="submit"
              cargando={guardar.isPending}
              className="min-w-[170px] flex-1 md:flex-none"
            >
              {proyecto === undefined ? textos.guardarProyecto : textos.guardarLosCambios}
            </Button>
          </div>
        </footer>
      </form>
      {cambiandoA !== null && (
        <HojaDeCambiarLaMoneda
          hacia={cambiandoA}
          valores={getValues()}
          dolarDelDia={dolarDelDia}
          monedaDeLoMandado={monedaDeLoMandado(replica, proyectoId)}
          alCerrar={() => {
            setCambiandoA(null);
          }}
          alCambiar={cambiarLaMoneda}
        />
      )}
    </div>
  );
}

function Total({ etiqueta, valor, tono = '' }: { etiqueta: string; valor: string; tono?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-meta text-text-3 lg:text-label">{etiqueta}</dt>
      <dd
        translate="no"
        className={`text-label font-semibold whitespace-nowrap md:text-body-lg lg:text-money-lg ${tono}`}
      >
        {valor}
      </dd>
    </div>
  );
}

function BotonDeOpcion({
  elegido,
  etiqueta,
  alElegir,
  deshabilitado = false,
}: {
  elegido: boolean;
  etiqueta: string;
  alElegir: () => void;
  deshabilitado?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={elegido}
      disabled={deshabilitado}
      onClick={alElegir}
      className={`min-h-tap rounded-[16px] text-label disabled:cursor-not-allowed ${
        elegido ? 'bg-elevado font-semibold text-ink shadow-float' : 'font-medium text-text-2'
      }`}
    >
      {etiqueta}
    </button>
  );
}
