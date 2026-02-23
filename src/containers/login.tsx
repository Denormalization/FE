'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Book from '../components/book';
import { getOAuthRedirectUrl, login, refresh, setTokens } from '@/lib/auth';

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        refresh()
            .then(() => router.replace('/home'))
            .catch(() => {})
            .finally(() => setIsCheckingAuth(false));
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        if (!email.trim() || !password) {
            setErrorMessage('이메일과 비밀번호를 입력해 주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { accessToken, refreshToken } = await login({
                email: email.trim(),
                password,
            });
            setTokens(accessToken, refreshToken);
            router.push('/home');
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : '로그인에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const airplaneIcon = (
        <div className="flex h-full items-center justify-center">
            <img src="/assets/airplane.svg" alt="비행기" className="
    w-80 h-80 opacity-80
    animate-[float_4s_ease-in-out_infinite]
    hover:scale-[1.03] transition-transform duration-500
"
            />
        </div>
    );

    const loginContent = (
        <div className="flex flex-col items-center mt-28">
            <h1 className="mb-12 text-3xl font-bold text-[#333]">로그인</h1>

            <form className="flex w-[30rem] flex-col gap-5" onSubmit={handleLogin}>
                {errorMessage && (
                    <p className="text-sm text-red-500" role="alert">
                        {errorMessage}
                    </p>
                )}
                <input
                    type="email"
                    placeholder="winshine0326@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                    autoComplete="email"
                />

                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="********"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full cursor-pointer rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 opacity-60 transition hover:opacity-100"
                    >
                        <img src="/icons/eyes.svg" alt="눈" className="h-5 w-5" />
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full cursor-pointer rounded-lg bg-gradient-to-br from-[#e57373] to-[#d65d5d] py-4 text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    {isSubmitting ? '로그인 중...' : '로그인하기'}
                </button>

                <div className="flex items-center justify-center gap-4 text-sm">
                    <a
                        href="#"
                        className="cursor-pointer text-[#929292] transition hover:text-[#BA3C3C]"
                    >
                        비밀번호 찾기
                    </a>
                    <span className="text-[#ddd]">|</span>
                    <Link
                        href="/signup"
                        className="cursor-pointer text-[#929292] transition hover:text-[#BA3C3C]"
                    >
                        회원가입
                    </Link>
                </div>

                <div className="my-6 flex items-center text-center text-sm text-[#999]">
                    <div className="flex-1 border-b border-[#e0e0e0]" />
                    <span className="px-5">소셜 로그인</span>
                    <div className="flex-1 border-b border-[#e0e0e0]" />
                </div>

                <div className="flex justify-center gap-6">
                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = getOAuthRedirectUrl('naver');
                        }}
                        className="cursor-pointer h-12 w-12 overflow-hidden rounded-full bg-[#03C75A] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <img src="/assets/naver.svg" alt="네이버" className="h-full w-full object-contain" />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = getOAuthRedirectUrl('google');
                        }}
                        className="cursor-pointer h-12 w-12 overflow-hidden rounded-full bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <img src="/icons/google.svg" alt="구글" className="h-full w-full object-contain" />
                    </button>
                </div>
            </form>
        </div>
    );

    if (isCheckingAuth) {
        return (
            <Book
                leftContent={airplaneIcon}
                rightContent={
                    <div className="flex flex-col items-center justify-center mt-28">
                        <p className="text-[#666]">로그인 확인 중...</p>
                    </div>
                }
            />
        );
    }

    return <Book leftContent={airplaneIcon} rightContent={loginContent} />;
}