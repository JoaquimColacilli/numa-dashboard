import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { EncuestaCompartida } from '@/shared/api';
import {
  cargarMensajesDelCliente,
  MENSAJES_DEL_CLIENTE_EN_CASTELLANO,
} from '@/shared/idioma-del-cliente';

import { EncuestaPublicaPage } from './EncuestaPublicaPage';

const TITULO_MUERTO = MENSAJES_DEL_CLIENTE_EN_CASTELLANO.encuesta.muerto.titulo;

const TEXTO_MUERTO = MENSAJES_DEL_CLIENTE_EN_CASTELLANO.encuesta.muerto.texto;

const CAMBIO_LA_ENCUESTA = MENSAJES_DEL_CLIENTE_EN_CASTELLANO.encuesta.alMandar.cambioLaEncuesta;

const api = vi.hoisted(() => ({
  encuestaCompartida: vi.fn<(token: string) => Promise<EncuestaCompartida>>(),
  contestarEncuesta: vi.fn<(token: string, respuesta: unknown) => Promise<string>>(),
}));

vi.mock('@/shared/api', async (original) => ({
  ...(await original<typeof import('@/shared/api')>()),
  encuestaCompartida: api.encuestaCompartida,
  contestarEncuesta: api.contestarEncuesta,
}));

const ENCUESTA: EncuestaCompartida = {
  taller: 'Taller MAUN',
  cliente: 'Marcela',
  trabajo: 'Placard 3 puertas con interior en melamina',
  idioma: 'es',
  resena: 'https://g.page/r/maun/review',
  preguntas: [
    {
      id: 'conforme',
      texto: '¿Qué tan conforme quedaste con el mueble?',
      tipo: 'escala5',
      escala: 'conformidad',
      obligatoria: true,
      opciones: null,
      propia: false,
    },
    {
      id: 'recomienda',
      texto: '¿Se lo recomendarías a alguien?',
      tipo: 'sitalvezno',
      escala: null,
      obligatoria: true,
      opciones: null,
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
  ],
  contestada: null,
};

const LINK_MUERTO = { code: 'MN010', message: 'Este link no funciona', details: null, hint: '' };

function montar() {
  render(
    <MemoryRouter initialEntries={['/o/token-de-prueba-0001']}>
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: { queries: { retry: false, networkMode: 'offlineFirst' } },
          })
        }
      >
        <Routes>
          <Route path="/o/:token" element={<EncuestaPublicaPage />} />
        </Routes>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

function marcarTodo(): void {
  fireEvent.click(screen.getByRole('radio', { name: 'Muy conforme' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Sí, sin dudarlo' }));
}

const subir = vi.fn<(opciones: ScrollToOptions) => void>();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-21T15:00:00'));
  vi.stubGlobal('scrollTo', subir);
  onlineManager.setOnline(true);
  subir.mockReset();
  api.encuestaCompartida.mockReset();
  api.contestarEncuesta.mockReset();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  document.documentElement.lang = 'es-AR';
});

describe('la encuesta que abre el cliente', () => {
  it('sin contestar, es una sola columna que dice de qué taller es y que el enlace lo identifica', async () => {
    api.encuestaCompartida.mockResolvedValue(ENCUESTA);
    montar();

    expect(
      await screen.findByRole('heading', { level: 1, name: '¿Cómo te fue con tu placard?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Taller MAUN')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Son dos preguntas y te lleva menos de dos minutos. Lo lee el dueño del taller.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/el taller va a saber que esto lo contestaste vos/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: '¿Qué tan conforme quedaste con el mueble?' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(api.encuestaCompartida).toHaveBeenCalledWith('token-de-prueba-0001');
  });

  it('sin las obligatorias no manda nada, dice cuántas faltan y lleva el foco a la primera', async () => {
    api.encuestaCompartida.mockResolvedValue(ENCUESTA);
    montar();

    fireEvent.click(await screen.findByRole('button', { name: 'Mandar mi opinión' }));

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Te faltan 2 preguntas, están marcadas más arriba.',
    );
    expect(screen.getByRole('radio', { name: 'Nada' })).toHaveFocus();
    expect(screen.getByRole('radio', { name: 'Nada' })).toHaveAccessibleDescription(
      'Falta esta. Tocá una opción para seguir.',
    );
    expect(api.contestarEncuesta).not.toHaveBeenCalled();
  });

  it('al mandar da las gracias por el nombre y pide la reseña a todos por igual', async () => {
    api.encuestaCompartida.mockResolvedValue(ENCUESTA);
    api.contestarEncuesta.mockResolvedValue('guardada');
    montar();

    await screen.findByRole('button', { name: 'Mandar mi opinión' });
    marcarTodo();
    fireEvent.change(screen.getByRole('textbox', { name: '¿Qué podríamos hacer mejor?' }), {
      target: { value: '  Nada, todo bien.  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Mandar mi opinión' }));

    expect(await screen.findByRole('heading', { name: 'Gracias, Marcela' })).toHaveFocus();
    expect(subir).toHaveBeenCalledWith({ top: 0 });
    expect(screen.getByRole('link', { name: 'Dejar una reseña' })).toHaveAttribute(
      'href',
      'https://g.page/r/maun/review',
    );
    const [, respuesta] = api.contestarEncuesta.mock.calls[0] ?? [];
    expect(respuesta).toMatchObject({
      renglones: [
        { pregunta: 'conforme', valor: 5 },
        { pregunta: 'recomienda', valor: 3 },
        { pregunta: 'mejor', valor: 'Nada, todo bien.' },
      ],
    });
  });

  it('si se corta la señal al mandar, avisa y no pierde lo marcado', async () => {
    api.encuestaCompartida.mockResolvedValue(ENCUESTA);
    api.contestarEncuesta.mockRejectedValue(new TypeError('Failed to fetch'));
    montar();

    await screen.findByRole('button', { name: 'Mandar mi opinión' });
    marcarTodo();
    fireEvent.click(screen.getByRole('button', { name: 'Mandar mi opinión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('se cortó la conexión');
    expect(screen.getByRole('radio', { name: 'Muy conforme' })).toBeChecked();
  });

  it('si ya la había contestado, no pisa nada: muestra lo que quedó guardado', async () => {
    api.encuestaCompartida.mockResolvedValueOnce(ENCUESTA).mockResolvedValue({
      ...ENCUESTA,
      contestada: {
        fecha: '2026-09-18',
        renglones: [
          { preguntaId: 'conforme', valor: 4 },
          { preguntaId: 'recomienda', valor: 3 },
        ],
      },
    });
    api.contestarEncuesta.mockResolvedValue('ya_contestada');
    montar();

    await screen.findByRole('button', { name: 'Mandar mi opinión' });
    marcarTodo();
    fireEvent.click(screen.getByRole('button', { name: 'Mandar mi opinión' }));

    expect(
      await screen.findByRole('heading', { name: 'Ya nos contaste, gracias' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Contestaste el 18 de septiembre/)).toBeInTheDocument();
    expect(screen.getByText('Conforme')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mandar mi opinión' })).not.toBeInTheDocument();
  });

  it('un enlace dado de baja y uno que no existe se ven igual, sin nombres', async () => {
    api.encuestaCompartida.mockRejectedValue(LINK_MUERTO);
    montar();

    expect(await screen.findByRole('heading', { name: TITULO_MUERTO })).toBeInTheDocument();
    expect(screen.getByText(TEXTO_MUERTO)).toBeInTheDocument();
    expect(screen.queryByText(/Marcela|Placard/)).not.toBeInTheDocument();
  });

  it('si el enlace se da de baja mientras contesta, lo dice en vez de fallar callado', async () => {
    api.encuestaCompartida.mockResolvedValue(ENCUESTA);
    api.contestarEncuesta.mockRejectedValue(LINK_MUERTO);
    montar();

    await screen.findByRole('button', { name: 'Mandar mi opinión' });
    marcarTodo();
    fireEvent.click(screen.getByRole('button', { name: 'Mandar mi opinión' }));

    expect(await screen.findByRole('heading', { name: TITULO_MUERTO })).toBeInTheDocument();
  });

  it('si el taller sacó una pregunta mientras contestaba, trae la encuesta al día y deja mandar de nuevo', async () => {
    const conPropia: EncuestaCompartida = {
      ...ENCUESTA,
      preguntas: [
        ...ENCUESTA.preguntas,
        {
          id: 'propia',
          texto: '¿La altura de la alacena te quedó cómoda?',
          tipo: 'escala5',
          escala: 'conformidad',
          obligatoria: false,
          opciones: null,
          propia: true,
        },
      ],
    };
    api.encuestaCompartida.mockResolvedValueOnce(conPropia).mockResolvedValue(ENCUESTA);
    api.contestarEncuesta
      .mockRejectedValueOnce({
        code: 'MN011',
        details: 'ajena',
        hint: null,
        message: 'Vino una respuesta a una pregunta que no es de esta encuesta',
      })
      .mockResolvedValue('guardada');
    montar();

    const propia = await screen.findByRole('group', {
      name: '¿La altura de la alacena te quedó cómoda?',
    });
    const conforme = screen.getByRole('group', {
      name: '¿Qué tan conforme quedaste con el mueble?',
    });
    fireEvent.click(within(conforme).getByRole('radio', { name: 'Muy conforme' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Sí, sin dudarlo' }));
    fireEvent.click(within(propia).getByRole('radio', { name: 'Conforme' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mandar mi opinión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(CAMBIO_LA_ENCUESTA);
    await waitFor(() => {
      expect(
        screen.queryByRole('group', { name: '¿La altura de la alacena te quedó cómoda?' }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole('radio', { name: 'Muy conforme' })).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Mandar mi opinión' }));
    expect(await screen.findByRole('heading', { name: 'Gracias, Marcela' })).toBeInTheDocument();
    const [, segunda] = api.contestarEncuesta.mock.calls[1] ?? [];
    expect(segunda).toMatchObject({
      renglones: [
        { pregunta: 'conforme', valor: 5 },
        { pregunta: 'recomienda', valor: 3 },
      ],
    });
  });

  it('si no se pudo abrir, deja probar de nuevo', async () => {
    api.encuestaCompartida
      .mockRejectedValueOnce({ code: 'XX000', message: 'se cayó' })
      .mockResolvedValue(ENCUESTA);
    montar();

    fireEvent.click(await screen.findByRole('button', { name: 'Probar de nuevo' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mandar mi opinión' })).toBeInTheDocument();
    });
  });

  it('una respuesta a la pregunta propia del trabajo va igual que las otras', async () => {
    const conPropia: EncuestaCompartida = {
      ...ENCUESTA,
      preguntas: [
        ...ENCUESTA.preguntas,
        {
          id: 'propia',
          texto: '¿La altura de la alacena te quedó cómoda?',
          tipo: 'escala5',
          escala: 'conformidad',
          obligatoria: false,
          opciones: null,
          propia: true,
        },
      ],
    };
    api.encuestaCompartida.mockResolvedValue(conPropia);
    montar();

    const propia = await screen.findByRole('group', {
      name: '¿La altura de la alacena te quedó cómoda?',
    });
    expect(within(propia).getAllByRole('radio')).toHaveLength(5);
  });
});

describe('el idioma de la encuesta', () => {
  beforeAll(async () => {
    await Promise.all([cargarMensajesDelCliente('en'), cargarMensajesDelCliente('pt-BR')]);
  }, 30_000);

  it('es el de los clientes del taller, con el lang y la pestaña en ese idioma, y las preguntas como se escribieron', async () => {
    api.encuestaCompartida.mockResolvedValue({ ...ENCUESTA, idioma: 'pt-BR' });
    montar();

    const titulo = await screen.findByRole('heading', {
      level: 1,
      name: 'Como foi a experiência com “Placard 3 puertas con interior en melamina”?',
    });
    expect(within(titulo).getByText('Placard 3 puertas con interior en melamina')).toHaveAttribute(
      'translate',
      'no',
    );
    expect(
      screen.getByText(
        'São 2 perguntas e leva menos de 2 minutos. Quem lê é o dono da marcenaria.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('group', { name: '¿Qué tan conforme quedaste con el mueble?' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Gostei muito' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Sim, com certeza' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar minha opinião' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('pt-BR');
    expect(document.title).toBe('Pesquisa de satisfação · Taller MAUN');
  });

  it('el motivo con que la base rechaza una respuesta se dice en el idioma del cliente', async () => {
    api.encuestaCompartida.mockResolvedValue({ ...ENCUESTA, idioma: 'en' });
    api.contestarEncuesta.mockRejectedValue({
      code: 'MN011',
      details: 'obligatoria',
      hint: null,
      message: 'Falta contestar una pregunta obligatoria',
    });
    montar();

    fireEvent.click(await screen.findByRole('radio', { name: 'Very satisfied' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Yes, absolutely' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send my feedback' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A required question is missing its answer',
    );
  });

  it('en castellano, el motivo dice lo mismo que la base', async () => {
    api.encuestaCompartida.mockResolvedValue(ENCUESTA);
    api.contestarEncuesta.mockRejectedValue({
      code: 'MN011',
      details: 'largo',
      hint: null,
      message: 'Un texto pasa de los 2000 caracteres que acepta la encuesta',
    });
    montar();

    await screen.findByRole('button', { name: 'Mandar mi opinión' });
    marcarTodo();
    fireEvent.click(screen.getByRole('button', { name: 'Mandar mi opinión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Un texto pasa de los 2000 caracteres que acepta la encuesta',
    );
  });

  it('sin encuesta, el aviso habla en el idioma que ya tenía la página', async () => {
    document.documentElement.lang = 'en-US';
    api.encuestaCompartida.mockRejectedValue(LINK_MUERTO);
    montar();

    expect(
      await screen.findByRole('heading', { name: 'This link no longer works' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Taller MAUN')).toHaveAttribute('translate', 'no');
    expect(document.documentElement.lang).toBe('en-US');
  });
});
