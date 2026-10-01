-- Esquema vivo de la base, leído del catálogo de Postgres. Es la vista del estado final que
-- se perdió al dejar el esquema declarativo (ADR 0008): no se aplica ni se edita a mano.
-- Se regenera con `pnpm --filter @maun/db db:esquema` después de cada `supabase db push`.
-- El test esquema.test.ts de @maun/db falla si este archivo no coincide con la base.
-- Quedan afuera las funciones de event triggers de la plataforma (public.rls_auto_enable).

-- Schemas ----------------------------------------------------------------------------------------

-- schema private: authenticated:USAGE, service_role:USAGE
comment on schema private is 'Helpers de RLS, triggers y funciones internas. La Data API no expone este schema: nada de acá se llama por RPC.';
-- schema public: anon:USAGE, authenticated:USAGE, public:USAGE, service_role:USAGE
comment on schema public is 'standard public schema';

-- Enums ------------------------------------------------------------------------------------------

create type public.categoria_anotacion as enum ('materiales', 'taller');
comment on type public.categoria_anotacion is 'Qué clase de cosa anotó el dueño: materiales (comprar, encargar, retirar) o taller (trabajo, mandados, cobros). Entrega, visita y presupuesto no están: son categorías de lo que se calcula, y eso no se guarda.';

create type public.comprobante as enum ('factura_a', 'factura_b', 'factura_c', 'remito', 'sin_comprobante');
comment on type public.comprobante is 'Comprobante a emitir al cliente.';

create type public.condicion_fiscal as enum ('consumidor_final', 'monotributo', 'responsable_inscripto', 'exento');
comment on type public.condicion_fiscal is 'Condición frente al IVA del cliente.';

create type public.escala_de_pregunta as enum ('conformidad', 'tiempos', 'trato');
comment on type public.escala_de_pregunta is 'Qué palabras lleva cada una de las cinco caritas de una pregunta de escala: conformidad (de «Nada conforme» a «Muy conforme»), tiempos (de «Llegó muy tarde» a «Llegó antes de lo pautado») o trato (de «Costaba mucho» a «Muy fácil»). Las palabras viven en @maun/domain; acá se guarda cuál juego lleva la pregunta.';

create type public.estado_proyecto as enum ('contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado', 'en_seguimiento', 'perdido', 'en_curso', 'entregado', 'cobrado');
comment on type public.estado_proyecto is 'Lead y proyecto son el mismo registro. Los primeros cinco estados son las consultas (contacto, presupuesto estimativo, relevamiento, a presupuestar y presupuesto enviado); en seguimiento es el «por ahora no», con un próximo contacto pendiente; perdido cierra la consulta, y los últimos tres son de obra. Las transiciones válidas viven en @maun/domain.';

create type public.forma_de_cobro as enum ('transferencia', 'efectivo');
comment on type public.forma_de_cobro is 'Cómo le paga el cliente al taller una instancia de pago concreta. Transferencia es el cliente entrando a su banco o a su billetera y mandando plata al alias del taller: la arranca él y no tiene costo. Efectivo es en mano. No hay una tercera: cobrar con un link de pago o con un QR de cobro de Mercado Pago le cuesta comisión al taller y este PR no los usa (ADR 0051 y 0053).';

create type public.forma_de_coordinar as enum ('un_dia', 'sus_dias');
comment on type public.forma_de_coordinar is 'Cómo le pide el taller el día de la entrega al cliente: proponiéndole un día (un_dia), que el cliente acepta con un botón, o pidiéndole que marque los días y las franjas que le quedan bien (sus_dias).';

create type public.forma_pago as enum ('efectivo', 'transferencia', 'cuotas', 'mixto');
comment on type public.forma_pago is 'Forma de pago acordada con el cliente para el proyecto.';

create type public.franja_de_entrega as enum ('manana', 'tarde');
comment on type public.franja_de_entrega is 'La franja de una entrega: a la mañana o a la tarde. Así coordinan las entregas las mueblerías de acá; lo que haga falta afinar va en la nota del cliente (ADR 0071).';

create type public.origen_contacto as enum ('referido', 'redes', 'volvio', 'cartel', 'otro');
comment on type public.origen_contacto is 'Cómo llegó el cliente al taller. El detalle libre va en clientes.origen_detalle.';

create type public.origen_de_la_fecha as enum ('taller', 'cliente', 'importada');
comment on type public.origen_de_la_fecha is 'Quién fijó una fecha de la historia: el taller, el cliente desde su página (aceptando el día propuesto), o importada, que es la que ya estaba cargada el día que empezó a guardarse la historia.';

create type public.respuesta_de_entrega as enum ('me_queda_bien', 'mis_dias');
comment on type public.respuesta_de_entrega is 'Lo que contestó el cliente a una propuesta de entrega: que el día propuesto le queda bien, o los días y franjas que le quedan bien a él.';

create type public.rol_household as enum ('titular', 'miembro');
comment on type public.rol_household is 'Rol de un usuario dentro de su household.';

create type public.tesoro as enum ('hogar', 'maun', 'diezmo', 'cocos');
comment on type public.tesoro is 'Las cuatro cajas: hogar (la familia), maun (el taller), diezmo (lo apartado para el diezmo) y cocos (el ahorro invertido).';

create type public.tipo_de_fecha as enum ('estimada', 'comprometida');
comment on type public.tipo_de_fecha is 'Qué fecha cambió en la historia de un trabajo: la estimada, que calcula el taller, o la comprometida, que se acordó con el cliente. La real no está: es fecha_entrega y se anota una vez.';

create type public.tipo_de_necesidad as enum ('herraje', 'herramienta', 'material');
comment on type public.tipo_de_necesidad is 'Qué es lo que hace falta: un material (placas de melamina, un tablón para la mesada, pintura, laca, un caño estructural), un herraje (bisagras, pistones, tiradores, tarugos) o una herramienta (sierra circular, lijadora de banda, multitool). El dueño las nombró como listas distintas, pero todas son «lo que necesito para este trabajo» y se repiten entre trabajos: una sola tabla con el tipo adentro (ADR 0045 y 0060). El orden en que se muestran vive en @maun/domain, no en el orden del enum.';

create type public.tipo_de_pregunta as enum ('escala5', 'sitalvezno', 'una', 'varias', 'texto');
comment on type public.tipo_de_pregunta is 'Cómo se contesta una pregunta, y no hay otra forma: escala de cinco caritas, sí / tal vez / no, una opción entre varias, varias opciones, o texto libre. Son los tipos del diseño y ninguno más (ADR 0057).';

create type public.tipo_movimiento as enum ('ingreso', 'gasto', 'transferencia', 'pago_diezmo', 'aporte_cocos', 'ajuste');
comment on type public.tipo_movimiento is 'Tipo de un movimiento cargado a mano. Cada tipo fija qué lados (desde_id, hacia_id) lleva: ver el check movimientos_forma_segun_tipo. Una transferencia va entre dos tesoros cualesquiera, también los del dueño; el pago del diezmo sale del diezmo y el aporte va a Cocos (ADR 0018 y 0078).';


-- Tablas -----------------------------------------------------------------------------------------

create table public.ajustes (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  sueldo_mensual_centavos bigint not null default 0,
  costos_fijos_centavos bigint not null default 0,
  meta_cocos_centavos bigint not null default 0,
  tasa_cocos_anual_bp integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  sueldo_tope_mensual boolean not null default true,
  perdido_con_sueldo boolean not null default false,
  perdido_con_diezmo boolean not null default true,
  sena_bp integer not null default 5000,
  cobro_alias text not null default ''::text,
  cobro_cbu text not null default ''::text,
  cobro_titular text not null default ''::text,
  cobro_cuit text not null default ''::text,
  cobro_link text not null default ''::text,
  resena_link text not null default ''::text,
  presupuesto_vale_dias integer not null default 15,
  instagram_link text not null default ''::text,
  facebook_link text not null default ''::text,
  tiktok_link text not null default ''::text,
  fila jsonb,
  fila_version integer not null default 0,
  fila_guardada_at timestamp with time zone,
  relevamiento_centavos bigint default 12000000,
  taller_titular text not null default ''::text,
  taller_cuit text not null default ''::text,
  taller_condicion_fiscal text,
  taller_domicilio text not null default ''::text,
  taller_telefono text not null default ''::text,
  taller_email text not null default ''::text,
  plantilla_del_presupuesto jsonb,
  plantilla_del_presupuesto_version integer not null default 0,
  constraint ajustes_cobro_alias_formato CHECK (cobro_alias = ''::text OR cobro_alias ~ '^[A-Za-z0-9.-]{6,20}$'::text),
  constraint ajustes_cobro_cbu_formato CHECK (cobro_cbu = ''::text OR cobro_cbu ~ '^[0-9]{22}$'::text),
  constraint ajustes_cobro_cuit_formato CHECK (cobro_cuit = ''::text OR cobro_cuit ~ '^[0-9]{2}-[0-9]{8}-[0-9]$'::text),
  constraint ajustes_cobro_link_formato CHECK (cobro_link = ''::text OR char_length(cobro_link) <= 300 AND cobro_link ~ '^https://(www\.mercadopago\.com\.ar|mercadopago\.com\.ar|link\.mercadopago\.com\.ar|mpago\.la|mpago\.li)/[^[:space:]]*$'::text),
  constraint ajustes_cobro_titular_largo CHECK (char_length(cobro_titular) <= 200),
  constraint ajustes_facebook_link_formato CHECK (facebook_link = ''::text OR facebook_link ~ '^https://www\.facebook\.com/profile\.php\?id=[0-9]{5,20}$'::text OR facebook_link ~ '^https://www\.facebook\.com/[a-z0-9.]{5,50}$'::text AND (split_part(facebook_link, '/'::text, 4) <> ALL (ARRAY['share'::text, 'sharer.php'::text, 'people'::text, 'story.php'::text, 'photo.php'::text, 'permalink.php'::text, 'groups'::text, 'events'::text, 'watch'::text, 'marketplace'::text, 'login'::text, 'profile.php'::text]))),
  constraint ajustes_fila_es_un_objeto CHECK (fila IS NULL OR jsonb_typeof(fila) = 'object'::text),
  constraint ajustes_fila_version_valida CHECK (fila_version >= 0),
  constraint ajustes_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint ajustes_household_key UNIQUE (household_id),
  constraint ajustes_importes_no_negativos CHECK (sueldo_mensual_centavos >= 0 AND costos_fijos_centavos >= 0 AND meta_cocos_centavos >= 0),
  constraint ajustes_instagram_link_formato CHECK (instagram_link = ''::text OR instagram_link ~ '^https://www\.instagram\.com/[a-z0-9._]{1,30}/$'::text AND (split_part(instagram_link, '/'::text, 4) <> ALL (ARRAY['p'::text, 'reel'::text, 'reels'::text, 'stories'::text, 'explore'::text, 'accounts'::text, 'direct'::text, 'tv'::text]))),
  constraint ajustes_pkey PRIMARY KEY (id),
  constraint ajustes_plantilla_del_presupuesto_es_un_objeto CHECK (plantilla_del_presupuesto IS NULL OR jsonb_typeof(plantilla_del_presupuesto) = 'object'::text),
  constraint ajustes_plantilla_del_presupuesto_version_valida CHECK (plantilla_del_presupuesto_version >= 0),
  constraint ajustes_presupuesto_vale_dias_valido CHECK (presupuesto_vale_dias >= 1 AND presupuesto_vale_dias <= 365),
  constraint ajustes_relevamiento_valido CHECK (relevamiento_centavos IS NULL OR relevamiento_centavos > 0),
  constraint ajustes_resena_link_formato CHECK (resena_link = ''::text OR char_length(resena_link) <= 300 AND resena_link ~ '^https://(g\.page|search\.google\.com|maps\.google\.com|www\.google\.com|google\.com|maps\.app\.goo\.gl|g\.co)/[^[:space:]]*$'::text),
  constraint ajustes_sena_valida CHECK (sena_bp >= 0 AND sena_bp <= 10000),
  constraint ajustes_taller_condicion_fiscal_valida CHECK (taller_condicion_fiscal IS NULL OR (taller_condicion_fiscal = ANY (ARRAY['monotributo'::text, 'responsable_inscripto'::text, 'exento'::text]))),
  constraint ajustes_taller_cuit_formato CHECK (taller_cuit = ''::text OR taller_cuit ~ '^[0-9]{2}-[0-9]{8}-[0-9]$'::text),
  constraint ajustes_taller_domicilio_largo CHECK (char_length(taller_domicilio) <= 300),
  constraint ajustes_taller_email_largo CHECK (char_length(taller_email) <= 200),
  constraint ajustes_taller_telefono_largo CHECK (char_length(taller_telefono) <= 40),
  constraint ajustes_taller_titular_largo CHECK (char_length(taller_titular) <= 120),
  constraint ajustes_tasa_valida CHECK (tasa_cocos_anual_bp >= 0 AND tasa_cocos_anual_bp <= 100000),
  constraint ajustes_tiktok_link_formato CHECK (tiktok_link = ''::text OR tiktok_link ~ '^https://www\.tiktok\.com/@[a-z0-9._]{2,24}$'::text)
);
comment on table public.ajustes is 'Parámetros del household: una fila por household, creada con él. Cambiarlos no reescribe las distribuciones ya congeladas.';
comment on column public.ajustes.sueldo_mensual_centavos is 'Sueldo que el taller le paga al hogar por mes: objetivo del escalón de sueldo. Con sueldo_tope_mensual, los cobros del mes lo van cubriendo y lo que sobra queda en el taller.';
comment on column public.ajustes.costos_fijos_centavos is 'Costos fijos mensuales del taller: objetivo del escalón de fijos, que se topea por lo que falta del mes.';
comment on column public.ajustes.meta_cocos_centavos is 'Meta de ahorro en Cocos.';
comment on column public.ajustes.tasa_cocos_anual_bp is 'Tasa anual estimada de Cocos, en puntos básicos (4000 = 40%). Solo para proyectar.';
comment on column public.ajustes.sueldo_tope_mensual is 'true (desde el ADR 0072, y el default): el sueldo se topea por lo que falta del mes, como los fijos. false: cada cobro paga hasta un sueldo entero, la regla del ADR 0011; la conservan el seed y lo ya congelado. El cliente no tiene grant para cambiarlo.';
comment on column public.ajustes.perdido_con_sueldo is 'Si cerrar un perdido con seña retenida paga sueldo. Por defecto no: un lead que no prosperó no es un trabajo. Se aplica como objetivo de sueldo en cero para esa liquidación, no con otra cascada.';
comment on column public.ajustes.perdido_con_diezmo is 'Si la seña retenida de un perdido paga diezmo. Por defecto sí: es ingreso reconocido.';
comment on column public.ajustes.sena_bp is 'La seña que se pide para confirmar un trabajo, en puntos básicos del presupuesto (5000 = 50%, que es lo habitual). Se puede pisar por trabajo en proyectos.sena_bp.';
comment on column public.ajustes.cobro_alias is 'El alias del taller para recibir transferencias, o vacío. El check es el del BCRA: 6 a 20 caracteres, letras, números, punto y guion medio (t.o. SNP, Com. "A" 8114). Los dígitos verificadores no aplican a un alias, y la unicidad la resuelve la cámara, no esta base (ADR 0048).';
comment on column public.ajustes.cobro_cbu is 'El CBU o el CVU del taller, 22 dígitos sin espacios ni guiones, o vacío. Se guarda limpio y se muestra agrupado. El check controla la forma; los dos dígitos verificadores los revisa el dominio, que es donde el dueño ve el aviso antes de guardar (ADR 0048).';
comment on column public.ajustes.cobro_titular is 'A nombre de quién está la cuenta, o vacío. Está para que el cliente confirme contra lo que le muestra su banco antes de transferir.';
comment on column public.ajustes.cobro_cuit is 'El CUIT del titular con guiones (NN-NNNNNNNN-N), o vacío. Mismo formato que public.clientes.cuit; el dígito verificador lo revisa la app.';
comment on column public.ajustes.cobro_link is 'El link de Mercado Pago del taller para que el cliente le pague, o vacío. Lo pega el dueño: lo saca de su app, de Cobrar con QR o de Link de pago. La página del cliente lo muestra como código QR y como botón. No se deriva del alias ni del CVU porque no existe ningún link estándar que abra una billetera en «Transferir a este alias»: el QR interoperable del BCRA lo emite un PSP y es un QR de cobro. El check acota el host a Mercado Pago porque este texto se vuelve un enlace en una página pública. Cobrar por acá le cuesta comisión al taller; transferir al alias no (ADR 0051 y 0054).';
comment on column public.ajustes.resena_link is 'El enlace del taller para dejarle una reseña en Google, o vacío. Lo pega el dueño, lo saca de su Perfil de Negocio. La encuesta se lo ofrece al final a todos los que contestan, contesten lo que contesten: filtrar a quién se le pide según lo que opinó está prohibido por las políticas de Google (ADR 0057). El check acota el host a Google porque este texto se vuelve un enlace en una página pública.';
comment on column public.ajustes.presupuesto_vale_dias is 'Cuántos días vale un presupuesto desde que se manda: la app los suma al día en que el dueño marca «Mandé el presupuesto» y guarda la fecha en proyectos.presupuesto_vale_hasta, que él puede pisar en cada trabajo. Arranca en 15. Es política del taller y no viaja al cliente: lo que viaja es la fecha (ADR 0067).';
comment on column public.ajustes.instagram_link is 'El perfil de Instagram del taller, en la forma https://www.instagram.com/<usuario>/, o vacío. Lo ve el cliente en su página, en la vidriera, como @usuario (ADR 0076).';
comment on column public.ajustes.facebook_link is 'El perfil o la página de Facebook del taller, en la forma https://www.facebook.com/<nombre> o https://www.facebook.com/profile.php?id=<número>, o vacío. Lo ve el cliente en su página, en la vidriera (ADR 0076).';
comment on column public.ajustes.tiktok_link is 'El perfil de TikTok del taller, en la forma https://www.tiktok.com/@<usuario>, o vacío. Lo ve el cliente en su página, en la vidriera (ADR 0076).';
comment on column public.ajustes.fila is 'La fila del taller: los pasos con su tope por mes, en el orden que puso el dueño, y el reparto por porcentajes de lo que sobra, con los tesoros por id. Null es la fila de siempre, que private.fila_de_siempre() arma con el sueldo y los costos fijos de esta fila y da lo mismo que la cascada de antes. La valida private.problema_de_la_fila() y la escribe solo public.guardar_la_fila(): no tiene grant de update (ADR 0078).';
comment on column public.ajustes.fila_version is 'La revisión de la fila. Suma uno cada vez que se guarda y cada vez que cambia algo que cambia el reparto (sin fila guardada, el sueldo, los costos fijos o sueldo_tope_mensual; siempre, perdido_con_sueldo y perdido_con_diezmo). Un cobro armado con otra revisión rebota con MN006. Arranca en 0.';
comment on column public.ajustes.fila_guardada_at is 'Cuándo se guardó la fila por última vez, o null si nunca se guardó. Es el «rige» del rótulo del plano.';
comment on column public.ajustes.relevamiento_centavos is 'Cuánto cobra el taller el relevamiento técnico (la visita para medir), o null si no se le muestra el precio al cliente. Arranca en 12000000 ($ 120.000). Viaja a la vista del cliente solo antes de mandar el presupuesto, y la página lo muestra mientras falta ir a medir. No es un pago ni crea uno: lo que el cliente paga por la visita es un pago del trabajo y queda a cuenta de la seña (ADR 0047 y 0079).';
comment on column public.ajustes.taller_titular is 'El nombre o la razón social a nombre de quien está el CUIT del taller, o vacío. Va en el encabezado del presupuesto (ADR 0080).';
comment on column public.ajustes.taller_cuit is 'El CUIT del taller con guiones (NN-NNNNNNNN-N), o vacío. Mismo formato que cobro_cuit; el dígito verificador lo revisa la app. Va en el encabezado del presupuesto (ADR 0080).';
comment on column public.ajustes.taller_condicion_fiscal is 'La condición del taller frente al IVA: monotributo, responsable_inscripto o exento, o null si el dueño no la cargó. El presupuesto la muestra como «Responsable Monotributo», «IVA Responsable Inscripto» o «IVA Exento» (ADR 0080).';
comment on column public.ajustes.taller_domicilio is 'El domicilio del taller, o vacío. Va en el encabezado del presupuesto (ADR 0080).';
comment on column public.ajustes.taller_telefono is 'El teléfono del taller, o vacío. Va en el presupuesto, y con él la página del cliente ofrece «Escribirle al taller» por WhatsApp (ADR 0080).';
comment on column public.ajustes.taller_email is 'El email del taller, o vacío. Va en el encabezado del presupuesto (ADR 0080).';
comment on column public.ajustes.plantilla_del_presupuesto is 'Los textos de siempre del presupuesto del taller y sus números: lo que incluye, lo que hay que tener en cuenta, las formas de pago, los avisos, las condiciones, la garantía, el plazo de fabricación, las modificaciones incluidas, lo que vale una más y los meses de garantía. Null es la de siempre, PLANTILLA_DE_SIEMPRE de @maun/domain, con los textos del dueño. La valida private.problema_de_la_plantilla() y la escribe solo public.guardar_la_plantilla_del_presupuesto(): no tiene grant de update. Cambiarla no cambia ningún presupuesto ya mandado, que lleva su foto (ADR 0080).';
comment on column public.ajustes.plantilla_del_presupuesto_version is 'La revisión de la plantilla del presupuesto. Suma uno cada vez que se guarda; un guardado armado con otra revisión rebota con MN030. Arranca en 0.';
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON ajustes FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER contar_la_revision_de_la_fila BEFORE UPDATE ON ajustes FOR EACH ROW EXECUTE FUNCTION private.contar_la_revision_de_la_fila();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON ajustes FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.ajustes enable row level security;
create policy ajustes_edicion on public.ajustes as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy ajustes_lectura on public.ajustes as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.ajustes to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.ajustes to service_role;
grant update (sueldo_mensual_centavos, costos_fijos_centavos, meta_cocos_centavos, tasa_cocos_anual_bp, perdido_con_sueldo, perdido_con_diezmo, sena_bp, cobro_alias, cobro_cbu, cobro_titular, cobro_cuit, cobro_link, resena_link, presupuesto_vale_dias, instagram_link, facebook_link, tiktok_link, relevamiento_centavos, taller_titular, taller_cuit, taller_condicion_fiscal, taller_domicilio, taller_telefono, taller_email) on public.ajustes to authenticated;

create table public.anotaciones (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  fecha date not null,
  hora time without time zone,
  texto text not null,
  categoria categoria_anotacion not null default 'taller'::categoria_anotacion,
  proyecto_id uuid,
  hecha boolean not null default false,
  importante boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint anotaciones_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint anotaciones_pkey PRIMARY KEY (id),
  constraint anotaciones_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint anotaciones_texto_valido CHECK (btrim(texto) <> ''::text AND char_length(texto) <= 500)
);
comment on table public.anotaciones is 'Lo que el dueño anota a mano en la agenda. Las visitas, las entregas y los vencimientos de presupuesto no están acá: se calculan desde el proyecto (ADR 0034).';
comment on column public.anotaciones.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.anotaciones.fecha is 'El día de la anotación. El día es la unidad de la agenda.';
comment on column public.anotaciones.hora is 'Hora opcional: «15hs retirar el pulpo». Null es «en algún momento del día».';
comment on column public.anotaciones.proyecto_id is 'Trabajo al que se refiere, si se refiere a uno. Borrar el proyecto (lógico) no borra la anotación.';
comment on column public.anotaciones.hecha is 'La tildó como hecha. Sigue en la agenda, tachada.';
comment on column public.anotaciones.importante is 'La marcó como importante: el círculo con que en el cuaderno de papel marca lo importante de la semana.';
comment on column public.anotaciones.deleted_at is 'Borrado lógico, como en todo el household: delta() lo trae para que el cliente la saque de su copia.';
CREATE INDEX anotaciones_household_actualizado ON public.anotaciones USING btree (household_id, updated_at);
CREATE INDEX anotaciones_household_proyecto ON public.anotaciones USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON anotaciones FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON anotaciones FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.anotaciones enable row level security;
create policy anotaciones_alta on public.anotaciones as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy anotaciones_edicion on public.anotaciones as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy anotaciones_lectura on public.anotaciones as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.anotaciones to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.anotaciones to service_role;
grant insert (id, fecha, hora, texto, categoria, proyecto_id, hecha, importante, deleted_at) on public.anotaciones to authenticated;
grant update (id, fecha, hora, texto, categoria, proyecto_id, hecha, importante, deleted_at) on public.anotaciones to authenticated;

create table public.archivos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  nombre text not null,
  tipo text not null,
  bytes bigint not null,
  ancho integer,
  alto integer,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  visible_para_cliente boolean not null default false,
  constraint archivos_bytes_validos CHECK (bytes > 0 AND bytes <= 20971520),
  constraint archivos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint archivos_household_id_key UNIQUE (household_id, id),
  constraint archivos_medidas_validas CHECK ((ancho IS NULL) = (alto IS NULL) AND (ancho IS NULL OR ancho > 0 AND alto > 0)),
  constraint archivos_nombre_valido CHECK (btrim(nombre) <> ''::text AND char_length(nombre) <= 200),
  constraint archivos_pkey PRIMARY KEY (id),
  constraint archivos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint archivos_tipo_valido CHECK (tipo = ANY (ARRAY['image/webp'::text, 'image/jpeg'::text, 'application/pdf'::text]))
);
comment on table public.archivos is 'Los archivos de un trabajo (contacto u obra): fotos, capturas y PDF. El binario vive en el bucket archivos, en {household}/{proyecto}/{id}.{extensión}; esta fila es lo que la réplica trae (ADR 0039).';
comment on column public.archivos.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.archivos.nombre is 'El nombre con el que se eligió el archivo, para mostrarlo. La ruta en el bucket sale del id, no del nombre.';
comment on column public.archivos.tipo is 'Lo que quedó en el bucket: image/webp o image/jpeg (la app convierte toda imagen antes de subirla) o application/pdf. La extensión de la ruta sale de acá.';
comment on column public.archivos.bytes is 'Lo que ocupa en el bucket: el archivo y, si es una imagen, su miniatura. La suma del taller es lo que se compara contra el espacio del plan.';
comment on column public.archivos.ancho is 'Ancho en píxeles de una imagen, para reservarle el lugar antes de que cargue. Null en un PDF.';
comment on column public.archivos.alto is 'Alto en píxeles de una imagen. Null en un PDF.';
comment on column public.archivos.deleted_at is 'Borrado lógico, como en todo el household. La app quita el binario del bucket cuando vence el deshacer.';
comment on column public.archivos.visible_para_cliente is 'Si este archivo se ve en la vista del cliente. Apagado por defecto, siempre: un archivo nuevo es privado hasta que el dueño decide lo contrario, nunca al revés (ADR 0046).';
CREATE INDEX archivos_household_actualizado ON public.archivos USING btree (household_id, updated_at);
CREATE INDEX archivos_household_proyecto ON public.archivos USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON archivos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON archivos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.archivos enable row level security;
create policy archivos_alta on public.archivos as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy archivos_edicion on public.archivos as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy archivos_lectura on public.archivos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.archivos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.archivos to service_role;
grant insert (id, proyecto_id, nombre, tipo, bytes, ancho, alto, deleted_at) on public.archivos to authenticated;
grant update (id, proyecto_id, nombre, tipo, bytes, ancho, alto, deleted_at, visible_para_cliente) on public.archivos to authenticated;

create table public.cambios_de_estado (
  id uuid not null default private.uuidv7(),
  household_id uuid not null,
  proyecto_id uuid not null,
  desde estado_proyecto,
  hacia estado_proyecto not null,
  ocurrio_el date not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint cambios_de_estado_cambia CHECK (desde IS DISTINCT FROM hacia),
  constraint cambios_de_estado_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint cambios_de_estado_pkey PRIMARY KEY (id),
  constraint cambios_de_estado_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.cambios_de_estado is 'Cuándo el trabajo pasó de una etapa a otra. Lo escribe un trigger sobre proyectos y nadie más: no hay grant de insert ni de update para la app. Hoy no lo muestra ninguna pantalla; se guarda desde ahora porque la línea de tiempo que el cliente va a ver necesita fechas que no se pueden reconstruir después (ADR 0046).';
comment on column public.cambios_de_estado.desde is 'La etapa de la que salió. Null en el alta del trabajo.';
comment on column public.cambios_de_estado.ocurrio_el is 'El día del cambio, en la hora del taller. El taller está en Argentina y un cambio guardado a las diez de la noche no puede quedar anotado al día siguiente.';
comment on column public.cambios_de_estado.deleted_at is 'Sin uso: el registro no se borra. La columna está porque toda tabla del household la tiene.';
CREATE INDEX cambios_de_estado_household_actualizado ON public.cambios_de_estado USING btree (household_id, updated_at);
CREATE INDEX cambios_de_estado_household_proyecto ON public.cambios_de_estado USING btree (household_id, proyecto_id, ocurrio_el);
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON cambios_de_estado FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.cambios_de_estado enable row level security;
create policy cambios_de_estado_lectura on public.cambios_de_estado as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.cambios_de_estado to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.cambios_de_estado to service_role;

create table public.cambios_de_fecha (
  id uuid not null default private.uuidv7(),
  household_id uuid not null,
  proyecto_id uuid not null,
  tipo tipo_de_fecha not null,
  fecha date,
  fecha_anterior date,
  franja franja_de_entrega,
  origen origen_de_la_fecha not null,
  decidido_el date not null,
  trabajos_en_curso integer,
  trabajos_sin_terminar integer,
  created_at timestamp with time zone not null default clock_timestamp(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint cambios_de_fecha_conteos CHECK ((trabajos_en_curso IS NULL) = (trabajos_sin_terminar IS NULL) AND (trabajos_en_curso IS NULL OR trabajos_en_curso >= 0 AND trabajos_sin_terminar >= 0 AND trabajos_sin_terminar <= trabajos_en_curso)),
  constraint cambios_de_fecha_franja_de_la_comprometida CHECK (franja IS NULL OR tipo = 'comprometida'::tipo_de_fecha AND fecha IS NOT NULL),
  constraint cambios_de_fecha_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint cambios_de_fecha_importada_sin_conteos CHECK (origen <> 'importada'::origen_de_la_fecha OR trabajos_en_curso IS NULL),
  constraint cambios_de_fecha_pkey PRIMARY KEY (id),
  constraint cambios_de_fecha_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.cambios_de_fecha is 'La historia de las fechas prometidas de cada trabajo: cada entrega estimada que se fija con el trabajo en curso y cada entrega comprometida, con quién la fijó, el día en el taller y cuántos otros trabajos había en curso ese día. La escribe un trigger sobre proyectos y nadie más: el dueño solo tiene select. La primera de cada trabajo y tipo es la línea de base contra la que el analítico mide la entrega real. Está en la réplica, al revés que cambios_de_estado: son pocas filas y el analítico la lee en el aparato (ADR 0071).';
comment on column public.cambios_de_fecha.fecha is 'La fecha que quedó, o null si se sacó.';
comment on column public.cambios_de_fecha.fecha_anterior is 'La fecha de la fila anterior del mismo trabajo y tipo, o null si es la primera.';
comment on column public.cambios_de_fecha.franja is 'La franja de la comprometida, si la tiene.';
comment on column public.cambios_de_fecha.origen is 'taller, cliente (aceptó el día que le propusieron) o importada (la que ya estaba cargada cuando empezó la historia).';
comment on column public.cambios_de_fecha.decidido_el is 'El día en el taller en que llegó a la base. Una edición que esperó en la cola sin señal queda con el día en que se sincronizó, como en cambios_de_estado.';
comment on column public.cambios_de_fecha.trabajos_en_curso is 'Cuántos otros trabajos del taller estaban en curso cuando se fijó, contados en la misma transacción. Null en las importadas. Es lo que necesita la estimación por carga del taller que el dueño imagina para más adelante: reconstruirlo después no alcanza.';
comment on column public.cambios_de_fecha.trabajos_sin_terminar is 'De esos, cuántos todavía no estaban listos. Null en las importadas.';
comment on column public.cambios_de_fecha.created_at is 'El instante en que la base anotó el cambio, con clock_timestamp(): la primera fila de cada trabajo y tipo por created_at, y después por id, es la línea de base del analítico.';
comment on column public.cambios_de_fecha.deleted_at is 'Borrado lógico. Solo lo pone el borrado del trabajo.';
CREATE INDEX cambios_de_fecha_household_actualizado ON public.cambios_de_fecha USING btree (household_id, updated_at);
CREATE INDEX cambios_de_fecha_household_proyecto ON public.cambios_de_fecha USING btree (household_id, proyecto_id, tipo, created_at);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON cambios_de_fecha FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON cambios_de_fecha FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.cambios_de_fecha enable row level security;
create policy cambios_de_fecha_lectura on public.cambios_de_fecha as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.cambios_de_fecha to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.cambios_de_fecha to service_role;

create table public.clientes (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  nombre text not null,
  zona text not null default ''::text,
  telefono text not null default ''::text,
  email text not null default ''::text,
  direccion text not null default ''::text,
  origen_contacto origen_contacto,
  origen_detalle text not null default ''::text,
  condicion_fiscal condicion_fiscal not null default 'consumidor_final'::condicion_fiscal,
  cuit text not null default ''::text,
  razon_social text not null default ''::text,
  domicilio_fiscal text not null default ''::text,
  notas text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint clientes_cuit_formato CHECK (cuit = ''::text OR cuit ~ '^[0-9]{2}-[0-9]{8}-[0-9]$'::text),
  constraint clientes_email_formato CHECK (email = ''::text OR email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'::text),
  constraint clientes_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint clientes_household_id_key UNIQUE (household_id, id),
  constraint clientes_largos CHECK (char_length(nombre) <= 200 AND char_length(zona) <= 200 AND char_length(telefono) <= 200 AND char_length(email) <= 200 AND char_length(razon_social) <= 200 AND char_length(direccion) <= 500 AND char_length(domicilio_fiscal) <= 500 AND char_length(origen_detalle) <= 500 AND char_length(notas) <= 10000),
  constraint clientes_nombre_valido CHECK (btrim(nombre) <> ''::text),
  constraint clientes_pkey PRIMARY KEY (id)
);
comment on table public.clientes is 'Clientes del taller. Un cliente puede tener varios proyectos a lo largo del tiempo.';
comment on column public.clientes.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.clientes.zona is 'Barrio o localidad, para ubicar al cliente de un vistazo.';
comment on column public.clientes.origen_detalle is 'Detalle libre del origen: quién lo refirió, por qué red escribió.';
comment on column public.clientes.cuit is 'CUIT con guiones (NN-NNNNNNNN-N), o vacío. El dígito verificador lo valida la app.';
comment on column public.clientes.deleted_at is 'Borrado lógico. No se puede borrar un cliente con proyectos vivos.';
CREATE INDEX clientes_household_actualizado ON public.clientes USING btree (household_id, updated_at);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
CREATE TRIGGER validar_baja BEFORE UPDATE OF deleted_at ON clientes FOR EACH ROW EXECUTE FUNCTION private.validar_baja_cliente();
alter table public.clientes enable row level security;
create policy clientes_alta on public.clientes as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy clientes_edicion on public.clientes as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy clientes_lectura on public.clientes as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.clientes to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.clientes to service_role;
grant insert (id, nombre, zona, telefono, email, direccion, origen_contacto, origen_detalle, condicion_fiscal, cuit, razon_social, domicilio_fiscal, notas, deleted_at) on public.clientes to authenticated;
grant update (id, nombre, zona, telefono, email, direccion, origen_contacto, origen_detalle, condicion_fiscal, cuit, razon_social, domicilio_fiscal, notas, deleted_at) on public.clientes to authenticated;

create table public.encuestas_enviadas (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  token_hash text not null,
  token text not null,
  preguntas jsonb not null default '[]'::jsonb,
  enviada_at timestamp with time zone not null default now(),
  recordada_at timestamp with time zone,
  revocada_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint encuestas_enviadas_foto_es_una_lista CHECK (jsonb_typeof(preguntas) = 'array'::text),
  constraint encuestas_enviadas_hash_valido CHECK (token_hash ~ '^[0-9a-f]{64}$'::text),
  constraint encuestas_enviadas_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint encuestas_enviadas_household_id_key UNIQUE (household_id, id),
  constraint encuestas_enviadas_pkey PRIMARY KEY (id),
  constraint encuestas_enviadas_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint encuestas_enviadas_token_coincide CHECK (encode(sha256(convert_to(token, 'UTF8'::name)), 'hex'::text) = token_hash),
  constraint encuestas_enviadas_token_formato CHECK (token ~ '^[A-Za-z0-9_-]{16,128}$'::text)
);
comment on table public.encuestas_enviadas is 'La encuesta que se le mandó a un trabajo: su enlace, cuándo se mandó, cuándo se recordó, si se dio de baja, y la foto de las preguntas base tal como estaban al mandarla. El cliente contesta lo que se le preguntó aunque el dueño edite la encuesta al otro día. Un solo enlace vivo por trabajo, y ninguno sin trabajo (ADR 0057).';
comment on column public.encuestas_enviadas.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.encuestas_enviadas.token_hash is 'sha256 del token en hexadecimal: con esto resuelven el enlace las dos funciones públicas.';
comment on column public.encuestas_enviadas.token is 'El token en claro, para que el dueño vea la dirección desde cualquiera de sus aparatos. Es la misma decisión que los enlaces de la vista del cliente (ADR 0052), y el check encuestas_enviadas_token_coincide ata su sha256 a token_hash. El rol anónimo no tiene ningún grant sobre esta tabla.';
comment on column public.encuestas_enviadas.preguntas is 'La foto de la encuesta base al mandarla: id, texto, tipo, escala, obligatoria y opciones de cada pregunta, en su orden. La saca el trigger private.armar_la_encuesta() de las preguntas vigentes; el dueño no tiene grant sobre esta columna. Las preguntas propias del trabajo no están acá: se leen vivas hasta que el cliente contesta, y desde ahí no se tocan.';
comment on column public.encuestas_enviadas.enviada_at is 'Cuándo se mandó. La pone el trigger: es el momento en que se creó el enlace.';
comment on column public.encuestas_enviadas.recordada_at is 'Cuándo se le recordó al cliente, o null. Un solo recordatorio: el trigger conserva la primera marca y no deja borrarla.';
comment on column public.encuestas_enviadas.revocada_at is 'Cuándo se dio de baja. Null es vivo. Una encuesta dada de baja no revive: el trigger conserva la primera marca.';
comment on column public.encuestas_enviadas.deleted_at is 'Borrado lógico. Borrar el trabajo se la lleva.';
CREATE INDEX encuestas_enviadas_household_actualizado ON public.encuestas_enviadas USING btree (household_id, updated_at);
CREATE INDEX encuestas_enviadas_household_proyecto ON public.encuestas_enviadas USING btree (household_id, proyecto_id);
CREATE UNIQUE INDEX encuestas_enviadas_token ON public.encuestas_enviadas USING btree (token_hash);
CREATE UNIQUE INDEX encuestas_enviadas_una_viva_por_trabajo ON public.encuestas_enviadas USING btree (household_id, proyecto_id) WHERE ((revocada_at IS NULL) AND (deleted_at IS NULL));
CREATE TRIGGER armar_la_encuesta BEFORE INSERT ON encuestas_enviadas FOR EACH ROW EXECUTE FUNCTION private.armar_la_encuesta();
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON encuestas_enviadas FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER cuidar_la_encuesta BEFORE UPDATE ON encuestas_enviadas FOR EACH ROW EXECUTE FUNCTION private.cuidar_la_encuesta();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON encuestas_enviadas FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.encuestas_enviadas enable row level security;
create policy encuestas_enviadas_alta on public.encuestas_enviadas as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy encuestas_enviadas_edicion on public.encuestas_enviadas as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy encuestas_enviadas_lectura on public.encuestas_enviadas as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.encuestas_enviadas to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.encuestas_enviadas to service_role;
grant insert (id, proyecto_id, token_hash, token) on public.encuestas_enviadas to authenticated;
grant update (recordada_at, revocada_at) on public.encuestas_enviadas to authenticated;

create table public.enlaces_publicos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  token_hash text not null,
  revocado_at timestamp with time zone,
  visitas integer not null default 0,
  ultima_visita_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  token text,
  constraint enlaces_publicos_hash_valido CHECK (token_hash ~ '^[0-9a-f]{64}$'::text),
  constraint enlaces_publicos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint enlaces_publicos_pkey PRIMARY KEY (id),
  constraint enlaces_publicos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint enlaces_publicos_token_coincide CHECK (token IS NULL OR encode(sha256(convert_to(token, 'UTF8'::name)), 'hex'::text) = token_hash),
  constraint enlaces_publicos_token_formato CHECK (token IS NULL OR token ~ '^[A-Za-z0-9_-]{16,128}$'::text),
  constraint enlaces_publicos_visitas_no_negativas CHECK (visitas >= 0)
);
comment on table public.enlaces_publicos is 'El link sin sesión de un trabajo. Guarda las dos cosas: token_hash, que es con lo que public.vista_compartida() resuelve el token que llega por la URL, y token, el token en claro, para que el dueño vea la dirección desde cualquiera de sus aparatos y no tenga que crear otro (ADR 0052). La consecuencia, escrita para que nadie la deduzca al revés: un volcado de esta tabla contiene enlaces que funcionan, y hay que tratarlo como tal. El rol anónimo no tiene ningún grant acá y ninguna función security definer devuelve la columna token.';
comment on column public.enlaces_publicos.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.enlaces_publicos.token_hash is 'sha256 del token en hexadecimal. El token es aleatorio y no es el id del trabajo: el id codifica el momento en que se creó y no sirve como secreto.';
comment on column public.enlaces_publicos.revocado_at is 'Cuándo se dio de baja. Null es activo. No hay caducidad automática: el uso es compartirlo al empezar una obra que dura meses, y un link que se vence a la mitad solo hace que el cliente llame (ADR 0046).';
comment on column public.enlaces_publicos.visitas is 'Cuántas veces se abrió. Lo cuenta public.vista_compartida().';
comment on column public.enlaces_publicos.ultima_visita_at is 'La última vez que se abrió.';
comment on column public.enlaces_publicos.deleted_at is 'Borrado lógico, como en todo el household. Borrar el trabajo se lleva su link.';
comment on column public.enlaces_publicos.token is 'El token del enlace en claro, o null en los enlaces creados antes de que esto existiera. Viaja en la réplica para que el dueño vea la dirección desde cualquiera de sus aparatos y no tenga que crear otro, que le rompería al cliente el que ya tiene. El check enlaces_publicos_token_coincide obliga a que su sha256 sea token_hash: acá no se puede guardar un token que no sea el de esta fila. El rol anónimo no tiene ningún grant sobre esta tabla y ninguna función security definer devuelve esta columna (ADR 0052).';
CREATE INDEX enlaces_publicos_household_actualizado ON public.enlaces_publicos USING btree (household_id, updated_at);
CREATE INDEX enlaces_publicos_household_proyecto ON public.enlaces_publicos USING btree (household_id, proyecto_id);
CREATE UNIQUE INDEX enlaces_publicos_token ON public.enlaces_publicos USING btree (token_hash);
CREATE UNIQUE INDEX enlaces_publicos_uno_vivo_por_trabajo ON public.enlaces_publicos USING btree (household_id, proyecto_id) WHERE ((revocado_at IS NULL) AND (deleted_at IS NULL));
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON enlaces_publicos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON enlaces_publicos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.enlaces_publicos enable row level security;
create policy enlaces_publicos_alta on public.enlaces_publicos as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy enlaces_publicos_edicion on public.enlaces_publicos as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy enlaces_publicos_lectura on public.enlaces_publicos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.enlaces_publicos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.enlaces_publicos to service_role;
grant insert (id, proyecto_id, token_hash, revocado_at, deleted_at, token) on public.enlaces_publicos to authenticated;
grant update (id, proyecto_id, token_hash, revocado_at, deleted_at, token) on public.enlaces_publicos to authenticated;

create table public.fotos_de_la_vidriera (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  orden integer not null,
  tipo text not null,
  bytes bigint not null,
  ancho integer not null,
  alto integer not null,
  archivo_de_origen uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint fotos_de_la_vidriera_archivo_de_origen_fk FOREIGN KEY (household_id, archivo_de_origen) REFERENCES archivos(household_id, id),
  constraint fotos_de_la_vidriera_bytes_validos CHECK (bytes > 0 AND bytes <= 20971520),
  constraint fotos_de_la_vidriera_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint fotos_de_la_vidriera_medidas_validas CHECK (ancho > 0 AND alto > 0),
  constraint fotos_de_la_vidriera_orden_valido CHECK (orden >= 0),
  constraint fotos_de_la_vidriera_pkey PRIMARY KEY (id),
  constraint fotos_de_la_vidriera_tipo_valido CHECK (tipo = ANY (ARRAY['image/webp'::text, 'image/jpeg'::text]))
);
comment on table public.fotos_de_la_vidriera is 'Las fotos que el taller le muestra a todos sus clientes en su página, hasta 12 vivas. El binario vive en el bucket archivos, en {household}/vidriera/{id}.webp y al lado {id}.mini.webp (o .jpg): una foto que sale de un trabajo se copia, no se apunta, así la ruta no lleva el id de otro trabajo y borrarla del trabajo no la saca de la vidriera (ADR 0076).';
comment on column public.fotos_de_la_vidriera.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.fotos_de_la_vidriera.orden is 'El lugar de la foto en la vidriera, de menor a mayor. Dos aparatos que suman a la vez pueden dejar dos iguales: el orden de verdad es orden, created_at, id, y mover una foto renumera la lista.';
comment on column public.fotos_de_la_vidriera.tipo is 'Lo que quedó en el bucket: image/webp, o image/jpeg donde el navegador no codifica WebP. La extensión de la ruta sale de acá.';
comment on column public.fotos_de_la_vidriera.bytes is 'Lo que ocupa en el bucket, la foto y su miniatura. Suma al espacio del plan, que los trabajos y la vidriera comparten.';
comment on column public.fotos_de_la_vidriera.ancho is 'Ancho en píxeles de la foto completa, para reservarle el lugar antes de que cargue.';
comment on column public.fotos_de_la_vidriera.alto is 'Alto en píxeles de la foto completa.';
comment on column public.fotos_de_la_vidriera.archivo_de_origen is 'La foto del trabajo de la que se copió, o null si se subió para la vidriera. Es para decir de dónde salió: el binario es otro, y la vidriera no depende de que esa foto siga viva.';
comment on column public.fotos_de_la_vidriera.deleted_at is 'Borrado lógico, como en todo el household. La app quita el binario del bucket cuando vence el deshacer.';
CREATE INDEX fotos_de_la_vidriera_household_actualizado ON public.fotos_de_la_vidriera USING btree (household_id, updated_at);
CREATE INDEX fotos_de_la_vidriera_household_origen ON public.fotos_de_la_vidriera USING btree (household_id, archivo_de_origen);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON fotos_de_la_vidriera FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER cuidar_el_tope_de_la_vidriera BEFORE INSERT OR UPDATE OF deleted_at ON fotos_de_la_vidriera FOR EACH ROW EXECUTE FUNCTION private.cuidar_el_tope_de_la_vidriera();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON fotos_de_la_vidriera FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.fotos_de_la_vidriera enable row level security;
create policy fotos_de_la_vidriera_alta on public.fotos_de_la_vidriera as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy fotos_de_la_vidriera_edicion on public.fotos_de_la_vidriera as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy fotos_de_la_vidriera_lectura on public.fotos_de_la_vidriera as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.fotos_de_la_vidriera to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.fotos_de_la_vidriera to service_role;
grant insert (id, orden, tipo, bytes, ancho, alto, archivo_de_origen, deleted_at) on public.fotos_de_la_vidriera to authenticated;
grant update (id, orden, tipo, bytes, ancho, alto, archivo_de_origen, deleted_at) on public.fotos_de_la_vidriera to authenticated;

create table public.gastos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  fecha date not null,
  descripcion text not null default ''::text,
  monto_centavos bigint not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint gastos_descripcion_largo CHECK (char_length(descripcion) <= 500),
  constraint gastos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint gastos_monto_positivo CHECK (monto_centavos > 0),
  constraint gastos_pkey PRIMARY KEY (id),
  constraint gastos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.gastos is 'Gastos imputados a un proyecto: materiales, herrajes, flete. Salen de MAUN y restan de la ganancia neta.';
comment on column public.gastos.monto_centavos is 'Importe gastado, en centavos. Siempre positivo.';
comment on column public.gastos.deleted_at is 'Borrado lógico. No se puede tocar un gasto de un proyecto cobrado.';
CREATE INDEX gastos_household_actualizado ON public.gastos USING btree (household_id, updated_at);
CREATE INDEX gastos_household_proyecto ON public.gastos USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON gastos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON gastos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
CREATE TRIGGER validar_proyecto_abierto BEFORE INSERT OR UPDATE ON gastos FOR EACH ROW EXECUTE FUNCTION private.validar_proyecto_abierto();
alter table public.gastos enable row level security;
create policy gastos_alta on public.gastos as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy gastos_edicion on public.gastos as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy gastos_lectura on public.gastos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.gastos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.gastos to service_role;
grant insert (id, proyecto_id, fecha, descripcion, monto_centavos, deleted_at) on public.gastos to authenticated;
grant update (id, proyecto_id, fecha, descripcion, monto_centavos, deleted_at) on public.gastos to authenticated;

create table public.household_members (
  id uuid not null default private.uuidv7(),
  household_id uuid not null,
  user_id uuid not null,
  rol rol_household not null default 'miembro'::rol_household,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint household_members_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint household_members_pkey PRIMARY KEY (id),
  constraint household_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  constraint household_members_usuario_household_key UNIQUE (user_id, household_id)
);
comment on table public.household_members is 'Pertenencia de un usuario de Auth a un household. Es la única fuente del household de un usuario: el cliente nunca lo manda.';
comment on column public.household_members.deleted_at is 'Borrado lógico: una membresía borrada no da acceso.';
CREATE INDEX household_members_household_actualizado ON public.household_members USING btree (household_id, updated_at);
CREATE UNIQUE INDEX household_members_un_household_por_usuario ON public.household_members USING btree (user_id) WHERE (deleted_at IS NULL);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON household_members FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON household_members FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.household_members enable row level security;
create policy household_members_lectura_miembros on public.household_members as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.household_members to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.household_members to service_role;

create table public.households (
  id uuid not null default private.uuidv7(),
  nombre text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint households_nombre_valido CHECK (btrim(nombre) <> ''::text AND char_length(nombre) <= 120),
  constraint households_pkey PRIMARY KEY (id)
);
comment on table public.households is 'Contenedor de aislamiento multi-tenant. Toda fila de negocio pertenece a un household y la RLS filtra por él.';
comment on column public.households.updated_at is 'Lo mantiene private.mantener_metadatos(). Es la marca que usa public.delta().';
comment on column public.households.deleted_at is 'Borrado lógico. Un household borrado deja de dar acceso a sus miembros.';
comment on column public.households.version is 'Contador de cambios de la fila, mantenido por trigger. Base del control de concurrencia en las operaciones de plata.';
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON households FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON households FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.households enable row level security;
create policy households_edicion on public.households as permissive
  for update to authenticated
  using ((id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy households_lectura_miembros on public.households as permissive
  for select to authenticated
  using ((id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.households to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.households to service_role;
grant update (nombre) on public.households to authenticated;

create table public.movimientos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  fecha date not null,
  tipo tipo_movimiento not null,
  tesoro_origen tesoro,
  tesoro_destino tesoro,
  monto_centavos bigint not null,
  categoria text not null default ''::text,
  descripcion text not null default ''::text,
  proyecto_id uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  desde_id uuid,
  hacia_id uuid,
  cubre_el_mes date,
  constraint movimientos_cubre_el_mes_valido CHECK (cubre_el_mes IS NULL OR tipo = 'transferencia'::tipo_movimiento AND cubre_el_mes = date_trunc('month'::text, cubre_el_mes::timestamp with time zone)::date AND tesoro_origen IS DISTINCT FROM 'diezmo'::tesoro),
  constraint movimientos_desde_fk FOREIGN KEY (household_id, desde_id) REFERENCES tesoros(household_id, id),
  constraint movimientos_forma_segun_tipo CHECK (COALESCE(
CASE tipo
    WHEN 'ingreso'::tipo_movimiento THEN desde_id IS NULL AND hacia_id IS NOT NULL
    WHEN 'gasto'::tipo_movimiento THEN desde_id IS NOT NULL AND hacia_id IS NULL
    WHEN 'transferencia'::tipo_movimiento THEN desde_id IS NOT NULL AND hacia_id IS NOT NULL
    WHEN 'pago_diezmo'::tipo_movimiento THEN desde_id IS NOT NULL AND tesoro_origen = 'diezmo'::tesoro AND hacia_id IS NULL
    WHEN 'aporte_cocos'::tipo_movimiento THEN desde_id IS NOT NULL AND hacia_id IS NOT NULL AND tesoro_destino = 'cocos'::tesoro
    WHEN 'ajuste'::tipo_movimiento THEN num_nonnulls(desde_id, hacia_id) = 1
    ELSE NULL::boolean
END, false)),
  constraint movimientos_hacia_fk FOREIGN KEY (household_id, hacia_id) REFERENCES tesoros(household_id, id),
  constraint movimientos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint movimientos_lados_distintos CHECK (num_nonnulls(desde_id, hacia_id) >= 1 AND desde_id IS DISTINCT FROM hacia_id),
  constraint movimientos_largos CHECK (char_length(categoria) <= 200 AND char_length(descripcion) <= 500),
  constraint movimientos_monto_positivo CHECK (monto_centavos > 0),
  constraint movimientos_pkey PRIMARY KEY (id),
  constraint movimientos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.movimientos is 'Movimientos cargados a mano. Los derivados de proyectos (pagos, gastos y distribución) no se guardan acá: los arma la vista libro_mayor.';
comment on column public.movimientos.tesoro_origen is 'De dónde sale la plata, por su clave. Null: viene de afuera (un ingreso), o sale de un tesoro del dueño, que no tiene clave: ahí manda desde_id.';
comment on column public.movimientos.tesoro_destino is 'A dónde va la plata, por su clave. Null: se va afuera (un gasto), o va a un tesoro del dueño, que no tiene clave: ahí manda hacia_id.';
comment on column public.movimientos.monto_centavos is 'Importe en centavos, siempre positivo: el sentido lo dan origen y destino.';
comment on column public.movimientos.categoria is 'Categoría libre para agrupar: Supermercado, Servicios, Alquiler del taller.';
comment on column public.movimientos.proyecto_id is 'Opcional: un movimiento manual atribuible a un proyecto, por ejemplo un ajuste sobre una distribución cerrada.';
comment on column public.movimientos.desde_id is 'El tesoro de donde sale la plata, por id. Null: viene de afuera (un ingreso). Lo completa private.completar_los_tesoros() desde tesoro_origen cuando lo manda una app sin actualizar; en un tesoro del dueño, tesoro_origen queda en null (ADR 0078).';
comment on column public.movimientos.hacia_id is 'El tesoro adonde va la plata, por id. Null: se va afuera (un gasto). Lo completa private.completar_los_tesoros() desde tesoro_destino; en un tesoro del dueño, tesoro_destino queda en null (ADR 0078).';
comment on column public.movimientos.cubre_el_mes is 'En una transferencia que cubre el faltante de un paso de la fila, el primer día del mes que cubre; si no, null. Esa plata cuenta para el tope de ese mes del tesoro que la recibe: el próximo cobro no la vuelve a llenar (ADR 0078). No sale del diezmo.';
CREATE INDEX movimientos_household_actualizado ON public.movimientos USING btree (household_id, updated_at);
CREATE INDEX movimientos_household_desde ON public.movimientos USING btree (household_id, desde_id);
CREATE INDEX movimientos_household_hacia ON public.movimientos USING btree (household_id, hacia_id);
CREATE INDEX movimientos_household_proyecto ON public.movimientos USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON movimientos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER completar_los_tesoros BEFORE INSERT OR UPDATE ON movimientos FOR EACH ROW EXECUTE FUNCTION private.completar_los_tesoros();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON movimientos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.movimientos enable row level security;
create policy movimientos_alta on public.movimientos as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy movimientos_edicion on public.movimientos as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy movimientos_lectura on public.movimientos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.movimientos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.movimientos to service_role;
grant insert (id, fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos, categoria, descripcion, proyecto_id, deleted_at, desde_id, hacia_id, cubre_el_mes) on public.movimientos to authenticated;
grant update (id, fecha, tipo, tesoro_origen, tesoro_destino, monto_centavos, categoria, descripcion, proyecto_id, deleted_at, desde_id, hacia_id, cubre_el_mes) on public.movimientos to authenticated;

create table public.necesidades (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  tipo tipo_de_necesidad not null,
  nombre text not null,
  cantidad integer,
  listo boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint necesidades_cantidad_valida CHECK (cantidad IS NULL OR cantidad > 0),
  constraint necesidades_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint necesidades_nombre_valido CHECK (btrim(nombre) <> ''::text AND char_length(nombre) <= 120),
  constraint necesidades_pkey PRIMARY KEY (id),
  constraint necesidades_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.necesidades is 'Los materiales, los herrajes y las herramientas que hacen falta para un trabajo. Hasta ahora el dueño los escribía a mano en las notas del trabajo. El catálogo de nombres no es otra tabla: son los nombres distintos que ya usó, que salen de estas mismas filas, uno por tipo (ADR 0045 y 0060).';
comment on column public.necesidades.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.necesidades.tipo is 'Material, herraje o herramienta. El autocompletado sugiere solo nombres del mismo tipo.';
comment on column public.necesidades.nombre is 'Cómo lo llama él: «Bisagras», «Sierra Circular». Es también la clave del catálogo derivado.';
comment on column public.necesidades.cantidad is 'Cuántos, si lleva número, sin unidad: la unidad va en el nombre («3 placas de melamina blanca 18 mm» es cantidad 3). Null es «hace falta y no conté»: los tarugos, o una sierra que hay una sola.';
comment on column public.necesidades.listo is 'Ya lo pedió, lo compró o lo tiene separado. Se queda en la lista, tachado, como una anotación tildada de la agenda.';
comment on column public.necesidades.deleted_at is 'Borrado lógico, como en todo el household.';
CREATE INDEX necesidades_household_actualizado ON public.necesidades USING btree (household_id, updated_at);
CREATE INDEX necesidades_household_proyecto ON public.necesidades USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON necesidades FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON necesidades FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.necesidades enable row level security;
create policy necesidades_alta on public.necesidades as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy necesidades_edicion on public.necesidades as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy necesidades_lectura on public.necesidades as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.necesidades to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.necesidades to service_role;
grant insert (id, proyecto_id, tipo, nombre, cantidad, listo, deleted_at) on public.necesidades to authenticated;
grant update (id, proyecto_id, tipo, nombre, cantidad, listo, deleted_at) on public.necesidades to authenticated;

create table public.opciones_de_presupuesto (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  descripcion text not null default ''::text,
  monto_centavos bigint not null,
  aprobada boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint opciones_de_presupuesto_descripcion_larga CHECK (char_length(descripcion) <= 500),
  constraint opciones_de_presupuesto_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint opciones_de_presupuesto_monto_no_negativo CHECK (monto_centavos >= 0),
  constraint opciones_de_presupuesto_pkey PRIMARY KEY (id),
  constraint opciones_de_presupuesto_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint presupuesto_aprobado TRIGGER DEFERRABLE INITIALLY DEFERRED
);
comment on table public.opciones_de_presupuesto is 'Las opciones de presupuesto que se le presentaron al cliente para un trabajo. Cuando el cliente elige, se tilda una y su importe pasa a ser el presupuesto del trabajo. Las que no eligió no se borran: son lo que se ofreció (ADR 0043).';
comment on column public.opciones_de_presupuesto.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.opciones_de_presupuesto.descripcion is 'Qué incluye esta opción, y el plan de pago si lo hay. Es donde va lo que antes se escribía en las notas.';
comment on column public.opciones_de_presupuesto.monto_centavos is 'El importe de esta opción, en centavos. Cuando se aprueba, es el presupuesto del trabajo.';
comment on column public.opciones_de_presupuesto.aprobada is 'La que eligió el cliente. Hay a lo sumo una viva por trabajo, y mientras no haya ninguna el trabajo no tiene presupuesto.';
comment on column public.opciones_de_presupuesto.deleted_at is 'Borrado lógico, como en todo el household.';
CREATE INDEX opciones_de_presupuesto_household_actualizado ON public.opciones_de_presupuesto USING btree (household_id, updated_at);
CREATE INDEX opciones_de_presupuesto_household_proyecto ON public.opciones_de_presupuesto USING btree (household_id, proyecto_id);
CREATE UNIQUE INDEX opciones_de_presupuesto_una_aprobada ON public.opciones_de_presupuesto USING btree (household_id, proyecto_id) WHERE (aprobada AND (deleted_at IS NULL));
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON opciones_de_presupuesto FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON opciones_de_presupuesto FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
CREATE CONSTRAINT TRIGGER presupuesto_aprobado AFTER INSERT OR UPDATE ON opciones_de_presupuesto DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.validar_presupuesto_aprobado();
alter table public.opciones_de_presupuesto enable row level security;
create policy opciones_de_presupuesto_alta on public.opciones_de_presupuesto as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy opciones_de_presupuesto_edicion on public.opciones_de_presupuesto as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy opciones_de_presupuesto_lectura on public.opciones_de_presupuesto as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.opciones_de_presupuesto to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.opciones_de_presupuesto to service_role;
grant insert (id, proyecto_id, descripcion, monto_centavos, aprobada, deleted_at) on public.opciones_de_presupuesto to authenticated;
grant update (id, proyecto_id, descripcion, monto_centavos, aprobada, deleted_at) on public.opciones_de_presupuesto to authenticated;

create table public.pagos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  fecha date not null,
  concepto text not null default ''::text,
  monto_centavos bigint not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  ya_en_la_apertura boolean not null default false,
  constraint pagos_concepto_largo CHECK (char_length(concepto) <= 500),
  constraint pagos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint pagos_monto_positivo CHECK (monto_centavos > 0),
  constraint pagos_pkey PRIMARY KEY (id),
  constraint pagos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.pagos is 'Cobros recibidos de un proyecto: seña, adelantos, saldo. Entran a MAUN. La distribución se calcula sobre su suma.';
comment on column public.pagos.monto_centavos is 'Importe cobrado, en centavos. Siempre positivo.';
comment on column public.pagos.deleted_at is 'Borrado lógico. No se puede tocar un pago de un proyecto cobrado.';
comment on column public.pagos.ya_en_la_apertura is 'La plata de este pago ya estaba en los saldos con los que arrancó la app: es de antes de la apertura y el dueño dijo que ya la tenía contada. Queda en el trabajo y en el libro mayor con su fecha, pero no mueve los tesoros. Solo puede ser true con una fecha anterior a la apertura. Las filas que existían al agregar la columna quedaron en false, que es lo que deja los saldos como estaban (ADR 0063).';
CREATE INDEX pagos_household_actualizado ON public.pagos USING btree (household_id, updated_at);
CREATE INDEX pagos_household_proyecto ON public.pagos USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
CREATE TRIGGER validar_la_fecha BEFORE INSERT OR UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION private.validar_la_fecha_del_pago();
CREATE TRIGGER validar_proyecto_abierto BEFORE INSERT OR UPDATE ON pagos FOR EACH ROW EXECUTE FUNCTION private.validar_proyecto_abierto();
alter table public.pagos enable row level security;
create policy pagos_alta on public.pagos as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy pagos_edicion on public.pagos as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy pagos_lectura on public.pagos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.pagos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.pagos to service_role;
grant insert (id, proyecto_id, fecha, concepto, monto_centavos, deleted_at, ya_en_la_apertura) on public.pagos to authenticated;
grant update (id, proyecto_id, fecha, concepto, monto_centavos, deleted_at, ya_en_la_apertura) on public.pagos to authenticated;

create table public.preguntas (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  serie uuid not null,
  numero integer not null default 1,
  proyecto_id uuid,
  titular boolean not null default false,
  orden integer not null default 0,
  texto text not null,
  tipo tipo_de_pregunta not null,
  escala escala_de_pregunta,
  obligatoria boolean not null default false,
  opciones text[],
  cantidad_de_opciones smallint not null default 0,
  archivada_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint preguntas_cantidad_de_opciones CHECK (cantidad_de_opciones = COALESCE(cardinality(opciones), 0)),
  constraint preguntas_escala_segun_tipo CHECK ((tipo = 'escala5'::tipo_de_pregunta) = (escala IS NOT NULL)),
  constraint preguntas_forma UNIQUE (household_id, id, tipo, cantidad_de_opciones),
  constraint preguntas_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint preguntas_numero_valido CHECK (numero >= 1),
  constraint preguntas_opciones_segun_tipo CHECK (COALESCE(
CASE
    WHEN tipo = ANY (ARRAY['una'::tipo_de_pregunta, 'varias'::tipo_de_pregunta]) THEN private.opciones_de_pregunta_validas(opciones)
    ELSE opciones IS NULL
END, false)),
  constraint preguntas_pkey PRIMARY KEY (id),
  constraint preguntas_primera_version CHECK ((numero = 1) = (serie = id)),
  constraint preguntas_propias CHECK (proyecto_id IS NULL OR numero = 1 AND NOT titular AND NOT obligatoria AND archivada_at IS NULL),
  constraint preguntas_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint preguntas_serie_numero UNIQUE (household_id, serie, numero),
  constraint preguntas_texto_valido CHECK (btrim(texto) <> ''::text AND char_length(texto) <= 300)
);
comment on table public.preguntas is 'Las preguntas que se le hacen al cliente cuando termina un trabajo. Cada fila es una pregunta tal como se pregunta. La encuesta base del taller son las filas sin trabajo, la versión más nueva de cada serie, sin archivar, en su orden. Las propias de un trabajo tienen el trabajo puesto y se suman solo a esa encuesta (ADR 0057).';
comment on column public.preguntas.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.preguntas.serie is 'La pregunta a lo largo de sus versiones. La primera versión tiene serie = id. Cambiarle el sentido a una pregunta con respuestas es una fila nueva de la misma serie, con numero + 1: las respuestas viejas siguen colgando de la versión que se contestó, no de la actual.';
comment on column public.preguntas.numero is 'La versión dentro de la serie, desde 1. La vigente es la de número más alto.';
comment on column public.preguntas.proyecto_id is 'Null: es de la encuesta base. Con valor: es una pregunta propia de ese trabajo, que nunca entra en el promedio general.';
comment on column public.preguntas.titular is 'La pregunta cuyo promedio es «qué tan conformes quedaron», el número de arriba de Resultados. Viene sembrada en «¿Qué tan conforme quedaste?» y cada versión nueva la hereda de la anterior.';
comment on column public.preguntas.orden is 'El lugar en la encuesta. Lo que vale es el de la versión vigente.';
comment on column public.preguntas.escala is 'Solo en las de escala: qué palabras lleva cada carita.';
comment on column public.preguntas.opciones is 'Solo en las de una o varias opciones: el texto de cada opción, en su orden. Lo que se guarda como respuesta es la posición.';
comment on column public.preguntas.cantidad_de_opciones is 'Cuántas opciones tiene. La calcula el trigger desde opciones y el check lo ata; existe para que la foreign key de los renglones pueda exigir que la opción elegida exista.';
comment on column public.preguntas.archivada_at is 'Cuándo se dejó de preguntar. Archivar no borra: la pregunta sale de la encuesta y lo que ya contestaron queda. Null es que se sigue preguntando.';
comment on column public.preguntas.deleted_at is 'Borrado lógico. Lo usan la pregunta propia que el dueño saca antes de que el cliente conteste, la pregunta de la encuesta base que nadie llegó a ver (el trigger no deja borrar otra) y el borrado de un trabajo, que se lleva las suyas.';
CREATE INDEX preguntas_household_actualizado ON public.preguntas USING btree (household_id, updated_at);
CREATE INDEX preguntas_household_proyecto ON public.preguntas USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON preguntas FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER cuidar_la_pregunta BEFORE INSERT OR UPDATE ON preguntas FOR EACH ROW EXECUTE FUNCTION private.cuidar_la_pregunta();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON preguntas FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.preguntas enable row level security;
create policy preguntas_alta on public.preguntas as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy preguntas_edicion on public.preguntas as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy preguntas_lectura on public.preguntas as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.preguntas to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.preguntas to service_role;
grant insert (id, serie, numero, proyecto_id, orden, texto, tipo, escala, obligatoria, opciones, archivada_at, deleted_at) on public.preguntas to authenticated;
grant update (id, serie, numero, proyecto_id, orden, texto, tipo, escala, obligatoria, opciones, archivada_at, deleted_at) on public.preguntas to authenticated;

create table public.presupuestos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  contenido jsonb not null,
  borrador_version integer not null default 0,
  numero text,
  aceptado_el date,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint presupuestos_borrador_version_valida CHECK (borrador_version >= 0),
  constraint presupuestos_contenido_es_un_objeto CHECK (jsonb_typeof(contenido) = 'object'::text),
  constraint presupuestos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint presupuestos_household_id_key UNIQUE (household_id, id),
  constraint presupuestos_numero_formato CHECK (numero IS NULL OR numero ~ '^[0-9]{8}-[0-9]{2,}$'::text),
  constraint presupuestos_numero_unico UNIQUE (household_id, numero),
  constraint presupuestos_pkey PRIMARY KEY (id),
  constraint presupuestos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.presupuestos is 'El borrador del presupuesto de cada trabajo, uno vivo por trabajo, fuera del agregado del proyecto: editarlo no sube la version del trabajo ni choca con otro guardado del mismo trabajo. Lo escriben public.guardar_el_presupuesto() (el contenido y su revisión) y public.mandar_el_presupuesto() (el número del primer envío); la app solo lee. La fecha de aceptación la pone el trigger de los cambios de estado (ADR 0080).';
comment on column public.presupuestos.id is 'El UUIDv7 que manda la app, así la fila optimista y la de la base son la misma.';
comment on column public.presupuestos.household_id is 'Default: el household del usuario de la sesión. Las funciones que escriben la tabla lo ponen explícito.';
comment on column public.presupuestos.contenido is 'El borrador, el BorradorDelPresupuesto de @maun/domain: el título, la obra, la descripción, los muebles, los herrajes, las cláusulas tildadas y las propias de este trabajo, la forma de pago elegida, el plazo y los días que vale. No guarda importes: el total y las opciones son los del trabajo. Lo valida private.problema_del_presupuesto(), que es permisivo, porque un borrador puede estar a medio hacer.';
comment on column public.presupuestos.borrador_version is 'La revisión del borrador, aparte de la version de la fila. La suma solo public.guardar_el_presupuesto(), de a uno, y la comparan las dos funciones: un guardado o un envío armado con otra rebota con MN026. La version de la fila no sirve para eso, porque sube también con el número y con aceptado_el.';
comment on column public.presupuestos.numero is 'El número del presupuesto, AAAAMMDD-NN: el día del primer envío y el orden de ese día en el taller, contando los borrados. Null hasta el primer envío; lo pone public.mandar_el_presupuesto() con los ajustes del taller bloqueados, y las revisiones lo mantienen.';
comment on column public.presupuestos.aceptado_el is 'El día en que el cliente lo aprobó, o null. Lo pone el trigger de los cambios de estado cuando el trabajo pasa de una consulta a en_curso, y lo vuelve a null si vuelve a una consulta; no lo escribe nadie más. La ficha y la página del cliente leen la misma fecha.';
comment on column public.presupuestos.deleted_at is 'Se borra solo con su trabajo, por private.borrar_el_presupuesto_del_trabajo().';
CREATE INDEX presupuestos_household_actualizado ON public.presupuestos USING btree (household_id, updated_at);
CREATE INDEX presupuestos_household_proyecto ON public.presupuestos USING btree (household_id, proyecto_id);
CREATE UNIQUE INDEX presupuestos_uno_vivo_por_trabajo ON public.presupuestos USING btree (household_id, proyecto_id) WHERE (deleted_at IS NULL);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON presupuestos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON presupuestos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.presupuestos enable row level security;
create policy presupuestos_lectura on public.presupuestos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.presupuestos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.presupuestos to service_role;

create table public.propuestas_de_entrega (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  forma forma_de_coordinar not null,
  fecha date,
  franja franja_de_entrega,
  cerrada_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint propuestas_de_entrega_del_trabajo UNIQUE (household_id, proyecto_id, id),
  constraint propuestas_de_entrega_dia_segun_la_forma CHECK ((forma = 'un_dia'::forma_de_coordinar) = (fecha IS NOT NULL)),
  constraint propuestas_de_entrega_franja_con_su_dia CHECK (franja IS NULL OR forma = 'un_dia'::forma_de_coordinar),
  constraint propuestas_de_entrega_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint propuestas_de_entrega_pkey PRIMARY KEY (id),
  constraint propuestas_de_entrega_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id)
);
comment on table public.propuestas_de_entrega is 'Lo que el taller le pide al cliente para acordar la entrega de un mueble listo: un día, que el cliente acepta con un botón, o que marque los días y las franjas que le quedan bien. A lo sumo una abierta por trabajo; abrir otra cierra la anterior en su propia sentencia. La base la cierra sola cuando se fija una entrega comprometida y cuando el trabajo deja de estar en curso y listo. El dueño la escribe por public.proponer_la_entrega(), que necesita señal (ADR 0071).';
comment on column public.propuestas_de_entrega.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.propuestas_de_entrega.forma is 'un_dia: el taller propone un día; sus_dias: le pide al cliente los suyos.';
comment on column public.propuestas_de_entrega.fecha is 'El día propuesto, con la forma un_dia; null con sus_dias. Desde mañana, contado en la hora del taller.';
comment on column public.propuestas_de_entrega.franja is 'La franja del día propuesto, si la tiene. Solo con un_dia.';
comment on column public.propuestas_de_entrega.cerrada_at is 'Cuándo se cerró: porque el taller propuso otra cosa, porque se comprometió la entrega o porque el trabajo dejó de estar en curso y listo. Null es abierta, y el cliente solo le contesta a la abierta.';
comment on column public.propuestas_de_entrega.deleted_at is 'Borrado lógico, como en todo el household. Se borra con el trabajo.';
CREATE INDEX propuestas_de_entrega_household_actualizado ON public.propuestas_de_entrega USING btree (household_id, updated_at);
CREATE INDEX propuestas_de_entrega_household_proyecto ON public.propuestas_de_entrega USING btree (household_id, proyecto_id, created_at);
CREATE UNIQUE INDEX propuestas_de_entrega_una_abierta ON public.propuestas_de_entrega USING btree (household_id, proyecto_id) WHERE ((cerrada_at IS NULL) AND (deleted_at IS NULL));
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON propuestas_de_entrega FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER cuidar_la_propuesta_de_entrega BEFORE INSERT ON propuestas_de_entrega FOR EACH ROW EXECUTE FUNCTION private.cuidar_la_propuesta_de_entrega();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON propuestas_de_entrega FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.propuestas_de_entrega enable row level security;
create policy propuestas_de_entrega_alta on public.propuestas_de_entrega as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy propuestas_de_entrega_edicion on public.propuestas_de_entrega as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy propuestas_de_entrega_lectura on public.propuestas_de_entrega as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.propuestas_de_entrega to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.propuestas_de_entrega to service_role;
grant insert (id, proyecto_id, forma, fecha, franja) on public.propuestas_de_entrega to authenticated;
grant update (cerrada_at, deleted_at) on public.propuestas_de_entrega to authenticated;

create table public.proximos_contactos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  fecha date not null,
  nota text not null default ''::text,
  etapa_previa estado_proyecto not null,
  hecho_el date,
  resultado text,
  respuesta text not null default ''::text,
  importante boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint proximos_contactos_etapa_previa_valida CHECK (etapa_previa = ANY (ARRAY['contacto'::estado_proyecto, 'presupuesto_estimativo'::estado_proyecto, 'relevamiento'::estado_proyecto, 'a_presupuestar'::estado_proyecto, 'presupuesto_enviado'::estado_proyecto])),
  constraint proximos_contactos_hecho_con_resultado CHECK ((hecho_el IS NULL) = (resultado IS NULL)),
  constraint proximos_contactos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint proximos_contactos_nota_valida CHECK (char_length(nota) <= 500),
  constraint proximos_contactos_pkey PRIMARY KEY (id),
  constraint proximos_contactos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint proximos_contactos_respuesta_valida CHECK (char_length(respuesta) <= 500),
  constraint proximos_contactos_resultado_valido CHECK (resultado IS NULL OR (resultado = ANY (ARRAY['reactivado'::text, 'perdido'::text, 'otra_fecha'::text]))),
  constraint seguimiento_con_su_contacto TRIGGER DEFERRABLE INITIALLY DEFERRED
);
comment on table public.proximos_contactos is 'El seguimiento de un «por ahora no»: cada vez que un trabajo entra en seguimiento o se le cambia la fecha nace una fila pendiente con el día en que hay que volver a escribirle. Al registrar el contacto se completa con el día, el resultado y lo que contestó, y queda como historia. A lo sumo una pendiente por trabajo, y un trabajo está en seguimiento si y solo si tiene una (ADR 0064).';
comment on column public.proximos_contactos.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.proximos_contactos.fecha is 'El día en que hay que volver a escribirle. Es un día, no un instante: la agenda lo pone en ese día.';
comment on column public.proximos_contactos.nota is 'Lo que quedó al poner la fecha: «después de las vacaciones», «cuando cobre el aguinaldo». Opcional.';
comment on column public.proximos_contactos.etapa_previa is 'La etapa de las consultas en la que estaba el trabajo al entrar en seguimiento: reactivar lo devuelve ahí por defecto. La escribe la base al entrar, con el estado que tenía el trabajo; las filas siguientes la copian.';
comment on column public.proximos_contactos.hecho_el is 'El día en que se le escribió. Null mientras está pendiente.';
comment on column public.proximos_contactos.resultado is 'Qué pasó al escribirle: reactivado (volvió a las consultas), perdido, u otra_fecha (sigue en seguimiento con una fila nueva). Null mientras está pendiente.';
comment on column public.proximos_contactos.respuesta is 'Lo que contestó el cliente, en palabras del dueño. Opcional.';
comment on column public.proximos_contactos.importante is 'Marca de importante en la agenda, como la de las anotaciones: vive en la misma fila y se tilda con un update de esa columna sola.';
comment on column public.proximos_contactos.deleted_at is 'Borrado lógico, como en todo el household. Se borra con el trabajo.';
CREATE INDEX proximos_contactos_household_actualizado ON public.proximos_contactos USING btree (household_id, updated_at);
CREATE INDEX proximos_contactos_household_fecha ON public.proximos_contactos USING btree (household_id, fecha);
CREATE INDEX proximos_contactos_household_proyecto ON public.proximos_contactos USING btree (household_id, proyecto_id, fecha);
CREATE UNIQUE INDEX proximos_contactos_un_pendiente ON public.proximos_contactos USING btree (household_id, proyecto_id) WHERE ((hecho_el IS NULL) AND (deleted_at IS NULL));
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON proximos_contactos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON proximos_contactos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
CREATE CONSTRAINT TRIGGER seguimiento_con_su_contacto AFTER INSERT OR UPDATE ON proximos_contactos DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.revisar_el_seguimiento_del_contacto();
CREATE TRIGGER validar_proximo_contacto BEFORE INSERT OR UPDATE ON proximos_contactos FOR EACH ROW EXECUTE FUNCTION private.validar_proximo_contacto();
alter table public.proximos_contactos enable row level security;
create policy proximos_contactos_alta on public.proximos_contactos as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy proximos_contactos_edicion on public.proximos_contactos as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy proximos_contactos_lectura on public.proximos_contactos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.proximos_contactos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.proximos_contactos to service_role;
grant insert (id, proyecto_id, fecha, nota, etapa_previa, hecho_el, resultado, respuesta, importante, deleted_at) on public.proximos_contactos to authenticated;
grant update (id, proyecto_id, fecha, nota, etapa_previa, hecho_el, resultado, respuesta, importante, deleted_at) on public.proximos_contactos to authenticated;

create table public.proyectos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  cliente_id uuid not null,
  titulo text not null,
  descripcion text not null default ''::text,
  estado estado_proyecto not null default 'contacto'::estado_proyecto,
  presupuesto_centavos bigint,
  forma_pago forma_pago,
  comprobante comprobante not null default 'sin_comprobante'::comprobante,
  fecha_visita date,
  ultimo_contacto date,
  fecha_inicio date,
  entrega_estimada date,
  fecha_entrega date,
  direccion_entrega text not null default ''::text,
  notas text not null default ''::text,
  fecha_cobro date,
  dist_cobrado_centavos bigint,
  dist_gastos_centavos bigint,
  dist_diezmo_bp integer,
  dist_tope_sueldo_centavos bigint,
  dist_tope_fijos_centavos bigint,
  dist_diezmo_centavos bigint,
  dist_sueldo_centavos bigint,
  dist_fijos_centavos bigint,
  dist_remanente_centavos bigint,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  reapertura_objetivo_sueldo_centavos bigint,
  reapertura_objetivo_fijos_centavos bigint,
  reapertura_fecha_cobro date,
  dist_objetivo_sueldo_centavos bigint,
  dist_objetivo_fijos_centavos bigint,
  dist_sueldo_mensual boolean,
  dist_sueldo_previo_centavos bigint,
  dist_fijos_previo_centavos bigint,
  dist_liquidado_at timestamp with time zone,
  reapertura_sueldo_mensual boolean,
  vencimiento_presupuesto date,
  presupuesto_diseno boolean not null default false,
  presupuesto_despiece boolean not null default false,
  presupuesto_cotizacion boolean not null default false,
  presupuesto_pdf boolean not null default false,
  visita_hecha boolean not null default false,
  visita_importante boolean not null default false,
  entrega_importante boolean not null default false,
  presupuesto_importante boolean not null default false,
  sena_bp integer,
  costo_madera_centavos bigint,
  costo_herrajes_centavos bigint,
  costo_flete_centavos bigint,
  costo_ayudante_centavos bigint,
  entrega_hora time without time zone,
  visita_hora time without time zone,
  cobro_sena forma_de_cobro[],
  cobro_saldo forma_de_cobro[],
  reparto_ya_en_la_apertura boolean not null default false,
  presupuesto_vale_hasta date,
  listo_el date,
  entrega_comprometida date,
  entrega_comprometida_franja franja_de_entrega,
  tipo_de_proyecto text,
  dist_fila_version integer,
  dist_fila jsonb,
  dist_previo jsonb,
  reapertura_fila jsonb,
  constraint presupuesto_aprobado TRIGGER DEFERRABLE INITIALLY DEFERRED,
  constraint proyectos_cliente_fk FOREIGN KEY (household_id, cliente_id) REFERENCES clientes(household_id, id),
  constraint proyectos_cobro_saldo_valido CHECK (COALESCE(cobro_saldo IS NULL OR cobro_saldo = ARRAY['transferencia'::forma_de_cobro] OR cobro_saldo = ARRAY['efectivo'::forma_de_cobro] OR cobro_saldo = ARRAY['transferencia'::forma_de_cobro, 'efectivo'::forma_de_cobro], false)),
  constraint proyectos_cobro_sena_valido CHECK (COALESCE(cobro_sena IS NULL OR cobro_sena = ARRAY['transferencia'::forma_de_cobro] OR cobro_sena = ARRAY['efectivo'::forma_de_cobro] OR cobro_sena = ARRAY['transferencia'::forma_de_cobro, 'efectivo'::forma_de_cobro], false)),
  constraint proyectos_costo_ayudante_no_negativo CHECK (costo_ayudante_centavos IS NULL OR costo_ayudante_centavos >= 0),
  constraint proyectos_costo_flete_no_negativo CHECK (costo_flete_centavos IS NULL OR costo_flete_centavos >= 0),
  constraint proyectos_costo_herrajes_no_negativo CHECK (costo_herrajes_centavos IS NULL OR costo_herrajes_centavos >= 0),
  constraint proyectos_costo_madera_no_negativo CHECK (costo_madera_centavos IS NULL OR costo_madera_centavos >= 0),
  constraint proyectos_distribucion_cuadra CHECK (dist_cobrado_centavos IS NULL OR dist_cobrado_centavos >= 0 AND dist_gastos_centavos >= 0 AND dist_diezmo_bp >= 0 AND dist_diezmo_bp <= 10000 AND dist_tope_sueldo_centavos >= 0 AND dist_tope_fijos_centavos >= 0 AND dist_diezmo_centavos >= 0 AND dist_sueldo_centavos >= 0 AND dist_sueldo_centavos <= dist_tope_sueldo_centavos AND dist_fijos_centavos >= 0 AND dist_fijos_centavos <= dist_tope_fijos_centavos AND (dist_remanente_centavos >= 0 OR (dist_diezmo_centavos + dist_sueldo_centavos + dist_fijos_centavos) = 0) AND (dist_diezmo_centavos + dist_sueldo_centavos + dist_fijos_centavos + dist_remanente_centavos) = (dist_cobrado_centavos - dist_gastos_centavos)),
  constraint proyectos_fila_completa CHECK (num_nulls(dist_fila_version, dist_fila, dist_previo) = ANY (ARRAY[0, 3])),
  constraint proyectos_franja_con_su_dia CHECK (entrega_comprometida_franja IS NULL OR entrega_comprometida IS NOT NULL),
  constraint proyectos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint proyectos_household_id_key UNIQUE (household_id, id),
  constraint proyectos_la_entrega_desde_aprobado CHECK (listo_el IS NULL AND entrega_comprometida IS NULL OR (estado = ANY (ARRAY['en_curso'::estado_proyecto, 'entregado'::estado_proyecto, 'cobrado'::estado_proyecto, 'perdido'::estado_proyecto]))),
  constraint proyectos_largos CHECK (char_length(titulo) <= 200 AND char_length(descripcion) <= 10000 AND char_length(direccion_entrega) <= 500 AND char_length(notas) <= 10000),
  constraint proyectos_liquidado_con_distribucion CHECK ((estado = ANY (ARRAY['cobrado'::estado_proyecto, 'perdido'::estado_proyecto])) = (fecha_cobro IS NOT NULL) AND (num_nulls(fecha_cobro, dist_cobrado_centavos, dist_gastos_centavos, dist_diezmo_bp, dist_tope_sueldo_centavos, dist_tope_fijos_centavos, dist_diezmo_centavos, dist_sueldo_centavos, dist_fijos_centavos, dist_remanente_centavos, dist_objetivo_sueldo_centavos, dist_objetivo_fijos_centavos, dist_sueldo_mensual, dist_sueldo_previo_centavos, dist_fijos_previo_centavos, dist_liquidado_at) = ANY (ARRAY[0, 16]))),
  constraint proyectos_listo_antes_de_entregar CHECK (listo_el IS NULL OR fecha_entrega IS NULL OR listo_el <= fecha_entrega),
  constraint proyectos_pkey PRIMARY KEY (id),
  constraint proyectos_presupuesto_no_negativo CHECK (presupuesto_centavos IS NULL OR presupuesto_centavos >= 0),
  constraint proyectos_reapertura_completa CHECK ((num_nulls(reapertura_objetivo_sueldo_centavos, reapertura_objetivo_fijos_centavos, reapertura_sueldo_mensual, reapertura_fecha_cobro) = ANY (ARRAY[0, 4])) AND ((estado <> ALL (ARRAY['cobrado'::estado_proyecto, 'perdido'::estado_proyecto])) OR reapertura_fecha_cobro IS NULL)),
  constraint proyectos_reapertura_fila_valida CHECK (reapertura_fila IS NULL OR jsonb_typeof(reapertura_fila) = 'object'::text),
  constraint proyectos_sena_valida CHECK (sena_bp IS NULL OR sena_bp >= 0 AND sena_bp <= 10000),
  constraint proyectos_tipo_de_proyecto_valido CHECK (tipo_de_proyecto IS NULL OR char_length(tipo_de_proyecto) >= 1 AND char_length(tipo_de_proyecto) <= 60 AND tipo_de_proyecto = btrim(tipo_de_proyecto)),
  constraint proyectos_titulo_valido CHECK (btrim(titulo) <> ''::text),
  constraint proyectos_topes_del_mes CHECK (dist_cobrado_centavos IS NULL OR COALESCE(dist_objetivo_sueldo_centavos >= 0 AND dist_objetivo_fijos_centavos >= 0 AND dist_sueldo_previo_centavos >= 0 AND dist_fijos_previo_centavos >= 0 AND dist_tope_fijos_centavos = GREATEST(0::bigint, dist_objetivo_fijos_centavos - dist_fijos_previo_centavos) AND dist_tope_sueldo_centavos =
CASE
    WHEN dist_sueldo_mensual THEN GREATEST(0::bigint, dist_objetivo_sueldo_centavos - dist_sueldo_previo_centavos)
    ELSE dist_objetivo_sueldo_centavos
END, false)),
  constraint seguimiento_con_su_contacto TRIGGER DEFERRABLE INITIALLY DEFERRED
);
comment on table public.proyectos is 'Leads y proyectos: la misma fila avanza de seguimiento a obra y a cobrado, o se cierra como perdido. Liquidar (cobrar o cerrar como perdido) congela la distribución (ADR 0003 y 0011).';
comment on column public.proyectos.titulo is 'El trabajo, en pocas palabras: "Placard 3 puertas con interior en melamina".';
comment on column public.proyectos.presupuesto_centavos is 'Presupuesto acordado. Null mientras el lead no tiene presupuesto. La distribución NO se calcula sobre esto sino sobre lo cobrado.';
comment on column public.proyectos.fecha_visita is 'Visita de relevamiento, en la etapa de seguimiento. Viaja a la vista del cliente: es el día que dice el casillero del relevamiento. La hora, visita_hora, no viaja (ADR 0058).';
comment on column public.proyectos.ultimo_contacto is 'Último contacto con el cliente, en la etapa de seguimiento.';
comment on column public.proyectos.entrega_estimada is 'La entrega estimada: la fecha probable que calcula el taller, a 21 días hábiles del inicio por defecto, y que puede moverse. No es un acuerdo con el cliente: eso es entrega_comprometida. Mientras el trabajo está en curso, cada cambio queda en public.cambios_de_fecha con cuántos trabajos había en curso ese día, y el analítico mide contra la primera (ADR 0071).';
comment on column public.proyectos.fecha_entrega is 'La entrega real: el día en que se entregó. La escribe «Ya lo entregué» con el día de hoy y «Volvió al taller» la borra. Con el trabajo en curso vale null siempre: la guarda private.cuidar_las_fechas_de_la_entrega() limpia la que quede de antes (ADR 0071).';
comment on column public.proyectos.fecha_cobro is 'Fecha de la liquidación: el cobro final o el cierre como perdido. No null si y solo si el proyecto está cobrado o perdido. Es la fecha de los asientos derivados en el libro mayor y define el mes de los topes.';
comment on column public.proyectos.dist_cobrado_centavos is 'Congelado al liquidar: total cobrado (suma de pagos vivos). En un perdido, la seña retenida.';
comment on column public.proyectos.dist_gastos_centavos is 'Congelado al liquidar: total de gastos del proyecto.';
comment on column public.proyectos.dist_diezmo_bp is 'Congelado al liquidar: porcentaje de diezmo aplicado, en puntos básicos (1000 = 10%). Un perdido usa 0 si ajustes.perdido_con_diezmo está apagado.';
comment on column public.proyectos.dist_tope_sueldo_centavos is 'Congelado al liquidar: tope de sueldo que se aplicó. Sale del objetivo, del modo y de lo liquidado en el mes (proyectos_topes_del_mes).';
comment on column public.proyectos.dist_tope_fijos_centavos is 'Congelado al liquidar: tope de costos fijos que se aplicó, lo que faltaba cubrir del mes.';
comment on column public.proyectos.dist_diezmo_centavos is 'Congelado al liquidar: lo que pasa de MAUN a DIEZMO.';
comment on column public.proyectos.dist_sueldo_centavos is 'Congelado al liquidar: lo que pasa de MAUN a HOGAR.';
comment on column public.proyectos.dist_fijos_centavos is 'Congelado al liquidar: la parte de la ganancia que cubre costos fijos del mes. Queda en MAUN y no mueve plata entre tesoros.';
comment on column public.proyectos.dist_remanente_centavos is 'Congelado al liquidar: lo que sobra en MAUN. Negativo solo si el proyecto dio pérdida.';
comment on column public.proyectos.deleted_at is 'Borrado lógico. Borrar un proyecto borra sus pagos y gastos; uno liquidado con pagos o gastos vivos no se borra, y uno borrado no revive.';
comment on column public.proyectos.reapertura_objetivo_sueldo_centavos is 'Objetivo de sueldo del cobro que se reabrió. El próximo cobro lo usa en vez del de los ajustes, y lo limpia.';
comment on column public.proyectos.reapertura_objetivo_fijos_centavos is 'Objetivo de costos fijos del cobro que se reabrió. El tope se recalcula contra lo liquidado hoy en ese mes.';
comment on column public.proyectos.reapertura_fecha_cobro is 'Fecha del cobro que se reabrió. Volver a cobrarlo la propone por defecto, y el dueño la puede corregir: la fecha la manda la app (ADR 0063).';
comment on column public.proyectos.dist_objetivo_sueldo_centavos is 'Congelado al liquidar: objetivo de sueldo con el que se calculó el tope. En un perdido sin sueldo, cero.';
comment on column public.proyectos.dist_objetivo_fijos_centavos is 'Congelado al liquidar: costos fijos del mes con los que se calculó el tope.';
comment on column public.proyectos.dist_sueldo_mensual is 'Congelado al liquidar: si el sueldo se topeó por mes (true) o por proyecto (false).';
comment on column public.proyectos.dist_sueldo_previo_centavos is 'Congelado al liquidar: sueldo que el mes ya llevaba liquidado por otros proyectos en ese instante. Explica el tope; una reapertura posterior en el mismo mes no lo reescribe.';
comment on column public.proyectos.dist_fijos_previo_centavos is 'Congelado al liquidar: costos fijos que el mes ya llevaba liquidados por otros proyectos en ese instante.';
comment on column public.proyectos.dist_liquidado_at is 'Congelado al liquidar: el instante de la liquidación. Ordena las liquidaciones de un mismo mes.';
comment on column public.proyectos.reapertura_sueldo_mensual is 'Modo del sueldo del cobro que se reabrió. El próximo cobro lo usa si el taller sigue repartiendo el sueldo por trabajo; si ya lo reparte por mes (sueldo_tope_mensual o su fila guardada), el sueldo va por mes igual y cuenta lo que el mes ya recibió (ADR 0079).';
comment on column public.proyectos.vencimiento_presupuesto is 'Fecha límite para entregar el presupuesto de un contacto. La app la propone a cinco días hábiles del relevamiento (una semana de trabajo) cuando el contacto pasa a presupuestar, y desde el día que pasa si viene de un estimativo; se edita como la entrega estimada. La agenda la muestra mientras el contacto no mandó el presupuesto ni un estimativo.';
comment on column public.proyectos.presupuesto_diseno is 'Tarea de presupuestar: el diseño está hecho. Es una tilde adentro de la etapa «a presupuestar», no un estado (ADR 0038).';
comment on column public.proyectos.presupuesto_despiece is 'Tarea de presupuestar: el despiece está hecho.';
comment on column public.proyectos.presupuesto_cotizacion is 'Tarea de presupuestar: la cotización está hecha (madera y herrajes, flete, ayudante).';
comment on column public.proyectos.presupuesto_pdf is 'Tarea de presupuestar: el PDF del presupuesto está armado. Con las cuatro tildadas, la app sugiere marcar que se mandó; el estado lo cambia el dueño.';
comment on column public.proyectos.visita_hecha is 'La visita de relevamiento ya pasó. Lo anota «Ya fui a relevar» y se corrige desde la hoja del contacto; mover la visita a un día que todavía no llegó lo apaga. No sale de la etapa: cambiar de etapa, aprobar o perder el contacto no lo toca, y la agenda muestra la visita tachada en su día (ADR 0042). Viaja a la vista del cliente: es lo que tilda el casillero del relevamiento (ADR 0058).';
comment on column public.proyectos.visita_importante is 'Marca de importante de la visita en la agenda: el círculo que el dueño hace en su cuaderno. Una columna por evento derivado; el umbral para pasar a una tabla de marcas está en el ADR 0042.';
comment on column public.proyectos.entrega_importante is 'Marca de importante de la entrega en la agenda. La entrega entregada la conserva.';
comment on column public.proyectos.presupuesto_importante is 'Marca de importante del vencimiento del presupuesto en la agenda.';
comment on column public.proyectos.sena_bp is 'La seña de este trabajo, en puntos básicos, cuando no es la del taller. Null es "la de ajustes". El dueño dijo que la seña normal es la mitad pero puede ser otra.';
comment on column public.proyectos.costo_madera_centavos is 'Lo que el dueño calcula que va a gastar en madera para este trabajo, en centavos. Null es «todavía no lo estimé», que no es lo mismo que cero. No es un gasto real ni alimenta el presupuesto: el presupuesto incluye su ganancia y la decide él (ADR 0045).';
comment on column public.proyectos.costo_herrajes_centavos is 'Lo estimado en herrajes, en centavos. Null es «todavía no lo estimé».';
comment on column public.proyectos.costo_flete_centavos is 'Lo estimado en flete, en centavos. Null es «todavía no lo estimé».';
comment on column public.proyectos.costo_ayudante_centavos is 'Lo estimado en ayudante, en centavos. Null es «todavía no lo estimé».';
comment on column public.proyectos.entrega_hora is 'A qué hora es la entrega, si tiene hora. Null es «en algún momento de ese día», como en una anotación. La agenda pone lo que tiene hora en su renglón y lo demás en la franja de todo el día (ADR 0045).';
comment on column public.proyectos.visita_hora is 'A qué hora es la visita de relevamiento, si tiene hora. Null es «en algún momento de ese día».';
comment on column public.proyectos.cobro_sena is 'Cómo se puede pagar la seña de este trabajo, o null si el dueño no lo tocó. Null no es vacío: es «vale el valor por defecto», que private.formas_de_cobro() calcula según si el taller tiene datos para transferir cargados. El check acepta exactamente tres valores, así que un pago nunca queda sin ninguna forma (ADR 0053).';
comment on column public.proyectos.cobro_saldo is 'Lo mismo para el saldo. Son dos columnas y no una porque el dueño pide la seña por transferencia y cobra el saldo en efectivo cuando termina de instalar, que es el caso que motivó esto (ADR 0053).';
comment on column public.proyectos.reparto_ya_en_la_apertura is 'El reparto de la liquidación (el diezmo y el sueldo) ya estaba en los saldos con los que arrancó la app: queda en el libro mayor con la fecha del cobro pero no mueve los tesoros. Lo escribe private.liquidar y solo con una fecha anterior a la apertura. Reabrir un cobro lo conserva para que volver a cobrarlo proponga lo mismo; reactivar un perdido lo apaga (ADR 0063).';
comment on column public.proyectos.presupuesto_vale_hasta is 'Hasta qué día vale el presupuesto que se le mandó al cliente, o null si no tiene fecha. La propone la app al marcar «Mandé el presupuesto» con los días de ajustes.presupuesto_vale_dias, y el dueño la corrige en la hoja del contacto. Viaja a la vista del cliente solo mientras el presupuesto está mandado y sin aprobar: es la fecha de «si dejás la seña antes del…», y la entrega que se le proyecta sale de ella con la cuenta de la entrega estimada, no de hoy. Pasada la fecha, la página dice que venció en vez de seguir prometiendo. guardar_proyecto la escribe solo si la clave viene en el pedido, así un bundle viejo no la borra (ADR 0067).';
comment on column public.proyectos.listo_el is 'El día en que se terminó de fabricar, o null si todavía no está listo. Es un hecho con su día, no un estado: lo anota «Ya está listo» y lo borra «Todavía no está listo». Solo existe con el trabajo aprobado, y nunca después de la entrega. Viaja a la vista del cliente como fechas.listo (ADR 0071).';
comment on column public.proyectos.entrega_comprometida is 'La entrega comprometida: el día que se acordó con el cliente, porque el dueño lo confirmó o porque el cliente aceptó el día que le propusieron. Existe con el trabajo aprobado; volver a una consulta la limpia. Mientras el trabajo está en curso viaja a la vista del cliente, que la lee como «Entrega confirmada». Cada cambio queda en public.cambios_de_fecha (ADR 0071).';
comment on column public.proyectos.entrega_comprometida_franja is 'A la mañana o a la tarde, si la entrega comprometida tiene franja. Solo con su día (ADR 0071).';
comment on column public.proyectos.tipo_de_proyecto is 'Qué clase de trabajo es («Cocina», «Placard»), en palabras del dueño: un texto libre de 1 a 60 caracteres, sin espacios en los bordes, o null. Agrupa el analítico de entregas sin mayúsculas ni acentos. No viaja al cliente (ADR 0071).';
comment on column public.proyectos.dist_fila_version is 'Congelado al liquidar por la fila: la revisión de la fila con la que se repartió (0 para la fila de siempre armada con la foto de una reapertura de antes). Null en una liquidación por el camino de antes (ADR 0078).';
comment on column public.proyectos.dist_fila is 'Congelado al liquidar por la fila: la fila con la que se repartió, la guardada o la de siempre armada en ese momento. Reabrir el cobro la pasa a reapertura_fila, y volver a cobrarlo reparte con ella.';
comment on column public.proyectos.dist_previo is 'Congelado al liquidar por la fila: lo que cada tesoro de un paso llevaba del mes según la base, {tesoro_id: centavos}. Si no es lo que mandó la app, la liquidación salió ajustada: la app lo ve comparando esto con lo que mandó.';
comment on column public.proyectos.reapertura_fila is 'La fila del cobro por la fila que se reabrió, {version, fila}. Volver a cobrarlo reparte con ella y no con la fila de hoy (ADR 0003), salvo el sueldo: si la foto lo traía por trabajo y el taller ya lo reparte por mes, va por mes (ADR 0079). Una app sin actualizar no puede volver a cobrarlo (MN025). La limpia la liquidación siguiente.';
CREATE INDEX proyectos_household_actualizado ON public.proyectos USING btree (household_id, updated_at);
CREATE INDEX proyectos_household_cliente ON public.proyectos USING btree (household_id, cliente_id);
CREATE INDEX proyectos_liquidados_por_mes ON public.proyectos USING btree (household_id, fecha_cobro) WHERE (fecha_cobro IS NOT NULL);
CREATE TRIGGER anotar_el_cambio_de_estado AFTER INSERT OR UPDATE OF estado ON proyectos FOR EACH ROW EXECUTE FUNCTION private.anotar_el_cambio_de_estado();
CREATE TRIGGER anotar_los_cambios_de_fecha AFTER INSERT OR UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION private.anotar_los_cambios_de_fecha();
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER borrar_hijos AFTER UPDATE OF deleted_at ON proyectos FOR EACH ROW WHEN (new.deleted_at IS NOT NULL AND old.deleted_at IS NULL) EXECUTE FUNCTION private.borrar_hijos_de_proyecto();
CREATE TRIGGER cerrar_el_contacto_pendiente AFTER UPDATE OF estado ON proyectos FOR EACH ROW WHEN (old.estado = 'en_seguimiento'::estado_proyecto AND new.estado IS DISTINCT FROM old.estado) EXECUTE FUNCTION private.cerrar_el_contacto_pendiente();
CREATE TRIGGER cerrar_la_propuesta_de_entrega AFTER UPDATE ON proyectos FOR EACH ROW WHEN (new.entrega_comprometida IS NOT NULL OR new.estado <> 'en_curso'::estado_proyecto OR new.listo_el IS NULL) EXECUTE FUNCTION private.cerrar_la_propuesta_de_entrega();
CREATE TRIGGER cuidar_las_fechas_de_la_entrega BEFORE INSERT OR UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION private.cuidar_las_fechas_de_la_entrega();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
CREATE CONSTRAINT TRIGGER presupuesto_aprobado AFTER INSERT OR UPDATE ON proyectos DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.validar_presupuesto_aprobado();
CREATE CONSTRAINT TRIGGER seguimiento_con_su_contacto AFTER INSERT OR UPDATE OF estado, deleted_at ON proyectos DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION private.revisar_el_seguimiento_del_proyecto();
CREATE TRIGGER validar_proyecto BEFORE INSERT OR UPDATE ON proyectos FOR EACH ROW EXECUTE FUNCTION private.validar_proyecto();
alter table public.proyectos enable row level security;
create policy proyectos_alta on public.proyectos as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy proyectos_edicion on public.proyectos as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy proyectos_lectura on public.proyectos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.proyectos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.proyectos to service_role;
grant insert (id, cliente_id, titulo, descripcion, estado, presupuesto_centavos, forma_pago, comprobante, fecha_visita, ultimo_contacto, fecha_inicio, entrega_estimada, fecha_entrega, direccion_entrega, notas, deleted_at, vencimiento_presupuesto, presupuesto_diseno, presupuesto_despiece, presupuesto_cotizacion, presupuesto_pdf, visita_hecha, visita_importante, entrega_importante, presupuesto_importante, sena_bp, entrega_hora, visita_hora, presupuesto_vale_hasta, listo_el, entrega_comprometida, entrega_comprometida_franja, tipo_de_proyecto) on public.proyectos to authenticated;
grant update (id, cliente_id, titulo, descripcion, estado, presupuesto_centavos, forma_pago, comprobante, fecha_visita, ultimo_contacto, fecha_inicio, entrega_estimada, fecha_entrega, direccion_entrega, notas, deleted_at, vencimiento_presupuesto, presupuesto_diseno, presupuesto_despiece, presupuesto_cotizacion, presupuesto_pdf, visita_hecha, visita_importante, entrega_importante, presupuesto_importante, sena_bp, costo_madera_centavos, costo_herrajes_centavos, costo_flete_centavos, costo_ayudante_centavos, entrega_hora, visita_hora, cobro_sena, cobro_saldo, presupuesto_vale_hasta, listo_el, entrega_comprometida, entrega_comprometida_franja, tipo_de_proyecto) on public.proyectos to authenticated;

create table public.renglones_de_respuesta (
  id uuid not null default private.uuidv7(),
  household_id uuid not null,
  respuesta_id uuid not null,
  pregunta_id uuid not null,
  tipo tipo_de_pregunta not null,
  cantidad_de_opciones smallint not null,
  pregunta_texto text not null,
  valor_numero smallint,
  valor_opciones smallint[],
  valor_texto text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint renglones_de_respuesta_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint renglones_de_respuesta_pkey PRIMARY KEY (id),
  constraint renglones_de_respuesta_pregunta_fk FOREIGN KEY (household_id, pregunta_id, tipo, cantidad_de_opciones) REFERENCES preguntas(household_id, id, tipo, cantidad_de_opciones),
  constraint renglones_de_respuesta_respuesta_fk FOREIGN KEY (household_id, respuesta_id) REFERENCES respuestas(household_id, id),
  constraint renglones_de_respuesta_una_por_pregunta UNIQUE (respuesta_id, pregunta_id),
  constraint renglones_de_respuesta_valor_segun_tipo CHECK (COALESCE(
CASE tipo
    WHEN 'escala5'::tipo_de_pregunta THEN valor_numero >= 1 AND valor_numero <= 5 AND valor_opciones IS NULL AND valor_texto IS NULL
    WHEN 'sitalvezno'::tipo_de_pregunta THEN valor_numero >= 1 AND valor_numero <= 3 AND valor_opciones IS NULL AND valor_texto IS NULL
    WHEN 'una'::tipo_de_pregunta THEN valor_numero >= 0 AND valor_numero < cantidad_de_opciones AND valor_opciones IS NULL AND valor_texto IS NULL
    WHEN 'varias'::tipo_de_pregunta THEN valor_numero IS NULL AND valor_texto IS NULL AND private.opciones_elegidas_validas(valor_opciones, cantidad_de_opciones)
    WHEN 'texto'::tipo_de_pregunta THEN valor_numero IS NULL AND valor_opciones IS NULL AND valor_texto ~ '[^ \t\n\r\f\v]'::text AND char_length(valor_texto) <= 2000
    ELSE NULL::boolean
END, false))
);
comment on table public.renglones_de_respuesta is 'Un renglón por pregunta contestada: a qué pregunta, con qué valor. La pregunta es la versión exacta que se contestó, así que cambiarle el sentido después no la mueve. Los escribe public.contestar_encuesta(); el dueño solo los lee.';
comment on column public.renglones_de_respuesta.household_id is 'Sin default: la fila la escribe la función pública.';
comment on column public.renglones_de_respuesta.tipo is 'El tipo de la pregunta contestada. La foreign key lo ata al de la pregunta.';
comment on column public.renglones_de_respuesta.cantidad_de_opciones is 'Cuántas opciones tenía la pregunta. La foreign key lo ata al de la pregunta y el check no deja elegir una que no existe.';
comment on column public.renglones_de_respuesta.pregunta_texto is 'El texto tal como se preguntó. Si después se redacta mejor, la respuesta sigue diciendo lo que el cliente leyó.';
comment on column public.renglones_de_respuesta.valor_numero is 'Escala: de 1 a 5. Sí / tal vez / no: 3 es sí, 2 tal vez, 1 no. Una opción: la posición de la elegida, desde 0.';
comment on column public.renglones_de_respuesta.valor_opciones is 'Varias opciones: las posiciones elegidas, desde 0, sin repetir.';
comment on column public.renglones_de_respuesta.valor_texto is 'Texto libre, sin blancos al principio ni al final, hasta 2000 caracteres.';
CREATE INDEX renglones_de_respuesta_household_actualizado ON public.renglones_de_respuesta USING btree (household_id, updated_at);
CREATE INDEX renglones_de_respuesta_household_pregunta ON public.renglones_de_respuesta USING btree (household_id, pregunta_id, tipo, cantidad_de_opciones);
CREATE INDEX renglones_de_respuesta_household_respuesta ON public.renglones_de_respuesta USING btree (household_id, respuesta_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON renglones_de_respuesta FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON renglones_de_respuesta FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.renglones_de_respuesta enable row level security;
create policy renglones_de_respuesta_lectura on public.renglones_de_respuesta as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.renglones_de_respuesta to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.renglones_de_respuesta to service_role;

create table public.repartos (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  proyecto_id uuid not null,
  posicion smallint not null,
  tesoro_id uuid not null,
  nombre text not null,
  tipo text not null,
  clase text,
  objetivo_centavos bigint,
  previo_centavos bigint,
  tope_centavos bigint,
  por_mes boolean,
  porcentaje_bp integer,
  monto_centavos bigint not null,
  fecha date not null,
  ya_en_la_apertura boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  modo text,
  base text,
  constraint repartos_forma_segun_tipo CHECK (COALESCE(
CASE tipo
    WHEN 'obligacion'::text THEN porcentaje_bp >= 1 AND porcentaje_bp <= 10000 AND (base = ANY (ARRAY['cobrado'::text, 'ingreso'::text])) AND clase IS NULL AND modo IS NULL AND objetivo_centavos IS NULL AND previo_centavos IS NULL AND tope_centavos IS NULL AND por_mes IS NULL
    WHEN 'paso'::text THEN (clase = ANY (ARRAY['sueldo'::text, 'fijos'::text, 'prioridad'::text])) AND
    CASE clase
        WHEN 'sueldo'::text THEN COALESCE(modo, 'mes'::text) = 'mes'::text
        WHEN 'fijos'::text THEN COALESCE(modo, 'mes'::text) = ANY (ARRAY['mes'::text, 'saldo'::text])
        ELSE COALESCE(modo, 'mes'::text) = ANY (ARRAY['mes'::text, 'saldo'::text, 'trabajo'::text])
    END AND objetivo_centavos >= 0 AND previo_centavos >= 0 AND tope_centavos >= 0 AND por_mes IS NOT NULL AND porcentaje_bp IS NULL AND base IS NULL AND monto_centavos <= tope_centavos
    WHEN 'parte'::text THEN porcentaje_bp >= 1 AND porcentaje_bp <= 10000 AND (tope_centavos IS NULL OR tope_centavos >= 0 AND monto_centavos <= tope_centavos) AND clase IS NULL AND modo IS NULL AND base IS NULL AND objetivo_centavos IS NULL AND previo_centavos IS NULL AND por_mes IS NULL
    WHEN 'superavit'::text THEN clase IS NULL AND modo IS NULL AND base IS NULL AND objetivo_centavos IS NULL AND previo_centavos IS NULL AND tope_centavos IS NULL AND por_mes IS NULL AND porcentaje_bp IS NULL
    ELSE NULL::boolean
END, false)),
  constraint repartos_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint repartos_monto_no_negativo CHECK (monto_centavos >= 0),
  constraint repartos_nombre_valido CHECK (char_length(nombre) >= 1 AND char_length(nombre) <= 200),
  constraint repartos_pkey PRIMARY KEY (id),
  constraint repartos_posicion_valida CHECK (posicion >= 1),
  constraint repartos_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint repartos_tesoro_fk FOREIGN KEY (household_id, tesoro_id) REFERENCES tesoros(household_id, id)
);
comment on table public.repartos is 'Lo que recibió cada tesoro en una liquidación por la fila: una fila por obligación que no es el diezmo, por paso, por parte y por el superávit si no es Maun, en ese orden y con los ids que manda la app. Es parte de la distribución congelada (ADR 0003): reabrir el cobro las borra lógicamente y volver a cobrar escribe otras. La escriben private.liquidar() y private.revertir_liquidacion(); la app solo lee (ADR 0078).';
comment on column public.repartos.id is 'El UUIDv7 que manda la app en el pedido, así la fila optimista y la de la base son la misma.';
comment on column public.repartos.household_id is 'Default: el household del usuario de la sesión.';
comment on column public.repartos.posicion is 'El lugar en la liquidación, desde 1: las obligaciones que no son el diezmo, los pasos en el orden de la fila, las partes del reparto y el superávit si no es Maun.';
comment on column public.repartos.tesoro_id is 'El tesoro que recibió.';
comment on column public.repartos.nombre is 'El nombre del tesoro al liquidar: el reparto lo sigue mostrando aunque después se renombre o se archive.';
comment on column public.repartos.tipo is 'obligacion (un porcentaje de lo cobrado o del ingreso, salvo el diezmo, que va a dist_diezmo_* del proyecto), paso (un compromiso o un ahorro fijo, que se llena hasta su tope), parte (un porcentaje de lo que sobra, con tope si va hasta la meta) o superavit (lo que queda, cuando no es Maun).';
comment on column public.repartos.clase is 'En un paso, sueldo, fijos o prioridad; en los demás tipos, null.';
comment on column public.repartos.objetivo_centavos is 'En un paso, su monto según la fila (cero para el sueldo de un perdido sin sueldo).';
comment on column public.repartos.previo_centavos is 'En un paso, lo que llevaba según su modo antes de esta liquidación, con el piso de su meta: lo del mes, su saldo o cero. Es el previo que entró a la cuenta.';
comment on column public.repartos.tope_centavos is 'En un paso, lo que le faltaba (el objetivo entero si no va por mes). En una parte que va hasta la meta, lo que le faltaba para la meta; null si junta sin fin.';
comment on column public.repartos.por_mes is 'En un paso, si su tope descuenta lo que ya lleva: true en los tres modos, false solo en el sueldo de la fila de siempre de un taller que paga por trabajo.';
comment on column public.repartos.porcentaje_bp is 'En una obligación o una parte, su porcentaje en puntos básicos.';
comment on column public.repartos.monto_centavos is 'Lo que pasó de Maun a este tesoro. En Maun (un paso de gastos fijos) queda donde estaba.';
comment on column public.repartos.fecha is 'La fecha de la liquidación, la del cobro o la del cierre: define el mes de los topes.';
comment on column public.repartos.ya_en_la_apertura is 'El reparto ya estaba en los saldos con los que arrancó la app: queda en el libro y no mueve los tesoros (ADR 0063).';
comment on column public.repartos.modo is 'En un paso, cómo se llena: mes (hasta su monto en cada mes del calendario), saldo (junta hasta tener su monto de saldo: se renueva al pagar en un compromiso, se repone al usarlo en un ahorro fijo) o trabajo (su monto en cada cobro, solo en un ahorro fijo). Null en los pasos que se liquidaron antes de que existiera, que fueron por mes, y en los demás tipos (ADR 0078).';
comment on column public.repartos.base is 'En una obligación, sobre qué se calcula su porcentaje: cobrado (todo lo que entró del trabajo, como Ingresos Brutos) o ingreso (lo que llega después de las obligaciones de arriba). Null en los demás tipos.';
CREATE INDEX repartos_household_actualizado ON public.repartos USING btree (household_id, updated_at);
CREATE INDEX repartos_household_fecha ON public.repartos USING btree (household_id, fecha) WHERE (deleted_at IS NULL);
CREATE INDEX repartos_household_proyecto ON public.repartos USING btree (household_id, proyecto_id);
CREATE INDEX repartos_household_tesoro ON public.repartos USING btree (household_id, tesoro_id);
CREATE UNIQUE INDEX repartos_un_lugar_por_proyecto ON public.repartos USING btree (proyecto_id, posicion) WHERE (deleted_at IS NULL);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON repartos FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON repartos FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.repartos enable row level security;
create policy repartos_lectura on public.repartos as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.repartos to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.repartos to service_role;

create table public.respuestas (
  id uuid not null default private.uuidv7(),
  household_id uuid not null,
  encuesta_id uuid not null,
  contestada_at timestamp with time zone not null default now(),
  leida_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint respuestas_encuesta_fk FOREIGN KEY (household_id, encuesta_id) REFERENCES encuestas_enviadas(household_id, id),
  constraint respuestas_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint respuestas_household_id_key UNIQUE (household_id, id),
  constraint respuestas_pkey PRIMARY KEY (id),
  constraint respuestas_una_por_encuesta UNIQUE (household_id, encuesta_id)
);
comment on table public.respuestas is 'Lo que contestó un cliente: una por encuesta enviada, y nunca otra. La escribe public.contestar_encuesta(), que corre elevada; el dueño no tiene grant de insert y lo único que escribe es leida_at (ADR 0057).';
comment on column public.respuestas.household_id is 'Sin default: la fila la escribe la función pública, que no tiene sesión, y pone el household de la encuesta.';
comment on column public.respuestas.contestada_at is 'Cuándo contestó. La pone la base.';
comment on column public.respuestas.leida_at is 'Cuándo la leyó el dueño, o null si todavía no. Es del dueño y se escribe por la cola como cualquier otra cosa suya.';
comment on column public.respuestas.deleted_at is 'Borrado lógico. Solo lo pone el borrado del trabajo.';
CREATE INDEX respuestas_household_actualizado ON public.respuestas USING btree (household_id, updated_at);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON respuestas FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON respuestas FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.respuestas enable row level security;
create policy respuestas_edicion on public.respuestas as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy respuestas_lectura on public.respuestas as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.respuestas to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.respuestas to service_role;
grant update (leida_at) on public.respuestas to authenticated;

create table public.respuestas_de_entrega (
  id uuid not null default private.uuidv7(),
  household_id uuid not null,
  proyecto_id uuid not null,
  propuesta_id uuid not null,
  respuesta respuesta_de_entrega not null,
  dias jsonb not null default '[]'::jsonb,
  nota text not null default ''::text,
  leida_at timestamp with time zone,
  created_at timestamp with time zone not null default clock_timestamp(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint respuestas_de_entrega_dias_es_una_lista CHECK (jsonb_typeof(dias) = 'array'::text AND jsonb_array_length(dias) <= 10),
  constraint respuestas_de_entrega_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint respuestas_de_entrega_me_queda_bien_sola CHECK (respuesta <> 'me_queda_bien'::respuesta_de_entrega OR dias = '[]'::jsonb AND nota = ''::text),
  constraint respuestas_de_entrega_nota_valida CHECK (char_length(nota) <= 500),
  constraint respuestas_de_entrega_pkey PRIMARY KEY (id),
  constraint respuestas_de_entrega_propuesta_fk FOREIGN KEY (household_id, proyecto_id, propuesta_id) REFERENCES propuestas_de_entrega(household_id, proyecto_id, id)
);
comment on table public.respuestas_de_entrega is 'Lo que contestó el cliente a una propuesta de entrega desde su página: que el día propuesto le queda bien, o los días y las franjas que le quedan bien, con una nota. La escribe public.responder_la_entrega(), que corre elevada; el dueño no tiene grant de insert y lo único que escribe es leida_at. Hasta 20 por propuesta: el cliente puede cambiar sus días (ADR 0071).';
comment on column public.respuestas_de_entrega.household_id is 'Sin default: la fila la escribe la función pública, que no tiene sesión, y pone el household del enlace.';
comment on column public.respuestas_de_entrega.dias is 'Los días que le quedan bien, en orden: una lista de {fecha, franjas}, con franjas manana y tarde. Vacía con me_queda_bien, y con mis_dias si lo dijo todo en la nota.';
comment on column public.respuestas_de_entrega.nota is 'Lo que hay que saber para la entrega, en palabras del cliente: el piso, la escalera, quién lo recibe. Hasta 500 caracteres, sin blancos en las puntas.';
comment on column public.respuestas_de_entrega.leida_at is 'Cuándo la leyó el dueño, o null si todavía no. Es del dueño y se escribe por la cola como cualquier otra cosa suya.';
comment on column public.respuestas_de_entrega.deleted_at is 'Borrado lógico. Solo lo pone el borrado del trabajo.';
CREATE INDEX respuestas_de_entrega_household_actualizado ON public.respuestas_de_entrega USING btree (household_id, updated_at);
CREATE INDEX respuestas_de_entrega_household_propuesta ON public.respuestas_de_entrega USING btree (household_id, proyecto_id, propuesta_id, created_at);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON respuestas_de_entrega FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON respuestas_de_entrega FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.respuestas_de_entrega enable row level security;
create policy respuestas_de_entrega_edicion on public.respuestas_de_entrega as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy respuestas_de_entrega_lectura on public.respuestas_de_entrega as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.respuestas_de_entrega to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.respuestas_de_entrega to service_role;
grant update (leida_at) on public.respuestas_de_entrega to authenticated;

create table public.revisiones_del_presupuesto (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  presupuesto_id uuid not null,
  proyecto_id uuid not null,
  revision integer not null,
  numero text not null,
  mandado_el date not null,
  vale_hasta date,
  que_cambio text,
  contenido jsonb not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint revisiones_del_presupuesto_contenido_es_un_objeto CHECK (jsonb_typeof(contenido) = 'object'::text),
  constraint revisiones_del_presupuesto_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint revisiones_del_presupuesto_numero_formato CHECK (numero ~ '^[0-9]{8}-[0-9]{2,}$'::text),
  constraint revisiones_del_presupuesto_pkey PRIMARY KEY (id),
  constraint revisiones_del_presupuesto_presupuesto_fk FOREIGN KEY (household_id, presupuesto_id) REFERENCES presupuestos(household_id, id),
  constraint revisiones_del_presupuesto_proyecto_fk FOREIGN KEY (household_id, proyecto_id) REFERENCES proyectos(household_id, id),
  constraint revisiones_del_presupuesto_que_cambio_largo CHECK (que_cambio IS NULL OR char_length(que_cambio) <= 280),
  constraint revisiones_del_presupuesto_revision_unica UNIQUE (household_id, presupuesto_id, revision),
  constraint revisiones_del_presupuesto_revision_valida CHECK (revision >= 1)
);
comment on table public.revisiones_del_presupuesto is 'Cada envío del presupuesto, congelado: la foto completa del documento que vio el cliente, con su número, su revisión y su día, que nadie edita después. Es la regla de lo que se mandó lleva su foto (ADR 0057): cambiar el borrador o la plantilla no cambia lo mandado, y el PDF de una revisión se rehace igual. La escribe solo public.mandar_el_presupuesto(); la app no tiene grant de insert ni de update. ARCA pide conservar los presupuestos dos años: no se borra, salvo con su trabajo (ADR 0080).';
comment on column public.revisiones_del_presupuesto.id is 'El UUIDv7 que manda la app al mandarlo: con él la base reconoce el reenvío de la cola y no congela dos veces.';
comment on column public.revisiones_del_presupuesto.household_id is 'Default: el household del usuario de la sesión. public.mandar_el_presupuesto() lo pone explícito.';
comment on column public.revisiones_del_presupuesto.revision is 'Desde 1, una más por cada envío del mismo presupuesto. Después de aprobado no hay revisiones (MN028).';
comment on column public.revisiones_del_presupuesto.numero is 'El número del presupuesto, el mismo en todas sus revisiones.';
comment on column public.revisiones_del_presupuesto.mandado_el is 'El día del envío, que manda la app y no puede ser posterior a hoy en el taller (MN033).';
comment on column public.revisiones_del_presupuesto.vale_hasta is 'Hasta cuándo valía este envío, para la historia, o null si se mandó sin vencimiento. La vigencia viva es la del trabajo, proyectos.presupuesto_vale_hasta, que el dueño puede extender.';
comment on column public.revisiones_del_presupuesto.que_cambio is 'Lo que cambió desde la revisión anterior, en palabras del dueño y sin blancos en las puntas: obligatorio desde la segunda, de hasta 280 caracteres; null en la primera. El cliente lo ve arriba del presupuesto.';
comment on column public.revisiones_del_presupuesto.contenido is 'El DocumentoDelPresupuesto de @maun/domain tal como se mandó: los textos con sus huecos completados, los importes, la seña, lo pagado hasta ese día (abonado), los datos del taller y el nombre del cliente. Lo arma la app, y la base valida su forma (private.problema_del_documento()) y compara sus importes con los del trabajo antes de congelarlo.';
comment on column public.revisiones_del_presupuesto.deleted_at is 'Se borra solo con su trabajo, por private.borrar_el_presupuesto_del_trabajo().';
CREATE INDEX revisiones_del_presupuesto_household_actualizado ON public.revisiones_del_presupuesto USING btree (household_id, updated_at);
CREATE INDEX revisiones_del_presupuesto_household_proyecto ON public.revisiones_del_presupuesto USING btree (household_id, proyecto_id);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON revisiones_del_presupuesto FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON revisiones_del_presupuesto FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.revisiones_del_presupuesto enable row level security;
create policy revisiones_del_presupuesto_lectura on public.revisiones_del_presupuesto as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.revisiones_del_presupuesto to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.revisiones_del_presupuesto to service_role;

create table public.tesoros (
  id uuid not null default private.uuidv7(),
  household_id uuid not null default private.household_actual(),
  clave tesoro,
  nombre text not null,
  descripcion text not null default ''::text,
  tinta text not null,
  icono text not null,
  meta_centavos bigint,
  rinde_anual_bp integer,
  orden integer not null default 0,
  archivado_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  deleted_at timestamp with time zone,
  version integer not null default 1,
  constraint tesoros_descripcion_largo CHECK (char_length(descripcion) <= 80),
  constraint tesoros_household_id_fkey FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE,
  constraint tesoros_household_id_key UNIQUE (household_id, id),
  constraint tesoros_icono_valido CHECK (icono ~ '^[a-z0-9-]{1,40}$'::text),
  constraint tesoros_los_de_siempre_no_se_archivan CHECK (archivado_at IS NULL OR clave IS NULL),
  constraint tesoros_meta_no_negativa CHECK (meta_centavos IS NULL OR meta_centavos >= 0),
  constraint tesoros_meta_solo_de_los_propios CHECK (clave IS NULL OR meta_centavos IS NULL AND rinde_anual_bp IS NULL),
  constraint tesoros_nombre_valido CHECK (char_length(btrim(nombre)) >= 1 AND char_length(btrim(nombre)) <= 24),
  constraint tesoros_pkey PRIMARY KEY (id),
  constraint tesoros_rinde_valido CHECK (rinde_anual_bp IS NULL OR rinde_anual_bp >= 0 AND rinde_anual_bp <= 100000),
  constraint tesoros_tinta_valida CHECK (tinta = ANY (ARRAY['hogar'::text, 'maun'::text, 'diezmo'::text, 'cocos'::text, 'grana'::text, 'mostaza'::text, 'petroleo'::text, 'ciruela'::text]))
);
comment on table public.tesoros is 'Los tesoros del taller: los cuatro de siempre (con su clave del enum public.tesoro) y los que arma el dueño (sin clave). Cada cobro reparte su ganancia entre ellos según la fila de ajustes.fila (ADR 0078). Un tesoro no se borra: se archiva, y sigue apareciendo con su nombre en los repartos que ya hizo.';
comment on column public.tesoros.id is 'UUIDv7 que genera la app al crearlo; en los cuatro del sistema, private.uuidv7() al sembrarlos.';
comment on column public.tesoros.household_id is 'Default: el household del usuario de la sesión. El cliente de la app no lo manda.';
comment on column public.tesoros.clave is 'hogar, maun, diezmo o cocos en los cuatro del sistema; null en los del dueño. Es el puente con las columnas de siempre (movimientos.tesoro_origen y tesoro_destino, los dist_* de proyectos) y con las apps sin actualizar. No tiene grant: la escribe private.sembrar_los_tesoros().';
comment on column public.tesoros.nombre is 'Cómo lo llama el dueño, de 1 a 24 caracteres sin contar los blancos de los bordes.';
comment on column public.tesoros.descripcion is 'Para qué es, hasta 80 caracteres. Opcional.';
comment on column public.tesoros.tinta is 'Una de las ocho tintas de tesoro de @maun/ui. Dos tesoros pueden compartirla: se distinguen por el nombre y el ícono.';
comment on column public.tesoros.icono is 'El nombre de un ícono de lucide. La app cae a vault si no lo conoce.';
comment on column public.tesoros.meta_centavos is 'La meta de ahorro de un tesoro del dueño, o null. En los cuatro del sistema es null: la meta de Cocos sigue en ajustes.meta_cocos_centavos, que es donde la leen las apps sin actualizar.';
comment on column public.tesoros.rinde_anual_bp is 'El rinde anual estimado de un tesoro del dueño, en puntos básicos, o null. En los cuatro del sistema es null: el de Cocos sigue en ajustes.tasa_cocos_anual_bp.';
comment on column public.tesoros.orden is 'El orden en que se muestran los tesoros del dueño, después de los cuatro de siempre. No es el orden de la fila: ese vive en ajustes.fila.';
comment on column public.tesoros.archivado_at is 'Cuándo se archivó, o null. Un tesoro archivado no entra en la fila, no se elige para mover plata y sigue en los repartos que ya hizo. Los cuatro del sistema no se archivan.';
CREATE INDEX tesoros_household_actualizado ON public.tesoros USING btree (household_id, updated_at);
CREATE UNIQUE INDEX tesoros_una_clave_por_taller ON public.tesoros USING btree (household_id, clave) WHERE (clave IS NOT NULL);
CREATE TRIGGER avisar_los_cambios AFTER INSERT OR DELETE OR UPDATE ON tesoros FOR EACH ROW EXECUTE FUNCTION private.avisar_los_cambios('household_id');
CREATE TRIGGER cuidar_el_archivo BEFORE UPDATE OF archivado_at ON tesoros FOR EACH ROW EXECUTE FUNCTION private.cuidar_el_archivo_del_tesoro();
CREATE TRIGGER metadatos BEFORE INSERT OR UPDATE ON tesoros FOR EACH ROW EXECUTE FUNCTION private.mantener_metadatos();
alter table public.tesoros enable row level security;
create policy tesoros_alta on public.tesoros as permissive
  for insert to authenticated
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy tesoros_edicion on public.tesoros as permissive
  for update to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))))
  with check ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
create policy tesoros_lectura on public.tesoros as permissive
  for select to authenticated
  using ((household_id = ANY (ARRAY( SELECT private.user_household_ids() AS user_household_ids))));
grant select on public.tesoros to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.tesoros to service_role;
grant insert (id, nombre, descripcion, tinta, icono, meta_centavos, rinde_anual_bp, orden, archivado_at) on public.tesoros to authenticated;
grant update (id, nombre, descripcion, tinta, icono, meta_centavos, rinde_anual_bp, orden, archivado_at) on public.tesoros to authenticated;


-- Vistas -----------------------------------------------------------------------------------------

create view public.libro_mayor with (security_invoker=true) as
 SELECT m.household_id,
    'manual'::text AS origen,
    m.id AS asiento_id,
    m.fecha,
    m.tesoro_destino AS tesoro,
    m.tesoro_origen AS contrapartida,
    m.monto_centavos,
    m.tipo::text AS concepto,
    m.categoria,
    m.descripcion,
    m.proyecto_id,
    false AS ya_en_la_apertura,
    m.hacia_id AS tesoro_id,
    m.desde_id AS contrapartida_id
   FROM movimientos m
  WHERE m.deleted_at IS NULL AND m.hacia_id IS NOT NULL
UNION ALL
 SELECT m.household_id,
    'manual'::text AS origen,
    m.id AS asiento_id,
    m.fecha,
    m.tesoro_origen AS tesoro,
    m.tesoro_destino AS contrapartida,
    - m.monto_centavos AS monto_centavos,
    m.tipo::text AS concepto,
    m.categoria,
    m.descripcion,
    m.proyecto_id,
    false AS ya_en_la_apertura,
    m.desde_id AS tesoro_id,
    m.hacia_id AS contrapartida_id
   FROM movimientos m
  WHERE m.deleted_at IS NULL AND m.desde_id IS NOT NULL
UNION ALL
 SELECT pg.household_id,
    'pago'::text AS origen,
    pg.id AS asiento_id,
    pg.fecha,
    'maun'::tesoro AS tesoro,
    NULL::tesoro AS contrapartida,
    pg.monto_centavos,
    'cobro'::text AS concepto,
    'Cobro'::text AS categoria,
    pg.concepto AS descripcion,
    pg.proyecto_id,
    pg.ya_en_la_apertura,
    tm.id AS tesoro_id,
    NULL::uuid AS contrapartida_id
   FROM pagos pg
     JOIN proyectos p ON p.household_id = pg.household_id AND p.id = pg.proyecto_id
     LEFT JOIN tesoros tm ON tm.household_id = pg.household_id AND tm.clave = 'maun'::tesoro
  WHERE pg.deleted_at IS NULL AND p.deleted_at IS NULL
UNION ALL
 SELECT g.household_id,
    'gasto_proyecto'::text AS origen,
    g.id AS asiento_id,
    g.fecha,
    'maun'::tesoro AS tesoro,
    NULL::tesoro AS contrapartida,
    - g.monto_centavos AS monto_centavos,
    'gasto'::text AS concepto,
    'Materiales'::text AS categoria,
    g.descripcion,
    g.proyecto_id,
    false AS ya_en_la_apertura,
    tm.id AS tesoro_id,
    NULL::uuid AS contrapartida_id
   FROM gastos g
     JOIN proyectos p ON p.household_id = g.household_id AND p.id = g.proyecto_id
     LEFT JOIN tesoros tm ON tm.household_id = g.household_id AND tm.clave = 'maun'::tesoro
  WHERE g.deleted_at IS NULL AND p.deleted_at IS NULL
UNION ALL
 SELECT p.household_id,
    'distribucion'::text AS origen,
    p.id AS asiento_id,
    p.fecha_cobro AS fecha,
    d.tesoro,
    d.contrapartida,
    d.monto_centavos,
    d.concepto,
    'Distribución'::text AS categoria,
    p.titulo AS descripcion,
    p.id AS proyecto_id,
    p.reparto_ya_en_la_apertura AS ya_en_la_apertura,
    t.id AS tesoro_id,
    c.id AS contrapartida_id
   FROM proyectos p
     CROSS JOIN LATERAL ( VALUES ('diezmo'::tesoro,'maun'::tesoro,p.dist_diezmo_centavos,'diezmo'::text), ('maun'::tesoro,'diezmo'::tesoro,- p.dist_diezmo_centavos,'diezmo'::text), ('hogar'::tesoro,'maun'::tesoro,p.dist_sueldo_centavos,'sueldo'::text), ('maun'::tesoro,'hogar'::tesoro,- p.dist_sueldo_centavos,'sueldo'::text)) d(tesoro, contrapartida, monto_centavos, concepto)
     LEFT JOIN tesoros t ON t.household_id = p.household_id AND t.clave = d.tesoro
     LEFT JOIN tesoros c ON c.household_id = p.household_id AND c.clave = d.contrapartida
  WHERE (p.estado = ANY (ARRAY['cobrado'::estado_proyecto, 'perdido'::estado_proyecto])) AND p.deleted_at IS NULL AND d.monto_centavos <> 0
UNION ALL
 SELECT r.household_id,
    'reparto'::text AS origen,
    r.id AS asiento_id,
    r.fecha,
    d.tesoro,
    d.contrapartida,
    d.monto_centavos,
    COALESCE(r.clase, 'reparto'::text) AS concepto,
    'Distribución'::text AS categoria,
    p.titulo AS descripcion,
    p.id AS proyecto_id,
    r.ya_en_la_apertura,
    d.tesoro_id,
    d.contrapartida_id
   FROM repartos r
     JOIN proyectos p ON p.household_id = r.household_id AND p.id = r.proyecto_id
     JOIN tesoros t ON t.household_id = r.household_id AND t.id = r.tesoro_id
     JOIN tesoros tm ON tm.household_id = r.household_id AND tm.clave = 'maun'::tesoro
     CROSS JOIN LATERAL ( VALUES (t.clave,'maun'::tesoro,r.monto_centavos,t.id,tm.id), ('maun'::tesoro,t.clave,- r.monto_centavos,tm.id,t.id)) d(tesoro, contrapartida, monto_centavos, tesoro_id, contrapartida_id)
  WHERE r.deleted_at IS NULL AND p.deleted_at IS NULL AND (p.estado = ANY (ARRAY['cobrado'::estado_proyecto, 'perdido'::estado_proyecto])) AND r.tesoro_id <> tm.id AND r.monto_centavos <> 0;
comment on view public.libro_mayor is 'Libro mayor por tesoro: una fila por tesoro afectado, importe con signo. tesoro_id y contrapartida_id son los tesoros por id; tesoro y contrapartida, su clave (null para los tesoros del dueño). El saldo de un tesoro es sum(monto_centavos) where tesoro_id = X and not ya_en_la_apertura: una fila ya_en_la_apertura es plata de antes de la apertura que ya estaba en los saldos con los que arrancó la app, y queda en el libro con su fecha sin mover los tesoros (ADR 0063). Los repartos de un cobro por la fila salen de public.repartos (ADR 0078).';
grant select on public.libro_mayor to authenticated;
grant delete, insert, maintain, references, select, trigger, truncate, update on public.libro_mayor to service_role;


-- Triggers sobre auth.users ----------------------------------------------------------------------

CREATE TRIGGER taller_al_confirmar_el_mail AFTER UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW WHEN (old.email_confirmed_at IS NULL AND new.email_confirmed_at IS NOT NULL) EXECUTE FUNCTION private.crear_taller_del_usuario();
CREATE TRIGGER taller_al_crear_la_cuenta AFTER INSERT ON auth.users FOR EACH ROW WHEN (new.email_confirmed_at IS NOT NULL) EXECUTE FUNCTION private.crear_taller_del_usuario();

-- Storage ----------------------------------------------------------------------------------------

-- bucket archivos: público, tope 10485760 bytes, tipos image/webp, image/jpeg, application/pdf
-- bucket fotos-de-perfil: público, tope 524288 bytes, tipos image/webp, image/jpeg
create policy archivos_borrar_los_del_taller on storage.objects as permissive
  for delete to authenticated
  using (((bucket_id = 'archivos'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (h.h)::text AS h
   FROM private.user_household_ids() h(h))))));
create policy archivos_reemplazar_los_del_taller on storage.objects as permissive
  for update to authenticated
  using (((bucket_id = 'archivos'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (h.h)::text AS h
   FROM private.user_household_ids() h(h))))))
  with check (((bucket_id = 'archivos'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (h.h)::text AS h
   FROM private.user_household_ids() h(h))))));
create policy archivos_subir_al_taller on storage.objects as permissive
  for insert to authenticated
  with check (((bucket_id = 'archivos'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (h.h)::text AS h
   FROM private.user_household_ids() h(h))))));
create policy archivos_ver_los_del_taller on storage.objects as permissive
  for select to authenticated
  using (((bucket_id = 'archivos'::text) AND ((storage.foldername(name))[1] = ANY (ARRAY( SELECT (h.h)::text AS h
   FROM private.user_household_ids() h(h))))));
comment on policy archivos_ver_los_del_taller on storage.objects is 'No es para leer los archivos (el bucket es público y se leen por URL): es para la subida con upsert, que chequea si el objeto existe con un select bajo la RLS del usuario. Sin esta política ese chequeo nunca encuentra el archivo anterior y la subida falla con un error de RLS.';
create policy fotos_de_perfil_borrar_la_propia on storage.objects as permissive
  for delete to authenticated
  using (((bucket_id = 'fotos-de-perfil'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
create policy fotos_de_perfil_reemplazar_la_propia on storage.objects as permissive
  for update to authenticated
  using (((bucket_id = 'fotos-de-perfil'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)))
  with check (((bucket_id = 'fotos-de-perfil'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
create policy fotos_de_perfil_subir_a_la_carpeta_propia on storage.objects as permissive
  for insert to authenticated
  with check (((bucket_id = 'fotos-de-perfil'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
create policy fotos_de_perfil_ver_la_propia on storage.objects as permissive
  for select to authenticated
  using (((bucket_id = 'fotos-de-perfil'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text)));
comment on policy fotos_de_perfil_ver_la_propia on storage.objects is 'No es para leer las fotos (el bucket es público y se leen por URL): es para la subida con upsert, que chequea si el objeto existe con un select bajo la RLS del usuario. Sin esta política ese chequeo nunca encuentra la foto anterior y la subida falla con un error de RLS.';

-- Realtime ---------------------------------------------------------------------------------------

create policy cambios_del_taller_escucha on realtime.messages as permissive
  for select to authenticated
  using (((extension = 'broadcast'::text) AND private.es_el_canal_de_mi_taller(( SELECT realtime.topic() AS topic))));
comment on policy cambios_del_taller_escucha on realtime.messages is 'Solo el dueño escucha el canal de cambios de su taller. Es la única autorización del canal, y alcanza porque el aviso no lleva datos: quien lo recibe sabe que algo cambió y pide el delta, que vuelve a pasar por la RLS de cada tabla. anon no tiene política, así que no se suscribe a ningún canal privado.';

-- Funciones --------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.anotar_aviso(p_suscripcion uuid, p_dia date, p_mandado boolean)
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.anotar_aviso(p_suscripcion, p_dia, p_mandado)
$function$;
-- execute: service_role:EXECUTE
comment on function anotar_aviso(uuid,date,boolean) is 'Solo para la función de borde de los avisos (service_role).';

CREATE OR REPLACE FUNCTION public.avisos_por_mandar(p_ahora timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select private.avisos_por_mandar(p_ahora)
$function$;
-- execute: service_role:EXECUTE
comment on function avisos_por_mandar(timestamp with time zone) is 'Solo para la función de borde de los avisos (service_role).';

CREATE OR REPLACE FUNCTION public.bootstrap()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'cursor', now(),
    'households', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.households t where t.deleted_at is null
    ),
    'household_members', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.household_members t where t.deleted_at is null
    ),
    'ajustes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.ajustes t where t.deleted_at is null
    ),
    'tesoros', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.tesoros t where t.deleted_at is null
    ),
    'repartos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.repartos t where t.deleted_at is null
    ),
    'clientes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.clientes t where t.deleted_at is null
    ),
    'proyectos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proyectos t where t.deleted_at is null
    ),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos t where t.deleted_at is null
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gastos t where t.deleted_at is null
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.opciones_de_presupuesto t where t.deleted_at is null
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.necesidades t where t.deleted_at is null
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proximos_contactos t where t.deleted_at is null
    ),
    'movimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.movimientos t where t.deleted_at is null
    ),
    'anotaciones', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.anotaciones t where t.deleted_at is null
    ),
    'archivos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.archivos t where t.deleted_at is null
    ),
    'enlaces_publicos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.enlaces_publicos t where t.deleted_at is null
    ),
    'preguntas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.preguntas t where t.deleted_at is null
    ),
    'encuestas_enviadas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.encuestas_enviadas t where t.deleted_at is null
    ),
    'respuestas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas t where t.deleted_at is null
    ),
    'renglones_de_respuesta', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.renglones_de_respuesta t where t.deleted_at is null
    ),
    'propuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.propuestas_de_entrega t where t.deleted_at is null
    ),
    'respuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_de_entrega t where t.deleted_at is null
    ),
    'cambios_de_fecha', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_fecha t where t.deleted_at is null
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.deleted_at is null
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.deleted_at is null
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.deleted_at is null
    )
  )
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function bootstrap() is 'Todo el household del usuario en un JSON, sin filas borradas, más el cursor para el primer delta. Es también el reconcile completo: el cliente reemplaza su copia entera con esto.';

CREATE OR REPLACE FUNCTION public.borrar_suscripcion_vencida(p_endpoint text)
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.borrar_suscripcion_vencida(p_endpoint)
$function$;
-- execute: service_role:EXECUTE
comment on function borrar_suscripcion_vencida(text) is 'Solo para la función de borde de los avisos (service_role).';

CREATE OR REPLACE FUNCTION public.cerrar_perdido(p_proyecto_id uuid, p_version integer, p_fecha date, p_cobrado_centavos bigint, p_gastos_centavos bigint, p_tope_sueldo_centavos bigint, p_tope_fijos_centavos bigint, p_diezmo_centavos bigint, p_sueldo_centavos bigint, p_fijos_centavos bigint, p_remanente_centavos bigint, p_diezmo_bp integer, p_sueldo_previo_centavos bigint DEFAULT NULL::bigint, p_fijos_previo_centavos bigint DEFAULT NULL::bigint, p_ya_en_la_apertura boolean DEFAULT false, p_fila_version integer DEFAULT NULL::integer, p_repartos jsonb DEFAULT NULL::jsonb, p_previo jsonb DEFAULT NULL::jsonb)
 RETURNS proyectos
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select *
  from private.liquidar(
    'perdido', p_proyecto_id, p_version, p_fecha, p_cobrado_centavos, p_gastos_centavos,
    p_tope_sueldo_centavos, p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos,
    p_fijos_centavos, p_remanente_centavos, p_diezmo_bp,
    p_sueldo_previo_centavos, p_fijos_previo_centavos, p_ya_en_la_apertura,
    p_fila_version, p_repartos, p_previo
  )
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function cerrar_perdido(uuid,integer,date,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,integer,bigint,bigint,boolean,integer,jsonb,jsonb) is 'RPC de cierre como perdido de un lead o de una obra que se cayó. Liquida la seña retenida como un cobro, con la fecha del cierre que manda la app. Los mismos parámetros que cobrar_proyecto, más el diezmo que vio el usuario: en un perdido es un dato de los ajustes, no una regla. Un perdido reparte con la fila de los ajustes, nunca con la foto de una reapertura. Ver private.liquidar() (ADR 0078).';

CREATE OR REPLACE FUNCTION public.cobrar_proyecto(p_proyecto_id uuid, p_version integer, p_fecha_cobro date, p_cobrado_centavos bigint, p_gastos_centavos bigint, p_tope_sueldo_centavos bigint, p_tope_fijos_centavos bigint, p_diezmo_centavos bigint, p_sueldo_centavos bigint, p_fijos_centavos bigint, p_remanente_centavos bigint, p_sueldo_previo_centavos bigint DEFAULT NULL::bigint, p_fijos_previo_centavos bigint DEFAULT NULL::bigint, p_ya_en_la_apertura boolean DEFAULT false, p_fila_version integer DEFAULT NULL::integer, p_repartos jsonb DEFAULT NULL::jsonb, p_previo jsonb DEFAULT NULL::jsonb)
 RETURNS proyectos
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select *
  from private.liquidar(
    'cobrado', p_proyecto_id, p_version, p_fecha_cobro, p_cobrado_centavos, p_gastos_centavos,
    p_tope_sueldo_centavos, p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos,
    p_fijos_centavos, p_remanente_centavos, null,
    p_sueldo_previo_centavos, p_fijos_previo_centavos, p_ya_en_la_apertura,
    p_fila_version, p_repartos, p_previo
  )
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function cobrar_proyecto(uuid,integer,date,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,boolean,integer,jsonb,jsonb) is 'RPC de cobro de un proyecto entregado. La app manda la versión del proyecto, los totales, la fecha del cobro (la del último pago por defecto, o la del cobro original si fue reabierto), la distribución que le mostró al usuario, lo del mes que vio y si ese reparto ya estaba en los saldos de la apertura. Una app actualizada manda además la revisión de la fila, sus repartos con los ids y lo que cada tesoro llevaba del mes, y los parámetros de siempre con columnasDeSiempre. Si lo del mes no es el de la base, la liquidación se congela con el de la base y la app lo ve comparando dist_previo (o dist_sueldo_previo_centavos, por el camino de antes) contra lo que mandó. Ver private.liquidar() (ADR 0078).';

CREATE OR REPLACE FUNCTION public.contestar_encuesta(p_token text, p_respuesta jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_encuesta public.encuestas_enviadas;
  v_preguntas jsonb;
  v_motivo text;
  v_existente uuid;
  v_id uuid;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  -- Bloqueada mientras se guarda: dar de baja el enlace, borrar el trabajo o mandar otra encuesta
  -- esperan a que termine, y si llegaron antes, esta vuelve a mirar la fila y ya no sirve. Sin
  -- eso, un cliente que contesta en el mismo segundo en que el dueño genera otro enlace dejaría
  -- dos respuestas para el mismo trabajo.
  select * into v_encuesta
  from public.encuestas_enviadas e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocada_at is null
    and e.deleted_at is null
  for share;

  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  if not exists (
    select 1 from public.proyectos p
    where p.household_id = v_encuesta.household_id
      and p.id = v_encuesta.proyecto_id
      and p.deleted_at is null
      and p.estado <> 'perdido'
  ) then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  -- Ya contestada: no se pisa nada. Si es el mismo envío que vuelve (la respuesta del primero se
  -- perdió en la red), se le contesta que quedó guardada; si es otro, que ya estaba.
  select r.id into v_existente
  from public.respuestas r
  where r.household_id = v_encuesta.household_id and r.encuesta_id = v_encuesta.id;

  if found then
    return jsonb_build_object(
      'estado',
      case when v_existente::text = lower(p_respuesta ->> 'id') then 'guardada' else 'ya_contestada' end
    );
  end if;

  -- Todo se valida acá, del lado de la base, y antes de escribir una sola fila: lo que no cumple
  -- se rechaza entero. El tope de tamaño deja pasar once textos de 2000 caracteres de cuatro bytes.
  if pg_column_size(p_respuesta) > 262144 then
    raise exception '%', private.motivo_del_rechazo('forma') using errcode = 'MN011', detail = 'forma';
  end if;

  v_preguntas := private.preguntas_de_la_encuesta(v_encuesta);
  v_motivo := private.validar_respuesta(v_preguntas, p_respuesta);

  if v_motivo is not null then
    raise exception '%', private.motivo_del_rechazo(v_motivo) using errcode = 'MN011', detail = v_motivo;
  end if;

  v_id := (p_respuesta ->> 'id')::uuid;

  -- Dos envíos a la vez del mismo enlace: el segundo espera en el índice único al primero, y si el
  -- primero se guarda, el segundo termina acá y contesta lo mismo que si hubiera llegado después.
  begin
    insert into public.respuestas (id, household_id, encuesta_id)
    values (v_id, v_encuesta.household_id, v_encuesta.id);
  exception
    when unique_violation then
      select r.id into v_existente
      from public.respuestas r
      where r.household_id = v_encuesta.household_id and r.encuesta_id = v_encuesta.id;

      if not found then
        raise;
      end if;

      return jsonb_build_object(
        'estado', case when v_existente = v_id then 'guardada' else 'ya_contestada' end
      );
  end;

  insert into public.renglones_de_respuesta (
    household_id, respuesta_id, pregunta_id, tipo, cantidad_de_opciones, pregunta_texto,
    valor_numero, valor_opciones, valor_texto
  )
  select
    v_encuesta.household_id,
    v_id,
    (t.r ->> 'pregunta')::uuid,
    (p ->> 'tipo')::public.tipo_de_pregunta,
    case when jsonb_typeof(p -> 'opciones') = 'array' then jsonb_array_length(p -> 'opciones') else 0 end,
    p ->> 'texto',
    case when p ->> 'tipo' in ('escala5', 'sitalvezno', 'una') then (t.r -> 'valor')::numeric::smallint end,
    case
      when p ->> 'tipo' = 'varias' then (
        select array_agg(e::numeric::smallint order by e::numeric)
        from jsonb_array_elements(t.r -> 'valor') as e
      )
    end,
    case
      when p ->> 'tipo' = 'texto'
        then regexp_replace(t.r ->> 'valor', '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')
    end
  from jsonb_array_elements(p_respuesta -> 'renglones') with ordinality as t (r, orden)
  join jsonb_array_elements(v_preguntas) as p on p ->> 'id' = t.r ->> 'pregunta';

  return jsonb_build_object('estado', 'guardada');
end;
$function$;
-- execute: anon:EXECUTE, service_role:EXECUTE
comment on function contestar_encuesta(text,jsonb) is 'Guarda lo que contestó el cliente que abrió un enlace, sin sesión. Es una de las dos únicas funciones que el rol anónimo puede ejecutar. PUEDE: insertar una respuesta y sus renglones para la encuesta de ese enlace, una sola vez. NO PUEDE: actualizar ni borrar nada; escribir en otra tabla; contestar dos veces (la segunda contesta ya_contestada y no pisa la primera); contestar una pregunta que no sea de ese enlace; devolver datos, ni de este trabajo ni de otro: devuelve solo {estado}. Antes de escribir valida del lado de la base que el enlace exista y esté vivo, que cada renglón conteste una pregunta de ese enlace con el tipo y el rango que pide, que no venga una pregunta dos veces ni una de más, que estén las obligatorias y que ningún texto pase de 2000 caracteres. Lo que no cumple se rechaza entero con MN011 y no se guarda media respuesta (ADR 0057).';

CREATE OR REPLACE FUNCTION public.dar_de_baja_suscripcion(p_endpoint text)
 RETURNS boolean
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.dar_de_baja_suscripcion(p_endpoint)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function dar_de_baja_suscripcion(text) is 'Apaga los avisos en este dispositivo.';

CREATE OR REPLACE FUNCTION public.delta(p_desde timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_desde timestamptz;
begin
  if p_desde is null then
    raise exception 'delta() necesita un cursor: sin cursor corresponde bootstrap()'
      using errcode = '22004';
  end if;

  v_desde := p_desde - interval '5 minutes';

  return jsonb_build_object(
    'cursor', now(),
    'households', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.households t where t.updated_at >= v_desde
    ),
    'household_members', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.household_members t where t.updated_at >= v_desde
    ),
    'ajustes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.ajustes t where t.updated_at >= v_desde
    ),
    'tesoros', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.tesoros t where t.updated_at >= v_desde
    ),
    'repartos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.repartos t where t.updated_at >= v_desde
    ),
    'clientes', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.clientes t where t.updated_at >= v_desde
    ),
    'proyectos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proyectos t where t.updated_at >= v_desde
    ),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.pagos t where t.updated_at >= v_desde
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.gastos t where t.updated_at >= v_desde
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.opciones_de_presupuesto t where t.updated_at >= v_desde
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.necesidades t where t.updated_at >= v_desde
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.proximos_contactos t where t.updated_at >= v_desde
    ),
    'movimientos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.movimientos t where t.updated_at >= v_desde
    ),
    'anotaciones', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.anotaciones t where t.updated_at >= v_desde
    ),
    'archivos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.archivos t where t.updated_at >= v_desde
    ),
    'enlaces_publicos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.enlaces_publicos t where t.updated_at >= v_desde
    ),
    'preguntas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.preguntas t where t.updated_at >= v_desde
    ),
    'encuestas_enviadas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.encuestas_enviadas t where t.updated_at >= v_desde
    ),
    'respuestas', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas t where t.updated_at >= v_desde
    ),
    'renglones_de_respuesta', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.renglones_de_respuesta t where t.updated_at >= v_desde
    ),
    'propuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.propuestas_de_entrega t where t.updated_at >= v_desde
    ),
    'respuestas_de_entrega', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.respuestas_de_entrega t where t.updated_at >= v_desde
    ),
    'cambios_de_fecha', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.cambios_de_fecha t where t.updated_at >= v_desde
    ),
    'fotos_de_la_vidriera', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.fotos_de_la_vidriera t where t.updated_at >= v_desde
    ),
    'presupuestos', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.presupuestos t where t.updated_at >= v_desde
    ),
    'revisiones_del_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from public.revisiones_del_presupuesto t where t.updated_at >= v_desde
    )
  );
end;
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function delta(timestamp with time zone) is 'Filas del household cambiadas desde el cursor, incluidas las borradas (deleted_at no null), más el cursor siguiente. Aplica un solape de cinco minutos.';

CREATE OR REPLACE FUNCTION public.encuesta_compartida(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_encuesta public.encuestas_enviadas;
  v_proyecto public.proyectos;
  v_respuesta public.respuestas;
begin
  -- Un token que no tiene la forma de un token no llega ni a consultarse.
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  select * into v_encuesta
  from public.encuestas_enviadas e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocada_at is null
    and e.deleted_at is null;

  -- Inexistente, dado de baja, de un trabajo borrado o de uno perdido contestan exactamente lo
  -- mismo, y lo mismo que la vista del cliente: el que tiene el enlace no se entera de nada.
  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  select * into v_proyecto
  from public.proyectos p
  where p.household_id = v_encuesta.household_id
    and p.id = v_encuesta.proyecto_id
    and p.deleted_at is null
    and p.estado <> 'perdido';

  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  select * into v_respuesta
  from public.respuestas r
  where r.household_id = v_encuesta.household_id
    and r.encuesta_id = v_encuesta.id
    and r.deleted_at is null;

  -- Los campos van enumerados uno por uno, también los de cada pregunta: lo que el cliente ve se
  -- decide acá. supabase/tests/27_encuesta_publica.sql falla apenas aparece una columna nueva en
  -- cualquiera de las tablas que esta función lee, hasta que alguien decide si viaja.
  return jsonb_build_object(
    'taller', (select h.nombre from public.households h where h.id = v_encuesta.household_id),
    -- Del cliente, solo la primera palabra del nombre: la encuesta le dice «Gracias, Marcela».
    'cliente', (
      select nullif(split_part(btrim(c.nombre), ' ', 1), '') from public.clientes c
      where c.household_id = v_proyecto.household_id and c.id = v_proyecto.cliente_id
    ),
    'trabajo', v_proyecto.titulo,
    'resena', (
      select nullif(a.resena_link, '') from public.ajustes a
      where a.household_id = v_encuesta.household_id
    ),
    'preguntas', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', p -> 'id',
            'texto', p -> 'texto',
            'tipo', p -> 'tipo',
            'escala', p -> 'escala',
            'obligatoria', p -> 'obligatoria',
            'opciones', p -> 'opciones',
            'propia', p -> 'propia'
          )
          order by t.orden
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(private.preguntas_de_la_encuesta(v_encuesta)) with ordinality as t (p, orden)
    ),
    'contestada', case
      when v_respuesta.id is null then null
      else jsonb_build_object(
        'fecha', (v_respuesta.contestada_at at time zone 'America/Argentina/Buenos_Aires')::date,
        'renglones', (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'pregunta', g.pregunta_id,
                'valor', case g.tipo
                  when 'varias' then to_jsonb(g.valor_opciones)
                  when 'texto' then to_jsonb(g.valor_texto)
                  else to_jsonb(g.valor_numero)
                end
              )
              order by g.id
            ),
            '[]'::jsonb
          )
          from public.renglones_de_respuesta g
          where g.household_id = v_respuesta.household_id
            and g.respuesta_id = v_respuesta.id
            and g.deleted_at is null
        )
      )
    end
  );
end;
$function$;
-- execute: anon:EXECUTE, service_role:EXECUTE
comment on function encuesta_compartida(text) is 'La encuesta de un enlace, para el cliente que lo abre sin sesión. Es una de las dos únicas funciones que el rol anónimo puede ejecutar. PUEDE: resolver el token contra su sha256 y devolver el nombre del taller, la primera palabra del nombre del cliente, el título del trabajo, el enlace de reseña del taller, las preguntas de ese enlace (la foto que se tomó al mandarlo más las propias del trabajo, cada una con id, texto, tipo, escala, obligatoria, opciones y si es propia) y, si ya contestó, qué contestó y cuándo. NO PUEDE: devolver un importe, un pago, la etapa, la dirección, el teléfono ni ningún otro dato del cliente o del trabajo; devolver nada de otro trabajo ni de otro taller; escribir nada, ni siquiera una visita (es stable, y por eso la usa también la vista previa del enlace). Un enlace inválido, dado de baja, de un trabajo borrado o perdido contestan lo mismo, MN010, sin decir si existió (ADR 0057).';

CREATE OR REPLACE FUNCTION public.estado_de_mis_avisos(p_endpoint text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select private.estado_de_mis_avisos(p_endpoint)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function estado_de_mis_avisos(text) is 'Si este dispositivo recibe avisos y las preferencias de la persona. preferencias es null hasta que activa los avisos por primera vez.';

CREATE OR REPLACE FUNCTION public.guardar_el_presupuesto(p_id uuid, p_proyecto_id uuid, p_version integer, p_contenido jsonb)
 RETURNS presupuestos
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from private.guardar_el_presupuesto(p_id, p_proyecto_id, p_version, p_contenido)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function guardar_el_presupuesto(uuid,uuid,integer,jsonb) is 'RPC del editor del presupuesto: guarda el borrador de un trabajo con la revisión que vio la app y devuelve la fila. Ver private.guardar_el_presupuesto().';

CREATE OR REPLACE FUNCTION public.guardar_la_fila(p_version integer, p_fila jsonb)
 RETURNS ajustes
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from private.guardar_la_fila(p_version, p_fila)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function guardar_la_fila(integer,jsonb) is 'RPC de la pantalla Tesoros: guarda la fila del taller con la revisión que vio la app y devuelve la fila de ajustes. Ver private.guardar_la_fila().';

CREATE OR REPLACE FUNCTION public.guardar_la_plantilla_del_presupuesto(p_version integer, p_plantilla jsonb)
 RETURNS ajustes
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from private.guardar_la_plantilla_del_presupuesto(p_version, p_plantilla)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function guardar_la_plantilla_del_presupuesto(integer,jsonb) is 'RPC de Ajustes, «Tu presupuesto»: guarda los textos de siempre del presupuesto con la revisión que vio la app y devuelve la fila de ajustes. Ver private.guardar_la_plantilla_del_presupuesto().';

CREATE OR REPLACE FUNCTION public.guardar_preferencias_de_avisos(p_zona text, p_hora time without time zone, p_avisos jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.guardar_preferencias_de_avisos(p_zona, p_hora, p_avisos)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function guardar_preferencias_de_avisos(text,time without time zone,jsonb) is 'Cambia la zona horaria, la hora y qué avisa.';

CREATE OR REPLACE FUNCTION public.guardar_proyecto(p_proyecto jsonb, p_pagos jsonb, p_gastos jsonb, p_opciones jsonb DEFAULT NULL::jsonb, p_necesidades jsonb DEFAULT NULL::jsonb, p_proximos jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_p record;
  v_actual public.proyectos;
  v_fila public.proyectos;
  v_existia boolean;
  v_sin_cambios boolean;
  v_vencimiento date;
  v_visita_hecha boolean;
  v_sena_bp integer;
  v_entrega_hora time;
  v_visita_hora time;
  v_vale_hasta date;
  v_fecha_entrega date;
  v_listo date;
  v_comprometida date;
  v_franja public.franja_de_entrega;
  v_tipo text;
  v_household_id uuid;
  v_cuantas integer;
  v_aprobadas integer;
  v_monto_aprobado bigint;
  v_presupuesto bigint;
  v_entra_en_seguimiento boolean;
begin
  if p_proyecto is null or jsonb_typeof(p_proyecto) <> 'object' then
    raise exception 'El proyecto va en un objeto jsonb' using errcode = '22023';
  end if;

  if jsonb_typeof(coalesce(p_pagos, 'null'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(p_gastos, 'null'::jsonb)) <> 'array'
  then
    raise exception 'Los pagos y los gastos van en arrays jsonb' using errcode = '22023';
  end if;

  if p_opciones is not null and jsonb_typeof(p_opciones) <> 'array' then
    raise exception 'Las opciones de presupuesto van en un array jsonb' using errcode = '22023';
  end if;

  if p_necesidades is not null and jsonb_typeof(p_necesidades) <> 'array' then
    raise exception 'Lo que hace falta va en un array jsonb' using errcode = '22023';
  end if;

  if p_proximos is not null and jsonb_typeof(p_proximos) <> 'array' then
    raise exception 'Los próximos contactos van en un array jsonb' using errcode = '22023';
  end if;

  -- Las horas se leen como texto por la misma razón que las fechas: un <input type="time"> vacío
  -- manda "" y un cast directo cortaría la llamada entera con 22007, un rechazo definitivo sin
  -- mensaje que tapa la cola (ADR 0015).
  select * into v_p from jsonb_to_record(p_proyecto) as x (
    id uuid,
    version integer,
    cliente_id uuid,
    titulo text,
    descripcion text,
    estado public.estado_proyecto,
    presupuesto_centavos bigint,
    forma_pago public.forma_pago,
    comprobante public.comprobante,
    fecha_visita date,
    ultimo_contacto date,
    fecha_inicio date,
    entrega_estimada date,
    fecha_entrega date,
    direccion_entrega text,
    notas text,
    vencimiento_presupuesto text,
    visita_hecha boolean,
    sena_bp integer,
    entrega_hora text,
    visita_hora text,
    presupuesto_vale_hasta text,
    listo_el text,
    entrega_comprometida text,
    entrega_comprometida_franja text,
    tipo_de_proyecto text
  );

  if v_p.id is null or v_p.cliente_id is null or v_p.titulo is null or v_p.estado is null then
    raise exception 'El proyecto necesita id, cliente, título y estado' using errcode = '22004';
  end if;

  -- Una fila hija sin id o sin monto rebotaría contra un not null con un 23502 genérico, que no es
  -- un mensaje para el usuario y que tapa la cola igual que cualquier otro rechazo definitivo.
  if exists (
    select 1
    from jsonb_to_recordset(p_pagos) as r (id uuid, monto_centavos bigint, borrado boolean)
    where r.id is null
       or (not coalesce(r.borrado, false) and r.monto_centavos is null)
  ) then
    raise exception 'Cada pago necesita id y monto' using errcode = '22004';
  end if;

  -- La fecha de un pago es el día en que entró la plata, y la sabe la app. Sin ella, o con algo que
  -- no es un día, no se guarda: la base no la inventa (ADR 0063). Se lee como texto por lo mismo
  -- que las horas, y se revisa la forma antes de castear para no cortar con un 22007 sin mensaje.
  if exists (
    select 1
    from jsonb_to_recordset(p_pagos) as r (fecha text, borrado boolean)
    where not coalesce(r.borrado, false)
      and coalesce(r.fecha, '') !~ '^\d{4}-\d{2}-\d{2}$'
  ) then
    raise exception 'Cada pago necesita su fecha'
      using errcode = 'MN016',
            hint = 'Poné el día en que te pagaron.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_gastos) as r (id uuid, fecha text, monto_centavos bigint, borrado boolean)
    where r.id is null
       or (not coalesce(r.borrado, false) and (nullif(r.fecha, '') is null or r.monto_centavos is null))
  ) then
    raise exception 'Cada gasto necesita id, fecha y monto' using errcode = '22004';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_opciones, '[]'::jsonb))
      as r (id uuid, monto_centavos bigint, borrado boolean)
    where r.id is null
       or (not coalesce(r.borrado, false) and r.monto_centavos is null)
  ) then
    raise exception 'Cada opción de presupuesto necesita id y monto' using errcode = '22004';
  end if;

  -- El tipo se lee como texto y se valida contra los valores del enum: castearlo de una cortaría con
  -- un 22P02 crudo, que es definitivo y no tiene traducción. Contra el enum y no contra una lista
  -- escrita acá, para que un tipo nuevo no obligue a reescribir la función (ADR 0060).
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_necesidades, '[]'::jsonb))
      as r (id uuid, tipo text, nombre text, borrado boolean)
    where r.id is null
       or (
         not coalesce(r.borrado, false)
         and (
           coalesce(r.tipo, '') <> all (enum_range(null::public.tipo_de_necesidad)::text[])
           or btrim(coalesce(r.nombre, '')) = ''
         )
       )
  ) then
    raise exception 'Cada material, herraje o herramienta necesita id, tipo y nombre'
      using errcode = '22004';
  end if;

  -- El próximo contacto: el día en que hay que escribirle, la etapa a la que vuelve y, si ya se hizo,
  -- el día y el resultado. Todo se lee como texto y se revisa la forma antes de castear, por lo mismo
  -- que las fechas de los pagos.
  if exists (
    select 1
    from jsonb_to_recordset(coalesce(p_proximos, '[]'::jsonb))
      as r (id uuid, fecha text, etapa_previa text, hecho_el text, resultado text, borrado boolean)
    where r.id is null
       or (
         not coalesce(r.borrado, false)
         and (
           coalesce(r.fecha, '') !~ '^\d{4}-\d{2}-\d{2}$'
           or coalesce(r.etapa_previa, '') not in (
             'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado'
           )
           or (nullif(r.hecho_el, '') is not null and r.hecho_el !~ '^\d{4}-\d{2}-\d{2}$')
           or (nullif(r.hecho_el, '') is null) <> (nullif(r.resultado, '') is null)
           or coalesce(nullif(r.resultado, ''), 'otra_fecha') not in ('reactivado', 'perdido', 'otra_fecha')
         )
       )
  ) then
    raise exception 'Cada próximo contacto necesita id, día y la etapa a la que vuelve; si ya se hizo, el día y el resultado'
      using errcode = '22004';
  end if;

  -- Primer lock: el proyecto, con for update, la misma disciplina que private.liquidar. La guarda
  -- de pagos y gastos toma for share sobre esta misma fila, así que un cobro que llega en el mismo
  -- instante se serializa con este guardado: o la liquidación espera y suma los pagos nuevos, o
  -- este guardado espera y ve el proyecto ya liquidado, y entonces la guarda lo rechaza con MN001.
  select * into v_actual from public.proyectos p where p.id = v_p.id for update;
  v_existia := found;

  v_vencimiento := case
    when p_proyecto ? 'vencimiento_presupuesto' then nullif(v_p.vencimiento_presupuesto, '')::date
    else v_actual.vencimiento_presupuesto
  end;

  v_visita_hecha := case
    when p_proyecto ? 'visita_hecha' then coalesce(v_p.visita_hecha, false)
    else coalesce(v_actual.visita_hecha, false)
  end;

  -- Como el vencimiento: un bundle viejo que no manda la clave no borra la seña propia del trabajo.
  v_sena_bp := case
    when p_proyecto ? 'sena_bp' then v_p.sena_bp
    else v_actual.sena_bp
  end;

  v_entrega_hora := case
    when p_proyecto ? 'entrega_hora' then nullif(v_p.entrega_hora, '')::time
    else v_actual.entrega_hora
  end;

  v_visita_hora := case
    when p_proyecto ? 'visita_hora' then nullif(v_p.visita_hora, '')::time
    else v_actual.visita_hora
  end;

  -- Hasta cuándo vale el presupuesto, con el mismo patrón: un bundle viejo no la manda y no la borra.
  v_vale_hasta := case
    when p_proyecto ? 'presupuesto_vale_hasta' then nullif(v_p.presupuesto_vale_hasta, '')::date
    else v_actual.presupuesto_vale_hasta
  end;

  -- El listo, la comprometida con su franja y el tipo, con el mismo patrón: un bundle viejo no los
  -- conoce y no los borra. Las fechas y la franja se leen como texto por lo mismo que las horas.
  v_listo := case
    when p_proyecto ? 'listo_el' then nullif(v_p.listo_el, '')::date
    else v_actual.listo_el
  end;

  v_comprometida := case
    when p_proyecto ? 'entrega_comprometida' then nullif(v_p.entrega_comprometida, '')::date
    else v_actual.entrega_comprometida
  end;

  v_franja := case
    when p_proyecto ? 'entrega_comprometida_franja'
      then nullif(v_p.entrega_comprometida_franja, '')::public.franja_de_entrega
    else v_actual.entrega_comprometida_franja
  end;

  v_tipo := case
    when p_proyecto ? 'tipo_de_proyecto' then nullif(btrim(v_p.tipo_de_proyecto), '')
    else v_actual.tipo_de_proyecto
  end;

  -- Lo mismo que hace private.cuidar_las_fechas_de_la_entrega() con cualquier escritura: en curso no
  -- hay entrega real, antes de aprobar no hay listo ni comprometida, y la franja no va sin su día.
  v_fecha_entrega := case when v_p.estado = 'en_curso' then null else v_p.fecha_entrega end;
  if v_p.estado in (
    'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado',
    'en_seguimiento'
  ) then
    v_listo := null;
    v_comprometida := null;
  end if;
  if v_comprometida is null then
    v_franja := null;
  end if;

  v_household_id := coalesce(v_actual.household_id, private.household_actual());

  -- Entra en seguimiento en este guardado: la etapa a la que vuelve es la que tenía el trabajo, y la
  -- decide la base, que la tiene en la mano, no lo que diga la app.
  v_entra_en_seguimiento := v_existia
    and v_p.estado = 'en_seguimiento'
    and v_actual.estado is distinct from 'en_seguimiento'
    and v_actual.estado in ('contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado');

  -- El presupuesto que va a quedar, calculado ANTES de escribir el proyecto y sobre el conjunto de
  -- opciones que va a quedar: las que ya están, más las que vienen, menos las que vienen marcadas de
  -- baja. Si se escribiera después habría que corregir el proyecto con un update más, y ese update
  -- subiría la version una segunda vez: el cliente mandaría la versión vieja en el guardado siguiente
  -- y rebotaría con MN006.
  with entrantes as (
    select r.id, r.monto_centavos, coalesce(r.aprobada, false) as aprobada,
           coalesce(r.borrado, false) as borrado
    from jsonb_to_recordset(coalesce(p_opciones, '[]'::jsonb))
      as r (id uuid, monto_centavos bigint, aprobada boolean, borrado boolean)
  ),
  existentes as (
    select o.id, o.monto_centavos, o.aprobada
    from public.opciones_de_presupuesto o
    where o.household_id = v_household_id
      and o.proyecto_id = v_p.id
      and o.deleted_at is null
  ),
  quedan as (
    select coalesce(e.monto_centavos, x.monto_centavos) as monto_centavos,
           coalesce(e.aprobada, x.aprobada) as aprobada
    from existentes x
    full outer join entrantes e on e.id = x.id
    where not coalesce(e.borrado, false)
  )
  select count(*)::integer,
         count(*) filter (where aprobada)::integer,
         min(monto_centavos) filter (where aprobada)
  into v_cuantas, v_aprobadas, v_monto_aprobado
  from quedan;

  if v_aprobadas > 1 then
    raise exception 'Solo se puede tildar una opción del presupuesto'
      using errcode = 'MN009',
            hint = 'Destildá la que no va y dejá tildada la que te aprobaron.';
  end if;

  -- Con opciones, el presupuesto no se elige: sale de la aprobada, y no hay ninguna mientras el
  -- cliente no eligió. Sin opciones, es el campo que manda el usuario, como siempre.
  v_presupuesto := case
    when v_cuantas > 0 then (case when v_aprobadas > 0 then v_monto_aprobado else null end)
    else v_p.presupuesto_centavos
  end;

  if v_existia then
    if v_actual.deleted_at is not null then
      raise exception 'El proyecto está borrado' using errcode = 'MN002';
    end if;

    v_sin_cambios := (
      v_actual.cliente_id, v_actual.titulo, v_actual.descripcion, v_actual.estado,
      v_actual.presupuesto_centavos, v_actual.forma_pago, v_actual.comprobante,
      v_actual.fecha_visita, v_actual.ultimo_contacto, v_actual.fecha_inicio,
      v_actual.entrega_estimada, v_actual.fecha_entrega, v_actual.direccion_entrega, v_actual.notas,
      v_actual.vencimiento_presupuesto, v_actual.visita_hecha, v_actual.sena_bp,
      v_actual.entrega_hora, v_actual.visita_hora, v_actual.presupuesto_vale_hasta,
      v_actual.listo_el, v_actual.entrega_comprometida, v_actual.entrega_comprometida_franja,
      v_actual.tipo_de_proyecto
    ) is not distinct from (
      v_p.cliente_id, v_p.titulo, coalesce(v_p.descripcion, ''), v_p.estado,
      v_presupuesto, v_p.forma_pago, v_p.comprobante,
      v_p.fecha_visita, v_p.ultimo_contacto, v_p.fecha_inicio,
      v_p.entrega_estimada, v_fecha_entrega, coalesce(v_p.direccion_entrega, ''),
      coalesce(v_p.notas, ''), v_vencimiento, v_visita_hecha, v_sena_bp,
      v_entrega_hora, v_visita_hora, v_vale_hasta,
      v_listo, v_comprometida, v_franja, v_tipo
    );

    -- Un guardado hecho sin señal sobre una versión vieja no pisa en silencio lo que hay. La
    -- excepción es el reenvío de la cola: este mismo guardado ya se aplicó (la versión subió
    -- exactamente uno y la fila quedó igual a lo que se manda) y la respuesta se perdió. Reaplicar
    -- entonces no hace nada, porque el update de abajo y las bajas ya son no-op.
    if v_p.version is not null
      and v_actual.version <> v_p.version
      and not (v_sin_cambios and v_actual.version = v_p.version + 1)
    then
      raise exception 'El proyecto cambió desde que lo abriste'
        using errcode = 'MN006',
              detail = format('versión vista %s, versión actual %s', v_p.version, v_actual.version),
              hint = 'Abrilo de nuevo para ver lo que hay ahora y volvé a cargar lo que te falte.';
    end if;
  end if;

  -- Alta y edición se escriben por separado, no con un upsert. En un `insert ... on conflict do
  -- update`, Postgres evalúa los check de la tabla sobre la fila propuesta antes de resolver el
  -- conflicto: guardar las notas de un proyecto cobrado proponía una fila con estado cobrado y la
  -- distribución en null, y eso choca contra proyectos_liquidado_con_distribucion. El reenvío del
  -- alta cae igual en la rama de edición, porque el select de arriba ya encontró la fila.
  --
  -- La edición manda la fila entera y no solo las columnas que cambiaron, al revés que el resto de
  -- las mutaciones (ADR 0010): acá el chequeo de versión es la garantía más fuerte, porque si el
  -- servidor cambió algo el guardado se rechaza en vez de pisarlo en silencio. Los cuatro costos
  -- estimados quedan afuera a propósito: van por su propio update, como las marcas de la agenda.
  if v_existia then
    update public.proyectos set
      cliente_id = v_p.cliente_id,
      titulo = v_p.titulo,
      descripcion = coalesce(v_p.descripcion, ''),
      estado = v_p.estado,
      presupuesto_centavos = v_presupuesto,
      forma_pago = v_p.forma_pago,
      comprobante = v_p.comprobante,
      fecha_visita = v_p.fecha_visita,
      ultimo_contacto = v_p.ultimo_contacto,
      fecha_inicio = v_p.fecha_inicio,
      entrega_estimada = v_p.entrega_estimada,
      fecha_entrega = v_fecha_entrega,
      direccion_entrega = coalesce(v_p.direccion_entrega, ''),
      notas = coalesce(v_p.notas, ''),
      vencimiento_presupuesto = v_vencimiento,
      visita_hecha = v_visita_hecha,
      sena_bp = v_sena_bp,
      entrega_hora = v_entrega_hora,
      visita_hora = v_visita_hora,
      presupuesto_vale_hasta = v_vale_hasta,
      listo_el = v_listo,
      entrega_comprometida = v_comprometida,
      entrega_comprometida_franja = v_franja,
      tipo_de_proyecto = v_tipo
    where id = v_p.id
    returning * into v_fila;
  else
    begin
      insert into public.proyectos (
        id, cliente_id, titulo, descripcion, estado, presupuesto_centavos, forma_pago, comprobante,
        fecha_visita, ultimo_contacto, fecha_inicio, entrega_estimada, fecha_entrega,
        direccion_entrega, notas, vencimiento_presupuesto, visita_hecha, sena_bp,
        entrega_hora, visita_hora, presupuesto_vale_hasta, listo_el, entrega_comprometida,
        entrega_comprometida_franja, tipo_de_proyecto
      ) values (
        v_p.id, v_p.cliente_id, v_p.titulo, coalesce(v_p.descripcion, ''), v_p.estado,
        v_presupuesto, v_p.forma_pago, v_p.comprobante,
        v_p.fecha_visita, v_p.ultimo_contacto, v_p.fecha_inicio, v_p.entrega_estimada,
        v_fecha_entrega, coalesce(v_p.direccion_entrega, ''), coalesce(v_p.notas, ''),
        v_vencimiento, v_visita_hecha, v_sena_bp, v_entrega_hora, v_visita_hora, v_vale_hasta,
        v_listo, v_comprometida, v_franja, v_tipo
      )
      returning * into v_fila;
    exception
      -- El id existe pero el select de arriba no lo vio: es de otro household. Se responde lo mismo
      -- que si no existiera, que es lo que la RLS ya dice, en vez de filtrar que está. Un duplicate
      -- key crudo sería además un rechazo definitivo sin mensaje, y la cola drena de a una.
      when unique_violation then
        raise exception 'El proyecto no existe o no es tuyo' using errcode = '42501';
    end;
  end if;

  -- Los hijos van después del proyecto: la foreign key compuesta exige que el padre exista. La marca
  -- de la apertura de un pago usa el patrón de la clave presente: sin la clave (un bundle viejo)
  -- queda la que ya tenía el pago, y un pago nuevo nace en false.
  insert into public.pagos (id, proyecto_id, fecha, concepto, monto_centavos, ya_en_la_apertura)
  select r.id, v_fila.id, r.fecha::date, coalesce(r.concepto, ''), r.monto_centavos,
         case
           when e ? 'ya_en_la_apertura' then coalesce(r.ya_en_la_apertura, false)
           else coalesce(g.ya_en_la_apertura, false)
         end
  from jsonb_array_elements(p_pagos) as e
  cross join lateral jsonb_to_record(e) as r (
    id uuid, fecha text, concepto text, monto_centavos bigint, ya_en_la_apertura boolean,
    borrado boolean
  )
  left join public.pagos g on g.id = r.id
  where not coalesce(r.borrado, false)
  on conflict (id) do update set
    proyecto_id = excluded.proyecto_id,
    fecha = excluded.fecha,
    concepto = excluded.concepto,
    monto_centavos = excluded.monto_centavos,
    ya_en_la_apertura = excluded.ya_en_la_apertura;

  insert into public.gastos (id, proyecto_id, fecha, descripcion, monto_centavos)
  select r.id, v_fila.id, r.fecha::date, coalesce(r.descripcion, ''), r.monto_centavos
  from jsonb_to_recordset(p_gastos) as r (
    id uuid, fecha text, descripcion text, monto_centavos bigint, borrado boolean
  )
  where not coalesce(r.borrado, false)
  on conflict (id) do update set
    proyecto_id = excluded.proyecto_id,
    fecha = excluded.fecha,
    descripcion = excluded.descripcion,
    monto_centavos = excluded.monto_centavos;

  -- Las opciones solo se tocan si el pedido las trae: p_opciones en null es un bundle viejo, que no
  -- las conoce y no tiene por qué borrarlas.
  if p_opciones is not null then
    -- Apagar antes de escribir. El índice único parcial de la aprobada se evalúa fila por fila, y el
    -- orden dentro del upsert no está definido: sin este paso, mover la aprobación de una opción a
    -- otra dejaba dos prendidas a la vez y cortaba con 23505.
    update public.opciones_de_presupuesto
    set aprobada = false
    where household_id = v_fila.household_id
      and proyecto_id = v_fila.id
      and aprobada
      and deleted_at is null;

    insert into public.opciones_de_presupuesto (id, proyecto_id, descripcion, monto_centavos, aprobada)
    select r.id, v_fila.id, coalesce(r.descripcion, ''), r.monto_centavos, coalesce(r.aprobada, false)
    from jsonb_to_recordset(p_opciones) as r (
      id uuid, descripcion text, monto_centavos bigint, aprobada boolean, borrado boolean
    )
    where not coalesce(r.borrado, false)
    on conflict (id) do update set
      proyecto_id = excluded.proyecto_id,
      descripcion = excluded.descripcion,
      monto_centavos = excluded.monto_centavos,
      aprobada = excluded.aprobada;
  end if;

  -- Lo mismo con lo que hace falta: sin la clave no se toca. No hay índice único parcial acá, así que
  -- el upsert va de una y el orden entre filas no importa.
  if p_necesidades is not null then
    insert into public.necesidades (id, proyecto_id, tipo, nombre, cantidad, listo)
    select r.id, v_fila.id, r.tipo::public.tipo_de_necesidad, btrim(r.nombre), r.cantidad,
           coalesce(r.listo, false)
    from jsonb_to_recordset(p_necesidades) as r (
      id uuid, tipo text, nombre text, cantidad integer, listo boolean, borrado boolean
    )
    where not coalesce(r.borrado, false)
    on conflict (id) do update set
      proyecto_id = excluded.proyecto_id,
      tipo = excluded.tipo,
      nombre = excluded.nombre,
      cantidad = excluded.cantidad,
      listo = excluded.listo;
  end if;

  -- El próximo contacto, también solo si viene la clave. Primero los registrados y después los
  -- pendientes: el índice único del pendiente se evalúa fila por fila, y cerrar uno y abrir el
  -- siguiente en el mismo guardado tiene que pasar por un momento sin ninguno. La marca de importante
  -- no viaja por acá: se tilda con su propio update.
  if p_proximos is not null then
    insert into public.proximos_contactos (
      id, proyecto_id, fecha, nota, etapa_previa, hecho_el, resultado, respuesta
    )
    select r.id, v_fila.id, r.fecha::date, coalesce(r.nota, ''),
           r.etapa_previa::public.estado_proyecto, r.hecho_el::date, r.resultado,
           coalesce(r.respuesta, '')
    from jsonb_to_recordset(p_proximos) as r (
      id uuid, fecha text, nota text, etapa_previa text, hecho_el text, resultado text,
      respuesta text, borrado boolean
    )
    where not coalesce(r.borrado, false)
      and nullif(r.hecho_el, '') is not null
    on conflict (id) do update set
      proyecto_id = excluded.proyecto_id,
      fecha = excluded.fecha,
      nota = excluded.nota,
      etapa_previa = excluded.etapa_previa,
      hecho_el = excluded.hecho_el,
      resultado = excluded.resultado,
      respuesta = excluded.respuesta;

    begin
      insert into public.proximos_contactos (id, proyecto_id, fecha, nota, etapa_previa, respuesta)
      select r.id, v_fila.id, r.fecha::date, coalesce(r.nota, ''),
             case
               when v_entra_en_seguimiento then v_actual.estado
               else r.etapa_previa::public.estado_proyecto
             end,
             coalesce(r.respuesta, '')
      from jsonb_to_recordset(p_proximos) as r (
        id uuid, fecha text, nota text, etapa_previa text, hecho_el text, respuesta text,
        borrado boolean
      )
      where not coalesce(r.borrado, false)
        and nullif(r.hecho_el, '') is null
      on conflict (id) do update set
        proyecto_id = excluded.proyecto_id,
        fecha = excluded.fecha,
        nota = excluded.nota,
        etapa_previa = excluded.etapa_previa,
        respuesta = excluded.respuesta;
    exception
      -- Otro dispositivo ya dejó un contacto pendiente para este trabajo: este guardado viene de
      -- una versión vieja del seguimiento. Se contesta como cualquier otro choque de versiones.
      when unique_violation then
        raise exception 'El seguimiento cambió desde que lo abriste'
          using errcode = 'MN006',
                hint = 'Abrilo de nuevo para ver cuándo le toca, y volvé a cargar lo que te falte.';
    end;
  end if;

  -- La baja de una fila hija es la que el cliente vio y sacó del formulario, marcada en el mismo
  -- array. Nunca es "todo lo que no vino en el pedido": la version del proyecto no se mueve cuando
  -- solo cambian sus hijos, así que un guardado viejo borraría en silencio un pago cargado desde
  -- otro lado. El filtro por deleted_at deja el reenvío en no-op y conserva la primera marca.
  update public.pagos g
  set deleted_at = now()
  from jsonb_to_recordset(p_pagos) as r (id uuid, borrado boolean)
  where g.id = r.id
    and coalesce(r.borrado, false)
    and g.proyecto_id = v_fila.id
    and g.deleted_at is null;

  update public.gastos g
  set deleted_at = now()
  from jsonb_to_recordset(p_gastos) as r (id uuid, borrado boolean)
  where g.id = r.id
    and coalesce(r.borrado, false)
    and g.proyecto_id = v_fila.id
    and g.deleted_at is null;

  update public.opciones_de_presupuesto o
  set deleted_at = now()
  from jsonb_to_recordset(coalesce(p_opciones, '[]'::jsonb)) as r (id uuid, borrado boolean)
  where o.id = r.id
    and coalesce(r.borrado, false)
    and o.proyecto_id = v_fila.id
    and o.deleted_at is null;

  update public.necesidades n
  set deleted_at = now()
  from jsonb_to_recordset(coalesce(p_necesidades, '[]'::jsonb)) as r (id uuid, borrado boolean)
  where n.id = r.id
    and coalesce(r.borrado, false)
    and n.proyecto_id = v_fila.id
    and n.deleted_at is null;

  update public.proximos_contactos c
  set deleted_at = now()
  from jsonb_to_recordset(coalesce(p_proximos, '[]'::jsonb)) as r (id uuid, borrado boolean)
  where c.id = r.id
    and coalesce(r.borrado, false)
    and c.proyecto_id = v_fila.id
    and c.deleted_at is null;

  -- Vuelve el agregado entero: las filas vivas más las que este guardado dio de baja, para que el
  -- cliente las saque de su réplica sin esperar al próximo delta.
  return jsonb_build_object(
    'proyecto', to_jsonb(v_fila),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb)
      from public.pagos g
      where g.household_id = v_fila.household_id
        and g.proyecto_id = v_fila.id
        and (
          g.deleted_at is null
          or g.id in (select (r ->> 'id')::uuid from jsonb_array_elements(p_pagos) as r)
        )
    ),
    'gastos', (
      select coalesce(jsonb_agg(to_jsonb(g)), '[]'::jsonb)
      from public.gastos g
      where g.household_id = v_fila.household_id
        and g.proyecto_id = v_fila.id
        and (
          g.deleted_at is null
          or g.id in (select (r ->> 'id')::uuid from jsonb_array_elements(p_gastos) as r)
        )
    ),
    'opciones_de_presupuesto', (
      select coalesce(jsonb_agg(to_jsonb(o)), '[]'::jsonb)
      from public.opciones_de_presupuesto o
      where o.household_id = v_fila.household_id
        and o.proyecto_id = v_fila.id
        and (
          o.deleted_at is null
          or o.id in (
            select (r ->> 'id')::uuid from jsonb_array_elements(coalesce(p_opciones, '[]'::jsonb)) as r
          )
        )
    ),
    'necesidades', (
      select coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb)
      from public.necesidades n
      where n.household_id = v_fila.household_id
        and n.proyecto_id = v_fila.id
        and (
          n.deleted_at is null
          or n.id in (
            select (r ->> 'id')::uuid from jsonb_array_elements(coalesce(p_necesidades, '[]'::jsonb)) as r
          )
        )
    ),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
      from public.proximos_contactos c
      where c.household_id = v_fila.household_id
        and c.proyecto_id = v_fila.id
        and (
          c.deleted_at is null
          or c.id in (
            select (r ->> 'id')::uuid from jsonb_array_elements(coalesce(p_proximos, '[]'::jsonb)) as r
          )
        )
    )
  );
end;
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function guardar_proyecto(jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) is 'Guarda un proyecto con sus pagos, sus gastos, sus opciones de presupuesto, lo que hace falta para el trabajo y su próximo contacto en una sola transacción, idempotente por el id del proyecto. El alta es un upsert; la edición manda la version que vio el cliente y se rechaza con MN006 si la fila cambió. Las bajas de las filas hijas vienen marcadas con borrado en su propio array. Un pago sin fecha se rechaza con MN016: la fecha la manda la app (ADR 0063); la guarda de la tabla rechaza además una fecha que todavía no llegó y una marca de la apertura que no corresponde. Con opciones vivas, el presupuesto del proyecto sale de la opción aprobada y no de lo que manda el cliente. Entrar en seguimiento, cambiar la fecha y registrar el contacto viajan en p_proximos junto con el estado, y la guarda diferida exige que el trabajo en seguimiento tenga su contacto pendiente (MN019, ADR 0064); al entrar, la etapa a la que vuelve la pone la base. Hasta cuándo vale el presupuesto (presupuesto_vale_hasta), el día en que quedó listo (listo_el), la entrega comprometida con su franja y el tipo de proyecto se escriben solo si la clave viene en el pedido, como el vencimiento (ADR 0067 y 0071); con el trabajo en curso la entrega real va en null, y antes de aprobar el listo y la comprometida también. p_opciones, p_necesidades y p_proximos en null quieren decir "no toques eso", para que un bundle viejo no lo borre; lo mismo la clave ya_en_la_apertura de cada pago. Los cuatro costos estimados no los escribe esta función: van por un update de sus columnas solas.';

CREATE OR REPLACE FUNCTION public.mandar_el_presupuesto(p_presupuesto_id uuid, p_revision_id uuid, p_version integer, p_documento jsonb, p_que_cambio text, p_mandado_el date, p_vale_hasta date)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.mandar_el_presupuesto(
    p_presupuesto_id, p_revision_id, p_version, p_documento, p_que_cambio, p_mandado_el, p_vale_hasta
  )
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function mandar_el_presupuesto(uuid,uuid,integer,jsonb,text,date,date) is 'RPC de la hoja de mandar: congela una revisión del presupuesto con el documento que armó la app y devuelve la revisión, el borrador, el trabajo y sus próximos contactos para la réplica. Ver private.mandar_el_presupuesto().';

CREATE OR REPLACE FUNCTION private.anotar_aviso(p_suscripcion uuid, p_dia date, p_mandado boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  update private.suscripciones_de_avisos
  set ultimo_dia_avisado = greatest(coalesce(ultimo_dia_avisado, p_dia), p_dia),
      ultimo_envio = case when p_mandado then now() else ultimo_envio end
  where id = p_suscripcion;
  return found;
end;
$function$;
-- execute: service_role:EXECUTE
comment on function private.anotar_aviso(uuid,date,boolean) is 'Anota que el día ya se miró para ese dispositivo, y si además salió un aviso, cuándo. Un día sin nada que avisar también se anota: si no, se volvería a mirar en cada vuelta del trabajo.';

CREATE OR REPLACE FUNCTION private.anotar_el_cambio_de_estado()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'UPDATE' and new.estado is not distinct from old.estado then
    return null;
  end if;

  insert into public.cambios_de_estado (household_id, proyecto_id, desde, hacia, ocurrio_el)
  values (
    new.household_id,
    new.id,
    case when tg_op = 'UPDATE' then old.estado end,
    new.estado,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date
  );

  -- El día en que el cliente aceptó el presupuesto: cuando pasa de una consulta a en curso. Si vuelve
  -- a una consulta («Volvió a presupuesto», o un perdido que se reactiva), deja de estar aceptado.
  if tg_op = 'UPDATE' then
    if new.estado = 'en_curso'
      and old.estado not in ('en_curso', 'entregado', 'cobrado', 'perdido')
    then
      update public.presupuestos b
      set aceptado_el = (now() at time zone 'America/Argentina/Buenos_Aires')::date
      where b.household_id = new.household_id
        and b.proyecto_id = new.id
        and b.deleted_at is null
        and b.aceptado_el is distinct from (now() at time zone 'America/Argentina/Buenos_Aires')::date;
    elsif new.estado not in ('en_curso', 'entregado', 'cobrado', 'perdido') then
      update public.presupuestos b
      set aceptado_el = null
      where b.household_id = new.household_id
        and b.proyecto_id = new.id
        and b.deleted_at is null
        and b.aceptado_el is not null;
    end if;
  end if;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.anotar_el_cambio_de_estado() is 'Anota en public.cambios_de_estado cada vez que un trabajo cambia de etapa, venga de donde venga (el agregado, el cobro, la reapertura, el envío del presupuesto), y le pone a su presupuesto el día en que se aceptó (aceptado_el) cuando pasa de una consulta a en curso, o se lo saca cuando vuelve a una consulta (ADR 0080). Es security definer porque la app no tiene grant de insert sobre cambios_de_estado ni de update sobre presupuestos: la historia y la aceptación no las escribe el cliente.';

CREATE OR REPLACE FUNCTION private.anotar_los_cambios_de_fecha()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_entra_en_curso boolean;
  v_estimada boolean;
  v_comprometida boolean;
  v_origen public.origen_de_la_fecha;
  v_en_curso integer;
  v_sin_terminar integer;
begin
  if new.deleted_at is not null then
    return null;
  end if;

  v_entra_en_curso := new.estado = 'en_curso'
    and (tg_op = 'INSERT' or old.estado is distinct from 'en_curso');

  -- La estimada se anota cuando el trabajo entra en curso con una, y cada vez que cambia mientras está
  -- en curso. Antes de aprobar es un número del taller que el cliente no ve como fecha.
  v_estimada := (v_entra_en_curso and new.entrega_estimada is not null)
    or (
      tg_op = 'UPDATE'
      and new.estado = 'en_curso'
      and not v_entra_en_curso
      and new.entrega_estimada is distinct from old.entrega_estimada
    );

  -- La comprometida, cada vez que cambia ella o su franja, también cuando se saca.
  v_comprometida := case
    when tg_op = 'INSERT' then new.entrega_comprometida is not null
    else (new.entrega_comprometida, new.entrega_comprometida_franja)
      is distinct from (old.entrega_comprometida, old.entrega_comprometida_franja)
  end;

  if not v_estimada and not v_comprometida then
    return null;
  end if;

  -- El origen lo marca la puerta del cliente en la transacción, y lo vuelve a vacío después del
  -- update. Cualquier otro camino es el taller.
  v_origen := coalesce(
    nullif(current_setting('maun.origen_de_la_fecha', true), '')::public.origen_de_la_fecha,
    'taller'
  );

  -- La carga del taller en ese momento: los otros trabajos en curso, y de esos los que no están listos.
  select count(*)::integer, (count(*) filter (where p.listo_el is null))::integer
  into v_en_curso, v_sin_terminar
  from public.proyectos p
  where p.household_id = new.household_id
    and p.id <> new.id
    and p.estado = 'en_curso'
    and p.deleted_at is null;

  if v_estimada then
    insert into public.cambios_de_fecha (
      household_id, proyecto_id, tipo, fecha, fecha_anterior, franja, origen, decidido_el,
      trabajos_en_curso, trabajos_sin_terminar
    ) values (
      new.household_id, new.id, 'estimada', new.entrega_estimada,
      (
        select c.fecha from public.cambios_de_fecha c
        where c.household_id = new.household_id and c.proyecto_id = new.id and c.tipo = 'estimada'
        order by c.created_at desc, c.id desc
        limit 1
      ),
      null, v_origen, private.hoy_en_el_taller(), v_en_curso, v_sin_terminar
    );
  end if;

  if v_comprometida then
    insert into public.cambios_de_fecha (
      household_id, proyecto_id, tipo, fecha, fecha_anterior, franja, origen, decidido_el,
      trabajos_en_curso, trabajos_sin_terminar
    ) values (
      new.household_id, new.id, 'comprometida', new.entrega_comprometida,
      (
        select c.fecha from public.cambios_de_fecha c
        where c.household_id = new.household_id and c.proyecto_id = new.id and c.tipo = 'comprometida'
        order by c.created_at desc, c.id desc
        limit 1
      ),
      new.entrega_comprometida_franja, v_origen, private.hoy_en_el_taller(), v_en_curso, v_sin_terminar
    );
  end if;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.anotar_los_cambios_de_fecha() is 'Anota en public.cambios_de_fecha la estimada cuando el trabajo entra en curso con una y cada vez que cambia con el trabajo en curso, y la comprometida cada vez que cambia ella o su franja, venga de donde venga el cambio. Una sola fila por tipo en cada update. Guarda el día en el taller, quién la fijó (maun.origen_de_la_fecha, que marca la puerta del cliente; si no, el taller) y cuántos otros trabajos había en curso y sin terminar. Es security definer porque la app no tiene grant de insert sobre esa tabla: la historia no la escribe el cliente (ADR 0071).';

CREATE OR REPLACE FUNCTION private.armar_la_encuesta()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_estado public.estado_proyecto;
  v_borrado timestamptz;
  v_preguntas jsonb;
begin
  select p.estado, p.deleted_at into v_estado, v_borrado
  from public.proyectos p
  where p.household_id = new.household_id and p.id = new.proyecto_id;

  -- Un trabajo que no es de este household lo rechaza la foreign key compuesta, que corre después.
  if not found then
    return new;
  end if;

  if v_borrado is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  -- El momento es cuando se entrega: antes no hay nada que opinar.
  if v_estado not in ('entregado', 'cobrado') then
    raise exception 'La opinión se le pide al cliente cuando el trabajo está entregado'
      using errcode = 'MN015',
            hint = 'Marcá el trabajo como entregado y pedísela desde ahí.';
  end if;

  if exists (
    select 1
    from public.respuestas r
    join public.encuestas_enviadas e on e.household_id = r.household_id and e.id = r.encuesta_id
    where e.household_id = new.household_id and e.proyecto_id = new.proyecto_id
  ) then
    raise exception 'Ese cliente ya contestó' using errcode = 'MN012';
  end if;

  -- La foto: las preguntas base vigentes, sin las archivadas, en su orden. De cada una va lo que
  -- el cliente necesita para contestarla y nada más.
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'texto', p.texto,
        'tipo', p.tipo,
        'escala', p.escala,
        'obligatoria', p.obligatoria,
        'opciones', to_jsonb(p.opciones),
        'propia', false
      )
      order by p.orden, p.serie
    ),
    '[]'::jsonb
  ) into v_preguntas
  from public.preguntas p
  where p.household_id = new.household_id
    and p.proyecto_id is null
    and p.deleted_at is null
    and p.archivada_at is null
    and p.numero = (
      select max(q.numero) from public.preguntas q
      where q.household_id = p.household_id and q.serie = p.serie and q.deleted_at is null
    );

  if jsonb_array_length(v_preguntas) = 0 then
    raise exception 'La encuesta no tiene preguntas'
      using errcode = 'MN015',
            hint = 'Volvé a preguntar al menos una en Opiniones › Preguntas.';
  end if;

  new.preguntas := v_preguntas;
  new.enviada_at := now();
  new.recordada_at := null;
  new.revocada_at := null;
  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.armar_la_encuesta() is 'Trigger del alta de una encuesta enviada: exige que el trabajo esté entregado o cobrado y que su cliente no haya contestado ya, y le saca la foto a la encuesta base vigente. Lo que el dueño manda es el id, el trabajo y el enlace; la foto, la fecha y los estados los pone la base.';

CREATE OR REPLACE FUNCTION private.avisar_los_cambios()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
  v_avisados text;
begin
  v_household := (
    to_jsonb(case when tg_op = 'DELETE' then old else new end) ->> tg_argv[0]
  )::uuid;
  if v_household is null then
    return null;
  end if;

  v_avisados := coalesce(current_setting('maun.cambios_avisados', true), '');
  if position(v_household::text in v_avisados) > 0 then
    return null;
  end if;
  perform set_config('maun.cambios_avisados', v_avisados || v_household::text || ',', true);

  perform private.mandar_el_aviso_de_cambios(v_household);
  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.avisar_los_cambios() is 'Trigger de cada tabla del delta: la primera escritura de la transacción en un taller le manda el aviso de cambios, y las demás lo saltean (la marca maun.cambios_avisados vive lo que la transacción). El aviso no lleva datos a propósito: Broadcast autoriza por canal, no por fila, así que cualquier fila en el payload pasaría por al lado de la RLS de su tabla, quedaría guardada en realtime.messages y armaría un segundo camino de entrada a la réplica. Con el aviso vacío, lo único que sabe quien escucha es que algo cambió, y lo que cambió lo trae el delta. Security definer porque escribe en realtime.messages, que no le da insert a authenticated ni a anon. El argumento es la columna del taller: household_id, o id en households.';

CREATE OR REPLACE FUNCTION private.avisos_bien_formados(p_avisos jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    jsonb_typeof(p_avisos) = 'object'
    and (select array_agg(clave order by clave) from jsonb_object_keys(p_avisos) as clave) in (
      array['anotaciones', 'entregas', 'presupuestos', 'visitas'],
      array['anotaciones', 'entregas', 'presupuestos', 'seguimientos', 'visitas'],
      array['anotaciones', 'entregas', 'presupuestos', 'seguimientos', 'vencimientos', 'visitas']
    )
    and (
      select bool_and(
        case
          when jsonb_typeof(valor) <> 'object' then false
          else jsonb_typeof(valor -> 'activo') = 'boolean'
            and coalesce(valor ->> 'anticipacion', '') in ('0', '1', '2', '3')
            and valor - 'activo' - 'anticipacion' = '{}'::jsonb
        end
      )
      from jsonb_each(p_avisos) as e (clave, valor)
    ),
    false
  )
$function$;
-- execute: solo el dueño
comment on function private.avisos_bien_formados(jsonb) is 'Qué avisa y con cuánta anticipación: las claves de AVISOS_DE_LA_AGENDA de @maun/domain, cada una con activo y una anticipación de 0 a 3 días. Acepta también las formas de antes, sin seguimientos ni vencimientos o sin vencimientos, para que un bundle viejo no rebote: quien la lee le completa lo que falta con avisos_completos.';

CREATE OR REPLACE FUNCTION private.avisos_completos(p_avisos jsonb)
 RETURNS jsonb
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
      'seguimientos', jsonb_build_object('activo', true, 'anticipacion', 0),
      'vencimientos', jsonb_build_object('activo', true, 'anticipacion', 0)
    )
    || p_avisos
$function$;
-- execute: solo el dueño
comment on function private.avisos_completos(jsonb) is 'Las preferencias de avisos con todas las claves: a las que se guardaron antes de que existieran seguimientos o vencimientos les agrega esas claves con su valor inicial (prendidas, el mismo día), sin reescribir la fila. Gemela de PREFERENCIAS_INICIALES de @maun/domain para esas claves.';

CREATE OR REPLACE FUNCTION private.avisos_por_mandar(p_ahora timestamp with time zone)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  with locales as (
    select
      s.id,
      s.user_id,
      s.endpoint,
      s.p256dh,
      s.auth,
      s.ultimo_dia_avisado,
      p.avisos,
      p.hora,
      p.zona,
      (p_ahora at time zone p.zona) as ahora_local
    from private.suscripciones_de_avisos s
    join private.preferencias_de_avisos p on p.user_id = s.user_id
  ),
  debidas as (
    select
      l.*,
      l.ahora_local::date as dia,
      (
        select m.household_id
        from public.household_members m
        where m.user_id = l.user_id and m.deleted_at is null
        order by m.created_at
        limit 1
      ) as household_id
    from locales l
    -- La hora local de cada persona, calculada acá con su zona: desde la hora que eligió y durante
    -- tres horas, una vez por día local.
    where l.ahora_local >= l.ahora_local::date + l.hora
      and l.ahora_local < l.ahora_local::date + l.hora + interval '3 hours'
      and (l.ultimo_dia_avisado is null or l.ultimo_dia_avisado < l.ahora_local::date)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'endpoint', d.endpoint,
        'p256dh', d.p256dh,
        'auth', d.auth,
        'dia', d.dia,
        -- La zona de la persona: con ella la función pasa fila_guardada_at al mes en que se guardó, que
        -- en las últimas horas del último día de un mes no es el mismo en UTC.
        'zona', d.zona,
        'preferencias', private.avisos_completos(d.avisos),
        'filas', jsonb_build_object(
          'proyectos', (
            select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
            from public.proyectos p
            where p.household_id = d.household_id
              and p.deleted_at is null
              and p.estado in (
                'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado',
                'en_seguimiento', 'en_curso'
              )
          ),
          'clientes', (
            select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'nombre', c.nombre, 'zona', c.zona)), '[]'::jsonb)
            from public.clientes c
            where c.household_id = d.household_id and c.deleted_at is null
          ),
          'anotaciones', (
            select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
            from public.anotaciones a
            where a.household_id = d.household_id
              and a.deleted_at is null
              and not a.hecha
              and a.fecha between d.dia and d.dia + 3
          ),
          -- A quién le toca volver a escribirle: los contactos pendientes de los próximos días. Lo
          -- registrado ya no se avisa.
          'proximos_contactos', (
            select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
            from public.proximos_contactos c
            where c.household_id = d.household_id
              and c.deleted_at is null
              and c.hecho_el is null
              and c.fecha between d.dia and d.dia + 3
          ),
          -- Los vencimientos salen de la fila del taller: los ajustes, con la fila y cuándo se guardó.
          'ajustes', (
            select coalesce(jsonb_agg(to_jsonb(a)), '[]'::jsonb)
            from public.ajustes a
            where a.household_id = d.household_id and a.deleted_at is null
          ),
          -- Todos los tesoros del taller, también los archivados, para el nombre de cada vencimiento.
          'tesoros', (
            select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
            from public.tesoros t
            where t.household_id = d.household_id and t.deleted_at is null
          ),
          -- Los gastos desde un tesoro de los meses que mira el aviso, del mes de hoy al de la mayor
          -- anticipación (que puede ser el siguiente): con ellos se sabe qué renglón ya se pagó.
          'movimientos', (
            select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb)
            from public.movimientos m
            where m.household_id = d.household_id
              and m.deleted_at is null
              and m.tipo = 'gasto'
              and m.desde_id is not null
              and m.fecha >= date_trunc('month', d.dia)::date
              and m.fecha < (date_trunc('month', d.dia + 3) + interval '1 month')::date
          )
        )
      )
      order by d.id
    ),
    '[]'::jsonb
  )
  from debidas d
  where d.household_id is not null
$function$;
-- execute: service_role:EXECUTE
comment on function private.avisos_por_mandar(timestamp with time zone) is 'Los dispositivos a los que les toca el aviso de la mañana en este momento, según la zona horaria y la hora de cada persona, con su zona y los datos de su taller que necesita la agenda: los trabajos, los clientes, las anotaciones, los contactos en seguimiento pendientes y, para los vencimientos de los compromisos, los ajustes con la fila, los tesoros y los gastos desde un tesoro de los meses que mira el aviso. Qué avisar lo decide eventosParaAvisar de @maun/domain en la función de borde, no esta consulta.';

CREATE OR REPLACE FUNCTION private.borrar_el_presupuesto_del_trabajo(p_household_id uuid, p_proyecto_id uuid, p_momento timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Solo con el trabajo ya borrado. El dueño no tiene grant para borrar un borrador ni una revisión, y
  -- esta puerta no le abre ese camino para un trabajo vivo.
  if not exists (
    select 1 from public.proyectos p
    where p.household_id = p_household_id and p.id = p_proyecto_id and p.deleted_at is not null
  ) then
    return;
  end if;

  update public.revisiones_del_presupuesto r
  set deleted_at = p_momento
  where r.household_id = p_household_id and r.proyecto_id = p_proyecto_id and r.deleted_at is null;

  update public.presupuestos b
  set deleted_at = p_momento
  where b.household_id = p_household_id and b.proyecto_id = p_proyecto_id and b.deleted_at is null;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.borrar_el_presupuesto_del_trabajo(uuid,uuid,timestamp with time zone) is 'Borra, con la marca del trabajo, el borrador del presupuesto y sus revisiones de un trabajo que ya se borró. Es security definer porque el dueño no tiene grant para escribir ninguna de las dos: la llama private.borrar_hijos_de_proyecto(), y no hace nada si el trabajo está vivo (ADR 0080).';

CREATE OR REPLACE FUNCTION private.borrar_hijos_de_proyecto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  update public.pagos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.gastos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.archivos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.opciones_de_presupuesto
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.necesidades
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.enlaces_publicos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  update public.proximos_contactos
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  -- Las propuestas de entrega después del enlace, en el orden en que las bloquea el cliente que
  -- contesta: el trabajo, el enlace, la propuesta.
  update public.propuestas_de_entrega
  set deleted_at = new.deleted_at
  where household_id = new.household_id
    and proyecto_id = new.id
    and deleted_at is null;

  perform private.borrar_la_entrega_del_trabajo(new.household_id, new.id, new.deleted_at);

  -- El borrador del presupuesto y lo que se mandó, que el dueño tampoco puede borrar a mano.
  perform private.borrar_el_presupuesto_del_trabajo(new.household_id, new.id, new.deleted_at);

  -- La encuesta que se le mandó, lo que contestó y sus preguntas propias. El enlace deja de
  -- funcionar con el trabajo.
  perform private.borrar_las_opiniones_del_trabajo(new.household_id, new.id, new.deleted_at);

  return null;
end;
$function$;
-- execute: solo el dueño

CREATE OR REPLACE FUNCTION private.borrar_la_entrega_del_trabajo(p_household_id uuid, p_proyecto_id uuid, p_momento timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Solo con el trabajo ya borrado. El dueño no tiene grant para borrar una respuesta ni una fila de
  -- la historia, y esta puerta no le abre ese camino para un trabajo vivo.
  if not exists (
    select 1 from public.proyectos p
    where p.household_id = p_household_id and p.id = p_proyecto_id and p.deleted_at is not null
  ) then
    return;
  end if;

  update public.respuestas_de_entrega r
  set deleted_at = p_momento
  where r.household_id = p_household_id and r.proyecto_id = p_proyecto_id and r.deleted_at is null;

  update public.cambios_de_fecha c
  set deleted_at = p_momento
  where c.household_id = p_household_id and c.proyecto_id = p_proyecto_id and c.deleted_at is null;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.borrar_la_entrega_del_trabajo(uuid,uuid,timestamp with time zone) is 'Borra, con la marca del trabajo, lo que contestó el cliente sobre la entrega y la historia de las fechas de un trabajo que ya se borró. Es security definer porque el dueño no tiene grant para borrar ninguna de las dos: la llama private.borrar_hijos_de_proyecto(), y no hace nada si el trabajo está vivo (ADR 0071).';

CREATE OR REPLACE FUNCTION private.borrar_las_opiniones_del_trabajo(p_household_id uuid, p_proyecto_id uuid, p_momento timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Solo con el trabajo ya borrado. El dueño no tiene grant para borrar una respuesta ni un
  -- renglón, y esta puerta no le abre ese camino para un trabajo vivo.
  if not exists (
    select 1 from public.proyectos p
    where p.household_id = p_household_id and p.id = p_proyecto_id and p.deleted_at is not null
  ) then
    return;
  end if;

  -- La encuesta primero: si un cliente está guardando su respuesta, este update la espera, y los
  -- dos que siguen ya ven lo que guardó.
  update public.encuestas_enviadas e
  set deleted_at = p_momento
  where e.household_id = p_household_id and e.proyecto_id = p_proyecto_id and e.deleted_at is null;

  update public.respuestas r
  set deleted_at = p_momento
  where r.household_id = p_household_id
    and r.deleted_at is null
    and r.encuesta_id in (
      select e.id from public.encuestas_enviadas e
      where e.household_id = p_household_id and e.proyecto_id = p_proyecto_id
    );

  update public.renglones_de_respuesta g
  set deleted_at = p_momento
  where g.household_id = p_household_id
    and g.deleted_at is null
    and g.respuesta_id in (
      select r.id
      from public.respuestas r
      join public.encuestas_enviadas e on e.household_id = r.household_id and e.id = r.encuesta_id
      where e.household_id = p_household_id and e.proyecto_id = p_proyecto_id
    );

  update public.preguntas p
  set deleted_at = p_momento
  where p.household_id = p_household_id and p.proyecto_id = p_proyecto_id and p.deleted_at is null;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.borrar_las_opiniones_del_trabajo(uuid,uuid,timestamp with time zone) is 'Borra, con la marca del trabajo, lo que se le preguntó y lo que contestó el cliente de un trabajo que ya se borró. Es security definer porque el dueño no tiene grant para borrar respuestas: la llama private.borrar_hijos_de_proyecto(), y no hace nada si el trabajo está vivo.';

CREATE OR REPLACE FUNCTION private.borrar_suscripcion_vencida(p_endpoint text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  delete from private.suscripciones_de_avisos where endpoint = p_endpoint;
  return found;
end;
$function$;
-- execute: service_role:EXECUTE
comment on function private.borrar_suscripcion_vencida(text) is 'El servicio de push contestó 404 o 410: esa suscripción ya no existe. Sin borrarla la tabla crece para siempre y cada envío hace trabajo muerto.';

CREATE OR REPLACE FUNCTION private.cascada(p_cobrado_centavos bigint, p_gastos_centavos bigint, p_diezmo_bp integer, p_tope_sueldo_centavos bigint, p_tope_fijos_centavos bigint, OUT neta_centavos bigint, OUT diezmo_centavos bigint, OUT sueldo_centavos bigint, OUT fijos_centavos bigint, OUT remanente_centavos bigint)
 RETURNS record
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  -- Number.MAX_SAFE_INTEGER: el mayor entero que Money representa exacto. Fuera de ese rango la
  -- cascada de TypeScript corta, así que esta también.
  c_maximo constant bigint := 9007199254740991;
  v_resto bigint;
begin
  if num_nulls(p_cobrado_centavos, p_gastos_centavos, p_diezmo_bp, p_tope_sueldo_centavos, p_tope_fijos_centavos) > 0 then
    raise exception 'La cascada necesita todos sus parámetros' using errcode = '22004';
  end if;

  if p_cobrado_centavos < 0 or p_gastos_centavos < 0 or p_tope_sueldo_centavos < 0 or p_tope_fijos_centavos < 0 then
    raise exception 'La cascada no acepta importes negativos' using errcode = '22023';
  end if;

  if p_diezmo_bp not between 0 and 10000 then
    raise exception 'El diezmo va en puntos básicos entre 0 y 10000' using errcode = '22023';
  end if;

  if greatest(p_cobrado_centavos, p_gastos_centavos, p_tope_sueldo_centavos, p_tope_fijos_centavos) > c_maximo then
    raise exception 'Importe fuera del rango exacto de Money' using errcode = '22003';
  end if;

  neta_centavos := p_cobrado_centavos - p_gastos_centavos;

  -- Sin ganancia no hay nada que repartir: la pérdida entera queda en el remanente, así los
  -- escalones siempre suman la neta (proyectos_distribucion_cuadra).
  if neta_centavos <= 0 then
    diezmo_centavos := 0;
    sueldo_centavos := 0;
    fijos_centavos := 0;
    remanente_centavos := neta_centavos;
    return;
  end if;

  if neta_centavos * p_diezmo_bp + 5000 > c_maximo then
    raise exception 'Importe fuera del rango exacto de Money' using errcode = '22003';
  end if;

  -- Mitad hacia arriba al centavo, en aritmética entera: la misma cuenta que aplicarPorcentaje.
  diezmo_centavos := (neta_centavos * p_diezmo_bp + 5000) / 10000;
  v_resto := neta_centavos - diezmo_centavos;
  sueldo_centavos := least(p_tope_sueldo_centavos, v_resto);
  v_resto := v_resto - sueldo_centavos;
  fijos_centavos := least(p_tope_fijos_centavos, v_resto);
  remanente_centavos := v_resto - fijos_centavos;
end;
$function$;
-- execute: solo el dueño
comment on function private.cascada(bigint,bigint,integer,bigint,bigint) is 'La cascada: neta = cobrado - gastos; diezmo (mitad hacia arriba); sueldo y fijos topeados por lo que queda; remanente. Gemela de calcularDistribucion de @maun/domain, con el mismo rango de importes.';

CREATE OR REPLACE FUNCTION private.cerrar_el_contacto_pendiente()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Dar por perdido lo cierra con el día del cierre, que manda la app. Volver a una consulta desde el
  -- formulario no trae día: el pendiente se cierra con el de hoy en el taller. La app, cuando registra
  -- el contacto, manda su propio cierre en el mismo guardado y ese pisa a este.
  update public.proximos_contactos
  set hecho_el = case
        when new.estado = 'perdido' then coalesce(new.fecha_cobro, private.hoy_en_el_taller())
        else private.hoy_en_el_taller()
      end,
      resultado = case when new.estado = 'perdido' then 'perdido' else 'reactivado' end
  where household_id = new.household_id
    and proyecto_id = new.id
    and hecho_el is null
    and deleted_at is null;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.cerrar_el_contacto_pendiente() is 'Cuando un trabajo sale del seguimiento sin que la app registre el contacto (dar por perdido, cambiar la etapa desde el formulario), cierra el pendiente con ese resultado: perdido con el día del cierre, reactivado con el día de hoy en el taller.';

CREATE OR REPLACE FUNCTION private.cerrar_la_propuesta_de_entrega()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  update public.propuestas_de_entrega
  set cerrada_at = now()
  where household_id = new.household_id
    and proyecto_id = new.id
    and cerrada_at is null
    and deleted_at is null;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.cerrar_la_propuesta_de_entrega() is 'Cierra la propuesta de entrega abierta de un trabajo cuando se fija la entrega comprometida (la confirmó el dueño o la aceptó el cliente) o cuando el trabajo deja de estar en curso y listo: ya no hay nada que el cliente pueda contestar. Corre con los permisos de quien escribe el trabajo, que tiene grant de update sobre cerrada_at (ADR 0071).';

CREATE OR REPLACE FUNCTION private.completar_los_tesoros()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_clave public.tesoro;
  v_id uuid;
begin
  -- Cada lado por separado. En un alta manda el que vino: una app de antes manda la clave y una nueva
  -- manda el id. En una edición manda el que cambió, porque una app de antes edita mandando solo la
  -- clave y sin esto el id viejo quedaría apuntando a otro tesoro.
  if tg_op = 'INSERT' or new.desde_id is distinct from old.desde_id
    or new.tesoro_origen is distinct from old.tesoro_origen
  then
    if new.desde_id is not null
      and (tg_op = 'INSERT' or new.desde_id is distinct from old.desde_id)
    then
      select t.clave into v_clave
      from public.tesoros t
      where t.household_id = new.household_id and t.id = new.desde_id;
      if tg_op = 'UPDATE' and new.tesoro_origen is distinct from old.tesoro_origen
        and new.tesoro_origen is distinct from v_clave
      then
        raise exception 'El tesoro de origen no coincide con su clave'
          using errcode = '23514';
      end if;
      if tg_op = 'INSERT' and new.tesoro_origen is not null
        and new.tesoro_origen is distinct from v_clave
      then
        raise exception 'El tesoro de origen no coincide con su clave'
          using errcode = '23514';
      end if;
      new.tesoro_origen := v_clave;
    elsif tg_op = 'UPDATE' and new.tesoro_origen is not distinct from old.tesoro_origen then
      -- Cambió solo el id, y a null: la clave lo sigue.
      new.tesoro_origen := null;
    elsif tg_op = 'UPDATE' and new.desde_id is distinct from old.desde_id
      and new.tesoro_origen is not null
    then
      -- El id pasó a null y la clave a otro tesoro: no dicen lo mismo.
      raise exception 'El tesoro de origen no coincide con su clave'
        using errcode = '23514';
    elsif new.tesoro_origen is not null then
      select t.id into v_id
      from public.tesoros t
      where t.household_id = new.household_id and t.clave = new.tesoro_origen;
      new.desde_id := v_id;
    else
      new.desde_id := null;
    end if;
  end if;

  if tg_op = 'INSERT' or new.hacia_id is distinct from old.hacia_id
    or new.tesoro_destino is distinct from old.tesoro_destino
  then
    if new.hacia_id is not null
      and (tg_op = 'INSERT' or new.hacia_id is distinct from old.hacia_id)
    then
      select t.clave into v_clave
      from public.tesoros t
      where t.household_id = new.household_id and t.id = new.hacia_id;
      if tg_op = 'UPDATE' and new.tesoro_destino is distinct from old.tesoro_destino
        and new.tesoro_destino is distinct from v_clave
      then
        raise exception 'El tesoro de destino no coincide con su clave'
          using errcode = '23514';
      end if;
      if tg_op = 'INSERT' and new.tesoro_destino is not null
        and new.tesoro_destino is distinct from v_clave
      then
        raise exception 'El tesoro de destino no coincide con su clave'
          using errcode = '23514';
      end if;
      new.tesoro_destino := v_clave;
    elsif tg_op = 'UPDATE' and new.tesoro_destino is not distinct from old.tesoro_destino then
      -- Cambió solo el id, y a null: la clave lo sigue.
      new.tesoro_destino := null;
    elsif tg_op = 'UPDATE' and new.hacia_id is distinct from old.hacia_id
      and new.tesoro_destino is not null
    then
      -- El id pasó a null y la clave a otro tesoro: no dicen lo mismo.
      raise exception 'El tesoro de destino no coincide con su clave'
        using errcode = '23514';
    elsif new.tesoro_destino is not null then
      select t.id into v_id
      from public.tesoros t
      where t.household_id = new.household_id and t.clave = new.tesoro_destino;
      new.hacia_id := v_id;
    else
      new.hacia_id := null;
    end if;
  end if;

  -- Todo movimiento cambia algún saldo que la liquidación puede mirar: el de un compromiso que se
  -- renueva al pagar, el de un ahorro que se repone al usarlo o el de un tesoro con meta, y la plata
  -- que cubre un mes cuenta para su tope. Toma los ajustes, como una liquidación, para que una
  -- liquidación del mismo taller lo vea entero o no lo vea: nunca a medias. Con un proyecto, primero
  -- el proyecto, en el orden de la liquidación y de la reversión, así la foreign key no pide su lock
  -- con los ajustes ya tomados.
  if new.proyecto_id is not null then
    perform 1
    from public.proyectos p
    where p.household_id = new.household_id and p.id = new.proyecto_id
    for key share;
  end if;

  perform 1 from public.ajustes a where a.household_id = new.household_id for no key update;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.completar_los_tesoros() is 'Trigger de movimientos: completa desde_id y hacia_id desde tesoro_origen y tesoro_destino, o al revés, siguiendo el lado que cambió, y rechaza con 23514 si los dos cambian y no dicen lo mismo. Así una app de antes, que manda el enum, y una nueva, que manda el id, escriben la misma fila. Antes de escribir toma los ajustes del taller for no key update, como una liquidación, porque todo movimiento cambia un saldo que la liquidación puede mirar (un compromiso que se renueva al pagar, un ahorro que se repone al usarlo, una meta, lo que cubre un mes); si trae proyecto_id, toma primero ese proyecto for key share, en el orden de la liquidación y de la reversión (ADR 0078).';

CREATE OR REPLACE FUNCTION private.contar_la_revision_de_la_fila()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Sin fila guardada, la fila de siempre sale del sueldo y de los costos fijos: cambiarlos es cambiar
  -- la fila. Con o sin fila, un perdido reparte según perdido_con_*. Así un cobro que quedó en la cola
  -- armado con los ajustes de antes rebota con MN006, como siempre, y no con MN008.
  if (
      new.fila is null
      and (
        new.sueldo_mensual_centavos is distinct from old.sueldo_mensual_centavos
        or new.costos_fijos_centavos is distinct from old.costos_fijos_centavos
        or new.sueldo_tope_mensual is distinct from old.sueldo_tope_mensual
      )
    )
    or new.perdido_con_sueldo is distinct from old.perdido_con_sueldo
    or new.perdido_con_diezmo is distinct from old.perdido_con_diezmo
  then
    new.fila_version := new.fila_version + 1;
  end if;
  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.contar_la_revision_de_la_fila() is 'Trigger de ajustes: suma una revisión a la fila cuando cambia algo que cambia el reparto, sin fila guardada el sueldo, los costos fijos o sueldo_tope_mensual, y siempre perdido_con_sueldo o perdido_con_diezmo. La app hace lo mismo con su fila optimista (ADR 0078).';

CREATE OR REPLACE FUNCTION private.crear_household(p_nombre text, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
begin
  insert into public.households (nombre) values (p_nombre) returning id into v_household;

  if p_user_id is not null then
    insert into public.household_members (household_id, user_id, rol)
    values (v_household, p_user_id, 'titular');
  end if;

  insert into public.ajustes (household_id) values (v_household);

  perform private.sembrar_la_encuesta(v_household);

  perform private.sembrar_los_tesoros(v_household);

  return v_household;
end;
$function$;
-- execute: solo el dueño
comment on function private.crear_household(text,uuid) is 'Crea un household con sus ajustes, su encuesta base y sus cuatro tesoros de siempre y, si se pasa un usuario, lo suma como titular. Solo la ejecuta el dueño de la base.';

CREATE OR REPLACE FUNCTION private.crear_taller_del_usuario()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  -- Idempotente, y por eso los dos triggers comparten la función: si la cuenta ya tuvo taller
  -- alguna vez, no se crea otro. Cuenta también la membresía revocada: crear uno nuevo dejaría el
  -- anterior con datos y sin ningún miembro vivo, invisible por RLS.
  if exists (select 1 from public.household_members m where m.user_id = new.id) then
    return null;
  end if;

  -- El nombre es una constante y no un dato del registro: lo que viene de afuera puede violar
  -- households_nombre_valido, y un rechazo acá no rompe un alta sino todas. El taller se renombra
  -- desde la app, en la primera configuración.
  perform private.crear_household('Mi taller', new.id);
  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.crear_taller_del_usuario() is 'Trigger de auth.users: a la cuenta que confirma su mail le crea el taller, la membresía de titular y los ajustes en cero. Idempotente: si ya tuvo taller, no hace nada.';

CREATE OR REPLACE FUNCTION private.cuidar_el_archivo_del_tesoro()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_fila jsonb;
  v_saldo bigint;
begin
  -- Solo mira lo que archiva: desarchivar, o tocar otra cosa de uno archivado, pasa.
  if new.archivado_at is null or old.archivado_at is not null then
    return new;
  end if;

  -- Toma los ajustes antes de mirar, como toda guarda que lee otra fila para decidir: una liquidación
  -- o un guardado de la fila del mismo taller que corre en paralelo termina antes o espera.
  select a.fila into v_fila
  from public.ajustes a
  where a.household_id = new.household_id
  for no key update;

  -- En la fila guardada: una obligación, un paso, una parte o el superávit. Una fila guardada antes de
  -- los tipos de tesoro no tiene obligaciones ni superávit: los de siempre son el diezmo y Maun, que
  -- no se archivan.
  if exists (
      select 1
      from jsonb_array_elements(
        coalesce(v_fila -> 'obligaciones', '[]'::jsonb)
        || coalesce(v_fila -> 'pasos', '[]'::jsonb)
        || coalesce(v_fila -> 'reparto', '[]'::jsonb)
      ) as e (valor)
      where e.valor ->> 'tesoro' = new.id::text
    )
    or v_fila ->> 'superavit' = new.id::text
    -- Volver a cobrar un reabierto reparte con su foto: si el tesoro no estuviera, le pagaría a uno
    -- archivado.
    or exists (
      select 1
      from public.proyectos p
      cross join lateral jsonb_array_elements(
        coalesce(p.reapertura_fila -> 'fila' -> 'obligaciones', '[]'::jsonb)
        || coalesce(p.reapertura_fila -> 'fila' -> 'pasos', '[]'::jsonb)
        || coalesce(p.reapertura_fila -> 'fila' -> 'reparto', '[]'::jsonb)
      ) as e (valor)
      where p.household_id = new.household_id
        and p.deleted_at is null
        and p.reapertura_fila is not null
        and e.valor ->> 'tesoro' = new.id::text
    )
    or exists (
      select 1
      from public.proyectos p
      where p.household_id = new.household_id
        and p.deleted_at is null
        and p.reapertura_fila -> 'fila' ->> 'superavit' = new.id::text
    )
  then
    raise exception 'Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata.'
      using errcode = 'MN024',
            detail = 'en la fila';
  end if;

  select coalesce(sum(l.monto_centavos), 0) into v_saldo
  from public.libro_mayor l
  where l.household_id = new.household_id
    and l.tesoro_id = new.id
    and not l.ya_en_la_apertura;

  if v_saldo <> 0 then
    raise exception 'Ese tesoro todavía está en la fila, en un cobro reabierto o tiene plata.'
      using errcode = 'MN024',
            detail = format('saldo %s', v_saldo);
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.cuidar_el_archivo_del_tesoro() is 'Guarda de archivar un tesoro: no deja archivar uno que está en la fila guardada (como obligación, paso, parte o superávit), en la foto de un cobro reabierto de un proyecto vivo (volver a cobrarlo le pagaría) o que tiene saldo distinto de cero en el libro mayor. Toma los ajustes antes de mirar. Rechaza con MN024; la app lo avisa antes con lo que ve en la réplica (ADR 0078).';

CREATE OR REPLACE FUNCTION private.cuidar_el_tope_de_la_vidriera()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_vivas integer;
begin
  -- Solo cuenta lo que deja una foto viva de más: el alta de una foto viva y restaurar una borrada.
  -- Mover una foto viva o sacarla no suma nada.
  if new.deleted_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.deleted_at is null then
    return new;
  end if;

  -- Bloquea el taller antes de contar: dos aparatos que suman a la vez se esperan acá, y el segundo
  -- cuenta con la foto del primero adentro. Es FOR NO KEY UPDATE para no chocar con las foreign keys
  -- que apuntan al taller, que toman FOR KEY SHARE: solo espera a otra foto que se suma o a quien
  -- renombra el taller.
  perform 1 from public.households h where h.id = new.household_id for no key update;

  -- No se cuenta a sí misma: el reenvío de un alta que ya había entrado vuelve a pasar por acá.
  select count(*) into v_vivas
  from public.fotos_de_la_vidriera f
  where f.household_id = new.household_id
    and f.deleted_at is null
    and f.id <> new.id;

  if v_vivas >= 12 then
    raise exception 'La vidriera ya tiene 12 fotos'
      using errcode = 'MN022',
            hint = 'Sacá una foto de la vidriera antes de sumar otra.';
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.cuidar_el_tope_de_la_vidriera() is 'Guarda del alta y de la restauración de una foto de la vidriera: un taller tiene a lo sumo 12 fotos vivas. Bloquea la fila del taller antes de contar, así dos altas a la vez se esperan, y no se cuenta a sí misma. Rechaza con MN022 (ADR 0076).';

CREATE OR REPLACE FUNCTION private.cuidar_la_encuesta()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Un solo recordatorio: la primera marca queda. Dos es molestar a un cliente que ya pagó.
  new.recordada_at := coalesce(old.recordada_at, new.recordada_at);
  -- Lo dado de baja no revive.
  new.revocada_at := coalesce(old.revocada_at, new.revocada_at);
  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.cuidar_la_encuesta() is 'Trigger de encuestas_enviadas: el recordatorio y la baja se escriben una sola vez. Un reenvío con la misma marca no cambia nada, y uno con otra marca conserva la primera.';

CREATE OR REPLACE FUNCTION private.cuidar_la_pregunta()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_ultima integer;
begin
  new.cantidad_de_opciones := coalesce(cardinality(new.opciones), 0);

  if tg_op = 'INSERT' then
    -- El alta que manda la cola es un upsert, y este trigger corre antes de saber si hay conflicto.
    -- Si la fila ya existe, el insert termina en un update y las reglas se aplican ahí.
    if exists (select 1 from public.preguntas p where p.id = new.id) then
      return new;
    end if;

    if new.numero > 1 then
      -- Una versión nueva parte la serie desde la vigente, y solo desde ella: dos aparatos que
      -- versionan la misma pregunta sin señal no pueden dejar dos «versión 2».
      select max(p.numero) into v_ultima
      from public.preguntas p
      where p.household_id = new.household_id and p.serie = new.serie;

      if v_ultima is distinct from new.numero - 1 then
        raise exception 'La pregunta cambió desde otro lado'
          using errcode = 'MN014',
                hint = 'Ya hay una versión más nueva de esta pregunta. Volvé a abrir Preguntas y cambiala ahí.';
      end if;

      -- La marca de titular la hereda de la versión anterior. El dueño no tiene grant sobre ella.
      select p.titular into new.titular
      from public.preguntas p
      where p.household_id = new.household_id and p.serie = new.serie and p.numero = new.numero - 1;
    end if;
  else
    -- El reenvío idéntico de una mutación que ya se aplicó pasa sin mirar nada más.
    if private.es_reenvio(to_jsonb(old), to_jsonb(new)) then
      return new;
    end if;

    if new.serie is distinct from old.serie
      or new.numero is distinct from old.numero
      or new.proyecto_id is distinct from old.proyecto_id
      or new.titular is distinct from old.titular then
      raise exception 'La serie, el número, el trabajo y la marca de titular de una pregunta no cambian'
        using errcode = 'MN004';
    end if;

    -- De la encuesta base se borra solamente la pregunta que nadie vio: sin otra versión, sin estar
    -- en la foto de una encuesta viva y sin respuestas. Todas las demás se archivan, y lo que
    -- contestaron queda. La del número de arriba de Resultados no se borra nunca.
    if old.proyecto_id is null and old.deleted_at is null and new.deleted_at is not null
      and (
        old.titular
        or old.numero > 1
        or exists (
          select 1 from public.preguntas p
          where p.household_id = old.household_id and p.serie = old.serie and p.id <> old.id
        )
        or exists (
          select 1 from public.encuestas_enviadas e
          where e.household_id = old.household_id
            and e.deleted_at is null
            and e.preguntas @> jsonb_build_array(jsonb_build_object('id', old.id))
        )
        or exists (
          select 1 from public.renglones_de_respuesta g
          where g.household_id = old.household_id and g.pregunta_id = old.id and g.deleted_at is null
        )
      ) then
      raise exception 'Esa pregunta no se borra: se deja de preguntar'
        using errcode = 'MN004',
              hint = 'Archivala: sale de la encuesta y lo que ya contestaron queda.';
    end if;

    -- Solo se toca la versión vigente. Una edición que llega después de que otro aparato partió la
    -- serie estaría cambiando una pregunta que ya no se hace.
    select max(p.numero) into v_ultima
    from public.preguntas p
    where p.household_id = old.household_id and p.serie = old.serie;

    if v_ultima > old.numero then
      raise exception 'La pregunta cambió desde otro lado'
        using errcode = 'MN014',
              hint = 'Ya hay una versión más nueva de esta pregunta. Volvé a abrir Preguntas y cambiala ahí.';
    end if;

    -- Cómo se contesta una pregunta que ya salió no cambia: el cliente que la tiene abierta
    -- contesta lo que recibió, y su respuesta tiene que poder leerse igual. Salió si está en la
    -- foto de alguna encuesta, si alguien la contestó o, siendo propia, si su trabajo tiene un
    -- enlace vivo. El texto sí se corrige en el lugar: eso es «solo la redacté mejor».
    if (new.tipo, new.escala, new.opciones) is distinct from (old.tipo, old.escala, old.opciones)
      and (
        exists (
          select 1 from public.encuestas_enviadas e
          where e.household_id = old.household_id
            and e.deleted_at is null
            and (
              e.preguntas @> jsonb_build_array(jsonb_build_object('id', old.id))
              or (old.proyecto_id is not null and e.proyecto_id = old.proyecto_id and e.revocada_at is null)
            )
        )
        or exists (
          select 1 from public.renglones_de_respuesta g
          where g.household_id = old.household_id and g.pregunta_id = old.id
        )
      ) then
      raise exception 'Esa pregunta ya salió en una encuesta: cómo se contesta no cambia'
        using errcode = 'MN013',
              hint = 'Guardala como pregunta nueva: lo que ya contestaron queda aparte, con su texto.';
    end if;
  end if;

  -- Un trabajo borrado no suma preguntas: sus hijos solo pueden quedar borrados, como los pagos.
  if new.proyecto_id is not null
    and new.deleted_at is null
    and exists (
      select 1 from public.proyectos p
      where p.household_id = new.household_id and p.id = new.proyecto_id and p.deleted_at is not null
    ) then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  -- Las preguntas propias de un trabajo cuyo cliente ya contestó quedan como están, salvo que el
  -- trabajo se esté borrando, que se las lleva.
  if new.proyecto_id is not null
    and exists (
      select 1
      from public.respuestas r
      join public.encuestas_enviadas e on e.household_id = r.household_id and e.id = r.encuesta_id
      where e.household_id = new.household_id and e.proyecto_id = new.proyecto_id
    )
    and not exists (
      select 1 from public.proyectos p
      where p.household_id = new.household_id and p.id = new.proyecto_id and p.deleted_at is not null
    ) then
    raise exception 'Ese cliente ya contestó: sus preguntas quedan como están'
      using errcode = 'MN012',
            hint = 'Para preguntarle algo más, escribile.';
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.cuidar_la_pregunta() is 'Trigger de preguntas: calcula cuántas opciones tiene, deja cambiar solo la versión vigente de una serie, no deja cambiar cómo se contesta una pregunta que ya salió en una encuesta, arma las versiones nuevas desde la vigente y congela las propias de un trabajo cuyo cliente ya contestó (ADR 0057).';

CREATE OR REPLACE FUNCTION private.cuidar_la_propuesta_de_entrega()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_estado public.estado_proyecto;
  v_listo date;
  v_comprometida date;
  v_borrado timestamptz;
begin
  -- Bloquea el trabajo antes de mirarlo: marcar que todavía no está listo, o comprometer la entrega,
  -- en el mismo instante, espera a esta alta o la ve ya hecha y la cierra.
  select p.estado, p.listo_el, p.entrega_comprometida, p.deleted_at
  into v_estado, v_listo, v_comprometida, v_borrado
  from public.proyectos p
  where p.household_id = new.household_id and p.id = new.proyecto_id
  for share;

  -- Un trabajo que no es de este household lo rechaza la foreign key compuesta, que corre después.
  if not found then
    return new;
  end if;

  if v_borrado is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  if v_estado <> 'en_curso' or v_listo is null then
    raise exception 'La entrega se coordina con el mueble listo'
      using errcode = 'MN021',
            detail = 'sin_listo',
            hint = 'Marcá en la ficha que ya está listo y proponele el día.';
  end if;

  if v_comprometida is not null then
    raise exception 'La entrega ya está comprometida'
      using errcode = 'MN021',
            detail = 'comprometida',
            hint = 'Para cambiarla, cambiá la fecha comprometida en la ficha.';
  end if;

  if new.fecha is not null and new.fecha < private.hoy_en_el_taller() + 1 then
    raise exception 'El día que le proponés tiene que ser desde mañana'
      using errcode = 'MN021',
            detail = 'fecha',
            hint = 'Elegí un día desde mañana.';
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.cuidar_la_propuesta_de_entrega() is 'Guarda del alta de una propuesta de entrega: el trabajo tiene que estar en curso y listo, sin entrega comprometida, y el día propuesto tiene que ser desde mañana en la hora del taller. Rechaza con MN021 y el motivo en el detail (sin_listo, comprometida o fecha), o con MN002 si el trabajo está borrado (ADR 0071).';

CREATE OR REPLACE FUNCTION private.cuidar_las_fechas_de_la_entrega()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Antes de aprobar no hay nada terminado ni acordado: volver a presupuesto, o reactivar un perdido,
  -- se lleva el listo y la comprometida. La historia de la comprometida queda en cambios_de_fecha.
  if new.estado in (
    'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado',
    'en_seguimiento'
  ) then
    new.listo_el := null;
    new.entrega_comprometida := null;
  end if;

  -- En curso todavía no se entregó. La entrega vieja que el formulario reenvía sin mostrarla, o la que
  -- quedó de antes de volver al taller, no puede quedar como si hubiera pasado.
  if new.estado = 'en_curso' then
    new.fecha_entrega := null;
  end if;

  -- La franja va con su día: sacar la comprometida se la lleva.
  if new.entrega_comprometida is null then
    new.entrega_comprometida_franja := null;
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.cuidar_las_fechas_de_la_entrega() is 'Guarda de proyectos, antes de escribir y venga de donde venga el cambio (la ficha, el formulario, reactivar un perdido): un trabajo en una etapa de antes de aprobar no tiene listo ni entrega comprometida, uno en curso no tiene fecha de entrega, y la franja no queda sin su día. Corre antes que private.mantener_metadatos(), así un reenvío que solo difiere en lo que esto limpia sigue siendo un no-op (ADR 0071).';

CREATE OR REPLACE FUNCTION private.dar_de_baja_suscripcion(p_endpoint text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  delete from private.suscripciones_de_avisos
  where endpoint = p_endpoint
    and user_id = (select auth.uid());
  return found;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.dar_de_baja_suscripcion(text) is 'Borra este dispositivo si es del usuario de la sesión. Un endpoint de otra cuenta no se toca.';

CREATE OR REPLACE FUNCTION private.entero_de_json(p_valor jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_numero numeric;
begin
  if p_valor is null or jsonb_typeof(p_valor) <> 'number' then
    return null;
  end if;
  v_numero := (p_valor #>> '{}')::numeric;
  if v_numero <> trunc(v_numero) or abs(v_numero) > 9007199254740991 then
    return null;
  end if;
  return v_numero::bigint;
end;
$function$;
-- execute: solo el dueño
comment on function private.entero_de_json(jsonb) is 'Un número entero de JSON que entra en un entero seguro de JavaScript, o null. Gemela de esEntero en fila.ts.';

CREATE OR REPLACE FUNCTION private.es_dia_de_la_entrega(p_texto text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select p_texto ~ '^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
    and pg_input_is_valid(p_texto, 'date')
$function$;
-- execute: solo el dueño
comment on function private.es_dia_de_la_entrega(text) is 'Si un texto es un día AAAA-MM-DD que existe, de este milenio: el 30 de febrero no. Lo usa private.validar_respuesta_de_entrega() antes de leerlo como fecha, y tiene su gemela en @maun/domain (esDiaDeLaEntrega).';

CREATE OR REPLACE FUNCTION private.es_el_canal_de_mi_taller(p_tema text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select coalesce(p_tema, '') in (
    select 'cambios:' || h::text from private.user_household_ids() as h
  )
$function$;
-- execute: authenticated:EXECUTE
comment on function private.es_el_canal_de_mi_taller(text) is 'Si el canal de Realtime que se quiere escuchar es cambios:<household_id> de un taller del que el usuario es miembro. La usa la política de lectura de realtime.messages, que corre con el rol y los claims de quien se conecta.';

CREATE OR REPLACE FUNCTION private.es_reenvio(p_old jsonb, p_new jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select (p_old - array['created_at', 'updated_at', 'version']) = (p_new - array['created_at', 'updated_at', 'version'])
$function$;
-- execute: authenticated:EXECUTE

CREATE OR REPLACE FUNCTION private.estado_de_los_avisos(p_usuario uuid, p_endpoint text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select jsonb_build_object(
    'suscripto', exists (
      select 1 from private.suscripciones_de_avisos s
      where s.user_id = p_usuario and s.endpoint = p_endpoint
    ),
    'ultimo_envio', (
      select s.ultimo_envio from private.suscripciones_de_avisos s
      where s.user_id = p_usuario and s.endpoint = p_endpoint
    ),
    'dispositivos', (
      select count(*) from private.suscripciones_de_avisos s where s.user_id = p_usuario
    ),
    'preferencias', (
      select jsonb_build_object(
        'zona', p.zona,
        'hora', to_char(p.hora, 'HH24:MI'),
        'avisos', private.avisos_completos(p.avisos)
      )
      from private.preferencias_de_avisos p
      where p.user_id = p_usuario
    )
  )
$function$;
-- execute: solo el dueño
comment on function private.estado_de_los_avisos(uuid,text) is 'Si este dispositivo recibe avisos, cuándo salió el último, cuántos dispositivos tiene la persona y sus preferencias. Solo la llaman las funciones de avisos.';

CREATE OR REPLACE FUNCTION private.estado_de_mis_avisos(p_endpoint text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select private.estado_de_los_avisos((select auth.uid()), p_endpoint)
$function$;
-- execute: authenticated:EXECUTE

CREATE OR REPLACE FUNCTION private.fecha_de_apertura(p_household_id uuid)
 RETURNS date
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select min(m.fecha)
  from public.movimientos m
  where m.household_id = p_household_id
    and m.tipo = 'ajuste'
    and m.categoria = 'Apertura'
    and m.deleted_at is null
$function$;
-- execute: authenticated:EXECUTE
comment on function private.fecha_de_apertura(uuid) is 'El día de la apertura del household: el primer ajuste con la categoría «Apertura», que es lo que escribe la migración del sistema viejo (ADR 0017). Null si el taller no vino de una migración. Gemela de fechaDeApertura de @maun/domain.';

CREATE OR REPLACE FUNCTION private.fila_de_siempre(p_sueldo_centavos bigint, p_fijos_centavos bigint, p_sueldo_tope_mensual boolean, p_hogar uuid, p_maun uuid, p_diezmo uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_pasos jsonb := '[]'::jsonb;
begin
  if num_nulls(p_sueldo_centavos, p_fijos_centavos, p_sueldo_tope_mensual, p_hogar, p_maun, p_diezmo) > 0 then
    raise exception 'La fila de siempre necesita todos sus parámetros' using errcode = '22004';
  end if;
  if p_sueldo_centavos < 0 or p_fijos_centavos < 0 then
    raise exception 'El sueldo y los costos fijos no pueden ser negativos' using errcode = '22023';
  end if;
  if p_sueldo_centavos > 9007199254740991 or p_fijos_centavos > 9007199254740991 then
    raise exception 'El sueldo o los costos fijos pasan el máximo que se puede contar sin perder centavos' using errcode = '22003';
  end if;

  if p_sueldo_centavos > 0 then
    v_pasos := v_pasos || jsonb_build_array(jsonb_build_object(
      'tesoro', p_hogar, 'clase', 'sueldo', 'tope', p_sueldo_centavos, 'renglones', '[]'::jsonb,
      'desde', null, 'modo', 'mes', 'hastaLaMeta', false
    ));
  end if;
  if p_fijos_centavos > 0 then
    v_pasos := v_pasos || jsonb_build_array(jsonb_build_object(
      'tesoro', p_maun, 'clase', 'fijos', 'tope', p_fijos_centavos,
      'renglones', jsonb_build_array(
        jsonb_build_object('nombre', 'Costos fijos', 'monto', p_fijos_centavos, 'dia', null)
      ),
      'desde', null, 'modo', 'mes', 'hastaLaMeta', false
    ));
  end if;

  return jsonb_build_object(
    'obligaciones', jsonb_build_array(
      jsonb_build_object('tesoro', p_diezmo, 'porcentaje', 1000, 'base', 'ingreso')
    ),
    'pasos', v_pasos,
    'reparto', '[]'::jsonb,
    'superavit', p_maun,
    'sueldoPorTrabajo', not p_sueldo_tope_mensual
  );
end;
$function$;
-- execute: solo el dueño
comment on function private.fila_de_siempre(bigint,bigint,boolean,uuid,uuid,uuid) is 'La fila de un taller que nunca guardó la suya: el diezmo al 10% sobre el ingreso como única obligación, el sueldo al hogar y los costos fijos apartados en el taller, por mes, y el superávit en Maun, como la cascada de antes. Gemela de filaDeSiempre en fila.ts (ADR 0078).';

CREATE OR REPLACE FUNCTION private.formas_de_cobro(p_guardado forma_de_cobro[], p_hay_como_transferir boolean)
 RETURNS forma_de_cobro[]
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    p_guardado,
    case
      when p_hay_como_transferir then array['transferencia', 'efectivo']::public.forma_de_cobro[]
      else array['efectivo']::public.forma_de_cobro[]
    end
  );
$function$;
-- execute: authenticated:EXECUTE
comment on function private.formas_de_cobro(forma_de_cobro[],boolean) is 'Las formas que valen para una instancia de pago: lo que el dueño guardó, o el valor por defecto. Por defecto son las dos, salvo que el taller no tenga ni alias ni CBU cargados en Ajustes, y entonces solo efectivo: ofrecer transferencia sin adónde transferir sería mandarle al cliente una pantalla vacía. Tiene gemela en TypeScript (formasDeCobro, en @maun/domain), que es la que usa la pantalla del dueño; las dos se comparan en scripts/comparacion.ts (ADR 0053).';

CREATE OR REPLACE FUNCTION private.guardar_el_presupuesto(p_id uuid, p_proyecto_id uuid, p_version integer, p_contenido jsonb)
 RETURNS presupuestos
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid := private.household_actual();
  v_proyecto public.proyectos;
  v_presupuesto public.presupuestos;
  v_problema text;
begin
  if num_nulls(p_id, p_proyecto_id, p_version, p_contenido) > 0 then
    raise exception 'Guardar el presupuesto necesita su id, el trabajo, la revisión que viste y el borrador'
      using errcode = '22004';
  end if;

  -- El trabajo, bloqueado antes de mirar el borrador: un envío o un guardado del mismo trabajo que
  -- corre en paralelo termina antes o espera. Sin RLS acá adentro, toda lectura va por el taller de la
  -- sesión.
  select p.* into v_proyecto
  from public.proyectos p
  where p.household_id = v_household and p.id = p_proyecto_id
  for update;

  if not found then
    raise exception 'El trabajo no existe o no es tuyo' using errcode = '42501';
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  select b.* into v_presupuesto
  from public.presupuestos b
  where b.household_id = v_household and b.proyecto_id = p_proyecto_id and b.deleted_at is null;

  -- El reenvío de la cola: este mismo borrador ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_presupuesto.id = p_id
    and v_presupuesto.borrador_version = p_version + 1
    and v_presupuesto.contenido = p_contenido
  then
    return v_presupuesto;
  end if;

  -- Otro aparato lo cambió, o lo arrancó con otro id mientras este no tenía señal: el mismo rechazo, y
  -- antes del insert, porque el índice único daría un 23505 que tapa la cola.
  if (v_presupuesto.id is not null and v_presupuesto.id <> p_id)
    or coalesce(v_presupuesto.borrador_version, 0) <> p_version
  then
    raise exception 'Este presupuesto se cambió en otro aparato.'
      using errcode = 'MN026',
            detail = case
              when v_presupuesto.id <> p_id then 'el trabajo ya tiene otro borrador'
              else format(
                'revisión vista %s, revisión actual %s', p_version, coalesce(v_presupuesto.borrador_version, 0)
              )
            end,
            hint = 'Abrilo de nuevo para ver la última versión y seguí desde ahí.';
  end if;

  if v_proyecto.estado in ('en_curso', 'entregado', 'cobrado') then
    raise exception 'Ya lo aprobó: el presupuesto no se cambia.'
      using errcode = 'MN028',
            detail = v_proyecto.estado::text,
            hint = 'Un cambio después de la seña se arregla aparte con tu cliente.';
  end if;

  if v_proyecto.estado = 'perdido' then
    raise exception 'Este trabajo está perdido: su presupuesto no se cambia.'
      using errcode = 'MN032',
            detail = 'perdido',
            hint = 'Si el cliente volvió, reactivalo desde la ficha y seguí desde ahí.';
  end if;

  -- El código del problema va en el detail, para el registro. La pantalla no deja escribir de más.
  v_problema := private.problema_del_presupuesto(p_contenido);
  if v_problema is not null then
    raise exception 'El presupuesto no se pudo guardar.'
      using errcode = 'MN031',
            detail = v_problema,
            hint = 'Revisalo y probá de nuevo.';
  end if;

  if v_presupuesto.id is null then
    insert into public.presupuestos (id, household_id, proyecto_id, contenido, borrador_version)
    values (p_id, v_household, p_proyecto_id, p_contenido, 1)
    returning * into v_presupuesto;
  else
    update public.presupuestos set
      contenido = p_contenido,
      borrador_version = borrador_version + 1
    where id = v_presupuesto.id
    returning * into v_presupuesto;
  end if;

  return v_presupuesto;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.guardar_el_presupuesto(uuid,uuid,integer,jsonb) is 'Guarda el borrador del presupuesto de un trabajo con el molde de private.guardar_la_fila(): bloquea el trabajo, compara la revisión del borrador que vio la app (MN026, también si el trabajo ya tiene otro borrador vivo, antes del insert), rechaza si el trabajo está aprobado (MN028) o perdido (MN032), valida con private.problema_del_presupuesto() (MN031, con el código en el detail), hace el alta o la edición y suma uno a borrador_version. Reconoce el reenvío idéntico: el mismo borrador con la revisión siguiente. Toda lectura filtra por el taller de la sesión (ADR 0080).';

CREATE OR REPLACE FUNCTION private.guardar_la_fila(p_version integer, p_fila jsonb)
 RETURNS ajustes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_ajustes public.ajustes;
  v_tesoros jsonb;
  v_problema text;
begin
  if p_version is null then
    raise exception 'Guardar la fila necesita la revisión que viste' using errcode = '22004';
  end if;

  -- El mismo candado que una liquidación: un cobro del taller ve la fila de antes o la de después,
  -- nunca una a medias, y dos guardados a la vez se esperan.
  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = private.household_actual()
  for no key update;

  if not found then
    raise exception 'El household no tiene ajustes' using errcode = 'P0002';
  end if;

  -- El reenvío de la cola: esta misma fila ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_ajustes.fila_version = p_version + 1 and v_ajustes.fila is not distinct from p_fila then
    return v_ajustes;
  end if;

  if v_ajustes.fila_version <> p_version then
    raise exception 'La fila cambió desde que la abriste.'
      using errcode = 'MN006',
            detail = format('revisión vista %s, revisión actual %s', p_version, v_ajustes.fila_version);
  end if;

  -- Null vuelve a la fila de siempre. La pantalla no lo ofrece: lo usan los e2e para dejar sin fila
  -- el taller de prueba.
  if p_fila is not null then
    -- Los tesoros del taller con su meta: la de Cocos sigue en ajustes, la de los demás en tesoros.
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', t.id,
          'clave', t.clave,
          'archivado', t.archivado_at is not null,
          'meta', case when t.clave = 'cocos' then v_ajustes.meta_cocos_centavos else t.meta_centavos end
        )
      ),
      '[]'::jsonb
    )
    into v_tesoros
    from public.tesoros t
    where t.household_id = v_ajustes.household_id
      and t.deleted_at is null;

    -- El código del problema va en el detail, para el registro. La app no lo lee: la pantalla ya
    -- frena antes con problemasDeLaFila, que es la misma cuenta.
    v_problema := private.problema_de_la_fila(p_fila, v_tesoros);
    if v_problema is not null then
      raise exception 'La fila no se pudo guardar.'
        using errcode = 'MN023',
              detail = v_problema,
              hint = 'Revisala y probá de nuevo.';
    end if;
  end if;

  update public.ajustes set
    fila = p_fila,
    fila_version = fila_version + 1,
    fila_guardada_at = clock_timestamp()
  where id = v_ajustes.id
  returning * into v_ajustes;

  return v_ajustes;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.guardar_la_fila(integer,jsonb) is 'Guarda la fila del taller: bloquea los ajustes, compara la revisión que vio la app (MN006), valida la fila con private.problema_de_la_fila() contra los tesoros del taller y sus metas (la de Cocos, de ajustes) (MN023, con el código del problema en el detail), la guarda, suma una revisión y anota la fecha. Con la fila en null vuelve a la fila de siempre. Reconoce el reenvío idéntico: la misma fila con la revisión siguiente. Los cambios valen desde el próximo cobro: no toca ninguna liquidación hecha (ADR 0003 y 0078).';

CREATE OR REPLACE FUNCTION private.guardar_la_plantilla_del_presupuesto(p_version integer, p_plantilla jsonb)
 RETURNS ajustes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_ajustes public.ajustes;
  v_problema text;
begin
  if p_version is null then
    raise exception 'Guardar la plantilla necesita la revisión que viste' using errcode = '22004';
  end if;

  -- El candado de los ajustes del taller, como guardar_la_fila: dos guardados a la vez se esperan, y
  -- un presupuesto que se está mandando ve la plantilla de antes o la de después.
  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = private.household_actual()
  for no key update;

  if not found then
    raise exception 'El household no tiene ajustes' using errcode = 'P0002';
  end if;

  -- El reenvío de la cola: esta misma plantilla ya se guardó y la respuesta se perdió. Se devuelve tal
  -- cual, sin rechazar algo que salió bien.
  if v_ajustes.plantilla_del_presupuesto_version = p_version + 1
    and v_ajustes.plantilla_del_presupuesto is not distinct from p_plantilla
  then
    return v_ajustes;
  end if;

  if v_ajustes.plantilla_del_presupuesto_version <> p_version then
    raise exception 'Los textos del presupuesto se cambiaron en otro aparato.'
      using errcode = 'MN030',
            detail = format(
              'revisión vista %s, revisión actual %s', p_version, v_ajustes.plantilla_del_presupuesto_version
            ),
            hint = 'Abrí la pantalla de nuevo y volvé a guardar.';
  end if;

  -- Null vuelve a la plantilla de siempre: es «Volver a los textos de siempre» de Ajustes.
  if p_plantilla is not null then
    -- El código del problema va en el detail, para el registro. La pantalla ya frena antes con
    -- problemaDeLaPlantilla, que es la misma cuenta.
    v_problema := private.problema_de_la_plantilla(p_plantilla);
    if v_problema is not null then
      raise exception 'Los textos del presupuesto no se pudieron guardar.'
        using errcode = 'MN031',
              detail = v_problema,
              hint = 'Revisalos y probá de nuevo.';
    end if;
  end if;

  update public.ajustes set
    plantilla_del_presupuesto = p_plantilla,
    plantilla_del_presupuesto_version = plantilla_del_presupuesto_version + 1
  where id = v_ajustes.id
  returning * into v_ajustes;

  return v_ajustes;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.guardar_la_plantilla_del_presupuesto(integer,jsonb) is 'Guarda la plantilla del presupuesto del taller con el molde de private.guardar_la_fila(): bloquea los ajustes, compara la revisión que vio la app (MN030), valida la plantilla con private.problema_de_la_plantilla() (MN031, con el código del problema en el detail), la guarda y suma una revisión. Con la plantilla en null vuelve a la de siempre. Reconoce el reenvío idéntico: la misma plantilla con la revisión siguiente. No toca ningún presupuesto ya mandado (ADR 0080).';

CREATE OR REPLACE FUNCTION private.guardar_preferencias_de_avisos(p_zona text, p_hora time without time zone, p_avisos jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_usuario uuid := (select auth.uid());
begin
  if v_usuario is null then
    raise exception 'Hace falta una sesión para cambiar los avisos' using errcode = '42501';
  end if;
  perform private.validar_zona(p_zona);
  if p_hora is null or not private.avisos_bien_formados(p_avisos) then
    raise exception 'Las preferencias de avisos no tienen la forma esperada' using errcode = '22023';
  end if;

  insert into private.preferencias_de_avisos (user_id, zona, hora, avisos)
  values (v_usuario, p_zona, p_hora, p_avisos)
  on conflict (user_id) do update set
    zona = excluded.zona,
    hora = excluded.hora,
    avisos = excluded.avisos,
    actualizada_en = now();

  return private.estado_de_los_avisos(v_usuario, null);
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.guardar_preferencias_de_avisos(text,time without time zone,jsonb) is 'Guarda la zona horaria, la hora y qué avisa, para el usuario de la sesión.';

CREATE OR REPLACE FUNCTION private.household_actual()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_household uuid;
begin
  select id into v_household from private.user_household_ids() as id limit 1;

  if v_household is null then
    raise exception 'El usuario no pertenece a ningún household'
      using errcode = '42501',
            hint = 'La cuenta existe en Auth pero nadie la asignó a un taller.';
  end if;

  return v_household;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.household_actual() is 'Household del usuario de la sesión. Es el default de household_id en todas las tablas: el cliente no lo manda nunca.';

CREATE OR REPLACE FUNCTION private.hoy_en_el_taller()
 RETURNS date
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    nullif(current_setting('maun.hoy_en_el_taller', true), '')::date,
    (now() at time zone 'America/Argentina/Buenos_Aires')::date
  )
$function$;
-- execute: authenticated:EXECUTE
comment on function private.hoy_en_el_taller() is 'El día de hoy en Argentina, donde está el taller. Sirve solo para rechazar una fecha que todavía no llegó: la fecha de un pago o de un cobro la manda la app, nunca sale de acá. Los tests la fijan con el setting maun.hoy_en_el_taller, porque sus fechas son fijas y el calendario no.';

CREATE OR REPLACE FUNCTION private.liquidacion_valida(p_desde estado_proyecto, p_hacia estado_proyecto)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    case p_hacia
      when 'cobrado' then p_desde = 'entregado'
      when 'perdido' then p_desde in (
        'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado',
        'en_seguimiento', 'en_curso'
      )
      else false
    end,
    false
  )
$function$;
-- execute: authenticated:EXECUTE
comment on function private.liquidacion_valida(estado_proyecto,estado_proyecto) is 'Desde qué estado se liquida hacia cobrado o perdido. Un «por ahora no» también se da por perdido. Gemela de puedeLiquidar de @maun/domain.';

CREATE OR REPLACE FUNCTION private.liquidar(p_destino estado_proyecto, p_proyecto_id uuid, p_version integer, p_fecha date, p_cobrado_centavos bigint, p_gastos_centavos bigint, p_tope_sueldo_centavos bigint, p_tope_fijos_centavos bigint, p_diezmo_centavos bigint, p_sueldo_centavos bigint, p_fijos_centavos bigint, p_remanente_centavos bigint, p_diezmo_bp integer, p_sueldo_previo_centavos bigint DEFAULT NULL::bigint, p_fijos_previo_centavos bigint DEFAULT NULL::bigint, p_ya_en_la_apertura boolean DEFAULT false, p_fila_version integer DEFAULT NULL::integer, p_repartos jsonb DEFAULT NULL::jsonb, p_previo jsonb DEFAULT NULL::jsonb)
 RETURNS proyectos
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  -- DIEZMO de @maun/domain.
  c_diezmo_bp constant integer := 1000;
  c_formato_id constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_proyecto public.proyectos;
  v_ajustes public.ajustes;
  v_fecha date;
  v_inicio_mes date;
  v_fin_mes date;
  v_diezmo_bp integer;
  v_objetivo_sueldo bigint;
  v_objetivo_fijos bigint;
  v_sueldo_mensual boolean;
  v_sueldo_previo bigint;
  v_fijos_previo bigint;
  v_topes record;
  v_topes_vistos record;
  v_ajustada boolean := false;
  v_cobrado bigint;
  v_gastos bigint;
  v_dist record;
  v_dist_vista record;
  v_apertura date;
  v_hogar uuid;
  v_maun uuid;
  v_diezmo uuid;
  v_fila jsonb;
  v_fila_version integer;
  v_plan record;
  v_mes jsonb;
  v_saldos jsonb;
  v_metas jsonb;
  v_previo record;
  v_previos bigint[];
  v_topes_de_las_partes bigint[];
  v_previos_vistos bigint[];
  v_topes_vistos_de_las_partes bigint[];
  v_previo_base jsonb;
  v_reparto record;
  v_reparto_visto record;
  v_obligaciones integer;
  v_pasos integer;
  v_partes integer;
  v_esperados_tesoros uuid[];
  v_esperados_montos bigint[];
  v_diezmo_visto bigint;
  v_diezmo_monto bigint;
  v_elemento jsonb;
  v_posicion integer;
  v_tesoro uuid;
  v_monto bigint;
  i integer;
begin
  -- La fecha la manda la app, que es la que sabe qué día pasó. Sin fecha no se liquida: la base no
  -- la inventa.
  if p_fecha is null then
    raise exception 'La liquidación necesita su fecha'
      using errcode = 'MN016',
            hint = 'Poné el día del cobro, o del cierre si lo das por perdido.';
  end if;

  if num_nulls(
    p_destino, p_proyecto_id, p_version, p_cobrado_centavos, p_gastos_centavos,
    p_tope_sueldo_centavos, p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos,
    p_fijos_centavos, p_remanente_centavos, p_ya_en_la_apertura
  ) > 0 then
    raise exception 'La liquidación necesita todos sus parámetros' using errcode = '22004';
  end if;

  -- El acumulado del mes son dos números o ninguno: con uno solo no se puede saber si la app vio
  -- lo mismo que la base.
  if num_nulls(p_sueldo_previo_centavos, p_fijos_previo_centavos) = 1 then
    raise exception 'El acumulado del mes va entero o no va' using errcode = '22004';
  end if;

  -- La revisión de la fila viaja con sus repartos, y lo que vio la app solo con ellos.
  if (p_fila_version is null) <> (p_repartos is null)
    or (p_fila_version is null and p_previo is not null)
  then
    raise exception 'La fila del cobro va con sus repartos' using errcode = '22004';
  end if;

  if p_repartos is not null and jsonb_typeof(p_repartos) <> 'array' then
    raise exception 'Los repartos van en una lista' using errcode = '22023';
  end if;
  if p_previo is not null and jsonb_typeof(p_previo) <> 'object' then
    raise exception 'Lo que vio la app va como {tesoro: centavos}' using errcode = '22023';
  end if;

  if p_destino not in ('cobrado', 'perdido') then
    raise exception 'Solo se liquida hacia cobrado o perdido' using errcode = '22023';
  end if;

  -- El diezmo de un perdido es un dato (ajustes.perdido_con_diezmo y, por la fila, su porcentaje), no
  -- una regla: la app manda el que vio, y si cambió es MN006. En un cobro no se manda: si cambia, MN008.
  if p_destino = 'perdido' and p_diezmo_bp is null then
    raise exception 'El cierre de un perdido necesita el diezmo que vio el usuario' using errcode = '22004';
  end if;

  -- Primer lock: el proyecto. La guarda de pagos y gastos toma for share sobre esta misma fila, así
  -- que un pago que llega en el mismo instante espera a que la liquidación termine (y entonces lo
  -- ve liquidado), o la liquidación espera a que el pago termine (y entonces lo suma).
  select p.* into v_proyecto
  from public.proyectos p
  where p.id = p_proyecto_id
    and p.household_id = any (array(select private.user_household_ids()))
  for update;

  if not found then
    raise exception 'El proyecto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El reenvío de la cola se reconoce antes de elegir el camino: esta misma liquidación ya se aplicó
  -- (la versión subió exactamente uno) y la respuesta se perdió. Se devuelve la fila tal cual, sin
  -- rechazar algo que salió bien. Va antes de mirar la fecha contra hoy: un reenvío que llega días
  -- después sigue siendo el mismo cobro. Un cobro de antes que se reenvía después de guardar la fila
  -- entra acá y no sale MN025.
  if p_fila_version is null
    and v_proyecto.dist_fila_version is null
    and v_proyecto.estado = p_destino
    and v_proyecto.version = p_version + 1
    and (
      v_proyecto.fecha_cobro, v_proyecto.dist_cobrado_centavos, v_proyecto.dist_gastos_centavos,
      v_proyecto.dist_tope_sueldo_centavos, v_proyecto.dist_tope_fijos_centavos,
      v_proyecto.dist_diezmo_centavos, v_proyecto.dist_sueldo_centavos,
      v_proyecto.dist_fijos_centavos, v_proyecto.dist_remanente_centavos,
      v_proyecto.reparto_ya_en_la_apertura
    ) = (
      p_fecha, p_cobrado_centavos, p_gastos_centavos, p_tope_sueldo_centavos,
      p_tope_fijos_centavos, p_diezmo_centavos, p_sueldo_centavos, p_fijos_centavos,
      p_remanente_centavos, p_ya_en_la_apertura
    )
    and (p_diezmo_bp is null or v_proyecto.dist_diezmo_bp = p_diezmo_bp)
  then
    return v_proyecto;
  end if;

  -- El reenvío de una liquidación de antes que salió ajustada. Los topes y los cuatro escalones
  -- congelados no son los que mandó la app —ese es justamente el ajuste—, así que el reenvío se
  -- reconoce por las entradas que la app sí controla. La última condición es la guarda: esta rama
  -- solo vale cuando el acumulado que vio la app no es el que quedó congelado, que es la definición
  -- de ajustada. Es lo que recibe una app vieja que cobra después de una nueva en el mismo mes.
  if p_fila_version is null
    and p_sueldo_previo_centavos is not null
    and v_proyecto.dist_fila_version is null
    and v_proyecto.estado = p_destino
    and v_proyecto.version = p_version + 1
    and (
      v_proyecto.fecha_cobro, v_proyecto.dist_cobrado_centavos, v_proyecto.dist_gastos_centavos,
      v_proyecto.reparto_ya_en_la_apertura
    ) = (
      p_fecha, p_cobrado_centavos, p_gastos_centavos, p_ya_en_la_apertura
    )
    and (p_diezmo_bp is null or v_proyecto.dist_diezmo_bp = p_diezmo_bp)
    and (v_proyecto.dist_sueldo_previo_centavos, v_proyecto.dist_fijos_previo_centavos)
      is distinct from (p_sueldo_previo_centavos, p_fijos_previo_centavos)
  then
    return v_proyecto;
  end if;

  -- El reenvío de un cobro por la fila, ajustado o no: la misma revisión, las mismas entradas y los
  -- mismos ids de repartos en el mismo lugar. Los montos tienen que ser los mismos salvo que la
  -- liquidación haya salido ajustada, que es cuando lo que vio la app no es lo congelado: los pasos y
  -- las partes de la fila son los de los repartos congelados.
  if p_fila_version is not null
    and v_proyecto.dist_fila_version = p_fila_version
    and v_proyecto.estado = p_destino
    and v_proyecto.version = p_version + 1
    and (
      v_proyecto.fecha_cobro, v_proyecto.dist_cobrado_centavos, v_proyecto.dist_gastos_centavos,
      v_proyecto.reparto_ya_en_la_apertura
    ) = (
      p_fecha, p_cobrado_centavos, p_gastos_centavos, p_ya_en_la_apertura
    )
    and (p_diezmo_bp is null or v_proyecto.dist_diezmo_bp = p_diezmo_bp)
    and not exists (
      select 1
      from (
        select r.id::text as id, r.posicion::integer as posicion, r.monto_centavos as monto
        from public.repartos r
        where r.household_id = v_proyecto.household_id
          and r.proyecto_id = v_proyecto.id
          and r.deleted_at is null
      ) as congelado
      full join (
        select e.value ->> 'id' as id, e.n::integer as posicion,
          private.entero_de_json(e.value -> 'monto_centavos') as monto
        from jsonb_array_elements(p_repartos) with ordinality as e (value, n)
      ) as pedido on pedido.posicion = congelado.posicion
      where congelado.id is distinct from pedido.id
        or (
          congelado.monto is distinct from pedido.monto
          and not private.lo_del_mes_es_otro(
            array(
              select r.tesoro_id from public.repartos r
              where r.household_id = v_proyecto.household_id and r.proyecto_id = v_proyecto.id
                and r.deleted_at is null and r.tipo = 'paso'
              order by r.posicion
            ),
            array(
              select r.tesoro_id from public.repartos r
              where r.household_id = v_proyecto.household_id and r.proyecto_id = v_proyecto.id
                and r.deleted_at is null and r.tipo = 'parte'
              order by r.posicion
            ),
            p_previo,
            v_proyecto.dist_previo
          )
        )
    )
  then
    return v_proyecto;
  end if;

  if p_fecha > private.hoy_en_el_taller() then
    raise exception 'La fecha es de un día que todavía no llegó'
      using errcode = 'MN017',
            detail = format('fecha %s, hoy %s', p_fecha, private.hoy_en_el_taller()),
            hint = 'Poné el día en que pasó: hoy o antes.';
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  if v_proyecto.estado in ('cobrado', 'perdido') then
    raise exception 'El proyecto ya está %', v_proyecto.estado using errcode = 'MN001';
  end if;

  if not private.liquidacion_valida(v_proyecto.estado, p_destino) then
    raise exception '%', case p_destino
        when 'cobrado' then format('Solo se cobra un proyecto entregado, y este está en %s', v_proyecto.estado)
        else 'Lo entregado no se da por perdido: se cobra'
      end
      using errcode = 'MN007';
  end if;

  if v_proyecto.version <> p_version then
    raise exception 'El proyecto cambió desde que lo viste'
      using errcode = 'MN006',
            detail = format('versión vista %s, versión actual %s', p_version, v_proyecto.version);
  end if;

  -- Un reparto que ya estaba en los saldos de arranque tiene que ser de antes de la apertura. Si no,
  -- esa plata desaparecería de los tesoros sin que nadie la haya contado.
  if p_ya_en_la_apertura then
    v_apertura := private.fecha_de_apertura(v_proyecto.household_id);
    if v_apertura is null or p_fecha >= v_apertura then
      raise exception 'Ese cobro no es de antes de que empezaras con la app'
        using errcode = 'MN018',
              detail = format('fecha %s, apertura %s', p_fecha, coalesce(v_apertura::text, 'ninguna')),
              hint = 'Solo la plata de antes de la apertura puede estar en los saldos con los que arrancaste.';
    end if;
  end if;

  -- Segundo lock: la fila de ajustes del household. Toda liquidación, toda reversión, guardar la fila
  -- y todo movimiento la toman, así que se serializan y la segunda suma el mes y lee los saldos
  -- después de que la primera commiteó. for no key update: choca con otra liquidación y con una
  -- edición de los ajustes, no con las foreign keys. Es por household, más grueso que por mes
  -- (ADR 0011).
  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = v_proyecto.household_id
  for no key update;

  if not found then
    raise exception 'El household no tiene ajustes' using errcode = 'P0002';
  end if;

  v_fecha := p_fecha;
  v_inicio_mes := make_date(extract(year from v_fecha)::integer, extract(month from v_fecha)::integer, 1);
  v_fin_mes := (v_inicio_mes + interval '1 month')::date;

  select t.id into v_hogar
  from public.tesoros t
  where t.household_id = v_proyecto.household_id and t.clave = 'hogar';

  select t.id into v_maun
  from public.tesoros t
  where t.household_id = v_proyecto.household_id and t.clave = 'maun';

  select t.id into v_diezmo
  from public.tesoros t
  where t.household_id = v_proyecto.household_id and t.clave = 'diezmo';

  select coalesce(sum(g.monto_centavos), 0) into v_cobrado
  from public.pagos g
  where g.household_id = v_proyecto.household_id
    and g.proyecto_id = v_proyecto.id
    and g.deleted_at is null;

  select coalesce(sum(g.monto_centavos), 0) into v_gastos
  from public.gastos g
  where g.household_id = v_proyecto.household_id
    and g.proyecto_id = v_proyecto.id
    and g.deleted_at is null;

  if p_fila_version is null then
    -- Una app sin actualizar no conoce la fila: con la fila guardada, o al volver a cobrar un reabierto
    -- que se había cobrado por la fila, repartir por el camino de antes sería repartir distinto de lo
    -- que el dueño armó.
    if v_ajustes.fila is not null
      or (p_destino = 'cobrado' and v_proyecto.reapertura_fila is not null)
    then
      raise exception 'Actualizá la app para cobrar con tu fila.' using errcode = 'MN025';
    end if;

    -- El camino de antes. Con qué fecha, diezmo y objetivos se liquida: gemela de planDeLiquidacion.
    if p_destino = 'perdido' then
      -- Un cierre como perdido es un evento nuevo: no usa la foto de una reapertura. El sueldo del
      -- perdido es un objetivo en cero cuando perdido_con_sueldo está apagado, no otra cascada.
      v_diezmo_bp := case when v_ajustes.perdido_con_diezmo then c_diezmo_bp else 0 end;
      v_objetivo_sueldo := case when v_ajustes.perdido_con_sueldo then v_ajustes.sueldo_mensual_centavos else 0 end;
      v_objetivo_fijos := v_ajustes.costos_fijos_centavos;
      v_sueldo_mensual := v_ajustes.sueldo_tope_mensual;
    elsif v_proyecto.reapertura_fecha_cobro is not null then
      -- Un cobro reabierto se vuelve a cobrar con los objetivos del original: corregir un gasto no
      -- reescribe el sueldo con los ajustes de hoy (ADR 0003). El sueldo va por mes si el original se
      -- cobró por mes o si el taller ya reparte por mes: un cobro de antes del sueldo por mes, reabierto
      -- después, cuenta contra lo que el sueldo de su mes ya recibió (ADR 0079). Con la fila guardada
      -- no se llega acá: rebota antes con MN025.
      v_diezmo_bp := c_diezmo_bp;
      v_objetivo_sueldo := v_proyecto.reapertura_objetivo_sueldo_centavos;
      v_objetivo_fijos := v_proyecto.reapertura_objetivo_fijos_centavos;
      v_sueldo_mensual := v_proyecto.reapertura_sueldo_mensual or v_ajustes.sueldo_tope_mensual;
    else
      v_diezmo_bp := c_diezmo_bp;
      v_objetivo_sueldo := v_ajustes.sueldo_mensual_centavos;
      v_objetivo_fijos := v_ajustes.costos_fijos_centavos;
      v_sueldo_mensual := v_ajustes.sueldo_tope_mensual;
    end if;

    -- Lo que el mes ya lleva liquidado por otros proyectos, en una sentencia posterior al lock de
    -- ajustes. Gemela de liquidadoDelMes. No se guarda en ningún lado: reabrir un proyecto lo saca
    -- de esta suma por el solo hecho de descongelarlo.
    select coalesce(sum(p.dist_sueldo_centavos), 0), coalesce(sum(p.dist_fijos_centavos), 0)
    into v_sueldo_previo, v_fijos_previo
    from public.proyectos p
    where p.household_id = v_proyecto.household_id
      and p.fecha_cobro >= v_inicio_mes
      and p.fecha_cobro < v_fin_mes
      and p.deleted_at is null
      and p.id <> v_proyecto.id;

    -- Y lo que repartieron en el mes los cobros por la fila: el sueldo que llevó Hogar y los gastos
    -- fijos que quedaron en Maun. Sin esto, una app vieja que cobra después de una nueva en el mismo
    -- mes paga el sueldo dos veces.
    select
      v_sueldo_previo + coalesce(sum(r.monto_centavos) filter (where r.clase = 'sueldo'), 0),
      v_fijos_previo + coalesce(sum(r.monto_centavos) filter (where r.clase = 'fijos' and r.tesoro_id = v_maun), 0)
    into v_sueldo_previo, v_fijos_previo
    from public.repartos r
    join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id
    where r.household_id = v_proyecto.household_id
      and r.deleted_at is null
      and r.tipo = 'paso'
      and r.fecha >= v_inicio_mes
      and r.fecha < v_fin_mes
      and p.deleted_at is null
      and p.estado in ('cobrado', 'perdido')
      and p.id <> v_proyecto.id;

    select * into v_topes
    from private.topes_de_la_liquidacion(
      v_objetivo_sueldo, v_objetivo_fijos, v_sueldo_mensual, v_sueldo_previo, v_fijos_previo
    );

    -- La liquidación sale ajustada cuando la app mandó el acumulado del mes y no es el de la base.
    -- Es lo único que la app no podía conocer: otra liquidación del mismo mes hecha en otro
    -- dispositivo, o una reapertura que todavía no replicó.
    v_ajustada := p_sueldo_previo_centavos is not null
      and (p_sueldo_previo_centavos, p_fijos_previo_centavos)
        is distinct from (v_sueldo_previo, v_fijos_previo);

    if v_ajustada then
      select * into v_topes_vistos
      from private.topes_de_la_liquidacion(
        v_objetivo_sueldo, v_objetivo_fijos, v_sueldo_mensual,
        p_sueldo_previo_centavos, p_fijos_previo_centavos
      );
    else
      v_topes_vistos := v_topes;
    end if;

    -- Lo que se congela tiene que salir de lo que el usuario vio. Un tope distinto quiere decir que
    -- la app no veía otra liquidación del mes (o una reapertura), o que cambiaron los ajustes. Con el
    -- acumulado a la vista eso deja de ser una adivinanza: si el acumulado coincide, un tope distinto
    -- solo puede venir de los objetivos, y sigue siendo MN006.
    if v_cobrado <> p_cobrado_centavos
      or v_gastos <> p_gastos_centavos
      or v_diezmo_bp <> coalesce(p_diezmo_bp, v_diezmo_bp)
      or (
        not v_ajustada
        and (
          v_topes.tope_sueldo_centavos <> p_tope_sueldo_centavos
          or v_topes.tope_fijos_centavos <> p_tope_fijos_centavos
        )
      )
    then
      raise exception 'Los pagos, los gastos, los topes o el diezmo cambiaron desde que viste la distribución'
        using errcode = 'MN006',
              detail = format(
                'cobrado %s, gastos %s, tope de sueldo %s, tope de fijos %s, diezmo %s bp, fecha %s; el mes ya llevaba %s de sueldo y %s de fijos',
                v_cobrado, v_gastos, v_topes.tope_sueldo_centavos, v_topes.tope_fijos_centavos, v_diezmo_bp,
                v_fecha, v_sueldo_previo, v_fijos_previo
              );
    end if;

    -- Una liquidación ajustada no afloja el MN008: la app tiene que haber aplicado bien la regla de
    -- los topes contra su propio acumulado. Si ni eso cierra, no es que vio otro mes: es que está
    -- calculando distinto. Va antes de la cascada porque un tope negativo la cortaría con un 22023.
    if v_ajustada
      and (
        v_topes_vistos.tope_sueldo_centavos <> p_tope_sueldo_centavos
        or v_topes_vistos.tope_fijos_centavos <> p_tope_fijos_centavos
      )
    then
      raise exception 'Los topes que viste no son los que salen de ese acumulado: actualizá la app'
        using errcode = 'MN008',
              detail = format(
                'con el mes en %s de sueldo y %s de fijos, los topes son %s y %s',
                p_sueldo_previo_centavos, p_fijos_previo_centavos,
                v_topes_vistos.tope_sueldo_centavos, v_topes_vistos.tope_fijos_centavos
              );
    end if;

    -- Y la distribución que se le mostró tiene que ser la que calcula la base con las entradas que la
    -- app tenía. Si no, la app y la base están aplicando reglas distintas (una versión vieja de la
    -- app, o un bug): mejor un rechazo visible que congelar otra cosa.
    select * into v_dist_vista
    from private.cascada(v_cobrado, v_gastos, v_diezmo_bp, p_tope_sueldo_centavos, p_tope_fijos_centavos);

    if (v_dist_vista.diezmo_centavos, v_dist_vista.sueldo_centavos, v_dist_vista.fijos_centavos, v_dist_vista.remanente_centavos)
      is distinct from (p_diezmo_centavos, p_sueldo_centavos, p_fijos_centavos, p_remanente_centavos)
    then
      raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
        using errcode = 'MN008',
              detail = format(
                'diezmo %s, sueldo %s, fijos %s, remanente %s',
                v_dist_vista.diezmo_centavos, v_dist_vista.sueldo_centavos,
                v_dist_vista.fijos_centavos, v_dist_vista.remanente_centavos
              );
    end if;

    -- Recién acá se congela con el acumulado de la base. Cuando no hubo ajuste, es exactamente la
    -- misma cuenta que acaba de pasar el MN008.
    if v_ajustada then
      select * into v_dist
      from private.cascada(v_cobrado, v_gastos, v_diezmo_bp, v_topes.tope_sueldo_centavos, v_topes.tope_fijos_centavos);
    else
      v_dist := v_dist_vista;
    end if;

    update public.proyectos set
      estado = p_destino,
      fecha_cobro = v_fecha,
      dist_cobrado_centavos = v_cobrado,
      dist_gastos_centavos = v_gastos,
      dist_diezmo_bp = v_diezmo_bp,
      dist_tope_sueldo_centavos = v_topes.tope_sueldo_centavos,
      dist_tope_fijos_centavos = v_topes.tope_fijos_centavos,
      dist_diezmo_centavos = v_dist.diezmo_centavos,
      dist_sueldo_centavos = v_dist.sueldo_centavos,
      dist_fijos_centavos = v_dist.fijos_centavos,
      dist_remanente_centavos = v_dist.remanente_centavos,
      dist_objetivo_sueldo_centavos = v_objetivo_sueldo,
      dist_objetivo_fijos_centavos = v_objetivo_fijos,
      dist_sueldo_mensual = v_sueldo_mensual,
      dist_sueldo_previo_centavos = v_sueldo_previo,
      dist_fijos_previo_centavos = v_fijos_previo,
      dist_liquidado_at = clock_timestamp(),
      reparto_ya_en_la_apertura = p_ya_en_la_apertura,
      reapertura_objetivo_sueldo_centavos = null,
      reapertura_objetivo_fijos_centavos = null,
      reapertura_sueldo_mensual = null,
      reapertura_fecha_cobro = null,
      reapertura_fila = null
    where id = v_proyecto.id
    returning * into v_proyecto;

    return v_proyecto;
  end if;

  -- Por la fila. Con qué fila y qué revisión se reparte, con las mismas reglas que la app: al volver a
  -- cobrar un reabierto, la del cobro original (ADR 0003), o la de siempre armada con su foto si se
  -- había cobrado por el camino de antes; en los demás casos, y siempre en un perdido, que nunca usa
  -- la foto de una reapertura, la de los ajustes. Una fila guardada antes de los tipos de tesoro se
  -- lee con lo de siempre en lo que le falta. En un reabierto, el sueldo va por mes si la foto o el
  -- taller van por mes (sueldo_tope_mensual o la fila guardada): por trabajo queda solo cuando los dos
  -- son por trabajo, como en el seed (ADR 0079).
  if p_destino = 'cobrado' and v_proyecto.reapertura_fila is not null then
    v_fila := v_proyecto.reapertura_fila -> 'fila';
    if v_ajustes.sueldo_tope_mensual or v_ajustes.fila is not null then
      v_fila := jsonb_set(v_fila, '{sueldoPorTrabajo}', 'false'::jsonb);
    end if;
    v_fila_version := (v_proyecto.reapertura_fila ->> 'version')::integer;
  elsif p_destino = 'cobrado' and v_proyecto.reapertura_fecha_cobro is not null then
    v_fila := private.fila_de_siempre(
      v_proyecto.reapertura_objetivo_sueldo_centavos,
      v_proyecto.reapertura_objetivo_fijos_centavos,
      v_proyecto.reapertura_sueldo_mensual or v_ajustes.sueldo_tope_mensual or v_ajustes.fila is not null,
      v_hogar,
      v_maun,
      v_diezmo
    );
    v_fila_version := 0;
  else
    v_fila := coalesce(
      v_ajustes.fila,
      private.fila_de_siempre(
        v_ajustes.sueldo_mensual_centavos,
        v_ajustes.costos_fijos_centavos,
        v_ajustes.sueldo_tope_mensual,
        v_hogar,
        v_maun,
        v_diezmo
      )
    );
    v_fila_version := v_ajustes.fila_version;
  end if;

  if p_fila_version <> v_fila_version then
    raise exception 'La fila cambió desde que la abriste.'
      using errcode = 'MN006',
            detail = format('revisión vista %s, revisión de la fila %s', p_fila_version, v_fila_version);
  end if;

  select * into v_plan
  from private.plan_del_reparto(
    p_destino::text, v_fila, v_ajustes.perdido_con_sueldo, v_ajustes.perdido_con_diezmo, v_diezmo, v_maun
  );
  v_diezmo_bp := v_plan.diezmo_bp;
  v_obligaciones := cardinality(v_plan.obligaciones);
  v_pasos := cardinality(v_plan.tesoros);
  v_partes := cardinality(v_plan.tesoros_del_reparto);

  -- Lo que cada tesoro ya recibió en el mes, en una sentencia posterior al lock de ajustes: el sueldo
  -- y los fijos de las liquidaciones de antes (a Hogar y a Maun), las filas vivas de repartos de los
  -- cobros por la fila, de cualquier tipo, y lo que se le pasó para cubrir el mes. Gemela de loDelMes.
  -- No se guarda en ningún lado salvo en la foto de dist_previo.
  select coalesce(jsonb_object_agg(x.tesoro_id::text, x.monto), '{}'::jsonb)
  into v_mes
  from (
    select todo.tesoro_id, sum(todo.monto)::bigint as monto
    from (
      select v_hogar as tesoro_id, p.dist_sueldo_centavos as monto
      from public.proyectos p
      where p.household_id = v_proyecto.household_id
        and p.fecha_cobro >= v_inicio_mes
        and p.fecha_cobro < v_fin_mes
        and p.deleted_at is null
        and p.id <> v_proyecto.id
        and p.dist_sueldo_centavos <> 0
      union all
      select v_maun, p.dist_fijos_centavos
      from public.proyectos p
      where p.household_id = v_proyecto.household_id
        and p.fecha_cobro >= v_inicio_mes
        and p.fecha_cobro < v_fin_mes
        and p.deleted_at is null
        and p.id <> v_proyecto.id
        and p.dist_fijos_centavos <> 0
      union all
      select r.tesoro_id, r.monto_centavos
      from public.repartos r
      join public.proyectos p on p.household_id = r.household_id and p.id = r.proyecto_id
      where r.household_id = v_proyecto.household_id
        and r.deleted_at is null
        and r.fecha >= v_inicio_mes
        and r.fecha < v_fin_mes
        and p.deleted_at is null
        and p.estado in ('cobrado', 'perdido')
        and p.id <> v_proyecto.id
      union all
      select m.hacia_id, m.monto_centavos
      from public.movimientos m
      where m.household_id = v_proyecto.household_id
        and m.deleted_at is null
        and m.cubre_el_mes = v_inicio_mes
        and m.hacia_id is not null
    ) as todo
    group by todo.tesoro_id
  ) as x;

  -- El saldo de cada tesoro de la fila, como lo cuenta el libro, y su meta: la de Cocos es la de
  -- ajustes. También después del lock: todo movimiento, toda liquidación y toda reversión lo toman,
  -- así que el saldo que se lee es entero.
  select coalesce(jsonb_object_agg(s.tesoro_id::text, s.saldo), '{}'::jsonb)
  into v_saldos
  from (
    select l.tesoro_id, sum(l.monto_centavos)::bigint as saldo
    from public.libro_mayor l
    where l.household_id = v_proyecto.household_id
      and not l.ya_en_la_apertura
      and l.tesoro_id = any (v_plan.tesoros || v_plan.tesoros_del_reparto)
    group by l.tesoro_id
  ) as s;

  select coalesce(jsonb_object_agg(m.id::text, m.meta), '{}'::jsonb)
  into v_metas
  from (
    select t.id, case when t.clave = 'cocos' then v_ajustes.meta_cocos_centavos else t.meta_centavos end as meta
    from public.tesoros t
    where t.household_id = v_proyecto.household_id
      and t.id = any (v_plan.tesoros || v_plan.tesoros_del_reparto)
  ) as m
  where coalesce(m.meta, 0) > 0;

  -- El previo de cada paso según su modo, con el piso de su meta, y el tope de cada parte que va hasta
  -- la meta. Gemela de previoDelMes. dist_previo guarda uno por paso, también los que están en cero, y
  -- uno por parte con tope: es previoQueVio.
  select * into v_previo
  from private.previo_del_mes(
    v_plan.tesoros, v_plan.objetivos, v_plan.modos, v_plan.hasta_la_meta,
    v_plan.tesoros_del_reparto, v_plan.hasta_la_meta_del_reparto, v_mes, v_saldos, v_metas
  );
  v_previos := v_previo.previos;
  v_topes_de_las_partes := v_previo.topes;

  select coalesce(jsonb_object_agg(x.tesoro, x.monto), '{}'::jsonb)
  into v_previo_base
  from (
    select u.t::text as tesoro, u.m as monto
    from unnest(v_plan.tesoros, v_previos) as u (t, m)
    union all
    select u.t::text, u.m
    from unnest(v_plan.tesoros_del_reparto, v_topes_de_las_partes) as u (t, m)
    where u.m is not null
  ) as x;

  v_ajustada := private.lo_del_mes_es_otro(v_plan.tesoros, v_plan.tesoros_del_reparto, p_previo, v_previo_base);

  -- Lo que vio la app, como previoDeLoVisto: un paso sin su número arranca en cero y una parte sin el
  -- suyo junta sin fin.
  if v_ajustada then
    select coalesce(
      array_agg(coalesce(private.entero_de_json(p_previo -> u.t::text), 0) order by u.n),
      '{}'
    )
    into v_previos_vistos
    from unnest(v_plan.tesoros) with ordinality as u (t, n);

    select coalesce(array_agg(private.entero_de_json(p_previo -> u.t::text) order by u.n), '{}')
    into v_topes_vistos_de_las_partes
    from unnest(v_plan.tesoros_del_reparto) with ordinality as u (t, n);
  else
    v_previos_vistos := v_previos;
    v_topes_vistos_de_las_partes := v_topes_de_las_partes;
  end if;

  -- Los totales y el diezmo tienen que ser los que vio el usuario, como en el camino de antes. En un
  -- perdido, el diezmo es el porcentaje del diezmo en la fila, o cero si no paga diezmo.
  if v_cobrado <> p_cobrado_centavos
    or v_gastos <> p_gastos_centavos
    or v_diezmo_bp <> coalesce(p_diezmo_bp, v_diezmo_bp)
  then
    raise exception 'Los pagos, los gastos, los topes o el diezmo cambiaron desde que viste la distribución'
      using errcode = 'MN006',
            detail = format(
              'cobrado %s, gastos %s, diezmo %s bp, fecha %s, revisión de la fila %s',
              v_cobrado, v_gastos, v_diezmo_bp, v_fecha, v_fila_version
            );
  end if;

  -- El reparto con lo que vio la app. Si lo que vio no es lo de la base, se ajusta sin rechazar, pero
  -- la cuenta de la app con lo que vio tiene que dar lo que mandó (MN008).
  select * into v_reparto_visto
  from private.repartir_por_la_fila(
    v_cobrado, v_gastos, v_plan.porcentajes_de_obligacion, v_plan.bases,
    v_plan.objetivos, v_previos_vistos, v_plan.por_mes,
    v_plan.porcentajes, v_topes_vistos_de_las_partes
  );

  -- Los repartos que tiene que mandar la app, en el orden de repartosDelCobro: las obligaciones que no
  -- son el diezmo, los pasos, las partes y el superávit si no es Maun, con lo que no alcanzó para el
  -- superávit en cero.
  v_esperados_tesoros := '{}';
  v_esperados_montos := '{}';
  for i in 1 .. v_obligaciones loop
    if i is distinct from v_plan.diezmo_en then
      v_esperados_tesoros := v_esperados_tesoros || v_plan.obligaciones[i];
      v_esperados_montos := v_esperados_montos || v_reparto_visto.obligaciones[i];
    end if;
  end loop;
  v_esperados_tesoros := v_esperados_tesoros || v_plan.tesoros || v_plan.tesoros_del_reparto;
  v_esperados_montos := v_esperados_montos || v_reparto_visto.montos || v_reparto_visto.partes;
  if v_plan.superavit is not null then
    v_esperados_tesoros := v_esperados_tesoros || v_plan.superavit;
    v_esperados_montos := v_esperados_montos || greatest(0, v_reparto_visto.remanente_centavos);
  end if;

  if jsonb_array_length(p_repartos) <> cardinality(v_esperados_tesoros) then
    raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
      using errcode = 'MN008',
            detail = format(
              'la fila tiene %s obligaciones, %s pasos, %s partes y %s superávit aparte',
              v_obligaciones, v_pasos, v_partes, case when v_plan.superavit is null then 'ningún' else 'un' end
            );
  end if;

  for v_elemento, v_posicion in
    select e.value, e.n::integer from jsonb_array_elements(p_repartos) with ordinality as e (value, n)
  loop
    v_tesoro := v_esperados_tesoros[v_posicion];
    v_monto := v_esperados_montos[v_posicion];

    if jsonb_typeof(v_elemento) is distinct from 'object'
      or coalesce(v_elemento ->> 'id', '') !~ c_formato_id
      or private.entero_de_json(v_elemento -> 'posicion') is distinct from v_posicion::bigint
      or (v_elemento ->> 'tesoro_id') is distinct from v_tesoro::text
      or private.entero_de_json(v_elemento -> 'monto_centavos') is distinct from v_monto
    then
      raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
        using errcode = 'MN008',
              detail = format('en el lugar %s va %s a %s', v_posicion, v_monto, v_tesoro);
    end if;
  end loop;

  -- Las columnas de siempre viajan con lo que da columnasDeSiempre: el diezmo es la obligación del
  -- diezmo, los topes y los escalones en cero y el remanente con lo que pasa por Maun antes del
  -- reparto, el ingreso menos el diezmo.
  v_diezmo_visto := case
    when v_plan.diezmo_en is null then 0
    else v_reparto_visto.obligaciones[v_plan.diezmo_en]
  end;

  if (
      p_tope_sueldo_centavos, p_tope_fijos_centavos, p_sueldo_centavos, p_fijos_centavos,
      p_diezmo_centavos, p_remanente_centavos,
      coalesce(p_sueldo_previo_centavos, 0), coalesce(p_fijos_previo_centavos, 0)
    ) is distinct from (
      0::bigint, 0::bigint, 0::bigint, 0::bigint,
      v_diezmo_visto, v_reparto_visto.neta_centavos - v_diezmo_visto,
      0::bigint, 0::bigint
    )
  then
    raise exception 'La distribución que viste no es la que calcula la base: actualizá la app'
      using errcode = 'MN008',
            detail = format(
              'diezmo %s, remanente %s, y los topes, el sueldo, los fijos y lo del mes en cero',
              v_diezmo_visto,
              v_reparto_visto.neta_centavos - v_diezmo_visto
            );
  end if;

  -- Recién acá se congela con lo de la base. Cuando no hubo ajuste, es exactamente la misma cuenta
  -- que acaba de pasar el MN008.
  if v_ajustada then
    select * into v_reparto
    from private.repartir_por_la_fila(
      v_cobrado, v_gastos, v_plan.porcentajes_de_obligacion, v_plan.bases,
      v_plan.objetivos, v_previos, v_plan.por_mes,
      v_plan.porcentajes, v_topes_de_las_partes
    );
  else
    v_reparto := v_reparto_visto;
  end if;

  v_diezmo_monto := case
    when v_plan.diezmo_en is null then 0
    else v_reparto.obligaciones[v_plan.diezmo_en]
  end;

  update public.proyectos set
    estado = p_destino,
    fecha_cobro = v_fecha,
    dist_cobrado_centavos = v_cobrado,
    dist_gastos_centavos = v_gastos,
    dist_diezmo_bp = v_diezmo_bp,
    dist_tope_sueldo_centavos = 0,
    dist_tope_fijos_centavos = 0,
    dist_diezmo_centavos = v_diezmo_monto,
    dist_sueldo_centavos = 0,
    dist_fijos_centavos = 0,
    dist_remanente_centavos = v_reparto.neta_centavos - v_diezmo_monto,
    dist_objetivo_sueldo_centavos = 0,
    dist_objetivo_fijos_centavos = 0,
    dist_sueldo_mensual = true,
    dist_sueldo_previo_centavos = 0,
    dist_fijos_previo_centavos = 0,
    dist_liquidado_at = clock_timestamp(),
    reparto_ya_en_la_apertura = p_ya_en_la_apertura,
    reapertura_objetivo_sueldo_centavos = null,
    reapertura_objetivo_fijos_centavos = null,
    reapertura_sueldo_mensual = null,
    reapertura_fecha_cobro = null,
    reapertura_fila = null,
    dist_fila_version = v_fila_version,
    dist_fila = v_fila,
    dist_previo = v_previo_base
  where id = v_proyecto.id
  returning * into v_proyecto;

  -- Una fila de repartos por cada obligación que no es el diezmo, por paso, por parte y por el
  -- superávit si no es Maun, con los ids de la app y los montos de la base.
  v_posicion := 0;

  for i in 1 .. v_obligaciones loop
    continue when i is not distinct from v_plan.diezmo_en;
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'obligacion', null, null, null, null, null, null,
      v_plan.porcentajes_de_obligacion[i], v_plan.bases[i], v_reparto.obligaciones[i], v_fecha,
      p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.obligaciones[i];
  end loop;

  for i in 1 .. v_pasos loop
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'paso', v_plan.clases[i], v_plan.modos[i], v_plan.objetivos[i],
      v_previos[i], v_reparto.topes[i], v_plan.por_mes[i], null, null, v_reparto.montos[i], v_fecha,
      p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.tesoros[i];
  end loop;

  for i in 1 .. v_partes loop
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'parte', null, null, null, null, v_topes_de_las_partes[i], null,
      v_plan.porcentajes[i], null, v_reparto.partes[i], v_fecha, p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.tesoros_del_reparto[i];
  end loop;

  if v_plan.superavit is not null then
    v_posicion := v_posicion + 1;
    insert into public.repartos (
      id, household_id, proyecto_id, posicion, tesoro_id, nombre, tipo, clase, modo, objetivo_centavos,
      previo_centavos, tope_centavos, por_mes, porcentaje_bp, base, monto_centavos, fecha, ya_en_la_apertura
    )
    select
      (p_repartos -> (v_posicion - 1) ->> 'id')::uuid, v_proyecto.household_id, v_proyecto.id,
      v_posicion, t.id, t.nombre, 'superavit', null, null, null, null, null, null, null, null,
      greatest(0, v_reparto.remanente_centavos), v_fecha, p_ya_en_la_apertura
    from public.tesoros t
    where t.household_id = v_proyecto.household_id and t.id = v_plan.superavit;
  end if;

  return v_proyecto;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.liquidar(estado_proyecto,uuid,integer,date,bigint,bigint,bigint,bigint,bigint,bigint,bigint,bigint,integer,bigint,bigint,boolean,integer,jsonb,jsonb) is 'Liquida un proyecto hacia cobrado o perdido y congela su distribución con la fecha que manda la app, también al volver a cobrar un reabierto (ADR 0063). Rechaza sin fecha (MN016), con una fecha que todavía no llegó (MN017) y un reparto marcado como ya incluido en la apertura con una fecha que no es anterior a ella (MN018). Bloquea el proyecto y después los ajustes. Reconoce el reenvío, ajustado o no, antes de elegir el camino. Sin p_fila_version y sin fila guardada va por el camino de antes (la cascada, con lo del mes que suma también los repartos vivos); sin p_fila_version y con fila guardada, o al volver a cobrar un reabierto que se cobró por la fila, rechaza con MN025; con p_fila_version reparte por la fila (la de su reapertura, la de siempre armada con su foto, o la de los ajustes; en un reabierto el sueldo va por mes si la foto o el taller van por mes, sueldo_tope_mensual o la fila guardada, y lo mismo por el camino de antes), rechaza con MN006 si la revisión no es esa, calcula el previo de cada paso según su modo (lo del mes, su saldo en libro_mayor o nada) con el piso de su meta y el tope de cada parte que va hasta la meta, congela el diezmo (la obligación del tesoro del diezmo) y las columnas de siempre con columnasDeSiempre, la fila en dist_fila y lo que vio en dist_previo, y escribe una fila de public.repartos por cada otra obligación, por paso, por parte y por el superávit si no es Maun, con los ids que manda la app. En los dos caminos: MN006 si la versión, los totales o el diezmo no son los que vio el cliente, MN008 si la distribución no es la de la base, y si lo que vio la app no es lo de la base, se congela con lo de la base en vez de rechazar (ADR 0016, 0078 y 0079).';

CREATE OR REPLACE FUNCTION private.lo_del_mes_es_otro(p_pasos uuid[], p_partes uuid[], p_visto jsonb, p_base jsonb)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select p_visto is not null
    and jsonb_typeof(p_visto) <> 'null'
    and (
      exists (
        select 1
        from unnest(coalesce(p_pasos, '{}')) as u (tesoro)
        where coalesce(private.entero_de_json(case when jsonb_typeof(p_visto) = 'object' then p_visto -> u.tesoro::text end), 0)
          <> coalesce(private.entero_de_json(case when jsonb_typeof(p_base) = 'object' then p_base -> u.tesoro::text end), 0)
      )
      or exists (
        select 1
        from unnest(coalesce(p_partes, '{}')) as u (tesoro)
        where private.entero_de_json(case when jsonb_typeof(p_visto) = 'object' then p_visto -> u.tesoro::text end)
          is distinct from private.entero_de_json(case when jsonb_typeof(p_base) = 'object' then p_base -> u.tesoro::text end)
      )
    )
$function$;
-- execute: solo el dueño
comment on function private.lo_del_mes_es_otro(uuid[],uuid[],jsonb,jsonb) is 'Si lo que la app vio, {tesoro_id: centavos}, no es lo que calculó la base: algún paso con otro previo (el que falta cuenta como cero) o alguna parte con tope en uno y sin tope en el otro, o con otro tope. Las claves que no son de los pasos ni de las partes no se miran. Null en lo visto es que la app no lo mandó: no hay nada con qué ajustar. Gemela de loVistoEsOtro en fila.ts (ADR 0078).';

CREATE OR REPLACE FUNCTION private.lo_que_falta_para_mandar(p_documento jsonb, p_revision integer, p_que_cambio text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_falta text[] := array[]::text[];
  v_valores jsonb := p_documento -> 'valores';
  v_escrito text;
begin
  if coalesce(p_documento ->> 'titulo', '') !~ '[^ \t\n\r\f\v]' then
    v_falta := v_falta || 'titulo'::text;
  end if;

  if not coalesce(
    case
      when jsonb_typeof(p_documento -> 'muebles') = 'array' then exists (
        select 1
        from jsonb_array_elements(p_documento -> 'muebles') as m (valor)
        where coalesce(m.valor ->> 'descripcion', '') ~ '[^ \t\n\r\f\v]'
      )
    end,
    false
  ) then
    v_falta := v_falta || 'muebles'::text;
  end if;

  if jsonb_typeof(v_valores) is distinct from 'object' then
    v_falta := v_falta || 'valores'::text;
  elsif v_valores ->> 'tipo' = 'total' then
    if coalesce(private.entero_de_json(v_valores -> 'total') <= 0, true) then
      v_falta := v_falta || 'valores'::text;
    end if;
  elsif jsonb_typeof(v_valores -> 'opciones') is distinct from 'array' then
    v_falta := v_falta || 'valores'::text;
  elsif jsonb_array_length(v_valores -> 'opciones') = 0
    or exists (
      select 1
      from jsonb_array_elements(v_valores -> 'opciones') as o (valor)
      where coalesce(private.entero_de_json(o.valor -> 'total') <= 0, true)
    )
  then
    v_falta := v_falta || 'valores'::text;
  end if;

  if p_revision > 1 then
    v_escrito := regexp_replace(coalesce(p_que_cambio, ''), '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g');
    if v_escrito = '' or char_length(v_escrito) > 280 then
      v_falta := v_falta || 'queCambio'::text;
    end if;
  end if;

  return v_falta;
end;
$function$;
-- execute: solo el dueño
comment on function private.lo_que_falta_para_mandar(jsonb,integer,text) is 'Lo que le falta a un documento para mandarlo, con los mismos campos y en el mismo orden que problemasParaMandar en presupuesto.ts: titulo si no tiene título, muebles si ningún mueble tiene su detalle, valores si no hay total o alguna opción no tiene importe, y queCambio si desde la segunda revisión no dice qué cambió o pasa de 280 caracteres. Vacío si no falta nada. Recibe un documento que ya pasó private.problema_del_documento(). scripts/comparacion.ts las compara caso por caso (ADR 0080).';

CREATE OR REPLACE FUNCTION private.mandar_el_aviso_de_cambios(p_household uuid)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select realtime.send('{}'::jsonb, 'cambios', 'cambios:' || p_household::text, true)
$function$;
-- execute: solo el dueño
comment on function private.mandar_el_aviso_de_cambios(uuid) is 'Manda el aviso de cambios al canal privado del taller, cambios:<household_id>, con el evento cambios y un payload vacío (realtime.send le agrega solo un id). Gemela de TEMA_DE_LOS_CAMBIOS y EVENTO_DE_LOS_CAMBIOS de @maun/db. realtime.send no corta la transacción si falla: la escritura del usuario vale aunque el aviso no salga.';

CREATE OR REPLACE FUNCTION private.mandar_el_presupuesto(p_presupuesto_id uuid, p_revision_id uuid, p_version integer, p_documento jsonb, p_que_cambio text, p_mandado_el date, p_vale_hasta date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_household uuid := private.household_actual();
  v_proyecto_id uuid;
  v_proyecto public.proyectos;
  v_ajustes public.ajustes;
  v_presupuesto public.presupuestos;
  v_revision public.revisiones_del_presupuesto;
  v_siguiente integer;
  v_del_dia integer;
  v_problema text;
  v_falta text[];
  v_vivos jsonb;
  v_mandados jsonb;
  v_pagado bigint;
  v_distintos text[] := array[]::text[];
begin
  if num_nulls(p_presupuesto_id, p_revision_id, p_version, p_documento, p_mandado_el) > 0 then
    raise exception 'Mandar el presupuesto necesita el borrador, la revisión, la revisión que viste, el documento y el día'
      using errcode = '22004';
  end if;

  -- El trabajo del borrador. Se lee sin candado: un borrador nunca cambia de trabajo.
  select b.proyecto_id into v_proyecto_id
  from public.presupuestos b
  where b.household_id = v_household and b.id = p_presupuesto_id;

  if not found then
    raise exception 'El presupuesto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- Los candados en el orden de la liquidación: el trabajo y después los ajustes del taller. Con el
  -- trabajo, un reintento del mismo envío espera al primero; con los ajustes, dos envíos del mismo
  -- taller cuentan los números del día de a uno.
  select p.* into v_proyecto
  from public.proyectos p
  where p.household_id = v_household and p.id = v_proyecto_id
  for update;

  select a.* into v_ajustes
  from public.ajustes a
  where a.household_id = v_household
  for no key update;

  -- El reenvío de la cola, mirado con los dos candados tomados: este envío ya se congeló y la respuesta
  -- se perdió. Se devuelve lo que quedó, sin congelar ni numerar dos veces.
  select r.* into v_revision
  from public.revisiones_del_presupuesto r
  where r.household_id = v_household and r.id = p_revision_id;

  if found then
    if v_revision.presupuesto_id <> p_presupuesto_id then
      raise exception 'El presupuesto no se pudo mandar.'
        using errcode = 'MN031',
              detail = 'revisión de otro presupuesto',
              hint = 'Revisalo y probá de nuevo.';
    end if;

    select b.* into v_presupuesto
    from public.presupuestos b
    where b.household_id = v_household and b.id = p_presupuesto_id;

    return jsonb_build_object(
      'revision', to_jsonb(v_revision),
      'presupuesto', to_jsonb(v_presupuesto),
      'proyecto', to_jsonb(v_proyecto),
      'proximos_contactos', (
        select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
        from public.proximos_contactos c
        where c.household_id = v_household and c.proyecto_id = v_proyecto.id
      )
    );
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  -- Con el trabajo bloqueado, el borrador no cambia más hasta que esto termine.
  select b.* into v_presupuesto
  from public.presupuestos b
  where b.household_id = v_household and b.id = p_presupuesto_id;

  if v_presupuesto.borrador_version <> p_version then
    raise exception 'Este presupuesto se cambió en otro aparato.'
      using errcode = 'MN026',
            detail = format('revisión vista %s, revisión actual %s', p_version, v_presupuesto.borrador_version),
            hint = 'Abrilo de nuevo para ver la última versión y seguí desde ahí.';
  end if;

  -- Después de aprobado no hay revisiones: un cambio después de la seña es un adicional.
  if v_proyecto.estado in ('en_curso', 'entregado', 'cobrado') then
    raise exception 'Ya lo aprobó: el presupuesto no se cambia.'
      using errcode = 'MN028',
            detail = v_proyecto.estado::text,
            hint = 'Un cambio después de la seña se arregla aparte con tu cliente.';
  end if;

  if v_proyecto.estado = 'perdido' then
    raise exception 'Este trabajo está perdido: el presupuesto no se manda.'
      using errcode = 'MN032',
            detail = 'perdido',
            hint = 'Si el cliente volvió, reactivalo desde la ficha y mandalo desde ahí.';
  end if;

  if p_mandado_el > private.hoy_en_el_taller() then
    raise exception 'El día del envío todavía no llegó.'
      using errcode = 'MN033',
            detail = format('mandado el %s, hoy %s', p_mandado_el, private.hoy_en_el_taller()),
            hint = 'Revisá la fecha del aparato y volvé a mandarlo.';
  end if;

  v_problema := private.problema_del_documento(p_documento);
  if v_problema is not null then
    raise exception 'El presupuesto no se pudo mandar.'
      using errcode = 'MN031',
            detail = v_problema,
            hint = 'Revisalo y probá de nuevo.';
  end if;

  select coalesce(max(r.revision), 0) + 1 into v_siguiente
  from public.revisiones_del_presupuesto r
  where r.household_id = v_household and r.presupuesto_id = v_presupuesto.id;

  v_falta := private.lo_que_falta_para_mandar(p_documento, v_siguiente, p_que_cambio);
  if cardinality(v_falta) > 0 then
    raise exception 'Al presupuesto le falta algo para mandarlo.'
      using errcode = 'MN027',
            detail = array_to_string(v_falta, ', '),
            hint = 'Revisá que tenga título, por lo menos un mueble con su detalle y un total.';
  end if;

  -- Los importes que vio la app contra los vivos, como el control de lo que vio la app de la
  -- liquidación: las opciones (ids, importes y orden por id) o el total, el porcentaje de seña efectivo
  -- y lo pagado hasta hoy. Si no coinciden, no se congela nada.
  select coalesce(jsonb_agg(jsonb_build_array(o.id::text, o.monto_centavos) order by o.id), '[]'::jsonb)
  into v_vivos
  from public.opciones_de_presupuesto o
  where o.household_id = v_household and o.proyecto_id = v_proyecto.id and o.deleted_at is null;

  v_vivos := case
    when jsonb_array_length(v_vivos) > 0 then jsonb_build_object('opciones', v_vivos)
    when v_proyecto.presupuesto_centavos is not null then
      jsonb_build_object('total', v_proyecto.presupuesto_centavos)
    else 'null'::jsonb
  end;

  v_mandados := case
    when p_documento #>> '{valores,tipo}' = 'opciones' then jsonb_build_object(
      'opciones', (
        select coalesce(jsonb_agg(jsonb_build_array(e.valor ->> 'id', e.valor -> 'total') order by e.orden), '[]'::jsonb)
        from jsonb_array_elements(p_documento #> '{valores,opciones}') with ordinality as e (valor, orden)
      )
    )
    when p_documento #>> '{valores,tipo}' = 'total' then
      jsonb_build_object('total', p_documento #> '{valores,total}')
    else 'null'::jsonb
  end;

  if v_vivos is distinct from v_mandados then
    v_distintos := v_distintos || 'valores'::text;
  end if;

  if p_documento -> 'senaBp' is distinct from to_jsonb(coalesce(v_proyecto.sena_bp, v_ajustes.sena_bp)) then
    v_distintos := v_distintos || 'sena'::text;
  end if;

  select coalesce(sum(g.monto_centavos), 0) into v_pagado
  from public.pagos g
  where g.household_id = v_household and g.proyecto_id = v_proyecto.id and g.deleted_at is null;

  if p_documento -> 'abonado' is distinct from to_jsonb(v_pagado) then
    v_distintos := v_distintos || 'abonado'::text;
  end if;

  if cardinality(v_distintos) > 0 then
    raise exception 'Cambiaron los importes desde que lo armaste.'
      using errcode = 'MN029',
            detail = array_to_string(v_distintos, ', '),
            hint = 'Revisá los valores y volvé a mandarlo.';
  end if;

  -- El número, en el primer envío: el día y el siguiente de ese día en el taller, contando los
  -- borrados, así un número no se reusa. Los ajustes bloqueados ordenan a dos envíos del mismo taller.
  if v_presupuesto.numero is null then
    select coalesce(max(split_part(r.numero, '-', 2)::integer), 0) + 1 into v_del_dia
    from public.revisiones_del_presupuesto r
    where r.household_id = v_household
      and r.numero like to_char(p_mandado_el, 'YYYYMMDD') || '-%';

    update public.presupuestos set
      numero = to_char(p_mandado_el, 'YYYYMMDD') || '-'
        || lpad(v_del_dia::text, greatest(2, char_length(v_del_dia::text)), '0')
    where id = v_presupuesto.id
    returning * into v_presupuesto;
  end if;

  insert into public.revisiones_del_presupuesto (
    id, household_id, presupuesto_id, proyecto_id, revision, numero, mandado_el, vale_hasta, que_cambio,
    contenido
  ) values (
    p_revision_id, v_household, v_presupuesto.id, v_proyecto.id, v_siguiente, v_presupuesto.numero,
    p_mandado_el, p_vale_hasta,
    case
      when v_siguiente > 1 then regexp_replace(p_que_cambio, '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')
    end,
    p_documento
  )
  returning * into v_revision;

  -- Lo mismo que hace hoy «Mandé el presupuesto», más el documento: la etapa si estaba antes (o en
  -- seguimiento, que cierra su contacto pendiente con el trigger de siempre), la vigencia, el último
  -- contacto y la tarea del presupuesto tildada. El trigger de siempre anota el cambio de estado.
  update public.proyectos set
    estado = case
      when estado <> 'presupuesto_enviado' and private.transicion_valida(estado, 'presupuesto_enviado')
        then 'presupuesto_enviado'::public.estado_proyecto
      else estado
    end,
    presupuesto_vale_hasta = p_vale_hasta,
    ultimo_contacto = p_mandado_el,
    presupuesto_pdf = true
  where id = v_proyecto.id
  returning * into v_proyecto;

  return jsonb_build_object(
    'revision', to_jsonb(v_revision),
    'presupuesto', to_jsonb(v_presupuesto),
    'proyecto', to_jsonb(v_proyecto),
    'proximos_contactos', (
      select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
      from public.proximos_contactos c
      where c.household_id = v_household and c.proyecto_id = v_proyecto.id
    )
  );
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.mandar_el_presupuesto(uuid,uuid,integer,jsonb,text,date,date) is 'Manda el presupuesto, en una transacción: bloquea el trabajo y después los ajustes del taller; si la revisión ya existe la devuelve (el reenvío); rechaza si el borrador cambió (MN026), si el trabajo está aprobado (MN028) o perdido (MN032), si el día del envío no llegó (MN033), si el documento no tiene la forma (MN031), si le falta algo para mandarlo (MN027) o si sus importes, su seña o lo pagado no son los del trabajo (MN029); en el primer envío le pone número; congela la revisión siguiente y pasa el trabajo a presupuesto enviado con la vigencia, el último contacto y la tarea tildada. Devuelve la revisión, el borrador, el trabajo y sus próximos contactos. Toda lectura filtra por el taller de la sesión, también la del reenvío (ADR 0080).';

CREATE OR REPLACE FUNCTION private.mantener_metadatos()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    new.updated_at := clock_timestamp();
    new.version := 1;
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'El id de una fila no se puede cambiar (tabla %)', tg_table_name
      using errcode = 'MN004';
  end if;

  if (to_jsonb(new) -> 'household_id') is distinct from (to_jsonb(old) -> 'household_id') then
    raise exception 'Una fila no se puede mover de household (tabla %)', tg_table_name
      using errcode = 'MN004';
  end if;

  new.created_at := old.created_at;
  new.updated_at := old.updated_at;
  new.version := old.version;

  -- Borrar lo que ya está borrado no cambia la marca: una baja reenviada, o hecha también desde el
  -- otro dispositivo, conserva la primera y cae en el no-op de abajo.
  if old.deleted_at is not null and new.deleted_at is not null then
    new.deleted_at := old.deleted_at;
  end if;

  -- Un update que no cambia nada (la cola de salida reenviando una mutación ya aplicada) no toca
  -- updated_at ni version: así drenar la cola dos veces no genera deltas ni conflictos falsos.
  if new is not distinct from old then
    return new;
  end if;

  -- clock_timestamp() y no now(): la marca queda lo más cerca posible del commit, lo que achica
  -- la ventana de la trampa de la marca de agua (ver public.delta).
  new.updated_at := clock_timestamp();
  new.version := old.version + 1;
  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.mantener_metadatos() is 'Trigger BEFORE INSERT OR UPDATE de toda tabla: updated_at y version los pone la base, nunca el cliente; id y household_id son inmutables; un update sin cambios es un no-op.';

CREATE OR REPLACE FUNCTION private.motivo_de_la_entrega(p_motivo text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case p_motivo
    when 'forma' then 'La respuesta no tiene la forma que espera la página'
    when 'propuesta' then 'Ese día no se puede aceptar: el taller te pidió tus días'
    when 'vacia' then 'Falta al menos un día, o una nota con cuándo te queda bien'
    when 'demasiados' then 'Son más de diez días'
    when 'repetido' then 'Vino dos veces el mismo día'
    when 'fuera' then 'Un día está fuera de los que se pueden elegir'
    when 'domingo' then 'Los domingos no se entrega'
    when 'franja' then 'Un día no tiene bien marcada la mañana o la tarde'
    when 'largo' then 'La nota pasa de los 500 caracteres'
    when 'tope' then 'Ya contestaste demasiadas veces a este pedido'
    else 'La respuesta no sirve para este pedido'
  end
$function$;
-- execute: solo el dueño
comment on function private.motivo_de_la_entrega(text) is 'El mensaje de cada motivo con que public.responder_la_entrega() rechaza una respuesta (MN020).';

CREATE OR REPLACE FUNCTION private.motivo_del_rechazo(p_motivo text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case p_motivo
    when 'forma' then 'La respuesta no tiene la forma que espera la encuesta'
    when 'ajena' then 'Vino una respuesta a una pregunta que no es de esta encuesta'
    when 'repetida' then 'Vino dos veces la respuesta a la misma pregunta'
    when 'tipo' then 'Una respuesta no es del tipo que pide su pregunta'
    when 'rango' then 'Una respuesta está fuera de las opciones de su pregunta'
    when 'vacio' then 'Vino una respuesta vacía'
    when 'largo' then 'Un texto pasa de los 2000 caracteres que acepta la encuesta'
    when 'obligatoria' then 'Falta contestar una pregunta obligatoria'
    else 'La respuesta no sirve para esta encuesta'
  end
$function$;
-- execute: solo el dueño
comment on function private.motivo_del_rechazo(text) is 'El mensaje de cada motivo de private.validar_respuesta().';

CREATE OR REPLACE FUNCTION private.opciones_de_pregunta_validas(p_opciones text[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    array_ndims(p_opciones) = 1
    and cardinality(p_opciones) between 2 and 8
    and (
      select bool_and(o is not null and btrim(o) <> '' and char_length(o) <= 120)
      from unnest(p_opciones) as o
    )
    and (select count(distinct o) = count(*) from unnest(p_opciones) as o),
    false
  )
$function$;
-- execute: authenticated:EXECUTE
comment on function private.opciones_de_pregunta_validas(text[]) is 'Las opciones de una pregunta de una o de varias opciones: entre dos y ocho, ninguna vacía ni repetida, de hasta 120 caracteres.';

CREATE OR REPLACE FUNCTION private.opciones_elegidas_validas(p_elegidas smallint[], p_cantidad smallint)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    array_ndims(p_elegidas) = 1
    and cardinality(p_elegidas) >= 1
    and (
      select bool_and(e is not null and e >= 0 and e < p_cantidad)
      from unnest(p_elegidas) as e
    )
    and (select count(distinct e) = count(*) from unnest(p_elegidas) as e),
    false
  )
$function$;
-- execute: solo el dueño
comment on function private.opciones_elegidas_validas(smallint[],smallint) is 'Lo que eligió el cliente en una pregunta de varias opciones: al menos una, ninguna repetida, y cada una adentro de las opciones que tenía la pregunta.';

CREATE OR REPLACE FUNCTION private.pagos_por_delante(p_precio_centavos bigint, p_pagado_centavos bigint, p_sena_bp integer)
 RETURNS TABLE(orden integer, instancia text, monto_centavos bigint)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_falta bigint;
  v_sena bigint;
  v_despues bigint;
begin
  -- Sin presupuesto no hay importe que calcular, pero el camino se conoce igual: primero la seña y
  -- después el saldo. La pantalla los anticipa sin número.
  if p_precio_centavos is null then
    return query values (1, 'sena', null::bigint), (2, 'saldo', null::bigint);
    return;
  end if;

  v_falta := p_precio_centavos - p_pagado_centavos;
  if v_falta <= 0 then
    return;
  end if;

  v_sena := private.sena_esperada(p_precio_centavos, p_sena_bp);

  if p_pagado_centavos >= v_sena then
    return query values (1, 'saldo', v_falta);
    return;
  end if;

  -- Lo que queda después de cubrir la seña no es «lo que falta menos la seña que falta»: es el
  -- presupuesto menos la seña entera. Con parte de la seña ya cobrada las dos cuentas no dan lo
  -- mismo, y la que el cliente va a tener que pagar es esta.
  v_despues := p_precio_centavos - v_sena;
  if v_despues <= 0 then
    return query values (1, 'sena', v_sena - p_pagado_centavos);
    return;
  end if;

  return query values (1, 'sena', v_sena - p_pagado_centavos), (2, 'saldo', v_despues);
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.pagos_por_delante(bigint,bigint,integer) is 'Los pagos que le faltan al cliente, en el orden en que los va a hacer: la seña mientras no esté cubierta y después el saldo, o nada cuando ya pagó todo. El importe de la seña es lo que falta de ella, con todo lo cobrado hasta hoy ya descontado —la visita incluida, que entra como un pago más—; el del saldo es el presupuesto menos la seña entera, que es lo que va a quedar cuando la termine de pagar. La seña sale de private.sena_esperada(). Sin presupuesto devuelve los dos sin importe: el porcentaje de seña es política comercial del taller y no viaja. Es la gemela en SQL de pagosPorDelante() de @maun/domain y scripts/comparacion.ts las compara caso por caso (ADR 0053 y 0067).';

CREATE OR REPLACE FUNCTION private.pedir_los_avisos()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_url text;
  v_secreto text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'avisos_url';
  select decrypted_secret into v_secreto from vault.decrypted_secrets where name = 'avisos_secreto';
  if v_url is null or v_secreto is null then
    return null;
  end if;

  return net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secreto
    ),
    timeout_milliseconds := 30000
  );
end;
$function$;
-- execute: solo el dueño
comment on function private.pedir_los_avisos() is 'Le pide a la función de borde que mande los avisos que tocan. La llama pg_cron. Sin avisos_url y avisos_secreto en Vault devuelve null y no pide nada.';

CREATE OR REPLACE FUNCTION private.plan_del_reparto(p_destino text, p_fila jsonb, p_perdido_con_sueldo boolean, p_perdido_con_diezmo boolean, p_diezmo uuid, p_maun uuid, OUT obligaciones uuid[], OUT porcentajes_de_obligacion integer[], OUT bases text[], OUT diezmo_en integer, OUT diezmo_bp integer, OUT tesoros uuid[], OUT clases text[], OUT objetivos bigint[], OUT por_mes boolean[], OUT modos text[], OUT hasta_la_meta boolean[], OUT tesoros_del_reparto uuid[], OUT porcentajes integer[], OUT hasta_la_meta_del_reparto boolean[], OUT superavit uuid)
 RETURNS record
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_perdido boolean;
  v_por_trabajo boolean;
  v_elemento jsonb;
  v_superavit uuid;
  v_lugar integer := 0;
begin
  if num_nulls(p_destino, p_fila, p_perdido_con_sueldo, p_perdido_con_diezmo, p_diezmo, p_maun) > 0 then
    raise exception 'El plan del reparto necesita todos sus parámetros' using errcode = '22004';
  end if;
  if p_destino not in ('cobrado', 'perdido') then
    raise exception 'Solo se reparte al cobrar o al dar por perdido' using errcode = '22023';
  end if;

  v_perdido := p_destino = 'perdido';
  v_por_trabajo := (p_fila ->> 'sueldoPorTrabajo')::boolean;
  obligaciones := '{}';
  porcentajes_de_obligacion := '{}';
  bases := '{}';
  tesoros := '{}';
  clases := '{}';
  objetivos := '{}';
  por_mes := '{}';
  modos := '{}';
  hasta_la_meta := '{}';
  tesoros_del_reparto := '{}';
  porcentajes := '{}';
  hasta_la_meta_del_reparto := '{}';

  -- Las obligaciones: sin la clave, la de siempre, el diezmo al 10% sobre el ingreso. El diezmo es la
  -- primera con el tesoro del diezmo; en un perdido sin diezmo va en cero, y las demás van igual.
  for v_elemento in
    select value
    from jsonb_array_elements(
      case
        when p_fila ? 'obligaciones' then p_fila -> 'obligaciones'
        else jsonb_build_array(jsonb_build_object('tesoro', p_diezmo, 'porcentaje', 1000, 'base', 'ingreso'))
      end
    ) with ordinality
    order by ordinality
  loop
    v_lugar := v_lugar + 1;
    obligaciones := obligaciones || (v_elemento ->> 'tesoro')::uuid;
    bases := bases || (v_elemento ->> 'base');
    if diezmo_en is null and (v_elemento ->> 'tesoro')::uuid = p_diezmo then
      diezmo_en := v_lugar;
      porcentajes_de_obligacion := porcentajes_de_obligacion || case
        when v_perdido and not p_perdido_con_diezmo then 0
        else private.entero_de_json(v_elemento -> 'porcentaje')::integer
      end;
    else
      porcentajes_de_obligacion := porcentajes_de_obligacion
        || private.entero_de_json(v_elemento -> 'porcentaje')::integer;
    end if;
  end loop;
  diezmo_bp := case when diezmo_en is null then 0 else porcentajes_de_obligacion[diezmo_en] end;

  for v_elemento in select value from jsonb_array_elements(p_fila -> 'pasos') with ordinality order by ordinality loop
    tesoros := tesoros || (v_elemento ->> 'tesoro')::uuid;
    clases := clases || (v_elemento ->> 'clase');
    objetivos := objetivos || case
      when v_perdido and v_elemento ->> 'clase' = 'sueldo' and not p_perdido_con_sueldo then 0::bigint
      else private.entero_de_json(v_elemento -> 'tope')
    end;
    por_mes := por_mes || not (v_elemento ->> 'clase' = 'sueldo' and v_por_trabajo);
    modos := modos || coalesce(v_elemento ->> 'modo', 'mes');
    hasta_la_meta := hasta_la_meta || coalesce((v_elemento ->> 'hastaLaMeta')::boolean, false);
  end loop;

  for v_elemento in select value from jsonb_array_elements(p_fila -> 'reparto') with ordinality order by ordinality loop
    tesoros_del_reparto := tesoros_del_reparto || (v_elemento ->> 'tesoro')::uuid;
    porcentajes := porcentajes || private.entero_de_json(v_elemento -> 'porcentaje')::integer;
    hasta_la_meta_del_reparto := hasta_la_meta_del_reparto
      || coalesce((v_elemento ->> 'hastaLaMeta')::boolean, false);
  end loop;

  -- Maun no lleva fila de repartos: lo que sobra ya está ahí.
  v_superavit := coalesce((p_fila ->> 'superavit')::uuid, p_maun);
  superavit := case when v_superavit = p_maun then null else v_superavit end;
end;
$function$;
-- execute: solo el dueño
comment on function private.plan_del_reparto(text,jsonb,boolean,boolean,uuid,uuid) is 'Con qué obligaciones, qué pasos y qué partes se reparte un cobro o un perdido según la fila: la posición del diezmo entre las obligaciones y su porcentaje (en cero en un perdido sin diezmo), el objetivo de cada paso (el sueldo en cero en un perdido sin sueldo), si descuenta lo que ya tiene, cómo se llena, si va hasta la meta, y el superávit (null si es Maun). Completa lo que falta de una fila del primer pedido como leerLaFila. Gemela de planDelReparto en fila.ts. Recibe una fila ya validada (ADR 0078).';

CREATE OR REPLACE FUNCTION private.preguntas_de_la_encuesta(p_encuesta encuestas_enviadas)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select p_encuesta.preguntas || coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'texto', p.texto,
          'tipo', p.tipo,
          'escala', p.escala,
          'obligatoria', p.obligatoria,
          'opciones', to_jsonb(p.opciones),
          'propia', true
        )
        order by p.orden, p.id
      )
      from public.preguntas p
      where p.household_id = p_encuesta.household_id
        and p.proyecto_id = p_encuesta.proyecto_id
        and p.deleted_at is null
    ),
    '[]'::jsonb
  )
$function$;
-- execute: solo el dueño
comment on function private.preguntas_de_la_encuesta(encuestas_enviadas) is 'Lo que se le pregunta a un enlace: la foto de la encuesta base que se tomó al mandarlo, más las preguntas propias de su trabajo. Es la misma lista la que ve el cliente y la que valida el guardado.';

CREATE OR REPLACE FUNCTION private.previo_del_mes(p_tesoros uuid[], p_objetivos bigint[], p_modos text[], p_hasta_la_meta boolean[], p_tesoros_del_reparto uuid[], p_hasta_la_meta_del_reparto boolean[], p_del_mes jsonb, p_saldos jsonb, p_metas jsonb, OUT previos bigint[], OUT topes bigint[])
 RETURNS record
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  c_maximo constant bigint := 9007199254740991;
  v_tesoro text;
  v_lleva bigint;
  v_meta bigint;
  v_falta bigint;
  i integer;
begin
  if num_nulls(
    p_tesoros, p_objetivos, p_modos, p_hasta_la_meta, p_tesoros_del_reparto,
    p_hasta_la_meta_del_reparto, p_del_mes, p_saldos, p_metas
  ) > 0 then
    raise exception 'El previo necesita todos sus parámetros' using errcode = '22004';
  end if;
  if cardinality(p_objetivos) <> cardinality(p_tesoros)
    or cardinality(p_modos) <> cardinality(p_tesoros)
    or cardinality(p_hasta_la_meta) <> cardinality(p_tesoros)
    or cardinality(p_hasta_la_meta_del_reparto) <> cardinality(p_tesoros_del_reparto)
  then
    raise exception 'Cada paso lleva su objetivo, cómo se llena y si va hasta la meta' using errcode = '22023';
  end if;
  if array_position(p_tesoros, null) is not null
    or array_position(p_objetivos, null) is not null
    or array_position(p_modos, null) is not null
    or array_position(p_hasta_la_meta, null) is not null
    or array_position(p_tesoros_del_reparto, null) is not null
    or array_position(p_hasta_la_meta_del_reparto, null) is not null
  then
    raise exception 'Un paso o una parte no pueden tener datos vacíos' using errcode = '22004';
  end if;

  previos := '{}';
  topes := '{}';

  -- Cada paso arranca con lo que lleva según su modo: lo del mes, su saldo (nunca menos de cero) o
  -- nada. Si va hasta la meta y su tesoro tiene meta, el previo nunca es menos que su monto menos lo
  -- que le falta para la meta: así su tope es lo menor entre las dos cosas.
  for i in 1 .. cardinality(p_tesoros) loop
    v_tesoro := p_tesoros[i]::text;
    v_lleva := case p_modos[i]
      when 'saldo' then greatest(0, coalesce((p_saldos ->> v_tesoro)::bigint, 0))
      when 'trabajo' then 0
      else coalesce((p_del_mes ->> v_tesoro)::bigint, 0)
    end;
    v_falta := null;
    v_meta := coalesce((p_metas ->> v_tesoro)::bigint, 0);
    if p_hasta_la_meta[i] and v_meta > 0 then
      v_falta := v_meta - coalesce((p_saldos ->> v_tesoro)::bigint, 0);
      if abs(v_falta) > c_maximo then
        raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
      end if;
      v_falta := greatest(0, v_falta);
      if abs(p_objetivos[i] - v_falta) > c_maximo then
        raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
      end if;
    end if;
    previos := previos || case
      when v_falta is null then v_lleva
      else greatest(v_lleva, p_objetivos[i] - v_falta)
    end;
  end loop;

  -- Cada parte que va hasta la meta, con meta, no recibe más que lo que le falta; las demás, sin tope.
  for i in 1 .. cardinality(p_tesoros_del_reparto) loop
    v_tesoro := p_tesoros_del_reparto[i]::text;
    v_falta := null;
    v_meta := coalesce((p_metas ->> v_tesoro)::bigint, 0);
    if p_hasta_la_meta_del_reparto[i] and v_meta > 0 then
      v_falta := v_meta - coalesce((p_saldos ->> v_tesoro)::bigint, 0);
      if abs(v_falta) > c_maximo then
        raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
      end if;
      v_falta := greatest(0, v_falta);
    end if;
    topes := topes || v_falta;
  end loop;
end;
$function$;
-- execute: solo el dueño
comment on function private.previo_del_mes(uuid[],bigint[],text[],boolean[],uuid[],boolean[],jsonb,jsonb,jsonb) is 'Con qué previo entra cada paso a la cuenta y qué tope lleva cada parte, con lo del mes, los saldos y las metas de los tesoros como {tesoro_id: centavos}: por mes, lo del mes; se renueva o se repone, su saldo, nunca menos de cero; por trabajo, cero. Un paso que va hasta la meta nunca arranca con menos que su monto menos lo que le falta para la meta, y una parte que va hasta la meta lleva de tope lo que le falta (null si junta sin fin). Gemela de previoDelMes en fila.ts (ADR 0078).';

CREATE OR REPLACE FUNCTION private.problema_de_la_fila(p_fila jsonb, p_tesoros jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  c_formato_id constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  c_formato_mes constant text := '^[0-9]{4}-(0[1-9]|1[0-2])$';
  c_maximo constant bigint := 1000000000000;
  v_diezmo text;
  v_maun text;
  v_obligaciones jsonb;
  v_superavit text;
  v_obligacion jsonb;
  v_paso jsonb;
  v_parte jsonb;
  v_renglon jsonb;
  v_tesoro jsonb;
  v_clave text;
  v_clase text;
  v_modo text;
  v_vistos text[] := '{}';
  v_tope bigint;
  v_monto bigint;
  v_suma bigint;
  v_dia bigint;
  v_porcentaje bigint;
  v_suma_del_reparto bigint := 0;
  v_con_diezmo boolean := false;
  v_lugar integer := 0;
begin
  -- Los ids del diezmo y de Maun salen de los tesoros del taller, como sistemaDeLosTesoros: vacíos si
  -- no están, y entonces lo que se completa con ellos no es un tesoro conocido.
  v_diezmo := coalesce(
    (select t.value ->> 'id' from jsonb_array_elements(p_tesoros) as t where t.value ->> 'clave' = 'diezmo' limit 1),
    ''
  );
  v_maun := coalesce(
    (select t.value ->> 'id' from jsonb_array_elements(p_tesoros) as t where t.value ->> 'clave' = 'maun' limit 1),
    ''
  );

  -- La forma, como leerLaFila: una clave que falta toma lo de siempre y una que está con otro tipo no
  -- se lee.
  if jsonb_typeof(p_fila) is distinct from 'object'
    or jsonb_typeof(p_fila -> 'sueldoPorTrabajo') is distinct from 'boolean'
    or jsonb_typeof(p_fila -> 'pasos') is distinct from 'array'
    or jsonb_typeof(p_fila -> 'reparto') is distinct from 'array'
    or (p_fila ? 'obligaciones' and jsonb_typeof(p_fila -> 'obligaciones') is distinct from 'array')
    or (
      p_fila ? 'superavit'
      and (jsonb_typeof(p_fila -> 'superavit') is distinct from 'string' or (p_fila ->> 'superavit') !~ c_formato_id)
    )
  then
    return 'forma-invalida';
  end if;

  if p_fila ? 'obligaciones' then
    for v_obligacion in select value from jsonb_array_elements(p_fila -> 'obligaciones') loop
      if jsonb_typeof(v_obligacion) is distinct from 'object'
        or jsonb_typeof(v_obligacion -> 'tesoro') is distinct from 'string'
        or jsonb_typeof(v_obligacion -> 'base') is distinct from 'string'
      then
        return 'forma-invalida';
      end if;
      if (v_obligacion ->> 'tesoro') !~ c_formato_id
        or private.entero_de_json(v_obligacion -> 'porcentaje') is null
        or (v_obligacion ->> 'base') not in ('cobrado', 'ingreso')
      then
        return 'forma-invalida';
      end if;
    end loop;
    v_obligaciones := p_fila -> 'obligaciones';
  else
    v_obligaciones := jsonb_build_array(
      jsonb_build_object('tesoro', v_diezmo, 'porcentaje', 1000, 'base', 'ingreso')
    );
  end if;

  for v_paso in select value from jsonb_array_elements(p_fila -> 'pasos') loop
    if jsonb_typeof(v_paso) is distinct from 'object'
      or jsonb_typeof(v_paso -> 'tesoro') is distinct from 'string'
      or jsonb_typeof(v_paso -> 'clase') is distinct from 'string'
      or jsonb_typeof(v_paso -> 'renglones') is distinct from 'array'
      or not (v_paso ? 'desde')
      or jsonb_typeof(v_paso -> 'desde') not in ('null', 'string')
      or (v_paso ? 'modo' and jsonb_typeof(v_paso -> 'modo') is distinct from 'string')
      or (v_paso ? 'hastaLaMeta' and jsonb_typeof(v_paso -> 'hastaLaMeta') is distinct from 'boolean')
    then
      return 'forma-invalida';
    end if;
    if (v_paso ->> 'tesoro') !~ c_formato_id
      or (v_paso ->> 'clase') not in ('sueldo', 'fijos', 'prioridad')
      or private.entero_de_json(v_paso -> 'tope') is null
      or coalesce(v_paso ->> 'modo', 'mes') not in ('mes', 'saldo', 'trabajo')
    then
      return 'forma-invalida';
    end if;
    for v_renglon in select value from jsonb_array_elements(v_paso -> 'renglones') loop
      if jsonb_typeof(v_renglon) is distinct from 'object'
        or jsonb_typeof(v_renglon -> 'nombre') is distinct from 'string'
        or private.entero_de_json(v_renglon -> 'monto') is null
      then
        return 'forma-invalida';
      end if;
      -- Sin día, o con el día en null, no tiene día de pago; si lo tiene, es un entero.
      if coalesce(jsonb_typeof(v_renglon -> 'dia'), 'null') <> 'null'
        and private.entero_de_json(v_renglon -> 'dia') is null
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  for v_parte in select value from jsonb_array_elements(p_fila -> 'reparto') loop
    if jsonb_typeof(v_parte) is distinct from 'object'
      or jsonb_typeof(v_parte -> 'tesoro') is distinct from 'string'
      or (v_parte ? 'hastaLaMeta' and jsonb_typeof(v_parte -> 'hastaLaMeta') is distinct from 'boolean')
    then
      return 'forma-invalida';
    end if;
    if (v_parte ->> 'tesoro') !~ c_formato_id
      or private.entero_de_json(v_parte -> 'porcentaje') is null
    then
      return 'forma-invalida';
    end if;
  end loop;

  v_superavit := coalesce(p_fila ->> 'superavit', v_maun);

  -- Los problemas, en el orden de problemasDeLaFila: el primero es el que se devuelve.
  if jsonb_array_length(v_obligaciones) > 6 then
    return 'demasiadas-obligaciones';
  end if;
  if jsonb_array_length(p_fila -> 'pasos') > 12 then
    return 'demasiados-pasos';
  end if;
  if jsonb_array_length(p_fila -> 'reparto') > 8 then
    return 'demasiadas-partes';
  end if;

  for v_obligacion in select value from jsonb_array_elements(v_obligaciones) with ordinality order by ordinality loop
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) as t
    where t.value ->> 'id' = v_obligacion ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if (v_obligacion ->> 'tesoro') = any (v_vistos) then
      return 'tesoro-repetido';
    end if;
    v_clave := v_tesoro ->> 'clave';
    if v_clave in ('hogar', 'maun') then
      return 'obligacion-en-hogar-o-maun';
    end if;
    v_porcentaje := private.entero_de_json(v_obligacion -> 'porcentaje');
    if v_porcentaje < 1 or v_porcentaje > 10000 or (v_obligacion ->> 'base') not in ('cobrado', 'ingreso') then
      return 'obligacion-invalida';
    end if;
    if v_clave = 'diezmo' then
      v_con_diezmo := true;
    end if;
    v_vistos := v_vistos || (v_obligacion ->> 'tesoro');
  end loop;

  if not v_con_diezmo then
    return 'sin-diezmo';
  end if;

  for v_paso in select value from jsonb_array_elements(p_fila -> 'pasos') with ordinality order by ordinality loop
    v_lugar := v_lugar + 1;
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) as t
    where t.value ->> 'id' = v_paso ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if (v_paso ->> 'tesoro') = any (v_vistos) then
      return 'tesoro-repetido';
    end if;
    v_clave := v_tesoro ->> 'clave';
    if v_clave is not distinct from 'diezmo' then
      return 'diezmo-en-la-fila';
    end if;

    v_clase := v_paso ->> 'clase';
    if v_clave is not distinct from 'hogar' and v_clase <> 'sueldo' then
      return 'hogar-no-es-sueldo';
    end if;
    if v_clase = 'sueldo' and v_clave is distinct from 'hogar' then
      return 'sueldo-no-es-hogar';
    end if;
    if v_clave is not distinct from 'maun' and v_clase <> 'fijos' then
      return 'maun-no-es-fijos';
    end if;

    v_tope := private.entero_de_json(v_paso -> 'tope');
    if v_tope < 0 or v_tope > c_maximo then
      return 'tope-fuera-de-rango';
    end if;

    if v_clase <> 'fijos' then
      if jsonb_array_length(v_paso -> 'renglones') > 0 then
        return 'renglones-en-otra-clase';
      end if;
    else
      if jsonb_array_length(v_paso -> 'renglones') = 0 then
        return 'fijos-sin-renglones';
      end if;
      if jsonb_array_length(v_paso -> 'renglones') > 12 then
        return 'demasiados-renglones';
      end if;
      v_suma := 0;
      for v_renglon in select value from jsonb_array_elements(v_paso -> 'renglones') with ordinality order by ordinality loop
        if btrim(v_renglon ->> 'nombre') = '' then
          return 'renglon-sin-nombre';
        end if;
        if char_length(v_renglon ->> 'nombre') > 40 then
          return 'renglon-largo';
        end if;
        v_monto := private.entero_de_json(v_renglon -> 'monto');
        if v_monto <= 0 or v_monto > c_maximo then
          return 'renglon-fuera-de-rango';
        end if;
        v_dia := private.entero_de_json(v_renglon -> 'dia');
        if v_dia is not null and (v_dia < 1 or v_dia > 31) then
          return 'dia-invalido';
        end if;
        v_suma := v_suma + v_monto;
      end loop;
      if v_suma <> v_tope then
        return 'tope-no-es-la-suma';
      end if;
    end if;

    if jsonb_typeof(v_paso -> 'desde') = 'string' and (v_paso ->> 'desde') !~ c_formato_mes then
      return 'desde-invalido';
    end if;

    -- Cómo se llena, como modosPosibles: el sueldo y Maun, por mes; los gastos fijos, por mes o por
    -- su saldo; un ahorro fijo, de las tres formas.
    v_modo := coalesce(v_paso ->> 'modo', 'mes');
    if not (
      case
        when v_clave is not distinct from 'maun' or v_clase = 'sueldo' then v_modo = 'mes'
        when v_clase = 'fijos' then v_modo in ('mes', 'saldo')
        else true
      end
    ) then
      return 'modo-invalido';
    end if;

    if coalesce((v_paso ->> 'hastaLaMeta')::boolean, false) then
      if v_clase <> 'prioridad' then
        return 'meta-fuera-de-ahorro';
      end if;
      if coalesce(private.entero_de_json(v_tesoro -> 'meta'), 0) <= 0 then
        return 'meta-sin-monto';
      end if;
    end if;

    -- Un ahorro no va antes de un compromiso.
    if v_clase = 'prioridad' and exists (
      select 1
      from jsonb_array_elements(p_fila -> 'pasos') with ordinality as s (valor, lugar)
      where s.lugar > v_lugar and s.valor ->> 'clase' <> 'prioridad'
    ) then
      return 'ahorro-antes-de-compromiso';
    end if;

    v_vistos := v_vistos || (v_paso ->> 'tesoro');
  end loop;

  for v_parte in select value from jsonb_array_elements(p_fila -> 'reparto') with ordinality order by ordinality loop
    select t.value into v_tesoro
    from jsonb_array_elements(p_tesoros) as t
    where t.value ->> 'id' = v_parte ->> 'tesoro'
    limit 1;
    if v_tesoro is null then
      return 'tesoro-desconocido';
    end if;
    if (v_tesoro ->> 'archivado')::boolean then
      return 'tesoro-archivado';
    end if;
    if (v_parte ->> 'tesoro') = any (v_vistos) then
      return 'tesoro-repetido';
    end if;
    v_clave := v_tesoro ->> 'clave';
    if v_clave is not distinct from 'diezmo' then
      return 'diezmo-en-la-fila';
    end if;
    if v_clave is not distinct from 'maun' then
      return 'maun-en-el-reparto';
    end if;
    if v_clave is not distinct from 'hogar' then
      return 'hogar-en-el-reparto';
    end if;
    v_porcentaje := private.entero_de_json(v_parte -> 'porcentaje');
    if v_porcentaje < 1 or v_porcentaje > 10000 then
      return 'porcentaje-invalido';
    end if;
    if coalesce((v_parte ->> 'hastaLaMeta')::boolean, false)
      and coalesce(private.entero_de_json(v_tesoro -> 'meta'), 0) <= 0
    then
      return 'meta-sin-monto';
    end if;
    v_suma_del_reparto := v_suma_del_reparto + v_porcentaje;
    v_vistos := v_vistos || (v_parte ->> 'tesoro');
  end loop;

  if v_suma_del_reparto > 10000 then
    return 'reparto-pasa-de-cien';
  end if;

  -- El superávit: un tesoro conocido y vivo, que no sea Hogar ni el diezmo ni esté ya en la fila (Maun
  -- sí puede, aunque sea un paso de gastos fijos).
  select t.value into v_tesoro
  from jsonb_array_elements(p_tesoros) as t
  where t.value ->> 'id' = v_superavit
  limit 1;
  if v_tesoro is null then
    return 'tesoro-desconocido';
  end if;
  if (v_tesoro ->> 'archivado')::boolean then
    return 'tesoro-archivado';
  end if;
  v_clave := v_tesoro ->> 'clave';
  if v_clave in ('hogar', 'diezmo') then
    return 'superavit-invalido';
  end if;
  if v_clave is distinct from 'maun' and v_superavit = any (v_vistos) then
    return 'superavit-en-la-fila';
  end if;

  if (p_fila ->> 'sueldoPorTrabajo')::boolean then
    return 'sueldo-por-trabajo';
  end if;
  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.problema_de_la_fila(jsonb,jsonb) is 'El primer problema que impide guardar una fila, con el mismo código y en el mismo orden que problemasDeLaFila en fila.ts, o null si se puede guardar. Lee la forma del primer pedido completando lo que falta con lo de siempre, como leerLaFila, con los ids del diezmo y de Maun sacados de los tesoros. Recibe los tesoros del taller como un arreglo de {id, clave, archivado, meta}: la meta de Cocos es la de ajustes, y un tesoro tiene meta si es mayor que cero. Gemela de primerProblemaDeLaFila (ADR 0078).';

CREATE OR REPLACE FUNCTION private.problema_de_la_plantilla(p_plantilla jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  c_grupos constant text[] := array['incluye', 'aTenerEnCuenta', 'avisos', 'condiciones'];
  v_plazo bigint;
  v_modificaciones bigint;
  v_valor bigint;
  v_meses bigint;
  v_grupo text;
  v_elemento jsonb;
  v_vistos text[];
  v_id text;
  v_texto text;
begin
  if jsonb_typeof(p_plantilla) is distinct from 'object'
    or p_plantilla -> 'forma' is distinct from '1'::jsonb
  then
    return 'forma-invalida';
  end if;

  v_plazo := private.entero_de_json(p_plantilla -> 'plazoDeFabricacion');
  v_modificaciones := private.entero_de_json(p_plantilla -> 'modificacionesIncluidas');
  v_valor := private.entero_de_json(p_plantilla -> 'valorDeUnaModificacion');
  v_meses := private.entero_de_json(p_plantilla -> 'garantiaMeses');

  if v_plazo is null or v_modificaciones is null or v_valor is null or v_meses is null
    or jsonb_typeof(p_plantilla -> 'formasDePago') is distinct from 'array'
    or jsonb_typeof(p_plantilla -> 'garantia') is distinct from 'string'
  then
    return 'forma-invalida';
  end if;

  -- La forma entera antes que cualquier tope, como en el dominio: cada grupo es una lista de cláusulas
  -- con su id, su texto, su tilde y un título que puede faltar.
  foreach v_grupo in array c_grupos loop
    if jsonb_typeof(p_plantilla -> v_grupo) is distinct from 'array' then
      return 'forma-invalida';
    end if;
    for v_elemento in
      select e.valor from jsonb_array_elements(p_plantilla -> v_grupo) as e (valor)
    loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'tildadaPorDefecto') is distinct from 'boolean'
        or coalesce(jsonb_typeof(v_elemento -> 'titulo'), 'null') not in ('null', 'string')
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  for v_elemento in
    select e.valor from jsonb_array_elements(p_plantilla -> 'formasDePago') as e (valor)
  loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'nombre') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  if v_plazo not between 1 and 365 then
    return 'plazo-fuera-de-rango';
  end if;
  if v_modificaciones not between 0 and 10 then
    return 'modificaciones-fuera-de-rango';
  end if;
  if v_valor < 0 or v_valor > 1000000000000 then
    return 'valor-fuera-de-rango';
  end if;
  if v_meses not between 6 and 120 then
    return 'garantia-fuera-de-rango';
  end if;

  -- Grupo por grupo, y adentro de cada uno, cláusula por cláusula: el primer problema es el que vuelve.
  foreach v_grupo in array c_grupos loop
    if jsonb_array_length(p_plantilla -> v_grupo) > 20 then
      return 'demasiadas-clausulas';
    end if;
    v_vistos := array[]::text[];
    for v_elemento in
      select e.valor
      from jsonb_array_elements(p_plantilla -> v_grupo) with ordinality as e (valor, orden)
      order by e.orden
    loop
      v_id := v_elemento ->> 'id';
      if v_id !~ '^[a-z0-9-]{1,60}$' then
        return 'id-invalido';
      end if;
      if v_id = any (v_vistos) then
        return 'id-repetido';
      end if;
      v_vistos := v_vistos || v_id;
      if jsonb_typeof(v_elemento -> 'titulo') = 'string'
        and char_length(v_elemento ->> 'titulo') > 120
      then
        return 'titulo-largo';
      end if;
      v_texto := v_elemento ->> 'texto';
      if v_texto !~ '[^ \t\n\r\f\v]' then
        return 'texto-vacio';
      end if;
      if char_length(v_texto) > 2000 then
        return 'texto-largo';
      end if;
    end loop;
  end loop;

  if jsonb_array_length(p_plantilla -> 'formasDePago') = 0 then
    return 'sin-formas-de-pago';
  end if;
  if jsonb_array_length(p_plantilla -> 'formasDePago') > 6 then
    return 'demasiadas-formas-de-pago';
  end if;
  v_vistos := array[]::text[];
  for v_elemento in
    select e.valor
    from jsonb_array_elements(p_plantilla -> 'formasDePago') with ordinality as e (valor, orden)
    order by e.orden
  loop
    v_id := v_elemento ->> 'id';
    if v_id !~ '^[a-z0-9-]{1,60}$' then
      return 'id-invalido';
    end if;
    if v_id = any (v_vistos) then
      return 'id-repetido';
    end if;
    v_vistos := v_vistos || v_id;
    if (v_elemento ->> 'nombre') !~ '[^ \t\n\r\f\v]' then
      return 'nombre-vacio';
    end if;
    if char_length(v_elemento ->> 'nombre') > 60 then
      return 'nombre-largo';
    end if;
    v_texto := v_elemento ->> 'texto';
    if v_texto !~ '[^ \t\n\r\f\v]' then
      return 'texto-vacio';
    end if;
    if char_length(v_texto) > 2000 then
      return 'texto-largo';
    end if;
  end loop;

  if (p_plantilla ->> 'garantia') !~ '[^ \t\n\r\f\v]' then
    return 'garantia-vacia';
  end if;
  if char_length(p_plantilla ->> 'garantia') > 2000 then
    return 'garantia-larga';
  end if;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.problema_de_la_plantilla(jsonb) is 'El primer problema que impide guardar una plantilla del presupuesto, con el mismo código y en el mismo orden que problemaDeLaPlantilla en presupuesto.ts, o null si se puede guardar: la forma, los rangos de los números, hasta 20 cláusulas por grupo con ids únicos, títulos de hasta 120 caracteres y textos de hasta 2000 no vacíos, de 1 a 6 formas de pago con nombre de hasta 60, y la garantía. scripts/comparacion.ts las compara caso por caso (ADR 0080).';

CREATE OR REPLACE FUNCTION private.problema_del_documento(p_documento jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_taller jsonb;
  v_valores jsonb;
  v_opciones jsonb;
  v_elemento jsonb;
  v_lista text;
  v_sena bigint;
  v_abonado bigint;
  v_plazo bigint;
  v_validez bigint;
  v_meses bigint;
begin
  if jsonb_typeof(p_documento) is distinct from 'object'
    or p_documento -> 'forma' is distinct from '1'::jsonb
  then
    return 'forma-invalida';
  end if;

  v_taller := p_documento -> 'taller';
  if jsonb_typeof(v_taller) is distinct from 'object'
    or jsonb_typeof(v_taller -> 'nombre') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'titular') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'cuit') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'domicilio') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'telefono') is distinct from 'string'
    or jsonb_typeof(v_taller -> 'email') is distinct from 'string'
    or not (
      jsonb_typeof(v_taller -> 'condicionFiscal') is not distinct from 'null'
      or (
        jsonb_typeof(v_taller -> 'condicionFiscal') is not distinct from 'string'
        and (v_taller ->> 'condicionFiscal') in ('monotributo', 'responsable_inscripto', 'exento')
      )
    )
  then
    return 'forma-invalida';
  end if;

  if jsonb_typeof(p_documento -> 'cliente') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'titulo') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'obra') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'descripcion') is distinct from 'string'
    or jsonb_typeof(p_documento -> 'muebles') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'herrajes') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'aTenerEnCuenta') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'incluye') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'avisos') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'condiciones') is distinct from 'array'
    or jsonb_typeof(p_documento -> 'garantia') is distinct from 'string'
    or coalesce(jsonb_typeof(p_documento -> 'formaDePago'), '') not in ('null', 'string')
  then
    return 'forma-invalida';
  end if;

  for v_elemento in select e.valor from jsonb_array_elements(p_documento -> 'muebles') as e (valor) loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'nombre') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'descripcion') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  foreach v_lista in array array['herrajes', 'aTenerEnCuenta', 'incluye'] loop
    for v_elemento in select e.valor from jsonb_array_elements(p_documento -> v_lista) as e (valor) loop
      if jsonb_typeof(v_elemento) is distinct from 'string' then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  foreach v_lista in array array['avisos', 'condiciones'] loop
    for v_elemento in select e.valor from jsonb_array_elements(p_documento -> v_lista) as e (valor) loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
        or coalesce(jsonb_typeof(v_elemento -> 'titulo'), 'null') not in ('null', 'string')
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  -- Los valores: null (un borrador sin importe), el total, o las opciones con su id, su letra, su
  -- descripción y su total.
  v_valores := p_documento -> 'valores';
  v_opciones := '[]'::jsonb;
  if jsonb_typeof(v_valores) is not distinct from 'null' then
    v_valores := null;
  elsif jsonb_typeof(v_valores) is distinct from 'object' then
    return 'forma-invalida';
  elsif v_valores -> 'tipo' = '"total"'::jsonb then
    if private.entero_de_json(v_valores -> 'total') is null then
      return 'forma-invalida';
    end if;
  elsif v_valores -> 'tipo' = '"opciones"'::jsonb
    and jsonb_typeof(v_valores -> 'opciones') = 'array'
  then
    v_opciones := v_valores -> 'opciones';
    for v_elemento in select e.valor from jsonb_array_elements(v_opciones) as e (valor) loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'letra') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'descripcion') is distinct from 'string'
        or private.entero_de_json(v_elemento -> 'total') is null
      then
        return 'forma-invalida';
      end if;
    end loop;
  else
    return 'forma-invalida';
  end if;

  v_sena := private.entero_de_json(p_documento -> 'senaBp');
  v_abonado := private.entero_de_json(p_documento -> 'abonado');
  v_plazo := private.entero_de_json(p_documento -> 'plazoDeFabricacion');
  v_meses := private.entero_de_json(p_documento -> 'garantiaMeses');
  if v_sena is null or v_abonado is null or v_plazo is null or v_meses is null then
    return 'forma-invalida';
  end if;

  if jsonb_typeof(p_documento -> 'validezDias') is not distinct from 'null' then
    v_validez := null;
  else
    v_validez := private.entero_de_json(p_documento -> 'validezDias');
    if v_validez is null then
      return 'forma-invalida';
    end if;
  end if;

  if v_sena < 0 or v_sena > 10000 then
    return 'sena-fuera-de-rango';
  end if;
  if v_abonado < 0 or v_abonado > 1000000000000 then
    return 'abonado-fuera-de-rango';
  end if;
  if v_plazo not between 1 and 365 then
    return 'plazo-fuera-de-rango';
  end if;
  if v_validez is not null and v_validez not between 1 and 365 then
    return 'validez-fuera-de-rango';
  end if;
  if v_meses not between 6 and 120 then
    return 'garantia-fuera-de-rango';
  end if;

  if (
      v_valores -> 'tipo' = '"total"'::jsonb
      and private.entero_de_json(v_valores -> 'total') not between 0 and 1000000000000
    )
    or exists (
      select 1
      from jsonb_array_elements(v_opciones) as e (valor)
      where private.entero_de_json(e.valor -> 'total') not between 0 and 1000000000000
    )
  then
    return 'importe-fuera-de-rango';
  end if;

  if jsonb_array_length(p_documento -> 'muebles') > 30 then
    return 'demasiados-muebles';
  end if;
  if jsonb_array_length(p_documento -> 'herrajes') > 40 then
    return 'demasiados-herrajes';
  end if;
  if greatest(
    jsonb_array_length(p_documento -> 'aTenerEnCuenta'),
    jsonb_array_length(p_documento -> 'incluye'),
    jsonb_array_length(p_documento -> 'avisos'),
    jsonb_array_length(p_documento -> 'condiciones')
  ) > 40 then
    return 'demasiadas-clausulas';
  end if;
  if jsonb_array_length(v_opciones) > 26 then
    return 'demasiadas-opciones';
  end if;

  -- Cada texto con su tope: los del borrador, y los que salen de la plantilla con sus huecos
  -- completados, que pueden crecer un poco.
  if exists (
    select 1
    from (
      select v_taller ->> 'nombre', 120
      union all select v_taller ->> 'titular', 120
      union all select v_taller ->> 'cuit', 13
      union all select v_taller ->> 'domicilio', 300
      union all select v_taller ->> 'telefono', 40
      union all select v_taller ->> 'email', 200
      union all select p_documento ->> 'cliente', 200
      union all select p_documento ->> 'titulo', 200
      union all select p_documento ->> 'obra', 300
      union all select p_documento ->> 'descripcion', 4000
      union all
        select m.valor ->> 'nombre', 120 from jsonb_array_elements(p_documento -> 'muebles') as m (valor)
      union all
        select m.valor ->> 'descripcion', 4000 from jsonb_array_elements(p_documento -> 'muebles') as m (valor)
      union all
        select h.valor #>> '{}', 200 from jsonb_array_elements(p_documento -> 'herrajes') as h (valor)
      union all
        select t.valor #>> '{}', 4000
        from jsonb_array_elements((p_documento -> 'aTenerEnCuenta') || (p_documento -> 'incluye')) as t (valor)
      union all select o.valor ->> 'letra', 3 from jsonb_array_elements(v_opciones) as o (valor)
      union all select o.valor ->> 'descripcion', 500 from jsonb_array_elements(v_opciones) as o (valor)
      union all select coalesce(p_documento ->> 'formaDePago', ''), 4000
      union all
        select coalesce(c.valor ->> 'titulo', ''), 120
        from jsonb_array_elements((p_documento -> 'avisos') || (p_documento -> 'condiciones')) as c (valor)
      union all
        select c.valor ->> 'texto', 4000
        from jsonb_array_elements((p_documento -> 'avisos') || (p_documento -> 'condiciones')) as c (valor)
      union all select p_documento ->> 'garantia', 4000
    ) as t (texto, largo)
    where char_length(t.texto) > t.largo
  ) then
    return 'texto-largo';
  end if;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.problema_del_documento(jsonb) is 'El primer problema que impide congelar un documento del presupuesto, con el mismo código y en el mismo orden que problemaDelDocumento en presupuesto.ts, o null si sirve: la forma de cada campo, los rangos de la seña, de lo pagado, del plazo, de la vigencia, de la garantía y de los importes, los topes de las listas y el largo de cada texto. scripts/comparacion.ts las compara caso por caso (ADR 0080).';

CREATE OR REPLACE FUNCTION private.problema_del_presupuesto(p_contenido jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  c_grupos constant text[] := array['incluye', 'aTenerEnCuenta', 'avisos', 'condiciones'];
  v_grupo text;
  v_elemento jsonb;
  v_vistos text[];
  v_id text;
  v_forma jsonb;
  v_plazo bigint;
  v_validez bigint;
begin
  -- La forma entera antes que cualquier tope, como en el dominio.
  if jsonb_typeof(p_contenido) is distinct from 'object'
    or p_contenido -> 'forma' is distinct from '1'::jsonb
    or jsonb_typeof(p_contenido -> 'titulo') is distinct from 'string'
    or jsonb_typeof(p_contenido -> 'obra') is distinct from 'string'
    or jsonb_typeof(p_contenido -> 'descripcion') is distinct from 'string'
    or jsonb_typeof(p_contenido -> 'muebles') is distinct from 'array'
    or jsonb_typeof(p_contenido -> 'herrajes') is distinct from 'object'
    or jsonb_typeof(p_contenido #> '{herrajes,mostrar}') is distinct from 'boolean'
    or jsonb_typeof(p_contenido #> '{herrajes,lista}') is distinct from 'array'
  then
    return 'forma-invalida';
  end if;

  for v_elemento in select e.valor from jsonb_array_elements(p_contenido -> 'muebles') as e (valor) loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'nombre') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'descripcion') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  for v_elemento in select e.valor from jsonb_array_elements(p_contenido #> '{herrajes,lista}') as e (valor) loop
    if jsonb_typeof(v_elemento) is distinct from 'object'
      or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
      or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
    then
      return 'forma-invalida';
    end if;
  end loop;

  foreach v_grupo in array c_grupos loop
    if jsonb_typeof(p_contenido -> v_grupo) is distinct from 'object'
      or jsonb_typeof(p_contenido -> v_grupo -> 'tildadas') is distinct from 'array'
      or jsonb_typeof(p_contenido -> v_grupo -> 'propias') is distinct from 'array'
    then
      return 'forma-invalida';
    end if;
    for v_elemento in
      select e.valor from jsonb_array_elements(p_contenido -> v_grupo -> 'tildadas') as e (valor)
    loop
      if jsonb_typeof(v_elemento) is distinct from 'string' then
        return 'forma-invalida';
      end if;
    end loop;
    for v_elemento in
      select e.valor from jsonb_array_elements(p_contenido -> v_grupo -> 'propias') as e (valor)
    loop
      if jsonb_typeof(v_elemento) is distinct from 'object'
        or jsonb_typeof(v_elemento -> 'id') is distinct from 'string'
        or jsonb_typeof(v_elemento -> 'texto') is distinct from 'string'
      then
        return 'forma-invalida';
      end if;
    end loop;
  end loop;

  -- La forma de pago es null (no se muestra) o la elegida, con el texto en null mientras no se retoque.
  v_forma := p_contenido -> 'formaDePago';
  if not (
    jsonb_typeof(v_forma) is not distinct from 'null'
    or (
      jsonb_typeof(v_forma) is not distinct from 'object'
      and jsonb_typeof(v_forma -> 'plantillaId') is not distinct from 'string'
      and coalesce(jsonb_typeof(v_forma -> 'texto'), '') in ('null', 'string')
    )
  ) then
    return 'forma-invalida';
  end if;

  v_plazo := private.entero_de_json(p_contenido -> 'plazoDeFabricacion');
  if v_plazo is null then
    return 'forma-invalida';
  end if;

  if jsonb_typeof(p_contenido -> 'validezDias') is not distinct from 'null' then
    v_validez := null;
  else
    v_validez := private.entero_de_json(p_contenido -> 'validezDias');
    if v_validez is null then
      return 'forma-invalida';
    end if;
  end if;

  if char_length(p_contenido ->> 'titulo') > 200 then
    return 'titulo-largo';
  end if;
  if char_length(p_contenido ->> 'obra') > 300 then
    return 'obra-larga';
  end if;
  if char_length(p_contenido ->> 'descripcion') > 4000 then
    return 'descripcion-larga';
  end if;

  if jsonb_array_length(p_contenido -> 'muebles') > 30 then
    return 'demasiados-muebles';
  end if;
  v_vistos := array[]::text[];
  for v_elemento in
    select e.valor
    from jsonb_array_elements(p_contenido -> 'muebles') with ordinality as e (valor, orden)
    order by e.orden
  loop
    v_id := v_elemento ->> 'id';
    if v_id !~ '^[a-z0-9-]{1,60}$' then
      return 'id-invalido';
    end if;
    if v_id = any (v_vistos) then
      return 'id-repetido';
    end if;
    v_vistos := v_vistos || v_id;
    if char_length(v_elemento ->> 'nombre') > 120 then
      return 'nombre-del-mueble-largo';
    end if;
    if char_length(v_elemento ->> 'descripcion') > 4000 then
      return 'detalle-del-mueble-largo';
    end if;
  end loop;

  if jsonb_array_length(p_contenido #> '{herrajes,lista}') > 40 then
    return 'demasiados-herrajes';
  end if;
  v_vistos := array[]::text[];
  for v_elemento in
    select e.valor
    from jsonb_array_elements(p_contenido #> '{herrajes,lista}') with ordinality as e (valor, orden)
    order by e.orden
  loop
    v_id := v_elemento ->> 'id';
    if v_id !~ '^[a-z0-9-]{1,60}$' then
      return 'id-invalido';
    end if;
    if v_id = any (v_vistos) then
      return 'id-repetido';
    end if;
    v_vistos := v_vistos || v_id;
    if char_length(v_elemento ->> 'texto') > 200 then
      return 'herraje-largo';
    end if;
  end loop;

  -- Grupo por grupo: primero las tildadas, después las propias, cada una con sus ids.
  foreach v_grupo in array c_grupos loop
    if jsonb_array_length(p_contenido -> v_grupo -> 'tildadas') > 20 then
      return 'demasiadas-tildadas';
    end if;
    v_vistos := array[]::text[];
    for v_elemento in
      select e.valor
      from jsonb_array_elements(p_contenido -> v_grupo -> 'tildadas') with ordinality as e (valor, orden)
      order by e.orden
    loop
      v_id := v_elemento #>> '{}';
      if v_id !~ '^[a-z0-9-]{1,60}$' then
        return 'id-invalido';
      end if;
      if v_id = any (v_vistos) then
        return 'id-repetido';
      end if;
      v_vistos := v_vistos || v_id;
    end loop;

    if jsonb_array_length(p_contenido -> v_grupo -> 'propias') > 20 then
      return 'demasiadas-propias';
    end if;
    v_vistos := array[]::text[];
    for v_elemento in
      select e.valor
      from jsonb_array_elements(p_contenido -> v_grupo -> 'propias') with ordinality as e (valor, orden)
      order by e.orden
    loop
      v_id := v_elemento ->> 'id';
      if v_id !~ '^[a-z0-9-]{1,60}$' then
        return 'id-invalido';
      end if;
      if v_id = any (v_vistos) then
        return 'id-repetido';
      end if;
      v_vistos := v_vistos || v_id;
      if char_length(v_elemento ->> 'texto') > 1000 then
        return 'propia-larga';
      end if;
    end loop;
  end loop;

  if jsonb_typeof(v_forma) = 'object' then
    if (v_forma ->> 'plantillaId') !~ '^[a-z0-9-]{1,60}$' then
      return 'id-invalido';
    end if;
    if jsonb_typeof(v_forma -> 'texto') = 'string' and char_length(v_forma ->> 'texto') > 2000 then
      return 'forma-de-pago-larga';
    end if;
  end if;

  if v_plazo not between 1 and 365 then
    return 'plazo-fuera-de-rango';
  end if;
  if v_validez is not null and v_validez not between 1 and 365 then
    return 'validez-fuera-de-rango';
  end if;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.problema_del_presupuesto(jsonb) is 'El primer problema que impide guardar un borrador del presupuesto, con el mismo código y en el mismo orden que problemaDelBorrador en presupuesto.ts, o null si se puede guardar. Es permisivo, porque un borrador puede estar a medio hacer: mira la forma y los topes (30 muebles, 40 herrajes, 20 tildadas y 20 propias por grupo, los largos de cada texto, ids únicos) y los rangos del plazo y de la vigencia. scripts/comparacion.ts las compara caso por caso (ADR 0080).';

CREATE OR REPLACE FUNCTION private.registrar_suscripcion(p_endpoint text, p_p256dh text, p_auth text, p_zona text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_usuario uuid := (select auth.uid());
begin
  if v_usuario is null then
    raise exception 'Hace falta una sesión para activar los avisos' using errcode = '42501';
  end if;
  perform private.validar_zona(p_zona);

  -- El mismo endpoint es el mismo dispositivo. Si lo registra otra cuenta (cambió de usuario en el
  -- mismo teléfono), pasa a ser suyo y arranca de cero: los avisos del anterior dejan de llegar.
  insert into private.suscripciones_de_avisos as s (user_id, endpoint, p256dh, auth)
  values (v_usuario, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set
    user_id = excluded.user_id,
    p256dh = excluded.p256dh,
    auth = excluded.auth,
    actualizada_en = now(),
    ultimo_envio = case when s.user_id = excluded.user_id then s.ultimo_envio end,
    ultimo_dia_avisado = case when s.user_id = excluded.user_id then s.ultimo_dia_avisado end;

  insert into private.preferencias_de_avisos (user_id, zona)
  values (v_usuario, p_zona)
  on conflict (user_id) do update set zona = excluded.zona, actualizada_en = now();

  return private.estado_de_los_avisos(v_usuario, p_endpoint);
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.registrar_suscripcion(text,text,text,text) is 'Registra este dispositivo para el usuario de la sesión, reasignándolo si era de otra cuenta, y guarda la zona horaria que eligió la persona.';

CREATE OR REPLACE FUNCTION private.repartir_por_la_fila(p_cobrado_centavos bigint, p_gastos_centavos bigint, p_obligaciones integer[], p_bases text[], p_objetivos bigint[], p_previos bigint[], p_por_mes boolean[], p_porcentajes integer[], p_topes bigint[], OUT neta_centavos bigint, OUT obligaciones bigint[], OUT libre_centavos bigint, OUT topes bigint[], OUT montos bigint[], OUT sobrante_centavos bigint, OUT partes bigint[], OUT remanente_centavos bigint)
 RETURNS record
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  c_maximo constant bigint := 9007199254740991;
  v_obligaciones integer;
  v_pasos integer;
  v_partes integer;
  v_resto bigint;
  v_sobre bigint;
  v_tope bigint;
  v_monto bigint;
  v_suma integer := 0;
  i integer;
begin
  if num_nulls(
    p_cobrado_centavos, p_gastos_centavos, p_obligaciones, p_bases, p_objetivos, p_previos, p_por_mes,
    p_porcentajes, p_topes
  ) > 0 then
    raise exception 'El reparto necesita todos sus parámetros' using errcode = '22004';
  end if;

  v_obligaciones := cardinality(p_obligaciones);
  v_pasos := cardinality(p_objetivos);
  v_partes := cardinality(p_porcentajes);
  if cardinality(p_bases) <> v_obligaciones then
    raise exception 'Cada obligación lleva su porcentaje y sobre qué se calcula' using errcode = '22023';
  end if;
  if cardinality(p_previos) <> v_pasos or cardinality(p_por_mes) <> v_pasos then
    raise exception 'Cada paso lleva su objetivo, lo que ya tiene y si descuenta lo que tiene'
      using errcode = '22023';
  end if;
  if cardinality(p_topes) <> v_partes then
    raise exception 'Cada parte lleva su tope, o null si junta sin fin' using errcode = '22023';
  end if;

  if p_cobrado_centavos < 0 or p_gastos_centavos < 0 then
    raise exception 'Lo cobrado y los gastos no pueden ser negativos' using errcode = '22023';
  end if;
  if p_cobrado_centavos > c_maximo or p_gastos_centavos > c_maximo then
    raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
  end if;

  for i in 1 .. v_obligaciones loop
    if p_obligaciones[i] is null or p_bases[i] is null then
      raise exception 'Una obligación no puede tener datos vacíos' using errcode = '22004';
    end if;
    if p_obligaciones[i] not between 0 and 10000 then
      raise exception 'Una obligación va en puntos básicos entre 0 y 10000' using errcode = '22023';
    end if;
    if p_bases[i] not in ('cobrado', 'ingreso') then
      raise exception 'Una obligación se calcula sobre lo cobrado o sobre el ingreso' using errcode = '22023';
    end if;
  end loop;

  for i in 1 .. v_pasos loop
    if p_objetivos[i] is null or p_previos[i] is null or p_por_mes[i] is null then
      raise exception 'Un paso no puede tener datos vacíos' using errcode = '22004';
    end if;
    if p_objetivos[i] < 0 or p_previos[i] < 0 then
      raise exception 'Un objetivo o lo que un paso ya tiene no pueden ser negativos' using errcode = '22023';
    end if;
    if p_objetivos[i] > c_maximo or p_previos[i] > c_maximo then
      raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
    end if;
  end loop;

  for i in 1 .. v_partes loop
    if p_porcentajes[i] is null then
      raise exception 'Una parte del reparto no puede ir sin porcentaje' using errcode = '22004';
    end if;
    if p_porcentajes[i] not between 1 and 10000 then
      raise exception 'Una parte del reparto va entre 1 y 10000 puntos básicos' using errcode = '22023';
    end if;
    -- Un tope en null es una parte que junta sin fin; si lo tiene, es lo que le falta para su meta.
    if p_topes[i] < 0 then
      raise exception 'El tope de una parte no puede ser negativo' using errcode = '22023';
    end if;
    if p_topes[i] > c_maximo then
      raise exception 'Un importe no entra en un entero seguro' using errcode = '22003';
    end if;
    v_suma := v_suma + p_porcentajes[i];
  end loop;
  if v_suma > 10000 then
    raise exception 'El reparto no puede pasar del 100%%' using errcode = '22023';
  end if;

  neta_centavos := p_cobrado_centavos - p_gastos_centavos;
  v_resto := case when neta_centavos > 0 then neta_centavos else 0 end;
  obligaciones := '{}';
  topes := '{}';
  montos := '{}';
  partes := '{}';

  -- Las obligaciones, en su orden: su porcentaje de lo cobrado o de lo que les llega, redondeado como
  -- el diezmo (mitad hacia arriba), y nunca más que lo que llega. Con un ingreso que no es positivo
  -- no se aparta nada.
  for i in 1 .. v_obligaciones loop
    if neta_centavos > 0 then
      v_sobre := case p_bases[i] when 'cobrado' then p_cobrado_centavos else v_resto end;
      if v_sobre::numeric * p_obligaciones[i] + 5000 > c_maximo then
        raise exception 'El importe es demasiado grande para aplicarle una obligación con exactitud'
          using errcode = '22003';
      end if;
      v_monto := least((v_sobre * p_obligaciones[i] + 5000) / 10000, v_resto);
    else
      v_monto := 0;
    end if;
    v_resto := v_resto - v_monto;
    obligaciones := obligaciones || v_monto;
  end loop;
  libre_centavos := v_resto;

  -- Los compromisos y los ahorros fijos, cada uno hasta lo que le falta.
  for i in 1 .. v_pasos loop
    v_tope := case
      when p_por_mes[i] then greatest(0, p_objetivos[i] - p_previos[i])
      else p_objetivos[i]
    end;
    v_monto := least(v_tope, v_resto);
    v_resto := v_resto - v_monto;
    topes := topes || v_tope;
    montos := montos || v_monto;
  end loop;

  -- Los ahorros por porcentaje, sobre lo que sobra, cada uno hacia abajo al centavo y sin pasar su tope.
  sobrante_centavos := v_resto;
  for i in 1 .. v_partes loop
    if sobrante_centavos::numeric * p_porcentajes[i] > c_maximo then
      raise exception 'Lo que sobra es demasiado grande para repartirlo con exactitud'
        using errcode = '22003';
    end if;
    v_monto := (sobrante_centavos * p_porcentajes[i]) / 10000;
    if p_topes[i] is not null then
      v_monto := least(v_monto, p_topes[i]);
    end if;
    v_resto := v_resto - v_monto;
    partes := partes || v_monto;
  end loop;

  remanente_centavos := case when neta_centavos > 0 then v_resto else neta_centavos end;
end;
$function$;
-- execute: solo el dueño
comment on function private.repartir_por_la_fila(bigint,bigint,integer[],text[],bigint[],bigint[],boolean[],integer[],bigint[]) is 'Reparte el ingreso de un cobro por la fila: las obligaciones en su orden (su porcentaje de lo cobrado o de lo que les llega, redondeado como el diezmo y nunca más que lo que llega), cada paso hasta lo que le falta y lo que sobra por porcentajes, cada parte redondeada hacia abajo y sin pasar su tope; el resto y los centavos son del superávit. Rechaza con 22004, 22023 y 22003 donde repartir tira RangeError. Gemela de repartir en fila.ts (ADR 0078).';

CREATE OR REPLACE FUNCTION private.reversion_valida(p_desde estado_proyecto, p_hacia estado_proyecto)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select coalesce(
    case p_desde
      when 'cobrado' then p_hacia = 'entregado'
      when 'perdido' then p_hacia in (
        'contacto', 'presupuesto_estimativo', 'relevamiento', 'a_presupuestar', 'presupuesto_enviado'
      )
      else false
    end,
    false
  )
$function$;
-- execute: authenticated:EXECUTE
comment on function private.reversion_valida(estado_proyecto,estado_proyecto) is 'A qué estado vuelve una liquidación revertida. Gemela de puedeRevertir de @maun/domain.';

CREATE OR REPLACE FUNCTION private.revertir_liquidacion(p_proyecto_id uuid, p_version integer, p_desde estado_proyecto, p_hacia estado_proyecto)
 RETURNS proyectos
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_proyecto public.proyectos;
begin
  if num_nulls(p_proyecto_id, p_version, p_desde, p_hacia) > 0 then
    raise exception 'La reversión necesita todos sus parámetros' using errcode = '22004';
  end if;

  select p.* into v_proyecto
  from public.proyectos p
  where p.id = p_proyecto_id
    and p.household_id = any (array(select private.user_household_ids()))
  for update;

  if not found then
    raise exception 'El proyecto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El reenvío de la cola: esta misma reversión ya se aplicó y la respuesta se perdió. Reabrir un
  -- cobro deja la foto de la reapertura; reactivar un perdido no deja ninguna.
  if v_proyecto.estado = p_hacia
    and v_proyecto.fecha_cobro is null
    and v_proyecto.version = p_version + 1
    and (p_desde = 'cobrado') = (v_proyecto.reapertura_fecha_cobro is not null)
  then
    return v_proyecto;
  end if;

  if v_proyecto.deleted_at is not null then
    raise exception 'El proyecto está borrado' using errcode = 'MN002';
  end if;

  if v_proyecto.estado <> p_desde or not private.reversion_valida(p_desde, p_hacia) then
    raise exception '%', case p_desde
        when 'cobrado' then format('Solo se reabre un proyecto cobrado, y este está en %s', v_proyecto.estado)
        else format('Solo se reactiva un perdido, a un estado de seguimiento: este está en %s y el destino es %s', v_proyecto.estado, p_hacia)
      end
      using errcode = 'MN007';
  end if;

  if v_proyecto.version <> p_version then
    raise exception 'El proyecto cambió desde que lo viste'
      using errcode = 'MN006',
            detail = format('versión vista %s, versión actual %s', p_version, v_proyecto.version);
  end if;

  -- El mismo segundo lock que la liquidación: una liquidación del mismo mes que corre en paralelo
  -- ve el mes con este proyecto adentro o afuera, nunca a medias.
  perform 1
  from public.ajustes a
  where a.household_id = v_proyecto.household_id
  for no key update;

  -- Los repartos del cobro dejan de valer: salen del libro y de lo del mes, y el delta se los lleva.
  update public.repartos r set
    deleted_at = clock_timestamp()
  where r.household_id = v_proyecto.household_id
    and r.proyecto_id = v_proyecto.id
    and r.deleted_at is null;

  -- Reabrir un cobro guarda la fecha, los objetivos y el modo del original para el cobro
  -- siguiente (ADR 0003), y conserva si su reparto ya estaba en la apertura: volver a cobrarlo
  -- propone lo mismo. Si se cobró por la fila, guarda además la fila con su revisión, y volver a
  -- cobrarlo reparte con ella. Reactivar un perdido no guarda nada: un lead que revive es un lead
  -- vivo otra vez, y un cierre posterior es un evento nuevo con su fecha.
  update public.proyectos set
    estado = p_hacia,
    reapertura_objetivo_sueldo_centavos = case when p_desde = 'cobrado' then dist_objetivo_sueldo_centavos end,
    reapertura_objetivo_fijos_centavos = case when p_desde = 'cobrado' then dist_objetivo_fijos_centavos end,
    reapertura_sueldo_mensual = case when p_desde = 'cobrado' then dist_sueldo_mensual end,
    reapertura_fecha_cobro = case when p_desde = 'cobrado' then fecha_cobro end,
    reapertura_fila = case
      when p_desde = 'cobrado' and dist_fila_version is not null
        then jsonb_build_object('version', dist_fila_version, 'fila', dist_fila)
    end,
    reparto_ya_en_la_apertura = case when p_desde = 'cobrado' then reparto_ya_en_la_apertura else false end,
    fecha_cobro = null,
    dist_cobrado_centavos = null,
    dist_gastos_centavos = null,
    dist_diezmo_bp = null,
    dist_tope_sueldo_centavos = null,
    dist_tope_fijos_centavos = null,
    dist_diezmo_centavos = null,
    dist_sueldo_centavos = null,
    dist_fijos_centavos = null,
    dist_remanente_centavos = null,
    dist_objetivo_sueldo_centavos = null,
    dist_objetivo_fijos_centavos = null,
    dist_sueldo_mensual = null,
    dist_sueldo_previo_centavos = null,
    dist_fijos_previo_centavos = null,
    dist_liquidado_at = null,
    dist_fila_version = null,
    dist_fila = null,
    dist_previo = null
  where id = v_proyecto.id
  returning * into v_proyecto;

  return v_proyecto;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.revertir_liquidacion(uuid,integer,estado_proyecto,estado_proyecto) is 'Descongela la distribución de un proyecto liquidado: borra lógicamente sus repartos y reabre un cobrado a entregado guardando la foto del cobro (con la fila y su revisión si se cobró por la fila, en reapertura_fila), o reactiva un perdido a un estado de seguimiento sin foto. Los demás proyectos del mes no se recalculan. Rechaza con MN006 si el proyecto cambió. Reconoce el reenvío idéntico (ADR 0003 y 0078).';

CREATE OR REPLACE FUNCTION private.revisar_el_seguimiento_del_contacto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  perform private.revisar_el_seguimiento(new.household_id, new.proyecto_id);
  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.revisar_el_seguimiento_del_contacto() is 'Guarda diferida de proximos_contactos: al commit, revisa que el estado y el contacto pendiente vayan juntos.';

CREATE OR REPLACE FUNCTION private.revisar_el_seguimiento_del_proyecto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  perform private.revisar_el_seguimiento(new.household_id, new.id);
  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.revisar_el_seguimiento_del_proyecto() is 'Guarda diferida de proyectos: al commit, revisa que el estado y el contacto pendiente vayan juntos.';

CREATE OR REPLACE FUNCTION private.revisar_el_seguimiento(p_household_id uuid, p_proyecto_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_estado public.estado_proyecto;
  v_borrado timestamptz;
  v_pendientes integer;
begin
  select p.estado, p.deleted_at into v_estado, v_borrado
  from public.proyectos p
  where p.household_id = p_household_id and p.id = p_proyecto_id;

  -- Un trabajo borrado se lleva sus contactos: no hay nada que revisar.
  if not found or v_borrado is not null then
    return;
  end if;

  select count(*)::integer into v_pendientes
  from public.proximos_contactos c
  where c.household_id = p_household_id
    and c.proyecto_id = p_proyecto_id
    and c.hecho_el is null
    and c.deleted_at is null;

  if v_estado = 'en_seguimiento' and v_pendientes = 0 then
    raise exception 'Un trabajo en seguimiento necesita el día en que le volvés a escribir'
      using errcode = 'MN019',
            hint = 'Ponelo en seguimiento con una fecha, o dejalo en la etapa en que estaba.';
  end if;

  if v_estado <> 'en_seguimiento' and v_pendientes > 0 then
    raise exception 'Solo un trabajo en seguimiento tiene un contacto pendiente'
      using errcode = 'MN019',
            hint = 'Registrá el contacto antes de sacarlo del seguimiento.';
  end if;
end;
$function$;
-- execute: authenticated:EXECUTE
comment on function private.revisar_el_seguimiento(uuid,uuid) is 'Un trabajo vivo está en seguimiento si y solo si tiene un contacto pendiente. La llaman las dos guardas diferidas, al commit, cuando ya se escribieron el estado y los contactos de la misma transacción.';

CREATE OR REPLACE FUNCTION private.ruta_de_la_vidriera(p_household_id uuid, p_foto_id uuid, p_tipo text, p_miniatura boolean)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select p_household_id::text || '/vidriera/' || p_foto_id::text
    || case when p_miniatura then '.mini' else '' end
    || case p_tipo
         when 'image/webp' then '.webp'
         when 'image/jpeg' then '.jpg'
         else '.bin'
       end
$function$;
-- execute: authenticated:EXECUTE
comment on function private.ruta_de_la_vidriera(uuid,uuid,text,boolean) is 'La ruta de una foto de la vidriera en el bucket archivos, la misma que arma la app: {household}/vidriera/{id}.webp y al lado {id}.mini.webp, o .jpg (ADR 0076). Es la gemela de private.ruta_del_archivo para la carpeta de la vidriera: la vista del cliente la manda armada.';

CREATE OR REPLACE FUNCTION private.ruta_del_archivo(p_household_id uuid, p_proyecto_id uuid, p_archivo_id uuid, p_tipo text, p_miniatura boolean)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select p_household_id::text || '/' || p_proyecto_id::text || '/' || p_archivo_id::text
    || case
         when p_miniatura and p_tipo in ('image/webp', 'image/jpeg') then '.mini'
         else ''
       end
    || case p_tipo
         when 'image/webp' then '.webp'
         when 'image/jpeg' then '.jpg'
         when 'application/pdf' then '.pdf'
         else '.bin'
       end
$function$;
-- execute: authenticated:EXECUTE
comment on function private.ruta_del_archivo(uuid,uuid,uuid,text,boolean) is 'La ruta del binario en el bucket archivos, la misma que arma la app (ADR 0039). La vista del cliente la manda ya armada para que el navegador del cliente no tenga que conocer la convención.';

CREATE OR REPLACE FUNCTION private.sembrar_la_encuesta(p_household_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_fila record;
  v_id uuid;
begin
  if exists (
    select 1 from public.preguntas p
    where p.household_id = p_household_id and p.proyecto_id is null
  ) then
    return;
  end if;

  for v_fila in
    select *
    from (
      values
        (10, '¿Qué tan conforme quedaste con el mueble?', 'escala5', 'conformidad', true, true),
        (20, '¿Y con los tiempos de entrega?', 'escala5', 'tiempos', true, false),
        (30, '¿Cómo fue hablar con el taller mientras duró el trabajo?', 'escala5', 'trato', false, false),
        (40, '¿Se lo recomendarías a alguien?', 'sitalvezno', null, true, false),
        (50, '¿Qué podríamos hacer mejor?', 'texto', null, false, false)
    ) as t (orden, texto, tipo, escala, obligatoria, titular)
  loop
    v_id := private.uuidv7();
    insert into public.preguntas (
      id, household_id, serie, numero, titular, orden, texto, tipo, escala, obligatoria
    ) values (
      v_id, p_household_id, v_id, 1, v_fila.titular, v_fila.orden, v_fila.texto,
      v_fila.tipo::public.tipo_de_pregunta, v_fila.escala::public.escala_de_pregunta,
      v_fila.obligatoria
    );
  end loop;
end;
$function$;
-- execute: solo el dueño
comment on function private.sembrar_la_encuesta(uuid) is 'Le escribe al taller la encuesta base de fábrica, si no tiene ninguna: cinco preguntas, la primera la del titular. La llama private.crear_household() con cada taller nuevo. Solo la ejecuta el dueño de la base.';

CREATE OR REPLACE FUNCTION private.sembrar_los_tesoros(p_household_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Los nombres, las descripciones, las tintas y los íconos son los de shared/lib/tesoros.ts de la
  -- app. La meta y el rinde de Cocos no van acá: siguen en ajustes.
  insert into public.tesoros (id, household_id, clave, nombre, descripcion, tinta, icono, orden)
  select private.uuidv7(), p_household_id, t.clave, t.nombre, t.descripcion, t.clave::text, t.icono, t.orden
  from (
    values
      ('hogar'::public.tesoro, 'Hogar', 'La plata de la familia', 'house', 0),
      ('maun'::public.tesoro, 'Maun', 'La caja del taller', 'hammer', 1),
      ('diezmo'::public.tesoro, 'Diezmo', 'Lo apartado de cada ganancia', 'church', 2),
      ('cocos'::public.tesoro, 'Cocos', 'Ahorro para la casa propia', 'piggy-bank', 3)
  ) as t (clave, nombre, descripcion, icono, orden)
  where not exists (
    select 1 from public.tesoros e
    where e.household_id = p_household_id and e.clave = t.clave
  );
end;
$function$;
-- execute: solo el dueño
comment on function private.sembrar_los_tesoros(uuid) is 'Le escribe al taller sus cuatro tesoros de siempre (hogar, maun, diezmo y cocos) con los nombres, las tintas y los íconos de la app, si no los tiene. Idempotente. La llaman private.crear_household() con cada taller nuevo, la migración que creó la tabla y el seed. Solo la ejecuta el dueño de la base (ADR 0078).';

CREATE OR REPLACE FUNCTION private.sena_esperada(p_precio_centavos bigint, p_sena_bp integer)
 RETURNS bigint
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select (p_precio_centavos * p_sena_bp + 5000) / 10000
$function$;
-- execute: authenticated:EXECUTE
comment on function private.sena_esperada(bigint,integer) is 'El importe de la seña: el porcentaje del trabajo, o el del taller, sobre el presupuesto, redondeado al centavo mitad hacia arriba. Null sin presupuesto. Es la gemela de calcularSena().esperada de @maun/domain, y scripts/comparacion.ts las compara caso por caso. La usan private.pagos_por_delante() y public.vista_del_cliente(): la seña se calcula acá y en ningún otro lugar de la base (ADR 0067).';

CREATE OR REPLACE FUNCTION private.suscripciones_para_probar(p_usuario uuid, p_endpoint text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('id', s.id, 'endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)
      order by s.creada_en
    ),
    '[]'::jsonb
  )
  from private.suscripciones_de_avisos s
  where s.user_id = p_usuario
    and (p_endpoint is null or s.endpoint = p_endpoint)
$function$;
-- execute: service_role:EXECUTE
comment on function private.suscripciones_para_probar(uuid,text) is 'Los dispositivos de una persona, o uno solo si se pasa el endpoint, para mandarles el aviso de prueba. El usuario lo validó la función de borde con su token.';

CREATE OR REPLACE FUNCTION private.topes_de_la_liquidacion(p_objetivo_sueldo_centavos bigint, p_objetivo_fijos_centavos bigint, p_sueldo_mensual boolean, p_sueldo_previo_centavos bigint, p_fijos_previo_centavos bigint, OUT tope_sueldo_centavos bigint, OUT tope_fijos_centavos bigint)
 RETURNS record
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  -- Number.MAX_SAFE_INTEGER, como en private.cascada.
  c_maximo constant bigint := 9007199254740991;
begin
  if num_nulls(
    p_objetivo_sueldo_centavos, p_objetivo_fijos_centavos, p_sueldo_mensual,
    p_sueldo_previo_centavos, p_fijos_previo_centavos
  ) > 0 then
    raise exception 'Los topes necesitan todos sus parámetros' using errcode = '22004';
  end if;

  if least(
    p_objetivo_sueldo_centavos, p_objetivo_fijos_centavos, p_sueldo_previo_centavos, p_fijos_previo_centavos
  ) < 0 then
    raise exception 'Los topes no aceptan importes negativos' using errcode = '22023';
  end if;

  if greatest(
    p_objetivo_sueldo_centavos, p_objetivo_fijos_centavos, p_sueldo_previo_centavos, p_fijos_previo_centavos
  ) > c_maximo then
    raise exception 'Importe fuera del rango exacto de Money' using errcode = '22003';
  end if;

  tope_fijos_centavos := greatest(0, p_objetivo_fijos_centavos - p_fijos_previo_centavos);
  tope_sueldo_centavos := case
    when p_sueldo_mensual then greatest(0, p_objetivo_sueldo_centavos - p_sueldo_previo_centavos)
    else p_objetivo_sueldo_centavos
  end;
end;
$function$;
-- execute: solo el dueño
comment on function private.topes_de_la_liquidacion(bigint,bigint,boolean,bigint,bigint) is 'Los topes de una liquidación: fijos por lo que falta del mes; sueldo por proyecto (el objetivo entero) o por mes. Gemela de topesDeLaLiquidacion de @maun/domain.';

CREATE OR REPLACE FUNCTION private.transicion_valida(p_desde estado_proyecto, p_hasta estado_proyecto)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select exists (
    select 1
    from (
      values
        ('contacto', 'presupuesto_estimativo'), ('contacto', 'relevamiento'), ('contacto', 'a_presupuestar'),
        ('contacto', 'presupuesto_enviado'), ('contacto', 'en_seguimiento'), ('contacto', 'en_curso'),
        ('presupuesto_estimativo', 'contacto'), ('presupuesto_estimativo', 'relevamiento'),
        ('presupuesto_estimativo', 'a_presupuestar'), ('presupuesto_estimativo', 'presupuesto_enviado'),
        ('presupuesto_estimativo', 'en_seguimiento'), ('presupuesto_estimativo', 'en_curso'),
        ('relevamiento', 'contacto'), ('relevamiento', 'presupuesto_estimativo'), ('relevamiento', 'a_presupuestar'),
        ('relevamiento', 'presupuesto_enviado'), ('relevamiento', 'en_seguimiento'), ('relevamiento', 'en_curso'),
        ('a_presupuestar', 'contacto'), ('a_presupuestar', 'presupuesto_estimativo'), ('a_presupuestar', 'relevamiento'),
        ('a_presupuestar', 'presupuesto_enviado'), ('a_presupuestar', 'en_seguimiento'), ('a_presupuestar', 'en_curso'),
        ('presupuesto_enviado', 'contacto'), ('presupuesto_enviado', 'presupuesto_estimativo'),
        ('presupuesto_enviado', 'relevamiento'), ('presupuesto_enviado', 'a_presupuestar'),
        ('presupuesto_enviado', 'en_seguimiento'), ('presupuesto_enviado', 'en_curso'),
        ('en_seguimiento', 'contacto'), ('en_seguimiento', 'presupuesto_estimativo'),
        ('en_seguimiento', 'relevamiento'), ('en_seguimiento', 'a_presupuestar'),
        ('en_seguimiento', 'presupuesto_enviado'),
        ('en_curso', 'presupuesto_enviado'), ('en_curso', 'entregado'),
        ('entregado', 'en_curso')
    ) as t (desde, hasta)
    where t.desde::public.estado_proyecto = p_desde
      and t.hasta::public.estado_proyecto = p_hasta
  )
$function$;
-- execute: authenticated:EXECUTE
comment on function private.transicion_valida(estado_proyecto,estado_proyecto) is 'Transiciones manuales de estado. Liquidar y revertir no están: son operaciones. Del seguimiento se vuelve a cualquier etapa de las consultas y nunca se aprueba directo. Gemela de TRANSICIONES de @maun/domain.';

CREATE OR REPLACE FUNCTION private.user_household_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select m.household_id
  from public.household_members m
  join public.households h on h.id = m.household_id
  where m.user_id = (select auth.uid())
    and m.deleted_at is null
    and h.deleted_at is null
$function$;
-- execute: authenticated:EXECUTE
comment on function private.user_household_ids() is 'Households a los que pertenece el usuario de la sesión. Vacío si no hay sesión: auth.uid() es null y no matchea nada.';

CREATE OR REPLACE FUNCTION private.uuidv7()
 RETURNS uuid
 LANGUAGE sql
 PARALLEL SAFE
 SET search_path TO ''
AS $function$
  -- 48 bits de milisegundos Unix sobre los 128 bits aleatorios de gen_random_uuid(). Los bits 52
  -- y 53 pasan la versión de 4 (0100) a 7 (0111); los de variante ya vienen en 10.
  select encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(int8send(floor(extract(epoch from clock_timestamp()) * 1000)::bigint) from 3)
          from 1 for 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::uuid
$function$;
-- execute: authenticated:EXECUTE
comment on function private.uuidv7() is 'UUID versión 7 (RFC 9562): ordenado por tiempo, así los inserts caen al final del índice. Default de las columnas id.';

CREATE OR REPLACE FUNCTION private.validar_baja_cliente()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if new.deleted_at is not null and old.deleted_at is null and exists (
    select 1
    from public.proyectos p
    where p.household_id = new.household_id
      and p.cliente_id = new.id
      and p.deleted_at is null
  ) then
    raise exception 'El cliente tiene proyectos: borralos o reasignalos antes de borrar el cliente'
      using errcode = 'MN003';
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño

CREATE OR REPLACE FUNCTION private.validar_la_fecha_del_pago()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_apertura date;
begin
  -- En un upsert que choca contra una fila existente, este trigger corre antes de detectar el
  -- conflicto. Se deja pasar y decide el trigger de UPDATE, que ve la fila vieja.
  if tg_op = 'INSERT' then
    perform 1 from public.pagos where id = new.id;
    if found then
      return new;
    end if;
  end if;

  -- Una baja no se revisa: sacar un pago con una fecha rara tiene que poder hacerse siempre.
  if new.deleted_at is not null then
    return new;
  end if;

  if (tg_op = 'INSERT' or new.fecha is distinct from old.fecha)
    and new.fecha > private.hoy_en_el_taller()
  then
    raise exception 'La fecha del pago es de un día que todavía no llegó'
      using errcode = 'MN017',
            detail = format('fecha %s, hoy %s', new.fecha, private.hoy_en_el_taller()),
            hint = 'Poné el día en que te pagaron: hoy o antes.';
  end if;

  if new.ya_en_la_apertura
    and (tg_op = 'INSERT' or new.fecha is distinct from old.fecha or not old.ya_en_la_apertura)
  then
    v_apertura := private.fecha_de_apertura(new.household_id);
    if v_apertura is null or new.fecha >= v_apertura then
      raise exception 'Ese pago no es de antes de que empezaras con la app'
        using errcode = 'MN018',
              detail = format('fecha %s, apertura %s', new.fecha, coalesce(v_apertura::text, 'ninguna')),
              hint = 'Solo la plata de antes de la apertura puede estar en los saldos con los que arrancaste.';
    end if;
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.validar_la_fecha_del_pago() is 'Guarda de la fecha de un pago: no acepta un día que todavía no llegó (MN017) y solo deja marcarlo como ya incluido en la apertura si es de antes de la apertura (MN018). La que falte la fecha la frena guardar_proyecto y el not null de la columna. Deja pasar las bajas.';

CREATE OR REPLACE FUNCTION private.validar_presupuesto_aprobado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_household_id uuid;
  v_proyecto_id uuid;
  v_presupuesto bigint;
  v_cuantas integer;
  v_esperado bigint;
begin
  if tg_table_name = 'proyectos' then
    v_household_id := new.household_id;
    v_proyecto_id := new.id;
  else
    v_household_id := new.household_id;
    v_proyecto_id := new.proyecto_id;
  end if;

  select p.presupuesto_centavos into v_presupuesto
  from public.proyectos p
  where p.household_id = v_household_id and p.id = v_proyecto_id;

  -- El trabajo ya no está: lo borró la misma transacción y la baja en cascada se llevó sus opciones.
  if not found then
    return null;
  end if;

  select count(*)::integer, min(monto_centavos) filter (where aprobada)
  into v_cuantas, v_esperado
  from public.opciones_de_presupuesto
  where household_id = v_household_id
    and proyecto_id = v_proyecto_id
    and deleted_at is null;

  -- Sin opciones, el presupuesto es un campo más y lo carga el usuario: nada que validar.
  if v_cuantas = 0 then
    return null;
  end if;

  if v_presupuesto is distinct from v_esperado then
    raise exception 'El presupuesto de un trabajo con opciones sale de la opción aprobada'
      using errcode = 'MN009',
            detail = format(
              'presupuesto %s, opciones vivas %s, esperado %s',
              coalesce(v_presupuesto::text, 'sin presupuesto'),
              v_cuantas,
              coalesce(v_esperado::text, 'sin presupuesto')
            ),
            hint = 'Tildá la opción que te aprobaron, o sacá las opciones si querés cargar el presupuesto a mano.';
  end if;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.validar_presupuesto_aprobado() is 'Con opciones vivas, el presupuesto del trabajo tiene que ser el de la opción aprobada (o null si no hay ninguna). Es un trigger de constraint diferido: adentro de una transacción el proyecto se escribe antes que sus hijas, así que el par recién tiene que cerrar al final.';

CREATE OR REPLACE FUNCTION private.validar_proximo_contacto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Upsert que choca contra una fila existente: decide la rama UPDATE, que ve la fila vieja.
  if tg_op = 'INSERT' then
    perform 1 from public.proximos_contactos where id = new.id;
    if found then
      return new;
    end if;
  end if;

  if new.hecho_el is not null and new.hecho_el > private.hoy_en_el_taller() then
    raise exception 'El contacto no se puede registrar en un día que todavía no llegó'
      using errcode = 'MN017',
            hint = 'Poné el día en que le escribiste, que tiene que ser hoy o antes.';
  end if;

  -- La historia no se reabre: un contacto registrado no vuelve a quedar pendiente. Para seguir, se
  -- carga una fecha nueva.
  if tg_op = 'UPDATE' and old.hecho_el is not null and new.hecho_el is null then
    raise exception 'Un contacto ya registrado no vuelve a quedar pendiente'
      using errcode = 'MN019',
            hint = 'Para volver a escribirle, poné una fecha nueva.';
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.validar_proximo_contacto() is 'Guarda de proximos_contactos: el día en que se registró el contacto no es futuro (MN017) y un contacto registrado no se reabre (MN019).';

CREATE OR REPLACE FUNCTION private.validar_proyecto_abierto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_proyectos uuid[];
  v_liquidado public.estado_proyecto;
begin
  if tg_op = 'INSERT' then
    -- En un upsert que choca contra una fila existente, este trigger corre antes de detectar el
    -- conflicto. Se deja pasar y decide el trigger de UPDATE, que ve la fila vieja.
    if tg_table_name = 'pagos' then
      perform 1 from public.pagos where id = new.id;
    else
      perform 1 from public.gastos where id = new.id;
    end if;
    if found then
      return new;
    end if;
    v_proyectos := array[new.proyecto_id];
  else
    if private.es_reenvio(to_jsonb(old), to_jsonb(new)) then
      return new;
    end if;
    v_proyectos := array[old.proyecto_id, new.proyecto_id];
  end if;

  -- Bloquea el proyecto antes de mirarlo. Sin esto, un pago que entra mientras otra sesión liquida
  -- el proyecto pasa la guarda con el estado viejo y queda fuera de la distribución congelada: la
  -- foreign key solo toma un lock que no choca con el update de la liquidación. Con for share, este
  -- trigger espera a la liquidación y la consulta de abajo, que es nueva, ya la ve commiteada. El
  -- contrato del otro lado: private.liquidar bloquea el proyecto con for update antes de sumar.
  perform 1
  from public.proyectos p
  where p.household_id = new.household_id
    and p.id = any (v_proyectos)
  order by p.id
  for share;

  select p.estado into v_liquidado
  from public.proyectos p
  where p.household_id = new.household_id
    and p.id = any (v_proyectos)
    and p.estado in ('cobrado', 'perdido')
  limit 1;

  if found then
    raise exception 'El proyecto está % y su distribución congelada: sus pagos y gastos no se modifican', v_liquidado
      using errcode = 'MN001',
            hint = case v_liquidado
              when 'cobrado' then 'Para corregirlo hay que reabrir el proyecto o registrar un ajuste.'
              else 'Para cargarlo hay que reactivar el perdido y volver a cerrarlo.'
            end;
  end if;

  -- Un hijo de un proyecto borrado solo puede quedar borrado (es lo que hace la baja en cascada).
  if new.deleted_at is null and exists (
    select 1
    from public.proyectos p
    where p.household_id = new.household_id
      and p.id = new.proyecto_id
      and p.deleted_at is not null
  ) then
    raise exception 'El proyecto está borrado'
      using errcode = 'MN002';
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.validar_proyecto_abierto() is 'Guarda de pagos y gastos: rechaza altas y cambios sobre un proyecto liquidado, cobrado o perdido (MN001), o borrado (MN002). Deja pasar el reenvío idéntico de la cola.';

CREATE OR REPLACE FUNCTION private.validar_proyecto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_cliente_borrado timestamptz;
begin
  if tg_op = 'INSERT' then
    -- Upsert que choca contra una fila existente: decide la rama UPDATE, que ve la fila vieja.
    perform 1 from public.proyectos where id = new.id;
    if found then
      return new;
    end if;

    -- Un proyecto no nace liquidado: cobrar y cerrar como perdido son operaciones, no datos.
    if new.estado in ('cobrado', 'perdido') and new.fecha_cobro is null then
      raise exception 'Un proyecto no se crea %: se cobra con cobrar_proyecto y se pierde con cerrar_perdido', new.estado
        using errcode = 'MN007';
    end if;
  elsif private.es_reenvio(to_jsonb(old), to_jsonb(new)) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Lo congelado solo se mueve revirtiendo, y la reversión limpia fecha_cobro. Sin esta guarda,
    -- una edición encolada con el estado viejo rebotaría contra un check con un 23514 genérico.
    if old.estado in ('cobrado', 'perdido') and new.fecha_cobro is not null and new.estado <> old.estado then
      raise exception 'El proyecto está % y su distribución congelada: su estado no cambia editándolo', old.estado
        using errcode = 'MN001',
              hint = case old.estado
                when 'cobrado' then 'Para corregirlo hay que reabrir el proyecto o registrar un ajuste.'
                else 'Un perdido vuelve al seguimiento con reactivar_perdido.'
              end;
    end if;

    -- Borrar un proyecto borra sus pagos y gastos: si está liquidado y movió plata, eso la sacaría
    -- del libro mayor. Un liquidado sin pagos ni gastos (el lead perdido sin seña) sí se borra.
    if old.fecha_cobro is not null and old.deleted_at is null and new.deleted_at is not null and (
      exists (
        select 1 from public.pagos g
        where g.household_id = old.household_id and g.proyecto_id = old.id and g.deleted_at is null
      )
      or exists (
        select 1 from public.gastos g
        where g.household_id = old.household_id and g.proyecto_id = old.id and g.deleted_at is null
      )
    ) then
      raise exception 'Un proyecto % con pagos o gastos no se borra: tiene la distribución congelada', old.estado
        using errcode = 'MN001';
    end if;

    -- La baja se lleva los pagos y gastos, y des-borrar no los trae de vuelta: un proyecto
    -- borrado se queda borrado. Evita que una edición vieja encolada lo resucite vacío.
    if old.deleted_at is not null and new.deleted_at is null then
      raise exception 'El proyecto está borrado'
        using errcode = 'MN002';
    end if;

    if new.estado is distinct from old.estado then
      if new.estado in ('cobrado', 'perdido') then
        -- Solo private.liquidar llega acá con la distribución congelada: el cliente no tiene grant
        -- sobre fecha_cobro.
        if new.fecha_cobro is null or not private.liquidacion_valida(old.estado, new.estado) then
          raise exception 'Un proyecto no pasa de % a % editando el estado: se cobra con cobrar_proyecto y se pierde con cerrar_perdido', old.estado, new.estado
            using errcode = 'MN007';
        end if;
      elsif old.estado in ('cobrado', 'perdido') then
        -- Solo private.revertir_liquidacion llega acá, porque es la única que limpia fecha_cobro.
        if not private.reversion_valida(old.estado, new.estado) then
          raise exception 'Un proyecto % no vuelve a %', old.estado, new.estado
            using errcode = 'MN007';
        end if;
      elsif not private.transicion_valida(old.estado, new.estado) then
        raise exception 'Un proyecto no pasa de % a %', old.estado, new.estado
          using errcode = 'MN007';
      end if;
    end if;
  end if;

  if new.deleted_at is null and (tg_op = 'INSERT' or new.cliente_id is distinct from old.cliente_id) then
    select c.deleted_at into v_cliente_borrado
    from public.clientes c
    where c.household_id = new.household_id
      and c.id = new.cliente_id
    for share;

    if v_cliente_borrado is not null then
      raise exception 'El cliente está borrado'
        using errcode = 'MN005';
    end if;
  end if;

  return new;
end;
$function$;
-- execute: solo el dueño
comment on function private.validar_proyecto() is 'Guarda de proyectos: un liquidado (cobrado o perdido) no cambia de estado editándolo, y con pagos o gastos no se borra (MN001); un borrado no revive (MN002); un proyecto vivo no cuelga de un cliente borrado (MN005); el estado solo sigue transiciones válidas (MN007). Deja pasar el reenvío idéntico de la cola.';

CREATE OR REPLACE FUNCTION private.validar_respuesta_de_entrega(p_respuesta jsonb, p_forma forma_de_coordinar, p_hoy date)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_respuesta text;
  v_dias jsonb;
  v_nota text;
  v_dia jsonb;
  v_franjas jsonb;
  v_fecha date;
  v_vistas date[] := array[]::date[];
  v_distancia integer;
begin
  -- La forma: {id, propuesta_id, respuesta, dias, nota}, y cada día {fecha, franjas}.
  if p_respuesta is null or jsonb_typeof(p_respuesta) is distinct from 'object' then
    return 'forma';
  end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p_respuesta) as k)
    is distinct from array['dias', 'id', 'nota', 'propuesta_id', 'respuesta'] then
    return 'forma';
  end if;
  if jsonb_typeof(p_respuesta -> 'id') is distinct from 'string'
    or (p_respuesta ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return 'forma';
  end if;
  if jsonb_typeof(p_respuesta -> 'propuesta_id') is distinct from 'string'
    or (p_respuesta ->> 'propuesta_id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return 'forma';
  end if;
  if jsonb_typeof(p_respuesta -> 'respuesta') is distinct from 'string'
    or (p_respuesta ->> 'respuesta') not in ('me_queda_bien', 'mis_dias') then
    return 'forma';
  end if;
  if jsonb_typeof(p_respuesta -> 'dias') is distinct from 'array'
    or jsonb_typeof(p_respuesta -> 'nota') is distinct from 'string' then
    return 'forma';
  end if;

  v_respuesta := p_respuesta ->> 'respuesta';
  v_dias := p_respuesta -> 'dias';
  v_nota := p_respuesta ->> 'nota';

  for v_dia in select d from jsonb_array_elements(v_dias) as d loop
    if jsonb_typeof(v_dia) is distinct from 'object' then
      return 'forma';
    end if;
    if (select array_agg(k order by k) from jsonb_object_keys(v_dia) as k)
      is distinct from array['fecha', 'franjas'] then
      return 'forma';
    end if;
    if jsonb_typeof(v_dia -> 'fecha') is distinct from 'string'
      or not private.es_dia_de_la_entrega(v_dia ->> 'fecha')
      or jsonb_typeof(v_dia -> 'franjas') is distinct from 'array' then
      return 'forma';
    end if;
    if exists (
      select 1 from jsonb_array_elements(v_dia -> 'franjas') as f
      where jsonb_typeof(f) is distinct from 'string'
    ) then
      return 'forma';
    end if;
  end loop;

  -- Aceptar el día propuesto no lleva días ni nota: el día es el de la propuesta.
  if v_respuesta = 'me_queda_bien'
    and (jsonb_array_length(v_dias) > 0 or v_nota ~ '[^ \t\n\r\f\v]') then
    return 'forma';
  end if;

  if v_respuesta = 'me_queda_bien' then
    return case when p_forma = 'un_dia' then null else 'propuesta' end;
  end if;

  if jsonb_array_length(v_dias) = 0 and v_nota !~ '[^ \t\n\r\f\v]' then
    return 'vacia';
  end if;

  if jsonb_array_length(v_dias) > 10 then
    return 'demasiados';
  end if;

  for v_dia in select d from jsonb_array_elements(v_dias) as d loop
    v_fecha := (v_dia ->> 'fecha')::date;
    if v_fecha = any (v_vistas) then
      return 'repetido';
    end if;
    v_vistas := v_vistas || v_fecha;

    -- De pasado mañana a dentro de 30 días, en la hora del taller.
    v_distancia := v_fecha - p_hoy;
    if v_distancia < 2 or v_distancia > 30 then
      return 'fuera';
    end if;

    if extract(isodow from v_fecha) = 7 then
      return 'domingo';
    end if;

    v_franjas := v_dia -> 'franjas';
    if jsonb_array_length(v_franjas) not between 1 and 2
      or exists (
        select 1 from jsonb_array_elements_text(v_franjas) as f where f not in ('manana', 'tarde')
      )
      or (select count(distinct f) from jsonb_array_elements_text(v_franjas) as f)
        <> jsonb_array_length(v_franjas) then
      return 'franja';
    end if;
  end loop;

  if char_length(regexp_replace(v_nota, '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')) > 500 then
    return 'largo';
  end if;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.validar_respuesta_de_entrega(jsonb,forma_de_coordinar,date) is 'Si una respuesta a una propuesta de entrega sirve, y si no, por qué: forma (no es {id, propuesta_id, respuesta, dias, nota} con días {fecha, franjas}, o acepta el día con días o nota), propuesta (acepta un día cuando el taller le pidió los suyos), vacia (ni un día ni una nota), demasiados (más de diez días), repetido, fuera (un día antes de pasado mañana o después de dentro de 30, contados desde p_hoy), domingo, franja (sin la mañana o la tarde bien marcadas) o largo (nota de más de 500 caracteres). Devuelve null si sirve. El orden de las revisiones es parte de la regla: es gemela de validarRespuestaDeEntrega de @maun/domain y el comparador las ata caso por caso (ADR 0071).';

CREATE OR REPLACE FUNCTION private.validar_respuesta(p_preguntas jsonb, p_respuesta jsonb)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$
declare
  v_renglon jsonb;
  v_pregunta jsonb;
  v_valor jsonb;
  v_id text;
  v_tipo text;
  v_cantidad integer;
  v_numero numeric;
  v_elegidas numeric[];
  v_texto text;
  v_vistas text[] := array[]::text[];
  v_obligatoria jsonb;
begin
  if p_respuesta is null or jsonb_typeof(p_respuesta) is distinct from 'object' then
    return 'forma';
  end if;
  if (select array_agg(k order by k) from jsonb_object_keys(p_respuesta) as k)
    is distinct from array['id', 'renglones'] then
    return 'forma';
  end if;
  if jsonb_typeof(p_respuesta -> 'id') is distinct from 'string'
    or (p_respuesta ->> 'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return 'forma';
  end if;
  if jsonb_typeof(p_respuesta -> 'renglones') is distinct from 'array' then
    return 'forma';
  end if;

  for v_renglon in select r from jsonb_array_elements(p_respuesta -> 'renglones') as r loop
    if jsonb_typeof(v_renglon) is distinct from 'object'
      or (select array_agg(k order by k) from jsonb_object_keys(v_renglon) as k)
        is distinct from array['pregunta', 'valor']
      or jsonb_typeof(v_renglon -> 'pregunta') is distinct from 'string' then
      return 'forma';
    end if;

    v_id := v_renglon ->> 'pregunta';
    select p into v_pregunta
    from jsonb_array_elements(p_preguntas) as p
    where p ->> 'id' = v_id
    limit 1;
    if not found then
      return 'ajena';
    end if;
    if v_id = any (v_vistas) then
      return 'repetida';
    end if;
    v_vistas := v_vistas || v_id;

    v_valor := v_renglon -> 'valor';
    v_tipo := v_pregunta ->> 'tipo';
    v_cantidad := case
      when jsonb_typeof(v_pregunta -> 'opciones') = 'array' then jsonb_array_length(v_pregunta -> 'opciones')
      else 0
    end;

    if v_tipo in ('escala5', 'sitalvezno', 'una') then
      if jsonb_typeof(v_valor) is distinct from 'number' then
        return 'tipo';
      end if;
      v_numero := v_valor::numeric;
      if v_numero <> trunc(v_numero) then
        return 'tipo';
      end if;
      if (v_tipo = 'escala5' and v_numero not between 1 and 5)
        or (v_tipo = 'sitalvezno' and v_numero not between 1 and 3)
        or (v_tipo = 'una' and (v_numero < 0 or v_numero >= v_cantidad)) then
        return 'rango';
      end if;
    elsif v_tipo = 'varias' then
      if jsonb_typeof(v_valor) is distinct from 'array' then
        return 'tipo';
      end if;
      if exists (
        select 1 from jsonb_array_elements(v_valor) as e
        where case
          when jsonb_typeof(e) = 'number' then e::numeric <> trunc(e::numeric)
          else true
        end
      ) then
        return 'tipo';
      end if;
      select coalesce(array_agg(e::numeric), array[]::numeric[]) into v_elegidas
      from jsonb_array_elements(v_valor) as e;
      if cardinality(v_elegidas) = 0 then
        return 'vacio';
      end if;
      if exists (select 1 from unnest(v_elegidas) as x where x < 0 or x >= v_cantidad)
        or (select count(distinct x) from unnest(v_elegidas) as x) <> cardinality(v_elegidas) then
        return 'rango';
      end if;
    elsif v_tipo = 'texto' then
      if jsonb_typeof(v_valor) is distinct from 'string' then
        return 'tipo';
      end if;
      v_texto := v_valor #>> '{}';
      if v_texto !~ '[^ \t\n\r\f\v]' then
        return 'vacio';
      end if;
      if char_length(regexp_replace(v_texto, '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')) > 2000 then
        return 'largo';
      end if;
    else
      return 'ajena';
    end if;
  end loop;

  for v_obligatoria in
    select p from jsonb_array_elements(p_preguntas) as p
    where (p -> 'obligatoria') = 'true'::jsonb
  loop
    if not ((v_obligatoria ->> 'id') = any (v_vistas)) then
      return 'obligatoria';
    end if;
  end loop;

  return null;
end;
$function$;
-- execute: solo el dueño
comment on function private.validar_respuesta(jsonb,jsonb) is 'Si una respuesta sirve para una lista de preguntas, y si no, por qué: forma (no es {id, renglones} con renglones {pregunta, valor}), ajena (contesta una pregunta que no es de la lista), repetida, tipo (el valor no es del tipo que pide la pregunta), rango (fuera de la escala o de las opciones), vacio, largo (texto de más de 2000 caracteres) u obligatoria (falta una). Devuelve null si sirve. El orden de las revisiones es parte de la regla: es gemela de validarRespuesta de @maun/domain y el comparador las ata caso por caso.';

CREATE OR REPLACE FUNCTION private.validar_zona(p_zona text)
 RETURNS void
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
begin
  if p_zona is null or not exists (select 1 from pg_catalog.pg_timezone_names where name = p_zona) then
    raise exception 'La zona horaria no existe' using errcode = '22023';
  end if;
end;
$function$;
-- execute: solo el dueño

CREATE OR REPLACE FUNCTION public.proponer_la_entrega(p_proyecto_id uuid, p_propuesta jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_proyecto public.proyectos;
  v_id uuid;
  v_existente public.propuestas_de_entrega;
  v_cerradas jsonb;
  v_nueva public.propuestas_de_entrega;
begin
  if p_propuesta is not null and jsonb_typeof(p_propuesta) <> 'object' then
    raise exception 'La propuesta va en un objeto jsonb' using errcode = '22023';
  end if;

  -- El trabajo primero, con for update: es el orden de la baja de un trabajo y el de la puerta del
  -- cliente, así una respuesta que se está guardando y una propuesta nueva se esperan y no se trancan.
  select * into v_proyecto from public.proyectos p where p.id = p_proyecto_id for update;

  if not found then
    raise exception 'El proyecto no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El reenvío de la misma propuesta (la respuesta del primero se perdió en la red) contesta lo que hay
  -- y no toca nada.
  if p_propuesta is not null then
    v_id := (p_propuesta ->> 'id')::uuid;
    select * into v_existente from public.propuestas_de_entrega d where d.id = v_id;
    if found then
      return jsonb_build_object('propuestas', jsonb_build_array(to_jsonb(v_existente)));
    end if;
  end if;

  -- Cerrar antes de abrir, en su propia sentencia: el índice único parcial de la abierta se evalúa
  -- fila por fila (ADR 0043).
  with cerradas as (
    update public.propuestas_de_entrega d
    set cerrada_at = now()
    where d.household_id = v_proyecto.household_id
      and d.proyecto_id = v_proyecto.id
      and d.cerrada_at is null
      and d.deleted_at is null
    returning d.*
  )
  select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb) into v_cerradas from cerradas c;

  if p_propuesta is null then
    return jsonb_build_object('propuestas', v_cerradas);
  end if;

  insert into public.propuestas_de_entrega (id, proyecto_id, forma, fecha, franja)
  values (
    v_id,
    v_proyecto.id,
    (p_propuesta ->> 'forma')::public.forma_de_coordinar,
    nullif(p_propuesta ->> 'fecha', '')::date,
    nullif(p_propuesta ->> 'franja', '')::public.franja_de_entrega
  )
  returning * into v_nueva;

  return jsonb_build_object('propuestas', v_cerradas || jsonb_build_array(to_jsonb(v_nueva)));
end;
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function proponer_la_entrega(uuid,jsonb) is 'Le pide al cliente el día de la entrega de un trabajo en curso y listo: p_propuesta es {id, forma, fecha, franja}, con forma un_dia (el día propuesto, desde mañana, con franja opcional) o sus_dias (sin día). Cierra la propuesta abierta y abre la nueva en una transacción; con p_propuesta en null solo cierra. La guarda de la tabla rechaza con MN021 un trabajo que no está listo, una entrega ya comprometida o un día que no es desde mañana. Idempotente por el id: el reenvío contesta la que ya está. Devuelve las filas que tocó, para que la app las aplique a su réplica sin esperar el delta. Es security invoker y necesita señal: una propuesta que no está en la base no la ve el cliente (ADR 0071).';

CREATE OR REPLACE FUNCTION public.reabrir_proyecto(p_proyecto_id uuid, p_version integer)
 RETURNS proyectos
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from private.revertir_liquidacion(p_proyecto_id, p_version, 'cobrado', 'entregado')
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function reabrir_proyecto(uuid,integer) is 'RPC de reapertura de un proyecto cobrado: vuelve a entregado y guarda la fecha y los objetivos del cobro.';

CREATE OR REPLACE FUNCTION public.reactivar_perdido(p_proyecto_id uuid, p_version integer, p_estado estado_proyecto)
 RETURNS proyectos
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select * from private.revertir_liquidacion(p_proyecto_id, p_version, 'perdido', p_estado)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function reactivar_perdido(uuid,integer,estado_proyecto) is 'RPC de reactivación de un perdido: descongela su liquidación y lo vuelve al estado de seguimiento elegido.';

CREATE OR REPLACE FUNCTION public.registrar_suscripcion(p_endpoint text, p_p256dh text, p_auth text, p_zona text)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  select private.registrar_suscripcion(p_endpoint, p_p256dh, p_auth, p_zona)
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function registrar_suscripcion(text,text,text,text) is 'Activa los avisos en este dispositivo. No pasa por la cola de salida: sin señal no se puede suscribir a un servicio de push de todas formas.';

CREATE OR REPLACE FUNCTION public.responder_la_entrega(p_token text, p_respuesta jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_enlace public.enlaces_publicos;
  v_proyecto public.proyectos;
  v_propuesta public.propuestas_de_entrega;
  v_hoy date := private.hoy_en_el_taller();
  v_uuid constant text := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_id uuid;
  v_propuesta_id uuid;
  v_motivo text;
  v_cuantas integer;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  -- El enlace, sin bloquearlo: solo para saber de qué trabajo es.
  select * into v_enlace
  from public.enlaces_publicos e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocado_at is null
    and e.deleted_at is null;

  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  -- Después, en el orden de la baja de un trabajo, que empieza por el trabajo y sigue por sus hijas: el
  -- trabajo con for update (dos respuestas a la vez, o una propuesta nueva del dueño, se esperan acá),
  -- el enlace con for share, que se vuelve a mirar por si lo dieron de baja mientras tanto, y la
  -- propuesta.
  select * into v_proyecto
  from public.proyectos p
  where p.household_id = v_enlace.household_id and p.id = v_enlace.proyecto_id
  for update;

  if not found or v_proyecto.deleted_at is not null or v_proyecto.estado = 'perdido' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  perform 1
  from public.enlaces_publicos e
  where e.id = v_enlace.id and e.revocado_at is null and e.deleted_at is null
  for share;

  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  -- El tope de tamaño deja pasar diez días con sus dos franjas y una nota de 500 caracteres de cuatro
  -- bytes, con aire.
  if pg_column_size(p_respuesta) > 16384
    or jsonb_typeof(p_respuesta) is distinct from 'object'
    or jsonb_typeof(p_respuesta -> 'id') is distinct from 'string'
    or jsonb_typeof(p_respuesta -> 'propuesta_id') is distinct from 'string'
    or (p_respuesta ->> 'id') !~* v_uuid
    or (p_respuesta ->> 'propuesta_id') !~* v_uuid then
    raise exception '%', private.motivo_de_la_entrega('forma') using errcode = 'MN020', detail = 'forma';
  end if;

  v_id := (p_respuesta ->> 'id')::uuid;
  v_propuesta_id := (p_respuesta ->> 'propuesta_id')::uuid;

  -- El mismo envío que vuelve porque la respuesta del primero se perdió en la red: ya está guardado.
  if exists (
    select 1 from public.respuestas_de_entrega r
    where r.household_id = v_proyecto.household_id and r.id = v_id and r.propuesta_id = v_propuesta_id
  ) then
    return jsonb_build_object('estado', 'guardada');
  end if;

  -- Con la entrega ya comprometida no hay nada que contestar: la página vuelve a leer y lo muestra.
  if v_proyecto.entrega_comprometida is not null then
    return jsonb_build_object('estado', 'ya_confirmada');
  end if;

  select * into v_propuesta
  from public.propuestas_de_entrega d
  where d.household_id = v_proyecto.household_id
    and d.proyecto_id = v_proyecto.id
    and d.cerrada_at is null
    and d.deleted_at is null
  for update;

  -- Le contesta a otra cosa que la que está abierta, o a un día que ya pasó: el taller cambió lo que
  -- le pedía y la página vuelve a leer.
  if not found
    or v_propuesta.id <> v_propuesta_id
    or (v_propuesta.fecha is not null and v_propuesta.fecha < v_hoy)
    or v_proyecto.estado <> 'en_curso'
    or v_proyecto.listo_el is null then
    return jsonb_build_object('estado', 'cambio');
  end if;

  -- Todo se valida acá, del lado de la base, y antes de escribir: lo que no cumple se rechaza entero.
  v_motivo := private.validar_respuesta_de_entrega(p_respuesta, v_propuesta.forma, v_hoy);

  if v_motivo is not null then
    raise exception '%', private.motivo_de_la_entrega(v_motivo) using errcode = 'MN020', detail = v_motivo;
  end if;

  -- Puede cambiar sus días, pero no sin fin.
  select count(*)::integer into v_cuantas
  from public.respuestas_de_entrega r
  where r.household_id = v_proyecto.household_id and r.propuesta_id = v_propuesta.id;

  if v_cuantas >= 20 then
    raise exception '%', private.motivo_de_la_entrega('tope') using errcode = 'MN020', detail = 'tope';
  end if;

  -- Los días se guardan en orden y cada franja una vez, la mañana antes que la tarde; la nota, sin los
  -- blancos de las puntas.
  begin
    insert into public.respuestas_de_entrega (id, household_id, proyecto_id, propuesta_id, respuesta, dias, nota)
    values (
      v_id,
      v_proyecto.household_id,
      v_proyecto.id,
      v_propuesta.id,
      (p_respuesta ->> 'respuesta')::public.respuesta_de_entrega,
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'fecha', d ->> 'fecha',
              'franjas', (
                select jsonb_agg(f order by case f when 'manana' then 1 else 2 end)
                from jsonb_array_elements_text(d -> 'franjas') as f
              )
            )
            order by d ->> 'fecha'
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(p_respuesta -> 'dias') as d
      ),
      regexp_replace(p_respuesta ->> 'nota', '^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$', '', 'g')
    );
  exception
    -- El id ya es de otra respuesta, de otra propuesta u otro taller: no es un reenvío de esta.
    when unique_violation then
      raise exception '%', private.motivo_de_la_entrega('forma') using errcode = 'MN020', detail = 'forma';
  end;

  -- Aceptar el día propuesto lo compromete: proponerlo ya era confirmar que se puede. El update toca
  -- solo esas dos columnas, marca que lo fijó el cliente para la historia y vuelve la marca a vacío.
  -- Sube la versión del trabajo, así que un guardado del dueño que esperaba en la cola con la versión
  -- de antes rebota con MN006 y le pide abrirlo de nuevo.
  if p_respuesta ->> 'respuesta' = 'me_queda_bien' then
    perform set_config('maun.origen_de_la_fecha', 'cliente', true);
    update public.proyectos
    set entrega_comprometida = v_propuesta.fecha,
        entrega_comprometida_franja = v_propuesta.franja
    where id = v_proyecto.id;
    perform set_config('maun.origen_de_la_fecha', '', true);
  end if;

  -- Las guardas diferidas de proyectos (presupuesto_aprobado) saltan con cualquier update y no son
  -- security definer: al commit correrían como anon, que no puede leer proyectos, y cortarían con
  -- 42501. Se corren acá, todavía como dueño de la función. Después se devuelven a diferidas, que es
  -- como nacen todas las de la base: la transacción queda como estaba.
  set constraints all immediate;
  set constraints all deferred;

  return jsonb_build_object('estado', 'guardada');
end;
$function$;
-- execute: anon:EXECUTE, service_role:EXECUTE
comment on function responder_la_entrega(text,jsonb) is 'Guarda lo que contestó sobre la entrega el cliente que abrió el enlace de su trabajo, sin sesión. Es una de las cinco funciones que el rol anónimo puede ejecutar. PUEDE: insertar una respuesta a la propuesta de entrega abierta de ese trabajo; y si acepta el día propuesto (me_queda_bien), fijar la entrega comprometida con el día y la franja de la propuesta, que es lo único que actualiza. NO PUEDE: tocar otra columna ni otro trabajo; borrar nada; contestar una propuesta cerrada, de otro trabajo o de un día que ya pasó (contesta cambio); contestar con la entrega ya comprometida (contesta ya_confirmada); contestar más de 20 veces a una propuesta; devolver datos: devuelve solo {estado}. Antes de escribir valida que el enlace y el trabajo estén vivos (MN010 igual para todo lo que no sirve, como la vista) y que la respuesta tenga la forma, los días (de pasado mañana a dentro de 30 días, sin domingos, cada uno con la mañana, la tarde o las dos) y la nota (hasta 500) que corresponden (private.validar_respuesta_de_entrega); lo que no cumple se rechaza entero con MN020 y el motivo en el detail. El mismo id otra vez contesta guardada y no duplica. Bloquea el trabajo, el enlace y la propuesta en el orden de la baja de un trabajo. Aceptar el día sube la versión del trabajo, así que un guardado del dueño que esperaba en la cola rebota con MN006. Corre las guardas diferidas con set constraints all immediate antes de volver, porque al commit correrían como anon (ADR 0071).';

CREATE OR REPLACE FUNCTION public.suscripciones_para_probar(p_usuario uuid, p_endpoint text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  select private.suscripciones_para_probar(p_usuario, p_endpoint)
$function$;
-- execute: service_role:EXECUTE
comment on function suscripciones_para_probar(uuid,text) is 'Solo para la función de borde de los avisos (service_role).';

CREATE OR REPLACE FUNCTION public.titulo_compartido(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_enlace public.enlaces_publicos;
  v_p public.proyectos;
  v_taller text;
begin
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    return null;
  end if;

  select * into v_enlace
  from public.enlaces_publicos e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocado_at is null
    and e.deleted_at is null;

  if not found then
    return null;
  end if;

  select * into v_p
  from public.proyectos p
  where p.id = v_enlace.proyecto_id
    and p.deleted_at is null
    and p.estado <> 'perdido';

  if not found then
    return null;
  end if;

  select h.nombre into v_taller from public.households h where h.id = v_p.household_id;

  return jsonb_build_object('trabajo', v_p.titulo, 'taller', v_taller);
end;
$function$;
-- execute: anon:EXECUTE, authenticated:EXECUTE, service_role:EXECUTE
comment on function titulo_compartido(text) is 'Devuelve solamente el título del trabajo y el nombre del taller, y no llama a public.vista_del_cliente(). Tiene que ser así por dos motivos. El primero es qué pide quien la llama: la vista previa que arma WhatsApp cuando se pega el enlace queda guardada en el chat, así que ahí no puede ir ni un importe, ni la etapa, ni el nombre ni la dirección del cliente, que son justamente las cosas que sí devuelve la vista. El segundo es quién la llama: la pide un rastreador, no una persona, y la vista cuenta cada lectura como una visita del cliente (public.vista_compartida incrementa visitas). Si la vista previa usara esa puerta, el contador que el dueño mira en la pantalla de compartir contaría robots. Es stable a propósito: no escribe nada. Un token inválido, uno dado de baja, uno inexistente y un trabajo perdido devuelven null, los cuatro iguales (ADR 0049).';

CREATE OR REPLACE FUNCTION public.vista_compartida(p_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_enlace public.enlaces_publicos;
begin
  -- Un token que no tiene la forma de un token no llega ni a consultarse.
  if p_token is null or p_token !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  select * into v_enlace
  from public.enlaces_publicos e
  where e.token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    and e.revocado_at is null
    and e.deleted_at is null;

  -- Inexistente, revocado y de un trabajo borrado contestan exactamente lo mismo: el que tiene el
  -- link no se entera de si alguna vez existió, ni de quién es, ni de nada.
  if not found then
    raise exception 'Este link no funciona' using errcode = 'MN010';
  end if;

  update public.enlaces_publicos
  set visitas = visitas + 1, ultima_visita_at = now()
  where id = v_enlace.id;

  return public.vista_del_cliente(v_enlace.proyecto_id);
exception
  -- La vista rechaza con 42501 lo que no existe, lo que no es del household y lo que se dio por
  -- perdido. Desde afuera todo eso es la misma frase: el link no funciona.
  when insufficient_privilege then
    raise exception 'Este link no funciona' using errcode = 'MN010';
end;
$function$;
-- execute: anon:EXECUTE, authenticated:EXECUTE, service_role:EXECUTE
comment on function vista_compartida(text) is 'La puerta del link: resuelve el token contra token_hash, cuenta la visita y devuelve exactamente lo mismo que public.vista_del_cliente(). Es security definer porque quien la llama es el rol anónimo, que no puede leer ninguna de las tablas que ella toca. Un token inválido, uno dado de baja, uno de un trabajo borrado y uno de un trabajo perdido contestan los cuatro lo mismo, MN010, sin decir si el trabajo existe ni el nombre de nadie (ADR 0046). No devuelve la columna token: el cliente llega con su token en la mano y no necesita que se lo contesten (ADR 0052).';

CREATE OR REPLACE FUNCTION public.vista_del_cliente(p_proyecto_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare
  v_p public.proyectos;
  v_etapa public.estado_proyecto;
  v_aprobado boolean;
  v_propuesta public.propuestas_de_entrega;
  v_respuesta public.respuestas_de_entrega;
  v_presupuesto_mandado boolean;
  v_taller text;
  v_cliente text;
  v_ajustes public.ajustes;
  v_alias text;
  v_cbu text;
  v_link text;
  v_hay_como_transferir boolean;
  v_precio bigint;
  v_pagado bigint;
  v_sena_bp integer;
  v_instancia text;
  v_monto bigint;
  v_instancia_despues text;
  v_monto_despues bigint;
  v_formas public.forma_de_cobro[];
  v_por_transferencia boolean;
  v_siguiente jsonb;
  v_borrador public.presupuestos;
  v_revision public.revisiones_del_presupuesto;
  v_aprobada uuid;
  v_contenido jsonb;
  v_elegidas jsonb;
  v_presupuesto jsonb;
begin
  select * into v_p from public.proyectos p where p.id = p_proyecto_id and p.deleted_at is null;

  -- Lo mismo que si no existiera. Con la RLS puesta, un trabajo de otro household no se ve, y esta
  -- respuesta no distingue «no existe» de «no es tuyo».
  if not found then
    raise exception 'El trabajo no existe o no es tuyo' using errcode = '42501';
  end if;

  -- Un trabajo dado por perdido no tiene nada que contarle al cliente, y decirle que se perdió
  -- sería contarle una decisión del taller. El link se comporta como si no sirviera.
  if v_p.estado = 'perdido' then
    raise exception 'El trabajo no existe o no es tuyo' using errcode = '42501';
  end if;

  -- El «por ahora no» es una nota del taller para acordarse de volver a escribirle, no una etapa del
  -- trabajo del cliente: el cliente sigue viendo la etapa en la que estaba, la misma que va a ver si
  -- vuelve. La saca del contacto pendiente, que la guarda al entrar.
  v_etapa := v_p.estado;
  if v_p.estado = 'en_seguimiento' then
    select c.etapa_previa into v_etapa
    from public.proximos_contactos c
    where c.household_id = v_p.household_id
      and c.proyecto_id = v_p.id
      and c.hecho_el is null
      and c.deleted_at is null;
    v_etapa := coalesce(v_etapa, 'presupuesto_enviado');
  end if;

  -- Cada dato tiene una etapa a partir de la cual es cierto. Un campo cargado antes de esa etapa (el
  -- sistema viejo le copió el inicio y la entrega a todo trabajo, aprobado o no) no es un hecho ni un
  -- acuerdo, y no sale de la base.
  v_aprobado := v_etapa in ('en_curso', 'entregado', 'cobrado');
  v_presupuesto_mandado := v_aprobado or v_etapa = 'presupuesto_enviado';

  select h.nombre into v_taller from public.households h where h.id = v_p.household_id;
  select c.nombre into v_cliente from public.clientes c where c.id = v_p.cliente_id;
  select * into v_ajustes from public.ajustes a where a.household_id = v_p.household_id;

  v_alias := nullif(v_ajustes.cobro_alias, '');
  v_cbu := nullif(v_ajustes.cobro_cbu, '');
  v_link := nullif(v_ajustes.cobro_link, '');
  v_hay_como_transferir := v_alias is not null or v_cbu is not null or v_link is not null;

  -- El presupuesto existe para el cliente desde que se le manda. Antes, lo que haya en
  -- presupuesto_centavos es un borrador, o el número de un estimativo, y no viaja.
  v_precio := case when v_presupuesto_mandado then v_p.presupuesto_centavos end;
  v_sena_bp := coalesce(v_p.sena_bp, v_ajustes.sena_bp, 5000);

  select coalesce(sum(g.monto_centavos), 0) into v_pagado
  from public.pagos g
  where g.household_id = v_p.household_id
    and g.proyecto_id = v_p.id
    and g.deleted_at is null;

  select r.instancia, r.monto_centavos into v_instancia, v_monto
  from private.pagos_por_delante(v_precio, v_pagado, v_sena_bp) as r
  where r.orden = 1;

  select r.instancia, r.monto_centavos into v_instancia_despues, v_monto_despues
  from private.pagos_por_delante(v_precio, v_pagado, v_sena_bp) as r
  where r.orden = 2;

  -- Antes de aprobar lo único que se le puede pedir es la seña: el saldo existe desde que aprueba. Si
  -- lo que ya pagó la cubre, para aprobar no le falta pagar nada.
  if not v_aprobado and v_instancia = 'saldo' then
    v_instancia := null;
    v_monto := null;
    v_instancia_despues := null;
    v_monto_despues := null;
  end if;

  -- Con todo pagado no hay ninguna instancia, así que tampoco hay formas ni datos de la cuenta.
  if v_instancia is null then
    v_formas := array[]::public.forma_de_cobro[];
  elsif v_instancia = 'sena' then
    v_formas := private.formas_de_cobro(v_p.cobro_sena, v_hay_como_transferir);
  else
    v_formas := private.formas_de_cobro(v_p.cobro_saldo, v_hay_como_transferir);
  end if;

  v_por_transferencia := 'transferencia' = any (v_formas);

  if v_instancia_despues is null then
    v_siguiente := null;
  else
    v_siguiente := jsonb_build_object(
      'instancia', v_instancia_despues,
      'formas', to_jsonb(
        case
          when v_instancia_despues = 'sena'
            then private.formas_de_cobro(v_p.cobro_sena, v_hay_como_transferir)
          else private.formas_de_cobro(v_p.cobro_saldo, v_hay_como_transferir)
        end
      ),
      'monto_centavos', v_monto_despues
    );
  end if;

  -- Lo que hay para coordinar la entrega: solo con el trabajo en curso, el mueble listo y sin entrega
  -- comprometida, la propuesta abierta si sigue vigente (un día propuesto que ya pasó no se le
  -- muestra), y lo último que el cliente le contestó.
  if v_etapa = 'en_curso' and v_p.listo_el is not null and v_p.entrega_comprometida is null then
    select * into v_propuesta
    from public.propuestas_de_entrega d
    where d.household_id = v_p.household_id
      and d.proyecto_id = v_p.id
      and d.cerrada_at is null
      and d.deleted_at is null
      and (d.fecha is null or d.fecha >= private.hoy_en_el_taller());

    if v_propuesta.id is not null then
      select * into v_respuesta
      from public.respuestas_de_entrega r
      where r.household_id = v_p.household_id
        and r.proyecto_id = v_p.id
        and r.propuesta_id = v_propuesta.id
        and r.deleted_at is null
      order by r.created_at desc, r.id desc
      limit 1;
    end if;
  end if;

  -- El presupuesto que se le mandó desde la app (ADR 0080): la última revisión, desde que se le manda.
  -- Desde el link esta función corre sin RLS, así que el borrador y sus revisiones se filtran por el
  -- taller del trabajo.
  if v_presupuesto_mandado then
    select b.* into v_borrador
    from public.presupuestos b
    where b.household_id = v_p.household_id
      and b.proyecto_id = v_p.id
      and b.deleted_at is null;

    if v_borrador.id is not null then
      select r.* into v_revision
      from public.revisiones_del_presupuesto r
      where r.household_id = v_p.household_id
        and r.presupuesto_id = v_borrador.id
        and r.deleted_at is null
      order by r.revision desc
      limit 1;
    end if;
  end if;

  if v_revision.id is null then
    v_presupuesto := null;
  elsif not v_aprobado then
    -- Esperando la seña: la revisión tal cual, con todas sus opciones y lo que cambió.
    v_presupuesto := jsonb_build_object(
      'numero', v_revision.numero,
      'revision', v_revision.revision,
      'mandado_el', v_revision.mandado_el,
      'que_cambio', v_revision.que_cambio,
      'contenido', v_revision.contenido
    );
  else
    -- Aprobado: solo la opción que eligió, con su letra. Si ya no hay ninguna opción aprobada (se cargó
    -- el presupuesto a mano), el documento viaja sin valores y la página muestra lo acordado.
    select o.id into v_aprobada
    from public.opciones_de_presupuesto o
    where o.household_id = v_p.household_id
      and o.proyecto_id = v_p.id
      and o.aprobada
      and o.deleted_at is null;

    v_contenido := v_revision.contenido;
    if v_contenido #>> '{valores,tipo}' = 'opciones' then
      select coalesce(jsonb_agg(e.valor order by e.orden), '[]'::jsonb) into v_elegidas
      from jsonb_array_elements(v_contenido #> '{valores,opciones}') with ordinality as e (valor, orden)
      where e.valor ->> 'id' = v_aprobada::text;

      v_contenido := jsonb_set(
        v_contenido,
        '{valores}',
        case
          when jsonb_array_length(v_elegidas) = 0 then 'null'::jsonb
          else jsonb_build_object('tipo', 'opciones', 'opciones', v_elegidas)
        end
      );
    end if;

    v_presupuesto := jsonb_build_object(
      'numero', v_revision.numero,
      'revision', v_revision.revision,
      'mandado_el', v_revision.mandado_el,
      'contenido', v_contenido,
      'aceptado_el', v_borrador.aceptado_el,
      'letra', v_elegidas -> 0 ->> 'letra'
    );
  end if;

  -- Los campos van enumerados uno por uno, a propósito. Si esto fuera to_jsonb(v_p) con la pantalla
  -- filtrando, el día que alguien le agregue una columna a proyectos esa columna quedaría expuesta
  -- sin que nadie lo decida: lo que el cliente ve se decide acá, no en el navegador. La suite lo
  -- controla con supabase/tests/25_vista_del_cliente.sql, que falla apenas aparece una columna
  -- nueva en proyectos o en ajustes hasta que alguien la clasifica como pública o privada.
  return jsonb_build_object(
    'taller', jsonb_build_object('nombre', v_taller),
    'cliente', jsonb_build_object('nombre', v_cliente),
    'trabajo', v_p.titulo,
    -- La dirección de la casa del cliente, desde que aprueba. Antes viaja vacía y no en null: el
    -- lector de una versión vieja de la app la exige como texto.
    'direccion', case when v_aprobado then v_p.direccion_entrega else '' end,
    'estado', v_etapa,
    'precio_centavos', v_precio,
    -- La seña en pesos: la que se le pide para arrancar mientras espera, y la acordada desde que
    -- aprueba. Sale de la misma función que el importe de «pago», así que las dos no pueden dar
    -- distinto. El porcentaje sigue sin viajar.
    'sena_centavos', private.sena_esperada(v_precio, v_sena_bp),
    -- El pago que toca ahora y, si hay otro después, cuánto es y cómo se paga. Los importes salen
    -- de lo que ya está guardado; el porcentaje de seña sigue sin viajar, que es lo que dejó
    -- abierto el ADR 0048.
    'pago', jsonb_build_object(
      'instancia', v_instancia,
      'formas', to_jsonb(v_formas),
      'monto_centavos', v_monto,
      'siguiente', v_siguiente
    ),
    -- Cómo pagarle al taller, y solo si el pago que toca se puede pagar así: los cuatro datos de
    -- la cuenta para transferir y el link de Mercado Pago para pagar desde la misma página. De
    -- ajustes no viaja nada más: ni el sueldo, ni los costos fijos, ni la meta de Cocos, ni la seña.
    -- Las redes van en la vidriera y el valor del relevamiento, al final.
    'cobro', jsonb_build_object(
      'alias', case when v_por_transferencia then v_alias end,
      'cbu', case when v_por_transferencia then v_cbu end,
      'titular', case when v_por_transferencia then nullif(v_ajustes.cobro_titular, '') end,
      'cuit', case when v_por_transferencia then nullif(v_ajustes.cobro_cuit, '') end,
      'link', case when v_por_transferencia then v_link end
    ),
    'fechas', jsonb_build_object(
      'estimativo', (
        select min(c.ocurrio_el)
        from public.cambios_de_estado c
        where c.household_id = v_p.household_id
          and c.proyecto_id = v_p.id
          and c.hacia = 'presupuesto_estimativo'
      ),
      'presupuesto', (
        select min(c.ocurrio_el)
        from public.cambios_de_estado c
        where c.household_id = v_p.household_id
          and c.proyecto_id = v_p.id
          and c.hacia = 'presupuesto_enviado'
      ),
      -- La aprobación sale de su registro, no de un pago, y solo mientras el trabajo está aprobado:
      -- uno que volvió a presupuesto no se muestra aprobado.
      'aprobado', case when v_aprobado then (
        select min(c.ocurrio_el)
        from public.cambios_de_estado c
        where c.household_id = v_p.household_id
          and c.proyecto_id = v_p.id
          and c.hacia = 'en_curso'
      ) end,
      'inicio', case when v_aprobado then v_p.fecha_inicio end,
      -- La entrega estimada, desde que aprueba. La clave no se renombró: la app la lee como
      -- estimada, y no la muestra si ya pasó (ADR 0071).
      'entrega_pautada', case when v_aprobado then v_p.entrega_estimada end,
      -- El día en que se terminó de fabricar, desde que está listo.
      'listo', case when v_aprobado then v_p.listo_el end,
      'entregado', case when v_etapa in ('entregado', 'cobrado') then v_p.fecha_entrega end,
      'cobro', case when v_p.estado = 'cobrado' then v_p.fecha_cobro end,
      -- Hasta cuándo vale el presupuesto, solo mientras está mandado y sin aprobar.
      'vale_hasta', case when v_etapa = 'presupuesto_enviado' then v_p.presupuesto_vale_hasta end
    ),
    -- La visita para medir: el día acordado o en que se fue, y si ya se fue. La hora no viaja.
    'visita', jsonb_build_object(
      'dia', v_p.fecha_visita,
      'hecha', v_p.visita_hecha
    ),
    -- La entrega que se coordina con el cliente (ADR 0071). La comprometida viaja mientras el trabajo
    -- está en curso; entregado, lo que cuenta es el día en que se entregó. La propuesta y la respuesta,
    -- solo mientras hay algo que contestar. De la propuesta viaja su id, que es con lo que el cliente
    -- contesta; de la respuesta, lo que él mismo mandó.
    'entrega', jsonb_build_object(
      'comprometida', case
        when v_etapa = 'en_curso' and v_p.entrega_comprometida is not null then jsonb_build_object(
          'fecha', v_p.entrega_comprometida,
          'franja', v_p.entrega_comprometida_franja
        )
      end,
      'propuesta', case
        when v_propuesta.id is not null then jsonb_build_object(
          'id', v_propuesta.id,
          'forma', v_propuesta.forma,
          'fecha', v_propuesta.fecha,
          'franja', v_propuesta.franja
        )
      end,
      'respuesta', case
        when v_respuesta.id is not null then jsonb_build_object(
          'respuesta', v_respuesta.respuesta,
          'dias', v_respuesta.dias,
          'nota', v_respuesta.nota
        )
      end
    ),
    'pagos', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', g.id,
            'fecha', g.fecha,
            'concepto', g.concepto,
            'monto_centavos', g.monto_centavos
          )
          order by g.fecha, g.id
        ),
        '[]'::jsonb
      )
      from public.pagos g
      where g.household_id = v_p.household_id
        and g.proyecto_id = v_p.id
        and g.deleted_at is null
    ),
    'archivos', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', a.id,
            'nombre', a.nombre,
            'tipo', a.tipo,
            'ancho', a.ancho,
            'alto', a.alto,
            'fecha', a.created_at,
            -- La ruta en el bucket, que es pública y se sirve por el CDN. Sale del id, como en la
            -- app: private.ruta_del_archivo() es el único lugar donde se arma.
            'ruta', private.ruta_del_archivo(a.household_id, a.proyecto_id, a.id, a.tipo, false),
            'ruta_mini', private.ruta_del_archivo(a.household_id, a.proyecto_id, a.id, a.tipo, true)
          )
          order by a.created_at desc, a.id desc
        ),
        '[]'::jsonb
      )
      from public.archivos a
      where a.household_id = v_p.household_id
        and a.proyecto_id = v_p.id
        and a.deleted_at is null
        and a.visible_para_cliente
    ),
    -- La vidriera del taller (ADR 0076), en todas las etapas: las redes y hasta doce fotos, en su
    -- orden. Las fotos se filtran por el taller del trabajo a mano: desde el link esta función corre
    -- con los permisos del dueño de las tablas, que no pasa por la RLS, y sin ese filtro traería las
    -- de todos los talleres. La ruta es la de la carpeta de la vidriera: el id de la foto de la que se
    -- copió, y el de su trabajo, no viajan.
    'vidriera', jsonb_build_object(
      'redes', jsonb_build_object(
        'instagram', nullif(v_ajustes.instagram_link, ''),
        'facebook', nullif(v_ajustes.facebook_link, ''),
        'tiktok', nullif(v_ajustes.tiktok_link, '')
      ),
      'fotos', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', f.id,
              'ruta', private.ruta_de_la_vidriera(f.household_id, f.id, f.tipo, false),
              'ruta_mini', private.ruta_de_la_vidriera(f.household_id, f.id, f.tipo, true),
              'ancho', f.ancho,
              'alto', f.alto
            )
            order by f.orden, f.created_at, f.id
          ),
          '[]'::jsonb
        )
        from (
          select v.id, v.household_id, v.tipo, v.ancho, v.alto, v.orden, v.created_at
          from public.fotos_de_la_vidriera v
          where v.household_id = v_p.household_id
            and v.deleted_at is null
          order by v.orden, v.created_at, v.id
          limit 12
        ) as f
      )
    ),
    -- Cuánto cobra el taller el relevamiento técnico, la visita para medir (ADR 0079): solo antes de
    -- mandar el presupuesto, que es cuando la página explica qué es y cuánto vale. En null después, o
    -- si el dueño lo dejó vacío. Es un dato de ajustes y no un pago: lo que el cliente paga por la
    -- visita es un pago del trabajo, y queda a cuenta de la seña.
    'relevamiento_centavos', case when not v_presupuesto_mandado then v_ajustes.relevamiento_centavos end,
    -- El presupuesto que se le mandó desde la app, en la forma de su etapa (ver arriba), o null.
    'presupuesto', v_presupuesto
  );
end;
$function$;
-- execute: authenticated:EXECUTE, service_role:EXECUTE
comment on function vista_del_cliente(uuid) is 'Lo único que un cliente puede ver de su trabajo, y cada dato recién desde la etapa en la que es cierto (ADR 0067): el presupuesto desde que se le manda; la dirección de entrega, el día de inicio, la entrega estimada (la clave entrega_pautada, que no se renombró) y el día de la aprobación desde que aprueba; el día en que el mueble quedó listo desde que lo está; el día de la entrega desde que se entrega. Antes de esas etapas no viajan, aunque estén cargados: un campo cargado no es un hecho. Devuelve cuánto vale, cuánto pagó, en qué anda, la seña en pesos, qué pago le toca ahora, cuánto es, cómo puede pagarlo y cuál viene después (antes de aprobar solo se le pide la seña), hasta cuándo vale el presupuesto mientras espera la seña, los archivos que el dueño marcó, el día que se le mandó el estimativo y el día de la visita para medir con si ya se fue. La clave entrega trae la entrega comprometida mientras el trabajo está en curso, y la propuesta de entrega vigente con lo último que contestó el cliente solo con el trabajo en curso, listo y sin comprometida (ADR 0071). La clave vidriera trae, en todas las etapas, las redes del taller y hasta 12 fotos de su vidriera con la ruta de cada una, solo del taller del trabajo (ADR 0076). La clave presupuesto trae el presupuesto que se le mandó desde la app (ADR 0080): null antes de mandarlo o si nunca se mandó desde la app; esperando la seña, la última revisión tal cual (numero, revision, mandado_el, que_cambio y contenido, con las opciones y la obra adentro); desde que aprueba, la última revisión sin que_cambio, con las opciones del contenido filtradas a la aprobada, más aceptado_el y la letra de esa opción: las que no eligió no viajan. Los datos del taller para el presupuesto viajan solo adentro del contenido de cada revisión. Enumera los campos uno por uno y nunca devuelve la fila entera: convertirla en un select * expondría cada columna nueva de proyectos sin que nadie lo decida, costos estimados, margen y tipo de proyecto incluidos. Un trabajo en seguimiento se muestra en la etapa en la que estaba: el «por ahora no» y su próximo contacto son del taller y no viajan (ADR 0064). Del estimativo viaja el día, nunca un importe. De la visita viajan el día y la marca, no la hora. De ajustes viajan exactamente los cinco campos de cobro —los cuatro de la cuenta y el link de Mercado Pago—, y solo cuando el pago que toca AHORA se ofrece por transferencia: lo que no se muestra, no se manda; los tres links de las redes, siempre; y el valor del relevamiento técnico (relevamiento_centavos) solo antes de mandar el presupuesto, en null después o si el dueño lo dejó vacío (ADR 0079). El porcentaje de seña y los días que vale un presupuesto no viajan nunca; lo que viaja son el importe y la fecha que salen de ellos. Es security invoker: desde la app la llama el dueño y la RLS decide; desde el link la llama public.vista_compartida(), que ya resolvió el token (ADR 0046, 0048, 0053, 0054, 0058, 0067, 0071, 0076, 0079 y 0080).';
