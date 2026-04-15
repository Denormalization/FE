'use client';

import { VIEWER_THEMES } from '@/constants/viewerSettings';

export interface ContentViewerSettings {
    theme: string;
    font: string;
    fontSize: number;
    lineHeight: number;
    padding: number;
}

interface ReadFullContentProps {
    leftContent: string;
    rightContent: string;
    viewerSettings?: ContentViewerSettings;
}

const FONT_SIZE_MAP: Record<number, string> = {
    1: 'text-lg',
    2: 'text-xl',
    3: 'text-2xl',
    4: 'text-3xl',
    5: 'text-4xl',
    6: 'text-5xl',
    7: 'text-6xl',
    8: 'text-7xl',
    9: 'text-8xl',
    10: 'text-9xl',
};

const LINE_HEIGHT_MAP: Record<number, string> = {
    1: 'leading-[1.6]',
    2: 'leading-[2]',
    3: 'leading-[2.4]',
    4: 'leading-[2.8]',
    5: 'leading-[3.2]',
};

const PADDING_MAP: Record<number, string> = {
    1: 'px-24 py-8',
    2: 'px-32 py-10',
    3: 'px-40 py-12',
    4: 'px-48 py-14',
    5: 'px-56 py-16',
};

const FONT_FAMILY_MAP: Record<string, { className: string; style: React.CSSProperties }> = {
    pretendard: {
        className: 'font-pretendard',
        style: { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", "Malgun Gothic", sans-serif' }
    },
    bookmyungjo: {
        className: 'font-bookmyungjo',
        style: { fontFamily: 'var(--font-noto-serif-kr), serif' }
    },
    thejamsil: {
        className: 'font-thejamsil',
        style: { fontFamily: 'var(--font-noto-sans-kr), system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }
    },
};

export default function ReadFullContent({ leftContent, rightContent, viewerSettings }: ReadFullContentProps) {
    const fontSize = FONT_SIZE_MAP[viewerSettings?.fontSize ?? 4] ?? 'text-lg';
    const lineHeight = LINE_HEIGHT_MAP[viewerSettings?.lineHeight ?? 2] ?? 'leading-[2]';
    const padding = PADDING_MAP[viewerSettings?.padding ?? 1] ?? 'px-24 py-8';

    const themeData = VIEWER_THEMES.find((t) => t.id === (viewerSettings?.theme ?? 'white'));
    const textColor = themeData?.text ?? 'text-gray-700';
    const fontFamily = FONT_FAMILY_MAP[viewerSettings?.font ?? 'pretendard'] ?? FONT_FAMILY_MAP.pretendard;

    return (
        <div className={`flex-1 overflow-hidden ${padding} min-h-0`}>
            <div className="grid grid-cols-2 gap-24 h-full">
                <div
                    className={`${textColor} ${fontSize} ${lineHeight} ${fontFamily.className} text-justify break-keep h-full overflow-hidden`}
                    style={fontFamily.style}
                >
                    {leftContent}
                </div>
                <div
                    className={`${textColor} ${fontSize} ${lineHeight} ${fontFamily.className} text-justify break-keep h-full overflow-hidden`}
                    style={fontFamily.style}
                >
                    {rightContent}
                </div>
            </div>
        </div>
    );
}
