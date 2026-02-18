'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { BookData } from '@/mock/home';

export function LeftBookDetailContent({ book }: { book: BookData }) {
    const router = useRouter();
    const { triggerFlip } = useBook();

    const handleBack = () => {
        triggerFlip();
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
                    {book.image ? (
                        <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
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
                        <span className="text-gray-800 font-medium">{book.author}</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-gray-500 w-12 shrink-0">출판사</span>
                        <span className="text-gray-800 font-medium">눈물 흘리는 척 하지마</span>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
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

export function RightBookDetailContent({ book }: { book: BookData }) {
    const [view, setView] = useState<'quote' | 'intro'>('quote');

    const handleToggleView = () => {
        setView(prev => prev === 'quote' ? 'intro' : 'quote');
    };

    return (
        <div className="flex h-full w-full flex-col px-10 py-8 overflow-y-auto relative">
            <div className="flex items-center gap-2 mb-8">
                <img src="/icons/readBook.svg" alt="content" className="h-6 w-6" />
                <h2 className="text-xl font-bold text-gray-800">
                    {view === 'quote' ? '책 속 한 문장' : '책 소개'}
                </h2>
            </div>

            <div className="flex-1 flex flex-col justify-center items-center">
                {view === 'quote' ? (
                    <div className="w-full max-w-md text-center space-y-6">
                        <span className="text-4xl text-gray-400 font-serif">"</span>
                        <p className="text-lg text-gray-700 leading-relaxed font-medium">
                            지금부터 내가 당근 인턴 합격하는 방법 알려줄게
                        </p>
                        <span className="text-4xl text-gray-400 font-serif block rotate-180">"</span>
                    </div>
                ) : (
                    <div className="w-full h-full text-gray-700 leading-loose text-sm overflow-y-auto pr-2 
                        [&::-webkit-scrollbar]:w-1 
                        [&::-webkit-scrollbar-track]:bg-transparent 
                        [&::-webkit-scrollbar-thumb]:bg-slate-200 
                        [&::-webkit-scrollbar-thumb]:rounded-full 
                        hover:[&::-webkit-scrollbar-thumb]:bg-slate-300">
                        <p>
                            데뷔작 《마션》과 후속작 《아르테미스》가 연달아 대성공을 거두며 뉴욕 타임스와 아마존 베스트셀러에 이름을 올린 명실상부 최고의 SF 작가, 앤디 위어의 신작. 집필 시작도 전에 수많은 출판사가 치열한 판권 경쟁에 뛰어들어, 30여 개국에서 계약을 마치고 동시 출간을 준비 중이다. 영화계 또한 MGM에서 제작을 확정했다.
                        </p>
                        <p className="mt-4">
                            글을 쓸 때 과학적 사실을 조사하고 검증하는 것으로 정평이 난 작가의 작품인 만큼 흠잡을 데 없는 과학적 지식은 더할 나위 없다. 전작들에 이어 이번 작품에서도 작가의 장기인 과학을 기반으로 한 SF 세계관과 낙관적 감수성이 유감없이 그려졌다. 특히 작가가 치밀하게 구상한 '특별한 캐릭터'의 등장은 단연 《프로젝트 헤일메리》의 백미다.
                        </p>
                        <p className="mt-4">
                            이번 신작은 그 특별한 캐릭터와의 공생과 연대 그리고 인류를 뛰어넘은 우정에 대한 이야기가 주를 이룬다. 지구를 구하기 위해서 정작 스스로는 지구로 돌아오지 못할 헤일메리호에 오른 '좋은 사람'인 주인공. 《마션》에서 한 인간을 구하기 위한 인류애를 보여줬다면 이번에는 전 인류를 구하기 위한 한 인간의 사명감과 애정이 한층 진하게 펼쳐진다.
                        </p>
                    </div>
                )}
            </div>

            <div className="absolute bottom-10 right-12">
                <button
                    onClick={handleToggleView}
                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
                >
                    <span>{view === 'quote' ? '책 소개 보기' : '책 속 한 문장 보기'}</span>
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