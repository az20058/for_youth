export interface CrawlResult {
  namuWiki: string | null;
  newsHeadlines: string[];
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchNamuWiki(companyName: string): Promise<string | null> {
  // 기업 동음이의어 페이지 우선 시도, 없으면 일반 페이지
  const candidates = [
    `${companyName} (기업)`,
    companyName,
  ];

  for (const name of candidates) {
    try {
      const res = await fetch(
        `https://namu.wiki/raw/${encodeURIComponent(name)}`,
        { headers: { 'User-Agent': BROWSER_UA }, signal: timeoutSignal(8000) },
      );
      if (!res.ok) continue;
      const text = await res.text();
      return text.slice(0, 3000);
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchGoogleNews(companyName: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=ko&gl=KR`,
      { headers: { 'User-Agent': BROWSER_UA }, signal: timeoutSignal(8000) },
    );
    if (!res.ok) return [];
    const xml = await res.text();
    return [...xml.matchAll(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/g)]
      .map((m) => m[1])
      .filter((t) => !t.includes('Google 뉴스'))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function crawlCompanyInfo(companyName: string): Promise<CrawlResult> {
  const [namuWiki, newsHeadlines] = await Promise.all([
    fetchNamuWiki(companyName),
    fetchGoogleNews(companyName),
  ]);
  return { namuWiki, newsHeadlines };
}
