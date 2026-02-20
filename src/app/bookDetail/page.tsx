'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { LeftBookDetailContent, RightBookDetailContent } from '@/containers/bookDetail';
import { BOOKS } from '@/mock/home';

function BookDetailContent() {
    const { setBookContent } = useBook();
    const searchParams = useSearchParams();
    const bookId = searchParams.get('id');

    useEffect(() => {
        const book = BOOKS.find(b => b.id === Number(bookId)) || BOOKS[0];

        if (book) {
            setBookContent(
                <LeftBookDetailContent book={book} />,
                <RightBookDetailContent book={book} />
            );
        }
    }, [bookId, setBookContent]);

    return null;
}

export default function BookDetailPage() {
    return (
        <Suspense fallback={null}>
            <BookDetailContent />
        </Suspense>
    );
}