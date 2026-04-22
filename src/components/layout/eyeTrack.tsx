'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EyeTrackProps } from '@/types/eyeTrack';

declare global {
    interface Window {
        webgazer: any;
        _webgazerInitCalled?: boolean;
        webgazerStarted?: boolean;
        webgazerEnded?: boolean;
    }
}

type Point = { x: number; y: number };
type RawSample = { x: number; y: number; t: number };
type CalibrationSample = {
    targetX: number;
    targetY: number;
    gazeX: number;
    gazeY: number;
    dx: number;
    dy: number;
};
type CalibrationPhase = 'collect' | 'validate' | 'done';

const CALIBRATION_SAMPLES_PER_POINT = 3;
const VALIDATION_SAMPLES_PER_POINT = 2;
const CALIBRATION_STORAGE_KEY = 'eyetrack_calibration_v1';
const MIN_STORED_CALIBRATION_SAMPLES = 5;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const median = (values: number[]) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const normalizeCalibrationSamples = (value: unknown): CalibrationSample[] | null => {
    const source = Array.isArray(value)
        ? value
        : value && typeof value === 'object' && Array.isArray((value as { samples?: unknown }).samples)
            ? (value as { samples: unknown[] }).samples
            : null;

    if (!source || source.length === 0) return null;

    const normalized = source
        .map((item) => {
            if (!item || typeof item !== 'object') return null;

            const sample = item as Partial<CalibrationSample>;
            const values = [sample.targetX, sample.targetY, sample.gazeX, sample.gazeY, sample.dx, sample.dy];
            if (!values.every((value) => isFiniteNumber(value))) return null;

            return {
                targetX: sample.targetX as number,
                targetY: sample.targetY as number,
                gazeX: sample.gazeX as number,
                gazeY: sample.gazeY as number,
                dx: sample.dx as number,
                dy: sample.dy as number,
            };
        })
        .filter((sample): sample is CalibrationSample => sample !== null);

    return normalized.length >= MIN_STORED_CALIBRATION_SAMPLES ? normalized : null;
};

export default function EyeTrack({ onGazeUpdate }: EyeTrackProps) {

    const [dotPos, setDotPos] = useState({ x: 500, y: 500 });
    const [trail, setTrail] = useState<{ x: number; y: number; id: number; opacity: number; scale: number }[]>([]);
    const [debugInfo, setDebugInfo] = useState({
        baseX: 500,
        baseY: 500,
        correctedX: 500,
        correctedY: 500,
        finalX: 500,
        finalY: 500,
        closestId: null as string | null,
        isFixating: false,
        sampleCount: 0,
        calDx: 0,
        calDy: 0,
    });

    const [hudVisible, setHudVisible] = useState(true);
    const [calibrationOpen, setCalibrationOpen] = useState(true);
    const [calibrationPhase, setCalibrationPhase] = useState<CalibrationPhase>('collect');
    const [calibrationIndex, setCalibrationIndex] = useState(0);
    const [calibrationMessage, setCalibrationMessage] = useState('점을 1초 정도 응시한 뒤 클릭하세요.');
    const [validationErrors, setValidationErrors] = useState<number[]>([]);
    const [validationMeanError, setValidationMeanError] = useState<number | null>(null);
    const [pointSampleCount, setPointSampleCount] = useState(0);
    const [viewport, setViewport] = useState({ width: 1280, height: 720 });
    const [portalReady, setPortalReady] = useState(false);
    const [calibrationBootstrapped, setCalibrationBootstrapped] = useState(false);

    const targetPosRef = useRef({ x: 500, y: 500 });
    const currentPosRef = useRef({ x: 500, y: 500 });
    const gazeBufferRef = useRef<{ x: number; y: number }[]>([]);
    const rawSamplesRef = useRef<RawSample[]>([]);
    const calibrationSamplesRef = useRef<CalibrationSample[]>([]);
    const collectPointSamplesRef = useRef<Point[]>([]);
    const validatePointSamplesRef = useRef<Point[]>([]);
    const bookBoundsRef = useRef<{ left: number; right: number; top: number; bottom: number } | null>(null);

    const lastPointRef = useRef<{ x: number; y: number; t: number } | null>(null);
    const isFixatingRef = useRef(false);
    const sentenceRectsRef = useRef<{ id: string; rect: DOMRect; order: number }[]>([]);
    const lastUpdateIdRef = useRef<string | null>(null);
    const dwellCountRef = useRef<number>(0);
    const candidateIdRef = useRef<string | null>(null);
    const latestOnGazeUpdateRef = useRef(onGazeUpdate);
    const isCalibrationOpenRef = useRef(calibrationOpen);

    const lastTrailPosRef = useRef({ x: 0, y: 0 });
    const animationFrameRef = useRef<number | null>(null);
    const lastDebugUpdateRef = useRef(0);

    const calibrationPoints = useMemo<Point[]>(() => {
        const marginX = Math.max(70, Math.min(180, viewport.width * 0.14));
        const marginY = Math.max(70, Math.min(160, viewport.height * 0.14));
        const xs = [marginX, viewport.width / 2, viewport.width - marginX];
        const ys = [marginY, viewport.height / 2, viewport.height - marginY];

        const points: Point[] = [];
        ys.forEach((y) => {
            xs.forEach((x) => points.push({ x, y }));
        });

        return points;
    }, [viewport.height, viewport.width]);

    const validationPoints = useMemo<Point[]>(() => {
        if (calibrationPoints.length < 9) return calibrationPoints;
        return [calibrationPoints[0], calibrationPoints[2], calibrationPoints[4], calibrationPoints[6], calibrationPoints[8]];
    }, [calibrationPoints]);

    const getCalibrationOffset = (x: number, y: number) => {
        const samples = calibrationSamplesRef.current;
        if (samples.length === 0) {
            return { dx: 0, dy: 0 };
        }

        const neighbors = samples
            .map((sample) => ({
                dx: sample.dx,
                dy: sample.dy,
                distance: Math.hypot(x - sample.targetX, y - sample.targetY),
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 4);

        let weightedDx = 0;
        let weightedDy = 0;
        let sumWeight = 0;

        neighbors.forEach((neighbor) => {
            const weight = 1 / Math.pow(Math.max(neighbor.distance, 40), 1.35);
            weightedDx += neighbor.dx * weight;
            weightedDy += neighbor.dy * weight;
            sumWeight += weight;
        });

        if (sumWeight === 0) return { dx: 0, dy: 0 };

        return {
            dx: clamp(weightedDx / sumWeight, -220, 220),
            dy: clamp(weightedDy / sumWeight, -220, 220),
        };
    };

    const captureRecentGaze = (windowMs = 350, minSamples = 8) => {
        const now = Date.now();
        const samples = rawSamplesRef.current.filter((sample) => now - sample.t <= windowMs);
        if (samples.length < minSamples) return null;

        const x = median(samples.map((sample) => sample.x));
        const y = median(samples.map((sample) => sample.y));
        const spread = Math.sqrt(samples.reduce((sum, sample) => {
            const d = Math.hypot(sample.x - x, sample.y - y);
            return sum + d * d;
        }, 0) / samples.length);

        return { x, y, spread };
    };

    const resetDwellState = () => {
        candidateIdRef.current = null;
        dwellCountRef.current = 0;
    };

    const persistCalibrationSamples = () => {
        if (typeof window === 'undefined') return;
        if (calibrationSamplesRef.current.length === 0) return;

        try {
            window.localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify({
                samples: calibrationSamplesRef.current,
                savedAt: Date.now(),
            }));
        } catch (error) {
            console.warn('Failed to persist calibration samples:', error);
        }
    };

    const closeCalibrationWithSave = () => {
        persistCalibrationSamples();
        setCalibrationOpen(false);
    };

    const startCalibration = () => {
        calibrationSamplesRef.current = [];
        collectPointSamplesRef.current = [];
        validatePointSamplesRef.current = [];
        setValidationErrors([]);
        setValidationMeanError(null);
        setPointSampleCount(0);
        setCalibrationPhase('collect');
        setCalibrationIndex(0);
        setCalibrationOpen(true);
        setCalibrationMessage('점을 1초 정도 응시한 뒤 클릭하세요.');

        gazeBufferRef.current = [];
        lastUpdateIdRef.current = null;
        resetDwellState();
        latestOnGazeUpdateRef.current?.(null);
    };

    const handleCollectPointClick = () => {
        const target = calibrationPoints[calibrationIndex];
        if (!target) return;

        const sample = captureRecentGaze();
        if (!sample) {
            setCalibrationMessage('샘플이 부족합니다. 점을 1초 정도 응시한 뒤 다시 클릭하세요.');
            return;
        }
        if (sample.spread > 95) {
            setCalibrationMessage('시선 흔들림이 큽니다. 머리를 고정하고 다시 클릭하세요.');
            return;
        }

        collectPointSamplesRef.current.push({ x: sample.x, y: sample.y });
        const currentCount = collectPointSamplesRef.current.length;
        setPointSampleCount(currentCount);

        if (currentCount < CALIBRATION_SAMPLES_PER_POINT) {
            setCalibrationMessage(`같은 점을 다시 클릭하세요. 샘플 ${currentCount}/${CALIBRATION_SAMPLES_PER_POINT}`);
            return;
        }

        const stableGazeX = median(collectPointSamplesRef.current.map((value) => value.x));
        const stableGazeY = median(collectPointSamplesRef.current.map((value) => value.y));

        collectPointSamplesRef.current = [];
        setPointSampleCount(0);

        calibrationSamplesRef.current.push({
            targetX: target.x,
            targetY: target.y,
            gazeX: stableGazeX,
            gazeY: stableGazeY,
            dx: target.x - stableGazeX,
            dy: target.y - stableGazeY,
        });

        const nextIndex = calibrationIndex + 1;
        if (nextIndex >= calibrationPoints.length) {
            setCalibrationPhase('validate');
            setCalibrationIndex(0);
            setCalibrationMessage('검증 점을 같은 방식으로 클릭하세요.');
            return;
        }

        setCalibrationIndex(nextIndex);
        setCalibrationMessage(`보정 ${nextIndex}/${calibrationPoints.length} 완료`);
    };

    const handleValidatePointClick = () => {
        const target = validationPoints[calibrationIndex];
        if (!target) return;

        const sample = captureRecentGaze();
        if (!sample) {
            setCalibrationMessage('검증 샘플이 부족합니다. 점을 잠깐 응시한 뒤 다시 클릭하세요.');
            return;
        }
        if (sample.spread > 110) {
            setCalibrationMessage('검증 샘플이 흔들립니다. 같은 점을 다시 클릭하세요.');
            return;
        }

        validatePointSamplesRef.current.push({ x: sample.x, y: sample.y });
        const currentCount = validatePointSamplesRef.current.length;
        setPointSampleCount(currentCount);

        if (currentCount < VALIDATION_SAMPLES_PER_POINT) {
            setCalibrationMessage(`검증 샘플 ${currentCount}/${VALIDATION_SAMPLES_PER_POINT}. 같은 점을 다시 클릭하세요.`);
            return;
        }

        const stableX = median(validatePointSamplesRef.current.map((value) => value.x));
        const stableY = median(validatePointSamplesRef.current.map((value) => value.y));

        validatePointSamplesRef.current = [];
        setPointSampleCount(0);

        const offset = getCalibrationOffset(stableX, stableY);
        const predictedX = stableX + offset.dx;
        const predictedY = stableY + offset.dy;
        const error = Math.hypot(target.x - predictedX, target.y - predictedY);

        const nextErrors = [...validationErrors, error];
        setValidationErrors(nextErrors);

        const nextIndex = calibrationIndex + 1;
        if (nextIndex >= validationPoints.length) {
            const meanError = nextErrors.reduce((sum, value) => sum + value, 0) / nextErrors.length;
            setValidationMeanError(meanError);
            setCalibrationPhase('done');
            if (meanError <= 95) {
                setCalibrationMessage('보정이 완료되었습니다. 추적을 시작할 수 있습니다.');
            } else {
                setCalibrationMessage('오차가 큽니다. 다시 보정을 권장합니다.');
            }
            return;
        }

        setCalibrationIndex(nextIndex);
        setCalibrationMessage(`검증 ${nextIndex}/${validationPoints.length} 완료`);
    };

    useEffect(() => {
        latestOnGazeUpdateRef.current = onGazeUpdate;
    }, [onGazeUpdate]);

    useEffect(() => {
        isCalibrationOpenRef.current = calibrationOpen;
    }, [calibrationOpen]);

    useEffect(() => {
        setPortalReady(true);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        try {
            const raw = window.localStorage.getItem(CALIBRATION_STORAGE_KEY);
            if (!raw) {
                setCalibrationOpen(true);
                setCalibrationBootstrapped(true);
                return;
            }

            const parsed = JSON.parse(raw);
            const restoredSamples = normalizeCalibrationSamples(parsed);

            if (!restoredSamples) {
                window.localStorage.removeItem(CALIBRATION_STORAGE_KEY);
                setCalibrationOpen(true);
                setCalibrationBootstrapped(true);
                return;
            }

            calibrationSamplesRef.current = restoredSamples;
            setCalibrationPhase('done');
            setCalibrationIndex(0);
            setValidationErrors([]);
            setValidationMeanError(null);
            setPointSampleCount(0);
            setCalibrationMessage('저장된 보정값을 불러왔습니다.');
            setCalibrationOpen(false);
        } catch (error) {
            console.warn('Failed to restore calibration samples:', error);
            setCalibrationOpen(true);
        } finally {
            setCalibrationBootstrapped(true);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const updateViewport = () => {
            setViewport({ width: window.innerWidth, height: window.innerHeight });
        };

        updateViewport();
        window.addEventListener('resize', updateViewport);
        return () => {
            window.removeEventListener('resize', updateViewport);
        };
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && !(window as any).WebGazerConfig) {
            (window as any).WebGazerConfig = {};
        }

        const SCRIPT_URL = 'https://webgazer.cs.brown.edu/webgazer.js';

        const updateSentenceRects = () => {
            const bookRoot = document.querySelector('[data-book-root="true"]') as HTMLElement | null;
            if (bookRoot) {
                const bookRect = bookRoot.getBoundingClientRect();
                const boundaryPadding = 8;
                bookBoundsRef.current = {
                    left: bookRect.left + boundaryPadding,
                    right: bookRect.right - boundaryPadding,
                    top: bookRect.top + boundaryPadding,
                    bottom: bookRect.bottom - boundaryPadding,
                };
            } else {
                bookBoundsRef.current = null;
            }

            const elements = document.querySelectorAll('[id*="sentence-"]');
            const rects: { id: string; rect: DOMRect; order: number }[] = [];
            elements.forEach((element, index) => {
                rects.push({
                    id: (element as HTMLElement).id,
                    rect: (element as HTMLElement).getBoundingClientRect(),
                    order: index,
                });
            });
            sentenceRectsRef.current = rects;
        };

        const resizeObserver = new ResizeObserver(updateSentenceRects);
        resizeObserver.observe(document.body);

        const initWebGazer = () => {
            if (!window.webgazer) return;

            updateSentenceRects();
            const rectInterval = setInterval(updateSentenceRects, 200);

            try {
                window.webgazer.setGazeListener((data: any) => {
                    if (!data || typeof data.x !== 'number' || typeof data.y !== 'number' || Number.isNaN(data.x) || Number.isNaN(data.y)) {
                        return;
                    }

                    const now = Date.now();
                    rawSamplesRef.current.push({ x: data.x, y: data.y, t: now });
                    while (rawSamplesRef.current.length > 180) {
                        rawSamplesRef.current.shift();
                    }

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

                    const calibrationOffset = getCalibrationOffset(data.x, data.y);
                    const rawX = data.x + calibrationOffset.dx;
                    const rawY = data.y + calibrationOffset.dy;

                    const lastAvg =
                        gazeBufferRef.current.length > 0
                            ? {
                                x: gazeBufferRef.current.reduce((sum, p) => sum + p.x, 0) / gazeBufferRef.current.length,
                                y: gazeBufferRef.current.reduce((sum, p) => sum + p.y, 0) / gazeBufferRef.current.length,
                            }
                            : { x: rawX, y: rawY };

                    const dist = Math.hypot(rawX - lastAvg.x, rawY - lastAvg.y);

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
                    const totalWeight = gazeBufferRef.current.reduce((sum, _, index) => sum + Math.pow(index + 1, weightPower), 0);

                    const avgX = gazeBufferRef.current.reduce((sum, p, index) => sum + p.x * Math.pow(index + 1, weightPower), 0) / totalWeight;
                    const avgY = gazeBufferRef.current.reduce((sum, p, index) => sum + p.y * Math.pow(index + 1, weightPower), 0) / totalWeight;

                    const findClosestSentence = (x: number, y: number) => {
                        let closestId: string | null = null;
                        let minDistance = Infinity;

                        sentenceRectsRef.current.forEach(({ id, rect }) => {
                            const clampedX = clamp(x, rect.left, rect.right);
                            const clampedY = clamp(y, rect.top, rect.bottom);
                            let distance = Math.hypot(x - clampedX, y - clampedY);

                            if (id === lastUpdateIdRef.current) {
                                distance -= isFixatingRef.current ? 14 : 8;
                            }

                            if (distance < minDistance) {
                                minDistance = distance;
                                closestId = id;
                            }
                        });

                        return { closestId, minDistance };
                    };

                    const bounds = bookBoundsRef.current;
                    const boundedX = bounds ? clamp(avgX, bounds.left, bounds.right) : avgX;
                    const boundedY = bounds ? clamp(avgY, bounds.top, bounds.bottom) : avgY;

                    const { closestId, minDistance } = findClosestSentence(boundedX, boundedY);

                    const finalX = boundedX;
                    const finalY = boundedY;

                    if (!Number.isNaN(finalX) && !Number.isNaN(finalY)) {
                        targetPosRef.current = { x: finalX, y: finalY };
                    }

                    if (now - lastDebugUpdateRef.current > 80) {
                        setDebugInfo({
                            baseX: data.x,
                            baseY: data.y,
                            correctedX: avgX,
                            correctedY: avgY,
                            finalX,
                            finalY,
                            closestId: minDistance < 170 ? closestId : null,
                            isFixating: isFixatingRef.current,
                            sampleCount: gazeBufferRef.current.length,
                            calDx: calibrationOffset.dx,
                            calDy: calibrationOffset.dy,
                        });
                        lastDebugUpdateRef.current = now;
                    }

                    if (Math.hypot(finalX - lastTrailPosRef.current.x, finalY - lastTrailPosRef.current.y) > 12) {
                        const newId = Date.now();
                        setTrail((prev) => [
                            ...prev.slice(-25),
                            { x: finalX, y: finalY, id: newId, opacity: 0.7, scale: 1.0 },
                        ]);
                        lastTrailPosRef.current = { x: finalX, y: finalY };
                    }

                    if (isCalibrationOpenRef.current) {
                        return;
                    }

                    const selectableId = minDistance < 170 ? closestId : null;

                    if (selectableId !== lastUpdateIdRef.current) {
                        const dwellThreshold = isFixatingRef.current ? 3 : 7;

                        if (selectableId === candidateIdRef.current) {
                            dwellCountRef.current++;
                            if (dwellCountRef.current >= dwellThreshold) {
                                lastUpdateIdRef.current = selectableId;
                                dwellCountRef.current = 0;
                                latestOnGazeUpdateRef.current?.(selectableId);
                            }
                        } else {
                            candidateIdRef.current = selectableId;
                            dwellCountRef.current = 0;
                        }
                    } else {
                        resetDwellState();
                    }
                });

                if (window.webgazer) {
                    window.webgazer
                        .showVideoPreview(false)
                        .showPredictionPoints(false)
                        .applyKalmanFilter(true);

                    if (window.webgazer.params) {
                        window.webgazer.params.showVideo = false;
                        window.webgazer.params.showFaceOverlay = false;
                        window.webgazer.params.showFaceFeedbackBox = false;
                    }

                    try {
                        if ((window as any).webgazerStarted && !(window as any).webgazerEnded) {
                            window.webgazer.resume();
                        } else {
                            window.webgazer.begin();
                            (window as any).webgazerStarted = true;
                            (window as any).webgazerEnded = false;
                        }
                    } catch (error) {
                        console.error('Failed to start webgazer:', error);
                    }
                }
            } catch (error) {
                console.error('WebGazer init failed:', error);
            }

            return () => {
                clearInterval(rectInterval);
            };
        };

        let cleanupInit: (() => void) | null | undefined = null;
        const initWrapper = () => {
            if (!(window as any)._webgazerInitCalled) {
                (window as any)._webgazerInitCalled = true;
                cleanupInit = initWebGazer();
            }
        };

        if (window.webgazer) {
            initWrapper();
        } else {
            const existingScript = document.querySelector('script[src="' + SCRIPT_URL + '"]');
            if (existingScript) {
                existingScript.addEventListener('load', initWrapper);
            } else {
                const script = document.createElement('script');
                script.src = SCRIPT_URL;
                script.async = true;
                script.onload = initWrapper;
                document.body.appendChild(script);
            }
        }

        return () => {
            resizeObserver.disconnect();
            if (cleanupInit) cleanupInit();
            (window as any)._webgazerInitCalled = false;
        };
    });

    useEffect(() => {
        const animate = () => {
            if (Number.isNaN(currentPosRef.current.x) || Number.isNaN(currentPosRef.current.y)) {
                currentPosRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            }

            const lerpFactor = isFixatingRef.current ? 0.08 : 0.15;
            currentPosRef.current.x += (targetPosRef.current.x - currentPosRef.current.x) * lerpFactor;
            currentPosRef.current.y += (targetPosRef.current.y - currentPosRef.current.y) * lerpFactor;

            if (!Number.isNaN(currentPosRef.current.x) && !Number.isNaN(currentPosRef.current.y)) {
                setDotPos({ x: currentPosRef.current.x, y: currentPosRef.current.y });
            }

            setTrail((prev) =>
                prev
                    .map((point) => ({
                        ...point,
                        opacity: point.opacity * 0.975,
                        scale: point.scale * 0.985,
                    }))
                    .filter((point) => point.opacity > 0.02)
            );

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    });

    const activeCalibrationPoints = calibrationPhase === 'validate' ? validationPoints : calibrationPoints;

    const calibrationLayer = calibrationBootstrapped ? (
        <>
            {!calibrationOpen && (
                <button
                    type="button"
                    onClick={startCalibration}
                    className="fixed left-4 top-4 z-[2147483647] rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow"
                >
                    시선 보정 다시하기
                </button>
            )}

            {calibrationOpen && (
                <div className="fixed inset-0 z-[2147483647] bg-black/70 backdrop-blur-[2px]">
                    <div className="absolute left-1/2 top-6 w-[min(92vw,560px)] -translate-x-1/2 rounded-xl border border-white/25 bg-white/95 px-6 py-4 text-gray-800 shadow-2xl">
                        <h3 className="text-sm font-bold">시선 보정</h3>
                        <p className="mt-1 text-xs text-gray-600">{calibrationMessage}</p>
                        <p className="mt-1 text-[11px] text-gray-500">밝은 조명, 정면 자세, 화면과 40~70cm 거리에서 진행하세요.</p>

                        {calibrationPhase === 'collect' && (
                            <p className="mt-2 text-xs font-medium text-emerald-700">
                                진행: {Math.min(calibrationIndex + 1, calibrationPoints.length)}/{calibrationPoints.length}
                            </p>
                        )}
                        {calibrationPhase === 'collect' && (
                            <p className="mt-1 text-[11px] text-emerald-700/90">
                                점당 샘플: {pointSampleCount}/{CALIBRATION_SAMPLES_PER_POINT}
                            </p>
                        )}

                        {calibrationPhase === 'validate' && (
                            <p className="mt-2 text-xs font-medium text-sky-700">
                                검증: {Math.min(calibrationIndex + 1, validationPoints.length)}/{validationPoints.length}
                            </p>
                        )}
                        {calibrationPhase === 'validate' && (
                            <p className="mt-1 text-[11px] text-sky-700/90">
                                점당 샘플: {pointSampleCount}/{VALIDATION_SAMPLES_PER_POINT}
                            </p>
                        )}

                        {calibrationPhase === 'done' && (
                            <div className="mt-3 flex flex-col gap-2">
                                <p className="text-xs text-gray-700">
                                    평균 오차: <strong>{Math.round(validationMeanError ?? 0)}px</strong>
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={closeCalibrationWithSave}
                                        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                    >
                                        시작하기
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startCalibration}
                                        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700"
                                    >
                                        다시 보정
                                    </button>
                                </div>
                            </div>
                        )}

                        {calibrationPhase !== 'done' && (
                            <button
                                type="button"
                                onClick={() => setCalibrationOpen(false)}
                                className="mt-3 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600"
                            >
                                이번엔 건너뛰기
                            </button>
                        )}
                    </div>

                    {activeCalibrationPoints.map((point, index) => {
                        const isActive = calibrationPhase !== 'done' && index === calibrationIndex;
                        const isDonePoint = index < calibrationIndex;

                        return (
                            <button
                                key={`${calibrationPhase}-${index}`}
                                type="button"
                                disabled={!isActive}
                                onClick={calibrationPhase === 'collect' ? handleCollectPointClick : handleValidatePointClick}
                                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all ${isActive
                                        ? 'h-9 w-9 border-white bg-emerald-500 shadow-[0_0_0_8px_rgba(16,185,129,0.28)] cursor-pointer'
                                        : isDonePoint
                                            ? 'h-6 w-6 border-emerald-200 bg-emerald-200/80'
                                            : 'h-5 w-5 border-white/70 bg-white/30'
                                    }`}
                                style={{
                                    left: `${point.x}px`,
                                    top: `${point.y}px`,
                                    pointerEvents: isActive ? 'auto' : 'none',
                                }}
                            />
                        );
                    })}
                </div>
            )}
        </>
    ) : null;

    return (
        <>
            <div className="fixed inset-0 pointer-events-none z-[2147483647]">
                {trail.map((point) => (
                    <div
                        key={point.id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                            left: `${point.x}px`,
                            top: `${point.y}px`,
                            width: `${50 * point.scale}px`,
                            height: `${50 * point.scale}px`,
                            opacity: point.opacity,
                            transform: 'translate(-50%, -50%)',
                            background: 'radial-gradient(circle, rgba(62, 207, 142, 0.42) 0%, rgba(62, 207, 142, 0) 80%)',
                            filter: 'blur(6px)',
                        }}
                    />
                ))}

                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-emerald-400"
                    style={{
                        left: `${dotPos.x}px`,
                        top: `${dotPos.y}px`,
                        width: '34px',
                        height: '34px',
                        boxShadow: '0 0 16px rgba(74, 222, 128, 0.8)',
                    }}
                >
                    <div className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-300" />
                </div>

                <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-400/90 bg-rose-400/20"
                    style={{
                        left: `${debugInfo.baseX}px`,
                        top: `${debugInfo.baseY}px`,
                        width: '14px',
                        height: '14px',
                    }}
                />
            </div>

            {hudVisible ? (
                <div className="fixed right-4 top-4 z-[2147483647] pointer-events-auto w-[320px] rounded-lg border border-emerald-300/40 bg-black/70 p-3 text-[11px] text-emerald-100 backdrop-blur">
                    <div className="mb-2 flex items-center justify-between">
                        <strong className="text-xs tracking-wide">EyeTrack Dev HUD</strong>
                        <div className="flex items-center gap-2">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] ${debugInfo.isFixating ? 'bg-emerald-500/30 text-emerald-100' : 'bg-amber-500/30 text-amber-100'}`}>
                                {debugInfo.isFixating ? 'FIXATION' : 'SACCADE'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setHudVisible(false)}
                                className="flex h-4 w-4 items-center justify-center rounded text-emerald-300/60 hover:text-emerald-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        <span>Raw</span>
                        <span>{`${Math.round(debugInfo.baseX)}, ${Math.round(debugInfo.baseY)}`}</span>
                        <span>Corrected</span>
                        <span>{`${Math.round(debugInfo.correctedX)}, ${Math.round(debugInfo.correctedY)}`}</span>
                        <span>Final</span>
                        <span>{`${Math.round(debugInfo.finalX)}, ${Math.round(debugInfo.finalY)}`}</span>
                        <span>Samples</span>
                        <span>{debugInfo.sampleCount}</span>
                        <span>Cal Offset</span>
                        <span>{`${Math.round(debugInfo.calDx)}, ${Math.round(debugInfo.calDy)}`}</span>
                        <span>Sentence</span>
                        <span className="truncate">{debugInfo.closestId ?? '-'}</span>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => setHudVisible(true)}
                    className="fixed right-4 top-4 z-[2147483647] pointer-events-auto rounded-md border border-emerald-300/40 bg-black/70 px-2 py-1 text-[10px] text-emerald-300/60 hover:text-emerald-100 backdrop-blur transition-colors"
                >
                    HUD
                </button>
            )}

            {portalReady ? createPortal(calibrationLayer, document.body) : null}

            <style jsx global>{`
                #webgazerVideoContainer,
                #webgazerFaceOverlay,
                #webgazerFaceFeedbackBox {
                    pointer-events: none !important;
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 1px !important;
                    height: 1px !important;
                    clip-path: circle(0) !important;
                    z-index: 99999 !important;
                }
            `}</style>
        </>
    );
}
