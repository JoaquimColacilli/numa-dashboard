import type { TipoDelPaso } from '@maun/domain';

import { useMensajes } from '@/shared/idioma';
import { formatearPesos, formatearPorcentaje } from '@/shared/lib';
import { Ayuda } from '@/shared/ui';

import type { GrupoDeLaFila } from '../model/tipos';

interface Parrafo {
  rotulo: string;
  texto: string;
}

function Parrafos({ children }: { children: readonly Parrafo[] }) {
  return (
    <>
      {children.map(({ rotulo, texto }, indice) => (
        <p key={rotulo} className={indice === 0 ? undefined : 'mt-1.5'}>
          <strong className="font-semibold">{rotulo}</strong> {texto}
        </p>
      ))}
    </>
  );
}

export function AyudaDeLaFila() {
  const { fila } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={fila.que}>
      <ul className="flex list-disc flex-col gap-1.5 pl-4">
        <li>{fila.entraArriba}</li>
        <li>{fila.primeroLasObligaciones}</li>
        <li>{fila.loQueSobra}</li>
        <li>{fila.bordeDeTrazos}</li>
      </ul>
    </Ayuda>
  );
}

export function AyudaDelMapa({ className }: { className?: string }) {
  const { mapa } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={mapa.que} className={className}>
      {mapa.texto}
    </Ayuda>
  );
}

export function AyudaDeQueEs() {
  const { queEs } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={queEs.que}>
      <Parrafos>{[queEs.compromiso, queEs.ahorroFijo]}</Parrafos>
    </Ayuda>
  );
}

export function AyudaDelMonto({ monto }: { monto: number }) {
  const ayuda = useMensajes().fila.ayudas.monto;
  return <Ayuda que={ayuda.que}>{ayuda.texto(formatearPesos(monto))}</Ayuda>;
}

export function AyudaDelLugar() {
  const { lugar } = useMensajes().fila.ayudas;
  return <Ayuda que={lugar.que}>{lugar.texto}</Ayuda>;
}

export function AyudaDelReparto({
  porcentaje,
  sobrante,
}: {
  porcentaje: number | null;
  sobrante: number;
}) {
  const { reparto } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={reparto.que}>
      {porcentaje === null
        ? reparto.texto
        : reparto.conEjemplo(
            formatearPorcentaje(porcentaje),
            formatearPesos(sobrante),
            formatearPesos(Math.floor((sobrante * porcentaje) / 10_000)),
          )}
    </Ayuda>
  );
}

export function AyudaDeLoDeHoy() {
  const { loDeHoy } = useMensajes().fila.ayudas;
  return <Ayuda que={loDeHoy.que}>{loDeHoy.texto}</Ayuda>;
}

export function AyudaDeLaPrueba() {
  const { prueba, loDeHoy } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={prueba.que}>
      <p>{prueba.texto}</p>
      <p className="mt-1.5">{loDeHoy.texto}</p>
    </Ayuda>
  );
}

export function AyudaDelGrupo({ grupo, className }: { grupo: GrupoDeLaFila; className?: string }) {
  const { que, texto } = useMensajes().fila.ayudas.grupos[grupo];
  return (
    <Ayuda que={que} className={className}>
      {texto}
    </Ayuda>
  );
}

export function AyudaDeLosInsumos({ className }: { className?: string }) {
  const { insumos } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={insumos.que} className={className}>
      {insumos.texto}
    </Ayuda>
  );
}

export function AyudaDelIngreso() {
  const { ingreso } = useMensajes().fila.ayudas;
  return <Ayuda que={ingreso.que}>{ingreso.texto}</Ayuda>;
}

export function AyudaDelIngresoLibre({ className }: { className?: string }) {
  const { ingresoLibre } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={ingresoLibre.que} className={className}>
      {ingresoLibre.texto}
    </Ayuda>
  );
}

export function AyudaDeLaGanancia({ className }: { className?: string }) {
  const { ganancia } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={ganancia.que} className={className}>
      {ganancia.texto}
    </Ayuda>
  );
}

export function AyudaDeLaBase() {
  const { base } = useMensajes().fila.ayudas;
  return (
    <Ayuda que={base.que}>
      <Parrafos>{[base.cobrado, base.ingreso]}</Parrafos>
      <p className="mt-1.5">{base.cuotaFija}</p>
    </Ayuda>
  );
}

export function AyudaDelModo({ tipo }: { tipo: TipoDelPaso }) {
  const m = useMensajes().fila;
  const { modo } = m.ayudas;
  return (
    <Ayuda que={m.tituloDelModo[tipo]}>
      <Parrafos>
        {tipo === 'compromiso'
          ? [modo.compromiso.mes, modo.compromiso.saldo]
          : [modo.ahorroFijo.mes, modo.ahorroFijo.saldo, modo.ahorroFijo.trabajo]}
      </Parrafos>
    </Ayuda>
  );
}

export function AyudaDeLaMeta() {
  const { meta } = useMensajes().fila.ayudas;
  return <Ayuda que={meta.que}>{meta.texto}</Ayuda>;
}

export function AyudaDelSuperavit() {
  const { superavit } = useMensajes().fila.ayudas;
  return <Ayuda que={superavit.que}>{superavit.texto}</Ayuda>;
}
