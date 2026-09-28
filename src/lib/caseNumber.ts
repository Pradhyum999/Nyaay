/**
 * Case-number normaliser (Postel's Law)
 * Normalises varied inputs (e.g. "CC 4128/2026", "CC/4128/2026", "cc4128 2026") into "CC/4128/2026"
 */
export function normaliseCaseNumber(raw: string): string {
  if (!raw) return '';
  const s = raw.trim().toUpperCase().replace(/[.\s]+/g, ' ');
  const m = s.match(/^([A-Z().\- ]+?)[\s/\-]*(\d{1,6})[\s/\-]*(\d{4})$/);
  return m ? `${m[1].trim().replace(/\s+/g, '')}/${m[2]}/${m[3]}` : s;
}

export function compareCaseNumbers(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return normaliseCaseNumber(a) === normaliseCaseNumber(b);
}
