import Anthropic from '@anthropic-ai/sdk';
import type { CrawlResult } from './crawl';

export interface CompanySummaryData {
  overview: string;
  mainBusiness: string[];
  recentNews: string[];
  motivationHints: string[];
}

export async function summarizeCompany(
  companyName: string,
  crawlResult: CrawlResult,
): Promise<CompanySummaryData> {
  const client = new Anthropic();

  const namuSection = crawlResult.namuWiki
    ? `[나무위키 원문]\n${crawlResult.namuWiki}`
    : '';
  const newsSection =
    crawlResult.newsHeadlines.length > 0
      ? `[최근 뉴스]\n${crawlResult.newsHeadlines.join('\n')}`
      : '';

  const prompt = `다음은 ${companyName}에 대한 정보입니다.

${namuSection}

${newsSection}

위 내용을 바탕으로 취업 준비생이 지원 동기를 작성할 수 있도록 아래 항목을 JSON 형식으로 한국어로 답해주세요. 반드시 아래 형식의 JSON만 출력하세요:
{
  "overview": "기업 개요 (2-3문장)",
  "mainBusiness": ["핵심 사업 영역 1", "핵심 사업 영역 2"],
  "recentNews": ["최근 이슈 1", "최근 이슈 2"],
  "motivationHints": ["지원 동기 포인트 1", "지원 동기 포인트 2"]
}`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패');

  return JSON.parse(jsonMatch[0]) as CompanySummaryData;
}
