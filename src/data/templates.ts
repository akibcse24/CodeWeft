import { Block } from '@/components/editor/BlockEditor';

export interface Template {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'productivity' | 'development' | 'learning' | 'personal';
    blocks: Block[];
}

export const BLOCK_TEMPLATES: Template[] = [
    {
        id: 'meeting-notes',
        name: 'Meeting Notes',
        description: 'Structured template for meeting documentation',
        icon: '📝',
        category: 'productivity',
        blocks: [
            { id: '1', type: 'heading1', content: 'Meeting Notes' },
            { id: '2', type: 'paragraph', content: `Date: ${new Date().toLocaleDateString()}` },
            { id: '3', type: 'heading2', content: 'Attendees' },
            { id: '4', type: 'bulletList', content: '' },
            { id: '5', type: 'heading2', content: 'Agenda' },
            { id: '6', type: 'numberedList', content: '' },
            { id: '7', type: 'heading2', content: 'Discussion Points' },
            { id: '8', type: 'paragraph', content: '' },
            { id: '9', type: 'heading2', content: 'Action Items' },
            { id: '10', type: 'todo', content: '', checked: false },
            { id: '11', type: 'heading2', content: 'Next Steps' },
            { id: '12', type: 'bulletList', content: '' },
        ],
    },

    {
        id: 'bug-report',
        name: 'Bug Report',
        description: 'Template for documenting software bugs',
        icon: '🐛',
        category: 'development',
        blocks: [
            { id: '1', type: 'heading1', content: 'Bug Report' },
            { id: '2', type: 'callout', content: 'Brief description of the bug', calloutType: 'error' },
            { id: '3', type: 'heading2', content: '📋 Environment' },
            { id: '4', type: 'bulletList', content: 'Browser: ' },
            { id: '5', type: 'bulletList', content: 'OS: ' },
            { id: '6', type: 'bulletList', content: 'Version: ' },
            { id: '7', type: 'heading2', content: '🔄 Steps to Reproduce' },
            { id: '8', type: 'numberedList', content: '' },
            { id: '9', type: 'heading2', content: '✅ Expected Behavior' },
            { id: '10', type: 'paragraph', content: '' },
            { id: '11', type: 'heading2', content: '❌ Actual Behavior' },
            { id: '12', type: 'paragraph', content: '' },
            { id: '13', type: 'heading2', content: '📸 Screenshots' },
            { id: '14', type: 'paragraph', content: 'Attach screenshots if applicable' },
            { id: '15', type: 'heading2', content: '💡 Possible Solution' },
            { id: '16', type: 'paragraph', content: '' },
        ],
    },

    {
        id: 'daily-journal',
        name: 'Daily Journal',
        description: 'Daily reflection and planning template',
        icon: '📖',
        category: 'personal',
        blocks: [
            { id: '1', type: 'heading1', content: `Journal - ${new Date().toLocaleDateString()}` },
            { id: '2', type: 'heading2', content: '🌅 Morning Reflection' },
            { id: '3', type: 'quote', content: 'How am I feeling today?' },
            { id: '4', type: 'paragraph', content: '' },
            { id: '5', type: 'heading2', content: '🎯 Today\'s Goals' },
            { id: '6', type: 'todo', content: '', checked: false },
            { id: '7', type: 'todo', content: '', checked: false },
            { id: '8', type: 'todo', content: '', checked: false },
            { id: '9', type: 'heading2', content: '📝 Notes & Highlights' },
            { id: '10', type: 'paragraph', content: '' },
            { id: '11', type: 'heading2', content: '🙏 Gratitude' },
            { id: '12', type: 'bulletList', content: '' },
            { id: '13', type: 'heading2', content: '🌙 Evening Reflection' },
            { id: '14', type: 'paragraph', content: 'What went well? What could be improved?' },
        ],
    },

    {
        id: 'project-proposal',
        name: 'Project Proposal',
        description: 'Comprehensive project planning template',
        icon: '🚀',
        category: 'productivity',
        blocks: [
            { id: '1', type: 'heading1', content: 'Project Proposal' },
            { id: '2', type: 'heading2', content: '📌 Executive Summary' },
            { id: '3', type: 'paragraph', content: 'Brief overview of the project' },
            { id: '4', type: 'heading2', content: '🎯 Objectives' },
            { id: '5', type: 'bulletList', content: '' },
            { id: '6', type: 'heading2', content: '❓ Problem Statement' },
            { id: '7', type: 'paragraph', content: 'What problem does this solve?' },
            { id: '8', type: 'heading2', content: '💡 Proposed Solution' },
            { id: '9', type: 'paragraph', content: '' },
            { id: '10', type: 'heading2', content: '👥 Team & Stakeholders' },
            { id: '11', type: 'bulletList', content: '' },
            { id: '12', type: 'heading2', content: '📅 Timeline' },
            { id: '13', type: 'numberedList', content: '' },
            { id: '14', type: 'heading2', content: '💰 Budget' },
            { id: '15', type: 'paragraph', content: '' },
            { id: '16', type: 'heading2', content: '📊 Success Metrics' },
            { id: '17', type: 'bulletList', content: '' },
            { id: '18', type: 'heading2', content: '⚠️ Risks' },
            { id: '19', type: 'bulletList', content: '' },
        ],
    },

    {
        id: 'code-documentation',
        name: 'Code Documentation',
        description: 'Template for documenting code and APIs',
        icon: '💻',
        category: 'development',
        blocks: [
            { id: '1', type: 'heading1', content: 'Code Documentation' },
            { id: '2', type: 'heading2', content: '📝 Overview' },
            { id: '3', type: 'paragraph', content: 'Brief description of this module/component' },
            { id: '4', type: 'heading2', content: '🎯 Purpose' },
            { id: '5', type: 'paragraph', content: 'What does this code do?' },
            { id: '6', type: 'heading2', content: '📥 Installation' },
            { id: '7', type: 'code', content: 'npm install package-name', language: 'bash' },
            { id: '8', type: 'heading2', content: '🔧 Usage' },
            { id: '9', type: 'code', content: '// Example usage', language: 'javascript' },
            { id: '10', type: 'heading2', content: '⚙️ Parameters' },
            { id: '11', type: 'bulletList', content: 'param1 (type): description' },
            { id: '12', type: 'heading2', content: '↩️ Return Value' },
            { id: '13', type: 'paragraph', content: '' },
            { id: '14', type: 'heading2', content: '💡 Examples' },
            { id: '15', type: 'code', content: '', language: 'javascript' },
            { id: '16', type: 'heading2', content: '⚠️ Notes' },
            { id: '17', type: 'callout', content: 'Important considerations', calloutType: 'warning' },
        ],
    },

    {
        id: 'research-notes',
        name: 'Research Notes',
        description: 'Structured research documentation',
        icon: '🔬',
        category: 'learning',
        blocks: [
            { id: '1', type: 'heading1', content: 'Research Notes' },
            { id: '2', type: 'paragraph', content: `Topic: ` },
            { id: '3', type: 'paragraph', content: `Date: ${new Date().toLocaleDateString()}` },
            { id: '4', type: 'heading2', content: '❓ Research Question' },
            { id: '5', type: 'quote', content: 'What are you trying to learn or discover?' },
            { id: '6', type: 'heading2', content: '📚 Sources' },
            { id: '7', type: 'bulletList', content: '' },
            { id: '8', type: 'heading2', content: '🔑 Key Findings' },
            { id: '9', type: 'bulletList', content: '' },
            { id: '10', type: 'heading2', content: '📊 Data & Evidence' },
            { id: '11', type: 'paragraph', content: '' },
            { id: '12', type: 'heading2', content: '💭 Analysis' },
            { id: '13', type: 'paragraph', content: '' },
            { id: '14', type: 'heading2', content: '🎯 Conclusions' },
            { id: '15', type: 'paragraph', content: '' },
            { id: '16', type: 'heading2', content: '🔜 Next Steps' },
            { id: '17', type: 'todo', content: '', checked: false },
        ],
    },

    {
        id: 'retrospective',
        name: 'Sprint Retrospective',
        description: 'Team retrospective template',
        icon: '🔄',
        category: 'productivity',
        blocks: [
            { id: '1', type: 'heading1', content: 'Sprint Retrospective' },
            { id: '2', type: 'paragraph', content: `Sprint: ` },
            { id: '3', type: 'paragraph', content: `Date: ${new Date().toLocaleDateString()}` },
            { id: '4', type: 'heading2', content: '✅ What Went Well' },
            { id: '5', type: 'bulletList', content: '' },
            { id: '6', type: 'heading2', content: '⚠️ What Could Be Improved' },
            { id: '7', type: 'bulletList', content: '' },
            { id: '8', type: 'heading2', content: '💡 Action Items' },
            { id: '9', type: 'todo', content: '', checked: false },
            { id: '10', type: 'heading2', content: '📈 Metrics' },
            { id: '11', type: 'bulletList', content: 'Velocity: ' },
            { id: '12', type: 'bulletList', content: 'Completed Stories: ' },
            { id: '13', type: 'bulletList', content: 'Bugs Fixed: ' },
            { id: '14', type: 'heading2', content: '🎯 Goals for Next Sprint' },
            { id: '15', type: 'numberedList', content: '' },
        ],
    },

    {
        id: 'learning-notes',
        name: 'Learning Notes',
        description: 'Cornell-style learning template',
        icon: '📚',
        category: 'learning',
        blocks: [
            { id: '1', type: 'heading1', content: 'Learning Notes' },
            { id: '2', type: 'paragraph', content: `Topic: ` },
            { id: '3', type: 'paragraph', content: `Source: ` },
            { id: '4', type: 'heading2', content: '🎯 Learning Objectives' },
            { id: '5', type: 'bulletList', content: '' },
            { id: '6', type: 'heading2', content: '📝 Main Content' },
            { id: '7', type: 'paragraph', content: '' },
            { id: '8', type: 'heading2', content: '🔑 Key Concepts' },
            { id: '9', type: 'bulletList', content: '' },
            { id: '10', type: 'heading2', content: '💡 Examples' },
            { id: '11', type: 'code', content: '', language: 'javascript' },
            { id: '12', type: 'heading2', content: '❓ Questions' },
            { id: '13', type: 'bulletList', content: '' },
            { id: '14', type: 'heading2', content: '📌 Summary' },
            { id: '15', type: 'quote', content: 'Summarize the main takeaways' },
            { id: '16', type: 'heading2', content: '🔗 Related Topics' },
            { id: '17', type: 'bulletList', content: '' },
        ],
    },
];

/**
 * Get template by ID
 */
export function getTemplate(id: string): Template | undefined {
    return BLOCK_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: Template['category']): Template[] {
    return BLOCK_TEMPLATES.filter(t => t.category === category);
}

/**
 * Generate unique IDs for template blocks
 */
export function instantiateTemplate(template: Template): Block[] {
    return template.blocks.map(block => ({
        ...block,
        id: Math.random().toString(36).substring(2, 9),
    }));
}
