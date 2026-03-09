'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { useBook } from '@/context/bookContext';
import { LeftBookDetailContent, RightBookDetailContent, AnimatedPageContent } from '@/containers/bookDetail';
import { BookDetail, fetchBookDetail, fetchChapterContent } from '@/services/books';

function BookDetailContent() {
    const { setBookContent, updateBookContent, setReadingText } = useBook();
    const searchParams = useSearchParams();
    const router = useRouter();
    const isbn = searchParams.get('isbn');
    const [book, setBook] = useState<BookDetail | null>(null);
    const [reading, setReading] = useState(false);
    const [chapterContent, setChapterContent] = useState('');
    const [currentChapterId, setCurrentChapterId] = useState<number | null>(null);

    const showDetail = useCallback((data: BookDetail) => {
        setReading(false);
        updateBookContent(
            <LeftBookDetailContent book={data} />,
            <RightBookDetailContent book={data} onReadChapter={(chapterId) => handleReadChapter(data, chapterId)} />
        );
    }, [updateBookContent]);

    const handleReadChapter = useCallback(async (data: BookDetail, chapterId: number) => {
        try {
            const chapterData = await fetchChapterContent(String(data.isbn), String(chapterId));
            const text = chapterData.content;
            setChapterContent(text);
            setCurrentChapterId(chapterId);
            setReadingText(text, data.title);
            updateBookContent(
                <AnimatedPageContent text={text} />,
                <AnimatedPageContent text={text} delay={1200} />
            );
            setReading(true);
        } catch {
            toast.error('챕터를 불러오지 못했습니다.');
        }
    }, [updateBookContent, setReadingText]);

    const handleOriginalView = useCallback(async () => {
        if (!book || currentChapterId === null) return;
        try {
            const chapterData = await fetchChapterContent(String(book.isbn), String(currentChapterId));
            const text = chapterData.content;
            setChapterContent(text);
            setReadingText(text, book.title);
            updateBookContent(
                <AnimatedPageContent text={text} />,
                <AnimatedPageContent text={text} delay={1200} />
            );
        } catch {
            toast.error('원작을 불러오지 못했습니다.');
        }
    }, [book, currentChapterId, updateBookContent, setReadingText]);

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

    if (!reading || !book) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-[80rem] h-[50rem]">
                <div className="absolute right-[-1.5rem] bottom-0 flex flex-col gap-2 pointer-events-auto">
                    <button
                        onClick={handleOriginalView}
                        className="
                            flex h-14 w-28 items-center justify-center
                            rounded-lg text-white font-bold
                            bg-gradient-to-br from-[#409659] to-[#38844E]
                            shadow-[0_4px_10px_rgba(0,0,0,0.2)]
                            transition-all duration-300
                            hover:translate-x-20 hover:scale-105 hover:shadow-[5px_5px_15px_rgba(0,0,0,0.3)] hover:brightness-110
                            active:scale-95
                            cursor-pointer
                            pr-4
                        "
                        style={{ marginLeft: '-3.5rem', fontSize: '1rem' }}
                    >
                        원작 보기
                    </button>
                    <button
                        onClick={() => router.push('/read/full')}
                        className="
                            flex h-14 w-28 items-center justify-center
                            rounded-lg text-white font-bold
                            bg-gradient-to-br from-[#409659] to-[#38844E]
                            shadow-[0_4px_10px_rgba(0,0,0,0.2)]
                            transition-all duration-300
                            hover:translate-x-20 hover:scale-105 hover:shadow-[5px_5px_15px_rgba(0,0,0,0.3)] hover:brightness-110
                            active:scale-95
                            cursor-pointer
                            pr-4
                        "
                        style={{ marginLeft: '-3.5rem', fontSize: '1rem' }}
                    >
                        전체 보기
                    </button>
                    <button
                        onClick={() => showDetail(book)}
                        className="
                            flex h-14 w-28 items-center justify-center
                            rounded-lg text-white font-bold
                            bg-gradient-to-br from-[#409659] to-[#38844E]
                            shadow-[0_4px_10px_rgba(0,0,0,0.2)]
                            transition-all duration-300
                            hover:translate-x-20 hover:scale-105 hover:shadow-[5px_5px_15px_rgba(0,0,0,0.3)] hover:brightness-110
                            active:scale-95
                            cursor-pointer
                            pr-4
                        "
                        style={{ marginLeft: '-3.5rem', fontSize: '1rem' }}
                    >
                        상세 보기
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function BookDetailPage() {
    return (
        <Suspense fallback={null}>
            <BookDetailContent />
        </Suspense>
    );
}