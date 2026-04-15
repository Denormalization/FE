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

export const READ_FULL_FONT_SIZE_PX_MAP: Record<number, number> = {
    1: 18,
    2: 20,
    3: 24,
    4: 30,
    5: 36,
    6: 48,
    7: 60,
    8: 72,
    9: 96,
    10: 128,
};

export const READ_FULL_LINE_HEIGHT_MAP: Record<number, number> = {
    1: 1.6,
    2: 2,
    3: 2.4,
    4: 2.8,
    5: 3.2,
};

export const READ_FULL_PADDING_PX_MAP: Record<number, { x: number; y: number }> = {
    1: { x: 96, y: 32 },
    2: { x: 128, y: 40 },
    3: { x: 160, y: 48 },
    4: { x: 192, y: 56 },
    5: { x: 224, y: 64 },
};

export const READ_FULL_FONT_FAMILY_MAP: Record<string, { className: string; style: React.CSSProperties }> = {
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
    const fontSizePx = READ_FULL_FONT_SIZE_PX_MAP[viewerSettings?.fontSize ?? 4] ?? 30;
    const lineHeight = READ_FULL_LINE_HEIGHT_MAP[viewerSettings?.lineHeight ?? 2] ?? 2;
    const padding = READ_FULL_PADDING_PX_MAP[viewerSettings?.padding ?? 1] ?? { x: 96, y: 32 };

    const themeData = VIEWER_THEMES.find((t) => t.id === (viewerSettings?.theme ?? 'white'));
    const textColor = themeData?.text ?? 'text-gray-700';
    const fontFamily = READ_FULL_FONT_FAMILY_MAP[viewerSettings?.font ?? 'pretendard'] ?? READ_FULL_FONT_FAMILY_MAP.pretendard;

    return (
        <div
            className="flex-1 overflow-hidden min-h-0"
            style={{ padding: `${padding.y}px ${padding.x}px` }}
        >
            <div className="grid grid-cols-2 gap-24 h-full">
                <div
                    className={`${textColor} ${fontFamily.className} text-justify break-all h-full overflow-hidden`}
                    style={{
                        ...fontFamily.style,
                        fontSize: `${fontSizePx}px`,
                        lineHeight,
                        textJustify: 'inter-character',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                    }}
                >
                    {leftContent}
                </div>
                <div
                    className={`${textColor} ${fontFamily.className} text-justify break-all h-full overflow-hidden`}
                    style={{
                        ...fontFamily.style,
                        fontSize: `${fontSizePx}px`,
                        lineHeight,
                        textJustify: 'inter-character',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                    }}
                >
                    {rightContent}
                </div>
            </div>
        </div>
    );
}
