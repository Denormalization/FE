'use client';

import { useRouter } from 'next/navigation';
import { IoChevronBack } from 'react-icons/io5';

interface ReadFullHeaderProps {
    title: string;
}

export default function ReadFullHeader({ title }: ReadFullHeaderProps) {
    const router = useRouter();

    const handleBack = () => {
        router.back();
    };

    return (
        <header className="flex items-center gap-4 px-12 py-8 border-b border-gray-200">
            <button
                onClick={handleBack}
                className="flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                aria-label="뒤로 가기"
            >
                <IoChevronBack size={24} />
            </button>
            <h1 className="text-xl font-medium text-gray-800">{title}</h1>
        </header>
    );
}
