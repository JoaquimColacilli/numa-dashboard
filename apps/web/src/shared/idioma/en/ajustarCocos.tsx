import type { Mensajes } from '../es';

export const ajustarCocos = {
  conceptoQueSuma: 'Cocos adjustment (interest or deposit)',
  conceptoQueResta: 'Cocos adjustment (withdrawal or correction)',
  faltaElSaldo: 'Enter your actual balance, for example 1,250,000.',
  sinDiferencia:
    "The balance you entered is the one the app already has: there's nothing to adjust.",
  anotado: (ajuste, saldo) => `Recorded an adjustment of ${ajuste}. Cocos is now at ${saldo}.`,
  explicacion: (Negrita) => (
    <>
      Cocos is the only balance you fix by hand: it goes up on its own with interest and down when
      you withdraw. Enter the balance you see in your account and the app records the difference.{' '}
      <Negrita>You don&apos;t do the math.</Negrita>
    </>
  ),
  calculado: 'What the app has calculated',
  saldoReal: 'Your actual balance',
  vaAAnotar: (Negrita, ajuste, concepto) => (
    <>
      An entry of <Negrita>{ajuste}</Negrita> will be recorded with the description “{concepto}.”
    </>
  ),
  enLaCola: "It's queued: it syncs when you're back online.",
  ajustar: 'Adjust Cocos balance',
} satisfies Mensajes['ajustarCocos'];
