'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftHomeContent, RightHomeContent } from '@/containers/mypage';
import { fetchReadingBooks, ReadingBook } from '@/services/books';
import { logout } from '@/lib/auth';

export default function MyPagePage() {
    const { setBookContent } = useBook();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [books, setBooks] = useState<ReadingBook[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReadingBooks()
            .then(setBooks)
            .catch((err) => toast.error(err instanceof Error ? err.message : '읽고 있는 책 조회 실패'))
            .finally(() => setLoading(false));
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

    const filtered = books.filter(book =>
        book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const leftBooks = filtered.slice(0, 4);
    const rightBooks = filtered.slice(4, 8);

    useEffect(() => {
        setBookContent(
            <LeftHomeContent
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                books={leftBooks}
                loading={loading}
            />,
            <RightHomeContent books={rightBooks} onLogout={handleLogout} />
        );
    }, [searchTerm, books, loading, handleLogout]);

    return null;
}
