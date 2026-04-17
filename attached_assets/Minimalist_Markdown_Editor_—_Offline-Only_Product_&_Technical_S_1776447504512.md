# Minimalist Markdown Editor — Offline-Only Product & Technical Specification

## 0. Product Vision
Build a fast, minimal, and user-friendly Markdown editor for iOS and Android, designed exclusively for offline use. The application will focus on providing a sleek, distraction-free environment for viewing and editing Markdown files directly from local storage, embodying the principle of "Notes app speed + developer tool power" without the complexities of cloud integration or advanced AI features.

## 1. Core Product Principles

### 1.1 Zero-Friction Experience
*   **Launch Time**: The application must launch in under 500ms.
*   **Direct Access**: Opens directly into the last edited file or a quick new note, eliminating splash screens or onboarding blockers.
*   **Local-First**: All operations are performed locally on the device, ensuring privacy and speed without reliance on network connectivity.

### 1.2 Markdown-First, Not Markdown-Only
*   **Formatted Text**: Users will primarily see formatted text, with Markdown syntax becoming invisible or subtle when not in focus.
*   **Intuitive Editing**: Seamless mode switching between editing and preview, with a focus on a clean, uncluttered interface.

## 2. Feature Architecture

### 2.1 Hybrid Markdown Editor (Core)
*   **WYSIWYG-Lite Rendering Engine**: Provides real-time parsing and rendering of Markdown syntax into styled text (e.g., `# Heading` to large text, `**bold**` to bold text, `- [ ]` to interactive checkboxes).
*   **Markdown Syntax Visibility**: Syntax fades when the cursor leaves a line and reappears upon focus, promoting a distraction-free writing experience.
*   **Cursor Intelligence**: Smart continuation for lists and checkboxes, and intelligent indentation for code blocks.
*   **Keyboard Toolbar (Sticky)**: A minimalist toolbar positioned above the mobile keyboard, offering quick access to essential Markdown formatting actions.

| Action | Function |
| :----- | :------- |
| H1 / H2 / H3 | Insert headers |
| B / I | Bold / Italic |
| [ ] | Checkbox |
| ``` | Code block |

### 2.2 File Management System (Open Ecosystem)
*   **Native File Access**: Utilizes platform APIs (iOS: UIDocumentPicker, Android: Storage Access Framework) to access files directly from local storage.
*   **Supported Formats**: Opens `.md`, `.txt`, and `.markdown` files.
*   **File Structure**: Maintains the original file structure, preventing vendor lock-in.
*   **Auto-Save System**: Saves changes with every keystroke (debounced) and when the app backgrounds, ensuring data integrity.

## 3. UI / UX Design System

### 3.1 Visual Style
*   **Minimalist**: Clean lines and uncluttered layouts.
*   **Neutral Color Palette**: Primarily dark grays, blacks, and white text, with subtle accents for interactive elements.
*   **Dark Mode Default**: Optimized for comfortable viewing in low-light conditions.

### 3.2 Typography
*   **Monospace**: Used for code blocks and Markdown syntax.
*   **Clean Sans-serif**: Employed for general text and UI elements.

### 3.3 Layout
*   **Editor Screen**: Features a top bar displaying the file name and save indicator, a main editor area, and a bottom keyboard toolbar.

## 4. Performance Targets

| Metric | Target |
| :----- | :----- |
| App launch | < 500ms |
| Typing latency | < 16ms |
| File open | < 300ms |

## 5. Technical Architecture

### 5.1 Cross-Platform Stack
*   **Option A (Preferred)**: Flutter (High performance, single codebase, good text rendering control).
*   **Option B**: React Native + native modules.

### 5.2 Core Modules
*   **Editor Engine**: Custom Markdown parser with incremental rendering for efficient performance.
*   **Storage Layer**: File-based system, avoiding database lock-in and ensuring direct local file access.

## 5. Monetization Strategy

### 5.1 Free Tier
*   **Full Markdown Editing**: Provides all core editing and file management functionalities.
*   **Local File Access**: Unlimited access to local files.
*   **Ads Enabled**: Monetization through non-intrusive advertisements.

### 5.2 Ads Implementation
*   **Banner Ads**: A minimal banner ad placed at the bottom of the screen, always visible but designed to be unobtrusive.
*   **Native Ads**: Subtly integrated into the file list, styled to resemble document entries but clearly marked as "Sponsored" or "Ad".
*   **Interstitial Ads**: Triggered only after specific, non-disruptive actions such as after exporting a file or after saving/closing a file. **NEVER** during active typing or editing.

### 5.3 Premium Tier (Future)
*   **Ad-Free Experience**: Removal of all advertisements.
*   **Advanced Export**: Enhanced options for exporting files (e.g., custom PDF styling).

## 7. Security & Privacy
*   **Local Files**: All files remain local to the device unless explicitly moved or shared by the user through native OS functions.
*   **No Data Collection**: The application will not collect any background data or user information.

## 8. MVP Scope (Build Order)

### Phase 1 (Core)
*   Editor (WYSIWYG-lite)
*   File open/save
*   Keyboard Toolbar
*   Auto-save
*   Basic Markdown rendering (headings, bold, italic, lists, checkboxes, code blocks)

## 9. Positioning
*   **Target Users**: Developers, students, and writers who prioritize speed, simplicity, and local-only functionality for Markdown editing on mobile devices.

## References

[1] Original Specification Document: `spec_final.docx` (Provided by user)
