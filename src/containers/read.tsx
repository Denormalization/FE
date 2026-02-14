'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { POEM_TEXT } from '@/mock/read';

export default function Read() {
    const router = useRouter();
    const { setBookContent } = useBook();
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);

    useEffect(() => {
        setShowLeft(true);
        const t = setTimeout(() => {
            setShowRight(true);
        }, 1200);
        return () => clearTimeout(t);
    }, []);

    const pageStyle = (visible: boolean) => ({
        clipPath: visible ? 'inset(0 0 0 0)' : 'inset(0 0 100% 0)',
        transition:
            'clip-path 2s ease-out, opacity 1s ease-out, transform 1.5s ease-out',
        maskImage: visible
            ? 'none'
            : 'linear-gradient(to bottom, black 70%, transparent 100%)',
        WebkitMaskImage: visible
            ? 'none'
            : 'linear-gradient(to bottom, black 70%, transparent 100%)',
    });

    const leftContent = (
        <div className="flex h-full w-full overflow-hidden px-24 py-[3rem]">
            <div
                className={`
                    text-gray-700 text-xl leading-[2.2] text-justify
                    transition-all duration-[2000ms] ease-out
                    ${showLeft ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                style={pageStyle(showLeft)}
            >
                {POEM_TEXT}
            </div>
        </div>
    );

    const rightContent = (
        <div className="flex h-full w-full overflow-hidden px-24 py-[3rem]">
            <div
                className={`
                    text-gray-700 text-xl leading-[2.2] text-justify
                    transition-all duration-[2000ms] ease-out
                    ${showRight ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                style={pageStyle(showRight)}
            >
                {POEM_TEXT}
            </div>
        </div>
    );

    useEffect(() => {
        setBookContent(leftContent, rightContent);
    }, [showLeft, showRight]);

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
            <div className="relative w-[80rem] h-[50rem]">
                <div className="absolute right-[-1.5rem] bottom-0 z-[100] flex flex-col gap-2 pointer-events-auto">

                    <button
                        className="
                            flex h-14 w-28 items-center justify-center
                            rounded-lg text-white font-bold
                            bg-gradient-to-br from-[#409659] to-[#38844E]
                            transition-all duration-300
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
                            transition-all duration-300
                            active:scale-95
                            cursor-pointer
                            pr-4
                        "
                        style={{ marginLeft: '-3.5rem', fontSize: '1rem' }}
                    >
                        전체 보기
                    </button>
                </div>
            </div>
        </div>
    );
}