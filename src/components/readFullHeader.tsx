'use client';

import { useRouter } from 'next/navigation';
import { IoChevronBack } from 'react-icons/io5';
import { VIEWER_THEMES } from '@/constants/viewerSettings';

interface ReadFullHeaderProps {
    title: string;
    showBars: boolean;
    theme?: string;
}

export default function ReadFullHeader({ title, showBars, theme }: ReadFullHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    const themeData = VIEWER_THEMES.find((t) => t.id === (theme ?? 'white'));
    const textColor = themeData?.text ?? 'text-gray-800';
    const borderColor = themeData?.border ?? 'border-gray-200';

    return (
        <header 
            className={`flex items-center gap-4 px-12 py-8 border-b transition-all duration-300 ease-in-out ${borderColor} ${
                showBars 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 -translate-y-full pointer-events-none'
            }`}
        >
            <button
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                aria-label="뒤로 가기"
            >
                <IoChevronBack size={24} />
            </button>
            <h1 className={`text-xl font-medium ${textColor}`}>{title}</h1>
        </header>
    );
}
