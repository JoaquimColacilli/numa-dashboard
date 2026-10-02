import { esAnteriorALaApertura, porcentajeDeLaSena } from '@maun/domain';
import { useMutation } from '@tanstack/react-query';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type SyntheticEvent,
} from 'react';

import { CONDICION, EnlaceACliente } from '@/entities/cliente';
import { CasillaDeLaApertura } from '@/entities/movimiento';
import {
  BotonDeLaMoneda,
  COMPROBANTE,
  COMPROBANTES_EN_ORDEN,
  comprobanteDeLaCondicion,
  conOtraMoneda,
  DetalleDelPago,
  dolarDelDiaParaUnPago,
  FORMA_DE_PAGO,
  FORMAS_EN_ORDEN,
  formasDelTrabajo,
  monedasGuardadas,
  MUTACION_DE_PROYECTO,
  opcionAprobada,
  rutaDeEdicion,
  rutaDelProyecto,
  senaDelProyecto,
  senaDelTaller,
  type Comprobante,
  type ErroresDelPago,
  type FormaDePago,
  type OpcionDePresupuesto,
  type ResumenDeProyecto,
  type ValorDelPago,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import { ajustesDe, aperturaDeLaReplica, mensajeDeSincronizacion } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  errorDeLaFechaDeLaPlata,
  formatearPesos,
  formatearPlata,
  formatearPorcentaje,
  hoyEnElTaller,
  uuidv7,
  Ir,
  useIr,
  useVolver,
} from '@/shared/lib';
import { AdornoDePlata, Button, Campo, CamposJuntos, Icono, MoneyInput, Pagina } from '@/shared/ui';

import {
  cuantoDescuenta,
  erroresDelPago,
  hayErroresEnElPago,
  pagoNuevo,
  paraLosPagos,
} from '../model/pagoDeLaConsulta';
import {
  errorDelPasaje,
  formaSugerida,
  guardadoDelPasaje,
  haySenaAhora,
  presupuestoDelPasaje,
  resumenDelPasaje,
  senaDelPasaje,
  senaSugerida,
} from '../model/pasaje';
import {
  avisoDelAcordado,
  ayudaDeLaEntrega,
  entregaDelPasaje,
  loMandadoAlCliente,
  plazoDelPasaje,
} from '../model/presupuestoMandado';

export interface PantallaDePasajeProps {
  resumen: ResumenDeProyecto;
  opciones: readonly OpcionDePresupuesto[];
  alCrearUnTesoroEnDolares?: (alCrear: (tesoroId: string) => void) => void;
}

const CIFRA = 'contents @min-[44rem]:flex @min-[44rem]:flex-col @min-[44rem]:gap-0.5';

export function PantallaDePasaje({
  resumen,
  opciones,
  alCrearUnTesoroEnDolares,
}: PantallaDePasajeProps) {
  const textos = useMensajes().avanzarLaConsulta.pasaje;
  const ir = useIr();
  const idCampos = useId();
  const replica = useReplicaDelTaller();
  const { proyecto, cliente } = resumen;
  const vuelta = useVolver(rutaDelProyecto(proyecto.id), textos.volverSinAprobar, { fija: true });
  const CorregirLaOpcion = useCallback(
    ({ children }: { children: ReactNode }) => (
      <Ir
        a={rutaDeEdicion(proyecto.id)}
        className="font-medium text-text-2 underline underline-offset-3"
      >
        {children}
      </Ir>
    ),
    [proyecto.id],
  );
  const hoy = hoyEnElTaller();
  const apertura = aperturaDeLaReplica(replica);
  const para = paraLosPagos(replica);
  const { moneda } = resumen;

  const guardar = useMutation(MUTACION_DE_PROYECTO);
  const [rechazo, setRechazo] = useState<unknown>(null);

  const [presupuesto, setPresupuesto] = useState<number | null>(proyecto.presupuesto_centavos);
  const [opcion, setOpcion] = useState<string | null>(() => opcionAprobada(opciones)?.id ?? null);
  const [falta, setFalta] = useState<string | undefined>(undefined);
  const primeraOpcion = useRef<HTMLInputElement>(null);
  const campoDelPresupuesto = useRef<HTMLInputElement>(null);
  const [forma, setForma] = useState<FormaDePago>(() =>
    formaSugerida(proyecto.forma_pago, formasDelTrabajo(proyecto, 'sena', ajustesDe(replica))),
  );
  const [mandado] = useState(() => loMandadoAlCliente(replica, proyecto.id));
  const plazo = plazoDelPasaje(mandado);
  const [inicio, setInicio] = useState(proyecto.fecha_inicio ?? hoy);
  const [entrega, setEntrega] = useState(
    () => proyecto.entrega_estimada ?? entregaDelPasaje(proyecto.fecha_inicio ?? hoy, plazo),
  );
  const [entregaAuto, setEntregaAuto] = useState(proyecto.entrega_estimada === null);
  const [direccion, setDireccion] = useState(
    proyecto.direccion_entrega.trim() === ''
      ? (cliente?.direccion ?? '')
      : proyecto.direccion_entrega,
  );
  const [comprobante, setComprobante] = useState<Comprobante>(
    proyecto.comprobante === 'sin_comprobante' && cliente !== undefined
      ? comprobanteDeLaCondicion(cliente.condicion_fiscal)
      : proyecto.comprobante,
  );

  const hayOpciones = opciones.length > 0;
  const aprobado = presupuestoDelPasaje(opciones, { presupuesto, opcion });
  const acordado = avisoDelAcordado(mandado, opcion, aprobado, {
    moneda,
    cobraEn: monedasGuardadas(proyecto),
  });

  const porcentaje = porcentajeDeLaSena(
    senaDelProyecto(proyecto),
    senaDelTaller(ajustesDe(replica)),
  );
  const esperada = senaDelPasaje(
    aprobado,
    resumen.cobradoEnSuMoneda.importe,
    senaDelTaller(ajustesDe(replica)),
    senaDelProyecto(proyecto),
    moneda,
  );
  const [pagoDeLaSena, setPagoDeLaSena] = useState<ValorDelPago>(() => {
    const nuevo = pagoNuevo(proyecto, hoy, para);
    return nuevo.moneda === moneda ? { ...nuevo, monto: senaSugerida(esperada) } : nuevo;
  });
  const [senaAMano, setSenaAMano] = useState(false);
  const [erroresDeLaSena, setErroresDeLaSena] = useState<ErroresDelPago>({});
  const cuenta = resumenDelPasaje(
    aprobado,
    resumen.cobradoEnSuMoneda.importe,
    cuantoDescuenta(pagoDeLaSena, moneda),
  );
  const [idDelPago] = useState(uuidv7);
  const [diaDeLaSena, setDiaDeLaSena] = useState(hoy);
  const [senaMarcada, setSenaMarcada] = useState(true);
  const [errorDelDia, setErrorDelDia] = useState<string | undefined>(undefined);
  const campoDelDia = useRef<HTMLInputElement>(null);

  function cambiarLaSena(valor: ValorDelPago): void {
    setPagoDeLaSena(valor);
    setErroresDeLaSena({});
  }

  function sugerirLaSena(aprobadoAhora: number | null): void {
    if (senaAMano) return;
    const sugerida = senaSugerida(
      senaDelPasaje(
        aprobadoAhora,
        resumen.cobradoEnSuMoneda.importe,
        senaDelTaller(ajustesDe(replica)),
        senaDelProyecto(proyecto),
        moneda,
      ),
    );
    setPagoDeLaSena((previo) =>
      previo.moneda === moneda ? { ...previo, monto: sugerida } : previo,
    );
  }

  function elegirOpcion(id: string): void {
    setOpcion(id);
    setFalta(undefined);
    sugerirLaSena(opciones.find((una) => una.id === id)?.monto_centavos ?? null);
  }

  useEffect(() => {
    if (guardar.isPaused) {
      ir(rutaDelProyecto(proyecto.id), { como: 'terminar', senal: 'recienAprobado' });
    }
  }, [guardar.isPaused, ir, proyecto.id]);

  function aprobar(evento: SyntheticEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const encontrado = errorDelPasaje(opciones, { presupuesto, opcion }, moneda);
    setFalta(encontrado);
    if (encontrado !== undefined) {
      (hayOpciones ? primeraOpcion : campoDelPresupuesto).current?.focus();
      return;
    }
    const conSena = haySenaAhora(pagoDeLaSena.monto);
    const delDia = conSena ? errorDeLaFechaDeLaPlata(diaDeLaSena, hoy) : undefined;
    setErrorDelDia(delDia);
    if (delDia !== undefined) {
      campoDelDia.current?.focus();
      return;
    }
    const delPago = conSena ? erroresDelPago(pagoDeLaSena, moneda, para.tesorosEnDolares) : {};
    setErroresDeLaSena(delPago);
    if (hayErroresEnElPago(delPago)) return;

    setRechazo(null);
    guardar.mutate(
      guardadoDelPasaje(
        proyecto,
        opciones,
        {
          presupuesto,
          opcion,
          sena: pagoDeLaSena.monto,
          monedaDeLaSena: pagoDeLaSena.moneda,
          cotizacionDeLaSena: pagoDeLaSena.cotizacion,
          tesoroDeLaSena: pagoDeLaSena.tesoroId,
          forma,
          comprobante,
          inicio,
          entrega,
          direccion,
          diaDeLaSena,
          senaEnLaApertura: esAnteriorALaApertura(diaDeLaSena, apertura) && senaMarcada,
        },
        hoy,
        idDelPago,
      ),
      {
        onSuccess: () => {
          ir(rutaDelProyecto(proyecto.id), { como: 'terminar', senal: 'recienAprobado' });
        },
        onError: setRechazo,
      },
    );
  }

  const campoDeLaSena = (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={`${idCampos}-sena`}
        className="flex items-baseline justify-between gap-2 text-label text-text-2"
      >
        {textos.senaQueCobrasAhora}
        <span className="text-meta text-text-3">
          {textos.porcentajeDelPresupuesto(formatearPorcentaje(porcentaje))}
        </span>
      </label>
      <div className="flex h-15 items-center gap-1.5 rounded-field border border-border px-3.5">
        <BotonDeLaMoneda
          moneda={pagoDeLaSena.moneda}
          alCambiar={(otra) => {
            cambiarLaSena(conOtraMoneda(pagoDeLaSena, otra, para.tesorosEnDolares));
          }}
          className="text-money-lg"
        />
        <MoneyInput
          id={`${idCampos}-sena`}
          moneda={pagoDeLaSena.moneda}
          placeholder="0"
          value={pagoDeLaSena.monto}
          aria-describedby={`${idCampos}-sena-ayuda`}
          onChange={(centavos) => {
            cambiarLaSena({ ...pagoDeLaSena, monto: centavos });
            setSenaAMano(true);
          }}
          className="min-w-0 flex-1 bg-transparent text-money-lg font-semibold outline-none"
        />
      </div>
      <p id={`${idCampos}-sena-ayuda`} className="text-meta leading-normal text-text-3">
        {esperada.situacion === 'cubierta' ? textos.senaCubierta : textos.senaComoPago}
      </p>
      <DetalleDelPago
        valor={pagoDeLaSena}
        alCambiar={cambiarLaSena}
        monedaDelTrabajo={moneda}
        tesorosEnDolares={para.tesorosEnDolares}
        dolarDelDia={dolarDelDiaParaUnPago(
          { moneda: pagoDeLaSena.moneda, fecha: diaDeLaSena },
          moneda,
          para.dolarDelDia,
        )}
        alCrearUnTesoroEnDolares={
          alCrearUnTesoroEnDolares === undefined
            ? undefined
            : () => {
                alCrearUnTesoroEnDolares((tesoroId) => {
                  setPagoDeLaSena((previo) => ({ ...previo, tesoroId }));
                  setErroresDeLaSena({});
                });
              }
        }
        errores={erroresDeLaSena}
      />
      {haySenaAhora(pagoDeLaSena.monto) && (
        <>
          <Campo
            ref={campoDelDia}
            etiqueta={textos.diaEnQueEntroLaSena}
            type="date"
            contenedor="mt-2"
            max={hoy}
            value={diaDeLaSena}
            error={errorDelDia}
            onChange={(evento) => {
              setDiaDeLaSena(evento.target.value);
              setErrorDelDia(undefined);
            }}
          />
          <CasillaDeLaApertura
            fecha={diaDeLaSena}
            apertura={apertura}
            marcada={senaMarcada}
            alCambiar={setSenaMarcada}
          />
        </>
      )}
    </div>
  );

  return (
    <Pagina className="gap-3 md:gap-4">
      <Ir
        a={rutaDelProyecto(proyecto.id)}
        alTocar={vuelta.volver}
        className="-ml-1 flex min-h-tap w-fit items-center gap-1 rounded-pill pr-3 pl-1 text-body font-medium text-text-2 hover:bg-ink/5"
      >
        <Icono nombre="chevron-left" tamano={20} />
        {vuelta.etiqueta}
      </Ir>

      <header>
        <p aria-hidden className="mb-2 flex items-center gap-1.5 text-meta text-text-2">
          <span className="rounded-pill border border-hairline bg-paper px-2">
            {textos.consultas}
          </span>
          <Icono nombre="chevron-right" tamano={14} />
          <span className="rounded-pill border border-ink bg-paper px-2 font-semibold text-ink">
            {textos.activos}
          </span>
        </p>
        <p className="text-label text-text-2">
          {cliente === undefined ? (
            resumen.nombreDelCliente
          ) : (
            <EnlaceACliente id={cliente.id} nombre={cliente.nombre} />
          )}
        </p>
        <h1 className="mt-0.5 font-display text-h1 leading-tight lg:text-h1-lg">
          {textos.titulo(proyecto.titulo)}
        </h1>
        <p className="mt-1.5 max-w-[560px] text-body leading-relaxed text-text-2">
          {textos.bajada}
        </p>
      </header>

      <form noValidate onSubmit={aprobar} className="flex flex-col gap-3 md:gap-4">
        <div className="@container flex flex-col gap-5 rounded-panel border border-hairline bg-paper px-4 py-4 md:px-5">
          {hayOpciones ? (
            <fieldset
              aria-describedby={
                falta === undefined
                  ? `${idCampos}-opciones-ayuda`
                  : `${idCampos}-opciones-ayuda ${idCampos}-opciones-error`
              }
              className="flex flex-col gap-1.5"
            >
              <legend className="mb-1.5 text-label text-text-2">{textos.queOpcionAprobo}</legend>
              <div className="flex flex-col gap-2">
                {opciones.map((una, indice) => (
                  <label
                    key={una.id}
                    className={`flex min-h-tap cursor-pointer items-center gap-3 rounded-field border px-3.5 py-3 has-checked:border-ink has-checked:bg-surface ${
                      falta === undefined ? 'border-border' : 'border-alerta'
                    }`}
                  >
                    <input
                      ref={indice === 0 ? primeraOpcion : undefined}
                      type="radio"
                      name={`${idCampos}-opcion`}
                      value={una.id}
                      checked={opcion === una.id}
                      onChange={() => {
                        elegirOpcion(una.id);
                      }}
                      className="size-5 flex-none accent-ink"
                    />
                    {una.descripcion.trim() === '' ? (
                      <span className="min-w-0 flex-1 text-body-lg leading-snug font-medium">
                        {textos.opcionSinDetalle}
                      </span>
                    ) : (
                      <span
                        translate="no"
                        className="min-w-0 flex-1 text-body-lg leading-snug font-medium"
                      >
                        {una.descripcion}
                      </span>
                    )}
                    <span
                      translate="no"
                      className="flex-none text-money font-semibold tabular-nums"
                    >
                      {formatearPlata(una.monto_centavos, resumen.moneda)}
                    </span>
                  </label>
                ))}
              </div>
              <p id={`${idCampos}-opciones-ayuda`} className="text-meta leading-normal text-text-3">
                {textos.corregirLaOpcion(CorregirLaOpcion)}
              </p>
              {falta !== undefined && (
                <span
                  id={`${idCampos}-opciones-error`}
                  role="alert"
                  className="text-label font-medium text-alerta"
                >
                  {falta}
                </span>
              )}
            </fieldset>
          ) : (
            <CamposJuntos separacion="gap-5">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={`${idCampos}-presupuesto`} className="text-label text-text-2">
                  {textos.presupuestoAprobado}
                </label>
                <div
                  className={`flex h-15 items-center gap-1.5 rounded-field border px-3.5 ${
                    falta === undefined ? 'border-ink' : 'border-alerta'
                  }`}
                >
                  <AdornoDePlata moneda={resumen.moneda} className="text-money-lg text-text-3" />
                  <MoneyInput
                    ref={campoDelPresupuesto}
                    id={`${idCampos}-presupuesto`}
                    placeholder="0"
                    value={presupuesto}
                    aria-invalid={falta === undefined ? undefined : true}
                    aria-describedby={
                      falta === undefined ? undefined : `${idCampos}-presupuesto-error`
                    }
                    onChange={(centavos) => {
                      setPresupuesto(centavos);
                      setFalta(undefined);
                      sugerirLaSena(centavos);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-money-lg font-semibold outline-none"
                  />
                </div>
                {falta !== undefined && (
                  <span
                    id={`${idCampos}-presupuesto-error`}
                    role="alert"
                    className="text-label font-medium text-alerta"
                  >
                    {falta}
                  </span>
                )}
              </div>
              {campoDeLaSena}
            </CamposJuntos>
          )}
          {hayOpciones && campoDeLaSena}

          <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 rounded-field bg-surface px-3.5 py-3 text-body tabular-nums @min-[44rem]:auto-cols-fr @min-[44rem]:grid-flow-col @min-[44rem]:grid-cols-none @min-[44rem]:gap-x-6">
            {hayOpciones && (
              <div className={CIFRA}>
                <dt className="text-text-2">{textos.presupuestoAprobado}</dt>
                <dd translate="no" className="text-right font-semibold @min-[44rem]:text-left">
                  {aprobado === null ? '—' : formatearPlata(aprobado, resumen.moneda)}
                </dd>
              </div>
            )}
            <div className={CIFRA}>
              <dt className="text-text-2">{textos.yaCobradoAntes}</dt>
              <dd
                translate="no"
                className="text-right font-medium text-hogar @min-[44rem]:text-left"
              >
                {formatearPlata(cuenta.antes, resumen.moneda)}
              </dd>
            </div>
            <div className={CIFRA}>
              <dt className="text-text-2">{textos.senaQueCobrasAhora}</dt>
              <dd
                translate="no"
                className="text-right font-medium text-hogar @min-[44rem]:text-left"
              >
                {formatearPlata(cuenta.ahora, resumen.moneda)}
              </dd>
            </div>
            <div className={CIFRA}>
              <dt className="text-text-2">{textos.cobradoEnTotal}</dt>
              <dd
                translate="no"
                className="text-right font-semibold text-hogar @min-[44rem]:text-left"
              >
                {formatearPlata(cuenta.cobrado, resumen.moneda)}
              </dd>
            </div>
            <div className={CIFRA}>
              <dt className="text-text-2">{textos.saldoACobrar}</dt>
              <dd translate="no" className="text-right font-semibold @min-[44rem]:text-left">
                {cuenta.saldo === null ? '—' : formatearPlata(cuenta.saldo, resumen.moneda)}
              </dd>
            </div>
            {resumen.gastos > 0 && (
              <div className={CIFRA}>
                <dt className="text-text-2">{textos.gastosYaCargados}</dt>
                <dd translate="no" className="text-right font-medium @min-[44rem]:text-left">
                  {formatearPesos(resumen.gastos)}
                </dd>
              </div>
            )}
          </dl>

          {acordado !== null && (
            <p
              id={`${idCampos}-acordado`}
              className="-mt-2 rounded-field bg-atencion-tint px-3.5 py-3 text-label leading-relaxed text-pretty text-atencion"
            >
              {acordado}
            </p>
          )}

          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-label text-text-2">{textos.formaDePago}</legend>
            <div className="grid grid-cols-2 gap-1 rounded-panel bg-ink/6 p-1 @sm:grid-cols-4">
              {FORMAS_EN_ORDEN.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  role="radio"
                  aria-checked={forma === opcion}
                  onClick={() => {
                    setForma(opcion);
                  }}
                  className={`min-h-tap rounded-[16px] text-label ${
                    forma === opcion
                      ? 'bg-elevado font-semibold text-ink shadow-float'
                      : 'font-medium text-text-2'
                  }`}
                >
                  {FORMA_DE_PAGO[opcion]}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @sm:gap-x-4 @sm:gap-y-1.5">
            <Campo
              etiqueta={textos.fechaDeInicio}
              type="date"
              contenedor="@sm:row-span-3 @sm:grid @sm:grid-rows-subgrid"
              value={inicio}
              onChange={(evento) => {
                setInicio(evento.target.value);
                if (entregaAuto && evento.target.value !== '') {
                  setEntrega(entregaDelPasaje(evento.target.value, plazo));
                }
              }}
            />
            <Campo
              etiqueta={textos.entregaEstimada}
              type="date"
              contenedor="@sm:row-span-3 @sm:grid @sm:grid-rows-subgrid"
              value={entrega}
              ayuda={entregaAuto ? ayudaDeLaEntrega(plazo, mandado !== null) : undefined}
              onChange={(evento) => {
                setEntrega(evento.target.value);
                setEntregaAuto(false);
              }}
            />
          </div>

          <CamposJuntos separacion="gap-5">
            <Campo
              etiqueta={textos.direccionDeEntrega}
              placeholder={textos.ejemploDeDireccion}
              maxLength={500}
              value={direccion}
              onChange={(evento) => {
                setDireccion(evento.target.value);
              }}
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`${idCampos}-comprobante`}
                className="flex items-baseline justify-between gap-2 text-label text-text-2"
              >
                {textos.comprobanteAEmitir}
                {cliente !== undefined && (
                  <span className="text-meta text-text-3">
                    {CONDICION[cliente.condicion_fiscal].etiqueta}
                  </span>
                )}
              </label>
              <select
                id={`${idCampos}-comprobante`}
                value={comprobante}
                onChange={(evento) => {
                  setComprobante(evento.target.value as Comprobante);
                }}
                className="h-field rounded-field border border-border bg-paper px-3 text-body-lg text-ink"
              >
                {COMPROBANTES_EN_ORDEN.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {COMPROBANTE[opcion]}
                  </option>
                ))}
              </select>
            </div>
          </CamposJuntos>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            cargando={guardar.isPending && !guardar.isPaused}
            aria-describedby={acordado === null ? undefined : `${idCampos}-acordado`}
          >
            <Icono nombre="hammer" tamano={18} />
            {textos.pasarAProyectos}
          </Button>
          {rechazo !== null && (
            <p role="alert" className="mt-2 text-label font-medium text-alerta">
              {mensajeDeSincronizacion(rechazo, {
                operacion: 'proyecto',
                sujeto: proyecto.titulo,
              })}
            </p>
          )}
        </div>
      </form>
    </Pagina>
  );
}
