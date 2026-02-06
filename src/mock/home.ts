export interface BookData {
    id: number;
    title: string;
    author: string;
    image?: string;
}

export const BOOKS: BookData[] = [
    { id: 1, title: '괴테는 모든 것을 말했다', author: '스즈키 유이' },
    { id: 2, title: '나의 완벽한 장례식', author: '조현선' },
    { id: 3, title: '모순', author: '양귀자' },
    { id: 4, title: '자몽 살구 클럽', author: '한로드' },
    { id: 5, title: '요리를 한다는 것', author: '최강록' },
    { id: 6, title: '다크 심리학', author: '다크 사이드 프로젝트' },
    { id: 7, title: '당근 인턴 합격하는법', author: '류승찬' },
    { id: 8, title: '수족관', author: '유레적' },
];
