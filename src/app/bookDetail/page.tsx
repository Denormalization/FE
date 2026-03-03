'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftBookDetailContent, RightBookDetailContent } from '@/containers/bookDetail';
import { BookDetail, fetchBookDetail } from '@/services/books';

function BookDetailContent() {
    const { setBookContent } = useBook();
    const searchParams = useSearchParams();
    const isbn = searchParams.get('isbn');
    const [book, setBook] = useState<BookDetail | null>(null);

    useEffect(() => {
        if (!isbn) return;

        fetchBookDetail(isbn)
            .then((data) => {
                setBook(data);
                setBookContent(
                    <LeftBookDetailContent book={data} />,
                    <RightBookDetailContent book={data} />
                );
            })
            .catch((err) => {
                toast.error(err instanceof Error ? err.message : '책 정보를 불러오지 못했습니다.');
            });
    }, [isbn, setBookContent]);

    return null;
}

export default function BookDetailPage() {
    return (
        <Suspense fallback={null}>
            <BookDetailContent />
        </Suspense>
    );
}