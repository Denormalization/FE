import type {
  LoginRequest,
  LoginResponse,
  OAuthProvider,
  OAuthTokenResponse,
  RefreshResponse,
  SignUpRequest,
  SignUpResponse,
  User,
  UserRole,
} from '@/types/auth';

export type {
  LoginRequest,
  LoginResponse,
  OAuthProvider,
  OAuthTokenResponse,
  RefreshResponse,
  SignUpRequest,
  SignUpResponse,
  User,
  UserRole,
} from '@/types/auth';

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_PROXY ?? "/api/backend"
    : process.env.NEXT_PUBLIC_API_URL ?? "";
const API_URL = API_BASE;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ?? '';

const STORAGE_ACCESS = 'dmz_access_token';
const STORAGE_REFRESH = 'dmz_refresh_token';
const STORAGE_NAVER_OAUTH_STATE = 'dmz_naver_oauth_state';

function getRedirectUri(provider: OAuthProvider): string {
  if (typeof window === 'undefined') return '';
  if (provider === 'naver') {
    return `${window.location.origin}/oauth/naver/callback`;
  }
  return `${window.location.origin}/oauth/callback`;
}

function createRandomState(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 18);
}

export function saveNaverOAuthState(state: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(STORAGE_NAVER_OAUTH_STATE, state);
}

export function consumeNaverOAuthState(): string | null {
  if (typeof window === 'undefined') return null;
  const state = window.sessionStorage.getItem(STORAGE_NAVER_OAUTH_STATE);
  if (state) {
    window.sessionStorage.removeItem(STORAGE_NAVER_OAUTH_STATE);
  }
  return state;
}

export function getOAuthRedirectUrl(provider: OAuthProvider): string {
  const redirectUri = getRedirectUri(provider);

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state: 'google',
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === 'naver') {
    const state = createRandomState();
    saveNaverOAuthState(state);
    const params = new URLSearchParams({
      client_id: NAVER_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      state,
    });
    return `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  }

  throw new Error(`Unknown provider: ${provider}`);
}

export async function signUp(body: SignUpRequest): Promise<SignUpResponse> {
  const url = `${API_URL}/api/v1/auth/signup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `회원가입 실패 (${res.status})`);
  }

  return (await res.json()) as SignUpResponse;
}

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const url = `${API_URL}/api/v1/auth/login`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `로그인 실패 (${res.status})`);
  }

  return (await res.json()) as LoginResponse;
}

const OAUTH_REQUEST_TIMEOUT_MS = 15_000;

export async function exchangeCodeForToken(
  provider: OAuthProvider,
  authCode: string,
  state?: string
): Promise<OAuthTokenResponse> {
  const params = new URLSearchParams({
    authCode,
  });
  if (state) {
    params.set('state', state);
  }
  const url = `${API_URL}/api/v1/auth/oauth/${provider}?${params.toString()}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OAUTH_REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OAuth 실패 (${res.status}): ${text || res.statusText}`);
    }

    const data = (await res.json()) as OAuthTokenResponse;
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error(
          '백엔드 응답이 없습니다. 서버가 실행 중인지 확인해 주세요. (localhost:8080)'
        );
      }
      throw err;
    }
    throw new Error('로그인 처리에 실패했습니다.');
  }
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_REFRESH);
}

type AuthMode = 'none' | 'optional' | 'required';
type FetchWithAuthOptions = {
  auth?: AuthMode;
  retryOn401?: boolean;
};

let refreshInFlight: Promise<void> | null = null;

async function refreshOnce(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = refresh()
      .then(() => undefined)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  await refreshInFlight;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_ACCESS, accessToken);
  window.localStorage.setItem(STORAGE_REFRESH, refreshToken);
}

export async function fetchWithAuthRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchWithAuthOptions = {}
): Promise<Response> {
  const authMode = options.auth ?? 'optional';
  const retryOn401 = options.retryOn401 ?? true;

  const buildInit = (): RequestInit => {
    const headers = new Headers(init.headers);
    if (authMode !== 'none') {
      const token = getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else if (authMode === 'required') {
        throw new Error('로그인이 필요합니다.');
      } else {
        headers.delete('Authorization');
      }
    }
    return { ...init, headers };
  };

  const firstInit = buildInit();
  const firstHadAuthorization = new Headers(firstInit.headers).has('Authorization');
  let res = await fetch(input, firstInit);

  if (!retryOn401 || authMode === 'none' || res.status !== 401) {
    return res;
  }

  if (typeof window === 'undefined' || !firstHadAuthorization) {
    return res;
  }

  try {
    await refreshOnce();
  } catch {
    return res;
  }

  const retryInit = buildInit();
  res = await fetch(input, retryInit);
  return res;
}

/** 토큰 갱신 (POST /api/v1/auth/refresh, Cookie에 refreshToken) */
export async function refresh(): Promise<RefreshResponse> {
  const token = getRefreshToken();
  if (!token) {
    clearTokens();
    throw new Error('세션이 만료되었습니다. 다시 로그인해 주세요.');
  }

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token }),
  });

  if (!res.ok) {
    const text = await res.text();
    clearTokens();
    throw new Error(text || `세션이 만료되었습니다. 다시 로그인해 주세요. (${res.status})`);
  }

  const data = (await res.json()) as RefreshResponse;
  setTokens(data.accessToken, token);
  return data;
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_ACCESS);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_ACCESS);
  window.localStorage.removeItem(STORAGE_REFRESH);
}

export async function getMe(): Promise<User> {
  const url = `${API_URL}/api/v1/users/me`;
  const res = await fetchWithAuthRetry(
    url,
    {
      method: 'GET',
    },
    { auth: 'required' }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `사용자 정보를 가져오는데 실패했습니다 (${res.status})`);
  }

  return (await res.json()) as User;
}

export async function handleRoleRedirection(
  router: { push: (path: string) => void; replace: (path: string) => void },
  method: 'push' | 'replace' = 'push'
): Promise<void> {
  try {
    const user = await getMe();
    if (user.role === 'ADMIN') {
      router[method]('/admin');
    } else {
      router[method]('/home');
    }
  } catch {
    router[method]('/home');
  }
}

export async function logout(): Promise<void> {
  const accessToken = getAccessToken();
  if (accessToken) {
    try {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
    } catch {
    }
  }
  clearTokens();
}
