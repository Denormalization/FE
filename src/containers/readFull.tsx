'use client';

import { useState, useRef, useEffect } from 'react';
import ReadFullHeader from '@/components/ui/readFullHeader';
import ReadFullContent from '@/components/ui/readFullContent';
import ReadFullFooter from '@/components/ui/readFullFooter';
import ViewerSettingsPanel from '@/components/ui/viewerSettingsPanel';
import type { ViewerSettings } from '@/components/ui/viewerSettingsPanel';
import { READ_FULL_CONSTANTS } from '@/constants/readFull';
import { VIEWER_DEFAULTS } from '@/constants/viewerSettings';
import { VIEWER_THEMES } from '@/constants/viewerSettings';
import { useBook } from '@/context/bookContext';
import { POEM_TEXT } from '@/mock/read';

export default function ReadFull() {
    const { readingText, readingTitle } = useBook();
    const content = readingText || POEM_TEXT;
    const title = readingTitle || READ_FULL_CONSTANTS.TITLE;
    const [showSettings, setShowSettings] = useState(false);
    const [showBars, setShowBars] = useState(true);
    const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({
        ...VIEWER_DEFAULTS,
    });
    const settingsRef = useRef<HTMLDivElement>(null);

    // 패널 바깥 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
                setShowSettings(false);
            }
        };
        if (showSettings) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSettings]);
    const handlePageChange = (page: number) => {
        console.log('Page changed to:', page);
    };

    const handleSettingsClick = () => {
        setShowSettings((prev) => !prev);
    };

    const handleFullscreenClick = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            document.documentElement.requestFullscreen();
        }
    };

    const handleDoubleClick = () => {
        setShowBars((prev) => !prev);
    };

    const themeData = VIEWER_THEMES.find((t) => t.id === viewerSettings.theme);
    const themeBg = themeData?.bg ?? 'bg-white';

    return (
        <div
            className={`w-full h-full ${themeBg} flex flex-col overflow-hidden relative transition-colors pointer-events-auto`}
            onDoubleClick={handleDoubleClick}
        >
            <ReadFullHeader title={title} showBars={showBars} theme={viewerSettings.theme} />
            <ReadFullContent content={content} viewerSettings={viewerSettings} />
            <ReadFullFooter
                currentPage={READ_FULL_CONSTANTS.CURRENT_PAGE}
                totalPages={READ_FULL_CONSTANTS.TOTAL_PAGES}
                onPageChange={handlePageChange}
                onSettingsClick={handleSettingsClick}
                onFullscreenClick={handleFullscreenClick}
                showBars={showBars}
                theme={viewerSettings.theme}
            />

            {/* 뷰어 설정 패널 */}
            {showSettings && (
                <div ref={settingsRef}>
                    <ViewerSettingsPanel
                        settings={viewerSettings}
                        onSettingsChange={setViewerSettings}
                    />
                </div>
            )}
        </div>
    );
}