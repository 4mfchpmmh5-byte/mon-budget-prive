# Mon Budget Privé — V4.0, développement en cours

## Statut au 16 novembre 2026
Première tranche de la V4 préparée sur la branche `v4/beta1-finance-engine` ; aucune modification publiée sur la branche `main` ni sur l'installation iPhone de l'utilisateur. La V3.7 Bêta 9 reste la version actuelle en production.

## Premier lot terminé (code + tests)
- **Rapprochement unique des budgets** : une transaction avec `planId` se rattache exclusivement à l'identifiant ciblé. Une transaction héritée sans `planId` ne peut être rapprochée automatiquement que si son nom et sa catégorie désignent un seul budget du mois. Une homonymie ambiguë reste non affectée au lieu d'être imputée à deux budgets.
- **Concordance des indicateurs** : suivi des dépenses variables, synthèse des charges et affichage payé/prévu utilisent le même résolveur d'imputation.
- **Transferts entre provisions** : le bouton de transfert transporte l'identifiant de la provision affichée plutôt que de rechercher une provision par son nom.
- **Édition des transactions** : conservation des métadonnées `recurringId` et `goalId` lors d'une modification d'une dépense. La conversion en revenu supprime ces métadonnées qui ne s'y appliquent plus.
- **Conservation du format du coffre** : aucune modification de la clé de stockage, des paramètres PBKDF2/AES-GCM ou du schéma persistant imposée par ce lot.

## Validation automatisée
- 16 scénarios fonctionnels V4 : 16 conformes ; exemple de deux budgets homonymes, écriture ancienne unique, identifiants explicites, récurrences au 31, absence de doublon, transferts homonymes, modification d'une transaction, patrimoine et sauvegarde chiffrée.
- Suite de démarrage mobile Playwright : validée.
- Audit visuel sur 5 largeurs et 6 vues : validé, pas d'anomalie détectée par les critères de contrôle.
- Validation spécifique Safari iOS avec véritable coffre non encore effectuée, volontairement pour ne pas toucher aux données personnelles.

## Prochain lot avant diffusion
1. **Restauration transactionnelle et secours chiffré** : simulation d'interruption et de quota navigateur, état précédent récupérable.
2. **Cohérence complète des provisions et investissements** : historique de plusieurs mois, transferts, utilisations et soldes ; comparaisons entre tous les écrans.
3. **Migration d'anciennes opérations ambiguës** : présentation explicite des écritures non affectées plutôt qu'imputation silencieuse.
4. **Tests de bout en bout supplémentaires** : suppression, annulation, erreurs de sauvegarde, ouverture hors ligne, restauration de sauvegardes anciennes.
5. **Bêta V4 déployée seulement après revue des risques et possibilité claire de revenir à la V3.7 Bêta 9**.

Ce document reflète les contrôles exécutés, pas une certification exhaustive de l'application.


## Lot supplémentaire — 17 novembre 2026 (sur branche V4 seulement)
- Couverture de régression ajoutée pour les objectifs et provisions de novembre à décembre, notamment quand l'identifiant du budget mensuel change, qu'un objectif a un homonyme et que des transferts traversent les mois.
- Le chemin habituel de sauvegarde chiffrée conserve désormais le précédent coffre chiffré sous la clé distincte `mbp-encrypted-v1-previous-v4` **avant** de remplacer le coffre actif, puis vérifie la relecture de la valeur persistée.
- Si la copie de secours ou l'enregistrement actif échoue (p. ex. quota de stockage), la tentative de sauvegarde rejette l'erreur. Le format chiffré existant et la clé active `mbp-encrypted-v1` ne changent pas.
- Scénarios automatisés ajoutés pour injecter une erreur `QuotaExceededError` lors de la copie de secours puis lors de l'écriture active.
- Les tests ont été ajoutés au workflow CI; **leur exécution réussie n'est pas encore confirmée** sur ce nouveau commit. Aucune publication effectuée.

### Précautions restantes
- La copie de secours utilise plus d'espace local; contrôler son comportement dans Safari iOS et en stockage saturé avant toute diffusion.
- La restauration et la réinitialisation n'exploitent pas encore automatiquement cette copie, ce qui demande un lot de développement séparé et une confirmation utilisateur explicite.
- Les erreurs de sauvegarde ne doivent jamais être présentées comme une opération enregistrée ; auditer les formulaires concernés.
