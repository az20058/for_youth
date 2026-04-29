import Anthropic from '@anthropic-ai/sdk';
import type { CrawlResult, Source } from './crawl';

export interface CitedItem {
  text: string;
  sourceIds: string[];
}

export interface CompanySummaryData {
  overview: CitedItem;
  mainBusiness: CitedItem[];
  recentNews: CitedItem[];
  motivationHints: CitedItem[];
  idealCandidate: CitedItem[];
  sources: Source[];
  schemaVersion: 2;
}

function buildSourceLabel(source: Source): string {
  switch (source.type) {
    case 'corp-info':
      return `${source.id} (금융위원회)`;
    case 'naver-web':
      return `${source.id} (네이버 웹검색 - ${source.domain})`;
    case 'naver-news':
      return `${source.id} (네이버 뉴스 - ${source.domain})`;
    case 'google-news':
      return `${source.id} (구글 뉴스 - ${source.domain})`;
  }
}

function filterSourceIds(sourceIds: string[], validIds: Set<string>): string[] {
  return sourceIds.filter((id) => validIds.has(id));
}

export async function summarizeCompany(
  companyName: string,
  crawlResult: CrawlResult,
): Promise<CompanySummaryData> {
  const client = new Anthropic();

  const { sources } = crawlResult;
  const validIds = new Set(sources.map((s) => s.id));

  // 소스 목록을 프롬프트에 포함
  const sourceListLines = sources.map((s) => {
    const label = buildSourceLabel(s);
    return `${label}: "${s.title}"`;
  });

  const corpSource = sources.find((s) => s.type === 'corp-info');
  const corpSection = crawlResult.corpInfo && corpSource
    ? `[소스 ${corpSource.id} - 기업 기본정보 (금융위원회)]\n${crawlResult.corpInfo}`
    : '';

  const webSources = sources.filter((s) => s.type === 'naver-web');
  const webSection = crawlResult.webSnippets && webSources.length > 0
    ? `[소스 ${webSources.map((s) => s.id).join(',')} - 웹 검색 결과]\n${crawlResult.webSnippets}`
    : '';

  const newsSources = sources.filter((s) => s.type === 'naver-news' || s.type === 'google-news');
  const newsSection =
    crawlResult.newsHeadlines.length > 0 && newsSources.length > 0
      ? `[최근 뉴스]\n${crawlResult.newsHeadlines
          .map((headline, i) => {
            const src = newsSources[i];
            return src ? `${src.id}: ${headline}` : headline;
          })
          .join('\n')}`
      : '';

  const sourceListSection = sourceListLines.length > 0
    ? `[소스 목록]\n${sourceListLines.join('\n')}`
    : '';

  const prompt = [
    `"${companyName}"은(는) 사용자가 취업을 지원한 기업의 이름입니다. 아래 정보 중 이 기업과 관련 없는 내용(동명의 다른 제품, 인물, 게임 등)은 무시하세요.`,
    corpSection,
    webSection,
    newsSection,
    sourceListSection,
    `위 내용 중 "${companyName}" 기업에 해당하는 정보만을 바탕으로 취업 준비생이 지원 동기를 작성할 수 있도록 아래 항목을 JSON 형식으로 한국어로 답해주세요.

각 항목 끝에 사용한 소스 ID를 sourceIds 배열로 명시하세요.
실제 그 항목의 근거가 된 소스만 포함하고, 추측하지 마세요.
mainBusiness 같은 일반 사실은 1~2개 소스, recentNews는 보통 1개 소스가 적절합니다.
sourceIds가 빈 배열이면 안 되며, 적절한 소스가 없으면 항목 자체를 만들지 마세요.

반드시 아래 형식의 JSON만 출력하세요:
{
  "overview": { "text": "기업 개요 (2-3문장)", "sourceIds": ["S1", "S2"] },
  "mainBusiness": [{ "text": "핵심 사업 영역 1", "sourceIds": ["S1"] }],
  "recentNews": [{ "text": "최근 이슈 1", "sourceIds": ["S3"] }],
  "motivationHints": [{ "text": "지원 동기 포인트 1", "sourceIds": ["S2"] }],
  "idealCandidate": [{ "text": "이 기업이 원하는 인재상 1", "sourceIds": ["S2"] }]
}`,
  ].filter(Boolean).join('\n\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1536,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답 파싱 실패');

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
  if (!parsed.overview || !Array.isArray(parsed.mainBusiness)) {
    throw new Error('AI 응답 파싱 실패');
  }

  // 환각 방어: 존재하지 않는 sourceId 제거
  function cleanCitedItem(raw: unknown): CitedItem {
    const item = raw as { text?: unknown; sourceIds?: unknown };
    const rawIds = Array.isArray(item.sourceIds) ? (item.sourceIds as string[]) : [];
    return {
      text: typeof item.text === 'string' ? item.text : '',
      sourceIds: filterSourceIds(rawIds, validIds),
    };
  }

  function cleanCitedItems(raw: unknown): CitedItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.map(cleanCitedItem);
  }

  const overview = cleanCitedItem(parsed.overview);
  const mainBusiness = cleanCitedItems(parsed.mainBusiness);
  const recentNews = cleanCitedItems(parsed.recentNews ?? []);
  const motivationHints = cleanCitedItems(parsed.motivationHints ?? []);
  const idealCandidate = cleanCitedItems(parsed.idealCandidate ?? []);

  return {
    overview,
    mainBusiness,
    recentNews,
    motivationHints,
    idealCandidate,
    sources,
    schemaVersion: 2,
  };
}
