# Carga inicial de información académica

Las importaciones son manuales, requieren iniciar sesión y respetan los
permisos de cada módulo. No se cargan archivos automáticamente al iniciar la
plataforma. Los documentos fuente no se versionan en este repositorio.

## Fuentes con mecanismo de importación

| Fuente / entidad | Formato admitido | Ubicación en la plataforma | Revisión antes de guardar |
| --- | --- | --- | --- |
| Estudiantes y matrículas | CSV UTF-8 separado por `;` o `,` | Estudiantes | Descarga una plantilla; el semestre y los NRC deben existir. |
| Nómina de profesores y asignaciones | CSV UTF-8 separado por `;` o `,` | Profesores y NRC | Descarga una plantilla; reemplaza los NRC de ejemplo por NRC vigentes. |
| Horarios de asignaturas | CSV UTF-8 separado por `;` o `,` | Asignaturas | Descarga una plantilla; revisa NRC, día, bloque y sala antes de cargar. |
| Proyectos 2025–2026 | `proyectos 2025-2026.xlsx` | Proyectos | Vista previa con filas importables, errores, duplicados y advertencias. |
| Resultados académicos 2026 | `Epryma 2026.xlsx` | Resultados académicos | Vista previa y confirmación asíncrona. |
| Contratos de profesores por hora | `Planilla pagos PH 202620.xlsx` | Profesores | Vista previa y confirmación asíncrona. |

Las plantillas CSV se generan desde el contrato de cada importación. Sus filas
son ejemplos, no datos institucionales; los valores `NRC_EXISTENTE` deben
reemplazarse por NRC válidos del semestre correspondiente. La interfaz limita
estos CSV a 2 MB. Las planillas Excel se limitan a 12 MB y se procesan con
vista previa antes de confirmar.

## Fuente pendiente de definición

`FORMATO DE JUSTIFICACIONES Y TESIS.xlsx` reúne una hoja de tesistas y otra de
justificaciones de inasistencia. La segunda incluye datos de salud y otros
antecedentes personales. No existe un modelo de tesis/hitos académicos al que
mapear la primera hoja ni un mecanismo aprobado para importar el historial de
justificaciones de la segunda. Por minimización de datos y para evitar mezclar
registros históricos con el flujo operativo, estas hojas no se importan.

Antes de incorporarlas, la facultad debe definir el alcance de los registros
históricos, la finalidad, los campos necesarios, quién tendrá acceso, la
retención y el mecanismo de eliminación. Luego se debe validar el mapeo con la
unidad responsable de los datos. Esta decisión de alcance no sustituye la
revisión jurídica o institucional necesaria para el cumplimiento de la Ley
21.719.
