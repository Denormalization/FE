export type OAuthProvider = 'google' | 'naver';
export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: UserRole;
}

export interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface SignUpResponse {
  id: string;
  email: string;
  nickname: string;
  role: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** OAuth 토큰 응답 */
export interface OAuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

/** 토큰 갱신 응답 */
export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

