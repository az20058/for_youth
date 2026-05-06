/**
 * @jest-environment node
 */
import {
  summarizeCompany,
  personalizeMotivation,
  hasUsableContext,
  type CompanySummaryData,
  type UserContext,
} from '@/lib/companySummary';
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

const commonSummary: CompanySummaryData = {
  overview: { text: '카카오는 IT 플랫폼이다.', sourceIds: ['S1'] },
  mainBusiness: [{ text: '카카오톡', sourceIds: ['S1'] }],
  recentNews: [{ text: 'AI 투자 확대', sourceIds: ['S2'] }],
  motivationHints: [{ text: '일반 동기', sourceIds: ['S1'] }],
  idealCandidate: [{ text: '도전적인 인재', sourceIds: ['S2'] }],
  sources: [
    { id: 'S1', type: 'corp-info', title: '금융위원회 기업기본정보', domain: 'data.go.kr', url: null },
    { id: 'S2', type: 'naver-news', title: '카카오 AI 투자 확대', domain: 'news.example.com', url: 'https://news.example.com/a' },
  ],
  schemaVersion: 2,
};

describe('hasUsableContext', () => {
  it('major·techStacks·careers가 모두 비면 false', () => {
    expect(hasUsableContext({ major: null, careerLevel: null, techStacks: [], careers: [] })).toBe(false);
    expect(hasUsableContext({ major: '   ', careerLevel: '신입', techStacks: [], careers: [] })).toBe(false);
  });

  it('하나라도 있으면 true', () => {
    expect(hasUsableContext({ major: '컴퓨터공학', careerLevel: null, techStacks: [], careers: [] })).toBe(true);
    expect(hasUsableContext({ major: null, careerLevel: null, techStacks: ['React'], careers: [] })).toBe(true);
    expect(hasUsableContext({
      major: null, careerLevel: null, techStacks: [],
      careers: [{ company: 'A', position: '개발자' }],
    })).toBe(true);
  });
});

describe('personalizeMotivation', () => {
  const userContext: UserContext = {
    major: '컴퓨터공학',
    careerLevel: '신입',
    techStacks: ['TypeScript', 'React'],
    careers: [{ company: '스타트업A', position: '프론트엔드', role: '웹앱 개발', isCurrent: false }],
  };

  it('tool_use 응답을 파싱해 CitedItem 배열로 반환하고 환각 sourceId를 제거한다', async () => {
    const mockCreate = jest.fn().mockResolvedValueOnce({
      content: [{
        type: 'tool_use',
        name: 'submit_personalized_motivation',
        input: {
          motivationHints: [
            { text: 'TypeScript 경험을 바탕으로 카카오톡 백엔드 개선에 기여', sourceIds: ['S1'] },
            { text: 'AI 투자 흐름과 맞물린 신규 서비스 합류', sourceIds: ['S2', 'fake'] },
          ],
        },
      }],
    });
    MockedAnthropic.mockImplementation(() => ({ messages: { create: mockCreate } }) as unknown as Anthropic);

    const result = await personalizeMotivation('카카오', commonSummary, userContext);

    expect(result).toHaveLength(2);
    expect(result[0].text).toContain('TypeScript');
    expect(result[1].sourceIds).toEqual(['S2']);
  });

  it('프롬프트에 사용자 프로필과 회사 요약이 포함된다', async () => {
    const mockCreate = jest.fn().mockResolvedValueOnce({
      content: [{ type: 'tool_use', name: 'submit_personalized_motivation', input: { motivationHints: [] } }],
    });
    MockedAnthropic.mockImplementation(() => ({ messages: { create: mockCreate } }) as unknown as Anthropic);

    await personalizeMotivation('카카오', commonSummary, userContext);

    const prompt = mockCreate.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain('컴퓨터공학');
    expect(prompt).toContain('TypeScript');
    expect(prompt).toContain('스타트업A');
    expect(prompt).toContain('카카오톡');
    expect(prompt).toContain('AI 투자 확대');
  });

  it('tool_use 블록이 없으면 에러를 던진다', async () => {
    const mockCreate = jest.fn().mockResolvedValueOnce({
      content: [{ type: 'text', text: '실패' }],
    });
    MockedAnthropic.mockImplementation(() => ({ messages: { create: mockCreate } }) as unknown as Anthropic);

    await expect(personalizeMotivation('카카오', commonSummary, userContext))
      .rejects.toThrow('맞춤 지원동기 응답 파싱 실패');
  });
});
