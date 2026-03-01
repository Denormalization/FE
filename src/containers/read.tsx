'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { POEM_TEXT } from '@/mock/read';
import EyeTrack from '@/components/layout/eyeTrack';

const PageContent = ({
    text,
    delay = 0,
    activeId
}: {
    text: string;
    delay?: number;
    activeId: string | null
}) => {
    const [visible, setVisible] = useState(false);

    const sentences = useMemo(() => {
        return text.split(/(?<=[.!?])\s+|(?<=\n)/).filter(s => s.trim().length > 0);
    }, [text]);

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
                    text-gray-700 text-xl leading-[2.5] text-justify
                    transition-all duration-[2000ms] ease-out
                    ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}
                `}
                style={pageStyle}
            >
                {sentences.map((sentence, idx) => {
                    const sentenceId = `sentence-${idx}`;
                    const isActive = activeId === sentenceId;

                    return (
                        <span
                            key={idx}
                            id={sentenceId}
                            className={`
                                transition-all duration-300 rounded-md px-1.5 py-0.5
                                ${isActive
                                    ? 'bg-yellow-100 text-yellow-900 font-medium scale-[1.02] shadow-[0_0_15px_-3px_rgba(250,204,21,0.5)]'
                                    : 'hover:bg-gray-50'
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
    const { setBookContent } = useBook();
    const [activeGazeId, setActiveGazeId] = useState<string | null>(null);

    useEffect(() => {
        setBookContent(
            <PageContent text={POEM_TEXT} activeId={activeGazeId} />,
            <PageContent text={POEM_TEXT} delay={1200} activeId={activeGazeId} />
        );
    }, [setBookContent, activeGazeId]);

    return (
        <div className="absolute inset-0 pointer-events-none">
            <EyeTrack onGazeUpdate={(id) => setActiveGazeId(id)} />

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