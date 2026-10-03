import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Embudo } from './Embudo';
import { Lectura } from './Lectura';
import { Forma, Puntitos, PuntosDeCasos, type GrupoDeCasos } from './PuntosDeCasos';
import { RankingDeBarras } from './RankingDeBarras';
import { VerLosNumeros } from './VerLosNumeros';

afterEach(() => {
  cleanup();
});

function anchoDe(elemento: Element | null | undefined): string {
  return (elemento as HTMLElement | null | undefined)?.style.width ?? '';
}

describe('el ranking de barras', () => {
  it('los grupos con su total y la misma escala para todos, con «Sin categoría» hueca', () => {
    const { container } = render(
      <RankingDeBarras
        forma="en-una-linea"
        grupos={[
          {
            clave: 'trabajos',
            nombre: 'En los trabajos',
            totalTexto: '$ 8.300.000',
            renglones: [
              { clave: 'madera', nombre: 'Madera', valor: 4_900_000, valorTexto: '$ 4.900.000' },
              {
                clave: 'sin',
                nombre: 'Sin categoría',
                valor: 900_000,
                valorTexto: '$ 900.000',
                sinDato: true,
              },
            ],
          },
          {
            clave: 'taller',
            nombre: 'En el taller',
            totalTexto: '$ 1.100.000',
            renglones: [
              {
                clave: 'herramientas',
                nombre: 'Herramientas',
                valor: 420_000,
                valorTexto: '$ 420.000',
                esDato: true,
              },
            ],
          },
        ]}
      />,
    );
    const barras = container.querySelectorAll('[data-barra]');
    expect(anchoDe(barras[0])).toBe('100%');
    expect(Number.parseFloat(anchoDe(barras[2]))).toBeCloseTo((420_000 / 4_900_000) * 100);
    expect(barras[1]?.className).toContain('shadow-[inset_0_0_0_1.25px_var(--color-text-3)]');
    expect(screen.getByText('Sin categoría')).toHaveClass('text-text-2');
    expect(screen.getByText('Herramientas')).toHaveAttribute('translate', 'no');
    expect(screen.getByText('En el taller').parentElement).toHaveTextContent('$ 1.100.000');
  });

  it('la columna de los montos crece con el más largo, para que ninguno se salga a 320 px', () => {
    const { container } = render(
      <RankingDeBarras
        forma="en-una-linea"
        grupos={[
          {
            clave: 'trabajos',
            nombre: null,
            renglones: [
              { clave: 'madera', nombre: 'Madera', valor: 1, valorTexto: '$ 12.345.678,90' },
              { clave: 'flete', nombre: 'Flete', valor: 1, valorTexto: '$ 900' },
            ],
          },
        ]}
      />,
    );
    const lista = container.querySelector('ul');
    expect(lista?.style.getPropertyValue('--ancho-del-valor')).toBe('15ch');
    expect(container.querySelector('li')?.className).toContain(
      'grid-cols-[6.5rem_minmax(0,1fr)_max(6.25rem,var(--ancho-del-valor,0px))]',
    );
  });
});

describe('el embudo', () => {
  it('cada paso proporcional al primero, y el último en tinta', () => {
    const { container } = render(
      <Embudo
        pasos={[
          { clave: 'c', nombre: 'Consultas', cantidad: 26, cuenta: '26' },
          { clave: 'p', nombre: 'Presupuestos mandados', cantidad: 15, cuenta: '15 de 26' },
          {
            clave: 't',
            nombre: 'Se volvieron trabajo',
            cantidad: 6,
            cuenta: '6 de 15',
            fuerte: true,
          },
        ]}
      />,
    );
    const barras = container.querySelectorAll('[data-barra]');
    expect(anchoDe(barras[0])).toBe('100%');
    expect(Number.parseFloat(anchoDe(barras[1]))).toBeCloseTo((15 / 26) * 100);
    expect(barras[0]).toHaveClass('bg-contexto');
    expect(barras[2]).toHaveClass('bg-ink');
    expect(screen.getByText('Se volvieron trabajo')).toHaveClass('font-semibold');
  });
});

const CASOS: GrupoDeCasos[] = [
  { clave: 'aprobados', forma: 'lleno', cantidad: 6, rotulo: '6 aprobados' },
  { clave: 'perdidos', forma: 'cruz', cantidad: 5, rotulo: '5 perdidos' },
  { clave: 'esperan', forma: 'hueco', cantidad: 0, rotulo: '0 esperan respuesta' },
];

describe('los presupuestos, uno por uno', () => {
  it('un punto por caso con la forma de su grupo, y una raya si el grupo no tiene ninguno', () => {
    const { container } = render(
      <PuntosDeCasos
        nombre="Los presupuestos que mandaste"
        grupos={CASOS}
        maximoDePuntos={40}
        sinCasos="—"
      />,
    );
    const lista = screen.getByRole('list', { name: 'Los presupuestos que mandaste' });
    const grupos = within(lista).getAllByRole('listitem');
    expect(grupos[0]?.querySelectorAll('[data-forma="lleno"]')).toHaveLength(6);
    expect(grupos[1]?.querySelectorAll('[data-forma="cruz"]')).toHaveLength(5);
    expect(grupos[2]).toHaveTextContent('—0 esperan respuesta');
    expect(container.querySelector('[data-tramo]')).toBeNull();
  });

  it('con más de los que entran, una barra de tres tramos con sus etiquetas', () => {
    const muchos = CASOS.map((grupo) => ({ ...grupo, cantidad: grupo.cantidad * 4 + 1 }));
    const { container } = render(
      <PuntosDeCasos
        nombre="Los presupuestos que mandaste"
        grupos={muchos}
        maximoDePuntos={40}
        sinCasos="—"
      />,
    );
    const tramos = container.querySelectorAll<HTMLElement>('[data-tramo]');
    expect(tramos).toHaveLength(3);
    expect(tramos[0]?.style.flexGrow).toBe('25');
    expect(screen.getByRole('group', { name: 'Los presupuestos que mandaste' })).toHaveTextContent(
      '6 aprobados',
    );
  });

  it('las formas sueltas para las leyendas, y los puntitos de las tarjetas', () => {
    const { container } = render(
      <>
        <Forma forma="contexto" />
        <Puntitos puntos={['lleno', 'lleno', 'cruz', 'hueco']} />
      </>,
    );
    expect(container.querySelector('[data-forma="contexto"] circle')).toHaveClass('fill-contexto');
    const puntitos = container.querySelectorAll('[data-puntito]');
    expect([...puntitos].map((punto) => punto.getAttribute('data-puntito'))).toEqual([
      'lleno',
      'lleno',
      'cruz',
      'hueco',
    ]);
    expect(puntitos[3]?.className).toContain('shadow-[inset_0_0_0_1.25px_var(--color-ink)]');
  });
});

describe('la lectura de lo elegido', () => {
  it('dice lo elegido y, si hay a dónde ir, el botón aparte', () => {
    const alTocar = vi.fn();
    render(
      <Lectura accion={{ texto: 'Ver los 3 trabajos de mayo', alTocar }}>
        <b>$ 5.200.000</b> en mayo · 3 trabajos
      </Lectura>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ver los 3 trabajos de mayo' }));
    expect(alTocar).toHaveBeenCalledOnce();
    expect(screen.getByText('$ 5.200.000')).toBeInTheDocument();
  });

  it('si el botón abre una lista en el lugar, dice si está abierta y cuál controla', () => {
    render(
      <Lectura
        accion={{ texto: 'Esconder la lista', alTocar: vi.fn(), abierta: true, controla: 'lista' }}
      >
        <b>$ 5.200.000</b> en mayo · 3 trabajos
      </Lectura>,
    );
    const boton = screen.getByRole('button', { name: 'Esconder la lista' });
    expect(boton).toHaveAttribute('aria-expanded', 'true');
    expect(boton).toHaveAttribute('aria-controls', 'lista');
  });
});

describe('ver los números', () => {
  const TABLA = {
    titulo: 'Lo que te dejaron los trabajos, por mes',
    columnas: [
      { clave: 'mes', titulo: 'Mes' },
      { clave: 'trabajos', titulo: 'Trabajos', enElCelular: false },
      { clave: 'cobro', titulo: 'Como se cobró' },
    ],
    filas: [
      { clave: 'abr', celdas: ['abr 2027', '3', '$ 4.100.000'], resaltada: true },
      { clave: 'mar', celdas: ['mar 2027', '3', '$ 4.300.000'] },
    ],
  };

  it('la tabla gemela está siempre en el documento y el botón la muestra y la esconde', () => {
    render(
      <VerLosNumeros
        textos={{ ver: 'Ver los números', ocultar: 'Ocultar los números' }}
        tablas={[TABLA]}
      >
        <a href="#trabajos">Ver los 8 trabajos</a>
      </VerLosNumeros>,
    );
    const boton = screen.getByRole('button', { name: 'Ver los números' });
    expect(boton).toHaveAttribute('aria-expanded', 'false');
    const tabla = screen.getByRole('table', { hidden: true, name: TABLA.titulo });
    expect(tabla.closest('[hidden]')).not.toBeNull();
    expect(boton.getAttribute('aria-controls')).toBe(tabla.closest('[hidden]')?.id);

    fireEvent.click(boton);
    expect(screen.getByRole('button', { name: 'Ocultar los números' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    const visible = screen.getByRole('table', { name: TABLA.titulo });
    expect(
      within(visible)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['Mes', 'Trabajos', 'Como se cobró']);
    expect(within(visible).getByRole('rowheader', { name: 'abr 2027' })).toBeInTheDocument();
    expect(within(visible).getAllByRole('row')[1]).toHaveClass('font-semibold');
    expect(within(visible).getByRole('columnheader', { name: 'Trabajos' })).toHaveClass('hidden');
    expect(screen.getByRole('link', { name: 'Ver los 8 trabajos' })).toBeInTheDocument();
  });
});
