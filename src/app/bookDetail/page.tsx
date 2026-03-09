'use client';

import { useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { LeftBookDetailContent, RightBookDetailContent } from '@/containers/bookDetail';
import { BOOKS } from '@/mock/home';
import { fetchBookDetail, startReading } from '@/services/books';

function BookDetailContent() {
    const { setBookContent } = useBook();
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookId = searchParams.get('id');
    const isbn = searchParams.get('isbn');

    const handleStartReading = useCallback(async () => {
        const bookIsbn = isbn || bookId;
        if (!bookIsbn) return;

        try {
            const detail = await fetchBookDetail(bookIsbn);
            if (detail.chapters.length === 0) return;

            const firstChapter = detail.chapters[0];
            await startReading({
                bookId: detail.isbn,
                chapterId: firstChapter.id,
            });

            router.push(`/read?isbn=${detail.isbn}&chapterId=${firstChapter.id}`);
        } catch (err) {
            console.error('독서 시작 실패:', err);
        }
    }, [isbn, bookId, router]);

    useEffect(() => {
        const book = BOOKS.find(b => b.id === Number(bookId)) || BOOKS[0];

        if (book) {
            setBookContent(
                <LeftBookDetailContent book={book} />,
                <RightBookDetailContent book={book} onStartReading={handleStartReading} />
            );
        }
    }, [bookId, setBookContent, handleStartReading]);

    return null;
}

export default function BookDetailPage() {
    return (
        <Suspense fallback={null}>
            <BookDetailContent />
        </Suspense>
    );
}