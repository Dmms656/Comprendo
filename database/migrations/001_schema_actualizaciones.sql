-- Migración consolidada (pre-producción)
-- Ejecutar una sola vez sobre una BD creada con schema.sql base anterior.

-- ---------------------------------------------------------------------------
-- Cursos: permitir historial INACTIVO; solo una asignación ACTIVA por combo
-- ---------------------------------------------------------------------------
ALTER TABLE docente_curso_materia
    DROP CONSTRAINT IF EXISTS uq_docente_curso_materia;

DROP INDEX IF EXISTS uq_docente_curso_materia;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dcm_activo
    ON docente_curso_materia (id_docente, id_curso, id_materia)
    WHERE estado = 'ACTIVO';

ALTER TABLE docente_curso_materia
    ADD COLUMN IF NOT EXISTS codigo_acceso VARCHAR(50);

CREATE UNIQUE INDEX IF NOT EXISTS uq_docente_curso_materia_codigo_acceso
    ON docente_curso_materia (codigo_acceso)
    WHERE codigo_acceso IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Lecciones: ventana de disponibilidad por fechas
-- ---------------------------------------------------------------------------
ALTER TABLE lecciones
    ADD COLUMN IF NOT EXISTS fecha_disponible_desde TIMESTAMPTZ;

ALTER TABLE lecciones
    ADD COLUMN IF NOT EXISTS fecha_disponible_hasta TIMESTAMPTZ;

-- Columnas de desarrollo obsoletas (minutos / inicio evaluación)
ALTER TABLE lecciones DROP COLUMN IF EXISTS tiempo_limite_minutos;
ALTER TABLE lecciones DROP COLUMN IF EXISTS fecha_inicio_evaluacion;
