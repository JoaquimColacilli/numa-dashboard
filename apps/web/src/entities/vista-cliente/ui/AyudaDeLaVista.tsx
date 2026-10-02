import { useState } from 'react';

import { useMensajes, type Mensajes } from '@/shared/idioma';
import { useAnchoDePantalla } from '@/shared/lib';
import { Button, ConSalida, Hoja, Icono, type NombreDeIcono } from '@/shared/ui';

interface Fila {
  clave: string;
  paso?: number;
  icono?: NombreDeIcono;
  titulo: string;
  texto: string;
}

interface Lamina {
  id: string;
  titulo: string;
  entrada?: string;
  filas: readonly Fila[];
  pie?: string;
}

type TextosDeLasLaminas = Mensajes['vistaCliente']['ayuda']['laminas'];

function laminasDe(t: TextosDeLasLaminas): readonly Lamina[] {
  return [
    {
      id: 'enlace',
      titulo: t.enlace.titulo,
      entrada: t.enlace.entrada,
      filas: [
        { clave: 'no-vence', icono: 'link-2', ...t.enlace.noVence },
        { clave: 'se-actualiza', icono: 'refresh-cw', ...t.enlace.seActualiza },
        { clave: 'lo-mismo', icono: 'eye', ...t.enlace.loMismo },
        { clave: 'silencio', icono: 'clock', ...t.enlace.silencio },
        { clave: 'vidriera', icono: 'image', ...t.enlace.vidriera },
      ],
    },
    {
      id: 'antes',
      titulo: t.antes.titulo,
      filas: [
        { clave: 'estimativo', icono: 'send', ...t.antes.estimativo },
        { clave: 'relevamiento', icono: 'info', ...t.antes.relevamiento },
        { clave: 'relevamiento-tecnico', icono: 'ruler', ...t.antes.relevamientoTecnico },
        { clave: 'sin-medir', icono: 'route', ...t.antes.sinMedir },
        { clave: 'sin-nada', icono: 'message-circle', ...t.antes.sinNada },
      ],
    },
    {
      id: 'presupuesto',
      titulo: t.presupuesto.titulo,
      filas: [
        { clave: 'paso-1', paso: 1, ...t.presupuesto.paso1 },
        { clave: 'esperando', icono: 'clock', ...t.presupuesto.esperando },
        { clave: 'paso-2', paso: 2, ...t.presupuesto.paso2 },
      ],
      pie: t.presupuesto.pie,
    },
    {
      id: 'el-presupuesto',
      titulo: t.elPresupuesto.titulo,
      entrada: t.elPresupuesto.entrada,
      filas: [
        { clave: 'rotulo', icono: 'file-text', ...t.elPresupuesto.rotulo },
        { clave: 'revision', icono: 'refresh-cw', ...t.elPresupuesto.revision },
        { clave: 'opciones', icono: 'split', ...t.elPresupuesto.opciones },
        { clave: 'vencido', icono: 'triangle-alert', ...t.elPresupuesto.vencido },
        { clave: 'aceptado', icono: 'circle-check', ...t.elPresupuesto.aceptado },
      ],
    },
    {
      id: 'taller',
      titulo: t.taller.titulo,
      filas: [
        { clave: 'paso-3', paso: 3, ...t.taller.paso3 },
        { clave: 'paso-4', paso: 4, ...t.taller.paso4 },
        { clave: 'estimada', icono: 'calendar-days', ...t.taller.estimada },
      ],
      pie: t.taller.pie,
    },
    {
      id: 'listo',
      titulo: t.listo.titulo,
      entrada: t.listo.entrada,
      filas: [
        { clave: 'listo', icono: 'circle-check', ...t.listo.listo },
        { clave: 'un-dia', icono: 'calendar-check', ...t.listo.unDia },
        { clave: 'sus-dias', icono: 'calendar-days', ...t.listo.susDias },
        { clave: 'comprometida', icono: 'truck', ...t.listo.comprometida },
      ],
      pie: t.listo.pie,
    },
    {
      id: 'saldo',
      titulo: t.saldo.titulo,
      filas: [
        { clave: 'paso-5', paso: 5, ...t.saldo.paso5 },
        { clave: 'foco', icono: 'hand-coins', ...t.saldo.foco },
        { clave: 'primero-la-entrega', icono: 'truck', ...t.saldo.primeroLaEntrega },
        { clave: 'transferir', icono: 'copy', ...t.saldo.transferir },
      ],
    },
    {
      id: 'atras',
      titulo: t.atras.titulo,
      entrada: t.atras.entrada,
      filas: [
        { clave: 'retrocede', icono: 'arrow-left-right', ...t.atras.retrocede },
        { clave: 'sin-rastro', icono: 'eye-off', ...t.atras.sinRastro },
        { clave: 'fechas', icono: 'calendar-check', ...t.atras.fechas },
      ],
    },
    {
      id: 'nunca',
      titulo: t.nunca.titulo,
      filas: [
        { clave: 'tu-plata', icono: 'eye-off', ...t.nunca.tuPlata },
        { clave: 'fotos', icono: 'image', ...t.nunca.fotos },
        { clave: 'otros', icono: 'users', ...t.nunca.otros },
      ],
    },
  ];
}

function Marca({ fila }: { fila: Fila }) {
  if (fila.paso !== undefined) {
    return (
      <span
        aria-hidden
        className="flex size-7 flex-none items-center justify-center rounded-pill bg-ink text-label font-semibold text-paper tabular-nums"
      >
        {fila.paso}
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="flex size-7 flex-none items-center justify-center rounded-field bg-surface text-text-2"
    >
      <Icono nombre={fila.icono ?? 'circle'} tamano={16} />
    </span>
  );
}

function Carrusel({ alCerrar }: { alCerrar: () => void }) {
  const textos = useMensajes().vistaCliente.ayuda;
  const laminas = laminasDe(textos.laminas);
  const [indice, setIndice] = useState(0);
  const esLaPrimera = indice === 0;
  const esLaUltima = indice === laminas.length - 1;

  function mover(cuanto: number): void {
    setIndice((actual) => Math.min(Math.max(actual + cuanto, 0), laminas.length - 1));
  }

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      onKeyDown={(evento) => {
        if (evento.key === 'ArrowRight') mover(1);
        if (evento.key === 'ArrowLeft') mover(-1);
      }}
    >
      <div
        aria-live="polite"
        className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 md:px-6 md:py-5"
      >
        {laminas.map((una, puesto) => (
          <div
            key={una.id}
            aria-hidden={puesto !== indice}
            className={`col-start-1 row-start-1 flex flex-col gap-3.5 self-start ${
              puesto === indice ? '' : 'invisible'
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-meta font-medium text-text-3 tabular-nums">
                {textos.lamina(puesto + 1, laminas.length)}
              </span>
              <h3 className="font-display text-lema leading-tight text-balance">{una.titulo}</h3>
              {una.entrada !== undefined && (
                <p className="mt-1 text-label leading-relaxed text-text-2">{una.entrada}</p>
              )}
            </div>

            <ul className="flex list-none flex-col gap-3.5">
              {una.filas.map((fila) => (
                <li key={fila.clave} className="flex gap-3">
                  <Marca fila={fila} />
                  <div className="min-w-0 flex-1">
                    <span className="block text-body-lg leading-snug font-semibold">
                      {fila.titulo}
                    </span>
                    <p className="mt-0.5 text-label leading-relaxed text-text-2">{fila.texto}</p>
                  </div>
                </li>
              ))}
            </ul>

            {una.pie !== undefined && (
              <p className="rounded-field bg-surface-3 px-3.5 py-2.5 text-label leading-relaxed text-text-2">
                {una.pie}
              </p>
            )}
          </div>
        ))}
      </div>

      <footer className="flex flex-none items-center gap-3 border-t border-hairline px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6 md:pb-3">
        <Button
          variant="secundario"
          disabled={esLaPrimera}
          onClick={() => {
            mover(-1);
          }}
        >
          <Icono nombre="chevron-left" tamano={16} />
          {textos.atras}
        </Button>

        <span aria-hidden className="flex flex-1 items-center justify-center gap-1.5">
          {laminas.map((una, puesto) => (
            <span
              key={una.id}
              className={`h-1.5 rounded-pill transition-[width,background-color] duration-(--dur-fast) ${
                puesto === indice ? 'w-5 bg-ink' : 'w-1.5 bg-border'
              }`}
            />
          ))}
        </span>

        {esLaUltima ? (
          <Button onClick={alCerrar}>{textos.listo}</Button>
        ) : (
          <Button
            onClick={() => {
              mover(1);
            }}
          >
            {textos.siguiente}
            <Icono nombre="chevron-right" tamano={16} />
          </Button>
        )}
      </footer>
    </div>
  );
}

export interface AyudaDeLaVistaProps {
  conTexto?: boolean;
}

export function AyudaDeLaVista({ conTexto = false }: AyudaDeLaVistaProps) {
  const { comoLoVeTuCliente } = useMensajes().vistaCliente.ayuda;
  const [abierta, setAbierta] = useState(false);
  const enCelular = useAnchoDePantalla() === 'movil';

  function cerrar(): void {
    setAbierta(false);
  }

  return (
    <>
      <Button
        variant={conTexto ? 'secundario' : 'herramienta'}
        size={conTexto ? 'normal' : 'herramienta'}
        aria-label={comoLoVeTuCliente}
        title={comoLoVeTuCliente}
        onClick={() => {
          setAbierta(true);
        }}
      >
        <Icono nombre="circle-help" tamano={conTexto ? 18 : 16} />
        {conTexto && comoLoVeTuCliente}
      </Button>

      <ConSalida valor={abierta}>
        {() => (
          <Hoja titulo={comoLoVeTuCliente} ancho="amplio" desdeAbajo={enCelular} alCerrar={cerrar}>
            <Carrusel alCerrar={cerrar} />
          </Hoja>
        )}
      </ConSalida>
    </>
  );
}
