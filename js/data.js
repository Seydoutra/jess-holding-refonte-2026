/* Jess Holding — données du site (tarifs et dates indicatifs, à confirmer par les équipes) */
window.JESS = {
  phone: '+224 613 13 13 23',
  wa: '224613131323',
  address: 'Nongo, Conakry, République de Guinée',

  /* Filiales et services : alimente le menu, la recherche, l'orbite et l'orientation */
  filiales: [
    { id: 'voyages-services', name: 'Jess Voyages & Services', short: 'Voyages & Services', logo: 'assets/brands/jess-voyages.jpg', tagline: 'Le monde au départ de Conakry.' },
    { id: 'paradise', name: 'Jess Paradise', short: 'Jess Paradise', logo: 'assets/brands/jess-paradise.jpg', tagline: 'Beauté, style et habitat.' },
    { id: 'ong', name: 'Jess Children and Women', short: 'Children & Women', logo: '', tagline: 'Agir pour les femmes et les enfants.' }
  ],
  services: [
    { id: 'voyages', route: '/voyages', fil: 'voyages-services', name: 'Voyager', label: 'Jess Voyages', verb: 'voyager', icon: '✈', img: 'assets/img/services-voyage.jpg',
      desc: 'Billets, séjours sur mesure, visa et plan de paiement.',
      kw: ['voyage', 'voyager', 'billet', 'avion', 'vol', 'visa', 'sejour', 'hotel', 'vacances', 'paris', 'dubai', 'abidjan', 'londres', 'new york', 'marrakech', 'etudiant', 'partir', 'destination', 'tourisme', 'lune de miel', 'omra', 'hajj'] },
    { id: 'colis', route: '/colis', fil: 'voyages-services', name: 'Envoyer un colis', label: 'Jess Colis', verb: 'expédier', icon: '📦', img: 'assets/img/famille-colis.jpg',
      desc: 'Estimation au kilo, départs réguliers et suivi.',
      kw: ['colis', 'envoyer', 'envoi', 'expedier', 'expedition', 'kg', 'kilo', 'paquet', 'carton', 'fret', 'livraison', 'suivi', 'suivre', 'casablanca', 'cargo', 'valise', 'marchandise'] },
    { id: 'beaute', route: '/beaute', fil: 'paradise', name: 'Beauté & spa', label: 'Jess Beauty', verb: 'sublimer', icon: '✦', img: 'assets/img/bien-etre.jpg',
      desc: 'Coiffure, onglerie, soins, massage et mise en beauté.',
      kw: ['beaute', 'coiffure', 'cheveux', 'tresse', 'tresses', 'manucure', 'pedicure', 'ongle', 'ongles', 'onglerie', 'spa', 'massage', 'soin', 'visage', 'maquillage', 'mariage', 'salon', 'brushing', 'epilation', 'rendez-vous', 'rdv'] },
    { id: 'showroom', route: '/showroom', fil: 'paradise', name: 'Showroom', label: 'Jess Paradise Boutique', verb: 's’habiller', icon: '◇', img: 'assets/img/boutique.jpg',
      desc: 'Vêtements, accessoires et parfums à réserver.',
      kw: ['boutique', 'showroom', 'robe', 'vetement', 'vetements', 'mode', 'parfum', 'ceinture', 'sac', 'acheter', 'tenue', 'pantalon', 'tailleur', 'accessoire', 'cadeau'] },
    { id: 'appartements', route: '/appartements', fil: 'paradise', name: 'Appartements', label: 'Jess Séjours', verb: 'séjourner', icon: '⌂', img: 'assets/img/suite-kipe-v2.jpg',
      desc: 'Studios et appartements meublés à la nuit à Conakry.',
      kw: ['appartement', 'studio', 'logement', 'louer', 'location', 'nuit', 'nuits', 'meuble', 'dormir', 'kaloum', 'kipe', 'nongo', 'airbnb', 'hebergement', 'chambre', 'suite'] },
    { id: 'btp', route: '/btp', fil: 'paradise', name: 'BTP', label: 'Jess Paradise BTP', verb: 'bâtir', icon: '▲', img: 'assets/img/appartement-btp.jpg',
      desc: 'Construction, rénovation, extension et suivi de chantier.',
      kw: ['btp', 'construire', 'construction', 'maison', 'villa', 'batiment', 'renovation', 'renover', 'chantier', 'terrain', 'plan', 'extension', 'etage', 'travaux', 'devis', 'immeuble', 'architecte'] },
    { id: 'ong', route: '/ong', fil: 'ong', name: 'Agir avec l’ONG', label: 'Jess Children and Women', verb: 'agir', icon: '♥', img: 'assets/img/jess-children-women.jpg',
      desc: 'Éducation, santé, protection et autonomie des femmes et des enfants.',
      kw: ['ong', 'don', 'donner', 'donation', 'aider', 'aide', 'benevole', 'benevolat', 'enfant', 'enfants', 'femme', 'femmes', 'solidarite', 'humanitaire', 'association', 'partenaire', 'ecole', 'kits', 'cagnotte', 'soutenir'] }
  ],

  /* Voyages */
  destinations: [
    { city: 'Abidjan', country: 'Côte d’Ivoire', tag: 'Afrique', mood: ['culture', 'plage', 'affaires'], days: 5, price: 6500000, flight: '2 h 05', visa: 'Pas de visa (CEDEAO)', season: 'Nov. → Mars', pos: 0, sprite: 'dest', summary: 'Lagune, gastronomie et énergie ouest-africaine.', x: 47.5, y: 53 },
    { city: 'Paris', country: 'France', tag: 'Europe', mood: ['culture', 'romantique', 'etudes', 'shopping'], days: 8, price: 12900000, flight: '6 h 30', visa: 'Visa Schengen', season: 'Avr. → Oct.', pos: 25, sprite: 'dest', summary: 'Art, quartiers iconiques et escapade accompagnée.', x: 49.6, y: 30 },
    { city: 'New York', country: 'États-Unis', tag: 'Amériques', mood: ['urbain', 'shopping', 'etudes', 'affaires'], days: 9, price: 18500000, flight: '≈ 11 h (1 escale)', visa: 'Visa B1/B2', season: 'Avr. → Juin · Sept. → Nov.', pos: 50, sprite: 'dest', summary: 'Une expérience transatlantique vibrante et sur mesure.', x: 28, y: 33 },
    { city: 'Londres', country: 'Royaume-Uni', tag: 'Europe', mood: ['culture', 'etudes', 'urbain'], days: 7, price: 14500000, flight: '≈ 8 h (1 escale)', visa: 'Visa visiteur UK', season: 'Mai → Sept.', pos: 75, sprite: 'dest', summary: 'Histoire, créativité et nouvelles perspectives.', x: 49, y: 28 },
    { city: 'Dubaï', country: 'Émirats arabes unis', tag: 'Moyen-Orient', mood: ['shopping', 'premium', 'famille', 'affaires'], days: 7, price: 11800000, flight: '≈ 10 h (1 escale)', visa: 'Visa e-tourisme', season: 'Nov. → Mars', pos: 100, sprite: 'dest', summary: 'Architecture contemporaine entre ville et désert.', x: 63, y: 41 },
    { city: 'Marrakech', country: 'Maroc', tag: 'Afrique', mood: ['culture', 'romantique', 'famille'], days: 6, price: 9800000, flight: '≈ 4 h 30', visa: 'e-Visa / selon profil', season: 'Mars → Mai · Oct. → Nov.', pos: 25, sprite: 'none', summary: 'Riads, souks et lumière de l’Atlas.', x: 47, y: 37 }
  ],
  promos: [
    { title: 'Abidjan, l’évasion proche', route: 'Conakry → Abidjan', price: 6250000, old: 6900000, dates: '12–17 nov. 2026', cond: 'Vol direct · Bagage 23 kg' },
    { title: 'Parenthèse à Marrakech', route: 'Conakry → Marrakech', price: 9600000, old: 10800000, dates: '4–10 déc. 2026', cond: '1 escale · Hôtel inclus' },
    { title: 'Dubaï en famille', route: 'Conakry → Dubaï', price: 11200000, old: 0, dates: '20–27 févr. 2027', cond: '1 escale · Bagage 30 kg' }
  ],
  visaChecklists: {
    tourisme: ['Passeport valide 6 mois après le retour', '2 photos d’identité récentes', 'Réservation de vol aller-retour', 'Justificatif d’hébergement', 'Relevés bancaires des 3 derniers mois', 'Assurance voyage', 'Attestation de travail ou registre de commerce'],
    etudes: ['Passeport valide', 'Lettre d’admission de l’établissement', 'Diplômes et relevés de notes', 'Justificatif de ressources / garant', 'Justificatif de logement', 'Assurance santé', 'Lettre de motivation'],
    affaires: ['Passeport valide', 'Lettre d’invitation de l’entreprise', 'Ordre de mission', 'Registre de commerce', 'Relevés bancaires de la société', 'Réservation d’hôtel', 'Assurance voyage'],
    famille: ['Passeport valide', 'Lettre d’invitation et pièce de l’hôte', 'Preuve du lien familial', 'Justificatif d’hébergement', 'Relevés bancaires', 'Assurance voyage', 'Billet aller-retour']
  },

  /* Colis */
  parcelRoutes: [
    { id: 'cky-par', from: 'Conakry', to: 'Paris', rate: 95000, express: 145000, days: '5–8 jours' },
    { id: 'par-cky', from: 'Paris', to: 'Conakry', rate: 90000, express: 140000, days: '5–8 jours' },
    { id: 'cky-cas', from: 'Conakry', to: 'Casablanca', rate: 70000, express: 110000, days: '4–6 jours' },
    { id: 'cas-cky', from: 'Casablanca', to: 'Conakry', rate: 65000, express: 105000, days: '4–6 jours' }
  ],
  departures: [
    { iso: '2026-10-12T08:00:00Z', route: 'cky-par', deadline: '2026-10-08' },
    { iso: '2026-10-19T08:00:00Z', route: 'par-cky', deadline: '2026-10-15' },
    { iso: '2026-10-27T08:00:00Z', route: 'cky-cas', deadline: '2026-10-23' },
    { iso: '2026-11-03T08:00:00Z', route: 'cas-cky', deadline: '2026-10-30' },
    { iso: '2026-11-09T08:00:00Z', route: 'cky-par', deadline: '2026-11-05' },
    { iso: '2026-11-16T08:00:00Z', route: 'par-cky', deadline: '2026-11-12' },
    { iso: '2026-11-24T08:00:00Z', route: 'cky-cas', deadline: '2026-11-20' },
    { iso: '2026-12-07T08:00:00Z', route: 'cky-par', deadline: '2026-12-03' }
  ],
  items: [
    ['Vêtements', 'ok', 'Bien pliés, en sac fermé.'], ['Chaussures', 'ok', 'Par paire, dans un sac.'], ['Produits alimentaires secs', 'ok', 'Emballage d’origine, fermé hermétiquement.'],
    ['Café / thé', 'ok', 'Emballage fermé.'], ['Livres et documents', 'ok', 'Protégés de l’humidité.'], ['Téléphone', 'warn', 'Accepté avec facture ; batterie à déclarer.'],
    ['Ordinateur portable', 'warn', 'Facture et emballage rembourré exigés.'], ['Parfum', 'warn', 'Quantité limitée — liquide inflammable à déclarer.'], ['Médicaments', 'warn', 'Ordonnance requise, quantité personnelle.'],
    ['Huile de palme / liquides', 'warn', 'Double emballage étanche obligatoire.'], ['Bijoux en or', 'warn', 'À déclarer avec valeur — assurance conseillée.'], ['Argent liquide', 'no', 'Interdit dans les colis.'],
    ['Batterie externe seule', 'no', 'Interdite en soute.'], ['Gaz, aérosols', 'no', 'Matière dangereuse interdite.'], ['Produits frais / viande', 'no', 'Denrées périssables refusées.'],
    ['Armes, munitions', 'no', 'Strictement interdit.'], ['Tissu wax / bazin', 'ok', 'Accepté, idéal plié sous vide.'], ['Cosmétiques', 'warn', 'Crèmes acceptées, flacons bien fermés.']
  ],

  /* Beauté */
  rituals: [
    { name: 'Essentiel Beauté', duration: 60, price: 450000, copy: 'Coiffure soignée, finition et conseil personnalisé.', items: ['Diagnostic express', 'Shampoing & soin', 'Coiffage ou brushing'] },
    { name: 'Rituel Éclat', duration: 90, price: 750000, copy: 'Une parenthèse pour le visage, les mains et l’allure.', items: ['Soin visage éclat', 'Manucure classique', 'Mise en beauté'] },
    { name: 'Signature Jess', duration: 120, price: 1100000, copy: 'Notre expérience la plus généreuse, imaginée autour de vous.', items: ['Diagnostic approfondi', 'Soin visage & massage', 'Coiffure et finition'], featured: true },
    { name: 'Mariée Jess', duration: 180, price: 2400000, copy: 'Essai, coiffure, maquillage et ongles pour le grand jour.', items: ['Séance d’essai', 'Coiffure & maquillage', 'Manucure de cérémonie'] }
  ],
  beautyServices: [
    { cat: 'Cheveux', name: 'Coiffure & brushing', price: 150000, min: 45 }, { cat: 'Cheveux', name: 'Tresses protectrices', price: 250000, min: 90 },
    { cat: 'Cheveux', name: 'Soin profond cheveux', price: 180000, min: 40 }, { cat: 'Ongles', name: 'Manucure', price: 150000, min: 45 },
    { cat: 'Ongles', name: 'Pédicure spa', price: 200000, min: 60 }, { cat: 'Ongles', name: 'Pose gel', price: 220000, min: 60 },
    { cat: 'Soins', name: 'Soin visage éclat', price: 250000, min: 60 }, { cat: 'Soins', name: 'Massage bien-être', price: 300000, min: 60 },
    { cat: 'Soins', name: 'Gommage corps', price: 220000, min: 45 }, { cat: 'Mise en beauté', name: 'Maquillage événementiel', price: 350000, min: 75 },
    { cat: 'Mise en beauté', name: 'Épilation sourcils', price: 60000, min: 15 }
  ],
  slots: ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'],

  /* Showroom — sprite boutique.jpg (4 panneaux) */
  products: [
    { id: 'robe', cat: 'Vêtements', name: 'Robe Éclat Bordeaux', price: 1850000, pos: '0%', sizes: ['S', 'M', 'L', 'XL'] },
    { id: 'pantalon', cat: 'Vêtements', name: 'Pantalon Ligne Ivoire', price: 650000, pos: '33.3%', sizes: ['36', '38', '40', '42', '44'] },
    { id: 'ceinture', cat: 'Accessoires', name: 'Ceinture Signature', price: 380000, pos: '66.6% 18%', sizes: ['Unique'] },
    { id: 'parfum', cat: 'Parfums', name: 'Parfum Nuit de Conakry', price: 720000, pos: '66.6% 88%', sizes: ['50 ml', '100 ml'] },
    { id: 'ensemble', cat: 'Vêtements', name: 'Ensemble Horizon', price: 2100000, pos: '100%', sizes: ['S', 'M', 'L'] },
    { id: 'sac', cat: 'Accessoires', name: 'Mini sac Bordeaux', price: 540000, pos: '100% 70%', sizes: ['Unique'] }
  ],

  /* Appartements */
  stays: [
    { id: 'nongo', name: 'Studio Nongo', area: 'Nongo', guests: 2, beds: 1, size: 32, price: 650000, img: 'assets/img/studio-nongo-v2.jpg', rating: 4.8, perks: ['Wi-Fi fibre', 'Climatisation', 'Groupe électrogène', 'Cuisine équipée'], blurb: 'Lumineux et calme, à deux pas du siège Jess.' },
    { id: 'kaloum', name: 'Appartement Kaloum', area: 'Kaloum', guests: 4, beds: 2, size: 78, price: 1200000, img: 'assets/img/appartement-kaloum-v2.jpg', rating: 4.9, perks: ['Vue mer', 'Wi-Fi fibre', 'Climatisation', 'Parking', 'Sécurité 24/7'], blurb: 'Au cœur du centre d’affaires, idéal en famille ou en mission.' },
    { id: 'kipe', name: 'Suite Kipé', area: 'Kipé', guests: 3, beds: 1, size: 54, price: 950000, img: 'assets/img/suite-kipe-v2.jpg', rating: 4.9, perks: ['Wi-Fi fibre', 'Climatisation', 'Espace bureau', 'Groupe électrogène'], blurb: 'Élégante et spacieuse, pensée pour les longs séjours.' }
  ],

  /* ONG */
  campaigns: [
    { id: 'rentree', name: 'Rentrée pour toutes', cause: 'Éducation', raised: 35700000, goal: 85000000, unit: 120000, unitLabel: 'kit scolaire', unitPlural: 'kits scolaires', copy: 'Kits, fournitures et accompagnement scolaire des jeunes filles.', donors: 214 },
    { id: 'meres', name: 'Mères en bonne santé', cause: 'Santé', raised: 85400000, goal: 140000000, unit: 250000, unitLabel: 'consultation prénatale', unitPlural: 'consultations prénatales', copy: 'Consultations, sensibilisation et orientation maternelle.', donors: 389 },
    { id: 'metier', name: 'Un métier, un avenir', cause: 'Autonomie', raised: 87600000, goal: 120000000, unit: 1500000, unitLabel: 'formation complète', unitPlural: 'formations complètes', copy: 'Formation et équipement de femmes entrepreneures.', donors: 172 },
    { id: 'enfance', name: 'Protéger l’enfance', cause: 'Protection', raised: 34200000, goal: 95000000, unit: 400000, unitLabel: 'mois d’écoute & suivi', unitPlural: 'mois d’écoute & suivi', copy: 'Écoute, orientation et espaces communautaires sûrs.', donors: 128 },
    { id: 'urgence', name: 'Urgence familles', cause: 'Solidarité', raised: 40500000, goal: 75000000, unit: 300000, unitLabel: 'panier familial', unitPlural: 'paniers familiaux', copy: 'Aide de première nécessité pour les foyers fragilisés.', donors: 266 }
  ],
  skills: ['Enseignement', 'Santé', 'Communication', 'Logistique', 'Droit', 'Finance', 'Informatique', 'Animation', 'Couture', 'Photographie'],

  news: [
    { cat: 'Voyages', date: '2026-09-18', title: 'Six destinations à découvrir depuis Conakry', copy: 'Abidjan, Paris, Dubaï… notre sélection de séjours accompagnés pour la fin d’année.', route: '/voyages', img: 'assets/img/destinations.jpg' },
    { cat: 'Colis', date: '2026-09-12', title: 'Le calendrier des départs d’automne est en ligne', copy: 'Liaisons Conakry – Paris – Casablanca : dates de dépôt et conseils d’emballage.', route: '/colis', img: 'assets/img/famille-colis.jpg' },
    { cat: 'Impact', date: '2026-09-05', title: 'Jess Children and Women prépare sa rentrée solidaire', copy: 'Objectif : équiper des centaines d’élèves en kits scolaires avant la rentrée.', route: '/ong', img: 'assets/img/jess-children-women.jpg' },
    { cat: 'Beauté', date: '2026-08-28', title: 'Nouveau rituel « Mariée Jess »', copy: 'Essai, coiffure, maquillage et ongles : un accompagnement complet pour le grand jour.', route: '/beaute', img: 'assets/img/bien-etre.jpg' },
    { cat: 'Séjours', date: '2026-08-14', title: 'La Suite Kipé ouvre ses réservations longue durée', copy: 'Tarifs dégressifs à partir de 7 nuits pour les missions professionnelles.', route: '/appartements', img: 'assets/img/suite-kipe-v2.jpg' },
    { cat: 'BTP', date: '2026-07-30', title: 'Rénover avant la saison des pluies : nos conseils', copy: 'Toiture, étanchéité, drainage : les priorités à planifier dès maintenant.', route: '/btp', img: 'assets/img/appartement-btp.jpg' }
  ]
};
