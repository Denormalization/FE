export const VIEWER_THEMES = [
    { id: 'white', bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-300', label: '가' },
    { id: 'cream', bg: 'bg-[#F5EFE0]', text: 'text-[#5C4B37]', border: 'border-[#D4C9B5]', label: '가' },
    { id: 'green', bg: 'bg-[#1B3A2D]', text: 'text-[#D4E4D1]', border: 'border-[#3A6B4F]', label: '가' },
    { id: 'dark', bg: 'bg-[#1A1A1A]', text: 'text-[#C8C8C8]', border: 'border-[#555]', label: '가' },
] as const;

export const VIEWER_FONTS = [
    { id: 'pretendard', label: '기본체' },
    { id: 'bookmyungjo', label: '북명조' },
    { id: 'thejamsil', label: '더잠실' },
] as const;

export const VIEWER_DEFAULTS = {
    theme: 'white',
    font: 'pretendard',
    fontSize: 4,
    lineHeight: 2,
    padding: 1,
} as const;

export const VIEWER_LIMITS = {
    fontSize: { min: 1, max: 10 },
    lineHeight: { min: 1, max: 5 },
    padding: { min: 1, max: 5 },
} as const;
