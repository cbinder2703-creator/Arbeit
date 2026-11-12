// Findet alle Prüfungen in content/pruefungen/<id>/ – neue Ordner erscheinen automatisch.
import { parsePruefung } from './parse';
import type { Pruefung } from './parse';

const modules = import.meta.glob('/content/pruefungen/*/*.json', { eager: true, import: 'default' }) as Record<
  string,
  unknown
>;

export interface LoadResult {
  pruefungen: Pruefung[];
  errors: string[];
}

export function loadFromModules(mods: Record<string, unknown>): LoadResult {
  const folders = new Map<string, Record<string, unknown>>();
  for (const [path, json] of Object.entries(mods)) {
    const m = path.match(/\/content\/pruefungen\/([^/]+)\/([^/]+\.json)$/);
    if (!m) continue;
    const [, folder, file] = m;
    if (!folders.has(folder)) folders.set(folder, {});
    folders.get(folder)![file] = json;
  }
  const pruefungen: Pruefung[] = [];
  const errors: string[] = [];
  for (const [folder, files] of folders) {
    if (!('pruefung.json' in files)) continue; // Ordner ohne pruefung.json ignorieren
    const res = parsePruefung(folder, files['pruefung.json'], files);
    if (res.pruefung) pruefungen.push(res.pruefung);
    else errors.push(...res.errors);
  }
  return { pruefungen, errors };
}

const loaded = loadFromModules(modules);
if (loaded.errors.length) console.error('Inhaltsfehler:\n' + loaded.errors.join('\n'));

export const alleErrors = loaded.errors;
export const allePruefungen: Pruefung[] = loaded.pruefungen;

export function getPruefung(id: string | undefined): Pruefung | undefined {
  return allePruefungen.find((p) => p.meta.id === id);
}
