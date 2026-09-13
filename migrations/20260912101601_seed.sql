-- ============================================================
-- Seed base: 23 formaciones + 26 locomotoras
-- Los datos de producción se cargan/sincronizan con backuotrenes.json
-- (npm run sync)
-- ============================================================

insert into public.formaciones (formacion, anteultima, ultima, estado) values
  (1, '2026-07-27', '2026-08-14', 'limpieza'),
  (2, NULL, NULL, 'fuera-servicio'),
  (3, NULL, NULL, 'fuera-servicio'),
  (4, '2026-07-22', '2026-08-20', 'limpieza'),
  (5, '2026-08-15', '2026-08-28', 'limpieza'),
  (6, '2026-08-08', '2026-08-26', 'limpieza'),
  (7, '2026-05-14', '2026-06-05', 'reparacion'),
  (8, '2026-07-16', '2026-08-06', 'limpieza'),
  (9, NULL, NULL, 'fuera-servicio'),
  (10, '2026-07-07', '2026-08-05', 'limpieza'),
  (11, NULL, NULL, 'fuera-servicio'),
  (12, '2026-07-17', '2026-08-11', 'limpieza'),
  (13, '2026-08-10', '2026-08-22', 'limpieza'),
  (14, '2026-08-01', '2026-08-25', 'limpieza'),
  (15, NULL, NULL, 'fuera-servicio'),
  (16, '2026-07-25', '2026-08-13', 'limpieza'),
  (17, '2026-07-28', '2026-08-21', 'limpieza'),
  (18, '2026-07-29', '2026-08-12', 'limpieza'),
  (19, '2026-07-11', '2026-08-07', 'limpieza'),
  (20, '2026-07-18', '2026-08-19', 'limpieza'),
  (21, '2026-07-31', '2026-08-18', 'limpieza'),
  (22, '2026-08-24', '2026-08-27', 'limpieza'),
  (23, '2026-07-20', '2026-08-04', 'limpieza')
on conflict (formacion) do update
set anteultima = excluded.anteultima,
    ultima = excluded.ultima,
    estado = excluded.estado;

insert into public.locomotoras (locomotora, servicio, ultima, estado) values
  ('B970', 'local', '2026-09-08', 'en-servicio'),
  ('B956', 'local', '2026-09-07', 'en-servicio'),
  ('A715', 'ld',    '2026-09-04', 'en-servicio'),
  ('B950', 'local', '2026-09-02', 'en-servicio'),
  ('B967', 'local', '2026-09-01', 'en-servicio'),
  ('B975', 'local', '2026-08-31', 'en-servicio'),
  ('B816', 'local', '2026-08-29', 'en-servicio'),
  ('B963', 'local', '2026-08-28', 'en-servicio'),
  ('B957', 'local', '2026-08-27', 'en-servicio'),
  ('B969', 'local', '2026-08-24', 'detenida'),
  ('B960', 'local', '2026-08-21', 'en-servicio'),
  ('B959', 'local', '2026-08-20', 'en-servicio'),
  ('A924', 'local', '2026-08-19', 'en-servicio'),
  ('B954', 'local', '2026-08-18', 'en-servicio'),
  ('A707', 'local', '2026-08-13', 'en-servicio'),
  ('B952', 'local', '2026-08-12', 'en-servicio'),
  ('B976', 'local', '2026-08-11', 'en-servicio'),
  ('G004', 'ld',    '2026-08-10', 'en-servicio'),
  ('B966', 'local', '2026-08-07', 'en-servicio'),
  ('B965', 'local', '2026-08-06', 'en-servicio'),
  ('B974', 'local', '2026-08-04', 'en-servicio'),
  ('B955', 'local', '2026-07-29', 'detenida'),
  ('B953', 'local', '2026-07-28', 'en-servicio'),
  ('B961', 'local', '2026-06-30', 'en-servicio'),
  ('H003', 'ld',    '2026-06-18', 'en-servicio'),
  ('B964', 'local', '2026-05-19', 'en-servicio')
on conflict (locomotora) do update
set ultima = excluded.ultima,
    servicio = excluded.servicio,
    estado = excluded.estado;