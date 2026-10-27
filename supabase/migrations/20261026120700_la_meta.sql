-- La meta (los tipos de tesoro de Eliseo): un tesoro con objetivo junta hasta llegar, y suma una fecha
-- estimada opcional. Cocos pasa a ser un tesoro más, con su meta en tesoros como los del dueño: hasta
-- que el dueño la edite, se sigue leyendo la de ajustes (liquidar y guardar_la_fila ya leen las dos),
-- así una fila que reparte hasta la meta de Cocos da lo mismo que antes. El check cambia con el rito
-- del ADR 0078; ninguna fila se toca.

alter table public.tesoros
  add column meta_fecha date,
  add constraint tesoros_meta_fecha_con_meta check (meta_fecha is null or coalesce(meta_centavos, 0) > 0);

comment on column public.tesoros.meta_fecha is 'Para cuándo quiere llegar a la meta, opcional: el «para marzo de 2027» de la pantalla. Solo con una meta mayor que cero (los tipos de tesoro).';

grant insert (meta_fecha), update (meta_fecha) on public.tesoros to authenticated;

alter table public.tesoros
  add constraint tesoros_meta_de_los_propios_y_de_cocos
    check (clave is null or rinde_anual_bp is null and (meta_centavos is null or clave = 'cocos'::public.tesoro))
    not valid;

alter table public.tesoros validate constraint tesoros_meta_de_los_propios_y_de_cocos;

alter table public.tesoros drop constraint tesoros_meta_solo_de_los_propios;

alter table public.tesoros rename constraint tesoros_meta_de_los_propios_y_de_cocos to tesoros_meta_solo_de_los_propios;

comment on column public.tesoros.meta_centavos is 'La meta de un tesoro, o null: la de los del dueño y, desde los tipos de tesoro, también la de Cocos. Mientras la de Cocos esté en null vale la de ajustes.meta_cocos_centavos, donde estaba antes. Hogar, Maun y el diezmo no tienen meta.';
comment on column public.tesoros.rinde_anual_bp is 'El rinde anual estimado de un tesoro del dueño, en puntos básicos, o null. Los de siempre no tienen: el rinde de Cocos dejó de calcularse (los tipos de tesoro).';
