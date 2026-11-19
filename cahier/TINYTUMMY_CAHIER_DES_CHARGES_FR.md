---
title: "Tiny Tummy — Cahier des charges"
version: "V1.2"
date: "18/11/2026"
lang: fr
---

# Tiny Tummy — Cahier des charges / Protocole du système

**Version V1.2 — 18/11/2026** · remplace la V1.1 du 18/11/2026

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
| V1.2 | 18/11/2026 — outils de travail du tableau de bord, traçabilité complète, scan des factures, fiche fournisseur, rôles et accès aux pages, RGPD pour les noms des enfants | 18/11/2026 |

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

**Nouveau en V1.2 — travailler dans le tableau de bord**

- **Chaque clic est enregistré** : chaque clic, chaque champ modifié et
  chaque page ouverte est inscrit au Journal d'activité avec la personne, la
  date et l'heure (18/11/2026).
- **Une vue Liste et des filtres sur chaque page**, avec colonnes triables,
  nombre de lignes et export CSV ; davantage de filtres sur le Stock
  (18/11/2026).
- **Vues enregistrées** : toute combinaison de filtres peut être nommée,
  réappliquée en un clic et devenir la vue par défaut de sa page (18/11/2026).
- **Page d'accueil personnelle** : chacun choisit la page sur laquelle
  s'ouvre le tableau de bord (18/11/2026).
- **Menu** réorganisé : groupes repliables, favoris par personne, *Trouver
  une page* (Ctrl K), seulement les pages auxquelles la personne a accès
  (18/11/2026).

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
- Stock : **journal des mouvements** (reçu, utilisé par une commande,
  inventaire ±, mis au rebut) avec date, lot, commande, personne et coût ;
  vue **Liste** avec saisie des comptages, et **Rapport** de consommation
  par article, commande, personne, jour ou mois (18/11/2026).
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

**Nouveau en V1.2 — réception, fournisseurs, accès (18/11/2026, #11)**

- **Scanner la facture du fournisseur** à l'arrivée des marchandises (photo
  ou PDF) : le formulaire de facture se remplit seul — fournisseur, numéro,
  dates, chaque ligne avec quantité, coût, lot et péremption — et la
  validation met tout en stock.
- **Plusieurs lignes d'un coup** : un seul numéro de facture pour tous ses
  articles, saisis dans un tableau ou collés depuis Excel ou une liste ;
  articles choisis dans une liste déroulante des articles existants, pour ne
  jamais créer deux fois le même article (*Carot* est reçu comme *Carrots*) ;
  un article vraiment nouveau est créé après confirmation.
- **Emplacement de rangement rempli automatiquement** pour chaque lot reçu.
- **Une fiche par fournisseur** : relevé de compte avec solde progressif,
  paiements (aussi partiels), factures, articles fournis avec évolution des
  prix, coordonnées, ancienneté du solde ; relevé imprimable.
- **Équipe & accès** : création de rôles ; accès à chaque page par rôle et
  par personne (les nouvelles pages apparaissent automatiquement) ;
  permissions par personne.

**Sécurité / données**

- Données des familles séparées par famille en base ; les données réservées
  au personnel ne sont plus lisibles par un parent connecté (13/11/2026, #6).
- **Noms des enfants (RGPD)** : visibles seulement par les personnes ayant
  l'accès *et* ayant signé l'engagement de confidentialité ; les autres
  voient un code ; les allergies restent visibles pour la sécurité des
  aliments (18/11/2026, #11).

---

# Partie B — Le système aujourd'hui (V1.2)

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
| Ventes | Commandes | Circuit des commandes : étapes, vue Tableau et vue Liste (recherche, période, livreur, tri ; client, enfant et STOP allergie, articles, étape, avancement cuisine, lot, livreur et heure d'arrivée, valeur, coût, marge ; totaux ; CSV ; lien vers le stock utilisé par la commande) |
| Ventes | Programmes par âge | Programmes selon l'âge de l'enfant |
| Production | Cuisine | Vue Tableau (comme le tableau des Commandes, un rail de bons : une colonne par poste dans l'ordre du process — Préparation, Cuisson, Assemblage, Portionnement, Refroidissement, Emballage, CQ — avec les minutes en attente ; chaque commande est un bon dans la colonne de son étape en cours, numéroté par ordre d'arrivée pour être passé un par un ; le bon montre la tâche en cours avec sa personne, son minuteur, Démarrer / Terminé / Reporter, puis les étapes à venir avec personne et minutes, l'avancement et le bouton d'étape suivante), vue Bons (le rail du restaurant : les mêmes bons côte à côte de gauche à droite par ordre d'arrivée, un par commande, chacun sous son poste en cours), vue Détail (un panneau complet par commande : chronologie, horloges, relevés CCP) et vue Liste (une ligne par étape de chaque commande en production : commande et articles, STOP allergie, étape et CCP, poste, personne, minutes prévues, statut et minuteur ; filtres à faire / en cours / en retard / faites, personne ou *mes étapes*, poste ; Démarrer, Terminé et Annuler sur la ligne ; totaux : étapes, en cours, en retard, minutes restantes) |
| Production | Recettes · BOM | Ingrédients, étapes, coût complet |
| Production | Stock · Lots | Stock par lots, FEFO, péremption, réapprovisionnement |
| Production | Réquisitions | Demandes d'achat |
| Livraison | Expédition · Livreurs | Vue Tableau (cartes prêtes / en route, carte en direct, livreurs) et vue Liste (chaque livraison : statut, livreur, adresse et distance, heures prête / départ / arrivée prévue / livrée, minutes de route, à l'heure ou en retard ; filtres statut, période, livreur ; expédier, position, retard et livrée depuis la ligne ; totaux : km, temps moyen, % à l'heure ; CSV) |
| Finances | Fournisseurs · Dettes | Facture fournisseur = entrée en stock (scannée ou saisie), dettes ; une fiche par fournisseur (relevé, paiements, factures, articles, coordonnées) |
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

## 4 bis. Travailler dans le tableau de bord

- **Menu.** Regroupé par métier — Ventes ; Cuisine & stock ; Livraison ;
  Argent ; Qualité ; Équipe ; Système — avec la Vue d'ensemble en tête. Les
  groupes se replient ; le groupe de la page en cours reste ouvert, les autres
  gardent l'état laissé par chaque personne. Chacun marque ses **favoris**
  d'une étoile, affichés en haut (par défaut ceux de son rôle). **Trouver une
  page** (Ctrl K, Entrée ouvre le premier résultat) cherche dans les noms des
  pages et leurs mots usuels (ex. *livraison*, *stock*). Seules les pages
  auxquelles la personne a accès sont listées.
- **Des listes partout.** Chaque page qui affiche des enregistrements propose
  une vue **Liste** à côté de ses cartes ou de son tableau (Commandes,
  Cuisine, Livraison, Stock, Recettes, Programmes par âge, ISO 22000,
  Équipe), et les pages qui sont des listes par nature (Réquisitions,
  Fournisseurs, Notifications, Journal d'activité, Réclamations) ont les mêmes
  outils : recherche, filtres, colonnes triées d'un clic sur leur titre,
  nombre de lignes affichées, totaux quand ils ont un sens et export **CSV**
  de exactement ce qui est à l'écran.
- **Filtres du stock** : catégorie, emplacement, niveau de stock (OK, sous le
  minimum, au-dessus du maximum, lot qui périme sous 7 jours, rupture) et
  réapprovisionnement automatique oui/non, sur les vues Cartes, Liste et Lots.
- **Vues enregistrées.** Sur chaque page avec filtres, *Enregistrer la vue*
  garde les filtres, la recherche et la disposition sous un nom ; la liste
  des vues en réapplique une en un clic ; l'étoile en fait la **vue par
  défaut** de la page, appliquée à son ouverture ; une vue peut être
  supprimée. Les vues appartiennent à chaque personne.
- **Page d'accueil.** *Définir comme page d'accueil*, en haut de chaque page,
  en fait la page sur laquelle s'ouvre le tableau de bord pour cette personne
  (un lien qui désigne une page ouvre toujours cette page). Un nouveau clic
  revient à la Vue d'ensemble.

## 5. De la commande à la porte

1. **Commande** (site / WhatsApp) → confirmée par l'équipe. La commande
   indique pour quel enfant elle est. Si elle contient un allergène de cet
   enfant, une alerte rouge **STOP** s'affiche sur la commande et sur la fiche
   cuisine.
2. **Cuisine** : dès la confirmation, les étapes sont **attribuées
   automatiquement** aux personnes qui tiennent le bon poste (rôle cuisine
   d'abord, les moins chargées et les plus spécialisées d'abord). Un
   responsable peut modifier ou rééquilibrer.
   Les commandes confirmées attendent dans **Cuisine → En attente d'envoi en
   cuisine** jusqu'au clic sur **Envoyer en cuisine**, là ou sur la commande.
   **Contrôle du stock.** À la prise de commande et à la confirmation, les
   quantités de la recette sont comparées au stock (lots non périmés, moins ce
   que demandent les commandes confirmées avant). S'il manque quelque chose,
   une réquisition d'achat s'ouvre automatiquement pour la quantité manquante
   (marquée *pour* la commande), la commande affiche *En attente de stock*
   avec ce qui manque, et **l'envoi en cuisine est bloqué** ; seul un super
   administrateur peut l'envoyer quand même (tracé). Un clic sur Envoyer en
   cuisine alors que le stock manque ouvre la page **Réquisitions** sur cette
   commande : un bandeau avec ce qui manque, ses réquisitions en tête et
   surlignées, prêtes à approuver et à réceptionner (une personne sans accès
   aux Réquisitions reçoit seulement le message). À la réception du stock,
   la commande est libérée d'elle-même et la cuisine est prévenue.
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
   **Contrôle à la livraison** : *Livrée* ouvre un contrôle avec boutons OK /
   Not OK — bon client et bonne adresse, emballages intacts et scellés,
   étiquettes de lot sur chaque emballage, glacière encore froide, conseils
   de conservation donnés — plus la température à la porte (limite ≤ 8 °C)
   et le nom de la personne qui a reçu la commande. La signature reste
   verrouillée tant que tout n'est pas rempli ; la commande est alors livrée.
   Un Not OK ou une température au-dessus de la limite est enregistré comme
   *Contrôle de livraison non conforme* avec les motifs, et le responsable
   est alerté.
   **Preuve de livraison** : une photo de la commande à la porte (appareil
   photo du téléphone, compressée sur l'appareil) et la **signature du
   client** à l'écran, sous la déclaration *« En signant, je déclare avoir reçu
   la commande TT-… — articles — complète, scellée et en bon état, à la bonne
   température »*, sont toutes deux exigées. Si le client est absent, *Client
   absent* remplace la signature (photo toujours exigée). Photo, signature et
   déclaration sont conservées avec la commande (*Preuve de livraison* dans la
   fenêtre de la commande et la liste Livraison).
   **Export** : *Export proofs of delivery* (Expédition · Livreurs) télécharge
   un fichier HTML avec, pour chaque commande livrée, les contrôles, la
   température, la personne qui a reçu, le résultat CQ, la photo, la
   déclaration et la signature — il s'ouvre dans tout navigateur, s'imprime
   ou s'enregistre en PDF et peut être classé n'importe où ; *Download this
   proof* fait de même pour une commande. Tant que la base n'est pas
   connectée, les preuves restent sur l'appareil qui les a prises : il faut
   donc les exporter régulièrement.

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
  quantité, coût, lot, péremption, emplacement de rangement) devient un lot.
  Les dettes vieillissent de façon visible jusqu'à leur paiement.
- **Scanner la facture** (Stock, Fournisseurs, Recevoir du stock — *Scan
  supplier invoice*) : une photo ou le PDF du fournisseur est lu sur
  l'appareil (texte du PDF, sinon reconnaissance de texte, anglais et
  français). Le formulaire de facture s'ouvre rempli : fournisseur (par nom
  ou téléphone), numéro, date de facture, échéance (ou date + délai du
  fournisseur), et une ligne par article avec quantité, coût unitaire, lot
  et péremption ; les unités sont converties dans celle de l'article (g →
  kg, douzaine → pièces) et une virgule perdue est corrigée à partir du
  total de la ligne. La personne vérifie — le texte lu est affiché sous
  chaque ligne, le total des lignes est comparé au total de la facture, un
  numéro de facture déjà saisi est signalé — puis valide. Le scan reste sur
  la facture ; l'article choisi pour un libellé imprimé est retenu pour ce
  fournisseur.
- **Saisir beaucoup de lignes** : le formulaire de facture est un tableau —
  un numéro de facture, autant de lignes que nécessaire (*+ 10 lines*), ou
  *Paste many lines* depuis Excel (article, qté, unité, coût unitaire, lot,
  péremption, emplacement) ou une liste tapée.
- **Pas d'articles en double** : l'article d'une ligne se choisit dans une
  liste déroulante des articles en stock, ou *Nouvel article*. Un nom proche
  d'un article existant (orthographe, pluriel, nom français : *Carot*,
  *Courgettes*) est reçu sur l'article existant ; un article vraiment
  nouveau n'est créé qu'après confirmation, une seule fois même s'il est
  écrit de deux façons dans la même facture. *New item* dans le Stock
  prévient de la même façon.
- **Emplacement de rangement** : rempli automatiquement pour chaque lot — là
  où l'article a été rangé la dernière fois, sinon selon sa catégorie
  (légumes et fruits Fridge A, produits laitiers Fridge B, épicerie sèche
  Dry store) — et modifiable sur la ligne. Péremption vide : la durée de
  conservation habituelle de l'article.
- **Fiche fournisseur** (clic sur un fournisseur) : solde dû, en retard,
  facturé sur 12 mois, payé, délai moyen de paiement, dernière livraison,
  ancienneté du solde (non échu, 1–30, 31–60, 61–90, plus de 90 jours).
  Onglets : *Relevé* (solde d'ouverture, factures, paiements, solde
  progressif, période avec solde reporté, CSV, relevé imprimable / PDF),
  *Factures* (payé, reste à payer, partiellement payée, en retard, scan),
  *Paiements* (date, montant, mode — virement, espèces, chèque, OMT /
  Whish… — référence, factures réglées ; annulables), *Articles fournis*
  (quantité, dépense, dernier prix et évolution), *Coordonnées* (contact,
  adresse, n° TVA / MOF, banque, délai, solde d'ouverture, agrément ISO et
  date du certificat, notes). Un paiement règle d'abord les factures les
  plus anciennes ou celle choisie ; *Mark paid* et *Unpay* dans la liste
  des factures gardent le relevé équilibré.
- **Journal des mouvements** : chaque mouvement est une ligne — *Reçu*
  (réception ou facture fournisseur), *Utilisé* (sorti pour une commande en
  FEFO, avec le numéro de commande et la personne qui l'a envoyée en
  cuisine), *Inventaire +/−* (comptage physique) et *Mis au rebut* (avec son
  motif) — avec date et heure, lot, quantité, coût unitaire, valeur,
  commande ou référence, auteur et note. Le stock peut être reconstitué à
  partir de lui. Filtres : article, mouvement, commande, personne, dates
  (aujourd'hui, 7 / 30 jours) ; totaux par type ; export CSV.
- Vues du stock : **Cartes**, **Liste** (une ligne par article : stock face
  au min/max, utilisé sur 7 jours, prochain lot à sortir, valeur, statut,
  réapprovisionnement automatique, et une case **Comptage** : la quantité
  saisie est comparée au système et l'écart est inscrit au journal, pris sur
  le lot qui périme en premier ou ajouté au plus récent), **Lots (FEFO)**,
  **Journal** et **Rapport** (le journal additionné par article, commande,
  personne, jour ou mois : reçu, utilisé, inventaire ±, mis au rebut, coût
  d'utilisation ; chaque ligne ouvre ses mouvements).
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
| CQ final | Formulaire CQ : étiquette vs commande, étiquette de lot sur chaque emballage, scellés, aspect/odeur/texture, allergies de l'enfant, emballage et glacière ; pesée d'échantillon ; température du produit | Tous les points OK · poids ± 5 % de la portion de la recette · ≤ 5 °C | La commande reste au CQ, motifs dans l'historique, responsable alerté ; rien ne part sans un CQ CONFORME signé |

- **Les minuteurs démarrent seuls.** Quand une commande est envoyée en
  cuisine, sa première étape démarre ; quand une étape est terminée, la
  suivante démarre, chacune avec ses minutes prévues et un compte à rebours
  en direct. Quand toutes les étapes sont faites, la commande passe seule au
  CQ ; la validation CQ reste une signature.
- **Alarme.** Une étape qui dépasse son temps passe au rouge, l'alarme sonne et
  un bandeau *Over time* indique la commande, l'étape et la personne, avec
  **Snooze 5 min** (reporter 5 minutes), **Done** et **Open**. L'alarme
  revient toutes les 30 secondes jusqu'à ce que l'étape soit terminée ou
  reportée ; un report la coupe 5 minutes, puis elle sonne de nouveau si
  l'étape est toujours ouverte. Alarmes et reports vont à l'historique de la
  commande et au Journal d'activité.
- **Formulaire CQ et étiquettes.** *Done* sur l'étape CQ, ou *QC check* sur la
  commande, ouvre le formulaire CQ (seulement quand toutes les autres étapes
  sont faites). Il montre le lot, si les étiquettes ont été imprimées et les
  allergies de l'enfant (un STOP si la commande en contient une). Chaque point est
  validé en appuyant sur son bouton **OK** (ou **Not OK**). Les contrôles de la
  commande viennent d'abord ; puis **chaque produit** de la commande a son
  bloc : pesée comparée aux grammes et à la tolérance de sa recette,
  température comparée à la limite de sa recette (affichées en vert ou rouge
  à la saisie) et les contrôles propres à la recette. **Sign QC** reste
  verrouillé tant qu'un point n'est pas validé ou qu'une mesure manque ; le
  contrôleur signe alors : CONFORME clôt l'étape CQ et rend la commande prête à
  expédier ; NON CONFORME la garde au CQ avec les motifs. Chaque contrôle est
  conservé avec ses réponses, valeurs, personne et heure.
- **CQ par recette.** Chaque fiche recette (Recettes · BOM) a *QC for this
  recipe* : poids de la portion (g), tolérance de poids ± % (5 par défaut),
  température maximale avant expédition (5 °C par défaut), durée de
  conservation en jours (date limite sur l'étiquette) et contrôles
  supplémentaires, un par ligne (par défaut selon la catégorie, ex.
  *Décoration intacte* pour les gâteaux).
- **Lot et étiquettes.** Le numéro de lot (B-AAAA-NNN-MMJJ) est créé à l'étape
  Conditionnement, ou au CQ s'il manque ; *Print labels* (étape
  Conditionnement, fenêtre de la commande, formulaire CQ) imprime une
  étiquette par portion (62 × 40 mm) : produit, âge, poids net, ingrédients,
  allergènes trouvés dans la recette, dates de fabrication et limite, lot,
  commande et enfant, conservation. L'impression est tracée.
- **Le travail de qui.** En haut de la Cuisine (Tableau et Liste), chaque
  cuisinier choisit **My steps** (mes étapes), ou une personne, ou les étapes
  sans personne : seules les commandes où cette personne a des étapes
  ouvertes s'affichent, ses étapes encadrées.
- **Commande en retard.** Quand une commande en cuisine dépasse son heure
  prévue (début + minutes prévues), sa carte passe au rouge avec *OVERDUE
  +x min* et l'alarme sonne toutes les 30 secondes, la commande apparaissant
  dans le bandeau *Over time*, jusqu'à ce qu'elle quitte la cuisine ou que
  l'alarme soit reportée de 5 minutes.
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
- **Rôles** : les rôles d'origine plus les rôles créés dans Équipe & accès
  (onglet *Roles* : nom, description, couleur, permissions copiées d'un
  rôle existant) ; un rôle qui a des personnes ne peut pas être supprimé.
- **Accès aux pages** : l'onglet *Page access* liste chaque page du tableau
  de bord, automatiquement (une nouvelle page apparaît le jour où elle est
  ajoutée) ; par rôle, chaque page est *Par défaut* (suit la permission de
  la page), *Autorisée* ou *Bloquée*. **Access** sur une personne règle son
  rôle et, pour elle seule, chaque permission et chaque page (Par défaut /
  Autorisée / Bloquée). Règle : personne, puis rôle, puis défaut ; super
  administrateur toujours. Le menu ne montre à chacun que les pages qu'il
  peut ouvrir.
- **Noms et données de santé des enfants (RGPD)** : visibles seulement par
  une personne qui a la permission *Noms et données de santé des enfants*
  (par rôle, ou accordée à la personne) **et** qui a signé l'engagement de
  confidentialité (version GDPR-CONF-1.0 : besoin d'en connaître, ni copie
  ni partage, sécurité, signalement de toute violation sous 24 h, devoir
  après le départ, contrôle, sanctions ; RGPD art. 5, 9, 28(3)(b), 29,
  32(4) et loi libanaise 81/2018). Signature : lire, cocher deux
  déclarations, taper le nom complet, signer à la main. Les engagements
  signés sont conservés, imprimables et révocables (avec motif). Les autres
  voient un code (*Child #K7Q2*) sur les commandes, la cuisine, le CQ, les
  étiquettes, le conseiller, l'historique des notifications et le journal
  d'activité ; **les allergies restent visibles par tous**, c'est un
  contrôle de sécurité des aliments. Registre de qui peut voir les noms en
  bas d'Équipe & accès. En base, le personnel lit les enfants par une vue
  qui renvoie le code sauf pour les personnes autorisées.

## 10. Traçabilité de chaque action

- Chaque objet (commande, dossier, facture, réquisition, lot) porte son
  propre historique : qui a fait quoi, et quand.
- Le **Journal d'activité** enregistre, par personne et avec date et heure :
  chaque action de la plateforme (mouvements de commande, signatures en
  cuisine, mouvements de stock, paiements, changements de droits…), **chaque
  clic** (bouton, lien, onglet, ligne, interrupteur — avec ce qui a été cliqué
  et sur quel enregistrement), **chaque champ modifié** (filtre, sélection,
  saisie — avec la valeur) et **chaque page ouverte**. Il garde les 5 000
  dernières entrées dans ce navigateur tant que la base n'est pas connectée.
  Filtres : personne, page, type (actions, clics et modifications, pages
  ouvertes), période ; recherche ; export CSV ; rien ne peut être modifié ni
  supprimé.

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

### V1.2 — 18/11/2026 (mise en service le 18/11/2026)

- Journal d'activité : chaque clic, chaque champ modifié et chaque page ouverte sont enregistrés avec la personne, la date et l'heure, à côté des actions ; filtres par personne, page, type et période ; 5 000 dernières entrées conservées (18/11/2026).
- Vue Liste sur chaque page d'enregistrements (Recettes, Programmes par âge, ISO 22000, Équipe ajoutés ; Réquisitions, Fournisseurs, Notifications et Journal d'activité refaits) avec recherche, filtres, colonnes triables, nombres, totaux et CSV (18/11/2026).
- Stock : filtres par catégorie, emplacement, niveau de stock et réapprovisionnement automatique (18/11/2026).
- Vues enregistrées sur chaque page avec filtres, avec une vue par défaut par page (18/11/2026).
- Page d'accueil par personne (18/11/2026).
- Menu : groupes repliables, favoris, Trouver une page (Ctrl K), pages limitées aux accès de la personne (18/11/2026).
- Commandes : l'étape suivante (Confirmer, Envoyer en cuisine, Cuisine terminée → CQ, CQ conforme, Expédier, Livrée) est un bouton sur chaque commande — dans la barre en haut de la fenêtre, sur chaque carte du tableau et sur chaque ligne de la liste ; la Cuisine affiche les commandes confirmées qui attendent d'être envoyées, avec leur bouton Envoyer en cuisine (18/11/2026).
- Cuisine : les étapes démarrent seules l'une après l'autre, comptes à rebours en direct, l'alarme revient toutes les 30 s tant qu'une étape dépasse son temps avec un bandeau et Snooze 5 min, la commande passe seule au CQ quand toutes les étapes sont faites ; bouton d'étape suivante sur chaque carte en cuisine (18/11/2026).
- Cuisine : sélecteur « Le travail de qui » (mes étapes / une personne / sans personne) sur Tableau et Liste ; une commande en retard passe au rouge et fait sonner l'alarme toutes les 30 s, avec report de 5 min (18/11/2026).
- Cuisine terminée → CQ avec des étapes encore ouvertes demande confirmation et les clôture au nom de la personne ; une commande sortie de la cuisine ne garde jamais d'étape ouverte ; une cuisson ou un refroidissement clos sans température est signalé « CCP non enregistré » dans l'historique de la commande (18/11/2026).
- Formulaire CQ avant expédition (contrôles, poids ±5 %, température ≤ 5 °C, allergies de l'enfant, signature ; NON CONFORME garde la commande au CQ) ; lot créé au Conditionnement avec une étiquette imprimable par portion (18/11/2026).
- Menu : titres de groupes sans compteur (18/11/2026).
- Formulaire CQ : chaque point validé par un bouton OK / Not OK ; un bloc par produit avec son poids, sa température et les contrôles de sa recette ; Sign QC verrouillé tant que tout n'est pas rempli ; réglages CQ par recette (grammes de la portion, tolérance, température maximale, conservation, contrôles supplémentaires) (18/11/2026).
- Contrôle à la livraison (points OK / Not OK, température ≤ 8 °C, reçu par, signature) avant qu'une commande soit livrée ; résultat affiché dans la liste Livraison et sur la commande (18/11/2026).
- Preuve de livraison : photo et signature du client à l'écran sous une déclaration de réception (client absent : photo seule), conservées avec la commande (18/11/2026).
- Export des preuves de livraison : un fichier HTML (toutes les livraisons ou une commande) avec contrôles, photo, déclaration et signature (18/11/2026).
- Commandes : contrôle du stock à la prise de commande et à la confirmation ; un manque ouvre une réquisition d'achat pour la commande et bloque l'envoi en cuisine jusqu'à réception (dérogation super administrateur tracée) ; libération automatique à la réception (18/11/2026).
- Stock : Scan supplier invoice (photo ou PDF lu sur l'appareil) remplit le formulaire de facture — fournisseur, numéro, dates, lignes avec quantité, coût, lot, péremption ; vérifier et valider pour recevoir en stock ; scan conservé sur la facture (18/11/2026, #11).
- Formulaire de facture en tableau : plusieurs lignes sous un numéro de facture, collage depuis Excel ou une liste, liste déroulante des articles existants + Nouvel article ; noms proches reçus sur l'article existant, nouveaux articles créés après confirmation (18/11/2026, #11).
- Emplacement de rangement rempli automatiquement pour chaque lot reçu ; péremption par défaut selon la conservation habituelle de l'article (18/11/2026, #11).
- Fiche fournisseur : relevé de compte avec solde progressif et relevé imprimable, paiements avec mode et référence (paiements partiels), factures, articles fournis avec évolution des prix, coordonnées, ancienneté (18/11/2026, #11).
- Noms des enfants visibles seulement avec la permission et l'engagement de confidentialité RGPD signé ; code pour les autres ; allergies toujours visibles (18/11/2026, #11).
- Équipe & accès : création de rôles ; accès aux pages par rôle et par personne, chaque page listée automatiquement ; permissions par personne (18/11/2026, #11).

- Envoi en cuisine refusé faute de stock : ouvre la page Réquisitions sur cette commande, ses réquisitions surlignées en tête, au lieu d'un simple message (19/11/2026, #12).

- Cuisine : le Tableau devient un rail de bons par poste, dans le style du tableau des Commandes — chaque commande est un bon numéroté dans la colonne de son étape en cours, tâche en cours en haut (personne, minuteur, Démarrer / Terminé), étapes à venir dessous ; les panneaux complets passent dans une vue Détail (19/11/2026, #13).

- Cuisine : vue Bons — un bon par commande, côte à côte par ordre d'arrivée, comme le rail d'un restaurant ; la disposition (Tableau, Bons, Liste, Détail) est mémorisée par personne et peut être gardée dans une vue enregistrée par défaut (19/11/2026, #14).

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
- Stock : journal de tous les mouvements, vue Liste avec comptages, Rapport de consommation par article / commande / personne / jour / mois, export CSV (18/11/2026).
- Commandes : vue Liste complète (filtres, avancement cuisine, lot, livreur et heure d'arrivée, valeur, coût et marge, totaux, CSV, stock utilisé par la commande) (18/11/2026).
- Expédition et livraison : vue Liste de chaque livraison avec heures, résultat à l'heure, filtres, totaux et CSV (18/11/2026).
- Cuisine : vue Liste, une ligne par étape de production avec personne, poste, minuteur et Démarrer / Terminé, filtres (mes étapes, poste, en retard) et totaux (18/11/2026).

### V1.0 — 28/08/2026 (lancement de la plateforme)

- Site de la marque (Accueil, Menu, Pourquoi nous, Comment ça marche, Contact) avec commande par WhatsApp (28/08/2026).
- Tableau de bord des opérations : circuit des commandes, cuisine avec points HACCP, recettes · BOM avec coût complet, stock par lots en FEFO, réquisitions, fournisseurs et dettes, expédition avec heure d'arrivée, liste ISO 22000, registre des réclamations, messagerie, notifications, utilisateurs et droits (28/08/2026).
- Journal de toutes les actions avec date et heure ; rapport de projet *The Tiny Tummy Standard* (28/08/2026).
- Lien discret vers le tableau de bord en pied de page du site (28/08/2026).

---

*Pour le détail de chaque écran, ouvrir la page et cliquer sur **Ask me** :
l'aide intégrée reste la référence.*
