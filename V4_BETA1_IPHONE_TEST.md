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
