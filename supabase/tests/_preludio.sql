-- Preludio de la suite: el runner (packages/db) lo ejecuta antes de cada archivo de test, dentro
-- de la misma transacción. Todo lo que crea (pgTAP, el schema tests, los usuarios de prueba)
-- desaparece con el rollback que cierra cada archivo. Los archivos que empiezan con _ no son tests.

create extension if not exists pgtap with schema extensions;

create schema tests;
grant usage on schema tests to anon, authenticated;

-- La base rechaza un pago o un cobro con una fecha que todavía no llegó, y los tests usan fechas
-- fijas que el calendario va a pasar tarde o temprano. Para la suite, hoy es un día lejano; el test
-- que prueba el rechazo fija el suyo (29_la_fecha_del_cobro.sql).
select set_config('maun.hoy_en_el_taller', '2099-12-31', true);

-- Un usuario de Auth mínimo. Solo existe dentro de la transacción del test.
--
-- Nace sin confirmar, que es como nace un registro real y, sobre todo, es lo que deja que el test
-- arme el household que quiere con private.crear_household(): confirmar el mail dispara el trigger
-- que le crea el suyo (ver 12_alta_de_cuenta.sql).
create function tests.crear_usuario(p_email text, p_confirmado boolean default false)
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    v_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email, '',
    case when p_confirmado then now() end,
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now()
  );
  return v_id;
end;
$$;

create function tests.confirmar_mail(p_user_id uuid)
returns void
language sql
as $$
  update auth.users set email_confirmed_at = now() where id = p_user_id
$$;

-- Lo mismo que hace PostgREST con un JWT válido: rol authenticated y los claims en el setting.
create function tests.entrar_como(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

create function tests.entrar_como_anon()
returns void
language plpgsql
as $$
begin
  perform set_config('request.jwt.claims', '{"role": "anon"}', true);
  perform set_config('role', 'anon', true);
end;
$$;

-- Vuelve al rol de la conexión (el dueño de la base), para sembrar datos salteando RLS y grants.
create function tests.salir()
returns void
language plpgsql
as $$
begin
  perform set_config('role', 'none', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

create function tests.id(p_clave text)
returns uuid
language sql
stable
as $$
  select current_setting('tests.' || p_clave)::uuid
$$;

create function tests.guardar(p_clave text, p_id uuid)
returns uuid
language sql
as $$
  select set_config('tests.' || p_clave, p_id::text, true)::uuid
$$;

-- El plan de una consulta como texto, corrido con el rol y los claims del momento: la RLS entra.
create function tests.plan_de(p_sql text)
returns text
language plpgsql
as $$
declare
  v_linea text;
  v_plan text := '';
begin
  for v_linea in execute 'explain ' || p_sql loop
    v_plan := v_plan || v_linea || E'\n';
  end loop;
  return v_plan;
end;
$$;

-- El hint de un rechazo: la guarda le dice al usuario cómo seguir, y eso también se prueba.
create function tests.hint_de(p_sql text)
returns text
language plpgsql
as $$
declare
  v_hint text;
begin
  execute p_sql;
  return null;
exception
  when others then
    get stacked diagnostics v_hint = pg_exception_hint;
    return v_hint;
end;
$$;

-- El presupuesto (ADR 0080): un borrador que se puede guardar, el documento que arma la app para
-- mandarlo, con los importes vivos del trabajo como los ve en su réplica, y los dos pasos con la
-- revisión del borrador que hay ahora. Son plpgsql para que el preludio no dependa de las tablas al
-- crearse, y corren con el rol del momento: con la sesión del dueño, la RLS entra.
create function tests.borrador_del_presupuesto(p_titulo text default 'Placard')
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'forma', 1,
    'titulo', p_titulo,
    'obra', '',
    'descripcion', '',
    'muebles', jsonb_build_array(jsonb_build_object(
      'id', 'm1', 'nombre', 'Placard', 'descripcion', 'Placard de tres puertas corredizas en melamina blanca.'
    )),
    'herrajes', jsonb_build_object('mostrar', true, 'lista', jsonb_build_array()),
    'aTenerEnCuenta', jsonb_build_object('tildadas', jsonb_build_array(), 'propias', jsonb_build_array()),
    'incluye', jsonb_build_object('tildadas', jsonb_build_array('incluye-visita'), 'propias', jsonb_build_array()),
    'formaDePago', jsonb_build_object('plantillaId', 'sena-y-entrega', 'texto', null),
    'plazoDeFabricacion', 30,
    'validezDias', 15,
    'avisos', jsonb_build_object('tildadas', jsonb_build_array(), 'propias', jsonb_build_array()),
    'condiciones', jsonb_build_object('tildadas', jsonb_build_array(), 'propias', jsonb_build_array())
  )
$$;

create function tests.documento_del_presupuesto(p_proyecto_id uuid, p_obra text default '')
returns jsonb
language plpgsql
as $$
declare
  v_valores jsonb;
  v_sena integer;
  v_titulo text;
  v_abonado bigint;
begin
  select case
      when count(*) > 0 then jsonb_build_object(
        'tipo', 'opciones',
        'opciones', jsonb_agg(
          jsonb_build_object(
            'id', o.id, 'letra', chr(64 + o.n::integer), 'descripcion', o.descripcion, 'total', o.monto_centavos
          )
          order by o.id
        )
      )
    end
  into v_valores
  from (
    select x.id, x.descripcion, x.monto_centavos, row_number() over (order by x.id) as n
    from public.opciones_de_presupuesto x
    where x.proyecto_id = p_proyecto_id and x.deleted_at is null
  ) as o;

  select
    coalesce(
      v_valores,
      case when p.presupuesto_centavos is null then 'null'::jsonb
        else jsonb_build_object('tipo', 'total', 'total', p.presupuesto_centavos) end
    ),
    coalesce(p.sena_bp, a.sena_bp),
    p.titulo
  into v_valores, v_sena, v_titulo
  from public.proyectos p
  join public.ajustes a on a.household_id = p.household_id
  where p.id = p_proyecto_id;

  select coalesce(sum(g.monto_centavos), 0) into v_abonado
  from public.pagos g
  where g.proyecto_id = p_proyecto_id and g.deleted_at is null;

  return jsonb_build_object(
    'forma', 1,
    'taller', jsonb_build_object(
      'nombre', 'Taller de prueba', 'titular', 'Julián Ferro', 'cuit', '20-12345678-6',
      'condicionFiscal', 'monotributo', 'domicilio', 'Pasaje Los Robles 450, CABA',
      'telefono', '11 5555-0199', 'email', 'taller@ejemplo.com'
    ),
    'cliente', 'Paula Benítez',
    'titulo', v_titulo,
    'obra', p_obra,
    'descripcion', '',
    'muebles', jsonb_build_array(jsonb_build_object(
      'nombre', 'Placard', 'descripcion', 'Placard de tres puertas corredizas en melamina blanca.'
    )),
    'herrajes', jsonb_build_array(),
    'aTenerEnCuenta', jsonb_build_array(),
    'incluye', jsonb_build_array('Visita a domicilio para medición y definición de detalles.'),
    'valores', v_valores,
    'senaBp', v_sena,
    'abonado', v_abonado,
    'formaDePago', 'Seña del 50% para confirmar el trabajo y el saldo contra entrega.',
    'plazoDeFabricacion', 30,
    'validezDias', 15,
    'avisos', jsonb_build_array(),
    'condiciones', jsonb_build_array(),
    'garantia', 'Garantía de 6 meses desde la entrega e instalación.',
    'garantiaMeses', 6
  );
end;
$$;

create function tests.guardar_el_borrador(p_id uuid, p_proyecto_id uuid, p_borrador jsonb default null)
returns jsonb
language plpgsql
as $$
declare
  v_version integer;
  v_fila jsonb;
begin
  select b.borrador_version into v_version
  from public.presupuestos b
  where b.id = p_id and b.deleted_at is null;

  select to_jsonb(g) into v_fila
  from public.guardar_el_presupuesto(
    p_id, p_proyecto_id, coalesce(v_version, 0), coalesce(p_borrador, tests.borrador_del_presupuesto())
  ) as g;

  return v_fila;
end;
$$;

create function tests.mandar_el_presupuesto(
  p_presupuesto_id uuid,
  p_revision_id uuid,
  p_mandado_el date,
  p_que_cambio text default null,
  p_vale_hasta date default null,
  p_obra text default ''
)
returns jsonb
language plpgsql
as $$
declare
  v_version integer;
  v_proyecto uuid;
begin
  select b.borrador_version, b.proyecto_id into v_version, v_proyecto
  from public.presupuestos b
  where b.id = p_presupuesto_id;

  return public.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id, v_version, tests.documento_del_presupuesto(v_proyecto, p_obra),
    p_que_cambio, p_mandado_el, p_vale_hasta
  );
end;
$$;

-- Los tests cambian de rol: que los helpers anden aunque el proyecto haya tocado el execute por
-- defecto de public.
grant execute on all functions in schema tests to anon, authenticated;
