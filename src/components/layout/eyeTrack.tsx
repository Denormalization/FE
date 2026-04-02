'use client';

import { useEffect, useRef, useState } from 'react';
import { EyeTrackProps } from '@/types/eyeTrack';

export default function EyeTrack({ onGazeUpdate }: EyeTrackProps) {
    const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
    const targetPosRef = useRef({ x: 0, y: 0 });
    const currentPosRef = useRef({ x: 0, y: 0 });

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
    const [trail, setTrail] = useState<{ x: number; y: number; id: number; opacity: number; scale: number }[]>([]);
    const lastTrailPosRef = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | null>(null);


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
            const rectInterval = setInterval(updateSentenceRects, 3000);

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
                    const fixationThreshold = isFixatingRef.current ? 0.45 : 0.32;
                    isFixatingRef.current = velocity < fixationThreshold;

                    let rawX = data.x + driftOffsetRef.current.x;
                    let rawY = data.y + driftOffsetRef.current.y;

                    const screenHeight = window.innerHeight;
                    const screenWidth = window.innerWidth;

                    if (rawY > screenHeight * 0.8) {
                        const intensity = getIntensity(rawY, screenHeight * 0.8, screenHeight * 0.2);
                    } else if (rawY < screenHeight * 0.25) {
                        const intensity = getIntensity(rawY, screenHeight * 0.25, screenHeight * 0.25);
                        rawY -= 100 * intensity;
                    }

                    if (rawX > screenWidth * 0.5) {
                        const intensity = getIntensity(rawX, screenWidth * 0.5, screenWidth * 0.5);
                        rawX += 210 * intensity;
                    } else if (rawX < screenWidth * 0.5) {
                        const intensity = getIntensity(rawX, screenWidth * 0.5, screenWidth * 0.5);
                        rawX -= 210 * intensity;
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

                    const outlierThreshold = isFixatingRef.current ? 50 : 220;
                    if (gazeBufferRef.current.length > 3 && dist > outlierThreshold) {
                        const smoothFactor = isFixatingRef.current ? 0.02 : 0.18;
                        targetX = lastAvg.x + (rawX - lastAvg.x) * smoothFactor;
                        targetY = lastAvg.y + (rawY - lastAvg.y) * smoothFactor;
                    }

                    gazeBufferRef.current.push({ x: targetX, y: targetY });

                    const bufferLimit = isFixatingRef.current ? 45 : 18;
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
                        const isBottomRegion = y > screenHeight * 0.8;
                        const isTopRegion = y < screenHeight * 0.25;

                        const verticalToleranceMultiplier = (isBottomRegion || isTopRegion) ? 3.0 : 1.4;
                        const MAX_VERTICAL_DISTANCE = 280 * verticalToleranceMultiplier;

                        let verticalBias = 0;
                        if (isBottomRegion) {
                            verticalBias = -180 * getIntensity(y, screenHeight * 0.8, screenHeight * 0.2);
                        } else if (isTopRegion) {
                            verticalBias = 60 * getIntensity(y, screenHeight * 0.25, screenHeight * 0.25);
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
                                    distance -= 140;
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
                            const snapFactorY = isFixatingRef.current ? 0.95 : 0.75;
                            finalY = avgY + (rectCenterY - avgY) * snapFactorY;

                            if (xDiff < 550) {
                                const snapFactorX = isFixatingRef.current ? 0.9 : 0.65;
                                finalX = avgX + (rectCenterX - avgX) * snapFactorX;
                                const errorX = rectCenterX - avgX;
                                driftOffsetRef.current.x = Math.max(-300, Math.min(300, driftOffsetRef.current.x * 0.999 + errorX * 0.003));
                            }

                            const errorY = rectCenterY - avgY;
                            driftOffsetRef.current.y = Math.max(-400, Math.min(400, driftOffsetRef.current.y * 0.999 + errorY * 0.006));
                        }
                    }

                    targetPosRef.current = { x: finalX, y: finalY };

                    if (Math.hypot(finalX - lastTrailPosRef.current.x, finalY - lastTrailPosRef.current.y) > 12) {
                        const newId = Date.now();
                        setTrail(prev => [
                            ...prev.slice(-25),
                            { x: finalX, y: finalY, id: newId, opacity: 0.7, scale: 1.0 }
                        ]);
                        lastTrailPosRef.current = { x: finalX, y: finalY };
                    }



                    if (closestId !== lastUpdateIdRef.current) {
                        const DWELL_THRESHOLD = isFixatingRef.current ? 3 : 7;

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

                const animate = () => {
                    const lerpFactor = isFixatingRef.current ? 0.08 : 0.15;
                    currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * lerpFactor;
                    currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * lerpFactor;

                    setDotPos({ x: currentPosRef.current.x, y: currentPosRef.current.y });

                    setTrail(prev => {
                        const updated = prev
                            .map(p => ({
                                ...p,
                                opacity: p.opacity * 0.975,
                                scale: p.scale * 0.985
                            }))
                            .filter(p => p.opacity > 0.02);

                        return updated;
                    });


                    animationFrameRef.current = requestAnimationFrame(animate);
                };
                animationFrameRef.current = requestAnimationFrame(animate);

            } catch (err) {
            }

            return () => {
                clearInterval(rectInterval);
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            left: t.x,
                            top: t.y,
                            width: `${65 * t.scale}px`,
                            height: `${65 * t.scale}px`,
                            opacity: t.opacity,
                            transform: 'translate(-50%, -50%)',
                            background: 'radial-gradient(circle, rgba(188, 230, 143, 0.5) 0%, rgba(188, 230, 143, 0) 75%)',
                            mixBlendMode: 'plus-lighter',
                            filter: 'blur(8px)',
                        }}
                    />
                ))}

                <div
                    className="absolute rounded-full"
                    style={{
                        left: dotPos.x,
                        top: dotPos.y,
                        width: '45px',
                        height: '45px',
                        transform: 'translate(-50%, -50%)',
                        background: 'radial-gradient(circle, rgba(188, 230, 143, 0.45) 0%, rgba(188, 230, 143, 0.1) 80%)',
                        boxShadow: '0 0 25px rgba(188, 230, 143, 0.3)',
                    }}
                >
                    <div
                        className="absolute top-1/2 left-1/2 w-3 h-3 bg-[#BCE68F] rounded-full blur-[0.5px]"
                        style={{
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 10px #BCE68F, 0 0 20px #BCE68F',
                        }}
                    />
                </div>
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
                    0% { border-radius: 45% 55% 65% 35% / 50% 45% 55% 50%; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                    33% { border-radius: 65% 35% 50% 50% / 45% 45% 65% 65%; transform: translate(-50%, -50%) scale(1.1) rotate(120deg); }
                    66% { border-radius: 35% 65% 65% 35% / 55% 50% 45% 65%; transform: translate(-50%, -50%) scale(0.9) rotate(240deg); }
                    100% { border-radius: 45% 55% 65% 35% / 50% 45% 55% 50%; transform: translate(-50%, -50%) scale(1) rotate(360deg); }
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