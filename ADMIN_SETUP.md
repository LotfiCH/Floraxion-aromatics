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

## Équipe et gestionnaires du catalogue

Le tableau **Admin → Gestion de l’équipe (Team Management)** est une liste en lecture seule réservée au rôle `super_admin`. Il lit `/admins` avec les règles Firestore existantes. Il affiche les rôles et l’existence du document d’autorisation, mais le SDK client ne peut pas vérifier si le compte Firebase Authentication est désactivé. Les rôles et données sensibles ne sont jamais modifiables depuis le navigateur.

Aucun Cloud Function ni endpoint serveur de gestion d’équipe n’est configuré dans ce projet. `firebase.json` ne déclare que les règles Firestore; `scripts/setup-admin.ts` est un script local de bootstrap pour le compte super-administrateur désigné, pas une API de gestion d’équipe. N’ajoutez pas de droit d’écriture client à `/admins` pour faire apparaître des actions dans l’interface.

### Ajouter le premier gestionnaire du catalogue

1. Dans Firebase Console, sélectionnez le projet `floraxionaromatics-e0b00`, puis **Authentication → Users**. Utilisez **Add user** avec l’adresse e-mail de la personne. Si Email/Password n’est pas activé, activez-le dans **Authentication → Sign-in method**.
2. Utilisez un mot de passe initial aléatoire et unique dans la Console, puis, depuis la fiche utilisateur, déclenchez immédiatement **Reset password** pour que la personne choisisse son propre mot de passe. Ne lui envoyez pas le mot de passe initial. Vous pouvez aussi créer le compte dans un environnement Admin SDK de confiance qui n’expose aucun secret au navigateur.
3. Copiez l’UID de ce nouvel utilisateur depuis **Authentication → Users**. Vérifiez l’adresse e-mail et l’UID ensemble avant de continuer.
4. Ouvrez **Firestore Database → `(default)` → Data** dans le même projet. Créez le document `/admins/{UID}` avec l’ID exactement égal à l’UID copié.
5. Ajoutez les champs `uid` (string, même UID), `email` (string, adresse vérifiée), `displayName` (string, nom affiché), `role` (string, `catalogue_manager`) et `createdAt` (timestamp Firestore). N’utilisez pas `super_admin` pour ce compte.
6. Vérifiez que les règles déployées correspondent aux règles locales pour le projet et la base `(default)`. Connectez le nouvel utilisateur à `/admin`; son rôle doit lui donner accès à **Produits** et **CSV** uniquement. Les règles Firestore doivent autoriser ce rôle sur `/products` tout en refusant ses lectures de `/admins` autres que son propre document et toutes ses écritures dans `/admins`.

### Révoquer ou modifier un accès

1. Pour retirer les droits administrateur, supprimez `/admins/{UID}` dans la base `(default)` ou changez son rôle vers un rôle moins privilégié approprié. Le navigateur écoute le document de rôle en temps réel; la suppression ferme la session admin et les règles refusent immédiatement les requêtes qui ne sont plus autorisées.
2. Si la personne ne doit plus pouvoir s’authentifier, désactivez aussi son compte dans **Authentication → Users**. La liste du tableau de bord ne peut pas confirmer l’état désactivé du compte Auth.
3. Avant toute révocation, vérifiez qu’un autre compte `super_admin` fonctionnel existe. Ne révoquez pas le dernier accès super-admin.
4. Pour un changement de nom, mettez à jour `displayName` dans le document correspondant. Pour un changement de rôle, modifiez le champ `role` uniquement dans Firebase Console ou via un serveur/Admin SDK de confiance.

Les étapes Console sont des opérations privilégiées et contournent les règles Firestore côté client par l’accès administrateur de la Console. Confirmez le projet, la base et l’UID avant d’enregistrer chaque changement. Aucun utilisateur ni rôle n’est créé par le code de cette interface.

## Tester localement

1. Lancez l’application avec `npm run dev`.
2. Ouvrez `http://localhost:3000/admin`.
3. Connectez-vous avec `chabou.lotfi@gmail.com` et le mot de passe créé dans Firebase Authentication.
4. Confirmez l’ouverture de `/admin/dashboard`, puis déconnectez-vous et vérifiez qu’une ouverture directe du tableau de bord redirige vers `/admin`.
5. Pour tester le refus, utilisez un compte de test authentifié qui n’a pas de document `/admins/{uid}`. Il doit être déconnecté et recevoir un message d’accès refusé.

Les tests locaux ne peuvent pas prouver que Firebase Console, Email/Password, le compte, les règles et le document administrateur sont configurés correctement. Il faut effectuer ces étapes avec le projet réel.

## Catalogue partagé, import CSV et règles déployées

Les produits sont lus depuis `/products` dans Firestore. Le storefront demande les documents `published`; les comptes catalogue autorisés lisent aussi les brouillons et archives. La migration depuis `flx_products_v1` reste manuelle, additive et précédée d’un aperçu. Elle ignore les identifiants déjà présents et ne supprime aucune donnée.

L’export CSV reflète le catalogue Firestore visible dans le tableau d’administration, avec une ligne par variante et ces colonnes : `Product_ID`, `Product_SKU`, `Variant_ID`, `Variant_SKU`, `Categorie`, `Nom_FR`, `Nom_AR`, `Nom_Botanique`, `Origine`, `Conditionnement`, `Prix_DZD`, `Stock`, `Statut`, `Produit_Mis_en_Avant`, `Variante_Active`, `Achat_En_Ligne`, `Suivi_Stock`. Les cellules textuelles sont échappées selon le format CSV standard (guillemets doublés). Les anciens fichiers à neuf colonnes (`SKU`, `Categorie`, `Nom_FR`, `Nom_AR`, `Nom_Botanique`, `Origine`, `Conditionnement`, `Prix_DZD`, `Stock`) restent acceptés pour mettre à jour des variantes dont le SKU existe déjà.

Pour créer un produit, fournissez `Product_ID`, `Product_SKU`, `Variant_SKU`, la catégorie, les noms FR/AR, le conditionnement et un stock entier ≥ 0. `Variant_ID` est conservé depuis l’export ou généré de façon déterministe s’il est vide. Un nouveau produit est créé en `draft` si `Statut` est absent. Les IDs Firestore acceptent lettres, chiffres, `_` et `-` (1 à 128 caractères); les SKU acceptent lettres/chiffres, point, `_` et `-` (1 à 64 caractères). Le prix est un entier DZD ≥ 0; `NULL` efface explicitement un prix, tandis qu’une cellule vide le conserve. Le stock est un entier ≥ 0. Le statut doit être `draft`, `published` ou `archived`; les booléens acceptent `true/false`, `oui/non` ou `1/0`. Une variante sans prix ne peut pas être proposée à l’achat en ligne. Le conditionnement utilise par exemple `10 ml`, `1 L`, `500 g` ou `1 kg`.

Dans **Admin → Import CSV**, l’aperçu compte les créations, mises à jour, éléments inchangés, doublons et erreurs. Vérifiez la liste puis confirmez explicitement. Aucun produit absent du fichier n’est supprimé ou archivé. Chaque document est traité dans sa propre transaction; les créations déjà apparues et les produits modifiés depuis l’aperçu sont ignorés avec un échec explicite. Les opérations réussies restent enregistrées si une autre échoue; réimporter après un nouvel aperçu est sans risque de doublonner les IDs stables. Les cellules vides ne remplacent pas les données existantes. Les URL d’image, descriptions, méthodes d’extraction, spécifications, instructions de stockage et documents qui ne sont pas exportés sont donc conservés pour les produits déjà présents. Un nouveau produit reçoit des descriptions vides et une illustration de catégorie; aucune image n’est téléversée.

Au contrôle en lecture seule du 20 octobre 2026, le release de règles `cloud.firestore` de `floraxionaromatics-e0b00` (base `(default)`) n’est pas identique à `firestore.rules`. La règle déployée de `/products/{productId}` autorise la lecture publique de tous les statuts et les écritures catalogue avec seulement le rôle et un ID de chemin valide. La règle locale limite la lecture publique à `status == 'published'` (les administrateurs catalogue peuvent tout lire) et vérifie que `request.resource.data.id` correspond à l’ID du document lors des créations/mises à jour. Les règles des autres collections comparées correspondaient. L’application filtre déjà les lectures publiques sur `published` et transmet des IDs cohérents dans ses écritures, mais l’API Firestore directe reste moins protégée jusqu’à examen et publication des règles locales. Aucun déploiement n’a été fait.

Java n’est pas disponible dans l’environnement vérifié; l’émulateur Firestore n’a donc pas pu compiler/exécuter ces règles. Après revue explicite des changements, vérifiez le projet et la base, puis déployez les règles locales uniquement avec `firebase deploy --only firestore --project floraxionaromatics-e0b00`. Cette commande n’a pas été exécutée.

## Commandes et devis

Les commandes restent locales dans cette version et le stock Firestore n’est pas décrémenté à la caisse. La création de devis publics est bloquée par les règles. Avant de prendre de vraies commandes ou devis, ajoutez un endpoint serveur qui authentifie ou valide la soumission, relit les prix et disponibilités depuis Firestore, recalcule les montants et écrit la commande; le décrément de stock doit être atomique avec la validation de disponibilité. Ne rendez pas ces collections publiquement inscriptibles pour corriger une erreur de permission.

## Valider et déployer les règles avec Firebase CLI

Le dépôt associe explicitement `firestore.rules` à la base `(default)` dans `firebase.json`. Vérifiez toujours l’ID du projet et confirmez que sa base `(default)` est celle attendue avant le déploiement.

Depuis la racine `H:\Floraxion aromatics website\floraxion-aromatics 2`, après installation/connexion du Firebase CLI et après avoir vérifié le diff :

```powershell
firebase use floraxionaromatics-e0b00
firebase firestore:databases:list --project floraxionaromatics-e0b00
firebase deploy --only firestore --project floraxionaromatics-e0b00
```

La commande de déploiement cible uniquement Firestore et la base `(default)` déclarée dans `firebase.json`. Elle n’a pas été exécutée. Java n’est pas disponible dans l’environnement vérifié, donc l’émulateur n’a pas compilé ni exécuté ces règles. Après installation de Java, validez d’abord avec Firebase Local Emulator Suite et des cas autorisés/refusés pour chaque rôle, puis publiez depuis la racine du projet après revue du diff. La Console Firebase permet également de publier les règles après avoir sélectionné explicitement la base `(default)` dans le projet `floraxionaromatics-e0b00`.
