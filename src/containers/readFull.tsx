'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import ReadFullHeader from '@/components/ui/readFullHeader';
import ReadFullContent, {
    READ_FULL_FONT_FAMILY_MAP,
    READ_FULL_FONT_SIZE_PX_MAP,
    READ_FULL_LINE_HEIGHT_MAP,
    READ_FULL_PADDING_PX_MAP,
} from '@/components/ui/readFullContent';
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

type Spread = { left: string; right: string };

const COLUMN_GAP_PX = 96;
const MIN_COLUMN_SIZE_PX = 80;

function fallbackSpreads(content: string): Spread[] {
    const sentences = (content.match(/[^.!?\n]+[.!?]?\n*\s*/g) || [])
        .map((s) => s.trim())
        .filter(Boolean);

    if (sentences.length === 0) {
        return [{ left: '', right: '' }];
    }

    const chunks: string[] = [];
    const chunkSize = 8;
    for (let i = 0; i < sentences.length; i += chunkSize) {
        chunks.push(sentences.slice(i, i + chunkSize).join(' '));
    }

    const spreads: Spread[] = [];
    for (let i = 0; i < chunks.length; i += 2) {
        spreads.push({
            left: chunks[i] ?? '',
            right: chunks[i + 1] ?? '',
        });
    }
    return spreads.length > 0 ? spreads : [{ left: '', right: '' }];
}

function paginateSpreadsByLayout(params: {
    content: string;
    viewportWidth: number;
    viewportHeight: number;
    fontSizePx: number;
    lineHeight: number;
    paddingX: number;
    paddingY: number;
    fontFamily: string;
}): Spread[] {
    const {
        content,
        viewportWidth,
        viewportHeight,
        fontSizePx,
        lineHeight,
        paddingX,
        paddingY,
        fontFamily,
    } = params;

    const normalized = content.replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return [{ left: '', right: '' }];
    }

    const columnWidth = Math.floor((viewportWidth - paddingX * 2 - COLUMN_GAP_PX) / 2);
    const columnHeight = Math.floor(viewportHeight - paddingY * 2);

    if (
        typeof document === 'undefined' ||
        columnWidth < MIN_COLUMN_SIZE_PX ||
        columnHeight < MIN_COLUMN_SIZE_PX
    ) {
        return fallbackSpreads(content);
    }

    const words = normalized.split(' ');
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.pointerEvents = 'none';
    measurer.style.left = '-99999px';
    measurer.style.top = '0';
    measurer.style.width = `${columnWidth}px`;
    measurer.style.height = 'auto';
    measurer.style.whiteSpace = 'normal';
    measurer.style.wordBreak = 'break-all';
    measurer.style.overflowWrap = 'anywhere';
    measurer.style.fontSize = `${fontSizePx}px`;
    measurer.style.lineHeight = String(lineHeight);
    measurer.style.fontFamily = fontFamily;
    measurer.style.textAlign = 'justify';
    measurer.style.setProperty('text-justify', 'inter-character');
    document.body.appendChild(measurer);

    const sliceText = (start: number, end: number) => words.slice(start, end).join(' ');
    const fits = (start: number, end: number): boolean => {
        measurer.textContent = sliceText(start, end);
        return measurer.scrollHeight <= columnHeight;
    };

    const fitChunk = (start: number): number => {
        let lo = start + 1;
        let hi = words.length;
        let best = start;

        while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            if (fits(start, mid)) {
                best = mid;
                lo = mid + 1;
            } else {
                hi = mid - 1;
            }
        }

        if (best === start) {
            return Math.min(words.length, start + 1);
        }
        return best;
    };

    try {
        const spreads: Spread[] = [];
        let cursor = 0;

        while (cursor < words.length) {
            const leftEnd = fitChunk(cursor);
            const left = sliceText(cursor, leftEnd);
            cursor = leftEnd;

            let right = '';
            if (cursor < words.length) {
                const rightEnd = fitChunk(cursor);
                right = sliceText(cursor, rightEnd);
                cursor = rightEnd;
            }

            spreads.push({ left, right });
        }

        return spreads.length > 0 ? spreads : [{ left: '', right: '' }];
    } finally {
        document.body.removeChild(measurer);
    }
}

export default function ReadFull() {
    const { readingText, readingTitle } = useBook();
    const content = readingText || POEM_TEXT;
    const title = readingTitle || READ_FULL_CONSTANTS.TITLE;
    const [currentSpread, setCurrentSpread] = useState(0);
    const [showSettings, setShowSettings] = useState(false);
    const [showBars, setShowBars] = useState(true);
    const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({
        ...VIEWER_DEFAULTS,
    });
    const settingsRef = useRef<HTMLDivElement>(null);
    const contentViewportRef = useRef<HTMLDivElement>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const themeBaseRef = useRef<0 | 1>(0);
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
    const [fontReadyVersion, setFontReadyVersion] = useState(0);

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

    useEffect(() => {
        const node = contentViewportRef.current;
        if (!node) return;

        const updateSize = () => {
            const rect = node.getBoundingClientRect();
            setViewportSize((prev) => {
                const next = { width: rect.width, height: rect.height };
                if (Math.abs(prev.width - next.width) < 0.5 && Math.abs(prev.height - next.height) < 0.5) {
                    return prev;
                }
                return next;
            });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
        if (!fonts?.ready) return;

        let cancelled = false;
        fonts.ready.then(() => {
            if (!cancelled) {
                setFontReadyVersion((prev) => prev + 1);
            }
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const fontSizePx = READ_FULL_FONT_SIZE_PX_MAP[viewerSettings.fontSize] ?? 30;
    const lineHeight = READ_FULL_LINE_HEIGHT_MAP[viewerSettings.lineHeight] ?? 2;
    const padding = READ_FULL_PADDING_PX_MAP[viewerSettings.padding] ?? { x: 96, y: 32 };
    const fontFamily = READ_FULL_FONT_FAMILY_MAP[viewerSettings.font]?.style.fontFamily
        ?? READ_FULL_FONT_FAMILY_MAP.pretendard.style.fontFamily
        ?? 'sans-serif';

    const spreads = useMemo(() => {
        void fontReadyVersion;
        return paginateSpreadsByLayout({
            content,
            viewportWidth: viewportSize.width,
            viewportHeight: viewportSize.height,
            fontSizePx,
            lineHeight,
            paddingX: padding.x,
            paddingY: padding.y,
            fontFamily,
        });
    }, [content, viewportSize.width, viewportSize.height, fontSizePx, lineHeight, padding.x, padding.y, fontFamily, fontReadyVersion]);

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
        const nextIndex = clamp(page - 1, 0, Math.max(0, spreads.length - 1));
        setCurrentSpread(nextIndex);
    };

    const handlePrevPage = () => {
        setCurrentSpread(Math.max(0, safeCurrentSpread - 1));
    };

    const handleNextPage = () => {
        setCurrentSpread(Math.min(Math.max(0, spreads.length - 1), safeCurrentSpread + 1));
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
    const maxSpreadIndex = Math.max(0, spreads.length - 1);
    const safeCurrentSpread = Math.min(currentSpread, maxSpreadIndex);
    const leftPageContent = spreads[safeCurrentSpread]?.left ?? '';
    const rightPageContent = spreads[safeCurrentSpread]?.right ?? '';
    const canGoPrev = safeCurrentSpread > 0;
    const canGoNext = safeCurrentSpread < maxSpreadIndex;
    const arrowButtonStyle = "flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-[#2f2f2f] text-3xl font-semibold shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all duration-200 hover:scale-105 hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed";

    return (
        <div
            className={`w-full h-full ${themeBg} flex flex-col overflow-hidden relative transition-colors pointer-events-auto`}
            onDoubleClick={handleDoubleClick}
        >
            <ReadFullHeader title={title} showBars={showBars} theme={viewerSettings.theme} />
            <div ref={contentViewportRef} className="relative flex-1 min-h-0">
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
                currentPage={safeCurrentSpread + 1}
                totalPages={spreads.length}
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
