'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftHomeContent, RightHomeContent } from '@/containers/home';
import { BookItem, fetchBooks } from '@/services/books';

export default function HomePage() {
    const { setBookContent, updateBookContent } = useBook();
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

    useEffect(() => {
        const left = (
            <LeftHomeContent
                books={books}
                isLoading={isLoading}
            />
        );
        const right = <RightHomeContent books={books.slice(4, 8)} />;

        if (isInitialMount.current) {
            setBookContent(left, right);
            isInitialMount.current = false;
        } else {
            updateBookContent(left, right);
        }
    }, [books, isLoading]);

    return null;
}


