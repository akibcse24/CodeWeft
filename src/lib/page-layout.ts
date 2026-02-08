export type PageWidth = 'full' | 'default' | 'narrow';

// Utility function to get CSS class for page width
export function getPageWidthClass(width: PageWidth): string {
    switch (width) {
        case 'full':
            return 'max-w-none';
        case 'narrow':
            return 'max-w-3xl mx-auto';
        case 'default':
        default:
            return 'max-w-5xl mx-auto';
    }
}
