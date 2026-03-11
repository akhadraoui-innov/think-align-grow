import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Coins, CreditCard, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  balance: { balance: number; lifetime_earned: number };
  transactions: Array<{ id: string; amount: number; type: string; description: string | null; created_at: string }>;
  onAdjust: (amount: number, description: string) => Promise<void>;
}

export function UserCreditsTab({ balance, transactions, onAdjust }: Props) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdjust = async () => {
    const n = parseInt(amount);
    if (isNaN(n) || n === 0 || !desc.trim()) return;
    setSaving(true);
    await onAdjust(n, desc.trim());
    setSaving(false);
    setAmount("");
    setDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/50 bg-card p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Solde actuel</p>
            <p className="text-3xl font-bold text-foreground">{balance.balance}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Coins className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total gagné (lifetime)</p>
            <p className="text-3xl font-bold text-foreground">{balance.lifetime_earned}</p>
          </div>
        </div>
      </div>

      {/* Adjust */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Ajuster les crédits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Montant (+/-)</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="50 ou -10" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Raison</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Bonus, correction…" />
          </div>
          <Button onClick={handleAdjust} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Appliquer
          </Button>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Historique des transactions</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">Aucune transaction</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-3">
                <div className="flex items-center gap-3">
                  {tx.amount > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm text-foreground">{tx.description || tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">{format(new Date(tx.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}</p>
                  </div>
                </div>
                <span className={`text-sm font-mono font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
