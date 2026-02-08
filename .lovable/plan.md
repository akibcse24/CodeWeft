
# Restructure Notes to Match Notion Pro Experience

## Analysis of Reference Images

The uploaded images show Notion's editor with several key UI/UX patterns that differ from the current implementation:

### Image 1: Page Header Layout
- Full-width cover image spanning edge-to-edge
- "Change cover" and "Reposition" buttons in top-right corner of cover
- "Add icon" and "Add comment" buttons appearing below cover
- Large title with "New page" placeholder in light gray
- "New page" sub-page block indicator
- Placeholder: "Press 'space' for AI or '/' for commands"

### Image 2: Block Context Menu (Left Panel)
- Search bar at top: "Search actions..."
- Current block type label ("Text")
- "Turn into" submenu with nested previews
- "Color" submenu
- Actions: Copy link to block, Duplicate, Move to, Delete
- "Suggest edits", "Ask AI" with shortcuts
- Footer: "Last edited by Mr John, Today at 1:53 PM"
- Turn Into menu shows: Headings, Page, Bulleted/Numbered/To-do/Toggle list, Code, Quote, Callout, Block equation, Synced block, Toggle headings, 2-5 columns

### Image 3: Code Block
- Plus (+) and drag handle (dots) on left of block
- Dark background code area
- Language selector ("JavaScript") in top-right inside the block
- Copy and menu buttons in top-right
- Clean, minimal design

### Image 4 & 6: Slash Command Media Section
- Categorized sections: "Media" heading
- Items: Image, Video, Audio, Code, File, Web bookmark
- "Database" section below
- "Close menu" with ESC shortcut at bottom
- Search input "/Type to search"

### Image 5: Inline Comments
- Text highlighted in yellow
- "Add a comment..." input on the right side
- Attachment, @mention, and send icons

---

## Changes Required

### 1. Cover Image Component Enhancement
**File**: `src/components/notes/CoverImage.tsx`

Changes:
- Make cover truly full-width (edge-to-edge, no margins)
- Add "Reposition" button alongside "Change cover"
- Keep buttons in top-right corner, visible on hover
- Add gradient overlay for better text readability
- Smooth height transition

### 2. Page Header Restructure
**File**: `src/components/notes/PageHeader.tsx`

Changes:
- Move "Add icon" and "Add comment" to appear BELOW the cover
- Update placeholder to "Press 'space' for AI or '/' for commands"
- Larger, bolder title styling
- Icon offset from cover (like Notion's overlapping icon)

### 3. Block Editor - Add Block Handles
**File**: `src/components/editor/BlockEditor.tsx`

Changes:
- Add hover handles on the LEFT of each block:
  - Plus (+) button to add block above/below
  - Drag handle (6 dots / grip vertical)
- Handles appear on hover, positioned left of content
- Smooth fade-in animation

### 4. Enhanced Slash Command Menu
**File**: `src/components/editor/SlashCommandMenu.tsx`

Changes:
- Add "Media" section with: Image, Video, Audio, Code, File, Web bookmark
- Add "Database" section
- Add "Close menu" footer with ESC hint
- Update search placeholder to "Type to search"
- Add section headers with proper styling
- Support for more block types

### 5. Block Context Menu Update
**File**: `src/components/editor/BlockContextMenu.tsx`

Changes:
- Add "Move to" option with page picker
- Add "Suggest edits" option (for future)
- Add "Ask AI" option with Ctrl+J shortcut
- Add footer showing "Last edited by [name], [time]"
- Better organized submenus with 4/5 column layouts for columns

### 6. Code Block Redesign
**File**: `src/components/editor/blocks/CodeBlock.tsx`

Changes:
- Dark background with rounded corners
- Move language selector to top-right INSIDE the code block
- Add copy button and menu (3-dot) button
- Clean, minimal toolbar design
- Match Notion's code block styling exactly

### 7. Inline Comment System
**New File**: `src/components/editor/InlineCommentInput.tsx`

Create:
- Comment input that appears to the right of selected text
- "Add a comment..." placeholder
- Attachment, @mention, and send icons
- Yellow highlight on commented text

### 8. Block Placeholder Text
**File**: `src/components/editor/BlockEditor.tsx` (block content areas)

Changes:
- Empty paragraph: "Press 'space' for AI or '/' for commands"
- Block-type specific placeholders with fade animation

---

## Detailed Implementation

### Phase 1: Layout & Cover

| File | Change |
|------|--------|
| `CoverImage.tsx` | Full-width, reposition button, edge-to-edge layout |
| `PageHeader.tsx` | Meta actions below cover, improved placeholder text |
| `Notes.tsx` | Adjust wrapper padding for full-width cover |

### Phase 2: Block Handles & Context Menu

| File | Change |
|------|--------|
| `BlockEditor.tsx` | Add hover handles (+, grip) on left of blocks |
| `BlockContextMenu.tsx` | Add Move to, Ask AI, footer with edit info |

### Phase 3: Slash Menu & Code Block

| File | Change |
|------|--------|
| `SlashCommandMenu.tsx` | Add Media/Database sections, Close menu footer |
| `CodeBlock.tsx` | Redesign with dark bg, inline language selector |

### Phase 4: Comments

| File | Change |
|------|--------|
| `InlineCommentInput.tsx` | New component for inline comment UI |
| `InlineToolbar.tsx` | Integrate comment trigger |

---

## Visual Changes Summary

```text
BEFORE                              AFTER
------                              -----
[Cover with margins]                [Edge-to-edge cover]
                                    [Change cover | Reposition]

[Icon]                              [Overlapping Icon with shadow]
# Title                             [Add icon] [Add comment]
                                    # New page (large, bold)

Press / to continue...              Press 'space' for AI or '/' for commands

[Block content only]                [+][⋮⋮] Block content

Slash menu with basic               Slash menu with:
categories                          - Media section (Image, Video, Audio...)
                                    - Database section
                                    - Close menu (esc) footer
```

---

## Files to Create
- `src/components/editor/InlineCommentInput.tsx` - Comment input UI
- `src/components/editor/BlockHandles.tsx` - Reusable block handle component

## Files to Modify
- `src/components/notes/CoverImage.tsx` - Full-width + reposition
- `src/components/notes/PageHeader.tsx` - Meta actions positioning
- `src/components/editor/BlockEditor.tsx` - Add handles, placeholders
- `src/components/editor/SlashCommandMenu.tsx` - Media section, close footer
- `src/components/editor/BlockContextMenu.tsx` - Move to, Ask AI, footer
- `src/components/editor/blocks/CodeBlock.tsx` - Dark theme redesign
- `src/pages/Notes.tsx` - Layout adjustments for full-width cover

---

## Technical Notes

1. **Block Handles**: Use absolute positioning relative to block container, with CSS transition for opacity on hover

2. **Cover Reposition**: Add draggable cover positioning using CSS `object-position` and store offset in metadata

3. **Inline Comments**: Store comments in block.comments array (already in types), use Popover for input

4. **Slash Menu Categories**: Group commands by category with section headers and icons

5. **Code Block**: Use dark theme CodeMirror with custom styling to match Notion's aesthetic
