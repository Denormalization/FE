'use client';

import { useState } from 'react';
import Link from 'next/link';
import Book from './book';
import { NavItem } from '@/types/components';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Login:', { email, password });
    };

    const navItems: NavItem[] = [
        { icon: <img src="/icons/home.svg" alt="홈" className="w-7 h-7" />, title: '홈' },
        { icon: <img src="/icons/db.svg" alt="책 DB" className="w-7 h-7" />, title: '책 DB' },
        { icon: <img src="/assets/read.svg" alt="읽고 있는 책" className="w-7 h-7" />, title: '읽고 있는 책' },
        { icon: <img src="/icons/mypage.svg" alt="마이페이지" className="w-7 h-7" />, title: '마이페이지' }
    ];

    const airplaneIcon = (
        <img src="/assets/airplane.svg" alt="비행기" className="w-80 h-80 opacity-80" />
    );

    const loginContent = (
        <div className="flex flex-col items-center mt-10">
            <h1 className="mb-12 text-2xl font-bold text-[#333]">로그인</h1>

            <form className="flex w-full flex-col gap-5" onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="winshine0326@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
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
                    className="mt-2 w-full cursor-pointer rounded-lg bg-gradient-to-br from-[#e57373] to-[#d65d5d] py-4 text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                    로그인하기
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
                        className="cursor-pointer h-12 w-12 overflow-hidden rounded-full bg-[#03C75A] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <img src="/assets/naver.svg" alt="네이버" className="h-full w-full object-contain" />
                    </button>

                    <button
                        type="button"
                        className="cursor-pointer h-12 w-12 overflow-hidden rounded-full bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                    >
                        <img src="/icons/google.svg" alt="구글" className="h-full w-full object-contain" />
                    </button>
                </div>
            </form>
        </div>
    );

    return <Book leftContent={airplaneIcon} rightContent={loginContent} navItems={navItems} />;
}