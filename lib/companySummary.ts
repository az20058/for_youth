import Anthropic from '@anthropic-ai/sdk';
import type { CrawlResult } from './crawl';

export interface CompanySummaryData {
  overview: string;
  mainBusiness: string[];
  recentNews: string[];
  motivationHints: string[];
  referenceSites: string[];
  idealCandidate: string[];
}

export async function summarizeCompany(
  companyName: string,
  crawlResult: CrawlResult,
): Promise<CompanySummaryData> {
  const client = new Anthropic();

  const corpSection = crawlResult.corpInfo
    ? `[기업 기본정보 (금융위원회)]\n${crawlResult.corpInfo}`
    : '';
  const webSection = crawlResult.webSnippets
    ? `[웹 검색 결과]\n${crawlResult.webSnippets}`
    : '';
  const newsSection =
    crawlResult.newsHeadlines.length > 0
      ? `[최근 뉴스]\n${crawlResult.newsHeadlines.join('\n')}`
      : '';

  const prompt = [
    `"${companyName}"은(는) 사용자가 취업을 지원한 기업의 이름입니다. 아래 정보 중 이 기업과 관련 없는 내용(동명의 다른 제품, 인물, 게임 등)은 무시하세요.`,
    corpSection,
    webSection,
    newsSection,
    `위 내용 중 "${companyName}" 기업에 해당하는 정보만을 바탕으로 취업 준비생이 지원 동기를 작성할 수 있도록 아래 항목을 JSON 형식으로 한국어로 답해주세요. 반드시 아래 형식의 JSON만 출력하세요:
{
  "overview": "기업 개요 (2-3문장)",
  "mainBusiness": ["핵심 사업 영역 1", "핵심 사업 영역 2"],
  "recentNews": ["최근 이슈 1", "최근 이슈 2"],
  "motivationHints": ["지원 동기 포인트 1", "지원 동기 포인트 2"],
  "referenceSites": ["참고할 만한 공식 사이트 URL 1", "참고 사이트 URL 2"],
  "idealCandidate": ["이 기업이 원하는 인재상 1", "인재상 2"]
}`,
  ].filter(Boolean).join('\n\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패');

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  if (!parsed.overview || !Array.isArray(parsed.mainBusiness)) {
    throw new Error('AI 응답 파싱 실패');
  }

  return {
    overview: parsed.overview as string,
    mainBusiness: parsed.mainBusiness as string[],
    recentNews: (parsed.recentNews as string[]) ?? [],
    motivationHints: (parsed.motivationHints as string[]) ?? [],
    referenceSites: (parsed.referenceSites as string[]) ?? [],
    idealCandidate: (parsed.idealCandidate as string[]) ?? [],
  };
}
