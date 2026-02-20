'use client';

import { useRouter, usePathname } from 'next/navigation';
import { GET_NAV_ITEMS } from '@/constants/navigation';
import { useBook } from '@/context/bookContext';

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { triggerFlip } = useBook();
    const items = GET_NAV_ITEMS(router);

    const handleNavigation = (e: React.MouseEvent, item: any) => {
        item.onClick();
    };

    return (
        <nav className="absolute right-[-3rem] top-0 z-[5] flex flex-col gap-2">
            {items.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                    <button
                        key={index}
                        onClick={(e) => handleNavigation(e, item)}
                        title={item.title}
                        className={`
                            flex h-14 w-16 items-center justify-center
                            rounded-lg text-white
                            bg-gradient-to-br from-[#c85a54] to-[#b94a44]
                            transition-all duration-300
                            active:scale-95
                            cursor-pointer
                            ${isActive ? 'brightness-110 ring-2 ring-white/30 translate-x-0' : 'opacity-90 hover:opacity-100 -translate-x-4 hover:translate-x-[-0.5rem]'}
                            ${index !== items.length - 1 ? 'border-b border-white/20' : ''}
                        `}
                    >
                        <div className="scale-100">
                            {item.icon}
                        </div>
                    </button>
                );
            })}
        </nav>
    );
}