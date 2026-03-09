import { getAccessToken } from '@/lib/auth';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

export interface BookItem {
  isbn: number;
  title: string;
  authors: string[];
  publisher: string;
  coverUrl: string;
  genres: string[];
}

export interface BooksResponse {
  content: BookItem[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export async function fetchBooks(params?: {
  page?: number;
  size?: number;
  genreId?: number[];
}): Promise<BooksResponse> {
  const query = new URLSearchParams();

  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.size !== undefined) query.set('size', String(params.size));
  if (params?.genreId) {
    params.genreId.forEach((id) => query.append('genreId', String(id)));
  }

  const url = `${API_BASE}/api/v1/books?${query.toString()}`;
  const headers: Record<string, string> = {};

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `책 목록 조회 실패 (${res.status})`);
  }

  return (await res.json()) as BooksResponse;
}

export interface Chapter {
  id: number;
  orderNum: number;
  title: string;
}

export interface ChapterContent {
  id: number;
  orderNum: number;
  title: string;
  content: string;
}

export interface BookDetail {
  isbn: number;
  title: string;
  description: string;
  authors: string[];
  publisher: string;
  coverUrl: string;
  genres: string[];
  totalChars: number;
  chapters: Chapter[];
}

export async function fetchBookDetail(isbn: string): Promise<BookDetail> {
  const url = `${API_BASE}/api/v1/books/${isbn}`;
  const headers: Record<string, string> = {};

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `책 상세 조회 실패 (${res.status})`);
  }

  return (await res.json()) as BookDetail;
}

export async function fetchChapterContent(
  isbn: string,
  chapterId: string
): Promise<ChapterContent> {
  const url = `${API_BASE}/api/v1/books/${encodeURIComponent(isbn)}/chapters/${encodeURIComponent(chapterId)}`;
  const headers: Record<string, string> = {};

  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `챕터 본문 조회 실패 (${res.status})`);
  }

  return (await res.json()) as ChapterContent;
}
