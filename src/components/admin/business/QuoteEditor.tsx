import { useEffect, useRef, useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { marked } from "marked";
import TurndownService from "turndown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Minus,
  Table as TableIcon, Plus, RowsIcon, Columns3, Trash2,
} from "lucide-react";
import { QUOTE_WIDGETS } from "./quoteWidgets";

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
  prospectName?: string;
  docRef?: string;
  createdAt?: string;
  version?: number;
}

export function QuoteEditor({ value, onChange, prospectName, docRef, createdAt, version }: QuoteEditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialHtml = useRef(marked.parse(value) as string);
  const [widgetOpen, setWidgetOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: "Tapez / pour insérer un bloc…",
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
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
          "prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg prose-blockquote:py-3 prose-blockquote:px-5 " +
          "min-h-[60vh] p-8 md:p-12 lg:p-16 outline-none focus:outline-none",
      },
      handleKeyDown: (_view, event) => {
        if (event.key === "/" && editor) {
          const { $from } = editor.state.selection;
          const textBefore = $from.parent.textContent;
          if (textBefore.length === 0) {
            setTimeout(() => setWidgetOpen(true), 50);
          }
        }
        return false;
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

  const insertWidget = useCallback((html: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(html).run();
    setWidgetOpen(false);
  }, [editor]);

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

  const isInTable = editor.isActive("table");

  return (
    <div className="border-0 rounded-xl overflow-hidden">
      {/* ── Toolbar ── */}
      <div className="sticky top-[57px] z-20 flex items-center gap-1 px-4 py-2 bg-muted/60 backdrop-blur border-b border-border flex-wrap">
        {/* Text */}
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

        {/* Structure */}
        <ToolBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
          <List className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
          <ListOrdered className="h-4 w-4" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Séparateur">
          <Minus className="h-4 w-4" />
        </ToolBtn>
        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Table controls */}
        <ToolBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insérer tableau">
          <TableIcon className="h-4 w-4" />
        </ToolBtn>
        {isInTable && (
          <>
            <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Ajouter ligne">
              <RowsIcon className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Ajouter colonne">
              <Columns3 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Supprimer tableau">
              <Trash2 className="h-4 w-4 text-destructive" />
            </ToolBtn>
          </>
        )}
        <Separator orientation="vertical" className="h-5 mx-1" />

        {/* Widget insertion */}
        <Popover open={widgetOpen} onOpenChange={setWidgetOpen}>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              Insérer un bloc
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-2" sideOffset={8}>
            <p className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Blocs disponibles</p>
            <div className="space-y-0.5">
              {QUOTE_WIDGETS.map(w => {
                const Icon = w.icon;
                return (
                  <button
                    key={w.id}
                    className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-accent transition-colors"
                    onClick={() => insertWidget(w.html)}
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-xs">{w.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{w.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Editor ── */}
      <EditorContent editor={editor} />

      {/* ── Bubble menu for table context ── */}
      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 150, placement: "top" }}
          shouldShow={({ editor: e }) => e.isActive("table")}
        >
          <div className="flex items-center gap-1 rounded-lg bg-background border border-border shadow-lg px-2 py-1.5">
            <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={() => editor.chain().focus().addRowAfter().run()}>
              <RowsIcon className="h-3 w-3" />Ligne
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={() => editor.chain().focus().addColumnAfter().run()}>
              <Columns3 className="h-3 w-3" />Colonne
            </Button>
            <Separator orientation="vertical" className="h-4" />
            <Button type="button" size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-destructive hover:text-destructive" onClick={() => editor.chain().focus().deleteTable().run()}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </BubbleMenu>
      )}
    </div>
  );
}
