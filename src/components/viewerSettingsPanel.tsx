'use client';

import { FiMinus, FiPlus } from 'react-icons/fi';
import {
    VIEWER_THEMES,
    VIEWER_FONTS,
    VIEWER_DEFAULTS,
    VIEWER_LIMITS,
} from '@/constants/viewerSettings';

export interface ViewerSettings {
    theme: string;
    font: string;
    fontSize: number;
    lineHeight: number;
    padding: number;
}

interface ViewerSettingsPanelProps {
    settings: ViewerSettings;
    onSettingsChange: (settings: ViewerSettings) => void;
}

export default function ViewerSettingsPanel({
    settings,
    onSettingsChange,
}: ViewerSettingsPanelProps) {
    const update = (key: keyof ViewerSettings, value: string | number) => {
        onSettingsChange({ ...settings, [key]: value });
    };

    const handleReset = () => {
        onSettingsChange({ ...VIEWER_DEFAULTS });
    };

    return (
        <div className="absolute bottom-16 right-4 w-[320px] bg-white rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.15)] border border-gray-100 z-50 p-6 flex flex-col gap-5">
            {/* 타이틀 */}
            <h3 className="text-base font-semibold text-gray-800">뷰어 설정</h3>

            {/* 테마 */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">테마</span>
                <div className="flex gap-2">
                    {VIEWER_THEMES.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => update('theme', theme.id)}
                            className={`
                                w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium
                                border-2 cursor-pointer transition-all
                                ${theme.bg} ${theme.text}
                                ${settings.theme === theme.id
                                    ? 'border-green-600 ring-2 ring-green-200'
                                    : `${theme.border} hover:border-gray-400`
                                }
                            `}
                        >
                            {theme.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 글꼴 */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">글꼴</span>
                <div className="flex gap-2">
                    {VIEWER_FONTS.map((font) => (
                        <button
                            key={font.id}
                            onClick={() => update('font', font.id)}
                            className={`
                                px-4 py-2 rounded-lg text-sm cursor-pointer transition-all
                                ${settings.font === font.id
                                    ? 'bg-gray-800 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }
                            `}
                        >
                            {font.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 글자 크기 */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">글자 크기</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() =>
                            update('fontSize', Math.max(VIEWER_LIMITS.fontSize.min, settings.fontSize - 1))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <FiMinus size={14} />
                    </button>
                    <span className="text-sm font-medium text-gray-800 w-4 text-center">
                        {settings.fontSize}
                    </span>
                    <button
                        onClick={() =>
                            update('fontSize', Math.min(VIEWER_LIMITS.fontSize.max, settings.fontSize + 1))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <FiPlus size={14} />
                    </button>
                </div>
            </div>

            {/* 줄 간격 */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">줄 간격</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() =>
                            update('lineHeight', Math.max(VIEWER_LIMITS.lineHeight.min, settings.lineHeight - 1))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <FiMinus size={14} />
                    </button>
                    <span className="text-sm font-medium text-gray-800 w-4 text-center">
                        {settings.lineHeight}
                    </span>
                    <button
                        onClick={() =>
                            update('lineHeight', Math.min(VIEWER_LIMITS.lineHeight.max, settings.lineHeight + 1))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <FiPlus size={14} />
                    </button>
                </div>
            </div>

            {/* 여백 */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">여백</span>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() =>
                            update('padding', Math.max(VIEWER_LIMITS.padding.min, settings.padding - 1))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <FiMinus size={14} />
                    </button>
                    <span className="text-sm font-medium text-gray-800 w-4 text-center">
                        {settings.padding}
                    </span>
                    <button
                        onClick={() =>
                            update('padding', Math.min(VIEWER_LIMITS.padding.max, settings.padding + 1))
                        }
                        className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-300 text-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                        <FiPlus size={14} />
                    </button>
                </div>
            </div>

            {/* 설정 초기화 */}
            <button
                onClick={handleReset}
                className="self-end text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
            >
                설정 초기화
            </button>
        </div>
    );
}
