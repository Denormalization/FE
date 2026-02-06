'use client';

import Book from '@/components/book';
import { LeftHomeContent, RightHomeContent } from '@/containers/home';

export default function HomePage() {
    return (
        <Book
            leftContent={<LeftHomeContent />}
            rightContent={<RightHomeContent />}
        />
    );
}

