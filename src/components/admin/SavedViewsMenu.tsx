import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Bookmark, Star, Trash2, Plus } from "lucide-react";
import type { SavedView } from "@/hooks/useSavedViews";

interface Props {
  views: SavedView[];
  /** Current URL search-params string (without leading "?"). */
  currentParams: string;
  onApply: (params: string) => void;
  onSave: (name: string, params: string) => void;
  onRemove: (id: string) => void;
}

export function SavedViewsMenu({ views, currentParams, onApply, onSave, onRemove }: Props) {
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");

  const builtins = views.filter((v) => v.builtin);
  const userViews = views.filter((v) => !v.builtin);
  const canSave = currentParams.length > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Bookmark className="h-3.5 w-3.5" />
            Vues
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-xs">Vues sauvegardées</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {builtins.length > 0 && (
            <>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold py-1">
                Pré-définies
              </DropdownMenuLabel>
              {builtins.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onClick={() => onApply(v.params)}
                  className="text-sm gap-2"
                >
                  <Star className="h-3.5 w-3.5 text-amber-500" />
                  {v.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {userViews.length > 0 ? (
            <>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold py-1">
                Mes vues
              </DropdownMenuLabel>
              {userViews.map((v) => (
                <div key={v.id} className="flex items-center group">
                  <DropdownMenuItem
                    onClick={() => onApply(v.params)}
                    className="text-sm flex-1"
                  >
                    {v.name}
                  </DropdownMenuItem>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onRemove(v.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
                    title="Supprimer cette vue"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              Aucune vue personnalisée
            </div>
          )}

          <DropdownMenuItem
            onClick={() => {
              setName("");
              setSaveOpen(true);
            }}
            disabled={!canSave}
            className="text-sm gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Sauvegarder la vue actuelle
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sauvegarder cette vue</DialogTitle>
            <DialogDescription>
              Donnez un nom à cette combinaison de filtres pour y revenir d'un clic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              autoFocus
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Customer leads actifs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onSave(name.trim(), currentParams);
                  setSaveOpen(false);
                }
              }}
            />
            <p className="text-xs text-muted-foreground font-mono break-all">
              ?{currentParams || "(aucun filtre)"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                onSave(name.trim(), currentParams);
                setSaveOpen(false);
              }}
              disabled={!name.trim()}
            >
              Sauvegarder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
