import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface FileVersion {
  id: string;
  timestamp: number;
  content: string;
  summary: string;
}

export interface FileEntry {
  id: string;
  name: string;
  content: string;
  size: number;
  updatedAt: number;
  createdAt: number;
  versions: FileVersion[];
}

interface FilesContextValue {
  files: FileEntry[];
  activeFileId: string | null;
  setActiveFileId: (id: string | null) => void;
  createFile: (name?: string) => FileEntry;
  importFile: (name: string, content: string) => FileEntry;
  saveFile: (id: string, content: string) => void;
  deleteFile: (id: string) => void;
  renameFile: (id: string, name: string) => void;
  revertToVersion: (fileId: string, versionId: string) => void;
  getActiveFile: () => FileEntry | null;
}

const FilesContext = createContext<FilesContextValue | null>(null);

const STORAGE_KEY = "md_editor_files_v1";
const ACTIVE_KEY = "md_editor_active_v1";

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function formatSize(bytes: number): number {
  return Math.max(1, Math.round(bytes / 1024));
}

const SAMPLE_FILES: FileEntry[] = [
  {
    id: "sample-1",
    name: "Daily Journal.md",
    content: `# Daily Journal\n\nWrote for 30 minutes without distraction. Feeling focused and clear.\n\n## Tasks\n\n- [x] Finish first draft\n- [ ] Review ideas\n- [ ] Send weekly update\n\n## Notes\n\nSomething I read today that stuck with me:\n\n> "The secret of getting ahead is getting started."\n\n\`\`\`js\nconst save = debounce(writeFile, 180);\nsave(currentDocument);\n\`\`\`\n`,
    size: 12,
    updatedAt: Date.now() - 2 * 60 * 1000,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    versions: [],
  },
  {
    id: "sample-2",
    name: "Project Spec.md",
    content: `# Product Vision\n\nFast, local-first writing for developers and students.\n\n## Core Principles\n\n- Zero friction experience\n- Markdown-first, not markdown-only\n- Privacy by design\n\n## MVP Scope\n\n- [x] Open .md and .txt files\n- [x] WYSIWYG-lite editor\n- [ ] Export to PDF\n- [ ] Sync across devices\n\n## Tech Stack\n\n\`\`\`\nReact Native + Expo\nAsyncStorage for persistence\nCustom markdown parser\n\`\`\`\n`,
    size: 31,
    updatedAt: Date.now() - 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000,
    versions: [
      {
        id: "v1",
        timestamp: Date.now() - 2 * 60 * 60 * 1000,
        content: `# Product Vision\n\nFast writing for developers.\n\n## MVP\n\n- Open files\n- Basic editor\n`,
        summary: "Initial draft created",
      },
      {
        id: "v2",
        timestamp: Date.now() - 60 * 60 * 1000,
        content: `# Product Vision\n\nFast, local-first writing for developers and students.\n\n## Core Principles\n\n- Zero friction\n- Privacy\n`,
        summary: "Updated the title",
      },
    ],
  },
  {
    id: "sample-3",
    name: "Lecture Notes.txt",
    content: `# Lecture Summary\n\nKey takeaways from today's session:\n\n## Main Topics\n\n- Algorithms and complexity\n- Graph traversal (BFS, DFS)\n- Dynamic programming patterns\n\n## Code Examples\n\n\`\`\`python\ndef bfs(graph, start):\n    visited = set()\n    queue = [start]\n    while queue:\n        node = queue.pop(0)\n        if node not in visited:\n            visited.add(node)\n            queue.extend(graph[node])\n    return visited\n\`\`\`\n\n## Next Steps\n\n- [ ] Review chapter 7\n- [ ] Complete problem set 3\n`,
    size: 9,
    updatedAt: Date.now() - 3 * 60 * 60 * 1000,
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    versions: [],
  },
];

export function FilesProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const active = await AsyncStorage.getItem(ACTIVE_KEY);
        if (stored) {
          setFiles(JSON.parse(stored));
        } else {
          setFiles(SAMPLE_FILES);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_FILES));
        }
        if (active) setActiveFileId(active);
      } catch {
        setFiles(SAMPLE_FILES);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  const persist = useCallback(async (updated: FileEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  }, []);

  const createFile = useCallback(
    (name?: string): FileEntry => {
      const newFile: FileEntry = {
        id: generateId(),
        name: name || "Untitled.md",
        content: `# Untitled\n\n`,
        size: 1,
        updatedAt: Date.now(),
        createdAt: Date.now(),
        versions: [],
      };
      setFiles((prev) => {
        const updated = [newFile, ...prev];
        persist(updated);
        return updated;
      });
      return newFile;
    },
    [persist]
  );

  const importFile = useCallback(
    (name: string, content: string): FileEntry => {
      const newFile: FileEntry = {
        id: generateId(),
        name,
        content,
        size: formatSize(content.length),
        updatedAt: Date.now(),
        createdAt: Date.now(),
        versions: [],
      };
      setFiles((prev) => {
        const updated = [newFile, ...prev];
        persist(updated);
        return updated;
      });
      return newFile;
    },
    [persist]
  );

  const saveFile = useCallback(
    (id: string, content: string) => {
      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.id !== id) return f;
          const prevVersion: FileVersion = {
            id: generateId(),
            timestamp: f.updatedAt,
            content: f.content,
            summary: `Saved ${new Date(f.updatedAt).toLocaleTimeString()}`,
          };
          const versions = [prevVersion, ...f.versions].slice(0, 20);
          return {
            ...f,
            content,
            size: formatSize(content.length),
            updatedAt: Date.now(),
            versions,
          };
        });
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const deleteFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        const updated = prev.filter((f) => f.id !== id);
        persist(updated);
        return updated;
      });
      setActiveFileId((prev) => (prev === id ? null : prev));
    },
    [persist]
  );

  const renameFile = useCallback(
    (id: string, name: string) => {
      setFiles((prev) => {
        const updated = prev.map((f) =>
          f.id === id ? { ...f, name, updatedAt: Date.now() } : f
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const revertToVersion = useCallback(
    (fileId: string, versionId: string) => {
      setFiles((prev) => {
        const updated = prev.map((f) => {
          if (f.id !== fileId) return f;
          const version = f.versions.find((v) => v.id === versionId);
          if (!version) return f;
          return {
            ...f,
            content: version.content,
            updatedAt: Date.now(),
          };
        });
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const getActiveFile = useCallback((): FileEntry | null => {
    if (!activeFileId) return null;
    return files.find((f) => f.id === activeFileId) ?? null;
  }, [files, activeFileId]);

  const handleSetActiveFileId = useCallback(
    async (id: string | null) => {
      setActiveFileId(id);
      try {
        if (id) {
          await AsyncStorage.setItem(ACTIVE_KEY, id);
        } else {
          await AsyncStorage.removeItem(ACTIVE_KEY);
        }
      } catch {}
    },
    []
  );

  if (!loaded) return null;

  return (
    <FilesContext.Provider
      value={{
        files,
        activeFileId,
        setActiveFileId: handleSetActiveFileId,
        createFile,
        importFile,
        saveFile,
        deleteFile,
        renameFile,
        revertToVersion,
        getActiveFile,
      }}
    >
      {children}
    </FilesContext.Provider>
  );
}

export function useFiles() {
  const ctx = useContext(FilesContext);
  if (!ctx) throw new Error("useFiles must be used within FilesProvider");
  return ctx;
}
