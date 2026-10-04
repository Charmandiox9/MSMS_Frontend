import { renderToString } from 'react-dom/server';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useMounted } from './useMounted';

function Probe() {
  return <span>{useMounted() ? 'cliente' : 'servidor'}</span>;
}

describe('useMounted', () => {
  it('es false al renderizar en el servidor', () => {
    expect(renderToString(<Probe />)).toContain('servidor');
  });

  it('es true en el cliente', () => {
    expect(renderHook(() => useMounted()).result.current).toBe(true);
  });
});
