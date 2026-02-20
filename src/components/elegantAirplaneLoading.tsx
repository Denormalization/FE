'use client';

import { useState, useEffect } from 'react';

interface ElegantAirplaneLoadingProps {
    className?: string;
}

export default function ElegantAirplaneLoading({ className = '' }: ElegantAirplaneLoadingProps) {
    const [progress, setProgress] = useState(0);
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 0;
                let speedIncrement;
                if (prev < 30) {
                    speedIncrement = 2;
                } else if (prev < 60) {
                    speedIncrement = 2.5;
                } else {
                    speedIncrement = 3.5;
                }
                
                return prev + speedIncrement;
            });
        }, 50);

        const opacityInterval = setInterval(() => {
            setOpacity(prev => {
                if (prev >= 1) return 1;
                return prev + 0.04;
            });
        }, 80);

        return () => {
            clearInterval(progressInterval);
            clearInterval(opacityInterval);
        };
    }, []);

    const getStrokeDasharray = (pathIndex: number) => {
        const pathLengths = [800, 600, 500];
        const totalLength = pathLengths.reduce((a, b) => a + b, 0);
        const currentLength = (totalLength * progress) / 100;
        
        let accumulatedLength = 0;
        for (let i = 0; i < pathIndex; i++) {
            accumulatedLength += pathLengths[i];
        }
        
        if (currentLength <= accumulatedLength) return '0 1000';
        if (currentLength >= accumulatedLength + pathLengths[pathIndex]) return '1000 0';
        
        const visibleLength = currentLength - accumulatedLength;
        return `${visibleLength} 1000`;
    };

    const getPathOpacity = (pathIndex: number) => {
        const pathLengths = [800, 600, 500];
        const totalLength = pathLengths.reduce((a, b) => a + b, 0);
        const currentLength = (totalLength * progress) / 100;
        
        let accumulatedLength = 0;
        for (let i = 0; i < pathIndex; i++) {
            accumulatedLength += pathLengths[i];
        }
        
        if (currentLength <= accumulatedLength) return 0;
        if (currentLength >= accumulatedLength + pathLengths[pathIndex]) return 1;
        
        return 0.2 + (0.8 * (currentLength - accumulatedLength)) / pathLengths[pathIndex];
    };

    const getPenPosition = () => {
        const pathLengths = [800, 600, 500];
        const totalLength = pathLengths.reduce((a, b) => a + b, 0);
        const currentLength = (totalLength * progress) / 100;
        
        if (currentLength <= 800) {
            return { top: `${80 - (currentLength / 800) * 30}%`, left: `${50 + (currentLength / 800) * 20}%` };
        } else if (currentLength <= 1400) {
            const secondProgress = (currentLength - 800) / 600;
            return { top: `${50 - secondProgress * 30}%`, left: '50%' };
        } else {
            const thirdProgress = (currentLength - 1400) / 500;
            return { top: `${20 - thirdProgress * 20}%`, left: `${50 - thirdProgress * 30}%` };
        }
    };

    const penPosition = getPenPosition();

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="relative w-32 h-32">
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 317 312"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-lg"
                    style={{ opacity }}
                >
                    <defs>
                        <linearGradient id="elegantGradient" x1="277.5" y1="179.5" x2="117.5" y2="287" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#BA3C3C"/>
                            <stop offset="1" stopColor="#FFBEBE"/>
                        </linearGradient>
                        
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    <path
                        d="M171.608 275.478L142.358 311.834L180.297 293.871L181.712 293.151L316.173 224.8L149.534 306.04L172.894 277.687L316.173 224.8L177.503 273.632L175.849 274.214L171.608 275.478Z"
                        fill="url(#elegantGradient)"
                        stroke="url(#elegantGradient)"
                        strokeWidth="1.5"
                        strokeDasharray={getStrokeDasharray(0)}
                        strokeDashoffset="0"
                        fillOpacity={getPathOpacity(0)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />
                    
                    <path
                        d="M247.185 178.42C247.185 153.778 94.7107 164.492 69.0535 151.297C75.6512 165.225 232.523 152.763 242.786 176.954C251.826 198.262 -59.3073 202.547 10.4097 270.051C56.5918 314.767 172.414 277.381 172.414 277.381C172.414 277.381 65.3891 308.902 16.2752 270.051C-68.7817 202.767 247.184 208.475 247.185 178.42Z"
                        fill="url(#elegantGradient)"
                        stroke="url(#elegantGradient)"
                        strokeWidth="1.5"
                        strokeDasharray={getStrokeDasharray(1)}
                        strokeDashoffset="0"
                        fillOpacity={getPathOpacity(1)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />
                    
                    <path
                        d="M135.029 0.289383L73.4526 135.17L74.1847 135.536L135.402 1.22206L140.563 3.40364C116.943 54.6849 95.4908 105.125 79.316 138.102L80.783 138.835L141.626 3.22157L135.029 0.289383Z"
                        fill="url(#elegantGradient)"
                        stroke="url(#elegantGradient)"
                        strokeWidth="1.5"
                        strokeDasharray={getStrokeDasharray(2)}
                        strokeDashoffset="0"
                        fillOpacity={getPathOpacity(2)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                    />
                </svg>

                <div 
                    className="absolute w-2 h-2 bg-red-500 rounded-full"
                    style={{
                        left: penPosition.left,
                        top: penPosition.top,
                        transform: 'translate(-50%, -50%)',
                        boxShadow: '0 0 12px rgba(186, 60, 60, 0.8)',
                        opacity: progress > 0 && progress < 100 ? 1 : 0,
                        transition: 'all 0.2s ease-out'
                    }}
                />

                <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: `radial-gradient(circle, rgba(186, 60, 60, ${0.1 * opacity}) 0%, transparent 60%)`,
                        transform: `scale(${1 + 0.03 * Math.sin(progress * 0.03)})`,
                    }}
                />
            </div>
        </div>
    );
}
