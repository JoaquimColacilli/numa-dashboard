import type { Envoltorio } from '@/shared/lib';

export const ajustarCocos = {
  conceptoQueSuma: 'Ajuste de Cocos (intereses o depósito)',
  conceptoQueResta: 'Ajuste de Cocos (retiro o corrección)',
  faltaElSaldo: 'Escribí el saldo que tenés de verdad, por ejemplo 1.250.000.',
  sinDiferencia: 'El saldo que escribiste es el que la app ya tiene: no hace falta ajustar nada.',
  anotado: (ajuste: string, saldo: string) =>
    `Se anotó un ajuste de ${ajuste}. Cocos queda en ${saldo}.`,
  explicacion: (Negrita: Envoltorio) => (
    <>
      Cocos es el único saldo que se corrige a mano: sube solo por los intereses y baja cuando
      retirás. Escribí el saldo que ves en la cuenta y la app anota la diferencia.{' '}
      <Negrita>La resta no la hacés vos.</Negrita>
    </>
  ),
  calculado: 'Lo que la app tiene calculado',
  saldoReal: 'El saldo que tenés de verdad',
  vaAAnotar: (Negrita: Envoltorio, ajuste: string, concepto: string) => (
    <>
      Se va a anotar un asiento de <Negrita>{ajuste}</Negrita> con el concepto «{concepto}».
    </>
  ),
  enLaCola: 'Queda en la cola: se sincroniza cuando vuelva la señal.',
  ajustar: 'Ajustar el saldo de Cocos',
} as const;
