import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * `false` en el servidor y durante la hidratación, `true` en el cliente.
 * Evita diferencias de hidratación en lo que depende del navegador (tema,
 * localStorage) sin llamar a setState dentro de un efecto.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
