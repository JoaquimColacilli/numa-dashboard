import type { ComponentType, ReactNode } from 'react';

import { ALTO_DE_ESCENA, ANCHO_DE_ESCENA, Lienzo } from './lienzo.tsx';
import { PATA_DE_GALLO, TILDE } from './mano.ts';
import { Mueble } from './objetos.tsx';
import {
  iso,
  planoDeCostado,
  planoDeFrente,
  planoDelPiso,
  redondear,
  type Limites,
  type Punto,
  type Punto3,
} from './proyeccion.ts';
import { Caja, EnElPlano } from './trazos.tsx';

function n(valor: number): string {
  return String(redondear(valor));
}

function sumar(a: Punto3, b: Punto3): Punto3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function restar(a: Punto3, b: Punto3): Punto3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function escalar(a: Punto3, factor: number): Punto3 {
  return [a[0] * factor, a[1] * factor, a[2] * factor];
}

function producto(a: Punto3, b: Punto3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function unitario(a: Punto3): Punto3 {
  const largo = Math.hypot(a[0], a[1], a[2]);
  return largo === 0 ? [0, 0, 0] : escalar(a, 1 / largo);
}

function ver([x, y, z]: Punto3): Punto {
  return iso(x, y, z);
}

function hacia(desde: Punto, hasta: Punto, parte: number): Punto {
  return [
    redondear(desde[0] + (hasta[0] - desde[0]) * parte),
    redondear(desde[1] + (hasta[1] - desde[1]) * parte),
  ];
}

function girar(centro: Punto, punto: Punto, grados: number): Punto {
  const giro = (grados * Math.PI) / 180;
  const dx = punto[0] - centro[0];
  const dy = punto[1] - centro[1];
  return [
    centro[0] + dx * Math.cos(giro) - dy * Math.sin(giro),
    centro[1] + dx * Math.sin(giro) + dy * Math.cos(giro),
  ];
}

function linea(...lista: readonly Punto[]): string {
  return lista.map(([x, y], indice) => `${indice === 0 ? 'M' : 'L'}${n(x)} ${n(y)}`).join('');
}

function capsula(desde: Punto, hasta: Punto, ancho: number): string {
  const angulo = Math.atan2(hasta[1] - desde[1], hasta[0] - desde[0]);
  const radio = ancho / 2;
  const nx = -Math.sin(angulo) * radio;
  const ny = Math.cos(angulo) * radio;
  return [
    `M${n(desde[0] + nx)} ${n(desde[1] + ny)}`,
    `L${n(hasta[0] + nx)} ${n(hasta[1] + ny)}`,
    `A${n(radio)} ${n(radio)} 0 0 0 ${n(hasta[0] - nx)} ${n(hasta[1] - ny)}`,
    `L${n(desde[0] - nx)} ${n(desde[1] - ny)}`,
    `A${n(radio)} ${n(radio)} 0 0 0 ${n(desde[0] + nx)} ${n(desde[1] + ny)}Z`,
  ].join('');
}

function direccion(desde: Punto, hasta: Punto): Punto {
  const largo = Math.hypot(hasta[0] - desde[0], hasta[1] - desde[1]);
  return largo === 0 ? [0, 1] : [(hasta[0] - desde[0]) / largo, (hasta[1] - desde[1]) / largo];
}

function costadoDelTubo(lista: readonly Punto[], radio: number, signo: 1 | -1): Punto[] {
  const tramos = lista.slice(1).map((hasta, indice) => direccion(lista[indice] ?? hasta, hasta));
  return lista.flatMap((punto, indice): Punto[] => {
    const antes = tramos[indice - 1];
    const despues = tramos[indice];
    const correr = ([dx, dy]: Punto): Punto => [
      punto[0] - signo * radio * dy,
      punto[1] + signo * radio * dx,
    ];
    if (antes === undefined) return despues === undefined ? [] : [correr(despues)];
    if (despues === undefined) return [correr(antes)];
    const giro = antes[0] * despues[1] - antes[1] * despues[0];
    const entrada = correr(antes);
    const salida = correr(despues);
    if (Math.abs(giro) < 0.0001) return [entrada];
    if (signo * giro > 0) {
      const t =
        ((salida[0] - entrada[0]) * despues[1] - (salida[1] - entrada[1]) * despues[0]) / giro;
      const cruce: Punto = [entrada[0] + t * antes[0], entrada[1] + t * antes[1]];
      return Math.hypot(cruce[0] - punto[0], cruce[1] - punto[1]) > 3 * radio
        ? [hacia(entrada, salida, 0.5)]
        : [cruce];
    }
    const desde = Math.atan2(entrada[1] - punto[1], entrada[0] - punto[0]);
    let barrido = Math.atan2(salida[1] - punto[1], salida[0] - punto[0]) - desde;
    if (barrido > Math.PI) barrido -= 2 * Math.PI;
    if (barrido < -Math.PI) barrido += 2 * Math.PI;
    return [0, 1, 2, 3, 4, 5, 6].map((paso): Punto => [
      punto[0] + radio * Math.cos(desde + (barrido * paso) / 6),
      punto[1] + radio * Math.sin(desde + (barrido * paso) / 6),
    ]);
  });
}

function tubo(lista: readonly Punto[], ancho: number): string {
  const radio = ancho / 2;
  const ida = costadoDelTubo(lista, radio, 1);
  const vuelta = costadoDelTubo(lista, radio, -1).reverse();
  const [primero] = ida;
  const [otro] = vuelta;
  if (primero === undefined || otro === undefined) return '';
  const arco = ([x, y]: Punto) => `A${n(radio)} ${n(radio)} 0 0 0 ${n(x)} ${n(y)}`;
  const tramo = (puntos: readonly Punto[]) => puntos.map(([x, y]) => `L${n(x)} ${n(y)}`).join('');
  return `M${n(primero[0])} ${n(primero[1])}${tramo(ida.slice(1))}${arco(otro)}${tramo(vuelta.slice(1))}${arco(primero)}Z`;
}

function redondeado(lista: readonly Punto[], radio: number): string {
  const cantidad = lista.length;
  const tramos = lista.map((actual, indice) => {
    const previo = lista[(indice - 1 + cantidad) % cantidad] ?? actual;
    const siguiente = lista[(indice + 1) % cantidad] ?? actual;
    const antes = Math.hypot(actual[0] - previo[0], actual[1] - previo[1]);
    const despues = Math.hypot(siguiente[0] - actual[0], siguiente[1] - actual[1]);
    const entrada = hacia(actual, previo, antes === 0 ? 0 : Math.min(radio, antes / 2) / antes);
    const salida = hacia(
      actual,
      siguiente,
      despues === 0 ? 0 : Math.min(radio, despues / 2) / despues,
    );
    return `${indice === 0 ? 'M' : 'L'}${n(entrada[0])} ${n(entrada[1])}Q${n(actual[0])} ${n(actual[1])} ${n(salida[0])} ${n(salida[1])}`;
  });
  return `${tramos.join('')}Z`;
}

type Boca = 'seria' | 'sonrisa';
type Mirada = 'frente' | 'arriba' | 'abajo';

interface GestoDeLaCara {
  boca: Boca;
  mirada: Mirada;
}

const OREJA = 'M-8.6 -1.4C-10.6 -2.2 -12 -0.6 -11.8 1.6C-11.6 3.6 -10.2 4.8 -8.4 4.4Z';
const PLIEGUE_DE_LA_OREJA = 'M-9.6 0.6Q-10.8 1.2 -9.8 2.8';
const BARBA =
  'M-7.9 2.2C-8.6 5.4 -7.9 8.8 -5.9 11.1C-4.6 12.5 -2.6 13.2 0.2 13.3C3.2 13.4 5.8 12.9 7.6 11.6C9.4 10.2 10.2 7.8 10.2 5.4L9.9 4.6C9 5.3 7.9 6.1 7 6.4C6 6.7 5.2 6.4 4.8 6C4.1 6.5 2.9 6.8 1.8 6.5C-1.4 5.8 -4.6 4.2 -7.9 2.2Z';
const CONTORNO_DE_LA_BARBA =
  'M-7.9 2.2C-8.6 5.4 -7.9 8.8 -5.9 11.1C-4.6 12.5 -2.6 13.2 0.2 13.3C3.2 13.4 5.8 12.9 7.6 11.6C9.4 10.2 10.2 7.8 10.2 5.4L9.9 4.6';
const BORDE_DE_LA_BARBA =
  'M9.9 4.6C9 5.3 7.9 6.1 7 6.4C6 6.7 5.2 6.4 4.8 6C4.1 6.5 2.9 6.8 1.8 6.5C-1.4 5.8 -4.6 4.2 -7.9 2.2';
const MECHONES = 'M-4.4 7.4Q-3.9 9.6 -2.2 11.2M8.1 8.6Q8.1 10.1 7.2 11.1';
const BIGOTE = 'M2.4 8Q3.8 7.3 5 7.9Q6.3 7.3 7.6 8';
const BOCA_SERIA = 'M4 9.5Q5 9.8 6 9.5';
const BOCA_QUE_SONRIE = 'M3.1 8.8Q5 9.4 7.1 8.8Q6.7 11.1 5.1 11.2Q3.5 11.1 3.1 8.8Z';
const NARIZ = 'M5.1 0.9Q6.4 3.4 5.9 4.6Q5.1 5.2 4.3 4.7';
const LENTE_ARRIBA = 'M-2 -3.3Q3.6 -4.6 10 -3.4';
const LENTE_ABAJO =
  'M-2 -3.3Q-2.4 -1 -1.4 0.3Q1 1.2 3 0.7Q3.6 -0.4 4.2 -0.8Q4.8 -0.3 5.3 0.7Q7.5 1.3 9.7 0.2Q10.3 -1.5 10 -3.4';
const PATILLA = 'M-1.9 -2.6L-8.9 -0.9';
const CEJAS = {
  frente: 'M-0.8 -5.6Q1.3 -6.5 3.3 -5.9M5.8 -6.1Q7.5 -6.6 9 -5.8',
  arriba: 'M-0.8 -6.3Q1.3 -7.5 3.3 -6.8M5.8 -7Q7.5 -7.6 9 -6.5',
  abajo: 'M-0.8 -5.3Q1.3 -5.8 3.3 -5.4M5.8 -5.6Q7.5 -5.9 9 -5.4',
} as const satisfies Record<Mirada, string>;
const OJOS = {
  frente: [
    [1.5, -1.4],
    [7.2, -1.5],
  ],
  arriba: [
    [1.9, -2.1],
    [7.5, -2.2],
  ],
  abajo: [
    [1.5, -0.8],
    [7.1, -0.9],
  ],
} as const satisfies Record<Mirada, readonly (readonly [number, number])[]>;
const OJOS_QUE_SONRIEN = 'M0.3 -1Q1.5 -2.3 2.7 -1M6.1 -1.1Q7.2 -2.3 8.3 -1.1';
const MEJILLAS = 'M-0.8 3.6Q0.3 4.2 1.4 3.9M8.2 3.7Q9 4 9.6 3.5';

function Cabeza({ boca, mirada }: GestoDeLaCara) {
  const sonrie = boca === 'sonrisa';
  return (
    <g>
      <path d={OREJA} className="cara" />
      <path d={PLIEGUE_DE_LA_OREJA} className="fina" />
      <circle cx={0} cy={0} r={10} className="cara" />
      <path d={BARBA} className="pelo sin-linea" />
      <path d={CONTORNO_DE_LA_BARBA} />
      <path d={BORDE_DE_LA_BARBA} className="fina" />
      <path d={MECHONES} className="fina" />
      <path d={BIGOTE} className="fina" />
      {sonrie ? (
        <path d={BOCA_QUE_SONRIE} className="tinta" />
      ) : (
        <path d={BOCA_SERIA} className="fina" />
      )}
      {sonrie && <path d={MEJILLAS} className="fina" />}
      <path d={NARIZ} className="fina" />
      <path d={PATILLA} className="fina" />
      <path d={LENTE_ABAJO} className="fina" />
      <path d={LENTE_ARRIBA} />
      {sonrie ? (
        <path d={OJOS_QUE_SONRIEN} className="fina" />
      ) : (
        OJOS[mirada].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r={0.8} className="tinta sin-linea" />
        ))
      )}
      <path d={CEJAS[mirada]} className="fina" />
    </g>
  );
}

const CUERPO = {
  piernas: 4.8,
  tobillo: 5,
  rodilla: 25,
  cadera: 46.5,
  hombro: 68.4,
  hombros: 10.6,
  brazo: 12.8,
  antebrazo: 11.6,
  cabeza: [1.6, 0, 84.4],
  escalaDeLaCabeza: 1.15,
} as const;

const ANCHO = { pierna: 8.2, brazo: 5.6, manga: 7.6, cuello: 8 } as const;

const REMERA = 'costado';

const TORSO = { arriba: 71, abajo: 45, hombros: 10.2, cintura: 9, frente: 4.4 } as const;

const DELANTAL = {
  arriba: 64,
  cintura: 49,
  abajo: 29.5,
  pechera: 5.6,
  ancho: 9.3,
  bajo: 9.9,
  bolsillo: 45,
  fondo: 37,
} as const;

function Pierna({ lado }: { lado: 1 | -1 }) {
  const y = lado * CUERPO.piernas;
  const recorrido = [
    ver([0, y, CUERPO.cadera]),
    ver([0.8, y + lado * 0.3, CUERPO.rodilla]),
    ver([0.2, y + lado * 0.3, CUERPO.tobillo + 1]),
  ];
  return <path d={tubo(recorrido, ANCHO.pierna)} className="costado" />;
}

function Botin({ lado }: { lado: 1 | -1 }) {
  const y = lado * (CUERPO.piernas + 0.3) - 2.7;
  return (
    <g>
      <Caja
        x={-3}
        y={y}
        z={0}
        largo={10.4}
        ancho={5.4}
        alto={1.6}
        arriba="costado"
        izquierda="tinta"
        derecha="tinta"
      />
      <Caja x={-2.6} y={y + 0.2} z={1.6} largo={9.4} ancho={5} alto={4.8} />
    </g>
  );
}

function Torso() {
  const { arriba, abajo, hombros, cintura, frente } = TORSO;
  const a = ver([-frente, -hombros, arriba]);
  const b = ver([frente, -hombros, arriba]);
  const c = ver([frente, hombros, arriba]);
  const d = ver([-frente, hombros, arriba]);
  const f = ver([frente, -cintura, abajo]);
  const g = ver([frente, cintura, abajo]);
  const h = ver([-frente, cintura, abajo]);
  return (
    <g>
      <path d={redondeado([a, b, f, g, h, d], 4.4)} className={REMERA} />
      <path d={linea(hacia(c, g, 0.12), hacia(c, g, 0.94))} className="fina" />
    </g>
  );
}

function Delantal({ lapiz }: { lapiz: boolean }) {
  const x = TORSO.frente + 0.3;
  const p = (y: number, z: number) => ver([x, y, z]);
  const { arriba, cintura, abajo, pechera, ancho, bajo, bolsillo, fondo } = DELANTAL;
  const contorno = [
    p(-pechera, arriba),
    p(pechera, arriba),
    p(ancho, cintura),
    p(bajo, abajo),
    p(-bajo, abajo),
    p(-ancho, cintura),
  ];
  const costado = TORSO.cintura + 0.3;
  const cuello = TORSO.arriba + 1;
  return (
    <g>
      <path
        d={`${linea(p(pechera - 0.9, arriba), ver([1.4, 3.6, cuello]))}${linea(p(-pechera + 0.9, arriba), ver([1.4, -3.6, cuello]))}`}
        className="fina"
      />
      <path
        d={linea(ver([x - 0.2, costado, cintura + 0.4]), ver([-2.6, costado, cintura + 0.8]))}
        className="fina"
      />
      <path d={redondeado(contorno, 1.4)} className="cara" />
      {lapiz && (
        <g>
          <path d={capsula(p(4.6, bolsillo - 1), p(5.4, bolsillo + 5.2), 1.9)} className="cara" />
          <path d={linea(p(5.3, bolsillo + 4.4), p(5.45, bolsillo + 5.6))} className="mano" />
        </g>
      )}
      <path
        d={`${linea(p(-7.4, bolsillo), p(7.4, bolsillo), p(7.8, fondo), p(-7.8, fondo))}Z`}
        className="cara"
      />
      <path d={linea(p(0, bolsillo), p(0, fondo))} className="fina" />
    </g>
  );
}

function Cuerpo({ cara, lapiz = true }: { cara: GestoDeLaCara; lapiz?: boolean }) {
  const cabeza = ver(CUERPO.cabeza);
  return (
    <g>
      <Pierna lado={-1} />
      <Botin lado={-1} />
      <Pierna lado={1} />
      <Botin lado={1} />
      <Torso />
      <Delantal lapiz={lapiz} />
      <path
        d={capsula(ver([0.8, 0, TORSO.arriba - 1]), ver([1.2, 0, TORSO.arriba + 6]), ANCHO.cuello)}
        className="cara"
      />
      <g
        transform={`translate(${n(cabeza[0])} ${n(cabeza[1])}) scale(${n(CUERPO.escalaDeLaCabeza)})`}
      >
        <Cabeza {...cara} />
      </g>
    </g>
  );
}

type FormaDeLaMano = 'suelta' | 'agarra' | 'pulgar' | 'palma';

const PALMA =
  'M3 0.6Q3.4 -4 3 -7.8Q2.8 -9 1.6 -9L-2.2 -9Q-3.4 -9 -3.5 -7.8L-3.6 -1.2Q-3.6 1.9 -1 2.3L1.4 2.3Q2.8 2.1 3 0.6Z';

function Mano({ muneca, codo, forma }: { muneca: Punto; codo: Punto; forma: FormaDeLaMano }) {
  const giro = (Math.atan2(muneca[1] - codo[1], muneca[0] - codo[0]) * 180) / Math.PI - 90;
  const lugar = `translate(${n(muneca[0])} ${n(muneca[1])})`;
  switch (forma) {
    case 'pulgar':
      return (
        <g transform={`${lugar} rotate(-6) scale(1.1)`}>
          <path
            d="M-0.9 -2.4L-1.3 -9Q-1.1 -10.7 0.5 -10.7Q2 -10.5 2 -8.9L1.9 -3"
            className="cara"
          />
          <path
            d="M-1.6 -1.9Q-1.6 -3.4 0 -3.4H5.1Q6.6 -3.4 6.7 -1.8V1.8Q6.6 3.3 5.1 3.3H0Q-1.6 3.3 -1.6 1.8Z"
            className="cara"
          />
          <path d="M2.2 -1.7H6.6M2.2 0H6.7M2.2 1.7H6.6M2.2 -3.4Q1.5 0 2.2 3.3" className="fina" />
        </g>
      );
    case 'palma':
      return (
        <g transform={`${lugar} rotate(10) scale(1.15)`}>
          <path d={PALMA} className="cara" />
          <path
            d="M-3.4 -2.4Q-5.8 -3.6 -6.4 -5.2Q-6.9 -6.4 -5.8 -6.6Q-4.8 -6.6 -3.6 -4.6"
            className="cara"
          />
          <path d="M1 -8.8V-4.6M-0.8 -8.9V-4.4M-2.4 -8.7V-4.8" className="fina" />
        </g>
      );
    case 'agarra':
      return (
        <g transform={`${lugar} rotate(${n(giro)}) scale(1.1)`}>
          <path d="M-3 -0.4Q-3.4 4.2 -1.2 4.8L1.4 4.8Q3.6 4.6 3.3 -0.4Z" className="cara" />
          <path d="M-2.4 1.8H2.9M-2 3.4H2.8" className="fina" />
        </g>
      );
    case 'suelta':
      return (
        <g transform={`${lugar} rotate(${n(giro)}) scale(1.1)`}>
          <path
            d="M-2.9 -0.5Q-3.4 4.4 -1.4 6.1Q0.5 7.2 2.4 5.8Q3.5 4.5 3.1 -0.5Z"
            className="cara"
          />
          <path d="M1.1 1.6Q1.5 3.8 0.4 5.2" className="fina" />
        </g>
      );
  }
}

type Lado = 'izquierdo' | 'derecho';

interface Brazo {
  lado: Lado;
  muneca: Punto3;
  polo: Punto3;
  mano: FormaDeLaMano;
}

function hombroDe(lado: Lado): Punto3 {
  return [0.2, (lado === 'izquierdo' ? 1 : -1) * CUERPO.hombros, CUERPO.hombro];
}

function codoDe({ lado, muneca, polo }: Brazo): Punto3 {
  const { brazo, antebrazo } = CUERPO;
  const hombro = hombroDe(lado);
  const eje = restar(muneca, hombro);
  const distancia = Math.min(Math.hypot(eje[0], eje[1], eje[2]), brazo + antebrazo - 0.01);
  const u = unitario(eje);
  const avance = (brazo ** 2 - antebrazo ** 2 + distancia ** 2) / (2 * distancia);
  const altura = Math.sqrt(Math.max(brazo ** 2 - avance ** 2, 0));
  const v = unitario(restar(polo, escalar(u, producto(polo, u))));
  return sumar(hombro, sumar(escalar(u, avance), escalar(v, altura)));
}

function Manga({ hombro, codo }: { hombro: Punto; codo: Punto }) {
  return <path d={capsula(hombro, hacia(hombro, codo, 0.5), ANCHO.manga)} className={REMERA} />;
}

function BrazoEntero({ brazo }: { brazo: Brazo }) {
  const hombro = ver(hombroDe(brazo.lado));
  const codo = ver(codoDe(brazo));
  const muneca = ver(brazo.muneca);
  return (
    <g>
      <path d={tubo([hombro, codo, muneca], ANCHO.brazo)} className="cara" />
      <Manga hombro={hombro} codo={codo} />
      <Mano muneca={muneca} codo={codo} forma={brazo.mano} />
    </g>
  );
}

function Hombro({ brazo }: { brazo: Brazo }) {
  const hombro = ver(hombroDe(brazo.lado));
  const codo = ver(codoDe(brazo));
  return (
    <g>
      <path d={tubo([hombro, codo], ANCHO.brazo)} className="cara" />
      <Manga hombro={hombro} codo={codo} />
    </g>
  );
}

function Antebrazo({ brazo }: { brazo: Brazo }) {
  const codo = ver(codoDe(brazo));
  const muneca = ver(brazo.muneca);
  return (
    <g>
      <path d={tubo([codo, muneca], ANCHO.brazo)} className="cara" />
      <Mano muneca={muneca} codo={codo} forma={brazo.mano} />
    </g>
  );
}

const QUIETO: Brazo = {
  lado: 'izquierdo',
  muneca: [1.6, 12.8, 45.2],
  polo: [-1, 0.3, 0],
  mano: 'suelta',
};

const QUIETO_EL_DERECHO: Brazo = {
  lado: 'derecho',
  muneca: [1.6, -12.8, 45.2],
  polo: [-1, -0.3, 0],
  mano: 'suelta',
};

const MUEBLE = { x: 10, y: -36, z: 0, largo: 24, profundidad: 24, alto: 46 } as const;

const TALADRO =
  'M-3.6 -7.8H3.6V-17.2Q3.6 -19.2 1.6 -19.2H-1.6Q-3.6 -19.2 -3.6 -17.2V-16.6L-12.4 -16.2V-12.4L-3.6 -12Z';

function Taladro({ punta }: { punta: Punto3 }) {
  const [x, y, z] = punta;
  return (
    <EnElPlano transform={planoDeCostado(x)}>
      <g transform={`translate(${n(y)} ${n(-z)}) scale(-1 1)`}>
        <path d="M0 0V-3.8" />
        <path d="M-1.6 -3.6H1.6L2.2 -7.8H-2.2Z" className="costado" />
        <path d="M-1.9 -5.8H1.9" className="fina" />
        <path d={TALADRO} className="cara" />
        <path d="M-17.4 -18.4H-12.4V-10.2H-17.4Z" className="tinta" />
        <path d="M-1.6 -17H1.6M-1.6 -15.4H1.6" className="fina" />
        <path d="M-4.8 -12Q-5.2 -10.2 -6.6 -10.6" />
      </g>
    </EnElPlano>
  );
}

const TABLA = { x: 11, y: -44, z: MUEBLE.alto, largo: 12, ancho: 34, alto: 2 } as const;

const ARRIBA_DE_LA_TABLA = TABLA.z + TABLA.alto;

const CINTA = { x: TABLA.x + 7.4, ancho: 2.6, desde: -15, hasta: -43.4 } as const;

const CAJA_DE_LA_CINTA = {
  x: TABLA.x + 5.8,
  y: -15.2,
  z: ARRIBA_DE_LA_TABLA,
  largo: 5.8,
  ancho: 5.2,
  alto: 4.4,
} as const;

const MARCA_EN_LA_TABLA = [13.8, -22.2] as const;

function Cinta() {
  const { x, ancho, desde, hasta } = CINTA;
  const rayas: string[] = [];
  for (let paso = 3; paso < desde - hasta; paso += 3) {
    rayas.push(`M${n(x + 0.2)} ${n(desde - paso)}h${paso % 9 === 0 ? '1.6' : '0.9'}`);
  }
  const caja = CAJA_DE_LA_CINTA;
  return (
    <g>
      <EnElPlano transform={planoDelPiso(ARRIBA_DE_LA_TABLA)}>
        <path d={`M${n(x)} ${n(desde)}H${n(x + ancho)}V${n(hasta)}H${n(x)}Z`} className="cara" />
        <path d={rayas.join('')} className="fina" />
        <path
          d={PATA_DE_GALLO}
          transform={`translate(${n(MARCA_EN_LA_TABLA[0])} ${n(MARCA_EN_LA_TABLA[1])}) rotate(90) scale(0.8)`}
          className="mano"
        />
      </EnElPlano>
      <Caja {...caja} />
      <EnElPlano transform={planoDeFrente(caja.y + caja.ancho)}>
        <circle
          cx={redondear(caja.x + caja.largo / 2)}
          cy={redondear(-(caja.z + caja.alto / 2))}
          r={1.4}
          className="fina"
        />
      </EnElPlano>
    </g>
  );
}

const ENCUADRE: Limites = { izquierda: -16.5, derecha: 63.5, arriba: -100, abajo: 11.5 };

function Escenario({ children }: { children: ReactNode }) {
  return (
    <Lienzo limites={ENCUADRE} ancho={ANCHO_DE_ESCENA} alto={ALTO_DE_ESCENA}>
      {children}
    </Lienzo>
  );
}

interface PropsDeLaEscena {
  animar: boolean;
}

function Parado() {
  return (
    <Escenario>
      <BrazoEntero brazo={QUIETO_EL_DERECHO} />
      <Cuerpo cara={{ boca: 'seria', mirada: 'frente' }} />
      <BrazoEntero brazo={QUIETO} />
    </Escenario>
  );
}

function Trabajando() {
  const derecho: Brazo = {
    lado: 'derecho',
    muneca: [21.4, -18.3, 64.2],
    polo: [-0.5, -1, 0.3],
    mano: 'agarra',
  };
  return (
    <Escenario>
      <Mueble {...MUEBLE} />
      <Taladro punta={[22, -26, MUEBLE.alto]} />
      <BrazoEntero brazo={derecho} />
      <Cuerpo cara={{ boca: 'seria', mirada: 'abajo' }} />
      <BrazoEntero brazo={QUIETO} />
    </Escenario>
  );
}

function Midiendo() {
  const derecho: Brazo = {
    lado: 'derecho',
    muneca: [12.6, -20.4, 57],
    polo: [-0.4, -1, -0.2],
    mano: 'agarra',
  };
  const [x, y] = MARCA_EN_LA_TABLA;
  return (
    <Escenario>
      <Mueble {...MUEBLE} />
      <Caja {...TABLA} />
      <Cinta />
      <path
        d={capsula(
          ver([x - 1, y + 1.4, ARRIBA_DE_LA_TABLA + 9]),
          ver([x, y, ARRIBA_DE_LA_TABLA]),
          1.9,
        )}
        className="cara"
      />
      <BrazoEntero brazo={derecho} />
      <Cuerpo cara={{ boca: 'seria', mirada: 'abajo' }} lapiz={false} />
      <BrazoEntero brazo={QUIETO} />
    </Escenario>
  );
}

function Pensando() {
  const derecho: Brazo = {
    lado: 'derecho',
    muneca: [6, -2, 66.8],
    polo: [0, -0.6, -1],
    mano: 'agarra',
  };
  return (
    <Escenario>
      <Mueble {...MUEBLE} fantasma />
      <Hombro brazo={derecho} />
      <Cuerpo cara={{ boca: 'seria', mirada: 'arriba' }} />
      <BrazoEntero brazo={QUIETO} />
      <Antebrazo brazo={derecho} />
    </Escenario>
  );
}

const LUGAR_DE_LA_TILDE = { x: 36, y: -86 } as const;

function Pulgar({ animar }: PropsDeLaEscena) {
  const derecho: Brazo = {
    lado: 'derecho',
    muneca: [9, -22, 62.5],
    polo: [0.2, -1, -0.7],
    mano: 'pulgar',
  };
  return (
    <Escenario>
      <Mueble {...MUEBLE} />
      <BrazoEntero brazo={derecho} />
      <Cuerpo cara={{ boca: 'sonrisa', mirada: 'frente' }} />
      <BrazoEntero brazo={QUIETO} />
      <path
        d={TILDE}
        pathLength={1}
        transform={`translate(${n(LUGAR_DE_LA_TILDE.x)} ${n(LUGAR_DE_LA_TILDE.y)})`}
        className={animar ? 'mano trazar' : 'mano'}
      />
    </Escenario>
  );
}

function Saludando() {
  const derecho: Brazo = {
    lado: 'derecho',
    muneca: [3.6, -21.2, 79],
    polo: [0, -0.6, -1],
    mano: 'palma',
  };
  const codo = ver(codoDe(derecho));
  const antes = girar(codo, ver(derecho.muneca), 22);
  return (
    <Escenario>
      <Mueble {...MUEBLE} />
      <g className="trazos">
        <path d={tubo([codo, antes], ANCHO.brazo)} />
        <path
          d={PALMA}
          transform={`translate(${n(antes[0])} ${n(antes[1])}) rotate(32) scale(1.15)`}
        />
      </g>
      <BrazoEntero brazo={derecho} />
      <Cuerpo cara={{ boca: 'sonrisa', mirada: 'frente' }} />
      <BrazoEntero brazo={QUIETO} />
    </Escenario>
  );
}

const ESCENAS = {
  parado: Parado,
  trabajando: Trabajando,
  midiendo: Midiendo,
  pensando: Pensando,
  pulgar: Pulgar,
  saludando: Saludando,
} as const satisfies Record<string, ComponentType<PropsDeLaEscena>>;

export type PoseDeEliseo = keyof typeof ESCENAS;

export const POSES_DE_ELISEO = Object.keys(ESCENAS) as readonly PoseDeEliseo[];

export interface EliseoProps {
  pose: PoseDeEliseo;
  animar?: boolean;
}

export function Eliseo({ pose, animar = false }: EliseoProps) {
  const Dibujo: ComponentType<PropsDeLaEscena> = ESCENAS[pose];
  return <Dibujo animar={animar} />;
}
