import { useEffect, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { marked } from "marked";
import TurndownService from "turndown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Minus, Table as TableIcon,
} from "lucide-react";

/* ── Turndown: HTML → Markdown ── */
const turndown = new TurndownService({ headingStyle: "atx", hr: "---" });
turndown.addRule("tableCell", {
  filter: ["th", "td"],
  replacement: (content) => ` ${content.trim()} |`,
});
turndown.addRule("tableRow", {
  filter: "tr",
  replacement: (content) => `|${content}\n`,
});
turndown.addRule("table", {
  filter: "table",
  replacement: (_content, node) => {
    const el = node as HTMLTableElement;
    const rows = Array.from(el.querySelectorAll("tr"));
    if (rows.length === 0) return "";
    const headerCells = rows[0].querySelectorAll("th, td");
    const header = "| " + Array.from(headerCells).map(c => c.textContent?.trim() || "").join(" | ") + " |";
    const sep = "| " + Array.from(headerCells).map(() => "---").join(" | ") + " |";
    const body = rows.slice(1).map(row => {
      const cells = row.querySelectorAll("td, th");
      return "| " + Array.from(cells).map(c => c.textContent?.trim() || "").join(" | ") + " |";
    }).join("\n");
    return "\n\n" + header + "\n" + sep + "\n" + body + "\n\n";
  },
});

interface QuoteEditorProps {
  value: string;
  onChange: (md: string) => void;
}

export function QuoteEditor({ value, onChange }: QuoteEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialHtml = useRef(marked.parse(value) as string);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: initialHtml.current,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg max-w-none dark:prose-invert " +
          "prose-headings:font-display prose-headings:tracking-tight " +
          "prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/50 " +
          "prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2 " +
          "prose-p:leading-[1.85] prose-p:text-foreground/80 " +
          "prose-table:text-sm prose-th:bg-muted/50 prose-th:px-4 prose-th:py-2.5 prose-th:text-left prose-th:font-semibold " +
          "prose-td:px-4 prose-td:py-2.5 prose-td:border-t " +
          "min-h-[60vh] p-8 md:p-12 lg:p-16 outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      const md = turndown.turndown(html);
      onChangeRef.current(md);
    },
  });

  // Sync if value changes externally (e.g. regeneration)
  const lastExternalValue = useRef(value);
  useEffect(() => {
    if (value !== lastExternalValue.current && editor) {
      lastExternalValue.current = value;
      const html = marked.parse(value) as string;
      editor.commands.setContent(html);
    }
  }, [value, editor]);

  const ToolBtn = useCallback(
    ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) => (
      <Button
        type="button"
        variant={active ? "default" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onClick}
        title={title}
      >
        {children}
      </Button>
    ),
    [],
  );

  if (!editor) return null;

  return (
    <div className="border-0 rounded-xl overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="sticky top-[57px] z-20 flex items-center gap-1 px-4 py-2 bg-muted/60 backdrop-blur border-b border-border flex-wrap">
        <ToolBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Titre H2">
          <Heading2 className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Titre H3">
          <Heading3 className="h-4 w-4" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Gras">
          <Bold className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique">
          <Italic className="h-4 w-4" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insérer tableau">
          <TableIcon className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <Minus className="h-4 w-4" />
        </ToolBtn>
      </div>

      {/* ── Editor ── */}
      <EditorContent editor={editor} />
    </div>
  );
}
