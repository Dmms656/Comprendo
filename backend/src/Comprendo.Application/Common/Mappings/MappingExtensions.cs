using Comprendo.Application.Features.Academico.AniosLectivos;
using Comprendo.Application.Features.Academico.Cursos;
using Comprendo.Application.Features.Academico.Materias;
using Comprendo.Application.Features.Academico.Niveles;
using Comprendo.Application.Features.Academico.Paralelos;
using Comprendo.Application.Features.Asignaciones;
using Comprendo.Application.Features.Auth;
using Comprendo.Application.Features.Dashboard;
using Comprendo.Application.Features.Estudiantes;
using Comprendo.Application.Features.Integracion;
using Comprendo.Application.Features.Lecciones;
using Comprendo.Application.Features.Preguntas;
using Comprendo.Application.Features.Resultados;
using Comprendo.Domain.Entities;

namespace Comprendo.Application.Common.Mappings;

public static class MappingExtensions
{
    public static UsuarioDto ToDto(this Usuario entity) => new(
        entity.IdUsuario,
        entity.Nombres,
        entity.Apellidos,
        entity.Correo,
        entity.TipoUsuario.ToString().ToUpperInvariant(),
        entity.Estado.ToString().ToUpperInvariant());

    public static AnioLectivoDto ToDto(this AnioLectivo entity) => new(
        entity.IdAnioLectivo,
        entity.Nombre,
        entity.FechaInicio,
        entity.FechaFin,
        entity.Estado.ToString().ToUpperInvariant());

    public static NivelDto ToDto(this Nivel entity) => new(
        entity.IdNivel,
        entity.Nombre,
        entity.Descripcion);

    public static ParaleloDto ToDto(this Paralelo entity) => new(
        entity.IdParalelo,
        entity.Nombre,
        entity.Descripcion);

    public static CursoDto ToDto(this Curso entity) => new(
        entity.IdCurso,
        entity.IdAnioLectivo,
        entity.IdNivel,
        entity.IdParalelo,
        entity.Estado.ToString().ToUpperInvariant());

    public static MateriaDto ToDto(this Materia entity) => new(
        entity.IdMateria,
        entity.Nombre,
        entity.Descripcion,
        entity.Estado.ToString().ToUpperInvariant());

    public static DocenteAsignacionDto ToDto(this DocenteAsignacionDetalle entity) => new(
        entity.IdDocenteCursoMateria,
        entity.IdCurso,
        entity.IdAnioLectivo,
        entity.AnioLectivo,
        entity.IdNivel,
        entity.Nivel,
        entity.IdParalelo,
        entity.Paralelo,
        entity.IdMateria,
        entity.Materia,
        entity.Estado.ToString().ToUpperInvariant(),
        entity.CodigoAcceso);

    public static EstudianteDto ToDto(this Estudiante entity) => new(
        entity.IdEstudiante,
        entity.IdUsuario,
        entity.Usuario?.Nombres,
        entity.Usuario?.Apellidos,
        entity.Usuario?.Correo,
        entity.CodigoEstudiante,
        entity.TelefonoTelegram,
        entity.TelegramChatId,
        entity.TelegramUsername,
        entity.Estado.ToString().ToUpperInvariant(),
        entity.FechaRegistro);

    public static LeccionDto ToDto(this Leccion entity) => new(
        entity.IdLeccion,
        entity.IdDocenteCursoMateria,
        entity.Titulo,
        entity.Descripcion,
        entity.Tema,
        entity.NumeroPreguntas,
        entity.FechaCreacion,
        entity.FechaProgramada,
        entity.Estado.ToString().ToUpperInvariant(),
        entity.CreadaConIa);

    public static PreguntaDto ToDto(this Pregunta entity) => new(
        entity.IdPregunta,
        entity.IdLeccion,
        entity.Enunciado,
        entity.TipoPregunta.ToString().ToUpperInvariant(),
        entity.RespuestaCorrecta,
        entity.Explicacion,
        entity.Puntaje,
        entity.Orden,
        entity.GeneradaPorIa,
        entity.Estado.ToString().ToUpperInvariant(),
        entity.OpcionesPregunta.Select(o => new OpcionPreguntaDto(o.IdOpcion, o.Literal, o.Texto, o.EsCorrecta)).ToList());

    public static ResultadoLeccionDto ToDto(this ResultadoLeccionDetalle entity) => new(
        entity.IdResultado,
        entity.IdLeccion,
        entity.LeccionTitulo,
        entity.IdEstudiante,
        entity.Nombres,
        entity.Apellidos,
        entity.TotalPreguntas,
        entity.PreguntasRespondidas,
        entity.RespuestasCorrectas,
        entity.RespuestasIncorrectas,
        entity.PuntajeObtenido,
        entity.PuntajeTotal,
        entity.Porcentaje,
        entity.Estado.ToString().ToUpperInvariant(),
        entity.FechaInicio,
        entity.FechaFinalizacion);

    public static DashboardDto ToDto(this DashboardResumen entity) => new(
        entity.TotalLecciones,
        entity.LeccionesActivas,
        entity.TotalEstudiantes,
        entity.TotalAsignaciones,
        entity.PreguntasPendientesEnvio);

    public static EnvioTelegramDto ToDto(this EnvioTelegram entity) => new(
        entity.IdEnvio,
        entity.IdLeccion,
        entity.IdPregunta,
        entity.IdEstudiante,
        entity.EstadoEnvio.ToString().ToUpperInvariant(),
        entity.FechaEnvio);

    public static RespuestaEstudianteDto ToDto(this RespuestaEstudiante entity) => new(
        entity.IdRespuesta,
        entity.IdEnvio,
        entity.IdEstudiante,
        entity.IdPregunta,
        entity.RespuestaTexto,
        entity.EsCorrecta,
        entity.PuntajeObtenido,
        entity.FechaRespuesta);

    public static SolicitudIaDto ToDto(this SolicitudIa entity) => new(
        entity.IdSolicitudIa,
        entity.IdDocente,
        entity.IdLeccion,
        entity.Proveedor,
        entity.Estado.ToString().ToUpperInvariant(),
        entity.FechaSolicitud);
}
