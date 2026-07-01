# Design System BatiFlow

## Statut du document

Ce document formalise le langage visuel déjà validé dans le workflow devis
premium de BatiFlow. Il ne définit pas une nouvelle direction artistique.

Sources de référence :

- `components/DevisSendModal.tsx`
- `app/accepter-devis/[token]/AcceptanceClient.tsx`
- `lib/render-devis-email.ts`
- `components/DevisKpiCards.tsx`
- `components/DevisList.tsx`
- `app/globals.css`

## 1. Philosophie UX BatiFlow

BatiFlow doit donner une impression de maîtrise, de fiabilité et de simplicité.
L'interface accompagne un artisan dans une action importante sans lui donner la
sensation de remplir un logiciel administratif complexe.

Principes :

1. **Clarté avant densité** : une action principale évidente, des informations
   regroupées dans des cartes lisibles et peu de bruit visuel.
2. **Confiance** : fonds ardoise, surfaces blanches, bordures nettes et messages
   explicites pour les documents, paiements et décisions client.
3. **Progression visible** : statuts, badges et timelines indiquent toujours où
   se trouve le document et ce qui va se passer ensuite.
4. **Action rassurante** : les actions engageantes sont nommées précisément et
   confirmées lorsque nécessaire.
5. **Mobile d'abord** : zones tactiles d'au moins 44 px, modales en panneau bas
   sur mobile et contenu essentiel visible sans zoom.
6. **Sobriété premium** : une couleur d'accent orange, des ombres mesurées et de
   courtes animations. L'effet premium vient de la finition, pas de la
   décoration.

## 2. Couleurs officielles

La palette est issue des couleurs déjà présentes dans la modal d'envoi, l'email
et l'espace client.

| Rôle | Couleur | Valeur | Usage |
| --- | --- | --- | --- |
| Ardoise principale | Slate 950 | `#0f172a` | En-têtes premium, texte fort, boutons opérationnels |
| Texte secondaire | Slate 700 | `#334155` | Corps de texte et boutons secondaires |
| Texte discret | Slate 500 | `#64748b` | Aides, métadonnées, libellés |
| Bordure | Slate 200 | `#e2e8f0` | Cartes, champs, séparateurs |
| Fond doux | Slate 50 | `#f8fafc` | Sections secondaires, tableaux, formulaires |
| Accent BatiFlow | Orange 500 | `#f97316` | CTA commercial, repères premium, montant clé |
| Accent clair | Orange 50 | `#fff7ed` | Cartes et informations liées au devis |
| Succès | Emerald 700 | `#047857` | Acceptation et action positive engageante |
| Succès clair | Emerald 50 | `#ecfdf5` | Confirmation, pièces jointes prêtes |
| Information | Sky 600 | `#0284c7` | Progression et consultation sécurisée |
| Information claire | Sky 50 | `#f0f9ff` | Timeline et contexte public |
| Danger | Red 700 | `#b91c1c` | Refus confirmé et erreurs |
| Danger clair | Red 50 | `#fef2f2` | Alertes et confirmations négatives |
| Surface | Blanc | `#ffffff` | Cartes, modales et champs |

Règles :

- L'orange indique l'action commerciale principale ou un point de valeur. Il ne
  remplace pas les couleurs sémantiques de succès, d'information ou de danger.
- Le vert est réservé à une réussite réelle ou à l'acceptation.
- Le rouge est réservé à une erreur, un refus ou une action destructive.
- Les textes courants restent dans la gamme Slate afin de préserver le contraste
  et la sobriété.

## 3. Typographie

La police système actuelle est `Arial, Helvetica, sans-serif`.

- Titre de page ou de modal : 20 à 32 px, graisse 700 ou 800, approche serrée.
- Titre de section : 18 à 24 px, graisse 700.
- Corps : 14 à 16 px, interligne 1,5 à 1,7.
- Libellé : 12 à 14 px, graisse 600 ou 700.
- Métadonnée : 11 à 12 px, Slate 500.
- Sur-titre : 11 à 12 px, graisse 700 ou 800, capitales et approche élargie.
- Montant clé : 20 à 32 px, graisse 700 ou 800.

## 4. Espacements

L'unité de base est 4 px.

- Écart serré : 8 px.
- Écart courant : 12 à 16 px.
- Groupe de formulaire : 20 px.
- Intérieur de carte : 16 px mobile, 20 à 24 px desktop.
- Section majeure : 24 à 32 px.
- Modal : 20 px mobile, 28 px desktop.

La proximité traduit la relation : un libellé reste à 8 px de son champ, tandis
que deux groupes fonctionnels sont séparés d'au moins 20 px.

## 5. Arrondis et ombres

- Champ et bouton : `12px` (`rounded-xl`).
- Carte compacte : `14px`.
- Carte standard : `16px` (`rounded-2xl`).
- Carte premium et modal : `22px` à `28px`.
- Badge : rayon complet (`9999px`).
- Ombre carte : `0 1px 2px rgb(15 23 42 / 0.05)`.
- Ombre premium : ombre ardoise large et diffuse, par exemple
  `0 30px 80px rgb(15 23 42 / 0.30)`.
- Ombre CTA orange :
  `0 10px 24px rgb(249 115 22 / 0.28)`.

Une ombre ne doit jamais être le seul moyen de délimiter un composant : les
cartes et modales gardent une bordure.

## 6. Boutons

Tous les boutons ont une hauteur minimale de 44 px, un rayon de 12 px, une
graisse de 600 ou 700 et un focus clavier visible.

### Primaire opérationnel

Fond Slate 950, texte blanc. Pour enregistrer, télécharger ou confirmer une
action interne importante.

### Accent BatiFlow

Fond Orange 500, texte blanc, ombre orange légère. Pour l'action commerciale
principale, par exemple « Envoyer le devis » ou « Consulter le devis en ligne ».
Une seule action accent par zone.

### Succès

Fond Emerald 700, texte blanc. Réservé à « J'accepte ce devis » et aux actions
qui produisent immédiatement un état positif.

### Secondaire

Fond blanc, bordure Slate 200 ou 300, texte Slate 700. Pour annuler, revenir,
dupliquer ou décliner sans danger.

### Danger

Fond Red 700 pour une confirmation destructive ; variante claire pour une
action de gestion moins critique. Le wording doit nommer la conséquence.

### États

- Survol : variation d'une nuance et, pour les CTA premium, légère élévation.
- Actif : retour à la position initiale.
- Focus : anneau 2 px avec décalage.
- Désactivé : opacité 60 %, curseur interdit, aucune animation.
- Chargement : libellé explicite, par exemple « Envoi en cours… ».

## 7. Cartes

### Standard

Surface blanche, bordure Slate 200, rayon 16 px et ombre très légère. Utilisée
pour les résumés, KPI et regroupements fonctionnels.

### Douce

Fond Slate 50, bordure Slate 200. Utilisée à l'intérieur d'une carte principale
pour les conditions, formulaires ou informations secondaires.

### Accent

Fond Orange 50 translucide, bordure Orange 200. Utilisée pour un montant ou un
élément de valeur, jamais pour une erreur.

### Sémantique

Les variantes information et succès utilisent respectivement Sky 50/Sky 200 et
Emerald 50/Emerald 200.

Une carte résumé suit l'ordre : libellé discret, valeur forte, explication
courte. Les icônes restent simples et contenues dans un carré arrondi.

## 8. Badges et statuts

Les badges sont compacts, arrondis, en graisse 700 et peuvent inclure un point
de couleur. La couleur complète le texte mais ne le remplace jamais.

| Statut | Style |
| --- | --- |
| Brouillon | Slate 100 / Slate 700 |
| Envoyé | Sky ou Blue 100 / 700 |
| Accepté | Emerald 100 / 700 ou 900 |
| Refusé | Red 100 / 700 |
| Payée | Emerald 100 / 700 |
| En retard | Red 100 / 700 |
| Annulée | Slate 100 / Slate 600 |

Les libellés métier et leurs accents ne doivent pas être renommés sans
validation, car ils sont aussi utilisés dans Firestore et la logique métier.

## 9. Modales

- Overlay Slate 950 à 60–65 %, avec flou très léger.
- Mobile : panneau aligné en bas, coins supérieurs de 28 px.
- Desktop : carte centrée, largeur adaptée au contenu, coins de 28 px.
- En-tête premium Slate 950 avec halo Orange 500 discret.
- Corps blanc défilable ; pied Slate 50 avec actions alignées à droite.
- Fermeture par bouton explicite, clic overlay et touche Échap lorsque l'action
  n'est pas en cours.
- `role="dialog"`, `aria-modal`, titre associé et blocage du scroll.
- Toute décision irréversible passe par une confirmation.

## 10. Timelines

La timeline indique un chemin métier, pas une décoration.

- Étape terminée : disque Sky 600, coche blanche, connecteur Sky 300.
- Étape active : disque blanc, contour Sky 600, `aria-current="step"`.
- Étape future : disque Slate 200, texte Slate 500.
- Réponse enregistrée sans suite positive : Slate 500.
- Mobile : axe vertical ; desktop : axe horizontal.
- Chaque étape comprend un verbe ou état court et un détail de contexte.

## 11. Formulaires

- Libellé au-dessus du champ, graisse 600, Slate 700 ou 800.
- Champ blanc, bordure Slate 200/300, rayon 12 px, hauteur minimale 48 px.
- Padding horizontal 16 px.
- Focus Orange 400/Orange 100 dans le workflow d'envoi ; focus Slate ou
  sémantique dans les décisions publiques.
- Aide facultative en 12 px Slate 500.
- Erreur dans un encart Red 50, bordure Red 200, texte Red 700.
- Les champs facultatifs sont annoncés comme tels.
- Les messages de validation indiquent comment corriger le problème.

## 12. Empty states

Un état vide comprend :

1. une icône ou un repère visuel simple ;
2. un titre factuel ;
3. une phrase qui explique la prochaine étape ;
4. au maximum une action principale.

Style : bordure Slate 300 en pointillés, dégradé blanc vers Slate 50, rayon
16 px et contenu centré. Le ton reste encourageant et concret.

## 13. Animations

- Transition standard : 150 à 200 ms.
- Entrée de carte publique : fondu + translation verticale de 6 px, 360 ms,
  `ease-out`.
- Survol CTA : translation maximale de 2 px et ombre légère.
- Changements de statut : transition de couleur 300 ms maximum.
- Respect obligatoire de `prefers-reduced-motion`.
- Aucun mouvement continu ou purement décoratif.

## 14. Ton rédactionnel

Le ton BatiFlow est direct, calme et professionnel. Il parle d'abord de la tâche
de l'utilisateur.

- Employer des verbes précis : « Envoyer le devis », « Télécharger le PDF ».
- Expliquer la prochaine étape : « L'entreprise sera automatiquement informée. »
- Confirmer le résultat : « Votre devis a bien été accepté. »
- Préférer des phrases courtes et un vocabulaire courant.
- Utiliser le vouvoiement côté client public.
- Dans l'interface métier, conserver le ton déjà en place et éviter de mélanger
  tutoiement et vouvoiement dans une même zone.
- Ne pas employer « premium » dans les libellés visibles : c'est une qualité
  d'exécution, pas une promesse à afficher.
- Éviter les formulations vagues comme « Valider » lorsque l'action peut être
  nommée plus précisément.

## 15. Composants de fondation

Les primitives disponibles dans `components/ui` sont :

- `Button` : variantes primary, accent, secondary, soft, success et danger.
- `Card` : variantes default, soft, accent, info et success.
- `Badge` : tons sémantiques et correspondance automatique des statuts connus.
- `SectionHeader` : sur-titre, titre, description et zone d'actions.
- `EmptyState` : icône, titre, description et action.

Ces composants doivent être adoptés progressivement, zone par zone. Une
migration ne doit jamais modifier la logique métier, les libellés stockés, les
routes, ni le comportement d'un workflow validé.
