import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  sessionId: string;
  label?: string;
}

export function ExportPdfButton({ sessionId, label = "Exporter PDF" }: Props) {
  const [loading, setLoading] = useState(false);

  const onExport = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/challenge-export-pdf`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `challenge-${sessionId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
      toast.success("PDF exporté");
    } catch (e: any) {
      toast.error("Export PDF échoué", { description: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onExport}
      disabled={loading}
      className="h-7 px-2 rounded-md border border-border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
      title="Exporter la session en PDF"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
      {label}
    </button>
  );
}
