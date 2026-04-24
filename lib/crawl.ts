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

/** 네이버 웹검색 API로 기업 관련 정보를 가져온다 */
async function fetchWebSearch(companyName: string): Promise<string | null> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const query = `${companyName} 기업 회사`;
    const res = await fetch(
      `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=5`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        signal: timeoutSignal(5000),
      },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      items?: { title: string; description: string }[];
    };

    const snippets = (data.items ?? [])
      .map((item) => {
        const title = item.title.replace(/<[^>]+>/g, '');
        const desc = item.description.replace(/<[^>]+>/g, '');
        return `${title}: ${desc}`;
      })
      .filter(Boolean)
      .slice(0, 5);

    return snippets.length > 0 ? snippets.join('\n') : null;
  } catch {
    return null;
  }
}

/** 네이버 뉴스 검색 API */
async function fetchNaverNews(companyName: string): Promise<string[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return [];

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(companyName)}&display=10&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        signal: timeoutSignal(5000),
      },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as {
      items?: { title: string }[];
    };

    return (data.items ?? [])
      .map((item) => item.title.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
      .slice(0, 10);
  } catch {
    return [];
  }
}

/** Google News RSS */
async function fetchGoogleNews(companyName: string): Promise<string[]> {
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
  const [corpInfo, webSnippets, naverNews, googleNews] = await Promise.all([
    fetchCorpInfo(companyName),
    fetchWebSearch(companyName),
    fetchNaverNews(companyName),
    fetchGoogleNews(companyName),
  ]);

  // 네이버 + 구글 뉴스 합치고 중복 제거
  const seen = new Set<string>();
  const newsHeadlines: string[] = [];
  for (const title of [...naverNews, ...googleNews]) {
    if (!seen.has(title)) {
      seen.add(title);
      newsHeadlines.push(title);
    }
  }

  return { corpInfo, webSnippets, newsHeadlines: newsHeadlines.slice(0, 15) };
}
