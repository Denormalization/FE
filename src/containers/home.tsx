'use client';

import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { BookData, BOOKS } from '@/mock/home';

const BookCard = ({ book }: { book: BookData }) => {
    const router = useRouter();
    const { triggerFlip } = useBook();

    const handleClick = () => {
        triggerFlip();
        router.push(`/bookDetail?id=${book.id}`);
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
                <div className="px-4 text-center text-sm text-gray-500 leading-relaxed">
                    {book.title}
                </div>
            </div>

            <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-800 leading-snug">
                    {book.title}
                </h3>
                <p className="text-xs text-gray-500">
                    {book.author}
                </p>
            </div>
        </div>
    );
};

export function LeftHomeContent({
    searchTerm,
    onSearchChange,
    books
}: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    books: BookData[];
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

            <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                {books.map(book => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>
        </div>
    );
}

export function RightHomeContent({ books }: { books: BookData[] }) {
    return (
        <div className="flex h-full w-full flex-col px-24 py-[4.5rem]">
            <div className="grid grid-cols-2 gap-x-20 gap-y-6">
                {books.map(book => (
                    <BookCard key={book.id} book={book} />
                ))}
            </div>
        </div>
    );
}