'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { signUp } from '@/lib/auth';

export default function SignUp() {
    const router = useRouter();
    const { setBookContent, updateBookContent } = useBook();
    const isInitialMount = useRef(true);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (!email.trim() || !password.trim() || !nickname.trim()) {
            toast.error('이메일, 비밀번호, 닉네임을 모두 입력해 주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await signUp({
                email: email.trim(),
                password,
                nickname: nickname.trim(),
            });

            router.push('/?signedup=1');
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : '회원가입에 실패했습니다.'
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const airplaneIcon = useMemo(
        () => (
            <div className="flex h-full items-center justify-center">
                <img
                    src="/assets/airplane.svg"
                    alt="비행기"
                    className="w-80 h-80 opacity-80 animate-[float_4s_ease-in-out_infinite] hover:scale-[1.03] transition-transform duration-500"
                />
            </div>
        ),
        []
    );

    const signUpContent = useMemo(
        () => (
            <div className="flex flex-col items-center mt-22">
                <h1 className="text-3xl font-bold mb-12 text-[#333]">
                    회원가입
                </h1>

                <form
                    className="flex w-[30rem] flex-col gap-5"
                    onSubmit={handleSignUp}
                >
                    <input
                        type="email"
                        placeholder="winshine0326@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                        autoComplete="email"
                    />

                    <input
                        type="text"
                        placeholder="닉네임"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                        autoComplete="username"
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition"
                        >
                            <img
                                src="/icons/eyes.svg"
                                alt="눈"
                                className="w-5 h-5"
                            />
                        </button>
                    </div>

                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="비밀번호 확인"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            className="w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-2 w-full h-[58px] rounded-lg bg-gradient-to-br from-[#e57373] to-[#d65d5d] text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                                <span>가입 중...</span>
                            </div>
                        ) : (
                            '회원가입하기'
                        )}
                    </button>

                    <div className="flex items-center justify-center gap-4">
                        <span className="text-sm text-[#929292]">
                            이미 계정이 있으신가요?
                        </span>
                        <Link
                            href="/"
                            className="text-sm font-bold text-[#e57373] transition hover:text-[#BA3C3C]"
                        >
                            로그인
                        </Link>
                    </div>
                </form>
            </div>
        ),
        [email, nickname, password, confirmPassword, showPassword, isSubmitting]
    );

    useEffect(() => {
        if (isInitialMount.current) {
            setBookContent(airplaneIcon, signUpContent);
            isInitialMount.current = false;
        } else {
            updateBookContent(airplaneIcon, signUpContent);
        }
    }, [setBookContent, updateBookContent, airplaneIcon, signUpContent]);

    return null;
}