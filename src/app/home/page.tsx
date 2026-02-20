'use client';

import { useState } from 'react';
import Book from '@/components/ui/book';
import { LeftHomeContent, RightHomeContent } from '@/containers/home';
import { BOOKS } from '@/mock/home';

export default function HomePage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredBooks = BOOKS.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const leftBooks = filteredBooks.slice(0, 4);
    const rightBooks = filteredBooks.slice(4, 8);

    return (
        <Book
            leftContent={
                <LeftHomeContent
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    books={leftBooks}
                />
            }
            rightContent={<RightHomeContent books={rightBooks} />}
        />
    );
}


