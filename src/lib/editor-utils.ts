export const textColors = [
    { value: "default", label: "Default", class: "" },
    { value: "gray", label: "Gray", class: "text-gray-500" },
    { value: "brown", label: "Brown", class: "text-amber-700" },
    { value: "orange", label: "Orange", class: "text-orange-500" },
    { value: "yellow", label: "Yellow", class: "text-yellow-500" },
    { value: "green", label: "Green", class: "text-green-500" },
    { value: "blue", label: "Blue", class: "text-blue-500" },
    { value: "purple", label: "Purple", class: "text-purple-500" },
    { value: "pink", label: "Pink", class: "text-pink-500" },
    { value: "red", label: "Red", class: "text-red-500" },
];

export const backgroundColors = [
    { value: "default", label: "Default", class: "" },
    { value: "gray", label: "Gray background", class: "bg-gray-100 dark:bg-gray-800" },
    { value: "brown", label: "Brown background", class: "bg-amber-100 dark:bg-amber-900/30" },
    { value: "orange", label: "Orange background", class: "bg-orange-100 dark:bg-orange-900/30" },
    { value: "yellow", label: "Yellow background", class: "bg-yellow-100 dark:bg-yellow-900/30" },
    { value: "green", label: "Green background", class: "bg-green-100 dark:bg-green-900/30" },
    { value: "blue", label: "Blue background", class: "bg-blue-100 dark:bg-blue-900/30" },
    { value: "purple", label: "Purple background", class: "bg-purple-100 dark:bg-purple-900/30" },
    { value: "pink", label: "Pink background", class: "bg-pink-100 dark:bg-pink-900/30" },
    { value: "red", label: "Red background", class: "bg-red-100 dark:bg-red-900/30" },
];

export const getTextColorClass = (color?: string): string => {
    if (!color) return "";
    const found = textColors.find(c => c.value === color);
    return found?.class || "";
};

export const getBackgroundColorClass = (color?: string): string => {
    if (!color) return "";
    const found = backgroundColors.find(c => c.value === color);
    return found?.class || "";
};

// Language detection from file extension
export function getLanguageFromFilename(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const languageMap: Record<string, string> = {
        // Web
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        html: 'html',
        css: 'css',
        scss: 'scss',
        less: 'less',
        json: 'json',

        // Backend
        py: 'python',
        java: 'java',
        go: 'go',
        rs: 'rust',
        php: 'php',
        rb: 'ruby',

        // Shell
        sh: 'shell',
        bash: 'shell',
        zsh: 'shell',

        // Config
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'toml',
        xml: 'xml',

        // Docs
        md: 'markdown',
        txt: 'plaintext',

        // Database
        sql: 'sql',

        // Others
        c: 'c',
        cpp: 'cpp',
        cs: 'csharp',
        swift: 'swift',
        kt: 'kotlin',
        dart: 'dart',
    };

    return languageMap[ext || ''] || 'plaintext';
}

