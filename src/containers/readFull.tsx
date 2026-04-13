'use client';

import { useState, useRef, useEffect } from 'react';
import ReadFullHeader from '@/components/ui/readFullHeader';
import ReadFullContent from '@/components/ui/readFullContent';
import ReadFullFooter from '@/components/ui/readFullFooter';
import ViewerSettingsPanel from '@/components/ui/viewerSettingsPanel';
import type { ViewerSettings } from '@/components/ui/viewerSettingsPanel';
import { READ_FULL_CONSTANTS } from '@/constants/readFull';
import { VIEWER_DEFAULTS } from '@/constants/viewerSettings';
import { VIEWER_LIMITS, VIEWER_THEMES } from '@/constants/viewerSettings';
import { useBook } from '@/context/bookContext';
import { POEM_TEXT } from '@/mock/read';
import { toast } from 'react-toastify';
import { fetchUserPreferences, updateUserPreferences } from '@/services/preferences';

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function mapThemeIndexToId(themeIndex: number): string {
    if (themeIndex >= 0 && themeIndex < VIEWER_THEMES.length) {
        return VIEWER_THEMES[themeIndex].id;
    }

    // 일부 백엔드는 1-based 인덱스를 내려줄 수 있어 보정한다.
    if (themeIndex >= 1 && themeIndex <= VIEWER_THEMES.length) {
        return VIEWER_THEMES[themeIndex - 1].id;
    }

    return VIEWER_DEFAULTS.theme;
}

function detectThemeBase(themeIndex: number): 0 | 1 {
    if (themeIndex >= 0 && themeIndex < VIEWER_THEMES.length) {
        return 0;
    }

    if (themeIndex >= 1 && themeIndex <= VIEWER_THEMES.length) {
        return 1;
    }

    return 0;
}

function mapThemeIdToIndex(themeId: string, base: 0 | 1): number {
    const index = VIEWER_THEMES.findIndex((theme) => theme.id === themeId);
    if (index < 0) {
        return base;
    }
    return base === 0 ? index : index + 1;
}

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
    const saveTimeoutRef = useRef<number | null>(null);
    const themeBaseRef = useRef<0 | 1>(0);

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

    useEffect(() => {
        fetchUserPreferences()
            .then((pref) => {
                themeBaseRef.current = detectThemeBase(pref.theme);
                setViewerSettings({
                    theme: mapThemeIndexToId(pref.theme),
                    font: VIEWER_DEFAULTS.font,
                    fontSize: clamp(pref.fontSize, VIEWER_LIMITS.fontSize.min, VIEWER_LIMITS.fontSize.max),
                    lineHeight: clamp(pref.lineHeight, VIEWER_LIMITS.lineHeight.min, VIEWER_LIMITS.lineHeight.max),
                    padding: clamp(pref.margin, VIEWER_LIMITS.padding.min, VIEWER_LIMITS.padding.max),
                });
            })
            .catch((err) => {
                const message = err instanceof Error ? err.message : '읽기 설정 조회 실패';
                toast.error(message);
            });
    }, []);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current !== null) {
                window.clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const handleViewerSettingsChange = (nextSettings: ViewerSettings) => {
        setViewerSettings(nextSettings);

        if (saveTimeoutRef.current !== null) {
            window.clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
            updateUserPreferences({
                theme: mapThemeIdToIndex(nextSettings.theme, themeBaseRef.current),
                fontSize: nextSettings.fontSize,
                lineHeight: nextSettings.lineHeight,
                margin: nextSettings.padding,
            }).catch((err) => {
                const message = err instanceof Error ? err.message : '읽기 설정 수정 실패';
                toast.error(message);
            });
        }, 300);
    };

    const handlePageChange = (page: number) => {
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
                        onSettingsChange={handleViewerSettingsChange}
                    />
                </div>
            )}
        </div>
    );
}