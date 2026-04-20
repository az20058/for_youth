export interface SpellingError {
  original: string;
  suggestion: string;
  startIndex: number;
  endIndex: number;
  message: string;
}

export interface Typo {
  token: string;
  suggestions: string[];
  info?: string;
  start: number;
  end: number;
}

export interface RawTypo {
  token: string;
  suggestions: string[];
  info?: string;
  type: string;
  context: string;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function countCharactersWithoutSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}

export function calculateTypoPositions(text: string, rawTypos: RawTypo[]): Typo[] {
  const result: Typo[] = [];
  let searchFrom = 0;

  for (const typo of rawTypos) {
    const start = text.indexOf(typo.token, searchFrom);
    if (start === -1) continue;
    const end = start + typo.token.length;
    result.push({
      token: typo.token,
      suggestions: typo.suggestions,
      info: typo.info,
      start,
      end,
    });
    searchFrom = end;
  }

  return result;
}

export function applyCorrections(
  text: string,
  corrections: Record<number, string>,
  typos: Typo[],
): string {
  const sorted = typos
    .filter((t) => corrections[t.start] !== undefined)
    .sort((a, b) => b.start - a.start);

  let result = text;
  for (const typo of sorted) {
    result = result.slice(0, typo.start) + corrections[typo.start] + result.slice(typo.end);
  }
  return result;
}
