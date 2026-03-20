'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftHomeContent, RightHomeContent } from '@/containers/mypage';
import { BOOKS } from '@/mock/home';
import { logout } from '@/lib/auth';

export default function MyPagePage() {
    const { setBookContent } = useBook();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');

    const handleLogout = useCallback(async () => {
        try {
            await logout();
            toast.success('로그아웃되었습니다.');
            router.push('/');
        } catch {
            toast.error('로그아웃에 실패했습니다.');
        }
    }, [router]);

    const filteredBooks = BOOKS.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const leftBooks = filteredBooks.slice(0, 4);
    const rightBooks = filteredBooks.slice(4, 8);

    useEffect(() => {
        setBookContent(
            <LeftHomeContent
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                books={leftBooks}
            />,
            <RightHomeContent books={rightBooks} onLogout={handleLogout} />
        );
    }, [searchTerm, handleLogout]);

    return null;
}

