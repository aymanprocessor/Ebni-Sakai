export interface ScaleItem {
    number: number;
    title: string;
    slug?: string;
    videoUrl?: string;
}

export const SCALES_LIST: ScaleItem[] = [
    { number: 1, title: 'مقياس صعوبات الانتباه', slug: 'attention-difficulties' },
    { number: 2, title: 'مقياس صعوبه الذاكره', slug: 'memory-difficulty' },
    { number: 3, title: 'مقياس الادراك الاستماعي', slug: 'auditory-perception' },
    { number: 4, title: 'مقياس صعوبات القراءه', slug: 'reading-difficulty' },
    { number: 5, title: 'مقياس صعوبه الكتابه', slug: 'writing-difficulty' },
    { number: 6, title: 'مقياس صعوبه الحساب', slug: 'math-difficulty' },
    { number: 7, title: 'مقياس لصعوبات السلوك الانفعالي والاجتماعي', slug: 'behavioral-emotional-social' }
];

export default SCALES_LIST;
