export type SourceType = 'corp-info' | 'naver-web' | 'naver-news' | 'google-news';

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  domain: string;
  url: string | null;
}

export interface CrawlResult {
  corpInfo: string | null;
  webSnippets: string | null;
  newsHeadlines: string[];
  sources: Source[];
  /** @deprecated Use sources instead */
  sourceUrls: string[];
}

function timeoutSignal(ms: number): AbortSignal | undefined {
  return typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(ms) : undefined;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

interface CorpInfoResult {
  text: string | null;
  source: Omit<Source, 'id'> | null;
}

/** 금융위원회 기업기본정보 API에서 기업 데이터를 가져온다 */
async function fetchCorpInfo(companyName: string): Promise<CorpInfoResult> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) return { text: null, source: null };

  try {
    const url =
      `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService_V2/getCorpOutline_V2` +
      `?serviceKey=${encodeURIComponent(apiKey)}` +
      `&corpNm=${encodeURIComponent(companyName)}` +
      `&numOfRows=5&pageNo=1&resultType=json`;

    const res = await fetch(url, { signal: timeoutSignal(5000) });
    if (!res.ok) return { text: null, source: null };

    const data = (await res.json()) as {
      response?: {
        body?: {
          totalCount?: number;
          items?: { item?: Record<string, string>[] };
        };
      };
    };

    const items = data?.response?.body?.items?.item;
    if (!items || items.length === 0) return { text: null, source: null };

    // 정확히 일치하는 기업명만 사용 (유사 기업 혼동 방지)
    const corp = items.find((i) => i.corpNm === companyName);
    if (!corp) return { text: null, source: null };
    const lines = [
      corp.corpNm && `기업명: ${corp.corpNm}`,
      corp.enpRprFnm && `대표자: ${corp.enpRprFnm}`,
      corp.enpMainBizNm && `업종: ${corp.enpMainBizNm}`,
      corp.enpBsadr && `주소: ${corp.enpBsadr}`,
      corp.enpHmpgUrl && `홈페이지: ${corp.enpHmpgUrl}`,
      corp.enpEstbDt && `설립일: ${corp.enpEstbDt}`,
      corp.enpEmpeCnt && corp.enpEmpeCnt !== '0' && `직원수: ${corp.enpEmpeCnt}명`,
    ].filter(Boolean);

    if (lines.length === 0) return { text: null, source: null };

    return {
      text: lines.join('\n'),
      source: {
        type: 'corp-info',
        title: '금융위원회 기업기본정보',
        domain: 'data.go.kr',
        url: null,
      },
    };
  } catch {
    return { text: null, source: null };
  }
}

interface WebSearchResult {
  snippets: string | null;
  sources: Omit<Source, 'id'>[];
}

/** 네이버 웹검색 API로 기업 관련 정보를 가져온다 */
async function fetchWebSearch(companyName: string): Promise<WebSearchResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { snippets: null, sources: [] };

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
    if (!res.ok) return { snippets: null, sources: [] };

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

    const sliced = filtered.slice(0, 5);
    const snippets = sliced
      .map((item) => {
        const title = item.title.replace(/<[^>]+>/g, '');
        const desc = item.description.replace(/<[^>]+>/g, '');
        return `${title}: ${desc}`;
      })
      .filter(Boolean);

    const sources: Omit<Source, 'id'>[] = sliced
      .filter((item) => item.link)
      .map((item) => {
        const title = item.title.replace(/<[^>]+>/g, '');
        const domain = extractDomain(item.link);
        return {
          type: 'naver-web' as SourceType,
          title,
          domain,
          url: item.link,
        };
      });

    return {
      snippets: snippets.length > 0 ? snippets.join('\n') : null,
      sources,
    };
  } catch {
    return { snippets: null, sources: [] };
  }
}

interface NewsResult {
  headlines: string[];
  sources: Omit<Source, 'id'>[];
}

/** 네이버 뉴스 검색 API */
async function fetchNaverNews(companyName: string): Promise<NewsResult> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) return { headlines: [], sources: [] };

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
    if (!res.ok) return { headlines: [], sources: [] };

    const data = (await res.json()) as {
      items?: { title: string; originallink: string; link: string }[];
    };

    const items = data.items ?? [];
    // 회사명이 제목에 포함된 뉴스만 사용 (유사 기업 혼동 방지)
    const filtered = items.filter((item) => {
      const title = item.title.replace(/<[^>]+>/g, '');
      return title.includes(companyName);
    });

    const sliced = filtered.slice(0, 10);

    const headlines = sliced.map((item) =>
      item.title.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
    );

    const sources: Omit<Source, 'id'>[] = sliced.map((item) => {
      const title = item.title.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const url = item.originallink || item.link;
      const domain = extractDomain(url);
      return {
        type: 'naver-news' as SourceType,
        title,
        domain,
        url,
      };
    });

    return { headlines, sources };
  } catch {
    return { headlines: [], sources: [] };
  }
}

interface GoogleNewsResult {
  headlines: string[];
  sources: Omit<Source, 'id'>[];
}

/** Google News RSS */
async function fetchGoogleNews(companyName: string): Promise<GoogleNewsResult> {
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
    if (!res.ok) return { headlines: [], sources: [] };
    const xml = await res.text();

    const headlines: string[] = [];
    const sources: Omit<Source, 'id'>[] = [];

    // <item> 블록 단위로 <title>-<link> 1:1 매칭
    const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
    for (const block of itemBlocks) {
      const titleMatch = block.match(/<title>(?:\s*<!\[CDATA\[(.*?)\]\]>|([^<]+))<\/title>/);
      const linkMatch = block.match(/<link>([^<]+)<\/link>/);

      const title = (titleMatch?.[1] ?? titleMatch?.[2] ?? '').trim();
      if (!title) continue;
      // 회사명 필터 및 "Google 뉴스" 제외
      if (title.includes('Google 뉴스') || title.includes('Google News')) continue;
      if (!title.includes(companyName)) continue;

      const url = linkMatch?.[1]?.trim() ?? null;
      const domain = url ? extractDomain(url) : '';

      headlines.push(title);
      sources.push({
        type: 'google-news',
        title,
        domain,
        url,
      });

      if (headlines.length >= 10) break;
    }

    return { headlines, sources };
  } catch {
    return { headlines: [], sources: [] };
  }
}

export async function crawlCompanyInfo(companyName: string): Promise<CrawlResult> {
  const [corpInfoResult, webSearch, naverNews, googleNews] = await Promise.all([
    fetchCorpInfo(companyName),
    fetchWebSearch(companyName),
    fetchNaverNews(companyName),
    fetchGoogleNews(companyName),
  ]);

  // 네이버 + 구글 뉴스 합치고 중복 제거 (헤드라인 기준)
  const seen = new Set<string>();
  const newsHeadlines: string[] = [];
  const newsSourcesDeduped: Omit<Source, 'id'>[] = [];

  for (let i = 0; i < naverNews.headlines.length; i++) {
    const title = naverNews.headlines[i];
    const src = naverNews.sources[i];
    if (!seen.has(title) && src) {
      seen.add(title);
      newsHeadlines.push(title);
      newsSourcesDeduped.push(src);
    }
  }
  for (let i = 0; i < googleNews.headlines.length; i++) {
    const title = googleNews.headlines[i];
    const src = googleNews.sources[i];
    if (!seen.has(title) && src) {
      seen.add(title);
      newsHeadlines.push(title);
      newsSourcesDeduped.push(src);
    }
  }

  // 모든 소스를 순서대로 모아 S1..Sn ID 일괄 부여
  const rawSources: Omit<Source, 'id'>[] = [
    ...(corpInfoResult.source ? [corpInfoResult.source] : []),
    ...webSearch.sources,
    ...newsSourcesDeduped,
  ];

  const sources: Source[] = rawSources.slice(0, 15).map((s, i) => ({
    id: `S${i + 1}`,
    ...s,
  }));

  // deprecated sourceUrls (하위 호환)
  const sourceUrls = [
    ...webSearch.sources.map((s) => s.url).filter((u): u is string => u !== null),
    ...naverNews.sources.map((s) => s.url).filter((u): u is string => u !== null).slice(0, 3),
  ];

  return {
    corpInfo: corpInfoResult.text,
    webSnippets: webSearch.snippets,
    newsHeadlines: newsHeadlines.slice(0, 15),
    sources,
    sourceUrls,
  };
}
