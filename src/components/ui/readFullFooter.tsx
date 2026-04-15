'use client';

import { useEffect, useState } from 'react';
import { IoSettingsOutline } from 'react-icons/io5';
import { BiExpand } from 'react-icons/bi';
import { VIEWER_THEMES } from '@/constants/viewerSettings';

interface ReadFullFooterProps {
    currentPage: number;
    totalPages: number;
    onPageChange?: (page: number) => void;
    onSettingsClick?: () => void;
    onFullscreenClick?: () => void;
    showBars: boolean;
    theme?: string;
}

export default function ReadFullFooter({
    currentPage,
    totalPages,
    onPageChange,
    onSettingsClick,
    onFullscreenClick,
    showBars,
    theme,
}: ReadFullFooterProps) {
    const [sliderValue, setSliderValue] = useState(currentPage);

    useEffect(() => {
        setSliderValue(currentPage);
    }, [currentPage]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value);
        setSliderValue(value);
        onPageChange?.(value);
    };

    const safeTotalPages = Math.max(1, totalPages);
    const progress = (sliderValue / safeTotalPages) * 100;

    const themeData = VIEWER_THEMES.find((t) => t.id === (theme ?? 'white'));
    const textColor = themeData?.text ?? 'text-gray-500';
    const borderColor = themeData?.border ?? 'border-gray-200';

    return (
        <footer 
            className={`flex items-center gap-4 px-12 py-8 border-t transition-all duration-300 ease-in-out ${borderColor} ${
                showBars 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-full pointer-events-none'
            }`}
        >

            <div className="flex-1 relative">

                <div className={`h-1 rounded-full w-full ${borderColor.replace('border-', 'bg-').replace('-200', '-200')}`} />

                <div
                    className="absolute top-0 left-0 h-1 bg-red-500 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                />

                <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-md transition-all"
                    style={{ left: `calc(${progress}% - 6px)` }}
                />

                <input
                    type="range"
                    min={1}
                    max={safeTotalPages}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>


            <div className={`${textColor} text-sm min-w-[80px]`}>
                {sliderValue}/{safeTotalPages}
            </div>


            <div className="flex items-center gap-2">
                <button
                    onClick={onSettingsClick}
                    className={`flex items-center justify-center w-10 h-10 transition-colors cursor-pointer rounded-full hover:bg-gray-100 ${textColor.replace('text-', 'text-').replace('800', '400').replace('700', '400').replace('600', '400')} hover:${textColor.replace('text-', 'text-').replace('400', '600').replace('500', '600')}`}
                    aria-label="설정"
                >
                    <IoSettingsOutline size={22} />
                </button>
                <button
                    onClick={onFullscreenClick}
                    className={`flex items-center justify-center w-10 h-10 transition-colors cursor-pointer rounded-full hover:bg-gray-100 ${textColor.replace('text-', 'text-').replace('800', '400').replace('700', '400').replace('600', '400')} hover:${textColor.replace('text-', 'text-').replace('400', '600').replace('500', '600')}`}
                    aria-label="전체 화면"
                >
                    <BiExpand size={22} />
                </button>
            </div>
        </footer>
    );
}
