import { expect, it } from 'vitest';

import { enTransaccionConRollback } from '../scripts/pgtap.ts';
import { TABLAS_REPLICADAS } from '../src/replica.ts';

interface Claves {
  bootstrap: string[];
  delta: string[];
}

it('bootstrap() y delta() devuelven las tablas de TABLAS_REPLICADAS y el cursor, ni una más ni una menos', async () => {
  const claves = await enTransaccionConRollback(async (cliente): Promise<Claves | undefined> => {
    const { rows: usuario } = await cliente.query<{ id: string }>(
      `insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
       values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
               'claves-de-la-replica@maun.test', '', now(), now())
       returning id`,
    );
    const usuarioId = usuario[0]?.id ?? '';
    await cliente.query('select private.crear_household($1, $2)', ['Claves', usuarioId]);
    await cliente.query(
      "select set_config('request.jwt.claims', $1, true), set_config('role', 'authenticated', true)",
      [JSON.stringify({ sub: usuarioId, role: 'authenticated' })],
    );
    const { rows } = await cliente.query<Claves>(
      `select array(select jsonb_object_keys(public.bootstrap())) as bootstrap,
              array(select jsonb_object_keys(public.delta(now()))) as delta`,
    );
    return rows[0];
  });

  const esperadas = [...TABLAS_REPLICADAS, 'cursor'].sort();
  expect([...(claves?.bootstrap ?? [])].sort()).toEqual(esperadas);
  expect([...(claves?.delta ?? [])].sort()).toEqual(esperadas);
});
