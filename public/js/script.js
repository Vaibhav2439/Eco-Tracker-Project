// script.js - Per-user quiz completion tracking

// Modal functions
function closeLoginModal() {
  document.getElementById('loginOverlay').style.display = 'none';
}

function showLoginModal() {
  document.getElementById('loginOverlay').style.display = 'flex';
}

function closeQuizModal() {
  document.getElementById('quizOverlay').style.display = 'none';
}

function showQuizModal() {
  document.getElementById('quizOverlay').style.display = 'flex';
}

// Get user-specific quiz completion key (per-user tracking)
function getQuizCompletionKey() {
  const userJson = localStorage.getItem('user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      const userId = user.email || user.id || 'guest';
      return `quizCompleted_${userId}`;
    } catch (e) {
      return 'quizCompleted_guest';
    }
  }
  return 'quizCompleted_guest';
}

function hasCompletedQuizToday() {
  const key = getQuizCompletionKey();
  const val = localStorage.getItem(key);
  return val === new Date().toDateString();
}

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

// Timer update function
function updateAllTimers() {
  const ms = getMsUntilMidnight();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);

  const pad = n => String(n).padStart(2, '0');

  // Modal countdown
  const mH = document.getElementById('modalHours');
  const mM = document.getElementById('modalMinutes');
  const mS = document.getElementById('modalSeconds');
  if (mH) mH.textContent = pad(h);
  if (mM) mM.textContent = pad(m);
  if (mS) mS.textContent = pad(s);

  // Locked timer display
  const hourSpan = document.getElementById('lockedHours');
  const minuteSpan = document.getElementById('lockedMinutes');
  if (hourSpan) hourSpan.textContent = pad(h);
  if (minuteSpan) minuteSpan.textContent = pad(m);

  // Banner timer
  const bt = document.getElementById('bannerTime');
  if (bt) bt.textContent = `${pad(h)}h ${pad(m)}m`;
}

// Lock quiz card function
function lockQuizCard() {
  const card = document.getElementById('quizCard');
  const link = document.getElementById('quizChallengeLink');
  const desc = document.getElementById('quizCardDesc');

  if (!card || !link) return;
  if (card.classList.contains('quiz-locked')) return;

  // Style the card
  card.classList.add('quiz-locked');

  // Update description
  if (desc) {
    desc.textContent = "You've already completed today's challenge. Check back after midnight for new questions!";
  }

  // Replace link with locked button
  const newLink = document.createElement('a');
  newLink.className = 'feature-link quiz-link-locked';
  newLink.id = 'quizChallengeLink';
  newLink.innerHTML = '<i class="fa-solid fa-lock"></i> Locked until midnight';
  link.parentNode.replaceChild(newLink, link);

  // Add banner
  const banner = document.createElement('div');
  banner.className = 'quiz-locked-banner';
  banner.id = 'quizBanner';
  banner.innerHTML = `
    <div class="banner-left">
      <div class="pulse-dot"></div>
      <span class="banner-label">COMPLETED TODAY</span>
    </div>
    <div class="banner-timer">
      <i class="fa-regular fa-clock"></i>
      <span class="banner-time-text" id="bannerTime">--h --m</span>
    </div>
  `;
  card.insertBefore(banner, card.firstChild);

  // Add timer display
  const timerDisplay = document.createElement('div');
  timerDisplay.className = 'locked-timer-display';
  timerDisplay.innerHTML = `
    <span id="lockedHours">00</span>
    <span class="timer-colon">:</span>
    <span id="lockedMinutes">00</span>
    <span class="locked-timer-text">until reset</span>
  `;

  if (desc) {
    desc.insertAdjacentElement('afterend', timerDisplay);
  }

  // Start timer
  updateAllTimers();
  setInterval(updateAllTimers, 1000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  const isLoggedIn = !!(token && user);

  // Activity Tracking login gate
  const activityLink = document.getElementById('activityTrackingLink');
  if (activityLink) {
    activityLink.addEventListener('click', function(e) {
      if (!isLoggedIn) {
        e.preventDefault();
        showLoginModal();
      }
    });
  }

  // Lock quiz if completed today for this user
  if (hasCompletedQuizToday()) {
    lockQuizCard();
  }

  // Modal close buttons
  const closeLoginBtn = document.getElementById('closeLoginBtn');
  const cancelLoginBtn = document.getElementById('cancelLoginBtn');
  const closeQuizBtn = document.getElementById('closeQuizBtn');

  if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLoginModal);
  if (cancelLoginBtn) cancelLoginBtn.addEventListener('click', closeLoginModal);
  if (closeQuizBtn) closeQuizBtn.addEventListener('click', closeQuizModal);

  // Close modals on backdrop click
  const loginOverlay = document.getElementById('loginOverlay');
  const quizOverlay = document.getElementById('quizOverlay');

  if (loginOverlay) {
    loginOverlay.addEventListener('click', function(e) {
      if (e.target === this) closeLoginModal();
    });
  }

  if (quizOverlay) {
    quizOverlay.addEventListener('click', function(e) {
      if (e.target === this) closeQuizModal();
    });
  }
});

// Listen for storage events (cross-tab sync)
window.addEventListener('storage', function(e) {
  const userKey = getQuizCompletionKey();
  if (e.key === userKey && e.newValue === new Date().toDateString()) {
    lockQuizCard();
  }
});

// Check when page becomes visible
document.addEventListener('visibilitychange', function() {
  if (!document.hidden && hasCompletedQuizToday()) {
    lockQuizCard();
  }
});

// Initial check
if (hasCompletedQuizToday()) {
  document.addEventListener('DOMContentLoaded', lockQuizCard);
}