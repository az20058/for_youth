/**
 * @jest-environment node
 */
import { crawlCompanyInfo } from '@/lib/crawl';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const ENV_BACKUP = { ...process.env };

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch;
  // 외부 API 키를 비워 fetchCorpInfo / fetchWebSearch / fetchNaverNews를 단락시킨다
  delete process.env.DATA_GO_KR_API_KEY;
  delete process.env.NAVER_CLIENT_ID;
  delete process.env.NAVER_CLIENT_SECRET;
});

afterAll(() => {
  process.env = ENV_BACKUP;
});

describe('crawlCompanyInfo - Google News RSS', () => {
  it('<item>의 title과 link를 1:1 매칭해 source URL을 부여한다', async () => {
    const xml = `<rss><channel>
      <item><title><![CDATA[카카오 AI 투자]]></title><link>https://news.example.com/a</link></item>
      <item><title><![CDATA[카카오뱅크 흑자]]></title><link>https://news.example.com/b</link></item>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });

    const result = await crawlCompanyInfo('카카오');

    const googleSources = result.sources.filter((s) => s.type === 'google-news');
    expect(googleSources).toHaveLength(2);
    expect(googleSources[0]).toMatchObject({ title: '카카오 AI 투자', url: 'https://news.example.com/a' });
    expect(googleSources[1]).toMatchObject({ title: '카카오뱅크 흑자', url: 'https://news.example.com/b' });
    expect(result.newsHeadlines).toContain('카카오 AI 투자');
  });

  it('"Google 뉴스" 헤드라인은 필터링한다', async () => {
    const xml = `<rss><channel>
      <item><title><![CDATA[Google 뉴스]]></title><link>https://news.google.com</link></item>
      <item><title><![CDATA[카카오 정상]]></title><link>https://news.example.com/x</link></item>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });

    const result = await crawlCompanyInfo('카카오');

    expect(result.newsHeadlines).toEqual(['카카오 정상']);
    expect(result.sources.filter((s) => s.type === 'google-news')).toHaveLength(1);
  });

  it('회사명이 포함되지 않은 헤드라인은 제외한다', async () => {
    const xml = `<rss><channel>
      <item><title><![CDATA[다른 회사 뉴스]]></title><link>https://news.example.com/other</link></item>
      <item><title><![CDATA[카카오 정상]]></title><link>https://news.example.com/x</link></item>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });

    const result = await crawlCompanyInfo('카카오');

    expect(result.newsHeadlines).toEqual(['카카오 정상']);
  });

  it('네트워크 오류 시 빈 결과를 반환한다', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const result = await crawlCompanyInfo('카카오');
    expect(result.newsHeadlines).toEqual([]);
    expect(result.sources).toEqual([]);
  });
});

describe('crawlCompanyInfo - Source ID 부여', () => {
  it('모든 소스에 S1..Sn 형식의 ID를 순서대로 부여한다', async () => {
    const xml = `<rss><channel>
      <item><title><![CDATA[카카오 뉴스1]]></title><link>https://a.com</link></item>
      <item><title><![CDATA[카카오 뉴스2]]></title><link>https://b.com</link></item>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });

    const result = await crawlCompanyInfo('카카오');

    expect(result.sources.map((s) => s.id)).toEqual(['S1', 'S2']);
  });
});
