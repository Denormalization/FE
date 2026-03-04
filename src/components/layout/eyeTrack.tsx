'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeTrackProps } from '@/types/eyeTrack';

export default function EyeTrack({ onGazeUpdate }: EyeTrackProps) {
    const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
    const lastElementIdRef = useRef<string | null>(null);
    const initializedRef = useRef(false);
    const gazeBufferRef = useRef<{ x: number; y: number }[]>([]);
    const lastPointRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const isFixatingRef = useRef(false);
    const MAX_BUFFER_SIZE = 30;

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (typeof window !== 'undefined') {
            if (!(window as any).WebGazerConfig) {
                (window as any).WebGazerConfig = {
                    basePath: '/engine/'
                };
            }
        }

        const SCRIPT_URL = 'https://webgazer.cs.brown.edu/webgazer.js';

        const initWebGazer = () => {
            if (!window.webgazer || (window as any).webgazerInitialized) return;
            (window as any).webgazerInitialized = true;

            try {
                window.webgazer.setGazeListener((data: any) => {
                    if (data == null) return;

                    const now = Date.now();
                    let currentVelocity = 0;
                    if (lastPointRef.current) {
                        const dt = now - lastPointRef.current.t;
                        if (dt > 0) {
                            const dx = data.x - lastPointRef.current.x;
                            const dy = data.y - lastPointRef.current.y;
                            currentVelocity = Math.sqrt(dx * dx + dy * dy) / dt;
                        }
                    }
                    lastPointRef.current = { x: data.x, y: data.y, t: now };
                    isFixatingRef.current = currentVelocity < 0.45;

                    const lastAvg = gazeBufferRef.current.length > 0
                        ? {
                            x: gazeBufferRef.current.reduce((s, p) => s + p.x, 0) / gazeBufferRef.current.length,
                            y: gazeBufferRef.current.reduce((s, p) => s + p.y, 0) / gazeBufferRef.current.length
                        }
                        : { x: data.x, y: data.y };

                    const dist = Math.sqrt(Math.pow(data.x - lastAvg.x, 2) + Math.pow(data.y - lastAvg.y, 2));

                    let targetX = data.x;
                    let targetY = data.y;

                    const outlierThreshold = isFixatingRef.current ? 150 : 400;
                    if (gazeBufferRef.current.length > 5 && dist > outlierThreshold) {
                        const smoothFactor = isFixatingRef.current ? 0.08 : 0.25;
                        targetX = lastAvg.x + (data.x - lastAvg.x) * smoothFactor;
                        targetY = lastAvg.y + (data.y - lastAvg.y) * smoothFactor;
                    }

                    gazeBufferRef.current.push({ x: targetX, y: targetY });

                    const currentBufferSize = isFixatingRef.current ? 25 : 8;
                    while (gazeBufferRef.current.length > currentBufferSize) {
                        gazeBufferRef.current.shift();
                    }
                    if (gazeBufferRef.current.length > MAX_BUFFER_SIZE) {
                        gazeBufferRef.current = gazeBufferRef.current.slice(-MAX_BUFFER_SIZE);
                    }

                    const totalWeight = gazeBufferRef.current.reduce((s, _, i) => s + Math.pow(i + 1, 1.2), 0);
                    const avgX = gazeBufferRef.current.reduce((s, p, i) => s + p.x * Math.pow(i + 1, 1.2), 0) / totalWeight;
                    const avgY = gazeBufferRef.current.reduce((s, p, i) => s + p.y * Math.pow(i + 1, 1.2), 0) / totalWeight;

                    setDotPos({ x: avgX, y: avgY });

                    const getSentenceFromPoint = (x: number, y: number) => {
                        const elements = [
                            document.elementFromPoint(x, y),
                            document.elementFromPoint(x, y - 20),
                            document.elementFromPoint(x, y + 20),
                            document.elementFromPoint(x, y - 40),
                            document.elementFromPoint(x, y + 40)
                        ];

                        for (const element of elements) {
                            if (!element) continue;
                            let current: HTMLElement | null = element as HTMLElement;
                            while (current && current !== document.body) {
                                if (current.id && current.id.includes('sentence-')) {
                                    return current.id;
                                }
                                current = current.parentElement;
                            }
                        }
                        return null;
                    };

                    const foundId = getSentenceFromPoint(avgX, avgY);

                    if (foundId !== lastElementIdRef.current) {
                        lastElementIdRef.current = foundId;
                        onGazeUpdate?.(foundId);
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
                console.error('WebGazer initialization error:', err);
            }
        };

        if (window.webgazer) {
            initWebGazer();
        } else {
            const existingScript = document.querySelector(`script[src="${SCRIPT_URL}"]`);
            if (existingScript) {
                existingScript.addEventListener('load', initWebGazer);
            } else {
                const script = document.createElement('script');
                script.src = SCRIPT_URL;
                script.async = true;
                script.onload = initWebGazer;
                script.onerror = () => { };
                document.body.appendChild(script);
            }
        }

        return () => {
            if (window.webgazer) {
                try {
                    window.webgazer.pause();
                    window.webgazer.end();
                    (window as any).webgazerInitialized = false;

                    const video = document.getElementById('webgazerVideoFeed') as HTMLVideoElement;
                    if (video && video.srcObject) {
                        const stream = video.srcObject as MediaStream;
                        stream.getTracks().forEach(track => track.stop());
                    }

                    ['webgazerVideoContainer', 'webgazerVideoFeed', 'webgazerFaceOverlay', 'webgazerFaceFeedbackBox']
                        .forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.remove();
                        });
                } catch (e) {
                    console.error('WebGazer cleanup error:', e);
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