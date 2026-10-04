import { puntoDeVentaConCeros } from '@maun/domain';
import { useEffect, useRef, useState } from 'react';

import type {
  Contestado,
  EstadoDeLaFacturacion,
  MotivoDeLaConexion,
  MotivoDeLaSubida,
  MotivoDelPedido,
} from '@/shared/api';
import { useMensajes } from '@/shared/idioma';
import {
  fechaCorta,
  horaEnElTaller,
  Ir,
  RUTA_DE_LA_FACTURACION,
  RUTA_DEL_PRESUPUESTO_EN_AJUSTES,
} from '@/shared/lib';
import { descargarElArchivo } from '@/shared/pdf';
import { Button, Campo, ConSalida, FilaDeAcciones, Hoja, Icono } from '@/shared/ui';

import {
  ARCHIVO_DEL_PEDIDO,
  certificadoParaSubir,
  puntoDeVentaLeido,
  type AvanceDelAsistente,
} from '../../model/asistente';
import { puntoDeVentaEscrito } from '../../model/facturacion';
import { ENLACE_SECUNDARIO } from './ConexionConArca';
import { LineaDeListo, LineaDeProblema, TextoDeArca } from './PasoDelAsistente';

const TIPO_DEL_PEDIDO = 'application/pkcs10';

const ACEPTA_EL_CERTIFICADO = '.crt,.cer,.pem';

export interface ServiciosDeArca {
  estado: () => Promise<EstadoDeLaFacturacion>;
  bajarElPedido: () => Promise<Contestado<string, MotivoDelPedido>>;
  subirElCertificado: (
    certificado: string,
  ) => Promise<Contestado<EstadoDeLaFacturacion, MotivoDeLaSubida>>;
  conectar: (
    puntoDeVenta: number,
  ) => Promise<Contestado<EstadoDeLaFacturacion, MotivoDeLaConexion>>;
}

export interface PasoDeNuma {
  prendido: boolean;
  haySenal: boolean;
  alSaberQueEstaApagada: () => void;
}

type Desenlace<M extends string> =
  | { tipo: 'listo' }
  | { tipo: 'motivo'; motivo: M; esperarHasta: string | null }
  | { tipo: 'error' };

function useMontado() {
  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);
  return montado;
}

function SinSenal() {
  const m = useMensajes().facturacion.asistente;
  return (
    <p className="flex items-center gap-1.5 text-meta text-text-3">
      <Icono nombre="cloud-off" tamano={14} className="flex-none" />
      {m.sinSenal}
    </p>
  );
}

function Apagada() {
  const m = useMensajes().facturacion.asistente;
  return (
    <div role="status">
      <LineaDeProblema>{m.apagada}</LineaDeProblema>
    </div>
  );
}

function Confirmar({
  titulo,
  texto,
  cancelar,
  seguir,
  alCancelar,
  alSeguir,
}: {
  titulo: string;
  texto: string;
  cancelar: string;
  seguir: string;
  alCancelar: () => void;
  alSeguir: () => void;
}) {
  return (
    <Hoja titulo={titulo} rol="alertdialog" ancho="angosto" alCerrar={alCancelar}>
      <div className="flex flex-col gap-3.5 px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:px-6 md:pb-5">
        <p className="text-body leading-relaxed text-text-2">{texto}</p>
        <FilaDeAcciones>
          <Button variant="secundario" onClick={alCancelar}>
            {cancelar}
          </Button>
          <Button onClick={alSeguir}>{seguir}</Button>
        </FilaDeAcciones>
      </div>
    </Hoja>
  );
}

export interface BajarElPedidoProps extends PasoDeNuma {
  avance: AvanceDelAsistente;
  bajarElPedido: ServiciosDeArca['bajarElPedido'];
  alBajar: () => void;
}

export function BajarElPedido({
  avance,
  prendido,
  haySenal,
  alSaberQueEstaApagada,
  bajarElPedido,
  alBajar,
}: BajarElPedidoProps) {
  const m = useMensajes().facturacion.asistente;
  const t = m.pedido;
  const montado = useMontado();
  const [bajando, setBajando] = useState(false);
  const [desenlace, setDesenlace] = useState<Desenlace<MotivoDelPedido> | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const bajado = avance.pedidoBajado || desenlace?.tipo === 'listo';

  function bajar(): void {
    setBajando(true);
    setDesenlace(null);
    bajarElPedido()
      .then(
        (contestado) => {
          if (contestado.ok) {
            descargarElArchivo(
              new File([contestado.valor], ARCHIVO_DEL_PEDIDO, { type: TIPO_DEL_PEDIDO }),
            );
            alBajar();
          } else if (contestado.motivo === 'apagada') {
            alSaberQueEstaApagada();
          }
          if (!montado.current) return;
          if (contestado.ok) setDesenlace({ tipo: 'listo' });
          else if (contestado.motivo !== 'apagada') {
            setDesenlace({ tipo: 'motivo', motivo: contestado.motivo, esperarHasta: null });
          }
        },
        () => {
          if (montado.current) setDesenlace({ tipo: 'error' });
        },
      )
      .finally(() => {
        if (montado.current) setBajando(false);
      });
  }

  return (
    <>
      <p>{t.texto}</p>
      {bajado && (
        <div role="status">
          <LineaDeListo>
            <TextoDeArca texto={t.listo} />
          </LineaDeListo>
        </div>
      )}
      {prendido ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={bajado ? 'secundario' : 'primario'}
              cargando={bajando}
              disabled={!haySenal}
              onClick={() => {
                if (avance.certificadoSubido) {
                  setConfirmando(true);
                  return;
                }
                bajar();
              }}
            >
              {!bajando && <Icono nombre={haySenal ? 'download' : 'cloud-off'} tamano={16} />}
              {bajado ? t.bajarDeNuevo : t.bajar}
            </Button>
          </div>
          {!haySenal && <SinSenal />}
        </>
      ) : (
        <Apagada />
      )}
      {desenlace !== null && desenlace.tipo !== 'listo' && (
        <div role="status">
          <LineaDeProblema>
            {desenlace.tipo === 'error' ? (
              m.noSePudo
            ) : desenlace.motivo === 'taller-sin-cuit' ||
              desenlace.motivo === 'taller-sin-razon-social' ? (
              <>
                <span>{t.faltanTusDatos}</span>
                <Ir
                  a={RUTA_DEL_PRESUPUESTO_EN_AJUSTES}
                  className="inline-flex min-h-tap items-center gap-1 text-label font-semibold text-ink underline underline-offset-3"
                >
                  {t.irATuPresupuesto}
                  <Icono nombre="arrow-right" tamano={14} grosor={2} />
                </Ir>
              </>
            ) : desenlace.motivo === 'no-monotributo' ? (
              t.noMonotributo
            ) : desenlace.motivo === 'en-prueba' ? (
              m.enPrueba
            ) : (
              m.apagada
            )}
          </LineaDeProblema>
        </div>
      )}

      <ConSalida valor={confirmando}>
        {() => (
          <Confirmar
            titulo={t.otroPedido}
            texto={t.siBajasOtro}
            cancelar={t.cancelar}
            seguir={t.bajarOtro}
            alCancelar={() => {
              setConfirmando(false);
            }}
            alSeguir={() => {
              setConfirmando(false);
              bajar();
            }}
          />
        )}
      </ConSalida>
    </>
  );
}

export interface SubirElCertificadoProps extends PasoDeNuma {
  avance: AvanceDelAsistente;
  subirElCertificado: ServiciosDeArca['subirElCertificado'];
  alSubir: (estado: EstadoDeLaFacturacion) => void;
}

export function SubirElCertificado({
  avance,
  prendido,
  haySenal,
  alSaberQueEstaApagada,
  subirElCertificado,
  alSubir,
}: SubirElCertificadoProps) {
  const m = useMensajes().facturacion.asistente;
  const t = m.subir;
  const montado = useMontado();
  const archivo = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [desenlace, setDesenlace] = useState<Desenlace<MotivoDeLaSubida> | null>(null);
  const subido = avance.certificadoSubido && avance.vence !== null;

  function subir(elegido: File): void {
    setSubiendo(true);
    setDesenlace(null);
    certificadoParaSubir(elegido)
      .then(subirElCertificado)
      .then(
        (contestado) => {
          if (contestado.ok) alSubir(contestado.valor);
          else if (contestado.motivo === 'apagada') alSaberQueEstaApagada();
          if (!montado.current) return;
          if (contestado.ok) setDesenlace({ tipo: 'listo' });
          else if (contestado.motivo !== 'apagada') {
            setDesenlace({ tipo: 'motivo', motivo: contestado.motivo, esperarHasta: null });
          }
        },
        () => {
          if (montado.current) setDesenlace({ tipo: 'error' });
        },
      )
      .finally(() => {
        if (montado.current) setSubiendo(false);
      });
  }

  return (
    <>
      <p>{t.texto}</p>
      {subido && avance.vence !== null && (
        <div role="status">
          <LineaDeListo>{t.listo(fechaCorta(avance.vence))}</LineaDeListo>
        </div>
      )}
      {prendido ? (
        <>
          <input
            ref={archivo}
            type="file"
            accept={ACEPTA_EL_CERTIFICADO}
            aria-label={t.archivo}
            tabIndex={-1}
            className="sr-only"
            onChange={(evento) => {
              const elegido = evento.target.files?.[0];
              evento.target.value = '';
              if (elegido !== undefined) subir(elegido);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secundario"
              cargando={subiendo}
              disabled={!haySenal}
              onClick={() => {
                archivo.current?.click();
              }}
            >
              {!subiendo && <Icono nombre={haySenal ? 'upload' : 'cloud-off'} tamano={16} />}
              {subido ? t.elegirOtro : t.elegir}
            </Button>
          </div>
          {!haySenal && <SinSenal />}
        </>
      ) : (
        <Apagada />
      )}
      {desenlace !== null && desenlace.tipo !== 'listo' && (
        <div role="status">
          <LineaDeProblema>
            {desenlace.tipo === 'error' || desenlace.motivo === 'apagada'
              ? m.noSePudo
              : t.motivos[desenlace.motivo]}
          </LineaDeProblema>
        </div>
      )}
    </>
  );
}

export interface ConectarElTallerProps extends PasoDeNuma {
  renovando: boolean;
  puntoDeVentaFijo: number | null;
  conectar: ServiciosDeArca['conectar'];
  alConectar: (estado: EstadoDeLaFacturacion) => void;
  alRechazarElLogin: () => void;
}

export function ConectarElTaller({
  renovando,
  puntoDeVentaFijo,
  prendido,
  haySenal,
  alSaberQueEstaApagada,
  conectar,
  alConectar,
  alRechazarElLogin,
}: ConectarElTallerProps) {
  const m = useMensajes().facturacion.asistente;
  const t = m.conectar;
  const montado = useMontado();
  const [escrito, setEscrito] = useState(() => puntoDeVentaEscrito(puntoDeVentaFijo));
  const [falta, setFalta] = useState(false);
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [probando, setProbando] = useState(false);
  const [desenlace, setDesenlace] = useState<
    (Desenlace<MotivoDeLaConexion> & { puntoDeVenta: number }) | null
  >(null);

  function probar(puntoDeVenta: number): void {
    setProbando(true);
    setDesenlace(null);
    conectar(puntoDeVenta)
      .then(
        (contestado) => {
          if (contestado.ok) alConectar(contestado.valor);
          else if (contestado.motivo === 'apagada') alSaberQueEstaApagada();
          else if (contestado.motivo === 'login-rechazado' && renovando) alRechazarElLogin();
          if (!montado.current) return;
          if (contestado.ok) setDesenlace({ tipo: 'listo', puntoDeVenta });
          else if (contestado.motivo !== 'apagada') {
            setDesenlace({
              tipo: 'motivo',
              motivo: contestado.motivo,
              esperarHasta: contestado.esperarHasta,
              puntoDeVenta,
            });
          }
        },
        () => {
          if (montado.current) setDesenlace({ tipo: 'error', puntoDeVenta });
        },
      )
      .finally(() => {
        if (montado.current) setProbando(false);
      });
  }

  function textoDelMotivo(
    motivo: Exclude<MotivoDeLaConexion, 'apagada'>,
    esperarHasta: string | null,
    puntoDeVenta: number,
  ): string {
    switch (motivo) {
      case 'en-prueba':
        return m.enPrueba;
      case 'esperando':
        return esperarHasta === null
          ? t.motivos['arca-no-contesta']
          : t.motivos.esperando(horaEnElTaller(esperarHasta));
      case 'sin-punto-de-venta':
        return t.motivos['sin-punto-de-venta'](puntoDeVentaConCeros(puntoDeVenta));
      case 'login-rechazado':
        return renovando ? m.renovacion.rechazado : t.motivos['login-rechazado'];
      default:
        return t.motivos[motivo];
    }
  }

  const listo = desenlace?.tipo === 'listo';

  return (
    <>
      <p>{t.texto}</p>
      {!prendido && <Apagada />}
      {prendido && !listo && (
        <>
          <div className="flex flex-wrap items-start gap-x-2.5 gap-y-2">
            <Campo
              etiqueta={t.campo}
              inputMode="numeric"
              autoComplete="off"
              maxLength={5}
              contenedor="w-36"
              className="w-full tabular-nums"
              readOnly={renovando && puntoDeVentaFijo !== null}
              value={escrito}
              error={falta ? t.faltaElNumero : undefined}
              onChange={(evento) => {
                setEscrito(evento.target.value.replace(/[^0-9]/gu, ''));
                setFalta(false);
              }}
            />
            <div className="flex flex-col gap-1.5">
              <span aria-hidden className="invisible text-label">
                ·
              </span>
              <Button
                size="grande"
                cargando={probando}
                disabled={!haySenal}
                onClick={() => {
                  const puntoDeVenta = puntoDeVentaLeido(escrito);
                  if (puntoDeVenta === null) {
                    setFalta(true);
                    return;
                  }
                  setConfirmando(puntoDeVenta);
                }}
              >
                {!probando && !haySenal && <Icono nombre="cloud-off" tamano={16} />}
                {t.boton}
              </Button>
            </div>
          </div>
          {!haySenal && <SinSenal />}
        </>
      )}
      {probando && (
        <p role="status" className="flex items-center gap-2 text-body-sm text-ink">
          <span
            aria-hidden
            className="size-4 rounded-full border-2 border-ink/25 border-t-ink motion-safe:animate-maun-spin"
          />
          {t.probando}
        </p>
      )}
      {desenlace !== null && (
        <div role="status" className="flex flex-col items-start gap-2.5">
          {desenlace.tipo === 'listo' ? (
            <>
              <LineaDeListo>{renovando ? t.certificadoCambiado : t.listo}</LineaDeListo>
              <Ir a={RUTA_DE_LA_FACTURACION} className={ENLACE_SECUNDARIO}>
                {t.volver}
              </Ir>
            </>
          ) : (
            <LineaDeProblema>
              {desenlace.tipo === 'error' || desenlace.motivo === 'apagada'
                ? m.noSePudo
                : textoDelMotivo(desenlace.motivo, desenlace.esperarHasta, desenlace.puntoDeVenta)}
            </LineaDeProblema>
          )}
        </div>
      )}

      <ConSalida valor={confirmando}>
        {(puntoDeVenta) => (
          <Confirmar
            titulo={renovando ? t.cambiarElCertificado : t.deVerdad}
            texto={renovando ? t.desdeAhoraElNuevo : t.desdeAhora}
            cancelar={t.cancelar}
            seguir={renovando ? t.cambiar : t.boton}
            alCancelar={() => {
              setConfirmando(null);
            }}
            alSeguir={() => {
              setConfirmando(null);
              probar(puntoDeVenta);
            }}
          />
        )}
      </ConSalida>
    </>
  );
}
