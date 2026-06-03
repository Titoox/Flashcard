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
  render(); stats(); updateSubFilterCounts();
}

function updateSubFilterCounts(){
  var catCards = filterCat === 'all'
    ? ALL.slice()
    : ALL.filter(function(c){ return c.c === filterCat; });
  var counts = {
    'null': catCards.filter(function(c){ return scores[c.id] === undefined; }).length,
    k: catCards.filter(function(c){ return scores[c.id] === 'k'; }).length,
    u: catCards.filter(function(c){ return scores[c.id] === 'u'; }).length,
    n: catCards.filter(function(c){ return scores[c.id] === 'n'; }).length
  };
  var labels = {'null':'Non triées', k:'Sues', u:'Incertants', n:'À revoir'};
  document.querySelectorAll('.sfbtn').forEach(function(b){
    var key = b.dataset.score;
    b.textContent = labels[key] + ' (' + (counts[key] || 0) + ')';
  });
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
document.querySelectorAll('.sfbtn').forEach(function(b){
  var bScore = b.dataset.score === 'null' ? null : b.dataset.score;
  b.classList.toggle('on', bScore === filterScore);
});

buildDeck();
updateGameBar();
