'use client';

import { useRouter, usePathname } from 'next/navigation';
import { GET_NAV_ITEMS } from '@/constants/navigation';

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const items = GET_NAV_ITEMS(router);

    return (
        <nav className="absolute right-[-1.5rem] top-0 z-[5] flex flex-col gap-2">
            {items.map((item, index) => {
                const isActive = pathname === item.href;
                return (
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
                            ${isActive ? 'translate-x-6 shadow-[0.375rem_0.375rem_1rem_rgba(0,0,0,0.4)]' : ''}
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