const AI_BASE =
  typeof window !== 'undefined'
    ? '/api/ai'
    : process.env.AI_API_URL ?? '';

export interface InsertPositionCandidate {
  id: string;
  term: string;
  context_sentence: string;
}

export interface InsertPositionResponse {
  insert_type: 'child' | 'sibling';
  parent_id: string | null;
  similarity: number;
}

export async function getInsertPosition(
  new_term: string,
  context_sentence: string,
  candidate_nodes: InsertPositionCandidate[],
  threshold?: number
): Promise<InsertPositionResponse> {
  const body: Record<string, unknown> = { new_term, context_sentence, candidate_nodes };
  if (threshold !== undefined) body.threshold = threshold;

  const res = await fetch(`${AI_BASE}/dictionary/insert-position`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `삽입 위치 판단 실패 (${res.status})`);
  }

  return (await res.json()) as InsertPositionResponse;
}

export interface IndexBookResponse {
  status: string;
  book_id: string;
  chunks_indexed: number;
}

export interface DeleteBookIndexResponse {
  status: string;
  message: string;
}

export async function indexBook(
  file: File,
  book_id: number,
  title: string
): Promise<IndexBookResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('book_id', String(book_id));
  formData.append('title', title);

  const res = await fetch(`${AI_BASE}/book/index`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `임베딩 실패 (${res.status})`);
  }

  return (await res.json()) as IndexBookResponse;
}

export async function deleteBookIndex(
  book_id: string | number
): Promise<DeleteBookIndexResponse> {
  const res = await fetch(`${AI_BASE}/book/${book_id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `인덱스 삭제 실패 (${res.status})`);
  }

  return (await res.json()) as DeleteBookIndexResponse;
}
