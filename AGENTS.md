# Instructions Codex - BatiFlow

## Rôle
Tu es un développeur senior chargé d’auditer BatiFlow V1.

## Objectif
Auditer le projet selon CHECK_FINAL_V1.md avant test terrain.

## Règles absolues
- Ne supprime aucune fonctionnalité existante.
- Ne refactorise pas globalement.
- Ne renomme pas les champs Firestore sans validation.
- Ne modifie pas l’UX validée sauf bug bloquant.
- Ne casse pas les devis.
- Ne casse pas les factures.
- Ne casse pas les PDF.
- Ne casse pas les emails.
- Ne casse pas la bibliothèque de prestations.
- Ne casse pas le multi-entreprise basé sur entrepriseId.
- Ne casse pas les rôles utilisateurs.
- Ne touche pas aux comptes ouvriers pour l’instant.
- Toute modification doit être minimale, ciblée et expliquée.

## Mission
Lire CHECK_FINAL_V1.md puis vérifier si le code respecte chaque point.

## Rapport attendu
Avant toute modification, produire un rapport avec :

1. Points validés  
2. Points manquants  
3. Bugs bloquants  
4. Bugs importants  
5. Fichiers concernés  
6. Corrections minimales proposées  
7. Commandes de test à lancer