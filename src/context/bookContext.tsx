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
    flipDirection: 'forward' | 'backward';
    readingText: string;
    readingTitle: string;
    setBookContent: (
        left: ReactNode,
        right: ReactNode,
        direction?: 'forward' | 'backward',
        options?: { preserveOverlay?: boolean }
    ) => void;
    updateBookContent: (left: ReactNode, right: ReactNode) => void;
    setOverlayContent: (overlay: ReactNode) => void;
    activeGazeId: string | null;
    setActiveGazeId: (id: string | null) => void;
    setReadingText: (text: string, title?: string) => void;
    currentIsbn: string | null;
    currentChapterId: string | null;
    setBookIds: (isbn: string, chapterId: string) => void;
    triggerFlip: (direction?: 'forward' | 'backward') => void;
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
    const [flipDirection, setFlipDirection] = useState<'forward' | 'backward'>('forward');
    const [activeGazeId, setActiveGazeId] = useState<string | null>(null);
    const [readingText, setReadingTextState] = useState('');
    const [readingTitle, setReadingTitle] = useState('');
    const [currentIsbn, setCurrentIsbn] = useState<string | null>(null);
    const [currentChapterId, setCurrentChapterId] = useState<string | null>(null);

    const contentRef = useRef(content);
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    const triggerFlip = useCallback((direction: 'forward' | 'backward' = 'forward') => {
        setFlipDirection(direction);
        setFlipKey(prev => prev + 1);
    }, []);

    const setBookContent = useCallback((
        left: ReactNode,
        right: ReactNode,
        direction: 'forward' | 'backward' = 'forward',
        options?: { preserveOverlay?: boolean }
    ) => {
        setPrevContent(contentRef.current);
        setContent({ leftContent: left, rightContent: right });
        setFlipDirection(direction);
        if (!options?.preserveOverlay) {
            setOverlayContent(null);
        }
        setFlipKey(prev => prev + 1);
    }, []);

    const updateBookContent = useCallback((left: ReactNode, right: ReactNode) => {
        setContent({ leftContent: left, rightContent: right });
    }, []);

    const setOverlayContentStable = useCallback((overlay: ReactNode) => {
        setOverlayContent(overlay);
    }, []);

    const setReadingText = useCallback((text: string, title?: string) => {
        setReadingTextState(text);
        if (title !== undefined) setReadingTitle(title);
    }, []);
    const setBookIds = useCallback((isbn: string, chapterId: string) => {
        setCurrentIsbn(isbn);
        setCurrentChapterId(chapterId);
    }, []);

    const value = useMemo(() => ({
        ...content,
        overlayContent,
        flipKey,
        flipDirection,
        readingText,
        readingTitle,
        currentIsbn,
        currentChapterId,
        setBookIds,
        setBookContent,
        updateBookContent,
        setOverlayContent: setOverlayContentStable,
        setReadingText,
        triggerFlip,
        activeGazeId,
        setActiveGazeId,
        prevContent
    }), [content, overlayContent, flipKey, flipDirection, readingText, readingTitle, currentIsbn, currentChapterId, setBookIds, setBookContent, updateBookContent, setOverlayContentStable, setReadingText, triggerFlip, activeGazeId, prevContent]);

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
