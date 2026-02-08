import { Block } from '@/components/editor/BlockEditor';

/**
 * Export blocks to Markdown format
 */
export function exportToMarkdown(blocks: Block[], pageTitle: string = 'Untitled'): string {
    const markdown: string[] = [];

    markdown.push(`# ${pageTitle}\n`);

    blocks.forEach((block) => {
        const content = blockToMarkdown(block);
        if (content) {
            markdown.push(content);
        }
    });

    return markdown.join('\n');
}

/**
 * Convert single block to markdown
 */
function blockToMarkdown(block: Block, indent: number = 0): string {
    const indentation = '  '.repeat(indent);

    switch (block.type) {
        case 'paragraph':
            return block.content ? `${block.content}\n` : '';

        case 'heading1':
            return `# ${block.content}\n`;

        case 'heading2':
            return `## ${block.content}\n`;

        case 'heading3':
            return `### ${block.content}\n`;

        case 'toggleHeading1':
        case 'toggleHeading2':
        case 'toggleHeading3': {
            const level = block.type === 'toggleHeading1' ? 1 : block.type === 'toggleHeading2' ? 2 : 3;
            const prefix = '#'.repeat(level);
            let result = `${prefix} ${block.content}\n`;
            if (block.children && block.children.length > 0) {
                block.children.forEach(child => {
                    result += blockToMarkdown(child, indent + 1);
                });
            }
            return result;
        }

        case 'bulletList':
            return `${indentation}- ${block.content}\n`;

        case 'numberedList':
            return `${indentation}1. ${block.content}\n`;

        case 'todo': {
            const checkbox = block.checked ? '[x]' : '[ ]';
            return `${indentation}- ${checkbox} ${block.content}\n`;
        }

        case 'code': {
            const language = block.language || 'javascript';
            return `\`\`\`${language}\n${block.content}\n\`\`\`\n`;
        }

        case 'quote':
            return `> ${block.content}\n`;

        case 'callout': {
            const calloutType = block.calloutType || 'info';
            const emoji = getCalloutEmoji(calloutType);
            return `> ${emoji} **${calloutType.toUpperCase()}**\n> ${block.content}\n`;
        }

        case 'divider':
            return `---\n`;

        case 'image': {
            const imageUrl = block.imageUrl || '';
            const altText = block.content || 'Image';
            return `![${altText}](${imageUrl})\n`;
        }

        case 'link': {
            const linkUrl = block.linkUrl || '';
            const linkTitle = block.linkTitle || block.content || 'Link';
            return `[${linkTitle}](${linkUrl})\n`;
        }

        case 'math':
            return `$$\n${block.content}\n$$\n`;

        case 'bookmark':
            return `🔖 [${block.linkTitle || 'Bookmark'}](${block.linkUrl || ''})\n`;

        case 'toggle': {
            let toggleResult = `<details>\n<summary>${block.content}</summary>\n\n`;
            if (block.children && block.children.length > 0) {
                block.children.forEach(child => {
                    toggleResult += blockToMarkdown(child, indent + 1);
                });
            }
            toggleResult += `\n</details>\n`;
            return toggleResult;
        }

        case 'columns2':
        case 'columns3': {
            // Markdown doesn't support columns well, use table
            const cols = block.columns || [];
            if (cols.length === 0) return '';

            let tableMarkdown = '| ';
            cols.forEach((_, i) => tableMarkdown += `Column ${i + 1} | `);
            tableMarkdown += '\n| ';
            cols.forEach(() => tableMarkdown += '--- | ');
            tableMarkdown += '\n';

            const maxRows = Math.max(...cols.map(col => col.length));
            for (let i = 0; i < maxRows; i++) {
                tableMarkdown += '| ';
                cols.forEach(col => {
                    const cellContent = col[i] ? col[i].content : '';
                    tableMarkdown += `${cellContent} | `;
                });
                tableMarkdown += '\n';
            }

            return tableMarkdown;
        }

        case 'table':
            // Simple table rendering
            return `\n*[Table block - export to see full content]*\n\n`;

        default:
            return `${block.content}\n`;
    }
}

function getCalloutEmoji(type: string): string {
    const emojis: Record<string, string> = {
        info: 'ℹ️',
        warning: '⚠️',
        tip: '💡',
        error: '❌',
        success: '✅',
        question: '❓',
    };
    return emojis[type] || 'ℹ️';
}

/**
 * Export blocks to HTML format
 */
export function exportToHTML(blocks: Block[], pageTitle: string = 'Untitled'): string {
    const html: string[] = [];

    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('  <meta charset="UTF-8">');
    html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html.push(`  <title>${pageTitle}</title>`);
    html.push('  <style>');
    html.push('    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; }');
    html.push('    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }');
    html.push('    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }');
    html.push('    blockquote { border-left: 3px solid #ddd; padding-left: 20px; color: #666; margin-left: 0; }');
    html.push('    .callout { padding: 15px; border-radius: 5px; margin: 10px 0; }');
    html.push('    .callout-info { background: #e3f2fd; border-left: 3px solid #2196f3; }');
    html.push('    .callout-warning { background: #fff3e0; border-left: 3px solid #ff9800; }');
    html.push('    .callout-error { background: #ffebee; border-left: 3px solid #f44336; }');
    html.push('    .callout-tip { background: #f1f8e9; border-left: 3px solid #8bc34a; }');
    html.push('    input[type="checkbox"] { margin-right: 8px; }');
    html.push('  </style>');
    html.push('</head>');
    html.push('<body>');
    html.push(`  <h1>${pageTitle}</h1>`);

    blocks.forEach((block) => {
        html.push(blockToHTML(block));
    });

    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
}

function blockToHTML(block: Block): string {
    switch (block.type) {
        case 'paragraph':
            return block.content ? `  <p>${escapeHTML(block.content)}</p>` : '';

        case 'heading1':
            return `  <h1>${escapeHTML(block.content)}</h1>`;

        case 'heading2':
            return `  <h2>${escapeHTML(block.content)}</h2>`;

        case 'heading3':
            return `  <h3>${escapeHTML(block.content)}</h3>`;

        case 'bulletList':
            return `  <li>${escapeHTML(block.content)}</li>`;

        case 'numberedList':
            return `  <li>${escapeHTML(block.content)}</li>`;

        case 'todo': {
            const checked = block.checked ? 'checked' : '';
            return `  <div><input type="checkbox" ${checked} disabled> ${escapeHTML(block.content)}</div>`;
        }

        case 'code':
            return `  <pre><code>${escapeHTML(block.content)}</code></pre>`;

        case 'quote':
            return `  <blockquote>${escapeHTML(block.content)}</blockquote>`;

        case 'callout': {
            const type = block.calloutType || 'info';
            return `  <div class="callout callout-${type}">${escapeHTML(block.content)}</div>`;
        }

        case 'divider':
            return `  <hr>`;

        case 'image':
            return `  <img src="${escapeHTML(block.imageUrl || '')}" alt="${escapeHTML(block.content || 'Image')}">`;

        case 'link':
            return `  <p><a href="${escapeHTML(block.linkUrl || '')}">${escapeHTML(block.linkTitle || block.content || 'Link')}</a></p>`;

        default:
            return `  <p>${escapeHTML(block.content)}</p>`;
    }
}

function escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Export blocks to JSON format
 */
export function exportToJSON(blocks: Block[], pageData?: unknown): string {
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        page: pageData || {},
        blocks,
    };

    return JSON.stringify(exportData, null, 2);
}

/**
 * Export blocks to plain text
 */
export function exportToPlainText(blocks: Block[]): string {
    return blocks.map(block => block.content).filter(Boolean).join('\n\n');
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Copy to clipboard helper
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        // Silently fail clipboard operations
        return false;
    }
}
