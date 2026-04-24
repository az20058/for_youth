import Anthropic from '@anthropic-ai/sdk';

/**
 * 금융위원회 기업기본정보 API로 기업 존재 여부를 확인한다.
 * 실패하거나 결과가 없으면 null을 반환한다.
 */
async function checkCorpApi(companyName: string): Promise<boolean | null> {
  const apiKey = process.env.DATA_GO_KR_API_KEY;
  if (!apiKey) return null;

  try {
    const url =
      `https://apis.data.go.kr/1160100/service/GetCorpBasicInfoService/getCorpOutline` +
      `?serviceKey=${encodeURIComponent(apiKey)}` +
      `&corpNm=${encodeURIComponent(companyName)}` +
      `&numOfRows=1&pageNo=1&resultType=json`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      response?: {
        body?: { totalCount?: number };
      };
    };

    const totalCount = data?.response?.body?.totalCount ?? 0;
    return totalCount > 0;
  } catch {
    return null;
  }
}

/**
 * Haiku에게 기업명인지 판별을 요청한다.
 */
async function checkWithAI(companyName: string): Promise<boolean> {
  const client = new Anthropic();

  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 16,
    messages: [
      {
        role: 'user',
        content: `"${companyName}"이(가) 실제 존재하는 기업(회사)의 이름인지 판별해주세요. "YES" 또는 "NO"만 답하세요.`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  return text.trim().toUpperCase().startsWith('YES');
}

/**
 * 기업명이 실제 기업인지 검증한다.
 * 1차: 금융위원회 API → 2차: Haiku fallback
 */
export async function validateCompanyName(companyName: string): Promise<boolean> {
  const apiResult = await checkCorpApi(companyName);
  if (apiResult !== null) return apiResult;

  return checkWithAI(companyName);
}
