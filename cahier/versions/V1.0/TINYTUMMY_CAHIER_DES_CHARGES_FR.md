---
title: "Tiny Tummy — Cahier des charges"
version: "V1.0"
date: "28/08/2026"
lang: fr
---

# Tiny Tummy — Cahier des charges / Protocole du système

**Version V1.0 — 28/08/2026** · version de référence

Ce document décrit, en termes simples, **comment la plateforme Tiny Tummy
fonctionne de bout en bout** : le site public et le tableau de bord des
opérations — qui fait quoi, où circulent les données et quelles
règles le système applique. 

## Suivi des versions

| Version | Période | Date de mise en service |
|---|---|---|
| V1.0 | version de référence (lancement de la plateforme) | 28/08/2026 |

**Numérotation retenue.** Une version par mois comportant des modifications
(V1.2, V1.3…) ; un nouvel ensemble de modules ouvre une version majeure (V2.0).
La page d'accueil propose toujours la dernière version ; chaque version
antérieure y reste disponible (**Versions précédentes**) et peut redevenir la
version en vigueur (voir Partie C).

Le détail daté de chaque version est en annexe (**Historique des versions**).
Seules les évolutions durables du système y figurent : les corrections
ponctuelles (une commande, un client, une facture particulière) n'y sont pas
reprises.

---

# Partie B — Le système aujourd'hui (V1.0)

## 1. Ce qu'est le système

Une plateforme à deux visages, servie en pages web statiques ; données,
connexion et stockage des fichiers chez Supabase (Postgres + Auth + Storage) :

- **Site public** — Accueil, Menu, Pourquoi nous, Comment ça marche, Contact.
  Les commandes passent par WhatsApp.
- **Tableau de bord des opérations** — l'outil du personnel pour toute
  l'activité : commandes, cuisine, recettes, stock, achats, livraison, qualité
  (ISO 22000), réclamations, équipe et accès.

Tant que Supabase n'est pas connecté, le tableau de bord fonctionne sur des données de démonstration dans le navigateur ; rien n'est
perdu et rien n'est partagé.

## 2. Site public

- **Menu** : purées (dès 6 mois), finger food (dès 7 mois) et gâteaux, avec
  filtres par catégorie. Produits et prix viennent de la base ; si elle est
  injoignable, le catalogue intégré s'affiche. Un produit sans prix n'affiche
  simplement pas de prix.
- **Commande** : par WhatsApp. Commande avant 15 h pour une livraison le
  lendemain, partout au Liban sauf le dimanche.
- Un lien discret *Tableau de bord* en pied de page ; il est inutilisable sans
  identifiant du personnel.

## 3. Tableau de bord des opérations — modules

Le menu est regroupé par métier :

| Groupe | Module | Rôle |
|---|---|---|
| — | Vue d'ensemble | La journée sur toute l'activité, conseils, dossiers en attente pour moi |
| Ventes | Commandes | Circuit des commandes, tableau par étape, kanban / liste |
| Ventes | Programmes par âge | Programmes selon l'âge de l'enfant |
| Production | Cuisine | Étapes de production, minuteurs, postes |
| Production | Recettes · BOM | Ingrédients, étapes, coût complet |
| Production | Stock · Lots | Stock par lots, FEFO, péremption |
| Production | Réquisitions | Demandes d'achat |
| Livraison | Expédition · Livreurs | Expédition, carte en direct, heure d'arrivée, livreurs |
| Finances | Fournisseurs · Dettes | Facture fournisseur = entrée en stock, dettes |
| Qualité | ISO 22000 | Liste de contrôle clause par clause avec responsable et preuve |
| Qualité | Réclamations | Registre des avis et réclamations |
| Équipe | Messagerie, Notifications, Journal d'activité, Équipe · Accès, Paramètres | |

## 4. De la commande à la porte

1. **Commande** (site / WhatsApp) → confirmée par l'équipe.
2. **Cuisine** : les étapes sont attribuées aux personnes qui tiennent le bon
   poste ; un bouton *Attribution auto* les répartit sur les moins chargées.
3. L'entrée en cuisine **sort le stock en FEFO** (premier périmé, premier
   sorti) selon les lignes d'ingrédients de la recette, lot par lot, avec
   trace.
4. **Points de contrôle qualité** (voir §6), portionnement, CQ final ; une
   **étiquette de lot** (ex. B-2026-040-0828) est imprimée sur la commande.
5. **Expédition** : le responsable choisit un livreur et expédie la commande. Le client est prévenu avec une heure d'arrivée
   calculée sur la distance routière.
6. **En route** : carte en direct, avis *bientôt chez vous* ; un retard
   signalé par le livreur ou détecté automatiquement envoie au client une
   nouvelle heure d'arrivée.
7. **Livrée** : confirmation horodatée. Chaque étape est horodatée.

## 5. Recettes, stock et achats

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
  *réapprovisionnement automatique* reçoivent une réquisition quand une
  commande fait passer le stock sous le minimum.

## 6. Sécurité des aliments — ISO 22000 / HACCP

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

## 7. Réclamations et avis des clients

- Chaque message devient un dossier numéroté (CF-AAAA-NNN) avec catégorie,
  priorité jusqu'à *critique*, responsable, date de suivi et statut :
  nouveau → en cours → escaladé → résolu.
- Les dossiers ouverts accueillent leur responsable à l'ouverture du tableau
  de bord. Un dossier peut être transmis à une personne ou à un rôle avec une
  note ; la transmission est tracée.
- Une réclamation qualité est reliée à la commande et à son lot.

## 8. Personnes, rôles et accès

- L'accès suit une clé par fonction, résolue personne → rôle → super
  administrateur, et est appliqué en base (sécurité au niveau des lignes),
  pas seulement à l'écran.
- **Postes de cuisine** : préparation, cuisson, assemblage, portionnement,
  refroidissement, conditionnement, CQ. Une personne ne peut lancer que les
  étapes des postes qu'elle détient.
- Un super administrateur peut travailler *en tant que* autre utilisateur ;
  les deux identités sont tracées.

## 9. Traçabilité de chaque action

- Chaque objet (commande, dossier, facture, réquisition, lot) porte son
  propre historique : qui a fait quoi, et quand.
- Le **Journal d'activité** liste toutes les actions de la plateforme, par
  utilisateur et par module, avec date et heure — filtrable, consultable,
  exportable, sans suppression possible.

## 10. Notifications

- Le client est prévenu à chaque étape de la livraison (départ de la cuisine,
  bientôt chez vous, retard, livrée), avec suivi envoyé / reçu / ouvert dans
  le journal des notifications.

---

# Partie C — Ce document : versions, téléchargement et retour arrière

- La source de chaque langue est un fichier texte dans `cahier/` du dépôt du
  site. Une **génération** le transforme en PDF et Word, archive cette version
  dans `cahier/versions/<version>/` et l'inscrit dans `cahier/versions.json`.
- La **page d'accueil** propose toujours la version *en vigueur* (français et
  anglais, PDF et Word) à une adresse fixe : un téléchargement est donc
  toujours à jour. Toutes les autres versions restent listées sous
  **Versions précédentes**.
- **Retour arrière** : toute version antérieure peut redevenir la version en
  vigueur (GitHub → Actions → *Cahier des charges — rollback*, ou
  `node tools/cahier.mjs rollback V1.0`). Rien n'est supprimé : la version plus
  récente reste dans la liste et peut être rétablie de la même façon.
- Toute évolution du fonctionnement du système met à jour ce document (dans
  les deux langues) dans la même modification : Partie B, une ligne en
  Partie A si elle est notable, et une ligne datée en annexe.

---

# Annexe — Historique des versions

### V1.0 — 28/08/2026 (lancement de la plateforme)

- Site de la marque (Accueil, Menu, Pourquoi nous, Comment ça marche, Contact) avec commande par WhatsApp (28/08/2026).
- Tableau de bord des opérations : circuit des commandes, cuisine avec points HACCP, recettes · BOM avec coût complet, stock par lots en FEFO, réquisitions, fournisseurs et dettes, expédition avec heure d'arrivée, liste ISO 22000, registre des réclamations, messagerie, notifications, utilisateurs et droits (28/08/2026).
- Journal de toutes les actions avec date et heure ; rapport de projet *The Tiny Tummy Standard* (28/08/2026).
- Lien discret vers le tableau de bord en pied de page du site (28/08/2026).

---

*Pour le détail de chaque écran, ouvrir la page concernée dans le tableau de bord.*
