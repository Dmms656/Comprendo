-- =============================================================================
-- Comprendo V2 — Datos iniciales de demostración
-- Alineado con el panel actual: docente@comprendo.local / comprendo123
-- Ejecutar después de schema.sql
-- =============================================================================

BEGIN;

-- Año lectivo, niveles y paralelos
INSERT INTO anios_lectivos (nombre, fecha_inicio, fecha_fin, estado)
VALUES ('2025-2026', '2025-09-01', '2026-07-31', 'ACTIVO');

INSERT INTO niveles (nombre, descripcion) VALUES
    ('Primero de Bachillerato', 'BGU — primer año'),
    ('Segundo de Bachillerato', 'BGU — segundo año'),
    ('Tercero de Bachillerato', 'BGU — tercer año');

INSERT INTO paralelos (nombre, descripcion) VALUES
    ('A', 'Paralelo A'),
    ('B', 'Paralelo B'),
    ('C', 'Paralelo C');

INSERT INTO materias (nombre, descripcion) VALUES
    ('Matemática', 'Área de matemática'),
    ('Lengua y Literatura', 'Comunicación y literatura'),
    ('Contabilidad', 'Contabilidad general'),
    ('Historia', 'Ciencias sociales — historia');

-- Curso: 2025-2026 / Tercero BGU / A (equivalente al demo "3ro Bachillerato Ciencias A")
INSERT INTO cursos (id_anio_lectivo, id_nivel, id_paralelo)
SELECT
    al.id_anio_lectivo,
    n.id_nivel,
    p.id_paralelo
FROM anios_lectivos al
CROSS JOIN niveles n
CROSS JOIN paralelos p
WHERE al.nombre = '2025-2026'
  AND n.nombre = 'Tercero de Bachillerato'
  AND p.nombre = 'A';

-- Docente demo (password: comprendo123 → SHA-256 hex, mismo algoritmo que dataStore.js)
INSERT INTO usuarios (nombres, apellidos, correo, telefono, password_hash, tipo_usuario)
VALUES (
    'Dana',
    'Bahamonde',
    'docente@comprendo.local',
    NULL,
  '77b7e862860fb71e1fe9f936480ecf72c80eb462edb3aa8a8f6e5fa399be9989',
    'DOCENTE'
);

INSERT INTO docentes (id_usuario, titulo_profesional, especialidad)
SELECT id_usuario, 'Lic. en Ciencias', 'Matemática'
FROM usuarios
WHERE correo = 'docente@comprendo.local';

-- Asignación: Dana → Matemática en Tercero A (2025-2026)
INSERT INTO docente_curso_materia (id_docente, id_curso, id_materia)
SELECT d.id_docente, c.id_curso, m.id_materia
FROM docentes d
JOIN usuarios u ON u.id_usuario = d.id_usuario
JOIN cursos c ON TRUE
JOIN anios_lectivos al ON al.id_anio_lectivo = c.id_anio_lectivo
JOIN niveles n ON n.id_nivel = c.id_nivel
JOIN paralelos p ON p.id_paralelo = c.id_paralelo
JOIN materias m ON m.nombre = 'Matemática'
WHERE u.correo = 'docente@comprendo.local'
  AND al.nombre = '2025-2026'
  AND n.nombre = 'Tercero de Bachillerato'
  AND p.nombre = 'A';

-- Estudiantes de ejemplo (telegram_chat_id ficticios para desarrollo)
INSERT INTO usuarios (nombres, apellidos, correo, tipo_usuario)
VALUES
    ('Juan', 'Pérez', 'juan.perez@estudiante.local', 'ESTUDIANTE'),
    ('María', 'López', 'maria.lopez@estudiante.local', 'ESTUDIANTE');

INSERT INTO estudiantes (id_usuario, codigo_estudiante, telefono_telegram, telegram_chat_id, telegram_username)
SELECT u.id_usuario, 'EST-001', '+593990000001', '100000001', 'juan_perez_demo'
FROM usuarios u WHERE u.correo = 'juan.perez@estudiante.local';

INSERT INTO estudiantes (id_usuario, codigo_estudiante, telefono_telegram, telegram_chat_id, telegram_username)
SELECT u.id_usuario, 'EST-002', '+593990000002', '100000002', 'maria_lopez_demo'
FROM usuarios u WHERE u.correo = 'maria.lopez@estudiante.local';

-- Matrícula curso y materia con el docente
INSERT INTO estudiante_curso (id_estudiante, id_curso)
SELECT e.id_estudiante, c.id_curso
FROM estudiantes e
JOIN cursos c ON TRUE
JOIN anios_lectivos al ON al.id_anio_lectivo = c.id_anio_lectivo
JOIN niveles n ON n.id_nivel = c.id_nivel
JOIN paralelos p ON p.id_paralelo = c.id_paralelo
WHERE al.nombre = '2025-2026'
  AND n.nombre = 'Tercero de Bachillerato'
  AND p.nombre = 'A';

INSERT INTO estudiante_materia (id_estudiante, id_docente_curso_materia)
SELECT e.id_estudiante, dcm.id_docente_curso_materia
FROM estudiantes e
CROSS JOIN docente_curso_materia dcm;

-- Lección demo: Fracciones equivalentes (tema del prototipo actual)
INSERT INTO lecciones (
    id_docente_curso_materia,
    titulo,
    descripcion,
    tema,
    numero_preguntas,
    estado,
    creada_con_ia
)
SELECT
    dcm.id_docente_curso_materia,
    'Práctica: Fracciones equivalentes',
    'Cierre de clase generado desde Comprendo',
    'Fracciones equivalentes',
    1,
    'BORRADOR',
    FALSE
FROM docente_curso_materia dcm
LIMIT 1;

INSERT INTO preguntas (
    id_leccion,
    enunciado,
    tipo_pregunta,
    respuesta_correcta,
    explicacion,
    puntaje,
    orden,
    generada_por_ia
)
SELECT
    l.id_leccion,
    '¿Cuál de las siguientes fracciones es equivalente a 1/2?',
    'OPCION_MULTIPLE',
    'B',
    '2/4 se simplifica dividiendo numerador y denominador entre 2.',
    1,
    1,
    FALSE
FROM lecciones l
WHERE l.tema = 'Fracciones equivalentes'
LIMIT 1;

INSERT INTO opciones_pregunta (id_pregunta, literal, texto, es_correcta)
SELECT p.id_pregunta, v.literal, v.texto, v.es_correcta
FROM preguntas p
CROSS JOIN (
    VALUES
        ('A', '1/4', FALSE),
        ('B', '2/4', TRUE),
        ('C', '3/4', FALSE),
        ('D', '4/4', FALSE)
) AS v(literal, texto, es_correcta)
WHERE p.orden = 1
  AND p.tipo_pregunta = 'OPCION_MULTIPLE';

COMMIT;
