'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { BookItem } from '@/services/books';

const BookCard = ({ book }: { book: BookItem }) => {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/bookDetail?isbn=${book.isbn}`);
    };

    return (
        <div
            onClick={handleClick}
            className="
                group flex flex-col items-center
                cursor-pointer
                transition-transform duration-300
                hover:-translate-y-1
            "
        >
            <div
                className="
                    w-[14rem] h-[18rem] mb-3
                    flex items-center justify-center
                    overflow-hidden rounded-md
                    bg-gradient-to-br from-gray-100 to-gray-200
                    border border-gray-200
                    shadow-sm
                    transition-shadow duration-300
                    group-hover:shadow-md
                "
            >
                {book.coverUrl ? (
                    <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="px-4 text-center text-sm text-gray-500 leading-relaxed">
                        {book.title}
                    </div>
                )}
            </div>

            <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-800 leading-snug">
                    {book.title}
                </h3>
                <p className="text-xs text-gray-500">
                    {book.authors.join(', ')}
                </p>
            </div>
        </div>
    );
};

function SearchInput({ onSearchChange }: { onSearchChange: (value: string) => void }) {
    const [value, setValue] = useState('');

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        onSearchChange(e.target.value);
    }, [onSearchChange]);

    return (
        <input
            type="text"
            placeholder="책의 이름을 검색하세요"
            value={value}
            onChange={handleChange}
            className="
                w-full bg-transparent
                text-lg text-gray-700
                placeholder:text-gray-400
                outline-none
                pointer-events-auto
            "
        />
    );
}

export function LeftHomeContent({
    books,
    isLoading
}: {
    books: BookItem[];
    isLoading?: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = searchTerm
        ? books.filter(book =>
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        : books;

    const displayBooks = filtered.slice(0, 4);

    return (
        <div className="flex h-full w-full flex-col px-24 pointer-events-auto">
            <div className="mt-6 mb-5 flex items-center gap-4">

                <img
                    src="/icons/search.svg"
                    alt="search"
                    className="h-7 w-6 opacity-50"
                />
                <SearchInput onSearchChange={setSearchTerm} />
            </div>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-gray-400">불러오는 중...</p>
                </div>
            ) : displayBooks.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-gray-400">책이 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                    {displayBooks.map(book => (
                        <BookCard key={book.isbn} book={book} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function RightHomeContent({
    books,
    isLoading = false,
    page,
    totalPages,
    onPrevPage,
    onNextPage,
}: {
    books: BookItem[];
    isLoading?: boolean;
    page: number;
    totalPages: number;
    onPrevPage: () => void;
    onNextPage: () => void;
}) {
    return (
        <div className="relative flex h-full w-full flex-col px-24 pt-[4.5rem]">
            {!isLoading && books.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                    {books.map(book => (
                        <BookCard key={book.isbn} book={book} />
                    ))}
                </div>
            ) : null}

            <div className="absolute bottom-6 right-8 flex items-center gap-3">
                {page > 0 && (
                    <button
                        onClick={onPrevPage}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                        이전
                    </button>
                )}
                {page < totalPages - 1 && (
                    <button
                        onClick={onNextPage}
                        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                        다음
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}