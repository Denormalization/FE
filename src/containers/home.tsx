'use client';

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

export function LeftHomeContent({
    searchTerm,
    onSearchChange,
    books,
    isLoading
}: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    books: BookItem[];
    isLoading?: boolean;
}) {
    return (
        <div className="flex h-full w-full flex-col px-24">
            <div className="mt-6 mb-5 flex items-center gap-4">

                <img
                    src="/icons/search.svg"
                    alt="search"
                    className="h-7 w-6 opacity-50"
                />
                <input
                    type="text"
                    placeholder="책의 이름을 검색하세요"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="
                        w-full bg-transparent
                        text-lg text-gray-700
                        placeholder:text-gray-400
                        outline-none
                    "
                />
            </div>

            {isLoading ? (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-gray-400">불러오는 중...</p>
                </div>
            ) : books.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                    <p className="text-gray-400">책이 없습니다.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                    {books.map(book => (
                        <BookCard key={book.isbn} book={book} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function RightHomeContent({ books }: { books: BookItem[] }) {
    return (
        <div className="flex h-full w-full flex-col px-24 py-[4.5rem]">
            {books.length > 0 ? (
                <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                    {books.map(book => (
                        <BookCard key={book.isbn} book={book} />
                    ))}
                </div>
            ) : null}
        </div>
    );
}