# Mon Budget Privé — protocole d'essai iPhone V4 Bêta 1

**Préparation uniquement — ne pas publier sur `main` ni remplacer la PWA actuelle.**

## Conditions obligatoires avant l'essai

- [ ] La V3.7 Bêta 9 reste accessible et fonctionnelle sur l'iPhone.
- [ ] Exporter une sauvegarde chiffrée de la V3.7 et vérifier que le fichier est bien présent dans Fichiers ; conserver sa phrase secrète séparément.
- [ ] Servir la V4 depuis **une origine HTTPS indépendante** de celle de la V3.7 (idéalement un sous-domaine ou un hébergement de test distinct). Un simple autre raccourci iPhone vers la même adresse ne suffit pas : le service worker peut partager sa portée.
- [ ] Aucun accès de la bêta au coffre de production. La V4 utilise `mbp-encrypted-v4-beta1`, la V3.7 utilise `mbp-encrypted-v1` ; ne pas importer la vraie sauvegarde V3.7 pendant les tests de démonstration.
- [ ] Installer la V4 via Safari > Partager > Sur l'écran d'accueil, avec un nom clairement distinct, sur l'origine dédiée uniquement.
- [ ] Créer un nouveau coffre fictif avec une phrase secrète **de test**. Ne pas utiliser le vrai mot de passe.

## Essai manuel : parcours sur iPhone

1. **Écran de création** : vérifier le texte « coffre de test indépendant », la lisibilité et l'absence de zoom involontaire.
2. **Accueil** : saisir une dépense fictive avec le clavier numérique natif ; ouvrir une opération récente directement en édition ; annuler puis enregistrer une modification.
3. **Suppression** : vérifier la confirmation, l'annulation sans perte, puis la suppression volontaire d'une opération fictive.
4. **Provisions** : créer un objectif fictif et enregistrer une contribution dans une seule feuille (montant + date), sans deuxième clavier ni superposition.
5. **Profil / Synthèse / Patrimoine** : parcourir les quatre onglets, les sous-onglets Profil, les graphiques et les couleurs d'avancement ; confirmer que les fenêtres restent visibles avec le clavier ouvert.
6. **Sauvegarde** : exporter le fichier chiffré fictif ; vérifier sa présence dans Fichiers, puis tenter un import avec un mauvais mot de passe et confirmer que les données restent intactes.
7. **Restauration** : modifier une dépense fictive, restaurer le fichier d'essai avec le bon mot de passe et confirmer le retour de son ancienne valeur.
8. **Hors ligne** : une fois la page et les icônes chargées en ligne, activer le mode Avion, fermer puis rouvrir la PWA de test, déverrouiller et saisir une dépense fictive ; relancer la PWA et confirmer que la dépense reste enregistrée.
9. **Reprise en ligne** : désactiver le mode Avion ; vérifier l'absence d'erreur et la conservation des données.
10. **Non-régression V3.7** : ouvrir l'application installée d'origine et vérifier ses données habituelles sans y effectuer d'action destructive.

## Critères de blocage de la bêta

- La V4 demande d'ouvrir le coffre réel de la V3.7, écrase son cache/service worker, ou modifie une donnée de production.
- L'opération fictive disparaît après fermeture/rechargement, ou la restauration chiffrée échoue.
- Un clavier secondaire apparaît, les champs deviennent inaccessibles, ou une modale sort de l'écran sans pouvoir défiler.
- Un écran affiche des informations incohérentes entre les montants réels et prévus.

**Règle de déploiement :** la validation automatisée (GitHub Actions n°260, réussie) ne vaut pas validation Safari iOS. Aucune fusion ni publication de `main` sans autorisation explicite.


## Paquet de démonstration automatisé

Le script `node scripts/build-v4-beta-preview.cjs` crée `dist/v4-beta1/` (sans modifier ni publier la V3.7). Il contient la page V4, son manifeste « Budget V4 Test », ses icônes et un service worker dont la portée est relative au sous-dossier. Le test `tests/v4-preview-scope.cjs` valide le périmètre du service worker, la préservation du cache V3.7 et le fonctionnement hors ligne.

GitHub Actions n°272 a validé la création et les tests du paquet. Le workflow conserve désormais le paquet comme **artefact GitHub Actions** pendant sept jours, uniquement sur la branche V4. Cet artefact n'est **pas** une application déjà publiée ni une URL d'installation iPhone : il doit d'abord être hébergé sur une origine HTTPS de test séparée. Ne pas fusionner sur `main` pour réaliser cet essai.


## Renforcement du service worker avant hébergement

- La démonstration conserve un **cache qui lui est propre** (`mon-budget-shell-v4-preview-...`) et n'efface que ses propres anciennes générations. Elle ne supprime ni le cache V3.7 ni le cache V4 racine.
- La recherche des fichiers hors ligne est limitée au cache du service worker actif. Elle ne consulte plus automatiquement tous les caches de l'origine, ce qui évite le mélange de pages entre applications installées.
- Le scénario Playwright `tests/v4-preview-scope.cjs` contrôle les deux caches anciens simultanément, le périmètre d'installation du service worker et le lancement hors ligne.
- **L'hébergement sur une origine HTTPS distincte reste recommandé et non réalisé** ; cette protection des caches n'équivaut pas à une preuve d'isolation de l'application installée sur Safari iOS.


## Préparation de l'hébergement indépendant sur Vercel

Le fichier `vercel.json`, **présent uniquement sur la branche de développement V4**, prépare le déploiement de la démo avec `node scripts/build-v4-beta-preview.cjs` et le seul dossier public `dist/v4-beta1`. Le paquet utilise une identité « Budget V4 Test », un coffre local distinct et un cache hors ligne propre. Les pages de test portent l'en-tête `X-Robots-Tag: noindex` ; ce n'est **pas** une authentification.

**Ne pas importer le dépôt en sélectionnant implicitement `main`** : le dépôt public possède déjà la production V3.7 et `main` ne porte pas cette configuration de démo. Créer un projet Vercel **distinct**, sélectionner explicitement `v4/beta1-finance-engine` comme référence à déployer, contrôler dans les journaux que le dossier publié est `dist/v4-beta1`, puis tester son URL `*.vercel.app`. Ne pas associer le domaine de production V3.7. Toute activation Vercel nécessite une connexion du compte propriétaire ; sans celle-ci aucune URL de démonstration n'existe encore.

Ne jamais saisir de vraies informations financières dans un environnement de test public sans protection d'accès. Avant d'utiliser le lien depuis l'iPhone, revalider l'URL, le titre « V4 Bêta 1 », les entrées de démonstration et l'absence de redirection vers la V3.7.
