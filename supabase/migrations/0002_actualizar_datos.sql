-- ----------------------------------------------------------
-- Sincronización: datos de producción del repo "trenes"
-- (origin/main: datos-trenes.json, 2026-08-30T00:58:37.415Z)
-- Upsert de las 23 formaciones
-- ----------------------------------------------------------

begin;

update public.formaciones as f
set anteultima = e.anteultima,
    ultima = e.ultima,
    estado = e.estado
from (values
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
) as e(formacion, anteultima, ultima, estado)
where f.formacion = e.formacion;

commit;
