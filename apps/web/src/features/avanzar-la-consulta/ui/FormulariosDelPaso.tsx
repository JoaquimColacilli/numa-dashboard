import { esAnteriorALaApertura } from '@maun/domain';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';

import { CasillaDeLaApertura } from '@/entities/movimiento';
import type { Proyecto } from '@/entities/proyecto';
import type { CambiosDeProyecto, PagoParaGuardar } from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import { errorDeLaFechaDeLaPlata, hoyEnElTaller, uuidv7 } from '@/shared/lib';
import { Button, Campo, FilaDeAcciones, MoneyInput } from '@/shared/ui';

import {
  conOtroDia,
  conOtroVencimiento,
  errorDelDia,
  pasoDelRelevamiento,
  valoresDelRelevamiento,
} from '../model/relevamiento';

export interface FormularioDelRelevamientoProps {
  proyecto: Proyecto;
  conPago: boolean;
  apertura: string | null;
  alListo: (cambios: CambiosDeProyecto, dia: string, pagos: PagoParaGuardar[]) => void;
  alCancelar: () => void;
}

export function FormularioDelRelevamiento({
  proyecto,
  conPago,
  apertura,
  alListo,
  alCancelar,
}: FormularioDelRelevamientoProps) {
  const textos = useMensajes().avanzarLaConsulta.paso;
  const hoy = hoyEnElTaller();
  const [valores, setValores] = useState(() => valoresDelRelevamiento(proyecto, hoy));
  const [error, setError] = useState<string | undefined>(undefined);
  const campoDelDia = useRef<HTMLInputElement>(null);
  const idDelPago = useRef(uuidv7());

  useEffect(() => {
    campoDelDia.current?.focus();
  }, []);

  function enviar(evento: SyntheticEvent<HTMLFormElement>): void {
    evento.preventDefault();
    const encontrado = errorDelDia(valores, hoy);
    setError(encontrado);
    if (encontrado !== undefined) return;
    const { cambios, pagos } = pasoDelRelevamiento(valores, idDelPago.current, apertura);
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
        <MoneyInput
          etiqueta={textos.cuantoTePagoLaVisita}
          placeholder={textos.opcional}
          value={valores.pago}
          onChange={(pago) => {
            setValores((previos) => ({ ...previos, pago }));
          }}
          ayuda={textos.ayudaDelPagoDeLaVisita}
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
  apertura: string | null;
  alListo: (monto: number | null, dia: string, yaEnLaApertura: boolean) => void;
  alCancelar: () => void;
}

export function FormularioDelPago({ apertura, alListo, alCancelar }: FormularioDelPagoProps) {
  const textos = useMensajes().avanzarLaConsulta.paso;
  const hoy = hoyEnElTaller();
  const [monto, setMonto] = useState<number | null>(null);
  const [dia, setDia] = useState(hoy);
  const [marcada, setMarcada] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const campo = useRef<HTMLInputElement>(null);
  const hayPago = monto !== null && monto > 0;

  useEffect(() => {
    campo.current?.focus();
  }, []);

  return (
    <form
      noValidate
      onSubmit={(evento) => {
        evento.preventDefault();
        const encontrado = hayPago ? errorDeLaFechaDeLaPlata(dia, hoy) : undefined;
        setError(encontrado);
        if (encontrado !== undefined) return;
        alListo(monto, dia, marcada && esAnteriorALaApertura(dia, apertura));
      }}
      className="mt-3 flex flex-col gap-2.5"
    >
      <MoneyInput
        ref={campo}
        etiqueta={textos.cuantoTePago}
        placeholder={textos.opcional}
        value={monto}
        onChange={setMonto}
        ayuda={textos.ayudaDelPago}
      />
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
