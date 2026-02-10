const apiBase = localStorage.getItem('facetrace_api') || 'http://localhost:8000';
const scanForm = document.getElementById('scanForm');
const verifyForm = document.getElementById('verifyForm');
const verifyResult = document.getElementById('verifyResult');
const resultsNode = document.getElementById('results');
const filterNode = document.getElementById('platformFilter');
const historyBtn = document.getElementById('loadHistory');
const historyNode = document.getElementById('history');
const apiStatusNode = document.getElementById('apiStatus');

const PLATFORM_META = [
  ['Instagram', 'https://cdn.simpleicons.org/instagram'],
  ['Facebook', 'https://cdn.simpleicons.org/facebook'],
  ['YouTube', 'https://cdn.simpleicons.org/youtube'],
  ['TikTok', 'https://cdn.simpleicons.org/tiktok'],
  ['X', 'https://cdn.simpleicons.org/x'],
  ['LinkedIn', 'https://cdn.simpleicons.org/linkedin'],
];

let latestMatches = [];
let usingOfflineMode = false;

function updateStatus(text, mode = 'ok') {
  apiStatusNode.textContent = text;
  apiStatusNode.dataset.mode = mode;
}

function getUserHistoryKey(userId) {
  return `facetrace_history_${userId}`;
}

function addLocalHistory(userId, action, summary) {
  const key = getUserHistoryKey(userId);
  const items = JSON.parse(localStorage.getItem(key) || '[]');
  items.unshift({ action, summary });
  localStorage.setItem(key, JSON.stringify(items.slice(0, 20)));
}

function getLocalHistory(userId) {
  const key = getUserHistoryKey(userId);
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function buildMockMatches(fileName) {
  const seedSource = (fileName || 'guest-face').toLowerCase();
  return PLATFORM_META.map(([platform, logo], i) => {
    const score = 72 + ((seedSource.charCodeAt(i % seedSource.length) + i * 7) % 27);
    const username = `${platform.toLowerCase()}_${seedSource.replace(/[^a-z0-9]/g, '').slice(0, 6) || 'user'}${i}`;
    return {
      platform,
      platform_logo: logo,
      profile_url: `https://example.com/${platform.toLowerCase()}/${username}`,
      username,
      profile_image: `https://api.dicebear.com/9.x/adventurer/png?seed=${username}`,
      confidence: Number(score.toFixed(2)),
    };
  }).sort((a, b) => b.confidence - a.confidence);
}

function renderMatches() {
  const filter = filterNode.value;
  const filtered = filter === 'all' ? latestMatches : latestMatches.filter((m) => m.platform === filter);

  resultsNode.innerHTML = '';
  if (!filtered.length) {
    resultsNode.innerHTML = '<p class="muted">No matches yet.</p>';
    return;
  }

  for (const m of filtered) {
    const card = document.createElement('article');
    card.className = 'match-card';
    card.innerHTML = `
      <div class="match-head">
        <img class="logo" src="${m.platform_logo}" alt="${m.platform}" />
        <strong>${m.platform}</strong>
      </div>
      <img class="profile-preview" src="${m.profile_image}" alt="${m.username}" />
      <p><strong>@${m.username}</strong></p>
      <p>Match confidence: <strong>${m.confidence}%</strong></p>
      <a href="${m.profile_url}" target="_blank" rel="noreferrer">View Profile</a>
    `;
    resultsNode.appendChild(card);
  }
}

function rebuildFilter(matches) {
  const platforms = [...new Set(matches.map((m) => m.platform))];
  filterNode.innerHTML = '<option value="all">All</option>';
  for (const p of platforms) {
    const option = document.createElement('option');
    option.value = p;
    option.textContent = p;
    filterNode.appendChild(option);
  }
}

async function checkBackend() {
  try {
    const res = await fetch(`${apiBase}/health`);
    if (!res.ok) throw new Error('unhealthy');
    usingOfflineMode = false;
    updateStatus(`Connected to API: ${apiBase}`, 'ok');
  } catch {
    usingOfflineMode = true;
    updateStatus('Backend unavailable. Running in offline demo mode.', 'warn');
  }
}

scanForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(scanForm);
  const userId = formData.get('user_id') || 'guest';
  const imageFile = formData.get('image');

  try {
    if (usingOfflineMode) {
      latestMatches = buildMockMatches(imageFile?.name || 'face-upload');
      rebuildFilter(latestMatches);
      renderMatches();
      addLocalHistory(userId, 'scan', `${latestMatches.length} match(es) found (offline demo)`);
      localStorage.setItem('facetrace_user', userId);
      return;
    }

    const res = await fetch(`${apiBase}/api/v1/scan`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Scan failed');

    localStorage.setItem('facetrace_user', userId);
    latestMatches = data.matches;
    rebuildFilter(latestMatches);
    renderMatches();
  } catch {
    usingOfflineMode = true;
    updateStatus('API request failed. Switched to offline demo mode.', 'warn');
    latestMatches = buildMockMatches(imageFile?.name || 'face-upload');
    rebuildFilter(latestMatches);
    renderMatches();
    addLocalHistory(userId, 'scan', `${latestMatches.length} match(es) found (offline demo)`);
  }
});

verifyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(verifyForm);
  const userId = formData.get('user_id') || 'guest';

  try {
    if (usingOfflineMode) {
      const confidence = 78.4;
      verifyResult.innerHTML = `<p><strong>Verified</strong> (${confidence}%)</p>`;
      addLocalHistory(userId, 'verify', `Result: Verified (${confidence}%) (offline demo)`);
      localStorage.setItem('facetrace_user', userId);
      return;
    }

    const res = await fetch(`${apiBase}/api/v1/verify`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Verification failed');

    localStorage.setItem('facetrace_user', userId);
    verifyResult.innerHTML = `<p><strong>${data.result}</strong> (${data.confidence}%)</p>`;
  } catch {
    usingOfflineMode = true;
    updateStatus('API request failed. Switched to offline demo mode.', 'warn');
    const confidence = 78.4;
    verifyResult.innerHTML = `<p><strong>Verified</strong> (${confidence}%)</p>`;
    addLocalHistory(userId, 'verify', `Result: Verified (${confidence}%) (offline demo)`);
  }
});

filterNode.addEventListener('change', renderMatches);

historyBtn.addEventListener('click', async () => {
  const userId = localStorage.getItem('facetrace_user') || 'guest';

  try {
    if (usingOfflineMode) {
      const items = getLocalHistory(userId);
      historyNode.innerHTML = '';
      if (!items.length) {
        historyNode.innerHTML = '<li class="muted">No history for this user.</li>';
        return;
      }
      for (const item of items) {
        const li = document.createElement('li');
        li.textContent = `${item.action.toUpperCase()}: ${item.summary}`;
        historyNode.appendChild(li);
      }
      return;
    }

    const res = await fetch(`${apiBase}/api/v1/history/${userId}`);
    const items = await res.json();

    historyNode.innerHTML = '';
    if (!items.length) {
      historyNode.innerHTML = '<li class="muted">No history for this user.</li>';
      return;
    }
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = `${item.action.toUpperCase()}: ${item.summary}`;
      historyNode.appendChild(li);
    }
  } catch {
    usingOfflineMode = true;
    updateStatus('API request failed. Showing offline history.', 'warn');
    const items = getLocalHistory(userId);
    historyNode.innerHTML = '';
    if (!items.length) {
      historyNode.innerHTML = '<li class="muted">No history for this user.</li>';
      return;
    }
    for (const item of items) {
      const li = document.createElement('li');
      li.textContent = `${item.action.toUpperCase()}: ${item.summary}`;
      historyNode.appendChild(li);
    }
  }
});

renderMatches();
checkBackend();
