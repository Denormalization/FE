'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { POEM_TEXT } from '@/mock/read';
import EyeTrack from '@/components/layout/eyeTrack';
import { fetchChapterContent } from '@/services/books';
import { recordGazeEvent } from '@/services/gaze';

const PageContent = (props: {
    text: string;
    delay?: number;
    idPrefix: string;
}) => {
    const { text, delay = 0, idPrefix } = props;
    const [visible, setVisible] = useState(false);
    const { activeGazeId } = useBook();

    const sentences = useMemo(() => {
        if (!text) return [];
        const matches = text.match(/[^.!?\n]+[.!?]?\n*\s*/g);
        if (!matches) return [];
        return matches.map(s => s.trim()).filter(s => s.length > 0);
    }, [text]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, delay);
        return () => clearTimeout(timer);
    }, [delay, text]);

    const visibilityClass = visible
        ? 'opacity-100 translate-y-0'
        : 'opacity-0 -translate-y-10';

    const pageStyle = {
        clipPath: visible ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
        maskImage: visible ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
        WebkitMaskImage: visible ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
        transition: 'all 2s ease-out'
    };

    return (
        <div className="flex h-full w-full px-24 py-12">
            <div
                style={pageStyle}
                className={"text-gray-700 text-xl leading-[2.5] text-justify " + visibilityClass}
            >
                {sentences.map((sentence, idx) => {
                    const sentenceId = idPrefix + "-sentence-" + idx;
                    const isActive = activeGazeId === sentenceId;

                    return (
                        <span
                            key={idx}
                            id={sentenceId}
                            className={
                                "transition-all duration-500 px-1 py-0.5 mx-0.5 " +
                                (isActive ? "border-b-2 border-amber-400/80 z-10 bg-amber-100/30" : "text-gray-500 font-medium")
                            }
                        >
                            {sentence + " "}
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
    const currentBookInfoRef = useRef({ isbn: 1, chapterId: 1 });

    const suggestionTimeoutRef = useRef<any>(null);
    const [suggestion, setSuggestion] = useState<{ id: string; x: number; y: number; text: string } | null>(null);

    const pages = useMemo(() => {
        const textToSplit = readingText || POEM_TEXT;
        const all = [];
        const matches = textToSplit.match(/[^.!?\n]+[.!?]?\n*\s*/g);
        if (matches) {
            all.push(...matches.map(s => s.trim()).filter(s => s.length > 0));
        }

        const result = [];
        for (let i = 0; i < all.length; i += 12) {
            result.push(all.slice(i, i + 12).join(' '));
        }
        return result;
    }, [readingText]);

    const currentPageRef = useRef(currentPage);
    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    const pagesRef = useRef(pages);
    useEffect(() => {
        pagesRef.current = pages;
    }, [pages]);

    useEffect(() => {
        const leftPage = pages[currentPage] || '';
        const rightPage = pages[currentPage + 1] || '';

        setBookContent(
            <PageContent text={leftPage} idPrefix="left" />,
            <PageContent text={rightPage} delay={1200} idPrefix="right" />
        );
    }, [setBookContent, currentPage, pages]);

    const handleGazeUpdate = useCallback((id: string | null) => {
        const now = Date.now();
        const bookInfo = currentBookInfoRef.current;

        if (stickyIdRef.current && stickyIdRef.current !== id) {
            if (suggestionTimeoutRef.current) {
                clearTimeout(suggestionTimeoutRef.current);
                suggestionTimeoutRef.current = null;
            }

            if (gazeStartTimeRef.current) {
                const dwellTime = now - gazeStartTimeRef.current;
                if (dwellTime >= 100) {
                    const el = document.getElementById(stickyIdRef.current);
                    if (el) {
                        const textContent = el.textContent || "";
                        const text = textContent.trim();
                        if (text) {
                            recordGazeEvent({
                                bookId: bookInfo.isbn,
                                chapterId: bookInfo.chapterId,
                                text: text,
                                dwellTime: dwellTime,
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
                setSuggestion(null);

                if (suggestionTimeoutRef.current) clearTimeout(suggestionTimeoutRef.current);
                suggestionTimeoutRef.current = setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        setSuggestion({
                            id: id,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 20,
                            text: el.textContent?.trim() || ""
                        });
                    }
                }, 4000);
            }
        } else {
            if (!stickyTimeoutRef.current && stickyIdRef.current) {
                stickyTimeoutRef.current = setTimeout(() => {
                    const finalDwellTime = Date.now() - (gazeStartTimeRef.current || now);

                    if (suggestionTimeoutRef.current) {
                        clearTimeout(suggestionTimeoutRef.current);
                        suggestionTimeoutRef.current = null;
                    }

                    if (gazeStartTimeRef.current && finalDwellTime >= 100 && stickyIdRef.current) {
                        const el = document.getElementById(stickyIdRef.current);
                        if (el) {
                            const textContent = el.textContent || "";
                            const text = textContent.trim();
                            if (text) {
                                recordGazeEvent({
                                    bookId: bookInfo.isbn,
                                    chapterId: bookInfo.chapterId,
                                    text: text,
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
            const rightPageSentences = (pagesRef.current[currentPageRef.current + 1] || '').split(/[.!?]\s+/);
            const sentenceIdx = parseInt(id.split('-').pop() || '0');

            if (sentenceIdx === rightPageSentences.length - 1) {
                if (currentPageRef.current + 2 < pagesRef.current.length) {
                    isFlippingRef.current = true;
                    setTimeout(() => {
                        setCurrentPage(prev => prev + 2);
                        setActiveGazeId(null);
                        isFlippingRef.current = false;
                    }, 1500);
                }
            }
        }
    }, [setActiveGazeId]);

    useEffect(() => {
        const raw = localStorage.getItem('lastRead');
        if (raw) {
            try {
                const info = JSON.parse(raw);
                currentBookInfoRef.current = { isbn: Number(info.isbn), chapterId: Number(info.chapterId) };
                if (!readingText) {
                    fetchChapterContent(info.isbn, info.chapterId).then(data => {
                        setReadingText(data.content, info.title);
                        setLoaded(true);
                    }).catch(() => setLoaded(true));
                } else { setLoaded(true); }
            } catch { setLoaded(true); }
        } else { setLoaded(true); }
    }, [readingText, setReadingText]);

    useEffect(() => {
        setOverlayContent(<EyeTrack onGazeUpdate={handleGazeUpdate} />);
        return () => {
            setOverlayContent(null);
        };
    }, [handleGazeUpdate, setOverlayContent]);

    if (!loaded) return null;

    const navButtonStyle = "flex h-14 w-28 items-center justify-center rounded-lg text-white font-bold bg-gradient-to-br from-[#409659] to-[#38844E] shadow-[0_4px_10px_rgba(0,0,0,0.2)] transition-all duration-300 hover:translate-x-20 hover:scale-105 hover:shadow-[5px_5px_15px_rgba(0,0,0,0.3)] hover:brightness-110 active:scale-95 cursor-pointer pr-4 -ml-14 text-base";

    return (
        <div className="absolute inset-0 z-[100] pointer-events-none">
            <div className="relative w-[80rem] h-[50rem] mx-auto">
                <div className="absolute -right-6 bottom-0 flex flex-col gap-2 pointer-events-auto">
                    <button className={navButtonStyle}>
                        원작 보기
                    </button>
                    <button onClick={() => router.push('/read/full')} className={navButtonStyle}>
                        전체 보기
                    </button>
                </div>
            </div>

            {suggestion && (
                <div
                    style={{
                        position: 'fixed',
                        left: `${suggestion.x}px`,
                        top: `${suggestion.y}px`,
                        transform: 'translate(-50%, -100%)',
                        zIndex: 20000,
                    }}
                    className="pointer-events-auto animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500"
                >
                    <div className="relative bg-white p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col items-center min-w-[320px] max-w-[400px]">
                        <div className="text-[#E0E0E0] text-4xl font-serif mb-1 leading-none self-center h-6 select-none relative">
                            <span className="absolute left-1/2 -translate-x-1/2 top-[-10px]">66</span>
                        </div>
                        
                        <h3 className="text-2xl font-bold font-bookmyungjo text-[#222] mb-3 text-center">
                            각색하시겠습니까?
                        </h3>
                        
                        <p className="text-gray-400 text-sm font-bookmyungjo text-center leading-relaxed">
                            이 문장을 당신만의 시선으로 <br /> 새롭게 그려보세요
                        </p>

                        <div className="mt-6 flex flex-col items-center gap-2">
                             <button
                                onClick={() => {
                                    alert("각색을 시작합니다.");
                                    setSuggestion(null);
                                }}
                                className="px-10 py-3 bg-[#222] text-white rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md"
                            >
                                각색 시작하기
                            </button>
                        </div>
                        
                        <div className="text-[#E0E0E0] text-4xl font-serif mt-4 leading-none self-center h-6 select-none relative">
                            <span className="absolute left-1/2 -translate-x-1/2 bottom-[-10px]">99</span>
                        </div>

                        <div className="absolute bottom-[-10px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white shadow-sm" />
                    </div>
                </div>
            )}
        </div>
    );
}