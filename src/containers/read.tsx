'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { POEM_TEXT } from '@/mock/read';
import EyeTrack from '@/components/layout/eyeTrack';
import { fetchChapterContent } from '@/services/books';
import { recordGazeEvent } from '@/services/gaze';

const PageContent = ({
    text,
    delay = 0,
    idPrefix
}: {
    text: string;
    delay?: number;
    idPrefix: string;
}) => {
    const [visible, setVisible] = useState(false);
    const { activeGazeId } = useBook();

    const sentences = useMemo(() => {
        return text.split(/(?<=[.!?])\s+|(?<=\n)/).filter(s => s.trim().length > 0);
    }, [text]);

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(true);
        }, delay);
        return () => clearTimeout(t);
    }, [delay, text]);

    return (
        <div className="flex h-full w-full px-24 py-[3rem]">
            <div
                className={`
                    text-gray-700 text-xl leading-[2.5] text-justify
                    transition-all duration-[2000ms] ease-out
                    ${visible
                        ? 'opacity-100 translate-y-0 [clip-path:inset(0_0_0_0)]'
                        : 'opacity-0 -translate-y-10 [clip-path:inset(0_0_100%_0)] [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]'}
                `}
            >
                {sentences.map((sentence, idx) => {
                    const sentenceId = `${idPrefix}-sentence-${idx}`;
                    const isActive = activeGazeId === sentenceId;

                    return (
                        <span
                            key={idx}
                            id={sentenceId}
                            style={{
                                WebkitBoxDecorationBreak: 'clone',
                                boxDecorationBreak: 'clone',
                            } as any}
                            className={`
                                transition-all duration-500 px-1 py-0.5 mx-0.5
                                ${isActive
                                    ? 'border-b-2 border-amber-400/80 z-10'
                                    : 'text-gray-500 font-medium'
                                }
                            `}
                        >
                            {sentence}{' '}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};

export default function Read() {
    const router = useRouter();
    const { setBookContent, setActiveGazeId, readingText, setReadingText, setOverlayContent } = useBook();
    const [currentPage, setCurrentPage] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const isFlippingRef = useRef(false);
    const stickyIdRef = useRef<string | null>(null);
    const stickyTimeoutRef = useRef<any>(null);
    const gazeStartTimeRef = useRef<number | null>(null);
    const currentBookInfoRef = useRef<{ isbn: number; chapterId: number }>({ isbn: 1, chapterId: 1 });

    const pages = useMemo(() => {
        const allSentences = POEM_TEXT.split(/(?<=[.!?])\s+|(?<=\n)/).filter(s => s.trim().length > 0);
        const pageSize = 12;
        const result = [];
        for (let i = 0; i < allSentences.length; i += pageSize) {
            result.push(allSentences.slice(i, i + pageSize).join(' '));
        }
        return result;
    }, []);

    useEffect(() => {
        const leftPage = pages[currentPage] || '';
        const rightPage = pages[currentPage + 1] || '';

        setBookContent(
            <PageContent text={leftPage} idPrefix="left" />,
            <PageContent text={rightPage} delay={1200} idPrefix="right" />
        );
    }, [setBookContent, currentPage, pages]);

    const handleGazeUpdate = (id: string | null) => {
        const now = Date.now();
        const bookInfo = currentBookInfoRef.current;

        if (stickyIdRef.current && stickyIdRef.current !== id) {
            if (gazeStartTimeRef.current && bookInfo) {
                const dwellTime = now - gazeStartTimeRef.current;

                if (dwellTime >= 100) {
                    const el = document.getElementById(stickyIdRef.current);
                    if (el) {
                        const text = el.textContent?.trim() || el.innerText?.trim();
                        if (text) {
                            recordGazeEvent({
                                bookId: bookInfo.isbn,
                                chapterId: bookInfo.chapterId,
                                text,
                                dwellTime,
                                timestamp: new Date().toISOString()
                            }).catch(() => { });
                        }
                    }
                }
            }
            gazeStartTimeRef.current = null;
        }

        if (id) {
            if (stickyTimeoutRef.current) {
                clearTimeout(stickyTimeoutRef.current);
                stickyTimeoutRef.current = null;
            }

            if (stickyIdRef.current !== id) {
                gazeStartTimeRef.current = now;
                stickyIdRef.current = id;
                setActiveGazeId(id);
            }
        } else {
            if (!stickyTimeoutRef.current && stickyIdRef.current) {
                stickyTimeoutRef.current = setTimeout(() => {
                    const finalDwellTime = Date.now() - (gazeStartTimeRef.current || now);

                    if (gazeStartTimeRef.current && bookInfo && finalDwellTime >= 100 && stickyIdRef.current) {
                        const el = document.getElementById(stickyIdRef.current);
                        if (el) {
                            const text = el.textContent?.trim() || el.innerText?.trim();
                            if (text) {
                                recordGazeEvent({
                                    bookId: bookInfo.isbn,
                                    chapterId: bookInfo.chapterId,
                                    text,
                                    dwellTime: finalDwellTime,
                                    timestamp: new Date().toISOString()
                                }).catch(() => { });
                            }
                        }
                    }

                    setActiveGazeId(null);
                    gazeStartTimeRef.current = null;
                    stickyIdRef.current = null;
                    stickyTimeoutRef.current = null;
                }, 150);
            }
        }

        if (id && id.startsWith('right-sentence-') && !isFlippingRef.current) {
            const parts = id.split('-');
            const sentenceIdx = parseInt(parts[parts.length - 1] || '0');
            const rightPageSentences = (pages[currentPage + 1] || '').split(/(?<=[.!?])\s+|(?<=\n)/).filter(s => s.trim().length > 0);

            if (sentenceIdx === rightPageSentences.length - 1) {
                if (currentPage + 2 < pages.length) {
                    isFlippingRef.current = true;
                    setTimeout(() => {
                        setCurrentPage(prev => prev + 2);
                        setActiveGazeId(null);
                        isFlippingRef.current = false;
                    }, 1500);
                }
            }
        }
    };
    useEffect(() => {
        const raw = localStorage.getItem('lastRead');
        if (raw) {
            try {
                const { isbn, chapterId, title } = JSON.parse(raw);
                currentBookInfoRef.current = { isbn: Number(isbn), chapterId: Number(chapterId) };

                if (!readingText) {
                    fetchChapterContent(isbn, chapterId)
                        .then((data) => {
                            setReadingText(data.content, title);
                            setBookContent(
                                <PageContent text={data.content} idPrefix="left" />,
                                <PageContent text={data.content} delay={1200} idPrefix="right" />
                            );
                            setLoaded(true);
                        })
                        .catch(() => {
                            setLoaded(true);
                        });
                } else {
                    setBookContent(
                        <PageContent text={readingText} idPrefix="left" />,
                        <PageContent text={readingText} delay={1200} idPrefix="right" />
                    );
                    setLoaded(true);
                }
            } catch {
                setLoaded(true);
            }
        } else {
            if (readingText) {
                setBookContent(
                    <PageContent text={readingText} idPrefix="left" />,
                    <PageContent text={readingText} delay={1200} idPrefix="right" />
                );
            }
            setLoaded(true);
        }
    }, [setBookContent, readingText, setReadingText]);

    useEffect(() => {
        setOverlayContent(<EyeTrack onGazeUpdate={handleGazeUpdate} />);
        return () => setOverlayContent(null);
    }, [handleGazeUpdate, setOverlayContent]);

    if (!loaded) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            <div className="relative w-[80rem] h-[50rem]">
                <div className="absolute -right-6 bottom-0 flex flex-col gap-2 pointer-events-auto">
                    <button
                        className="
                            flex h-14 w-28 items-center justify-center
                            rounded-lg text-white font-bold
                            bg-gradient-to-br from-[#409659] to-[#38844E]
                            shadow-[0_4px_10px_rgba(0,0,0,0.2)]
                            transition-all duration-300
                            hover:translate-x-20 hover:scale-105 hover:shadow-[5px_5px_15px_rgba(0,0,0,0.3)] hover:brightness-110
                            active:scale-95
                            cursor-pointer
                            pr-4 -ml-14 text-base
                        "
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
                            pr-4 -ml-14 text-base
                        "
                    >
                        전체 보기
                    </button>
                </div>
            </div>
        </div>
    );
}