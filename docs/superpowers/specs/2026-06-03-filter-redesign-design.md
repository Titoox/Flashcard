# Design — Refonte filtres + simplification modes

Date : 2026-06-03

## Contexte

Application de flashcards pour préparer le permis de conduire (Clio 5).
216 cartes réparties en 5 catégories. Utilisée exclusivement sur iPhone 17 (Safari, touch).

## Ce qu'on supprime

- Modes Écriture, Chrono, Cœurs → code + boutons supprimés
- Barre de modes entière
- Raccourcis clavier

## Nouveau système de filtres

### Deux variables d'état au lieu d'une

Avant : `filter` = une seule chaîne ('all', 'k', 'voiture'...)
Après :
- `filterCat` : 'all' | 'voiture' | 've' | 'qser' | 'sec' | 'pf'
- `filterScore` : null | 'k' | 'u' | 'n'

### Interface

Une rangée de boutons catégorie :
`Toutes` · `Voiture` · `VE` · `Sécurité` · `Secours` · `Points faibles`

Quand une catégorie (pas Toutes) est sélectionnée, 3 sous-boutons apparaissent :
`Sues` · `Incertants` · `À revoir`

### Règles du deck (buildDeck)

| filterCat | filterScore | Deck affiché |
|-----------|-------------|--------------|
| 'all'     | null        | Cartes sans score, toutes catégories |
| 'voiture' | null        | Cartes sans score, catégorie voiture |
| 'voiture' | 'k'         | Cartes scorées 'k', catégorie voiture |
| 'voiture' | 'u'         | Cartes scorées 'u', catégorie voiture |
| 'voiture' | 'n'         | Cartes scorées 'n', catégorie voiture |
| (idem VE, qser, sec, pf) | | |

"Sans score" = `scores[c.id]` est undefined/absent.

### Message quand deck vide

- filterCat='all' : "Toutes les cartes sont triées ! Choisis une catégorie pour retravailler."
- filterCat=X, filterScore=null : "Bravo, toutes les cartes [Nom] sont triées ! Choisis Sues, Incertants ou À revoir pour retravailler."
- filterCat=X, filterScore=Y : "Aucune carte [score] dans cette catégorie."

## Comportement des cartes

Marquer une carte (Je sais / Incertain / À revoir) → elle quitte immédiatement le deck en cours, on passe à la carte suivante.

Une carte scorée n'apparaît JAMAIS dans Toutes ni dans les filtres catégorie sans score.
Elle n'est accessible que via le sous-bouton score correspondant.

Re-scorer : possible depuis n'importe quel filtre score. La carte change de compartiment immédiatement.

## Ce qu'on garde

- Mode flip uniquement : tap sur la carte pour retourner, boutons Je sais / Incertain / À revoir
- Boutons navigation Précédente / Suivante
- Barre de stats : total, sues, incertants, à revoir, barre de progression
- Gamification : série (streak), record, objectif du jour (20 cartes)
- Export / Import JSON
- Bouton Son

## Stockage localStorage

- `permis_v4` : scores (inchangé)
- `permis_filter_v4` remplacé par `permis_filter_cat_v1` et `permis_filter_score_v1`
- `permis_game_v1` : inchangé (best, chronoBest retiré, goal, day, done, sound, streak)
