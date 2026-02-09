export const VIEWER_THEMES = [
    { id: 'white', bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-300', label: '가' },
    { id: 'cream', bg: 'bg-[#F5EFE0]', text: 'text-[#5C4B37]', border: 'border-[#D4C9B5]', label: '가' },
    { id: 'green', bg: 'bg-[#1B3A2D]', text: 'text-[#D4E4D1]', border: 'border-[#3A6B4F]', label: '가' },
    { id: 'dark', bg: 'bg-[#1A1A1A]', text: 'text-[#C8C8C8]', border: 'border-[#555]', label: '가' },
] as const;

export const VIEWER_FONTS = [
    { id: 'gamja', label: '감자체' },
    { id: 'sungchan', label: '숭찬체' },
    { id: 'dukggulim', label: '덕꿀임' },
] as const;

export const VIEWER_DEFAULTS = {
    theme: 'white',
    font: 'gamja',
    fontSize: 4,
    lineHeight: 2,
    padding: 1,
} as const;

export const VIEWER_LIMITS = {
    fontSize: { min: 1, max: 10 },
    lineHeight: { min: 1, max: 5 },
    padding: { min: 1, max: 5 },
} as const;
