import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Lightbulb, ScrollText, AlertTriangle } from "lucide-react";
import type { Components } from "react-markdown";

interface EnrichedMarkdownProps {
  content: string;
}

export function EnrichedMarkdown({ content }: EnrichedMarkdownProps) {
  const components: Components = {
    blockquote: ({ children, ...props }) => {
      const text = extractText(children);

      if (text.startsWith("💡") || text.includes("À retenir")) {
        return (
          <div className="my-4 rounded-xl border-l-4 border-amber-500 bg-amber-500/5 p-4 flex gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">{children}</div>
          </div>
        );
      }

      if (text.startsWith("📜") || text.includes("Le saviez-vous")) {
        return (
          <div className="my-4 rounded-xl border-l-4 border-blue-500 bg-blue-500/5 p-4 flex gap-3">
            <ScrollText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">{children}</div>
          </div>
        );
      }

      if (text.startsWith("⚠️") || text.includes("Attention")) {
        return (
          <div className="my-4 rounded-xl border-l-4 border-red-500 bg-red-500/5 p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">{children}</div>
          </div>
        );
      }

      return <blockquote className="border-l-4 border-muted pl-4 italic text-muted-foreground my-4" {...props}>{children}</blockquote>;
    },
    table: ({ children, ...props }) => (
      <div className="my-4 overflow-x-auto rounded-xl border">
        <table className="w-full text-sm [&_th]:bg-muted/50 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_td]:px-4 [&_td]:py-2.5 [&_td]:border-t [&_tr:nth-child(even)]:bg-muted/20" {...props}>
          {children}
        </table>
      </div>
    ),
    code: ({ children, className, ...props }) => {
      const isBlock = className?.includes("language-");
      if (isBlock || String(children).includes("\n")) {
        return (
          <div className="my-4 rounded-xl overflow-hidden border bg-muted/30">
            {className && (
              <div className="px-4 py-1.5 bg-muted/50 border-b text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {className.replace("language-", "")}
              </div>
            )}
            <pre className="p-4 overflow-x-auto text-sm"><code {...props}>{children}</code></pre>
          </div>
        );
      }
      return <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>{children}</code>;
    },
    h2: ({ children, ...props }) => (
      <h2 className="text-xl font-display font-bold mt-8 mb-4 pb-2 border-b" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-lg font-display font-semibold mt-6 mb-3" {...props}>{children}</h3>
    ),
    img: ({ src, alt, ...props }) => (
      <figure className="my-6 text-center">
        <img src={src} alt={alt} className="rounded-xl mx-auto max-h-96 object-contain" {...props} />
        {alt && <figcaption className="text-xs text-muted-foreground mt-2">{alt}</figcaption>}
      </figure>
    ),
  };

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

function extractText(children: any): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children?.props?.children) return extractText(children.props.children);
  return "";
}
