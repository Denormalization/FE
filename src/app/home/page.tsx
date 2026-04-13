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
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const isInitialMount = useRef(true);

    const loadBooks = useCallback(async (p: number) => {
        try {
            setIsLoading(true);
            const data = await fetchBooks({ page: p, size: 8 });
setBooks(data.content);
            setTotalPages(data.totalPages);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : '책 목록을 불러오지 못했습니다.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadBooks(page);
    }, [loadBooks, page]);

    const handlePrevPage = useCallback(() => {
        setPage(p => p - 1);
    }, []);

    const handleNextPage = useCallback(() => {
        setPage(p => p + 1);
    }, []);

    useEffect(() => {
        const left = (
            <LeftHomeContent
                books={books}
                isLoading={isLoading}
            />
        );
        const right = (
            <RightHomeContent
                books={books.slice(4, 8)}
                page={page}
                totalPages={totalPages}
                onPrevPage={handlePrevPage}
                onNextPage={handleNextPage}
            />
        );

        if (isInitialMount.current) {
            setBookContent(left, right);
            isInitialMount.current = false;
        } else {
            updateBookContent(left, right);
        }
    }, [books, isLoading, page, totalPages]);

    return null;
}


