export interface CrawlResult {
  namuWiki: string | null;
  newsHeadlines: string[];
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}

export async function fetchNamuWiki(companyName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://namu.wiki/raw/${encodeURIComponent(companyName)}`,
      { signal: timeoutSignal(8000) },
    );
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 3000);
  } catch {
    return null;
  }
}

export async function fetchGoogleNews(companyName: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=ko&gl=KR`,
      { signal: timeoutSignal(8000) },
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
