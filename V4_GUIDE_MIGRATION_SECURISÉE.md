# Migration contrôlée — Mon Budget Privé V3.7 → V4 (préproduction)

**Date : 17 novembre 2026. Production V3.7 Bêta 9 inchangée.**

## Invariants de sécurité

1. **Ne jamais écraser la V3.7 avant une validation complète.** Le coffre V3.7 utilise `mbp-encrypted-v1`, le coffre de la bêta V4 utilise `mbp-encrypted-v4-beta1`; sur des domaines différents, le stockage local est distinct aussi.
2. **Sauvegarde chiffrée obligatoire** sur l'iPhone depuis **Profil → Fiscalité et sécurité / Sauvegardes** (selon la navigation affichée) → **Exporter une sauvegarde chiffrée**. Vérifier qu'un fichier `mon-budget-sauvegarde-AAAA-MM-JJ.json` existe réellement dans **Fichiers**. Ne pas partager le fichier ou la phrase secrète dans ChatGPT.
3. Préserver **deux exemplaires** du fichier exporté, dans des emplacements sûrs choisis par l'utilisateur, avant toute importation. Ne pas effacer l'application V3.7.
4. La V4 importe la **sauvegarde chiffrée** dans le coffre de l'origine de démonstration après confirmation explicite : **Importer une sauvegarde**, choisir le fichier exporté, entrer la phrase secrète **de la sauvegarde**, confirmer le remplacement des **données locales de la V4 test**. Ceci remplace le contenu de la V4 test seulement, pas celui de la V3.7 sur un autre domaine. Il faut un coffre de test V4 initialement ouvert, et l'import conserve le secret de la sauvegarde pour le coffre résultant.
5. **Contrôler les montants et les comptes sans transmettre de valeurs personnelles** : transactions récentes, revenus/dépenses du mois, budgets du mois courant et précédent, provisions et contributions, transferts, récurrences et patrimoine avec instantanés. Vérifier la continuité sur au moins deux mois et après fermeture/réouverture de la V4.
6. Exporter une **nouvelle sauvegarde V4** et confirmer qu'elle est enregistrée. Garder la sauvegarde V3.7 originale et l'application V3.7 tant que le passage en production n'est pas validé.
7. En cas de divergence, **arrêter l'essai** et conserver la V3.7 inchangée ; ne pas supprimer/reconfigurer le coffre actif ni les sauvegardes.

## Vérification technique

- Enveloppe des sauvegardes des deux versions : `format=mon-budget-prive`, `version=1`, `kdf=PBKDF2-SHA256`, `iterations=310000`, sel et IV aléatoires, `AES-GCM`. Le contenu reste chiffré dans le fichier JSON.
- `mbpMigrate37` convertit le schéma du coffre vers `schemaVersion=2` et crée les identifiants `goalId` pour les provisions/investissements. Les catégories homonymes ambiguës ne doivent pas être confondues. Les objets inconnus sont conservés lors de la migration.
- L'import de la V4 vérifie et déchiffre le fichier avant toute écriture ; il confirme explicitement l'écrasement du coffre de destination, vérifie le chiffrement de la nouvelle copie, et tente un retour en arrière en cas d'échec du stockage.
- Régressions automatisées : `tests/v4-restore-migration.cjs`, `tests/v4-external-backup-roundtrip.cjs`, `tests/v4-beta-storage-isolation.cjs`, `tests/v4-v37-full-migration.cjs`.
- Les fixtures automatiques **ne sont pas les données privées de l'utilisateur**. Un contrôle final des chiffres de l'utilisateur sur son appareil est nécessaire avant toute publication sur la branche `main`.

## Conditions de diffusion en production

- Suite de tests complète au vert sur le commit proposé ;
- Import V3.7→V4 confirmé manuellement sur un coffre de test isolé et rapprochement des valeurs par l'utilisateur ;
- Sauvegardes V3.7 et V4 vérifiées ;
- Accord explicite de l'utilisateur pour remplacer la V3.7 publiée ;
- Plan de retour arrière vers le code et la sauvegarde V3.7 disponible.
