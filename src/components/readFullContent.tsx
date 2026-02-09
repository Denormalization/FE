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
    content: string;
    viewerSettings?: ContentViewerSettings;
}

const FONT_SIZE_MAP: Record<number, string> = {
    1: 'text-xs',
    2: 'text-sm',
    3: 'text-base',
    4: 'text-lg',
    5: 'text-xl',
    6: 'text-2xl',
    7: 'text-3xl',
    8: 'text-4xl',
    9: 'text-5xl',
    10: 'text-6xl',
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

export default function ReadFullContent({ content, viewerSettings }: ReadFullContentProps) {
    const fontSize = FONT_SIZE_MAP[viewerSettings?.fontSize ?? 4] ?? 'text-lg';
    const lineHeight = LINE_HEIGHT_MAP[viewerSettings?.lineHeight ?? 2] ?? 'leading-[2]';
    const padding = PADDING_MAP[viewerSettings?.padding ?? 1] ?? 'px-24 py-8';

    const themeData = VIEWER_THEMES.find((t) => t.id === (viewerSettings?.theme ?? 'white'));
    const textColor = themeData?.text ?? 'text-gray-700';

    return (
        <div className={`flex-1 overflow-y-auto ${padding}`}>
            <div className="grid grid-cols-2 gap-24">
                <div className={`${textColor} ${fontSize} ${lineHeight} text-justify break-keep`}>
                    {content}
                </div>
                <div className={`${textColor} ${fontSize} ${lineHeight} text-justify break-keep`}>
                    {content}
                </div>
            </div>
        </div>
    );
}
