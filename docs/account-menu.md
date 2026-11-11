# Menú de cuenta y navegación

Se conserva el menú circular compacto original: radio de 88 px, arco de -140 a 30 grados y animación existente. Incluye dashboard, tema, idioma, perfil y cierre de sesión. Configuración se consulta desde Administración.

La posición del conjunto se limita al viewport dejando margen para botones, hover y foco. Al abrir se oculta únicamente el avatar de origen, conservando su espacio, para no mostrar dos avatares cuando el menú debe desplazarse hacia dentro de la pantalla. Al redimensionar se recalculan posición y límites. El cambio no estira la curva ni altera la distancia entre opciones.

Solicitudes de privacidad pertenece al grupo Administración de la sección Sistema, conservando los roles autorizados y las solicitudes propias de cada usuario. Los grupos del sidebar mantienen su comportamiento desplegable y el grupo de la ruta actual abierto.

Verificación: pruebas geométricas y de navegación, menú con y sin movimiento reducido y recorridos Chromium de escritorio, sidebar contraído y móvil, incluyendo redimensionamiento.
