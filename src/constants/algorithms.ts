export const ALGORITHMS = {
    BUBBLE: "Bubble Sort",
    QUICK: "Quick Sort",
    MERGE: "Merge Sort",
    SELECTION: "Selection Sort",
    INSERTION: "Insertion Sort",
} as const;

export const COMPLEXITY = {
    [ALGORITHMS.BUBBLE]: { time: "O(n²)", space: "O(1)", note: "Quadratic Complexity" },
    [ALGORITHMS.QUICK]: { time: "O(n log n)", space: "O(log n)", note: "Divide & Conquer" },
    [ALGORITHMS.MERGE]: { time: "O(n log n)", space: "O(n)", note: "Divide & Conquer" },
    [ALGORITHMS.SELECTION]: { time: "O(n²)", space: "O(1)", note: "Quadratic Complexity" },
    [ALGORITHMS.INSERTION]: { time: "O(n²)", space: "O(1)", note: "Quadratic Complexity" },
} as const;

export const DEFAULT_SIZE = 50;
export const DEFAULT_SPEED = 50;
