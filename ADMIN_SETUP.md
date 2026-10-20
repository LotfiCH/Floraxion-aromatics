# Floraxion Aromatics — Guide de Configuration Administrateur

Ce document détaille les instructions officielles et sécurisées pour configurer le premier administrateur autorisé de la plateforme Floraxion Aromatics.

---

## Architecture de Sécurité & Modèle de Confiance

L'accès à l'espace d'administration (`/admin/*`) repose sur une double vérification stricte :
1. **Authentification Réelle (Firebase Auth)** : Vérification de l'e-mail et du mot de passe avec échange de jetons chiffrés.
2. **Autorisation RBAC (Firestore Rules & Collection `admins`)** :
   - Un utilisateur authentifié dans Firebase Auth ne possède **AUCUN** droit d'accès au back-office tant que son identifiant unique (`UID`) n'est pas explicitement inscrit dans la collection Firestore `/admins/{uid}`.
   - Les règles de sécurité Firestore bloquent toutes les écritures directes sur `/admins/{uid}` côté client (`allow write: if false;`).
   - L'auto-attribution de privilèges ou la modification de rôle par un client est mathématiquement impossible.

---

## Méthode 1 : Configuration via la Console Firebase (Recommandée)

### Étape 1 : Activer le fournisseur E-mail / Mot de passe
1. Ouvrez votre [Console Firebase](https://console.firebase.google.com/) et sélectionnez le projet : `impactful-oarlock-jc70r`.
2. Dans le menu de gauche, rendez-vous dans **Build** > **Authentication**.
3. Cliquez sur l'onglet **Sign-in method** (Mode de connexion).
4. Cliquez sur **Adresse e-mail/Mot de passe**, activez le premier commutateur (Activer) et cliquez sur **Enregistrer**.

### Étape 2 : Créer le compte utilisateur administrateur
1. Dans **Authentication**, rendez-vous sur l'onglet **Users** (Utilisateurs).
2. Cliquez sur le bouton **Ajouter un utilisateur** (Add user).
3. Saisissez :
   - **Adresse e-mail** : votre adresse e-mail professionnelle (ex. `direction@floraxion.dz`).
   - **Mot de passe** : un mot de passe robuste (ex. 12+ caractères).
4. Cliquez sur **Ajouter un utilisateur**.
5. **Important :** Copiez la valeur de la colonne **UID utilisateur** (une chaîne alphanumérique comme `V8aB29c...`).

### Étape 3 : Assigner le rôle d'administrateur dans Firestore
1. Dans le menu de gauche de la console Firebase, cliquez sur **Firestore Database**.
2. Cliquez sur **Démarrer une collection** (ou sélectionnez la collection `admins` si elle existe déjà) :
   - **ID de la collection** : `admins`
   - Cliquez sur **Suivant**.
3. Dans la boîte de dialogue d'ajout de document :
   - **ID du document** : collez l'**UID utilisateur** copié à l'étape précédente (très important : l'ID du document doit être exactement l'UID du compte).
   - Ajoutez les champs suivants :
     - `uid` (type : `string`) = votre UID
     - `email` (type : `string`) = `direction@floraxion.dz`
     - `displayName` (type : `string`) = `Nour El Houda (Directrice)`
     - `role` (type : `string`) = `super_admin` (ou `catalogue_manager`, `order_manager`, `sales_manager`)
     - `createdAt` (type : `string`) = date/heure ISO (ex. `2026-10-20T12:00:00Z`)
4. Cliquez sur **Enregistrer**.

---

## Méthode 2 : Provisionnement par Script Serveur (CLI)

Si vous disposez d'un compte de service Firebase (`serviceAccountKey.json`) :

1. Définissez la variable d'environnement :
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/chemin/vers/serviceAccountKey.json"
   ```
2. Exécutez le script d'initialisation :
   ```bash
   npx tsx scripts/setup-admin.ts direction@floraxion.dz "VotreMotDePasse" "Nour El Houda" super_admin
   ```
Le script crée automatiquement le compte dans Firebase Auth et enregistre les privilèges dans `/admins/{uid}`.

---

## Rôles Disponibles

| Rôle | Libellé | Permissions |
| :--- | :--- | :--- |
| `super_admin` | Directrice Générale / Admin Global | Accès total : Catalogue, Commandes, Devis, Tarifs Wilayas, Paramètres, Journal d'Audit. |
| `catalogue_manager` | Responsable Catalogue | Gestion des fiches produits, variantes, stocks, photos et descriptions botaniques. |
| `order_manager` | Gestionnaire Commandes | Validation des règlements, changement des statuts d'expédition. |
| `sales_manager` | Conseiller Commercial B2B | Révision des devis en gros, application de remises et frais d'expédition. |
| `read_only` | Auditeur Externe | Consultation intégrale sans droits de modification. |

---

## Connexion au Back-Office

Une fois le compte configuré :
1. Rendez-vous sur l'URL dédiée : `http://localhost:3000/admin`.
2. Saisissez votre adresse e-mail et votre mot de passe.
3. Cliquez sur **Connexion au Back-Office**.
4. Vous serez redirigé automatiquement vers `/admin/dashboard`.
