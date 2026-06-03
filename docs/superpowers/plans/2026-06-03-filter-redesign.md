# Refonte Filtres + Simplification Modes — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le système de filtre unique par un système catégorie + sous-filtre score, supprimer tous les modes sauf Lecture (flip), optimiser pour usage mobile iPhone.

**Architecture:** Deux variables d'état `filterCat` et `filterScore` remplacent l'ancienne variable `filter`. HTML restructuré avec une rangée catégorie + une rangée score conditionnelle. Les trois fichiers (HTML, CSS, JS) peuvent être modifiés en parallèle car l'interface entre eux est définie ci-dessous.

**Tech Stack:** HTML/CSS/JS vanilla, localStorage, Web Audio API

---

## Contrat d'interface (lire avant chaque tâche)

IDs HTML que le JS utilise :

| ID | Rôle |
|----|------|
| `stot`, `sok`, `sunsure`, `snok`, `pbar` | Stats bar |
| `gamebar` | Bandeau série/record/jour |
| `cnum` | "Carte X / Y" |
| `scene`, `inner`, `ftag`, `fbody`, `qtext`, `atext` | Flip card |
| `flip-nav`, `bprev`, `bnext` | Navigation |
| `score` | Boutons Je sais / Incertain / À revoir |
| `score-filters` | Rangée sous-filtres score (cachée si cat='all') |
| `empty-msg` | Message deck vide |
| `sound-btn` | Bouton son |
| `import-file` | Input file import |
| `celebrate` | Overlay célébration |
| `data` | Div cachée contenant les cartes |

Classes HTML que le JS cible :

| Classe | Rôle |
|--------|------|
| `.fbtn[data-cat]` | Boutons catégorie |
| `.sfbtn[data-score]` | Sous-boutons score |
| `.on` | Bouton actif |

---

## Task 1 : HTML — Restructurer index.html

**Files:**
- Modify: `index.html`

> Objectif : supprimer la modebar, restructurer les filtres (data-f → data-cat), ajouter la rangée de sous-filtres score, supprimer write-area/write-nav, déplacer les boutons d'action.

- [ ] **Étape 1 : Supprimer la modebar entière**

Supprimer le bloc `<div class="modebar">...</div>` (lignes contenant tab-flip, tab-write, tab-chrono, tab-hearts, sound-btn).
Le bouton Son sera déplacé dans la zone actions.

- [ ] **Étape 2 : Remplacer la rangée filters**

Remplacer le bloc `<div class="filters">` existant par :

```html
<div class="filters">
  <span class="flabel">Catégorie :</span>
  <button class="fbtn on" data-cat="all" onclick="filtCat('all')">Toutes</button>
  <button class="fbtn voiture" data-cat="voiture" onclick="filtCat('voiture')">Voiture</button>
  <button class="fbtn ve" data-cat="ve" onclick="filtCat('ve')">VE</button>
  <button class="fbtn qser" data-cat="qser" onclick="filtCat('qser')">Sécurité</button>
  <button class="fbtn sec" data-cat="sec" onclick="filtCat('sec')">Secours</button>
  <button class="fbtn pf" data-cat="pf" onclick="filtCat('pf')">Points faibles</button>
</div>
<div class="score-filters" id="score-filters" style="display:none">
  <span class="flabel">Score :</span>
  <button class="sfbtn on" data-score="null" onclick="filtScore(null)">Non triées</button>
  <button class="sfbtn k-score" data-score="k" onclick="filtScore('k')">Sues</button>
  <button class="sfbtn u-score" data-score="u" onclick="filtScore('u')">Incertants</button>
  <button class="sfbtn n-score" data-score="n" onclick="filtScore('n')">À revoir</button>
</div>
<div class="actions">
  <button class="abtn" onclick="shuffle()">Mélanger</button>
  <button class="abtn" onclick="exportProgress()">Exporter</button>
  <button class="abtn" onclick="document.getElementById('import-file').click()">Importer</button>
  <input type="file" id="import-file" accept="application/json,.json" style="display:none" onchange="importProgress(event)">
  <button class="abtn del" onclick="confirmReset()">Réinit.</button>
  <button class="abtn" id="sound-btn" onclick="toggleSound()">Son ON</button>
</div>
```

- [ ] **Étape 3 : Supprimer write-area et write-nav**

Supprimer les blocs :
- `<div id="write-area">...</div>`
- `<div class="nav" id="write-nav" ...>...</div>`

Garder uniquement `#scene`, `#flip-nav`, `#score`, `#empty-msg`.

- [ ] **Étape 4 : Garder #data intact**

Ne pas toucher au bloc `<div id="data" style="display:none">` — il contient les 216 cartes.

- [ ] **Étape 5 : S'assurer que le header est propre**

```html
<header>
  <h1>Permis — Flashcards</h1>
  <p>Voiture &middot; Vérifications &middot; Sécurité &middot; Secours &middot; Points faibles</p>
</header>
```

---

## Task 2 : CSS — Mettre à jour style.css

**Files:**
- Modify: `style.css`

> Objectif : supprimer les styles des modes supprimés (modetab, write-area, chrono, hearts), ajouter les styles pour .score-filters, .sfbtn, .actions.

- [ ] **Étape 1 : Supprimer les blocs CSS liés aux modes supprimés**

Supprimer tous les blocs qui contiennent ces sélecteurs (chercher et supprimer) :
- `.modetab`
- `.modebar`
- `#write-area`
- `.write-question`, `.write-qtag`, `.write-qtext`
- `.write-input-area`, `.write-textarea`, `.write-actions`, `.wbtn`
- `.write-answer`, `.write-answer-label`, `.write-answer-text`
- `.write-selfmark`, `.write-selfmark-label`
- `.gb-live` (gamebar chrono/hearts)
- `flashWriteG`, `flashWriteB`, `@keyframes flashWriteG`, `@keyframes flashWriteB`
- `.k-score.on`, `.u-score.on`, `.n-score.on` (anciens styles de score-filter boutons — seront remplacés)

- [ ] **Étape 2 : Déplacer les boutons actions dans une div propre**

Ajouter ce bloc CSS pour la nouvelle zone d'actions :

```css
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 12px;
}
```

- [ ] **Étape 3 : Ajouter les styles pour .score-filters**

```css
.score-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(0,0,0,.04);
  border-bottom: 1px solid rgba(0,0,0,.08);
}

.sfbtn {
  padding: 5px 12px;
  border: 2px solid rgba(0,0,0,.15);
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  font-size: .82rem;
  font-weight: 600;
  transition: background .15s, border-color .15s;
}
.sfbtn.on { border-color: transparent; color: #fff; }
.sfbtn[data-score="null"].on { background: #555; }
.sfbtn.k-score.on { background: #5fb04a; }
.sfbtn.u-score.on { background: #d99a2b; }
.sfbtn.n-score.on { background: #c8472e; }
```

- [ ] **Étape 4 : Vérifier que les styles flip card sont intacts**

S'assurer que ces blocs existent toujours dans le CSS :
- `.scene`, `.inner`, `.face`, `.front`, `.back`
- `.scene.flip .inner`
- `@keyframes flashG`, `@keyframes flashB` (flash sur #scene)
- `.score`, `.score.show`, `.sbtn`

---

## Task 3 : JS — Réécrire script.js

**Files:**
- Modify: `script.js`

> Objectif : réécrire script.js en entier. Supprimer tout le code des modes Écriture/Chrono/Cœurs. Introduire filterCat + filterScore. Nouveau buildDeck(). Nouveau système de filtres.

- [ ] **Étape 1 : Remplacer script.js par le contenu suivant**

```javascript
/* =========================================================
   Permis — Flashcards (mode Lecture uniquement)
   ========================================================= */

/* ---------- 1. Lecture des cartes ---------- */
var ALL = [];
(function(){
  document.getElementById('data').querySelectorAll('.cd').forEach(function(n, i){
    var tpl = n.querySelector('template');
    ALL.push({id: i, c: n.dataset.c, l: n.dataset.l, q: n.dataset.q, a: tpl ? tpl.innerHTML : ''});
  });
})();

/* ---------- 2. État ---------- */
var deck = [], idx = 0, fl = false;
var filterCat = 'all', filterScore = null;
var scores = {};
var KEY = 'permis_v4';
var FCAT_KEY = 'permis_filter_cat_v1';
var FSCR_KEY = 'permis_filter_score_v1';
var GKEY = 'permis_game_v1';
var game = {best: 0, goal: 20, day: '', done: 0, sound: true, streak: 0};
var streak = 0;

/* ---------- 3. Stockage ---------- */
function saveLocal(){ try { localStorage.setItem(KEY, JSON.stringify(scores)); } catch(e){} }
function loadLocal(){ try { var s = localStorage.getItem(KEY); if(s) scores = JSON.parse(s); } catch(e){} }

function saveFilter(){
  try {
    localStorage.setItem(FCAT_KEY, filterCat);
    localStorage.setItem(FSCR_KEY, filterScore === null ? '' : filterScore);
  } catch(e){}
}
function loadFilter(){
  try {
    var cat = localStorage.getItem(FCAT_KEY);
    if(cat) filterCat = cat;
    var scr = localStorage.getItem(FSCR_KEY);
    if(scr !== null) filterScore = scr === '' ? null : scr;
  } catch(e){}
}

function saveGame(){ try { localStorage.setItem(GKEY, JSON.stringify(game)); } catch(e){} }
function loadGame(){
  try {
    var g = localStorage.getItem(GKEY);
    if(g){
      var p = JSON.parse(g);
      if(typeof p === 'object' && p !== null){
        if(typeof p.best === 'number') game.best = p.best;
        if(typeof p.goal === 'number' && p.goal > 0) game.goal = p.goal;
        if(typeof p.day === 'string') game.day = p.day;
        if(typeof p.done === 'number') game.done = p.done;
        if(typeof p.sound === 'boolean') game.sound = p.sound;
        if(typeof p.streak === 'number') game.streak = p.streak;
      }
    }
  } catch(e){}
}

function todayStr(){ var d = new Date(); return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); }
function checkDay(){
  var t = todayStr();
  if(game.day !== t){ game.day = t; game.done = 0; saveGame(); }
}

/* ---------- 4. Son ---------- */
var actx = null;
function beep(freq, dur, type){
  if(!game.sound) return;
  try {
    if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(.08, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, actx.currentTime + dur);
    o.start(); o.stop(actx.currentTime + dur);
  } catch(e){}
}
function soundGood(){ beep(660, .08); setTimeout(function(){ beep(880, .12); }, 80); }
function soundBad(){ beep(200, .18, 'sawtooth'); }
function soundWin(){ beep(660, .1); setTimeout(function(){ beep(880, .1); }, 100); setTimeout(function(){ beep(1100, .18); }, 200); }

/* ---------- 5. Construction du deck ---------- */
var CAT_LABELS = {
  voiture: 'Voiture / Commandes',
  ve: 'Vérif. extérieures',
  qser: 'Sécurité routière',
  sec: 'Premiers secours',
  pf: 'Points faibles'
};

function buildDeck(){
  var catCards = filterCat === 'all'
    ? ALL.slice()
    : ALL.filter(function(c){ return c.c === filterCat; });

  if(filterScore === null){
    deck = catCards.filter(function(c){ return scores[c.id] === undefined; });
  } else {
    deck = catCards.filter(function(c){ return scores[c.id] === filterScore; });
  }

  idx = 0; fl = false;
  render(); stats();
}

/* ---------- 6. Messages de deck vide ---------- */
function getEmptyMsg(){
  if(filterCat === 'all'){
    return 'Toutes les cartes sont triées ! Choisis une catégorie pour retravailler.';
  }
  var label = CAT_LABELS[filterCat] || filterCat;
  if(filterScore === null){
    return 'Bravo, toutes les cartes ' + label + ' sont triées ! Choisis Sues, Incertants ou À revoir pour retravailler.';
  }
  var scoreLabels = {k: 'sues', u: 'incertantes', n: 'à revoir'};
  return 'Aucune carte ' + (scoreLabels[filterScore] || filterScore) + ' dans ' + label + '.';
}

/* ---------- 7. Affichage ---------- */
function syncHeight(){
  var inner = document.getElementById('inner');
  if(inner){ inner.style.minHeight = ''; inner.style.minHeight = inner.scrollHeight + 'px'; }
}

function render(){
  var empty = document.getElementById('empty-msg');
  if(!deck.length){
    document.getElementById('scene').style.display = 'none';
    document.getElementById('flip-nav').style.display = 'none';
    document.getElementById('score').className = 'score';
    document.getElementById('cnum').textContent = 'Carte 0 / 0';
    if(empty){ empty.textContent = getEmptyMsg(); empty.style.display = 'block'; }
    return;
  }
  if(empty) empty.style.display = 'none';
  document.getElementById('scene').style.display = '';
  document.getElementById('flip-nav').style.display = '';

  var c = deck[idx];
  document.getElementById('cnum').textContent = 'Carte ' + (idx+1) + ' / ' + deck.length;
  var ft = document.getElementById('ftag'); ft.textContent = c.l; ft.className = 'tag ' + c.c;
  document.getElementById('fbody').className = 'body ' + c.c;
  document.getElementById('qtext').textContent = c.q;
  document.getElementById('atext').innerHTML = c.a;
  document.getElementById('scene').className = 'scene' + (fl ? ' flip' : '');
  document.getElementById('score').className = 'score' + (fl ? ' show' : '');
  document.getElementById('bprev').disabled = (idx === 0);
  document.getElementById('bnext').disabled = (idx === deck.length - 1);
  setTimeout(syncHeight, 50);
}

/* ---------- 8. Navigation ---------- */
function flipCard(){ fl = !fl; render(); }
function next(){ if(idx < deck.length - 1){ idx++; fl = false; render(); } }
function prev(){ if(idx > 0){ idx--; fl = false; render(); } }

/* ---------- 9. Filtres ---------- */
function filtCat(cat){
  filterCat = cat;
  filterScore = null;
  saveFilter();

  document.querySelectorAll('.fbtn[data-cat]').forEach(function(b){
    b.classList.toggle('on', b.dataset.cat === cat);
  });

  var sf = document.getElementById('score-filters');
  if(sf) sf.style.display = cat === 'all' ? 'none' : '';

  document.querySelectorAll('.sfbtn').forEach(function(b){ b.classList.remove('on'); });
  var defBtn = document.querySelector('.sfbtn[data-score="null"]');
  if(defBtn) defBtn.classList.add('on');

  buildDeck();
}

function filtScore(score){
  filterScore = score;
  saveFilter();

  document.querySelectorAll('.sfbtn').forEach(function(b){
    var bScore = b.dataset.score === 'null' ? null : b.dataset.score;
    b.classList.toggle('on', bScore === score);
  });

  buildDeck();
}

function shuffle(){
  for(var i = deck.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i+1));
    var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
  }
  idx = 0; fl = false; render();
}

/* ---------- 10. Flash ---------- */
function flash(kind){
  var cls = kind === 'good' ? 'flash-good' : 'flash-bad';
  var cible = document.getElementById('scene');
  if(!cible) return;
  cible.classList.add(cls);
  setTimeout(function(){ cible.classList.remove(cls); }, 450);
}

/* ---------- 11. Notation ---------- */
function mark(s){
  if(!deck.length || !fl) return;

  var c = deck[idx];
  scores[c.id] = s; saveLocal();

  if(s === 'k'){
    streak++;
    game.streak = streak;
    if(streak > game.best) game.best = streak;
    saveGame();
    flash('good'); soundGood();
  } else if(s === 'n'){
    streak = 0; game.streak = 0; saveGame();
    flash('bad'); soundBad();
  } else {
    flash('good');
  }

  checkDay();
  game.done++; saveGame();
  if(game.done === game.goal){ celebrate(); }

  stats(); updateGameBar();
  buildDeck();
}

/* ---------- 12. Célébration ---------- */
function celebrate(){
  soundWin();
  var el = document.getElementById('celebrate');
  if(el){ el.style.display = 'flex'; setTimeout(function(){ el.style.display = 'none'; }, 2600); }
}

/* ---------- 13. Statistiques ---------- */
function stats(){
  var k = 0, u = 0, n = 0;
  ALL.forEach(function(c){
    if(scores[c.id] === 'k') k++;
    if(scores[c.id] === 'u') u++;
    if(scores[c.id] === 'n') n++;
  });
  document.getElementById('stot').textContent = ALL.length;
  document.getElementById('sok').textContent = k;
  var su = document.getElementById('sunsure'); if(su) su.textContent = u;
  document.getElementById('snok').textContent = n;
  document.getElementById('pbar').style.width = ALL.length ? (k / ALL.length * 100).toFixed(0) + '%' : '0%';
}

/* ---------- 14. Gamebar ---------- */
function updateGameBar(){
  checkDay();
  var bar = document.getElementById('gamebar'); if(!bar) return;
  bar.innerHTML =
    '<span class="gb-item"><b>Série</b> ' + streak + '</span>' +
    '<span class="gb-item"><b>Record</b> ' + game.best + '</span>' +
    '<span class="gb-item"><b>Jour</b> ' + Math.min(game.done, game.goal) + '/' + game.goal + '</span>';
}

/* ---------- 15. Son ---------- */
function toggleSound(){
  game.sound = !game.sound; saveGame();
  var b = document.getElementById('sound-btn'); if(b) b.textContent = game.sound ? 'Son ON' : 'Son OFF';
  if(game.sound) soundGood();
}

/* ---------- 16. Réinitialisation ---------- */
function confirmReset(){
  if(confirm('Réinitialiser toute la progression ?')){
    scores = {}; saveLocal();
    streak = 0; game.streak = 0; saveGame();
    buildDeck(); updateGameBar();
  }
}

/* ---------- 17. Export / Import ---------- */
function exportProgress(){
  try {
    var blob = new Blob([JSON.stringify(scores)], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'permis-progression.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 100);
  } catch(e){ alert('Export impossible sur ce navigateur.'); }
}

function importProgress(event){
  var file = event.target.files[0]; if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    try {
      var data = JSON.parse(e.target.result);
      if(typeof data === 'object' && data !== null && !Array.isArray(data)){
        var valides = ['k', 'u', 'n'];
        var propres = {};
        Object.keys(data).forEach(function(k){
          var num = parseInt(k, 10);
          if(!isNaN(num) && num >= 0 && num < ALL.length && valides.indexOf(data[k]) !== -1){
            propres[num] = data[k];
          }
        });
        scores = propres; saveLocal(); buildDeck();
        alert('Progression importée (' + Object.keys(propres).length + ' cartes).');
      } else { alert('Fichier invalide.'); }
    } catch(err){ alert('Fichier illisible.'); }
  };
  reader.readAsText(file); event.target.value = '';
}

/* ---------- 18. Démarrage ---------- */
loadLocal(); loadFilter(); loadGame(); checkDay();
streak = game.streak || 0;
var sb = document.getElementById('sound-btn'); if(sb) sb.textContent = game.sound ? 'Son ON' : 'Son OFF';

document.querySelectorAll('.fbtn[data-cat]').forEach(function(b){
  b.classList.toggle('on', b.dataset.cat === filterCat);
});
var sf = document.getElementById('score-filters');
if(sf) sf.style.display = filterCat === 'all' ? 'none' : '';
document.querySelectorAll('.sfbtn').forEach(function(b){
  var bScore = b.dataset.score === 'null' ? null : b.dataset.score;
  b.classList.toggle('on', bScore === filterScore);
});

buildDeck();
updateGameBar();
```

- [ ] **Étape 2 : Vérifier que #data est toujours présent dans index.html**

Le JS lit `document.getElementById('data').querySelectorAll('.cd')` au démarrage.
Si cette div est absente ou vide, ALL restera [] et l'appli sera vide.

---

## Task 4 : Vérification point par point

**Files:**
- Read: `index.html`, `script.js`, `style.css`

> Objectif : vérifier que les 3 fichiers sont cohérents et que chaque point du design est correctement implémenté.

### Checklist de vérification

- [ ] **V1 — Modes supprimés**
  - Vérifier dans index.html : aucun `class="modetab"`, aucun `id="tab-flip"`, `id="tab-write"`, `id="tab-chrono"`, `id="tab-hearts"`
  - Vérifier dans script.js : aucune fonction `setMode`, `startChrono`, `stopChrono`, `endChrono`, `endHearts`, `revealAnswer`, `advanceGame`
  - Vérifier dans style.css : aucun sélecteur `.modetab`, `.modebar`

- [ ] **V2 — Filtres catégorie**
  - Vérifier dans index.html : 6 boutons `.fbtn` avec `data-cat` = all, voiture, ve, qser, sec, pf
  - Vérifier dans script.js : fonction `filtCat(cat)` existe, met à jour `.fbtn[data-cat].on`, cache/montre `#score-filters`
  - Vérifier dans script.js : `loadFilter()` lit `permis_filter_cat_v1` et `permis_filter_score_v1`

- [ ] **V3 — Sous-filtres score**
  - Vérifier dans index.html : div `#score-filters` avec 4 boutons `.sfbtn` ayant `data-score` = null, k, u, n
  - Vérifier dans script.js : fonction `filtScore(score)` existe, met à jour `.sfbtn.on`
  - Vérifier que `#score-filters` a `style="display:none"` par défaut dans le HTML

- [ ] **V4 — buildDeck() logique**
  - Cas 1 : filterCat='all', filterScore=null → deck = cartes sans score (scores[c.id] === undefined)
  - Cas 2 : filterCat='voiture', filterScore=null → deck = cartes voiture sans score
  - Cas 3 : filterCat='voiture', filterScore='n' → deck = cartes voiture avec score 'n'
  - Vérifier que "sans score" signifie `scores[c.id] === undefined` (pas null, pas '')

- [ ] **V5 — Carte quitte le deck après notation**
  - Dans `mark()` : vérifier que `buildDeck()` est appelé à la fin (après saveLocal, stats, updateGameBar)
  - Pas de logique `sortDuFiltre` complexe — juste `buildDeck()` systématiquement

- [ ] **V6 — Messages vides corrects**
  - filterCat='all' → "Toutes les cartes sont triées ! Choisis une catégorie pour retravailler."
  - filterCat='voiture', filterScore=null → "Bravo, toutes les cartes Voiture / Commandes sont triées ! Choisis Sues, Incertants ou À revoir pour retravailler."
  - filterCat='voiture', filterScore='n' → "Aucune carte à revoir dans Voiture / Commandes."

- [ ] **V7 — Re-scoring**
  - Dans un filtre score (ex : filterScore='n'), les boutons Je sais / Incertain / À revoir sont toujours visibles après flip
  - Vérifier que `mark()` ne bloque pas selon filterScore (pas de condition `if(filterScore !== null) return`)

- [ ] **V8 — Gamification intacte**
  - Vérifier dans index.html : `#gamebar`, `#stot`, `#sok`, `#sunsure`, `#snok`, `#pbar` présents
  - Vérifier dans script.js : `updateGameBar()` écrit Série + Record + Jour
  - Vérifier : `celebrate()` appelée quand `game.done === game.goal`

- [ ] **V9 — Export / Import / Son**
  - Vérifier dans index.html : bouton Son avec `id="sound-btn"`, input `id="import-file"`
  - Vérifier dans script.js : fonctions `exportProgress`, `importProgress`, `toggleSound` présentes

- [ ] **V10 — Cohérence CSS / HTML**
  - Vérifier que `.sfbtn`, `.sfbtn.k-score.on`, `.sfbtn.u-score.on`, `.sfbtn.n-score.on` existent dans style.css
  - Vérifier que `.score-filters` a des styles (padding, flex, etc.)
  - Vérifier que les styles de flip card (`.scene`, `.scene.flip`, `.face`) sont toujours présents

- [ ] **V11 — Démarrage (restore state)**
  - Vérifier dans script.js section démarrage : `.fbtn[data-cat]` mis à jour selon filterCat chargé
  - Vérifier : `#score-filters` caché si filterCat='all', visible sinon
  - Vérifier : `.sfbtn` mis à jour selon filterScore chargé

- [ ] **V12 — Rapport final**
  - Lister tous les points conformes ✅
  - Lister tous les points non conformes ❌ avec description précise du problème
  - Si des problèmes sont trouvés : les corriger directement dans les fichiers

---

## Ordre d'exécution recommandé pour agents parallèles

```
Agent 1 (HTML)  ──┐
Agent 2 (CSS)   ──┤──> Agent 4 (Vérification) ──> git push
Agent 3 (JS)    ──┘
```

Tasks 1, 2, 3 peuvent être lancées en parallèle.
Task 4 doit attendre que les 3 autres soient terminées.
