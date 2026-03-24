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
    const dwellCountRef = useRef<number>(0);
    const candidateIdRef = useRef<string | null>(null);
    const driftOffsetRef = useRef({ x: 0, y: 0 });
    const latestOnGazeUpdateRef = useRef(onGazeUpdate);
    const [trail, setTrail] = useState<{ x: number; y: number; id: number }[]>([]);
    const lastTrailPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        latestOnGazeUpdateRef.current = onGazeUpdate;
    }, [onGazeUpdate]);

    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        if (typeof window !== 'undefined') {
            if (!(window as any).WebGazerConfig) {
                (window as any).WebGazerConfig = {};
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

        const resizeObserver = new ResizeObserver(updateSentenceRects);
        resizeObserver.observe(document.body);

        const getIntensity = (val: number, threshold: number, range: number) => {
            let t = Math.abs(val - threshold) / range;
            t = Math.max(0, Math.min(1, t));
            return t * t * (3 - 2 * t);
        };

        const initWebGazer = () => {
            if (!window.webgazer || (window as any).webgazerInitialized) return;
            (window as any).webgazerInitialized = true;

            updateSentenceRects();
            const rectInterval = setInterval(updateSentenceRects, 1500);

            try {
                window.webgazer.setGazeListener((data: any) => {
                    if (!data) return;

                    const now = Date.now();
                    const dt = lastPointRef.current ? now - lastPointRef.current.t : 16;
                    let velocity = 0;

                    if (lastPointRef.current && dt > 0) {
                        const dx = data.x - lastPointRef.current.x;
                        const dy = data.y - lastPointRef.current.y;
                        velocity = Math.sqrt(dx * dx + dy * dy) / dt;
                    }

                    lastPointRef.current = { x: data.x, y: data.y, t: now };
                    const fixationThreshold = isFixatingRef.current ? 0.35 : 0.22;
                    isFixatingRef.current = velocity < fixationThreshold;

                    let rawX = data.x + driftOffsetRef.current.x;
                    let rawY = data.y + driftOffsetRef.current.y;

                    const screenHeight = window.innerHeight;
                    const screenWidth = window.innerWidth;

                    if (rawY > screenHeight * 0.65) {
                        const intensity = getIntensity(rawY, screenHeight * 0.65, screenHeight * 0.35);
                        rawY += 80 * intensity;
                    } else if (rawY < screenHeight * 0.35) {
                        const intensity = getIntensity(rawY, screenHeight * 0.35, screenHeight * 0.35);
                        rawY -= 100 * intensity;
                    }

                    if (rawX > screenWidth * 0.5) {
                        const intensity = getIntensity(rawX, screenWidth * 0.5, screenWidth * 0.5);
                        rawX += 110 * intensity;
                    } else if (rawX < screenWidth * 0.5) {
                        const intensity = getIntensity(rawX, screenWidth * 0.5, screenWidth * 0.5);
                        rawX -= 250 * intensity;
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

                    const outlierThreshold = isFixatingRef.current ? 70 : 300;
                    if (gazeBufferRef.current.length > 3 && dist > outlierThreshold) {
                        const smoothFactor = isFixatingRef.current ? 0.015 : 0.12;
                        targetX = lastAvg.x + (rawX - lastAvg.x) * smoothFactor;
                        targetY = lastAvg.y + (rawY - lastAvg.y) * smoothFactor;
                    }

                    gazeBufferRef.current.push({ x: targetX, y: targetY });

                    const bufferLimit = isFixatingRef.current ? 35 : 10;
                    while (gazeBufferRef.current.length > bufferLimit) {
                        gazeBufferRef.current.shift();
                    }

                    const weightPower = isFixatingRef.current ? 2.5 : 1.2;
                    const totalWeight = gazeBufferRef.current.reduce((s, _, i) => s + Math.pow(i + 1, weightPower), 0);

                    const avgX = gazeBufferRef.current.reduce((s, p, i) => s + p.x * Math.pow(i + 1, weightPower), 0) / totalWeight;
                    const avgY = gazeBufferRef.current.reduce((s, p, i) => s + p.y * Math.pow(i + 1, weightPower), 0) / totalWeight;

                    const findClosestSentence = (x: number, y: number) => {
                        let closestId: string | null = null;
                        let minDistance = Infinity;
                        let closestRect: DOMRect | null = null;

                        const STICKY_BIAS = isFixatingRef.current ? 110 : 70;
                        const NEXT_SENTENCE_BIAS = 140;

                        const screenHeight = window.innerHeight;
                        const isBottomRegion = y > screenHeight * 0.65;
                        const isTopRegion = y < screenHeight * 0.35;

                        const verticalToleranceMultiplier = (isBottomRegion || isTopRegion) ? 3.0 : 1.4;
                        const MAX_VERTICAL_DISTANCE = 250 * verticalToleranceMultiplier;

                        let verticalBias = 0;
                        if (isBottomRegion) {
                            verticalBias = -140 * getIntensity(y, screenHeight * 0.65, screenHeight * 0.35);
                        } else if (isTopRegion) {
                            verticalBias = 180 * getIntensity(y, screenHeight * 0.35, screenHeight * 0.35);
                        }

                        const adjustedY = y + verticalBias;
                        const currentSentence = sentenceRectsRef.current.find(s => s.id === lastUpdateIdRef.current);

                        sentenceRectsRef.current.forEach(({ id, rect, order }) => {
                            const centerX = rect.left + rect.width / 2;
                            const centerY = rect.top + rect.height / 2;

                            const dy = Math.abs(adjustedY - centerY);
                            const dx = Math.abs(x - centerX);

                            if (dy < MAX_VERTICAL_DISTANCE && dx < 550) {
                                let distance = dy;

                                if (id === lastUpdateIdRef.current) {
                                    distance -= STICKY_BIAS;
                                } else if (currentSentence && order === currentSentence.order + 1) {
                                    distance -= NEXT_SENTENCE_BIAS;
                                }

                                const isFirstSentence = id.endsWith('-sentence-0');
                                const sidePrefix = id.split('-')[0];
                                const maxIndexForSide = Math.max(...sentenceRectsRef.current
                                    .filter(s => s.id.startsWith(sidePrefix))
                                    .map(s => parseInt(s.id.split('-').pop() || '0')));
                                const isLastSentence = id.endsWith(`-sentence-${maxIndexForSide}`);

                                if (isFirstSentence || isLastSentence) {
                                    distance -= 90;
                                }

                                if (dx > 400) distance += 350;

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

                    if (closestRect) {
                        const rect = closestRect as DOMRect;
                        const rectCenterX = rect.left + rect.width / 2;
                        const rectCenterY = rect.top + rect.height / 2;

                        const yDiff = Math.abs(avgY - rectCenterY);
                        const xDiff = Math.abs(avgX - rectCenterX);

                        if (yDiff < 200) {
                            const snapFactorY = isFixatingRef.current ? 0.92 : 0.65;
                            finalY = avgY + (rectCenterY - avgY) * snapFactorY;

                            if (xDiff < 550) {
                                const snapFactorX = isFixatingRef.current ? 0.82 : 0.5;
                                finalX = avgX + (rectCenterX - avgX) * snapFactorX;
                                const errorX = rectCenterX - avgX;
                                driftOffsetRef.current.x = Math.max(-300, Math.min(300, driftOffsetRef.current.x + errorX * 0.004));
                            }

                            const errorY = rectCenterY - avgY;
                            driftOffsetRef.current.y = Math.max(-400, Math.min(400, driftOffsetRef.current.y + errorY * 0.008));
                        }
                    }

                    setDotPos({ x: finalX, y: finalY });

                    if (Math.hypot(finalX - lastTrailPosRef.current.x, finalY - lastTrailPosRef.current.y) > 25) {
                        const newId = Date.now();
                        setTrail(prev => [...prev.slice(-18), { x: finalX, y: finalY, id: newId }]);
                        lastTrailPosRef.current = { x: finalX, y: finalY };

                        setTimeout(() => {
                            setTrail(prev => prev.filter(t => t.id !== newId));
                        }, 800);
                    }

                    if (closestId !== lastUpdateIdRef.current) {
                        const DWELL_THRESHOLD = isFixatingRef.current ? 5 : 10;

                        if (closestId === candidateIdRef.current) {
                            dwellCountRef.current++;
                            if (dwellCountRef.current >= DWELL_THRESHOLD) {
                                lastUpdateIdRef.current = closestId;
                                dwellCountRef.current = 0;
                                latestOnGazeUpdateRef.current?.(closestId);
                            }
                        } else {
                            candidateIdRef.current = closestId;
                            dwellCountRef.current = 0;
                        }
                    } else {
                        dwellCountRef.current = 0;
                        candidateIdRef.current = null;
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
                }
            }
        };
    }, [onGazeUpdate]);

    return (
        <>
            <div className="fixed inset-0 pointer-events-none z-[2147483647]">
                {trail.map((t) => (
                    <div
                        key={t.id}
                        className="absolute rounded-full bg-[#BCE68F]/8 trail-blob blur-[8px]"
                        style={{
                            left: t.x,
                            top: t.y,
                            width: '60px',
                            height: '60px',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 20px rgba(188, 230, 143, 0.15)',
                        }}
                    />
                ))}
                <div
                    className="absolute rounded-[40%_60%_70%_30%/40%_50%_60%_50%] border-[2.5px] border-[#BCE68F]/70 bg-[#BCE68F]/25 backdrop-blur-[2px] transition-all duration-300 cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    style={{
                        left: dotPos.x,
                        top: dotPos.y,
                        width: '75px',
                        height: '75px',
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 30px rgba(188, 230, 143, 0.45), inset 0 0 20px rgba(188, 230, 143, 0.25)',
                        animation: 'blob-morph 4s ease-in-out infinite alternate',
                        filter: 'blur(0.5px)'
                    }}
                />
            </div>

            <style jsx global>{`
                @keyframes fade-out {
                    0% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); filter: blur(4px); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); filter: blur(12px); }
                }

                .trail-blob {
                    animation: fade-out 1.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
                }

                @keyframes blob-morph {
                    0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                    33% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: translate(-50%, -50%) scale(1.05) rotate(15deg); }
                    66% { border-radius: 30% 70% 70% 30% / 50% 40% 30% 60%; transform: translate(-50%, -50%) scale(0.95) rotate(-15deg); }
                    100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
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