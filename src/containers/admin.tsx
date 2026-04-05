'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { logout, getMe } from '@/lib/auth';
import { useBook } from '@/context/bookContext';
import { fetchAdminUsers, type AdminUser } from '@/services/admin';
import ElegantAirplaneLoading from '@/components/ui/loading';

const LEFT_PAGE_CAPACITY = 7;

export default function Admin() {
    const router = useRouter();
    const { setBookContent, updateBookContent, setOverlayContent } = useBook();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isInitialMount = useRef(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                await getMe();
                try {
                    const usersData = await fetchAdminUsers();
                    setUsers(usersData);
                } catch (err) {
                    const message = err instanceof Error ? err.message : '유저 목록을 불러오지 못했습니다.';
                    toast.error(message);
                    setUsers([]);
                }
            } catch {
                router.replace('/');
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [router]);

    const handleLogout = useCallback(async () => {
        await logout();
        router.push('/');
    }, [router]);

    const formatCreatedAt = (value?: string) => {
        if (!value) return '가입일 정보 없음';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const loadingOverlay = useMemo(() => (
        <div className="flex h-full w-full items-center justify-center pointer-events-none">
            <ElegantAirplaneLoading size="lg" />
        </div>
    ), []);

    const emptyPage = useMemo(() => <div className="h-full w-full" />, []);

    const leftUsers = useMemo(
        () => users.slice(0, LEFT_PAGE_CAPACITY),
        [users]
    );
    const rightUsers = useMemo(
        () => users.slice(LEFT_PAGE_CAPACITY),
        [users]
    );

    const usersList = (list: AdminUser[], side: 'left' | 'right') => {
        if (list.length === 0) {
            if (side === 'right') return null;
            return (
                <div className="rounded-xl border border-gray-100 bg-white p-4 text-center text-xs text-gray-400 shadow-sm">
                    조회된 유저가 없습니다.
                </div>
            );
        }

        return list.map((item, index) => (
            <div key={`${item.email ?? 'user'}-${index}-${side}`} className="flex items-center justify-between rounded-xl border border-gray-50 bg-white p-3 shadow-sm transition-colors hover:bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 items-center justify-center rounded-full flex text-[10px] font-bold text-white bg-blue-400">
                        {(item.nickname?.[0] ?? item.email?.[0] ?? 'U').toUpperCase()}
                    </div>
                    <div>
                        <p className="font-semibold text-xs text-gray-700">{item.email ?? '이메일 없음'}</p>
                        <p className="text-[10px] text-gray-400">{item.nickname ?? '닉네임 없음'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                    <span className="text-[10px] font-medium text-gray-500">{formatCreatedAt(item.createdAt)}</span>
                </div>
            </div>
        ));
    };

    const leftContent = useMemo(() => (
        <div className="flex h-full w-full flex-col px-16 pt-16 pb-8">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#333]">최근 가입 유저</h2>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    전체 사용자 {users.length.toLocaleString()}명
                </span>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2">
                {usersList(leftUsers, 'left')}
            </div>

            <div className="mt-auto pt-6">
                <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                    로그아웃
                </button>
            </div>
        </div>
    ), [leftUsers, users.length, handleLogout]);

    const rightContent = useMemo(() => (
        <div className="flex h-full w-full flex-col px-16 pt-16 pb-8">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#333]">최근 가입 유저</h2>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2">
                {usersList(rightUsers, 'right')}
            </div>
        </div>
    ), [rightUsers]);

    useEffect(() => {
        const nextLeft = isLoading ? emptyPage : leftContent;
        const nextRight = isLoading ? emptyPage : rightContent;

        if (isInitialMount.current) {
            setBookContent(nextLeft, nextRight);
            isInitialMount.current = false;
        } else {
            updateBookContent(nextLeft, nextRight);
        }

        setOverlayContent(isLoading ? loadingOverlay : null);
    }, [isLoading, leftContent, rightContent, emptyPage, loadingOverlay, setBookContent, updateBookContent, setOverlayContent]);

    return null;
}
