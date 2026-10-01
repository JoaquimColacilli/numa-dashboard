import { describe, expect, it } from 'vitest';

import { traducirRechazo, type ContextoDelRechazo } from './rechazos';

function deLaBase(codigo: string, mensaje = 'mensaje de la base', hint = ''): unknown {
  return { code: codigo, message: mensaje, hint, details: 'un detail que nadie muestra' };
}

function texto(codigo: string, contexto: ContextoDelRechazo): string {
  const traducido = traducirRechazo(deLaBase(codigo), contexto);
  if (!traducido) throw new Error(`${codigo} no se tradujo`);
  return `${traducido.titulo} ${traducido.queHacer}`;
}

describe('los MN00x traducidos a castellano de taller', () => {
  it('MN001 al cobrar: ya estaba cobrado', () => {
    expect(texto('MN001', { operacion: 'cobro', sujeto: 'Placard', estado: 'cobrado' })).toBe(
      '«Placard» ya estaba cobrado. Puede que lo hayas cerrado desde el celular o desde la PC. ' +
        'Fijate cómo quedó el reparto: si no es el que esperabas, reabrilo.',
    );
  });

  it('MN001 al guardar un gasto contra un perdido: el camino de salida', () => {
    expect(texto('MN001', { operacion: 'proyecto', sujeto: 'Mesada', estado: 'perdido' })).toBe(
      '«Mesada» está cerrado como perdido y sus números quedaron cerrados. Reactivá el presupuesto, ' +
        'cargá lo que falte y volvé a cerrarlo: el reparto de la seña se hace de nuevo.',
    );
  });

  it('MN001 al guardar un gasto contra un cobrado', () => {
    expect(texto('MN001', { operacion: 'proyecto', sujeto: 'Mesada', estado: 'cobrado' })).toBe(
      '«Mesada» está cobrado y sus números quedaron cerrados. Reabrí el cobro, corregí lo que haga ' +
        'falta y volvé a cobrarlo: el reparto se hace de nuevo con los números corregidos.',
    );
  });

  it('MN001 al borrar un liquidado con plata adentro', () => {
    expect(
      texto('MN001', { operacion: 'baja-de-proyecto', sujeto: 'Placard', estado: 'cobrado' }),
    ).toBe(
      '«Placard» tiene pagos o gastos y está cobrado: no se puede borrar. Borrar esta plata la ' +
        'sacaría del libro. Si el reparto está mal, corregilo reabriéndolo.',
    );
  });

  it('MN002: el proyecto está borrado', () => {
    expect(texto('MN002', { operacion: 'cobro', sujeto: 'Placard' })).toBe(
      '«Placard» está borrado. Puede que lo hayas borrado desde otro dispositivo. Si lo necesitás, ' +
        'cargalo de nuevo.',
    );
  });

  it('MN003: el cliente tiene trabajos', () => {
    expect(texto('MN003', { operacion: 'baja-de-cliente', sujeto: 'Marcela Sosa' })).toBe(
      '«Marcela Sosa» tiene trabajos cargados. Borrá esos trabajos, o pasalos a otro cliente, y ' +
        'después borrá el cliente.',
    );
  });

  it('MN004: la base no aceptó el cambio', () => {
    expect(texto('MN004', { operacion: 'guardado' })).toBe(
      'La base no aceptó ese cambio. Es algo que no tendría que pasar. Volvé a cargarlo, y si sigue ' +
        'igual avisá.',
    );
  });

  it('MN022: la vidriera ya tiene sus doce fotos', () => {
    expect(texto('MN022', { operacion: 'guardado' })).toBe(
      'Tu vidriera ya tiene 12 fotos. No se sumó la foto. Pasa si sumaste fotos desde otro aparato ' +
        'al mismo tiempo. Sacá una de tu vidriera en Ajustes y volvé a sumarla.',
    );
  });

  it('MN005: el cliente del trabajo está borrado', () => {
    expect(texto('MN005', { operacion: 'proyecto', sujeto: 'Placard' })).toBe(
      'El cliente de este trabajo está borrado. Elegí otro cliente para el trabajo, o volvé a ' +
        'cargar el cliente que borraste.',
    );
  });

  it('MN006 al cobrar: los números cambiaron, o cambió la fila', () => {
    expect(texto('MN006', { operacion: 'cobro', sujeto: 'Placard' })).toBe(
      'Los números cambiaron desde que viste el reparto. Se cargó un pago o un gasto, cambiaron ' +
        'el sueldo o los costos fijos, o cambió la fila. Abrí el cobro otra vez: el reparto se ' +
        'calcula de nuevo con lo que hay ahora, y lo revisás antes de confirmar.',
    );
  });

  it('MN006 al guardar la fila: cambió mientras la editabas', () => {
    expect(texto('MN006', { operacion: 'fila' })).toBe(
      'La fila cambió mientras la editabas. Se guardó en otro dispositivo o cambiaron los Ajustes. ' +
        'Mirá cómo quedó y volvé a hacer tus cambios.',
    );
  });

  it('MN023: la fila no se pudo guardar, sin mostrar el código del problema', () => {
    expect(texto('MN023', { operacion: 'fila' })).toBe(
      'La fila no se pudo guardar. Revisala y probá de nuevo.',
    );
  });

  it('MN024: no se pudo archivar el tesoro, con su nombre si lo hay', () => {
    const queHacer =
      'Sacalo de la fila, cobrá el trabajo reabierto que lo usa y pasá su plata a otro tesoro. ' +
      'Después archivalo.';
    expect(texto('MN024', { operacion: 'tesoro', sujeto: 'Herramientas' })).toBe(
      `No se pudo archivar Herramientas. ${queHacer}`,
    );
    expect(texto('MN024', { operacion: 'tesoro' })).toBe(
      `No se pudo archivar el tesoro. ${queHacer}`,
    );
  });

  it('MN025: un cobro que quedó de antes de actualizar la app', () => {
    expect(texto('MN025', { operacion: 'cobro', sujeto: 'Placard' })).toBe(
      'Este cobro quedó de antes de actualizar la app. Abrí el cobro otra vez: el reparto se ' +
        'calcula con tu fila y lo revisás antes de confirmar.',
    );
  });

  it('MN006 al guardar: cambió desde que lo abriste', () => {
    expect(texto('MN006', { operacion: 'proyecto', sujeto: 'Placard' })).toBe(
      '«Placard» cambió desde que lo abriste. Se guardó algo desde otro lado. Abrilo de nuevo para ' +
        'ver lo que hay ahora y volvé a cargar lo que te falte.',
    );
  });

  it('MN007 al cobrar algo que no está entregado', () => {
    expect(texto('MN007', { operacion: 'cobro', sujeto: 'Placard' })).toBe(
      '«Placard» todavía no está entregado. Se cobra lo que ya entregaste. Marcalo como entregado y ' +
        'después cobralo.',
    );
  });

  it('MN007 al dar por perdido algo entregado', () => {
    expect(texto('MN007', { operacion: 'cierre', sujeto: 'Placard' })).toBe(
      '«Placard» ya está entregado: no se da por perdido. Un mueble entregado se cobra, aunque el ' +
        'cliente tarde. Cobralo desde la ficha.',
    );
  });

  it('MN007 al cambiar el estado desde el formulario', () => {
    expect(texto('MN007', { operacion: 'proyecto', sujeto: 'Placard' })).toBe(
      'Ese cambio de estado no se puede hacer desde el formulario. Cobrar y dar por perdido son ' +
        'botones propios de la ficha, porque reparten plata. Volvé a la ficha y usá el botón.',
    );
  });

  it('MN008 al cobrar: la app quedó vieja, y el texto sirve tanto para el corte como para los topes', () => {
    expect(texto('MN008', { operacion: 'cobro', sujeto: 'Placard' })).toBe(
      'Esta app quedó vieja y no saca la misma cuenta que el servidor. No se guardó nada: el ' +
        'trabajo quedó como estaba. Puede ser el corte de la ganancia, o lo que el mes ya lleva ' +
        'cubierto. Cerrá la app, volvé a abrirla para que se actualice, y hacelo de nuevo.',
    );
  });

  it('MN016: falta la fecha, en el cobro y en un pago', () => {
    expect(texto('MN016', { operacion: 'cobro', sujeto: 'Placard' })).toBe(
      'Falta el día del cobro. No se guardó nada. Poné el día en que entró la plata y volvé a guardarlo: la fecha no se inventa.',
    );
    expect(texto('MN016', { operacion: 'proyecto', sujeto: 'Placard' })).toBe(
      'A un pago le falta el día. No se guardó nada. Poné el día en que entró la plata y volvé a guardarlo: la fecha no se inventa.',
    );
  });

  it('MN017: una fecha que todavía no llegó', () => {
    expect(texto('MN017', { operacion: 'cierre' })).toBe(
      'Esa fecha todavía no llegó. No se guardó nada. Poné el día en que entró la plata, que tiene que ser hoy o antes, y volvé a guardarlo.',
    );
  });

  it('MN018: la plata no es de antes de la apertura', () => {
    expect(texto('MN018', { operacion: 'proyecto' })).toBe(
      'Esa plata no es de antes de que empezaras con la app. Solo lo que entró antes de la apertura puede estar en tus saldos de arranque. Destildá esa opción, o revisá la fecha, y volvé a guardarlo.',
    );
  });

  it('MN019: el seguimiento quedó a medias', () => {
    expect(texto('MN019', { operacion: 'proyecto', sujeto: 'Placard' })).toBe(
      'El seguimiento de este trabajo quedó a medias. No se guardó nada. Pasa si lo cambiaste desde otro lado al mismo tiempo. Abrilo de nuevo: si está en seguimiento, registrá el contacto desde ahí; si no, ponelo en seguimiento con su fecha.',
    );
  });

  it('MN021: la propuesta de la entrega, con el mensaje y la salida que escribe la base', () => {
    const traducido = traducirRechazo(
      deLaBase(
        'MN021',
        'La entrega se coordina con el mueble listo',
        'Marcá en la ficha que ya está listo y proponele el día.',
      ),
    );
    expect(traducido).toEqual({
      titulo: 'La entrega se coordina con el mueble listo.',
      queHacer: 'Marcá en la ficha que ya está listo y proponele el día. No se guardó nada.',
      codigo: 'MN021',
    });
  });

  it('42501: la cuenta no tiene acceso', () => {
    expect(texto('42501', { operacion: 'cobro', sujeto: 'Placard' })).toBe(
      'Tu cuenta no tiene acceso a esto. Puede que el trabajo sea de otro taller, o que tu cuenta ' +
        'haya quedado sin taller. Cerrá sesión y volvé a entrar.',
    );
  });

  it('sin sujeto, habla del trabajo en general', () => {
    expect(texto('MN002', { operacion: 'cobro' })).toBe(
      'Este trabajo está borrado. Puede que lo hayas borrado desde otro dispositivo. Si lo ' +
        'necesitás, cargalo de nuevo.',
    );
  });

  it('un código sin traducción muestra lo que dice la base, con el código a mano', () => {
    const traducido = traducirRechazo(deLaBase('23514', 'viola un check', 'revisá el monto'));
    expect(traducido).toEqual({
      titulo: 'viola un check',
      queHacer: 'revisá el monto',
      codigo: '23514',
    });
  });

  it('lo que no es un rechazo de la base no se traduce', () => {
    expect(traducirRechazo(new TypeError('Failed to fetch'))).toBeUndefined();
  });
});

describe('los rechazos del presupuesto', () => {
  it('MN026: el borrador cambió en otro aparato', () => {
    expect(texto('MN026', { operacion: 'presupuesto' })).toBe(
      'Este presupuesto se cambió en otro aparato. Abrilo de nuevo para ver la última versión y seguí desde ahí.',
    );
  });

  it('MN027: le falta algo para mandarlo', () => {
    expect(texto('MN027', { operacion: 'presupuesto' })).toBe(
      'Al presupuesto le falta algo para mandarlo. Revisá que tenga título, por lo menos un mueble con su detalle y un total.',
    );
  });

  it('MN028: ya lo aprobó', () => {
    expect(texto('MN028', { operacion: 'presupuesto' })).toBe(
      'Ya lo aprobó: el presupuesto no se cambia. Un cambio después de la seña se arregla aparte con tu cliente.',
    );
  });

  it('MN029: cambiaron los importes', () => {
    expect(texto('MN029', { operacion: 'presupuesto' })).toBe(
      'Cambiaron los importes desde que lo armaste. Revisá los valores y volvé a mandarlo.',
    );
  });

  it('MN030: los textos cambiaron en otro aparato', () => {
    expect(texto('MN030', { operacion: 'plantilla' })).toBe(
      'Los textos del presupuesto se cambiaron en otro aparato. Abrí la pantalla de nuevo y volvé a guardar.',
    );
  });

  it('MN031: lo que no tiene la forma, sin mostrar el código del problema', () => {
    expect(texto('MN031', { operacion: 'presupuesto' })).toBe(
      'El presupuesto no se pudo guardar. Revisalo y probá de nuevo. Si vuelve a pasar, cerrá la app y abrila otra vez para que se actualice.',
    );
    expect(texto('MN031', { operacion: 'plantilla' })).toBe(
      'Tus textos del presupuesto no se pudieron guardar. Revisalo y probá de nuevo. Si vuelve a pasar, cerrá la app y abrila otra vez para que se actualice.',
    );
  });

  it('MN032: el trabajo está perdido', () => {
    expect(texto('MN032', { operacion: 'presupuesto' })).toBe(
      'Este trabajo está perdido: su presupuesto no se cambia ni se manda. Si el cliente volvió, reactivalo desde la ficha y seguí desde ahí.',
    );
  });

  it('MN033: el día del envío no llegó', () => {
    expect(texto('MN033', { operacion: 'presupuesto' })).toBe(
      'El día del envío todavía no llegó. Revisá la fecha y la hora de tu aparato, y volvé a mandarlo.',
    );
  });
});
