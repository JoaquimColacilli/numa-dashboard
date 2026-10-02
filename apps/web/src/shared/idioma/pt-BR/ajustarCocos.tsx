import type { Mensajes } from '../es';

export const ajustarCocos = {
  conceptoQueSuma: 'Ajuste do Cocos (juros ou depósito)',
  conceptoQueResta: 'Ajuste do Cocos (saque ou correção)',
  faltaElSaldo: 'Digite o seu saldo real, por exemplo 1.250.000.',
  sinDiferencia: 'O saldo que você digitou é o que o app já tem: não precisa ajustar nada.',
  anotado: (ajuste, saldo) => `Ajuste de ${ajuste} registrado. O Cocos fica com ${saldo}.`,
  explicacion: (Negrita) => (
    <>
      O Cocos é o único saldo corrigido à mão: sobe sozinho com os juros e desce quando você saca.
      Digite o saldo que aparece na conta e o app registra a diferença.{' '}
      <Negrita>Você não precisa fazer a conta.</Negrita>
    </>
  ),
  calculado: 'O que o app calculou',
  saldoReal: 'O seu saldo real',
  vaAAnotar: (Negrita, ajuste, concepto) => (
    <>
      Vai ser registrado um lançamento de <Negrita>{ajuste}</Negrita> com a descrição “{concepto}”.
    </>
  ),
  enLaCola: 'Fica pendente: sincroniza quando a internet voltar.',
  ajustar: 'Ajustar o saldo do Cocos',
} satisfies Mensajes['ajustarCocos'];
