declare module 'hanspell' {
  export function spellCheckByDAUM(
    sentence: string,
    timeout: number,
    check: (typos: import('../lib/coverLetter').RawTypo[]) => void,
    end?: () => void,
    error?: (err: Error) => void,
  ): void;

  export function spellCheckByPNU(
    sentence: string,
    timeout: number,
    check: (typos: import('../lib/coverLetter').RawTypo[]) => void,
    end?: () => void,
    error?: (err: Error) => void,
  ): void;
}
