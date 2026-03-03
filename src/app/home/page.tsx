'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftHomeContent, RightHomeContent } from '@/containers/home';
import { BookItem, fetchBooks } from '@/services/books';

export default function HomePage() {
    const { setBookContent, updateBookContent } = useBook();
    const [searchTerm, setSearchTerm] = useState('');
    const [books, setBooks] = useState<BookItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const isInitialMount = useRef(true);

    const loadBooks = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await fetchBooks({ page: 0, size: 8 });
            setBooks(data.content);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : '책 목록을 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBooks();
    }, [loadBooks]);

    const filteredBooks = books.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const leftBooks = filteredBooks.slice(0, 4);
    const rightBooks = filteredBooks.slice(4, 8);

    useEffect(() => {
        const left = (
            <LeftHomeContent
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                books={leftBooks}
                isLoading={isLoading}
            />
        );
        const right = <RightHomeContent books={rightBooks} />;

        if (isInitialMount.current) {
            setBookContent(left, right);
            isInitialMount.current = false;
        } else {
            updateBookContent(left, right);
        }
    }, [searchTerm, books, isLoading]);

    return null;
}


