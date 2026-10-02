import { esAnteriorALaApertura } from '@maun/domain';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';

import { CasillaDeLaApertura } from '@/entities/movimiento';
import {
  CamposDelPago,
  dolarDelDiaParaUnPago,
  type ErroresDelPago,
  type Proyecto,
  type ValorDelPago,
} from '@/entities/proyecto';
import { useReplicaDelTaller } from '@/entities/replica';
import type { CambiosDeProyecto, PagoParaGuardar } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { errorDeLaFechaDeLaPlata, hoyEnElTaller, uuidv7 } from '@/shared/lib';
import { Button, Campo, FilaDeAcciones, MoneyInput } from '@/shared/ui';

import {
  erroresDelPago,
  hayErroresEnElPago,
  monedaDeLaConsulta,
  pagoNuevo,
  paraLosPagos,
} from '../model/pagoDeLaConsulta';
import {
  conElPagoDeLaVisita,
  conOtroDia,
  conOtroVencimiento,
  errorDelDia,
  erroresDelPagoDeLaVisita,
  pasoDelRelevamiento,
  valorDelPagoDeLaVisita,
  valoresDelRelevamiento,
} from '../model/relevamiento';

type AlCrearUnTesoroEnDolares = (alCrear: (tesoroId: string) => void) => void;

export interface FormularioDelRelevamientoProps {
  proyecto: Proyecto;
  conPago: boolean;
  apertura: string | null;
  alListo: (cambios: CambiosDeProyecto, dia: string, pagos: PagoParaGuardar[]) => void;
  alCancelar: () => void;
  alCrearUnTesoroEnDolares?: AlCrearUnTesoroEnDolares;
}

export function FormularioDelRelevamiento({
  proyecto,
  conPago,
  apertura,
  alListo,
  alCancelar,
  alCrearUnTesoroEnDolares,
}: FormularioDelRelevamientoProps) {
  const textos = useMensajes().avanzarLaConsulta.paso;
  const replica = useReplicaDelTaller();
  const hoy = hoyEnElTaller();
  const delTrabajo = monedaDeLaConsulta(proyecto);
  const para = paraLosPagos(replica);
  const [valores, setValores] = useState(() => valoresDelRelevamiento(proyecto, hoy, para));
  const [error, setError] = useState<string | undefined>(undefined);
  const [erroresDelPagoEscrito, setErroresDelPagoEscrito] = useState<ErroresDelPago>({});
  const campoDelDia = useRef<HTMLInputElement>(null);
  const idDelPago = useRef(uuidv7());

  useEffect(() => {
    campoDelDia.current?.focus();
  }, []);

  function cambiarElPago(valor: ValorDelPago): void {
    setValores((previos) => conElPagoDeLaVisita(previos, valor));
    setErroresDelPagoEscrito({});
  }

  function enviar(evento: SyntheticEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const encontrado = errorDelDia(valores, hoy);
    setError(encontrado);
    const delPago = conPago
      ? erroresDelPagoDeLaVisita(valores, delTrabajo, para.tesorosEnDolares)
      : {};
    setErroresDelPagoEscrito(delPago);
    if (encontrado !== undefined || hayErroresEnElPago(delPago)) return;
    const { cambios, pagos } = pasoDelRelevamiento(
      valores,
      idDelPago.current,
      apertura,
      delTrabajo,
    );
    alListo(cambios, valores.dia, pagos);
  }

  return (
    <form noValidate onSubmit={enviar} className="mt-3 flex flex-col gap-3">
      <Campo
        ref={campoDelDia}
        etiqueta={textos.queDiaFuiste}
        type="date"
        max={hoy}
        value={valores.dia}
        onChange={(evento) => {
          const dia = evento.target.value;
          setValores((previos) => conOtroDia(previos, dia, hoy));
          setError(undefined);
        }}
        error={error}
      />
      <Campo
        etiqueta={textos.entregarElPresupuestoAntesDel}
        type="date"
        value={valores.vencimiento}
        onChange={(evento) => {
          const vencimiento = evento.target.value;
          setValores((previos) => conOtroVencimiento(previos, vencimiento));
        }}
        ayuda={textos.ayudaDelVencimiento}
      />
      {conPago && (
        <CamposDelPago
          etiqueta={textos.cuantoTePagoLaVisita}
          valor={valorDelPagoDeLaVisita(valores)}
          alCambiar={cambiarElPago}
          monedaDelTrabajo={delTrabajo}
          tesorosEnDolares={para.tesorosEnDolares}
          dolarDelDia={dolarDelDiaParaUnPago(
            { moneda: valores.monedaDelPago, fecha: valores.dia },
            delTrabajo,
            para.dolarDelDia,
          )}
          alCrearUnTesoroEnDolares={
            alCrearUnTesoroEnDolares === undefined
              ? undefined
              : () => {
                  alCrearUnTesoroEnDolares((tesoroId) => {
                    setValores((previos) => ({ ...previos, tesoroDelPago: tesoroId }));
                    setErroresDelPagoEscrito({});
                  });
                }
          }
          errores={erroresDelPagoEscrito}
          ayudaDelMonto={textos.ayudaDelPagoDeLaVisita}
        />
      )}
      {conPago && (valores.pago ?? 0) > 0 && (
        <CasillaDeLaApertura
          fecha={valores.dia}
          apertura={apertura}
          marcada={valores.pagoEnLaApertura}
          alCambiar={(marcada) => {
            setValores((previos) => ({ ...previos, pagoEnLaApertura: marcada }));
          }}
        />
      )}
      <FilaDeAcciones>
        <Button type="submit">{textos.anotarElRelevamiento}</Button>
        <Button variant="secundario" onClick={alCancelar}>
          {textos.todaviaNo}
        </Button>
      </FilaDeAcciones>
    </form>
  );
}

export interface FormularioDeUnMontoProps {
  alListo: (monto: number | null) => void;
  alCancelar: () => void;
}

function FormularioDeUnMonto({
  etiqueta,
  ayuda,
  enviar,
  alListo,
  alCancelar,
}: FormularioDeUnMontoProps & { etiqueta: string; ayuda: string; enviar: string }) {
  const textos = useMensajes().avanzarLaConsulta.paso;
  const [monto, setMonto] = useState<number | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campo.current?.focus();
  }, []);

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        alListo(monto);
      }}
      className="mt-3 flex flex-col gap-2.5"
    >
      <MoneyInput
        ref={campo}
        etiqueta={etiqueta}
        placeholder={textos.opcional}
        value={monto}
        onChange={setMonto}
        ayuda={ayuda}
      />
      <FilaDeAcciones>
        <Button type="submit">{enviar}</Button>
        <Button variant="secundario" onClick={alCancelar}>
          {textos.todaviaNo}
        </Button>
      </FilaDeAcciones>
    </form>
  );
}

export function FormularioDelPresupuesto(props: FormularioDeUnMontoProps) {
  const textos = useMensajes().avanzarLaConsulta.paso;
  return (
    <FormularioDeUnMonto
      {...props}
      etiqueta={textos.cuantoPresupuestaste}
      ayuda={textos.ayudaDelPresupuesto}
      enviar={textos.marcarComoEnviado}
    />
  );
}

export interface FormularioDelPagoProps {
  proyecto: Proyecto;
  apertura: string | null;
  alListo: (pago: ValorDelPago, dia: string, yaEnLaApertura: boolean) => void;
  alCancelar: () => void;
  alCrearUnTesoroEnDolares?: AlCrearUnTesoroEnDolares;
}

export function FormularioDelPago({
  proyecto,
  apertura,
  alListo,
  alCancelar,
  alCrearUnTesoroEnDolares,
}: FormularioDelPagoProps) {
  const textos = useMensajes().avanzarLaConsulta.paso;
  const replica = useReplicaDelTaller();
  const hoy = hoyEnElTaller();
  const delTrabajo = monedaDeLaConsulta(proyecto);
  const para = paraLosPagos(replica);
  const [pago, setPago] = useState<ValorDelPago>(() => pagoNuevo(proyecto, hoy, para));
  const [dia, setDia] = useState(hoy);
  const [marcada, setMarcada] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [erroresDelPagoEscrito, setErroresDelPagoEscrito] = useState<ErroresDelPago>({});
  const campos = useRef<HTMLDivElement>(null);
  const hayPago = pago.monto !== null && pago.monto > 0;

  useEffect(() => {
    campos.current?.querySelector('input')?.focus();
  }, []);

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        const encontrado = hayPago ? errorDeLaFechaDeLaPlata(dia, hoy) : undefined;
        const delPago = erroresDelPago(pago, delTrabajo, para.tesorosEnDolares);
        setError(encontrado);
        setErroresDelPagoEscrito(delPago);
        if (encontrado !== undefined || hayErroresEnElPago(delPago)) return;
        alListo(pago, dia, marcada && esAnteriorALaApertura(dia, apertura));
      }}
      className="mt-3 flex flex-col gap-2.5"
    >
      <div ref={campos}>
        <CamposDelPago
          etiqueta={textos.cuantoTePago}
          valor={pago}
          alCambiar={(valor) => {
            setPago(valor);
            setErroresDelPagoEscrito({});
          }}
          monedaDelTrabajo={delTrabajo}
          tesorosEnDolares={para.tesorosEnDolares}
          dolarDelDia={dolarDelDiaParaUnPago(
            { moneda: pago.moneda, fecha: dia },
            delTrabajo,
            para.dolarDelDia,
          )}
          alCrearUnTesoroEnDolares={
            alCrearUnTesoroEnDolares === undefined
              ? undefined
              : () => {
                  alCrearUnTesoroEnDolares((tesoroId) => {
                    setPago((previo) => ({ ...previo, tesoroId }));
                    setErroresDelPagoEscrito({});
                  });
                }
          }
          errores={erroresDelPagoEscrito}
          ayudaDelMonto={textos.ayudaDelPago}
        />
      </div>
      {hayPago && (
        <>
          <Campo
            etiqueta={textos.queDiaTePago}
            type="date"
            max={hoy}
            value={dia}
            error={error}
            onChange={(evento) => {
              setDia(evento.target.value);
              setError(undefined);
            }}
          />
          <CasillaDeLaApertura
            fecha={dia}
            apertura={apertura}
            marcada={marcada}
            alCambiar={setMarcada}
          />
        </>
      )}
      <FilaDeAcciones>
        <Button type="submit">{textos.pasarAPresupuestar}</Button>
        <Button variant="secundario" onClick={alCancelar}>
          {textos.todaviaNo}
        </Button>
      </FilaDeAcciones>
    </form>
  );
}
