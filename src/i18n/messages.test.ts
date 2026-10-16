import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import es from '../../messages/es.json';

type Messages = { [key: string]: string | Messages };

function flatten(messages: Messages, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [key, value] of Object.entries(messages)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') entries.set(path, value);
    else for (const [nested, text] of flatten(value, path)) entries.set(nested, text);
  }
  return entries;
}

function placeholders(text: string): string[] {
  // Nombres de argumentos ICU: {name}, {count, plural, ...}
  return [...text.matchAll(/\{\s*([A-Za-z_]\w*)\s*[,}]/g)].map(([, name]) => name).sort();
}

const esKeys = flatten(es as Messages);
const enKeys = flatten(en as Messages);

describe('traducciones', () => {
  it('español e inglés tienen las mismas claves', () => {
    const missingInEn = [...esKeys.keys()].filter((key) => !enKeys.has(key));
    const missingInEs = [...enKeys.keys()].filter((key) => !esKeys.has(key));

    expect({ missingInEn, missingInEs }).toEqual({ missingInEn: [], missingInEs: [] });
  });

  it('los textos usan los mismos parámetros en ambos idiomas', () => {
    const mismatched = [...esKeys]
      .filter(([key]) => enKeys.has(key))
      .filter(([key, text]) => placeholders(text).join() !== placeholders(enKeys.get(key)!).join())
      .map(([key]) => key);

    expect(mismatched).toEqual([]);
  });

  it('no hay textos vacíos', () => {
    const empty = [...esKeys, ...enKeys].filter(([, text]) => !text.trim()).map(([key]) => key);

    expect(empty).toEqual([]);
  });
});
