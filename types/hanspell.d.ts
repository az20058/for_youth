import type { RawTypo } from '../lib/coverLetter';

declare module 'hanspell' {
  export function spellCheckByDAUM(
    sentence: string,
    timeout: number,
    check: (typos: RawTypo[]) => void,
    end?: () => void,
    error?: (err: Error) => void,
  ): void;

  export function spellCheckByPNU(
    sentence: string,
    timeout: number,
    check: (typos: RawTypo[]) => void,
    end?: () => void,
    error?: (err: Error) => void,
  ): void;
}
