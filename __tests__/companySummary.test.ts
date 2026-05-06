/**
 * @jest-environment node
 */
import { summarizeCompany } from '@/lib/companySummary';
import type { CrawlResult } from '@/lib/crawl';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk');

const MockedAnthropic = Anthropic as jest.MockedClass<typeof Anthropic>;

beforeEach(() => {
  MockedAnthropic.mockClear();
});

const crawlResult: CrawlResult = {
  corpInfo: '기업명: 카카오\n업종: IT',
  webSnippets: '카카오는 IT 기업입니다',
  newsHeadlines: ['카카오 AI 투자 확대'],
  sources: [
    { id: 'S1', type: 'corp-info', title: '금융위원회 기업기본정보', domain: 'data.go.kr', url: null },
    { id: 'S2', type: 'naver-news', title: '카카오 AI 투자 확대', domain: 'news.example.com', url: 'https://news.example.com/a' },
  ],
  sourceUrls: [],
};

function mockClaudeToolUse(input: object) {
  const mockCreate = jest.fn().mockResolvedValueOnce({
    content: [{ type: 'tool_use', name: 'submit_company_summary', input }],
  });
  MockedAnthropic.mockImplementation(() => ({ messages: { create: mockCreate } }) as unknown as Anthropic);
  return mockCreate;
}

function mockClaudeContent(content: unknown[]) {
  const mockCreate = jest.fn().mockResolvedValueOnce({ content });
  MockedAnthropic.mockImplementation(() => ({ messages: { create: mockCreate } }) as unknown as Anthropic);
  return mockCreate;
}

describe('summarizeCompany', () => {
  it('Claude tool_use 응답을 파싱해 v2 구조로 반환한다', async () => {
    mockClaudeToolUse({
      overview: { text: '카카오는 IT 플랫폼입니다.', sourceIds: ['S1', 'S2'] },
      mainBusiness: [{ text: '카카오톡', sourceIds: ['S1'] }],
      recentNews: [{ text: 'AI 투자', sourceIds: ['S2'] }],
      motivationHints: [{ text: '혁신 선도', sourceIds: ['S2'] }],
      idealCandidate: [{ text: '도전적인 인재', sourceIds: ['S2'] }],
    });

    const result = await summarizeCompany('카카오', crawlResult);

    expect(result.schemaVersion).toBe(2);
    expect(result.overview).toEqual({ text: '카카오는 IT 플랫폼입니다.', sourceIds: ['S1', 'S2'] });
    expect(result.mainBusiness).toEqual([{ text: '카카오톡', sourceIds: ['S1'] }]);
    expect(result.sources).toHaveLength(2);
  });

  it('존재하지 않는 sourceId는 환각 방어로 제거한다', async () => {
    mockClaudeToolUse({
      overview: { text: '...', sourceIds: ['S1', 'S99', 'fake'] },
      mainBusiness: [{ text: '...', sourceIds: ['S2', 'S77'] }],
      recentNews: [],
      motivationHints: [],
      idealCandidate: [],
    });

    const result = await summarizeCompany('카카오', crawlResult);

    expect(result.overview.sourceIds).toEqual(['S1']);
    expect(result.mainBusiness[0].sourceIds).toEqual(['S2']);
  });

  it('tool_use 블록이 없으면 에러를 던진다', async () => {
    mockClaudeContent([{ type: 'text', text: '죄송합니다, 정보를 찾을 수 없습니다.' }]);
    await expect(summarizeCompany('카카오', crawlResult)).rejects.toThrow('AI 응답 파싱 실패');
  });

  it('tool_choice로 submit_company_summary 도구를 강제하고 프롬프트에 소스 ID를 포함한다', async () => {
    const mockCreate = mockClaudeToolUse({
      overview: { text: '요약', sourceIds: ['S1'] },
      mainBusiness: [{ text: '사업', sourceIds: ['S1'] }],
      recentNews: [],
      motivationHints: [],
      idealCandidate: [],
    });

    await summarizeCompany('카카오', crawlResult);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.tool_choice).toEqual({ type: 'tool', name: 'submit_company_summary' });
    expect(callArgs.tools[0].name).toBe('submit_company_summary');

    const prompt = callArgs.messages[0].content as string;
    expect(prompt).toContain('S1');
    expect(prompt).toContain('S2');
    expect(prompt).toContain('sourceIds');
  });
});
