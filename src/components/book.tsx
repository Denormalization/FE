'use client';

import { BookProps } from '@/types/components';
import Navigation from './navigation';


export default function Book({ leftContent, rightContent, navItems }: BookProps) {
    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div
                    className="
                        relative z-10 flex
                        w-[80rem] h-[50rem]
                        [transform-style:preserve-3d]
                        drop-shadow-[0_1.25rem_3.75rem_rgba(0,0,0,0.5)]
                    "
                >
                    <div
                        className="
                            flex h-full w-1/2 items-center justify-center overflow-hidden rounded-l-lg
                            bg-gradient-to-r from-[#e8e8e8] to-[#f8f8f8]
                            [transform-origin:right_center]
                            [-webkit-transform:rotateY(-5deg)]
                            transform rotate-y-[-5deg]
                            shadow-[inset_-0.625rem_0_1.25rem_rgba(0,0,0,0.1),_-0.3125rem_0_0.9375rem_rgba(0,0,0,0.2)]
                        "
                    >
                        {leftContent || (
                            <svg
                                className="h-[15rem] w-[15rem] opacity-30"
                                viewBox="0 0 200 200"
                            >
                                <path
                                    d="M 50 150 Q 80 100 100 80 Q 120 60 150 50"
                                    stroke="#e57373"
                                    strokeWidth="3"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 100 80 L 160 140"
                                    stroke="#e57373"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M 160 140 L 140 150"
                                    stroke="#e57373"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                />
                            </svg>
                        )}
                    </div>

                    <div
                        className="
                            flex h-full w-1/2 flex-col overflow-hidden rounded-r-lg
                            bg-gradient-to-l from-[#e8e8e8] to-[#f8f8f8]
                            px-24 py-[4.5rem]
                            [transform-origin:left_center]
                            transform rotate-y-[5deg]
                            shadow-[inset_0.625rem_0_1.25rem_rgba(0,0,0,0.1),_0.3125rem_0_0.9375rem_rgba(0,0,0,0.2)]
                        "
                    >
                        {rightContent}
                    </div>

                    <div
                        className="
                            z-10 h-full w-px shrink-0 -ml-1
                            bg-gradient-to-b
                            from-black/30 via-black/10 to-black/30
                        "
                    />
                </div>

                {navItems && navItems.length > 0 && (
                    <Navigation items={navItems} />
                )}
            </div>
        </div>
    );
}