-- Los datos del taller para el presupuesto (ADR 0080): quién presupuesta, como pide la ley (art. 21 de
-- la Ley 24.240 y RG 1415 de ARCA). Hoy el taller guarda solo su nombre (households.nombre); el
-- presupuesto lleva además el titular del CUIT, el CUIT, la condición fiscal, el domicilio y el
-- contacto.
--
-- Aditiva: seis columnas nuevas de ajustes, cada una con su default (vacío, o null en la condición
-- fiscal), su check, su comentario y el grant de update de esa sola columna, como las demás de ajustes.
-- El alter no reescribe ninguna fila y ninguna fila existente cambia. No viajan a la vista del cliente:
-- llegan solo adentro de la foto de cada revisión que se le manda.

alter table public.ajustes
  add column taller_titular text not null default '',
  add column taller_cuit text not null default '',
  add column taller_condicion_fiscal text,
  add column taller_domicilio text not null default '',
  add column taller_telefono text not null default '',
  add column taller_email text not null default '',
  add constraint ajustes_taller_titular_largo check (char_length(taller_titular) <= 120),
  add constraint ajustes_taller_cuit_formato
    check (taller_cuit = '' or taller_cuit ~ '^[0-9]{2}-[0-9]{8}-[0-9]$'),
  add constraint ajustes_taller_condicion_fiscal_valida check (
    taller_condicion_fiscal is null
    or taller_condicion_fiscal in ('monotributo', 'responsable_inscripto', 'exento')
  ),
  add constraint ajustes_taller_domicilio_largo check (char_length(taller_domicilio) <= 300),
  add constraint ajustes_taller_telefono_largo check (char_length(taller_telefono) <= 40),
  add constraint ajustes_taller_email_largo check (char_length(taller_email) <= 200);

comment on column public.ajustes.taller_titular is
  'El nombre o la razón social a nombre de quien está el CUIT del taller, o vacío. Va en el encabezado del presupuesto (ADR 0080).';
comment on column public.ajustes.taller_cuit is
  'El CUIT del taller con guiones (NN-NNNNNNNN-N), o vacío. Mismo formato que cobro_cuit; el dígito verificador lo revisa la app. Va en el encabezado del presupuesto (ADR 0080).';
comment on column public.ajustes.taller_condicion_fiscal is
  'La condición del taller frente al IVA: monotributo, responsable_inscripto o exento, o null si el dueño no la cargó. El presupuesto la muestra como «Responsable Monotributo», «IVA Responsable Inscripto» o «IVA Exento» (ADR 0080).';
comment on column public.ajustes.taller_domicilio is
  'El domicilio del taller, o vacío. Va en el encabezado del presupuesto (ADR 0080).';
comment on column public.ajustes.taller_telefono is
  'El teléfono del taller, o vacío. Va en el presupuesto, y con él la página del cliente ofrece «Escribirle al taller» por WhatsApp (ADR 0080).';
comment on column public.ajustes.taller_email is
  'El email del taller, o vacío. Va en el encabezado del presupuesto (ADR 0080).';

grant update (
  taller_titular, taller_cuit, taller_condicion_fiscal, taller_domicilio, taller_telefono, taller_email
) on table public.ajustes to authenticated;
