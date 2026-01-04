// activityTracking.js — updated full file
/* Configuration */
const SERVER = window.SERVER || (location.hostname === 'localhost' ? 'http://localhost:3000' : location.origin);

/* DOM refs */
const liveIndicator = document.getElementById('live-indicator');
const ecoPercentEl = document.getElementById('ecoPercent');
const gaugeArc = document.getElementById('gauge-arc');
const footprintCanvas = document.getElementById('footprintChart');
const leaderboardEl = document.getElementById('leaderboard');

const logBtns = document.querySelectorAll('.logbtn');
const logModal = document.getElementById('logModal');
const modalTitle = document.getElementById('modalTitle');
const modalClose = document.getElementById('modalClose');
const activityValue = document.getElementById('activityValue');
const activityUnit = document.getElementById('activityUnit');
const submitActivityBtn = document.getElementById('submitActivity');
const cancelActivityBtn = document.getElementById('cancelActivity');

const goalText = document.getElementById('goalText');
const goalTarget = document.getElementById('goalTarget');
const addGoalBtn = document.getElementById('addGoalBtn');
const activeGoalsList = document.getElementById('activeGoalsList');

const toastEl = document.getElementById('toast');

let footprintChart = null;
let ecoScore = 80;
let footprintData = [2.0, 2.4, 2.1, 1.8, 1.9, 2.0, 2.2];

let socket = null;

/* Local storage keys */
const LS_GOALS = 'ecotrack_goals_v2';
const LS_BOARD = 'ecotrack_board_v2';

/* Unit map */
const UNIT_MAP = {
  'Commute': ['km', 'miles'],
  'Energy Usage': ['kWh'],
  'Water Consumption': ['L', 'mL'],
  'Recycling': ['items', 'pieces'],
  'Waste Reduction': ['kg', 'g']
};

/* Helpers */
function showToast(msg = 'Saved') {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 1400);
}
function fmtTime(ts) {
  try { return new Date(ts || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch { return new Date().toLocaleTimeString(); }
}
function idForType(t) {
  return `sub-${String(t || '').trim().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

/* Local storage wrappers */
function loadGoals() { try { return JSON.parse(localStorage.getItem(LS_GOALS) || '[]'); } catch { return []; } }
function saveGoals(a) { try { localStorage.setItem(LS_GOALS, JSON.stringify(a)); } catch {} }
function loadBoard() { try { return JSON.parse(localStorage.getItem(LS_BOARD) || '[]'); } catch { return []; } }
function saveBoard(a) { try { localStorage.setItem(LS_BOARD, JSON.stringify(a)); } catch {} }

/* Seed leaderboard if empty */
function seedLeaderboard() {
  const b = loadBoard();
  if (b && b.length > 0) return;
  const seed = [
    { name: 'Alex', points: 92 },
    { name: 'Maya', points: 88 },
    { name: 'Sam', points: 85 },
    { name: 'You', points: 80 }
  ];
  saveBoard(seed);
}

/* Gauge */
function setGauge(p) {
  const clamped = Math.max(0, Math.min(100, Math.round(p)));
  if (ecoPercentEl) ecoPercentEl.textContent = `${clamped}%`;
  const total = 300;
  const visible = Math.round((clamped / 100) * total);
  if (gaugeArc) gaugeArc.setAttribute('stroke-dasharray', `${visible} ${total - visible}`);
  ecoScore = clamped;
}

/* Chart */
function initChart() {
  if (!footprintCanvas) return;
  const ctx = footprintCanvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, footprintCanvas.width, 0);
  grad.addColorStop(0, '#18ff9c');
  grad.addColorStop(0.6, '#12d6ff');

  footprintChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
      datasets: [{
        data: footprintData.slice(),
        fill: true,
        borderColor: grad,
        backgroundColor: 'rgba(18,214,255,0.06)',
        tension: 0.36,
        pointRadius: 0,
        borderWidth: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#9fb7c3' }, grid: { color: 'rgba(255,255,255,0.02)' } },
        y: { ticks: { color: '#9fb7c3' }, grid: { color: 'rgba(255,255,255,0.02)' }, suggestedMin:1, suggestedMax:3.6 }
      }
    }
  });
}

/* Apply activity */
function applyActivityToUI(act) {
  if (!act) return;
  const sub = document.getElementById(idForType(act.type));
  if (sub) sub.textContent = `${act.value} ${act.unit || ''} • ${fmtTime(act.createdAt)}`;

  let delta = 0.05;
  if (act.type === 'Commute') delta = (Number(act.value) || 0) * 0.03;
  else if (act.type === 'Energy Usage') delta = (Number(act.value) || 0) * 0.18;
  else if (act.type === 'Water Consumption') delta = (Number(act.value) || 0) * 0.01;
  else if (act.type === 'Recycling') delta = -(Number(act.value) || 0) * 0.1;
  else if (act.type === 'Waste Reduction') delta = (Number(act.value) || 0) * 0.05;

  const last = footprintData[footprintData.length - 1] || 2.0;
  footprintData.push(parseFloat((last + delta).toFixed(2)));
  footprintData.shift();

  if (footprintChart) { footprintChart.data.datasets[0].data = footprintData.slice(); footprintChart.update(); }

  let newScore = ecoScore - Math.round(delta * 4);
  if (delta < 0) newScore = ecoScore + Math.round((-delta) * 6);
  setGauge(newScore);
}

/* populate unit select */
function populateUnitSelect(type) {
  if (!activityUnit) return;
  activityUnit.innerHTML = '';
  const opts = UNIT_MAP[type] || ['unit'];
  opts.forEach(o => { const op = document.createElement('option'); op.value = o; op.textContent = o; activityUnit.appendChild(op); });
}

/* Modal handling */
function openModal(type) {
  if (!logModal) return;
  modalTitle.textContent = `Log ${type}`;
  activityValue.value = '';
  populateUnitSelect(type);
  logModal.dataset.type = type;
  logModal.classList.remove('hidden');
  setTimeout(() => activityValue && activityValue.focus(), 50);
}
function closeModal() { if (!logModal) return; logModal.classList.add('hidden'); delete logModal.dataset.type; }

/* Submit activity */
async function submitActivity() {
  const type = logModal && logModal.dataset.type;
  const val = Number(activityValue.value);
  const unit = activityUnit.value || '';

  if (!type || !val || isNaN(val)) { alert('Enter a valid numeric value'); return; }

  const payload = { type, value: val, unit, user: 'You', createdAt: new Date().toISOString() };

  try {
    const res = await fetch(`${SERVER}/api/activities`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (json && json.success) { applyActivityToUI(json.activity || payload); showToast('Saved (server)'); }
    else { applyActivityToUI(payload); showToast('Saved locally'); }
  } catch (e) {
    applyActivityToUI(payload);
    showToast('Saved offline');
  } finally {
    closeModal();
    await refreshLeaderboardFromLocal();
  }
}

/* Goals */
function addGoal() {
  const text = (goalText.value || '').trim();
  const target = Number(goalTarget.value);
  if (!text || !target || isNaN(target) || target <= 0) { return alert('Enter a valid goal text and numeric target > 0'); }
  const goals = loadGoals();
  const g = { id: `g-${Date.now()}`, text, target, progress: 0, createdAt: new Date().toISOString() };
  goals.push(g); saveGoals(goals); renderGoals(goals);
  goalText.value = ''; goalTarget.value = ''; showToast('Goal added');
}
function renderGoals(goals) {
  if (!activeGoalsList) return;
  activeGoalsList.innerHTML = '';
  if (!goals || goals.length === 0) { activeGoalsList.innerHTML = '<div class="muted">No active goals</div>'; return; }

  goals.forEach(g => {
    const pct = Math.min(100, Math.round(((g.progress || 0) / (g.target || 1)) * 100) || 0);
    const wrap = document.createElement('div');
    wrap.className = 'goal-item' + ((g.progress >= g.target) ? ' completed' : '');
    wrap.innerHTML = `
      <div class="goal-title">${escapeHtml(g.text)}</div>
      <div class="muted">Progress: ${g.progress || 0}/${g.target}</div>
      <div class="goal-progress"><div class="bar" style="width:${pct}%"></div></div>
      <div style="margin-top:10px;"><button class="btn update-goal" data-id="${g.id}">Update Progress</button></div>
    `;
    activeGoalsList.appendChild(wrap);
  });

  activeGoalsList.querySelectorAll('.update-goal').forEach(btn => {
    const id = btn.dataset.id;
    btn.addEventListener('click', () => {
      const goals = loadGoals(); const g = goals.find(x => x.id === id); if (!g) return;
      const remaining = Math.max(0, g.target - (g.progress || 0));
      if (remaining <= 0) { completeGoal(g); renderGoals(loadGoals()); refreshLeaderboardFromLocal(); return; }
      let entry = prompt(`Enter value to add (remaining ${remaining}):`, '1'); if (entry === null) return; entry = entry.trim(); if (!entry) return alert('Enter a number');
      const num = Number(entry); if (!num || isNaN(num) || num <= 0) return alert('Enter a valid positive number');
      const add = Math.min(num, remaining); g.progress = (g.progress || 0) + add;
      if (g.progress >= g.target) completeGoal(g);
      saveGoals(goals); renderGoals(loadGoals()); refreshLeaderboardFromLocal();
    });
  });
}
function completeGoal(goal) {
  const goals = loadGoals().filter(g => g.id !== goal.id);
  saveGoals(goals);
  const board = loadBoard();
  let you = board.find(x => String(x.name).toLowerCase() === 'you');
  if (!you) { you = { name: 'You', points: 0 }; board.push(you); }
  const award = 20;
  you.points = (you.points || 0) + award;
  saveBoard(board);
  showToast(`Goal complete! +${award} pts`);
}

/* Leaderboard rendering */
function renderLeaderboard(list) {
  const el = document.getElementById('leaderboard');
  if (!el) return;
  const arr = Array.isArray(list) ? list.slice() : [];
  arr.sort((a,b) => (b.points||0) - (a.points||0));
  el.innerHTML = '';
  if (arr.length === 0) { const li = document.createElement('li'); li.textContent = 'No leaderboard data'; el.appendChild(li); return; }

  arr.forEach((u, idx) => {
    const li = document.createElement('li');
    const left = document.createElement('div'); left.className = 'left';
    const rank = document.createElement('div'); rank.className = 'rank-badge'; rank.textContent = String(idx + 1);
    if (idx === 0) rank.classList.add('top1'); else if (idx === 1) rank.classList.add('top2'); else if (idx === 2) rank.classList.add('top3');

    const nameWrap = document.createElement('div'); nameWrap.style.display = 'flex'; nameWrap.style.alignItems = 'center'; nameWrap.style.gap = '8px';
    const name = document.createElement('div'); name.className = 'user-name'; name.textContent = u.name || 'Unknown';

    if (idx === 0) { const icon = document.createElement('span'); icon.className = 'medal'; icon.textContent = '🏆'; nameWrap.appendChild(icon); }
    else if (idx === 1) { const icon = document.createElement('span'); icon.className = 'medal'; icon.textContent = '🥈'; nameWrap.appendChild(icon); }
    else if (idx === 2) { const icon = document.createElement('span'); icon.className = 'medal'; icon.textContent = '🥉'; nameWrap.appendChild(icon); }

    nameWrap.appendChild(name);
    left.appendChild(rank);
    left.appendChild(nameWrap);

    const right = document.createElement('div'); right.className = 'points-pill'; right.textContent = `${u.points || 0} pts`;

    const isYou = String(u.name || '').trim().toLowerCase() === 'you';
    if (isYou) {
      li.classList.add('you-highlight-pdf');
      right.style.background = 'rgba(3,34,22,0.06)';
      right.style.color = '#e8fff6';
      right.style.fontWeight = '800';
    }

    li.appendChild(left);
    li.appendChild(right);
    el.appendChild(li);
  });
}

/* Refresh leaderboard from server and local merge */
async function refreshLeaderboardFromLocal() {
  try {
    const res = await fetch(`${SERVER}/api/leaderboard`);
    const server = await res.json().catch(() => null);
    let merged = [];
    if (Array.isArray(server)) merged = server.slice();
    else merged = (server && Array.isArray(server.data)) ? server.data.slice() : [];

    const local = loadBoard();
    local.forEach(l => {
      const idx = merged.findIndex(x => String(x.name).toLowerCase() === String(l.name).toLowerCase());
      if (idx === -1) merged.push(l);
      else merged[idx].points = Math.max(merged[idx].points || 0, l.points || 0);
    });

    const localYou = (local.find(x => String(x.name).toLowerCase() === 'you') || { points: 0 }).points;
    const idxYou = merged.findIndex(x => String(x.name).toLowerCase() === 'you');
    if (idxYou >= 0) merged[idxYou].points = Math.max(merged[idxYou].points || 0, localYou);
    else merged.push({ name: 'You', points: localYou });

    merged.sort((a,b) => (b.points||0) - (a.points||0));
    renderLeaderboard(merged);
  } catch (e) {
    const local = loadBoard();
    local.sort((a,b) => (b.points||0) - (a.points||0));
    renderLeaderboard(local);
  }
}

/* UI bindings */
function bindUI() {
  document.querySelectorAll('.logbtn').forEach(b => b.addEventListener('click', (e) => openModal(e.currentTarget.dataset.type)));
  modalClose?.addEventListener('click', closeModal);
  cancelActivityBtn?.addEventListener('click', closeModal);
  submitActivityBtn?.addEventListener('click', submitActivity);
  addGoalBtn?.addEventListener('click', addGoal);
}

/* Socket features (optional) */
function initSocket() {
  if (typeof io === 'undefined') { console.warn('socket.io client missing; socket features disabled'); return; }
  socket = io(SERVER, { transports: ['websocket', 'polling'] });
  socket.on('connect', () => {
    if (liveIndicator) { liveIndicator.classList.remove('disconnected'); liveIndicator.classList.add('connected'); liveIndicator.innerHTML = '<span class="dot"></span> Live'; }
    socket.emit('getRecent', 100);
  });
  socket.on('disconnect', () => {
    if (liveIndicator) { liveIndicator.classList.remove('connected'); liveIndicator.classList.add('disconnected'); liveIndicator.innerHTML = '<span class="dot"></span> Offline'; }
  });
  socket.on('activityCreated', act => { applyActivityToUI(act); refreshLeaderboardFromLocal(); });
  socket.on('recent', list => {
    try {
      if (!Array.isArray(list)) return;
      list.slice(0,20).forEach(item => {
        const sub = document.getElementById(idForType(item.type));
        if (sub) sub.textContent = `${item.value} ${item.unit || ''} • ${fmtTime(item.createdAt)}`;
      });
    } catch (e) { console.warn(e); }
  });
}

/* Boot */
window.addEventListener('load', async () => {
  bindUI();
  initChart();
  setGauge(ecoScore);
  seedLeaderboard();
  renderGoals(loadGoals());
  await refreshLeaderboardFromLocal();
  initSocket();
});
