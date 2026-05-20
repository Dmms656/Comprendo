-- =============================================================================
-- Comprendo V2 — Esquema PostgreSQL
-- Plataforma docente: lecciones/tests, preguntas (manual/IA), envío Telegram,
-- respuestas, calificación y estadísticas.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensiones
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Usuarios y roles
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
    id_usuario          SERIAL PRIMARY KEY,
    nombres             VARCHAR(100) NOT NULL,
    apellidos           VARCHAR(100) NOT NULL,
    correo              VARCHAR(150) NOT NULL UNIQUE,
    telefono            VARCHAR(20),
    password_hash       TEXT,
    tipo_usuario        VARCHAR(20) NOT NULL
        CHECK (tipo_usuario IN ('ADMIN', 'DOCENTE', 'ESTUDIANTE')),
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_creacion      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE docentes (
    id_docente          SERIAL PRIMARY KEY,
    id_usuario          INT NOT NULL UNIQUE,
    titulo_profesional  VARCHAR(150),
    especialidad        VARCHAR(150),
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT fk_docentes_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE RESTRICT
);

CREATE TABLE estudiantes (
    id_estudiante       SERIAL PRIMARY KEY,
    id_usuario          INT UNIQUE,
    codigo_estudiante   VARCHAR(50),
    telefono_telegram   VARCHAR(20) NOT NULL UNIQUE,
    telegram_chat_id    VARCHAR(100) UNIQUE,
    telegram_username   VARCHAR(100),
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estudiantes_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 2. Estructura académica
-- ---------------------------------------------------------------------------
CREATE TABLE anios_lectivos (
    id_anio_lectivo     SERIAL PRIMARY KEY,
    nombre              VARCHAR(20) NOT NULL UNIQUE,
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO', 'FINALIZADO')),
    CONSTRAINT chk_anio_fechas CHECK (fecha_fin > fecha_inicio)
);

CREATE TABLE niveles (
    id_nivel            SERIAL PRIMARY KEY,
    nombre              VARCHAR(100) NOT NULL UNIQUE,
    descripcion         TEXT
);

CREATE TABLE paralelos (
    id_paralelo         SERIAL PRIMARY KEY,
    nombre              VARCHAR(10) NOT NULL UNIQUE,
    descripcion         TEXT
);

CREATE TABLE cursos (
    id_curso            SERIAL PRIMARY KEY,
    id_anio_lectivo     INT NOT NULL,
    id_nivel            INT NOT NULL,
    id_paralelo         INT NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    CONSTRAINT fk_cursos_anio
        FOREIGN KEY (id_anio_lectivo) REFERENCES anios_lectivos (id_anio_lectivo)
        ON DELETE RESTRICT,
    CONSTRAINT fk_cursos_nivel
        FOREIGN KEY (id_nivel) REFERENCES niveles (id_nivel)
        ON DELETE RESTRICT,
    CONSTRAINT fk_cursos_paralelo
        FOREIGN KEY (id_paralelo) REFERENCES paralelos (id_paralelo)
        ON DELETE RESTRICT,
    CONSTRAINT uq_curso_anio_nivel_paralelo
        UNIQUE (id_anio_lectivo, id_nivel, id_paralelo)
);

CREATE TABLE materias (
    id_materia          SERIAL PRIMARY KEY,
    nombre              VARCHAR(120) NOT NULL UNIQUE,
    descripcion         TEXT,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'INACTIVA'))
);

-- Tabla central: docente + curso (año/nivel/paralelo) + materia
CREATE TABLE docente_curso_materia (
    id_docente_curso_materia    SERIAL PRIMARY KEY,
    id_docente                  INT NOT NULL,
    id_curso                    INT NOT NULL,
    id_materia                  INT NOT NULL,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_asignacion            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    codigo_acceso               VARCHAR(50),
    CONSTRAINT fk_dcm_docente
        FOREIGN KEY (id_docente) REFERENCES docentes (id_docente)
        ON DELETE RESTRICT,
    CONSTRAINT fk_dcm_curso
        FOREIGN KEY (id_curso) REFERENCES cursos (id_curso)
        ON DELETE RESTRICT,
    CONSTRAINT fk_dcm_materia
        FOREIGN KEY (id_materia) REFERENCES materias (id_materia)
        ON DELETE RESTRICT,
    CONSTRAINT uq_docente_curso_materia
        UNIQUE (id_docente, id_curso, id_materia)
);

CREATE TABLE estudiante_curso (
    id_estudiante_curso SERIAL PRIMARY KEY,
    id_estudiante       INT NOT NULL,
    id_curso            INT NOT NULL,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_matricula     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ec_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes (id_estudiante)
        ON DELETE CASCADE,
    CONSTRAINT fk_ec_curso
        FOREIGN KEY (id_curso) REFERENCES cursos (id_curso)
        ON DELETE RESTRICT,
    CONSTRAINT uq_estudiante_curso
        UNIQUE (id_estudiante, id_curso)
);

CREATE TABLE estudiante_materia (
    id_estudiante_materia       SERIAL PRIMARY KEY,
    id_estudiante               INT NOT NULL,
    id_docente_curso_materia    INT NOT NULL,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado IN ('ACTIVO', 'INACTIVO')),
    fecha_registro              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_em_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes (id_estudiante)
        ON DELETE CASCADE,
    CONSTRAINT fk_em_dcm
        FOREIGN KEY (id_docente_curso_materia)
        REFERENCES docente_curso_materia (id_docente_curso_materia)
        ON DELETE RESTRICT,
    CONSTRAINT uq_estudiante_materia
        UNIQUE (id_estudiante, id_docente_curso_materia)
);

-- ---------------------------------------------------------------------------
-- 3. Lecciones y preguntas
-- ---------------------------------------------------------------------------
CREATE TABLE lecciones (
    id_leccion                  SERIAL PRIMARY KEY,
    id_docente_curso_materia    INT NOT NULL,
    titulo                      VARCHAR(150) NOT NULL,
    descripcion                 TEXT,
    tema                        VARCHAR(150),
    numero_preguntas            INT NOT NULL CHECK (numero_preguntas > 0),
    fecha_creacion              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_programada            TIMESTAMPTZ,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'BORRADOR'
        CHECK (estado IN ('BORRADOR', 'PROGRAMADA', 'ENVIADA', 'CERRADA', 'CANCELADA')),
    creada_con_ia               BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_lecciones_dcm
        FOREIGN KEY (id_docente_curso_materia)
        REFERENCES docente_curso_materia (id_docente_curso_materia)
        ON DELETE RESTRICT
);

CREATE TABLE preguntas (
    id_pregunta         SERIAL PRIMARY KEY,
    id_leccion          INT NOT NULL,
    enunciado           TEXT NOT NULL,
    tipo_pregunta       VARCHAR(30) NOT NULL
        CHECK (tipo_pregunta IN (
            'OPCION_MULTIPLE',
            'VERDADERO_FALSO',
            'RESPUESTA_CORTA',
            'ABIERTA'
        )),
    respuesta_correcta  TEXT,
    explicacion         TEXT,
    puntaje             NUMERIC(5, 2) NOT NULL DEFAULT 1
        CHECK (puntaje > 0),
    orden               INT NOT NULL CHECK (orden > 0),
    generada_por_ia     BOOLEAN NOT NULL DEFAULT FALSE,
    id_solicitud_ia     INT,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'INACTIVA')),
    CONSTRAINT fk_preguntas_leccion
        FOREIGN KEY (id_leccion) REFERENCES lecciones (id_leccion)
        ON DELETE CASCADE,
    CONSTRAINT uq_pregunta_orden_leccion
        UNIQUE (id_leccion, orden)
);

CREATE TABLE opciones_pregunta (
    id_opcion           SERIAL PRIMARY KEY,
    id_pregunta         INT NOT NULL,
    literal             VARCHAR(5) NOT NULL,
    texto               TEXT NOT NULL,
    es_correcta         BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_opciones_pregunta
        FOREIGN KEY (id_pregunta) REFERENCES preguntas (id_pregunta)
        ON DELETE CASCADE,
    CONSTRAINT uq_opcion_literal
        UNIQUE (id_pregunta, literal)
);

-- ---------------------------------------------------------------------------
-- 4. Telegram, respuestas y resultados
-- ---------------------------------------------------------------------------
CREATE TABLE envios_telegram (
    id_envio                SERIAL PRIMARY KEY,
    id_leccion              INT NOT NULL,
    id_pregunta             INT NOT NULL,
    id_estudiante           INT NOT NULL,
    telegram_chat_id        VARCHAR(100) NOT NULL,
    mensaje_enviado         TEXT,
    telegram_message_id     VARCHAR(100),
    fecha_envio             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado_envio            VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado_envio IN (
            'PENDIENTE',
            'ENVIADO',
            'ENTREGADO',
            'FALLIDO',
            'RESPONDIDO'
        )),
    error_envio             TEXT,
    CONSTRAINT fk_envios_leccion
        FOREIGN KEY (id_leccion) REFERENCES lecciones (id_leccion)
        ON DELETE CASCADE,
    CONSTRAINT fk_envios_pregunta
        FOREIGN KEY (id_pregunta) REFERENCES preguntas (id_pregunta)
        ON DELETE CASCADE,
    CONSTRAINT fk_envios_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes (id_estudiante)
        ON DELETE CASCADE,
    CONSTRAINT uq_envio_pregunta_estudiante
        UNIQUE (id_pregunta, id_estudiante)
);

CREATE TABLE respuestas_estudiantes (
    id_respuesta                SERIAL PRIMARY KEY,
    id_envio                    INT NOT NULL UNIQUE,
    id_estudiante               INT NOT NULL,
    id_pregunta                 INT NOT NULL,
    respuesta_texto             TEXT NOT NULL,
    es_correcta                 BOOLEAN,
    puntaje_obtenido             NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (puntaje_obtenido >= 0),
    fecha_respuesta             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tiempo_respuesta_segundos   INT CHECK (tiempo_respuesta_segundos IS NULL OR tiempo_respuesta_segundos >= 0),
    evaluada_por_ia             BOOLEAN NOT NULL DEFAULT FALSE,
    retroalimentacion           TEXT,
    CONSTRAINT fk_respuestas_envio
        FOREIGN KEY (id_envio) REFERENCES envios_telegram (id_envio)
        ON DELETE CASCADE,
    CONSTRAINT fk_respuestas_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes (id_estudiante)
        ON DELETE CASCADE,
    CONSTRAINT fk_respuestas_pregunta
        FOREIGN KEY (id_pregunta) REFERENCES preguntas (id_pregunta)
        ON DELETE CASCADE
);

CREATE TABLE resultados_leccion (
    id_resultado            SERIAL PRIMARY KEY,
    id_leccion              INT NOT NULL,
    id_estudiante           INT NOT NULL,
    total_preguntas         INT NOT NULL DEFAULT 0 CHECK (total_preguntas >= 0),
    preguntas_respondidas   INT NOT NULL DEFAULT 0 CHECK (preguntas_respondidas >= 0),
    respuestas_correctas    INT NOT NULL DEFAULT 0 CHECK (respuestas_correctas >= 0),
    respuestas_incorrectas  INT NOT NULL DEFAULT 0 CHECK (respuestas_incorrectas >= 0),
    puntaje_total           NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (puntaje_total >= 0),
    puntaje_obtenido        NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (puntaje_obtenido >= 0),
    porcentaje              NUMERIC(5, 2) NOT NULL DEFAULT 0
        CHECK (porcentaje >= 0 AND porcentaje <= 100),
    estado                  VARCHAR(20) NOT NULL DEFAULT 'EN_PROCESO'
        CHECK (estado IN ('EN_PROCESO', 'COMPLETADO', 'INCOMPLETO')),
    fecha_inicio            TIMESTAMPTZ,
    fecha_finalizacion      TIMESTAMPTZ,
    CONSTRAINT fk_resultados_leccion
        FOREIGN KEY (id_leccion) REFERENCES lecciones (id_leccion)
        ON DELETE CASCADE,
    CONSTRAINT fk_resultados_estudiante
        FOREIGN KEY (id_estudiante) REFERENCES estudiantes (id_estudiante)
        ON DELETE CASCADE,
    CONSTRAINT uq_resultado_leccion_estudiante
        UNIQUE (id_leccion, id_estudiante)
);

-- ---------------------------------------------------------------------------
-- 5. Inteligencia artificial
-- ---------------------------------------------------------------------------
CREATE TABLE solicitudes_ia (
    id_solicitud_ia             SERIAL PRIMARY KEY,
    id_docente                  INT NOT NULL,
    id_leccion                  INT,
    proveedor                   VARCHAR(50) NOT NULL,
    modelo                      VARCHAR(100),
    prompt                      TEXT NOT NULL,
    respuesta_ia                TEXT,
    cantidad_preguntas_generadas INT NOT NULL DEFAULT 0
        CHECK (cantidad_preguntas_generadas >= 0),
    tokens_entrada              INT CHECK (tokens_entrada IS NULL OR tokens_entrada >= 0),
    tokens_salida               INT CHECK (tokens_salida IS NULL OR tokens_salida >= 0),
    fecha_solicitud             TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'EXITOSA'
        CHECK (estado IN ('EXITOSA', 'FALLIDA')),
    error                       TEXT,
    CONSTRAINT fk_solicitudes_docente
        FOREIGN KEY (id_docente) REFERENCES docentes (id_docente)
        ON DELETE RESTRICT,
    CONSTRAINT fk_solicitudes_leccion
        FOREIGN KEY (id_leccion) REFERENCES lecciones (id_leccion)
        ON DELETE SET NULL
);

ALTER TABLE preguntas
    ADD CONSTRAINT fk_preguntas_solicitud_ia
    FOREIGN KEY (id_solicitud_ia) REFERENCES solicitudes_ia (id_solicitud_ia)
    ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 6. Autenticación y auditoría
-- ---------------------------------------------------------------------------
CREATE TABLE sesiones_usuario (
    id_sesion           SERIAL PRIMARY KEY,
    id_usuario          INT NOT NULL,
    token_hash          TEXT NOT NULL,
    fecha_inicio        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion    TIMESTAMPTZ NOT NULL,
    ip_origen           VARCHAR(50),
    user_agent          TEXT,
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVA'
        CHECK (estado IN ('ACTIVA', 'REVOCADA', 'EXPIRADA')),
    CONSTRAINT fk_sesiones_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE CASCADE,
    CONSTRAINT chk_sesion_expiracion
        CHECK (fecha_expiracion > fecha_inicio)
);

CREATE TABLE auditoria_eventos (
    id_evento           SERIAL PRIMARY KEY,
    id_usuario          INT,
    accion              VARCHAR(100) NOT NULL,
    entidad             VARCHAR(100),
    id_entidad          INT,
    descripcion         TEXT,
    fecha_evento        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origen           VARCHAR(50),
    CONSTRAINT fk_auditoria_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
        ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
CREATE INDEX idx_usuarios_correo ON usuarios (correo);
CREATE INDEX idx_usuarios_tipo_estado ON usuarios (tipo_usuario, estado);

CREATE INDEX idx_cursos_anio ON cursos (id_anio_lectivo);
CREATE INDEX idx_dcm_docente ON docente_curso_materia (id_docente);
CREATE INDEX idx_dcm_curso ON docente_curso_materia (id_curso);
CREATE INDEX idx_dcm_materia ON docente_curso_materia (id_materia);
CREATE UNIQUE INDEX uq_docente_curso_materia_codigo_acceso ON docente_curso_materia (codigo_acceso) WHERE codigo_acceso IS NOT NULL;

CREATE INDEX idx_estudiante_materia_dcm ON estudiante_materia (id_docente_curso_materia);
CREATE INDEX idx_estudiante_materia_estudiante ON estudiante_materia (id_estudiante);

CREATE INDEX idx_lecciones_dcm ON lecciones (id_docente_curso_materia);
CREATE INDEX idx_lecciones_estado ON lecciones (estado);
CREATE INDEX idx_lecciones_fecha_creacion ON lecciones (fecha_creacion DESC);

CREATE INDEX idx_preguntas_leccion ON preguntas (id_leccion);
CREATE INDEX idx_opciones_pregunta ON opciones_pregunta (id_pregunta);

CREATE INDEX idx_envios_leccion ON envios_telegram (id_leccion);
CREATE INDEX idx_envios_estudiante ON envios_telegram (id_estudiante);
CREATE INDEX idx_envios_estado ON envios_telegram (estado_envio);

CREATE INDEX idx_respuestas_estudiante ON respuestas_estudiantes (id_estudiante);
CREATE INDEX idx_respuestas_pregunta ON respuestas_estudiantes (id_pregunta);
CREATE INDEX idx_respuestas_fecha ON respuestas_estudiantes (fecha_respuesta DESC);

CREATE INDEX idx_resultados_leccion ON resultados_leccion (id_leccion);
CREATE INDEX idx_resultados_estudiante ON resultados_leccion (id_estudiante);

CREATE INDEX idx_solicitudes_ia_docente ON solicitudes_ia (id_docente);
CREATE INDEX idx_solicitudes_ia_leccion ON solicitudes_ia (id_leccion);
CREATE INDEX idx_solicitudes_ia_fecha ON solicitudes_ia (fecha_solicitud DESC);

CREATE INDEX idx_sesiones_usuario ON sesiones_usuario (id_usuario, estado);
CREATE INDEX idx_auditoria_fecha ON auditoria_eventos (fecha_evento DESC);

-- ---------------------------------------------------------------------------
-- Funciones y triggers: consolidar resultados por lección
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_recalcular_resultado_leccion(
    p_id_leccion INT,
    p_id_estudiante INT
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_total           INT;
    v_respondidas     INT;
    v_correctas       INT;
    v_incorrectas     INT;
    v_puntaje_total   NUMERIC(6, 2);
    v_puntaje_obtenido NUMERIC(6, 2);
    v_porcentaje      NUMERIC(10, 2); -- Safety: use larger numeric type to prevent typmod overflow during calculation
    v_estado          VARCHAR(20);
    v_fecha_inicio    TIMESTAMPTZ;
    v_fecha_fin       TIMESTAMPTZ;
BEGIN
    SELECT COUNT(*), COALESCE(SUM(puntaje), 0)
    INTO v_total, v_puntaje_total
    FROM preguntas
    WHERE id_leccion = p_id_leccion
      AND estado = 'ACTIVA';

    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE es_correcta IS TRUE),
        COUNT(*) FILTER (WHERE es_correcta IS FALSE),
        COALESCE(SUM(puntaje_obtenido), 0),
        MIN(fecha_respuesta),
        MAX(fecha_respuesta)
    INTO
        v_respondidas,
        v_correctas,
        v_incorrectas,
        v_puntaje_obtenido,
        v_fecha_inicio,
        v_fecha_fin
    FROM respuestas_estudiantes re
    JOIN preguntas p ON p.id_pregunta = re.id_pregunta
    WHERE p.id_leccion = p_id_leccion
      AND re.id_estudiante = p_id_estudiante;

    IF v_total = 0 THEN
        v_porcentaje := 0;
    ELSE
        -- Safety: cap percentage at 100.00 to respect database check constraints and logical limits
        v_porcentaje := LEAST(ROUND((v_puntaje_obtenido / NULLIF(v_puntaje_total, 0)) * 100, 2), 100.00);
    END IF;

    IF v_respondidas = 0 THEN
        v_estado := 'EN_PROCESO';
        v_fecha_fin := NULL;
    ELSIF v_respondidas >= v_total THEN
        v_estado := 'COMPLETADO';
    ELSE
        v_estado := 'INCOMPLETO';
    END IF;

    INSERT INTO resultados_leccion (
        id_leccion,
        id_estudiante,
        total_preguntas,
        preguntas_respondidas,
        respuestas_correctas,
        respuestas_incorrectas,
        puntaje_total,
        puntaje_obtenido,
        porcentaje,
        estado,
        fecha_inicio,
        fecha_finalizacion
    )
    VALUES (
        p_id_leccion,
        p_id_estudiante,
        v_total,
        v_respondidas,
        v_correctas,
        v_incorrectas,
        v_puntaje_total,
        -- Safety: cap puntaje_obtenido at puntaje_total as well to prevent logical issues
        LEAST(v_puntaje_obtenido, v_puntaje_total),
        v_porcentaje::NUMERIC(5, 2),
        v_estado,
        v_fecha_inicio,
        CASE WHEN v_estado = 'COMPLETADO' THEN v_fecha_fin ELSE NULL END
    )
    ON CONFLICT (id_leccion, id_estudiante)
    DO UPDATE SET
        total_preguntas = EXCLUDED.total_preguntas,
        preguntas_respondidas = EXCLUDED.preguntas_respondidas,
        respuestas_correctas = EXCLUDED.respuestas_correctas,
        respuestas_incorrectas = EXCLUDED.respuestas_incorrectas,
        puntaje_total = EXCLUDED.puntaje_total,
        puntaje_obtenido = EXCLUDED.puntaje_obtenido,
        porcentaje = EXCLUDED.porcentaje,
        estado = EXCLUDED.estado,
        fecha_inicio = COALESCE(resultados_leccion.fecha_inicio, EXCLUDED.fecha_inicio),
        fecha_finalizacion = EXCLUDED.fecha_finalizacion;
END;
$$;

CREATE OR REPLACE FUNCTION trg_respuesta_actualiza_resultado()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_leccion INT;
BEGIN
    SELECT id_leccion
    INTO v_id_leccion
    FROM preguntas
    WHERE id_pregunta = NEW.id_pregunta;

    UPDATE envios_telegram
    SET estado_envio = 'RESPONDIDO'
    WHERE id_envio = NEW.id_envio
      AND estado_envio <> 'RESPONDIDO';

    PERFORM fn_recalcular_resultado_leccion(v_id_leccion, NEW.id_estudiante);

    RETURN NEW;
END;
$$;

CREATE TRIGGER tg_respuesta_actualiza_resultado
    AFTER INSERT OR UPDATE ON respuestas_estudiantes
    FOR EACH ROW
    EXECUTE PROCEDURE trg_respuesta_actualiza_resultado();

-- Sincronizar numero_preguntas al cambiar preguntas activas
CREATE OR REPLACE FUNCTION trg_sync_numero_preguntas_leccion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_leccion INT;
BEGIN
    v_id_leccion := COALESCE(NEW.id_leccion, OLD.id_leccion);

    UPDATE lecciones
    SET numero_preguntas = (
        SELECT COUNT(*)
        FROM preguntas
        WHERE id_leccion = v_id_leccion
          AND estado = 'ACTIVA'
    )
    WHERE id_leccion = v_id_leccion;

    RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER tg_sync_numero_preguntas_leccion
    AFTER INSERT OR UPDATE OR DELETE ON preguntas
    FOR EACH ROW
    EXECUTE PROCEDURE trg_sync_numero_preguntas_leccion();

-- ---------------------------------------------------------------------------
-- Vistas útiles para el panel docente
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_docente_asignaciones AS
SELECT
    d.id_docente,
    dcm.id_docente_curso_materia,
    al.id_anio_lectivo,
    al.nombre AS anio_lectivo,
    n.id_nivel,
    n.nombre AS nivel,
    p.id_paralelo,
    p.nombre AS paralelo,
    m.id_materia,
    m.nombre AS materia,
    c.id_curso,
    dcm.estado
FROM docente_curso_materia dcm
JOIN docentes d ON d.id_docente = dcm.id_docente
JOIN cursos c ON c.id_curso = dcm.id_curso
JOIN anios_lectivos al ON al.id_anio_lectivo = c.id_anio_lectivo
JOIN niveles n ON n.id_nivel = c.id_nivel
JOIN paralelos p ON p.id_paralelo = c.id_paralelo
JOIN materias m ON m.id_materia = dcm.id_materia;

CREATE OR REPLACE VIEW v_estudiantes_por_materia AS
SELECT
    em.id_docente_curso_materia,
    e.id_estudiante,
    u.nombres,
    u.apellidos,
    e.telefono_telegram,
    e.telegram_chat_id,
    e.telegram_username,
    em.estado
FROM estudiante_materia em
JOIN estudiantes e ON e.id_estudiante = em.id_estudiante
LEFT JOIN usuarios u ON u.id_usuario = e.id_usuario;

CREATE OR REPLACE VIEW v_resultados_leccion_detalle AS
SELECT
    rl.id_resultado,
    rl.id_leccion,
    l.titulo AS leccion_titulo,
    rl.id_estudiante,
    u.nombres,
    u.apellidos,
    rl.total_preguntas,
    rl.preguntas_respondidas,
    rl.respuestas_correctas,
    rl.respuestas_incorrectas,
    rl.puntaje_obtenido,
    rl.puntaje_total,
    rl.porcentaje,
    rl.estado,
    rl.fecha_inicio,
    rl.fecha_finalizacion
FROM resultados_leccion rl
JOIN lecciones l ON l.id_leccion = rl.id_leccion
JOIN estudiantes e ON e.id_estudiante = rl.id_estudiante
LEFT JOIN usuarios u ON u.id_usuario = e.id_usuario;

COMMIT;
