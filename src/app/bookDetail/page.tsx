'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftBookDetailContent, RightBookDetailContent, AnimatedPageContent } from '@/containers/bookDetail';
import { BookDetail, fetchBookDetail, fetchChapterContent } from '@/services/books';

function BookDetailContent() {
    const { setBookContent, updateBookContent, setReadingText, setBookIds } = useBook();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isbn = searchParams.get('isbn');
    const [book, setBook] = useState<BookDetail | null>(null);
    const handleReadChapter = useCallback(async (data: BookDetail, chapterId: number) => {
        try {
            const chapterData = await fetchChapterContent(String(data.isbn), String(chapterId));
            const text = chapterData.content;
            
            setReadingText(text, data.title);
            localStorage.setItem('lastRead', JSON.stringify({
                isbn: String(data.isbn),
                chapterId: String(chapterId),
                title: data.title,
            }));
            setBookIds(String(data.isbn), String(chapterId));
            
            router.push('/read');
        } catch {
            toast.error('챕터를 불러오지 못했습니다.');
        }
    }, [router, setReadingText, setBookIds]);

    useEffect(() => {
        if (!isbn) return;

        fetchBookDetail(isbn)
            .then((data) => {
                setBook(data);
                setBookContent(
                    <LeftBookDetailContent book={data} />,
                    <RightBookDetailContent book={data} onReadChapter={(chapterId) => handleReadChapter(data, chapterId)} />
                );
            })
            .catch((err) => {
                toast.error(err instanceof Error ? err.message : '책 정보를 불러오지 못했습니다.');
            });
    }, [isbn, setBookContent, handleReadChapter]);

    return null;
}

export default function BookDetailPage() {
    return (
        <Suspense fallback={null}>
            <BookDetailContent />
        </Suspense>
    );
}