using Comprendo.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Comprendo.Infrastructure.Persistence;

public class ComprendoDbContext(DbContextOptions<ComprendoDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Docente> Docentes => Set<Docente>();
    public DbSet<Estudiante> Estudiantes => Set<Estudiante>();
    public DbSet<AnioLectivo> AniosLectivos => Set<AnioLectivo>();
    public DbSet<Nivel> Niveles => Set<Nivel>();
    public DbSet<Paralelo> Paralelos => Set<Paralelo>();
    public DbSet<Curso> Cursos => Set<Curso>();
    public DbSet<Materia> Materias => Set<Materia>();
    public DbSet<DocenteCursoMateria> DocenteCursoMaterias => Set<DocenteCursoMateria>();
    public DbSet<EstudianteCurso> EstudianteCursos => Set<EstudianteCurso>();
    public DbSet<EstudianteMateria> EstudianteMaterias => Set<EstudianteMateria>();
    public DbSet<Leccion> Lecciones => Set<Leccion>();
    public DbSet<Pregunta> Preguntas => Set<Pregunta>();
    public DbSet<OpcionPregunta> OpcionesPregunta => Set<OpcionPregunta>();
    public DbSet<EnvioTelegram> EnviosTelegram => Set<EnvioTelegram>();
    public DbSet<RespuestaEstudiante> RespuestasEstudiantes => Set<RespuestaEstudiante>();
    public DbSet<ResultadoLeccion> ResultadosLeccion => Set<ResultadoLeccion>();
    public DbSet<SolicitudIa> SolicitudesIa => Set<SolicitudIa>();
    public DbSet<SesionUsuario> SesionesUsuario => Set<SesionUsuario>();
    public DbSet<AuditoriaEvento> AuditoriaEventos => Set<AuditoriaEvento>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ComprendoDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
