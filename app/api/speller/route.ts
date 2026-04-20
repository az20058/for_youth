import { NextRequest, NextResponse } from 'next/server';
import { spellCheckByDAUM } from 'hanspell';
import type { RawTypo } from '@/lib/coverLetter';
import { calculateTypoPositions } from '@/lib/coverLetter';

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  return new Promise<NextResponse>((resolve) => {
    const collected: RawTypo[] = [];

    spellCheckByDAUM(
      text,
      6000,
      (typos: RawTypo[]) => {
        collected.push(...typos);
      },
      () => {
        const typos = calculateTypoPositions(text, collected);
        resolve(NextResponse.json({ typos }));
      },
      (err: Error) => {
        console.error('hanspell error:', err);
        resolve(NextResponse.json({ error: '맞춤법 검사 실패' }, { status: 500 }));
      },
    );
  });
}
