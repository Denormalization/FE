import type {
  LoginRequest,
  LoginResponse,
  OAuthProvider,
  OAuthTokenResponse,
  RefreshResponse,
  SignUpRequest,
  SignUpResponse,
} from '@/types/auth';

export type {
  LoginRequest,
  LoginResponse,
  OAuthProvider,
  OAuthTokenResponse,
  RefreshResponse,
  SignUpRequest,
  SignUpResponse,
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

function getRedirectUri(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/auth/callback`;
}

export function getOAuthRedirectUrl(provider: OAuthProvider): string {
  const redirectUri = getRedirectUri();
  const state = provider;

  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  if (provider === 'naver') {
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
  authCode: string
): Promise<OAuthTokenResponse> {
  const url = `${API_URL}/api/v1/auth/oauth/${provider}?authCode=${encodeURIComponent(authCode)}`;
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

export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_ACCESS, accessToken);
  window.localStorage.setItem(STORAGE_REFRESH, refreshToken);
}

/** 토큰 갱신 (POST /api/v1/auth/refresh, Cookie에 refreshToken) */
export async function refresh(): Promise<RefreshResponse> {
  const token = getRefreshToken();
  if (!token) {
    throw new Error('리프레시 토큰이 없습니다.');
  }

  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: token }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `토큰 갱신 실패 (${res.status})`);
  }

  const data = (await res.json()) as RefreshResponse;
  setTokens(data.accessToken, token);
  return data;
}
