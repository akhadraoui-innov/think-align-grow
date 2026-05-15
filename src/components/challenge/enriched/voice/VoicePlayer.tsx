import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mic, Loader2 } from "lucide-react";

interface Props {
  storagePath: string;
  durationMs?: number | null;
}

export function VoicePlayer({ storagePath, durationMs }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.storage.from("challenge-media").createSignedUrl(storagePath, 3600);
      if (mounted) setUrl(data?.signedUrl ?? null);
    })();
    return () => { mounted = false; };
  }, [storagePath]);

  return (
    <div className="rounded-md bg-muted/40 px-3 py-2 flex items-center gap-2">
      <Mic className="h-3.5 w-3.5 text-primary shrink-0" />
      {url ? (
        <audio src={url} controls className="h-7 flex-1" />
      ) : (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      )}
      {durationMs ? <span className="text-[10px] text-muted-foreground">{Math.round(durationMs / 1000)}s</span> : null}
    </div>
  );
}
