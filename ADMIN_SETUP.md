# Floraxion Aromatics — Configuration Firebase et accès administrateur

## Configuration utilisée par l’application

Le fichier `firebase-applet-config.json` configure le projet Firebase `floraxionaromatics-e0b00`, son domaine d’authentification `floraxionaromatics-e0b00.firebaseapp.com` et la base Firestore `(default)`. Les valeurs de configuration client Firebase sont incluses dans le navigateur par conception. N’ajoutez jamais de clé privée de compte de service ou de secret Admin SDK dans ce fichier. Avant d’utiliser l’application, remplacez `apiKey` par la clé Web fournie dans les paramètres de l’application Firebase de ce projet. La clé de l’ancien projet ne doit pas être réutilisée.

Avant toute modification dans la console, confirmez que le sélecteur de projet Firebase affiche exactement `floraxionaromatics-e0b00`. Le code seul ne peut pas confirmer l’état réel de la console.

## Activer et vérifier la connexion par e-mail

1. Dans Firebase Console, ouvrez **Authentication → Sign-in method** pour `floraxionaromatics-e0b00`.
2. Activez **Email/Password** et enregistrez.
3. Dans **Authentication → Settings → Authorized domains**, vérifiez que `localhost` et le domaine de production de l’application sont autorisés.
4. Dans **Authentication → Users**, vérifiez que `chabou.lotfi@gmail.com` existe. Si ce compte n’existe pas, créez-le ici et transmettez son mot de passe à son titulaire par un canal sécurisé.

`auth/operation-not-allowed` signifie que le fournisseur utilisé pour cette tentative n’est pas activé dans le projet qui a reçu la requête. Vérifiez le sélecteur de projet avant de modifier le fournisseur; l’erreur ne prouve pas à elle seule que le projet configuré est incorrect.

## Donner l’accès administrateur à l’UID prévu

La connexion Firebase et l’autorisation admin sont deux vérifications différentes. Une connexion réussie ne donne pas l’accès au tableau de bord sans document `/admins/{uid}`.

1. Dans **Authentication → Users**, ouvrez la fiche `chabou.lotfi@gmail.com` et copiez son UID.
2. Dans **Firestore Database**, sélectionnez la base `(default)` du projet `floraxionaromatics-e0b00`.
3. Ouvrez l’onglet **Rules** et publiez le contenu de `firestore.rules` sur cette base.
4. Ouvrez **Data**, créez la collection `admins` si nécessaire, puis un document dont l’ID est exactement l’UID copié. Pour l’administrateur prévu, l’UID communiqué est `kGYDyJoEo5glfVTHjCK6Uch0aYD2`; vérifiez qu’il correspond toujours à l’UID affiché dans Authentication avant de l’utiliser.
5. Ajoutez les champs :
   - `uid` (string) : UID copié
   - `email` (string) : `chabou.lotfi@gmail.com`
   - `displayName` (string) : nom de l’administrateur
   - `role` (string) : `super_admin`
   - `createdAt` (timestamp) : date et heure Firestore
6. Vérifiez que l’adresse e-mail du document correspond au compte dont l’UID sert d’ID. Les écritures dans `/admins` sont bloquées depuis le navigateur; gérez cette collection uniquement via la console ou un environnement serveur/Admin SDK approuvé.

## Tester localement

1. Lancez l’application avec `npm run dev`.
2. Ouvrez `http://localhost:3000/admin`.
3. Connectez-vous avec `chabou.lotfi@gmail.com` et le mot de passe créé dans Firebase Authentication.
4. Confirmez l’ouverture de `/admin/dashboard`, puis déconnectez-vous et vérifiez qu’une ouverture directe du tableau de bord redirige vers `/admin`.
5. Pour tester le refus, utilisez un compte de test authentifié qui n’a pas de document `/admins/{uid}`. Il doit être déconnecté et recevoir un message d’accès refusé.

Les tests locaux ne peuvent pas prouver que Firebase Console, Email/Password, le compte, les règles et le document administrateur sont configurés correctement. Il faut effectuer ces étapes avec le projet réel.

## Limite actuelle des données du back-office

Les produits, commandes, devis, paramètres de livraison et journaux de l’interface sont actuellement lus et écrits dans `localStorage` par `src/lib/storage.ts`. Ils ne sont pas enregistrés dans Firestore. Les règles de `firestore.rules` protègent les accès directs à Firestore lorsqu’elles sont publiées, mais elles ne peuvent pas protéger des données conservées dans le navigateur. Ne traitez donc pas les opérations du tableau de bord comme un back-office de production tant que ces écritures n’ont pas été migrées vers Firestore ou un backend avec contrôle d’accès serveur.

Les règles bloquent aussi les créations de commandes invitées et de devis directement depuis le navigateur. Avant de rendre ces flux persistants, ajoutez un endpoint serveur qui valide les produits, prix, totaux et champs reçus, puis écrit dans Firestore avec Admin SDK côté serveur. Ne rendez pas ces collections publiques en écriture pour faire disparaître une erreur de permission.

## Valider et déployer les règles avec Firebase CLI

Le dépôt associe explicitement `firestore.rules` à la base `(default)` dans `firebase.json`. Vérifiez toujours l’ID du projet et confirmez que sa base `(default)` est celle attendue avant le déploiement.

Depuis la racine `H:\Floraxion aromatics website\floraxion-aromatics 2`, après installation/connexion du Firebase CLI et après avoir vérifié le diff :

```powershell
firebase use floraxionaromatics-e0b00
firebase firestore:databases:list --project floraxionaromatics-e0b00
firebase deploy --only firestore --project floraxionaromatics-e0b00
```

La commande de déploiement cible uniquement Firestore et son unique base configurée `(default)`. Elle n’a pas été exécutée. Pour vérifier la syntaxe et le comportement des règles avant publication, utilisez Firebase Local Emulator Suite avec un projet de test et des cas autorisés/refusés pour chaque rôle. Le Firebase CLI et Java/émulateur ne sont pas installés dans l’environnement inspecté, donc aucune compilation ou exécution de l’émulateur n’a pu être confirmée ici. La Console Firebase permet également de publier les règles après avoir sélectionné explicitement cette base dans le projet `floraxionaromatics-e0b00`.
