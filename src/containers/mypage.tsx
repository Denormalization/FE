'use client';

import { useRouter } from 'next/navigation';
import { useBook } from '@/context/bookContext';
import { ReadingItem } from '@/services/books';

const ReadingCard = ({ item }: { item: ReadingItem }) => {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/bookDetail?isbn=${item.bookIsbn}`);
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
                {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.bookTitle} className="w-full h-full object-cover" />
                ) : (
                    <div className="px-4 text-center text-sm text-gray-500 leading-relaxed">
                        {item.bookTitle}
                    </div>
                )}
            </div>

            <div className="text-center w-[14rem]">
                <h3 className="text-sm font-semibold text-gray-800 leading-snug truncate">
                    {item.bookTitle}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                    {item.chapterTitle} · {Math.round(item.progressPercent)}%
                </p>
            </div>
        </div>
    );
};

export function LeftMyPageContent({
    searchTerm,
    onSearchChange,
    items
}: {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    items: ReadingItem[];
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
                    placeholder="읽고 있는 책을 검색하세요"
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
                {items.map(item => (
                    <ReadingCard key={`${item.bookIsbn}-${item.chapterId}`} item={item} />
                ))}
            </div>
            {items.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-400 text-sm">읽고 있는 책이 없습니다.</p>
                </div>
            )}
        </div>
    );
}

export function RightMyPageContent({ items, onLogout }: { items: ReadingItem[]; onLogout?: () => void }) {
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
                {items.map(item => (
                    <ReadingCard key={`${item.bookIsbn}-${item.chapterId}`} item={item} />
                ))}
            </div>
        </div>
    );
}