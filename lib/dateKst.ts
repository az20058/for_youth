const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function todayKstStart(): Date {
  const nowMs = Date.now();
  const kstMs = nowMs + KST_OFFSET_MS;
  const dayStartKstMs = Math.floor(kstMs / 86400000) * 86400000;
  return new Date(dayStartKstMs - KST_OFFSET_MS);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

export function kstDateKey(d: Date): string {
  const kst = new Date(d.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

export function isSameKstDay(a: Date, b: Date): boolean {
  return kstDateKey(a) === kstDateKey(b);
}
