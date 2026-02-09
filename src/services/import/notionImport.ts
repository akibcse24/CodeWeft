import JSZip from "jszip";
import { Block } from "@/types/editor.types";

export interface ImportProgress {
  total: number;
  completed: number;
  currentFile: string;
  errors: string[];
}

export class NotionImportService {
  private progress: ImportProgress = {
    total: 0,
    completed: 0,
    currentFile: "",
    errors: [],
  };

  async importZip(
    file: File,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<void> {
    try {
      this.progress = {
        total: 0,
        completed: 0,
        currentFile: "",
        errors: [],
      };

      const zip = await JSZip.loadAsync(file);
      const markdownFiles: { filename: string; content: string }[] = [];

      const processEntry = async (
        path: string,
        entry: JSZip.JSZipObject
      ): Promise<void> => {
        if (entry.dir) return;

        if (path.endsWith(".md") || path.endsWith(".markdown")) {
          const content = await entry.async("string");
          markdownFiles.push({ filename: path, content });
        }
      };

      const promises: Promise<void>[] = [];
      zip.forEach((path, entry) => {
        promises.push(processEntry(path, entry));
      });

      await Promise.all(promises);

      this.progress.total = markdownFiles.length;

      for (const { filename, content } of markdownFiles) {
        this.progress.currentFile = filename;

        try {
          await this.importMarkdown(filename, content);
          this.progress.completed++;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          this.progress.errors.push(`Failed to import ${filename}: ${errorMsg}`);
        }

        if (onProgress) {
          onProgress({ ...this.progress });
        }
      }

      if (this.progress.errors.length > 0) {
        console.warn("Import completed with errors:", this.progress.errors);
      }
    } catch (error) {
      console.error("Error importing ZIP file:", error);
      throw new Error(
        `Failed to import Notion export: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private async importMarkdown(
    filename: string,
    content: string
  ): Promise<void> {
    try {
      const sanitizedContent = this.sanitizeContent(content);
      const blocks = this.parseMarkdownToBlocks(sanitizedContent);

      console.log(`Imported ${filename}:`, blocks);
    } catch (error) {
      console.error(`Error importing ${filename}:`, error);
      throw error;
    }
  }

  private parseMarkdownToBlocks(content: string): Block[] {
    const blocks: Block[] = [];
    const lines = content.split("\n");
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (trimmedLine === "") {
        i++;
        continue;
      }

      if (trimmedLine.startsWith("```")) {
        const language = trimmedLine.slice(3).trim();
        const codeLines: string[] = [];
        i++;

        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }

        blocks.push({
          id: this.generateBlockId(),
          type: "code",
          content: codeLines.join("\n"),
          language: language || "text",
        });

        i++;
        continue;
      }

      if (trimmedLine === "---" || trimmedLine === "***") {
        blocks.push({
          id: this.generateBlockId(),
          type: "divider",
          content: "",
        });
        i++;
        continue;
      }

      if (trimmedLine.startsWith("> ")) {
        const quoteLines: string[] = [];

        while (
          i < lines.length &&
          (lines[i].trim().startsWith("> ") || lines[i].trim() === ">")
        ) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
          i++;
        }

        blocks.push({
          id: this.generateBlockId(),
          type: "quote",
          content: quoteLines.join("\n"),
        });
        continue;
      }

      if (trimmedLine.startsWith("# ")) {
        blocks.push({
          id: this.generateBlockId(),
          type: "heading1",
          content: trimmedLine.slice(2).trim(),
        });
        i++;
        continue;
      }

      if (trimmedLine.startsWith("## ")) {
        blocks.push({
          id: this.generateBlockId(),
          type: "heading2",
          content: trimmedLine.slice(3).trim(),
        });
        i++;
        continue;
      }

      if (trimmedLine.startsWith("### ")) {
        blocks.push({
          id: this.generateBlockId(),
          type: "heading3",
          content: trimmedLine.slice(4).trim(),
        });
        i++;
        continue;
      }

      if (trimmedLine.match(/^-\s*\[([ xX])\]\s/)) {
        const todoLines: string[] = [];

        while (
          i < lines.length &&
          lines[i].trim().match(/^-\s*\[([ xX])\]\s/)
        ) {
          todoLines.push(lines[i]);
          i++;
        }

        for (const todoLine of todoLines) {
          const match = todoLine.trim().match(/^-\s*\[([ xX])\]\s(.+)$/);
          if (match) {
            blocks.push({
              id: this.generateBlockId(),
              type: "todo",
              content: match[2],
              checked: match[1].toLowerCase() === "x",
            });
          }
        }
        continue;
      }

      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        const listItems: string[] = [];

        while (
          i < lines.length &&
          (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))
        ) {
          listItems.push(lines[i].trim().slice(2));
          i++;
        }

        for (const item of listItems) {
          blocks.push({
            id: this.generateBlockId(),
            type: "bulletList",
            content: item,
          });
        }
        continue;
      }

      if (trimmedLine.match(/^\d+\.\s/)) {
        const listItems: string[] = [];

        while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
          listItems.push(lines[i].trim().replace(/^\d+\.\s/, ""));
          i++;
        }

        for (const item of listItems) {
          blocks.push({
            id: this.generateBlockId(),
            type: "numberedList",
            content: item,
          });
        }
        continue;
      }

      const paragraphLines: string[] = [];

      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].trim().startsWith("#") &&
        !lines[i].trim().startsWith("-") &&
        !lines[i].trim().startsWith("*") &&
        !lines[i].trim().match(/^\d+\.\s/) &&
        !lines[i].trim().startsWith(">") &&
        !lines[i].trim().startsWith("```") &&
        lines[i].trim() !== "---" &&
        lines[i].trim() !== "***"
      ) {
        paragraphLines.push(lines[i]);
        i++;
      }

      if (paragraphLines.length > 0) {
        blocks.push({
          id: this.generateBlockId(),
          type: "paragraph",
          content: paragraphLines.join(" ").trim(),
        });
      }
    }

    return blocks;
  }

  private sanitizeContent(content: string): string {
    return content
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/&(?![a-zA-Z0-9#]+;)/g, "&amp;")
      .trim();
  }

  private generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const notionImportService = new NotionImportService();
