'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { BookDetail, fetchChapterContent } from '@/services/books';

export function LeftBookDetailContent({ book }: { book: BookDetail }) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="flex h-full w-full flex-col px-10 py-4 overflow-y-auto relative">
            <div className="flex items-center gap-2 mb-8 mt-4">
                <img src="/icons/readBook.svg" alt="detail" className="h-6 w-6" />
                <h2 className="text-xl font-bold text-gray-800">상세 정보</h2>
            </div>

            <div className="flex flex-col items-center">
                <div className="w-[26rem] h-[32rem] bg-gray-200 rounded-md shadow-lg overflow-hidden mb-8 flex items-center justify-center">
                    {book.coverUrl ? (
                        <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400 p-8 text-center">
                            <h3 className="text-xl font-bold mb-2">{book.title}</h3>
                            <p className="text-sm">이미지가 없습니다</p>
                        </div>
                    )}
                </div>

                <div className="w-full text-left space-y-2 mt-4">
                    <div className="flex gap-4">
                        <span className="text-gray-500 w-12 shrink-0">작가</span>
                        <span className="text-gray-800 font-medium">{book.authors.join(', ')}</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-500 w-12 shrink-0">출판사</span>
                        <span className="text-gray-800 font-medium">{book.publisher}</span>
                    </div>
                    {book.genres.length > 0 && (
                        <div className="flex gap-4">
                            <span className="text-gray-500 w-12 shrink-0">장르</span>
                            <span className="text-gray-800 font-medium">{book.genres.join(', ')}</span>
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm cursor-pointer"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            <span>뒤로가기</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── 애니메이션 페이지 컨텐츠 (read 페이지와 동일) ── */
export const AnimatedPageContent = ({ text, delay = 0 }: { text: string; delay?: number }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setVisible(true);
        }, delay);
        return () => clearTimeout(t);
    }, [delay]);

    const pageStyle = {
        clipPath: visible ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
        transition: 'clip-path 2s ease-out, opacity 1s ease-out, transform 1.5s ease-out',
        maskImage: visible ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
        WebkitMaskImage: visible ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
    };

    return (
        <div className="flex h-full w-full overflow-hidden px-24 py-[3rem]">
            <div
                className={`
                    text-gray-700 text-xl leading-[2.2] text-justify
                    transition-all duration-[2000ms] ease-out
                    ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                style={pageStyle}
            >
                {text}
            </div>
        </div>
    );
};

export function RightBookDetailContent({ book, onReadChapter }: { book: BookDetail; onReadChapter?: (chapterId: number) => void }) {
    const [view, setView] = useState<'intro' | 'chapters'>('intro');
    const [loadingChapter, setLoadingChapter] = useState(false);

    const handleReadChapter = useCallback(async (chapterId: number) => {
        if (!onReadChapter) return;
        setLoadingChapter(true);
        try {
            onReadChapter(chapterId);
        } finally {
            setLoadingChapter(false);
        }
    }, [onReadChapter]);

    return (
        <div className="flex h-full w-full flex-col px-10 py-8 overflow-y-auto relative pointer-events-auto">
            <div className="flex items-center gap-2 mb-8">
                <img src="/icons/readBook.svg" alt="content" className="h-6 w-6" />
                <h2 className="text-xl font-bold text-gray-800">
                    {view === 'intro' ? '책 소개' : '챕터 목록'}
                </h2>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
                {/* 책 소개 */}
                {view === 'intro' && (
                    <div className="w-full h-full text-gray-700 leading-loose text-sm overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-slate-200
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                        {book.description ? (
                            <p className="whitespace-pre-line">{book.description}</p>
                        ) : (
                            <p className="text-gray-400">소개 정보가 없습니다.</p>
                        )}
                    </div>
                )}

                {/* 챕터 목록 */}
                {view === 'chapters' && (
                    <div className="w-full h-full overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-slate-200
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                        {book.chapters.length > 0 ? (
                            <div className="space-y-1">
                                {book.chapters.map((ch) => (
                                    <button
                                        key={ch.orderNum}
                                        onClick={() => handleReadChapter(ch.orderNum)}
                                        disabled={loadingChapter}
                                        className="w-full flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors text-left group cursor-pointer disabled:opacity-50"
                                    >
                                        <span className="text-xs text-gray-400 w-8 shrink-0 text-right">{ch.orderNum}</span>
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{ch.title}</span>
                                        <svg className="ml-auto w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center">챕터가 없습니다.</p>
                        )}
                    </div>
                )}

                {/* 로딩 */}
                {loadingChapter && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <span className="inline-block w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* 하단 네비게이션 */}
            <div className="absolute bottom-10 right-12 flex items-center gap-4">
                {view === 'chapters' && (
                    <button
                        onClick={() => setView('intro')}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm cursor-pointer"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        <span>책 소개</span>
                    </button>
                )}
                {view === 'intro' && (
                    <button
                        onClick={() => setView('chapters')}
                        className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm cursor-pointer"
                    >
                        <span>챕터 보기</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}