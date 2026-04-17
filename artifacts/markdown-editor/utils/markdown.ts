export interface MarkdownToken {
  type:
    | "h1"
    | "h2"
    | "h3"
    | "paragraph"
    | "bullet"
    | "checkbox"
    | "code_block"
    | "blockquote"
    | "blank";
  content: string;
  checked?: boolean;
  language?: string;
}

export function parseMarkdown(text: string): MarkdownToken[] {
  const lines = text.split("\n");
  const tokens: MarkdownToken[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        tokens.push({
          type: "code_block",
          content: codeLines.join("\n"),
          language: codeLang,
        });
        codeLines = [];
        codeLang = "";
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      tokens.push({ type: "h1", content: line.slice(2) });
    } else if (line.startsWith("## ")) {
      tokens.push({ type: "h2", content: line.slice(3) });
    } else if (line.startsWith("### ")) {
      tokens.push({ type: "h3", content: line.slice(4) });
    } else if (line.match(/^- \[(x| )\] /i)) {
      const checked = line[3].toLowerCase() === "x";
      tokens.push({
        type: "checkbox",
        content: line.slice(6),
        checked,
      });
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      tokens.push({ type: "bullet", content: line.slice(2) });
    } else if (line.startsWith("> ")) {
      tokens.push({ type: "blockquote", content: line.slice(2) });
    } else if (line.trim() === "") {
      tokens.push({ type: "blank", content: "" });
    } else {
      tokens.push({ type: "paragraph", content: line });
    }
  }

  if (inCodeBlock && codeLines.length > 0) {
    tokens.push({
      type: "code_block",
      content: codeLines.join("\n"),
      language: codeLang,
    });
  }

  return tokens;
}

export function applyInlineMarkdown(text: string): {
  text: string;
  bold: boolean[];
  italic: boolean[];
  code: boolean[];
} {
  return { text, bold: [], italic: [], code: [] };
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function extractTitle(content: string): string {
  const firstLine = content.split("\n")[0] || "";
  return firstLine.replace(/^#{1,3}\s*/, "").trim() || "Untitled";
}

export function insertAtCursor(
  text: string,
  cursorPos: number,
  insertion: string
): { text: string; newCursorPos: number } {
  const before = text.slice(0, cursorPos);
  const after = text.slice(cursorPos);
  const newText = before + insertion + after;
  return { text: newText, newCursorPos: cursorPos + insertion.length };
}

export function wrapSelection(
  text: string,
  start: number,
  end: number,
  wrapper: string
): { text: string; newStart: number; newEnd: number } {
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);
  const newText = before + wrapper + selected + wrapper + after;
  return {
    text: newText,
    newStart: start + wrapper.length,
    newEnd: end + wrapper.length,
  };
}
