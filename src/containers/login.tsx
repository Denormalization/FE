'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Book from '../components/ui/book';
import { useBook } from '@/context/bookContext';
import { getOAuthRedirectUrl, login, refresh, setTokens, getMe } from '@/lib/auth';

export default function Login() {
    const router = useRouter();
    const { setBookContent, updateBookContent } = useBook();
    const isInitialMount = useRef(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);


    const airplaneIcon = useMemo(() => (
        <div className="flex h-full items-center justify-center">
            <img
                src="/assets/airplane.svg"
                alt="비행기"
                className="
                    w-80 h-80 opacity-80
                    animate-[float_4s_ease-in-out_infinite]
                    hover:scale-[1.03] transition-transform duration-500
                "
            />
        </div>
    ), []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            toast.error('이메일과 비밀번호를 입력해 주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { accessToken, refreshToken } = await login({
                email: email.trim(),
                password,
            });

            setTokens(accessToken, refreshToken);

            const user = await getMe();
            if (user.role === 'ADMIN') {
                router.push('/admin');
            } else {
                router.push('/home');
            }
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : '로그인에 실패했습니다.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const loginContent = useMemo(() => (
        <div className="flex flex-col items-center mt-28">
            <h1 className="mb-12 text-3xl font-bold text-[#333]">로그인</h1>

            <form className="flex w-[30rem] flex-col gap-5" onSubmit={handleLogin}>

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
                        className="w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 transition hover:opacity-100"
                    >
                        <img src="/icons/eyes.svg" alt="눈" className="h-5 w-5" />
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full h-[58px] rounded-lg bg-gradient-to-br from-[#e57373] to-[#d65d5d] text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>로그인 중...</span>
                        </div>
                    ) : '로그인하기'}
                </button>

                <div className="flex items-center justify-center gap-4 text-sm">
                    <Link
                        href="/signup"
                        className="text-[#929292] transition hover:text-[#BA3C3C]"
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
                        className="h-12 w-12 overflow-hidden rounded-full bg-[#03C75A] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <img
                            src="/assets/naver.svg"
                            alt="네이버"
                            className="h-full w-full object-contain"
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            window.location.href = getOAuthRedirectUrl('google');
                        }}
                        className="h-12 w-12 overflow-hidden rounded-full bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <img
                            src="/icons/google.svg"
                            alt="구글"
                            className="h-full w-full object-contain"
                        />
                    </button>
                </div>
            </form>
        </div>
    ), [email, password, showPassword, isSubmitting]);

    useEffect(() => {
        refresh()
            .then(async () => {
                try {
                    const user = await getMe();
                    if (user.role === 'ADMIN') {
                        router.replace('/admin');
                    } else {
                        router.replace('/home');
                    }
                } catch {
                    router.replace('/home');
                }
            })
            .catch(() => { })
            .finally(() => setIsCheckingAuth(false));
    }, [router]);

    useEffect(() => {
        if (isInitialMount.current) {
            setBookContent(airplaneIcon, loginContent);
            isInitialMount.current = false;
        } else {
            updateBookContent(airplaneIcon, loginContent);
        }
    }, [setBookContent, updateBookContent, airplaneIcon, loginContent]);


    if (isCheckingAuth) {
        return null;
    }

    return null;
}