'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftMyPageContent, RightMyPageContent } from '@/containers/mypage';
import { fetchReadingBooks, ReadingItem } from '@/services/books';
import { logout } from '@/lib/auth';

export default function MyPagePage() {
    const { setBookContent } = useBook();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [readings, setReadings] = useState<ReadingItem[]>([]);

    useEffect(() => {
        fetchReadingBooks()
            .then((data) => setReadings(data.readings))
            .catch((err) => {
                toast.error(err instanceof Error ? err.message : '읽고 있는 책을 불러오지 못했습니다.');
            });
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            toast.success('로그아웃되었습니다.');
            router.push('/');
        } catch {
            toast.error('로그아웃에 실패했습니다.');
        }
    }, [router]);

    const filtered = readings.filter(item =>
        item.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.chapterTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const leftItems = filtered.slice(0, 4);
    const rightItems = filtered.slice(4, 8);

    useEffect(() => {
        setBookContent(
            <LeftMyPageContent
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                items={leftItems}
            />,
            <RightMyPageContent items={rightItems} onLogout={handleLogout} />
        );
    }, [searchTerm, readings, handleLogout]);

    return null;
}

