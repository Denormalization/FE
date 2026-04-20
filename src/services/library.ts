import { fetchWithAuthRetry } from '@/lib/auth';
import type { GraphData } from '@/types/graph';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

const SUB_COLORS = ['#38844E', '#409659', '#4E7A5D', '#6B9078', '#2D5A3C', '#558B6E', '#437356'];
const randomColor = () => SUB_COLORS[Math.floor(Math.random() * SUB_COLORS.length)];

export async function addKeyword(term: string, contextSentence: string): Promise<void> {
  const res = await fetchWithAuthRetry(
    `${API_BASE}/api/v1/library`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ term, contextSentence }),
    },
    { auth: 'required' }
  );

  if (res.status === 409) {
    throw new Error('이미 존재하는 키워드입니다.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `키워드 추가 실패 (${res.status})`);
  }
}

export async function fetchKeywordGraph(): Promise<GraphData> {
  const res = await fetchWithAuthRetry(
    `${API_BASE}/api/v1/library/graph`,
    {},
    { auth: 'required' }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `그래프 조회 실패 (${res.status})`);
  }

  const data = await res.json();

  return {
    nodes: data.nodes.map((n: { id: string; type: 'main' | 'sub'; label: string; description: string; quote?: string | null; radius: number; color?: string | null }) => ({
      ...n,
      color: n.color ?? randomColor(),
      quote: n.quote ?? undefined,
    })),
    links: data.links,
  };
}

export async function updateKeyword(id: string, term: string, contextSentence: string): Promise<void> {
  const res = await fetchWithAuthRetry(
    `${API_BASE}/api/v1/library/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ term, contextSentence }),
    },
    { auth: 'required' }
  );

  if (res.status === 404) {
    throw new Error('요청한 키워드를 찾을 수 없습니다.');
  }
  if (res.status === 409) {
    throw new Error('이미 존재하는 키워드입니다.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `키워드 수정 실패 (${res.status})`);
  }
}

export async function deleteKeyword(id: string): Promise<void> {
  const res = await fetchWithAuthRetry(
    `${API_BASE}/api/v1/library/${encodeURIComponent(id)}`,
    { method: 'DELETE' },
    { auth: 'required' }
  );

  if (res.status === 404) {
    throw new Error('요청한 키워드를 찾을 수 없습니다.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `키워드 삭제 실패 (${res.status})`);
  }
}
