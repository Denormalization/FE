import { NavItem } from '@/types/components';

export const GET_NAV_ITEMS = (router: any): NavItem[] => [
    {
        icon: <img src="/icons/home.svg" alt="홈" className="w-7 h-7" />,
        title: '홈',
        href: '/home',
        onClick: () => router.push('/home')
    },
    {
        icon: <img src="/icons/db.svg" alt="책 DB" className="w-7 h-7" />,
        title: '책 DB',
        href: '/bookDB',
        onClick: () => router.push('/bookDB')
    },
    {
        icon: <img src="/assets/read.svg" alt="읽고 있는 책" className="w-7 h-7" />,
        title: '읽고 있는 책',
        href: '/read',
        onClick: () => router.push('/read')
    },
    {
        icon: <img src="/icons/mypage.svg" alt="마이페이지" className="w-7 h-7" />,
        title: '마이페이지',
        href: '/mypage',
        onClick: () => router.push('/mypage')
    }
];
