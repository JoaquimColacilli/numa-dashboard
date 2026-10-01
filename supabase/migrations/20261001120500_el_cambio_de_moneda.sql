-- El cambio de moneda: la compra y la venta de dólares entre un tesoro en pesos y uno en dólares
-- (ADR 0081).
--
-- Esta migración solo agrega el valor al enum, y va sola: Postgres no deja usar un valor de enum en
-- la misma transacción en la que se agregó, y el ensayo corre todas las migraciones pendientes en
-- una (ADR 0060). La forma de un cambio (sus dos lados y su segundo importe) y la regla de las
-- monedas llegan en las migraciones siguientes; hasta entonces el check de forma no deja escribir un
-- cambio.
--
-- Es aditiva: ningún movimiento cambia de tipo.

alter type public.tipo_movimiento add value if not exists 'cambio';
