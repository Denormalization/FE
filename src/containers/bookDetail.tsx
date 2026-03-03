'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { BookDetail } from '@/services/books';

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

export function RightBookDetailContent({ book }: { book: BookDetail }) {
    const [view, setView] = useState<'chapters' | 'intro'>('intro');

    const handleToggleView = () => {
        setView(prev => prev === 'chapters' ? 'intro' : 'chapters');
    };

    return (
        <div className="flex h-full w-full flex-col px-10 py-8 overflow-y-auto relative">
            <div className="flex items-center gap-2 mb-8">
                <img src="/icons/readBook.svg" alt="content" className="h-6 w-6" />
                <h2 className="text-xl font-bold text-gray-800">
                    {view === 'chapters' ? '목차' : '책 소개'}
                </h2>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
                {view === 'chapters' ? (
                    <div className="w-full max-w-md space-y-3 overflow-y-auto pr-2
                        [&::-webkit-scrollbar]:w-1
                        [&::-webkit-scrollbar-track]:bg-transparent
                        [&::-webkit-scrollbar-thumb]:bg-slate-200
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                        {book.chapters.length > 0 ? (
                            book.chapters.map((ch) => (
                                <div key={ch.orderNum} className="flex items-center gap-3 py-2 border-b border-gray-100">
                                    <span className="text-xs text-gray-400 w-8 shrink-0 text-right">{ch.orderNum}</span>
                                    <span className="text-sm text-gray-700">{ch.title}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center">목차 정보가 없습니다.</p>
                        )}
                    </div>
                ) : (
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
            </div>

            <div className="absolute bottom-10 right-12">
                <button
                    onClick={handleToggleView}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm cursor-pointer"
                >
                    <span>{view === 'chapters' ? '책 소개 보기' : '목차 보기'}</span>
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
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    );
}