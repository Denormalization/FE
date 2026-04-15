import { getAccessToken } from '@/lib/auth';
import type { GraphData, GraphNode } from '@/types/graph';
import { getInsertPosition } from '@/services/embedding';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

const SUB_COLORS = ['#38844E', '#409659', '#4E7A5D', '#6B9078', '#2D5A3C', '#558B6E', '#437356'];
const randomColor = () => SUB_COLORS[Math.floor(Math.random() * SUB_COLORS.length)];

export async function addKeyword(
  term: string,
  contextSentence: string,
  candidateNodes?: GraphNode[]
): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  let parentId: string | null = null;
  let insertType: 'child' | 'sibling' | null = null;

  if (candidateNodes && candidateNodes.length > 0) {
    const position = await getInsertPosition(
      term,
      contextSentence,
      candidateNodes.map(n => ({
        id: n.id,
        term: n.label,
        context_sentence: n.description,
      }))
    );
    parentId = position.parent_id;
    insertType = position.insert_type;
  }

  const body: Record<string, unknown> = { term, contextSentence };
  if (parentId) body.parentId = parentId;
  if (insertType) body.insertType = insertType;

  const res = await fetch(`${API_BASE}/api/v1/library`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 409) {
    throw new Error('이미 존재하는 키워드입니다.');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `키워드 추가 실패 (${res.status})`);
  }
}

export async function fetchKeywordGraph(): Promise<GraphData> {
  const token = getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${API_BASE}/api/v1/library/graph`, {
    headers: { Authorization: `Bearer ${token}` },
  });

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
  const token = getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${API_BASE}/api/v1/library/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ term, contextSentence }),
  });

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
  const token = getAccessToken();
  if (!token) throw new Error('로그인이 필요합니다.');

  const res = await fetch(`${API_BASE}/api/v1/library/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) {
    throw new Error('요청한 키워드를 찾을 수 없습니다.');
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `키워드 삭제 실패 (${res.status})`);
  }
}
