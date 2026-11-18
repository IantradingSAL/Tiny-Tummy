---
title: "Tiny Tummy — Cahier des charges"
version: "V1.1"
date: "18/11/2026"
lang: fr
---

# Tiny Tummy — Cahier des charges / Protocole du système

**Version V1.1 — 18/11/2026** · remplace la V1.0 du 28/08/2026

Ce document décrit, en termes simples, **comment la plateforme Tiny Tummy
fonctionne de bout en bout** : le site public, l'Espace famille et le tableau
de bord des opérations — qui fait quoi, où circulent les données et quelles
règles le système applique. Il complète l'aide intégrée (bouton **Ask me** sur
chaque page), qui explique chaque page au fil de l'utilisation.

## Suivi des versions

| Version | Période | Date de mise en service |
|---|---|---|
| V1.0 | version de référence (lancement de la plateforme) | 28/08/2026 |
| V1.1 | 01/11/2026 – 18/11/2026 | 18/11/2026 |

Aucune modification n'a été enregistrée en septembre et octobre 2026.
**Numérotation retenue.** Une version par mois comportant des modifications
(V1.2, V1.3…) ; un nouvel ensemble de modules ouvre une version majeure (V2.0).
Le tableau de bord (Système → *Cahier des charges*) propose toujours la
dernière version ; chaque version antérieure y reste disponible et peut redevenir la
version en vigueur (voir Partie C).

Le détail daté de chaque version est en annexe (**Historique des versions**).
Seules les évolutions durables du système y figurent : les corrections
ponctuelles (une commande, un client, une facture particulière) n'y sont pas
reprises.

---

# Partie A — Ce qui a changé depuis la V1.0 (28/08/2026)

**Site web**

- Nouveau design sur toutes les pages publiques : logo de la marque en
  en-tête et en pied de page, icônes au trait, affichage adapté au téléphone
  (13/11/2026, #5).
- Page d'accueil : section et bouton *Espace famille* (13/11/2026, #7).
- Assistant **Ask me** sur chaque page (d'abord appelé *Aide*) : explique la
  page et répond aux questions, avec WhatsApp en recours (13/11/2026, #8 ;
  renommé le 18/11/2026).
- Un seul numéro de contact partout : +961 70 341 002 (13/11/2026, #10).

**Espace famille (nouveau)**

- Un *carnet de santé* pour chaque enfant, relié à la cuisine : journal
  alimentaire avec ingrédients et lot de fabrication, aliments goûtés, étapes
  de diversification, croissance, album photo, vaccins et notes du médecin
  (13/11/2026, #5).
- Lien privé pour le médecin, par enfant, avec expiration et révocation
  (13/11/2026, #5–#6).
- Thème rose pour une fille, bleu pour un garçon (13/11/2026, #9).

**Tableau de bord des opérations**

- Commandes : tableau par étape (Passée → Livrée), vues kanban et liste ;
  étapes de cuisine attribuées automatiquement à la confirmation
  (13/11/2026, #1).
- Expédition et livraison : livreur le moins occupé proposé, expédition en
  un geste, liste des livreurs (13/11/2026, #2).
- Stock : liste « à traiter » et réapprovisionnement automatique sous le
  minimum (13/11/2026, #3).
- Alerte **STOP** allergie quand une commande contient un allergène de
  l'enfant (13/11/2026, #5).
- Refonte Équipe & Accès ; même design sur toutes les pages du tableau de
  bord (13/11/2026, #1, #4).
- **Cahier des charges** dans le tableau de bord (groupe Système), en
  français et en anglais, version en vigueur et toutes les versions
  antérieures, en cartes ou en liste, pour les personnes qui y ont accès
  (18/11/2026).
- **Ask me** pour le personnel : répond aux questions sur l'activité en cours
  (mes commandes, livrées aujourd'hui, à préparer, un client, un article, un
  numéro de commande) et ouvre la bonne page, commande, fiche client ou
  article (18/11/2026).

**Sécurité / données**

- Données des familles séparées par famille en base ; les données réservées
  au personnel ne sont plus lisibles par un parent connecté (13/11/2026, #6).

---

# Partie B — Le système aujourd'hui (V1.1)

## 1. Ce qu'est le système

Une plateforme à trois visages, servie en pages web statiques ; données,
connexion et stockage des fichiers chez Supabase (Postgres + Auth + Storage) :

- **Site public** — Accueil, Menu, Pourquoi nous, Comment ça marche, Contact.
  Les commandes passent par WhatsApp.
- **Espace famille** — l'espace des parents : le dossier alimentaire et de
  croissance de chaque enfant, partagé avec son médecin.
- **Tableau de bord des opérations** — l'outil du personnel pour toute
  l'activité : commandes, cuisine, recettes, stock, achats, livraison, qualité
  (ISO 22000), réclamations, équipe et accès.

Tant que Supabase n'est pas connecté, le tableau de bord et l'Espace famille
fonctionnent sur des données de démonstration dans le navigateur ; rien n'est
perdu et rien n'est partagé.

## 2. Site public

- **Menu** : purées (dès 6 mois), finger food (dès 7 mois) et gâteaux, avec
  filtres par catégorie. Produits et prix viennent de la base ; si elle est
  injoignable, le catalogue intégré s'affiche. Un produit sans prix n'affiche
  simplement pas de prix.
- **Commande** : par WhatsApp. Commande avant 15 h pour une livraison le
  lendemain, partout au Liban sauf le dimanche.
- Bouton **Ask me** sur chaque page : explique la page et répond aux questions
  courantes ; le reste est renvoyé vers WhatsApp.
- Un lien discret *Tableau de bord* en pied de page ; il est inutilisable sans
  identifiant du personnel.

## 3. Espace famille

- Un parent se connecte (code par téléphone en production) et ne voit **que
  sa propre famille**. Une fiche par enfant : âge, date de naissance,
  allergies, remarques alimentaires, médecin, photo ; thème rose pour une
  fille, bleu pour un garçon.
- **Journal alimentaire** : chaque commande de l'enfant, par mois ; chaque
  produit montre ses ingrédients, la quantité par portion et le **lot de
  fabrication**, avec les alertes allergie.
- **Aliments goûtés** : construits automatiquement à partir des repas livrés,
  avec la date de la première fois.
- **Étapes de diversification** : un message *Bravo !* à 6, 7, 9, 12, 18, 24
  et 36 mois avec ce qu'il faut commencer et les produits adaptés (sans les
  allergènes de l'enfant).
- **Croissance** : poids et taille avec courbes selon l'âge ; album photo
  mensuel (photos compressées dans le navigateur, stockées en privé par
  famille).
- **Vaccins et visites** avec rappels ; **notes du médecin**.
- **Accès médecin** : un lien privé par enfant (copier, WhatsApp, email,
  révoquer). Le médecin consulte le dossier et ajoute notes et vaccins, qui
  deviennent des rappels pour la famille. Le lien est aléatoire, conservé
  uniquement sous forme d'empreinte, expire et peut être révoqué à tout moment
  ; le médecin n'a pas besoin de compte.

## 4. Tableau de bord des opérations — modules

Le menu est regroupé par métier :

| Groupe | Module | Rôle |
|---|---|---|
| — | Vue d'ensemble | La journée sur toute l'activité, conseils, dossiers en attente pour moi |
| Ventes | Commandes | Circuit des commandes, tableau par étape, kanban / liste |
| Ventes | Programmes par âge | Programmes selon l'âge de l'enfant |
| Production | Cuisine | Étapes de production, minuteurs, postes |
| Production | Recettes · BOM | Ingrédients, étapes, coût complet |
| Production | Stock · Lots | Stock par lots, FEFO, péremption, réapprovisionnement |
| Production | Réquisitions | Demandes d'achat |
| Livraison | Expédition · Livreurs | Expédition, carte en direct, heure d'arrivée, livreurs |
| Finances | Fournisseurs · Dettes | Facture fournisseur = entrée en stock, dettes |
| Qualité | ISO 22000 | Liste de contrôle clause par clause avec responsable et preuve |
| Qualité | Réclamations | Registre des avis et réclamations |
| Équipe | Messagerie, Notifications, Journal d'activité, Équipe · Accès | |
| Système | Cahier des charges | Ce document : version en vigueur, FR/EN, toutes les versions antérieures |
| Système | Paramètres | Connexion à la base, données de démonstration |

**Ask me (personnel).** Sur chaque page du tableau de bord, le bouton
**Ask me** répond aux questions sur l'activité en cours et mène l'employé
directement à la réponse, dans les modules autorisés par son rôle :

- *Mes commandes / mes tâches* : les étapes de cuisine, livraisons et
  dossiers attribués à la personne connectée ;
- *Livrées aujourd'hui*, *à préparer* (avec le total par article), *prêtes à
  expédier*, *en route*, *en retard*, *nouvelles commandes*, *commandes du
  jour* ;
- le **nom d'un client** : ses commandes, ses dossiers et son téléphone ; un
  **produit** : les commandes ouvertes qui le contiennent et sa recette ; un
  **ingrédient** : stock et lots (prochain à sortir en premier) ;
- un **numéro de commande ou de dossier** (TT-2026-041, 041, CF-2026-002)
  l'ouvre.

Chaque commande, client, recette ou ingrédient de la réponse est un lien.

## 5. De la commande à la porte

1. **Commande** (site / WhatsApp) → confirmée par l'équipe. La commande
   indique pour quel enfant elle est. Si elle contient un allergène de cet
   enfant, une alerte rouge **STOP** s'affiche sur la commande et sur la fiche
   cuisine.
2. **Cuisine** : dès la confirmation, les étapes sont **attribuées
   automatiquement** aux personnes qui tiennent le bon poste (rôle cuisine
   d'abord, les moins chargées et les plus spécialisées d'abord). Un
   responsable peut modifier ou rééquilibrer.
3. L'entrée en cuisine **sort le stock en FEFO** (premier périmé, premier
   sorti) selon les lignes d'ingrédients de la recette, lot par lot, avec
   trace.
4. **Points de contrôle qualité** (voir §7), portionnement, CQ final ; une
   **étiquette de lot** (ex. B-2026-040-0828) est imprimée sur la commande.
5. **Expédition** : le livreur de service le moins occupé est proposé ; un
   geste envoie la commande. Le client est prévenu avec une heure d'arrivée
   calculée sur la distance routière.
6. **En route** : carte en direct, avis *bientôt chez vous* ; un retard
   signalé par le livreur ou détecté automatiquement envoie au client une
   nouvelle heure d'arrivée.
7. **Livrée** : confirmation horodatée. Chaque étape est horodatée.

## 6. Recettes, stock et achats

- **Recette (BOM)** : lignes d'ingrédients (quantité par portion dans l'unité
  de la cuisine, convertie dans l'unité de stock), étapes (minutes prévues,
  poste, taux horaire) et **coût complet** (matières + main-d'œuvre) par
  portion et par lot, avec marge et % coût matière signalé au-dessus de
  l'objectif.
- **Le stock est un ensemble de lots** : chaque lot a sa quantité, sa date de
  péremption, son emplacement et son coût d'achat. Le prélèvement prend
  toujours le lot qui périme le premier.
- **Facture fournisseur = réception** : chaque ligne de facture (article,
  quantité, coût, lot, péremption) devient un lot. Les dettes vieillissent
  de façon visible jusqu'à leur paiement.
- **À traiter** : lots proches de la péremption ou périmés (mise au rebut,
  motif obligatoire) et articles sous le minimum. Les articles en
  *réapprovisionnement automatique* reçoivent une réquisition automatiquement,
  calculée pour remonter au maximum.

## 7. Sécurité des aliments — ISO 22000 / HACCP

| Point | Contrôle | Limite | En cas d'échec |
|---|---|---|---|
| Cuisson (CCP) | Température à cœur | ≥ 85 °C | L'étape ne se ferme pas ; échec tracé, responsable alerté |
| Refroidissement rapide (CCP) | Température en moins de 90 min | ≤ 5 °C | L'étape reste ouverte ; écart enregistré |
| Portionnement | Portions et poids moyen vs objectif | ± 5 % | Enregistré ; hors tolérance, le responsable est alerté |
| CQ final | Étiquette vs commande, scellé, poids, chaîne du froid | Conforme | Rien ne part sans la signature CQ |

- Chaque étape a un temps prévu ; s'il est dépassé, l'alarme sonne en cuisine
  et l'étape passe au rouge.
- Le module **ISO 22000** contient la liste de contrôle clause par clause (du
  contexte à l'amélioration, PRP, chaîne HACCP) avec statut, responsable et
  preuve, et une barre de préparation revue chaque mois. Un exercice de
  traçabilité (commande livrée → chaque lot d'ingrédient) a lieu deux fois
  par an.
- **Traçabilité dans les deux sens** : toute réclamation retrouve ses
  ingrédients ; tout lot fournisseur retrouve ses clients.

## 8. Réclamations et avis des clients

- Chaque message devient un dossier numéroté (CF-AAAA-NNN) avec catégorie,
  priorité jusqu'à *critique*, responsable, date de suivi et statut :
  nouveau → en cours → escaladé → résolu.
- Les dossiers ouverts accueillent leur responsable à l'ouverture du tableau
  de bord. Un dossier peut être transmis à une personne ou à un rôle avec une
  note ; la transmission est tracée.
- Une réclamation qualité est reliée à la commande et à son lot.

## 9. Personnes, rôles et accès

- L'accès suit une clé par fonction, résolue personne → rôle → super
  administrateur, et est appliqué en base (sécurité au niveau des lignes),
  pas seulement à l'écran.
- **Postes de cuisine** : préparation, cuisson, assemblage, portionnement,
  refroidissement, conditionnement, CQ. Une personne ne peut lancer que les
  étapes des postes qu'elle détient.
- Un super administrateur peut travailler *en tant que* autre utilisateur ;
  les deux identités sont tracées.

## 10. Traçabilité de chaque action

- Chaque objet (commande, dossier, facture, réquisition, lot) porte son
  propre historique : qui a fait quoi, et quand.
- Le **Journal d'activité** liste toutes les actions de la plateforme, par
  utilisateur et par module, avec date et heure — filtrable, consultable,
  exportable, sans suppression possible.

## 11. Notifications et alertes famille

- Le client est prévenu à chaque étape de la livraison (départ de la cuisine,
  bientôt chez vous, retard, livrée), avec suivi envoyé / reçu / ouvert dans
  le journal des notifications.
- Anniversaire : le responsable est alerté pour envoyer un cupcake sans
  allergène ; les messages d'anniversaire, d'étape et de vaccin partent vers
  la famille une seule fois chacun.

---

# Partie C — Ce document : versions, téléchargement et retour arrière

- La source de chaque langue est un fichier texte dans `cahier/` du dépôt du
  site. Une **génération** le transforme en PDF et Word, archive cette version
  dans `cahier/versions/<version>/` et l'inscrit dans `cahier/versions.json`.
- La page du tableau de bord **Système → Cahier des charges** propose
  toujours la version *en vigueur* (français et anglais, PDF et Word) à une
  adresse fixe : un téléchargement est donc toujours à jour. Elle liste toutes
  les versions avec leur statut (*En vigueur* / *Archivée*) et leur période,
  en cartes ou en liste. Elle n'est pas sur le site public.
- L'accès est un droit comme tout module (*Cahier des charges* dans
  Équipe · Accès), par rôle ou par personne ; les responsables l'ont par
  défaut.
- **Retour arrière** : toute version antérieure peut redevenir la version en
  vigueur (GitHub → Actions → *Cahier des charges — rollback*, ou
  `node tools/cahier.mjs rollback V1.0`). Rien n'est supprimé : la version plus
  récente reste dans la liste et peut être rétablie de la même façon.
- Toute évolution du fonctionnement du système met à jour ce document (dans
  les deux langues) dans la même modification : Partie B, une ligne en
  Partie A si elle est notable, et une ligne datée en annexe.

---

# Annexe — Historique des versions

### V1.1 — du 01/11/2026 au 18/11/2026 (mise en service le 18/11/2026)

- Tableau de bord : refonte Équipe & Accès (cartes de rôles, interrupteurs de droits, icônes au trait) ; tableau des commandes par étape avec vues kanban et liste ; étapes de cuisine attribuées automatiquement à la confirmation (13/11/2026, #1).
- Expédition et livraison : indicateurs, livreur le moins occupé proposé, expédition en un geste, cartes « en route » avec heure d'arrivée et retard, liste des livreurs (13/11/2026, #2).
- Stock : fiches articles, liste « à traiter », réapprovisionnement automatique sous le minimum, registre des lots FEFO (13/11/2026, #3).
- Même design sur toutes les pages du tableau de bord ; recettes en fiches dépliables avec coût et marge ; avancement ISO 22000 par clause (13/11/2026, #4).
- Refonte du site avec logo sur chaque page ; création de l'Espace famille (journal alimentaire, aliments goûtés, étapes de diversification, croissance, album, vaccins, lien médecin) ; alerte STOP allergie dans les commandes et en cuisine ; alertes anniversaire et étapes (13/11/2026, #5).
- Base de données : tables de l'Espace famille avec confidentialité par famille, accès médecin par jeton, stockage privé des photos ; données du personnel fermées aux parents (13/11/2026, #6).
- Page d'accueil : section Espace famille et bouton dans l'en-tête (13/11/2026, #7).
- Assistant Aide sur chaque page (13/11/2026, #8).
- Espace famille : thème rose pour une fille, bleu pour un garçon (13/11/2026, #9).
- Un seul numéro de contact partout : +961 70 341 002 (13/11/2026, #10).
- Cahier des charges en français et en anglais, avec toutes les versions précédentes et retour arrière (18/11/2026).
- Le bouton Aide devient **Ask me** sur toutes les pages (18/11/2026).
- Ask me pour le personnel : mes commandes, livrées aujourd'hui, à préparer, prêtes / en route / en retard, un client, un produit, un ingrédient ou un numéro de commande — avec des liens qui ouvrent la page, la commande, la fiche client ou l'article (18/11/2026).
- Le cahier des charges quitte la page d'accueil publique pour le tableau de bord (Système → Cahier des charges), avec son propre droit d'accès, vues cartes et liste (18/11/2026).

### V1.0 — 28/08/2026 (lancement de la plateforme)

- Site de la marque (Accueil, Menu, Pourquoi nous, Comment ça marche, Contact) avec commande par WhatsApp (28/08/2026).
- Tableau de bord des opérations : circuit des commandes, cuisine avec points HACCP, recettes · BOM avec coût complet, stock par lots en FEFO, réquisitions, fournisseurs et dettes, expédition avec heure d'arrivée, liste ISO 22000, registre des réclamations, messagerie, notifications, utilisateurs et droits (28/08/2026).
- Journal de toutes les actions avec date et heure ; rapport de projet *The Tiny Tummy Standard* (28/08/2026).
- Lien discret vers le tableau de bord en pied de page du site (28/08/2026).

---

*Pour le détail de chaque écran, ouvrir la page et cliquer sur **Ask me** :
l'aide intégrée reste la référence.*
