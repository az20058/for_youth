/**
 * @jest-environment node
 */
import { fetchNamuWiki, fetchGoogleNews } from '@/lib/crawl';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  // Re-assign after MSW's beforeAll wraps globalThis.fetch, so our mock takes precedence.
  global.fetch = mockFetch;
});

describe('fetchNamuWiki', () => {
  it('성공 시 텍스트를 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '카카오는 IT 기업입니다.' });
    expect(await fetchNamuWiki('카카오')).toBe('카카오는 IT 기업입니다.');
  });

  it('404 응답 시 null을 반환한다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });
    expect(await fetchNamuWiki('존재하지않는회사')).toBeNull();
  });

  it('네트워크 오류 시 null을 반환한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(await fetchNamuWiki('카카오')).toBeNull();
  });

  it('3000자를 초과하는 텍스트는 잘라낸다', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => 'a'.repeat(5000) });
    const result = await fetchNamuWiki('카카오');
    expect(result?.length).toBe(3000);
  });
});

describe('fetchGoogleNews', () => {
  it('RSS의 CDATA 타이틀을 파싱한다', async () => {
    const xml = `<?xml version="1.0"?><rss><channel>
      <title><![CDATA[Google 뉴스]]></title>
      <item><title><![CDATA[카카오 AI 투자 확대]]></title></item>
      <item><title><![CDATA[카카오뱅크 흑자 전환]]></title></item>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });
    expect(await fetchGoogleNews('카카오')).toEqual(['카카오 AI 투자 확대', '카카오뱅크 흑자 전환']);
  });

  it('"Google 뉴스" 제목은 필터링한다', async () => {
    const xml = `<rss><channel>
      <title><![CDATA[Google 뉴스]]></title>
    </channel></rss>`;
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => xml });
    expect(await fetchGoogleNews('카카오')).toEqual([]);
  });

  it('네트워크 오류 시 빈 배열을 반환한다', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(await fetchGoogleNews('카카오')).toEqual([]);
  });
});
