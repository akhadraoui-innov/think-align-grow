import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { CanvasComment } from "@/hooks/useCanvasComments";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface DiscussionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  comments: CanvasComment[];
  loading: boolean;
  onAddComment: (content: string) => void;
  onDeleteComment: (id: string) => void;
  currentUserId: string | undefined;
  profiles: Record<string, { display_name: string; avatar_url: string | null }>;
  selectedItemTitle?: string;
}

export function DiscussionPanel({
  isOpen,
  onClose,
  comments,
  loading,
  onAddComment,
  onDeleteComment,
  currentUserId,
  profiles,
  selectedItemTitle,
}: DiscussionPanelProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    onAddComment(message);
    setMessage("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute top-0 right-0 bottom-0 w-80 bg-card border-l border-border z-40 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                Discussion
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Item info */}
          {selectedItemTitle && (
            <div className="px-4 py-2 bg-secondary/50 border-b border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Sur :
              </span>
              <p className="text-sm font-bold truncate">{selectedItemTitle}</p>
            </div>
          )}

          {/* Comments */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Aucun commentaire
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Soyez le premier à commenter
                  </p>
                </div>
              ) : (
                comments.map(comment => {
                  const profile = profiles[comment.user_id];
                  const isOwn = comment.user_id === currentUserId;

                  return (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "group relative",
                        isOwn && "text-right"
                      )}
                    >
                      <div className={cn(
                        "inline-block max-w-[90%] rounded-2xl px-3 py-2",
                        isOwn 
                          ? "bg-primary text-primary-foreground rounded-br-md" 
                          : "bg-secondary rounded-bl-md"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-2 mt-1",
                        isOwn && "flex-row-reverse"
                      )}>
                        <span className="text-[10px] text-muted-foreground">
                          {profile?.display_name || "Utilisateur"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(comment.created_at), { 
                            addSuffix: true,
                            locale: fr 
                          })}
                        </span>
                        {isOwn && (
                          <button
                            onClick={() => onDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre commentaire..."
                className="flex-1 rounded-xl"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!message.trim()}
                className="rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
