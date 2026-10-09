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
- `404.html` — redirige les anciennes adresses vers les nouvelles

## Pages
`#/` accueil · `#/voyages` · `#/colis` · `#/beaute` · `#/showroom` · `#/appartements` · `#/btp` · `#/ong` · `#/groupe` · `#/actualites` · `#/contact`

Toutes les demandes partent sur WhatsApp (+224 613 13 13 23) avec un message pré-rempli. Aucun paiement ni compte.

## À valider avant mise en ligne
Tarifs, dates de départ, stocks, chiffres de l'ONG et témoignages sont des **données de démonstration** dans `js/data.js` et `js/app.js` (témoignages).
