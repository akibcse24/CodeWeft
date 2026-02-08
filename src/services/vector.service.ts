import { get, set } from "idb-keyval";

export interface VectorDocument {
    id: string;
    content: string;
    embedding: number[];
    metadata: Record<string, unknown>;
}

const VECTOR_STORE_KEY = "vector_store";

export const storeVector = async (doc: VectorDocument) => {
    const store: VectorDocument[] = (await get(VECTOR_STORE_KEY)) || [];
    const existingIndex = store.findIndex(d => d.id === doc.id);

    if (existingIndex >= 0) {
        store[existingIndex] = doc;
    } else {
        store.push(doc);
    }

    await set(VECTOR_STORE_KEY, store);
}

export const searchVectors = async (queryEmbedding: number[], limit = 5, minScore = 0.7) => {
    const store: VectorDocument[] = (await get(VECTOR_STORE_KEY)) || [];
    if (store.length === 0) return [];

    const scored = store.map(doc => ({
        doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding)
    }));

    return scored
        .filter(item => item.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.doc);
}

function cosineSimilarity(a: number[], b: number[]) {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
