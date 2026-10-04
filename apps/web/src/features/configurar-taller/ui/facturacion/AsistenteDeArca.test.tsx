import { onlineManager } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Contestado, EstadoDeLaFacturacion, FilaDe } from '@/shared/api';

import { GUIA_DE_LA_AUTORIZACION, GUIA_DEL_CERTIFICADO } from '../../model/asistente';
import { AsistenteDeArca } from './AsistenteDeArca';
import type { ServiciosDeArca } from './PasosDeNuma';

const SIN_CONECTAR = {
  id: 'a1',
  household_id: 'h',
  facturacion_ambiente: null,
  facturacion_cuit: '',
  facturacion_punto_de_venta: null,
  facturacion_desde: null,
} as unknown as FilaDe<'ajustes'>;

const CONECTADO = {
  ...SIN_CONECTAR,
  facturacion_ambiente: 'produccion',
  facturacion_cuit: '20-11111111-2',
  facturacion_punto_de_venta: 3,
  facturacion_desde: '2026-09-03',
} as unknown as FilaDe<'ajustes'>;

const ESTADO: EstadoDeLaFacturacion = {
  conectada: false,
  ambiente: null,
  prendido: true,
  servidor: null,
  login: null,
  esperarHasta: null,
  ultimoNumero: null,
  certificadoVence: null,
  certificado: null,
};

const SUBIDO: EstadoDeLaFacturacion = {
  ...ESTADO,
  certificado: { estado: 'subido', vence: '2028-10-03' },
};

const PEDIDO = '-----BEGIN CERTIFICATE REQUEST-----\nMIIB\n-----END CERTIFICATE REQUEST-----\n';

const CERTIFICADO = '-----BEGIN CERTIFICATE-----\nMIIC\n-----END CERTIFICATE-----\n';

function rechazo<M extends string>(motivo: M, esperarHasta: string | null = null) {
  return { ok: false as const, motivo, esperarHasta };
}

let descargados: { nombre: string; tipo: string }[] = [];

function servicios(estado: EstadoDeLaFacturacion = ESTADO) {
  return {
    estado: vi.fn(() => Promise.resolve(estado)),
    bajarElPedido: vi.fn<ServiciosDeArca['bajarElPedido']>(() =>
      Promise.resolve({ ok: true, valor: PEDIDO }),
    ),
    subirElCertificado: vi.fn<ServiciosDeArca['subirElCertificado']>(() =>
      Promise.resolve({ ok: true, valor: SUBIDO }),
    ),
    conectar: vi.fn<ServiciosDeArca['conectar']>(() =>
      Promise.resolve({
        ok: true,
        valor: { ...ESTADO, conectada: true, ambiente: 'produccion' },
      } satisfies Contestado<EstadoDeLaFacturacion, never>),
    ),
  };
}

async function montar(
  dobles: ReturnType<typeof servicios> = servicios(),
  ajustes: FilaDe<'ajustes'> = SIN_CONECTAR,
) {
  render(
    <MemoryRouter initialEntries={['/ajustes/facturacion/conectar']}>
      <AsistenteDeArca ajustes={ajustes} servicios={dobles} />
    </MemoryRouter>,
  );
  await waitFor(() => {
    expect(dobles.estado).toHaveBeenCalled();
  });
  await screen.findAllByRole('heading', { level: 2 });
  return dobles;
}

function paso(nombre: string): HTMLElement {
  const titulo = screen.getByRole('heading', { name: nombre });
  const item = titulo.closest('li');
  if (item === null) throw new Error(`falta el paso ${nombre}`);
  return item;
}

beforeEach(() => {
  onlineManager.setOnline(true);
  descargados = [];
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    value: () => undefined,
    configurable: true,
  });
  Object.defineProperty(URL, 'createObjectURL', {
    value: (archivo: File) => {
      descargados.push({ nombre: archivo.name, tipo: archivo.type });
      return 'blob:pedido';
    },
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', { value: () => undefined, configurable: true });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  Reflect.deleteProperty(URL, 'createObjectURL');
  Reflect.deleteProperty(URL, 'revokeObjectURL');
});

describe('el asistente para conectar con ARCA', () => {
  it('los once pasos, de NUMA y de ARCA, con las capturas que hay y las guías', async () => {
    await montar();
    const titulos = screen.getAllByRole('heading', { level: 2 }).map((uno) => uno.textContent);
    expect(titulos).toEqual([
      'Paso 1: Bajá el pedido del certificado',
      'Paso 2: Entrá a ARCA',
      'Paso 3: Abrí los certificados digitales',
      'Paso 4: Dá de alta el certificado de NUMA',
      'Paso 5: Bajá el certificado',
      'Paso 6: Subí el certificado',
      'Paso 7: Autorizá el certificado a facturar',
      'Paso 8: Elegí el certificado de NUMA',
      'Paso 9: Abrí los puntos de venta',
      'Paso 10: Creá el punto de venta de NUMA',
      'Paso 11: Conectá',
    ]);
    expect(paso('Paso 1: Bajá el pedido del certificado')).toHaveTextContent('En NUMA');
    expect(paso('Paso 2: Entrá a ARCA')).toHaveTextContent('En ARCA');

    const ingreso = within(paso('Paso 2: Entrá a ARCA')).getByRole('img');
    expect(ingreso).toHaveAccessibleName(
      'La pantalla de ingreso de ARCA, con el campo del CUIT y el botón «Siguiente».',
    );
    expect(ingreso.closest('a')).toHaveAttribute('target', '_blank');
    expect(within(paso('Paso 5: Bajá el certificado')).queryByRole('img')).toBeNull();

    const guia = screen.getByRole('link', { name: /La guía de ARCA para el certificado/ });
    expect(guia).toHaveAttribute('href', GUIA_DEL_CERTIFICADO);
    expect(guia).toHaveAttribute('target', '_blank');
    expect(guia).toHaveAccessibleName(
      'La guía de ARCA para el certificado (se abre en una pestaña nueva)',
    );
    expect(screen.getByRole('link', { name: /La guía de ARCA para autorizarlo/ })).toHaveAttribute(
      'href',
      GUIA_DE_LA_AUTORIZACION,
    );
    expect(paso('Paso 4: Dá de alta el certificado de NUMA').querySelectorAll('code')).toHaveLength(
      3,
    );
  });

  it('bajar el pedido baja numa-produccion.csr y el paso queda hecho', async () => {
    const dobles = await montar();
    const pedido = paso('Paso 1: Bajá el pedido del certificado');
    fireEvent.click(within(pedido).getByRole('button', { name: 'Bajar el pedido' }));

    expect(
      await within(pedido).findByText(/Si lo perdés, bajalo de nuevo y subí el nuevo a ARCA\./),
    ).toBeInTheDocument();
    expect(dobles.bajarElPedido).toHaveBeenCalledTimes(1);
    expect(descargados).toEqual([{ nombre: 'numa-produccion.csr', tipo: 'application/pkcs10' }]);
    expect(within(pedido).getByRole('button', { name: 'Bajar el pedido de nuevo' })).toBeEnabled();
    expect(pedido).toHaveTextContent('Hecho.');
  });

  it('con la producción apagada, los tres pasos de NUMA lo dicen y no llaman a nada más', async () => {
    const dobles = servicios();
    dobles.bajarElPedido.mockResolvedValue(rechazo('apagada'));
    await montar(dobles);
    fireEvent.click(screen.getByRole('button', { name: 'Bajar el pedido' }));

    await waitFor(() => {
      expect(
        screen.getAllByText('La facturación de verdad todavía no está prendida. Avisale a Joaco.'),
      ).toHaveLength(3);
    });
    expect(screen.queryByRole('button', { name: /Bajar el pedido/ })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Elegir el certificado' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Conectar' })).toBeNull();
    expect(descargados).toEqual([]);
  });

  it('si el estado ya dice que está apagada, no se puede pedir nada', async () => {
    const dobles = await montar(servicios({ ...ESTADO, prendido: false }));
    expect(
      screen.getAllByText('La facturación de verdad todavía no está prendida. Avisale a Joaco.'),
    ).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Bajar el pedido' })).toBeNull();
    expect(dobles.bajarElPedido).not.toHaveBeenCalled();
  });

  it('sin el CUIT en Tu presupuesto, lo dice y lleva a cargarlo', async () => {
    const dobles = servicios();
    dobles.bajarElPedido.mockResolvedValue(rechazo('taller-sin-cuit'));
    await montar(dobles);
    fireEvent.click(screen.getByRole('button', { name: 'Bajar el pedido' }));
    expect(
      await screen.findByText('Completá tu CUIT y tu nombre o razón social en Tu presupuesto.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a Tu presupuesto' })).toHaveAttribute(
      'href',
      '/ajustes/presupuesto',
    );
  });

  it('en modo prueba lo contesta el servidor', async () => {
    const dobles = servicios();
    dobles.bajarElPedido.mockResolvedValue(rechazo('en-prueba'));
    await montar(dobles);
    fireEvent.click(screen.getByRole('button', { name: 'Bajar el pedido' }));
    expect(await screen.findByText('Este taller está en modo prueba.')).toBeInTheDocument();
  });

  it('sin señal, los pasos de NUMA se apagan y dicen por qué', async () => {
    const dobles = servicios();
    render(
      <MemoryRouter>
        <AsistenteDeArca ajustes={SIN_CONECTAR} servicios={dobles} />
      </MemoryRouter>,
    );
    onlineManager.setOnline(false);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Bajar el pedido' })).toBeDisabled();
    });
    expect(screen.getAllByText('Para esto necesitás señal.')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Elegir el certificado' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Conectar' })).toBeDisabled();
  });

  it('con el certificado subido, abre en el paso 7 y pide confirmar antes de bajar otro pedido', async () => {
    const dobles = await montar(servicios(SUBIDO));
    const autorizar = paso('Paso 7: Autorizá el certificado a facturar');
    await waitFor(() => {
      expect(autorizar).toHaveFocus();
    });
    expect(paso('Paso 6: Subí el certificado')).toHaveTextContent(
      'Certificado listo. Vence el 3/10/2028.',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bajar el pedido de nuevo' }));
    const confirmar = screen.getByRole('alertdialog', { name: '¿Bajás otro pedido?' });
    expect(confirmar).toHaveTextContent(
      'Si bajás otro pedido, el certificado que subiste deja de servir.',
    );
    fireEvent.click(within(confirmar).getByRole('button', { name: 'Cancelar' }));
    expect(dobles.bajarElPedido).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Bajar el pedido de nuevo' }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Bajar otro pedido' }),
    );
    await waitFor(() => {
      expect(dobles.bajarElPedido).toHaveBeenCalledTimes(1);
    });
  });

  it('subir el certificado manda el archivo y dice cuándo vence', async () => {
    const dobles = await montar();
    const subir = paso('Paso 6: Subí el certificado');
    const archivo = within(subir).getByLabelText('El certificado que bajaste de ARCA');
    expect(archivo).toHaveAttribute('accept', '.crt,.cer,.pem');
    fireEvent.change(archivo, {
      target: {
        files: [new File([CERTIFICADO], 'numa.crt', { type: 'application/x-x509-ca-cert' })],
      },
    });
    expect(
      await within(subir).findByText('Certificado listo. Vence el 3/10/2028.'),
    ).toBeInTheDocument();
    expect(dobles.subirElCertificado).toHaveBeenCalledWith(CERTIFICADO);
    expect(within(subir).getByRole('button', { name: 'Elegir otro certificado' })).toBeEnabled();
  });

  it('un certificado que no es del pedido se rechaza con su motivo', async () => {
    const dobles = servicios();
    dobles.subirElCertificado.mockResolvedValue(rechazo('no-es-de-este-pedido'));
    await montar(dobles);
    fireEvent.change(screen.getByLabelText('El certificado que bajaste de ARCA'), {
      target: { files: [new File([CERTIFICADO], 'otro.crt')] },
    });
    expect(
      await screen.findByText(
        'Ese certificado no es del último pedido que bajaste de NUMA. Subí ese pedido a ARCA y bajá el certificado de nuevo.',
      ),
    ).toBeInTheDocument();
  });

  it('conectar pregunta antes, prueba con ARCA y deja volver a Facturación', async () => {
    const dobles = await montar(servicios(SUBIDO));
    const conectar = paso('Paso 11: Conectá');
    fireEvent.click(within(conectar).getByRole('button', { name: 'Conectar' }));
    expect(within(conectar).getByLabelText('Punto de venta')).toHaveAccessibleDescription(
      'Escribí el número del punto de venta, de una a cinco cifras.',
    );

    fireEvent.change(within(conectar).getByLabelText('Punto de venta'), {
      target: { value: '3' },
    });
    fireEvent.click(within(conectar).getByRole('button', { name: 'Conectar' }));
    const confirmar = screen.getByRole('alertdialog', {
      name: '¿Conectás la facturación de verdad?',
    });
    expect(confirmar).toHaveTextContent(
      'Desde ahora, cada factura que hagas en NUMA va a ser real, a tu nombre y con validez fiscal.',
    );
    fireEvent.click(within(confirmar).getByRole('button', { name: 'Conectar' }));

    expect(
      await within(conectar).findByText(
        'Listo, la facturación quedó conectada. Ya podés facturar tus cobros.',
      ),
    ).toBeInTheDocument();
    expect(dobles.conectar).toHaveBeenCalledWith(3);
    expect(within(conectar).getByRole('link', { name: 'Volver a Facturación' })).toHaveAttribute(
      'href',
      '/ajustes/facturacion',
    );
  });

  it('si ARCA no tiene el punto de venta, o pide esperar, no conecta y lo dice', async () => {
    const dobles = servicios(SUBIDO);
    dobles.conectar
      .mockResolvedValueOnce(rechazo('sin-punto-de-venta'))
      .mockResolvedValueOnce(rechazo('esperando', '2026-10-03T18:42:00Z'));
    await montar(dobles);
    const conectar = paso('Paso 11: Conectá');

    function probar(): void {
      fireEvent.click(within(conectar).getByRole('button', { name: 'Conectar' }));
      fireEvent.click(
        within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Conectar' }),
      );
    }

    fireEvent.change(within(conectar).getByLabelText('Punto de venta'), {
      target: { value: '3' },
    });
    probar();
    expect(
      await within(conectar).findByText(
        'ARCA no tiene el punto de venta 00003 para web services: revisá el número o el paso 10.',
      ),
    ).toBeInTheDocument();

    probar();
    expect(
      await within(conectar).findByText('ARCA pide esperar: probá de nuevo a las 15:42.'),
    ).toBeInTheDocument();
  });

  it('al renovar: los pasos 1 a 6 y el 11, el 7 y el 8 plegados, el mismo punto de venta', async () => {
    const dobles = servicios({
      ...SUBIDO,
      conectada: true,
      ambiente: 'produccion',
      certificadoVence: '2026-12-01',
    });
    dobles.conectar.mockResolvedValue(rechazo('login-rechazado'));
    await montar(dobles, CONECTADO);

    expect(screen.getAllByRole('heading', { level: 2 }).map((uno) => uno.textContent)).toEqual([
      'Paso 1: Bajá el pedido del certificado',
      'Paso 2: Entrá a ARCA',
      'Paso 3: Abrí los certificados digitales',
      'Paso 4: Dá de alta el certificado de NUMA',
      'Paso 5: Bajá el certificado',
      'Paso 6: Subí el certificado',
      'Si ARCA no deja entrar con el certificado nuevo',
      'Paso 11: Conectá',
    ]);
    const plegado = screen
      .getByRole('heading', { name: 'Si ARCA no deja entrar con el certificado nuevo' })
      .closest('details');
    expect(plegado).not.toBeNull();
    expect(plegado).not.toHaveAttribute('open');
    expect(screen.getAllByRole('heading', { level: 3 }).map((uno) => uno.textContent)).toEqual([
      'Paso 7: Autorizá el certificado a facturar',
      'Paso 8: Elegí el certificado de NUMA',
    ]);

    const conectar = paso('Paso 11: Conectá');
    const puntoDeVenta = within(conectar).getByLabelText('Punto de venta');
    expect(puntoDeVenta).toHaveValue('00003');
    expect(puntoDeVenta).toHaveAttribute('readonly');
    await waitFor(() => {
      expect(conectar).toHaveFocus();
    });

    fireEvent.click(within(conectar).getByRole('button', { name: 'Conectar' }));
    const confirmar = screen.getByRole('alertdialog', { name: '¿Cambiás el certificado?' });
    expect(confirmar).toHaveTextContent('Desde ahora, NUMA va a usar el certificado nuevo.');
    fireEvent.click(within(confirmar).getByRole('button', { name: 'Cambiar el certificado' }));

    expect(
      await within(conectar).findByText(
        'ARCA no deja entrar con el certificado nuevo: autorizalo a facturar con los pasos 7 y 8.',
      ),
    ).toBeInTheDocument();
    expect(dobles.conectar).toHaveBeenCalledWith(3);
    expect(plegado).toHaveAttribute('open');
  });
});
