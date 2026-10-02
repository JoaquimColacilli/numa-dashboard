import { useMutation } from '@tanstack/react-query';
import { useEffect, useId, useRef, useState, type SyntheticEvent } from 'react';

import { ClienteCombobox, MUTACION_DE_CLIENTE } from '@/entities/cliente';
import {
  hijosDelProyecto,
  MUTACION_DE_PROYECTO,
  pagosDelProyecto,
  type Proyecto,
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
import { Button, Campo, FilaDeAcciones, Hoja, MoneyInput } from '@/shared/ui';

import {
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
  valoresConOtraVisita,
  valoresDelContacto,
  type ErroresDelContacto,
  type ValoresDelContacto,
} from '../model/contacto';

export interface HojaDeContactoProps {
  proyecto?: Proyecto;
  visitaInicial?: string;
  enfocarLaVisita?: boolean;
  enfocarLaVigencia?: boolean;
  alCerrar: () => void;
  alGuardar?: (id: string) => void;
}

export function HojaDeContacto({
  proyecto,
  visitaInicial,
  enfocarLaVisita = false,
  enfocarLaVigencia = false,
  alCerrar,
  alGuardar,
}: HojaDeContactoProps) {
  const textos = useMensajes().avanzarLaConsulta.contacto;
  const replica = useReplicaDelTaller();
  const idCampos = useId();
  const cuerpo = useRef<HTMLDivElement>(null);
  const hoy = hoyEnElTaller();
  const apertura = aperturaDeLaReplica(replica);

  const clientes = filasDe(replica, 'clientes');
  const pagos = proyecto === undefined ? [] : pagosDelProyecto(replica, proyecto.id);
  const sena = senaEditable(pagos);
  const cobrado = totalesDelProyecto(replica, proyecto?.id ?? '').cobradoEnSuMoneda;

  const alAbrir = useRef({ id: proyecto?.id ?? uuidv7(), idDeSenaNueva: uuidv7() });
  const [iniciales] = useState<ValoresDelContacto>(() =>
    valoresDelContacto(proyecto, sena, visitaInicial),
  );
  const [valores, setValores] = useState<ValoresDelContacto>(iniciales);
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

  function terminar(): void {
    if (yaTermino.current) return;
    yaTermino.current = true;
    if (alGuardar) alGuardar(alAbrir.current.id);
    else alCerrar();
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const encontrados = erroresDelContacto(valores, telefonoVisible, hoy);
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
      },
      { onSuccess: terminar, onError: setRechazo },
    );
  }

  const esContactoSinEtapa = proyecto === undefined || proyecto.estado === 'contacto';

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
            <ClienteCombobox
              clientes={clientes}
              elegidoId={valores.clienteId === '' ? null : valores.clienteId}
              alElegir={(elegido) => {
                cambiar('clienteId', elegido?.id ?? '');
                setTelefono(undefined);
              }}
              error={errores.cliente}
            />

            {valores.clienteId !== '' && (
              <Campo
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
              etiqueta={textos.quePide}
              placeholder={textos.ejemploDeQuePide}
              maxLength={200}
              value={valores.titulo}
              onChange={(evento) => {
                cambiar('titulo', evento.target.value);
              }}
              error={errores.titulo}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
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
                <div className="flex flex-col gap-1.5">
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
                <MoneyInput
                  etiqueta={textos.senaCobrada}
                  conMarcador
                  value={valores.sena}
                  onChange={(centavos) => {
                    cambiar('sena', centavos);
                  }}
                  ayuda={textos.ayudaDeLaSena}
                />
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

            <div className="flex flex-col gap-1.5">
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
