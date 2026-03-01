'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeTrackProps } from '@/types/eyeTrack';

export default function EyeTrack({ onGazeUpdate }: EyeTrackProps) {
    const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
    const lastElementIdRef = useRef<string | null>(null);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (typeof window !== 'undefined') {
            (window as any).Module = (window as any).Module || {};
            (window as any).Module.arguments = (window as any).Module.arguments || [];
            (window as any).WebGazerConfig = {
                basePath: '/engine/'
            };
        }

        const script = document.createElement('script');
        script.src = 'https://webgazer.cs.brown.edu/webgazer.js';
        script.async = true;

        script.onload = () => {
            if (!window.webgazer) {
                return;
            }

            try {
                window.webgazer.setGazeListener((data: any) => {
                    if (data == null) return;

                    const x = data.x;
                    const y = data.y;

                    setDotPos({ x, y });

                    const element = document.elementFromPoint(x, y);
                    if (element) {
                        let current: HTMLElement | null = element as HTMLElement;
                        let foundId: string | null = null;

                        while (current && current !== document.body) {
                            if (current.id && current.id.startsWith('sentence-')) {
                                foundId = current.id;
                                break;
                            }
                            current = current.parentElement;
                        }

                        if (foundId !== lastElementIdRef.current) {
                            lastElementIdRef.current = foundId;
                            if (onGazeUpdate) onGazeUpdate(foundId);
                        }
                    }
                }).begin();

                window.webgazer.showVideoPreview(false)
                    .showPredictionPoints(false)
                    .applyKalmanFilter(true);

                if (window.webgazer.params) {
                    window.webgazer.params.showVideo = false;
                    window.webgazer.params.showFaceOverlay = false;
                    window.webgazer.params.showFaceFeedbackBox = false;
                }
            } catch (err) {
            }
        };

        script.onerror = () => {
        };

        document.body.appendChild(script);

        return () => {
            if (window.webgazer) {
                try {
                    window.webgazer.pause();
                    window.webgazer.end();
                } catch (e) {
                }
            }
        };
    }, [onGazeUpdate]);

    return (
        <>
            <div className="fixed inset-0 pointer-events-none z-[2147483647]">
                <div
                    className="absolute rounded-full border-2 border-red-500/40 bg-red-500/10 flex items-center justify-center transition-[left,top] duration-100 ease-out"
                    style={{
                        left: dotPos.x,
                        top: dotPos.y,
                        width: '32px',
                        height: '32px',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <div className="w-2.5 h-2.5 bg-[#ff3333] rounded-full ring-1 ring-white shadow-[0_0_10px_#ff3333]" />
                    <div className="pulse-ring absolute inset-0 border-[2.5px] border-[#ff3333] rounded-full" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse-animation {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(2.2); opacity: 0; }
                }
                .pulse-ring {
                    animation: pulse-animation 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                #webgazerVideoContainer, #webgazerFaceOverlay, #webgazerFaceFeedbackBox {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    pointer-events: none !important;
                    z-index: -1 !important;
                }
            `}</style>
        </>
    );
}