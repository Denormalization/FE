'use client';

import React from 'react';
import Book from '@/components/book';

export default function BookShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative">
            <Book />
            <div className="absolute inset-0 pointer-events-none">
                {children}
            </div>
        </div>
    );
}
