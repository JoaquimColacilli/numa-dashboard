import type { Idioma, PreguntaDeLaEncuesta } from '@maun/domain';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { cargarMensajesDelCliente, ConElIdiomaDelCliente } from '@/shared/idioma-del-cliente';

import { FormularioDeLaEncuesta, GraciasPorContestar } from './EncuestaDelCliente';

beforeAll(async () => {
  await Promise.all([cargarMensajesDelCliente('en'), cargarMensajesDelCliente('pt-BR')]);
}, 30_000);

const PREGUNTAS: PreguntaDeLaEncuesta[] = [
  {
    id: 'tiempos',
    texto: '¿Y con los tiempos de entrega?',
    tipo: 'escala5',
    escala: 'tiempos',
    obligatoria: true,
    opciones: null,
    propia: false,
  },
  {
    id: 'conociste',
    texto: '¿Cómo nos conociste?',
    tipo: 'una',
    escala: null,
    obligatoria: false,
    opciones: ['Por Instagram', 'Me lo recomendaron'],
    propia: false,
  },
  {
    id: 'mejor',
    texto: '¿Qué podríamos hacer mejor?',
    tipo: 'texto',
    escala: null,
    obligatoria: false,
    opciones: null,
    propia: false,
  },
];

function formulario(idioma: Idioma, trabajo: string): void {
  render(
    <ConElIdiomaDelCliente idioma={idioma}>
      <FormularioDeLaEncuesta
        taller="Taller MAUN"
        trabajo={trabajo}
        preguntas={PREGUNTAS}
        idDeLaRespuesta="respuesta"
        alMandar={() => Promise.resolve(null)}
      />
    </ConElIdiomaDelCliente>,
  );
}

describe('la encuesta en el idioma del cliente', () => {
  it('en inglés, con las palabras de cada escala y lo escrito tal como vino', async () => {
    formulario('en', 'Vanitory colgante');

    const titulo = await screen.findByRole('heading', {
      level: 1,
      name: 'How did it go with “Vanitory colgante”?',
    });
    expect(within(titulo).getByText('Vanitory colgante')).toHaveAttribute('translate', 'no');
    expect(screen.getByText('Custom furniture')).toBeInTheDocument();
    expect(screen.getByText('Taller MAUN')).toHaveAttribute('translate', 'no');
    expect(
      screen.getByText(
        "This survey has 2 questions and takes less than 2 minutes. The shop's owner reads it.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('¿Y con los tiempos de entrega?')).toHaveAttribute('translate', 'no');
    expect(
      ['Very late', 'Delayed', 'More or less', 'On time', 'Early'].map(
        (paso) => screen.getByRole('radio', { name: paso }).getAttribute('value') ?? '',
      ),
    ).toEqual(['1', '2', '3', '4', '5']);
    expect(screen.getByText('Por Instagram')).toHaveAttribute('translate', 'no');
    expect(screen.getByText("It's optional, but it's what helps us most.")).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '¿Qué podríamos hacer mejor?' })).toHaveAttribute(
      'placeholder',
      'Whatever comes to mind. If nothing does, leave it blank and send it anyway.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send my feedback' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      "One question is missing. It's marked above.",
    );
    expect(screen.getByRole('radio', { name: 'Very late' })).toHaveAccessibleDescription(
      "This one's missing. Tap an option to continue.",
    );
  });

  it('en portugués, la vista previa sin trabajo no deja un título a medias', async () => {
    formulario('pt-BR', '');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Como foi a experiência com o seu móvel?',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Pesquisa de satisfação' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'No prazo' })).toBeInTheDocument();
  });

  it('las gracias nombran al cliente tal como se llama y piden la reseña', async () => {
    render(
      <ConElIdiomaDelCliente idioma="en">
        <GraciasPorContestar
          taller="Taller MAUN"
          cliente="Marcela Duarte"
          resena="https://g.page/r/maun/review"
        />
      </ConElIdiomaDelCliente>,
    );

    const titulo = await screen.findByRole('heading', { name: 'Thank you, Marcela' });
    expect(within(titulo).getByText('Marcela')).toHaveAttribute('translate', 'no');
    expect(screen.getByText('Would you leave the same review on Google?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Leave a review' })).toHaveAttribute(
      'href',
      'https://g.page/r/maun/review',
    );
  });
});
