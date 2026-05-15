# Fix : focus perdu après 1 caractère sur le briefing

## Cause

Dans `src/components/challenge/enriched/briefing/BriefingForm.tsx`, le sous-composant `Field` est déclaré **à l'intérieur** de la fonction `BriefingForm`. À chaque frappe :

1. `setScope` (ou autre) déclenche un re-render
2. `Field` est recréé → nouvelle référence de fonction
3. React considère que c'est un composant différent → unmount/remount complet
4. L'`<Input>`/`<Textarea>` à l'intérieur perd le focus

Le session replay confirme : les IDs DOM des inputs changent à chaque caractère.

## Correctif

Sortir `Field` du corps de `BriefingForm` pour qu'il soit une référence stable.

```tsx
// Hors du composant
const Field = ({ icon: Icon, label, children }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
    <div className="px-4 py-2.5 bg-muted/20 border-b border-border/30 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-bold text-sm">{label}</h3>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

export function BriefingForm(...) { /* ... sans la déclaration locale de Field ... */ }
```

Aucun autre changement nécessaire. Les états locaux, le `useEffect` de sync et `handleSave` restent identiques.

## Fichier modifié

- `src/components/challenge/enriched/briefing/BriefingForm.tsx`

## Validation

Après correctif : taper plusieurs caractères d'affilée dans Périmètre, Objectifs, Hypothèses, Contraintes, Parties prenantes — le focus reste, le texte se construit normalement.
