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
    const [currentPage, setCurrentPage] = useState(0);
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

    const pages = (() => {
        const sentences = (content.match(/[^.!?\n]+[.!?]?\n*\s*/g) || [])
            .map((s) => s.trim())
            .filter(Boolean);
        if (sentences.length === 0) {
            return [''];
        }

        const chunkSize = 8;
        const result: string[] = [];
        for (let i = 0; i < sentences.length; i += chunkSize) {
            result.push(sentences.slice(i, i + chunkSize).join(' '));
        }
        return result;
    })();

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
        const nextIndex = clamp(page - 1, 0, Math.max(0, pages.length - 1));
        setCurrentPage(nextIndex);
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => Math.max(0, prev - 2));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(Math.max(0, pages.length - 1), prev + 2));
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
    const maxPageIndex = Math.max(0, pages.length - 1);
    const safeCurrentPage = Math.min(currentPage, maxPageIndex);
    const leftPageContent = pages[safeCurrentPage] ?? '';
    const rightPageContent = pages[safeCurrentPage + 1] ?? '';
    const canGoPrev = safeCurrentPage > 0;
    const canGoNext = safeCurrentPage + 2 < pages.length;
    const arrowButtonStyle = "flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-[#2f2f2f] text-3xl font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-105 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed";

    return (
        <div
            className={`w-full h-full ${themeBg} flex flex-col overflow-hidden relative transition-colors pointer-events-auto`}
            onDoubleClick={handleDoubleClick}
        >
            <ReadFullHeader title={title} showBars={showBars} theme={viewerSettings.theme} />
            <div className="relative flex-1 min-h-0">
                <button
                    onClick={handlePrevPage}
                    disabled={!canGoPrev}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 z-20 ${arrowButtonStyle}`}
                    aria-label="이전 페이지"
                >
                    &#8592;
                </button>
                <button
                    onClick={handleNextPage}
                    disabled={!canGoNext}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 ${arrowButtonStyle}`}
                    aria-label="다음 페이지"
                >
                    &#8594;
                </button>

                <ReadFullContent
                    leftContent={leftPageContent}
                    rightContent={rightPageContent}
                    viewerSettings={viewerSettings}
                />
            </div>
            <ReadFullFooter
                currentPage={safeCurrentPage + 1}
                totalPages={pages.length}
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
