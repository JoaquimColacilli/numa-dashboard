-- Cocos deja de ser especial (los tipos de tesoro de Eliseo): ya no se calcula su rinde, un taller nuevo
-- no nace con él, y el que lo tiene lo puede archivar como cualquier tesoro, por el camino de siempre
-- (la plata, si tiene, va a otro tesoro y sale de la fila). Ningún dato se toca: lo archiva el dueño
-- desde la app. Las columnas de su meta y su rinde en ajustes quedan, sin uso salvo la meta mientras
-- Cocos no tenga la suya.

CREATE OR REPLACE FUNCTION private.sembrar_los_tesoros(p_household_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Los nombres, las descripciones, las tintas y los íconos son los de shared/lib/tesoros.ts de la
  -- app. Un taller nuevo nace con tres: Cocos ya no (los tipos de tesoro); el de un taller de antes lo
  -- siembra private.sembrar_cocos.
  insert into public.tesoros (id, household_id, clave, nombre, descripcion, tinta, icono, orden)
  select private.uuidv7(), p_household_id, t.clave, t.nombre, t.descripcion, t.clave::text, t.icono, t.orden
  from (
    values
      ('hogar'::public.tesoro, 'Hogar', 'La plata de la familia', 'house', 0),
      ('maun'::public.tesoro, 'Maun', 'La caja del taller', 'hammer', 1),
      ('diezmo'::public.tesoro, 'Diezmo', 'Lo apartado de cada ganancia', 'church', 2)
  ) as t (clave, nombre, descripcion, icono, orden)
  where not exists (
    select 1 from public.tesoros e
    where e.household_id = p_household_id and e.clave = t.clave
  );
end;
$function$;

comment on function private.sembrar_los_tesoros(uuid) is 'Siembra los tres tesoros de siempre de un taller (Hogar, Maun y el diezmo), si no están. Idempotente. La llaman private.crear_household, en la transacción del alta, y seed.sql. Un taller nuevo ya no nace con Cocos (los tipos de tesoro).';

create function private.sembrar_cocos(p_household_id uuid)
returns void
language sql
set search_path = ''
as $$
  insert into public.tesoros (id, household_id, clave, nombre, descripcion, tinta, icono, orden)
  select private.uuidv7(), p_household_id, 'cocos', 'Cocos', 'Ahorro para la casa propia', 'cocos', 'piggy-bank', 3
  where not exists (
    select 1 from public.tesoros e where e.household_id = p_household_id and e.clave = 'cocos'
  )
$$;

revoke all on function private.sembrar_cocos(uuid) from public, anon, authenticated;

comment on function private.sembrar_cocos(uuid) is 'Siembra Cocos en un taller, como nacían los talleres antes de los tipos de tesoro, si no lo tiene. Idempotente. No la llama el alta: la usan seed.sql y los tests que arman un taller de antes.';

alter table public.tesoros
  add constraint tesoros_los_de_siempre_menos_cocos_no_se_archivan
    check (archivado_at is null or clave is null or clave = 'cocos'::public.tesoro)
    not valid;

alter table public.tesoros validate constraint tesoros_los_de_siempre_menos_cocos_no_se_archivan;

alter table public.tesoros drop constraint tesoros_los_de_siempre_no_se_archivan;

alter table public.tesoros rename constraint tesoros_los_de_siempre_menos_cocos_no_se_archivan to tesoros_los_de_siempre_no_se_archivan;

comment on column public.tesoros.archivado_at is 'Cuándo se archivó, o null. Un tesoro archivado no entra en la fila, no se elige para mover plata y sigue en los repartos que ya hizo. Hogar, Maun y el diezmo no se archivan; Cocos sí, como cualquier tesoro (los tipos de tesoro).';

comment on column public.ajustes.meta_cocos_centavos is 'La meta de Cocos de antes de los tipos de tesoro. Sin uso salvo esto: mientras tesoros.meta_centavos de Cocos esté en null, liquidar y guardar_la_fila leen esta (una fila que reparte hasta la meta de Cocos da lo mismo que antes). La app ya no la escribe.';
comment on column public.ajustes.tasa_cocos_anual_bp is 'El rinde de Cocos de antes de los tipos de tesoro. Sin uso: el rinde dejó de calcularse. No se borra.';
