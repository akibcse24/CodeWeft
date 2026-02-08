export interface FileNode {
    path: string;
    name: string;
    type: 'file' | 'dir';
    children?: FileNode[];
    size?: number;
}

/**
 * Convert flat GitHub tree structure to nested file tree
 */
export function buildFileTree(files: Array<{ path: string; type: 'blob' | 'tree' | string }>): FileNode[] {
    const root: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();

    // Sort files by path to ensure parents come before children
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

    for (const file of sortedFiles) {
        const parts = file.path.split('/');
        const name = parts[parts.length - 1];

        const node: FileNode = {
            path: file.path,
            name,
            type: file.type === 'tree' ? 'dir' : 'file',
            children: file.type === 'tree' ? [] : undefined,
        };

        pathMap.set(file.path, node);

        if (parts.length === 1) {
            // Root level
            root.push(node);
        } else {
            // Nested - find parent
            const parentPath = parts.slice(0, -1).join('/');
            const parent = pathMap.get(parentPath);

            if (parent && parent.type === 'dir') {
                parent.children = parent.children || [];
                parent.children.push(node);
            } else {
                // Parent doesn't exist yet, create placeholder directories
                let currentPath = '';
                for (let i = 0; i < parts.length - 1; i++) {
                    const part = parts[i];
                    const newPath = currentPath ? `${currentPath}/${part}` : part;

                    if (!pathMap.has(newPath)) {
                        const dirNode: FileNode = {
                            path: newPath,
                            name: part,
                            type: 'dir',
                            children: [],
                        };

                        pathMap.set(newPath, dirNode);

                        if (i === 0) {
                            root.push(dirNode);
                        } else {
                            const parentDir = pathMap.get(currentPath);
                            if (parentDir && parentDir.children) {
                                parentDir.children.push(dirNode);
                            }
                        }
                    }

                    currentPath = newPath;
                }

                // Now add the file to its parent
                const finalParent = pathMap.get(parts.slice(0, -1).join('/'));
                if (finalParent && finalParent.children) {
                    finalParent.children.push(node);
                }
            }
        }
    }

    return root;
}
