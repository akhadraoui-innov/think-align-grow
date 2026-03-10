

## Diagnostic : Pourquoi les fleches sont invisibles

**Cause racine identifiee** : Le conteneur SVG des fleches utilise `width: "100%"` et `height: "100%"`, mais son parent (`div.absolute.origin-top-left`) n'a **aucune dimension explicite**. Resultat : le SVG fait 0x0 pixels. La propriete CSS `overflow: visible` n'est pas fiable sur les elements SVG dans tous les navigateurs.

Les fleches existent bien en base de donnees (5 fleches trouvees). Le probleme est purement un probleme de rendu SVG.

## Correction

**Fichier** : `src/components/workshop/WorkshopCanvas.tsx` (ligne 362)

Remplacer le SVG actuel :
```html
<svg className="absolute pointer-events-none" 
     style={{ left: 0, top: 0, width: "100%", height: "100%", overflow: "visible" }}>
```

Par un SVG qui utilise les **attributs SVG natifs** au lieu de CSS, avec des dimensions geantes pour couvrir tout le canvas :
```html
<svg 
  className="absolute pointer-events-none"
  style={{ left: "-5000px", top: "-5000px" }}
  width="10000"
  height="10000"
  overflow="visible"
>
```

Et ajuster les coordonnees des fleches en ajoutant +5000 a chaque point (fromX, fromY, toX, toY) pour compenser l'offset.

**Alternative plus simple et robuste** : ne pas deplacer le SVG, garder `left: 0, top: 0` et utiliser les attributs SVG `width="1" height="1" overflow="visible"` (attributs HTML/SVG, pas des proprietes CSS) :

```html
<svg 
  className="absolute pointer-events-none"
  style={{ left: 0, top: 0 }}
  width="1" 
  height="1" 
  overflow="visible"
>
```

La difference cle : `overflow="visible"` en tant qu'**attribut SVG** (pas `style={{ overflow: "visible" }}` qui est du CSS). L'attribut SVG `overflow` est garanti de fonctionner sur tous les navigateurs pour les elements SVG.

Les coordonnees des fleches sont en espace canvas (ex: x=300, y=400), elles seront dessinees a ces positions exactes par rapport au coin (0,0) du SVG, qui est aligne avec le coin du conteneur de transformation — donc parfaitement aligne avec les items du canvas.

### Fichiers modifies

| Fichier | Modification |
|---|---|
| `WorkshopCanvas.tsx` | SVG : attribut `overflow="visible"` + `width="1" height="1"` au lieu de CSS |

