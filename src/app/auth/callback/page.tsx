'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  exchangeCodeForToken,
  setTokens,
  handleRoleRedirection,
  type OAuthProvider,
} from '@/lib/auth';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state') as OAuthProvider | null;

    if (!code || !state) {
      setError('인가 코드가 없습니다. 다시 로그인해 주세요.');
      return;
    }

    const provider: OAuthProvider =
      state === 'google' || state === 'naver' ? state : 'google';

    exchangeCodeForToken(provider, code)
      .then(async ({ accessToken, refreshToken }) => {
        setTokens(accessToken, refreshToken);
        handleRoleRedirection(router, 'replace');
      })
      .catch((err) => {
        const message =
          err instanceof Error
            ? err.message
            : '로그인 처리에 실패했습니다. 백엔드(localhost:8080) 실행 여부와 CORS 설정을 확인해 주세요.';
        setError(message);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => router.replace('/')}
          className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
        >
          로그인 화면으로
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-white/80">로그인 처리 중...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-white/80">로딩 중...</p>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
