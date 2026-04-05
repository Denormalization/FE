import { getAccessToken } from '@/lib/auth';

const API_BASE =
  typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_API_PROXY ?? '/api/backend'
    : process.env.NEXT_PUBLIC_API_URL ?? '';

export interface UserPreferencesResponse {
  id: string;
  theme: number;
  fontSize: number;
  lineHeight: number;
  margin: number;
}

export interface UpdateUserPreferencesRequest {
  theme?: number;
  fontSize?: number;
  lineHeight?: number;
  margin?: number;
}

export async function fetchUserPreferences(): Promise<UserPreferencesResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE}/api/v1/users/me/preferences`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `읽기 설정 조회 실패 (${res.status})`);
  }

  return (await res.json()) as UserPreferencesResponse;
}

export async function updateUserPreferences(
  body: UpdateUserPreferencesRequest
): Promise<UserPreferencesResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  const res = await fetch(`${API_BASE}/api/v1/users/me/preferences`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `읽기 설정 수정 실패 (${res.status})`);
  }

  return (await res.json()) as UserPreferencesResponse;
}
