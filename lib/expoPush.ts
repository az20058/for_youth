export interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default';
}
export interface ExpoPushTicketOk { status: 'ok'; id: string }
export interface ExpoPushTicketError {
  status: 'error';
  message?: string;
  details?: { error?: string };
}
export type ExpoPushTicket = ExpoPushTicketOk | ExpoPushTicketError;

export function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  if (messages.length === 0) return [];
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'accept-encoding': 'gzip, deflate' },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      return messages.map(() => ({ status: 'error' as const, details: { error: 'NetworkFailure' } }));
    }
    const body = (await res.json()) as { data: ExpoPushTicket[] };
    return body.data;
  } catch {
    return messages.map(() => ({ status: 'error' as const, details: { error: 'NetworkFailure' } }));
  }
}
