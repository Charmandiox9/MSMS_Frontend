# Formularios en diálogos

Los formularios emergentes deben usar `FormModal` en lugar de `Modal`. `FormModal` reutiliza el diseño común y protege los cambios pendientes al cerrar con la X, pulsar Escape, hacer clic fuera o usar una acción de cancelación.

El diálogo detecta cambios de campos nativos y botones dentro de un formulario. Las acciones de cancelación deben llevar `data-modal-dismiss` para pasar por la confirmación común. Los botones que cambian estado sin usar campos, por ejemplo seleccionar una tarifa existente, deben llevar `data-modal-dirty`.

La confirmación permite continuar editando o descartar los cambios. No guarda borradores en el navegador. Al completar y guardar correctamente, el flujo debe cerrar el diálogo. Si un flujo permite varios guardados sin cerrarse, debe volver a montar `FormModal` tras un guardado correcto para restablecer su estado de cambios pendientes.

Usa `Modal` para diálogos de consulta, detalles y confirmaciones que no contengan cambios de formulario. Los formularios insertados directamente en páginas deben resolver por separado la protección frente a navegación; no se deben convertir en diálogos solo para reutilizar esta protección.
