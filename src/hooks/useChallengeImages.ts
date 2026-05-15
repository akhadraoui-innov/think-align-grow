import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const MAX_SIZE = 10 * 1024 * 1024;

export function useChallengeImages(sessionId: string | undefined) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<{ url: string; path: string } | null> => {
    if (!sessionId) return null;
    if (!ALLOWED.has(file.type)) { toast.error("Format non supporté (png/jpg/webp/gif/svg)"); return null; }
    if (file.size > MAX_SIZE) { toast.error("Image trop lourde (max 10 Mo)"); return null; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${sessionId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("challenge-images").upload(path, file, {
        cacheControl: "3600", upsert: false, contentType: file.type,
      });
      if (error) { toast.error("Upload impossible"); console.error(error); return null; }
      const { data } = supabase.storage.from("challenge-images").getPublicUrl(path);
      return { url: data.publicUrl, path };
    } finally { setUploading(false); }
  }, [sessionId]);

  const generate = useCallback(async (prompt: string): Promise<{ url: string; alt: string } | null> => {
    if (!sessionId) return null;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("challenge-image", {
        body: { session_id: sessionId, prompt },
      });
      if (error || !data?.url) { toast.error("Génération impossible"); return null; }
      return { url: data.url, alt: data.alt || prompt };
    } finally { setGenerating(false); }
  }, [sessionId]);

  return { uploadFile, generate, uploading, generating };
}
