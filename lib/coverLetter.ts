export interface SpellingError {
  original: string;
  suggestion: string;
  startIndex: number;
  endIndex: number;
  message: string;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function countCharactersWithoutSpaces(text: string): number {
  return text.replace(/\s/g, '').length;
}
