import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

import { conectar, RAIZ } from './conexion.ts';
import {
  CUIT_DE_PRUEBA,
  cuitTapado,
  leerElPedido,
  type PedidoDeLaFacturacion,
} from './facturacion/pedido.ts';

interface FilaDelListado {
  email: string | null;
  nombre: string;
  ambiente: string | null;
  cuit: string;
  punto_de_venta: number | null;
  desde: string | null;
  activo_vence: string | null;
  pendiente: string | null;
  pedidas: number;
  emitiendo: number;
  a_revisar: number;
  rechazadas: number;
  errores: string | null;
}

function emailDeLosE2e(): string | undefined {
  const archivo = path.join(RAIZ, 'apps', 'web', '.env');
  if (!existsSync(archivo)) return undefined;
  return parseEnv(readFileSync(archivo, 'utf8')).E2E_EMAIL;
}

function hoyEnElTaller(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(
    new Date(),
  );
}

function conCeros(puntoDeVenta: number | null): string {
  return puntoDeVenta === null ? '—' : String(puntoDeVenta).padStart(5, '0');
}

async function tallerDelMail(
  cliente: Awaited<ReturnType<typeof conectar>>,
  email: string,
): Promise<{ household_id: string; nombre: string }> {
  const { rows } = await cliente.query<{ household_id: string; nombre: string }>(
    `select m.household_id, h.nombre
     from auth.users u
     join public.household_members m on m.user_id = u.id and m.deleted_at is null
     join public.households h on h.id = m.household_id and h.deleted_at is null
     where lower(u.email) = lower($1)`,
    [email],
  );
  const taller = rows[0];
  if (taller === undefined) throw new Error(`${email} no tiene un taller vivo.`);
  return taller;
}

async function hacer(pedido: PedidoDeLaFacturacion): Promise<void> {
  const cliente = await conectar();
  let enTransaccion = false;
  try {
    if (pedido.tarea === 'listar') {
      const { rows } = await cliente.query<FilaDelListado>(
        `select
           (select u.email from public.household_members m join auth.users u on u.id = m.user_id
            where m.household_id = a.household_id and m.rol = 'titular' and m.deleted_at is null
            order by m.created_at limit 1) as email,
           h.nombre,
           a.facturacion_ambiente as ambiente,
           a.facturacion_cuit as cuit,
           a.facturacion_punto_de_venta as punto_de_venta,
           a.facturacion_desde::text as desde,
           (select c.vence::text from private.arca_certificados c
            where c.household_id = a.household_id and c.estado = 'activo') as activo_vence,
           (select c.estado from private.arca_certificados c
            where c.household_id = a.household_id and c.estado <> 'activo') as pendiente,
           count(*) filter (where c.estado = 'pedida')::int as pedidas,
           count(*) filter (where c.estado = 'emitiendo')::int as emitiendo,
           count(*) filter (where c.estado = 'a_revisar')::int as a_revisar,
           count(*) filter (where c.estado = 'rechazada')::int as rechazadas,
           string_agg(distinct left(c.ultimo_error, 160), ' | ')
             filter (where c.estado in ('pedida', 'emitiendo') and c.ultimo_error is not null) as errores
         from public.ajustes a
         join public.households h on h.id = a.household_id
         left join public.comprobantes c on c.household_id = a.household_id and c.deleted_at is null
         where a.facturacion_ambiente is not null
            or exists (select 1 from private.arca_certificados x where x.household_id = a.household_id)
         group by a.household_id, h.nombre, a.facturacion_ambiente, a.facturacion_cuit,
                  a.facturacion_punto_de_venta, a.facturacion_desde
         order by h.nombre`,
      );
      console.log('Talleres con la facturación conectada o con un certificado de producción:');
      if (rows.length === 0) console.log('  (ninguno)');
      for (const fila of rows) {
        const conexion =
          fila.ambiente === null
            ? 'sin conectar'
            : `${fila.ambiente === 'homologacion' ? 'en prueba (homologación)' : 'en producción'} · punto de venta ${conCeros(fila.punto_de_venta)} · CUIT ${cuitTapado(fila.cuit)} · desde el ${fila.desde ?? '—'}`;
        console.log(`  ${fila.nombre} (${fila.email ?? 'sin titular'}) — ${conexion}`);
        if (fila.activo_vence !== null || fila.pendiente !== null) {
          console.log(
            `    certificado activo: ${fila.activo_vence === null ? 'ninguno' : `vence el ${fila.activo_vence}`}; pendiente: ${fila.pendiente ?? 'ninguno'}`,
          );
        }
        console.log(
          `    pedidas ${String(fila.pedidas)} · emitiendo ${String(fila.emitiendo)} · a revisar ${String(fila.a_revisar)} · rechazadas ${String(fila.rechazadas)}`,
        );
        if (fila.errores !== null) console.log(`    último error: ${fila.errores}`);
      }
      return;
    }

    await cliente.query('begin');
    enTransaccion = true;

    if (pedido.tarea === 'vault') {
      const url = process.env.FACTURAR_URL;
      const secreto = process.env.FACTURAR_SECRETO;
      if (!url || !secreto) {
        throw new Error(
          'Faltan FACTURAR_URL y FACTURAR_SECRETO en el entorno: se leen de ahí, nunca de un argumento.',
        );
      }
      const secretos = [
        ['facturar_url', url, 'La URL de la función de borde facturar (ADR 0085).'],
        ['facturar_secreto', secreto, 'El secreto del disparo de la función facturar (ADR 0085).'],
      ] as const;
      for (const [nombre, valor, descripcion] of secretos) {
        const { rows } = await cliente.query<{ id: string }>(
          'select id from vault.secrets where name = $1',
          [nombre],
        );
        const existente = rows[0];
        if (existente === undefined) {
          await cliente.query('select vault.create_secret($1, $2, $3)', [
            valor,
            nombre,
            descripcion,
          ]);
        } else {
          await cliente.query('select vault.update_secret($1, $2)', [existente.id, valor]);
        }
      }
      console.log('Vault: facturar_url y facturar_secreto cargados.');
    } else if (pedido.tarea === 'conectar') {
      const taller = await tallerDelMail(cliente, pedido.email);
      console.log(`Taller: ${taller.nombre}`);
      await cliente.query(
        `select private.conectar_la_facturacion($1, 'homologacion', $2, $3, $4::date)`,
        [taller.household_id, CUIT_DE_PRUEBA, pedido.puntoDeVenta, pedido.desde],
      );
      console.log(
        `Conectado en prueba (homologación) con el CUIT inventado ${CUIT_DE_PRUEBA}, el punto de venta ${conCeros(pedido.puntoDeVenta)} y desde el ${pedido.desde}.`,
      );
    } else if (pedido.tarea === 'desconectar') {
      const taller = await tallerDelMail(cliente, pedido.email);
      console.log(`Taller: ${taller.nombre}`);
      await cliente.query('select private.desconectar_la_facturacion($1, $2)', [
        taller.household_id,
        pedido.forzar,
      ]);
      console.log(
        'Desconectado. Los comprobantes y el certificado del taller quedan como estaban.',
      );
    } else {
      const { rows } = await cliente.query<{ estado: string }>(
        'select (private.resolver_el_comprobante($1, $2::jsonb)).estado as estado',
        [pedido.id, JSON.stringify(pedido.resolucion)],
      );
      console.log(`El comprobante quedó ${rows[0]?.estado ?? '?'}, y lo hecho quedó anotado.`);
    }

    await cliente.query('commit');
    enTransaccion = false;
  } catch (error) {
    if (enTransaccion) await cliente.query('rollback');
    throw error;
  } finally {
    await cliente.end();
  }
}

try {
  await hacer(
    leerElPedido(process.argv.slice(2), { emailDeLosE2e: emailDeLosE2e(), hoy: hoyEnElTaller() }),
  );
} catch (error) {
  const hint = (error as { hint?: unknown }).hint;
  console.error(
    `${error instanceof Error ? error.message : String(error)}${typeof hint === 'string' && hint !== '' ? ` (${hint})` : ''}`,
  );
  process.exitCode = 1;
}
