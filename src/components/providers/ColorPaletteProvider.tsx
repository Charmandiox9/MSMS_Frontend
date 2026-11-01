'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ColorPalette = 'ocean' | 'marine' | 'coral';

type ColorPaletteContextValue = {
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
};

const STORAGE_KEY = 'MARSYS_COLOR_PALETTE';
const ColorPaletteContext = createContext<ColorPaletteContextValue | null>(null);

function isColorPalette(value: string | null): value is ColorPalette {
  return value === 'ocean' || value === 'marine' || value === 'coral';
}

export function ColorPaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<ColorPalette>('ocean');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedPalette = window.localStorage.getItem(STORAGE_KEY);
      if (isColorPalette(savedPalette)) setPalette(savedPalette);
    } catch {
      setPalette('ocean');
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, palette);
    } catch {
      return;
    }
  }, [palette, hydrated]);

  return (
    <ColorPaletteContext.Provider value={{ palette, setPalette }}>
      {children}
    </ColorPaletteContext.Provider>
  );
}

export function useColorPalette() {
  const context = useContext(ColorPaletteContext);
  if (!context) throw new Error('useColorPalette debe usarse dentro de ColorPaletteProvider');
  return context;
}
