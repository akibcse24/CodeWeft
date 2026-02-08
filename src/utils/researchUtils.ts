/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ExtractedMetadata {
    title: string;
    authors: string[];
    publication_year: number | null;
    url: string | null;
    abstract: string | null;
    venue?: string;
}

export async function fetchArXivMetadata(id: string): Promise<ExtractedMetadata> {
    const response = await fetch(`https://export.arxiv.org/api/query?id_list=${id}`);
    const text = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");

    const entry = xml.querySelector("entry");
    if (!entry) throw new Error("ArXiv metadata not found");

    const title = entry.querySelector("title")?.textContent?.replace(/\n/g, " ").trim() || "Unknown Title";
    const authors = Array.from(entry.querySelectorAll("author name")).map(a => a.textContent || "");
    const publishedDate = entry.querySelector("published")?.textContent;
    const year = publishedDate ? new Date(publishedDate).getFullYear() : null;
    const abstract = entry.querySelector("summary")?.textContent?.replace(/\n/g, " ").trim() || null;
    const url = `https://arxiv.org/pdf/${id}.pdf`;

    return { title, authors, publication_year: year, url, abstract };
}

export async function fetchCrossrefMetadata(doi: string): Promise<ExtractedMetadata> {
    // DOI might be a URL or just the ID
    const cleanDoi = doi.replace("https://doi.org/", "").trim();
    const response = await fetch(`https://api.crossref.org/works/${cleanDoi}`);
    if (!response.ok) throw new Error("DOI metadata not found");

    const data = await response.json();
    const item = data.message;

    const title = item.title?.[0] || "Unknown Title";
    const authors = item.author?.map((a: any) => `${a.given} ${a.family}`) || [];
    const year = item.created?.["date-parts"]?.[0]?.[0] || null;
    const abstract = item.abstract ? item.abstract.replace(/<[^>]*>?/gm, '') : null; // Basic HTML tag removal
    const url = item.URL || `https://doi.org/${cleanDoi}`;
    const venue = item["container-title"]?.[0];

    return { title, authors, publication_year: year, url, abstract, venue };
}

export function identifyInputType(input: string): "arxiv" | "doi" | "unknown" {
    if (input.includes("/") && (input.includes("10.") || input.startsWith("10."))) return "doi";
    if (input.match(/^\d{4}\.\d{4,5}$/) || input.match(/^[a-z-]+\/\d{7}$/)) return "arxiv";
    return "unknown";
}
