'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Book from '../components/book';
import { POEM_TEXT } from '@/mock/read';

export default function Read() {
    const router = useRouter();
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
        transition: 'clip-path 2s ease-out, opacity 1s ease-out, transform 1.5s ease-out',
        maskImage: visible ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)',
        WebkitMaskImage: visible ? 'none' : 'linear-gradient(to bottom, black 70%, transparent 100%)'
    });

    const leftContent = (
        <div className="flex h-full w-full overflow-hidden px-24 py-[3rem]">
            <div
                className={`
                    text-gray-700 text-xl leading-[2.2] text-justify
                    transition-all duration-2000 ease-out
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
                    transition-all duration-2000 ease-out
                    ${showRight ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                style={pageStyle(showRight)}
            >
                {POEM_TEXT}
            </div>
        </div>
    );

    return (
        <div className="relative">
            <Book leftContent={leftContent} rightContent={rightContent} />

            <div className="absolute right-[-1.5rem] bottom-0 z-[5] flex flex-col gap-2">
                <button
                    className="
                        flex h-14 w-28 items-center justify-center
                        rounded-lg text-white font-bold text-sm
                        bg-gradient-to-br from-[#409659] to-[#38844E]
                        shadow-[0.25rem_0.25rem_0.75rem_rgba(0,0,0,0.3)]
                        transition-all duration-300
                        hover:translate-x-20
                        hover:shadow-[0.375rem_0.375rem_1rem_rgba(0,0,0,0.4)]
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
                        rounded-lg text-white font-bold text-sm
                        bg-gradient-to-br from-[#409659] to-[#38844E]
                        shadow-[0.25rem_0.25rem_0.75rem_rgba(0,0,0,0.3)]
                        transition-all duration-300
                        hover:translate-x-20
                        hover:shadow-[0.375rem_0.375rem_1rem_rgba(0,0,0,0.4)]
                        cursor-pointer
                        pr-4
                    "
                    style={{ marginLeft: '-3.5rem', fontSize: '1rem' }}
                >
                    전체 보기
                </button>
            </div>
        </div>
    );
}