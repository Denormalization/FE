'use client';

import { useState, useEffect } from 'react';
import { useBook } from '@/context/bookContext';
import { LeftHomeContent, RightHomeContent } from '@/containers/mypage';
import { BOOKS } from '@/mock/home';

export default function MyPagePage() {
    const { setBookContent } = useBook();
    const [searchTerm, setSearchTerm] = useState('');

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
            <RightHomeContent books={rightBooks} />
        );
    }, [searchTerm]);

    return null;
}

