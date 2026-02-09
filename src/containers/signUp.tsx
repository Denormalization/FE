'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Book from '../components/book';

export default function SignUp() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다');
            return;
        }

        console.log('Signup:', { email, password });
        router.push('/');
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
        <div className="flex flex-col items-center mt-22">
            <h1 className="text-3xl font-bold mb-12 text-[#333]">회원가입</h1>

            <form className="flex w-[30rem] flex-col gap-5" onSubmit={handleSignUp}>

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
                        className="cursor-pointer w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 opacity-60 hover:opacity-100 transition"
                    >
                        <img src="/icons/eyes.svg" alt="눈" className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="비밀번호 확인"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="cursor-pointer w-full rounded-lg border border-[#e0e0e0] bg-white px-5 py-4 text-base text-[#333] outline-none transition focus:border-[#e57373]"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 cursor-pointer -translate-y-1/2 opacity-60 hover:opacity-100 transition"
                    >
                        <img src="/icons/eyes.svg" alt="눈" className="w-5 h-5" />
                    </button>
                </div>

                <button
                    type="submit"
                    className="mt-2 w-full cursor-pointer rounded-lg bg-gradient-to-br from-[#e57373] to-[#d65d5d] py-4 text-lg font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                    회원가입하기
                </button>

                <div className="flex items-center justify-center gap-4">
                    <span className="text-sm text-[#929292]">이미 계정이 있으신가요?</span>
                    <Link
                        href="/"
                        className="cursor-pointer text-sm font-bold text-[#e57373] transition hover:text-[#BA3C3C]"
                    >
                        로그인
                    </Link>
                </div>

                <div className="flex items-center text-center text-sm text-[#999] my-6">
                    <div className="flex-1 border-b border-[#e0e0e0]" />
                    <span className="px-5">소셜 로그인</span>
                    <div className="flex-1 border-b border-[#e0e0e0]" />
                </div>

                <div className="flex justify-center gap-6">
                    <button
                        type="button"
                        className="cursor-pointer w-12 h-12 rounded-full bg-[#03C75A] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                    >
                        <img src="/assets/naver.svg" alt="네이버" className="w-full h-full object-contain" />
                    </button>

                    <button
                        type="button"
                        className="cursor-pointer w-12 h-12 rounded-full bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg overflow-hidden"
                    >
                        <img src="/icons/google.svg" alt="구글" className="w-full h-full object-contain" />
                    </button>
                </div>
            </form>
        </div>
    );

    return <Book leftContent={airplaneIcon} rightContent={loginContent} />;
}