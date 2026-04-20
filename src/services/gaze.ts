import { fetchWithAuthRetry } from '@/lib/auth';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

export interface GazeEventPayload {
  bookId: number;
  chapterId: number;
  text: string;
  dwellTime: number;
  timestamp: string;
}

export interface GazeEventResponse {
  eventId: number;
  shouldSuggestAdaptation: boolean;
}

export async function recordGazeEvent(payload: GazeEventPayload): Promise<GazeEventResponse> {
  const url = `${API_BASE}/api/v1/gaze-events`;
  const res = await fetchWithAuthRetry(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    { auth: 'optional' }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `가제 이벤트 기록 실패 (${res.status})`);
  }

  return (await res.json()) as GazeEventResponse;
}
