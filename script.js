/* =========================================================
   Permis — Flashcards : logique complète
   Modes : Lecture (flip), Écriture, Chrono, Cœurs
   Gamification : série (streak), objectif du jour, feedback
   ========================================================= */

/* ---------- 1. Lecture des cartes ---------- */
var ALL=[];
(function(){
  document.getElementById('data').querySelectorAll('.cd').forEach(function(n,i){
    var tpl=n.querySelector('template');
    ALL.push({id:i,c:n.dataset.c,l:n.dataset.l,q:n.dataset.q,a:tpl?tpl.innerHTML:''});
  });
})();

/* ---------- 2. État ---------- */
var deck=[],idx=0,fl=false,filter='all',scores={},mode='flip';
var KEY='permis_v4',FKEY='permis_filter_v4';
var GKEY='permis_game_v1';
var game={best:0,chronoBest:0,goal:20,day:'',done:0,sound:true,streak:0};
var streak=0;
var prevFilter='all'; // filtre sauvegardé avant le mode Cœurs
// Chrono
var chronoTimer=null,chronoLeft=0,chronoScore=0,CHRONO_TIME=120;
// Cœurs
var lives=3,heartsScore=0;

/* ---------- 3. Stockage ---------- */
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(scores));}catch(e){}}
function loadLocal(){try{var s=localStorage.getItem(KEY);if(s)scores=JSON.parse(s);}catch(e){}}
function saveFilter(){try{localStorage.setItem(FKEY,filter);}catch(e){}}
function loadFilter(){
  try{
    var f=localStorage.getItem(FKEY);
    if(f){
      if(f==='review')f='n'; // migration : ancien filtre "review" → "n"
      filter=f;
    }
  }catch(e){}
}
function saveGame(){try{localStorage.setItem(GKEY,JSON.stringify(game));}catch(e){}}
function loadGame(){
  try{
    var g=localStorage.getItem(GKEY);
    if(g){
      var p=JSON.parse(g);
      if(typeof p==='object'&&p!==null){
        // On ne prend que les clés connues, avec le bon type
        if(typeof p.best==='number')game.best=p.best;
        if(typeof p.chronoBest==='number')game.chronoBest=p.chronoBest;
        if(typeof p.goal==='number'&&p.goal>0)game.goal=p.goal;
        if(typeof p.day==='string')game.day=p.day;
        if(typeof p.done==='number')game.done=p.done;
        if(typeof p.sound==='boolean')game.sound=p.sound;
        if(typeof p.streak==='number')game.streak=p.streak;
      }
    }
  }catch(e){}
}

/* L'objectif du jour se réinitialise chaque jour. */
function todayStr(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function checkDay(){
  var t=todayStr();
  if(game.day!==t){game.day=t;game.done=0;saveGame();}
}

/* ---------- 4. Son (bips générés, pas de fichier externe) ---------- */
var actx=null;
function beep(freq,dur,type){
  if(!game.sound)return;
  try{
    if(!actx)actx=new (window.AudioContext||window.webkitAudioContext)();
    var o=actx.createOscillator(),g=actx.createGain();
    o.type=type||'square';o.frequency.value=freq;
    o.connect(g);g.connect(actx.destination);
    g.gain.setValueAtTime(.08,actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,actx.currentTime+dur);
    o.start();o.stop(actx.currentTime+dur);
  }catch(e){}
}
function soundGood(){beep(660,.08);setTimeout(function(){beep(880,.12);},80);}
function soundBad(){beep(200,.18,'sawtooth');}
function soundWin(){beep(660,.1);setTimeout(function(){beep(880,.1);},100);setTimeout(function(){beep(1100,.18);},200);}

/* ---------- 5. Construction du paquet ---------- */
function buildDeck(){
  if(filter==='all'){deck=ALL.slice();}
  else if(filter==='k'){deck=ALL.filter(function(c){return scores[c.id]==='k';});}
  else if(filter==='u'){deck=ALL.filter(function(c){return scores[c.id]==='u';});}
  else if(filter==='n'){deck=ALL.filter(function(c){return scores[c.id]==='n';});}
  else{deck=ALL.filter(function(c){return c.c===filter;});}
  idx=0;fl=false;render();stats();
}

/* ---------- 6. Affichage ---------- */
function syncHeight(){var inner=document.getElementById('inner');if(inner){inner.style.minHeight='';inner.style.minHeight=inner.scrollHeight+'px';}}
function isGame(){return mode==='chrono'||mode==='hearts';}

/* Message vide adapté au filtre actif. */
var EMPTY_MSGS={
  k:'Aucune carte « sue » — réponds à des cartes et marque « Je sais » pour les voir ici.',
  u:'Aucune carte « incertaine » — marque des cartes « Incertain » pour les voir ici.',
  n:'Aucune carte « à revoir » — marque des cartes « À revoir » pour les voir ici.'
};

function render(){
  var empty=document.getElementById('empty-msg');
  if(!deck.length){
    ['scene','write-area','flip-nav','write-nav'].forEach(function(id){var e=document.getElementById(id);if(e)e.style.display='none';});
    document.getElementById('score').className='score';
    document.getElementById('cnum').textContent='Carte 0 / 0';
    if(empty)empty.textContent=EMPTY_MSGS[filter]||'Aucune carte dans ce filtre.';
    if(empty)empty.style.display='block';
    return;
  }
  if(empty)empty.style.display='none';

  // En modes jeu, on force l'affichage type "flip" sans les boutons de nav classiques.
  var showFlip=(mode==='flip'||isGame());
  document.getElementById('scene').style.display=showFlip?'':'none';
  document.getElementById('flip-nav').style.display=(mode==='flip')?'':'none';
  document.getElementById('write-area').style.display=mode==='write'?'flex':'none';
  document.getElementById('write-nav').style.display=mode==='write'?'':'none';

  var c=deck[idx];
  document.getElementById('cnum').textContent='Carte '+(idx+1)+' / '+deck.length;
  if(showFlip){
    var ft=document.getElementById('ftag');ft.textContent=c.l;ft.className='tag '+c.c;
    document.getElementById('fbody').className='body '+c.c;
    document.getElementById('qtext').textContent=c.q;
    document.getElementById('atext').innerHTML=c.a;
    document.getElementById('scene').className='scene'+(fl?' flip':'');
    document.getElementById('score').className='score'+(fl?' show':'');
    document.getElementById('bprev').disabled=(idx===0);
    document.getElementById('bnext').disabled=(idx===deck.length-1);
    setTimeout(syncHeight,50);
  } else {
    var wt=document.getElementById('w-tag');wt.textContent=c.l;wt.className='write-qtag '+c.c;
    document.getElementById('w-question').className='write-question '+c.c;
    document.getElementById('w-qtext').textContent=c.q;
    document.getElementById('w-input').value='';
    document.getElementById('w-input').disabled=false;
    document.getElementById('w-answer').classList.remove('show');
    document.getElementById('w-selfmark').classList.remove('show');
    document.getElementById('w-atext').innerHTML=c.a;
    document.getElementById('w-bprev').disabled=(idx===0);
    document.getElementById('w-bnext').disabled=(idx===deck.length-1);
    setTimeout(function(){document.getElementById('w-input').focus();},100);
  }
}

/* ---------- 7. Modes ---------- */
function setMode(m){
  stopChrono();
  mode=m;fl=false;
  document.querySelectorAll('.modetab').forEach(function(b){b.classList.remove('on');});
  var tab=document.getElementById('tab-'+m);if(tab)tab.classList.add('on');
  updateGameBar();
  document.getElementById('score').className='score';
  // Les modes jeu appellent shuffle()→render() eux-mêmes : pas de render() final inutile.
  if(m==='chrono'){startChrono();return;}
  if(m==='hearts'){prevFilter=filter;lives=3;heartsScore=0;shuffle();return;}
  render();
}
function flipCard(){if(mode==='write')return;fl=!fl;render();}
function revealAnswer(){
  document.getElementById('w-input').disabled=true;
  document.getElementById('w-answer').classList.add('show');
  document.getElementById('w-selfmark').classList.add('show');
}
function next(){if(idx<deck.length-1){idx++;fl=false;render();}}
function prev(){if(idx>0){idx--;fl=false;render();}}

/* ---------- 8. Filtres / mélange ---------- */
function filt(f){
  filter=f;saveFilter();
  document.querySelectorAll('.fbtn').forEach(function(b){b.classList.toggle('on',b.dataset.f===f);});
  buildDeck();
}
function shuffle(){
  for(var i=deck.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=deck[i];deck[i]=deck[j];deck[j]=t;}
  idx=0;fl=false;render();
}

/* ---------- 9. Feedback visuel (flash vert / rouge) ---------- */
function flash(kind){
  var cls=kind==='good'?'flash-good':'flash-bad';
  // En mode écriture, le flash s'applique sur la zone de réponse visible.
  var cible=(mode==='write')
    ?document.getElementById('write-area')
    :document.getElementById('scene');
  if(!cible)return;
  cible.classList.add(cls);
  setTimeout(function(){cible.classList.remove(cls);},450);
}

/* ---------- 10. Notation ---------- */
function mark(s){
  if(!deck.length)return; // protection : deck vide, rien à noter

  var c=deck[idx];
  scores[c.id]=s;saveLocal();

  // Série : bonne réponse l'allonge, "à revoir" la casse.
  if(s==='k'){
    streak++;
    game.streak=streak;
    if(streak>game.best)game.best=streak;
    saveGame();
    flash('good');soundGood();
  }else if(s==='n'){
    streak=0;
    game.streak=0;
    saveGame();
    flash('bad');soundBad();
  }else{
    flash('good'); // incertain : neutre pour la série
  }

  // Objectif du jour : chaque carte notée compte.
  checkDay();
  game.done++;saveGame();
  if(game.done===game.goal){celebrate();}

  // Modes jeu
  if(mode==='hearts'){
    heartsScore++;
    if(s==='n'){lives--;if(lives<=0){endHearts();return;}}
    updateGameBar();
    advanceGame();return;
  }
  if(mode==='chrono'){
    if(s==='k')chronoScore++;
    updateGameBar();
    advanceGame();return;
  }

  // Modes flip / écriture : retirer la carte du deck si elle ne correspond plus au filtre.
  var sortDuFiltre=(filter==='k'&&s!=='k')||(filter==='u'&&s!=='u')||(filter==='n'&&s!=='n');
  stats();updateGameBar();
  if(sortDuFiltre){buildDeck();return;}
  if(idx<deck.length-1){idx++;fl=false;render();}
}

/* En mode jeu : carte suivante automatique (boucle sur le paquet). */
function advanceGame(){
  fl=false;
  idx++;
  if(idx>=deck.length){shuffle();}else{render();}
}

/* ---------- 11. Objectif du jour : célébration ---------- */
function celebrate(){
  soundWin();
  var el=document.getElementById('celebrate');
  if(el){el.style.display='flex';setTimeout(function(){el.style.display='none';},2600);}
}

/* ---------- 12. Mode CHRONO ---------- */
function startChrono(){
  chronoLeft=CHRONO_TIME;chronoScore=0;
  shuffle();
  chronoTimer=setInterval(function(){
    chronoLeft--;updateGameBar();
    if(chronoLeft<=0){endChrono();}
  },1000);
}
function stopChrono(){if(chronoTimer){clearInterval(chronoTimer);chronoTimer=null;}}
function endChrono(){
  stopChrono();
  // Record chrono séparé du record de série
  if(chronoScore>game.chronoBest){game.chronoBest=chronoScore;saveGame();}
  soundWin();
  alert('Temps écoulé ! Score : '+chronoScore+' cartes sues. Record chrono : '+game.chronoBest);
}

/* ---------- 13. Mode CŒURS ---------- */
function endHearts(){
  soundBad();
  alert('Game over ! Tu as répondu à '+heartsScore+' cartes.');
  var restore=prevFilter; // filtre sauvegardé avant d'entrer en mode Cœurs
  setMode('flip');
  filt(restore); // restaure le filtre au lieu de forcer 'all'
}

/* ---------- 14. Réinitialisation ---------- */
function confirmReset(){
  if(confirm('Réinitialiser toute la progression ?')){
    scores={};saveLocal();
    streak=0;game.streak=0;saveGame();
    buildDeck();updateGameBar();
  }
}

/* ---------- 14b. Export / Import de la progression ---------- */
function exportProgress(){
  try{
    var blob=new Blob([JSON.stringify(scores)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download='permis-progression.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    // Délai pour laisser le navigateur démarrer le téléchargement avant de libérer l'URL.
    setTimeout(function(){URL.revokeObjectURL(url);},100);
  }catch(e){alert('Export impossible sur ce navigateur.');}
}
function importProgress(event){
  var file=event.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(typeof data==='object'&&data!==null&&!Array.isArray(data)){
        var valides=['k','u','n'];
        var propres={};
        // Validation : clés = index de carte valide, valeurs = 'k'/'u'/'n' uniquement.
        Object.keys(data).forEach(function(k){
          var num=parseInt(k,10);
          if(!isNaN(num)&&num>=0&&num<ALL.length&&valides.indexOf(data[k])!==-1){
            propres[num]=data[k];
          }
        });
        scores=propres;saveLocal();buildDeck();
        alert('Progression importée ('+Object.keys(propres).length+' cartes).');
      }else{alert('Fichier invalide.');}
    }catch(err){alert('Fichier illisible.');}
  };
  reader.readAsText(file);event.target.value='';
}

/* ---------- 15. Statistiques ---------- */
function stats(){
  // Compte sur TOUTES les cartes pour montrer la progression globale.
  var k=0,u=0,n=0;
  ALL.forEach(function(c){
    if(scores[c.id]==='k')k++;
    if(scores[c.id]==='u')u++;
    if(scores[c.id]==='n')n++;
  });
  document.getElementById('stot').textContent=ALL.length;
  document.getElementById('sok').textContent=k;
  var su=document.getElementById('sunsure');if(su)su.textContent=u;
  document.getElementById('snok').textContent=n;
  document.getElementById('pbar').style.width=ALL.length?(k/ALL.length*100).toFixed(0)+'%':'0%';
}

/* ---------- 16. Bandeau de jeu (série / objectif / chrono / cœurs) ---------- */
function updateGameBar(){
  checkDay();
  var bar=document.getElementById('gamebar');if(!bar)return;
  var html='';
  html+='<span class="gb-item"><b>Série</b> '+streak+'</span>';
  html+='<span class="gb-item"><b>Record</b> '+game.best+'</span>';
  html+='<span class="gb-item"><b>Jour</b> '+Math.min(game.done,game.goal)+'/'+game.goal+'</span>';
  if(mode==='chrono'){html+='<span class="gb-item gb-live"><b>Temps</b> '+chronoLeft+'s · '+chronoScore+' ok · Record: '+game.chronoBest+'</span>';}
  if(mode==='hearts'){var h='';for(var i=0;i<3;i++)h+=(i<lives?'♥':'·');html+='<span class="gb-item gb-live"><b>Vies</b> '+h+'</span>';}
  bar.innerHTML=html;
}

/* ---------- 17. Réglage du son ---------- */
function toggleSound(){
  game.sound=!game.sound;saveGame();
  var b=document.getElementById('sound-btn');if(b)b.textContent=game.sound?'Son ON':'Son OFF';
  if(game.sound)soundGood();
}

/* ---------- 18. Raccourcis clavier ---------- */
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='TEXTAREA')return;
  if(e.key===' '){e.preventDefault();mode==='write'?revealAnswer():flipCard();}
  if(e.key==='f'||e.key==='F'){if(mode!=='write')flipCard();}
  if(e.key==='ArrowRight'){if(mode==='flip')(fl?next():flipCard());else if(mode==='write')next();}
  if(e.key==='ArrowLeft')prev();
  // Notation 1/2/3 : seulement quand la réponse est visible.
  var reponseVisible=(mode==='flip'&&fl)
    ||(mode==='write'&&document.getElementById('w-answer').classList.contains('show'))
    ||isGame();
  if(reponseVisible){
    if(e.key==='1')mark('k');
    if(e.key==='2')mark('u');
    if(e.key==='3')mark('n');
  }
});

/* ---------- 19. Démarrage ---------- */
loadLocal();loadFilter();loadGame();checkDay();
streak=game.streak||0;
var sb=document.getElementById('sound-btn');if(sb)sb.textContent=game.sound?'Son ON':'Son OFF';
document.querySelectorAll('.fbtn').forEach(function(b){b.classList.toggle('on',b.dataset.f===filter);});
buildDeck();
setMode('flip');
updateGameBar();
