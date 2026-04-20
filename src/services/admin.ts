import { fetchWithAuthRetry } from '@/lib/auth';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

export interface AdminUser {
  email?: string;
  nickname?: string;
  createdAt?: string;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetchWithAuthRetry(
    `${API_BASE}/api/v1/admin/users`,
    { method: 'GET' },
    { auth: 'required' }
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) {
      throw new Error('어드민 권한이 필요합니다.');
    }
    throw new Error(text || `유저 목록 조회 실패 (${res.status})`);
  }

  return (await res.json()) as AdminUser[];
}
