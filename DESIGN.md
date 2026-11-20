# Manual de diseño de MARSYS

MARSYS es una herramienta de trabajo de la Facultad de Ciencias del Mar de la UCN. El panel debe ayudar a cada persona a encontrar su módulo, entender el estado del trabajo y actuar con claridad. Este manual define el diseño del panel privado. El acceso y las páginas públicas conservan su identidad y sus reglas propias.

## Bandeja y navegación

- **Escritorio.** La navegación principal queda a la izquierda. La cabecera del contenido indica la ubicación con migas de pan. La vista comienza con un título, el contexto que corresponda y hasta una acción principal por bloque.
- **Móvil.** El botón Menú abre la navegación. La lista de módulos puede desplazarse sin mover Mi cuenta del pie. El rol activo se puede leer con el menú cerrado.
- **Mi cuenta.** La entrada queda en el pie del lateral y muestra el rol debajo del nombre. El menú reúne Mi perfil, Cambiar rol cuando hay más de uno asignado, Tema, Idioma y Cerrar sesión. La salida queda separada al final. El selector de roles se abre desde esa misma cuenta y marca el rol activo.
- **Preferencias.** El interruptor Modo oscuro usa sol y luna como iconos de línea y mantiene una etiqueta estable. La primera visita sigue la preferencia del sistema y una elección explícita se conserva. El idioma muestra Español y English como dos opciones visibles con una sola selección. Usar los nombres de los idiomas, con texto y estado perceptibles por teclado y lector de pantalla.
- **Cambio de rol.** Conservar la vista si sigue disponible. Si el nuevo rol requiere otra vista, volver a Inicio con un aviso. Los permisos siguen verificados por el servidor. Configuración institucional pertenece a Administración.

La distribución facilita distinguir la navegación de trabajo de las preferencias personales y reserva espacio para listados y expedientes. Los detalles de interacción están en [Menú de cuenta](docs/account-menu.md).

## Paleta aprobada

Claro con acento verde petróleo. Oscuro con superficies gris ceniza y acento lavanda. La fuente de los valores es [globals.css](src/app/globals.css). El ámbito del panel es `.dashboard-workspace` y la preferencia la gestiona `next-themes`.

| Uso | Token | Claro | Oscuro |
|---|---|---|---|
| Fondo de la vista | `--background` | `#EEF3F5` | `#1B1C1E` |
| Paneles y diálogos | `--card` | `#FFFFFF` | `#242527` |
| Superficie de apoyo | `--muted` | `#F5F8F9` | `#2D2E30` |
| Texto principal | `--foreground` | `#142B41` | `#F2F1F0` |
| Texto secundario | `--muted-foreground` | `#526978` | `#BABBC0` |
| Acción principal | `--primary` / `--primary-foreground` | `#075E66` / `#FFFFFF` | `#C9B9EA` / `#24202B` |
| Selección | `--selection` | `#DFEFEE` | `#393340` |
| Borde de control y foco | `--control` / `--focus` | `#768B97` / `#0A6B75` | `#84858A` / `#DDCEF9` |

Usar la proporción 60/30/10 como referencia visual. Los fondos dominan, las superficies de apoyo agrupan y el acento marca acciones o selección. Consumir los tokens mediante clases semánticas en lugar de valores directos. Éxito, advertencia, peligro e información tienen sus propios pares de texto y superficie. Un estado se reconoce por su etiqueta y, cuando corresponda, por un icono además del color.

## Tipografía, espacio y controles

- Usar Geist Sans y un tamaño base de 16 px para lectura. Como referencia para pantallas nuevas, usar 28–32 px para el título, 20 px para sección y 14 px para datos secundarios. Reservar la tipografía monoespaciada para información que se beneficie de ella.
- Separar con una escala de 4, 8, 12, 16, 24 y 32 px. Usar radios de 8 px en controles y 12 px en paneles como referencia. Dar más espacio entre secciones que entre elementos de un mismo grupo.
- Mantener áreas táctiles de al menos 44 px para acciones en móvil. Cada control tiene foco visible, etiqueta y estados predecibles. Usar iconos vectoriales de línea y conservar el acceso con teclado. Respetar la preferencia de movimiento reducido.
- Una acción principal por vista o bloque de decisión, con verbo y objeto. Distinguir acciones secundarias y destructivas. Confirmar una acción destructiva cuando sus consecuencias no puedan deshacerse.

## Modelos base

Los modelos son referencias de composición. Cada módulo define sus datos, permisos, acciones y reglas del proceso. Reutilizar los componentes disponibles y extraer una variante común cuando haya coincidencia entre usos reales.

| Modelo | Estructura compartida | Ejemplo de adaptación |
|---|---|---|
| **Inicio por rol** | Periodo, prioridades, resumen y accesos frecuentes. | El Analista ve alertas presupuestarias arriba de indicadores e informes. Apoyo Docente prioriza la bandeja de solicitudes. |
| **Listado** | Cabecera, filtros pertinentes, resultados, paginación si aplica y estados de carga, vacío y error. | Justificaciones muestra estado, asignatura y fecha de inasistencia. Titulaciones distingue etapa, resultado y documentos. Al salir de una ficha y volver, procurar conservar la búsqueda, los filtros y la posición. |
| **Expediente** | Identificación, estado, próxima acción si aplica y detalle por secciones. | Una justificación reúne respaldo y resolución. Una titulación reúne etapa, resultado académico, documentos e historial. |

Buscar primero `DashboardPageHeader`, `SearchField`, `FilterTabs`, `PaginationControls`, `StatusBadge`, `Skeleton` y `Modal` / `FormModal`. Los formularios deben conservar los datos tras un error, indicar qué corregir y confirmar cuándo terminó la operación. Un formulario corto puede usar diálogo. Un proceso largo puede usar una vista con secciones.

Las alertas presupuestarias deben distinguir carga, ausencia de avisos y error. El indicador vigente representa presupuesto asignado frente al total para los destinatarios configurados. Si se añade caja, identificar su fuente y distinguir estimaciones de pagos realizados.

## Revisión de un cambio

- Identificar el modelo base y la tarea principal. Documentar una excepción cuando el flujo la necesita.
- Revisar escritorio y reflujo a 320 px, tema claro y oscuro, Español y English, orden de foco y uso con teclado.
- Comprobar carga, vacío, error y éxito según el flujo. Conservar el acceso y los permisos existentes, y mostrar solo la información necesaria.
- Ejecutar lint, pruebas y build antes de entregar. Actualizar este manual cuando cambie una decisión compartida.
