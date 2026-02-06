'use client';

import { useRouter } from 'next/navigation';
import { NavItem } from '@/types/components';

const DEFAULT_NAV_ITEMS = (router: any): NavItem[] => [
    {
        icon: <img src="/icons/home.svg" alt="홈" className="w-7 h-7" />,
        title: '홈',
        onClick: () => router.push('/home')
    },
    {
        icon: <img src="/icons/db.svg" alt="책 DB" className="w-7 h-7" />,
        title: '책 DB',
        onClick: () => router.push('/db')
    },
    {
        icon: <img src="/assets/read.svg" alt="읽고 있는 책" className="w-7 h-7" />,
        title: '읽고 있는 책',
        onClick: () => router.push('/read')
    },
    {
        icon: <img src="/icons/mypage.svg" alt="마이페이지" className="w-7 h-7" />,
        title: '마이페이지',
        onClick: () => router.push('/mypage')
    }
];

export default function Navigation() {
    const router = useRouter();
    const items = DEFAULT_NAV_ITEMS(router);

    return (
        <nav className="absolute right-[-1.5rem] top-0 z-[5] flex flex-col gap-2">
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={item.onClick}
                    title={item.title}
                    className={`
                        flex h-14 w-14 items-center justify-center
                        rounded-lg text-white
                        bg-gradient-to-br from-[#c85a54] to-[#b94a44]
                        shadow-[0.25rem_0.25rem_0.75rem_rgba(0,0,0,0.3)]
                        transition-all duration-300
                        hover:translate-x-6
                        hover:shadow-[0.375rem_0.375rem_1rem_rgba(0,0,0,0.4)]
                        cursor-pointer
                        ${index !== items.length - 1 ? 'border-b border-white/20' : ''}
                    `}
                >
                    <div className="scale-100">
                        {item.icon}
                    </div>
                </button>
            ))}
        </nav>
    );
}