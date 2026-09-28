import type { TipoDelPaso } from '@maun/domain';

import { formatearPesos, formatearPorcentaje } from '@/shared/lib';
import { Ayuda } from '@/shared/ui';

import type { GrupoDeLaFila } from '../model/tipos';

function Parrafos({ children }: { children: readonly (readonly [string, string])[] }) {
  return (
    <>
      {children.map(([rotulo, texto], indice) => (
        <p key={rotulo} className={indice === 0 ? undefined : 'mt-1.5'}>
          <strong className="font-semibold">{rotulo}</strong> {texto}
        </p>
      ))}
    </>
  );
}

export function AyudaDeLaFila() {
  return (
    <Ayuda que="Cómo se lee la fila">
      <ul className="flex list-disc flex-col gap-1.5 pl-4">
        <li>Cada ingreso entra arriba y baja por la fila.</li>
        <li>
          Primero salen las obligaciones. Después se llenan los compromisos y los ahorros fijos, en
          el orden de los números.
        </li>
        <li>Lo que sobra se reparte por porcentaje, y lo que queda es el superávit.</li>
        <li>Una ficha con borde de trazos no recibe nada en la prueba.</li>
      </ul>
    </Ayuda>
  );
}

export function AyudaDelMapa({ className }: { className?: string }) {
  return (
    <Ayuda que="Qué muestra el ingreso" className={className}>
      Es el mapa de cómo se reparte cada cobro. Los montos son de una prueba o de lo que entró en el
      mes. Cuando cobrás un trabajo, el cobro te muestra cómo se repartió.
    </Ayuda>
  );
}

export function AyudaDeQueEs() {
  return (
    <Ayuda que="Qué es cada tipo de paso">
      <Parrafos>
        {[
          [
            'Compromiso:',
            'lo que tenés que pagar, como sueldos, alquiler o cuotas. El sueldo va siempre al Hogar.',
          ],
          ['Ahorro fijo:', 'un monto que apartás de la ganancia, como el stock del taller.'],
        ]}
      </Parrafos>
    </Ayuda>
  );
}

export function AyudaDelMonto({ monto }: { monto: number }) {
  return (
    <Ayuda que="Qué es el monto">
      Recibe hasta {formatearPesos(monto)}, según cómo se llena. Lo que pasa de eso sigue abajo, al
      paso que viene.
    </Ayuda>
  );
}

export function AyudaDelLugar() {
  return (
    <Ayuda que="Cómo funciona el orden">
      La plata pasa por el 1, después por el 2, y así: primero las obligaciones, después los
      compromisos y los ahorros fijos. Lo que llega abajo de todo se reparte.
    </Ayuda>
  );
}

export function AyudaDelReparto({
  porcentaje,
  sobrante,
}: {
  porcentaje: number | null;
  sobrante: number;
}) {
  return (
    <Ayuda que="Cómo se reparte lo que sobra">
      Divide lo que sobra después de los ahorros fijos.
      {porcentaje !== null &&
        ` El ${formatearPorcentaje(porcentaje)}% de ${formatearPesos(sobrante)} son ${formatearPesos(
          Math.floor((sobrante * porcentaje) / 10_000),
        )}.`}{' '}
      Lo que no se reparte va al superávit.
    </Ayuda>
  );
}

export function AyudaDeLoDeHoy() {
  return (
    <Ayuda que="Con qué se prueba">
      Cada paso arranca con lo que ya tiene: lo del mes o su saldo, según cómo se llena. Todo en
      cero es como si todos estuvieran vacíos.
    </Ayuda>
  );
}

export function AyudaDeLaPrueba() {
  return (
    <Ayuda que="Cómo se prueba un cobro">
      <p>Escribí lo que te dejaría un trabajo y la fila muestra por dónde baja cada peso.</p>
      <p className="mt-1.5">
        Cada paso arranca con lo que ya tiene: lo del mes o su saldo, según cómo se llena. Todo en
        cero es como si todos estuvieran vacíos.
      </p>
    </Ayuda>
  );
}

const TEXTO_DEL_GRUPO: Readonly<Record<GrupoDeLaFila, { que: string; texto: string }>> = {
  obligaciones: {
    que: 'Qué son las obligaciones',
    texto:
      'Reúnen siempre una parte de cada ingreso, como el diezmo o Ingresos Brutos. Quedan como deuda hasta que registrás el pago, y ahí vuelven a cero.',
  },
  compromisos: {
    que: 'Qué son los compromisos',
    texto:
      'Juntan hasta el monto de lo que tenés que pagar: sueldos, alquiler, cuotas o la luz. Quedan como deuda hasta que registrás el pago. Si les ponés el día de pago, aparecen en la agenda y te avisan.',
  },
  ahorros: {
    que: 'Qué son los ahorros',
    texto:
      'Apartan una parte de la ganancia: un monto fijo por mes o por trabajo, o un porcentaje de lo que sobra. Pueden juntar sin fin o hasta llegar a su meta.',
  },
  superavit: {
    que: 'Qué es el superávit',
    texto: 'Lo que sobra después de todo. De acá salen los gastos extra y los imprevistos.',
  },
};

export function AyudaDelGrupo({ grupo, className }: { grupo: GrupoDeLaFila; className?: string }) {
  const { que, texto } = TEXTO_DEL_GRUPO[grupo];
  return (
    <Ayuda que={que} className={className}>
      {texto}
    </Ayuda>
  );
}

export function AyudaDeLosInsumos({ className }: { className?: string }) {
  return (
    <Ayuda que="Qué son los insumos" className={className}>
      Lo que queda de la seña de cada trabajo en curso: lo que te pagaron menos lo que ya gastaste
      en ese trabajo. Está en Maun hasta que el trabajo se cobra.
    </Ayuda>
  );
}

export function AyudaDelIngreso() {
  return (
    <Ayuda que="Qué es el ingreso">Lo que deja cada trabajo: lo cobrado menos los gastos.</Ayuda>
  );
}

export function AyudaDelIngresoLibre({ className }: { className?: string }) {
  return (
    <Ayuda que="Qué es el ingreso libre" className={className}>
      El ingreso menos las obligaciones.
    </Ayuda>
  );
}

export function AyudaDeLaGanancia({ className }: { className?: string }) {
  return (
    <Ayuda que="Qué es la ganancia" className={className}>
      Lo que queda después de las obligaciones y los compromisos.
    </Ayuda>
  );
}

export function AyudaDeLaBase() {
  return (
    <Ayuda que="Sobre qué se calcula">
      <Parrafos>
        {[
          ['Sobre lo que cobrás:', 'todo lo que entró del trabajo, como Ingresos Brutos.'],
          ['Sobre el ingreso:', 'lo que queda después de las obligaciones de arriba.'],
        ]}
      </Parrafos>
      <p className="mt-1.5">
        Si pagás Ingresos Brutos como una cuota fija por mes (por ejemplo, adentro del monotributo),
        cargalo como un compromiso.
      </p>
    </Ayuda>
  );
}

export function AyudaDelModo({ tipo }: { tipo: TipoDelPaso }) {
  if (tipo === 'compromiso') {
    return (
      <Ayuda que="Cómo se llena">
        <Parrafos>
          {[
            ['Por mes:', 'recibe hasta el monto en cada mes.'],
            [
              'Se renueva al pagar:',
              'junta hasta tener el monto, y cuando registrás el pago vuelve a juntar.',
            ],
          ]}
        </Parrafos>
      </Ayuda>
    );
  }
  return (
    <Ayuda que="Cómo se aparta">
      <Parrafos>
        {[
          ['Por mes:', 'hasta el monto en cada mes.'],
          [
            'Se repone al usarlo:',
            'junta hasta tener el monto, y cuando gastás de ahí vuelve a juntar.',
          ],
          ['Por trabajo:', 'el monto en cada cobro.'],
        ]}
      </Parrafos>
    </Ayuda>
  );
}

export function AyudaDeLaMeta() {
  return (
    <Ayuda que="Qué es hasta la meta">
      Cuando el tesoro llega a su meta deja de recibir, y lo que le tocaba sigue hacia abajo hasta
      el superávit.
    </Ayuda>
  );
}

export function AyudaDelSuperavit() {
  return (
    <Ayuda que="Dónde cae lo que sobra">
      Elegí qué tesoro recibe lo que sobra. Si es Maun, queda en la caja del taller.
    </Ayuda>
  );
}
