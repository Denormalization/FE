'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
    const recordedSentencesRef = useRef(new Set<string>());

    const suggestionTimeoutRef = useRef<any>(null);
    const [suggestion, setSuggestion] = useState<{ id: string; x: number; y: number; text: string } | null>(null);
    const setSuggestionRef = useRef(setSuggestion);
    useEffect(() => { setSuggestionRef.current = setSuggestion; }, [setSuggestion]);

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

            gazeStartTimeRef.current = null;
        }

        if (id) {
            if (stickyTimeoutRef.current) {
                clearTimeout(stickyTimeoutRef.current);
                stickyTimeoutRef.current = null;
            }
            if (stickyIdRef.current !== id) {
                // 새 문장으로 이동: 기존 타이머 취소 후 새로 시작
                if (suggestionTimeoutRef.current) {
                    clearTimeout(suggestionTimeoutRef.current);
                    suggestionTimeoutRef.current = null;
                }
                gazeStartTimeRef.current = now;
                stickyIdRef.current = id;
                setActiveGazeId(id);
                setSuggestionRef.current(null);

                suggestionTimeoutRef.current = setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        const text = el.textContent?.trim() || "";
                        setSuggestionRef.current({
                            id: id,
                            x: rect.right,
                            y: rect.top,
                            text: text
                        });
                        if (text) {
                            const bInfo = currentBookInfoRef.current;
                            const eventKey = `${bInfo.isbn}-${bInfo.chapterId}-${text}`;
                            if (!recordedSentencesRef.current.has(eventKey)) {
                                recordGazeEvent({
                                    bookId: bInfo.isbn,
                                    chapterId: bInfo.chapterId,
                                    text: text,
                                    dwellTime: Date.now() - (gazeStartTimeRef.current ?? Date.now()),
                                    timestamp: new Date().toISOString()
                                }).then(() => {
                                    recordedSentencesRef.current.add(eventKey);
                                }).catch(() => { });
                            }
                        }
                    }
                }, 4000);
            }
            // 같은 문장에 계속 머무르는 경우: 타이머 유지 (건드리지 않음)
        } else {
            if (!stickyTimeoutRef.current && stickyIdRef.current) {
                stickyTimeoutRef.current = setTimeout(() => {
                    if (suggestionTimeoutRef.current) {
                        clearTimeout(suggestionTimeoutRef.current);
                        suggestionTimeoutRef.current = null;
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
        <>
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
            </div>

            {suggestion && typeof document !== 'undefined' && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        left: `${suggestion.x + 12}px`,
                        top: `${suggestion.y - 8}px`,
                        zIndex: 2147483647,
                    }}
                    className="pointer-events-auto"
                >
                    <div
                        style={{
                            animation: 'suggestionIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
                            transformOrigin: 'top left',
                        }}
                        className="relative bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.13)] border border-gray-100 flex flex-col items-start min-w-[220px] max-w-[280px] overflow-hidden"
                    >
                        <div className="w-full h-1 bg-gradient-to-r from-amber-400 to-orange-400" />

                        <div className="px-5 py-4 w-full">
                            <h3 className="text-[15px] font-bold text-gray-800 mb-1 leading-snug font-bookmyungjo">
                                각색하시겠습니까?
                            </h3>
                            <p className="text-[12px] text-gray-400 leading-relaxed mb-4 font-bookmyungjo">
                                이 문장을 당신만의 시선으로<br />새롭게 그려보세요
                            </p>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        alert("각색을 시작합니다.");
                                        setSuggestion(null);
                                    }}
                                    className="flex-1 py-2 bg-gray-900 text-white rounded-xl text-[12px] font-bold hover:bg-gray-700 active:scale-95 transition-all"
                                >
                                    시작하기
                                </button>
                                <button
                                    onClick={() => setSuggestion(null)}
                                    className="py-2 px-3 bg-gray-100 text-gray-500 rounded-xl text-[12px] font-medium hover:bg-gray-200 active:scale-95 transition-all"
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                    <style>{`
                    @keyframes suggestionIn {
                        from { opacity: 0; transform: scale(0.85) translateY(-6px); }
                        to   { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `}</style>
                </div>,
                document.body
            )}
        </>
    );
}