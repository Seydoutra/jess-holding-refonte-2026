/* Jess Pay — couche de paiement du site.
   Le site ne voit jamais de numéro de carte : il crée une session de paiement via VOTRE serveur,
   qui appelle le prestataire (CinetPay, PayDunya, Stripe, Orange Money API…) avec la clé secrète,
   puis redirige le client vers la page de paiement sécurisée du prestataire.

   Pour passer en production :
   1. Créez un point d'accès serveur (ex. https://api.jessholding.com/checkout) qui reçoit l'objet `order`
      ci-dessous en POST JSON et renvoie { reference, payment_url }.
   2. Renseignez `endpoint` et passez `mode` à 'live'.
   3. Configurez l'URL de retour du prestataire vers  …/#/paiement?ref=<reference>  */
window.JESS_PAY = {
  mode: 'demo',
  endpoint: '',
  currency: 'GNF',
  methods: [
    { id: 'orange', label: 'Orange Money', hint: 'Validation sur votre téléphone', phone: true },
    { id: 'mtn', label: 'MTN Mobile Money', hint: 'Validation sur votre téléphone', phone: true },
    { id: 'card', label: 'Carte bancaire', hint: 'Visa, Mastercard — saisie sur la page sécurisée du prestataire' },
    { id: 'agence', label: 'En agence', hint: 'Règlement à l’agence de Nongo sous 48 h' }
  ],

  /* order = { kind, title, amount, currency, method, phone, customer:{name,email,phone}, items:[], meta:{} } */
  async createCheckout(order) {
    if (this.mode === 'live' && this.endpoint) {
      const res = await fetch(this.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
      if (!res.ok) throw new Error('Le service de paiement est momentanément indisponible.');
      const data = await res.json();
      if (data.payment_url) { location.href = data.payment_url; }
      return { status: 'redirect', ...data };
    }
    /* Mode démonstration : aucun débit, référence fictive */
    await new Promise(r => setTimeout(r, 1600));
    const ref = (order.kind === 'billet' ? 'JV' : order.kind === 'don' ? 'CW' : 'JH') + '-' + Date.now().toString(36).toUpperCase().slice(-6);
    return { status: 'demo', reference: ref };
  }
};
