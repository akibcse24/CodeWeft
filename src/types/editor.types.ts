export type BlockType =
  | 'text'
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'toggleHeading1'
  | 'toggleHeading2'
  | 'toggleHeading3'
  | 'code'
  | 'quote'
  | 'todo'
  | 'bulletList'
  | 'numberedList'
  | 'bulleted-list'
  | 'numbered-list'
  | 'callout'
  | 'toggle'
  | 'columns2'
  | 'columns3'
  | 'columns-2'
  | 'columns-3'
  | 'equation'
  | 'math'
  | 'diagram'
  | 'table'
  | 'database-view'
  | 'bookmark'
  | 'file'
  | 'image'
  | 'link'
  | 'divider'
  | 'synced_container'
  | 'synced-container'
  | 'page'
  | 'ai-summarize'
  | 'ai-continue'
  | 'ai-improve'
  | 'toc'
  | 'embed'
  | 'button'
  | 'breadcrumb';

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  avatar?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  language?: string;
  metadata?: Record<string, unknown>;
  calloutType?: "info" | "warning" | "tip" | "error";
  imageUrl?: string;
  linkUrl?: string;
  linkTitle?: string;
  isOpen?: boolean;
  children?: Block[];
  textColor?: string;
  backgroundColor?: string;
  columns?: Block[][];
  comments?: Comment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SlashCommand {
  id: string;
  label: string;
  description?: string;
  icon: string;
  keywords: string[];
  category: 'basic' | 'text' | 'list' | 'media' | 'advanced' | 'layout' | 'database';
  action: (blockId: string) => void;
  shortcut?: string;
}

export interface KeyboardShortcut {
  key: string;
  modifiers: ('ctrl' | 'alt' | 'shift' | 'meta')[];
  description: string;
  action: () => void;
}

export interface BlockEditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  focusedBlockId: string | null;
  history: Block[][];
  historyIndex: number;
}

export interface CodeLanguage {
  id: string;
  name: string;
  aliases?: string[];
  popular?: boolean;
}

export const SUPPORTED_LANGUAGES: CodeLanguage[] = [
  { id: 'javascript', name: 'JavaScript', aliases: ['js'], popular: true },
  { id: 'typescript', name: 'TypeScript', aliases: ['ts'], popular: true },
  { id: 'python', name: 'Python', aliases: ['py'], popular: true },
  { id: 'java', name: 'Java', popular: true },
  { id: 'cpp', name: 'C++', aliases: ['c++', 'cxx'], popular: true },
  { id: 'csharp', name: 'C#', aliases: ['cs'], popular: true },
  { id: 'go', name: 'Go', aliases: ['golang'], popular: true },
  { id: 'rust', name: 'Rust', aliases: ['rs'], popular: true },
  { id: 'php', name: 'PHP', popular: true },
  { id: 'ruby', name: 'Ruby', aliases: ['rb'] },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin', aliases: ['kt'] },
  { id: 'html', name: 'HTML', popular: true },
  { id: 'css', name: 'CSS', popular: true },
  { id: 'scss', name: 'SCSS', aliases: ['sass'] },
  { id: 'json', name: 'JSON', popular: true },
  { id: 'yaml', name: 'YAML', aliases: ['yml'] },
  { id: 'markdown', name: 'Markdown', aliases: ['md'] },
  { id: 'sql', name: 'SQL', popular: true },
  { id: 'bash', name: 'Bash', aliases: ['shell', 'sh'] },
  { id: 'powershell', name: 'PowerShell', aliases: ['ps1'] },
  { id: 'jsx', name: 'JSX' },
  { id: 'tsx', name: 'TSX' },
  { id: 'graphql', name: 'GraphQL', aliases: ['gql'] },
  { id: 'xml', name: 'XML' },
  { id: 'docker', name: 'Docker', aliases: ['dockerfile'] },
  { id: 'nginx', name: 'Nginx' },
  { id: 'c', name: 'C' },
  { id: 'r', name: 'R' },
  { id: 'scala', name: 'Scala' },
  { id: 'haskell', name: 'Haskell', aliases: ['hs'] },
  { id: 'lua', name: 'Lua' },
  { id: 'perl', name: 'Perl', aliases: ['pl'] },
  { id: 'julia', name: 'Julia', aliases: ['jl'] },
  { id: 'dart', name: 'Dart' },
  { id: 'elixir', name: 'Elixir', aliases: ['ex'] },
  { id: 'erlang', name: 'Erlang', aliases: ['erl'] },
  { id: 'clojure', name: 'Clojure', aliases: ['clj'] },
  { id: 'groovy', name: 'Groovy' },
  { id: 'matlab', name: 'MATLAB', aliases: ['m'] },
  { id: 'objectivec', name: 'Objective-C', aliases: ['objc'] },
  { id: 'vb', name: 'Visual Basic', aliases: ['vbnet'] },
  { id: 'assembly', name: 'Assembly', aliases: ['asm'] },
  { id: 'glsl', name: 'GLSL' },
  { id: 'hlsl', name: 'HLSL' },
  { id: 'solidity', name: 'Solidity', aliases: ['sol'] },
  { id: 'racket', name: 'Racket' },
  { id: 'scheme', name: 'Scheme' },
  { id: 'ocaml', name: 'OCaml', aliases: ['ml'] },
  { id: 'fsharp', name: 'F#', aliases: ['fs'] },
  { id: 'fortran', name: 'Fortran' },
  { id: 'idris', name: 'Idris' },
  { id: 'hcl', name: 'HCL', aliases: ['terraform'] },
];
