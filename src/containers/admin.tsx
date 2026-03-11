'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { logout, getMe } from '@/lib/auth';
import type { User } from '@/types/auth';
import { useBook } from '@/context/bookContext';

export default function Admin() {
    const router = useRouter();
    const { setBookContent, updateBookContent } = useBook();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const isInitialMount = useRef(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getMe();
                if (userData.role !== 'ADMIN') {
                    router.replace('/home');
                    return;
                }
                setUser(userData);
            } catch {
                router.replace('/');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    const stats = [
        { label: '전체 사용자', value: '1,284', change: '+12%', icon: '👥' },
        { label: '오늘 활성 유저', value: '342', change: '+5%', icon: '🔥' },
        { label: '시스템 상태', value: '정상', change: 'Stable', icon: '⚡' },
        { label: '클라우드 저장소', value: '82%', change: 'Normal', icon: '☁️' },
    ];

    const leftContent = useMemo(() => (
        <div className="flex h-full w-full flex-col px-16 pt-16 pb-8">
            <header className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#333]">관리자 대시보드</h1>
                    <p className="mt-1 text-sm text-gray-500">환영합니다, {user?.nickname || '관리자'}님.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#e57373] shadow-md">
                        <div className="flex h-full w-full items-center justify-center bg-[#e57373] text-sm font-bold uppercase text-white">
                            {user?.nickname?.[0] || 'A'}
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-4 mb-10">
                {stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xl">{stat.icon}</span>
                            <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{stat.change}</span>
                        </div>
                        <h3 className="text-xs font-medium text-gray-400">{stat.label}</h3>
                        <p className="mt-0.5 text-lg font-bold text-gray-800">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                    로그아웃
                </button>
            </div>
        </div>
    ), [user]);

    const rightContent = useMemo(() => (
        <div className="flex h-full w-full flex-col px-16 pt-16 pb-8">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#333]">최근 가입 유저</h2>
                <button className="text-xs font-semibold text-[#e57373] hover:underline">전체 보기</button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-gray-50 bg-white p-3 shadow-sm transition-colors hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 items-center justify-center rounded-full flex text-[10px] font-bold text-white ${i % 2 === 0 ? 'bg-purple-400' : 'bg-blue-400'}`}>
                                U{i}
                            </div>
                            <div>
                                <p className="font-semibold text-xs text-gray-700">user_{i}@example.com</p>
                                <p className="text-[10px] text-gray-400">2시간 전 가입</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${i % 3 === 0 ? 'bg-yellow-400' : 'bg-emerald-400'}`}></span>
                            <span className="text-[10px] font-medium text-gray-500">{i % 3 === 0 ? '대기중' : '활성'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    ), []);

    useEffect(() => {
        if (!isLoading) {
            if (isInitialMount.current) {
                setBookContent(leftContent, rightContent);
                isInitialMount.current = false;
            } else {
                updateBookContent(leftContent, rightContent);
            }
        }
    }, [isLoading, leftContent, rightContent, setBookContent, updateBookContent]);

    if (isLoading) {
        return null;
    }

    return null;
}
