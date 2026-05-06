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

const CITED_ITEM_SCHEMA = {
  type: 'object' as const,
  required: ['text', 'sourceIds'],
  properties: {
    text: { type: 'string' as const },
    sourceIds: { type: 'array' as const, items: { type: 'string' as const } },
  },
};

const SUMMARY_TOOL: Anthropic.Tool = {
  name: 'submit_company_summary',
  description: '회사 분석 결과를 인용 정보와 함께 제출한다.',
  input_schema: {
    type: 'object',
    required: ['overview', 'mainBusiness', 'recentNews', 'motivationHints', 'idealCandidate'],
    properties: {
      overview: CITED_ITEM_SCHEMA,
      mainBusiness: { type: 'array', items: CITED_ITEM_SCHEMA },
      recentNews: { type: 'array', items: CITED_ITEM_SCHEMA },
      motivationHints: { type: 'array', items: CITED_ITEM_SCHEMA },
      idealCandidate: { type: 'array', items: CITED_ITEM_SCHEMA },
    },
  },
};

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
    `위 내용 중 "${companyName}" 기업에 해당하는 정보만 사용해 취업 준비생이 지원 동기를 작성할 수 있도록 ${SUMMARY_TOOL.name} 도구로 결과를 제출하세요.

각 항목의 sourceIds에는 그 항목의 실제 근거가 된 소스 ID만 포함하세요. 추측 금지.
mainBusiness 같은 일반 사실은 1~2개 소스, recentNews는 보통 1개 소스가 적절합니다.
sourceIds가 빈 배열이면 안 되며, 적절한 소스가 없으면 항목 자체를 만들지 마세요.
overview는 2-3문장으로 작성하세요.`,
  ].filter(Boolean).join('\n\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1536,
    tools: [SUMMARY_TOOL],
    tool_choice: { type: 'tool', name: SUMMARY_TOOL.name },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUseBlock = message.content.find((b) => b.type === 'tool_use');
  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    throw new Error('AI 응답 파싱 실패');
  }

  const parsed = toolUseBlock.input as Record<string, unknown>;

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

  return {
    overview: cleanCitedItem(parsed.overview),
    mainBusiness: cleanCitedItems(parsed.mainBusiness),
    recentNews: cleanCitedItems(parsed.recentNews ?? []),
    motivationHints: cleanCitedItems(parsed.motivationHints ?? []),
    idealCandidate: cleanCitedItems(parsed.idealCandidate ?? []),
    sources,
    schemaVersion: 2,
  };
}

// ── 사용자 맞춤 지원동기 ────────────────────────────────────────

export interface UserContext {
  major: string | null;
  careerLevel: string | null;
  techStacks: string[];
  careers: { company?: string; position?: string; role?: string; isCurrent?: boolean }[];
}

/** 프로필이 충분히 채워져 있어 맞춤화가 의미 있는지 판단 */
export function hasUsableContext(ctx: UserContext): boolean {
  const hasMajor = Boolean(ctx.major && ctx.major.trim());
  const hasStacks = ctx.techStacks.length > 0;
  const hasCareers = ctx.careers.length > 0;
  return hasMajor || hasStacks || hasCareers;
}

const PERSONALIZE_TOOL: Anthropic.Tool = {
  name: 'submit_personalized_motivation',
  description: '사용자의 프로필을 회사의 특성과 연결한 맞춤 지원동기 포인트를 제출한다.',
  input_schema: {
    type: 'object',
    required: ['motivationHints'],
    properties: {
      motivationHints: { type: 'array', items: CITED_ITEM_SCHEMA },
    },
  },
};

function buildUserProfileSection(ctx: UserContext): string {
  const lines: string[] = [];
  if (ctx.major?.trim()) lines.push(`전공: ${ctx.major.trim()}`);
  if (ctx.careerLevel?.trim()) lines.push(`경력 구분: ${ctx.careerLevel.trim()}`);
  if (ctx.techStacks.length > 0) lines.push(`기술 스택: ${ctx.techStacks.join(', ')}`);
  if (ctx.careers.length > 0) {
    const careerLines = ctx.careers
      .map((c) => {
        const parts = [c.company, c.position, c.role].filter((p) => p && p.trim());
        if (parts.length === 0) return null;
        const status = c.isCurrent ? ' (재직 중)' : '';
        return `- ${parts.join(' / ')}${status}`;
      })
      .filter((l): l is string => l !== null);
    if (careerLines.length > 0) lines.push(`경력:\n${careerLines.join('\n')}`);
  }
  return lines.join('\n');
}

function buildSummaryDigest(summary: CompanySummaryData): string {
  const parts: string[] = [];
  parts.push(`개요: ${summary.overview.text}`);
  if (summary.mainBusiness.length > 0) {
    parts.push(`핵심 사업: ${summary.mainBusiness.map((b) => b.text).join(', ')}`);
  }
  if (summary.idealCandidate.length > 0) {
    parts.push(`인재상: ${summary.idealCandidate.map((c) => c.text).join(', ')}`);
  }
  if (summary.recentNews.length > 0) {
    parts.push(`최근 이슈: ${summary.recentNews.map((n) => n.text).join(', ')}`);
  }
  return parts.join('\n');
}

export async function personalizeMotivation(
  companyName: string,
  commonSummary: CompanySummaryData,
  userContext: UserContext,
): Promise<CitedItem[]> {
  const client = new Anthropic();
  const validIds = new Set(commonSummary.sources.map((s) => s.id));

  const sourceListLines = commonSummary.sources.map((s) => `${buildSourceLabel(s)}: "${s.title}"`);
  const profileSection = buildUserProfileSection(userContext);
  const summaryDigest = buildSummaryDigest(commonSummary);

  const prompt = [
    `"${companyName}"에 지원하는 취업 준비생의 프로필과 회사 분석을 보고, 이 사람이 자기소개서 지원 동기에 쓸 수 있는 맞춤 포인트 3개를 작성하세요.`,
    `[지원자 프로필]\n${profileSection}`,
    `[회사 분석 요약]\n${summaryDigest}`,
    `[소스 목록]\n${sourceListLines.join('\n')}`,
    `각 포인트는 지원자의 구체적인 강점(전공·기술·경력)과 회사의 특성(사업·인재상·최근 이슈)을 직접 연결해야 합니다.
일반론(예: "성장 가능성", "도전 정신")은 금지. 반드시 지원자의 프로필 항목과 회사의 특성을 짝지어 서술하세요.
각 항목 끝의 sourceIds는 그 포인트의 회사 측 근거가 된 소스만 포함합니다. 지원자 프로필에는 sourceId를 부여하지 않습니다.
sourceIds가 빈 배열이면 안 되며, 적절한 소스가 없으면 항목을 만들지 마세요.
${PERSONALIZE_TOOL.name} 도구로 결과를 제출하세요.`,
  ].filter(Boolean).join('\n\n');

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 768,
    tools: [PERSONALIZE_TOOL],
    tool_choice: { type: 'tool', name: PERSONALIZE_TOOL.name },
    messages: [{ role: 'user', content: prompt }],
  });

  const toolUseBlock = message.content.find((b) => b.type === 'tool_use');
  if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
    throw new Error('맞춤 지원동기 응답 파싱 실패');
  }

  const parsed = toolUseBlock.input as Record<string, unknown>;
  const raw = Array.isArray(parsed.motivationHints) ? parsed.motivationHints : [];

  return raw.map((item) => {
    const r = item as { text?: unknown; sourceIds?: unknown };
    const ids = Array.isArray(r.sourceIds) ? (r.sourceIds as string[]) : [];
    return {
      text: typeof r.text === 'string' ? r.text : '',
      sourceIds: filterSourceIds(ids, validIds),
    };
  });
}
