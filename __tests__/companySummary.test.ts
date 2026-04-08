/**
 * @jest-environment node
 */
import { summarizeCompany } from '@/lib/companySummary';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

beforeEach(() => {
  MockedAnthropic.mockClear();
});

describe('summarizeCompany', () => {
  const crawlResult = {
    namuWiki: '카카오는 대한민국의 IT 기업입니다.',
    newsHeadlines: ['카카오 AI 투자 확대', '카카오뱅크 흑자'],
  };

  it('Claude 응답에서 JSON을 파싱하여 반환한다', async () => {
    const mockCreate = jest.fn().mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify({
          overview: '카카오는 국내 최대 모바일 플랫폼 기업입니다.',
          mainBusiness: ['카카오톡', '카카오페이'],
          recentNews: ['AI 서비스 강화'],
          motivationHints: ['모바일 혁신 선도'],
        }),
      }],
    });
    MockedAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as unknown as Anthropic);

    const result = await summarizeCompany('카카오', crawlResult);

    expect(result.overview).toBe('카카오는 국내 최대 모바일 플랫폼 기업입니다.');
    expect(result.mainBusiness).toEqual(['카카오톡', '카카오페이']);
    expect(result.recentNews).toEqual(['AI 서비스 강화']);
    expect(result.motivationHints).toEqual(['모바일 혁신 선도']);
  });

  it('응답에 JSON이 없으면 에러를 던진다', async () => {
    const mockCreate = jest.fn().mockResolvedValueOnce({
      content: [{ type: 'text', text: '죄송합니다, 정보를 찾을 수 없습니다.' }],
    });
    MockedAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as unknown as Anthropic);

    await expect(summarizeCompany('카카오', crawlResult)).rejects.toThrow('AI 응답 파싱 실패');
  });

  it('namuWiki가 null이어도 뉴스만으로 요약 요청한다', async () => {
    const mockCreate = jest.fn().mockResolvedValueOnce({
      content: [{
        type: 'text',
        text: JSON.stringify({
          overview: '요약',
          mainBusiness: ['사업'],
          recentNews: ['이슈'],
          motivationHints: ['포인트'],
        }),
      }],
    });
    MockedAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }) as unknown as Anthropic);

    await summarizeCompany('카카오', { namuWiki: null, newsHeadlines: ['뉴스'] });

    const prompt = mockCreate.mock.calls[0][0].messages[0].content as string;
    expect(prompt).not.toContain('[나무위키 원문]');
    expect(prompt).toContain('[최근 뉴스]');
  });
});
