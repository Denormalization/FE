'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';

interface ContentState {
    leftContent: ReactNode;
    rightContent: ReactNode;
}

interface BookContextType {
    leftContent: ReactNode;
    rightContent: ReactNode;
    overlayContent: ReactNode;
    flipKey: number;
    setBookContent: (left: ReactNode, right: ReactNode) => void;
    updateBookContent: (left: ReactNode, right: ReactNode) => void;
    setOverlayContent: (overlay: ReactNode) => void;
    activeGazeId: string | null;
    setActiveGazeId: (id: string | null) => void;
    prevContent: ContentState | null;
}

const BookContext = createContext<BookContextType | undefined>(undefined);

export function BookProvider({ children }: { children: ReactNode }) {
    const [content, setContent] = useState<ContentState>({
        leftContent: null,
        rightContent: null
    });
    const [overlayContent, setOverlayContent] = useState<ReactNode>(null);
    const [prevContent, setPrevContent] = useState<ContentState | null>(null);
    const [flipKey, setFlipKey] = useState(0);
    const [activeGazeId, setActiveGazeId] = useState<string | null>(null);

    const contentRef = useRef(content);
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    const triggerFlip = useCallback(() => {
        setFlipKey(prev => prev + 1);
    }, []);

    const setBookContent = useCallback((left: ReactNode, right: ReactNode) => {
        setPrevContent(contentRef.current);
        setContent({ leftContent: left, rightContent: right });
        setOverlayContent(null);
        setFlipKey(prev => prev + 1);
    }, []);

    const updateBookContent = useCallback((left: ReactNode, right: ReactNode) => {
        setContent({ leftContent: left, rightContent: right });
    }, []);

    const setOverlayContentStable = useCallback((overlay: ReactNode) => {
        setOverlayContent(overlay);
    }, []);

    const value = useMemo(() => ({
        ...content,
        overlayContent,
        flipKey,
        setBookContent,
        updateBookContent,
        setOverlayContent: setOverlayContentStable,
        triggerFlip,
        activeGazeId,
        setActiveGazeId,
        prevContent
    }), [content, overlayContent, flipKey, setBookContent, updateBookContent, setOverlayContentStable, triggerFlip, prevContent]);

    return (
        <BookContext.Provider value={value}>
            {children}
        </BookContext.Provider>
    );
}

export function useBook() {
    const context = useContext(BookContext);
    if (!context) {
        throw new Error('useBook must be used within a BookProvider');
    }
    return context;
}
