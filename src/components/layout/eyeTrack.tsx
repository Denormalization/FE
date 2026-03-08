'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeTrackProps } from '@/types/eyeTrack';

export default function EyeTrack({ onGazeUpdate }: EyeTrackProps) {
    const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
    const initializedRef = useRef(false);
    const gazeBufferRef = useRef<{ x: number; y: number }[]>([]);
    const lastPointRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const isFixatingRef = useRef(false);
    const sentenceRectsRef = useRef<{ id: string; rect: DOMRect; order: number }[]>([]);
    const lastUpdateIdRef = useRef<string | null>(null);
    const driftOffsetRef = useRef({ x: 0, y: 0 }); // Dynamic calibration offset

    const MAX_BUFFER_SIZE = 40; // Increased for better smoothing

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

        const updateSentenceRects = () => {
            const elements = document.querySelectorAll('[id*="sentence-"]');
            const rects: { id: string; rect: DOMRect; order: number }[] = [];
            elements.forEach((el, index) => {
                rects.push({
                    id: el.id,
                    rect: el.getBoundingClientRect(),
                    order: index
                });
            });
            sentenceRectsRef.current = rects;
        };

        // Phase 4: ResizeObserver to track layout changes
        const resizeObserver = new ResizeObserver(updateSentenceRects);
        resizeObserver.observe(document.body);

        const initWebGazer = () => {
            if (!window.webgazer || (window as any).webgazerInitialized) return;
            (window as any).webgazerInitialized = true;

            updateSentenceRects();
            const rectInterval = setInterval(updateSentenceRects, 1500);

            try {
                window.webgazer.setGazeListener((data: any) => {
                    if (!data) return;

                    const now = Date.now();
                    let velocity = 0;

                    if (lastPointRef.current) {
                        const dt = now - lastPointRef.current.t;
                        if (dt > 0) {
                            const dx = data.x - lastPointRef.current.x;
                            const dy = data.y - lastPointRef.current.y;
                            velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                        }
                    }

                    lastPointRef.current = { x: data.x, y: data.y, t: now };
                    isFixatingRef.current = velocity < 0.25;

                    // Apply Dynamic Drift Offset
                    let rawX = data.x + driftOffsetRef.current.x;
                    let rawY = data.y + driftOffsetRef.current.y;

                    // Phase 4: Bottom-Screen Correction Bias
                    const screenHeight = window.innerHeight;
                    if (rawY > screenHeight * 0.7) {
                        const bottomIntensity = (rawY - screenHeight * 0.7) / (screenHeight * 0.3);
                        rawY += 35 * bottomIntensity;
                    }

                    const lastAvg =
                        gazeBufferRef.current.length > 0
                            ? {
                                x: gazeBufferRef.current.reduce((s, p) => s + p.x, 0) / gazeBufferRef.current.length,
                                y: gazeBufferRef.current.reduce((s, p) => s + p.y, 0) / gazeBufferRef.current.length
                            }
                            : { x: rawX, y: rawY };

                    const dist = Math.sqrt((rawX - lastAvg.x) ** 2 + (rawY - lastAvg.y) ** 2);

                    let targetX = rawX;
                    let targetY = rawY;

                    // Phase 3: Adaptive Smoothing & Outlier Rejection
                    const outlierThreshold = isFixatingRef.current ? 80 : 250;
                    if (gazeBufferRef.current.length > 5 && dist > outlierThreshold) {
                        const smoothFactor = isFixatingRef.current ? 0.02 : 0.08;
                        targetX = lastAvg.x + (rawX - lastAvg.x) * smoothFactor;
                        targetY = lastAvg.y + (rawY - lastAvg.y) * smoothFactor;
                    }

                    gazeBufferRef.current.push({ x: targetX, y: targetY });

                    const bufferLimit = isFixatingRef.current ? 30 : 12;
                    while (gazeBufferRef.current.length > bufferLimit) {
                        gazeBufferRef.current.shift();
                    }

                    const weightPower = isFixatingRef.current ? 2.0 : 1.5;
                    const totalWeight = gazeBufferRef.current.reduce((s, _, i) => s + Math.pow(i + 1, weightPower), 0);

                    const avgX = gazeBufferRef.current.reduce((s, p, i) => s + p.x * Math.pow(i + 1, weightPower), 0) / totalWeight;
                    const avgY = gazeBufferRef.current.reduce((s, p, i) => s + p.y * Math.pow(i + 1, weightPower), 0) / totalWeight;

                    // Phase 3: Spatial Logic & Magnetic Snapping
                    const findClosestSentence = (x: number, y: number) => {
                        let closestId: string | null = null;
                        let minDistance = Infinity;
                        let closestRect: DOMRect | null = null;

                        const STICKY_BIAS = 45;
                        const NEXT_SENTENCE_BIAS = 60;

                        // Phase 4: Adaptive Vertical Tolerance (larger at bottom)
                        const screenHeight = window.innerHeight;
                        const verticalToleranceMultiplier = y > screenHeight * 0.65 ? 1.6 : 1.0;
                        const MAX_VERTICAL_DISTANCE = 180 * verticalToleranceMultiplier;

                        const currentSentence = sentenceRectsRef.current.find(s => s.id === lastUpdateIdRef.current);

                        sentenceRectsRef.current.forEach(({ id, rect, order }) => {
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;

                            const dy = Math.abs(y - centerY);
                            const dx = Math.abs(x - centerX);

                            if (dy < MAX_VERTICAL_DISTANCE && dx < 500) {
                                let distance = dy;

                                // Hysteresis & Prediction Logic
                                if (id === lastUpdateIdRef.current) {
                                    distance -= STICKY_BIAS;
                                } else if (currentSentence && order === currentSentence.order + 1) {
                                    // Prediction: Next sentence in order is more likely
                                    distance -= NEXT_SENTENCE_BIAS;
                                }

                                if (distance < minDistance) {
                                    minDistance = distance;
                                    closestId = id;
                                    closestRect = rect;
                                }
                            }
                        });

                        return { closestId, closestRect };
                    };

                    const { closestId, closestRect } = findClosestSentence(avgX, avgY);

                    let finalX = avgX;
                    let finalY = avgY;

                    // Magnetic Snapping: Snap to sentence center-line if extremely close
                    if (closestRect && isFixatingRef.current) {
                        const rect = closestRect as DOMRect;
                        const rectCenterY = rect.top + rect.height / 2;

                        // Phase 4: Expanded Snapping Zone at bottom
                        const screenHeight = window.innerHeight;
                        const snapThreshold = rectCenterY > screenHeight * 0.7 ? 70 : 40;

                        if (Math.abs(avgY - rectCenterY) < snapThreshold) {
                            finalY = rectCenterY; // Y-snapping

                            // Dynamic Calibration: Gradually adjust drift offset
                            const errorY = rectCenterY - avgY;
                            driftOffsetRef.current.y += errorY * 0.005;
                            const errorX = (rect.left + rect.width / 2) - avgX;
                            driftOffsetRef.current.x += errorX * 0.002;
                        }
                    }

                    setDotPos({ x: finalX, y: finalY });

                    if (closestId !== lastUpdateIdRef.current) {
                        lastUpdateIdRef.current = closestId;
                        onGazeUpdate?.(closestId);
                    }
                }).begin();

                window.webgazer
                    .showVideoPreview(false)
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

            return () => {
                clearInterval(rectInterval);
            };
        };

        if (window.webgazer) {
            initWebGazer();
        } else {
            const script = document.createElement('script');
            script.src = SCRIPT_URL;
            script.async = true;
            script.onload = initWebGazer;
            document.body.appendChild(script);
        }

        return () => {
            resizeObserver.disconnect();
            if (window.webgazer) {
                try {
                    window.webgazer.pause();
                    window.webgazer.end();
                    (window as any).webgazerInitialized = false;
                    const video = document.getElementById('webgazerVideoFeed') as HTMLVideoElement;
                    if (video && video.srcObject) {
                        const stream = video.srcObject as MediaStream;
                        stream.getTracks().forEach((track) => track.stop());
                    }
                    ['webgazerVideoContainer', 'webgazerVideoFeed', 'webgazerFaceOverlay', 'webgazerFaceFeedbackBox']
                        .forEach((id) => {
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
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="w-2.5 h-2.5 bg-[#ff3333] rounded-full ring-1 ring-white shadow-[0_0_10px_#ff3333]" />
                    <div className="pulse-ring absolute inset-0 border-[2.5px] border-[#ff3333] rounded-full" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes pulse-animation {
                    0% {
                        transform: scale(1);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(2.2);
                        opacity: 0;
                    }
                }

                .pulse-ring {
                    animation: pulse-animation 2s
                        cubic-bezier(0.4, 0, 0.6, 1)
                        infinite;
                }

                #webgazerVideoContainer,
                #webgazerFaceOverlay,
                #webgazerFaceFeedbackBox {
                    display: none !important;
                }
            `}</style>
        </>
    );
}