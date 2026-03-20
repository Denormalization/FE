'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Book } from '@/components/ui/book';

export default function BookShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isFullView = pathname === '/read/full';

    return (
        <div className="relative">
            <Book />
            <div className={`absolute inset-0 pointer-events-none ${isFullView ? 'z-[9999]' : 'z-0'}`}>
                {children}
            </div>
        </div>
    );
}