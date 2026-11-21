# Menú de cuenta y navegación

En el panel privado, Mi cuenta está al pie de la navegación y muestra el rol activo en el disparador. En móvil, se accede mediante Menú y el pie sigue visible mientras se desplaza la lista de módulos. La cabecera indica la ubicación y, en móvil, también muestra el nombre del rol.

El menú incluye Mi perfil, el rol actual, un interruptor de modo oscuro con sol y luna, un selector único de Español o English y Cerrar sesión al final. Si la cuenta tiene un solo rol, se muestra su nombre sin control desplegable. Si tiene varios, el nombre abre una lista anclada debajo de esa misma línea. El rol vigente aparece primero con el estado "En uso" y las alternativas quedan debajo. Elegir otra abre una confirmación compacta; el rol activo y sus permisos no cambian hasta confirmarla. Las preferencias de tema e idioma conservan su comportamiento actual.

Elegir otro idioma conserva la ruta, los parámetros y el fragmento de la URL. Confirmar otro rol conserva la vista cuando está disponible para ese rol. En el resto de los casos se abre Inicio con un aviso. Cerrar sesión abre una pantalla localizada de transición mientras termina la petición de cierre; al completarse, redirige al login. Si la petición falla, la pantalla explica el problema y permite reintentar. Los roles y permisos provienen de la sesión y el servidor sigue verificando el acceso.

Usar Tab para recorrer los controles y Escape para cerrar la capa actual y volver al disparador. El selector de rol usa radios nativos etiquetados y estados visuales con los tokens institucionales. Para las reglas visuales y responsive, consulta el [manual de diseño](../DESIGN.md).
