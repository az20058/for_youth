export interface CrawlResult {
  corpInfo: string | null;
  webSnippets: string | null;
  newsHeadlines: string[];
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/** 금융위원회 기업기본정보 API에서 기업 데이터를 가져온다 */
async function fetchCorpInfo(companyName: string): Promise<string | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService/getCorpOutline` +
      `?serviceKey=${encodeURIComponent(apiKey)}` +
      `&corpNm=${encodeURIComponent(companyName)}` +
      `&numOfRows=1&pageNo=1&resultType=json`;

    const res = await fetch(url, { signal: timeoutSignal(5000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      response?: {
        body?: {
          totalCount?: number;
          items?: { item?: Record<string, string>[] };
        };
      };
    };

    const items = data?.response?.body?.items?.item;
    if (!items || items.length === 0) return null;

    const corp = items[0];
    const lines = [
      corp.corpNm && `기업명: ${corp.corpNm}`,
      corp.enpRprFnm && `대표자: ${corp.enpRprFnm}`,
      corp.indutyNm && `업종: ${corp.indutyNm}`,
      corp.enpBsadr && `주소: ${corp.enpBsadr}`,
      corp.enpHmpgUrl && `홈페이지: ${corp.enpHmpgUrl}`,
      corp.enpEstbDt && `설립일: ${corp.enpEstbDt}`,
      corp.enpEmpeCnt && `직원수: ${corp.enpEmpeCnt}명`,
    ].filter(Boolean);

    return lines.length > 0 ? lines.join('\n') : null;
  } catch {
    return null;
  }
}

/** DuckDuckGo에서 기업 관련 웹 검색 스니펫을 가져온다 */
async function fetchWebSearch(companyName: string): Promise<string | null> {
  try {
    const query = `${companyName} 기업 회사 채용`;
    const res = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
      {
        method: 'POST',
        headers: {
          'User-Agent': BROWSER_UA,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `q=${encodeURIComponent(query)}`,
        signal: timeoutSignal(8000),
      },
    );
    if (!res.ok) return null;
    const html = await res.text();

    const snippets = [...html.matchAll(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim())
      .filter(Boolean)
      .slice(0, 5);

    return snippets.length > 0 ? snippets.join('\n') : null;
  } catch {
    return null;
  }
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
  const [corpInfo, webSnippets, newsHeadlines] = await Promise.all([
    fetchCorpInfo(companyName),
    fetchWebSearch(companyName),
    fetchGoogleNews(companyName),
  ]);
  return { corpInfo, webSnippets, newsHeadlines };
}
