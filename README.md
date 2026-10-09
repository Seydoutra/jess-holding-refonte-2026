# Jess Holding — refonte 2026

Site statique, sans dépendance ni étape de build : HTML, CSS et JavaScript natifs.

## Lancer en local
```
python3 -m http.server 5173
```
puis ouvrir http://localhost:5173

## Structure
- `index.html` — coquille (en-tête, pied de page, dock mobile, recherche ⌘K, tiroir)
- `css/app.css` — design system (couleurs par univers, mode sombre, animations)
- `js/data.js` — **toutes les données éditables** : services, destinations, tarifs colis, départs, rituels, produits, logements, campagnes, actualités
- `js/app.js` — routeur, moteur d'orientation et expériences interactives
- `js/payment.js` — **paiement** (dons et billets) : à brancher sur votre API
- `404.html` — redirige les anciennes adresses vers les nouvelles

## Pages
`#/` accueil · `#/voyages` · `#/colis` · `#/beaute` · `#/showroom` · `#/appartements` · `#/btp` · `#/ong` · `#/groupe` · `#/actualites` · `#/contact`

Toutes les demandes partent sur WhatsApp (+224 613 13 13 23) avec un message pré-rempli. Aucun paiement ni compte.

## À valider avant mise en ligne
Tarifs, dates de départ, stocks, chiffres de l'ONG et témoignages sont des **données de démonstration** dans `js/data.js` et `js/app.js` (témoignages).

## Brancher le paiement (dons ONG et billets d'avion)
Le tunnel de paiement (coordonnées, passagers, moyen de paiement, confirmation, reçu) est complet et fonctionne en **mode démonstration**.
Pour encaisser réellement, dans `js/payment.js` :
1. Créez sur votre serveur un point d'accès qui reçoit la commande (POST JSON) et crée la session chez le prestataire (CinetPay, PayDunya, Stripe, Orange Money…) avec la **clé secrète côté serveur uniquement**. Il renvoie `{ reference, payment_url }`.
2. Renseignez `endpoint` et passez `mode` à `'live'`. Le client est redirigé vers la page sécurisée du prestataire.

## Billets d'avion
Recherche libre (départ et arrivée au choix, aller simple ou aller-retour, adultes / enfants / bébés, classe). Les horaires et tarifs sont générés pour la démonstration dans `searchFlights()` (`js/app.js`) : à remplacer par l'appel à l'API de réservation (Amadeus, Duffel, Travelport…).

## Images à fournir
- Vignettes des cagnottes : champ `img` de chaque campagne dans `js/data.js`
- Projets réalisés : tableau `images` de chaque projet dans `js/data.js` (autant de photos que souhaité, le carrousel s'adapte)
