# Manual de diseño de MARSYS

MARSYS es una herramienta de trabajo de la Facultad de Ciencias del Mar de la UCN. La interfaz debe ayudar a cada persona a encontrar su módulo, entender el estado del trabajo y actuar con claridad. Las vistas públicas, el selector de rol y el panel comparten la paleta institucional; el formulario de acceso conserva su diseño actual.

## Bandeja y navegación

- **Escritorio.** La navegación principal queda a la izquierda. La cabecera del contenido indica la ubicación con migas de pan. La vista comienza con un título, el contexto que corresponda y hasta una acción principal por bloque.
- **Móvil.** El botón Menú abre la navegación. La lista de módulos puede desplazarse sin mover Mi cuenta del pie. El rol activo se puede leer con el menú cerrado.
- **Mi cuenta.** La entrada queda en el pie del lateral y muestra el rol debajo del nombre. Dentro del menú, quien tiene un solo rol ve su nombre sin control desplegable; quien tiene varios abre la lista desde esa misma línea y ve el rol vigente primero, marcado como "En uso". Las alternativas aparecen debajo en un desplegable anclado al rol. Elegir otro pide confirmación antes de aplicarlo. El menú conserva los controles de Tema e Idioma y separa Cerrar sesión al final. Cerrar sesión muestra una transición breve mientras se elimina la sesión y luego lleva al login.
- **Preferencias.** El interruptor Modo oscuro usa sol y luna como iconos de línea y mantiene una etiqueta estable. La primera visita sigue la preferencia del sistema y una elección explícita se conserva. El idioma muestra Español y English como dos opciones visibles con una sola selección. Usar los nombres de los idiomas, con texto y estado perceptibles por teclado y lector de pantalla.
- **Cambio de rol.** Usar la misma lista de selección de roles que aparece al iniciar una sesión con varios roles. En Mi cuenta, mantener activo el rol actual mientras se revisa la lista y aplicar otro solo tras confirmación explícita. Conservar la vista si sigue disponible; si requiere otro permiso, volver a Inicio con un aviso. Los permisos siguen verificados por el servidor. Configuración institucional pertenece a Administración.

La distribución facilita distinguir la navegación de trabajo de las preferencias personales y reserva espacio para listados y expedientes. Los detalles de interacción están en [Menú de cuenta](docs/account-menu.md).

## Paleta aprobada

Claro con acento verde petróleo. Oscuro con superficies gris ceniza y acento lavanda. La fuente de los valores es [globals.css](src/app/globals.css). Las vistas de producto usan `.institutional-theme`; el formulario de acceso conserva su tratamiento visual actual y la preferencia de tema la gestiona `next-themes`. La ilustración del login conserva sus tonos marinos originales mediante tokens `--illustration-*`; en escritorio se extiende detrás de la sección de acceso, que usa superficies translúcidas, pero no atraviesa visualmente la tarjeta de ingreso. La ruta pública mantiene visible el login mientras revisa en segundo plano si ya existe una sesión.

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
| Skeleton | `--skeleton` | `#DFE6E9` | `#38393C` |
| Capas modales | `--overlay` | `rgba(20, 43, 65, 0.55)` | `rgba(10, 11, 13, 0.72)` |
| Series de gráficos | `--chart-series-*` | Paleta institucional definida en tokens | Variaciones ceniza y lavanda definidas en tokens |

Usar la proporción 60/30/10 como referencia visual. Los fondos dominan, las superficies de apoyo agrupan y el acento marca acciones o selección. Consumir los tokens mediante clases semánticas en lugar de valores directos. Éxito, advertencia, peligro e información tienen sus propios pares de texto y superficie. Un estado se reconoce por su etiqueta y, cuando corresponda, por un icono además del color.

En `.institutional-theme`, `secondary` es una superficie de apoyo y `accent` representa la superficie de selección; sus tonos son suaves y no sirven como color de primer plano. No usar `text-secondary` ni `text-accent` para texto o iconos. Sobre esas superficies, usar `text-secondary-foreground` o `text-accent-foreground`. Para iconos y texto de estado, usar el par semántico correspondiente (`success`, `warning`, `danger` o `info`); para iconos neutrales, usar `primary`, `foreground` o `muted-foreground` según su jerarquía. Verificar que cada primer plano mantenga contraste suficiente en ambos temas.

## Tipografía, espacio y controles

- Usar Geist Sans y un tamaño base de 16 px para lectura. Como referencia para pantallas nuevas, usar 28–32 px para el título, 20 px para sección y 14 px para datos secundarios. Reservar la tipografía monoespaciada para información que se beneficie de ella.
- Separar con una escala de 4, 8, 12, 16, 24 y 32 px. Usar radios de 8 px en controles y 12 px en paneles como referencia. Dar más espacio entre secciones que entre elementos de un mismo grupo.
- Mantener áreas táctiles de al menos 44 px para acciones en móvil. Cada control tiene foco visible, etiqueta y estados predecibles. Usar iconos vectoriales de línea y conservar el acceso con teclado. Respetar la preferencia de movimiento reducido.
- La bienvenida tras autenticación muestra el nombre completo en su propia línea, el rol y tres capacidades concretas de ese perfil. Normalizar espacios repetidos y permitir que nombres largos se ajusten en varias líneas sin recortarlos. El panel de inicio se monta detrás y la bienvenida espera las tareas iniciales del rol: alertas, métricas, presupuesto, periodo académico y bandeja, según corresponda. Los términos pendientes se presentan antes de abrir el panel. La bienvenida sale con una transición de opacidad y escala de 240 ms; con movimiento reducido conserva solo la opacidad. No representa un porcentaje de progreso.
- El calamar se carga bajo demanda, se limita a escritorio en el login y pausa cuando queda fuera de vista. En escritorio, el fondo ilustrado se funde suavemente entre columnas y el calamar continúa bajo el velo translúcido de la sección de acceso. La tarjeta conserva una superficie opaca para mantener el contraste.
- Una acción principal por vista o bloque de decisión, con verbo y objeto. Distinguir acciones secundarias y destructivas. Confirmar una acción destructiva cuando sus consecuencias no puedan deshacerse.

En las tarjetas de Inicio, usar 16 px para la etiqueta, 24 px para la cifra y 14 px para su descripción. Una cifra pendiente puede usar la superficie semántica de advertencia. Los errores usan la superficie de peligro, icono y acción visible. Mantener el fondo de tarjeta neutro para los indicadores sin alerta.

## Modelos base

Los modelos son referencias de composición. Cada módulo define sus datos, permisos, acciones y reglas del proceso. Reutilizar los componentes disponibles y extraer una variante común cuando haya coincidencia entre usos reales. Las series de gráfico usan exclusivamente `--chart-series-*`; no reutilizar colores de estado como decoración.

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
