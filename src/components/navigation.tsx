'use client';

import { ReactNode } from 'react';
import { NavigationProps } from '@/types/components';

export default function Navigation({ items }: NavigationProps) {
    return (
        <nav className="absolute right-[-1.5rem] top-0 z-[5] flex flex-col gap-2">
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={item.onClick}
                    title={item.title}
                    className={`
                        flex h-14 w-14 items-center justify-center
                        rounded-lg text-white
                        bg-gradient-to-br from-[#c85a54] to-[#b94a44]
                        shadow-[0.25rem_0.25rem_0.75rem_rgba(0,0,0,0.3)]
                        transition-all duration-300
                        hover:translate-x-6
                        hover:shadow-[0.375rem_0.375rem_1rem_rgba(0,0,0,0.4)]
                        cursor-pointer
                        ${index !== items.length - 1 ? 'border-b border-white/20' : ''}
                    `}
                >
                    <div className="scale-100">
                        {item.icon}
                    </div>
                </button>
            ))}
        </nav>
    );
}