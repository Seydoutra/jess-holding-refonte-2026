/* Jess Holding — application (routeur, orientation, expériences par service) */
(() => {
'use strict';
const D = window.JESS;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $('#main');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

/* ---------- utilitaires ---------- */
const nf = new Intl.NumberFormat('fr-FR');
const fmt = n => nf.format(Math.round(n)) + ' GNF';
const fmtM = n => (n >= 1e9 ? (n / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + ' Md' : n >= 1e6 ? (n / 1e6).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' M' : nf.format(n)) + ' GNF';
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dLong = d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const dShort = d => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const store = {
  get(k, f) { try { const v = localStorage.getItem('jess:' + k); return v ? JSON.parse(v) : f; } catch { return f; } },
  set(k, v) { try { localStorage.setItem('jess:' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } }
};
const waLink = msg => `https://wa.me/${D.wa}?text=${encodeURIComponent(msg)}`;
const openWA = msg => window.open(waLink(msg), '_blank', 'noopener');
const waMsg = (team, intro, rows = []) => `Bonjour ${team},\n${intro}\n\n${rows.filter(r => r && r[1] !== '' && r[1] != null).map(r => `• ${r[0]} : ${r[1]}`).join('\n')}\n\n(Demande envoyée depuis le site Jess Holding)`;
const svc = id => D.services.find(s => s.id === id);
const BUL = '<span class="bul" aria-hidden="true"></span>';
const colors = { voyages: '#7b1a2a', colis: '#7b1a2a', beaute: '#7b1a2a', showroom: '#7b1a2a', appartements: '#7b1a2a', btp: '#7b1a2a', ong: '#7b1a2a' };

let toastT;
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800); }

function setRange(r) { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty('--p', p + '%'); }

/* Formulaire → WhatsApp, avec validation native */
function formData(f) { return Object.fromEntries(new FormData(f).entries()); }
function valid(f) { if (f.checkValidity()) return true; f.reportValidity(); return false; }

/* ---------- moteur d'orientation par intention ---------- */
function analyze(q) {
  const n = norm(q).trim();
  if (!n) return [];
  const words = n.split(/[^a-z0-9]+/).filter(Boolean);
  const kg = n.match(/(\d+(?:[.,]\d+)?)\s*(kg|kilo)/);
  const m2 = n.match(/(\d+)\s*(m2|m²|metres|mètres)/);
  const nights = n.match(/(\d+)\s*nuit/);
  const city = D.destinations.find(d => n.includes(norm(d.city)));
  const beautyHit = D.beautyServices.find(s => norm(s.name).split(/\s+/).some(nw => words.some(w => w.length > 3 && (nw === w || (w.length >= 5 && nw.startsWith(w))))));
  const stayHit = D.stays.find(s => n.includes(norm(s.area)));
  const out = D.services.map(s => {
    let score = 0;
    s.kw.forEach(k => {
      const hit = k.includes(' ') ? n.includes(k) : words.some(w => w === k || (w.length >= 4 && k.startsWith(w) && k.length - w.length <= (w.length >= 5 ? 3 : 1)) || (k.length >= 4 && w.startsWith(k) && w.length - k.length <= 3));
      if (hit) score += k.length > 5 ? 2 : 1.4;
    });
    if (s.id === 'colis' && kg) score += 3;
    if (s.id === 'btp' && m2) score += 2;
    if (s.id === 'appartements' && nights) score += 2;
    if (s.id === 'voyages' && city && !kg) score += 1;
    return { s, score };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);
  const max = out[0]?.score || 1;
  return out.slice(0, 4).map(({ s, score }) => {
    let href = '#' + s.route, action = s.desc;
    if (s.id === 'colis') {
      const p = new URLSearchParams();
      if (kg) p.set('kg', kg[1].replace(',', '.'));
      if (city && ['Paris', 'Casablanca'].includes(city.city)) p.set('to', city.city);
      if (/suivi|suivre|ou est/.test(n)) { href = '#/colis#suivi'; action = 'Suivre mon colis en temps réel'; }
      else { href = `#/colis${p.toString() ? '?' + p : ''}#estimer`; action = kg ? `Estimer l’envoi de ${kg[1]} kg${city ? ' vers ' + city.city : ''}` : 'Estimer mon envoi au kilo'; }
    }
    if (s.id === 'voyages') {
      if (/billet|vol\b|avion|aller/.test(n)) { href = `#/voyages${city ? '?to=' + encodeURIComponent(city.city) : ''}#billets`; action = `Réserver un billet d’avion${city ? ' pour ' + city.city : ''}`; }
      else if (/visa/.test(n)) { href = `#/voyages${city ? '?dest=' + encodeURIComponent(city.city) : ''}#visa`; action = `Préparer mon dossier visa${city ? ' pour ' + city.city : ''}`; }
      else if (city) { href = `#/voyages?dest=${encodeURIComponent(city.city)}#planifier`; action = `Planifier un voyage à ${city.city} · dès ${fmtM(city.price)}`; }
      else { href = '#/voyages#planifier'; action = 'Construire mon voyage selon mon budget'; }
    }
    if (s.id === 'beaute') { href = `#/beaute${beautyHit ? '?svc=' + encodeURIComponent(beautyHit.name) : ''}#composer`; action = beautyHit ? `Réserver : ${beautyHit.name} · ${fmt(beautyHit.price)}` : 'Composer mon rituel et choisir un créneau'; }
    if (s.id === 'appartements') { const p = new URLSearchParams(); if (stayHit) p.set('stay', stayHit.id); if (nights) p.set('n', nights[1]); href = `#/appartements${p.toString() ? '?' + p : ''}#reserver`; action = stayHit ? `${stayHit.name} · ${fmt(stayHit.price)} / nuit` : 'Voir les disponibilités et réserver'; }
    if (s.id === 'btp') { href = `#/btp${m2 ? '?m2=' + m2[1] : ''}#estimer`; action = m2 ? `Estimer un projet de ${m2[1]} m²` : 'Estimer mon projet en 30 secondes'; }
    if (s.id === 'ong') { const vol = /benevol/.test(n); href = vol ? '#/ong#benevolat' : '#/ong#soutenir'; action = vol ? 'Devenir bénévole' : 'Soutenir une campagne'; }
    if (s.id === 'showroom') { href = '#/showroom#collection'; action = 'Parcourir la collection'; }
    return { s, href, action, pct: Math.round(score / max * 100) };
  });
}

/* ---------- vues partagées ---------- */
const uhero = ({ img, kicker, title, lead, actions = '', side = '', crumbs = [], extra = '' }) => `
<section class="uhero">
  <div class="uhero-bg" style="background-image:url('${img}')"></div>${extra}
  <div class="wrap">
    <nav class="crumbs" aria-label="Fil d’Ariane"><a href="#/">Jess Holding</a>${crumbs.map(c => `<span>/</span>${c[1] ? `<a href="${c[1]}">${c[0]}</a>` : `<span>${c[0]}</span>`}`).join('')}</nav>
    <div class="uhero-row">
      <div class="uhero-copy"><p class="kicker">${kicker}</p><h1 class="d1" data-split>${title}</h1><p class="lead rv" style="--i:3">${lead}</p>${actions ? `<div class="actions rv" style="--i:4">${actions}</div>` : ''}</div>
      ${side}
    </div>
  </div>
</section>`;
const subnav = items => `<nav class="subnav" aria-label="Dans cette page"><div class="wrap">${items.map(i => `<a href="#${(location.hash.split('#')[1] || '/')}#${i[0]}" data-sec="${i[0]}">${i[1]}</a>`).join('')}</div></nav>`;
const secHead = (k, t, p = '', right = '') => `<div class="sec-head"><div><p class="kicker">${k}</p><h2 class="d2" data-split>${t}</h2>${p ? `<p class="lead rv">${p}</p>` : ''}</div>${right}</div>`;
const faq = list => `<div class="faq">${list.map(q => `<details class="rv"><summary>${q[0]}</summary><p>${q[1]}</p></details>`).join('')}</div>`;
const ctaBand = (t, p, a) => `<section class="sec-tight"><div class="wrap"><div class="cta-band rv"><p class="kicker" style="color:#fff">Prochaine étape</p><h2 class="d2">${t}</h2><p class="lead">${p}</p><div class="actions" style="margin-top:24px">${a}</div></div></div></section>`;
const waBtn = (label, msg, cls = 'btn btn-wa') => `<a class="${cls}" href="${waLink(msg)}" target="_blank" rel="noopener">${label}</a>`;

/* =====================================================================
   ACCUEIL
   ===================================================================== */
const situations = [
  ['voyages', 'Je prépare un voyage', ['Indiquez destination, dates et budget', 'Recevez une proposition claire et comparée', 'Validez avec votre conseiller et partez serein']],
  ['colis', 'J’envoie quelque chose à un proche', ['Estimez le prix au kilo en direct', 'Déposez avant la date limite du prochain départ', 'Suivez votre colis jusqu’au retrait']],
  ['beaute', 'Je veux prendre soin de moi', ['Composez votre rituel et voyez le prix', 'Choisissez un jour et un créneau libre', 'Le salon confirme sur WhatsApp']],
  ['showroom', 'Je cherche une tenue ou un cadeau', ['Filtrez la collection', 'Ajoutez vos pièces à votre sélection', 'Réservez et essayez en boutique']],
  ['appartements', 'Je cherche où dormir à Conakry', ['Comparez studios et appartements', 'Sélectionnez vos dates dans le calendrier', 'Recevez la confirmation et l’accueil']],
  ['btp', 'J’ai un projet de construction', ['Estimez budget et durée en 30 secondes', 'Visite technique et étude détaillée', 'Chantier suivi jusqu’à la réception']],
  ['ong', 'Je veux aider les femmes et les enfants', ['Choisissez une cause', 'Visualisez l’impact de votre don', 'Rejoignez le mouvement comme donateur ou bénévole']]
];
function nextDepartures() {
  const now = Date.now(), cycle = 28 * 864e5, list = [];
  D.departures.forEach(d => {
    let t = new Date(d.iso).getTime(), dl = new Date(d.deadline + 'T23:59:00').getTime();
    while (t < now) { t += cycle; dl += cycle; }
    for (let k = 0; k < 2; k++) list.push({ ...d, t: t + k * cycle, dl: dl + k * cycle, r: D.parcelRoutes.find(r => r.id === d.route) });
  });
  return list.sort((a, b) => a.t - b.t).slice(0, 8);
}
function nextFreeSlot() {
  for (let i = 1; i < 14; i++) {
    const d = addDays(today(), i);
    if (d.getDay() === 0) continue;
    const s = D.slots.find(s => hash(iso(d) + s + 'b') % 4 !== 0);
    if (s) return `${i === 1 ? 'demain' : dLong(d)} à ${s}`;
  }
  return 'cette semaine';
}

function viewHome() {
  const dep = nextDepartures()[0];
  const daysTo = Math.max(0, Math.ceil((dep.t - Date.now()) / 864e5));
  const raised = D.campaigns.reduce((a, c) => a + c.raised, 0), goal = D.campaigns.reduce((a, c) => a + c.goal, 0);
  const nodes = D.services.map((s, i) => `<div class="onode" style="--a:${i * (360 / D.services.length) - 90}deg;--d:41cqw;--c:${colors[s.id]}"><a href="#${s.route}" aria-label="${s.name}"><div>${BUL}<b>${s.name.replace('Agir avec l’ONG', 'ONG')}</b></div></a></div>`).join('');
  const tiles = [
    ['voyages', 't-voy', 'Jess Voyages', 'Préparer le voyage qui vous ressemble.', `Promo : Abidjan dès ${fmtM(D.promos[0].price)}`],
    ['colis', 't-col', 'Jess Colis', 'Faire circuler l’essentiel.', `${dep.r.from} → ${dep.r.to} dans ${daysTo} j`],
    ['beaute', 't-bea', 'Jess Beauty', 'Réserver du temps pour vous.', `Prochain créneau : ${nextFreeSlot()}`],
    ['showroom', 't-sho', 'Showroom', 'Des pièces choisies.', `${D.products.length} pièces à réserver`],
    ['appartements', 't-app', 'Jess Séjours', 'Comme chez vous, dès l’arrivée.', `Dès ${fmt(Math.min(...D.stays.map(s => s.price)))} / nuit`],
    ['btp', 't-btp', 'Jess Paradise BTP', 'Bâtir avec méthode.', 'Estimation en 30 secondes'],
    ['ong', 't-ong', 'Jess Children and Women', 'Grandir ensemble, c’est aussi agir là où l’essentiel commence.', `${Math.round(raised / goal * 100)} % de l’objectif collectif atteint`]
  ].map(([id, cls, lab, t, live], i) => { const s = svc(id); return `<a class="tile ${cls} rv" style="--i:${i}" href="#${s.route}"><img src="${s.img}" alt="" loading="lazy" decoding="async"><span class="go" aria-hidden="true">→</span><div><span class="tag">${lab}</span></div><div><h3>${t}</h3><p>${s.desc}</p><span class="live">${live}</span></div></a>`; }).join('');
  const quotes = [
    ['Aminata K.', 'Voyage en couple', 'Plusieurs options claires et une proposition adaptée à notre budget. On a avancé sereinement.'],
    ['Mamadou D.', 'Colis vers Paris', 'J’ai su exactement combien j’allais payer et quand déposer. Colis bien arrivé chez ma sœur.'],
    ['Fatoumata B.', 'Rituel Signature', 'Un vrai moment pour moi. Le créneau a été confirmé en quelques minutes.'],
    ['Ibrahima S.', 'Séjour à Kaloum', 'Appartement impeccable, accueil à l’arrivée, groupe électrogène : rien à redire.'],
    ['Kadiatou C.', 'Rénovation', 'Le planning annoncé a été tenu. On savait toujours où en était le chantier.'],
    ['Ousmane T.', 'Visa étudiant', 'La checklist m’a évité d’oublier des pièces. Dossier complet du premier coup.']
  ];
  const qHtml = quotes.map(q => `<figure class="quote"><p>« ${q[2]} »</p><footer><i>${q[0][0]}</i><div><b>${q[0]}</b>${q[1]}</div></footer></figure>`).join('');
  return {
    u: 'holding', title: 'Jess Holding — Tous vos projets, un seul groupe',
    html: `
<section class="home-hero">
  <div class="mesh" aria-hidden="true"><i></i><i></i><i></i></div><div class="grain" aria-hidden="true"></div>
  <div class="wrap hh-grid">
    <div>
      <p class="kicker rv">Groupe multiservices · Conakry, Guinée</p>
      <h1 class="d1 hh-title">Un seul groupe<br>pour <span class="rotator" id="rot">${D.services.map((s, i) => `<span class="${i ? '' : 'on'}">${s.verb}.</span>`).join('')}</span></h1>
      <p class="lead rv" style="--i:2">Voyages, colis, beauté, mode, séjours, construction et solidarité. Dites-nous ce dont vous avez besoin : nous vous orientons vers la bonne équipe en un instant.</p>
      <div class="ask rv" style="--i:3">
        <form class="ask-box" id="askForm" role="search">
          <label class="vh" for="ask">Décrivez votre besoin</label>
          <input id="ask" autocomplete="off" placeholder="Ex. « envoyer 12 kg à Paris »" aria-describedby="askHint" aria-controls="askRes">
          <button class="btn" type="submit"><span>M’orienter</span> →</button>
        </form>
        <div class="ask-res" id="askRes" role="listbox"></div>
        <div class="ask-hint" id="askHint">Essayez :
          ${['visa étudiant pour Paris', 'manucure samedi', '3 nuits à Kaloum', 'maison de 150 m2', 'faire un don'].map(x => `<button type="button" data-try="${x}">${x}</button>`).join('')}
        </div>
      </div>
      <div class="hh-stats rv" style="--i:4">
        <div><b data-count="3">0</b><span>filiales</span></div>
        <div><b data-count="7">0</b><span>services intégrés</span></div>
        <div><b data-count="1">0</b><span>seul interlocuteur</span></div>
      </div>
    </div>
    <div class="rv" style="--i:2">
      <div class="orbit" style="container-type:inline-size" aria-label="Écosystème Jess Holding">
        <div class="orbit-ring r1"></div><div class="orbit-ring r2"></div>
        <div class="orbit-core"><div><b>JH</b><small>Jess Holding</small></div></div>
        <div class="orbit-spin">${nodes}</div>
      </div>
    </div>
  </div>
</section>
<div class="ribbon" aria-hidden="true"><div>${['Voyager', 'Expédier', 'Sublimer', 'S’habiller', 'Séjourner', 'Bâtir', 'Agir'].concat(['Voyager', 'Expédier', 'Sublimer', 'S’habiller', 'Séjourner', 'Bâtir', 'Agir']).map(x => `<span>${x}</span>`).join('')}</div></div>

<section class="sec" id="univers">
  <div class="wrap">
    ${secHead('Nos univers', 'Sept services.<br><em>Une seule exigence.</em>', 'Chaque service a sa propre équipe et son propre parcours. Les informations clés sont mises à jour en direct pour vous aider à décider vite.', '<a class="btn btn-ghost" href="#/groupe">Découvrir le groupe</a>')}
    <div class="bento">${tiles}</div>
  </div>
</section>

<section class="sec alt" id="guide">
  <div class="wrap">
    ${secHead('Guidez-moi', 'Par où <em>commencer&nbsp;?</em>', 'Choisissez votre situation : on vous montre le chemin, étape par étape.')}
    <div class="finder">
      <div class="finder-q" role="tablist" aria-label="Votre situation">${situations.map((s, i) => `<button role="tab" aria-selected="${i === 0}" data-sit="${i}"><i>${BUL}</i>${s[1]}</button>`).join('')}</div>
      <div class="finder-out" id="finderOut" role="tabpanel" aria-live="polite"></div>
    </div>
  </div>
</section>

<section class="sec dark">
  <div class="wrap">
    ${secHead('Notre manière de faire', 'Vous savez où aller.<br><em>Nous clarifions le chemin.</em>')}
    <div class="steps">
      ${[['Écouter', 'Votre besoin, votre budget et vos contraintes ouvrent le parcours.'], ['Proposer', 'Une réponse lisible, chiffrée et expliquée avant tout engagement.'], ['Confirmer', 'Disponibilités, prix et conditions validés avec une vraie personne.'], ['Accompagner', 'L’équipe reste joignable avant, pendant et après la prestation.']].map((s, i) => `<article class="step rv" style="--i:${i}"><b>0${i + 1}</b><h3>${s[0]}</h3><p>${s[1]}</p></article>`).join('')}
    </div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    ${secHead('Ils nous font confiance', 'Des projets <em>qui avancent.</em>', '', '<span class="small muted">Témoignages illustratifs</span>')}
  </div>
  <div class="quotes rv"><div>${qHtml}${qHtml}</div></div>
</section>

<section class="sec alt">
  <div class="wrap">
    ${secHead('Journal', 'Les dernières <em>nouvelles.</em>', '', '<a class="link" href="#/actualites">Toutes les actualités <span>→</span></a>')}
    <div class="news">${newsCards(D.news.slice(0, 3))}</div>
  </div>
</section>
${ctaBand('Un projet en tête ?<br><em>Commençons par une conversation.</em>', 'Un conseiller vous répond et vous oriente vers la bonne équipe, quel que soit votre besoin.', `<a class="btn btn-light" href="#/contact">Parler à un conseiller</a>${waBtn('WhatsApp', 'Bonjour Jess Holding, j’ai besoin d’un conseil.', 'btn btn-ghost')}`)}
`,
    init() {
      /* mots tournants */
      const spans = $$('#rot span'); let k = 0;
      if (!reduced) addTimer(setInterval(() => { spans[k].className = 'out'; k = (k + 1) % spans.length; spans[k].className = 'on'; }, 2200));
      /* orientation */
      const input = $('#ask'), res = $('#askRes'); let sel = -1, items = [];
      const draw = () => {
        items = analyze(input.value);
        if (!input.value.trim()) { res.classList.remove('show'); return; }
        res.innerHTML = items.length ? items.map((r, i) => `<a href="${r.href}" role="option" class="${i === sel ? 'sel' : ''}"><i>${BUL}</i><div><b>${r.s.label}</b><br><small class="muted">${esc(r.action)}</small></div><span class="meter" title="Pertinence"><i style="width:${r.pct}%"></i></span></a>`).join('')
          : `<a href="#/contact?msg=${encodeURIComponent(input.value)}"><i>${BUL}</i><div><b>Pas sûr ? Un conseiller vous oriente</b><br><small class="muted">Nous transmettons votre demande : « ${esc(input.value)} »</small></div><em>Contact →</em></a>`;
        res.classList.add('show');
      };
      input.addEventListener('input', () => { sel = -1; draw(); });
      input.addEventListener('keydown', e => {
        if (!items.length) return;
        if (e.key === 'ArrowDown') { sel = (sel + 1) % items.length; draw(); e.preventDefault(); }
        if (e.key === 'ArrowUp') { sel = (sel - 1 + items.length) % items.length; draw(); e.preventDefault(); }
        if (e.key === 'Escape') res.classList.remove('show');
      });
      $('#askForm').addEventListener('submit', e => { e.preventDefault(); const r = items[Math.max(sel, 0)]; location.hash = r ? r.href.slice(1) : `/contact?msg=${encodeURIComponent(input.value)}`; });
      $$('[data-try]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.try; input.focus(); draw(); }));
      addListener(document, 'click', e => { if (!e.target.closest('.ask')) res.classList.remove('show'); });
      /* guide */
      const out = $('#finderOut');
      const show = i => {
        const [id, t, steps] = situations[i], s = svc(id);
        out.innerHTML = `<article class="finder-card"><img src="${s.img}" alt="" loading="lazy"><div><span class="tag" style="background:${colors[id]}1a;color:${colors[id]}">${s.label}</span><h3 class="d3">${t}</h3><ol>${steps.map(x => `<li>${x}</li>`).join('')}</ol><div class="actions" style="margin-top:auto"><a class="btn" style="--b:${colors[id]}" href="#${s.route}">Commencer →</a>${waBtn('Écrire à l’équipe', `Bonjour ${s.label}, ${norm(t).startsWith('je') ? t.charAt(0).toLowerCase() + t.slice(1) : t} et j’aimerais être accompagné(e).`, 'btn btn-ghost')}</div></div></article>`;
        $$('[data-sit]').forEach(b => b.setAttribute('aria-selected', b.dataset.sit == i));
      };
      $$('[data-sit]').forEach(b => b.addEventListener('click', () => show(+b.dataset.sit)));
      show(0);
    }
  };
}
function newsCards(list) {
  return list.map((n, i) => `<article class="news-card rv" style="--i:${i}"><img src="${n.img}" alt="" loading="lazy" decoding="async"><div><div class="meta"><span class="tag">${n.cat}</span><time datetime="${n.date}">${new Date(n.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time></div><h3>${n.title}</h3><p class="muted small">${n.copy}</p><a class="link" href="#${n.route}">Lire et découvrir <span>→</span></a></div></article>`).join('');
}

/* =====================================================================
   GROUPE & HUBS
   ===================================================================== */
function viewGroupe() {
  return {
    u: 'holding', title: 'Le groupe — Jess Holding',
    html: `
<section class="page-top"><div class="wrap">
  <p class="kicker">Le groupe</p>
  <h1 class="d1" data-split>Un écosystème <em>pensé pour vous.</em></h1>
  <p class="lead rv" style="--i:3;margin-top:20px">Né à Nongo, Jess Holding réunit trois filiales complémentaires. Une même promesse les relie : rendre chaque prochaine étape claire, chiffrée et accompagnée par une personne.</p>
</div></section>
<section class="sec-tight"><div class="wrap">
  <div class="uni-cards">
    ${D.filiales.map((f, i) => `<article class="uni rv" style="--i:${i}">${f.logo ? `<img src="${f.logo}" alt="Logo ${f.name}" loading="lazy">` : '<span class="mono">CW</span>'}<h2 class="d3">${f.name}</h2><p class="muted">${f.tagline}</p><ul>${D.services.filter(s => s.fil === f.id).map(s => `<li><a href="#${s.route}">${s.name}<span>→</span></a></li>`).join('')}</ul></article>`).join('')}
  </div>
</div></section>
<section class="sec"><div class="wrap">
  <div class="counters">
    <div class="rv"><b data-count="3">0</b><span>filiales complémentaires</span></div>
    <div class="rv" style="--i:1"><b data-count="7">0</b><span>services intégrés</span></div>
    <div class="rv" style="--i:2"><b data-count="4">0</b><span>liaisons colis régulières</span></div>
    <div class="rv" style="--i:3"><b data-count="5">0</b><span>campagnes solidaires</span></div>
  </div>
</div></section>
<section class="sec dark"><div class="wrap split">
  <div>${secHead('Nos valeurs', 'Proches de vous.<br><em>Ouverts sur le monde.</em>')}</div>
  <div class="grid g2">${[['Clarté', 'Prix, étapes et conditions expliqués sans jargon.'], ['Proximité', 'Une équipe joignable, ancrée à Conakry.'], ['Exigence', 'Le même niveau de soin, du colis au chantier.'], ['Engagement', 'Une part de notre énergie dédiée aux femmes et aux enfants.']].map((v, i) => `<article class="step rv" style="--i:${i}"><h3>${v[0]}</h3><p>${v[1]}</p></article>`).join('')}</div>
</div></section>
${ctaBand('Une question sur le groupe ?', 'Partenariat, presse, recrutement ou simple renseignement : écrivez-nous.', `<a class="btn btn-light" href="#/contact">Nous contacter</a>`)}`
  };
}
function viewHub(filId) {
  const f = D.filiales.find(x => x.id === filId), list = D.services.filter(s => s.fil === filId);
  const img = filId === 'paradise' ? 'assets/img/bien-etre.jpg' : 'assets/img/destinations.jpg';
  return {
    u: filId === 'paradise' ? 'showroom' : 'voyages', dark: true, title: f.name + ' — Jess Holding',
    html: `${uhero({ img, kicker: f.name, title: f.tagline.replace('.', '') + '<em>.</em>', lead: `Découvrez les services de ${f.name}, chacun avec son parcours dédié.`, crumbs: [[f.short]] })}
<section class="sec"><div class="wrap"><div class="bento">${list.map((s, i) => `<a class="tile rv" style="--i:${i};grid-column:span ${12 / Math.min(list.length, 4) | 0}" href="#${s.route}"><img src="${s.img}" alt="" loading="lazy"><span class="go">→</span><div><span class="tag">${s.label}</span></div><div><h3>${s.name}</h3><p>${s.desc}</p></div></a>`).join('')}</div></div></section>`
  };
}

/* =====================================================================
   VOYAGES
   ===================================================================== */
const GEO = { Conakry: [-13.7, 9.5], Abidjan: [-4.0, 5.3], Paris: [2.35, 48.85], 'New York': [-74, 40.7], Londres: [-0.13, 51.5], 'Dubaï': [55.3, 25.2], Marrakech: [-8, 31.6], Dakar: [-17.4, 14.7] };
const proj = ([lon, lat]) => [((lon + 85) / 150) * 1000, ((62 - lat) / 84) * 500];
function viewVoyages(q) {
  const moods = [['all', 'Toutes'], ['culture', 'Culture'], ['plage', 'Plage'], ['shopping', 'Shopping'], ['etudes', 'Études'], ['famille', 'Famille'], ['romantique', 'Romantique'], ['affaires', 'Affaires'], ['premium', 'Premium']];
  const [cx, cy] = proj(GEO.Conakry);
  const grat = [...Array(16)].map((_, i) => `<line x1="${i * 66.6}" y1="0" x2="${i * 66.6}" y2="500"/>`).join('') + [...Array(8)].map((_, i) => `<line x1="0" y1="${i * 71}" x2="1000" y2="${i * 71}"/>`).join('');
  const pins = D.destinations.map(d => { const [x, y] = proj(GEO[d.city]); const left = ['Londres', 'Dubaï'].includes(d.city), up = d.city === 'Londres'; return `<g class="pin" data-pin="${d.city}" tabindex="0" role="button" aria-label="${d.city}"><circle cx="${x}" cy="${y}" r="16"/><circle cx="${x}" cy="${y}" r="5" fill="#fff"/><text x="${left ? x - 14 : x + 14}" y="${y + (up ? -12 : 5)}" text-anchor="${left ? 'end' : 'start'}" dominant-baseline="middle">${d.city}</text></g>`; }).join('');
  return {
    u: 'voyages', dark: true, title: 'Jess Voyages — Voyages sur mesure au départ de Conakry',
    html: `
${uhero({ img: 'assets/img/destinations.jpg', kicker: 'Jess Voyages & Services', title: 'Où commencera votre <em>prochain voyage&nbsp;?</em>', lead: 'Billets, séjours sur mesure, visa et plan de paiement. Partagez vos envies et votre budget : nous préparons une proposition claire au départ de Conakry.', crumbs: [['Voyages & Services', '#/voyages-services'], ['Voyager']], actions: `<a class="btn" href="#/voyages#billets">Réserver un billet</a><a class="btn btn-ghost" href="#/voyages#planifier">Voyage sur mesure</a>`, side: `<div class="glass rv" style="--i:5;min-width:260px"><span class="small" style="opacity:.75">Évasion du moment</span><div class="d3" style="margin:6px 0">Dubaï</div><span class="small">Dès ${fmtM(11800000)} · 7 jours</span></div>` })}
${subnav([['billets', 'Billets d’avion'], ['planifier', 'Sur mesure'], ['carte', 'Carte des vols'], ['destinations', 'Destinations'], ['offres', 'Offres'], ['visa', 'Assistant visa'], ['paiement', 'Plan de paiement'], ['faq', 'Questions']])}
<section class="sec-tight" id="billets"><div class="wrap">
  ${secHead('Billets d’avion', 'Partez d’où vous voulez, <em>allez où vous voulez.</em>', 'Saisissez librement votre ville ou aéroport de départ et d’arrivée, vos dates et vos voyageurs, puis réservez et payez en ligne.')}
  <form class="panel fsearch rv" id="fSearch" novalidate>
    <div class="fs-top">
      <div class="seg" id="fTrip"><button type="button" data-v="rt" aria-pressed="true">Aller-retour</button><button type="button" data-v="ow" aria-pressed="false">Aller simple</button></div>
      <label class="fs-class"><span class="vh">Classe</span><select id="fClass" class="input"><option value="1">Économique</option><option value="1.6">Premium économique</option><option value="2.9">Affaires</option><option value="4.5">Première</option></select></label>
    </div>
    <div class="fs-grid">
      <label class="field fs-from"><span>Départ</span><input id="fFrom" list="airportList" required autocomplete="off" placeholder="Ville ou aéroport" value="${esc(q.from || 'Conakry (CKY)')}"></label>
      <button type="button" class="fs-swap" id="fSwap" aria-label="Inverser départ et arrivée">⇄</button>
      <label class="field fs-to"><span>Arrivée</span><input id="fTo" list="airportList" required autocomplete="off" placeholder="Ville ou aéroport" value="${esc(q.to || '')}"></label>
      <label class="field"><span>Aller</span><input type="date" id="fGo" required></label>
      <label class="field" id="fBackWrap"><span>Retour</span><input type="date" id="fBack"></label>
      <div class="field fs-pax"><span>Voyageurs</span><button type="button" class="input fs-paxbtn" id="fPaxBtn" aria-expanded="false" aria-controls="fPop">1 adulte</button>
        <div class="fs-pop" id="fPop" hidden>
          ${[['ad', 'Adultes', '12 ans et plus', 1], ['ch', 'Enfants', '2 à 11 ans', 0], ['in', 'Bébés', 'Moins de 2 ans', 0]].map(x => `<div class="fs-row"><div><b>${x[1]}</b><small>${x[2]}</small></div><div class="stepper"><button type="button" data-px="${x[0]}|-1" aria-label="Retirer ${x[1].toLowerCase()}">−</button><output data-pxo="${x[0]}">${x[3]}</output><button type="button" data-px="${x[0]}|1" aria-label="Ajouter ${x[1].toLowerCase()}">+</button></div></div>`).join('')}
          <button type="button" class="btn btn-sm btn-block" id="fPaxOk">Valider</button>
        </div>
      </div>
      <button class="btn fs-go">Rechercher</button>
    </div>
    <datalist id="airportList">${D.airports.map(a => `<option value="${a[1]} (${a[0]})">${a[2]}</option>`).join('')}</datalist>
  </form>
  <div id="fResults" aria-live="polite"></div>
</div></section>

<section class="sec-tight" id="planifier"><div class="wrap">
  ${secHead('Voyage sur mesure', 'Votre séjour complet, <em>chiffré en direct.</em>')}
  <div class="planner" style="margin-top:0">
    <form class="panel rv" id="plan" novalidate>
      <p class="kicker">Planificateur transparent</p>
      <h2 class="d3" style="margin-bottom:20px">Votre voyage, chiffré en direct.</h2>
      <div class="fields">
        <label class="field"><span>Départ</span><select name="from"><option>Conakry</option><option>Dakar</option><option>Abidjan</option></select></label>
        <label class="field"><span>Destination</span><select name="dest" id="pDest">${D.destinations.map(d => `<option ${q.dest === d.city ? 'selected' : ''}>${d.city}</option>`).join('')}</select></label>
        <label class="field"><span>Aller</span><input type="date" name="go" id="pGo" required></label>
        <label class="field"><span>Retour</span><input type="date" name="back" id="pBack" required></label>
        <div class="field"><span>Voyageurs</span><div class="stepper"><button type="button" data-step="-1" aria-label="Moins">−</button><output id="pPax">1</output><button type="button" data-step="1" aria-label="Plus">+</button></div></div>
        <div class="field"><span>Confort</span><div class="seg" id="pComfort">${['Essentiel', 'Confort', 'Premium'].map((c, i) => `<button type="button" aria-pressed="${i === 1}" data-v="${i}">${c}</button>`).join('')}</div></div>
        <label class="field full"><span>Budget total</span><div class="budget-out"><b class="big-num" id="pBudgetOut"></b><span class="small muted">3 M → 80 M GNF</span></div><input type="range" min="3000000" max="80000000" step="500000" value="${q.budget || 25000000}" id="pBudget"></label>
      </div>
    </form>
    <div class="panel rv" style="--i:1" aria-live="polite">
      <p class="kicker">Estimation indicative</p>
      <div class="budget-out"><span class="d3" id="pDestName"></span><b class="price" id="pEst"></b></div>
      <div class="stack" id="pStack"></div>
      <div class="legend" id="pLegend"></div>
      <div class="fit"><div class="fit-ring" id="pRing"><span></span></div><div><b id="pFitT"></b><div class="small muted" id="pFitS"></div></div></div>
      <button class="btn btn-block" id="pSend" style="margin-top:18px">Recevoir ma proposition personnalisée</button>
      <p class="note">Estimation indicative : billets, hôtel et taxes varient selon les dates et disponibilités. Votre conseiller confirme chaque prix.</p>
    </div>
  </div>
</div></section>

<section class="sec-tight" id="carte"><div class="wrap">
  ${secHead('Carte des vols', 'Le monde, <em>depuis Conakry.</em>', 'Touchez une destination pour voir la durée de vol, les formalités et la meilleure saison.')}
  <div class="worldmap rv">
    <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" aria-label="Carte des destinations">
      <defs><linearGradient id="arcg" x1="0" x2="1"><stop offset="0" stop-color="#d98b99"/><stop offset="1" stop-color="#fff"/></linearGradient></defs>
      <g stroke="rgba(255,255,255,.07)" stroke-width="1">${grat}</g>
      <g id="arcs"></g>
      <g><circle cx="${cx}" cy="${cy}" r="22" fill="rgba(217,139,153,.3)"><animate attributeName="r" values="12;26;12" dur="3s" repeatCount="indefinite"/></circle><circle cx="${cx}" cy="${cy}" r="7" fill="#d98b99"/><text class="ck" x="${cx + 14}" y="${cy + 24}" fill="#fff">Conakry</text></g>
      ${pins}
    </svg>
    <div class="map-info" id="mapInfo"></div>
  </div>
</div></section>

<section class="sec" id="destinations"><div class="wrap">
  ${secHead('Destinations', 'Des horizons <em>qui vous ressemblent.</em>', 'Filtrez selon vos envies. Chaque destination ouvre une fiche détaillée avec un itinéraire type.')}
  <div class="chips scroll" id="moods" style="margin-bottom:24px">${moods.map((m, i) => `<button class="chip" aria-pressed="${i === 0}" data-mood="${m[0]}">${m[1]}</button>`).join('')}</div>
  <div class="dest-grid">${D.destinations.map((d, i) => `<button class="dest rv" style="--i:${i}" data-dest="${d.city}" data-moods="${d.mood.join(' ')}"><span class="bg ${d.sprite === 'none' ? 'alt' : ''}" style="background-position:${d.pos}% center"></span><span class="top"><span class="tag">${d.tag}</span><span class="tag">${d.days} jours</span></span><span><span class="small" style="opacity:.8">${d.country}</span><span class="h">${d.city}</span><span class="p">${d.summary}</span><span class="row">Dès ${fmtM(d.price)}<span>↗</span></span></span></button>`).join('')}</div>
  <p class="note">Destinations, durées et prix de démonstration au départ de Conakry, par personne. Toute proposition est confirmée manuellement.</p>
</div></section>

<section class="sec alt" id="offres"><div class="wrap">
  ${secHead('Offres du moment', 'Partir mieux, <em>au bon moment.</em>', 'Des conditions lisibles, sans fausse urgence.')}
  <div class="grid g3">${D.promos.map((p, i) => `<article class="promo rv" style="--i:${i}">${p.old ? `<span class="ribbon-tag">-${Math.round((1 - p.price / p.old) * 100)} %</span>` : ''}<span class="tag">${p.route}</span><h3 class="d3">${p.title}</h3><div class="price">${fmt(p.price)}${p.old ? `<s>${fmt(p.old)}</s>` : ''}</div><span class="small muted"><span class="li">${p.dates}</span><span class="li">${p.cond}</span></span>${waBtn('Demander cette offre', waMsg('Jess Voyages', 'Je suis intéressé(e) par cette offre :', [['Offre', p.title], ['Trajet', p.route], ['Dates', p.dates], ['Prix affiché', fmt(p.price)]]), 'btn btn-ghost')}</article>`).join('')}</div>
</div></section>

<section class="sec" id="visa"><div class="wrap split" style="align-items:start">
  <div>${secHead('Assistant visa', 'Votre dossier,<br><em>pièce par pièce.</em>', 'Choisissez le motif et la destination : cochez les pièces déjà prêtes. Nous vérifions le reste avec vous.')}
    <div class="field" style="margin-bottom:14px"><span>Motif du voyage</span><div class="seg" id="vMotif">${[['tourisme', 'Tourisme'], ['etudes', 'Études'], ['affaires', 'Affaires'], ['famille', 'Visite familiale']].map((m, i) => `<button type="button" aria-pressed="${i === 0}" data-v="${m[0]}">${m[1]}</button>`).join('')}</div></div>
    <label class="field"><span>Destination</span><select id="vDest">${D.destinations.map(d => `<option ${q.dest === d.city ? 'selected' : ''}>${d.city}</option>`).join('')}</select></label>
    <p class="note">Liste indicative. Les exigences officielles varient selon le consulat et votre profil ; nous les vérifions sur les sources officielles avant tout dépôt.</p>
  </div>
  <div class="panel rv">
    <div class="budget-out"><b id="vTitle"></b><span class="tag" id="vCount"></span></div>
    <div class="bar" style="margin-bottom:18px"><i id="vBar"></i></div>
    <ul class="checklist" id="vList"></ul>
    <button class="btn btn-block" id="vSend" style="margin-top:18px">Faire vérifier mon dossier</button>
  </div>
</div></section>

<section class="sec dark" id="paiement"><div class="wrap split">
  <div>${secHead('Plan de paiement', 'Voyager maintenant,<br><em>régler en plusieurs fois.</em>', 'Simulez un échéancier. L’équipe étudie votre demande, sans engagement en ligne.')}</div>
  <div class="panel" style="background:rgba(255,255,255,.06)">
    <label class="field"><span>Montant du voyage</span><div class="budget-out"><b class="big-num" id="ppAmtOut"></b></div><input type="range" id="ppAmt" min="3000000" max="60000000" step="500000" value="15000000"></label>
    <div class="field" style="margin-top:18px"><span>Nombre de mensualités</span><div class="seg" id="ppN">${[2, 3, 4, 6].map((n, i) => `<button type="button" aria-pressed="${i === 1}" data-v="${n}">${n} mois</button>`).join('')}</div></div>
    <div class="fit" style="background:rgba(255,255,255,.06)"><div><span class="small muted">Acompte (30 %)</span><div class="price" id="ppDown"></div></div><div style="margin-left:auto;text-align:right"><span class="small muted">Puis par mois</span><div class="big-num" id="ppMonth"></div></div></div>
    <button class="btn btn-block" id="ppSend" style="margin-top:16px;--b:#fff;color:#4b0f18">Demander une étude</button>
    <p class="note">Simulation indicative sans frais affichés. Conditions définitives communiquées après étude du dossier.</p>
  </div>
</div></section>

<section class="sec" id="faq"><div class="wrap split" style="align-items:start">
  ${secHead('Questions fréquentes', 'Avant <em>le départ.</em>')}
  ${faq([['Le prix affiché est-il définitif ?', 'Non. Il s’agit d’une estimation. Votre conseiller confirme le prix réel selon les dates, la compagnie et les disponibilités.'], ['Gérez-vous les demandes de visa ?', 'Nous vous accompagnons dans la préparation et la vérification du dossier. La décision appartient toujours au consulat.'], ['Puis-je payer en plusieurs fois ?', 'Oui, sur étude. Utilisez le simulateur de plan de paiement puis envoyez votre demande.'], ['Proposez-vous des voyages de groupe ?', 'Oui : familles, associations, entreprises ou pèlerinages. Indiquez le nombre de voyageurs dans le planificateur.']])}
</div></section>
${ctaBand('Le prochain départ peut <em>commencer aujourd’hui.</em>', 'Un conseiller Jess Voyages vous répond sur WhatsApp avec une proposition claire.', `${waBtn('Écrire à Jess Voyages', 'Bonjour Jess Voyages, je souhaite préparer un voyage.', 'btn btn-light')}<a class="btn btn-ghost" href="tel:+224613131323">Appeler</a>`)}
`,
    init(q) {
      initFlights(q);
      const f = $('#plan'), go = $('#pGo'), back = $('#pBack'), budget = $('#pBudget'), dest = $('#pDest');
      let pax = +(q.pax || 1), comfort = 1;
      const t0 = addDays(today(), 21);
      go.min = iso(today()); go.value = iso(t0); back.value = iso(addDays(t0, 7)); back.min = go.value;
      const parts = [['Billets', .52, '#7b1a2a'], ['Hôtel', .28, '#a8475a'], ['Activités', .09, '#6e6e73'], ['Transferts', .05, '#a7a7ad'], ['Marge sécurité', .06, '#d6d6da']];
      const calc = () => {
        setRange(budget);
        const d = D.destinations.find(x => x.city === dest.value);
        const nights = Math.max(1, Math.round((new Date(back.value) - new Date(go.value)) / 864e5) || d.days);
        const est = d.price * pax * (0.55 + 0.45 * nights / d.days) * [0.82, 1, 1.45][comfort];
        $('#pPax').textContent = pax;
        $('#pBudgetOut').textContent = fmtM(+budget.value);
        $('#pDestName').textContent = `${d.city} · ${nights} nuits`;
        $('#pEst').textContent = '≈ ' + fmtM(est);
        $('#pStack').innerHTML = parts.map(p => `<i style="width:${p[1] * 100}%;background:${p[2]}" title="${p[0]}"></i>`).join('');
        $('#pLegend').innerHTML = parts.map(p => `<span style="--c:${p[2]}">${p[0]}<b>${fmtM(est * p[1])}</b></span>`).join('');
        const ratio = Math.min(100, Math.round(+budget.value / est * 100));
        const ring = $('#pRing'); ring.style.setProperty('--v', ratio); ring.querySelector('span').textContent = ratio + '%';
        const alt = D.destinations.filter(x => x.price * pax * [0.82, 1, 1.45][comfort] <= +budget.value && x.city !== d.city).sort((a, b) => b.price - a.price)[0];
        $('#pFitT').textContent = ratio >= 100 ? 'Votre budget couvre ce voyage' : ratio >= 80 ? 'Presque ! Quelques ajustements suffisent' : 'Budget à ajuster';
        $('#pFitS').textContent = ratio >= 100 ? `Marge disponible : ${fmtM(+budget.value - est)} pour des extras.` : alt ? `Avec ce budget, ${alt.city} est accessible (${alt.days} jours).` : 'Essayez moins de nuits, ou le confort Essentiel.';
        return { d, nights, est };
      };
      $$('[data-step]', f).forEach(b => b.addEventListener('click', () => { pax = Math.min(9, Math.max(1, pax + +b.dataset.step)); calc(); }));
      segBind($('#pComfort'), v => { comfort = +v; calc(); });
      [budget, dest, go, back].forEach(el => el.addEventListener('input', () => { if (el === go) { back.min = go.value; if (back.value <= go.value) back.value = iso(addDays(new Date(go.value), 7)); } calc(); drawArc(dest.value); }));
      $('#pSend').addEventListener('click', () => { const { d, nights, est } = calc(); openWA(waMsg('Jess Voyages', 'Je souhaite recevoir une proposition personnalisée :', [['Départ', f.from.value], ['Destination', d.city], ['Dates', `${go.value} → ${back.value} (${nights} nuits)`], ['Voyageurs', pax], ['Confort', ['Essentiel', 'Confort', 'Premium'][comfort]], ['Budget total', fmt(+budget.value)], ['Estimation affichée', fmtM(est)]])); });
      /* carte */
      const drawArc = city => {
        const d = D.destinations.find(x => x.city === city); if (!d) return;
        const [x1, y1] = proj(GEO.Conakry), [x2, y2] = proj(GEO[city]);
        const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - Math.hypot(x2 - x1, y2 - y1) * 0.35;
        $('#arcs').innerHTML = D.destinations.map(o => { const [a, b] = proj(GEO[o.city]); const m1 = (x1 + a) / 2, m2 = Math.min(y1, b) - Math.hypot(a - x1, b - y1) * .35; return `<path class="arc" d="M${x1},${y1} Q${m1},${m2} ${a},${b}" opacity=".35"/>`; }).join('') + `<path class="arc on" d="M${x1},${y1} Q${mx},${my} ${x2},${y2}"/>`;
        $$('.pin').forEach(p => p.classList.toggle('on', p.dataset.pin === city));
        $('#mapInfo').innerHTML = `<div class="glass"><span class="small">Destination</span><b>${d.city}</b></div><div class="glass"><span class="small">Vol</span><b>${d.flight}</b></div><div class="glass"><span class="small">Formalités</span><b>${d.visa}</b></div><div class="glass"><span class="small">Meilleure saison</span><b>${d.season}</b></div><button class="btn btn-light btn-sm" data-plan="${d.city}">Planifier →</button>`;
      };
      $$('.pin').forEach(p => { const fn = () => { drawArc(p.dataset.pin); }; p.addEventListener('click', fn); p.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } }); });
      addListener(document, 'click', e => { const b = e.target.closest('[data-plan]'); if (b) { closeDrawer(); dest.value = b.dataset.plan; calc(); drawArc(b.dataset.plan); scrollToId('planifier'); } });
      /* destinations */
      $$('[data-mood]').forEach(b => b.addEventListener('click', () => {
        $$('[data-mood]').forEach(x => x.setAttribute('aria-pressed', x === b));
        $$('.dest').forEach(c => c.classList.toggle('hidden', b.dataset.mood !== 'all' && !c.dataset.moods.includes(b.dataset.mood)));
      }));
      $$('.dest').forEach(c => c.addEventListener('click', () => {
        const d = D.destinations.find(x => x.city === c.dataset.dest);
        const plan = ['Arrivée, transfert et installation', 'Découverte guidée des incontournables', 'Journée libre ou excursion', 'Quartiers, gastronomie et shopping', 'Temps fort culturel', 'Détente et derniers achats', 'Transfert et vol retour'].slice(0, Math.min(d.days, 7));
        openDrawer(`<p class="kicker" style="color:var(--accent)">${d.country} · ${d.tag}</p><h2 class="d2" id="drawerTitle">${d.city}</h2><p class="lead">${d.summary}</p>
          <div class="grid g2" style="margin:20px 0">${[['Vol', d.flight], ['Formalités', d.visa], ['Saison idéale', d.season], ['Durée type', d.days + ' jours']].map(x => `<div class="card" style="padding:16px"><span class="small muted">${x[0]}</span><br><b>${x[1]}</b></div>`).join('')}</div>
          <h3 class="d3" style="margin:24px 0 12px">Itinéraire type</h3><ol class="checklist" style="counter-reset:a">${plan.map((p, i) => `<li><label style="cursor:default"><span class="tag">J${i + 1}${i === plan.length - 1 && d.days > 7 ? '→' + d.days : ''}</span><span>${p}</span></label></li>`).join('')}</ol>
          <div class="fit" style="margin-top:20px"><div><span class="small muted">À partir de</span><div class="big-num">${fmtM(d.price)}</div><span class="small muted">par personne, vol + hôtel</span></div></div>
          <div class="actions" style="margin-top:20px"><button class="btn" data-plan="${d.city}">Planifier ce voyage</button>${waBtn('Demander un devis', waMsg('Jess Voyages', 'Je souhaite un devis pour cette destination :', [['Destination', d.city], ['Durée', d.days + ' jours'], ['Prix indicatif', fmt(d.price)]]), 'btn btn-ghost')}</div>`);
      }));
      /* visa */
      let motif = 'tourisme';
      const vDraw = () => {
        const done = store.get('visa-' + motif, []);
        const list = D.visaChecklists[motif];
        $('#vTitle').textContent = `Dossier ${$('#vMotif [aria-pressed=true]').textContent.toLowerCase()} · ${$('#vDest').value}`;
        $('#vList').innerHTML = list.map((x, i) => `<li><label><input type="checkbox" data-i="${i}" ${done.includes(i) ? 'checked' : ''}><span>${x}</span></label></li>`).join('');
        const upd = () => { const c = $$('#vList input:checked').map(x => +x.dataset.i); store.set('visa-' + motif, c); $('#vCount').textContent = `${c.length}/${list.length} prêtes`; $('#vBar').style.width = c.length / list.length * 100 + '%'; };
        $$('#vList input').forEach(x => x.addEventListener('change', () => { upd(); if ($$('#vList input:checked').length === list.length) toast('Dossier complet. Faites-le vérifier par notre équipe.'); }));
        upd();
      };
      segBind($('#vMotif'), v => { motif = v; vDraw(); });
      $('#vDest').addEventListener('change', vDraw);
      $('#vSend').addEventListener('click', () => { const list = D.visaChecklists[motif]; const c = $$('#vList input:checked').map(x => +x.dataset.i); openWA(waMsg('Jess Voyages', 'Je souhaite faire vérifier mon dossier visa :', [['Destination', $('#vDest').value], ['Motif', motif], ['Pièces prêtes', c.map(i => list[i]).join(', ') || 'aucune'], ['Pièces manquantes', list.filter((_, i) => !c.includes(i)).join(', ') || 'aucune']])); });
      vDraw();
      /* plan de paiement */
      let n = 3; const amt = $('#ppAmt');
      const pp = () => { setRange(amt); const a = +amt.value, down = a * .3; $('#ppAmtOut').textContent = fmtM(a); $('#ppDown').textContent = fmt(down); $('#ppMonth').textContent = fmtM((a - down) / n); };
      amt.addEventListener('input', pp); segBind($('#ppN'), v => { n = +v; pp(); }); pp();
      $('#ppSend').addEventListener('click', () => openWA(waMsg('Jess Voyages', 'Je souhaite étudier un plan de paiement :', [['Montant du voyage', fmt(+amt.value)], ['Mensualités', n], ['Acompte simulé', fmt(+amt.value * .3)]])));
      calc(); drawArc(dest.value);
    }
  };
}

/* =====================================================================
   COLIS
   ===================================================================== */
function viewColis(q) {
  const deps = nextDepartures();
  const n = deps[0];
  return {
    u: 'colis', dark: true, title: 'Jess Colis — Envoi de colis Conakry, Paris, Casablanca',
    html: `
${uhero({ img: 'assets/img/famille-colis.jpg', kicker: 'Jess Colis', title: 'D’un point à l’autre, <em>avec soin.</em>', lead: 'Estimez votre envoi au kilo, consultez les prochains départs et suivez votre colis jusqu’au retrait.', crumbs: [['Voyages & Services', '#/voyages-services'], ['Colis']], actions: `<a class="btn" href="#/colis#estimer">Estimer mon envoi</a><a class="btn btn-ghost" href="#/colis#suivi">Suivre un colis</a>`,
      side: `<div class="glass rv" style="--i:5;width:min(100%,420px)"><div class="budget-out" style="margin:0 0 12px"><span class="small"><b>Prochain départ</b><br>${n.r.from} → ${n.r.to} · ${dShort(new Date(n.t))}</span><span class="tag" style="background:rgba(255,255,255,.18);color:#fff">Dépôt avant ${dShort(new Date(n.dl))}</span></div><div class="countdown" data-cd="${n.t}"><div><b data-d>00</b><span>Jours</span></div><div><b data-h>00</b><span>Heures</span></div><div><b data-m>00</b><span>Min</span></div><div><b data-s>00</b><span>Sec</span></div></div></div>` })}
${subnav([['estimer', 'Estimer'], ['departs', 'Départs'], ['suivi', 'Suivi'], ['autorise', 'Que puis-je envoyer ?'], ['emballage', 'Emballage'], ['faq', 'Questions']])}
<section class="sec" id="estimer"><div class="wrap">
  ${secHead('Estimateur', 'Votre prix,<br><em>au gramme près.</em>', 'Poids réel ou volumétrique : nous retenons le plus élevé, comme les transporteurs. Tout est calculé sous vos yeux.')}
  <div class="est">
    <form class="panel rv" id="est" novalidate>
      <div class="fields">
        <label class="field full"><span>Trajet</span><select name="route" id="eRoute">${D.parcelRoutes.map(r => `<option value="${r.id}" ${q.to === r.to ? 'selected' : ''}>${r.from} → ${r.to}</option>`).join('')}</select></label>
        <label class="field full"><span>Poids réel</span><div class="budget-out"><b class="big-num" id="eKgOut"></b><span class="small muted">0,5 → 100 kg</span></div><input type="range" id="eKg" min="0.5" max="100" step="0.5" value="${Math.min(100, +q.kg || 10)}"></label>
      </div>
      <div class="box3d" aria-hidden="true"><div class="cube" id="cube"></div></div>
      <div class="fields" style="grid-template-columns:repeat(3,1fr)">
        <label class="field"><span>Long. (cm)</span><input type="number" id="eL" min="5" max="200" value="50"></label>
        <label class="field"><span>Larg. (cm)</span><input type="number" id="eW" min="5" max="200" value="40"></label>
        <label class="field"><span>Haut. (cm)</span><input type="number" id="eH" min="5" max="200" value="30"></label>
      </div>
      <div class="fields" style="margin-top:14px">
        <div class="field"><span>Formule</span><div class="seg" id="eMode"><button type="button" aria-pressed="true" data-v="std">Standard</button><button type="button" aria-pressed="false" data-v="exp">Express</button></div></div>
        <label class="field"><span>Valeur déclarée (facultatif)</span><input type="number" id="eVal" min="0" step="50000" placeholder="Pour l’assurance"></label>
      </div>
    </form>
    <div class="rv" style="--i:1">
      <div class="ticket" aria-live="polite">
        <div class="budget-out" style="margin:0 0 10px"><b id="tRoute" style="font-size:1.1rem"></b><span class="tag" style="background:rgba(255,255,255,.15);color:#fff" id="tMode"></span></div>
        <div class="rowx"><span>Poids réel</span><b id="tReal"></b></div>
        <div class="rowx"><span>Poids volumétrique</span><b id="tVol"></b></div>
        <div class="rowx"><span>Poids facturé</span><b id="tBill"></b></div>
        <div class="rowx"><span>Tarif au kilo</span><b id="tRate"></b></div>
        <div class="rowx"><span>Assurance (2 %)</span><b id="tIns"></b></div>
        <div class="rowx"><span>Délai estimé</span><b id="tDays"></b></div>
        <div class="total"><div><span class="small" style="opacity:.7">Total estimé</span><br><b id="tTotal"></b></div><div style="text-align:right" class="small"><span style="opacity:.7">Prochain départ</span><br><b id="tNext"></b></div></div>
      </div>
      <button class="btn btn-block" id="eSend" style="margin-top:16px">Réserver ma place sur WhatsApp</button>
      <p class="note">Tarifs indicatifs. Le prix final est confirmé après pesée à l’agence de Nongo.</p>
    </div>
  </div>
</div></section>

<section class="sec alt" id="departs"><div class="wrap">
  ${secHead('Calendrier', 'Les prochains <em>départs.</em>', 'Déposez votre colis avant la date limite pour partir sur le vol choisi.', `<div class="seg" id="dFilter"><button type="button" aria-pressed="true" data-v="all">Tous</button><button type="button" aria-pressed="false" data-v="from">Depuis Conakry</button><button type="button" aria-pressed="false" data-v="to">Vers Conakry</button></div>`)}
  <div class="deps" id="deps">${deps.map((d, i) => { const dt = new Date(d.t), open = d.dl > Date.now(), j = Math.ceil((d.dl - Date.now()) / 864e5); return `<article class="dep rv" style="--i:${i}" data-dir="${d.r.from === 'Conakry' ? 'from' : 'to'}"><div class="dt"><b>${pad(dt.getDate())}</b><span>${dt.toLocaleDateString('fr-FR', { month: 'short' })}</span></div><div><h3>${d.r.from} → ${d.r.to}</h3><span class="small muted">Dépôt avant le ${dLong(new Date(d.dl))} · ${d.r.days}</span><br><span class="tag ${open ? (j <= 3 ? 'warn' : 'ok') : 'no'}" style="margin-top:6px">${open ? (j <= 3 ? `Plus que ${j} j pour déposer` : 'Dépôt ouvert') : 'Dépôt clos'}</span></div>${open ? waBtn('Réserver →', waMsg('Jess Colis', 'Je souhaite réserver une place sur ce départ :', [['Trajet', `${d.r.from} → ${d.r.to}`], ['Départ', dLong(dt)], ['Date limite de dépôt', dLong(new Date(d.dl))]]), 'btn btn-sm btn-ghost') : '<span></span>'}</article>`; }).join('')}</div>
  <p class="note">Calendrier indicatif, confirmé chaque semaine par l’équipe.</p>
</div></section>

<section class="sec" id="suivi"><div class="wrap split" style="align-items:start">
  <div>${secHead('Suivi', 'Où est <em>mon colis&nbsp;?</em>', 'Saisissez la référence inscrite sur votre reçu.')}
    <form class="ask-box" id="trackF" style="box-shadow:none"><label class="vh" for="trackIn">Référence</label><input id="trackIn" placeholder="Ex. JESS-2026-0412" value="${esc(q.ref || '')}" autocomplete="off"><button class="btn">Suivre</button></form>
    <p class="note">Démonstration : essayez n’importe quelle référence au format JESS-AAAA-NNNN. Aucune donnée client réelle n’est affichée.</p>
  </div>
  <div class="panel" id="trackOut" aria-live="polite"><p class="muted" style="margin:0">Le parcours de votre colis s’affichera ici, étape par étape.</p></div>
</div></section>

<section class="sec alt" id="autorise"><div class="wrap split" style="align-items:start">
  <div>${secHead('Vérificateur', 'Puis-je <em>l’envoyer&nbsp;?</em>', 'Tapez un objet : nous vous disons s’il est accepté, soumis à condition ou interdit.')}
    <div class="chips"><span class="tag ok">Accepté</span><span class="tag warn">Sous condition</span><span class="tag no">Interdit</span></div>
  </div>
  <div class="panel"><label class="vh" for="itemIn">Objet</label><input class="input" id="itemIn" placeholder="Ex. parfum, téléphone, huile…" autocomplete="off"><div class="item-res" id="itemRes"></div></div>
</div></section>

<section class="sec" id="emballage"><div class="wrap">
  ${secHead('Bien préparer', 'Un colis bien emballé <em>arrive mieux.</em>')}
  <div class="steps">${[['Carton solide', 'Double cannelure, sans anciennes étiquettes.'], ['Calage', 'Remplissez les vides : rien ne doit bouger.'], ['Liquides', 'Double sac étanche, bouchons scotchés.'], ['Étiquette', 'Nom, téléphone du destinataire et référence Jess.']].map((s, i) => `<article class="step rv" style="--i:${i}"><b>0${i + 1}</b><h3>${s[0]}</h3><p>${s[1]}</p></article>`).join('')}</div>
</div></section>

<section class="sec alt" id="faq"><div class="wrap split" style="align-items:start">
  ${secHead('Questions fréquentes', 'Tout savoir <em>sur l’envoi.</em>')}
  ${faq([['Comment est calculé le poids facturé ?', 'Nous comparons le poids réel et le poids volumétrique (L × l × h / 5 000) et retenons le plus élevé.'], ['Où déposer mon colis ?', 'À l’agence Jess de Nongo, Conakry, avant la date limite indiquée pour chaque départ.'], ['Puis-je assurer mon colis ?', 'Oui : indiquez la valeur déclarée. L’assurance représente 2 % de cette valeur.'], ['Comment le destinataire récupère-t-il le colis ?', 'Il est prévenu par téléphone à l’arrivée et retire le colis avec une pièce d’identité et la référence.']])}
</div></section>
${ctaBand('Prêt à <em>expédier&nbsp;?</em>', 'L’équipe Jess Colis confirme le tarif, la date de dépôt et les documents nécessaires.', waBtn('Écrire à Jess Colis', 'Bonjour Jess Colis, je souhaite préparer un envoi.', 'btn btn-light'))}
`,
    init(q) {
      countdown($('[data-cd]'));
      const kg = $('#eKg'), L = $('#eL'), W = $('#eW'), H = $('#eH'), route = $('#eRoute'), val = $('#eVal');
      let mode = 'std';
      const calc = () => {
        setRange(kg);
        const r = D.parcelRoutes.find(x => x.id === route.value);
        const real = +kg.value, vol = Math.round((+L.value || 0) * (+W.value || 0) * (+H.value || 0) / 5000 * 10) / 10;
        const bill = Math.max(real, vol), rate = mode === 'exp' ? r.express : r.rate, ins = (+val.value || 0) * .02;
        const total = bill * rate + ins;
        const nd = nextDepartures().find(d => d.route === r.id && d.dl > Date.now());
        $('#eKgOut').textContent = real.toLocaleString('fr-FR') + ' kg';
        $('#tRoute').textContent = `${r.from} → ${r.to}`; $('#tMode').textContent = mode === 'exp' ? 'Express' : 'Standard';
        $('#tReal').textContent = real.toLocaleString('fr-FR') + ' kg'; $('#tVol').textContent = vol.toLocaleString('fr-FR') + ' kg';
        $('#tBill').textContent = bill.toLocaleString('fr-FR') + ' kg'; $('#tRate').textContent = fmt(rate);
        $('#tIns').textContent = ins ? fmt(ins) : '—'; $('#tDays').textContent = mode === 'exp' ? '2–4 jours' : r.days;
        $('#tTotal').textContent = fmt(total); $('#tNext').textContent = nd ? dShort(new Date(nd.t)) : 'à confirmer';
        /* cube 3D proportionnel */
        const s = 110 / Math.max(+L.value, +W.value, +H.value, 1), l = +L.value * s, w = +W.value * s, h = +H.value * s;
        $('#cube').style.cssText = `width:${l}px;height:${h}px`;
        $('#cube').innerHTML = `<div class="f front" style="width:${l}px;height:${h}px;transform:translateZ(${w / 2}px)"></div><div class="f side" style="width:${w}px;height:${h}px;left:${(l - w) / 2}px;transform:rotateY(90deg) translateZ(${l / 2}px)"></div><div class="f top" style="width:${l}px;height:${w}px;top:${(h - w) / 2}px;transform:rotateX(90deg) translateZ(${h / 2}px)"></div>`;
        return { r, real, vol, bill, total, nd };
      };
      [kg, L, W, H, route, val].forEach(el => el.addEventListener('input', calc));
      segBind($('#eMode'), v => { mode = v; calc(); });
      $('#eSend').addEventListener('click', () => { const c = calc(); openWA(waMsg('Jess Colis', 'Je souhaite réserver une place pour un envoi :', [['Trajet', `${c.r.from} → ${c.r.to}`], ['Formule', mode === 'exp' ? 'Express' : 'Standard'], ['Poids réel', c.real + ' kg'], ['Dimensions', `${L.value} × ${W.value} × ${H.value} cm`], ['Poids facturé', c.bill + ' kg'], ['Valeur déclarée', val.value ? fmt(+val.value) : ''], ['Estimation', fmt(c.total)], ['Départ souhaité', c.nd ? dLong(new Date(c.nd.t)) : '']])); });
      calc();
      segBind($('#dFilter'), v => $$('.dep').forEach(d => d.hidden = v !== 'all' && d.dataset.dir !== v));
      /* suivi */
      const track = ref => {
        ref = ref.trim().toUpperCase(); const out = $('#trackOut');
        if (ref.length < 6) { out.innerHTML = '<p class="muted" style="margin:0">Référence trop courte. Exemple : <b>JESS-2026-0412</b></p>'; return; }
        const h = hash(ref), r = D.parcelRoutes[h % 4], at = 1 + h % 4, start = addDays(today(), -(at * 2 + 1));
        const steps = [['', 'Reçu à l’agence', `Agence de ${r.from === 'Conakry' ? 'Nongo' : r.from}`], ['', 'Contrôlé et emballé', 'Pesée, vérification et étiquetage'], ['', 'En transit', `${r.from} → ${r.to}`], ['', 'Arrivé à destination', `Entrepôt ${r.to}`], ['', 'Disponible au retrait', 'Le destinataire est prévenu par téléphone']];
        out.innerHTML = `<div class="budget-out" style="margin:0"><div><span class="small muted">Référence</span><br><b>${esc(ref)}</b></div><span class="tag">${r.from} → ${r.to} · ${(h % 30) + 3} kg</span></div><div class="bar" style="margin-top:14px"><i style="width:${at / 4 * 100}%"></i></div><div class="track-line">${steps.map((s, i) => `<div class="track-step ${i < at ? 'done' : i === at ? 'now' : ''}" style="transition-delay:${i * 120}ms"><i>${pad(i + 1)}</i><div><b>${s[1]}</b><small>${i <= at ? dLong(addDays(start, i * 2)) + ' · ' : ''}${s[2]}</small></div></div>`).join('')}</div>`;
      };
      $('#trackF').addEventListener('submit', e => { e.preventDefault(); track($('#trackIn').value); });
      if (q.ref) track(q.ref);
      /* objets */
      const ir = $('#itemRes'), lab = { ok: 'Accepté', warn: 'Sous condition', no: 'Interdit' };
      const items = v => { const n = norm(v); const list = D.items.filter(x => !n || norm(x[0]).includes(n) || norm(x[2]).includes(n)); ir.innerHTML = list.length ? list.map(x => `<div><div><b>${x[0]}</b><small>${x[2]}</small></div><span class="tag ${x[1]}">${lab[x[1]]}</span></div>`).join('') : `<div><div><b>Objet non répertorié</b><small>Demandez-nous : nous vérifions pour vous.</small></div>${waBtn('Demander', `Bonjour Jess Colis, puis-je envoyer : ${v} ?`, 'btn btn-sm')}</div>`; };
      $('#itemIn').addEventListener('input', e => items(e.target.value)); items('');
    }
  };
}
function countdown(el) {
  if (!el) return;
  const t = +el.dataset.cd;
  const tick = () => { let s = Math.max(0, Math.floor((t - Date.now()) / 1000)); const d = Math.floor(s / 86400); s %= 86400; const h = Math.floor(s / 3600); s %= 3600; $('[data-d]', el).textContent = pad(d); $('[data-h]', el).textContent = pad(h); $('[data-m]', el).textContent = pad(Math.floor(s / 60)); $('[data-s]', el).textContent = pad(s % 60); };
  tick(); addTimer(setInterval(tick, 1000));
}

/* =====================================================================
   BEAUTÉ
   ===================================================================== */
function viewBeaute(q) {
  const cats = [...new Set(D.beautyServices.map(s => s.cat))];
  return {
    u: 'beaute', dark: true, title: 'Jess Beauty — Salon, spa et onglerie à Nongo',
    html: `
${uhero({ img: 'assets/img/bien-etre.jpg', kicker: 'Jess Paradise · Beauté & bien-être', title: 'Votre beauté.<br>Votre rythme. <em>Votre moment.</em>', lead: 'Coiffure, onglerie, soins et rituels bien-être dans une expérience attentive et personnalisée à Nongo.', crumbs: [['Jess Paradise', '#/paradise'], ['Beauté']], actions: `<a class="btn" href="#/beaute#composer">Composer mon rituel</a><a class="btn btn-ghost" href="#/beaute#reserver">Réserver un créneau</a>`, side: `<div class="glass rv" style="--i:5"><span class="small" style="opacity:.75">Prochain créneau libre</span><div class="d3" style="margin-top:6px;text-transform:capitalize">${nextFreeSlot()}</div></div>` })}
${subnav([['rituels', 'Rituels'], ['composer', 'Composer'], ['reserver', 'Réserver'], ['engagements', 'Engagements'], ['faq', 'Questions']])}
<section class="sec" id="rituels"><div class="wrap">
  ${secHead('Nos rituels', 'Choisissez votre <em>niveau d’attention.</em>', 'Sélectionnez un rituel : il s’ajoute à votre composition. Vous pourrez le compléter librement.')}
  <div class="rituals">${D.rituals.map((r, i) => `<div class="ritual rv ${r.featured ? 'featured' : ''}" style="--i:${i}" role="button" tabindex="0" aria-pressed="false" data-ritual="${i}">${r.featured ? '<span class="tag" style="background:rgba(255,255,255,.2);color:#fff;align-self:flex-start">Le plus choisi</span>' : `<span class="tag" style="align-self:flex-start">${r.duration} min</span>`}<h3>${r.name}</h3><p class="muted small" style="margin:0">${r.copy}</p><ul>${r.items.map(x => `<li>${x}</li>`).join('')}</ul><span class="price">Dès ${fmt(r.price)}<br><small>${r.duration} min</small></span></div>`).join('')}</div>
</div></section>

<section class="sec alt" id="composer"><div class="wrap">
  ${secHead('Configurateur', 'Composez <em>votre moment.</em>', 'Ajoutez des prestations : le prix, la durée et le déroulé de votre rendez-vous se mettent à jour instantanément.')}
  <div class="composer">
    <div>
      <div class="chips scroll" style="margin-bottom:16px" id="bCats"><button class="chip" aria-pressed="true" data-cat="all">Tout</button>${cats.map(c => `<button class="chip" aria-pressed="false" data-cat="${c}">${c}</button>`).join('')}</div>
      <div class="svc-grid">${D.beautyServices.map((s, i) => `<button class="svc rv" style="--i:${i % 4}" aria-pressed="${q.svc === s.name}" data-svc="${i}" data-c="${s.cat}"><span><b>${s.name}</b><small>${fmt(s.price)} · ${s.min} min</small></span><i>+</i></button>`).join('')}</div>
    </div>
    <aside class="panel summary" aria-live="polite">
      <p class="kicker">Votre rituel</p>
      <div id="bSel" class="small muted">Aucune prestation sélectionnée pour l’instant.</div>
      <div class="timeline-bar" id="bTl"></div>
      <div class="budget-out"><span class="muted small">Durée totale</span><b id="bDur">0 min</b></div>
      <div class="budget-out"><span class="muted small">Estimation</span><b class="big-num" id="bTot">0 GNF</b></div>
      <a class="btn btn-block" href="#/beaute#reserver">Choisir mon créneau →</a>
      <p class="note">Prix indicatifs, confirmés par le salon selon la longueur des cheveux et les produits choisis.</p>
    </aside>
  </div>
</div></section>

<section class="sec" id="reserver"><div class="wrap">
  ${secHead('Réservation', 'Trois étapes, <em>tout simplement.</em>')}
  <form class="panel" id="bBook" novalidate>
    <div class="wizard-steps" aria-hidden="true"><i class="on"></i><i></i><i></i></div>
    <div class="wpane on" data-p="0">
      <h3 class="d3" style="margin-bottom:16px">Quand souhaitez-vous venir ?</h3>
      <div class="days" id="bDays" role="group" aria-label="Jour"></div>
      <div class="slots" id="bSlots" role="group" aria-label="Heure"></div>
      <p class="small muted" id="bWhen" style="margin-top:14px">Choisissez un jour puis une heure. Le salon est fermé le dimanche.</p>
    </div>
    <div class="wpane" data-p="1">
      <h3 class="d3" style="margin-bottom:16px">Comment vous joindre ?</h3>
      <div class="fields"><label class="field"><span>Nom complet</span><input name="nom" required autocomplete="name"></label><label class="field"><span>Téléphone WhatsApp</span><input name="tel" required type="tel" autocomplete="tel" placeholder="+224 …"></label>
      <label class="field full"><span>Préférences (facultatif)</span><textarea name="pref" placeholder="Style souhaité, sensibilité, événement…"></textarea></label></div>
    </div>
    <div class="wpane" data-p="2">
      <h3 class="d3" style="margin-bottom:16px">Vérifiez votre demande</h3>
      <div class="recap" id="bRecap"></div>
      <div class="checklist" style="margin-top:16px"><label><input type="checkbox" required name="ok"><span>J’accepte que ces informations servent uniquement à répondre à ma demande.</span></label></div>
    </div>
    <div class="actions" style="margin-top:24px;justify-content:space-between"><button type="button" class="btn btn-ghost" id="bPrev" hidden>← Retour</button><button type="button" class="btn" id="bNext" style="margin-left:auto">Continuer →</button></div>
  </form>
</div></section>

<section class="sec dark" id="engagements"><div class="wrap">
  ${secHead('Confort & confiance', 'Vous gardez le contrôle <em>de votre expérience.</em>')}
  <div class="steps">${[['Diagnostic', 'Comprendre votre besoin avant de commencer.'], ['Hygiène', 'Matériel et espaces préparés entre chaque cliente.'], ['Sur mesure', 'Des gestes adaptés à votre style et votre peau.'], ['Ponctualité', 'Un créneau organisé, confirmé et respecté.']].map((s, i) => `<article class="step rv" style="--i:${i}"><b>0${i + 1}</b><h3>${s[0]}</h3><p>${s[1]}</p></article>`).join('')}</div>
</div></section>
<section class="sec" id="faq"><div class="wrap split" style="align-items:start">
  ${secHead('Questions fréquentes', 'Avant votre <em>rendez-vous.</em>')}
  ${faq([['Les prix sont-ils définitifs ?', 'Ils sont indicatifs. Le salon confirme le tarif selon la prestation, la durée et les produits.'], ['Puis-je combiner plusieurs services ?', 'Oui, c’est tout l’intérêt du configurateur : votre sélection est transmise avec la demande.'], ['Ma réservation est-elle confirmée immédiatement ?', 'Elle devient définitive après la réponse de l’équipe Jess Beauty sur WhatsApp.'], ['Proposez-vous des forfaits mariage ?', 'Oui : le rituel « Mariée Jess » inclut un essai, la coiffure, le maquillage et les ongles.']])}
</div></section>
`,
    init(q) {
      const sel = new Set(D.beautyServices.map((s, i) => q.svc === s.name ? i : -1).filter(i => i >= 0));
      let ritual = -1, day = null, slot = null, step = 0;
      const pal = ['#7b1a2a', '#a8475a', '#6e6e73', '#5a1424', '#a7a7ad', '#c98f9b'];
      const draw = () => {
        const list = [...(ritual >= 0 ? [{ name: D.rituals[ritual].name, price: D.rituals[ritual].price, min: D.rituals[ritual].duration }] : []), ...[...sel].map(i => D.beautyServices[i])];
        const tot = list.reduce((a, s) => a + s.price, 0), dur = list.reduce((a, s) => a + s.min, 0);
        $('#bSel').innerHTML = list.length ? list.map(s => `<div class="budget-out" style="margin:4px 0"><span>${s.name}</span><b>${fmt(s.price)}</b></div>`).join('') : 'Aucune prestation sélectionnée pour l’instant.';
        $('#bTl').innerHTML = list.map((s, i) => `<i style="width:${s.min / dur * 100}%;background:${pal[i % pal.length]}" title="${s.name}">${s.min}′</i>`).join('');
        $('#bDur').textContent = dur >= 60 ? `${Math.floor(dur / 60)} h ${pad(dur % 60)}` : dur + ' min';
        $('#bTot').textContent = fmt(tot);
        return { list, tot, dur };
      };
      $$('[data-ritual]').forEach(b => b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); b.click(); } }));
      $$('[data-ritual]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.ritual; ritual = ritual === i ? -1 : i; $$('[data-ritual]').forEach(x => x.setAttribute('aria-pressed', +x.dataset.ritual === ritual)); draw(); if (ritual >= 0) toast(`${D.rituals[i].name} ajouté à votre rituel`); }));
      $$('[data-svc]').forEach(b => b.addEventListener('click', () => { const i = +b.dataset.svc; sel.has(i) ? sel.delete(i) : sel.add(i); b.setAttribute('aria-pressed', sel.has(i)); draw(); }));
      $$('[data-cat]').forEach(b => b.addEventListener('click', () => { $$('[data-cat]').forEach(x => x.setAttribute('aria-pressed', x === b)); $$('[data-svc]').forEach(s => s.hidden = b.dataset.cat !== 'all' && s.dataset.c !== b.dataset.cat); }));
      draw();
      /* jours et créneaux */
      const days = [...Array(14)].map((_, i) => addDays(today(), i + 1));
      $('#bDays').innerHTML = days.map(d => `<button type="button" class="day" data-day="${iso(d)}" aria-pressed="false" ${d.getDay() === 0 ? 'disabled' : ''}><small>${d.toLocaleDateString('fr-FR', { weekday: 'short' })}</small><b>${d.getDate()}</b><small>${d.toLocaleDateString('fr-FR', { month: 'short' })}</small></button>`).join('');
      const drawSlots = () => { $('#bSlots').innerHTML = day ? D.slots.map(s => `<button type="button" data-slot="${s}" aria-pressed="${slot === s}" ${hash(day + s + 'b') % 4 === 0 ? 'disabled aria-label="' + s + ' complet"' : ''}>${s}</button>`).join('') : ''; };
      addListener($('#bDays'), 'click', e => { const b = e.target.closest('[data-day]'); if (!b) return; day = b.dataset.day; slot = null; $$('[data-day]').forEach(x => x.setAttribute('aria-pressed', x === b)); drawSlots(); when(); });
      addListener($('#bSlots'), 'click', e => { const b = e.target.closest('[data-slot]'); if (!b) return; slot = b.dataset.slot; $$('[data-slot]').forEach(x => x.setAttribute('aria-pressed', x === b)); when(); });
      const when = () => { const { dur } = draw(); if (day && slot) { const [h, m] = slot.split(':').map(Number), end = h * 60 + m + Math.max(dur, 30); $('#bWhen').innerHTML = `<b>${dLong(new Date(day + 'T12:00'))}</b> de <b>${slot}</b> à <b>${pad(Math.floor(end / 60))}:${pad(end % 60)}</b> (fin estimée)`; } };
      /* assistant */
      const f = $('#bBook'), panes = $$('.wpane', f), bars = $$('.wizard-steps i', f);
      const goStep = n => { step = n; panes.forEach((p, i) => p.classList.toggle('on', i === n)); bars.forEach((b, i) => b.classList.toggle('on', i <= n)); $('#bPrev').hidden = n === 0; $('#bNext').textContent = n === 2 ? 'Envoyer sur WhatsApp' : 'Continuer →';
        if (n === 2) { const { list, tot, dur } = draw(), d = formData(f); $('#bRecap').innerHTML = [['Prestations', list.map(s => s.name).join(', ') || 'À définir avec le salon'], ['Date', dLong(new Date(day + 'T12:00')) + ' à ' + slot], ['Durée', dur + ' min'], ['Estimation', fmt(tot)], ['Nom', esc(d.nom)], ['Téléphone', esc(d.tel)]].map(r => `<div class="rowx"><span>${r[0]}</span><b>${r[1]}</b></div>`).join(''); } };
      $('#bPrev').addEventListener('click', () => goStep(step - 1));
      $('#bNext').addEventListener('click', () => {
        if (step === 0 && !(day && slot)) { toast('Choisissez un jour et une heure'); return; }
        if (step === 1 && !valid(f)) return;
        if (step === 2) { if (!valid(f)) return; const { list, tot, dur } = draw(), d = formData(f); openWA(waMsg('Jess Beauty', 'Je souhaite réserver un rendez-vous :', [['Prestations', list.map(s => s.name).join(', ') || 'À définir'], ['Date souhaitée', dLong(new Date(day + 'T12:00')) + ' à ' + slot], ['Durée estimée', dur + ' min'], ['Estimation', fmt(tot)], ['Nom', d.nom], ['Téléphone', d.tel], ['Préférences', d.pref]])); return; }
        goStep(step + 1);
      });
    }
  };
}

/* =====================================================================
   SHOWROOM
   ===================================================================== */
let bag = store.get('bag', []);
function viewShowroom() {
  return {
    u: 'showroom', dark: true, title: 'Showroom Jess Paradise — Mode, accessoires et parfums',
    html: `
${uhero({ img: 'assets/img/boutique.jpg', kicker: 'Jess Paradise · Showroom', title: 'Des pièces choisies.<br><em>Un style à vous.</em>', lead: 'Vêtements, accessoires et parfums. Composez votre sélection, réservez-la et venez l’essayer en boutique.', crumbs: [['Jess Paradise', '#/paradise'], ['Showroom']], actions: `<a class="btn" href="#/showroom#collection">Voir la collection</a>` })}
<section class="sec" id="collection"><div class="wrap">
  ${secHead('La collection', 'Bordeaux, ivoire <em>et or.</em>', '', `<label class="field" style="min-width:200px"><span class="vh">Trier</span><select id="sSort"><option value="">Trier : sélection</option><option value="asc">Prix croissant</option><option value="desc">Prix décroissant</option></select></label>`)}
  <div class="chips scroll" style="margin-bottom:24px" id="sCats"><button class="chip" aria-pressed="true" data-c="all">Tout</button>${[...new Set(D.products.map(p => p.cat))].map(c => `<button class="chip" aria-pressed="false" data-c="${c}">${c}</button>`).join('')}<button class="chip" aria-pressed="false" data-c="fav">Favoris</button></div>
  <div class="shop" id="shop"></div>
  <p class="note">Collection de démonstration : stocks, tailles et prix sont confirmés par la boutique. Aucun paiement en ligne.</p>
</div></section>
<section class="sec alt"><div class="wrap">
  <div class="grid g3">${[['Mise de côté 48 h', 'Votre sélection est réservée à votre nom pendant 48 heures.'], ['Essayage en boutique', 'Venez essayer avant de décider, sans engagement.'], ['Conseil style', 'Une conseillère vous aide à composer une tenue complète.']].map((x, i) => `<article class="card rv" style="--i:${i}"><h3 class="d3" style="margin-bottom:8px">${x[0]}</h3><p class="muted" style="margin:0">${x[1]}</p></article>`).join('')}</div>
</div></section>
<button class="bag-btn" id="bagBtn" aria-label="Ouvrir ma sélection">Ma sélection <b id="bagN">0</b></button>
`,
    init() {
      let cat = 'all', sort = '';
      const favs = new Set(store.get('favs', []));
      const size = {};
      const draw = () => {
        let list = D.products.filter(p => cat === 'all' || (cat === 'fav' ? favs.has(p.id) : p.cat === cat));
        if (sort) list = [...list].sort((a, b) => sort === 'asc' ? a.price - b.price : b.price - a.price);
        $('#shop').innerHTML = list.length ? list.map((p, i) => `<article class="prod" style="animation-delay:${i * 60}ms"><div class="prod-img" style="background-position:${p.pos}" role="img" aria-label="${p.name}"><button class="fav" data-fav="${p.id}" aria-pressed="${favs.has(p.id)}" aria-label="Ajouter aux favoris"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-8.6C1.4 8.6 3 5 6.4 5c2 0 3.2 1.1 3.9 2.2h3.4C14.4 6.1 15.6 5 17.6 5 21 5 22.6 8.6 21.2 11.4 19 15.6 12 20 12 20z" fill="currentColor"/></svg></button></div><div class="prod-body"><span class="small muted">${p.cat}</span><h3>${p.name}</h3><span class="price">${fmt(p.price)}</span><div class="sizes" role="group" aria-label="Taille">${p.sizes.map((s, k) => `<button type="button" data-size="${p.id}|${s}" aria-pressed="${(size[p.id] || p.sizes[0]) === s}">${s}</button>`).join('')}</div><button class="btn btn-sm" data-add="${p.id}" style="margin-top:auto">Ajouter à ma sélection</button></div></article>`).join('') : '<p class="muted">Aucun favori pour l’instant. Touchez le cœur sur une pièce.</p>';
      };
      $$('[data-c]').forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; $$('[data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); }));
      $('#sSort').addEventListener('change', e => { sort = e.target.value; draw(); });
      addListener($('#shop'), 'click', e => {
        const f = e.target.closest('[data-fav]'), s = e.target.closest('[data-size]'), a = e.target.closest('[data-add]');
        if (f) { favs.has(f.dataset.fav) ? favs.delete(f.dataset.fav) : favs.add(f.dataset.fav); store.set('favs', [...favs]); f.setAttribute('aria-pressed', favs.has(f.dataset.fav)); if (cat === 'fav') draw(); }
        if (s) { const [id, v] = s.dataset.size.split('|'); size[id] = v; $$(`[data-size^="${id}|"]`).forEach(x => x.setAttribute('aria-pressed', x === s)); }
        if (a) { const p = D.products.find(x => x.id === a.dataset.add), sz = size[p.id] || p.sizes[0]; const ex = bag.find(x => x.id === p.id && x.size === sz); ex ? ex.qty++ : bag.push({ id: p.id, size: sz, qty: 1 }); saveBag(); toast(`${p.name} (${sz}) ajouté à votre sélection`); const bb = $('#bagBtn'); bb.classList.remove('bump'); void bb.offsetWidth; bb.classList.add('bump'); }
      });
      $('#bagBtn').addEventListener('click', openBag);
      draw(); saveBag();
    }
  };
}
function saveBag() { store.set('bag', bag); const n = bag.reduce((a, x) => a + x.qty, 0), b = $('#bagBtn'); if (b) { $('#bagN').textContent = n; b.classList.toggle('show', n > 0); } }
function openBag() {
  const draw = () => {
    const tot = bag.reduce((a, x) => a + D.products.find(p => p.id === x.id).price * x.qty, 0);
    $('#drawerBody').innerHTML = `<p class="kicker">Showroom Jess Paradise</p><h2 class="d2" id="drawerTitle">Ma sélection</h2>
      ${bag.length ? bag.map((x, i) => { const p = D.products.find(y => y.id === x.id); return `<div class="bag-line"><span class="th" style="background-position:${p.pos}"></span><div><b>${p.name}</b><br><span class="small muted">Taille ${x.size} · ${fmt(p.price)}</span><div class="stepper" style="margin-top:8px;transform:scale(.85);transform-origin:0"><button data-q="${i}|-1" aria-label="Moins">−</button><output>${x.qty}</output><button data-q="${i}|1" aria-label="Plus">+</button></div></div><button class="link" data-rm="${i}">Retirer</button></div>`; }).join('') : '<p class="muted">Votre sélection est vide.</p>'}
      ${bag.length ? `<div class="budget-out" style="margin-top:20px"><span class="muted">Total indicatif</span><b class="big-num">${fmt(tot)}</b></div><button class="btn btn-wa btn-block" id="bagSend">Réserver ma sélection (48 h)</button><p class="note">La boutique confirme la disponibilité et met vos pièces de côté. Paiement en boutique uniquement.</p>` : ''}`;
    $$('[data-q]').forEach(b => b.addEventListener('click', () => { const [i, d] = b.dataset.q.split('|').map(Number); bag[i].qty += d; if (bag[i].qty < 1) bag.splice(i, 1); saveBag(); draw(); }));
    $$('[data-rm]').forEach(b => b.addEventListener('click', () => { bag.splice(+b.dataset.rm, 1); saveBag(); draw(); }));
    $('#bagSend')?.addEventListener('click', () => openWA(waMsg('Jess Paradise Showroom', 'Je souhaite réserver ces pièces pour un essayage :', [...bag.map(x => { const p = D.products.find(y => y.id === x.id); return [p.name, `taille ${x.size} × ${x.qty}`]; }), ['Total indicatif', fmt(tot)]])));
  };
  draw(); openDrawer();
}

/* =====================================================================
   APPARTEMENTS
   ===================================================================== */
function viewAppartements(q) {
  return {
    u: 'appartements', dark: true, title: 'Jess Séjours — Appartements meublés à Conakry',
    html: `
${uhero({ img: 'assets/img/suite-kipe-v2.jpg', kicker: 'Jess Paradise · Séjours', title: 'Votre appartement à Conakry, <em>à la nuit.</em>', lead: 'Studios et appartements meublés, Wi-Fi, climatisation et accueil personnalisé. Choisissez vos dates : le prix s’affiche immédiatement.', crumbs: [['Jess Paradise', '#/paradise'], ['Appartements']], actions: `<a class="btn" href="#/appartements#reserver">Vérifier les disponibilités</a><a class="btn btn-ghost" href="#/appartements#comparer">Comparer</a>` })}
${subnav([['logements', 'Logements'], ['reserver', 'Réserver'], ['comparer', 'Comparer'], ['pratique', 'Infos pratiques']])}
<section class="sec" id="logements"><div class="wrap">
  ${secHead('Nos logements', 'Comme chez vous, <em>dès l’arrivée.</em>')}
  <div class="stays">${D.stays.map((s, i) => `<article class="stay rv" style="--i:${i}" data-stay-card="${s.id}"><div class="stay-img"><img src="${s.img}" alt="${s.name}" loading="lazy" decoding="async"><span class="tag">${s.area}</span><span class="rate">${String(s.rating).replace('.', ',')} / 5</span></div><div class="stay-body"><h3>${s.name}</h3><p class="muted small" style="margin:0">${s.blurb}</p><div class="specs"><span>${s.guests} voyageurs</span><span>${s.beds} chambre${s.beds > 1 ? 's' : ''}</span><span>${s.size} m²</span></div><div class="perks">${s.perks.map(p => `<span>${p}</span>`).join('')}</div><div class="budget-out" style="margin-top:auto"><span class="price">${fmt(s.price)} <small>/ nuit</small></span><button class="btn btn-sm" data-pick="${s.id}">Choisir</button></div></div></article>`).join('')}</div>
</div></section>
<section class="sec alt" id="reserver"><div class="wrap">
  ${secHead('Réservation', 'Choisissez <em>vos dates.</em>', 'Touchez la date d’arrivée puis celle de départ. Les dates barrées sont déjà réservées.')}
  <div class="booker">
    <div class="panel">
      <div class="seg" id="aStay" style="margin-bottom:20px">${D.stays.map(s => `<button type="button" data-v="${s.id}" aria-pressed="${(q.stay || 'nongo') === s.id}">${s.name}</button>`).join('')}</div>
      <div class="cal-head"><button type="button" id="calPrev" aria-label="Mois précédent">←</button><span class="small muted" id="calHint">Sélectionnez votre arrivée</span><button type="button" id="calNext" aria-label="Mois suivant">→</button></div>
      <div class="cals" id="cals"></div>
    </div>
    <aside class="panel summary recap" aria-live="polite">
      <p class="kicker">Votre séjour</p>
      <h3 class="d3" id="aName"></h3>
      <div class="rowx"><span>Arrivée</span><b id="aIn">—</b></div>
      <div class="rowx"><span>Départ</span><b id="aOut">—</b></div>
      <div class="rowx"><span>Voyageurs</span><div class="stepper"><button type="button" data-g="-1" aria-label="Moins">−</button><output id="aG">1</output><button type="button" data-g="1" aria-label="Plus">+</button></div></div>
      <div class="rowx"><span id="aNights">0 nuit</span><b id="aSub">—</b></div>
      <div class="rowx"><span>Réduction semaine (−10 %)</span><b id="aDisc">—</b></div>
      <div class="rowx"><span>Ménage & linge</span><b>${fmt(100000)}</b></div>
      <div class="tot"><span class="muted">Total indicatif</span><b class="big-num" id="aTot">—</b></div>
      <button class="btn btn-block" id="aSend" style="margin-top:18px" disabled>Demander la disponibilité</button>
      <p class="note">Disponibilités indicatives. L’équipe confirme l’adresse exacte, le prix et les modalités d’arrivée. Aucun paiement en ligne.</p>
    </aside>
  </div>
</div></section>
<section class="sec" id="comparer"><div class="wrap">
  ${secHead('Comparateur', 'Le bon logement <em>en un coup d’œil.</em>')}
  <div class="tablewrap rv"><table class="compare"><thead><tr><th scope="col"><span class="vh">Critère</span></th>${D.stays.map(s => `<th scope="col">${s.name}</th>`).join('')}</tr></thead><tbody>
    ${[['Quartier', s => s.area], ['Prix / nuit', s => fmt(s.price), 'min'], ['Voyageurs', s => s.guests, 'max'], ['Surface', s => s.size + ' m²', 'max'], ['Chambres', s => s.beds], ['Note', s => String(s.rating).replace('.', ',') + ' / 5', 'max'], ['Idéal pour', s => ({ nongo: 'Solo, mission courte', kaloum: 'Famille, affaires', kipe: 'Long séjour, télétravail' })[s.id]]].map(([l, fn, best]) => { const vals = D.stays.map(s => parseFloat(String(fn(s)).replace(/[^\d.]/g, '')) || 0); const b = best === 'min' ? Math.min(...vals) : Math.max(...vals); return `<tr><td>${l}</td>${D.stays.map((s, i) => `<td class="${best && vals[i] === b ? 'best' : ''}">${fn(s)}</td>`).join('')}</tr>`; }).join('')}
  </tbody></table></div>
</div></section>
<section class="sec dark" id="pratique"><div class="wrap">
  ${secHead('Infos pratiques', 'Un séjour <em>sans surprise.</em>')}
  <div class="steps">${[['Arrivée', 'À partir de 14 h, accueil en personne et remise des clés.'], ['Départ', 'Avant 11 h. Bagagerie possible sur demande.'], ['Énergie', 'Groupe électrogène ou solution de secours selon le logement.'], ['Assistance', 'Une équipe joignable 7 j/7 pendant tout le séjour.']].map((s, i) => `<article class="step rv" style="--i:${i}"><b>0${i + 1}</b><h3>${s[0]}</h3><p>${s[1]}</p></article>`).join('')}</div>
</div></section>
`,
    init(q) {
      let stay = D.stays.find(s => s.id === q.stay) || D.stays[0], a = null, b = null, g = 1, off = 0;
      const busy = (d) => hash(stay.id + iso(d)) % 6 === 0;
      const t0 = today();
      if (q.n) { const n = Math.min(30, Math.max(1, +q.n || 1)); for (let k = 3; k < 90 && !b; k++) { const s0 = addDays(t0, k); let ok = true; for (let i = 0; i < n; i++) if (busy(addDays(s0, i))) { ok = false; break; } if (ok) { a = s0; b = addDays(s0, n); } } }
      const month = (base) => {
        const y = base.getFullYear(), m = base.getMonth(), first = new Date(y, m, 1), len = new Date(y, m + 1, 0).getDate(), lead = (first.getDay() + 6) % 7;
        let h = `<div class="cal"><div class="mname">${first.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</div>${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(x => `<span class="dow">${x}</span>`).join('')}${'<span></span>'.repeat(lead)}`;
        for (let i = 1; i <= len; i++) {
          const d = new Date(y, m, i), past = d < t0, bz = busy(d), id = iso(d);
          const c = [a && id === iso(a) ? 's' : '', b && id === iso(b) ? 'e' : '', a && b && d > a && d < b ? 'inr' : '', bz ? 'busy' : '', id === iso(t0) ? 'today' : ''].join(' ');
          h += `<button type="button" class="${c}" data-date="${id}" ${past || bz ? 'disabled' : ''} aria-label="${dLong(d)}${bz ? ' (réservé)' : ''}">${i}</button>`;
        }
        return h + '</div>';
      };
      const draw = () => {
        const base = new Date(t0.getFullYear(), t0.getMonth() + off, 1);
        $('#cals').innerHTML = month(base) + month(new Date(base.getFullYear(), base.getMonth() + 1, 1));
        $('#calPrev').disabled = off <= 0;
        $('#calHint').textContent = !a ? 'Sélectionnez votre arrivée' : !b ? 'Sélectionnez votre départ' : 'Dates sélectionnées';
        $('#aName').textContent = stay.name; $('#aG').textContent = g;
        $('#aIn').textContent = a ? dShort(a) : '—'; $('#aOut').textContent = b ? dShort(b) : '—';
        const n = a && b ? Math.round((b - a) / 864e5) : 0, sub = n * stay.price, disc = n >= 7 ? sub * .1 : 0;
        $('#aNights').textContent = `${n} nuit${n > 1 ? 's' : ''} × ${fmt(stay.price)}`; $('#aSub').textContent = n ? fmt(sub) : '—';
        $('#aDisc').textContent = disc ? '− ' + fmt(disc) : '—'; $('#aTot').textContent = n ? fmt(sub - disc + 100000) : '—';
        $('#aSend').disabled = !n;
        $$('[data-stay-card]').forEach(c => c.classList.toggle('sel', c.dataset.stayCard === stay.id));
        return { n, total: sub - disc + 100000 };
      };
      addListener($('#cals'), 'click', e => {
        const btn = e.target.closest('[data-date]'); if (!btn) return;
        const d = new Date(btn.dataset.date + 'T00:00');
        if (!a || b || d <= a) { a = d; b = null; }
        else { for (let x = addDays(a, 1); x < d; x = addDays(x, 1)) if (busy(x)) { toast('Une date réservée se trouve dans cette période'); a = d; b = null; draw(); return; } b = d; }
        draw();
      });
      $('#calPrev').addEventListener('click', () => { off = Math.max(0, off - 1); draw(); });
      $('#calNext').addEventListener('click', () => { off = Math.min(10, off + 1); draw(); });
      $$('[data-g]').forEach(x => x.addEventListener('click', () => { g = Math.min(stay.guests, Math.max(1, g + +x.dataset.g)); if (g === stay.guests && +x.dataset.g > 0) toast(`Capacité maximale : ${stay.guests} voyageurs`); draw(); }));
      const pick = id => { stay = D.stays.find(s => s.id === id); a = b = null; g = Math.min(g, stay.guests); $$('#aStay button').forEach(x => x.setAttribute('aria-pressed', x.dataset.v === id)); draw(); };
      segBind($('#aStay'), pick);
      $$('[data-pick]').forEach(x => x.addEventListener('click', () => { pick(x.dataset.pick); scrollToId('reserver'); }));
      $('#aSend').addEventListener('click', () => { const { n, total } = draw(); openWA(waMsg('Jess Séjours', 'Je souhaite vérifier la disponibilité de ce logement :', [['Logement', stay.name + ' (' + stay.area + ')'], ['Arrivée', dLong(a)], ['Départ', dLong(b)], ['Nuits', n], ['Voyageurs', g], ['Total indicatif', fmt(total)]])); });
      draw();
    }
  };
}

/* =====================================================================
   BTP
   ===================================================================== */
function viewBTP(q) {
  const types = [['neuf', '', 'Construction neuve', 'Maison, villa, immeuble'], ['reno', '', 'Rénovation', 'Remise à neuf, mise aux normes'], ['ext', '', 'Extension', 'Étage, pièce, annexe']];
  return {
    u: 'btp', dark: true, title: 'Jess Paradise BTP — Construction et rénovation à Conakry',
    html: `
${uhero({ img: 'assets/img/appartement-btp.jpg', kicker: 'Jess Paradise · BTP', title: 'Bâtir <em>avec méthode.</em>', lead: 'Construction, rénovation et extension pour particuliers et professionnels. Estimez votre projet, puis nous l’affinons ensemble après visite technique.', crumbs: [['Jess Paradise', '#/paradise'], ['BTP']], actions: `<a class="btn" href="#/btp#estimer">Estimer mon projet</a><a class="btn btn-ghost" href="#/btp#methode">Notre méthode</a>`, extra: '<div class="btp-hero-grid" aria-hidden="true"></div>' })}
${subnav([['estimer', 'Estimateur'], ['methode', 'Méthode'], ['metiers', 'Métiers'], ['faq', 'Questions']])}
<section class="sec" id="estimer"><div class="wrap">
  ${secHead('Estimateur de projet', 'Votre projet, <em>chiffré et planifié.</em>', 'Une première fourchette de budget et de durée, construite à partir de ratios moyens observés à Conakry.')}
  <div class="btp-est">
    <div class="panel rv">
      <div class="field"><span>Type de projet</span><div class="type-cards" id="tType">${types.map((t, i) => `<button type="button" data-v="${t[0]}" aria-pressed="${i === 0}">${BUL}<b>${t[2]}</b><small>${t[3]}</small></button>`).join('')}</div></div>
      <label class="field" style="margin-top:20px"><span>Surface</span><div class="budget-out"><b class="big-num" id="tM2Out"></b><span class="small muted">20 → 800 m²</span></div><input type="range" id="tM2" min="20" max="800" step="10" value="${Math.min(800, +q.m2 || 150)}"></label>
      <div class="fields" style="margin-top:18px">
        <div class="field"><span>Niveaux</span><div class="stepper"><button type="button" data-l="-1" aria-label="Moins">−</button><output id="tLv">R+0</output><button type="button" data-l="1" aria-label="Plus">+</button></div></div>
        <div class="field"><span>Standing</span><div class="seg" id="tStd"><button type="button" data-v="0" aria-pressed="false">Éco</button><button type="button" data-v="1" aria-pressed="true">Standard</button><button type="button" data-v="2" aria-pressed="false">Haut de gamme</button></div></div>
      </div>
      <div class="field" style="margin-top:18px"><span>Options</span><div class="chips" id="tOpts">${[['cloture', 'Clôture & portail', 25e6], ['forage', 'Forage', 35e6], ['solaire', 'Solaire', 40e6], ['plans', 'Plans d’architecte', 15e6]].map(o => `<button type="button" class="chip" aria-pressed="false" data-o="${o[0]}" data-p="${o[2]}">${o[1]}</button>`).join('')}</div></div>
    </div>
    <div class="panel rv" style="--i:1" aria-live="polite">
      <div class="house" aria-hidden="true"><div class="bld" id="tHouse"></div></div>
      <div class="budget-out" style="margin-top:18px"><span class="muted small">Budget estimé</span><b class="big-num" id="tCost"></b></div>
      <div class="budget-out"><span class="muted small">Durée prévisionnelle</span><b class="price" id="tDur"></b></div>
      <div class="gantt" id="tGantt"></div>
      <button class="btn btn-block" id="tSend" style="margin-top:20px">Demander une visite technique</button>
      <p class="note">Fourchette indicative hors terrain et hors aléas. Le devis définitif est établi après visite et étude technique.</p>
    </div>
  </div>
</div></section>
<section class="sec alt" id="methode"><div class="wrap">
  ${secHead('Notre méthode', 'De l’idée <em>à la remise des clés.</em>')}
  <div class="phase">${[['Diagnostic', 'Besoin, terrain, contraintes et budget.'], ['Étude & devis', 'Plans, options et chiffrage détaillé.'], ['Planification', 'Calendrier, approvisionnement, équipes.'], ['Réalisation', 'Chantier coordonné, points réguliers et photos.'], ['Réception', 'Contrôle qualité, levée des réserves, livraison.']].map((p, i) => `<div class="rv" style="--i:${i}"><b>${i + 1}</b><h3>${p[0]}</h3><p>${p[1]}</p></div>`).join('')}</div>
</div></section>
<section class="sec" id="metiers"><div class="wrap">
  ${secHead('Nos métiers', 'Un interlocuteur, <em>tous les corps d’état.</em>')}
  <div class="grid g3">${[['', 'Gros œuvre', 'Fondations, maçonnerie, dalles et charpente.'], ['', 'Second œuvre', 'Menuiseries, carrelage, peinture, faux plafonds.'], ['', 'Réseaux', 'Électricité, plomberie, climatisation.'], ['', 'Rénovation', 'Toiture, étanchéité, remise aux normes.'], ['', 'Suivi de chantier', 'Coordination, contrôle qualité et reporting.'], ['', 'Aménagement', 'Intérieurs, cuisines et salles de bain clés en main.']].map((m, i) => `<article class="card rv" style="--i:${i % 3}"><span class="num">${pad(i + 1)}</span><h3 class="d3" style="margin:10px 0 6px">${m[1]}</h3><p class="muted" style="margin:0">${m[2]}</p></article>`).join('')}</div>
</div></section>
<section class="sec alt" id="faq"><div class="wrap split" style="align-items:start">
  ${secHead('Questions fréquentes', 'Avant de <em>poser la première pierre.</em>')}
  ${faq([['L’estimation inclut-elle le terrain ?', 'Non. Elle couvre la construction selon la surface, le standing et les options choisies.'], ['Pouvez-vous m’aider avec les plans ?', 'Oui, l’option « Plans d’architecte » couvre la conception et les documents nécessaires.'], ['Comment suivre l’avancement ?', 'Des points réguliers avec photos et un interlocuteur unique pendant tout le chantier.'], ['Intervenez-vous pour les entreprises ?', 'Oui : bureaux, commerces et immeubles de rapport.']])}
</div></section>
${ctaBand('Parlons de <em>votre projet.</em>', 'Visite technique, étude et devis détaillé : une équipe Jess Paradise BTP vous accompagne.', waBtn('Présenter mon projet', 'Bonjour Jess Paradise BTP, je souhaite présenter un projet.', 'btn btn-light'))}
`,
    init() {
      let type = 'neuf', lv = 0, std = 1; const opts = new Set(); const m2 = $('#tM2');
      const rates = { neuf: [2.8e6, 3.8e6, 5.8e6], reno: [1.1e6, 1.6e6, 2.6e6], ext: [2.5e6, 3.4e6, 5.2e6] };
      const calc = () => {
        setRange(m2);
        const s = +m2.value, base = s * rates[type][std] * (1 + lv * .06), extra = [...opts].reduce((a, o) => a + +$(`[data-o="${o}"]`).dataset.p, 0);
        const lo = base * .9 + extra, hi = base * 1.15 + extra;
        const months = Math.max(2, Math.round((type === 'reno' ? 1.5 : 3) + s / (type === 'reno' ? 120 : 70) + lv * 1.5));
        $('#tM2Out').textContent = s + ' m²'; $('#tLv').textContent = 'R+' + lv;
        $('#tCost').textContent = `${fmtM(lo).replace(' GNF', '')} – ${fmtM(hi)}`;
        $('#tDur').textContent = `≈ ${months} mois`;
        const w = Math.min(220, 70 + s / 4);
        $('#tHouse').style.setProperty('--w', w + 'px');
        $('#tHouse').innerHTML = [...Array(lv + 1)].map(() => `<div class="lvl">${'<i></i>'.repeat(Math.max(2, Math.round(w / 45)))}</div>`).join('') + '<div class="roof"></div>';
        const ph = type === 'reno' ? [['Diagnostic', 0, 10], ['Démolition', 10, 15], ['Réseaux', 25, 25], ['Finitions', 45, 45], ['Réception', 90, 10]] : [['Études', 0, 12], ['Gros œuvre', 12, 43], ['Second œuvre', 50, 32], ['Finitions', 78, 17], ['Réception', 95, 5]];
        $('#tGantt').innerHTML = ph.map(p => `<div><span>${p[0]}</span><em style="--s:${p[1]}%;--w:${p[2]}%">${Math.max(1, Math.round(months * p[2] / 100 * 4))} sem.</em></div>`).join('');
        return { s, lo, hi, months };
      };
      segBind($('#tType'), v => { type = v; calc(); });
      segBind($('#tStd'), v => { std = +v; calc(); });
      $$('[data-l]').forEach(b => b.addEventListener('click', () => { lv = Math.min(4, Math.max(0, lv + +b.dataset.l)); calc(); }));
      $$('[data-o]').forEach(b => b.addEventListener('click', () => { opts.has(b.dataset.o) ? opts.delete(b.dataset.o) : opts.add(b.dataset.o); b.setAttribute('aria-pressed', opts.has(b.dataset.o)); calc(); }));
      m2.addEventListener('input', calc);
      $('#tSend').addEventListener('click', () => { const c = calc(); openWA(waMsg('Jess Paradise BTP', 'Je souhaite une visite technique pour mon projet :', [['Type', $('#tType [aria-pressed=true] b').textContent], ['Surface', c.s + ' m²'], ['Niveaux', 'R+' + lv], ['Standing', ['Économique', 'Standard', 'Haut de gamme'][std]], ['Options', [...opts].map(o => $(`[data-o="${o}"]`).textContent).join(', ') || 'aucune'], ['Estimation affichée', `${fmtM(c.lo)} – ${fmtM(c.hi)}`], ['Durée estimée', `≈ ${c.months} mois`]])); });
      calc();
    }
  };
}

/* =====================================================================
   ONG — Jess Children and Women
   ===================================================================== */
function viewONG(q) {
  const raised = D.campaigns.reduce((a, c) => a + c.raised, 0), donors = D.campaigns.reduce((a, c) => a + c.donors, 0);
  return {
    u: 'ong', dark: true, title: 'Jess Children and Women — Agir pour les femmes et les enfants',
    html: `
${uhero({ img: 'assets/img/jess-children-women.jpg', kicker: 'Jess Children and Women', title: 'Protéger aujourd’hui.<br><em>Ouvrir demain.</em>', lead: 'Nous mobilisons les communautés autour de l’éducation, de la santé, de la protection et de l’autonomie des femmes et des enfants en Guinée.', crumbs: [['Engagement']], actions: `<a class="btn" href="#/ong#soutenir">Soutenir une cause</a><a class="btn btn-ghost" href="#/ong#benevolat">Devenir bénévole</a>` })}
${subnav([['mission', 'Mission'], ['campagnes', 'Campagnes'], ['projets', 'Projets réalisés'], ['soutenir', 'Faire un don'], ['benevolat', 'Bénévolat'], ['transparence', 'Transparence']])}
<section class="sec" id="mission"><div class="wrap">
  <div class="counters" style="margin-bottom:clamp(48px,7vw,96px)">
    <div class="rv"><b data-count="${Math.round(raised / 1e6)}" data-suf=" M">0</b><span>GNF de promesses réunies</span></div>
    <div class="rv" style="--i:1"><b data-count="${donors}">0</b><span>soutiens engagés</span></div>
    <div class="rv" style="--i:2"><b data-count="${D.campaigns.length}">0</b><span>campagnes actives</span></div>
    <div class="rv" style="--i:3"><b data-count="4">0</b><span>axes d’action</span></div>
  </div>
  ${secHead('Pourquoi nous agissons', 'Chaque femme soutenue.<br><em>Chaque enfant protégé.</em>', 'Identifier les besoins avec les communautés, réunir les ressources et accompagner des actions simples, utiles et mesurables.')}
  <div class="pillars">${[['', 'Éducation', 'Matériel scolaire, maintien à l’école et accompagnement des jeunes filles.'], ['', 'Santé', 'Prévention, santé maternelle, hygiène et orientation adaptée.'], ['', 'Protection', 'Écoute et environnements plus sûrs pour les enfants vulnérables.'], ['', 'Autonomie', 'Compétences, mentorat et soutien à l’activité des femmes.']].map((p, i) => `<article class="pillar rv" style="--i:${i}"><i class="num">${pad(i + 1)}</i><h3>${p[1]}</h3><p>${p[2]}</p></article>`).join('')}</div>
  <p class="note">Chiffres de démonstration. Toute collecte réelle sera documentée et reliée à un moyen de paiement officiel validé.</p>
</div></section>
<section class="sec alt" id="campagnes"><div class="wrap">
  ${secHead('Cagnottes solidaires', 'Cinq façons de <em>faire une différence.</em>')}
  <div class="camp-grid">${D.campaigns.map((c, i) => { const p = Math.round(c.raised / c.goal * 100); return `<article class="camp rv" style="--i:${i % 3}"><div class="camp-img"><img src="${c.img}" alt="" loading="lazy" decoding="async" style="object-position:${c.pos || 'center'}"><span class="tag">${c.cause}</span></div><h3>${c.name}</h3><p class="muted small" style="margin:0">${c.copy}</p><div class="ring" style="--v:0" data-v="${p}"><i></i></div><div class="nums"><b>${p} %</b><span>${fmtM(c.raised)} / ${fmtM(c.goal)}</span></div><span class="small muted">${c.donors} soutiens · ${fmt(c.unit)} = 1 ${c.unitLabel}</span><button class="btn btn-sm" data-camp="${c.id}">Soutenir cette cause</button></article>`; }).join('')}</div>
</div></section>
<section class="sec" id="projets"><div class="wrap">
  ${secHead('Projets réalisés', 'Sur le terrain, <em>en images.</em>', 'Chaque action est documentée : lieu, date, résultats et photos.')}
  <div class="projects">${D.projects.map((p, i) => `<article class="proj rv ${i % 2 ? 'rev' : ''}">${carousel(p.images, p.title)}<div class="proj-body"><span class="li small muted">${p.date} · ${p.place}</span><h3 class="d3">${p.title}</h3><p class="muted">${p.copy}</p><div class="proj-stats">${p.stats.map(x => `<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}</div></div></article>`).join('')}</div>
  <p class="note">Photos et chiffres de démonstration, à remplacer par les images et bilans de terrain.</p>
</div></section>
<section class="sec dark" id="soutenir"><div class="wrap">
  ${secHead('Faire un don', 'Voyez ce que <em>votre don rend possible.</em>')}
  <div class="impact-sim">
    <form class="panel" id="oForm" style="background:rgba(255,255,255,.05)" novalidate>
      <div class="chips" id="oCamps" style="margin-bottom:18px">${D.campaigns.map((c, i) => `<button type="button" class="chip" aria-pressed="${(q.c || 'rentree') === c.id}" data-oc="${c.id}">${c.name}</button>`).join('')}</div>
      <div class="field" style="margin-bottom:16px"><span>Fréquence</span><div class="seg" id="oFreq"><button type="button" data-v="unique" aria-pressed="true">Don unique</button><button type="button" data-v="mensuel" aria-pressed="false">Chaque mois</button></div></div>
      <label class="field"><span>Montant du don</span><div class="budget-out"><b class="big-num" id="oAmtOut"></b></div><input type="range" id="oAmt" min="50000" max="10000000" step="50000" value="500000"></label>
      <div class="chips" style="margin-top:12px">${[100000, 250000, 500000, 1000000, 5000000].map(v => `<button type="button" class="chip" data-amt="${v}">${fmtM(v)}</button>`).join('')}</div>
      <button class="btn btn-block" id="oGive" style="margin-top:22px;--b:#fff;color:#4b0f18">Donner</button>
      <button type="button" class="link" id="oWa" style="margin-top:14px;color:inherit">Préférer une promesse de don par WhatsApp <span>→</span></button>
      <p class="note">Paiement sécurisé par Orange Money, MTN Mobile Money, carte bancaire ou en agence.</p>
    </form>
    <div aria-live="polite">
      <div class="impact-out"><div><b id="oUnits">0</b><span id="oUnitL"></span></div><div><b id="oShare">0 %</b><span>de l’objectif restant couvert</span></div></div>
      <div class="dots-viz" id="oDots" aria-hidden="true"></div>
      <p class="lead" id="oStory" style="margin-top:18px"></p>
    </div>
  </div>
</div></section>
<section class="sec" id="benevolat"><div class="wrap split" style="align-items:start">
  <div>${secHead('Bénévolat', 'Donner du temps, <em>transmettre un savoir.</em>', 'Sélectionnez vos compétences et votre disponibilité : nous vous proposons des missions adaptées.')}</div>
  <div class="panel">
    <div class="field"><span>Mes compétences</span><div class="chips" id="vSkills">${D.skills.map(s => `<button type="button" class="chip" aria-pressed="false" data-sk="${s}">${s}</button>`).join('')}</div></div>
    <div class="field" style="margin-top:18px"><span>Disponibilité</span><div class="seg" id="vAvail"><button type="button" data-v="Ponctuelle" aria-pressed="true">Ponctuelle</button><button type="button" data-v="Mensuelle" aria-pressed="false">Mensuelle</button><button type="button" data-v="Hebdomadaire" aria-pressed="false">Hebdomadaire</button></div></div>
    <div class="match-out" id="vOut"></div>
    <button class="btn btn-block" id="vSendB" style="margin-top:16px">Proposer ma candidature</button>
  </div>
</div></section>
<section class="sec alt" id="transparence"><div class="wrap">
  ${secHead('Mesurer pour progresser', 'L’impact ne se proclame pas. <em>Il se démontre.</em>')}
  <div class="steps">${[['Besoin identifié', 'Avec les communautés et les acteurs de terrain.'], ['Objectif publié', 'Budget, partenaires et résultats attendus.'], ['Action suivie', 'Photos, reçus et étapes documentées.'], ['Bilan partagé', 'Un retour clair à chaque soutien.']].map((s, i) => `<article class="step rv" style="--i:${i}"><b>0${i + 1}</b><h3>${s[0]}</h3><p>${s[1]}</p></article>`).join('')}</div>
</div></section>
${ctaBand('Devenir <em>partenaire.</em>', 'Entreprises, fondations, écoles, centres de santé : construisons une action ensemble.', waBtn('Proposer un partenariat', 'Bonjour Jess Children and Women, notre structure souhaite devenir partenaire.', 'btn btn-light'))}
`,
    init(q) {
      let camp = D.campaigns.find(c => c.id === q.c) || D.campaigns[0], freq = 'unique'; const amt = $('#oAmt');
      segBind($('#oFreq'), v => { freq = v; sim(); });
      const sim = () => {
        setRange(amt); const a = +amt.value, units = Math.floor(a / camp.unit), left = camp.goal - camp.raised;
        $('#oAmtOut').textContent = fmt(a);
        const lbl = units > 1 ? camp.unitPlural : camp.unitLabel;
        $('#oUnits').textContent = units; $('#oUnitL').textContent = lbl;
        $('#oShare').textContent = Math.min(100, a / left * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' %';
        $('#oDots').innerHTML = [...Array(Math.min(units, 60))].map((_, i) => `<i style="animation-delay:${i * 15}ms"></i>`).join('') + (units > 60 ? `<span class="small">+${units - 60}</span>` : '');
        $('#oGive').textContent = `Donner ${fmt(a)}${freq === 'mensuel' ? ' par mois' : ''}`;
        $('#oStory').innerHTML = units ? `Avec <b>${fmt(a)}</b>, vous financez <b>${units} ${lbl}</b> pour la campagne « ${camp.name} ».` : `Chaque geste compte : à partir de <b>${fmt(camp.unit)}</b>, vous financez 1 ${camp.unitLabel}.`;
      };
      const setCamp = id => { camp = D.campaigns.find(c => c.id === id); $$('[data-oc]').forEach(b => b.setAttribute('aria-pressed', b.dataset.oc === id)); sim(); };
      $$('[data-oc]').forEach(b => b.addEventListener('click', () => setCamp(b.dataset.oc)));
      $$('[data-amt]').forEach(b => b.addEventListener('click', () => { amt.value = b.dataset.amt; sim(); }));
      $$('[data-camp]').forEach(b => b.addEventListener('click', () => { setCamp(b.dataset.camp); scrollToId('soutenir'); }));
      amt.addEventListener('input', sim); sim();
      $('#oForm').addEventListener('submit', e => { e.preventDefault(); const a = +amt.value, units = Math.floor(a / camp.unit);
        openCheckout({ kind: 'don', team: 'Jess Children and Women', title: `Don · ${camp.name}`, total: a,
          lines: [[`${freq === 'mensuel' ? 'Don mensuel' : 'Don unique'} · ${camp.name}`, a]],
          note: units ? `Impact estimé : ${units} ${units > 1 ? camp.unitPlural : camp.unitLabel}.` : '',
          meta: { campagne: camp.id, frequence: freq } }); });
      $('#oWa').addEventListener('click', () => openWA(waMsg('Jess Children and Women', 'Je souhaite faire une promesse de don :', [['Campagne', camp.name], ['Montant', fmt(+amt.value)], ['Fréquence', freq === 'mensuel' ? 'mensuelle' : 'unique']])));
      /* progression animée */
      const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.style.setProperty('--v', en.target.dataset.v); io.unobserve(en.target); } }), { threshold: .4 });
      $$('.ring[data-v]').forEach(r => io.observe(r)); observers.push(io);
      /* bénévolat */
      const skills = new Set(); let avail = 'Ponctuelle';
      const missions = { Enseignement: 'Soutien scolaire des jeunes filles', Santé: 'Journées santé des mères', Communication: 'Récits de terrain et réseaux sociaux', Logistique: 'Distribution des kits scolaires', Droit: 'Permanences d’information juridique', Finance: 'Ateliers gestion pour entrepreneures', Informatique: 'Initiation numérique', Animation: 'Ateliers enfants en espaces sûrs', Couture: 'Formation couture « Un métier, un avenir »', Photographie: 'Documentation des actions' };
      const vDraw = () => { $('#vOut').innerHTML = skills.size ? `<b>Missions suggérées (${avail.toLowerCase()}) :</b><ul style="margin:8px 0 0;padding-left:18px">${[...skills].map(s => `<li>${missions[s]}</li>`).join('')}</ul>` : '<span class="muted">Sélectionnez au moins une compétence pour voir les missions qui vous correspondent.</span>'; };
      $$('[data-sk]').forEach(b => b.addEventListener('click', () => { skills.has(b.dataset.sk) ? skills.delete(b.dataset.sk) : skills.add(b.dataset.sk); b.setAttribute('aria-pressed', skills.has(b.dataset.sk)); vDraw(); }));
      segBind($('#vAvail'), v => { avail = v; vDraw(); }); vDraw();
      $('#vSendB').addEventListener('click', () => { if (!skills.size) { toast('Choisissez au moins une compétence'); return; } openWA(waMsg('Jess Children and Women', 'Je souhaite devenir bénévole :', [['Compétences', [...skills].join(', ')], ['Disponibilité', avail], ['Missions qui m’intéressent', [...skills].map(s => missions[s]).join(' ; ')]])); });
    }
  };
}

/* =====================================================================
   ACTUALITÉS, CONTACT, LÉGAL
   ===================================================================== */
function viewNews() {
  const cats = ['Tout', ...new Set(D.news.map(n => n.cat))];
  return {
    u: 'holding', title: 'Actualités — Jess Holding',
    html: `<section class="page-top"><div class="wrap"><p class="kicker">Journal</p><h1 class="d1" data-split>Actualités <em>du groupe.</em></h1></div></section>
<section class="sec-tight" style="padding-top:0"><div class="wrap"><div class="chips scroll" style="margin-bottom:24px">${cats.map((c, i) => `<button class="chip" aria-pressed="${i === 0}" data-nc="${c}">${c}</button>`).join('')}</div><div class="news" id="newsList">${newsCards(D.news)}</div><p class="note">Publications de démonstration illustrant la future rubrique éditoriale.</p></div></section>`,
    init() { $$('[data-nc]').forEach(b => b.addEventListener('click', () => { $$('[data-nc]').forEach(x => x.setAttribute('aria-pressed', x === b)); $('#newsList').innerHTML = newsCards(D.news.filter(n => b.dataset.nc === 'Tout' || n.cat === b.dataset.nc)); $$('#newsList .rv').forEach(x => x.classList.add('in')); })); }
  };
}
function viewContact(q) {
  const teams = [...D.services.map(s => [s.id, '', s.name, s.label]), ['autre', '', 'Autre demande', 'Jess Holding']];
  return {
    u: 'holding', title: 'Contact — Jess Holding',
    html: `<section class="page-top"><div class="wrap"><p class="kicker">Contact</p><h1 class="d1" data-split>Trouvons le bon <em>point de départ.</em></h1><p class="lead rv" style="--i:3;margin-top:18px">Choisissez le sujet : votre message arrive directement à l’équipe concernée.</p></div></section>
<section class="sec-tight" style="padding-top:0"><div class="wrap split" style="align-items:start">
  <form class="panel" id="cForm" novalidate>
    <div class="field"><span>Votre besoin</span><div class="route-cards" id="cTeams">${teams.map(t => `<button type="button" data-team="${t[0]}" aria-pressed="false">${BUL}<b>${t[2]}</b></button>`).join('')}</div></div>
    <div id="cTeam"></div>
    <div class="fields" style="margin-top:16px"><label class="field"><span>Nom</span><input name="nom" required autocomplete="name"></label><label class="field"><span>Téléphone</span><input name="tel" type="tel" required autocomplete="tel" placeholder="+224 …"></label><label class="field full"><span>Message</span><textarea name="msg" required>${esc(q.msg || '')}</textarea></label></div>
    <button class="btn btn-wa btn-block" style="margin-top:18px">Envoyer sur WhatsApp</button>
  </form>
  <div class="grid">
    <div class="card rv"><p class="kicker">Siège</p><h2 class="d3">Nongo, Conakry</h2><p class="muted">République de Guinée</p><div class="actions"><a class="btn" href="tel:+224613131323">${D.phone}</a>${waBtn('WhatsApp', 'Bonjour Jess Holding.', 'btn btn-ghost')}</div></div>
    <div class="card rv" style="--i:1"><p class="kicker">Horaires</p><p class="muted" style="margin:0">Horaires d’ouverture communiqués par chaque équipe. Messages WhatsApp traités en priorité.</p></div>
  </div>
</div></section>`,
    init() {
      let team = 'autre';
      const pick = id => { team = id; $$('[data-team]').forEach(b => b.setAttribute('aria-pressed', b.dataset.team === id)); const s = svc(id); $('#cTeam').innerHTML = `<div class="team-card"><i>${BUL}</i><div><b>${s ? s.label : 'Accueil Jess Holding'}</b><br><span class="small muted">${s ? s.desc : 'Nous orientons votre demande vers la bonne équipe.'}</span></div>${s ? `<a class="link" style="margin-left:auto" href="#${s.route}">Voir <span>→</span></a>` : ''}</div>`; };
      $$('[data-team]').forEach(b => b.addEventListener('click', () => pick(b.dataset.team)));
      const guess = analyze(new URLSearchParams(location.hash.split('?')[1] || '').get('msg') || '')[0];
      pick(guess ? guess.s.id : 'autre');
      $('#cForm').addEventListener('submit', e => { e.preventDefault(); const f = e.target; if (!valid(f)) return; const d = formData(f), s = svc(team); openWA(waMsg(s ? s.label : 'Jess Holding', d.msg, [['Sujet', s ? s.name : 'Autre'], ['Nom', d.nom], ['Téléphone', d.tel]])); });
    }
  };
}
const viewLegal = (t, body) => () => ({ u: 'holding', title: t + ' — Jess Holding', html: `<section class="page-top"><div class="wrap prose"><p class="kicker">Informations</p><h1 class="d2">${t}</h1>${body}</div></section>` });

/* =====================================================================
   ROUTEUR
   ===================================================================== */
const routes = {
  '/': viewHome, '/groupe': viewGroupe, '/voyages': viewVoyages, '/colis': viewColis, '/beaute': viewBeaute, '/showroom': viewShowroom,
  '/appartements': viewAppartements, '/btp': viewBTP, '/ong': viewONG, '/actualites': viewNews, '/contact': viewContact,
  '/voyages-services': () => viewHub('voyages-services'), '/paradise': () => viewHub('paradise'),
  '/mentions-legales': viewLegal('Mentions légales', '<p>Éditeur : Jess Holding, Nongo, Conakry, République de Guinée. Téléphone : +224 613 13 13 23.</p><h2>Hébergement</h2><p>Informations de l’hébergeur à compléter avant la mise en production.</p><h2>Propriété intellectuelle</h2><p>Les marques Jess Holding, Jess Voyages & Services, Jess Paradise et Jess Children and Women, ainsi que les contenus du site, sont protégés.</p>'),
  '/confidentialite': viewLegal('Politique de confidentialité', '<p>Ce site ne crée aucun compte et n’encaisse aucun paiement. Les formulaires préparent un message que vous choisissez d’envoyer sur WhatsApp.</p><h2>Données locales</h2><p>Votre sélection showroom, vos favoris, votre checklist visa et votre préférence de thème sont enregistrés uniquement dans votre navigateur.</p><h2>Vos droits</h2><p>Pour toute question sur vos données, contactez-nous au +224 613 13 13 23.</p>')
};
const aliases = { '/voyages-services/voyages': '/voyages', '/voyages-services/colis': '/colis', '/colis/suivi': '/colis', '/paradise/beaute': '/beaute', '/paradise/showroom': '/showroom', '/paradise/appartements': '/appartements', '/paradise/btp': '/btp', '/jess-children-women': '/ong', '/filiales': '/groupe' };

let cur = null, timers = [], listeners = [], observers = [];
const addTimer = t => timers.push(t);
const addListener = (el, ev, fn) => { el.addEventListener(ev, fn); listeners.push([el, ev, fn]); };
function cleanup() { timers.forEach(clearInterval); timers = []; listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn)); listeners = []; observers.forEach(o => o.disconnect()); observers = []; }

function parse() {
  let h; try { h = decodeURI(location.hash.slice(1)) || '/'; } catch { h = '/'; }
  if (!h.startsWith('/')) h = '/';
  let anchor = '', qs = {};
  const ai = h.indexOf('#'); if (ai > -1) { anchor = h.slice(ai + 1); h = h.slice(0, ai); }
  const qi = h.indexOf('?'); if (qi > -1) { qs = Object.fromEntries(new URLSearchParams(h.slice(qi + 1))); h = h.slice(0, qi); }
  h = h.replace(/\/+$/, '') || '/';
  if (aliases[h]) { if (h === '/colis/suivi') anchor = 'suivi'; h = aliases[h]; }
  return { path: h, q: qs, anchor, key: h + '?' + JSON.stringify(qs) };
}
function scrollToId(id) { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }

function render() {
  if (location.hash && !location.hash.startsWith('#/')) return;
  const r = parse();
  closeMenus();
  if (cur && cur.key === r.key) { if (r.anchor) scrollToId(r.anchor); else window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const view = (routes[r.path] || (() => ({ u: 'holding', title: 'Page introuvable — Jess Holding', html: `<section class="page-top"><div class="wrap"><p class="kicker">Erreur 404</p><h1 class="d1">Cette page <em>s’est égarée.</em></h1><p class="lead">Utilisez la recherche ou revenez à l’accueil.</p><div class="actions" style="margin-top:24px"><a class="btn" href="#/">Accueil</a><button class="btn btn-ghost" data-cmdk>Rechercher</button></div></div></section>` })))(r.q);
  const swap = () => {
    cleanup();
    document.body.dataset.u = view.u;
    document.body.classList.toggle('over-dark', !!view.dark);
    document.title = view.title;
    main.innerHTML = view.html;
    view.init && view.init(r.q);
    enhance(main);
    $$('.nav-link[href]').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + r.path));
    $$('.dock [data-dock]').forEach(a => a.classList.toggle('on', a.dataset.dock === r.path));
    $('[data-hdr-sub]').textContent = (D.services.find(s => s.route === r.path) || {}).label || 'Conakry · Guinée';
    if (r.anchor) { const go = () => document.getElementById(r.anchor)?.scrollIntoView({ block: 'start', behavior: 'instant' }); requestAnimationFrame(go); setTimeout(go, 350); }
    else window.scrollTo(0, 0);
    if (cur) main.focus({ preventScroll: true });
    onScroll();
  };
  if (cur && document.startViewTransition && !reduced && document.visibilityState === 'visible') { const t = document.startViewTransition(swap); [t.ready, t.finished, t.updateCallbackDone].forEach(pr => pr && pr.catch(() => {})); } else swap();
  cur = r;
}

/* ---------- améliorations communes ---------- */
function enhance(root) {
  /* titres découpés en mots */
  $$('[data-split]', root).forEach(el => {
    if (el.dataset.done) return; el.dataset.done = 1; let wi = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) { const frag = document.createDocumentFragment(); n.textContent.split(/(\s+)/).forEach(w => { if (!w) return; if (/^\s+$/.test(w)) { frag.append(' '); return; } const o = document.createElement('span'); o.className = 'w'; const i = document.createElement('span'); i.textContent = w; i.style.setProperty('--wi', wi++); o.append(i); frag.append(o); }); n.replaceWith(frag); }
      else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
    });
    walk(el); el.classList.add('split-words');
  });
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('.rv,.rv-l,.split-words', root).forEach(el => io.observe(el)); observers.push(io);
  /* compteurs */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, suf = el.dataset.suf || '', t0 = performance.now(), dur = reduced ? 1 : 1400;
    const step = t => { const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = nf.format(v) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  $$('[data-count]', root).forEach(el => cio.observe(el)); observers.push(cio);
  /* sliders et carrousels */
  $$('input[type=range]', root).forEach(setRange);
  initCarousels(root);
  /* sous-navigation active */
  const links = $$('.subnav a', root);
  if (links.length) {
    const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.toggle('on', l.dataset.sec === e.target.id)); const on = links.find(l => l.dataset.sec === e.target.id); if (on) { const w = on.parentElement; if (on.offsetLeft < w.scrollLeft || on.offsetLeft + on.offsetWidth > w.scrollLeft + w.clientWidth) w.scrollLeft = on.offsetLeft - 20; } } }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(l => { const s = document.getElementById(l.dataset.sec); s && sio.observe(s); }); observers.push(sio);
  }
}
function segBind(seg, fn) { seg.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; $$('button[data-v]', seg).forEach(x => x.setAttribute('aria-pressed', x === b)); fn(b.dataset.v); }); }

/* ---------- carrousel d'images ---------- */
function carousel(images, alt) {
  return `<div class="car" data-car><div class="car-track" tabindex="0" aria-label="Photos : ${esc(alt)}">${images.map((im, i) => `<figure class="car-slide"><img src="${im.src}" alt="${esc(alt)} — photo ${i + 1}" loading="lazy" decoding="async" style="object-position:${im.pos || 'center'}"></figure>`).join('')}</div>
  <button type="button" class="car-btn prev" aria-label="Photo précédente">←</button><button type="button" class="car-btn next" aria-label="Photo suivante">→</button>
  <div class="car-foot"><div class="car-dots">${images.map((_, i) => `<button type="button" aria-label="Photo ${i + 1}" ${i ? '' : 'aria-current="true"'}></button>`).join('')}</div><span class="car-count">1 / ${images.length}</span></div></div>`;
}
function initCarousels(root) {
  $$('[data-car]', root).forEach(c => {
    const tr = $('.car-track', c), dots = $$('.car-dots button', c), n = dots.length; let i = 0, hover = false;
    const go = k => { i = (k + n) % n; tr.scrollTo({ left: i * tr.clientWidth, behavior: reduced ? 'auto' : 'smooth' }); };
    tr.addEventListener('scroll', () => { const k = Math.round(tr.scrollLeft / tr.clientWidth); if (k !== i || true) { i = k; dots.forEach((d, j) => d.toggleAttribute('aria-current', j === k)); $('.car-count', c).textContent = `${k + 1} / ${n}`; } }, { passive: true });
    $('.prev', c).addEventListener('click', () => go(i - 1)); $('.next', c).addEventListener('click', () => go(i + 1));
    dots.forEach((d, j) => d.addEventListener('click', () => go(j)));
    c.addEventListener('pointerenter', () => hover = true); c.addEventListener('pointerleave', () => hover = false);
    if (!reduced) addTimer(setInterval(() => { const r = c.getBoundingClientRect(); if (!hover && r.top < innerHeight && r.bottom > 0 && document.visibilityState === 'visible') go(i + 1); }, 5000));
  });
}

/* ---------- billets d'avion (moteur de démonstration, prêt pour une API GDS) ---------- */
const AIRLINE_HUB = { AF: 'CDG', AT: 'CMN', SN: 'BRU', TK: 'IST', KP: 'LFW', HF: 'ABJ', HC: 'DSS', ET: 'ADD', EK: 'DXB' };
function findAirport(v) {
  const m = String(v).match(/\(([A-Z]{3})\)/), n = norm(v).replace(/\(.*\)/, '').trim();
  const a = m ? D.airports.find(x => x[0] === m[1]) : D.airports.find(x => norm(x[1]) === n) || (n.length > 2 && D.airports.find(x => norm(x[1]).startsWith(n) || x[0].toLowerCase() === n));
  return a ? { code: a[0], city: a[1], country: a[2], lat: a[3], lon: a[4] } : (n ? { code: n.slice(0, 3).toUpperCase(), city: String(v).trim(), country: '', free: true } : null);
}
function distKm(a, b) {
  if (a.free || b.free) return 5200;
  const r = Math.PI / 180, dl = (b.lat - a.lat) * r, dn = (b.lon - a.lon) * r;
  const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dn / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
const hm = m => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
const dur = m => `${Math.floor(m / 60)} h ${pad(m % 60)}`;
function makeLeg(A, B, date, al, k, seed) {
  const km = distKm(A, B), hub = AIRLINE_HUB[al[0]];
  const via = km > 1500 && hub !== A.code && hub !== B.code && (k % 3 !== 0 || km > 7000) ? hub : '';
  const h = hash(seed + al[0] + k), dep = 6 * 60 + (h % 15) * 60 + (h % 4) * 15;
  const time = Math.round(km / 760 * 60 + 35 + (via ? 95 + h % 150 : 0));
  return { al, num: `${al[0]} ${100 + h % 899}`, from: A.code, to: B.code, via, dep, arr: dep + time, time, date };
}
function searchFlights(o) {
  const km = distKm(o.A, o.B), seed = o.A.code + o.B.code + o.go;
  const pool = [...D.airlines].sort((x, y) => hash(seed + x[0]) - hash(seed + y[0])).slice(0, 5);
  return pool.map((al, k) => {
    const out = makeLeg(o.A, o.B, o.go, al, k, seed), back = o.rt ? makeLeg(o.B, o.A, o.back, al, k, seed + 'r') : null;
    const base = (850000 + km * 1250) * (out.via ? 0.92 : 1.08) * (0.9 + (hash(seed + al[0]) % 25) / 100) * o.cls;
    const unit = Math.round(base * (o.rt ? 1.8 : 1) / 10000) * 10000;
    const total = unit * o.pax.ad + Math.round(unit * .75) * o.pax.ch + Math.round(unit * .1) * o.pax.in;
    return { id: k, al, out, back, unit, total, bag: o.cls > 1 ? '2 × 23 kg' : '1 × 23 kg' };
  });
}
function initFlights(q) {
  const f = $('#fSearch'); if (!f) return;
  const go = $('#fGo'), back = $('#fBack'), pax = { ad: 1, ch: 0, in: 0 }; let rt = true, offers = [], sort = 'price', directOnly = false, last = null;
  const t0 = addDays(today(), 14); go.min = back.min = iso(addDays(today(), 1)); go.value = iso(t0); back.value = iso(addDays(t0, 10));
  const paxLabel = () => [pax.ad && `${pax.ad} adulte${pax.ad > 1 ? 's' : ''}`, pax.ch && `${pax.ch} enfant${pax.ch > 1 ? 's' : ''}`, pax.in && `${pax.in} bébé${pax.in > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  segBind($('#fTrip'), v => { rt = v === 'rt'; $('#fBackWrap').hidden = !rt; back.required = rt; });
  back.required = true;
  go.addEventListener('change', () => { back.min = go.value; if (back.value < go.value) back.value = iso(addDays(new Date(go.value), 7)); });
  $('#fSwap').addEventListener('click', () => { const a = $('#fFrom').value; $('#fFrom').value = $('#fTo').value; $('#fTo').value = a; });
  const pop = $('#fPop'), pb = $('#fPaxBtn');
  pb.addEventListener('click', () => { pop.hidden = !pop.hidden; pb.setAttribute('aria-expanded', !pop.hidden); });
  $('#fPaxOk').addEventListener('click', () => { pop.hidden = true; pb.setAttribute('aria-expanded', 'false'); pb.focus(); });
  addListener(document, 'click', e => { if (!e.target.closest('.fs-pax')) { pop.hidden = true; pb.setAttribute('aria-expanded', 'false'); } });
  $$('[data-px]', f).forEach(b => b.addEventListener('click', () => {
    const [k, d] = b.dataset.px.split('|'); const v = pax[k] + +d;
    if (k === 'ad' && (v < 1 || v + pax.ch > 9)) return; if (k === 'ch' && (v < 0 || v + pax.ad > 9)) return;
    if (k === 'in' && (v < 0 || v > pax.ad)) { if (v > pax.ad) toast('Un bébé voyage sur les genoux d’un adulte : un bébé maximum par adulte.'); return; }
    pax[k] = v; $(`[data-pxo="${k}"]`, f).textContent = v; pb.textContent = paxLabel();
  }));
  const draw = () => {
    let list = offers.filter(o => !directOnly || (!o.out.via && (!o.back || !o.back.via)));
    list = [...list].sort((a, b) => sort === 'price' ? a.total - b.total : sort === 'fast' ? a.out.time - b.out.time : a.out.dep - b.out.dep);
    const legHtml = (l, lab) => `<div class="fr-leg"><span class="fr-lab">${lab}</span><div class="fr-t"><b>${hm(l.dep)}</b><small>${l.from}</small></div><div class="fr-line"><small>${dur(l.time)}</small><i></i><small>${l.via ? '1 escale · ' + l.via : 'Direct'}</small></div><div class="fr-t"><b>${hm(l.arr)}${l.arr >= 1440 ? '<sup>+1</sup>' : ''}</b><small>${l.to}</small></div></div>`;
    $('#fList').innerHTML = list.length ? list.map(o => `<article class="fr"><div class="fr-air"><span class="fr-code">${o.al[0]}</span><div><b>${o.al[1]}</b><small>${o.out.num} · Bagage ${o.bag}</small></div></div><div class="fr-legs">${legHtml(o.out, 'Aller')}${o.back ? legHtml(o.back, 'Retour') : ''}</div><div class="fr-price"><b>${fmt(o.total)}</b><small>total · ${paxLabel()}</small><button class="btn btn-sm" data-fly="${o.id}">Choisir</button></div></article>`).join('')
      : '<p class="muted">Aucun vol direct pour cette recherche. Décochez « Vols directs uniquement ».</p>';
  };
  const run = () => {
    if (!valid(f)) return;
    const A = findAirport($('#fFrom').value), B = findAirport($('#fTo').value);
    if (!A || !B) { toast('Indiquez une ville de départ et une destination'); return; }
    if (A.code === B.code && !A.free) { toast('Le départ et l’arrivée doivent être différents'); return; }
    last = { A, B, go: go.value, back: rt ? back.value : '', rt, cls: +$('#fClass').value, clsName: $('#fClass').selectedOptions[0].text, pax: { ...pax } };
    offers = searchFlights(last);
    $('#fResults').innerHTML = `<div class="fr-head"><div><b class="d3">${esc(A.city)} → ${esc(B.city)}</b><div class="small muted">${dLong(new Date(go.value + 'T12:00'))}${rt ? ' — ' + dLong(new Date(back.value + 'T12:00')) : ' · aller simple'} · ${paxLabel()} · ${last.clsName}</div></div>
      <div class="fr-tools"><div class="seg" id="fSort"><button type="button" data-v="price" aria-pressed="true">Meilleur prix</button><button type="button" data-v="fast" aria-pressed="false">Plus rapide</button><button type="button" data-v="early" aria-pressed="false">Départ tôt</button></div><label class="fr-direct"><input type="checkbox" id="fDirect"> Vols directs uniquement</label></div></div>
      <div class="fr-list" id="fList"></div>
      <p class="note">${A.free || B.free ? 'Aéroport non répertorié : tarif estimé, confirmé par un conseiller. ' : ''}Horaires et tarifs de démonstration en attendant la connexion au système de réservation des compagnies.</p>`;
    sort = 'price'; directOnly = false;
    segBind($('#fSort'), v => { sort = v; draw(); });
    $('#fDirect').addEventListener('change', e => { directOnly = e.target.checked; draw(); });
    draw();
    $('#fResults').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  };
  f.addEventListener('submit', e => { e.preventDefault(); run(); });
  addListener($('#fResults'), 'click', e => {
    const b = e.target.closest('[data-fly]'); if (!b) return;
    const o = offers.find(x => x.id === +b.dataset.fly), P = last.pax, fee = 50000;
    const lines = [[`${P.ad} adulte${P.ad > 1 ? 's' : ''}`, o.unit * P.ad]];
    if (P.ch) lines.push([`${P.ch} enfant${P.ch > 1 ? 's' : ''} (−25 %)`, Math.round(o.unit * .75) * P.ch]);
    if (P.in) lines.push([`${P.in} bébé${P.in > 1 ? 's' : ''}`, Math.round(o.unit * .1) * P.in]);
    lines.push(['Frais de service Jess Voyages', fee]);
    openCheckout({ kind: 'billet', team: 'Jess Voyages', title: `${last.A.city} → ${last.B.city}`, total: o.total + fee, lines,
      note: `${o.al[1]} · ${o.out.num} · départ ${dLong(new Date(last.go + 'T12:00'))} à ${hm(o.out.dep)}${o.back ? ' · retour ' + dLong(new Date(last.back + 'T12:00')) + ' à ' + hm(o.back.dep) : ''} · ${last.clsName}`,
      passengers: [...Array(P.ad).fill('Adulte'), ...Array(P.ch).fill('Enfant'), ...Array(P.in).fill('Bébé')],
      meta: { compagnie: o.al[0], vol: o.out.num, de: last.A.code, vers: last.B.code, aller: last.go, retour: last.back, classe: last.clsName } });
  });
  if (q.to) run();
}

/* ---------- tunnel de paiement ---------- */
function openCheckout(order) {
  const P = window.JESS_PAY, pax = order.passengers || [];
  const steps = [...(pax.length ? ['Passagers'] : []), 'Coordonnées', 'Paiement', 'Confirmation'];
  let step = 0, method = P.methods[0].id;
  const sum = `<div class="co-sum">${order.lines.map(l => `<div class="rowx"><span>${esc(l[0])}</span><b>${fmt(l[1])}</b></div>`).join('')}<div class="tot"><span>Total</span><b class="big-num">${fmt(order.total)}</b></div>${order.note ? `<p class="small muted" style="margin:10px 0 0">${esc(order.note)}</p>` : ''}</div>`;
  const paxHtml = pax.map((t, i) => `<fieldset class="co-pax"><legend>Passager ${i + 1} · ${t}</legend><div class="fields">
    <label class="field"><span>Civilité</span><select name="p${i}_civ"><option>M.</option><option>Mme</option></select></label>
    <label class="field"><span>Date de naissance</span><input type="date" name="p${i}_dob" required max="${iso(today())}"></label>
    <label class="field"><span>Prénom(s)</span><input name="p${i}_first" required autocomplete="${i ? 'off' : 'given-name'}"></label>
    <label class="field"><span>Nom</span><input name="p${i}_last" required autocomplete="${i ? 'off' : 'family-name'}"></label>
    <label class="field full"><span>N° de passeport (facultatif)</span><input name="p${i}_pp" autocomplete="off"></label></div></fieldset>`).join('');
  $('#drawerBody').innerHTML = `<p class="kicker">Paiement sécurisé · ${esc(order.team)}</p><h2 class="d3" id="drawerTitle" style="margin-bottom:18px">${esc(order.title)}</h2>
    <ol class="co-steps">${steps.map((s, i) => `<li class="${i ? '' : 'on'}">${s}</li>`).join('')}</ol>
    <form id="coForm" novalidate>
      ${pax.length ? `<div class="wpane on" data-co="0"><p class="small muted">Saisissez les noms exactement comme sur les passeports.</p>${paxHtml}</div>` : ''}
      <div class="wpane ${pax.length ? '' : 'on'}" data-co="${pax.length ? 1 : 0}"><div class="fields">
        <label class="field full"><span>Nom complet</span><input name="name" required autocomplete="name"></label>
        <label class="field"><span>Téléphone</span><input name="phone" type="tel" required autocomplete="tel" placeholder="+224 …"></label>
        <label class="field"><span>E-mail</span><input name="email" type="email" ${order.kind === 'billet' ? 'required' : ''} autocomplete="email" placeholder="Pour recevoir le reçu"></label>
        ${order.kind === 'don' ? '<label class="co-check full"><input type="checkbox" name="anon"><span>Faire ce don de manière anonyme</span></label>' : ''}
      </div></div>
      <div class="wpane" data-co="${pax.length ? 2 : 1}">
        ${P.mode !== 'live' ? '<p class="co-demo">Mode démonstration : aucun débit ne sera effectué.</p>' : ''}
        <div class="co-methods" role="radiogroup" aria-label="Moyen de paiement">${P.methods.map((m, i) => `<label class="co-m"><input type="radio" name="method" value="${m.id}" ${i ? '' : 'checked'}><span class="bul"></span><span><b>${m.label}</b><small>${m.hint}</small></span></label>`).join('')}</div>
        <label class="field" id="coPhoneW" style="margin-top:14px"><span>Numéro mobile money</span><input name="payphone" type="tel" placeholder="+224 6__ __ __ __" autocomplete="tel"></label>
        <label class="co-check" style="margin-top:14px"><input type="checkbox" name="cgv" required><span>J’accepte les conditions de vente et la politique de confidentialité.</span></label>
      </div>
      ${sum}
      <p class="co-err" role="alert"></p>
      <div class="actions co-actions"><button type="button" class="btn btn-ghost" id="coPrev" hidden>← Retour</button><button class="btn" id="coNext" style="margin-left:auto">Continuer →</button></div>
    </form>
    <div class="co-done" id="coDone" hidden></div>`;
  openDrawer();
  const form = $('#coForm'), panes = $$('[data-co]', form), lis = $$('.co-steps li'), payIdx = panes.length - 1;
  const setStep = n => {
    step = n; panes.forEach((p, i) => p.classList.toggle('on', i === n)); lis.forEach((l, i) => l.classList.toggle('on', i <= n));
    $('#coPrev').hidden = n === 0; $('#coNext').textContent = n === payIdx ? `Payer ${fmt(order.total)}` : 'Continuer →';
    $('.drawer-panel').scrollTop = 0;
  };
  const togglePhone = () => { const m = P.methods.find(x => x.id === method); $('#coPhoneW').hidden = !m.phone; form.payphone.required = !!m.phone; };
  $$('input[name=method]', form).forEach(r => r.addEventListener('change', () => { method = r.value; togglePhone(); }));
  togglePhone();
  $('#coPrev').addEventListener('click', () => setStep(step - 1));
  form.addEventListener('submit', async e => {
    e.preventDefault(); $('.co-err').textContent = '';
    const fields = $$('input,select', panes[step]);
    for (const el of fields) if (!el.checkValidity()) { el.reportValidity(); return; }
    if (step < payIdx) { if (step === 0 && pax.length) { const d = formData(form); if (!form.name.value) form.name.value = `${d.p0_first || ''} ${d.p0_last || ''}`.trim(); } setStep(step + 1); return; }
    const d = formData(form), btn = $('#coNext');
    btn.disabled = true; btn.textContent = 'Paiement en cours…';
    const payload = { kind: order.kind, title: order.title, amount: order.total, currency: P.currency, method, phone: d.payphone || '',
      customer: { name: d.name, email: d.email, phone: d.phone, anonymous: !!d.anon },
      items: order.lines.map(l => ({ label: l[0], amount: l[1] })), passengers: pax.map((t, i) => ({ type: t, civ: d[`p${i}_civ`], first: d[`p${i}_first`], last: d[`p${i}_last`], dob: d[`p${i}_dob`], passport: d[`p${i}_pp`] })), meta: order.meta || {} };
    try {
      const r = await P.createCheckout(payload);
      if (r.status === 'redirect') return;
      lis.forEach(l => l.classList.add('on'));
      form.hidden = true;
      const mlabel = P.methods.find(x => x.id === method).label;
      $('#coDone').hidden = false;
      $('#coDone').innerHTML = `<div class="co-ok" aria-hidden="true"></div><h3 class="d3">${order.kind === 'don' ? 'Merci pour votre générosité.' : 'Votre réservation est enregistrée.'}</h3>
        <p class="muted">${r.status === 'demo' ? 'Paiement simulé (mode démonstration). ' : ''}Référence <b>${esc(r.reference)}</b> · ${esc(mlabel)}</p>${sum}
        <div class="actions" style="margin-top:18px"><button class="btn" id="coPrint">Imprimer le reçu</button>${waBtn('Envoyer à l’équipe', waMsg(order.team, `Voici ma ${order.kind === 'don' ? 'confirmation de don' : 'réservation'} :`, [['Référence', r.reference], ['Objet', order.title], ['Montant', fmt(order.total)], ['Moyen de paiement', mlabel], ['Nom', d.name], ['Téléphone', d.phone], ['Détails', order.note || '']]), 'btn btn-ghost')}</div>`;
      $('#coPrint').addEventListener('click', () => printReceipt(order, r.reference, mlabel, d));
    } catch (err) {
      $('.co-err').textContent = err.message || 'Le paiement n’a pas pu aboutir. Réessayez ou choisissez un autre moyen.';
      btn.disabled = false; btn.textContent = `Payer ${fmt(order.total)}`;
    }
  });
  setStep(0);
}
function printReceipt(order, ref, method, d) {
  const w = window.open('', '_blank'); if (!w) { toast('Autorisez les fenêtres pour imprimer le reçu'); return; }
  w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Reçu ${esc(ref)}</title><style>body{font:300 15px/1.6 Montserrat,Arial,sans-serif;color:#1d1013;max-width:640px;margin:40px auto;padding:0 20px}h1{font-weight:700;color:#7b1a2a;margin:0}table{width:100%;border-collapse:collapse;margin:24px 0}td{padding:10px 0;border-bottom:1px solid #ddd}td:last-child{text-align:right;font-weight:700}.t td{border:0;font-size:1.2em;color:#7b1a2a}small{color:#6e6e73}</style></head><body>
    <h1>Jess Holding</h1><small>${esc(order.team)} · Nongo, Conakry · ${esc(D.phone)}</small>
    <h2 style="margin-top:32px">Reçu ${esc(ref)}</h2><p>${esc(order.title)}<br>${esc(order.note || '')}</p>
    <p>Client : ${esc(d.name)} · ${esc(d.phone)}${d.email ? ' · ' + esc(d.email) : ''}<br>Moyen de paiement : ${esc(method)}<br>Date : ${new Date().toLocaleString('fr-FR')}</p>
    <table>${order.lines.map(l => `<tr><td>${esc(l[0])}</td><td>${fmt(l[1])}</td></tr>`).join('')}<tr class="t"><td>Total</td><td>${fmt(order.total)}</td></tr></table>
    <small>${window.JESS_PAY.mode !== 'live' ? 'Document de démonstration — aucun paiement réel.' : ''}</small><script>print()<\/script></body></html>`);
  w.document.close();
}

/* ---------- tiroir ---------- */
let lastFocus;
function openDrawer(html) { const d = $('#drawer'); if (html) $('#drawerBody').innerHTML = html; lastFocus = document.activeElement; d.classList.add('open'); d.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; setTimeout(() => $('.drawer-x').focus(), 50); }
function closeDrawer() { const d = $('#drawer'); if (!d.classList.contains('open')) return; d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; lastFocus?.focus?.(); }
$$('[data-close-drawer]').forEach(b => b.addEventListener('click', closeDrawer));

/* ---------- en-tête, méga-menu, menu mobile ---------- */
const hdr = $('#hdr'), mega = $('#mega');
mega.innerHTML = D.filiales.map(f => `<div class="mega-col"><h4>${f.name}</h4>${D.services.filter(s => s.fil === f.id).map(s => `<a href="#${s.route}"><i>${BUL}</i><span><b>${s.name}</b><small>${s.desc}</small></span></a>`).join('')}</div>`).join('');
const megaBtn = $('[data-mega]'), burger = $('[data-burger]'), nav = $('#nav');
function closeMenus() { mega.hidden = true; megaBtn.setAttribute('aria-expanded', 'false'); nav.classList.remove('open'); document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); }
megaBtn.addEventListener('click', e => { e.stopPropagation(); const open = mega.hidden; mega.hidden = !open; megaBtn.setAttribute('aria-expanded', open); });
document.addEventListener('click', e => { if (!e.target.closest('.nav-item,[data-dock-univ],[data-burger]')) { mega.hidden = true; megaBtn.setAttribute('aria-expanded', 'false'); } });
burger.addEventListener('click', () => { const o = !nav.classList.contains('open'); nav.classList.toggle('open', o); document.body.classList.toggle('menu-open', o); hdr.classList.remove('hide'); burger.setAttribute('aria-expanded', o); if (o) { mega.hidden = false; megaBtn.setAttribute('aria-expanded', 'true'); } });
$('[data-dock-univ]').addEventListener('click', () => { nav.classList.add('open'); document.body.classList.add('menu-open'); hdr.classList.remove('hide'); burger.setAttribute('aria-expanded', 'true'); mega.hidden = false; megaBtn.setAttribute('aria-expanded', 'true'); });

/* thème */
const root = document.documentElement;
const savedTheme = store.get('theme', null); if (savedTheme) root.dataset.theme = savedTheme;
function toggleTheme() { const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; root.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', root.dataset.theme); toast(dark ? 'Thème clair activé' : 'Thème sombre activé'); }
$('[data-theme-toggle]').addEventListener('click', toggleTheme);

/* défilement : en-tête, progression, parallaxe */
const bar = $('.progress'); let lastY = 0, ticking = false;
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  hdr.classList.toggle('solid', y > 10);
  hdr.classList.toggle('hide', y > 400 && y > lastY && !nav.classList.contains('open'));
  bar.style.setProperty('--sp', h > 0 ? y / h : 0);
  const bg = $('.uhero-bg'); if (bg && !reduced && y < innerHeight * 1.2) bg.style.setProperty('--py', y * .25);
  lastY = y; ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

/* micro-interactions : lueur des boutons et inclinaison des tuiles */
if (fine && !reduced) {
  document.addEventListener('pointermove', e => {
    const b = e.target.closest?.('.btn'); if (b) { const r = b.getBoundingClientRect(); b.style.setProperty('--mx', e.clientX - r.left + 'px'); b.style.setProperty('--my', e.clientY - r.top + 'px'); }
    const t = e.target.closest?.('.tile'); if (t) { const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; t.style.setProperty('--rx', (-y * 5) + 'deg'); t.style.setProperty('--ry', (x * 6) + 'deg'); }
  }, { passive: true });
  document.addEventListener('pointerout', e => { const t = e.target.closest?.('.tile'); if (t && !t.contains(e.relatedTarget)) { t.style.setProperty('--rx', 0); t.style.setProperty('--ry', 0); } });
}

/* liens d'ancre internes (#main, etc.) */
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const href = a.getAttribute('href');
  if (href.startsWith('#/') && cur) { const t = href.slice(1), ai = t.indexOf('#', 1); if (ai > -1 && (t.slice(0, ai).split('?')[0] || '/') === cur.path) { e.preventDefault(); closeMenus(); scrollToId(t.slice(ai + 1)); return; } }
  if (!href.startsWith('#/') && href.length > 1) { e.preventDefault(); const el = document.getElementById(href.slice(1)); el?.focus?.(); el?.scrollIntoView({ behavior: 'smooth' }); }
});

/* ---------- palette de commande ---------- */
const cmdk = $('#cmdk'), cIn = $('#cmdkInput'), cList = $('#cmdkList');
const actions = [
  ...D.services.map(s => ({ g: 'Services', i: s.icon, t: s.name, s: s.label + ' · ' + s.desc, href: '#' + s.route })),
  { g: 'Actions rapides', i: '', t: 'Suivre un colis', s: 'Référence JESS-…', href: '#/colis#suivi' },
  { g: 'Actions rapides', i: '', t: 'Estimer un envoi', s: 'Prix au kilo en direct', href: '#/colis#estimer' },
  { g: 'Actions rapides', i: '', t: 'Réserver un billet d’avion', s: 'Départ et arrivée au choix', href: '#/voyages#billets' },
  { g: 'Actions rapides', i: '', t: 'Planifier un voyage', s: 'Budget, dates et destination', href: '#/voyages#planifier' },
  { g: 'Actions rapides', i: '', t: 'Préparer mon visa', s: 'Checklist par motif', href: '#/voyages#visa' },
  { g: 'Actions rapides', i: '', t: 'Réserver un soin', s: 'Jour et créneau libres', href: '#/beaute#reserver' },
  { g: 'Actions rapides', i: '', t: 'Disponibilités appartements', s: 'Calendrier et prix', href: '#/appartements#reserver' },
  { g: 'Actions rapides', i: '', t: 'Estimer mon projet BTP', s: 'Budget et planning', href: '#/btp#estimer' },
  { g: 'Actions rapides', i: '', t: 'Faire un don', s: 'Paiement mobile money ou carte', href: '#/ong#soutenir' },
  { g: 'Actions rapides', i: '', t: 'Devenir bénévole', s: 'Missions selon vos compétences', href: '#/ong#benevolat' },
  { g: 'Pages', i: '', t: 'Le groupe', s: 'Filiales et valeurs', href: '#/groupe' },
  { g: 'Pages', i: '', t: 'Actualités', s: 'Le journal du groupe', href: '#/actualites' },
  { g: 'Pages', i: '', t: 'Contact', s: 'Écrire à la bonne équipe', href: '#/contact' },
  { g: 'Pages', i: '', t: 'Appeler Jess Holding', s: D.phone, href: 'tel:+224613131323' },
  { g: 'Pages', i: '', t: 'Changer de thème', s: 'Clair / sombre', fn: toggleTheme }
];
let cItems = [], cSel = 0;
function cDraw() {
  const v = cIn.value, n = norm(v).trim();
  const smart = analyze(v).map(r => ({ g: 'Suggestions', i: '', t: r.s.label, s: r.action, href: r.href }));
  const plain = actions.filter(a => !n || norm(a.t + ' ' + a.s).includes(n));
  cItems = [...smart, ...plain.filter(p => !smart.some(s => s.href === p.href))];
  if (n && !cItems.length) cItems = [{ g: 'Aucun résultat', i: '', t: 'Demander à un conseiller', s: `« ${v} »`, href: `#/contact?msg=${encodeURIComponent(v)}` }];
  cSel = Math.min(cSel, cItems.length - 1);
  let g = '';
  cList.innerHTML = cItems.map((a, i) => `${a.g !== g ? `<li class="grp" role="presentation">${(g = a.g)}</li>` : ''}<li role="option" data-ci="${i}" aria-selected="${i === cSel}"><i>${BUL}</i><div><b>${esc(a.t)}</b><small>${esc(a.s)}</small></div><em>↵</em></li>`).join('');
  cList.querySelector('[aria-selected=true]')?.scrollIntoView({ block: 'nearest' });
}
function cGo(i) { const a = cItems[i]; if (!a) return; cmdk.close(); if (a.fn) a.fn(); else if (a.href.startsWith('#')) location.hash = a.href.slice(1); else location.href = a.href; }
function openCmdk() { cIn.value = ''; cSel = 0; cDraw(); cmdk.showModal(); cIn.focus(); }
document.addEventListener('click', e => { if (e.target.closest('[data-cmdk]')) { e.preventDefault(); closeMenus(); openCmdk(); } });
cmdk.addEventListener('click', e => { if (e.target === cmdk) cmdk.close(); const li = e.target.closest('[data-ci]'); if (li) cGo(+li.dataset.ci); });
cIn.addEventListener('input', () => { cSel = 0; cDraw(); });
cIn.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { cSel = (cSel + 1) % cItems.length; cDraw(); e.preventDefault(); }
  if (e.key === 'ArrowUp') { cSel = (cSel - 1 + cItems.length) % cItems.length; cDraw(); e.preventDefault(); }
  if (e.key === 'Enter') { e.preventDefault(); cGo(cSel); }
});
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); cmdk.open ? cmdk.close() : openCmdk(); }
  else if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !cmdk.open) { e.preventDefault(); openCmdk(); }
  if (e.key === 'Escape') { closeDrawer(); closeMenus(); }
});
if (!/Mac|iPhone|iPad/.test(navigator.platform)) $$('.search-btn kbd').forEach(k => k.textContent = 'Ctrl K');

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
/* Anciennes adresses en chemin (Netlify, liens partagés) → routeur par ancre */
const BASE = location.hostname.endsWith('github.io') ? '/' + location.pathname.split('/')[1] + '/' : '/';
if (!location.hash) { const p = location.pathname.slice(BASE.length - 1).replace(/\/index\.html$|\/+$/g, ''); if (p && p !== '/') history.replaceState(null, '', BASE + '#' + p); }
$('[data-year]').textContent = new Date().getFullYear();
addEventListener('hashchange', render);
render();
})();
