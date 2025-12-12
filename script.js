/* Advanced Memory Game
   - Levels (easy/medium/hard)
   - Leaderboard (localStorage per level)
   - Option: emojis or generated SVG images (data-URLs)
   - Responsive grid
*/

const LEVELS = {
  easy: 4,    // pairs
  medium: 8,
  hard: 12
};

const emojiPool = ["🍎","⭐","🎮","🎲","🐱","⚽","🎵","🚗","🌵","🍩","🍇","🐶","🍕","🌙","🍓","🦊","🍉","🍔","🎸","🧩","🐼","🍪","🚀","⚓"];

const dom = {
  gameArea: document.getElementById("gameArea"),
  levelSelect: document.getElementById("levelSelect"),
  imageToggle: document.getElementById("imageToggle"),
  restartBtn: document.getElementById("restartBtn"),
  scoreEl: document.getElementById("score"),
  movesEl: document.getElementById("moves"),
  timeEl: document.getElementById("time"),
  lbList: document.getElementById("leaderboardList"),
  lbTabs: document.querySelectorAll(".lb-tab"),
  clearLeaderboard: document.getElementById("clearLeaderboard"),
  winModal: document.getElementById("winModal"),
  playerName: document.getElementById("playerName"),
  saveScoreBtn: document.getElementById("saveScoreBtn"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  finalScore: document.getElementById("finalScore"),
  finalTime: document.getElementById("finalTime"),
  finalMoves: document.getElementById("finalMoves")
};

let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let matches = 0;
let score = 0;
let moves = 0;
let timer = null;
let time = 0;

function generateSVGData(label, color) {
  // SVG with centered label (single char or emoji fallback)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
    <defs>
      <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
        <stop offset='0' stop-color='${color}' stop-opacity='1'/>
        <stop offset='1' stop-color='#ffffff' stop-opacity='0.05'/>
      </linearGradient>
    </defs>
    <rect rx='60' width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='52%' font-size='160' text-anchor='middle' dominant-baseline='middle' font-family='Arial' fill='rgba(0,0,0,0.7)'>${label}</text>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function pickColors(n) {
  const palette = ['#ffd166','#06d6a0','#118ab2','#ef476f','#f78c6b','#9b5de5','#00eaff','#ffafcc','#8ac926','#1982c4','#ffb703','#52b69a'];
  // repeat if necessary
  const res = [];
  for (let i=0;i<n;i++) res.push(palette[i % palette.length]);
  return res;
}

function buildDeck(level, useImages){
  const pairCount = LEVELS[level];
  const emojis = [...emojiPool].sort(()=>0.5-Math.random()).slice(0, pairCount);

  let items = [];
  if (useImages) {
    const colors = pickColors(pairCount);
    emojis.forEach((e,i) => {
      // use the emoji as visible text inside SVG so images look nice
      const data = generateSVGData(e, colors[i]);
      items.push(data, data);
    });
  } else {
    emojis.forEach(e => { items.push(e, e); });
  }

  // shuffle
  items.sort(()=>0.5 - Math.random());
  return items;
}

function createCardElement(content, useImages){
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-back">?</div>
      <div class="card-front">${ useImages ? `<img src="${content}" alt="card image">` : `<span class="emoji">${content}</span>`}</div>
    </div>`;
  // click handler
  card.addEventListener("click", onCardClick);
  return card;
}

function onCardClick(e){
  const card = e.currentTarget;
  if (lockBoard) return;
  if (card === firstCard) return;

  if (!timer) startTimer();

  card.classList.add("flip");

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  moves++;
  updateStats();

  const a = firstCard.querySelector(useImagesMode() ? 'img' : '.emoji')?.src || firstCard.querySelector('.emoji')?.textContent;
  const b = secondCard.querySelector(useImagesMode() ? 'img' : '.emoji')?.src || secondCard.querySelector('.emoji')?.textContent;

  if (a === b) {
    // match
    firstCard.removeEventListener("click", onCardClick);
    secondCard.removeEventListener("click", onCardClick);
    matches++;
    score += 10;
    resetTurn();
    checkWin();
  } else {
    // no match
    score = Math.max(0, score - 1);
    lockBoard = true;
    setTimeout(()=> {
      firstCard.classList.remove("flip");
      secondCard.classList.remove("flip");
      resetTurn();
    }, 700);
  }
  updateStats();
}

function resetTurn(){
  [firstCard, secondCard, lockBoard] = [null, null, false];
}

function updateStats(){
  dom.scoreEl.textContent = score;
  dom.movesEl.textContent = moves;
  dom.timeEl.textContent = time;
}

function startTimer(){
  timer = setInterval(()=>{
    time++;
    dom.timeEl.textContent = time;
  }, 1000);
}

function stopTimer(){
  if (timer) { clearInterval(timer); timer = null; }
}

function clearBoard(){
  dom.gameArea.innerHTML = '';
  stopTimer();
  timer = null;
  time = 0;
  moves = 0;
  score = 0;
  matches = 0;
  resetTurn();
  updateStats();
}

function setupGame(){
  clearBoard();
  const level = dom.levelSelect.value;
  const useImages = useImagesMode();
  const deck = buildDeck(level, useImages);

  // adjust grid columns based on pairs (for nicer layout)
  const pairs = LEVELS[level];
  // prefer 4 columns for medium, 6 for hard if space; fallback handled by CSS
  let cols = 4;
  if (pairs <= 4) cols = 4;
  else if (pairs <= 8) cols = 4;
  else cols = 6;
  dom.gameArea.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  deck.forEach(item => {
    const c = createCardElement(item, useImages);
    dom.gameArea.appendChild(c);
  });

  // initial flip animation to give players a quick hint? (optional)
  setTimeout(()=> {
    // slight entrance animation
    document.querySelectorAll('.card').forEach((card,i)=>{
      card.style.transform = `translateY(${10 + (i%6)}px)`;
      setTimeout(()=> card.style.transform = '', 80 + i*8);
    });
  }, 120);
}

function useImagesMode(){ return dom.imageToggle.checked; }

/* Leaderboard: store in localStorage keyed by 'mem_lb_<level>'
   entry: { name, score, moves, time, date }
   keep top 5 sorted by score(desc), then by moves(asc), then time(asc)
*/
function loadLeaderboard(level){
  const raw = localStorage.getItem(`mem_lb_${level}`);
  return raw ? JSON.parse(raw) : [];
}

function saveLeaderboard(level, list){
  localStorage.setItem(`mem_lb_${level}`, JSON.stringify(list));
}

function addToLeaderboard(level, entry){
  const list = loadLeaderboard(level);
  list.push(entry);
  list.sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.moves !== b.moves) return a.moves - b.moves;
    return a.time - b.time;
  });
  // keep top 5
  saveLeaderboard(level, list.slice(0,5));
  renderLeaderboard(level);
}

function renderLeaderboard(level){
  const list = loadLeaderboard(level);
  dom.lbList.innerHTML = '';
  if (list.length === 0) {
    dom.lbList.innerHTML = '<li>No scores yet. Be the first!</li>';
    return;
  }
  list.forEach((it, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${idx+1}. ${escapeHtml(it.name)}</strong> — Score: ${it.score} | Moves: ${it.moves} | Time: ${it.time}s`;
    dom.lbList.appendChild(li);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function checkWin(){
  const totalPairs = LEVELS[dom.levelSelect.value];
  if (matches === totalPairs) {
    stopTimer();
    showWinModal();
  }
}

function showWinModal(){
  dom.finalScore.textContent = score;
  dom.finalTime.textContent = time;
  dom.finalMoves.textContent = moves;
  dom.winModal.setAttribute('aria-hidden', 'false');
  dom.playerName.value = '';
  dom.playerName.focus();
}

function closeWinModal(){
  dom.winModal.setAttribute('aria-hidden', 'true');
}

/* UI events */
dom.restartBtn.addEventListener('click', () => {
  setupGame();
});

dom.levelSelect.addEventListener('change', () => {
  // switch leaderboard tab to that level
  setActiveTab(dom.levelSelect.value);
  setupGame();
});

dom.imageToggle.addEventListener('change', () => {
  setupGame();
});

dom.lbTabs.forEach(btn => {
  btn.addEventListener('click', () => {
    dom.lbTabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderLeaderboard(btn.dataset.level);
  });
});

dom.clearLeaderboard.addEventListener('click', ()=> {
  const active = document.querySelector('.lb-tab.active').dataset.level;
  if (confirm(`Clear leaderboard for ${active}? This cannot be undone.`)) {
    saveLeaderboard(active, []);
    renderLeaderboard(active);
  }
});

dom.saveScoreBtn.addEventListener('click', ()=>{
  const name = dom.playerName.value.trim() || 'Anonymous';
  const level = dom.levelSelect.value;
  addToLeaderboard(level, { name, score, moves, time, date: Date.now() });
  closeWinModal();
});

dom.closeModalBtn.addEventListener('click', ()=> {
  closeWinModal();
});

/* initial render */
function setActiveTab(level){
  dom.lbTabs.forEach(b => b.classList.toggle('active', b.dataset.level === level));
}

(function init(){
  // make sure leaderboard shows current selected level
  setActiveTab(dom.levelSelect.value);
  renderLeaderboard(dom.levelSelect.value);
  setupGame();
})();
