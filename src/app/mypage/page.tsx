'use client';

import Book from '@/components/book';
import { LeftHomeContent, RightHomeContent } from '@/containers/mypage';

export default function HomePage() {
    return (
        <Book
            leftContent={<LeftHomeContent />}
            rightContent={<RightHomeContent />}
        />
    );
}
