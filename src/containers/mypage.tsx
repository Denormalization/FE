'use client';

import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { ReadingBook } from '@/services/books';

const BookCard = ({ book }: { book: ReadingBook }) => {
    const router = useRouter();

    const handleClick = () => {
        localStorage.setItem('lastRead', JSON.stringify({
            isbn: book.bookIsbn,
            chapterId: book.chapterId,
            title: book.bookTitle,
        }));
        router.push('/read');
    };

    return (
        <div
            onClick={handleClick}
            className="group flex flex-col items-center cursor-pointer transition-transform duration-300 hover:-translate-y-1"
        >
            <div className="w-[14rem] h-[18rem] mb-3 flex items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-sm transition-shadow duration-300 group-hover:shadow-md relative">
                {book.coverUrl ? (
                    <img
                        src={book.coverUrl}
                        alt={book.bookTitle}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="px-4 text-center text-sm text-gray-500 leading-relaxed">
                        {book.bookTitle}
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                    <div
                        className="h-full bg-[#38844E] transition-all duration-300"
                        style={{ width: `${book.progressPercent}%` }}
                    />
                </div>
            </div>

            <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-800 leading-snug">
                    {book.bookTitle}
                </h3>
                <p className="text-xs text-gray-500">
                    {book.chapterTitle} · {Math.round(book.progressPercent)}%
                </p>
            </div>
        </div>
    );
};

export function LeftHomeContent({
    searchTerm,
    onSearchChange,
    books,
    loading = false,
}: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    books: ReadingBook[];
    loading?: boolean;
}) {
    return (
        <div className="flex h-full w-full flex-col px-24">
            <div className="mt-6 mb-5 flex items-center gap-4">
                <img src="/icons/search.svg" alt="search" className="h-7 w-6 opacity-50" />
                <input
                    type="text"
                    placeholder="읽고 있는 책을 검색하세요"
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full bg-transparent text-lg text-gray-700 placeholder:text-gray-400 outline-none"
                />
            </div>

            {loading ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
                    <span className="inline-block w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
                    <p className="text-sm">불러오는 중...</p>
                </div>
            ) : books.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
                    <p className="text-sm">읽고 있는 책이 없어요</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                    {books.map(book => (
                        <BookCard key={book.bookIsbn} book={book} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function RightHomeContent({
    books,
    onLogout,
}: {
    books: ReadingBook[];
    onLogout?: () => void;
}) {
    return (
        <div className="flex h-full w-full flex-col px-24 py-[4.5rem]">
            {onLogout && (
                <div className="flex justify-end mb-4 -mt-8">
                    <button
                        onClick={onLogout}
                        className="text-sm text-gray-400 hover:text-[#e57373] transition cursor-pointer"
                    >
                        로그아웃
                    </button>
                </div>
            )}
            <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                {books.map(book => (
                    <BookCard key={book.bookIsbn} book={book} />
                ))}
            </div>
        </div>
    );
}
