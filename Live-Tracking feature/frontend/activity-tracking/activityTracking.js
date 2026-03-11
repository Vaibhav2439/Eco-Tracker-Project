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
const goalError = document.getElementById('goalError');

const toastEl = document.getElementById('toast');

let footprintChart = null;
let ecoScore = 80;
let footprintData = [2.0, 2.4, 2.1, 1.8, 1.9, 2.0, 2.2];

let socket = null;

/* Get current user from localStorage */
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
const currentUserName = currentUser.name || 'Guest';
const currentUserId = currentUser.id || 'guest-' + Date.now();

/* Local storage keys - now user-specific */
const LS_GOALS = `ecotrack_goals_${currentUserId}`;
const LS_ACTIVITIES = `ecotrack_activities_${currentUserId}`;
const LS_USER_POINTS = `ecotrack_points_${currentUserId}`;
const LS_ALL_USERS_POINTS = 'ecotrack_all_users_points';

/* Unit map with max values and validation rules */
const UNIT_MAP = {
  'Recycling': { 
    units: ['kg', 'items'], 
    max: 50,
    min: 0.1,
    placeholder: '0.1 - 50',
    unit: 'kg/items'
  },
  'Commute': { 
    units: ['km', 'miles'], 
    max: 200,
    min: 0.1,
    placeholder: '0.1 - 200',
    unit: 'km/miles'
  },
  'Energy Usage': { 
    units: ['kWh'], 
    max: 100,
    min: 0.1,
    placeholder: '0.1 - 100',
    unit: 'kWh'
  },
  'Water Consumption': { 
    units: ['L', 'gallons'], 
    max: 500,
    min: 0.1,
    placeholder: '0.1 - 500',
    unit: 'L/gallons'
  },
  'Waste Reduction': { 
    units: ['kg', 'lbs'], 
    max: 50,
    min: 0.1,
    placeholder: '0.1 - 50',
    unit: 'kg/lbs'
  }
};

/* Dummy users data for leaderboard */
const DUMMY_USERS = [
  { name: 'Aakash', points: 140, isDummy: true },
  { name: 'Yash', points: 250, isDummy: true },
  { name: 'Sumit', points: 120, isDummy: true },
  { name: 'Judo Sloth', points: 100, isDummy: true },
  
];

/* Activity points mapping */
const ACTIVITY_POINTS = {
  'Recycling': 15,
  'Commute': 10,
  'Energy Usage': 12,
  'Water Consumption': 10,
  'Waste Reduction': 15,
  'default': 5
};

/* Prohibited goal keywords */
const PROHIBITED_GOAL_KEYWORDS = [
  'destroy', 'kill', 'burn', 'cut', 'waste', 'pollute', 
  'damage', 'harm', 'toxic', 'dump', 'litter', 'explode',
  'deforest', 'extinct', 'poison', 'contaminate'
];

/* Helpers */
function showToast(msg = 'Saved') {
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 1400);
}

function showErrorToast(msg) {
  if (!toastEl) return;
  toastEl.textContent = '❌ ' + msg;
  toastEl.style.background = '#ff6b6b';
  toastEl.classList.remove('hidden');
  setTimeout(() => {
    toastEl.classList.add('hidden');
    toastEl.style.background = '';
  }, 3000);
}

function fmtTime(ts) {
  try { return new Date(ts || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch { return new Date().toLocaleTimeString(); }
}
function idForType(t) {
  return `sub-${String(t || '').trim().replace(/\s+/g, '-').replace(/[^\w\-]/g, '')}`;
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

/* User-specific local storage */
function loadUserActivities() {
  try {
    return JSON.parse(localStorage.getItem(LS_ACTIVITIES) || '[]');
  } catch {
    return [];
  }
}

function saveUserActivity(activity) {
  try {
    const activities = loadUserActivities();
    activities.unshift(activity);
    if (activities.length > 50) activities.pop();
    localStorage.setItem(LS_ACTIVITIES, JSON.stringify(activities));
    return activities;
  } catch (e) {
    console.error('Error saving activity:', e);
    return [];
  }
}

function loadGoals() { 
  try { 
    return JSON.parse(localStorage.getItem(LS_GOALS) || '[]'); 
  } catch { 
    return []; 
  } 
}
function saveGoals(a) { 
  try { 
    localStorage.setItem(LS_GOALS, JSON.stringify(a)); 
  } catch {} 
}

/* User points management - shared across all users */
function loadAllUsersPoints() {
  try {
    return JSON.parse(localStorage.getItem(LS_ALL_USERS_POINTS) || '{}');
  } catch {
    return {};
  }
}

function saveAllUsersPoints(allPoints) {
  try {
    localStorage.setItem(LS_ALL_USERS_POINTS, JSON.stringify(allPoints));
  } catch {}
}

function loadUserPoints() {
  try {
    const allPoints = loadAllUsersPoints();
    return allPoints[currentUserId] || 0;
  } catch {
    return 0;
  }
}

function saveUserPoints(points) {
  try {
    const allPoints = loadAllUsersPoints();
    allPoints[currentUserId] = points;
    allPoints[currentUserName] = points; // Also store by name for leaderboard
    saveAllUsersPoints(allPoints);
  } catch {}
}

/* Initialize current user points */
let currentUserPoints = loadUserPoints();

/* Load user's recent activities into the UI */
function loadUserActivitiesToUI() {
  const activities = loadUserActivities();
  
  activities.slice(0, 5).forEach(activity => {
    const sub = document.getElementById(idForType(activity.type));
    if (sub) {
      sub.textContent = `${activity.value} ${activity.unit || ''} • ${fmtTime(activity.createdAt)}`;
    }
  });
}

/* Gauge - Calculate eco score based on user points */
function calculateEcoScore() {
  const maxPoints = 1000;
  const pointsContribution = Math.min(currentUserPoints, maxPoints) / maxPoints * 50;
  return Math.round(50 + pointsContribution);
}

function setGauge() {
  const score = calculateEcoScore();
  if (ecoPercentEl) ecoPercentEl.textContent = `${score}%`;
  const total = 300;
  const visible = Math.round((score / 100) * total);
  if (gaugeArc) gaugeArc.setAttribute('stroke-dasharray', `${visible} ${total - visible}`);
  ecoScore = score;
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

/* Apply activity - updates UI only */
function applyActivityToUI(act) {
  if (!act) return;
  
  saveUserActivity(act);
  
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
  setGauge();
}

/* populate unit select with validation */
function populateUnitSelect(type) {
  if (!activityUnit) return;
  activityUnit.innerHTML = '';
  const unitData = UNIT_MAP[type] || { units: ['unit'], max: 100, min: 0.1 };
  
  unitData.units.forEach(o => { 
    const op = document.createElement('option'); 
    op.value = o; 
    op.textContent = o; 
    activityUnit.appendChild(op); 
  });
  
  // Set validation attributes
  const unitInfo = UNIT_MAP[type];
  if (unitInfo) {
    activityValue.min = unitInfo.min || 0.1;
    activityValue.max = unitInfo.max || 100;
    activityValue.step = '0.1';
    activityValue.placeholder = `Enter value (${unitInfo.placeholder})`;
    
    // Add input event listener to limit digits
    activityValue.addEventListener('input', limitDigits);
    
    // Add visual indicator of allowed range
    const rangeHint = document.createElement('small');
    rangeHint.className = 'range-hint';
    rangeHint.textContent = `Allowed: ${unitInfo.min} - ${unitInfo.max} ${unitInfo.unit} (max 5 digits)`;
    rangeHint.style.cssText = `
      display: block;
      color: #8aa7b3;
      font-size: 11px;
      margin-top: 4px;
      font-style: italic;
    `;
    
    // Remove old hint if exists
    const oldHint = document.querySelector('.range-hint');
    if (oldHint) oldHint.remove();
    
    activityUnit.parentElement.appendChild(rangeHint);
  }
}

/* Function to limit input to 5 digits maximum */
function limitDigits(e) {
  const input = e.target;
  let value = input.value;
  
  // Remove any non-numeric characters except decimal point
  value = value.replace(/[^0-9.]/g, '');
  
  // Split into integer and decimal parts
  const parts = value.split('.');
  
  // Limit integer part to 5 digits
  if (parts[0].length > 5) {
    parts[0] = parts[0].slice(0, 5);
  }
  
  // Limit decimal part to 1 digit
  if (parts.length > 1) {
    if (parts[1].length > 1) {
      parts[1] = parts[1].slice(0, 1);
    }
  }
  
  // Reconstruct the value
  input.value = parts.join('.');
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
function closeModal() { 
  if (!logModal) return; 
  logModal.classList.add('hidden'); 
  delete logModal.dataset.type; 
  
  // Remove range hint
  const oldHint = document.querySelector('.range-hint');
  if (oldHint) oldHint.remove();
  
  // Remove input event listener
  activityValue.removeEventListener('input', limitDigits);
}

/* Validate activity value */
function validateActivityValue(type, value) {
  const unitData = UNIT_MAP[type];
  if (!unitData) return { valid: true };
  
  // Check if value exceeds 5 digits (integer part)
  const integerPart = Math.floor(Math.abs(value)).toString();
  if (integerPart.length > 5) {
    return { valid: false, message: 'Maximum 5 digits allowed' };
  }
  
  if (value < unitData.min) {
    return { valid: false, message: `Value must be at least ${unitData.min}` };
  }
  
  if (value > unitData.max) {
    return { valid: false, message: `Value cannot exceed ${unitData.max}` };
  }
  
  // Check decimal places (max 1 decimal)
  const decimalPlaces = (value.toString().split('.')[1] || '').length;
  if (decimalPlaces > 1) {
    return { valid: false, message: 'Only 1 decimal place allowed' };
  }
  
  return { valid: true };
}

/* Submit activity with validation */
async function submitActivity() {
  const type = logModal && logModal.dataset.type;
  const val = Number(activityValue.value);
  const unit = activityUnit.value || '';

  if (!type || !val || isNaN(val)) { 
    showErrorToast('Enter a valid numeric value');
    activityValue.style.border = '2px solid #ff6b6b';
    setTimeout(() => activityValue.style.border = '', 2000);
    return; 
  }
  
  // Validate value against limits
  const validation = validateActivityValue(type, val);
  if (!validation.valid) {
    showErrorToast(validation.message);
    activityValue.style.border = '2px solid #ff6b6b';
    setTimeout(() => activityValue.style.border = '', 2000);
    return;
  }
  
  if (val <= 0) {
    showErrorToast('Value must be greater than 0');
    activityValue.style.border = '2px solid #ff6b6b';
    setTimeout(() => activityValue.style.border = '', 2000);
    return;
  }

  const payload = { 
    type, 
    value: val, 
    unit, 
    user: currentUserName,
    userId: currentUserId,
    createdAt: new Date().toISOString() 
  };

  // Show loading state
  submitActivityBtn.disabled = true;
  submitActivityBtn.textContent = 'Saving...';

  try {
    const res = await fetch(`${SERVER}/api/activities`, {
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
      }, 
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (json && json.success) { 
      applyActivityToUI(json.activity || payload); 
      
      let pointsEarned = ACTIVITY_POINTS[type] || ACTIVITY_POINTS.default;
      pointsEarned = Math.round(val * pointsEarned);
      currentUserPoints += pointsEarned;
      saveUserPoints(currentUserPoints);
      
      showToast(`+${pointsEarned} points earned!`); 
    } else { 
      applyActivityToUI(payload); 
      showToast('Saved locally'); 
    }
  } catch (e) {
    applyActivityToUI(payload);
    showToast('Saved offline');
  } finally {
    submitActivityBtn.disabled = false;
    submitActivityBtn.textContent = 'Save';
    closeModal();
    await refreshLeaderboardFromLocal();
  }
}

/* Goals with validation */
function addGoal() {
  const text = (goalText.value || '').trim().toLowerCase();
  const target = Number(goalTarget.value);
  
  if (goalError) goalError.style.display = 'none';
  
  if (!text || !target || isNaN(target) || target <= 0) { 
    showGoalError('Please enter a valid goal text and numeric target > 0');
    return; 
  }
  
  // Validate target digits (max 5 digits)
  const targetIntegerPart = Math.floor(Math.abs(target)).toString();
  if (targetIntegerPart.length > 5) {
    showGoalError('Target cannot exceed 5 digits');
    return;
  }
  
  // Validate target value (reasonable limits)
  if (target > 1000) {
    showGoalError('Target too high! Maximum target is 1000');
    return;
  }
  
  const hasProhibitedWord = PROHIBITED_GOAL_KEYWORDS.some(keyword => 
    text.includes(keyword.toLowerCase())
  );
  
  if (hasProhibitedWord) {
    showGoalError('Please set an eco-friendly goal! No destructive activities allowed.');
    return;
  }
  
  const positiveKeywords = ['plant', 'save', 'reduce', 'recycle', 'conserve', 'protect', 'clean', 'green'];
  const hasPositiveWord = positiveKeywords.some(keyword => text.includes(keyword));
  
  if (!hasPositiveWord) {
    if (!confirm('This goal doesn\'t seem eco-friendly. Are you sure you want to set this goal?')) {
      return;
    }
  }
  
  const goals = loadGoals();
  const g = { 
    id: `g-${Date.now()}`, 
    text: goalText.value.trim(), 
    target, 
    progress: 0, 
    createdAt: new Date().toISOString() 
  };
  goals.push(g); 
  saveGoals(goals); 
  renderGoals(goals);
  goalText.value = ''; 
  goalTarget.value = ''; 
  showToast('Goal added');
}

function showGoalError(message) {
  if (goalError) {
    goalError.textContent = message;
    goalError.style.display = 'block';
    setTimeout(() => {
      goalError.style.display = 'none';
    }, 3000);
  }
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
      
      // Validate progress update
      if (num > remaining) {
        if (!confirm(`Value exceeds remaining target (${remaining}). Set to complete?`)) {
          return;
        }
        g.progress = g.target;
      } else {
        g.progress = (g.progress || 0) + num;
      }
      
      if (g.progress >= g.target) completeGoal(g);
      saveGoals(goals); renderGoals(loadGoals()); refreshLeaderboardFromLocal();
    });
  });
}
function completeGoal(goal) {
  const goals = loadGoals().filter(g => g.id !== goal.id);
  saveGoals(goals);
  
  const award = 20;
  currentUserPoints += award;
  saveUserPoints(currentUserPoints);
  
  refreshLeaderboardFromLocal();
  showToast(`Goal complete! +${award} pts`);
}

/* Leaderboard rendering */
function renderLeaderboard(list) {
  const el = document.getElementById('leaderboard');
  if (!el) return;
  
  const allUsersPoints = loadAllUsersPoints();
  
  let allEntries = [];
  
  allEntries.push(...DUMMY_USERS);
  
  Object.entries(allUsersPoints).forEach(([key, points]) => {
    if (key.includes('-') || key === currentUserId) return;
    
    allEntries.push({
      name: key,
      points: points,
      isDummy: false,
      isCurrentUser: false
    });
  });
  
  if (currentUserName && currentUserName !== 'Guest') {
    allEntries = allEntries.filter(u => u.name !== currentUserName);
    allEntries.push({
      name: currentUserName,
      points: currentUserPoints,
      isDummy: false,
      isCurrentUser: true
    });
  }
  
  if (Array.isArray(list)) {
    list.forEach(user => {
      if (user.email && user.name) {
        const exists = allEntries.some(u => u.name === user.name);
        if (!exists && user.name !== currentUserName) {
          allEntries.push({
            name: user.name,
            points: user.points || 0,
            isDummy: false,
            isCurrentUser: false,
            email: user.email
          });
        }
      }
    });
  }
  
  const uniqueEntries = [];
  const nameMap = new Map();
  
  allEntries.forEach(entry => {
    const key = entry.name;
    if (!nameMap.has(key) || nameMap.get(key).points < entry.points) {
      nameMap.set(key, entry);
    }
  });
  
  nameMap.forEach(entry => uniqueEntries.push(entry));
  
  uniqueEntries.sort((a,b) => (b.points||0) - (a.points||0));
  
  const displayEntries = uniqueEntries.slice(0, 15);
  
  el.innerHTML = '';
  if (displayEntries.length === 0) { 
    const li = document.createElement('li'); 
    li.textContent = 'No leaderboard data'; 
    el.appendChild(li); 
    return; 
  }

  displayEntries.forEach((u, idx) => {
    const li = document.createElement('li');
    const isDummy = u.isDummy || false;
    const isCurrentUser = u.isCurrentUser || (u.name === currentUserName);
    
    if (isCurrentUser) li.classList.add('you-highlight-pdf');
    if (isDummy) li.classList.add('dummy-user');
    
    const left = document.createElement('div'); left.className = 'left';
    const rank = document.createElement('div'); rank.className = 'rank-badge'; rank.textContent = String(idx + 1);
    if (idx === 0) rank.classList.add('top1'); 
    else if (idx === 1) rank.classList.add('top2'); 
    else if (idx === 2) rank.classList.add('top3');

    const nameWrap = document.createElement('div'); nameWrap.style.display = 'flex'; nameWrap.style.alignItems = 'center'; nameWrap.style.gap = '8px';
    const name = document.createElement('div'); name.className = 'user-name'; name.textContent = u.name || 'Unknown';

    if (idx === 0 && !isDummy) { 
      const icon = document.createElement('span'); icon.className = 'medal'; icon.textContent = '🏆'; nameWrap.appendChild(icon); 
    }
    else if (idx === 1 && !isDummy) { 
      const icon = document.createElement('span'); icon.className = 'medal'; icon.textContent = '🥈'; nameWrap.appendChild(icon); 
    }
    else if (idx === 2 && !isDummy) { 
      const icon = document.createElement('span'); icon.className = 'medal'; icon.textContent = '🥉'; nameWrap.appendChild(icon); 
    }
    
    if (isDummy) {
      const icon = document.createElement('span'); icon.className = 'dummy-icon'; icon.textContent = '🌱'; nameWrap.appendChild(icon);
    }
    
    if (isCurrentUser) {
      const youIcon = document.createElement('span'); youIcon.className = 'you-icon'; youIcon.textContent = '👤'; nameWrap.appendChild(youIcon);
    }

    nameWrap.appendChild(name);
    left.appendChild(rank);
    left.appendChild(nameWrap);

    const right = document.createElement('div'); right.className = 'points-pill'; right.textContent = `${u.points || 0} pts`;

    li.appendChild(left);
    li.appendChild(right);
    el.appendChild(li);
  });
}

/* Refresh leaderboard */
async function refreshLeaderboardFromLocal() {
  try {
    const res = await fetch(`${SERVER}/api/leaderboard`);
    const server = await res.json().catch(() => null);
    let serverList = [];
    
    if (Array.isArray(server)) serverList = server.slice();
    else if (server && Array.isArray(server.data)) serverList = server.data.slice();
    
    renderLeaderboard(serverList);
  } catch (e) {
    renderLeaderboard([]);
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

/* Socket features */
function initSocket() {
  if (typeof io === 'undefined') { console.warn('socket.io client missing; socket features disabled'); return; }
  socket = io(SERVER, { transports: ['websocket', 'polling'] });
  socket.on('connect', () => {
    if (liveIndicator) { liveIndicator.classList.remove('disconnected'); liveIndicator.classList.add('connected'); liveIndicator.innerHTML = '<span class="dot"></span> Live'; }
  });
  socket.on('disconnect', () => {
    if (liveIndicator) { liveIndicator.classList.remove('connected'); liveIndicator.classList.add('disconnected'); liveIndicator.innerHTML = '<span class="dot"></span> Offline'; }
  });
}

/* Boot */
window.addEventListener('load', async () => {
  bindUI();
  initChart();
  setGauge();
  
  loadUserActivitiesToUI();
  renderGoals(loadGoals());
  await refreshLeaderboardFromLocal();
  initSocket();
});

// Add CSS for validation and cool UI
const style = document.createElement('style');
style.textContent = `
  .dummy-user {
    opacity: 0.8;
    background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)) !important;
  }
  .dummy-user .user-name {
    font-style: italic;
  }
  .dummy-user .points-pill {
    background: rgba(255,255,255,0.02) !important;
    color: #a0c0c0 !important;
  }
  .dummy-icon {
    color: #2ecc71;
    font-size: 14px;
  }
  .you-icon {
    color: #18ff9c;
    font-size: 14px;
  }
  .you-highlight-pdf {
    background: linear-gradient(90deg, rgba(24,255,156,0.95), rgba(18,214,255,0.92)) !important;
    color: #07221a !important;
    border: 1px solid rgba(10,40,30,0.12) !important;
    box-shadow: 0 10px 28px rgba(8,160,120,0.14) !important;
  }
  .you-highlight-pdf .user-name {
    color: #07221a !important;
    font-weight: 800;
  }
  .you-highlight-pdf .rank-badge {
    background: rgba(255,255,255,0.95) !important;
    color: #07221a !important;
  }
  .you-highlight-pdf .points-pill {
    background: rgba(3,34,22,0.2) !important;
    color: #ffffff !important;
  }
  
  /* Cool validation styles */
  input:invalid {
    border-color: #ff6b6b !important;
  }
  
  .range-hint {
    color: #8aa7b3;
    font-size: 11px;
    margin-top: 4px;
    font-style: italic;
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Toast error styling */
  .toast.error {
    background: #ff6b6b !important;
  }
`;
document.head.appendChild(style);