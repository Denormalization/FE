import { fetchWithAuthRetry } from '@/lib/auth';

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
  const res = await fetchWithAuthRetry(
    `${API_BASE}/api/v1/users/me/preferences`,
    {},
    { auth: 'required' }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `읽기 설정 조회 실패 (${res.status})`);
  }

  return (await res.json()) as UserPreferencesResponse;
}

export async function updateUserPreferences(
  body: UpdateUserPreferencesRequest
): Promise<UserPreferencesResponse> {
  const res = await fetchWithAuthRetry(
    `${API_BASE}/api/v1/users/me/preferences`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    { auth: 'required' }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `읽기 설정 수정 실패 (${res.status})`);
  }

  return (await res.json()) as UserPreferencesResponse;
}
