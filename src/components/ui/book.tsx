'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './navigation';
import { useBook } from '@/context/bookContext';

export function Book() {
    const { leftContent, rightContent, overlayContent, flipKey, prevContent } = useBook();
    const pathname = usePathname();
    const [isFlipping, setIsFlipping] = useState(false);
    const [pageContent, setPageContent] = useState({ left: leftContent, right: rightContent });
    const isFirstRender = useRef(true);
    const lastAnimatedPathnameRef = useRef(pathname);
    const lastFlipKeyRef = useRef(flipKey);

    useEffect(() => {
        if (isFirstRender.current) {
            setPageContent({ left: leftContent, right: rightContent });
            isFirstRender.current = false;
            lastAnimatedPathnameRef.current = pathname;
            lastFlipKeyRef.current = flipKey;
            return;
        }

        if (!leftContent && !rightContent) return;

        const isPathChanged = lastAnimatedPathnameRef.current !== pathname;
        const isFlipTriggered = lastFlipKeyRef.current !== flipKey;

        if (isFlipTriggered || isPathChanged) {
            lastAnimatedPathnameRef.current = pathname;
            lastFlipKeyRef.current = flipKey;

            setIsFlipping(true);

            const contentTimer = setTimeout(() => {
                setPageContent({ left: leftContent, right: rightContent });
            }, 300);

            const timer = setTimeout(() => {
                setIsFlipping(false);
            }, 600);

            return () => {
                clearTimeout(contentTimer);
                clearTimeout(timer);
            };
        } else {
            setPageContent({ left: leftContent, right: rightContent });
        }
    }, [leftContent, rightContent, pathname, flipKey]);

    return (
        <div className="flex items-center justify-center">
            <div className="relative">
                <div
                    className="
                        relative z-10 flex
                        w-[80rem] h-[50rem]
                        preserve-3d
                        perspective-2000
                    "
                >
                    <div
                        className="
                            relative flex h-full w-1/2 flex-col overflow-hidden rounded-l-lg
                            bg-[#FAFAFA]
                            z-[1]
                        "
                    >
                        {pageContent.left}
                    </div>

                    <div
                        className="
                            relative flex h-full w-1/2 flex-col overflow-hidden rounded-r-lg
                            bg-[#FAFAFA]
                            z-[1]
                        "
                    >
                        {pageContent.right}
                    </div>

                    {isFlipping && prevContent && (
                        <div
                            className="absolute left-1/2 top-0 w-1/2 h-full z-[50] pointer-events-none [transform-style:preserve-3d] animate-real-flip"
                            style={{ transformOrigin: 'left center' }}
                        >
                            <div className="absolute inset-0 bg-[#F5F5F5] rounded-r-lg backface-hidden border-l border-black/5">
                                <div className="h-full w-full pointer-events-none overflow-hidden">
                                    {prevContent.rightContent}
                                </div>
                            </div>

                            <div
                                className="absolute inset-0 bg-[#FAFAFA] rounded-l-lg border-r border-black/5"
                                style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                            >
                                <div className="h-full w-full pointer-events-none overflow-hidden">
                                    {leftContent}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] -ml-[0.5px] bg-black/5 z-[60]" />

                    {overlayContent && (
                        <div className="absolute inset-0 z-[9999] pointer-events-none overflow-visible">
                            {overlayContent}
                        </div>
                    )}
                </div>

                <Navigation />
            </div>
        </div>
    );
}

export default Book;