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


## Suite du lot V4 — récupération locale authentifiée
- L'écran de déverrouillage propose **Récupérer la sauvegarde locale précédente** lorsqu'une copie chiffrée existe.
- La copie n'est déchiffrée qu'avec une phrase secrète fournie par l'utilisateur; le coffre actif est d'abord testé. Si le coffre actif est lisible avec cette phrase, le retour en arrière est refusé.
- Pour un coffre illisible, une confirmation explicite détaille le risque de perdre les opérations les plus récentes, puis la copie de secours devient le coffre actif, sous contrôle de relecture.
- Une régression Playwright valide le refus de restaurer un coffre sain et la récupération d'un coffre volontairement altéré.
- Le test historique de fumée a été ajusté pour contrôler la présence de la copie de secours plutôt qu'une ancienne déclaration JavaScript devenue obsolète.
- **Validation CI sur la dernière révision encore à vérifier**. Safari iOS et stockage défaillant pendant la restauration restent des risques ouverts; aucune diffusion.


## Régressions de récupération et effacement — 17 novembre 2026
- Diagnostic GitHub Actions : 16/16 tests financiers, scénario multi-mois et simulation de quota validés sur la révision précédente; échec restant dû à une assertion trop précoce du test asynchrone de récupération. Le test attend désormais explicitement la réponse.
- Récupération proposée au déverrouillage même si la clé du coffre principal a disparu, tant qu'une copie chiffrée précédente est encore stockée.
- Effacement définitif : suppression des **deux** clés chiffrées, coffre actif et secours.
- Réinitialisation : purge de la copie chiffrée de l'ancien historique après succès; en cas d'erreur, tentative de restauration du coffre précédent, de sa copie et de l'état mémoire. Le message distingue une restauration réussie d'un état de stockage incertain.
- Tests ajoutés pour récupération sans coffre principal, suppression des deux copies et réinitialisation interrompue par une erreur de stockage.
- La suite CI complète de cette révision, ainsi que Safari iOS, nécessitent confirmation. Aucun déploiement sur `main`.


## Parcours des opérations — 17 novembre 2026
- GitHub Actions n°174 : suite existante complète validée sur `6f1aa781`, notamment finances, sauvegardes, récupération et effacement.
- Ajout d'un test navigateur indépendant couvrant le clic sur une opération de l'Accueil, l'ouverture directe du formulaire de modification sans panneau intermédiaire, le bon titre, et la présence de la suppression contextualisée.
- La suite simule ensuite une annulation de suppression, une erreur de stockage chiffré avec retour arrière, puis une suppression confirmée dont la persistance chiffrée est relue.
- Ajout au workflow CI ; résultat du nouveau scénario **non encore confirmé** lors de la rédaction.
- Restent les tests Safari iOS et la revue complète du parcours de modification sur le clavier natif.


## Ergonomie mobile — clavier numérique natif (17 novembre 2026)
- Uniformisation du rendu des champs numériques : taille de police d'au moins 16 px pour éviter le zoom de focus iOS et maintien des champs numériques natifs, sans clavier applicatif supplémentaire.
- La feuille de contribution conserve simultanément le montant, la date, le bouton d'annulation et la validation dans un seul dialogue; limites de hauteur pour un petit écran.
- Nouveau test Playwright mobile de focus des montants et de l'unicité de la feuille de contribution, ajouté à GitHub Actions. La présence de vrais claviers Safari/iOS n'est **pas** simulable avec Chromium ; un essai réel reste indispensable.
- Résultat du nouveau workflow à confirmer. Aucun déploiement sur `main`.


## Tests de positionnement mobile — 17 novembre 2026
- Ajout de `tests/v4-dialog-geometry.cjs` : 35 contrôles sur 5 tailles d'écran (320×568, 375×667, 390×844, 430×932 et 768×880), 7 familles de fenêtres, y compris contribution, transaction et transfert.
- Chaque contrôle ouvre une fenêtre après défilement de page, simule le focus d'un champ si disponible, puis vérifie les limites horizontales et verticales et l'absence de débordement du contenu.
- GitHub Actions n°194 : **succès** sur la branche V4, avec l'ensemble des régressions existantes.
- Le vrai clavier Safari iOS et la zone visible mobile réduite par le clavier ne sont pas totalement reproduits par Chromium : essai physique à conserver avant publication.
- Pas de modification de `main` ni de déploiement iPhone.


## Navigation et identité Ice Glass — 17 novembre 2026
- Les quatre onglets principaux (Accueil, Synthèse, Profil, Patrimoine) ont désormais un traitement d'état actif bleu/violet Ice Glass cohérent. Le sous-menu Profil utilise la même logique de sélection.
- Les onglets exposent un seul `aria-current="page"` à la fois; les deux sous-onglets Finances/Sécurité exposent `aria-pressed`. Un contour de focus visible est conservé pour l'accessibilité.
- Test Playwright ajouté pour parcourir les quatre onglets au toucher, vérifier le panneau visible, la sélection unique et les sous-onglets du Profil; intégré au workflow GitHub Actions.
- Ne touche pas aux soldes, transactions, migrations ni au stockage chiffré.
- Nouveau test CI en attente de validation; Safari iOS physique toujours à essayer avant diffusion.


## Vérification PWA hors ligne — 17 novembre 2026
- Le cache du service worker de la branche V4 porte un identifiant propre (`mon-budget-shell-v4-beta1-offline-1`), pour éviter de réutiliser une interface V3.7 périmée lors des essais.
- Scénario automatisé ajouté : création du coffre, enregistrement en ligne, installation du service worker, passage hors ligne, rechargement sans réseau, déverrouillage, écriture chiffrée hors ligne, nouveau rechargement sans réseau et contrôle des deux transactions.
- Le service worker ne consulte pas le contenu du coffre ; les opérations restent stockées localement et chiffrées.
- Ce test Chromium ne remplace pas le contrôle d'une PWA installée via Safari iOS, notamment la politique de stockage et les éventuelles purges de données d'iOS.
- État CI : GitHub Actions n°216 **réussi** ; vérification hors ligne et régression complète validées dans Chromium, sans constituer une validation Safari iOS.


## Revue visuelle et séparation des caches — lot final, 17 novembre 2026
- Cache PWA V4 isolé : le nouveau service worker ne supprime plus le cache V3.7 pendant l'activation (nettoyage limité aux versions `mon-budget-shell-v4-`). Test de conservation de l'ancien cache ajouté au scénario hors ligne.
- Indicateurs de dépenses : vert sous 60 %, ambre de 60 à moins de 85 %, orange de 85 à 100 % inclus, rouge uniquement au-delà de 100 %.
- Indicateurs d'épargne et de provisions : bleu-gris tant que l'objectif est incomplet, vert lorsqu'il est atteint. Élimination d'une ancienne règle CSS plus spécifique qui imposait du bleu clair malgré l'état calculé.
- Nouveau test Playwright de sept cas vérifiant les couleurs **réellement rendues**, et pas uniquement les classes ou les valeurs CSS intermédiaires.
- Exécution complète GitHub Actions n°236 : **réussie** avec cette correction et les scénarios précédents.
- Risques restants avant publication : vérification sur Safari iOS réel (clavier, viewport, mode installé, cache et stockage), sauvegarde externe préalable et essai de restauration avec une copie de données de test.
- Le développement reste sur `v4/beta1-finance-engine` ; aucune modification ni déploiement de `main`.


## Import d'une sauvegarde V3.7 vers V4 — 17 novembre 2026
- Restauration de sauvegarde chiffrée renforcée : la substitution du coffre principal et la suppression de l'ancienne copie de secours sont traitées comme une opération cohérente.
- Si une écriture ou la suppression de la copie locale échoue, tentative de remise en place du coffre principal précédent, de sa copie de secours et de l'état mémoire avant d'annoncer l'échec.
- Test navigateur : refus de confirmation sans changement, échec simulé d'effacement de la copie avec retour arrière, restauration d'une sauvegarde V3.7 sous une autre phrase secrète, migration vers le schéma V4, suppression de l'ancien contenu, rechargement puis déverrouillage du nouveau coffre.
- GitHub Actions n°246 : **suite complète réussie** après correction d'une erreur de syntaxe détectée en CI.
- La validation Safari iOS réel et la sauvegarde externe de l'installation existante restent obligatoires avant tout déploiement ; `main` reste inchangée.


## Test de bout en bout de sauvegarde externe — 17 novembre 2026
- Nouveau test Playwright `tests/v4-external-backup-roundtrip.cjs` intégré au workflow.
- Le navigateur télécharge réellement un fichier JSON de sauvegarde, vérifie le nom du fichier, le format chiffré et l'absence du libellé en texte clair.
- Contrôles de sécurité : refus de fichier malformé et de phrase secrète incorrecte sans modification du coffre actif.
- Après une modification volontaire des transactions, l'import du fichier initial remet les transactions, budgets et actifs enregistrés; le coffre peut être déverrouillé après rechargement.
- GitHub Actions n°252 : **succès** sur la branche `v4/beta1-finance-engine`, y compris les tests existants.
- Avant installation iOS : vraie sauvegarde externe de la V3.7, tests Safari de clavier/viewport/PWA et vérification sur données de démonstration. Ne pas importer des données réelles de production dans un banc de test.


## Préparation bêta iPhone : isolation des données (17 novembre 2026)
- **Protection nouvelle** : la branche V4 utilise exclusivement `mbp-encrypted-v4-beta1` comme clé du coffre actif, au lieu de la clé `mbp-encrypted-v1` utilisée par la V3.7. Les copies de secours sont également séparées (`-previous-v4`).
- La bêta ne lit ni n'importe automatiquement la clé de coffre V3.7. Une information le signale sur les écrans de création et de déverrouillage ; l'import d'un fichier de sauvegarde V3.7 reste une action manuelle et confirmée.
- Test `tests/v4-beta-storage-isolation.cjs` : coffre de production et copie de secours simulés par des sentinelles, création et écriture du coffre de test, rechargement, déverrouillage et comparaison des sentinelles.
- **La séparation du stockage ne suffit pas à sécuriser un déploiement** : une V4 installée sous la même origine et la même portée service worker que la V3.7 pourrait encore remplacer le contrôleur hors ligne de production. Tester avec une **origine ou une portée PWA distincte**, en conservant `main` inchangée.
- Ne jamais utiliser une vraie sauvegarde personnelle dans les tests automatisés ; valider Safari iOS sur coffre fictif et sauvegarder la V3.7 avant toute publication.
- GitHub Actions n°260 : **succès**, y compris le nouveau scénario d'isolation du coffre V4. Protocole de test manuel créé dans `V4_BETA1_IPHONE_TEST.md`.


## Préparation de l'hébergement test Vercel — 17 novembre 2026
- Configuration `vercel.json` ajoutée uniquement à `v4/beta1-finance-engine` : compilation `node scripts/build-v4-beta-preview.cjs`, publication exclusivement du dossier `dist/v4-beta1`, en-têtes anti-indexation et sécurité basique.
- Nouveau contrôle `tests/v4-vercel-preview-config.cjs` : vérifie la configuration et l'exclusion des fichiers de développement et du coffre V3.7 de la sortie statique.
- Exécution GitHub Actions n°292 : **succès**, tous les tests et l'archivage du paquet de démo validés.
- Vercel n'est **pas connecté** et **aucun déploiement n'a été créé**. Requiert une connexion explicite au compte Vercel et la sélection du bon projet/branche de test. Ne pas déployer `main` ni utiliser le domaine de l'application actuelle.
