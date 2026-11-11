# Vista de mallas curriculares

Cada tarjeta de Carrera ofrece Ver malla a quienes pueden consultar el módulo. El modal permite seleccionar la cohorte y muestra una columna por año: semestre impar arriba y par abajo, con las asignaturas registradas en recuadros. Las filas compartidas mediante CSS subgrid alinean ambos bloques entre años, incluso cuando tienen distinta cantidad de asignaturas.

La cohorte más reciente se selecciona al abrir; cambiarla no modifica datos. Los estados vacíos se distinguen entre carrera sin mallas, malla sin asignaturas y semestre sin asignaturas. El área de la malla permite desplazamiento horizontal y foco de teclado en pantallas pequeñas. El modal conserva el cierre por Escape, la trampa de foco y el retorno al botón de apertura.

La referencia visual orienta la distribución; los nombres y semestres provienen del backend. No se deducen prerrequisitos ni se incorporan asignaturas de la imagen.

Verificación: pruebas de componente de Carreras y CurriculumViewer, paridad de traducciones, build y dos recorridos Playwright con la misma malla de prueba (escritorio claro y móvil oscuro). Estos comprueban alineación de semestres, desplazamiento sin desbordar la página, cierre y retorno del foco.
