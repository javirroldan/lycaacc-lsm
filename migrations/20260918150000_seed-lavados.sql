-- ============================================================
-- Migración: seed multi-registro de lavados (demo)
-- Formaciones 1, 4, 8, 13 y 20 con 2–3 lavados cada una,
-- todos con pasadas=2 y ok=true, created_at espaciados 2 días.
-- NOTA: reinicia los lavados de ejemplo para probar el
-- historial acumulado por tarjeta.
-- ============================================================

delete from public.lavados;

insert into public.lavados (formacion, ingreso, egreso, pasadas, ok, created_at) values
  (1,  '08:30', '09:05', 2, true, now() - interval '16 days'),
  (1,  '08:30', '09:10', 2, true, now() - interval '8 days'),
  (1,  '08:30', '09:00', 2, true, now() - interval '2 days'),

  (4,  '09:15', '09:50', 2, true, now() - interval '15 days'),
  (4,  '09:15', '09:55', 2, true, now() - interval '7 days'),
  (4,  '09:15', '09:45', 2, true, now() - interval '1 day'),

  (8,  '10:00', '10:40', 2, true, now() - interval '14 days'),
  (8,  '10:00', '10:35', 2, true, now() - interval '6 days'),

  (13, '11:20', '11:55', 2, true, now() - interval '13 days'),
  (13, '11:20', '12:00', 2, true, now() - interval '5 days'),
  (13, '11:20', '11:50', 2, true, now() - interval '3 days'),

  (20, '12:10', '12:45', 2, true, now() - interval '12 days'),
  (20, '12:10', '12:50', 2, true, now() - interval '4 days');