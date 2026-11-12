// npm run validate-content – prüft ALLE Prüfungen in content/pruefungen/ gegen das zod-Schema
// und gegen inhaltliche Regeln (IDs, Antwort-Indizes, Kategorien, Lücken, Abzeichen …).
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parsePruefung } from '../src/content/parse';

const root = resolve(process.cwd(), 'content/pruefungen');
const modesDir = resolve(process.cwd(), 'src/modes');
let failed = false;

const modeIds = existsSync(modesDir)
  ? readdirSync(modesDir).filter((d) => statSync(join(modesDir, d)).isDirectory())
  : [];

const folders = existsSync(root)
  ? readdirSync(root).filter((d) => statSync(join(root, d)).isDirectory() && !d.startsWith('_'))
  : [];

if (folders.length === 0) {
  console.error('✗ Keine Prüfungen in content/pruefungen/ gefunden.');
  process.exit(1);
}

for (const folder of folders) {
  const dir = join(root, folder);
  const metaPath = join(dir, 'pruefung.json');
  if (!existsSync(metaPath)) {
    console.error(`✗ ${folder}: pruefung.json fehlt`);
    failed = true;
    continue;
  }
  const read = (p: string): unknown => JSON.parse(readFileSync(p, 'utf8'));
  let meta: unknown;
  const files: Record<string, unknown> = {};
  try {
    meta = read(metaPath);
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'pruefung.json')) {
      files[f] = read(join(dir, f));
    }
  } catch (e) {
    console.error(`✗ ${folder}: JSON nicht lesbar – ${(e as Error).message}`);
    failed = true;
    continue;
  }
  const res = parsePruefung(folder, meta, files);
  const errors = [...res.errors];
  const m = meta as { modes?: unknown };
  if (Array.isArray(m.modes)) {
    for (const id of m.modes) {
      if (modeIds.length && !modeIds.includes(String(id))) errors.push(`${folder}/pruefung.json: Modus "${id}" existiert nicht in src/modes/`);
    }
  }
  if (errors.length) {
    failed = true;
    console.error(`✗ ${folder}`);
    errors.forEach((e) => console.error('   - ' + e));
  } else if (res.pruefung) {
    const items = res.pruefung.chapters.reduce((n, c) => n + c.items.length, 0);
    const cards = res.pruefung.chapters.reduce((n, c) => n + c.flashcards.length, 0);
    console.log(`✓ ${folder}: ${res.pruefung.chapters.length} Kapitel, ${items} Aufgaben, ${cards} Lernkarten`);
  }
  res.warnings.forEach((w) => console.warn('   ! ' + w));
}

if (failed) {
  console.error('\nvalidate-content: FEHLER');
  process.exit(1);
}
console.log('\nvalidate-content: alles in Ordnung.');
