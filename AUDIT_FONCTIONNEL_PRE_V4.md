# Audit fonctionnel — Mon Budget Privé V3.7 Bêta 9 — préparation V4
Date : 16 novembre 2026
Statut : audit avec jeu de données fictif, sans changement du code de production.

## Méthode
- Branche isolée : `audit/fonctionnel-pre-v4`
- Suite Chromium/Playwright : `tests/functional-audit.cjs`
- 12 vérifications automatisées ; 11 conformes et 1 non conforme.
- Tests d'ouverture et d'ergonomie précédents conservés et exécutés dans la même CI.
- Aucune donnée financière personnelle utilisée.

## Anomalie confirmée (priorité P1)
**MBP-F-001 — Double imputation d'une opération sans `planId` à plusieurs budgets homonymes.**
Reproduction : deux plans `{id:'a', name:'EDF', cat:'Fixes'}` et `{id:'b', name:'EDF', cat:'Fixes'}`, une opération `{name:'EDF', amount:100, type:'expense'}` sans `planId`.
- `paymentItems()` ne marque aucun plan payé : conforme à l'objectif de ne pas inventer de lien.
- En revanche, `v17BudgetSpent(a) === 100` ET `v17BudgetSpent(b) === 100` : le suivi indique 200 € consommés pour seulement 100 € d'opérations.
- Cause : le rapprochement `t.name === p.name` n'est pas borné à un budget unique.
- Correction V4 : appliquer des IDs stables à toute imputation ; proposer une migration/association explicite pour les écritures héritées non liées ; ne jamais affecter automatiquement une écriture ambiguë à plusieurs plans.
- Régression à ajouter : homonymes, renommage de plan, transaction sans `planId`, plan mensuel cloné.

## Risques relevés par inspection (à confirmer par tests de bout en bout)
**MBP-F-002 — Écrans utilisant des stratégies de rapprochement différentes.**
Le calcul `render21()` contient encore un repli sur l'égalité du nom, tandis que `paymentItems()` rapproche désormais par identifiant. Les indicateurs peuvent diverger selon la présence des IDs, en particulier après import de données anciennes.
Action V4 : un moteur unique de rapprochement et une matrice de cas de migration.

**MBP-F-003 — Sélection d'une provision par son seul nom dans l'accès au transfert.**
Le contrôleur du dialogue des provisions utilise `availableGoals().find(g=>g.name===...)`. Deux provisions portant le même nom pourraient conduire à une sélection ambiguë.
Action V4 : transmettre `goalId` de bout en bout, tester les homonymes.

**MBP-F-004 — Restauration chiffrée : couverture incomplète des cas d'échec.**
La fonction de restauration vérifie le déchiffrement et tente de préserver l'ancien coffre, mais le scénario complet d'échec d'écriture, d'interruption et de récupération après rechargement n'a pas été exercé.
Action V4 : restauration transactionnelle avec ancien coffre récupérable, test d'échec de stockage et test de rechargement.

## Scénarios conformes
- Chiffrement AES-GCM : round-trip et absence de données en clair dans le payload.
- Phrase secrète erronée rejetée.
- Structure de sauvegarde invalide rejetée.
- Sauvegarde locale / réouverture cryptographique avec montant inchangé.
- Copie de budgets d'un mois à l'autre sans mutation de l'original.
- Récurrence au jour 31 ajustée à février 2027 (28) et absence de doublon à la seconde application.
- Transfert 100 € entre deux provisions : 700 € -> 600 € et 0 € -> 100 €, aucun revenu/dépense créé.
- Calcul de performance indicatif : capital investi 2 500 €, valeur 2 600 €, écart +100 €.
- Absence d'erreur JavaScript durant les scénarios.

## Périmètre non exhaustif
L'audit ne prétend pas tester : restauration complète via le sélecteur de fichiers iOS ; interruptions de sauvegarde en cours de chiffrement ; écrans à clavier natif Safari ; tous les gestes d'édition/suppression ; collisions de plusieurs contributions et transferts à dates identiques ; migration d'un vrai coffre des versions anciennes. Ces cas deviennent des tests de validation V4 obligatoires, toujours sur copies fictives/anonymisées.

## Décision
La V3.7 Bêta 9 reste inchangée en production. Démarrer V4 sur une branche indépendante par MBP-F-001, puis MBP-F-002, MBP-F-003 et MBP-F-004. Ne pas fusionner de refonte du moteur financier sans tests de non-régression complets.
