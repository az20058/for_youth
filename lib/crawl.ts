export interface CrawlResult {
  corpInfo: string | null;
  webSnippets: string | null;
  newsHeadlines: string[];
  sourceUrls: string[];
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
      `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2` +
      `?serviceKey=${encodeURIComponent(apiKey)}` +
      `&corpNm=${encodeURIComponent(companyName)}` +
      `&numOfRows=5&pageNo=1&resultType=json`;

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

    // 정확히 일치하는 기업명만 사용 (유사 기업 혼동 방지)
    const corp = items.find((i) => i.corpNm === companyName);
    if (!corp) return null;
    const lines = [
      corp.corpNm && `기업명: ${corp.corpNm}`,
      corp.enpRprFnm && `대표자: ${corp.enpRprFnm}`,
      corp.enpMainBizNm && `업종: ${corp.enpMainBizNm}`,
      corp.enpBsadr && `주소: ${corp.enpBsadr}`,
      corp.enpHmpgUrl && `홈페이지: ${corp.enpHmpgUrl}`,
      corp.enpEstbDt && `설립일: ${corp.enpEstbDt}`,
      corp.enpEmpeCnt && corp.enpEmpeCnt !== '0' && `직원수: ${corp.enpEmpeCnt}명`,
    ].filter(Boolean);

    return lines.length > 0 ? lines.join('\n') : null;
  } catch {
    return null;
  }
}

interface WebSearchResult {
  snippets: string | null;
  urls: string[];
}

/** 네이버 웹검색 API로 기업 관련 정보를 가져온다 */
async function fetchWebSearch(companyName: string): Promise<WebSearchResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { snippets: null, urls: [] };

  try {
    const query = `"${companyName}"`;
    const res = await fetch(
      `https://openapi.naver.com/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=10`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        signal: timeoutSignal(5000),
      },
    );
    if (!res.ok) return { snippets: null, urls: [] };

    const data = (await res.json()) as {
      items?: { title: string; description: string; link: string }[];
    };

    const items = data.items ?? [];
    // 회사명이 제목이나 설명에 포함된 결과만 사용 (유사 기업 혼동 방지)
    const filtered = items.filter((item) => {
      const title = item.title.replace(/<[^>]+>/g, '');
      const desc = item.description.replace(/<[^>]+>/g, '');
      return title.includes(companyName) || desc.includes(companyName);
    });
    const snippets = filtered
      .map((item) => {
        const title = item.title.replace(/<[^>]+>/g, '');
        const desc = item.description.replace(/<[^>]+>/g, '');
        return `${title}: ${desc}`;
      })
      .filter(Boolean)
      .slice(0, 5);

    const urls = filtered.map((item) => item.link).filter(Boolean).slice(0, 5);

    return {
      snippets: snippets.length > 0 ? snippets.join('\n') : null,
      urls,
    };
  } catch {
    return { snippets: null, urls: [] };
  }
}

interface NewsResult {
  headlines: string[];
  urls: string[];
}

/** 네이버 뉴스 검색 API */
async function fetchNaverNews(companyName: string): Promise<NewsResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { headlines: [], urls: [] };

  try {
    const res = await fetch(
      `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(`"${companyName}"`)}&display=10&sort=date`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
        signal: timeoutSignal(5000),
      },
    );
    if (!res.ok) return { headlines: [], urls: [] };

    const data = (await res.json()) as {
      items?: { title: string; originallink: string; link: string }[];
    };

    const items = data.items ?? [];
    // 회사명이 제목에 포함된 뉴스만 사용 (유사 기업 혼동 방지)
    const filtered = items.filter((item) => {
      const title = item.title.replace(/<[^>]+>/g, '');
      return title.includes(companyName);
    });
    return {
      headlines: filtered
        .map((item) => item.title.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
        .slice(0, 10),
      urls: filtered
        .map((item) => item.originallink || item.link)
        .filter(Boolean)
        .slice(0, 3),
    };
  } catch {
    return { headlines: [], urls: [] };
  }
}

/** Google News RSS */
async function fetchGoogleNews(companyName: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://news.google.com/rss/search?q=${encodeURIComponent(companyName)}&hl=ko&gl=KR&ceid=KR:ko`,
      {
        headers: {
          'User-Agent': BROWSER_UA,
          'Cookie': 'CONSENT=PENDING+987',
        },
        signal: timeoutSignal(8000),
      },
    );
    if (!res.ok) return [];
    const xml = await res.text();

    // CDATA 형식과 일반 title 형식 모두 지원
    const cdataMatches = [...xml.matchAll(/<title>\s*<!\[CDATA\[(.*?)\]\]>\s*<\/title>/g)].map((m) => m[1]);
    const plainMatches = [...xml.matchAll(/<title>([^<]+)<\/title>/g)].map((m) => m[1]);
    const all = cdataMatches.length > 0 ? cdataMatches : plainMatches;

    return all
      .filter((t) => !t.includes('Google 뉴스') && !t.includes('Google News'))
      .filter((t) => t.includes(companyName))
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function crawlCompanyInfo(companyName: string): Promise<CrawlResult> {
  const [corpInfo, webSearch, naverNews, googleNews] = await Promise.all([
    fetchCorpInfo(companyName),
    fetchWebSearch(companyName),
    fetchNaverNews(companyName),
    fetchGoogleNews(companyName),
  ]);

  // 네이버 + 구글 뉴스 합치고 중복 제거
  const seen = new Set<string>();
  const newsHeadlines: string[] = [];
  for (const title of [...naverNews.headlines, ...googleNews]) {
    if (!seen.has(title)) {
      seen.add(title);
      newsHeadlines.push(title);
    }
  }

  // 출처 URL 수집 (웹검색 + 뉴스)
  const sourceUrls = [...webSearch.urls, ...naverNews.urls];

  return {
    corpInfo,
    webSnippets: webSearch.snippets,
    newsHeadlines: newsHeadlines.slice(0, 15),
    sourceUrls,
  };
}
