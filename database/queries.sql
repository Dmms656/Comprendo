-- =============================================================================
-- Comprendo V2 — Consultas de referencia para el backend
-- =============================================================================

-- Login docente
-- SELECT u.*, d.id_docente
-- FROM usuarios u
-- JOIN docentes d ON d.id_usuario = u.id_usuario
-- WHERE u.correo = $1 AND u.estado = 'ACTIVO';

-- Cursos y materias del docente autenticado
SELECT
    v.id_docente_curso_materia,
    v.anio_lectivo,
    v.nivel,
    v.paralelo,
    v.materia,
    v.id_curso
FROM v_docente_asignaciones v
WHERE v.id_docente = 1
  AND v.estado = 'ACTIVO'
ORDER BY v.anio_lectivo DESC, v.nivel, v.paralelo, v.materia;

-- Estudiantes inscritos en una materia (para envío Telegram)
SELECT
    id_estudiante,
    nombres,
    apellidos,
    telefono_telegram,
    telegram_chat_id
FROM v_estudiantes_por_materia
WHERE id_docente_curso_materia = 1
  AND estado = 'ACTIVO';

-- Preguntas de una lección
SELECT
    p.orden,
    p.enunciado,
    p.tipo_pregunta,
    p.respuesta_correcta,
    p.puntaje,
    p.generada_por_ia,
    COALESCE(
        json_agg(
            json_build_object(
                'literal', o.literal,
                'texto', o.texto,
                'es_correcta', o.es_correcta
            )
            ORDER BY o.literal
        ) FILTER (WHERE o.id_opcion IS NOT NULL),
        '[]'::json
    ) AS opciones
FROM preguntas p
LEFT JOIN opciones_pregunta o ON o.id_pregunta = p.id_pregunta
WHERE p.id_leccion = 1
  AND p.estado = 'ACTIVA'
GROUP BY p.id_pregunta
ORDER BY p.orden;

-- Resultados consolidados de una lección
SELECT *
FROM v_resultados_leccion_detalle
WHERE id_leccion = 1
ORDER BY porcentaje DESC, apellidos, nombres;

-- Respuestas de un estudiante en una lección
SELECT
    p.enunciado,
    re.respuesta_texto,
    re.es_correcta,
    re.puntaje_obtenido,
    re.retroalimentacion,
    re.fecha_respuesta
FROM respuestas_estudiantes re
JOIN preguntas p ON p.id_pregunta = re.id_pregunta
WHERE re.id_estudiante = 1
  AND p.id_leccion = 1
ORDER BY p.orden;

-- Historial de envíos Telegram por lección
SELECT
    et.id_envio,
    u.nombres,
    u.apellidos,
    p.orden AS pregunta_orden,
    et.estado_envio,
    et.fecha_envio,
    et.error_envio
FROM envios_telegram et
JOIN estudiantes e ON e.id_estudiante = et.id_estudiante
LEFT JOIN usuarios u ON u.id_usuario = e.id_usuario
JOIN preguntas p ON p.id_pregunta = et.id_pregunta
WHERE et.id_leccion = 1
ORDER BY et.fecha_envio DESC;

-- Uso de IA por docente (auditoría / costos)
SELECT
    si.id_solicitud_ia,
    l.titulo AS leccion,
    si.proveedor,
    si.modelo,
    si.cantidad_preguntas_generadas,
    si.tokens_entrada,
    si.tokens_salida,
    si.estado,
    si.fecha_solicitud
FROM solicitudes_ia si
LEFT JOIN lecciones l ON l.id_leccion = si.id_leccion
WHERE si.id_docente = 1
ORDER BY si.fecha_solicitud DESC;

-- Dashboard: resumen por docente
SELECT
    COUNT(DISTINCT dcm.id_docente_curso_materia) AS total_asignaciones,
    COUNT(DISTINCT l.id_leccion) AS total_lecciones,
    COUNT(DISTINCT p.id_pregunta) AS total_preguntas,
    COUNT(DISTINCT re.id_respuesta) AS total_respuestas
FROM docentes d
LEFT JOIN docente_curso_materia dcm ON dcm.id_docente = d.id_docente
LEFT JOIN lecciones l ON l.id_docente_curso_materia = dcm.id_docente_curso_materia
LEFT JOIN preguntas p ON p.id_leccion = l.id_leccion
LEFT JOIN respuestas_estudiantes re ON re.id_pregunta = p.id_pregunta
WHERE d.id_docente = 1;
